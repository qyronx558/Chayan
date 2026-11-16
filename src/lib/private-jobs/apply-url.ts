/**
 * Where the Apply room should open a private job so the candidate can fill
 * and submit the form *inside* ChayanJobs.
 *
 * Several job boards serve a public "embed" version of their application form
 * that may be framed by other sites (it is how companies put the form on
 * their own careers page). The normal job pages of the same boards refuse
 * framing, so we swap them for the embeddable form:
 *
 *   Greenhouse  job-boards.greenhouse.io/embed/job_app?for={board}&token={job}
 *   Lever       jobs.lever.co/{company}/{id}/apply
 *   Workable    apply.workable.com/{account}/j/{shortcode}/apply/
 *
 * Anything else is returned unchanged.
 */

export interface ApplyFeedRef {
  provider: string
  boardToken: string
}

const GH_HOSTS = /(^|\.)greenhouse\.io$/

export function inAppApplyUrl(url: string, opts: { feed?: ApplyFeedRef | null; externalId?: string | null } = {}): string {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return url
  }
  const { feed, externalId } = opts
  const host = u.hostname.toLowerCase()

  // Greenhouse: from the feed (works for custom domains like stripe.com/jobs?gh_jid=…),
  // or from a Greenhouse board URL.
  if (feed?.provider === "GREENHOUSE" && externalId && /^\d+$/.test(externalId)) {
    return greenhouseEmbed(feed.boardToken, externalId)
  }
  if (GH_HOSTS.test(host)) {
    if (u.pathname.startsWith("/embed/")) return url
    const m = u.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/)
    if (m) return greenhouseEmbed(m[1], m[2])
    const token = u.searchParams.get("for")
    const jid = u.searchParams.get("token") || u.searchParams.get("gh_jid")
    if (token && jid && /^\d+$/.test(jid)) return greenhouseEmbed(token, jid)
  }

  // Lever: the posting page → its application form (same site, also frameable).
  if (host === "jobs.lever.co" || host === "jobs.eu.lever.co") {
    const m = u.pathname.match(/^\/([^/]+)\/([0-9a-f-]{36})\/?$/i)
    if (m) return `${u.origin}/${m[1]}/${m[2]}/apply`
  }

  // Workable: the job page → its application step.
  if (host === "apply.workable.com") {
    const full = u.pathname.match(/^\/([^/]+)\/j\/([A-Z0-9]+)\/?$/i)
    if (full) return `${u.origin}/${full[1]}/j/${full[2]}/apply/`
    const short = u.pathname.match(/^\/j\/([A-Z0-9]+)\/?$/i)
    if (short && feed?.provider === "WORKABLE") return `${u.origin}/${feed.boardToken}/j/${short[1]}/apply/`
  }

  return url
}

function greenhouseEmbed(board: string, jobId: string): string {
  return `https://job-boards.greenhouse.io/embed/job_app?for=${encodeURIComponent(board)}&token=${encodeURIComponent(jobId)}`
}
