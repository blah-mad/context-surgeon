# Context Surgeon Product Strategy

## Document Purpose

This is the product-owner source of truth for Context Surgeon. Use it alongside:

- `docs/hackathon/session-handoff.md`
- `docs/hackathon/context-surgeon-prd.md`
- `docs/hackathon/context-surgeon-feature-spec.md`
- `docs/hackathon/context-surgeon-implementation-plan.md`

The PRD explains the product. The feature spec explains the system. This document explains how the product wins: who it is for, what moment it owns, what experience creates the "holy shit" reaction, and what should be built next.

## Product Thesis

AI agents are starting to act inside operational businesses, but their context layer is broken. They are usually given a pile of documents, a vector index, or a generated summary. None of those are safe enough for real operations because they do not preserve provenance, expose uncertainty, or update surgically as reality changes.

Context Surgeon is the context operations layer for agentic property management. It compiles messy source material into a living property memory, keeps every fact traceable, surfaces conflicts before agents act, and updates generated context with Fact Patch instead of destructive regeneration.

The product is not a chatbot. It is a compiler, inspector, and patch system for operational context.

## One-Sentence Positioning

Context Surgeon turns scattered property-management data into source-grounded living context files that agents can safely act on, then keeps those files current with surgical Fact Patches that preserve human edits.

## Strategic Objective

For the hackathon, the objective is to make judges believe this is the missing infrastructure layer between messy company data and reliable AI agents.

The measurable outcome:

- A judge can watch the demo once and clearly explain why this is better than RAG, a documentation bot, or a regenerated summary.
- A Buena judge sees the exact solution to "one Context Markdown File per property."
- A Qontext judge sees the product surface for an inspectable context base and virtual file system.
- A technical judge sees deterministic primitives: facts, source spans, conflicts, generated blocks, patch proposals, and agent checks.

## Track-Specific Product Commitments

### Buena Commitments

Buena's challenge has three hard problems. Context Surgeon should answer each explicitly:

1. Schema alignment: map `Eigentümer`, owner board, contact, vendor, tenant, unit, and issue references into canonical entities.
2. Surgical updates: update generated context blocks with Fact Patch instead of regenerating the whole file.
3. Signal vs noise: classify incoming sources, extract only operationally relevant facts, and leave irrelevant chatter out of `context.md`.

The product should always make these visible:

- Canonical entity names and aliases.
- Fact IDs and source spans.
- Patch diff with changed fact IDs.
- Preserved human edits.

### Qontext Commitments

Qontext's challenge asks for a context base, not a chatbot. Context Surgeon should answer this with:

- A virtual file system as the product surface.
- A fact graph exported through `qontext_ingest.json`.
- References inside files and back to source records.
- Human review only where ambiguity matters.
- Automatic update behavior when new facts supersede old facts.

The product should always make these visible:

- File browser.
- Fact ledger.
- Conflict review.
- Qontext export.
- Audit trail.

## Wedge

The wedge is property handover and incident response.

Property management has the right shape for this product:

- Many fragmented sources.
- High context dependency.
- Frequent stale facts.
- Human notes that must not be overwritten.
- Operational decisions that need evidence.
- Enough domain complexity to make a generic chatbot look weak.

The specific first workflow:

> "A property manager inherits a messy building archive, compiles it into living context, receives a new source that changes operational truth, and applies a Fact Patch that changes the downstream agent action plan."

That workflow is narrow enough to demo and broad enough to imply a serious platform.

## ICP

### Primary User

Property manager responsible for multiple buildings, tenants, vendors, invoices, owner-board approvals, maintenance issues, and recurring communications.

Their pain:

- They lose time reconstructing building history.
- They do not know which source is current.
- They need to respond quickly without making unsupported claims.
- They carry too much tribal context in their head.

### Economic Buyer

Operations lead, managing director, or head of property management at a property-management company.

Their pain:

- Onboarding new portfolios is slow.
- Senior managers become context bottlenecks.
- Mistakes create tenant frustration, owner escalation, or vendor cost.
- AI adoption is blocked because agents cannot be trusted.

### Platform Buyer

Context platform, ERP, or AI-agent vendor serving operational companies.

Their pain:

- They need a reliable context substrate.
- They cannot ask every agent to recrawl company reality on every task.
- They need human-editable artifacts and machine-readable graph structure.

## Jobs To Be Done

