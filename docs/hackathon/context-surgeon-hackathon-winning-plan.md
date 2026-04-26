# Context Surgeon Hackathon Winning Plan

## Purpose

This document converts the Big Berlin Hack manual into a concrete winning plan for Context Surgeon. It should be read before final product polish, README work, video recording, and submission.

## Hard Constraints

Hackathon deadline:

- Competition opt-in / submission deadline: Sunday, April 26, 2026 at 14:00 Berlin time.
- Finalists announced: Sunday, April 26, 2026 at 15:00.
- Finalist pitches: Sunday, April 26, 2026 at 15:15.
- Award ceremony: Sunday, April 26, 2026 at 16:30.

Submission requirements:

- Public GitHub repository.
- Comprehensive README.
- Clear documentation of APIs, frameworks, and tools used.
- 2-minute demo video with explanation and live walkthrough.
- Minimum 3 partner technologies.
- Project newly created during the hackathon.
- Team max 5 people; we are solo.

## Winning Thesis

The strongest winning route is not to compete as "another AI app." Context Surgeon should be positioned as infrastructure for reliable agents.

The jury needs to believe three things:

1. The problem is real and expensive: operational agents fail when context is stale, contradictory, or unverifiable.
2. The product is materially different from RAG: it compiles durable context artifacts, fact ledgers, source spans, conflicts, and patches.
3. The demo is not fake: the system has typed facts, generated files, diffs, D1 persistence, Firebase-protected mutations, and a Qontext-ready export.

## Track Strategy

### Primary Track: Buena - The Context Engine

Why we fit:

- Buena asks for one Context Markdown File per property.
- They explicitly care about dense, structured context traced to source.
- They explicitly call out surgical updates that do not destroy human edits.
- Their challenge examples match our domain: ownership, assembly decisions, roof leak status, heating contractor/vendor, scattered ERP/email/docs.

What to show:

- `context.md` for Sonnenallee 44.
- Generated-block anchors.
- Manual note preservation.
- New owner email causing Fact Patch.
- Patch updates only relevant sections.
- Agent action plan changes after patch.

Exact line:

> Buena asked for CLAUDE.md for a building, plus it writes itself. Context Surgeon is that, with source spans, conflict detection, and Fact Patch so human edits survive.

### Co-Primary Track: Qontext - Context Base

Why we fit:

- Qontext asks for a virtual file system plus graph.
- They emphasize inspectability, references, fact-level provenance, automatic updates, and human review where ambiguity matters.
- They explicitly say this is not dumping markdown into folders or building a documentation chatbot.

What to show:

- VFS files.
- `facts.jsonl`.
- `qontext_ingest.json`.
- Source span/provenance mapping.
- Conflict review.
- Export endpoint.
- Audit trail.

Exact line:

> Qontext is the reusable context base. Context Surgeon is the compiler and review surface that turns messy operational state into an inspectable VFS and fact graph.

### Wildcard

Wildcard is a fallback if the product is finalist-grade but not selected by Buena/Qontext.

What to emphasize:

- Context compiler category creation.
- Generalizable beyond property data.
- Clear "not RAG" technical primitive.

## Partner Technology Strategy

Minimum partner requirement is three. Aikido does not count toward the minimum according to the manual, so do not rely on it for compliance.

### Required Partner 1: Google DeepMind / Gemini

Product job:

- Structured extraction from chunks into typed facts.
- Conflict explanation.
- Agent pre-flight plan and rationale.

Demo proof:

- Provider badge.
- API route contract.
- README section.
- If key is available, run one live extraction or context check.
- If key is unavailable, show cached/mock mode and explain the same contract.

### Required Partner 2: Tavily

Product job:

- External enrichment/verification for vendor, property, or public evidence.
- Web research layer for sources outside the archive.

Demo proof:

- Provider route.
- Cached enrichment artifact or visible enrichment card.
- README section explaining Tavily's job.

### Required Partner 3: Pioneer / Fastino

Product job:

- Document classification and entity/fact extraction pre-pass.
- Replace or reduce a general LLM extraction call.
- Potential GLiNER2 usage: extract German/English property entities from chunks.

Demo proof:

- Provider route.
- Classification output in source list or pipeline.
- README section explaining how Pioneer avoids expensive all-purpose extraction.

### Optional Partner 4: Aikido

Product job:

- Security scan for side challenge.
- Evidence that auth/API/persistence product was built with security in mind.

Submission proof:

- Aikido account.
- GitHub connected.
- Repo scanned.
- Screenshot with issue categories and count.

### Optional Partner 5: Entire

Product job:

- Agent-human collaboration/provenance handoff.

Only attempt if core submission is recordable.

### Do Not Add Unless Core Is Finished

- Gradium voice.
- Hera video.
- Peec side project.

Those may be good side bets, but they can dilute the main finalist path.

## Product Bets

### Bet 1: Fact Patch Is the Signature Moment

Objective:

Make judges remember the patch, not just the UI.

Success threshold:

- The 2-minute video visibly shows the manual note before and after patch.
- The diff is readable.
- The explanation uses "patch instead of regenerate."

Failure threshold:

- Judges think this is just a markdown generator.

### Bet 2: Provenance Makes It Serious

Objective:

Make every claim feel inspectable.

Success threshold:

- Fact ledger shows quote, filename, confidence, and fact ID.
- Conflicts show side-by-side evidence.
- Export contains facts and source spans.

Failure threshold:

- Judges think the system is hallucinating summaries.

### Bet 3: Agent Pre-Flight Shows Business Value

