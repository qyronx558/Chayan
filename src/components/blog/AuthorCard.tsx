import { Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AuthorCardProps {
  name: string
  bio?: string
  category?: string | null
}

export function AuthorCard({ name, bio, category }: AuthorCardProps) {
  return (
    <div className="mt-8 flex items-start gap-4 rounded-xl border border-rule bg-paper-2 p-5 print:break-inside-avoid dark:border-ink dark:bg-ink/60">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-xl font-bold text-paper">
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground dark:text-paper">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">
          {bio || "Editor at ChayanJobs - writes practical guides on careers, skills and money."}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {category && <Badge variant="secondary" className="text-[10px]">{category}</Badge>}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" /> ChayanJobs Editorial
          </span>
        </div>
      </div>
    </div>
  )
}