1. When I inherit a property archive, help me understand what is true, disputed, urgent, and actionable without reading every document.
2. When a new source arrives, update the property memory without losing manual notes or reviving stale information.
3. When an AI agent is about to act, tell me whether the context is safe enough and which facts support the action.
4. When sources disagree, show me the conflict with evidence, not a vague warning.
5. When I need to share context with another system, export an inspectable VFS and fact graph.

## Product Pillars

### 1. Source-Grounded Facts

Every claim in the system is a fact object with:

- Predicate.
- Object value.
- Subject entity.
- Confidence.
- Source span.
- Quote.
- Timestamp.
- Supersession links.
- Entity aliases and canonical identity where applicable.

This is the core moat. Context Surgeon must always make it obvious that it does not merely summarize documents; it compiles traceable operational facts.

### 2. Living Markdown + Virtual File System

The visible artifact is a property memory:

- `context.md`
- `facts.jsonl`
- `open_risks.md`
- `vendor_history.md`
- `accounting_flags.md`
- `qontext_ingest.json`
- `source_map.json`

This is important because judges can inspect it. The product should feel like it creates durable context artifacts, not transient chat answers.

### 3. Fact Patch

Fact Patch is the signature product primitive.

It should be described as:

> A minimal, evidence-backed patch that updates only affected generated blocks while preserving human edits.

Fact Patch must demonstrate:

- Changed facts.
- Superseded facts.
- Unified diff.
- Preserved human note.
- Patch status.
- Downstream agent delta.

### 4. Context Health

Context Health is the operational control layer.

It answers:

- Is context complete enough?
- Are there unresolved conflicts?
- Are source citations present?
- Is the agent blocked, ready, or in review?
- Did the latest patch improve the decision surface?

### 5. Human-in-the-Loop Where It Matters

The product should not ask humans to review everything. It should only ask for review when ambiguity matters:

- Conflicting status.
- Conflicting money amount.
- Missing approval.
- Unsupported claim.
- Risky downstream action.

The product is opinionated: automate obvious facts, escalate meaningful uncertainty.

### 6. Signal vs Noise

Not every source belongs in context. The product should decide whether a new source changes operational truth.

Signal examples:

- Approval threshold changes.
- Vendor approval/rejection.
- Tenant issue status.
- Invoice/reserve mismatch.
- Owner-board decision.

Noise examples:

- Greetings and signatures.
- Duplicate status updates without new facts.
- Vendor marketing copy.
- Unrelated tenant chatter.

The UI should eventually show a source-level decision: included, ignored, or needs review.

## Product Surface

### Public Landing Page

Purpose:

- Explain why context compilation matters.
- Show the product visually.
- Make the demo feel premium.

Must communicate in 20 seconds:

- Agents fail because context is stale, contradictory, or unverifiable.
- Context Surgeon creates living property memory.
- Fact Patch updates context without destroying human edits.

### Auth Gate

Purpose:

- Keep landing/read-only demo visible.
- Require Firebase Auth for workspace mutations and export.

Rules:

- Public users can inspect the story and read-only state.
- Signed-in users can reset, compile, add human note, ingest email, apply patch, and export.
- API routes must verify Firebase ID token server-side before mutating D1.

### Workbench

Purpose:

- Be the main demo stage.
- Make the pipeline feel real and operable.

Core sections:

- Sources.
- Facts.
- Conflicts.
- Files.
- Patch Review.
- Agent Check.
- Audit Trail.

The workbench should feel dense and trusted, like an operations console.

### Context File Browser

Purpose:

- Prove the VFS exists.
- Let judges inspect generated artifacts directly.

Key behavior:

- Browse generated files.
- See generated block anchors.
- See manual note preservation.
- Show fact counts per file.

### Fact Ledger

Purpose:

- Prove source-grounded extraction.

Key behavior:

- Fact ID.
- Predicate.
- Value.
- Source quote.
- Source document.
- Confidence.

### Conflict Review

Purpose:

- Prove ambiguity is surfaced, not hidden.

Key behavior:

- Side-by-side contradictory evidence.
- Severity.
- Suggested resolution.
- Fact IDs.
- Source filenames.

### Patch Review

Purpose:

- Create the "holy shit" moment.

Key behavior:

- Unified diff.
- Changed fact count.
- Patch status.
- Preserved human edit indicator.
- Incoming source summary.

### Agent Check

Purpose:

- Prove context changes downstream behavior.

