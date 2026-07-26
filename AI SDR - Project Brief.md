AI SDR — Outreach Engine

Before running the prompt:

1. Change the CLAUDE.md tech stack to TypeScript, rather than Python AND below:

- **Deployment:** Trigger.dev

# Deployment

- Deployment Tasks live in the /trigger directory as TypeScript files
- Deploy with: npx trigger.dev@latest deploy
- When using apollo/firecrawl/tavily clients (or any package that uses dynamic require() at
runtime), add it to both build.external and build.additionalPackages in
trigger.config.ts — otherwise the bundler won't include the runtime
dependencies and the deploy will fail
- Environment variables (API keys) must be set in the Trigger.dev dashboard
under Environment Variables, not in .env

--------------------------------------------------------------------------------

Please read the @CLAUDE.md file and build out both the file structure and the
project_specs.md for the following project: Build an agentic workflow that finds B2B
companies matching a target profile, researches each one, scores it, and drafts a
personalized email + LinkedIn message so a human can review and send it.

1. Find: Use the Apollo API to pull companies + contacts (make sure to check the
   field names and match them properly). Accept filters: sector, location, company
   size, target job title, and result limit.
2. Research: For each company, use Firecrawl to read the site and Tavily to search
   recent news, then use Claude to extract a "why reach out now" signal (e.g. funding
   round, hiring surge, product launch, expansion). Filter out any company where no
   clear signal is found — no signal, no outreach.
3. ICP Score: Automatically score every company on a 0–100 scale based on: sector fit,
   company size fit, seniority of the matched contact, and strength of the "why now"
   signal. Companies below a configurable threshold (default 60) are parked, not sent
   to the Write step.
4. Write: For companies that pass scoring, generate a personalized email and a
   personalized LinkedIn message. Each must reference the specific "why now" signal —
   never a generic template. Include a one-line "AI reasoning" note explaining why this
   angle was chosen.
5. Database: Save the data into Supabase with the following fields: company_name,
   sector, contact_name, contact_title, icp_score, why_now_signal, email_draft,
   linkedin_draft, ai_reasoning, stage, job_id, source (apollo), link_to_company,
   link_to_contact, created_at
6. Deploy: This will be deployed on Trigger.dev as ONE task called `run-campaign`, which
   runs Find → Research → Score → Write in sequence internally. Make (the no-code
   orchestrator) calls this task with a single HTTP request — there is no human review
   needed between these four steps, only after Write, before Send. Split find/research/
   score/write into separate functions inside the task for testability, but do not turn
   them into separate Trigger.dev tasks.

Next prompts:

1. Please connect to the Apollo API. Test it and add the following data into a CSV
   file: company_name, sector, contact_name, contact_title, company_size, location,
   link_to_company, link_to_contact
2. Please connect to Supabase and add the data there. Tell me what I need to add into
   Supabase to make this work, and explain it step by step, as well as why I need to
   do this.
3. Please connect to Firecrawl and Tavily for the Research step, and Claude for
   extracting the "why now" signal. Test it on 3 real companies and show me the output
   before wiring it into the pipeline.
4. Please test that I can run Find → Research → Score → Write end to end for one
   company and see a complete row appear in Supabase.
5. Please deploy this project to Trigger.dev production using the CLI. Run
   npx trigger.dev@latest deploy and confirm the deployment was successful. Please
   run npx trigger.dev@latest dev as well. Please walk me through every step required on
   my end to deploy this successfully to Trigger.dev, and then show me exactly what
   webhook URL Make needs to call for each step.


AI SDR — Web App

Please read the @CLAUDE.md file and build out both the file structure and the
project_specs.md for the following project: Build a web app called AI SDR that lets
a BD/sales person review, approve, and track an agentic outreach workflow.

The app should have these pages:

Page 1 — Dashboard
- Stat cards: Leads found, Researched, Awaiting approval, Sent, Replies, Meetings
  booked, Deals won
- An animated pipeline funnel across the 8 stages (Find, Research, Score, Write,
  Send, Reply, Meet, Close), pulled from Supabase counts per stage
- A live "Agent activity" feed showing the latest actions across all agents
- Clicking a funnel stage filters the Leads page to that stage

Page 2 — Leads
- A table pulled from Supabase: company, contact, ICP score, stage, "why now" signal,
  last activity
- Filter chips by stage, sortable columns
- Clicking a row opens Lead Detail

Page 3 — Lead Detail
- Company header + ICP score + the AI research brief ("why now" signal)
- Email and LinkedIn draft tabs with an "AI reasoning" note
- Approve & Send action — on submit, POST to a Trigger.dev/Make webhook with the
  lead id, then update the Supabase row status

Page 4 — Conversations
- List of reply threads with an AI-assigned classification (Interested / Objection /
  Not now), pulled from Supabase
- Thread view with an AI-suggested reply and a "Book meeting" action that creates a
  Cal.com booking link

Page 5 — Meeting Briefs
- A generated pre-meeting brief per booked meeting: key people, conversation summary,
  talking points, suggested agenda

Page 6 — Close & Contract (Sprint 3)
- On a deal marked "won", show the AI-merged contract preview with highlighted merged
  variables, and a Send status

Page 7 — Campaign (settings)
- A form to define ICP criteria: sector, location, company size, target job title,
  minimum ICP score, result limit — this is what gets sent to the Find step

Next prompts:

1. Please turn the app into a beautiful, modern dashboard, using shadcn/ui for
   styling, light theme, violet primary accent and teal secondary accent. Also use
   the attached screenshots for inspiration. Sidebar tabs: Dashboard, Leads,
   Conversations, Meeting Briefs, Close & Contract, Campaign.
2. Read the Trigger.dev tasks and Supabase schema, then write me a prompt I can use in
   a new Claude Code session where this existing Next.js app can:
   1. Trigger the Find→Research→Score→Write pipeline via a Make webhook
   2. Poll Supabase by job_id until results appear
   3. Display the filtered leads in the table on the Leads page
   4. The app deploys to Vercel with a 10-second function timeout, so use
      client-side polling, not long-running server functions.
3. Please connect Cal.com for the Book meeting action and test that a booked slot
   correctly updates the lead's stage to "Meet" in Supabase.
4. Please connect the Close & Contract page to a Google Docs contract template via
   Make, and test that a "won" deal correctly merges company, scope, price, and dates
   into a contract preview.
