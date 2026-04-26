# Context Surgeon Implementation Plan

## Purpose

This is the execution plan for building Context Surgeon. It must be read together with:

- `docs/hackathon/session-handoff.md`
- `docs/hackathon/context-surgeon-prd.md`
- `docs/hackathon/context-surgeon-feature-spec.md`
- `docs/hackathon/ai-visibility-video-agent-prd.md`

This plan reflects the current locked strategy:

- Main project: Context Surgeon / Bldg.md for Buena + Qontext.
- Side project: AI Visibility to Video Agent for Peec + Hera, only after Context Surgeon has a working demo loop.
- Deployment target: Cloudflare.
- Visual direction: hybrid Falconn console: warm Falconn palette and shell, with darker technical code/diff panels.
- Current production storage: Cloudflare D1.
- Current auth direction: Firebase Auth protects workspace mutations and export.

## Product Target

Build a polished, Cloudflare-deployable web app that demonstrates:

1. Messy property-management source ingestion.
2. Source-grounded fact extraction.
3. Conflict detection.
4. Markdown virtual file system generation.
5. Human edit preservation.
6. Surgical Fact Patch diff.
7. Agent context check with cited action plan.

The demo must make this obvious:

> Agents fail when their context is stale, contradictory, or unverifiable. Context Surgeon fixes the context before agents act on the business.

## Stack Decision

Use a single full-stack TypeScript app:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn-style primitives
- lucide-react icons
- Cloudflare deployment through OpenNext Cloudflare
- Bundled demo state for hackathon reliability
- Cloudflare D1 for persisted workspace snapshots and audit events
- Firebase Auth for mutation/export access control
- Cloudflare R2 only if binary uploads are added later
- Mock-first provider architecture with live adapters for Gemini, Tavily, and Pioneer/Fastino

Reasoning:

- Falconn already uses Next + React + Tailwind + OpenNext Cloudflare.
- A single app is faster than FastAPI + React for hackathon execution.
- Bundled demo state avoids Cloudflare persistence risk during the judging demo.
- Mock-first keeps the demo reliable while still allowing real partner integrations.

## Visual System

Use Falconn's visual DNA, adapted to an operational infrastructure console.

Base palette:

- Earth: warm dark brown for sidebar and dark technical panels.
- Copper: primary action, active state, patch highlight.
- Forest: success, verified context, source-backed facts.
- Cream: main background and readable surfaces.

Interaction tone:

- Dense, operational, serious.
- No marketing landing page as the first screen.
- No decorative hero.
- Use a fixed app shell with sidebar and compact top bar.
- Use technical panels for diffs, JSON, source spans, and generated markdown.

Core UI surfaces:

- Left sidebar: Sources, Facts, Conflicts, Files, Patch Review, Agent Check.
- Top bar: property scope, provider mode, context health, demo reset/load.
- Main content: task-first workbench.

Signature visual element:

- "Context Health" strip showing source coverage, conflict count, stale facts, and patch readiness.
- "Fact Patch" diff panel with copper additions/removals and preserved-human-edit indicator.

## Repository Structure

Recommended structure:

```text
app/
  api/
    demo/
    sources/
    facts/
    conflicts/
    vfs/
    patches/
    context-check/
  page.tsx
  layout.tsx
  globals.css

components/
  shell/
  sources/
  facts/
  conflicts/
  vfs/
  patches/
  agent-check/
  ui/

lib/
  db/
  demo-data/
  ingestion/
  extraction/
  conflicts/
  vfs/
  patches/
  providers/
  context-check/
  types/

demo_data/
  properties/
    sonnenallee-44/

docs/
  hackathon/
```

Keep all product strategy docs under `docs/hackathon/`.

## Cloudflare Architecture

Use Cloudflare Workers via OpenNext Cloudflare.

```text
DB = Cloudflare D1 database
SOURCE_BUCKET = Cloudflare R2 bucket
```

Environment variables:

```text
PROVIDER_MODE=mock
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
GEMINI_API_KEY=
TAVILY_API_KEY=
PIONEER_API_KEY=
```

Provider mode rules:

- `mock`: use cached demo outputs from repo/static fixtures.
- `live`: call real Gemini/Tavily/Pioneer adapters.
- If live provider fails, fall back to cached output and expose a non-blocking warning in the UI.

Cloudflare constraints:

- Do not depend on Python backend.
- Do not depend on local filesystem writes for deployed demo.
- Generated VFS is computed from bundled demo state and exportable/copyable in the UI.
- Demo data can be loaded from bundled JSON/text fixtures.
- Keep file upload optional; do not require R2 for MVP.