Key behavior:

- Before/after context health.
- Blocked vs ready actions.
- Rationale.
- Source fact citations.

## Demo Narrative

The demo should be run as a product story, not a feature tour.

### Act 1: The Mess

"This is Sonnenallee 44. The manager has emails, WEG minutes, quote PDFs, invoices, and handover notes. Every agent needs this context before it can safely act."

Show:

- Source count.
- Mixed source types.
- Realistic filenames.

### Act 2: The Compile

"Instead of chatting with these files, Context Surgeon compiles them into a fact ledger and a living VFS."

Show:

- Facts.
- Source quotes.
- Generated files.

### Act 3: The Contradiction

"The system catches that the roof issue is both open and closed, and the quote amount is both EUR 4,200 and EUR 4,800."

Show:

- Conflict review.
- Side-by-side evidence.

### Act 4: The Human Note

"The manager adds a human note: this tenant prefers email updates before 18:00. Regenerating context must never destroy that."

Show:

- `context.md` with manual note.

### Act 5: The New Email

"A new owner email arrives. It rejects the stale permanent quote and approves emergency sealing."

Show:

- Ingest email.
- Patch proposed.

### Act 6: Fact Patch

"Context Surgeon patches only the affected generated blocks. The human note is preserved."

Show:

- Diff.
- Changed facts.
- Preserved edit indicator.

### Act 7: Agent Delta

"The downstream agent action plan changes. It no longer waits for the rejected quote; it dispatches the approved emergency vendor and keeps the permanent repair decision under review."

Show:

- Before/after agent check.
- Source fact citations.

## Judge-Reaction Requirements

The product should make judges say "holy shit" through clarity, not noise.

Required moments:

1. "This is not RAG; it is a context compiler."
2. "Every claim has evidence."
3. "It catches conflicts before the agent acts."
4. "It patches context without erasing the human note."
5. "The agent's plan changes because the context changed."
6. "The export is usable by Qontext/Buena-style systems."
7. "It handles the hard parts named in the challenge: schema alignment, signal vs noise, and surgical updates."

Avoid:

- Generic chat input as the hero.
- Vague AI magic.
- Too many integrations shown superficially.
- A giant graph that looks impressive but does not prove actionability.
- Marketing copy that hides the working product.

## Competitive Frame

### Against RAG Chatbots

RAG retrieves snippets at runtime. Context Surgeon compiles durable context ahead of action.

### Against Document Summarizers

Summarizers collapse uncertainty. Context Surgeon preserves facts, provenance, conflicts, and supersession.

### Against Knowledge Bases

Knowledge bases depend on manual upkeep. Context Surgeon updates via Fact Patch from incoming operational sources.

### Against Agent Frameworks

Agent frameworks decide how to act. Context Surgeon decides whether the agent has trustworthy context to act at all.

## Feature Prioritization

Scoring: 1 low, 5 high.

| Initiative | Judge Impact | Product Value | Feasibility | Risk Reduction | Score |
|---|---:|---:|---:|---:|---:|
| Fact Patch with preserved human note | 5 | 5 | 4 | 5 | 19 |
| Source-grounded fact ledger | 5 | 5 | 5 | 5 | 20 |
| Conflict review | 5 | 4 | 5 | 5 | 19 |
| Agent pre-flight delta | 5 | 4 | 4 | 4 | 17 |
| Qontext export | 4 | 4 | 5 | 3 | 16 |
| Firebase Auth + D1 persistence | 3 | 4 | 4 | 4 | 15 |
| Gemini/Tavily/Pioneer live modes | 4 | 4 | 3 | 3 | 14 |
| Real upload parsing | 3 | 5 | 2 | 3 | 13 |
| Graph visualization | 3 | 3 | 2 | 2 | 10 |
| Voice briefing | 2 | 2 | 2 | 1 | 7 |

Build order:

1. Fact ledger, conflicts, VFS.
2. Fact Patch and human edit preservation.
3. Agent check delta.
4. D1 persistence and Firebase Auth.
5. Qontext export.
6. Live provider toggles.
7. Visual polish for demo recording.

## Now / Next / Later Roadmap

### Now: Hackathon Winning Demo

Goal:

Make the minimum product feel real, useful, and technically deep.

Scope:

