<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LeetLean — AI Agent Context Document

> This file provides context for AI agents (Copilot, Claude, Cursor, etc.) working on this codebase.

## Project Summary

**LeetLean** is a competitive programming platform for the **Lean 4** programming language. Users prove theorems and verify code, similar to LeetCode but for formal verification.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS v4 |
| Backend/DB | Supabase (PostgreSQL, Auth, RLS) — **serverless, no custom server** |
| Auth | Supabase Auth with Google OAuth |
| Code Editor | [lean4web](https://github.com/leanprover-community/lean4web) embedded via iframe |
| Markdown | react-markdown + remark-gfm for problem descriptions |

## Key Architecture Decisions

1. **No running backend server** — All data comes from Supabase (serverless Postgres + Auth). The only server that runs is the lean4web instance for the code editor.
2. **lean4web via iframe** — The editor is embedded using URL hash params: `#code=<encoded_code>`. See `src/components/Lean4Editor.tsx`.
3. **Problems stored in Supabase** — But authored as markdown files in `/problems/` with YAML frontmatter. A seed script (`scripts/seed-problems.ts`) loads them into the DB.
4. **Row Level Security (RLS)** — Problems are public-read. Submissions are per-user. Profiles auto-created on signup.
5. **Static-ish rendering** — Problems pages use `revalidate = 60` (ISR). Landing page is static.

## Directory Structure

```
leetlean/
├── .env.local.example        # Template for environment variables
├── problems/                  # Markdown problem files (source of truth)
│   ├── 001-hello-lean.md
│   ├── 002-and-introduction.md
│   └── ...
├── scripts/
│   └── seed-problems.ts       # Loads problems/ into Supabase
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # DB schema (tables, RLS, triggers)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout (Navbar + Footer)
│   │   ├── globals.css            # Global styles
│   │   ├── auth/callback/route.ts # OAuth callback handler
│   │   └── problems/
│   │       ├── page.tsx           # Problems list (table)
│   │       └── [slug]/page.tsx    # Problem detail (description + editor)
│   ├── components/
│   │   ├── Navbar.tsx             # Navigation with Google sign-in
│   │   ├── Footer.tsx             # Site footer
│   │   ├── DifficultyBadge.tsx    # Easy/Medium/Hard badge
│   │   ├── Lean4Editor.tsx        # lean4web iframe wrapper
│   │   └── MarkdownRenderer.tsx   # Renders markdown content
│   ├── hooks/
│   │   └── useAuth.ts            # Auth hook (signIn, signOut, user state)
│   └── lib/
│       ├── types.ts               # TypeScript types (Problem, Submission, etc.)
│       └── supabase/
│           ├── client.ts          # Browser Supabase client
│           ├── server.ts          # Server Supabase client
│           └── middleware.ts      # Session refresh middleware
├── AGENTS.md                      # This file
├── CLAUDE.md                      # Claude-specific instructions
└── PROMPTS.md                     # History of prompts given to AI agents
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous/public key
SUPABASE_SERVICE_ROLE_KEY     — Supabase service role key (admin, for scripts only)
DATABASE_URL                  — Postgres connection string (for seed script auto-migration)
                                Get from: Supabase Dashboard → Settings → Database → Connection string (URI)
NEXT_PUBLIC_LEAN4WEB_URL      — URL of lean4web instance (default: https://live.lean-lang.org)
```

## Database Schema

### `profiles` — Auto-created on Google signup
- `id` (uuid, FK to auth.users)
- `email`, `full_name`, `avatar_url`

### `problems` — Theorem proving challenges
- `id` (uuid), `slug` (unique), `title`, `difficulty` (easy/medium/hard)
- `description` (markdown), `starter_code` (Lean 4 code)
- `tags` (text[]), `sort_order` (int)

### `submissions` — User proof attempts
- `id`, `user_id` (FK profiles), `problem_id` (FK problems)
- `code`, `status` (pending/accepted/wrong)

## Common Tasks

### Add a new problem
1. Create a markdown file in `problems/` following the naming convention `NNN-slug-name.md`
2. Include YAML frontmatter: `slug`, `title`, `difficulty`, `tags`, `sort_order`, `starter_code`
3. Run `npm run seed` to upload to Supabase

### Run locally
```bash
npm run dev
```

### Seed problems into DB
```bash
npm run seed
```
The seed script automatically creates the database tables (from `supabase/migrations/001_initial_schema.sql`) if they don't exist.

For auto-migration, it tries these methods in order:
1. **Supabase Management API** (recommended) — requires `npx supabase login` + `npx supabase link`
2. **Direct Postgres** via `DATABASE_URL` in `.env.local`
3. **Manual** — prints a link to the Supabase SQL Editor

## Lean4Web Integration

The editor embeds lean4web using an iframe with URL hash parameters:
- `#code=<url_encoded_lean_code>` — pre-fills the editor
- `#project=<name>` — selects the Lean project (if your server has multiple)

The component is at `src/components/Lean4Editor.tsx`.

## Future Work Ideas

- Submission tracking and verification
- Leaderboard / user rankings
- Problem categories / filtering
- Timed challenges
- Solution sharing
- Admin panel for problem management
- Custom lean4web deployment with Mathlib project
