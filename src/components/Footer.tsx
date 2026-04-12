export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-zinc-500">
            © {new Date().getFullYear()} LeetLean. Competitive theorem proving
            in Lean 4.
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a
              href="https://github.com/leanprover-community/lean4web"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-zinc-300"
            >
              Lean4Web
            </a>
            <a
              href="https://lean-lang.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-zinc-300"
            >
              Lean 4
            </a>
            <a
              href="https://leanprover-community.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-zinc-300"
            >
              Mathlib
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
