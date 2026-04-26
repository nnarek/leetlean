"use client";

import { useState } from "react";
import type { Submission } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface SolutionEditorProps {
  problemId: string;
  submission: Submission;
  /** Existing solution to edit (if editing) */
  existingSolution?: {
    id: string;
    title: string;
    content: string;
    is_public: boolean;
    tags: string[];
  };
  onCancel: () => void;
  onSaved: () => void;
}

export default function SolutionEditor({
  problemId,
  submission,
  existingSolution,
  onCancel,
  onSaved,
}: SolutionEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(existingSolution?.title ?? submission.name ?? "");
  const [content, setContent] = useState(existingSolution?.content ?? "");
  const [isPublic, setIsPublic] = useState(existingSolution?.is_public ?? false);
  const [tagsInput, setTagsInput] = useState(existingSolution?.tags.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const supabase = createClient();

    if (existingSolution) {
      // Update existing solution
      const { error: updateError } = await supabase
        .from("solutions")
        .update({
          title,
          content,
          is_public: isPublic,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSolution.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      // Create new solution
      const { error: insertError } = await supabase.from("solutions").insert({
        user_id: user.id,
        problem_id: problemId,
        submission_id: submission.id,
        title,
        content,
        is_public: isPublic,
        tags,
      });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {existingSolution ? "Edit Solution" : "Share as Solution"}
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      {/* Submission code preview */}
      <div className="rounded-md border border-border bg-zinc-900 p-3 overflow-x-auto">
        <p className="text-xs text-muted mb-1">
          Code from: {submission.name || "Unnamed submission"} ({submission.status})
        </p>
        <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
          {submission.code}
        </pre>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs text-muted mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          placeholder="Solution title"
        />
      </div>

      {/* Markdown notes editor */}
      <div>
        <label className="block text-xs text-muted mb-1">
          Notes (Markdown supported)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none min-h-[150px] resize-y font-mono"
          placeholder="Explain your approach, key insights, alternative methods..."
        />
      </div>

      {/* Tags input */}
      <div>
        <label className="block text-xs text-muted mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          placeholder="e.g. induction, tactic-mode, elegant"
        />
      </div>

      {/* Visibility toggle */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted">Visibility:</label>
        <button
          onClick={() => setIsPublic(false)}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            !isPublic
              ? "bg-accent text-white border-accent"
              : "bg-transparent text-muted border-border"
          }`}
        >
          Private
        </button>
        <button
          onClick={() => setIsPublic(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            isPublic
              ? "bg-accent text-white border-accent"
              : "bg-transparent text-muted border-border"
          }`}
        >
          Public
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Save button */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : existingSolution ? "Update Solution" : "Save Solution"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
