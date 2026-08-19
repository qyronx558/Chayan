import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isAdminUser = isAdmin(req.auth?.user?.role)

  // Protected admin routes
  if (pathname.startsWith("/admin") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin") && !isAdminUser) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Protected user routes
  const userPaths = ["/profile", "/bookmarks", "/applications"]
  if (userPaths.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ["/login", "/register"]
  if (authPaths.some((p) => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/bookmarks/:path*", "/applications/:path*", "/login", "/register"],
}
