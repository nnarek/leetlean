"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { SolutionWithMeta } from "@/lib/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import SolutionEditor from "@/components/SolutionEditor";

interface SolutionViewProps {
  solution: SolutionWithMeta;
  onBack: () => void;
  onLike: () => void;
  onUpdated: () => void;
}

export default function SolutionView({ solution: sol, onBack, onLike, onUpdated }: SolutionViewProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const isOwner = user?.id === sol.user_id;

  const handleDelete = async () => {
    if (!window.confirm("Delete this solution? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("solutions").delete().eq("id", sol.id);
    if (!error) {
      onBack();
    }
  };

  const handleToggleVisibility = async () => {
    const supabase = createClient();
    const newPublic = !sol.is_public;
    const { error } = await supabase
      .from("solutions")
      .update({ is_public: newPublic })
      .eq("id", sol.id);
    if (!error) {
      onUpdated();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (editing) {
    return (
      <SolutionEditor
        problemId={sol.problem_id}
        submission={{ id: sol.submission_id, user_id: sol.user_id, problem_id: sol.problem_id, code: sol.submissions.code, status: sol.submissions.status, name: null, submitted_at: "" }}
        existingSolution={{
          id: sol.id,
          title: sol.title,
          content: sol.content,
          is_public: sol.is_public,
          tags: sol.tags,
        }}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onUpdated();
          onBack();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-muted hover:text-accent transition-colors flex items-center gap-1"
        >
          &larr; Solutions
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-foreground hover:border-accent/50 transition-colors"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-foreground hover:border-accent/50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleToggleVisibility}
                className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-foreground hover:border-accent/50 transition-colors"
              >
                {sol.is_public ? "Make Private" : "Make Public"}
              </button>
              <button
                onClick={handleDelete}
                className="text-xs px-2 py-1 rounded border border-border text-red-400/70 hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground">
        {sol.title || "Untitled Solution"}
      </h2>

      {/* Author + meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {sol.profiles.full_name || "Anonymous"}
          </span>
          {isOwner && (
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
              sol.is_public
                ? "bg-green-900/30 text-green-400 border border-green-400/20"
                : "bg-yellow-900/30 text-yellow-400 border border-yellow-400/20"
            }`}>
              {sol.is_public ? "Public" : "Private"}
            </span>
          )}
          <span className="text-xs text-muted">
            {new Date(sol.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <button
          onClick={onLike}
          disabled={!user}
          className={`flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors ${
            sol.user_has_liked
              ? "border-red-400/30 text-red-400 bg-red-400/10"
              : "border-border text-muted hover:border-red-400/30 hover:text-red-400"
          } ${!user ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          title={user ? (sol.user_has_liked ? "Unlike" : "Like") : "Sign in to like"}
        >
          {sol.user_has_liked ? "\u2665" : "\u2661"} {sol.like_count}
        </button>
      </div>

      {/* Tags */}
      {sol.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sol.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded bg-badge px-2 py-0.5 text-[10px] text-muted border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Code */}
      <div className="rounded border border-border bg-[#1e1e1e] p-3 overflow-x-auto">
        <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Proof Code</p>
        <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
          {sol.submissions.code}
        </pre>
      </div>

      {/* Notes */}
      {sol.content ? (
        <div>
          <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Notes</p>
          <div className="rounded border border-border bg-surface/50 p-3">
            <MarkdownRenderer content={sol.content} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted italic">No notes provided.</p>
      )}
    </div>
  );
}
