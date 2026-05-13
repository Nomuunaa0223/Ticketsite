import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/organizer/dashboard", "/tickets"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!protectedRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("tixora_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/organizer/dashboard/:path*", "/organizer/dashboard", "/tickets/:path*"]
};
