# Context Surgeon PRD

## Document Purpose

This is the persistent product reference for the main Big Berlin Hack submission. Future sessions should read this file first, then `context-surgeon-feature-spec.md`, before making product or implementation decisions.

## Product Summary

Context Surgeon is an AI context compiler for property management. It turns scattered property data from emails, PDFs, CSVs, scanned notes, vendor messages, contracts, and meeting minutes into a living, agent-readable property context file system.

The core primitive is `Fact Patch`: when new information arrives, the system extracts only relevant facts, identifies changed or contradictory facts, proposes a minimal markdown diff, preserves human edits, and links every fact to source evidence.

## Hackathon Positioning

Primary track fit:

- Buena: The Context Engine
- Qontext: structured context base / virtual file system / graph

Secondary fit:

- Wildcard
- Aikido side challenge, via security scan and secure agent-context design
- Pioneer/Fastino side challenge, if the extraction pre-pass uses Pioneer/GLiNER2 meaningfully

Required partner technologies:

- Google DeepMind / Gemini: structured extraction, summarization, conflict reasoning, patch explanation
- Tavily: source crawling, external verification, enrichment, extraction from public pages
- Pioneer / Fastino / GLiNER2: schema-first entity/fact extraction pre-pass or classification

Optional partner technologies:

- Entire: agent-human provenance and workflow handoff story
- Gradium: voice briefing over context incidents
- Lovable: UI scaffolding only if useful
- Aikido: side challenge scan and screenshot, not counted toward the 3 required partner technologies

## One-Line Pitch

Agents fail when their context is stale, contradictory, or unverifiable. Context Surgeon fixes the context before agents act on the business.

## Strongest Finalist Pitch

Repomix made codebases promptable. Context Surgeon makes property portfolios operable by agents, with every fact traceable and every update patched instead of regenerated.

## Problem

Property management runs on context:

- Who owns the building?
- Which tenant issue is still open?
- What did the last owners' assembly decide?
- Which vendor is approved for emergency work?
- What invoices or reserves are relevant?
- Which facts are stale, disputed, or only known by one property manager?

Today, this context is scattered across ERPs, Gmail, Slack, Google Drive, scanned PDFs, CSV exports, meeting minutes, vendor quotes, and employee memory. AI agents must reconstruct reality every time they act.

That fails in four ways:

1. Context is incomplete: the agent misses an important source.
2. Context is contradictory: multiple sources disagree.
3. Context is stale: old facts remain in summaries.
4. Context updates are destructive: regenerating a whole markdown file overwrites human edits and wastes tokens.

## Target User

Primary user:

- Property manager handling multiple buildings, tenants, owners, vendors, and recurring operational issues.

Secondary user:

- Operations lead at a property-management company onboarding a newly acquired property portfolio.
- AI-agent builder integrating with property-management workflows.
- Qontext/Buena-style platform team that needs reliable context artifacts for downstream agents.

## Core Use Case

A property-management company acquires or takes over a building with messy historical context. Context Surgeon ingests the archive and compiles a property memory:

- `context.md`: dense building summary for agents
- `facts.jsonl`: structured fact ledger with source provenance
- `open_risks.md`: unresolved issues, contradictions, missing facts
- `vendor_history.md`: vendors, quotes, approvals, invoices
- `accounting_flags.md`: unusual transactions, reserves, unpaid invoices
- `source_map.json`: evidence references by file, page, row, quote, or character span

Then, when a new email arrives, the system produces a Fact Patch instead of regenerating the whole context.

## Demo Scenario

Property: `Sonnenallee 44, 12045 Berlin`

Messy initial archive:

- WEG meeting minutes
- Rental contract excerpt
- Tenant complaint email
- Vendor quote
- Maintenance invoice
- Bank/accounting CSV
- Old property manager handover note
- WhatsApp-style vendor update

Key story:

1. Initial context says roof leak is open and repair quote is pending.
2. Human adds a manual note in `context.md`.
3. New email arrives: roof quote was rejected; emergency temporary sealing was approved; owner approval threshold changed; one tenant move-out date changed.
4. Context Surgeon extracts new facts.
5. It supersedes stale facts, opens one contradiction, and proposes a minimal patch.
6. The human note remains untouched.
7. Downstream action plan changes and cites source evidence.

Killer demo question:

> What should the property manager do today, and why?

Expected answer:

- Dispatch approved emergency vendor for temporary sealing.
- Ask owner board to confirm permanent repair budget.
- Notify affected tenant with precise status.
- Reconcile invoice/reserve mismatch.
- Keep roof issue open until permanent repair is approved.

Every action must link back to one or more facts and sources.

## Product Principles

1. Context is compiled, not chatted with.
2. Facts are first-class objects.
3. Markdown is the visible artifact; `facts.jsonl` is the source of truth.
4. Human edits are sacred.
5. Every generated claim must cite a source.
6. Ambiguity should be surfaced, not hidden.
7. The system should patch surgically instead of regenerating whole files.

## Jobs To Be Done

When a property manager inherits a messy building archive, they want to quickly understand what is true, disputed, urgent, and actionable so they can respond without relying on tribal memory.