## Data Model

Implement TypeScript interfaces aligned with `context-surgeon-feature-spec.md`.

The current demo uses bundled fixtures plus Cloudflare D1 persistence. D1 stores the current workspace snapshot and audit events. The engine remains pure TypeScript so the demo can still be rebuilt deterministically.

## Core Demo Data

Property:

```text
Sonnenallee 44, 12045 Berlin
```

Required fixture files:

```text
demo_data/properties/sonnenallee-44/
  emails/
    001_tenant_roof_leak.txt
    002_owner_approval_threshold.txt
    003_vendor_quote_rejected_new_email.txt
  pdfs/
    2025_weg_minutes.txt
    vendor_quote_roof_repair.txt
  csvs/
    invoices.csv
    bank_movements.csv
    tenants.csv
  docs/
    old_manager_handover.md
    maintenance_log.md
  cached/
    extraction_result.json
    tavily_enrichment.json
    context_check_before.json
    context_check_after.json
```

Use `.txt` for PDF-like content at MVP stage. The UI may display them as PDF-like source types.

Seeded conflicts:

- Roof quote approved vs rejected.
- Roof issue closed vs open.
- Emergency approval threshold EUR 300 vs EUR 500.
- Invoice amount EUR 4,200 vs EUR 4,800.

## API Plan

Implement these app routes:

```http
POST /api/demo/reset
POST /api/demo/load
GET  /api/sources
GET  /api/sources/:id
GET  /api/facts
GET  /api/conflicts
POST /api/vfs/generate
GET  /api/vfs/files
GET  /api/vfs/files/:id
POST /api/vfs/files/:id/edit
POST /api/patches/propose
POST /api/patches/:id/apply
POST /api/patches/:id/reject
POST /api/context-check
```

API response convention:

```ts
type ApiSuccess<T> = { ok: true; data: T; warning?: string };
type ApiFailure = { ok: false; error: string; detail?: string };
```

## Implementation Phases

### Phase 0: Project Scaffold

Create the Next/Cloudflare app skeleton.

Deliverables:

- Next app running locally.
- Tailwind v4 configured.
- Falconn-inspired tokens in `globals.css`.
- OpenNext Cloudflare config.
- README draft.

Acceptance:

- `npm run dev` or equivalent starts the app.
- `npm run build` passes.
- Page renders app shell with placeholder workbench.

### Phase 1: Demo Data and Mock Backend

Implement fixture loading and deterministic mock provider outputs.

Deliverables:

- Sonnenallee 44 fixture files.
- Bundled TypeScript source/fact fixtures.
- Provider API contract routes.
- Cached extraction fixture.

Acceptance:

- Clicking "Load Demo" populates sources, chunks, facts, conflicts.
- UI shows source counts and processing timeline.

### Phase 2: Core Fact System

Implement facts, source spans, entity summaries, and conflicts.

Deliverables:

- Fact ledger view.
- Source evidence drawer.
- Conflict cards with side-by-side evidence.
- Context Health strip.

Acceptance:

- Each fact links to a source quote.
- Each seeded conflict is visible and understandable.
- Context Health reports conflict count and stale/blocked status.

### Phase 3: Markdown VFS

Generate property context files.

Deliverables:

- `context.md`
- `facts.jsonl`
- `open_risks.md`
- `vendor_history.md`
- `accounting_flags.md`
- `agent_brief.md`
- `source_map.json`
- `qontext_ingest.json`

Acceptance:

- Files are computed from the current fact ledger.
- UI shows file tree and markdown preview.
- Generated sections contain `cs:generated` anchors.
- Export/download works or copy-to-clipboard works.

### Phase 4: Surgical Fact Patch

Implement the real differentiator.

Deliverables:

- Editable `context.md`.
- Human note preservation.
- Patch proposal endpoint.
- Unified diff viewer.
- Apply/reject patch controls.
- Patch status and changed fact list.

Acceptance:

- Manual note outside generated blocks survives regeneration.
- Manual edit inside generated block creates patch conflict.
- New email updates only affected generated sections.
- UI displays `preserves_human_edits: true`.

### Phase 5: Agent Context Check

Show downstream agent value.

Deliverables:

- Before/after action plan.
- Citations for each recommendation.
- Blocked actions before repair.
- Context confidence delta.

Acceptance:

- Before patch, agent answer is blocked or constrained by conflicts.
- After patch, answer changes and cites updated facts.
- Demo question works:

