# LeetLean — Prompt History

> This file documents the prompts given to AI agents during development.
> Future AI agents should read this to understand what has been built and what the user expects.

---

## Prompt 1 — Initial Project Setup (2026-04-12)

**Given to:** GitHub Copilot (Claude)

**Prompt:**
> make website for me for competitive programming of lean4 language
> where users try to prove some complex theorem or verify some code
>
> use https://github.com/leanprover-community/lean4web as online code editor
>
> use supabase as backend to store data, there should not be running server,
> it should be in serverless dbs of supabase, only server of itself lean4web
> should be running server
>
> there should be main page which describes what is leetlean and page of
> problems where table contain problems and pages of problems itself, problem
> page should contain description of problem and lean4web editor
>
> descriptions of problems should be placed in the separate folder using in
> markdown format. there should be script which load that markdown into supabase db
>
> also add sign in with google button
>
> make some .md files for future prompts, so future prompts will know what
> kind of prompts I already give to you and what is my requirements and some
> doc for future AI agents who will work on this

**What was built:**
- Next.js project with App Router, TypeScript, Tailwind CSS v4
- Supabase integration (client, server, middleware, auth callback)
- Google OAuth sign-in via Supabase Auth
- Landing page with hero, features, categories, CTA
- Problems list page with table (difficulty, tags)
- Problem detail page with markdown description + lean4web iframe editor
- 10 sample problems in `/problems/` as markdown with YAML frontmatter
- Seed script (`scripts/seed-problems.ts`) to load problems into Supabase
- Seed script auto-creates required database tables when they don't exist
- Database schema with profiles, problems, submissions tables + RLS
- Documentation: `AGENTS.md`, `CLAUDE.md`, `PROMPTS.md`

**Key decisions made:**
- lean4web embedded via iframe using `#code=<encoded>` URL hash parameter
- Problems authored as markdown files, seeded into Supabase via script
- Dark theme (zinc-950 background) with emerald accent color
- No custom server — everything serverless through Supabase

---

## Template for Future Prompts

### Prompt N — [Feature Name] (YYYY-MM-DD)

**Given to:** [Agent name]

**Prompt:**
> [paste the prompt here]

**What was built:**
- [list of changes]

**Key decisions:**
- [list of decisions]
