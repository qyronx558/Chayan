import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { CACHE_TAGS } from "@/lib/cache"

export const getCategoryList = unstable_cache(
  () => prisma.category.findMany({ orderBy: { name: "asc" } }),
  ["category-list"],
  { tags: [CACHE_TAGS.taxonomy], revalidate: 86400 }
)
