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

## Do NOT
- Create a custom backend server — use Supabase serverless DB
- Modify the lean4web codebase — we embed it via iframe
- Use `pages/` router — this project uses App Router exclusively
- Commit `.env.local` — it's gitignored