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

| Tier | File | Count | How it is read |
|---|---|---|---|
| Central | `scripts/ingest/sources/central.json` | 40 | `html-links`: document links on the board's page |
| State | `scripts/ingest/sources/state.json` | 28 (18 states / UTs) | `html-links` |
| District | `scripts/ingest/sources/districts.json` | 572 of 781 | `nic-s3waas` (the shared NIC district template); Assam's own portal via `html-links` |

**Central** covers the big recruiters: SSC (through its regional offices, since ssc.gov.in renders only with JavaScript), IBPS, SBI, RRBs and five Railway Recruitment Cells, NTA (UGC NET, CSIR NET, CUET), CTET, KVS, NCERT, UGC, ESIC, LIC, NABARD, NHB, EXIM Bank, Canara Bank, IDBI, GIC Re, Indian Navy, BSF, DRDO, ISRO (VSSC), IGCAR, NTPC, Power Grid, Coal India, SAIL, HPCL, GRSE, Prasar Bharati and JIPMER.

`npm run ingest:check -- --tier=state` (or `--source=<id>`, `--file=<candidates.json>`) fetches each listing page with the bot's own polite client and prints how many notices it finds and how many pass triage. No LLM call, nothing is posted. Run it before adding sources, and now and then to spot boards that changed their site.

`npm run ingest:discover` finds every district's official portal and recruitment board, using `prisma/data/india_districts_statewise.csv` as the district list. It tries `<name>.nic.in`, `<name>.gov.in`, state portal domains (`barpeta.assam.gov.in`, `dmcentral.delhi.gov.in`), state prefixes (`hpkangra.nic.in`) and old names of renamed districts (Gurugram → `gurgaon`). A portal is kept only if its title matches the district and the page matches the state. It writes `districts.json`, plus `districts-unresolved.json` with **every** district still missing; `site` marks the ones that have an official site on another platform.
- **572 of 781 districts** are covered.
- Still missing:
  - Rajasthan (41): the state portal renders only with JavaScript.
  - Odisha (30): the district servers do not answer.
  - About 138 scattered elsewhere, mostly very new districts without a portal yet.
- Use a manual `district-hosts.json` entry when a portal's spelling differs from the CSV (for example Purnia → `purnea.nic.in`).
- Review the diff before committing. The bot only crawls committed sources.

### District PDFs (cdn.s3waas.gov.in)

S3WaaS district sites keep their notice PDFs on `cdn.s3waas.gov.in`. That CDN answers visitors outside India with `robots.txt: Disallow: /`; inside India it publishes no restriction. GitHub's hosted runners are in the US, so on GitHub every district PDF is "blocked by robots.txt". The bot respects that, and does not use a mirror or disguise itself to get around it:
- Blocked notices are counted as `blocked`, not as errors, with one log line per host.
- They are **not** marked as seen, so a later run that is allowed to read them picks them up.

To read district PDFs, run the **district tier from a machine in India**, either way:
- **Self-hosted runner (recommended):** on a PC or VM in India, add a runner in GitHub (Settings → Actions → Runners → New self-hosted runner) with the label `india`, and keep it running. Then set the repository variable **`INGEST_DISTRICT_RUNNER=india`**. District shards then run there; central and state runs stay on GitHub's runners. On Windows the runner needs Git Bash, which comes with Git for Windows. Keep the repository private: GitHub advises against self-hosted runners on public repositories.
- **Or by hand:** `npm run ingest -- --tier=district --shard=1/4` (and 2/4, 3/4, 4/4) on that machine, with `.env` holding `INGEST_API_URL`, `INGEST_SECRET` and `GEMINI_API_KEY`.

Assam districts and the central / state boards keep their files on their own hosts, so they work from GitHub as before.

Visitors opening these PDFs on ChayanJobs are not affected: `/api/doc` reads them through NIC's official mirror `cdnbbsr.s3waas.gov.in` (fast, same files), falling back to the CDN. See `src/lib/official-mirrors.ts`.

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
- **UPSC, CBSE, NEET / JEE Main (NTA), Supreme Court, MHA, Ministry of Defence** answer 403 to an identified bot.
- **MPPSC, AAI, IRDAI, ECIL, IRCTC careers, SSC NWR** block the bot (or all crawlers) in robots.txt.
- **APPSC, MPSC (Maharashtra), RBI, India Post GDS, Rajasthan district portals** render their notice lists only with JavaScript.

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
