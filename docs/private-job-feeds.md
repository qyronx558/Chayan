# Private job feeds

Private jobs are imported automatically from companies' official job boards, the public
Greenhouse and Lever APIs (Admin → System → **Job feeds**, super admin only). No scraping or
LLM is involved: the boards return structured JSON, and normalisation is deterministic
(`src/lib/private-jobs/normalize.ts`).

## Adding a board

1. Open the company's careers page and find its board link:
   - `boards.greenhouse.io/<token>` or `job-boards.greenhouse.io/<token>` for Greenhouse
   - `jobs.lever.co/<token>` for Lever
2. In **Job feeds**, click **Add board**. Then:
   - Paste the URL or the token.
   - Enter the company name. Add the website if you have it; the trust score uses it.
   - Keep **India & remote only** on unless you want global postings.
3. The board is fetched live before it is saved. The toast shows how many postings will be imported.

## What a sync does (`src/lib/private-jobs/feed-sync.ts`)

| Source says | We do |
|---|---|
| A new posting | We create it (live, `source = ATS_FEED`, `expiresAt = now + 45 days`). |
| A posting whose content changed | We update the feed-owned fields. Moderation and admin status decisions are never overwritten. |
| An unchanged posting | We only refresh `lastSeenAt` and `expiresAt`, in one batched query. |
| A posting missing in **2 consecutive runs** | We close it (`EXPIRED`, `closedAt`). |
| A closed posting that is listed again | We reopen it. |
| The same opening already live from another source (`dedupeHash`) | We skip it as a duplicate. |

Each sync has safety brakes:

- **Source error (HTTP or timeout):** the run is marked `ERROR` and nothing is closed.
- **Circuit breaker:** if a board suddenly returns nothing, or drops more than half of its live
  jobs, the run is marked `HELD` and nothing is closed. Check the board, then click
  **Confirm removals & sync** to count the misses.
- **At most 400 new postings per board per run.** The rest are imported on the next run.

## Scheduling

`GET /api/cron/private-feeds` with `Authorization: Bearer CRON_SECRET` runs the feeds that
haven't synced in 6 hours, oldest first, within a 45 s budget. Each call continues where the
last one stopped, so you can add any number of boards.

- **Recommended:** add a cron-job.org job every 30 minutes, then set the
  `INGEST_EXTERNAL_SCHEDULER=true` repository variable.
- **Backup:** `.github/workflows/private-job-feeds.yml` runs hourly.

## Expiry

The nightly `GET /api/cron/expire-jobs` also closes private jobs whose `lastDate` has passed,
and feed jobs whose `expiresAt` passed. A feed job's `expiresAt` passes if its board was
disabled or deleted and it hasn't been seen for 45 days.

## Database

Migration `20261116000000_private_jobs_scale` does three things:

- Enables `pg_trgm`.
- Adds the lifecycle and feed columns and the `PrivateJobFeed` table.
- Adds indexes for the public listing:
  - `(moderation, status, createdAt)`
  - trigram GIN indexes on `PrivateJob.title`, `PrivateJob.location` and `Company.name`, used by the `contains` search
  - a GIN index on `skills`

Apply it with the **database-migrate** workflow, as usual.

## Careers pages with Gemini (AI seeding)

Super admins can add any company careers page as a source (Admin → Job feeds → Sources → Add source → *Careers page*).
Each read tries, in order:

1. **schema.org `JobPosting` JSON-LD** on the page - exact data, no AI.
2. **An embedded Greenhouse / Lever / Ashby board** - when one is found on add, the source is saved as that board.
3. **Gemini** (`GEMINI_API_KEY`) - reads the page text and returns jobs as JSON. Every job is *grounded*: its title must
   appear in the page text, links are picked by index from links that really exist on the page, and a location the page does not
   mention is dropped. Pages rendered only by JavaScript are reported, not guessed.

Safety and cost:

- `robots.txt` is honoured; private / local addresses are refused.
- The page hash is stored - an unchanged page never calls Gemini again (its jobs just stay fresh).
- *AI pages per call* caps Gemini use; pages over the cap wait for the next call (`DEFERRED`).
- AI-extracted jobs go to **Content verification** (pending) unless *Publish AI-extracted jobs automatically* is on **and**
  the confidence is at least the minimum. Board and JSON-LD jobs always publish.

## Settings (super admin)

Admin → Job feeds → Settings (`PrivateFeedSettings`, one row): master switch, re-sync interval (hours), auto-publish AI jobs,
minimum AI confidence, AI pages per call, Gemini model. Changes are audit-logged and apply from the next run.

## Catalog

Admin → Job feeds → Sources → *Catalog* adds verified boards of well-known employers in one click
(`src/lib/private-jobs/catalog.ts`). Added boards are India & remote only.

## Scheduling for freshness

Call `GET /api/cron/private-feeds` (Bearer `CRON_SECRET`) every **30 minutes** (cron-job.org). Each call syncs the sources
whose last run is older than the configured interval, oldest first, in a 45 s budget. The GitHub workflow
`private-job-feeds.yml` is an hourly backup.

## Deploy checklist

1. `prisma migrate deploy` (migrations `20261116000000_private_jobs_scale` and `20261116000001_private_job_ai_feeds`).
2. Set `GEMINI_API_KEY` and `CRON_SECRET` in the site environment.
3. Add the cron-job.org call above; open Admin → Job feeds → Settings to confirm both show green.

## Company logos (automatic)

Companies with live private jobs get their real logo automatically (`src/lib/private-jobs/logo.ts`), tried in order:

