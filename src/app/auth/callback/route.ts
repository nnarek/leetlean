import { NextResponse } from "next/server";

// For static export, route handlers must be force-static.
// Auth code exchange is handled client-side by useAuth.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.redirect(new URL("/", "http://localhost"));
}
