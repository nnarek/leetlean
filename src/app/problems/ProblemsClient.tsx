"use client";

import { getClientDatabase } from "@/lib/db/client";
import type { IDatabase } from "@/lib/db/types";
import type { Difficulty } from "@/lib/types";
import { Problem } from "@/lib/types";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";

export default function ProblemsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db: IDatabase = useMemo(() => getClientDatabase(), []);

  // Read filter state from URL
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const difficulty = (searchParams.get("difficulty") ?? "") as Difficulty | "";
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 10) || 10);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  const [problemList, setProblemList] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Local form state (mirrors URL until user clicks Apply)
  const [formQ, setFormQ] = useState(q);
  const [formDifficulty, setFormDifficulty] = useState(difficulty);
  const [formTag, setFormTag] = useState(tag);
  const [formLimit, setFormLimit] = useState(String(limit));

  // Sync local form state when URL changes (e.g. back/forward navigation)
  useEffect(() => {
    setFormQ(q);
    setFormDifficulty(difficulty);
    setFormTag(tag);
    setFormLimit(String(limit));
  }, [q, difficulty, tag, limit]);

  // Fetch all tags once
  useEffect(() => {
    db.getAllTags().then(setAllTags);
  }, [db]);

  // Fetch problems whenever URL filter/pagination params change
  const fetchProblems = useCallback(async () => {
    setLoading(true);

    try {
      const result = await db.getProblems({ q, difficulty, tag, page, limit });
      setProblemList(result.problems);
      setTotal(result.total);
    } catch (error) {
      console.error("Error fetching problems:", error);
    }

    setLoading(false);
  }, [db, q, difficulty, tag, page, limit]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Derived pagination values
  const from = (page - 1) * limit;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : from + 1;
  const endItem = Math.min(total, from + limit);

  // Build a URL string with overrides
  const buildUrl = (overrides: { page?: number } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    if (difficulty) params.set("difficulty", difficulty);
    params.set("limit", String(limit));
    params.set("page", String(overrides.page ?? page));
    return `/problems?${params.toString()}`;
  };

  // Apply filters → push new URL (resets to page 1)
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formQ.trim()) params.set("q", formQ.trim());
    if (formDifficulty) params.set("difficulty", formDifficulty);
    if (formTag) params.set("tag", formTag);
    params.set("limit", formLimit);
    params.set("page", "1");
    router.push(`/problems?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Problems</h1>
          <p className="mt-2 text-zinc-400">
            Prove theorems and verify code in Lean 4. Filter, search, and
            paginate problems below.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleApply} className="mb-6 grid gap-3 sm:grid-cols-5">
        <input
          value={formQ}
          onChange={(e) => setFormQ(e.target.value)}
          placeholder="Search by title..."
          className="col-span-2 rounded-md bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />

        <select
          value={formDifficulty}
          onChange={(e) => setFormDifficulty(e.target.value as Difficulty | "")}
          className="rounded-md bg-zinc-900/50 px-3 py-2 text-sm text-white"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={formTag}
          onChange={(e) => setFormTag(e.target.value)}
          className="rounded-md bg-zinc-900/50 px-3 py-2 text-sm text-white"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-zinc-400">Per page:</label>
          <select
            value={formLimit}
            onChange={(e) => setFormLimit(e.target.value)}
            className="rounded-md bg-zinc-900/50 px-3 py-2 text-sm text-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <button
            type="submit"
            className="ml-2 rounded-md bg-[#6aadfe] px-3 py-2 text-sm font-medium text-black"
          >
            Apply
          </button>
          <Link
            href="/problems"
            className="ml-2 rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Problems Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Difficulty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : problemList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  No problems found.
                </td>
              </tr>
            ) : (
              problemList.map((problem, index) => (
                <tr key={problem.id} className="transition hover:bg-zinc-900/50">
                  <td className="px-6 py-4 text-sm text-zinc-500">{from + index + 1}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="text-sm font-medium text-white transition hover:text-[#6aadfe]"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {loading ? "\u00A0" : `Showing ${startItem}\u2014${endItem} of ${total} problems`}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={buildUrl({ page: Math.max(1, page - 1) })}
            className={`rounded-md px-3 py-2 text-sm ${page === 1 ? "opacity-50 pointer-events-none" : "bg-zinc-900/50"}`}
          >
            Previous
          </Link>

          <div className="text-sm text-zinc-300">Page {page} of {totalPages}</div>

          <Link
            href={buildUrl({ page: Math.min(totalPages, page + 1) })}
            className={`rounded-md px-3 py-2 text-sm ${page >= totalPages ? "opacity-50 pointer-events-none" : "bg-zinc-900/50"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
