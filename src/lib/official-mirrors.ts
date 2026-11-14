/**
 * Official mirrors that serve exactly the same files as a government host.
 *
 * Only used when a *visitor* opens a document (in-app viewer / download), so the
 * file loads quickly - never by the content bot, which reads the host it was
 * linked to and obeys that host's robots.txt.
 *
 * cdn.s3waas.gov.in (NIC's CDN for every S3WaaS district/state site) often takes
 * 15-20 s to answer, and does not answer servers abroad at all; NIC's
 * Bhubaneswar origin cdnbbsr.s3waas.gov.in serves the same paths in under a second.
 */
const MIRRORS: Record<string, readonly string[]> = {
  "cdn.s3waas.gov.in": ["cdnbbsr.s3waas.gov.in"],
}

/** Addresses to try for a document, fastest first; the original address is always last. */
export function documentSources(url: URL): URL[] {
  const mirrors = MIRRORS[url.hostname.toLowerCase()] ?? []
  return [
    ...mirrors.map((host) => {
      const m = new URL(url.toString())
      m.hostname = host
      return m
    }),
    url,
  ]
}

export function hasMirror(url: URL): boolean {
  return url.hostname.toLowerCase() in MIRRORS
}
