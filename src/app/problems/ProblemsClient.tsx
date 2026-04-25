"use client";

import { getClientDatabase } from "@/lib/db/client";
import type { IDatabase } from "@/lib/db/types";
import type { Difficulty } from "@/lib/types";
import { Problem } from "@/lib/types";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";

type SortField = "sort_order" | "difficulty" | "title";
type SortOrder = "asc" | "desc";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function ProblemsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db: IDatabase = useMemo(() => getClientDatabase(), []);

  // Read state from URL
  const q = searchParams.get("q") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const selectedTags = useMemo(
    () => (tagsParam ? tagsParam.split(",").filter(Boolean) : []),
    [tagsParam]
  );
  const difficulty = (searchParams.get("difficulty") ?? "") as Difficulty | "";
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 15) || 15);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const sortBy = (searchParams.get("sortBy") ?? "sort_order") as SortField;
  const sortOrder = (searchParams.get("sortOrder") ?? "asc") as SortOrder;

  const [problemList, setProblemList] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [perPageOpen, setPerPageOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const perPageRef = useRef<HTMLDivElement>(null);

  // Local search state
  const [formQ, setFormQ] = useState(q);

  // Sync form state on URL change
  useEffect(() => {
    setFormQ(q);
  }, [q]);

  // Fetch tags once
  useEffect(() => {
    db.getAllTags().then(setAllTags);
  }, [db]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (perPageRef.current && !perPageRef.current.contains(e.target as Node)) {
        setPerPageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build URL with overrides
  const buildUrl = useCallback(
    (overrides: Record<string, string | number | undefined> = {}) => {
      const params = new URLSearchParams();
      const vals: Record<string, string> = {
        q: overrides.q !== undefined ? String(overrides.q) : q,
        tags: overrides.tags !== undefined ? String(overrides.tags) : tagsParam,
        difficulty:
          overrides.difficulty !== undefined
            ? String(overrides.difficulty)
            : difficulty,
        limit:
          overrides.limit !== undefined
            ? String(overrides.limit)
            : String(limit),
        page:
          overrides.page !== undefined ? String(overrides.page) : String(page),
        sortBy:
          overrides.sortBy !== undefined ? String(overrides.sortBy) : sortBy,
        sortOrder:
          overrides.sortOrder !== undefined
            ? String(overrides.sortOrder)
            : sortOrder,
      };
      if (vals.q) params.set("q", vals.q);
      if (vals.tags) params.set("tags", vals.tags);
      if (vals.difficulty) params.set("difficulty", vals.difficulty);
      params.set("limit", vals.limit);
      params.set("page", vals.page);
      if (vals.sortBy !== "sort_order") params.set("sortBy", vals.sortBy);
      if (vals.sortOrder !== "asc") params.set("sortOrder", vals.sortOrder);
      return `/problems?${params.toString()}`;
    },
    [q, tagsParam, difficulty, limit, page, sortBy, sortOrder]
  );

  // Fetch problems
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await db.getProblems({
        q,
        difficulty,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      setProblemList(result.problems);
      setTotal(result.total);
    } catch (error) {
      console.error("Error fetching problems:", error);
    }
    setLoading(false);
  }, [db, q, difficulty, selectedTags, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Pagination
  const from = (page - 1) * limit;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : from + 1;
  const endItem = Math.min(total, from + limit);

  // Toggle tag (immediate)
  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    router.push(buildUrl({ tags: newTags.join(","), page: 1 }));
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      router.push(
        buildUrl({ sortOrder: sortOrder === "asc" ? "desc" : "asc", page: 1 })
      );
    } else {
      router.push(buildUrl({ sortBy: field, sortOrder: "asc", page: 1 }));
    }
    setSortOpen(false);
  };

  // Difficulty toggle (immediate) — toggle on/off, no "All" button
  const handleDifficulty = (d: Difficulty) => {
    router.push(buildUrl({ difficulty: difficulty === d ? "" : d, page: 1 }));
  };

  // Per page change (immediate)
  const handleLimitChange = (newLimit: string) => {
    router.push(buildUrl({ limit: newLimit, page: 1 }));
    setPerPageOpen(false);
  };

  // Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ q: formQ.trim(), page: 1 }));
  };

  const sortOptions: { value: SortField; label: string }[] = [
    { value: "sort_order", label: "Problem ID" },
    { value: "difficulty", label: "Difficulty" },
    { value: "title", label: "Name" },
  ];

  const perPageOptions = ["5", "10", "15", "20", "50"];
  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label;

  return (
    <div className="mx-auto max-w-[90rem] px-4 pt-6 pb-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1">
            {/* Filters row — scoped to table column width */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex flex-1 min-w-0 items-center gap-2">
                <input
                  value={formQ}
                  onChange={(e) => setFormQ(e.target.value)}
                  placeholder="Search by title..."
                  className="flex-1 min-w-0 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent/90"
                >
                  Search
                </button>
              </form>

              {/* Difficulty pills */}
              <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDifficulty(d)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150 ${
                      difficulty === d
                        ? "bg-accent text-white shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div ref={sortRef} className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition hover:border-accent/50"
                >
                  <span className="text-muted">Sort:</span>
                  <span className="font-medium">{currentSortLabel}</span>
                  <svg
                    className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${
                      sortOrder === "desc" ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-44 rounded-lg border border-border bg-surface shadow-xl overflow-hidden">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSort(opt.value)}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition ${
                          sortBy === opt.value
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-foreground hover:bg-hover"
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.value && (
                          <svg
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              sortOrder === "desc" ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset (show only when filters active) */}
              {(q || tagsParam || difficulty) && (
                <Link
                  href="/problems"
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground hover:border-foreground/20"
                >
                  Reset
                </Link>
              )}
            </div>

            {/* Problems table */}
            <div className="relative overflow-hidden rounded-xl border border-border">
              {loading && problemList.length > 0 && (
                <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px]" />
              )}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      #
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Title
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Difficulty
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Tags
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!loading && problemList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-muted"
                      >
                        No problems found.
                      </td>
                    </tr>
                  ) : (
                    problemList.map((problem) => (
                      <tr
                        key={problem.id}
                        className="transition hover:bg-hover"
                      >
                        <td className="px-6 py-2.5 text-sm font-mono text-muted">
                          {problem.sort_order}
                        </td>
                        <td className="px-6 py-2.5">
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="text-sm font-medium text-foreground transition hover:text-accent"
                          >
                            {problem.title}
                          </Link>
                        </td>
                        <td className="px-6 py-2.5">
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </td>
                        <td className="px-6 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.map((t) => (
                              <button
                                key={t}
                                onClick={() => toggleTag(t)}
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs transition ${
                                  selectedTags.includes(t)
                                    ? "bg-accent/15 text-accent"
                                    : "bg-badge text-muted hover:text-foreground"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom bar: pagination + per-page */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted">
                {loading
                  ? "\u00A0"
                  : `Showing ${startItem}\u2014${endItem} of ${total} problems`}
              </div>

              <div className="flex items-center gap-3">
                {/* Per page dropdown (styled like Sort) */}
                <div ref={perPageRef} className="relative">
                  <button
                    onClick={() => setPerPageOpen(!perPageOpen)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition hover:border-accent/50"
                  >
                    <span className="text-muted">Per page:</span>
                    <span className="font-medium">{limit}</span>
                    <svg
                      className={`h-3.5 w-3.5 text-muted transition-transform duration-200 ${
                        perPageOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {perPageOpen && (
                    <div className="absolute bottom-full left-0 z-50 mb-1 w-32 rounded-lg border border-border bg-surface shadow-xl overflow-hidden">
                      {perPageOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleLimitChange(opt)}
                          className={`flex w-full items-center px-3 py-2.5 text-sm transition ${
                            String(limit) === opt
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-foreground hover:bg-hover"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={buildUrl({ page: Math.max(1, page - 1) })}
                  className={`rounded-lg border border-border px-3 py-2 text-sm transition ${
                    page === 1
                      ? "opacity-50 pointer-events-none"
                      : "hover:border-accent/50 text-foreground"
                  }`}
                >
                  Previous
                </Link>

                <div className="text-sm text-muted">
                  Page {page} of {totalPages}
                </div>

                <Link
                  href={buildUrl({ page: Math.min(totalPages, page + 1) })}
                  className={`rounded-lg border border-border px-3 py-2 text-sm transition ${
                    page >= totalPages
                      ? "opacity-50 pointer-events-none"
                      : "hover:border-accent/50 text-foreground"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </div>

          {/* Tag selector on the right */}
          <aside className="w-full lg:w-56 shrink-0 lg:self-start lg:mt-[3.25rem]">
            <div className="rounded-xl border border-border bg-surface/30 p-4">
              <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-md border px-2.5 py-1 text-sm transition-all duration-150 ${
                        isSelected
                          ? "border-accent/40 bg-accent/15 text-accent font-medium"
                          : "border-border text-muted hover:bg-hover hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
    </div>
  );
}
