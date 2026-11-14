# Content ingest bot

The ingest bot finds new government notices on official websites across India and adds them to ChayanJobs as structured posts: jobs, results, admit cards, answer keys, admissions and syllabus. It costs ₹0 to run. Scheduling uses GitHub Actions, extraction uses Gemini's free tier (Groq is an optional fallback), and storage uses the existing Postgres and Vercel setup.

```text
GitHub Actions (content-ingest.yml)
  scripts/ingest/run.ts
    1. read listing pages        sources/*.json  (robots.txt respected, 1 request / 2 s per host)
    2. keyword triage            drop tenders, transfers, meetings, stale archive items
    3. POST /api/cron/ingest/seen   skip notices handled before
    4. PDF / page → text         scans + legacy-font Hindi go to Gemini as the raw PDF
    5. Gemini extraction         facts + a verbatim quote for every fact
    6. POST /api/cron/ingest     ─────────────►  Vercel
                                                   re-verify every fact against the notice text
                                                   quality + duplicate gates
                                                   create the post (PENDING) via the bulk-import engine
                                                   IngestItem row (dedupe + audit)
Admin → Review queue: "Source notice" link + quality score → Approve → live
```

## Sources

| Tier | File | How it is read |
|---|---|---|
| Central | `scripts/ingest/sources/central.json` | `html-links`: document links on the board's page |
| State | `scripts/ingest/sources/state.json` | `html-links` |
| District | `scripts/ingest/sources/districts.json` | `nic-s3waas`: the shared NIC district portal template |

`npm run ingest:discover` finds every district's official portal and recruitment board, using `prisma/data/india_districts_statewise.csv` as the district list. It keeps a portal only if the site is S3WaaS, the title matches the district and the page matches the state. It writes `districts.json`, plus `districts-unresolved.json` for the districts it could not resolve automatically.
- First run: **479 of 781 districts** were found automatically.
- Two cases need a manual `district-hosts.json` entry:
  - districts whose portal spelling differs from the CSV (for example Purnia → `purnea.nic.in`)
  - states that use another platform: Rajasthan, Odisha, Assam, Delhi
- Review the diff before committing. The bot only crawls committed sources.

To add a board, append an object to `central.json` or `state.json`. Fields:

| Field | Value |
|---|---|
| `id`, `name`, `level` | Identify the board and its tier |
| `state` | Exact name of the seeded State |
| `url` | The board's listing page |
| `include` | Regex for notice links, for example `[.]pdf` |
| `department` | Issuing organisation |
| `allowHosts` | Non-`.gov.in` domains the board legitimately uses |

Then run `npm run ingest:dry -- --source=<id>` to check the result.

Sources left out on purpose:
- **UPSC** returns 403 to an identified bot.
- **MPPSC** blocks all crawlers in robots.txt.

We do not disguise the bot to get around either.

## Accuracy: each field in the right place

1. The LLM must return each fact in its own field (dates as `YYYY-MM-DD`, read day-first), plus `evidence[field]`, an exact quote from the notice. Any value it cannot see must be `null`.
2. **Grounding** (`src/lib/ingest/grounding.ts`) runs on the server and checks:
   - vacancy counts appear in the notice exactly (Indian digit grouping and Devanagari digits are understood)
   - dates appear in some spelling of the same day
   - the advertisement number appears verbatim
   - text fields match their evidence quote
   - links are printed in the notice or on the page

   Any field that fails is dropped. A missing field is acceptable; a wrong one is not.
3. Location is never guessed. State and district come from the source config and map to the seeded `State`/`District` rows, so posts appear on the right `/jobs/state/...` and `/jobs/district/...` pages.
4. Categories must already exist; unknown ones fall back to *Central Govt* or *State Govt*. Departments reuse existing spellings, which come from `/api/cron/ingest/taxonomy`.

## AdSense / Google policy safeguards

These are built around Google's publisher policies ("valuable inventory", no scraped or duplicate content) and Search spam policies ("scaled content abuse", thin pages):

| Rule | Where |
|---|---|
| Only official sources (`.gov.in`, `.nic.in`, `.ac.in`, … or an allow-listed host), never other job sites or media | `isOfficialUrl`, source files |
| Every post links to the official PDF; facts are summarised, never copied | prompt, `officialNotification` |
| Overview in our own words; flagged if 6-word sequences overlap the notice by more than 35% | `copiedRatio`, `assessQuality` |
| Thin pages (fewer than 3 facts and no overview) get `noindex` and stay out of `sitemap.xml` | `isThinJob`, `apply/[slug]`, `sitemap.ts` |
| Pending and rejected posts return 404 to visitors and crawlers (staff can preview) and never appear in sitemaps | `public-visibility.ts`, detail pages |
| Duplicates are blocked: same URL, same notice from two sources (fingerprint), near-identical title (Jaccard ≥ 0.88) | `service.ts` |
| Old archive items and expired deadlines are skipped; closed jobs expire every night | `isStaleListing`, `/api/cron/expire-jobs` |
| Steady growth: review-first by default; auto-approve is optional, high-confidence only, max 60 per day | `policy.ts` |

