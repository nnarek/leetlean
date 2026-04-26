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
| Code Editor | **lean4monaco** directly embedded (connects to live.lean-lang.org) |
| Markdown | react-markdown + remark-gfm for problem descriptions |

## Key Architecture Decisions

1. **No running backend server** — All data comes from Supabase (serverless Postgres + Auth). The code editor connects directly to the remote Lean server at `wss://live.lean-lang.org`.
2. **lean4monaco embedded directly** — The editor uses the `lean4monaco` npm package which provides Monaco editor + Lean 4 LSP integration. No iframe. Code is persisted in browser `localStorage` (key: `leetlean:editor-code`). See `src/components/Lean4EditorInner.tsx`.
3. **lean4web source files in `src/lib/lean4web/`** — Adapted lean4web components and utilities are in a separate directory for easy syncing with upstream [lean4web](https://github.com/leanprover-community/lean4web) changes.
4. **Problems stored in Supabase** — But authored as markdown files in `/problems/` with YAML frontmatter. A seed script (`scripts/seed-problems.ts`) loads them into the DB.
5. **Row Level Security (RLS)** — Problems are public-read. Submissions are per-user. Profiles auto-created on signup.
6. **Static-ish rendering** — Problems pages use `revalidate = 60` (ISR). Landing page is static.

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
│   │   ├── Lean4Editor.tsx        # lean4monaco editor wrapper (dynamic import, ssr: false)
│   │   ├── Lean4EditorInner.tsx   # Editor implementation with split pane
│   │   └── MarkdownRenderer.tsx   # Renders markdown content
│   ├── hooks/
│   │   └── useAuth.ts            # Auth hook (signIn, signOut, user state)
│   ├── lib/
│   │   ├── types.ts               # TypeScript types (Problem, Submission, etc.)
│   │   ├── lean4web/              # Adapted lean4web frontend (keep synced with upstream)
│   │   │   ├── editor/code-atoms.ts       # Code state → localStorage
│   │   │   ├── settings/                  # Settings UI, types, atoms
│   │   │   ├── store/                     # URL args, location, window state atoms
│   │   │   ├── utils/                     # URL encoding, shallow equal, save-to-file
│   │   │   ├── navigation/Popup.tsx       # Modal wrapper
│   │   │   └── css/lean4web.css           # Scoped lean4web styles
│   │   └── supabase/
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
npm install    # Automatically copies lean4web assets via postinstall hook
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

## Lean4 Editor Integration

The editor uses **lean4monaco** (from npm) which provides Monaco editor + Lean 4 LSP client.

**Code persistence:**
- Code is stored in browser `localStorage` with key `leetlean:editor-code`
- Code persists across page refreshes without URL manipulation
- User can open current code in live.lean-lang.org via "Open in new tab ↗" button

**Theme sync:**
- Editor theme automatically syncs with the app's `data-theme` attribute
- Supports: Visual Studio Light/Dark, High Contrast, Cobalt
- Theme can also be manually set via Settings popup

**WebSocket connection:**
- Hardcoded to `wss://live.lean-lang.org/websocket/MathlibDemo`
- No custom Lean server needed (uses the public live.lean-lang.org instance)

**Static assets:**
- Run `npm run copy:lean-assets` to copy infoview files and fonts from `node_modules/` to `public/`
- This happens automatically via `npm postinstall` script
- See `scripts/copy-lean4web-assets.mjs`

**Main components:**
- `src/components/Lean4Editor.tsx` — Dynamic import wrapper (`ssr: false`)
- `src/components/Lean4EditorInner.tsx` — Implementation with split pane (editor + infoview)
- `src/lib/lean4web/` — Adapted lean4web frontend code (keep synced with upstream)

## Future Work Ideas

- Submission tracking and verification
- Leaderboard / user rankings
- Problem categories / filtering
- Timed challenges
- Solution sharing
- Admin panel for problem management
- Custom lean4web deployment with Mathlib project
