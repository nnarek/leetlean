import { getServerDatabase } from "@/lib/db/server";
import { NextRequest } from "next/server";
import type { Difficulty } from "@/lib/types";

// In static export mode these routes are unused (client talks to DB directly).
// force-static prevents the build error.
export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const db = await getServerDatabase();

  const result = await db.getProblems({
    q: params.get("q") || undefined,
    difficulty: (params.get("difficulty") || "") as Difficulty | "",
    tag: params.get("tag") || undefined,
    page: Number(params.get("page")) || 1,
    limit: Math.min(100, Number(params.get("limit")) || 10),
  });

  return Response.json(result);
}
