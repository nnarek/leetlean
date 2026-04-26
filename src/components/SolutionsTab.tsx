"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { SolutionWithMeta } from "@/lib/types";
import SolutionView from "@/components/SolutionView";

interface SolutionsTabProps {
  problemId: string;
  problemSlug: string;
}

export default function SolutionsTab({ problemId, problemSlug }: SolutionsTabProps) {
  const { user, loading: authLoading } = useAuth();
  const [solutions, setSolutions] = useState<SolutionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMine, setShowMine] = useState(false);
  const [viewingSolution, setViewingSolution] = useState<SolutionWithMeta | null>(null);
  const pendingSolutionIdRef = useRef<string | undefined>(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id") ?? undefined
      : undefined
  );

  const fetchSolutions = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from("solutions")
        .select("*")
        .eq("problem_id", problemId)
        .order("created_at", { ascending: false });

      if (showMine && user) {
        query = query.eq("user_id", user.id);
      }

      if (selectedTags.length > 0) {
        query = query.contains("tags", selectedTags);
      }

      const { data: solutionsData, error } = await query;

      if (error) {
        console.error("[SolutionsTab] query error:", error);
        setLoading(false);
        return;
      }

      if (!solutionsData || solutionsData.length === 0) {
        setSolutions([]);
        setAllTags([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all solution authors
      const userIds = [...new Set(solutionsData.map((s: any) => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      const profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      for (const p of profilesData || []) {
        profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      }

      // Fetch submission code for each solution
      const submissionIds = [...new Set(solutionsData.map((s: any) => s.submission_id))];
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("id, code, status")
        .in("id", submissionIds);
      const submissionsMap: Record<string, { code: string; status: string }> = {};
      for (const s of submissionsData || []) {
        submissionsMap[s.id] = { code: s.code, status: s.status };
      }

      // Fetch like counts
      const solutionIds = solutionsData.map((s: any) => s.id);
      const { data: likesData } = await supabase
        .from("solution_likes")
        .select("solution_id, user_id")
        .in("solution_id", solutionIds);

      const likeCounts: Record<string, number> = {};
      const userLikes = new Set<string>();
      for (const like of likesData || []) {
        likeCounts[like.solution_id] = (likeCounts[like.solution_id] || 0) + 1;
        if (user && like.user_id === user.id) {
          userLikes.add(like.solution_id);
        }
      }

      const enriched: SolutionWithMeta[] = solutionsData.map((s: any) => ({
        ...s,
        like_count: likeCounts[s.id] || 0,
        user_has_liked: userLikes.has(s.id),
        profiles: profilesMap[s.user_id] || { full_name: null, avatar_url: null },
        submissions: submissionsMap[s.submission_id] || { code: "", status: "pending" },
      }));

      // Sort by likes descending
      enriched.sort((a, b) => b.like_count - a.like_count);

      setSolutions(enriched);

      // If we have a pending solution ID to view, find and open it
      if (pendingSolutionIdRef.current) {
        const target = enriched.find((s) => s.id === pendingSolutionIdRef.current);
        if (target) {
          setViewingSolution(target);
        }
        pendingSolutionIdRef.current = undefined;
      }

      // Collect all tags
      const tagSet = new Set<string>();
      for (const s of enriched) {
        for (const t of s.tags) tagSet.add(t);
      }
      setAllTags(Array.from(tagSet).sort());
    } catch (err) {
      console.error("[SolutionsTab] unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [problemId, user, authLoading, showMine, selectedTags]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLike = async (solutionId: string) => {
    if (!user) return;
    const supabase = createClient();
    const solution = solutions.find((s) => s.id === solutionId);
    if (!solution) return;

    if (solution.user_has_liked) {
      await supabase
        .from("solution_likes")
        .delete()
        .eq("solution_id", solutionId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("solution_likes")
        .insert({ solution_id: solutionId, user_id: user.id });
    }

    // Update solutions list
    setSolutions((prev) =>
      prev.map((s) =>
        s.id === solutionId
          ? {
              ...s,
              like_count: s.user_has_liked ? s.like_count - 1 : s.like_count + 1,
              user_has_liked: !s.user_has_liked,
            }
          : s
      )
    );

    // Also update the viewing solution if it matches
    if (viewingSolution?.id === solutionId) {
      setViewingSolution((prev) =>
        prev
          ? {
              ...prev,
              like_count: prev.user_has_liked ? prev.like_count - 1 : prev.like_count + 1,
              user_has_liked: !prev.user_has_liked,
            }
          : null
      );
    }
  };

  const openSolution = (sol: SolutionWithMeta) => {
    setViewingSolution(sol);
    const url = new URL(window.location.href);
    url.pathname = `/problems/${problemSlug}/solutions`;
    url.searchParams.set("id", sol.id);
    window.history.replaceState(null, "", url.toString());
  };

  const closeSolution = () => {
    setViewingSolution(null);
    const url = new URL(window.location.href);
    url.pathname = `/problems/${problemSlug}/solutions`;
    url.searchParams.delete("id");
    window.history.replaceState(null, "", url.toString());
    fetchSolutions();
  };

  if (viewingSolution) {
    return (
      <SolutionView
        solution={viewingSolution}
        onBack={closeSolution}
        onLike={() => handleLike(viewingSolution.id)}
        onUpdated={fetchSolutions}
      />
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading solutions...</p>;
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <button
          onClick={() => setShowMine(!showMine)}
          className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors ${
            showMine
              ? "bg-accent/20 text-accent border-accent/30"
              : "bg-transparent text-muted border-border hover:border-accent/30"
          }`}
        >
          My Solutions
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors ${
              selectedTags.includes(tag)
                ? "bg-accent/20 text-accent border-accent/30"
                : "bg-transparent text-muted border-border hover:border-accent/30"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {solutions.length === 0 ? (
        <p className="text-sm text-muted">
          {showMine ? "You haven't shared any solutions yet." : "No solutions shared yet. Be the first!"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {solutions.map((sol) => (
            <button
              key={sol.id}
              onClick={() => openSolution(sol)}
              className="w-full text-left rounded border border-border bg-surface/30 px-3 py-2.5 hover:border-accent/30 hover:bg-surface/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {sol.title || "Untitled Solution"}
                  </span>
                  {/* Own solutions: public/private badge */}
                  {sol.user_id === user?.id && (
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
                      sol.is_public
                        ? "bg-green-900/30 text-green-400 border border-green-400/20"
                        : "bg-yellow-900/30 text-yellow-400 border border-yellow-400/20"
                    }`}>
                      {sol.is_public ? "Public" : "Private"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      sol.user_has_liked ? "text-red-400" : "text-muted"
                    }`}
                  >
                    {sol.user_has_liked ? "\u2665" : "\u2661"} {sol.like_count}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(sol.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted">
                  {sol.profiles.full_name || "Anonymous"}
                </span>
              </div>
              {sol.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {sol.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded bg-badge px-1.5 py-0.5 text-[10px] text-muted border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
