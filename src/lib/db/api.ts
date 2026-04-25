import type { IDatabase, ProblemsFilter, ProblemsResult } from "./types";
import type { Problem } from "../types";

/**
 * IDatabase implementation that calls local Next.js API routes.
 * Used in non-serverless (SSR) mode so the browser never talks to
 * Supabase directly — all queries go through the Next.js server.
 */
export class ApiDatabase implements IDatabase {
  async getProblems(filter: ProblemsFilter): Promise<ProblemsResult> {
    const params = new URLSearchParams();
    if (filter.q) params.set("q", filter.q);
    if (filter.difficulty) params.set("difficulty", filter.difficulty);
    if (filter.tags && filter.tags.length > 0)
      params.set("tags", filter.tags.join(","));
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));
    if (filter.sortBy) params.set("sortBy", filter.sortBy);
    if (filter.sortOrder) params.set("sortOrder", filter.sortOrder);

    const res = await fetch(`/api/problems?${params.toString()}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async getProblemBySlug(slug: string): Promise<Problem | null> {
    const params = new URLSearchParams({ slug });
    const res = await fetch(`/api/problems?${params.toString()}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    if (data.problem !== undefined) return data.problem;
    const { problems } = data as ProblemsResult;
    return problems.find((p) => p.slug === slug) ?? null;
  }

  async getAllTags(): Promise<string[]> {
    const res = await fetch(`/api/tags`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
}
