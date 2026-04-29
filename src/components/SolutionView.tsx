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
  const [isPublic, setIsPublic] = useState(sol.is_public);
  const isOwner = user?.id === sol.user_id;
  const username = sol.profiles.email?.split("@")[0] || "anonymous";

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
    const newPublic = !isPublic;
    const { error } = await supabase
      .from("solutions")
      .update({ is_public: newPublic })
      .eq("id", sol.id);
    if (!error) {
      setIsPublic(newPublic);
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
        submission={{ id: sol.submission_id, user_id: sol.user_id, problem_id: sol.problem_id, code: sol.submissions.code, status: sol.submissions.status, name: null, notes: null, errors: null, submitted_at: "" }}
        existingSolution={{
          id: sol.id,
          title: sol.title,
          content: sol.content,
          is_public: isPublic,
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
      {/* Top bar: back + upvote + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="vscode-menu-btn"
        >
          &larr; Solutions
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            disabled={!user}
            className={`vscode-menu-btn ${
              sol.user_has_liked
                ? "!text-accent !bg-accent/10"
                : ""
            } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
            title={user ? (sol.user_has_liked ? "Remove upvote" : "Upvote") : "Sign in to upvote"}
          >
            <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            {sol.like_count}
          </button>
          <button
            onClick={handleCopyLink}
            className="vscode-menu-btn"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="vscode-menu-btn"
              >
                Edit
              </button>
              <button
                onClick={handleToggleVisibility}
                className="vscode-menu-btn"
              >
                {isPublic ? "Make Private" : "Make Public"}
              </button>
              <button
                onClick={handleDelete}
                className="vscode-menu-btn"
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
      <div className="flex items-center gap-2">
        {sol.profiles.avatar_url ? (
          <img src={sol.profiles.avatar_url} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-badge border border-border flex items-center justify-center">
            <span className="text-[10px] text-muted">{username[0]?.toUpperCase()}</span>
          </div>
        )}
        <span className="text-sm text-muted">
          {username}
        </span>
        {isOwner && (
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${
            isPublic ? "badge-success" : "badge-warning"
          }`}>
            {isPublic ? "Public" : "Private"}
          </span>
        )}
      </div>

      {/* Tags */}
      {sol.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sol.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-badge px-2 py-0.5 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Code */}
      {sol.submissions.code ? (
        <div className="rounded-md border border-border bg-[#1e1e1e] p-3 overflow-x-auto">
          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
            {sol.submissions.code}
          </pre>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface/50 p-4 text-center">
          <p className="text-sm text-muted">Sign in to view the proof code.</p>
        </div>
      )}

      {/* Notes */}
      {sol.content ? (
        <div>
          <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Notes</p>
          <div className="rounded-md border border-border bg-surface/50 p-3">
            <MarkdownRenderer content={sol.content} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted italic">No notes provided.</p>
      )}

      {/* Date — bottom right */}
      <div className="flex justify-end">
        <span className="text-xs text-muted font-sans tabular-nums">
          {new Date(sol.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
