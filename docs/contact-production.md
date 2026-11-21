# Contact deployment

`/contact` submits JSON to `POST /api/contact`. A successful response means the
ticket is durably saved. The returned `CJ-...` reference is its database primary
key. Email notification failure never discards the ticket. The browser reuses a
UUID idempotency key when a request times out, preventing duplicate tickets.

## Manual deployment (PowerShell)

The live Vercel project is **chayan**, serving `https://www.chayanjobs.com`.
The checkout is linked to that project. The contact page now uses the homepage's
shared green-tick logo in its header and footer.

**Pending:** production migrations, publishing the code and workflow, a successful
cron run, and an actual email test. The setup deployments did not execute the
migrations or promote the custom domain. No test email was sent.

### 1. Check the code

```powershell
npm run db:generate
npm run test:contact
npx tsc --noEmit
npm run build
```

### 2. Apply the production migrations

Get the real PostgreSQL connection string from your database provider. The
existing `.env` targets **localhost**. Vercel's sensitive production variables
cannot be read back using `vercel env pull`; do not use its placeholders.

```powershell
$databaseSecret = Read-Host "Production DATABASE_URL" -AsSecureString
$env:DATABASE_URL = [System.Net.NetworkCredential]::new("", $databaseSecret).Password
try {
    npx prisma migrate status
    # Verify the displayed database host and review ALL pending migrations.
    npm run db:migrate:deploy
    if ($LASTEXITCODE -ne 0) { throw "Migration failed; stop before deploying." }
    npx prisma migrate status
} finally {
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Variable databaseSecret -ErrorAction SilentlyContinue
}
```

`migrate deploy` applies all pending migrations. Both contact migrations listed
in `prisma/migrations` must show as applied before deploying the new app.

### 3. Verify hosting settings and publish

In **Vercel → chayan → Settings → Environment Variables → Production**, verify
the settings listed below. Their names already exist; preserve working secrets.
Use `https://www.chayanjobs.com` for `NEXT_PUBLIC_APP_URL`. Verify the sender
domain in Resend and confirm the receiving mailboxes in `src/lib/channels.ts`.

Commit the contact code, migrations, tests and `.github/workflows/contact-delivery.yml`
to the `main` branch of `officialamit558/Chayan`, then push. Review staged changes
first: the working tree also contains unrelated edits. Vercel's Git integration
deploys `main`. Wait for the production deployment to show **Ready**.

Alternatively, deploy the reviewed local source manually after applying migrations:

```powershell
npx vercel link --project chayan --yes
npx vercel deploy --prod --yes
```

### 4. Enable and test cron

In GitHub **Settings → Secrets and variables → Actions**, verify `APP_URL` is
`https://www.chayanjobs.com` and `CRON_SECRET` matches Vercel. Both secret names
already exist. Scheduled retries run as the first steps of
`private-job-feeds.yml` (every 3 hours; GitHub schedules can be delayed), so no
separate cron spends runner minutes and Vercel is only called when a ticket is
waiting. `contact-delivery.yml` is manual-only: open **Actions →
contact-delivery → Run workflow** for an immediate retry and confirm success.

To trigger retries manually after deployment:

```powershell
$cronSecret = Read-Host "CRON_SECRET" -AsSecureString
$cronToken = [System.Net.NetworkCredential]::new("", $cronSecret).Password
try {
    Invoke-RestMethod -Uri "https://www.chayanjobs.com/api/cron/contact" `
        -Headers @{ Authorization = "Bearer $cronToken" }
} finally {
    Remove-Variable cronSecret, cronToken -ErrorAction SilentlyContinue
}
```

Expect `success: true`. `processed: 0` means no messages currently need retry.
Without the authorization header, this endpoint must return HTTP 401.

### 5. Confirm real email delivery

Submit one test at `https://www.chayanjobs.com/contact`, using your configured
sender mailbox as the form's email address. Confirm a saved reference appears,
the team receives the notification, and the sender receives an acknowledgment.

## Required configuration

1. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (the exact canonical
   origin), `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`. Verify the sender domain
   in Resend and confirm the destination mailboxes in `src/lib/channels.ts` exist.
   Missing email configuration returns HTTP 503 instead of pretending to send.
2. Run `npm run db:generate` and `npm run db:migrate:deploy` against the target
   database before serving the new version. Both contact migrations are required.
3. Set `CRON_SECRET` in the hosting environment. Set GitHub Actions secrets
   `APP_URL` and the same `CRON_SECRET`; `private-job-feeds.yml` then retries
   every 3 hours. Alternatively schedule authenticated `GET /api/cron/contact`.
   Confirm the workflow succeeds before launch.
4. On Vercel, the endpoint uses `x-vercel-forwarded-for`. On another host, set
   `CONTACT_IP_HEADER` only to a header your ingress overwrites with the real
   client IP. Do not allow direct access bypassing that ingress. No trusted IP
   header means a conservative shared limit of 100 tickets/hour. Each email
   address is limited to 5/hour; a trusted IP is also limited to 5/hour. Limits
   use atomic PostgreSQL updates shared across instances and roll back when
   ticket storage fails. Expired counters are cleaned up by the cron endpoint.
5. Review the office address, support schedule, and reply promises in
   `src/lib/channels.ts` with the business owner before publishing.

## Operations

Monitor `[contact]` logs and failed workflow runs. The queue leases each ticket
for five minutes and retries failures after fifteen minutes, at most ten times
within 23 hours. Investigate incomplete tickets rather than silently dropping
them. For example, in a restricted database console:

```sql
SELECT "id", "createdAt", "deliveryAttempts", "notifiedAt", "autoRepliedAt"
FROM "ContactTicket"
WHERE "notifiedAt" IS NULL OR "autoRepliedAt" IS NULL
ORDER BY "createdAt";
```

The 23-hour cutoff keeps automatic retries within the email provider's
idempotency retention period ([Resend documentation](https://resend.com/changelog/idempotency-keys)). After that, review provider delivery logs before
manually resending. Access ticket contents only through authorized operations;
the public API never exposes stored messages. Define a retention/deletion policy
for these personal messages. Confirm a real test message reaches both the team
inbox and the sender, then remove the test ticket under that policy.

Run `npm run test:contact`, `npx tsc --noEmit`, and `npm run build` before release.

For browser checks, start the built app with `npx next start -H 127.0.0.1 -p 3107`
and run `node tests/e2e/contact-ui.mjs` (requires Playwright Chromium). The script
intercepts submissions and blocks external requests, so it sends no real mail.
Set `CONTACT_TEST_ORIGIN` to override the default local address.
