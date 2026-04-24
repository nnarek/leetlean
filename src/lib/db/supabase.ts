import type { SupabaseClient } from "@supabase/supabase-js";
import type { IDatabase, ProblemsFilter, ProblemsResult } from "./types";
import type { Problem } from "../types";

export class SupabaseDatabase implements IDatabase {
  constructor(private client: SupabaseClient) {}

  async getProblems(filter: ProblemsFilter): Promise<ProblemsResult> {
    const { q, difficulty, tag, page = 1, limit = 10 } = filter;
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    let query = this.client.from("problems").select("*", { count: "exact" });
    if (q) query = query.ilike("title", `%${q}%`);
    if (difficulty) query = query.eq("difficulty", difficulty);
    if (tag) query = query.contains("tags", [tag]);

    const { data, count, error } = await query
      .order("sort_order", { ascending: true })
      .range(from, to);

    if (error) throw error;

    return { problems: (data ?? []) as Problem[], total: count ?? 0 };
  }

  async getProblemBySlug(slug: string): Promise<Problem | null> {
    const { data, error } = await this.client
      .from("problems")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as Problem;
  }

  async getAllTags(): Promise<string[]> {
    const { data } = await this.client.from("problems").select("tags");
    const s = new Set<string>();
    (data as { tags?: string[] }[] | null)?.forEach((r) =>
      (r.tags ?? []).forEach((t) => s.add(t))
    );
    return Array.from(s).sort();
  }
}
