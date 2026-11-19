"use client"

import { createContext, useContext, type ReactNode } from "react"

const DataVersionContext = createContext<string>("")

export function DataVersionProvider({ version, children }: { version: string; children: ReactNode }) {
  return <DataVersionContext.Provider value={version}>{children}</DataVersionContext.Provider>
}

export function useDataVersion() {
  return useContext(DataVersionContext)
}

export function withDataVersion(url: string, version: string) {
  if (!version) return url
  return `${url}${url.includes("?") ? "&" : "?"}v=${version}`
}

export function useVersionedUrl(url: string) {
  return withDataVersion(url, useDataVersion())
}
