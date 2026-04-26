# Session Handoff

## Status

Context Surgeon is implemented as a Cloudflare-deployed Next.js app in this workspace.

Current production URL:

`https://contextsurgeon.fnctn.io/`

Public repository:

`https://github.com/blah-mad/context-surgeon`

Current deployed Worker version:

`a466a871-dcf6-452e-8288-dd624415ff2f`

Current implementation includes:

- Public landing page.
- Public landing page is now separated from `/demo`, uses the refined Inter/Falconn-inspired visual system, has readable light/dark themes, and includes a graph-view modal for the supplied Inazuma dataset.
- API-backed workbench.
- Cloudflare D1 persistence.
- Workspace snapshot and audit event storage.
- Firebase Auth code path and server-side ID-token verification for mutations/export.
- Production Firebase Auth runtime config deployed for project `big-berlin-hack`.
- Deterministic mock-first context engine.
- Sonnenallee 44 demo data.
- Source-grounded fact ledger.
- Conflict detection.
- Markdown VFS.
- Fact Patch.
- Human edit preservation.
- Agent Check.
- Qontext export.
- Qontext supplied-dataset proof for `Inazuma.co`: 12 domains, 153,997 counted records/artifacts, VFS and graph contract.
- Live intake mode for Gmail, Outlook, HubSpot, Salesforce, Google Drive, OneDrive, Dropbox, SharePoint, Google Sheets, Notion, Slack, Teams, Zendesk, Intercom, Jira, Linear, and manual file upload.
- Live intake UI is split into `Sources`, `Automation`, and `Review` modes to keep the workbench focused.
- Composio live mode is configured and verified for authenticated connector catalog, Gmail OAuth-link creation, sync normalization, ingestion-rule activation, manual upload normalization, and protected unauthenticated failures.
- Submission-facing `/demo` page is polished for recording: public preview starts from a fresh local sample-data state, sample-data proof is foregrounded, source view opens on signal instead of noise, live intake is collapsed behind a clear secondary callout, Qontext graph inspection opens in a modal, and desktop/mobile light/dark visual passes were checked.
- D1 persistence now falls back to in-memory state if a local/preview runtime has a binding without initialized tables.

Still not fully finished:

- Current verification pass: landing/workbench UX, sample-data loop, graph modal, public API proof routes, protected unauthenticated failures, and browser demo-mode manual upload/promote were verified. API-route tests now cover unauthenticated workspace/export/integration protection and Composio public status. Still verify with a real signed-in Firebase browser session if credentials are available; this session's in-app browser showed signed-out state, so no OAuth/third-party permission prompts were opened. Do not store credentials or test-account details in the repo.
- Submission video still needs to be produced/uploaded.

The selected main project is `Context Surgeon`.

The selected secondary project is `AI Visibility to Video Agent`, but it is explicitly lower priority.

Current locked implementation choices:

- Deploy target: Cloudflare.
- Stack: full-stack TypeScript app, Next.js App Router, React, Tailwind v4, OpenNext Cloudflare.
- Data: Cloudflare D1 for structured state; R2 only if uploads become necessary.
- Auth: Firebase Auth for workspace mutations and Qontext export; production `/api/health` should report `auth: "firebase-auth"`.
- Provider strategy: live/cached adapters for Gemini, Tavily, and Pioneer/Fastino.
- Production provider mode: `/api/health` should report `providerMode: "live"`.
- Tavily live search is verified. Gemini live context-check is robust to JSON/prose output and falls back safely. Pioneer key is configured, but model-specific inference is intentionally not called until the onsite model id/endpoint is confirmed.
- Visual direction: hybrid Falconn console.

## Strategic Decision

Build one excellent main project rather than several thin submissions.

Main bet:

- Context Surgeon for Buena + Qontext.

Side bet:

- AI Visibility to Video Agent for Peec + Hera, only after the main demo works.

Do not switch to Reonic, Inca, telli/ai-coustics, or generic wildcard unless the user explicitly reverses this decision.

## Main Project Summary

Context Surgeon compiles messy property-management data into a living context file system:

```text
/properties/sonnenallee-44/context.md
/properties/sonnenallee-44/facts.jsonl
/properties/sonnenallee-44/open_risks.md
/properties/sonnenallee-44/vendor_history.md
/properties/sonnenallee-44/accounting_flags.md
/provenance/source_map.json
```

The main demo must show:

1. Ingest property-management artifacts.
2. Extract facts with source evidence.
3. Detect conflicts.
4. Generate markdown VFS.
5. Preserve a human edit.
6. Ingest a new email.
7. Propose a minimal Fact Patch.
8. Apply patch.
9. Show an agent action plan that changed because context changed.

## Core Demo Dataset

Use property:

`Sonnenallee 44, 12045 Berlin`

Create demo artifacts:

