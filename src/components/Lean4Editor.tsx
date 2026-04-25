"use client";

import { useEffect, useMemo, useState } from "react";

interface Lean4EditorProps {
  code?: string;
  lean4webUrl?: string;
}

type EditorTheme = "light" | "dark";

function readCurrentTheme(): EditorTheme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
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
  const [theme, setTheme] = useState<EditorTheme>("dark");

  useEffect(() => {
    setTheme(readCurrentTheme());

    const observer = new MutationObserver(() => {
      setTheme(readCurrentTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const baseUrl =
    lean4webUrl ||
    process.env.NEXT_PUBLIC_LEAN4WEB_URL ||
    "https://live.lean-lang.org";

  const src = useMemo(() => {
    const url = new URL(baseUrl);
    url.searchParams.set("theme", theme);

    if (code) {
      const encodedCode = encodeURIComponent(code);
      url.hash = `code=${encodedCode}&`;
    } else {
      url.hash = "";
    }

    return url.toString();
  }, [baseUrl, code, theme]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <span className="text-sm font-medium text-foreground">
          Lean 4 Editor
        </span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted transition hover:text-accent"
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src={src}
        className="h-full w-full flex-1 bg-background"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        title="Lean 4 Web Editor"
      />
    </div>
  );
}
