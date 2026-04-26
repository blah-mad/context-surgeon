# Context Surgeon Demo Script

## Purpose

This script is for the 2-minute submission video and the 5-minute finalist pitch. The goal is to make the product legible immediately and make Fact Patch the memorable moment.

## Core Message

Agents do not fail only because the model is weak. They fail because the context is stale, contradictory, or unverifiable. Context Surgeon fixes the context before agents act on the business.

## Two-Minute Video Script

Target length: 115 seconds.

### 0:00-0:12 - Problem

Say:

> Property management runs on context. Before an agent can answer a tenant, approve a vendor, or escalate to an owner board, it needs to know what is actually true about one building.

Show:

- Landing hero.
- Scroll toward workbench.

### 0:12-0:25 - Messy Sources

Say:

> Here is Sonnenallee 44 in Berlin. The context is scattered across tenant emails, WEG minutes, vendor quotes, invoices, and old handover notes.

Show:

- Sign in if needed before recording, or start already signed in.
- Reset demo.
- Sources view.

### 0:25-0:42 - Compile

Say:

> Context Surgeon does not start with a chatbot. It compiles the archive into source-grounded facts and a living virtual file system for agents.

Action:

- Click Compile.
- Show Facts view.
- Hover or point at source quote.

Must show:

- Fact IDs.
- Predicate/value.
- Source quote.
- Confidence.

### 0:42-0:58 - Conflicts

Say:

> It catches contradictions before agents act. Here, the roof issue is both open and closed, and the repair amount appears as both EUR 4,200 and EUR 4,800.

Action:

- Open Conflicts view.

Must show:

- Side-by-side evidence.
- Source filenames.
- Severity badge.

### 0:58-1:12 - Human Note

Say:

> A property manager can still add operational judgment. This manual note says the tenant prefers email updates before 18:00. Regenerating context must not erase it.

Action:

- Click Add Human Note.
- Open Files view.
- Show `context.md`.

Must show:

- Manual note visible.

### 1:12-1:35 - Fact Patch

Say:

> Now a new owner email arrives. It rejects the old permanent quote and approves emergency sealing. Instead of regenerating the whole file, Context Surgeon proposes a Fact Patch.

Action:

- Click Ingest New Email.
- Open Patch Review.

Must show:

- Unified diff.
- Changed facts.
- Preserves human edits.
- Patch pending.

### 1:35-1:52 - Apply and Agent Delta

Say:

> The patch updates only the affected generated blocks. The human note survives. Now the agent plan changes: it can dispatch the emergency vendor instead of waiting on a rejected quote.

Action:

- Click Apply Patch.
- Open Agent Check.

Must show:

- Before/after context health.
- Ready/blocked actions.
- Fact citations.

### 1:52-2:00 - Close

Say:

> This is the context layer Buena and Qontext are describing: living property memory, fact-level provenance, human-edit preservation, and agent pre-flight checks.

Show:

- Qontext export badge/button or architecture section.

## Five-Minute Finalist Pitch

### 0:00-0:30 - Hook

> Everyone is trying to build better agents. But in operational businesses, the bottleneck is not only the agent. It is the context. If the context is stale or contradictory, a smarter agent just makes a wrong decision more confidently.

### 0:30-1:00 - Product

> Context Surgeon is a context compiler for property management. It turns messy source material into a living property memory: Markdown files for humans and agents, a fact ledger for machines, source spans for evidence, and a health check before agents act.

### 1:00-2:00 - Demo Compile

Show:

- Sources.
- Facts.
- Conflicts.

Say:

> This is the first difference from RAG. We do not retrieve snippets at runtime and hope the prompt is good. We compile durable context ahead of action.

### 2:00-3:15 - Demo Fact Patch

Show:

- Human note.
- New email.
- Patch diff.

Say:

> Regenerating context is dangerous because humans edit these files. Fact Patch updates only the generated sections that changed and preserves human edits.

### 3:15-4:10 - Demo Agent Check

Show:

- Agent Check.
- Context health.
- Action changes.

Say:

> This is the payoff. The agent plan changes because the context changed, and every action points back to source facts.

### 4:10-4:45 - Architecture

Say:

> The architecture is adapter-first. Gemini is the structured extraction and context-check slot, Tavily is the enrichment and verification slot, and Pioneer/Fastino is the source-classification slot. Production runs in live provider mode with cached fallbacks, while Cloudflare D1 persists workspace state and Firebase Auth protects production mutations.

Show:

- Architecture section or README architecture.

### 4:45-5:00 - Close

> Repomix made codebases promptable. Context Surgeon makes property portfolios operable by agents. Every fact traceable, every conflict visible, every update patched instead of regenerated.

## Demo Checklist

Before recording:

- Production site loads.
- Firebase Auth configured and signed in, or intentionally documented as unconfigured for this recording.
- Workspace reset to `loaded`.
- Browser zoom at 100%.
- No browser console errors.
- `/api/health` reports the expected `providerMode`, normally `mock`.
- `/api/health` reports `persistence: cloudflare-d1` in production.
- If Firebase is configured, `/api/health` reports `auth: firebase-auth`; otherwise it reports `auth: unconfigured`.
- Run through the full flow once before recording.

Do not show:

- Empty provider errors.
- Secret values.
- Firebase console.
- Cloudflare dashboard.
- Long loading states.

## Backup Script If Auth Is Not Configured

If Firebase production auth is not ready:

> The API mutation routes are built to require Firebase ID-token verification. For this recording, Firebase production secrets are not deployed, so the browser workbench runs the full compile, human-note, Fact Patch, and agent-check loop in public demo mode. Once the approved Firebase secrets are deployed, the same controls use protected D1-backed workspace mutations for signed-in users.

This is acceptable for the hackathon recording because the product loop remains end-to-end. The preferred investor-style demo is signed in and persisted.

## Accuracy Guardrails

Say:

> The provider routes are live/cached contracts. Tavily is verified live, Gemini has a live context-check proof with fallback, and Pioneer is key-configured while model-specific inference waits on the onsite model id.

Do not say:

- "Qontext generated this repository." The challenge explicitly does not require a Qontext account; Context Surgeon generates the context repository itself.
- "Pioneer ran custom model inference" unless the exact model id/endpoint is confirmed and verified.
- "Firebase production auth is deployed" unless `/api/health` reports `auth: firebase-auth`.
