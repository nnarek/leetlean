"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Submission } from "@/lib/types";
import SolutionEditor from "@/components/SolutionEditor";

interface SubmissionViewProps {
  submission: Submission;
  problemId: string;
  onBack: () => void;
  onDeleted: () => void;
  onUpdated: (updated: Submission) => void;
}

export default function SubmissionView({
  submission: sub,
  problemId,
  onBack,
  onDeleted,
  onUpdated,
}: SubmissionViewProps) {
  const { user } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(sub.name || "");
  const [notes, setNotes] = useState(sub.notes || "");
  const [notesEditing, setNotesEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSolutionEditor, setShowSolutionEditor] = useState(false);

  const isOwner = user?.id === sub.user_id;

  const handleRenameSave = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("submissions")
      .update({ name: nameValue || null })
      .eq("id", sub.id);
    if (!error) {
      onUpdated({ ...sub, name: nameValue || null });
    }
    setEditingName(false);
  };

  const handleNotesSave = async () => {
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("submissions")
      .update({ notes: notes || null })
      .eq("id", sub.id);
    if (error) {
      setSaveError(error.message);
    } else {
      onUpdated({ ...sub, notes: notes || null });
      setNotesEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this submission? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("submissions").delete().eq("id", sub.id);
    if (!error) {
      onDeleted();
    }
  };

  const handleLoadIntoEditor = () => {
    if (!window.confirm("Load this submission's code into the editor? Your current code will be replaced.")) return;
    window.dispatchEvent(new CustomEvent("leetlean:load-code", { detail: { code: sub.code } }));
    onBack();
  };

  if (showSolutionEditor) {
    return (
      <SolutionEditor
        problemId={problemId}
        submission={sub}
        onCancel={() => setShowSolutionEditor(false)}
        onSaved={() => setShowSolutionEditor(false)}
      />
    );
  }

  const statusBadgeClass =
    sub.status === "accepted"
      ? "badge-success"
      : sub.status === "wrong"
        ? "badge-danger"
        : "badge-warning";

  return (
    <div className="space-y-3 pt-2">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="vscode-menu-btn"
        >
          &larr; Submissions
        </button>
        <div className="flex items-center gap-2">
          {sub.status === "accepted" && isOwner && (
            <button
              onClick={() => setShowSolutionEditor(true)}
              className="vscode-menu-btn"
              style={{ background: '#0078d4', color: '#fff' }}
            >
              Publish
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleLoadIntoEditor}
              className="vscode-menu-btn"
              title="Load this code into the editor"
            >
              Load in Editor
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="vscode-menu-btn"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Header: name + status + date */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${statusBadgeClass}`}
        >
          {sub.status}
        </span>
        {editingName ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSave();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="rounded border border-border bg-background px-2 py-0.5 text-sm text-foreground w-48 focus:border-accent focus:outline-none"
              autoFocus
              placeholder="Submission name"
            />
            <button
              onClick={handleRenameSave}
              className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90"
            >
              Save
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="rounded border border-border px-3 py-1 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingName(true);
              setNameValue(sub.name || "");
            }}
            className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
            title="Click to rename"
          >
            {sub.name || "Unnamed submission"}
          </button>
        )}
        <span className="text-xs text-muted ml-auto">
          {new Date(sub.submitted_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Code */}
      <div className="rounded-md border border-border bg-[#1e1e1e] p-3 overflow-x-auto">
        <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
          {sub.code}
        </pre>
      </div>

      {/* Errors (for wrong submissions) */}
      {sub.status === "wrong" && sub.errors && (
        <div className="rounded-md border border-[var(--badge-danger-border)] bg-[var(--badge-danger-bg)] p-3 overflow-x-auto">
          <p className="text-[10px] text-[var(--badge-danger-text)] mb-2 uppercase tracking-wider">
            Errors
          </p>
          <pre className="text-xs text-[var(--badge-danger-text)] font-mono whitespace-pre-wrap leading-relaxed">
            {sub.errors}
          </pre>
        </div>
      )}

      {/* Notes */}
      {isOwner && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Notes</p>
          {notesEditing || !sub.notes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none min-h-[100px] resize-y font-mono"
                placeholder="Add notes about this submission..."
                autoFocus={notesEditing}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNotesSave}
                  disabled={saving}
                  className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                {notesEditing && sub.notes && (
                  <button
                    onClick={() => {
                      setNotesEditing(false);
                      setNotes(sub.notes || "");
                      setSaveError(null);
                    }}
                    className="rounded border border-border px-3 py-1 text-xs text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {saveError && (
                <p className="text-xs text-[var(--badge-danger-text)]">Error: {saveError}</p>
              )}
            </div>
          ) : (
            <div
              onClick={() => setNotesEditing(true)}
              className="rounded-md border border-border bg-surface/50 p-3 cursor-pointer hover:border-accent/50 transition-colors"
              title="Click to edit notes"
            >
              <p className="text-sm text-foreground whitespace-pre-wrap">{sub.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
