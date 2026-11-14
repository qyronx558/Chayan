/**
 * Loads .env / .env.local for the ingest scripts (Next.js does this for the
 * site, plain `tsx` does not). Variables already set in the shell or in
 * GitHub Actions win over the files. Import this module FIRST.
 */
import { existsSync } from "node:fs"
import path from "node:path"

for (const file of [".env.local", ".env"]) {
  const full = path.resolve(process.cwd(), file)
  if (existsSync(full)) {
    try {
      process.loadEnvFile(full) // never overrides variables that are already set
    } catch {
      // unreadable file - ignore, required vars are validated by the caller
    }
  }
}

// Local default: the site the dev server serves. Node resolves "localhost" to
// ::1 first, but `npm run dev` listens on 127.0.0.1 only - so use the IPv4 address.
if (!process.env.INGEST_API_URL && process.env.NEXT_PUBLIC_APP_ENV === "local" && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.INGEST_API_URL = process.env.NEXT_PUBLIC_APP_URL.replace("//localhost", "//127.0.0.1")
}
