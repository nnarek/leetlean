import { getServerDatabase } from "@/lib/db/server";
import { NextRequest } from "next/server";
import type { Difficulty } from "@/lib/types";

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const db = await getServerDatabase();

  // Single problem by slug
  const slug = params.get("slug");
  if (slug) {
    const problem = await db.getProblemBySlug(slug);
    return Response.json({ problem });
  }

  const tagsParam = params.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

  const result = await db.getProblems({
    q: params.get("q") || undefined,
    difficulty: (params.get("difficulty") || "") as Difficulty | "",
    tags,
    page: Number(params.get("page")) || 1,
    limit: Math.min(100, Number(params.get("limit")) || 10),
    sortBy:
      (params.get("sortBy") as "sort_order" | "difficulty" | "title") ||
      undefined,
    sortOrder: (params.get("sortOrder") as "asc" | "desc") || undefined,
  });

  return Response.json(result);
}