1. the company's Lever / Greenhouse board page (header logo);
2. the website on record: apple-touch-icon → schema.org Organization logo → large icon;
3. job-link domains, only when the page names the company;
4. **Wikidata** (official website + logo from Wikimedia Commons) - covers large companies whose sites block bots (Infosys, TCS, HPE, HCLTech…);
5. domains guessed from the name (e.g. `tcs.com`), only when the page title names the company;
6. Google / DuckDuckGo icon services and `/favicon.ico` for a confirmed domain.

Every candidate is downloaded and must be a real image. Lookups run right after a company is created (`after()`), in the
`/api/cron/private-feeds` call with spare time (12 companies per call), and from Admin → Job feeds → Sources → **Find logos**.
A company is re-checked at most every 14 days (`Company.logoCheckedAt`, migration `20261116000002_company_logo_lookup`).
Optional: set `BOT_CONTACT` (a URL or e-mail) - it is added to the user agent sent to Wikimedia, as their API policy asks.

## Descriptions pasted as HTML source

When HTML source is pasted into the rich-text editor it is stored escaped (`<p>&lt;style&gt;</p>…`).
`src/lib/private-jobs/description.ts` recovers the markup and drops pasted `<style>` designs, classes and inline styles, so
the description uses the site's own typography (and dark mode). It runs on save (admin, employer) and on render (detail
page, preview pane, JobPosting JSON-LD), so existing rows are fixed without a migration.

## International jobs: country and city

Every private job carries `country` (ISO 3166-1 alpha-2 code like `IN`, `US`, `DE`, or a custom
name an admin typed) and `city` (canonical spelling, e.g. `Bengaluru`, `New York`). They are
indexed together (`@@index([country, city])`, migration `20261116000003_private_jobs_global`).

- **Feeds** fill them automatically. Structured board data (Lever `country`, Ashby postal address,
  SmartRecruiters / Workable / Recruitee / Breezy location objects) wins. Otherwise
  `parseLocation` in `src/lib/private-jobs/geo.ts` reads the location text. It knows every ISO
  country and common aliases (USA, UK, UAE…), plus US states, Canadian provinces, Australian and
  Indian states, and about 250 hub cities with abbreviations (SF, NYC, BLR, Gurgaon → Gurugram…).
- **Admin form** (Add new private job → step 2): pick a **Country**, then a **City** of that country.
  Both pickers list values already used by jobs first, with counts, and both let you create a
  new value. The location text is optional; when it is left empty it is built from city + country.
  When only location text is given, country and city are derived from it (`normalizeJobGeo`),
  on admin, employer and API writes.
- **Public filters** (left rail): **Country**, then **City**. City stays disabled until a country is
  chosen, and changing the country clears the city. URL params: `?country=DE&city=Berlin`.
- APIs:
  - `/api/private-jobs/filters` returns `countries` (code, name, count).
  - `/api/private-jobs/cities?country=XX` returns the cities with live jobs (`scope=all` includes
    closed ones, for the admin form).
  - `/api/private-jobs/countries` returns every country, used ones first.
- Google for Jobs markup uses the job's country (`addressCountry`). Before, it was always `IN`.
- Backfill for jobs saved before these fields existed: `npm run jobs:backfill-geo` (safe to
  re-run). Feed jobs also refill on their next sync.

Salaries from foreign boards are only kept in structured form when they are in INR. Other
currencies stay in the description, so the ₹ salary filters are never wrong.

## More job boards

Besides Greenhouse, Lever and Ashby, feeds can read these public job-board APIs (all read-only,
no keys):

| Platform | Board token from | Notes |
|---|---|---|
| SmartRecruiters | `careers.smartrecruiters.com/<Company>` | Case-sensitive identifier. The list API has no descriptions, so up to 150 new postings per run get their detail page fetched; the rest follow on later runs. Capped at 3,000 postings per board. |
| Workable | `apply.workable.com/<account>` | |
| Recruitee | `<company>.recruitee.com` | Structured salary is kept only when it is in INR. |
| Personio | `<company>.jobs.personio.de` | XML feed. |
| Breezy HR | `<company>.breezy.hr` | |

Careers pages that embed any of these boards are detected and saved as that board.

`runDueFeeds` syncs **5 boards at a time**. Careers pages read with Gemini still run one at a
time. The cron spends about 38 s on feeds, then up to 14 s on discovery, then fills logos with
what is left.

## Discovery: 1,000+ companies without hand-entering boards

- **Catalog** (Admin → Job feeds → Catalog): the curated list plus every board found by
  `scripts/discover-job-boards.ts` (`src/lib/private-jobs/global-catalog.ts`). It is searchable,
  supports select all, and lets you choose **Worldwide** (default) or **India & remote** per
  import.
- **Discover** (Admin → Job feeds → Discover): paste company names, one per line, optionally
  `Name | website`. Each one is looked up on all 8 platforms:
  1. If a website is given, its careers page is checked first, and an embedded board there is exact.
  2. Otherwise likely board slugs are probed.
  3. Where the platform reports a company name (Greenhouse, SmartRecruiters, Workable,
     Recruitee, Breezy), it must match.

  Platforms without a name check (Lever, Ashby, Personio) only accept the exact name slug.
  SmartRecruiters test-style accounts (`Acme1`) need at least 5 openings.

  Found boards become enabled feeds right away. **Find N now** runs for about 45 s; the rest of
  the queue is worked through by the cron. **Retry misses** re-queues companies where nothing
  was found.
- To refresh the catalog after editing `src/lib/private-jobs/seed-companies.ts`:
  `npm run jobs:discover`. It resumes from `.cache/job-board-discovery.jsonl`; pass `--fresh` to
  re-check everything.

### Capacity

About 650+ boards with roughly 80K open roles: with the cron every **10 minutes** and the default
6 h interval, each board is refreshed a few times a day. Descriptions are capped at 20K chars,
so plan for about 0.5–1 GB of Postgres for 100K live jobs. Expired jobs are closed automatically
and can be archived later.
