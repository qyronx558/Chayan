import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock3, Eye } from "lucide-react"
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
   <Card className={`flex h-full flex-col overflow-hidden transition-colors ${featured ? "border-brick" : "border-rule"}`}>
    {post.image ? (
     <div className={`relative w-full overflow-hidden bg-paper-3 ${featured ? "aspect-[16/8]" : "aspect-video"}`}>
      <Image
       src={post.image}
       alt={post.title}
       fill
       sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
       className="object-cover"
      />
      {post.category && (
       <span className="absolute left-3 top-3 border border-rule bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
        {post.category.name}
       </span>
      )}
     </div>
    ) : (
     <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-ink p-6 text-center">
      <span className="h-px w-10 bg-brick" aria-hidden />
      <span className="line-clamp-3 text-lg font-bold leading-snug text-paper">{post.title}</span>
     </div>
    )}
    <CardContent className="flex flex-1 flex-col p-5">
     {!post.image && post.category && (
      <span className="mb-2 w-fit border border-rule px-2.5 py-0.5 text-[11px] font-medium text-brick">
       {post.category.name}
      </span>
     )}
     <h3 className={`line-clamp-2 font-bold leading-snug tracking-tight text-foreground group-hover:text-brick ${featured ? "text-xl" : "text-[1.05rem]"}`}>
      {post.title}
     </h3>
     {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>}
     <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-3">
       <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.createdAt)}</span>
       {post.readingTime ? <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{post.readingTime} min</span> : null}
      </span>
      <span className="flex items-center gap-1" title={`${post.views.toLocaleString("en-IN")} views`}><Eye className="h-3.5 w-3.5" />{formatCompact(post.views)}</span>
     </div>
    </CardContent>
   </Card>
  </Link>
 )
}