```text
What should the property manager do today, and why?
```

### Phase 6: Live Partner Adapters

Add provider adapters without making demo fragile.

Deliverables:

- Gemini extraction/explanation adapter.
- Tavily enrichment adapter.
- Pioneer/Fastino extraction-hint adapter.
- Provider mode toggle via env.

Acceptance:

- Mock mode remains fully demoable.
- Live mode can run at least one real provider call if keys exist.
- README clearly documents partner tech use.

### Phase 7: Polish, Tests, Submission

Deliverables:

- Tests for patch engine and conflict detection.
- README with setup, architecture, partner tech, demo flow.
- Aikido scan screenshot if entering side challenge.
- 2-minute video script and recording checklist.

Acceptance:

- Build passes.
- Core demo can be completed in under 2 minutes.
- Public repo is understandable to judges.

## UI Flow

### Screen 1: Sources

Purpose:

Show messy property archive and source ingestion.

Elements:

- Demo load/reset buttons.
- Source type counts.
- Source table.
- Processing status.
- Selected source preview.

### Screen 2: Facts

Purpose:

Show source-grounded property memory.

Elements:

- Fact ledger table.
- Entity filters.
- Confidence badges.
- Source evidence drawer.
- Fact type chips.

### Screen 3: Conflicts

Purpose:

Show why context needs surgery.

Elements:

- Conflict list.
- Severity badges.
- Side-by-side evidence.
- Suggested resolution.
- Blocked downstream actions.

### Screen 4: Files

Purpose:

Show generated VFS.

Elements:

- File tree.
- Markdown preview/editor.
- Fact/source references.
- Qontext export preview.

### Screen 5: Patch Review

Purpose:

Show surgical update.

Elements:

- New source event.
- Changed facts.
- Unified diff.
- Preserved human note indicator.
- Apply/reject buttons.

### Screen 6: Agent Check

Purpose:

Show downstream value.

Elements:

- Demo question.
- Before/after answer.
- Context confidence score.
- Cited action plan.
- Remaining uncertainty.

## What We Need From User

Required before live provider integration:

- Gemini API key or Google hackathon account access.
- Tavily API key.
- Pioneer/Fastino access or onboarding/API key.

Required before Cloudflare deployment:

- Cloudflare account access.
- Cloudflare project name preference.
- Whether to deploy under a custom domain or temporary workers/pages URL.

Useful for UI quality:

- Confirmation that the Falconn warm palette is acceptable for this product.
- Any specific screenshots/components from Falconn or Weavz that should be copied closely.

Useful for submission:

- GitHub repo name and owner.
- Whether the repo should be public immediately or made public right before submission.
- Which tracks to select if the submission form only allows limited choices.

Defaults if unavailable:

- Use mock provider mode for demo.
- Deploy to temporary Cloudflare Pages/Workers URL.
- Use `context-surgeon` as repo/project name.
- Select Buena first, Qontext second if multiple track selection is allowed.

## Side Project Trigger

Start AI Visibility to Video Agent only after all are true:

- Patch demo works end-to-end.
- README has setup and partner-tech sections.
- 2-minute Context Surgeon video can be recorded.
- Cloudflare deployment is working or clearly deployable.

Maximum side-project budget:

- 8 hours.

Side project stack:

- Same Next/Cloudflare app or a route group inside same repo.
- Peec MCP/seeded Peec data.
- Tavily evidence.
- Gemini creative brief.
- Hera MCP/API video prompt/export.

## Test Plan

Core automated tests:

- Human notes outside generated blocks survive regeneration.
- Edited generated blocks produce patch conflict.
- Same issue with closed/open status produces conflict.
- Invoice amount mismatch produces conflict.
- Source quote maps to source span.
- VFS file generation includes anchors.

Manual demo tests:

- Load demo data.
- Inspect source evidence.
- Generate files.
- Add human note.
- Propose patch from new email.
- Apply patch.
- Run agent context check.
- Confirm mock mode works without any API keys.

Deployment checks:

- Local dev works.
- Production build works.
- Cloudflare preview deploy works.
- Mock mode works without secrets.
- Live mode does not expose API keys to client.

## Cut Lines

Cut first:

- Graph visualization.
- Real PDF parsing.
- R2 uploads.
- Real MCP server.
- Gradium voice.
- Entire integration.

Never cut:

- Fact provenance.
- Conflict detection.
- VFS files.
- Generated-block anchors.
- Human edit preservation.
- Patch diff.
- Cached/mock provider mode.
