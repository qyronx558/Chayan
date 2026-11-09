import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Clock3, Eye } from "lucide-react"
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

interface BlogCardProps {
 post: BlogCardPost
 featured?: boolean
 /** "wide" renders a horizontal row card (list view). */
 variant?: "card" | "wide"
}

function Cover({ post, className }: { post: BlogCardPost; className: string }) {
 return post.image ? (
  <div className={`relative overflow-hidden bg-paper-3 ${className}`}>
   <Image
    src={post.image}
    alt=""
    fill
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
   />
  </div>
 ) : (
  <div className={`relative flex flex-col justify-end gap-3 overflow-hidden bg-ink p-5 ${className}`}>
   <span className="h-0.5 w-10 bg-brick" aria-hidden />
   <span className="line-clamp-3 font-display text-xl font-bold leading-snug text-paper">{post.title}</span>
  </div>
 )
}

function Meta({ post }: { post: BlogCardPost }) {
 return (
  <div className="flex items-center gap-3 text-xs text-muted-foreground">
   <time dateTime={new Date(post.createdAt).toISOString()}>{formatDate(post.createdAt)}</time>
   {post.readingTime ? (
    <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{post.readingTime} min read</span>
   ) : null}
   <span className="ml-auto flex items-center gap-1" title={`${post.views.toLocaleString("en-IN")} views`}>
    <Eye className="h-3.5 w-3.5" />{formatCompact(post.views)}
   </span>
  </div>
 )
}

export function BlogCard({ post, featured = false, variant = "card" }: BlogCardProps) {
 if (variant === "wide") {
  return (
   <Link
    href={`/blog/${post.slug}`}
    aria-label={post.title}
    className="group grid gap-5 border-b border-rule py-6 first:pt-0 sm:grid-cols-[240px_minmax(0,1fr)]"
   >
    <Cover post={post} className="aspect-[16/10] w-full" />
    <div className="flex min-w-0 flex-col">
     {post.category && (
      <span className="mb-2 text-xs font-bold uppercase tracking-wide text-brick">{post.category.name}</span>
     )}
     <h3 className="line-clamp-2 font-display text-xl font-bold leading-snug tracking-tight text-foreground group-hover:text-brick">
      {post.title}
     </h3>
     {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>}
     <div className="mt-auto pt-4"><Meta post={post} /></div>
    </div>
   </Link>
  )
 }

 return (
  <Link
   href={`/blog/${post.slug}`}
   aria-label={post.title}
   className={`group flex h-full flex-col border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brick hover:shadow-[4px_4px_0_0_var(--color-brick)] ${featured ? "border-brick" : "border-rule"}`}
  >
   <Cover post={post} className={featured ? "aspect-[16/8] w-full" : "aspect-[16/10] w-full"} />
   <div className="flex flex-1 flex-col p-5">
    {post.category && (
     <span className="mb-2 text-xs font-bold uppercase tracking-wide text-brick">{post.category.name}</span>
    )}
    <h3 className={`line-clamp-2 font-display font-bold leading-snug tracking-tight text-foreground group-hover:text-brick ${featured ? "text-2xl" : "text-xl"}`}>
     {post.title}
    </h3>
    {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>}
    <div className="mt-auto pt-5">
     <div className="mb-3 h-px bg-rule" aria-hidden />
     <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1"><Meta post={post} /></div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brick" aria-hidden />
     </div>
    </div>
   </div>
  </Link>
 )
}
