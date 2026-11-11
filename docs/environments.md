# Environments: local, dev and production

ChayanJobs runs in three separate places. Each has its **own database** and its own settings.

| | **Local** | **Dev** | **Production** |
| --- | --- | --- | --- |
| What it is | Your own computer | Private team test site | The real public website |
| Who can open it | Only you, on that machine | Signed-in team members only | Everyone |
| Updated when | You run `npm run dev` | Every merge to `main` (automatic) | A team member publishes a release (manual) |
| Banner at top of page | Blue **LOCAL** | Yellow **DEV** | None |
| Search engines | Blocked | Blocked | Allowed |
| Analytics and ads | Off | Off | On |
| Database | Local Postgres (Docker) | Dev database | Production database |

## How a change reaches users

```text
 your machine        pull request          main branch              release
 ────────────        ────────────          ───────────              ───────
 npm run dev   ──►   CI must pass    ──►   Deploy to dev     ──►    Release to production
 (LOCAL)             lint, types,          (automatic, DEV          (manual: publish a GitHub
                     tests >= 35%          site, team only)          Release + approval)
```

1. **Local** - build and try the change on your machine. Run `npm run check` before pushing.
2. **Pull request** - the **CI** workflow runs. The PR can merge only when **CI passed** is green.
3. **Dev** - after the merge, **Deploy to dev** puts `main` on the dev site. Only team members can open it.
   Real users never see it, and the workflow fails if dev is ever reachable without signing in.
4. **Production** - when the team is happy with dev, a team member releases it (below).
   Nothing reaches the public site any other way: Vercel no longer publishes `main` by itself.

## Releasing to production

1. Open the dev site and check the change.
2. On GitHub go to **Releases → Draft a new release**.
3. Create a new tag on `main`, for example `v1.4.0`, write what changed, and click **Publish release**.
4. Open **Actions → Release to production**. A required reviewer clicks **Review deployments → Approve**.
5. The workflow checks the tag is on `main` and that CI passed, runs database migrations, deploys,
   and checks the live site answers.

Pre-releases (the "Set as a pre-release" box) are never deployed.

**Roll back:** Actions → **Release to production** → **Run workflow** → enter the previous tag (e.g. `v1.3.2`).

## Keeping an unfinished feature hidden

A release ships everything on `main`. If a merged feature is not ready for users, put it behind a
flag in [`src/lib/features.ts`](../src/lib/features.ts):

```ts
export const FEATURES = {
  newSearchPage: ["local", "dev"],   // visible on local and dev only
} as const
```

```tsx
import { FeatureGate } from "@/components/shared/FeatureGate"
import { isFeatureEnabled } from "@/lib/features"

<FeatureGate name="newSearchPage" fallback={<OldSearch />}>
  <NewSearch />
</FeatureGate>

if (isFeatureEnabled("newSearchPage")) { /* server code */ }
```

To launch it, add `"production"` to the list (or remove the flag) and cut a release.

## Local setup (your machine only)

```bash
cp .env.example .env          # NEXT_PUBLIC_APP_ENV="local", local database
docker compose up -d db       # local Postgres on 127.0.0.1:5432
npm install
npx prisma migrate deploy
npm run dev                   # http://127.0.0.1:3000
```

The dev server and the Docker ports listen on `127.0.0.1` only, so other devices on your
network (office Wi-Fi, phone hotspot) cannot open your local copy.

## One-time setup (repository admin)

### 1. GitHub environments - Settings → Environments

| Environment | Protection | Secret |
| --- | --- | --- |
| `dev` | Deployment branches: `main` only | `DATABASE_URL` = **dev** database |
| `Production` | **Required reviewers**: the people allowed to release. Deployment branches/tags: `v*` tags | `DATABASE_URL` = **production** database |

### 2. Repository secrets and variables - Settings → Secrets and variables → Actions

`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and `PRODUCTION_URL` work as either a variable or a secret.

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| Variable | `VERCEL_ORG_ID` | `orgId` in `.vercel/project.json` |
| Variable | `VERCEL_PROJECT_ID` | `projectId` in `.vercel/project.json` |
| Variable | `DEV_DOMAIN` | Optional, e.g. `dev.chayanjobs.in` (add it in Vercel → Domains first) |
| Variable | `PRODUCTION_URL` | e.g. `https://chayanjobs.in` |

### 3. Vercel project settings

- **Deployment Protection → Vercel Authentication → Standard Protection** (on).
  This is what keeps dev private; the dev workflow fails if it is off.
- **Environment Variables**: give **Preview** its own values (dev database, dev `AUTH_SECRET`,
  `NEXT_PUBLIC_APP_URL` = dev domain, test email/SMS keys) and keep real keys on **Production** only.
- `vercel.json` already stops Vercel from publishing `main` to production on its own.

### 4. Branch protection - Settings → Branches → `main`

Require a pull request, and require the status check **CI passed**.

## Workflows

| File | Runs when | Does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Every PR to `main`, every push to `main` | Lint, types, tests (35% coverage), Python checks |
| `.github/workflows/deploy-dev.yml` | CI passed on `main` | Migrate dev database, deploy to dev, check dev is private |
| `.github/workflows/release-production.yml` | A release is published (or manual run with a tag) | Verify, wait for approval, migrate production database, deploy, smoke test |
| `.github/workflows/database-migrate.yml` | Manual | Migrate or baseline the dev or production database |
