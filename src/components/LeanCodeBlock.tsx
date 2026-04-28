"use client";

import { useEffect, useRef, useState } from "react";

interface LeanCodeBlockProps {
  code: string;
}

/**
 * Renders Lean 4 code with syntax highlighting identical to lean4web.
 *
 * Uses Monaco's colorize() API with the lean4 TextMate grammar that
 * lean4monaco registers. Falls back to plain <pre> if Monaco isn't
 * available yet.
 */
export default function LeanCodeBlock({ code }: LeanCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function colorize() {
      try {
        // Dynamic import — monaco-editor is already bundled for the editor
        const monaco = await import("monaco-editor");

        // Wait briefly for lean4monaco to register the grammar
        // (it initializes async when the editor mounts)
        let attempts = 0;
        while (attempts < 20) {
          const langs = monaco.languages.getLanguages();
          if (langs.some((l) => l.id === "lean4")) break;
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }

        if (cancelled) return;

        const result = await monaco.editor.colorize(code, "lean4", { tabSize: 2 });
        if (!cancelled) {
          setHtml(result);
        }
      } catch {
        // Monaco not available — keep fallback
      }
    }

    colorize();
    return () => { cancelled = true; };
  }, [code]);

  // Listen for theme changes to re-colorize
  useEffect(() => {
    if (html === null) return; // Not yet colorized

    const observer = new MutationObserver(() => {
      // Theme changed — re-colorize
      (async () => {
        try {
          const monaco = await import("monaco-editor");
          const result = await monaco.editor.colorize(code, "lean4", { tabSize: 2 });
          setHtml(result);
        } catch {
          // ignore
        }
      })();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, [code, html]);

  if (html) {
    return (
      <div
        ref={containerRef}
        className="lean-code-block"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Fallback: plain text while Monaco loads
  return (
    <pre className="lean-code-block">{code}</pre>
  );
}
