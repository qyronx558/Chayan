# Week 1: production baseline

This release makes public catalogue responses CDN-cacheable for one minute (with two minutes of stale-while-revalidate), makes the public listing shells ISR pages, and invalidates affected paths after a CMS create, update, or delete.

## 1. Safely introduce Prisma migrations

`vercel.json` now baselines the existing production schema once and then runs `prisma migrate deploy`; it no longer runs `db push --accept-data-loss`. `migrate resolve --applied` writes only Prisma's migration-history metadata. It does not create, alter, truncate, or delete application tables or data.

Create the baseline locally from `prisma/schema.prisma`:

```powershell
New-Item -ItemType Directory -Force prisma/migrations/20260924000000_baseline
cmd /c "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260924000000_baseline/migration.sql"
```

Review and commit the generated SQL. For an existing production database that already has this schema, mark the baseline as applied once:

```powershell
cmd /c "npx prisma migrate resolve --applied 20260924000000_baseline"
```

The Vercel build performs this safe one-time baseline step automatically. On later deployments it is already recorded and the command is ignored; `prisma migrate deploy` then applies only newly committed migrations.

For a fresh database, deploy it normally:

```powershell
npm run db:generate
npm run db:migrate:deploy
```

Take a managed-database backup before resolving or deploying a migration. Run the same commands against staging first.

## 2. Deploy and validate caching

1. Push the branch and deploy to preview/staging.
2. Open `/api/jobs?limit=8&status=ACTIVE` twice and inspect response headers. It must include `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`.
3. Create or edit a job in the admin UI. Confirm `/`, `/jobs`, its `/apply/<slug>` page, and category pages show the update immediately after refresh.
4. Repeat for results, admit cards, admissions, private jobs, answer keys, syllabi, blog posts, and featured items.
5. Verify `/api/jobs?scope=mine` does **not** return a public cache header; personalised/admin data must never be cached by the CDN.

## 3. Monitoring integration

### Error tracking (Sentry)

1. Create a Next.js project in Sentry and copy its DSN.
2. Install and initialise the official SDK:

```powershell
cmd /c "npx @sentry/wizard@latest -i nextjs"
```

3. Add `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to Vercel and local `.env`; do not expose the auth token to the browser.
4. Deploy a preview and use Sentry's test-error workflow. Confirm the event appears with release and environment tags.

### Availability and database alerts

1. Add uptime checks for `/`, `/api/featured`, and `/api/cron/newsletter` (the cron endpoint should be checked only with its bearer secret).
2. In the PostgreSQL provider, alert on connection saturation, CPU, disk, slow queries, and failed backups.
3. In Vercel, alert on function errors, p95 duration, and bandwidth spikes.

## 4. Deployment gate

Run before production deployment:

```powershell
cmd /c "npx tsc --noEmit"
cmd /c "npm run lint"
cmd /c "npm run build"
```

Rollback is a normal application rollback. Never roll back a database schema by deleting migration history; create a forward corrective migration instead.
