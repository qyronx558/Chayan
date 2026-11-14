/**
 * Built-in crawl sources (committed JSON in scripts/ingest/sources), bundled
 * into the site so the admin portal can list them. The scraper reads the same
 * files from disk.
 */
import central from "../../../scripts/ingest/sources/central.json"
import districts from "../../../scripts/ingest/sources/districts.json"
import state from "../../../scripts/ingest/sources/state.json"
import type { SourceDef } from "./types"

export const FILE_SOURCES: SourceDef[] = ([...central, ...state, ...districts] as SourceDef[]).filter((s) => !s.disabled)
