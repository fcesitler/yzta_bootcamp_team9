# Project Overview

Build a lightweight agentic backend. This guide is instructions to get Claude Code to behave the way I want.
Each feature does one thing, the code is easy to follow, and the app is easy to run locally and deploy.

This backend exposes exactly ONE task:
- **`run-campaign`** — bundles Find → Research → Score → Write into one run, since there is no human
  approval needed between these steps. Only the output (the draft) needs a human's review, before Send.

This is NOT the orchestrator — Make (no-code) is the orchestrator. It calls `run-campaign` via webhook
(or on a schedule) to source and draft outreach.

Everything else in the pipeline — Approve & Send, Reply classification, Meeting brief, Book Meeting,
Contract merge — runs with NO code at all, as Make's native modules: email, its built-in `AI Agent`
module (`ai-local-agent`, a single Claude call with structured JSON output — proven in the existing
`flow-mail-analysis-hackathon-yzta` scenario in this Make account) for classification/summarization/
merging, Cal.com for booking, Google Docs for the contract template. `run-campaign` is the ONLY step
that needs real code, because it's the only step that chains multiple external APIs (Apollo, Firecrawl,
Tavily) into one multi-minute job — everything else is a single Claude call or a native integration, and
Make's AI Agent module already handles that without a deploy step. This keeps the visible workflow
no-code while the one genuinely multi-step piece of AI reasoning lives in clean, testable TypeScript
code, running somewhere that doesn't time out (see Tech Stack).

---

# Development Rules

**Rule 1: Always read first**
Before taking any action, always read:
- `CLAUDE.md`
- `project_specs.md`

If either file doesn't exist, create it before doing anything else.

**Rule 2: Define before you build**
Before writing any code:
1. Create or update `project_specs.md` and define:
  - What the app does and who uses it
  - Tech stack (framework, database, auth, hosting)
  - Pages and user flows (public vs authenticated)
  - Data models and where data is stored
  - Third-party services being used (Apollo, Firecrawl, Tavily, Supabase, etc.)
  - What "done" looks like for this task
2. Show the file
3. Wait for approval

No code should be written before this file is approved.

**Rule 3: Look before you create**
Always look at existing files before creating new ones. Don't start building until you understand what's being asked. If anything is unclear, ask before starting.

**Rule 4: Test before you respond**
After making any code changes, run the relevant tests or start the dev server to check for errors before responding. Never say "done" if the code is untested.

**Core Rule**
Do exactly what is asked. Nothing more, nothing less. If something is unclear, ask before starting.

---

# How to Respond

Always explain like you're talking to a 15 year old with no coding background.

For every response, include:
- **What I just did** — plain English, no jargon
- **What you need to do** — step by step, assume they've never seen this before
- **Why** — one sentence explaining what it does or why it matters
- **Next step** — one clear action
- **Errors** — if something went wrong, explain it simply and say exactly how to fix it

When a task involves external tools or technical elements that a non-coder wouldn't know (Supabase, Trigger.dev, Make, Apollo, Vercel, localhost:3000, etc.):
- Walk through exactly where to find what they need (e.g. "go to your Supabase dashboard → Settings → API")
- Describe what each key or setting does in one plain sentence
- If there's SQL to run, explain what it's doing before they run it
- If there's a bucket, folder, or config to create manually, explain what it is and why it exists
- Be as concise as possible. Do not ramble. Less is more

---

# Tech Stack

