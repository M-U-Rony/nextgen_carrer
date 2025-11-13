import { NextRequest, NextResponse } from "next/server";

// Temporarily simplified middleware to avoid NextAuth v5 beta issues
export default async function middleware(req: NextRequest) {
  // Only protect dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    // Let the client-side handle authentication check
    // The dashboard page will redirect if not authenticated
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

