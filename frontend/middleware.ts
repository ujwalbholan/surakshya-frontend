import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"]

function hasAuthCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("refresh_token") ||
    request.cookies.has("access_token")
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    PUBLIC_ADMIN_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next()
  }

  if (!hasAuthCookie(request)) {
    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login"
    const url = request.nextUrl.clone()
    url.pathname = loginPath
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
