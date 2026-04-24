import { getServerDatabase } from "@/lib/db/server";

export const dynamic = "force-static";

export async function GET() {
  const db = await getServerDatabase();
  const tags = await db.getAllTags();
  return Response.json(tags);
}
