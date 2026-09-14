import { handlers } from "@/lib/auth"

// Auth.js needs Node.js runtime (Prisma + bcrypt) and must never be
// statically optimized, otherwise /api/auth/* actions fall through to
// Next.js HTML 404s (client sees "Unexpected token '<' ... not valid JSON").
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handlers.GET
export const POST = handlers.POST
