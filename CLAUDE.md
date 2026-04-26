@AGENTS.md

# Claude-Specific Instructions for LeetLean

## Code Style
- Use TypeScript strict mode
- Prefer `async/await` over `.then()` chains
- Use Tailwind CSS v4 with `@import "tailwindcss"` (not `@tailwind` directives)
- Server components by default; add `"use client"` only when needed (hooks, interactivity)
- Use Next.js App Router patterns (not Pages Router)

## When Adding Features
1. Read `AGENTS.md` for architecture context
2. Check `src/lib/types.ts` for existing types
3. Use `createServerSupabaseClient()` in server components, `createClient()` in client components
4. All new Supabase tables need RLS policies
5. New problems go in `/problems/` as markdown, then `npm run seed`

## Supabase Patterns
- Browser: `import { createClient } from "@/lib/supabase/client"`
- Server: `import { createServerSupabaseClient } from "@/lib/supabase/server"`
- Admin scripts: use `SUPABASE_SERVICE_ROLE_KEY` directly with `createClient`

## Lean4web Editor Integration
- The editor is embedded directly using `lean4monaco` (not via iframe)
- lean4web source files are in `src/lib/lean4web/` for easy syncing with upstream
- Code is persisted in browser `localStorage` (key: `leetlean:editor-code`)
- Editor connects to remote WebSocket at `wss://live.lean-lang.org/websocket/MathlibDemo`
- Run `npm run copy:lean-assets` after `npm install` to copy static infoview/font files

## Do NOT
- Create a custom backend server — use Supabase serverless DB
- Modify lean4monaco or vscode packages — keep them as-is from node_modules
- Use `pages/` router — this project uses App Router exclusively
- Commit `.env.local` — it's gitignored
- Commit generated files in `public/infoview/`, `public/assets/`, `public/fonts/` — they're gitignored