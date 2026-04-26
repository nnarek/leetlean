"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled — Monaco editor cannot run on the server.
const Lean4EditorInner = dynamic(() => import("./Lean4EditorInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-background">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        <span className="text-sm text-muted">Loading editor...</span>
      </div>
    </div>
  ),
});

interface Lean4EditorProps {
  code?: string;
}

/**
 * Lean 4 editor powered by lean4monaco (same engine as lean4web).
 * Connects to the remote Lean server at live.lean-lang.org via WebSocket.
 * Code is persisted in the URL hash for refresh survival.
 */
export default function Lean4Editor({ code }: Lean4EditorProps) {
  return <Lean4EditorInner code={code} />;
}
