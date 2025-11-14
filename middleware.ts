import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  // Only protect dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