- Tenant roof-leak complaint.
- WEG meeting minutes.
- Vendor roof-repair quote.
- Maintenance invoice.
- Bank/accounting CSV.
- Tenant CSV.
- Old manager handover note.
- Owner approval-threshold email.
- New email that rejects previous roof quote and approves temporary emergency repair.

Seed conflicts:

- Roof quote approved vs rejected.
- Roof issue closed vs open.
- Emergency spending threshold EUR 300 vs EUR 500.
- Invoice amount EUR 4,200 vs EUR 4,800.

## Partner Technology Plan

Minimum partner tech usage:

- Gemini / Google DeepMind: extraction, conflict explanation, agent action plan.
- Tavily: public/source enrichment and verification.
- Pioneer/Fastino/GLiNER2: entity/fact extraction pre-pass or classification.

Optional:

- Aikido: security scan and screenshot for side challenge.
- Gradium: voice briefing if core is done.
- Entire: workflow/provenance packaging if available.
- Lovable: frontend scaffold if useful.

Important: Aikido is not eligible as one of the 3 required partner technologies, so do not count it toward minimum.

## Implementation Priority

Original build order has mostly been completed through the mock-first D1/Firebase workbench. Current priority order:

1. Read `context-surgeon-hackathon-winning-plan.md`.
2. Run the authenticated product verification pass described above.
3. Record the 2-minute video against `https://contextsurgeon.fnctn.io/demo`.
4. Publish public GitHub repo.
5. Submit before Sunday, April 26, 2026 at 14:00 Berlin time.
6. Run Aikido scan if time permits.
7. Side project only after Context Surgeon is recordable.

## Non-Negotiable Features

The main project must include:

- Fact-level provenance.
- Conflict detection.
- Markdown VFS.
- Generated-block anchors.
- Human edit preservation.
- Unified diff patch review.
- Cached/mock mode for provider resilience.

If time is short, cut:

- Graph visualization.
- Voice.
- Real PDF parsing.
- Real MCP server.
- Real Qontext API integration is intentionally not needed; Qontext clarified that no account is necessary and using Qontext to generate the repository is not the task.
- Side project.

Do not cut:

- Patch engine.
- Source citations.
- Conflicts.
- Demo data realism.

## Product Language

Use these phrases:

- context compiler
- Fact Patch
- living property memory
- source-grounded context
- context health
- agent pre-flight check
- preserves human edits
- patch instead of regenerate

Avoid leading with:

- chatbot
- document Q&A
- generic RAG
- automation that replaces property managers

## Pitch Lines

Short:

> Agents fail when their context is stale, contradictory, or unverifiable. Context Surgeon fixes the context before agents act on the business.

Buena:

> This makes the best property manager's judgment repeatable without hiding uncertainty.

Qontext:

> Qontext is the reusable context layer. Context Surgeon is the compiler and quality gate that makes messy domain data safe for agents.

Finalist:

> Repomix made codebases promptable. Context Surgeon makes property portfolios operable by agents, with every fact traceable and every update patched instead of regenerated.

## Demo Script

1. "Here is a messy property handover archive for Sonnenallee 44."
2. "Context Surgeon compiles it into facts, source evidence, and agent-readable context files."
3. "These two sources disagree: the roof issue is marked closed here, but this tenant email says it is still active."
4. "Now I add a human note to the context file."
5. "A new owner email arrives. Instead of regenerating the whole file, Context Surgeon proposes a Fact Patch."
6. "The patch updates only the roof issue and vendor approval sections. My human note is untouched."
7. "Now the agent can answer what the property manager should do today, with citations."

## Backup Plan

If live APIs fail:

- Use cached extraction and enrichment outputs.
- Say: "The live provider is unavailable, so I am switching to cached provider mode. The product contract is the same: source in, facts out, conflicts detected, patch proposed."

If UI breaks:

- Use API endpoints and generated markdown files directly.

If patching breaks:

- Prioritize fixing patching over all other features. It is the differentiator.

## Side Project Summary

AI Visibility to Video Agent:

- Peec gap in AI-search visibility.
- Tavily evidence crawl.
- Gemini creative strategy.
- Hera-ready video prompt/output.

Build only after:

- Context Surgeon patch demo works.
- Main README is credible.
- Main video can be recorded.

Maximum side-project time: 8 hours.

## Files To Read Next

- `context-surgeon-prd.md`
- `context-surgeon-product-strategy.md`
- `context-surgeon-hackathon-winning-plan.md`
- `context-surgeon-execution-backlog.md`
- `context-surgeon-demo-script.md`
- `context-surgeon-release-checklist.md`
- `context-surgeon-feature-spec.md`
- `context-surgeon-implementation-plan.md`
- `ai-visibility-video-agent-prd.md`
- `ai-visibility-video-agent-feature-spec.md`
