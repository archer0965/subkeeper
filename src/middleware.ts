import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Avoid MIDDLEWARE_INVOCATION_FAILED when env not yet configured.
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/", "/app/:path*", "/login", "/signup", "/auth/:path*"],
};
