"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Submission } from "@/lib/types";
import SolutionEditor from "@/components/SolutionEditor";

interface SubmissionsListProps {
  problemId: string;
}

export default function SubmissionsList({ problemId }: SubmissionsListProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [sharingSubmission, setSharingSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("problem_id", problemId)
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setSubmissions(data as Submission[]);
    }
    setLoading(false);
  }, [user, problemId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    const handleFocus = () => fetchSubmissions();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchSubmissions]);

  const handleRename = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("submissions")
      .update({ name: editName || null })
      .eq("id", id);

    if (!error) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: editName || null } : s))
      );
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this submission? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (!error) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (sharingSubmission) {
    return (
      <SolutionEditor
        problemId={problemId}
        submission={sharingSubmission}
        onCancel={() => setSharingSubmission(null)}
        onSaved={() => setSharingSubmission(null)}
      />
    );
  }

  if (!user) {
    return <p className="text-sm text-muted">Sign in to see your submissions.</p>;
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading submissions...</p>;
  }

  if (submissions.length === 0) {
    return <p className="text-sm text-muted">No submissions yet. Submit a proof from the editor.</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted uppercase tracking-wider mb-2">
        {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
      </p>
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="rounded border border-border bg-surface/30 px-3 py-2 hover:bg-surface/60 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
                  sub.status === "accepted"
                    ? "bg-green-900/30 text-green-400 border border-green-400/20"
                    : sub.status === "wrong"
                      ? "bg-red-900/30 text-red-400 border border-red-400/20"
                      : "bg-yellow-900/30 text-yellow-400 border border-yellow-400/20"
                }`}
              >
                {sub.status}
              </span>
              {editingId === sub.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(sub.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground w-40 focus:border-accent focus:outline-none"
                    autoFocus
                    placeholder="Submission name"
                  />
                  <button
                    onClick={() => handleRename(sub.id)}
                    className="text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(sub.id);
                    setEditName(sub.name || "");
                  }}
                  className="truncate text-xs text-foreground hover:text-accent transition-colors"
                  title="Click to rename"
                >
                  {sub.name || "Unnamed submission"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-muted whitespace-nowrap">
                {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => handleDelete(sub.id)}
                className="w-5 h-5 flex items-center justify-center rounded text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete submission"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Share button — only for accepted submissions */}
          {sub.status === "accepted" && (
            <div className="mt-1.5 pt-1.5 border-t border-border/30">
              <button
                onClick={() => setSharingSubmission(sub)}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Share as Solution
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