When a new source arrives, they want the building context updated without losing manual notes or accidentally reviving stale information.

When an AI agent prepares to act, it needs a compact, source-grounded context artifact and a signal about whether the context is safe enough to use.

## MVP Scope

Must have:

- Load demo data from local files.
- Parse TXT/email, CSV, PDF text, and DOCX or markdown-like notes.
- Create normalized source documents and chunks.
- Extract property entities and operational facts.
- Track source provenance at quote/page/row level.
- Resolve obvious duplicate entities.
- Detect deterministic conflicts.
- Generate a property virtual file system.
- Add generated-block anchors to markdown.
- Preserve manual edits outside generated blocks.
- Propose unified diffs for context updates.
- Show source -> facts -> conflicts -> markdown -> patch flow in UI.
- Export Qontext-ready JSON.
- Include README and setup instructions.

Should have:

- Gemini live extraction and explanation.
- Tavily enrichment/verification for public/vendor/company info.
- Pioneer/GLiNER2 extraction or classification adapter with fallback.
- MCP-style tool interface.
- Context Health Score.
- Audit log.

Could have:

- Gradium voice briefing for context incidents.
- Entire workflow handoff/provenance integration.
- Browser upload UX.
- Side-by-side before/after agent answer.
- Aikido scan screenshot in repo docs.

Will not build during hackathon:

- Real Gmail/Drive/ERP integrations.
- Production OCR for scanned documents.
- Full graph database.
- Multi-user auth and permissions.
- Real-time collaborative editing.
- Production-grade data privacy or compliance layer.
- Fully automated legal/property decisions.

## Success Criteria

Submission success:

- Public GitHub repo exists.
- README explains setup, APIs, partner tech, architecture, and demo flow.
- 2-minute video clearly demonstrates the core loop.
- Project uses at least 3 partner technologies.
- Demo can run locally from a reset command or with cached data.

Product success:

- A judge can understand the problem in 20 seconds.
- A judge can see the difference between RAG and context compilation.
- A judge can see fact-level provenance.
- A judge can see a minimal patch that preserves human edits.
- A judge can see why this is valuable to Buena and Qontext.

Technical success:

- Context generation is deterministic enough for demo.
- Patch algorithm has tests.
- Conflict detection has seeded examples.
- External APIs have cached/mock fallbacks.
- Demo does not depend on fragile live network calls.

## North Star Metric

Percentage of downstream agent actions that are supported by current, non-conflicting, source-cited facts.

Hackathon proxy:

- Context confidence improves from an initial score to a post-repair score.
- Blocked risky actions are visible.
- Number of stale facts superseded is visible.
- Number of preserved human edits is visible.

## Product Metrics

For demo:

- Sources ingested
- Facts extracted
- Entities resolved
- Conflicts detected
- Facts patched
- Files updated
- Human edits preserved
- Downstream actions changed
- Source citations attached

For future product:

- Time to compile a new property context
- Manual review time per source
- Percentage of facts with accepted provenance
- Context freshness by section
- Contradiction rate by source type
- Agent error reduction after context pre-flight

## User Experience Requirements

The UI should be dense, operational, and trust-oriented. It should feel like a context operations console, not a marketing landing page.

Primary views:

- Source Ingestion
- Fact Ledger
- Entity/Property Graph
- Conflicts
- Virtual File System
- Patch Review
- Agent Context Check

Important UI moments:

- Source quote highlighted when a fact is selected.
- Conflict shows side-by-side evidence.
- Markdown file shows generated blocks and human notes.
- Patch diff clearly marks additions, removals, unchanged human content.
- Context Health Score changes after repair.

## Primary Workflow

1. Load demo dataset.
2. Extract facts.
3. Review property profile.
4. Inspect open conflicts.
5. Generate property context VFS.
6. Add a human note to `context.md`.
7. Ingest new email.
8. Review Fact Patch.
9. Apply patch.
10. Ask agent-context question.
11. Show answer with citations and changed actions.

## Risks

Risk: project looks like another RAG chatbot.
Mitigation: avoid chatbot-first UI. Lead with fact ledger, VFS, conflicts, and patch diffs.

Risk: provenance is shallow.
Mitigation: store source quotes, file IDs, page numbers, row numbers, and chunk offsets.

Risk: surgical patching feels fake.
Mitigation: implement real generated-block anchors and tests.

Risk: live model/API calls fail.
Mitigation: use cached extraction outputs and mock adapters.

Risk: too broad across Buena and Qontext.
Mitigation: make demo Buena-specific; explain Qontext as export/context-base compatibility.

Risk: property-management domain data feels unrealistic.
Mitigation: use German terms, WEG minutes, vendor approvals, tenant complaints, owner thresholds, reserves, and invoices.

## Open Questions

- Does Buena provide sample property-management data during the event?
- Does Qontext provide an API/MCP endpoint usable during the hackathon?
- Is Pioneer/GLiNER2 accessible quickly enough for real integration?
- Does Tavily extraction cover enough web/PDF cases for live demo?
- Is Aikido screenshot required in submission or just side challenge proof?

If access is unclear, build adapter interfaces and cached provider outputs first.