Objective:

Connect context compilation to action.

Success threshold:

- Before/after agent check changes after patch.
- Ready/blocked actions are visible.
- Actions cite facts.

Failure threshold:

- Judges see a data tool but not an agent-enabling product.

## Pre-Selection Strategy

Stage 1 uses creativity, technical complexity, and bonus points for partner tech.

Creativity proof:

- "Context compiler" framing.
- Fact Patch primitive.
- CLAUDE.md for buildings.

Technical complexity proof:

- Typed fact model.
- Source spans.
- Conflict detector.
- Markdown VFS.
- Unified diff.
- Human edit preservation.
- D1 persistence.
- Firebase ID-token verification.
- Provider adapter contracts.

Partner tech proof:

- Gemini, Tavily, Pioneer/Fastino listed with concrete jobs.
- Provider routes exist.
- README documents mode and fallback.

## Finalist Stage Strategy

If selected, the 5-minute presentation should be mostly live demo.

Structure:

1. 30 seconds: context problem.
2. 30 seconds: product thesis.
3. 60 seconds: compile sources into facts/VFS.
4. 60 seconds: conflicts/provenance.
5. 75 seconds: human note + Fact Patch.
6. 45 seconds: agent pre-flight delta.
7. 30 seconds: architecture and partner tech.
8. 30 seconds: why this becomes platform infrastructure.

Do not spend finalist time on:

- Account creation.
- Setup.
- Long explanations of every file.
- Side projects.
- Reading README aloud.

## Submission Package

### Public Repo

Must include:

- Source code.
- README.
- Docs pack.
- Demo data.
- Tests.
- Cloudflare config.
- D1 migration.

Must not include:

- Secrets.
- Firebase debug logs.
- API keys.
- Private user data.

### README Minimum Content

Must explain:

- What Context Surgeon is.
- Why it fits Buena and Qontext.
- How to run locally.
- How to verify.
- What APIs exist.
- What partner technologies are used.
- How mock/live provider modes work.
- How D1/Firebase are used.
- Demo flow.

### 2-Minute Video

Must show:

- Product explanation.
- Live walkthrough.
- Sources.
- Facts.
- Conflicts.
- Human note.
- Fact Patch.
- Agent Check.
- Qontext export or VFS.

## Submission Timeline

Assuming current date is Saturday, April 25, 2026 in Berlin.

### Saturday Remaining Work

P0:

- Finish Firebase production auth if approved.
- Polish workbench step feedback.
- Update README submission section.
- Verify deployed production flow.

P1:

- Add visible partner-tech proof cards/status.
- Add cached Tavily/Pioneer/Gemini outputs if real keys are not available.

### Sunday Morning

Before 11:00:

- Run full release checklist.
- Record first full demo video.
- Watch it once for readability.
- Fix only blockers.

11:00-12:30:

- Record final 2-minute video.
- Prepare public GitHub repo.
- Confirm README and docs are present.

12:30-13:30:

- Lunch if needed, but keep laptop ready.
- Submit project.
- Verify submission form received correct links.

Hard stop:

- Submit before Sunday, April 26, 2026 at 14:00 Berlin time.

### Sunday After Submission

14:00-15:00:

- Prepare finalist pitch.
- Reset production workspace.
- Keep signed-in browser ready.

15:00 onward:

- If finalist, use the 5-minute script.

## Demo Account Strategy

Preferred:

- Create a Firebase Auth demo account.
- Stay signed in before recording.
- Do not show credentials in video.
- Mention "workspace actions are Firebase-protected" only once.

Fallback:

- If Firebase secrets cannot be deployed, show read-only state and explain protected API routes are implemented.

Do not:

- Spend video time creating an account.
- Show Firebase console.
- Show secret values.

## Partner-Tech Proof Strategy

Even if live provider keys are unavailable, the product should show integration readiness:

- Provider mode indicator.
- Provider route contracts.
- Cached provider outputs.
- README with concrete product job per partner.
- Architecture section listing where each partner sits.

Best-case live demo:

- Gemini live context-check.
- Tavily live enrichment.
- Pioneer live classification.

Acceptable fallback:

- Mock-first deterministic pipeline with provider contracts and cached outputs.

## Side Challenge Strategy

### Aikido

Worth doing after repo is public.

Why:

- Security scan is compatible with our auth/persistence story.
- Cash prize is meaningful.
- Does not require product scope creep.

### Viral Video Content Challenge

Only attempt if product video is already done.

Content angle:

> "RAG is not enough for agents. Watch a building context file patch itself without deleting a human note."

Keep it short and visually focused on the diff.

### Fastino / Pioneer

Worth doing if Pioneer can be shown as classification/extraction pre-pass.

Do not claim fine-tuning unless it actually happened.

## Kill Criteria

Cut immediately if time pressure rises:

- Graph visualization.
- Voice.
- Real uploads.
- Side project.
- Complex auth onboarding.
- Extra landing sections.

Do not cut:

- Source citations.
- Conflict view.
- Fact Patch.
- Human note preservation.
- Agent Check.
- README.
- 2-minute video.

## Final Submission Claim

Use this concise claim in forms and pitch:

> Context Surgeon is a source-grounded context compiler for property management. It turns scattered building data into a living Markdown/VFS context base, detects conflicts, preserves human edits, and applies surgical Fact Patches when new sources change operational truth. It uses Gemini for structured reasoning, Tavily for enrichment, Pioneer/Fastino for extraction/classification pre-pass, Cloudflare D1 for persisted workspace state, and Firebase Auth for protected mutations.