**Before applying for AdSense:**
- Keep auto-approve **off** until you have reviewed a few hundred bot posts.
- Make sure the about, contact, privacy, editorial-policy and disclaimer pages are complete.
- The legacy *Import data* fetcher, which copied listings from a third-party aggregator site, has been removed. Do not add sources that republish other job sites.

## Admin control (Admin → Content bot)

Super admins control the bot from **System → Content bot**. The bot reads these settings from `GET /api/cron/ingest/config` at the start of every run, so a change takes effect from the next run. Until the settings page is saved, the environment values (`INGEST_AUTO_APPROVE`, …) are used.

| Tab | What it does |
|---|---|
| Overview | **Pause / Resume** (skips scheduled runs), switch the central / state / district tiers on or off, last 24 h counts, **Run now**, recent GitHub runs |
| Sources | Every built-in and custom source with 30-day results. Switch sources on or off (one by one or in bulk), **Check** what a listing page yields, **Add / edit / delete** custom sources (official domains only, exact State/District names) |
| Settings | Auto-approve on/off, daily cap, minimum score and confidence; new notices per source; AI calls per run; Gemini model |
| Activity | Every bot run with its log, and every notice with its result (posted / duplicate / skipped / failed) and the reason |

Precedence: **admin setting > environment variable > built-in default**. The model field left blank means `GEMINI_MODEL` (GitHub variable or `.env`), else `gemini-flash-lite-latest`.

Pause and the tier switches apply to **scheduled** runs only. Manual runs (Run now, the GitHub "Run workflow" button, `npm run ingest`) always run. A switched-off source is skipped by every tier run, but `--source=<id>` still runs it.

**Run now** starts the GitHub workflow through the API. It needs `INGEST_GITHUB_TOKEN` on Vercel: a fine-grained personal access token with access to this repository only and the permission **Actions: Read and write**. Production sites send `target=production`, all others `target=dev` (override with `INGEST_DISPATCH_TARGET`).

## On-time schedule (recommended)

GitHub's built-in cron starts this repository's scheduled jobs hours late (observed: a 02:30 UTC job running at about 09:30 UTC, and a 15-minute job running about every 6 hours). For exact times, use a free external cron such as [cron-job.org](https://cron-job.org) to call the site. The site then starts the workflow as a **scheduled** run, so Admin → Content bot's pause and tier switches still apply.

| Job | URL (GET) | When (Asia/Kolkata) |
|---|---|---|
| Central + state boards | `https://www.chayanjobs.com/api/cron/ingest/trigger?slot=frequent` | every 4 h, e.g. 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 |
| All districts | `https://www.chayanjobs.com/api/cron/ingest/trigger?slot=district` | 06:00 daily |
| Expire closed jobs | `https://www.chayanjobs.com/api/cron/expire-jobs` | 00:15 daily |

Each call needs the header `Authorization: Bearer <CRON_SECRET>`. The trigger also needs `INGEST_GITHUB_TOKEN` on Vercel (the same token Run now uses).

Once the external jobs run, set the repository variable **`INGEST_EXTERNAL_SCHEDULER=true`** (Settings → Secrets and variables → Actions → Variables). The GitHub crons in `content-ingest.yml` are then skipped, so nothing runs twice. Delete the variable to fall back to GitHub's schedule.

Use the final site address (`https://www.…`). The bot and the cron workflows follow an apex → www redirect by themselves, because `fetch` and `curl` drop the `Authorization` header when a redirect changes the host.

## Running it

```bash
npm run ingest:dry -- --source=nic:bihar/patna     # list + triage (+ extract if GEMINI_API_KEY is set)
npm run ingest -- --tier=central                    # needs INGEST_API_URL + INGEST_SECRET
npm run ingest -- --tier=district --shard=1/4
```

The scripts read `.env` / `.env.local` themselves; shell or GitHub Actions variables take precedence. With `NEXT_PUBLIC_APP_ENV="local"`, `INGEST_API_URL` defaults to the local dev server (`127.0.0.1:3000`). The default model is `gemini-flash-lite-latest` (about 2–5 s per notice on the free tier); override it with `GEMINI_MODEL`.

**Setup:**
1. Run `npm run db:migrate:deploy` (adds `IngestItem` and `Job.summary`).
2. On Vercel, set `INGEST_SECRET`, plus `INGEST_AUTO_APPROVE=false`.
3. In GitHub repo secrets, set `APP_URL`, `INGEST_SECRET`, `CRON_SECRET`, `GEMINI_API_KEY` and optionally `GROQ_API_KEY`. For manual dev runs, also set `DEV_APP_URL` and `DEV_INGEST_SECRET`.
4. Go to **Actions → content-ingest → Run workflow** with `target=dev`, `dry_run=true`. Read the uploaded `ingest-dry-run.json`, then repeat with `dry_run=false`.
5. The schedule then runs:
   - central + state boards every 4 h
   - districts daily at 06:00 IST
   - the expiry job at 00:15 IST

**Free-tier budget:**
- Each shard makes at most 120 LLM calls (`INGEST_MAX_LLM_CALLS`), paced 4.5 s apart (`LLM_MIN_INTERVAL_MS`).
- Each source contributes at most 15 new notices per run.
- Shards run one after another, so a single Gemini key is never hit in parallel.
- Rate limits back off and fall back to Groq for text notices.
