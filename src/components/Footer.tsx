"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide the footer on any problems pages so the page ends at the editor/description.
  if (pathname && pathname.startsWith("/problems")) return null;

  return (
    <footer className="border-t border-[#3c3c3c] bg-[#252526] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-[#9e9e9e]">
            © {new Date().getFullYear()} LeetLean. Competitive theorem proving
            in Lean 4.
          </div>
          <div className="flex gap-6 text-sm text-[#9e9e9e]">
            <a
              href="https://github.com/leanprover-community/lean4web"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#d4d4d4]"
            >
              Lean4Web
            </a>
            <a
              href="https://lean-lang.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#d4d4d4]"
            >
              Lean 4
            </a>
            <a
              href="https://leanprover-community.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[#d4d4d4]"
            >
              Mathlib
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
