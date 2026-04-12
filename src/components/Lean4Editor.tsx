"use client";

interface Lean4EditorProps {
  code?: string;
  lean4webUrl?: string;
}

/**
 * Embeds the lean4web editor via iframe.
 * Uses URL hash parameters as documented:
 *   - `code=`: plain text code
 *   - `project=`: the Lean project (e.g. "mathlib" if configured on your server)
 *
 * For self-hosted lean4web, set NEXT_PUBLIC_LEAN4WEB_URL in your .env.local
 */
export default function Lean4Editor({ code, lean4webUrl }: Lean4EditorProps) {
  const baseUrl =
    lean4webUrl ||
    process.env.NEXT_PUBLIC_LEAN4WEB_URL ||
    "https://live.lean-lang.org";

  // Build the URL with code in hash fragment
  let src = baseUrl;
  if (code) {
    const encodedCode = encodeURIComponent(code);
    src = `${baseUrl}/#code=${encodedCode}`;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-4 py-2">
        <span className="text-sm font-medium text-zinc-300">
          Lean 4 Editor
        </span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 transition hover:text-emerald-400"
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src={src}
        className="h-[600px] w-full bg-zinc-900"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        title="Lean 4 Web Editor"
      />
    </div>
  );
}
