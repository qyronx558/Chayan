import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock3, Eye, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCompact, formatDate } from "@/lib/utils"

export interface BlogCardPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  views: number
  createdAt: string | Date
  readingTime?: number
  category: { name: string; slug: string; color: string | null } | null
}

export function BlogCard({ post, featured = false }: { post: BlogCardPost; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col" aria-label={post.title}>
      <Card className={`flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#E5DCC8]/60 dark:hover:shadow-none ${featured ? "border-[#B08D57]/60 ring-1 ring-[#B08D57]/30 dark:border-blue-800" : "border-gray-200 dark:border-gray-700"}`}>
        {post.image ? (
          <div className={`relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 ${featured ? "aspect-[16/8]" : "aspect-video"}`}>
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {post.category && (
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                {post.category.name}
              </span>
            )}
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[#101E33] p-6 text-center">
            <span className="h-px w-10 bg-[#B08D57]" aria-hidden />
            <span className="line-clamp-3 text-lg font-bold leading-snug text-[#F2EDE0]">{post.title}</span>
          </div>
        )}
        <CardContent className="flex flex-1 flex-col p-5">
          {!post.image && post.category && (
            <span className="mb-2 w-fit rounded-full bg-[#F4EDDE] px-2.5 py-0.5 text-[11px] font-bold text-[#1B3A5C] dark:bg-blue-950 dark:text-blue-300">
              {post.category.name}
            </span>
          )}
          <h3 className={`line-clamp-2 font-bold leading-snug tracking-tight text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100 dark:group-hover:text-blue-300 ${featured ? "text-xl" : "text-[1.05rem]"}`}>
            {post.title}
          </h3>
          {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{post.excerpt}</p>}
          <div className="mt-auto flex items-center justify-between pt-4 text-xs text-gray-400">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.createdAt)}</span>
              {post.readingTime ? <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{post.readingTime} min</span> : null}
            </span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1" title={`${post.views.toLocaleString("en-IN")} views`}><Eye className="h-3.5 w-3.5" />{formatCompact(post.views)}</span>
              <ArrowUpRight className="h-4 w-4 text-[#B08D57] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