- Public landing.
- Firebase Auth gate.
- Cloudflare D1 persistence.
- Workbench pipeline.
- Source/fact/conflict/file/patch/agent views.
- Qontext export.
- Mock-first reliability.
- Clear README.
- 2-minute demo script.

Exit criteria:

- A signed-in user can run the entire workflow end to end.
- API mutation routes reject unauthenticated requests.
- The preserved human note is visible after patch application.
- Export returns VFS, facts, conflicts, and provenance.
- The site is deployed at `contextsurgeon.fnctn.io`.

### Next: Sponsor Credibility

Goal:

Make the demo feel like it actually uses partner technologies.

Scope:

- Gemini live extraction adapter.
- Gemini context-check adapter.
- Tavily vendor/public enrichment adapter.
- Pioneer/Fastino classification adapter.
- Provider status indicators.
- Cached fallback display.

Exit criteria:

- Provider mode can show live or cached state.
- Failures degrade gracefully.
- README documents which partner tech is used where.

### Later: Product Expansion

Goal:

Turn Context Surgeon into an actual product wedge.

Scope:

- Upload source artifacts.
- Multi-property workspace.
- User/workspace isolation.
- Reviewer assignment.
- Conflict resolution history.
- Integrations: Gmail, Drive, ERP exports.
- MCP server/tool interface.
- Webhook ingestion for new emails.
- Portfolio-level context health dashboard.

Exit criteria:

- A design partner can onboard a real building archive.
- Context health can be tracked across multiple properties.
- Human review decisions improve future patches.

## Metrics

### Demo Metrics

- Sources ingested.
- Facts extracted.
- Conflicts detected.
- Files generated.
- Facts patched.
- Human edits preserved.
- Agent action plan changes.
- Context health delta.

### Product Metrics

- Time to first usable property memory.
- Percentage of facts with source provenance.
- Percentage of patch proposals accepted.
- Manual review time per incoming source.
- Contradiction rate by source type.
- Agent actions blocked due to insufficient context.
- Agent actions supported by non-conflicting cited facts.

### North Star

Percentage of downstream agent actions supported by current, non-conflicting, source-cited facts.

## Product Packaging

### Starter

For small property teams testing AI context.

- One workspace.
- Manual/demo source ingestion.
- Context VFS.
- Fact ledger.
- Patch review.

### Team

For property-management teams operationalizing agents.

- Multi-property workspace.
- Firebase/Auth-based users.
- Audit trail.
- Exports.
- Provider adapters.
- Review queues.

### Platform

For Buena/Qontext-like infrastructure buyers.

- API-first context compiler.
- Webhooks.
- MCP tool surface.
- Custom schemas.
- Fact-level provenance graph.
- White-label context health.

## Security and Trust

The product handles operational business context, so trust must be visible.

Security posture:

- Auth required for mutations.
- D1 persisted audit events.
- Source citations for generated claims.
- Human edits preserved.
- External providers behind explicit modes.
- Mock/cached mode for demo reliability.

Future requirements:

- Workspace-level authorization.
- Per-source access controls.
- PII-aware redaction.
- Provider data retention controls.
- Aikido scan and screenshot for side challenge.

## Non-Goals

Do not position Context Surgeon as:

- A chatbot.
- A generic document search tool.
- A full ERP replacement.
- A fully autonomous property manager.
- A legal decision maker.
- A graph visualization product.

Do not spend hackathon time on:

- Broad integrations before the core demo is excellent.
- Fancy graphs without operational payoff.
- Voice side quests before the product records well.
- Overly complex onboarding.

## Open Questions

1. Which Firebase project should own production auth: existing Falconn Firebase or a new Context Surgeon project?
2. Should the hackathon demo allow public sign-up, or should we seed a judge/demo account?
3. Should live provider calls be shown during judging, or should they be pre-cached with visible provider badges?
4. Should the first commercial wedge be property handover, active incident management, or agent pre-flight checks?
5. Should the Qontext export be framed as integration-ready JSON or as a virtual file system product surface?

## Product Owner Decision Log

- Build Context Surgeon first; do not dilute effort with Peec/Hera until the main loop records well.
- Treat Fact Patch as the signature primitive.
- Use Cloudflare D1 for persisted demo state because the app is already deployed on Cloudflare Workers.
- Use Firebase Auth for live workbench mutations.
- Keep mock-first execution so demo reliability does not depend on live providers.
- Make the landing public and the workbench mutations authenticated.
- Optimize for Buena/Qontext track fit before side prizes.
