import { describe, test, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { SupabaseDatabase } from "../src/lib/db/supabase";
import type { ProblemsFilter } from "../src/lib/db/types";
import type { Problem } from "../src/lib/types";

let db: SupabaseDatabase;

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }
  db = new SupabaseDatabase(createClient(url, key));
});

async function fetchProblems(filter: ProblemsFilter) {
  return db.getProblems(filter);
}

describe("problems filtering", () => {
  test("returns problems without filters", async () => {
    const data = await fetchProblems({ limit: 100 });
    expect(data.problems).toBeInstanceOf(Array);
    expect(data.problems.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
  });

  test("filters by difficulty=easy returns only easy problems", async () => {
    const data = await fetchProblems({ difficulty: "easy", limit: 100 });
    expect(data.problems.length).toBeGreaterThan(0);
    for (const p of data.problems) {
      expect(p.difficulty).toBe("easy");
    }
  });

  test("filters by difficulty=medium returns only medium problems", async () => {
    const data = await fetchProblems({ difficulty: "medium", limit: 100 });
    for (const p of data.problems) {
      expect(p.difficulty).toBe("medium");
    }
  });

  test("filters by difficulty=hard returns only hard problems", async () => {
    const data = await fetchProblems({ difficulty: "hard", limit: 100 });
    for (const p of data.problems) {
      expect(p.difficulty).toBe("hard");
    }
  });

  test("filters by single tag", async () => {
    const data = await fetchProblems({ tags: ["basics"], limit: 100 });
    expect(data.problems.length).toBeGreaterThan(0);
    for (const p of data.problems) {
      expect(p.tags).toContain("basics");
    }
  });

  test("filters by multiple tags (AND logic)", async () => {
    const data = await fetchProblems({
      tags: ["basics", "introduction"],
      limit: 100,
    });
    for (const p of data.problems) {
      expect(p.tags).toContain("basics");
      expect(p.tags).toContain("introduction");
    }
  });

  test("filters by difficulty and tag combined", async () => {
    const data = await fetchProblems({
      difficulty: "easy",
      tags: ["basics"],
      limit: 100,
    });
    for (const p of data.problems) {
      expect(p.difficulty).toBe("easy");
      expect(p.tags).toContain("basics");
    }
  });

  test("search by title (q parameter)", async () => {
    const data = await fetchProblems({ q: "hello", limit: 100 });
    expect(data.problems.length).toBeGreaterThan(0);
    for (const p of data.problems) {
      expect(p.title.toLowerCase()).toContain("hello");
    }
  });

  test("pagination does not overlap", async () => {
    const page1 = await fetchProblems({ limit: 2, page: 1 });
    const page2 = await fetchProblems({ limit: 2, page: 2 });
    expect(page1.problems.length).toBeLessThanOrEqual(2);

    const slugs1 = new Set(page1.problems.map((p: Problem) => p.slug));
    for (const p of page2.problems) {
      expect(slugs1.has(p.slug)).toBe(false);
    }
  });

  test("pagination total is consistent", async () => {
    const all = await fetchProblems({ limit: 100 });
    const page1 = await fetchProblems({ limit: 3, page: 1 });
    expect(page1.total).toBe(all.total);
  });

  test("returns empty when no match", async () => {
    const data = await fetchProblems({
      q: "nonexistent_problem_xyz123",
      limit: 100,
    });
    expect(data.problems).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  test("fetches single problem by slug", async () => {
    const problem = await db.getProblemBySlug("hello-lean");
    expect(problem).toBeTruthy();
    expect(problem!.slug).toBe("hello-lean");
  });

  test("sort by title ascending", async () => {
    const data = await fetchProblems({
      sortBy: "title",
      sortOrder: "asc",
      limit: 100,
    });
    for (let i = 1; i < data.problems.length; i++) {
      expect(
        data.problems[i].title.localeCompare(data.problems[i - 1].title)
      ).toBeGreaterThanOrEqual(0);
    }
  });

  test("sort by sort_order descending", async () => {
    const data = await fetchProblems({
      sortBy: "sort_order",
      sortOrder: "desc",
      limit: 100,
    });
    for (let i = 1; i < data.problems.length; i++) {
      expect(data.problems[i].sort_order).toBeLessThanOrEqual(
        data.problems[i - 1].sort_order
      );
    }
  });

  test("sort by difficulty ascending", async () => {
    const diffOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
    const data = await fetchProblems({
      sortBy: "difficulty",
      sortOrder: "asc",
      limit: 100,
    });
    for (let i = 1; i < data.problems.length; i++) {
      expect(diffOrder[data.problems[i].difficulty]).toBeGreaterThanOrEqual(
        diffOrder[data.problems[i - 1].difficulty]
      );
    }
  });

  test("getAllTags returns sorted tags", async () => {
    const tags = await db.getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i].localeCompare(tags[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});
