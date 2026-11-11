import type { ComponentType } from "react"

export interface DocTocItem {
  id: string
  title: string
}

export interface DocMeta {
  slug: string
  title: string
  /** One sentence shown under the title and in cards and search. */
  description: string
  /** Group id from DOC_GROUPS. */
  group: DocGroupId
  minutes: number
  toc: DocTocItem[]
}

export interface DocArticle {
  meta: DocMeta
  Body: ComponentType
}

export type DocGroupId =
  | "start"
  | "find"
  | "apply"
  | "account"
  | "community"
  | "trust"
  | "employers"
  | "help"
