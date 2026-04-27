import { NextRequest, NextResponse } from "next/server"

const ADMIN_COOKIE_NAME = "movitec_admin_session"

function isProtectedAdminPath(pathname: string) {
  if (!pathname.startsWith("/admin")) return false
  if (pathname.startsWith("/admin/login")) return false
  return true
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next()
  }

  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value || ""
  const expectedValue = process.env.ADMIN_ACCESS_COOKIE_SECRET || ""

  if (!expectedValue) {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  if (cookieValue !== expectedValue) {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}