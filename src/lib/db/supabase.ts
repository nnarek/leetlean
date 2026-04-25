import type { SupabaseClient } from "@supabase/supabase-js";
import type { IDatabase, ProblemsFilter, ProblemsResult } from "./types";
import type { Problem, Difficulty } from "../types";

const difficultyRank: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export class SupabaseDatabase implements IDatabase {
  constructor(private client: SupabaseClient) {}

  async getProblems(filter: ProblemsFilter): Promise<ProblemsResult> {
    const {
      q,
      difficulty,
      tags,
      page = 1,
      limit = 10,
      sortBy = "sort_order",
      sortOrder = "asc",
    } = filter;

    let query = this.client.from("problems").select("*", { count: "exact" });
    if (q) query = query.ilike("title", `%${q}%`);
    if (difficulty) query = query.eq("difficulty", difficulty);
    if (tags && tags.length > 0) query = query.contains("tags", tags);

    // Difficulty sorting needs JS post-sort since DB sorts alphabetically
    if (sortBy === "difficulty") {
      const { data, count, error } = await query.order("sort_order", {
        ascending: true,
      });
      if (error) throw error;
      const all = (data ?? []) as Problem[];
      all.sort((a, b) => {
        const diff = difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
        return sortOrder === "asc" ? diff : -diff;
      });
      const from = (page - 1) * limit;
      return {
        problems: all.slice(from, from + limit),
        total: count ?? all.length,
      };
    }

    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
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
