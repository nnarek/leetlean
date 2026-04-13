# LeetLean — Competitive Theorem Proving in Lean 4

Sharpen your formal verification skills by proving theorems and verifying code in [Lean 4](https://lean-lang.org/). Think LeetCode, but for mathematical proofs.

## Features

- 📝 **Problem library** — Browse problems by difficulty (easy/medium/hard) and category
- ✏️ **Built-in editor** — Powered by [lean4web](https://github.com/leanprover-community/lean4web) with real-time Lean 4 feedback
- 🔐 **Google Sign-In** — via Supabase Auth
- 🗄️ **Serverless backend** — Supabase (no custom server required)
- 📄 **Markdown problems** — Author problems as markdown files, seed to DB

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- A lean4web instance (or use `https://live.lean-lang.org`)

### 2. Setup

```bash
# Clone and install
git clone <your-repo-url> leetlean
cd leetlean
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL, keys, and lean4web URL
```

### 3. Database Setup

The seed script (step 5) automatically creates tables if they don't exist.
For auto-migration, log in to the Supabase CLI and link your project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

Alternatively, run the migration manually in the Supabase SQL Editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# into Supabase Dashboard → SQL Editor → Run
```

### 4. Enable Google Auth

In Supabase Dashboard:
1. Go to **Authentication → Sign In / Providers → Google**
2. Enable Google provider
3. Add your Google OAuth client ID and secret
4. Set redirect URL to `https://<your-project-ref>.supabase.co/auth/v1/callback` in the Google Cloud Console

### 5. Seed Problems

```bash
npm run seed
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding Problems

1. Create a markdown file in `problems/` (e.g., `011-my-problem.md`)
2. Add YAML frontmatter:

```yaml
---
slug: "my-problem"
title: "My Problem Title"
difficulty: "medium"
tags: ["logic", "tactics"]
sort_order: 11
starter_code: |
  theorem my_theorem : ... := by
    sorry
---
```

3. Write the problem description in markdown below the frontmatter
4. Run `npm run seed` to upload to Supabase

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Editor:** lean4web (iframe embed)
- **Deployment:** Vercel (or any Node.js host)

## Documentation

- [`AGENTS.md`](./AGENTS.md) — Full architecture & context for AI agents
- [`CLAUDE.md`](./CLAUDE.md) — Claude/Copilot-specific coding guidelines
- [`PROMPTS.md`](./PROMPTS.md) — History of AI prompts used in development
