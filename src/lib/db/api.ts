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
    if (filter.tag) params.set("tag", filter.tag);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.limit) params.set("limit", String(filter.limit));

    const res = await fetch(`/api/problems?${params.toString()}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async getProblemBySlug(slug: string): Promise<Problem | null> {
    const res = await fetch(`/api/problems?q=&limit=1000`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const { problems } = (await res.json()) as ProblemsResult;
    return problems.find((p) => p.slug === slug) ?? null;
  }

  async getAllTags(): Promise<string[]> {
    const res = await fetch(`/api/tags`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
}