- **Language:** TypeScript
- **AI:** Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk`
- **Orchestration (no-code, outside this repo):** Make — calls `run-campaign` over HTTP; handles every
  other step itself via native modules (AI Agent, email, Cal.com, Google Docs)
- **Deployment:** Trigger.dev
- **Database:** Supabase (Postgres)
- **Key libraries/services:** `apollo` (lead data), `firecrawl` (site scraping), `tavily` (web research),
  `@supabase/supabase-js`, `cal.com` API (meeting booking), Google Docs API (contract merge, Sprint 3)

# Deployment

- Deployment Tasks live in the `/trigger` directory as TypeScript files
- Deploy with: `npx trigger.dev@latest deploy`
- When using a package that uses dynamic `require()` at runtime (e.g. an Apollo/Firecrawl client), add it to
  both `build.external` and `build.additionalPackages` in `trigger.config.ts` — otherwise the bundler
  won't include the runtime dependencies and the deploy will fail
- Environment variables (API keys) must be set in the Trigger.dev dashboard under Environment Variables,
  not in `.env`
- Each task must return a clean JSON result (or throw a clear error) so Make can read the response and
  branch the workflow (success / needs-review / failed)

---

# Running the Project

1. Copy `.env.example` to `.env` and fill in your API keys
2. Install dependencies: `npm install`
3. Run a task locally: `npx trigger.dev@latest dev`

---

# File Structure

- `/trigger` → `run-campaign.ts` (Find→Research→Score→Write) — the only task in this repo
- `/lib/pipeline/` → One function per pipeline stage (find.ts, research.ts, score.ts, write.ts), called in
  sequence *inside* `run-campaign.ts`. Splitting these into functions (not separate Trigger.dev tasks) keeps
  each stage testable on its own while still running as one fast, single deploy unit
- `/lib` → Shared helper code (Claude client, Supabase client, Apollo/Firecrawl/Tavily clients)
- `/lib/prompts/` → System prompts for each agent, kept out of the task files so they're easy to review/tune
- `/out` → Generated output files for local testing (not committed to GitHub)
- `.env` → Your API keys and secrets (never share or commit this)
- `.env.example` → A safe template showing which keys are needed
- `project_specs.md` → What this project does and what needs to be built
- `package.json` → List of packages needed to run the project

Put new code in the same place as similar existing code.
Don't create new top-level folders without asking first.

---

# How to Write Code

- Write simple, readable code — clarity matters more than cleverness
- Make one change at a time
- Don't change code that isn't related to the current task
- Don't over-engineer — build exactly what's needed, nothing more
- Every pipeline stage (find/research/score/write) is its own function in `/lib/pipeline/`, but they run
  together inside the single `run-campaign` task. Don't turn a pipeline stage into its own Trigger.dev
  task — this backend should only ever have `run-campaign`. If a new step needs a human-approval gate,
  or is just a single Claude call with structured output, that's a sign it belongs in Make (native AI
  Agent module) instead of in this repo — don't build it here just because it's "AI"

If a big structural change is needed, explain why before making it.

---

# Secrets & Safety

- Never put API keys or passwords directly in the code
- Never commit `.env` to GitHub
- Supabase `service_role` key only ever lives in Trigger.dev environment variables — never in a frontend, never in a client-side call
- Ask before deleting or renaming any important files

---

# Scope

Only build what is described in `project_specs.md`.
If anything is unclear, ask before starting.

---

# Core Rule

Do exactly what is asked. Nothing more, nothing less.
If something is unclear, ask before starting.

# Testing

Before marking any task as done:
- Run the relevant script or command and confirm it exits successfully
- Check stdout/stderr for errors, warnings, or unexpected output
- Trace the full execution path end-to-end — not just the entry point
- Verify that existing behaviour wasn't broken by the change

When building a new agent task:
- Test the happy path (a real company in, a well-formed result out)
- Test the error path (company with no website, no news, empty search results, API timeout)
- Check that auth/permissions are working — API keys, scopes, and access controls behave correctly
- Confirm data is scoped and passed correctly between steps (no leakage, no missing context) — e.g.
  the Write task must actually receive the Research task's "why now" signal, not just the company name

When calling external APIs or services (Apollo, Firecrawl, Tavily, Claude, Cal.com):
- Confirm the request payload matches the expected schema
- Validate the response before passing it downstream
- Handle rate limits, timeouts, and partial failures explicitly — return a clear "failed" status so
  Make can retry or flag it instead of silently dropping the lead

Never say "done" if:
- The workflow errors out or exits with a non-zero code
- Any step produces unexpected or unvalidated output
- The full execution path hasn't been traced end-to-end
- Edge cases (empty input, missing fields, API failures) haven't been considered
