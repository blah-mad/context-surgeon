# Big Berlin Hack Submission Pack

This folder is the durable reference for the Context Surgeon submission. It is written for handoff, judging prep, and last-mile verification.

## Submission Snapshot

Project: **Context Surgeon**

One-liner:

> A fact-patched context compiler for property management that turns messy building artifacts into source-grounded agent memory.

Primary tracks:

- Buena: The Context Engine
- Qontext: structured company context base / virtual file system / graph

Winning thesis:

> Everyone is building agents. Agents fail when their context is stale, contradictory, or unverifiable. Context Surgeon fixes the context before agents act on the business.

Demo property:

- `Sonnenallee 44, 12045 Berlin`

## Read Order

1. `../../README.md`
2. `context-surgeon-demo-script.md`
3. `context-surgeon-release-checklist.md`
4. `session-handoff.md`
5. `context-surgeon-prd.md`
6. `context-surgeon-feature-spec.md`
7. `context-surgeon-implementation-plan.md`
8. `context-surgeon-product-strategy.md`
9. `context-surgeon-execution-backlog.md`

The AI Visibility to Video Agent docs are secondary and should only be used if Context Surgeon is already submission-ready:

- `ai-visibility-video-agent-prd.md`
- `ai-visibility-video-agent-feature-spec.md`

## Finalist-Ready Story

Problem:

- Property managers make decisions from fragmented context: emails, WEG minutes, invoices, vendor quotes, handover notes, and owner updates.
- Agent products are brittle when the underlying property memory is stale, contradictory, or missing provenance.

Product:

- Context Surgeon compiles messy artifacts into a living property memory.
- Every fact carries source evidence.
- Contradictions are shown before an agent acts.
- Generated Markdown files are usable by humans and agents.
- Fact Patch updates only affected generated blocks and preserves human notes.

Demo payoff:

- A new owner email rejects the old permanent quote and approves emergency sealing.
- The system proposes a minimal patch instead of regenerating the whole context.
- The agent plan changes from blocked/waiting to dispatching the emergency vendor.

## Architecture Summary

```text
Source artifacts
  -> normalize and chunk
  -> classify relevance
  -> extract fact ledger with source spans
  -> detect conflicts
  -> generate Markdown VFS + JSON exports
  -> preserve human notes
  -> ingest new source
  -> propose Fact Patch
  -> apply patch
  -> run agent context check
```

Runtime components:

| Component | Responsibility |
|---|---|
| Next.js app | Workbench UI, landing surface, and API routes |
| `lib/context-surgeon` | Pure TypeScript engine for ingestion, facts, conflicts, VFS, patching, and workflow |
| Cloudflare Workers / OpenNext | Deployment target |
| Cloudflare D1 | Persisted workspace and audit trail when deployed |
| Firebase Auth | Production gate for API workspace mutation and export routes |
| Provider adapter routes | Live/cached Gemini, Tavily, and Pioneer/Fastino contracts |

## Partner Technology Jobs

| Partner | Job to explain to judges | Accuracy note |
|---|---|---|
| Buena | Domain fit: property context engine before property agents act | Core product is built around this use case. |
| Qontext | VFS, fact graph, provenance, and exportable context base | No Qontext account is used or needed; the product solves the challenge directly from the supplied dataset. |
| Gemini | Structured extraction and context-check reasoning | Live key configured for context-check proof with cached fallback. |
| Tavily | External enrichment and public/vendor verification | Live search enrichment configured with cached fallback. |
| Pioneer / Fastino / GLiNER2 | Source relevance, document classification, and extraction hints | Pioneer key configured; deterministic classification remains safe until model id is confirmed. |
| Firebase | Authenticated production API mutations | Public browser demo works without secrets; persisted API mutations require approved Firebase runtime secrets. Do not deploy secrets without user approval. |
| Cloudflare | Production hosting, D1 persistence, edge-ready API | Configured in the repo; verify deployment before claiming production status. |

## Public API List

| Method | Route | Demo use |
|---|---|---|
| `GET` | `/api/health` | Show runtime, provider mode, persistence, auth status |
| `GET` | `/api/auth/config` | Check whether Firebase is configured |
| `GET` | `/api/workspace` | Load current read-only workspace |
| `POST` | `/api/workspace/reset` | Reset demo, Firebase protected |
| `POST` | `/api/workspace/action` | Run compile, human-note, ingest-email, apply-patch; Firebase protected |
| `GET` | `/api/workspace/export` | Download Qontext-ready export, Firebase protected |
| `GET` | `/api/qontext/proof` | Show supplied Qontext dataset proof, VFS plan, graph contract |
| `POST` | `/api/providers/gemini/extract` | Show Gemini extraction adapter contract |
| `POST` | `/api/providers/gemini/context-check` | Show Gemini context-check adapter contract |
| `POST` | `/api/providers/tavily/enrich` | Show Tavily enrichment adapter contract |
| `POST` | `/api/providers/pioneer/classify` | Show Pioneer/Fastino classification adapter contract |

UI note: the deployed workbench also has a public local-first demo path. Without Firebase, judges can
run the full workflow in browser state and download `Qontext export preview`; signed-in users use the
protected D1-backed API routes.

## Local Setup And Verification

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Required verification:

```bash
pnpm lint
pnpm test
pnpm build
pnpm cf:build
```

Useful smoke checks:

```bash
curl -s http://localhost:3000/api/health | jq
curl -s http://localhost:3000/api/workspace | jq '{phase, propertyName, facts: .current.facts|length, conflicts: .current.conflicts|length}'
curl -s -X POST http://localhost:3000/api/providers/pioneer/classify | jq '{provider, mode, sources: .sourceRelevance|length}'
```

## Environment Truth

Default demo mode:

```bash
PROVIDER_MODE=mock
```

Reserved live-provider variables:

```bash
GEMINI_API_KEY=
TAVILY_API_KEY=
PIONEER_API_KEY=
PROVIDER_MODE=live
```

Live provider mode is deployed. Tavily live search is verified. Gemini live route is robust with cached fallback. Pioneer key is configured, but model-specific inference needs the onsite model id before claiming a real Pioneer inference call.

Firebase variables:

```bash
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
```

Firebase production secrets require explicit user approval before deployment.

## Demo Flow

Use `context-surgeon-demo-script.md` for the exact spoken script.

Required on-screen beats:

1. Reset or start from the loaded Sonnenallee 44 workspace.
2. Show messy sources.
3. Compile.
4. Show fact IDs, source quotes, and confidence.
5. Show conflicts with evidence.
6. Add or reveal the human note in `context.md`.
7. Ingest the new owner email.
8. Show the Fact Patch diff and changed facts.
9. Apply the patch.
10. Show the agent context check before/after.
11. Mention Qontext-ready export and partner adapter routes.

## Submission Checklist

- [ ] Public GitHub repository is available.
- [ ] README has setup, architecture, API list, verification, demo flow, and partner technology jobs.
- [ ] `docs/hackathon/` is included.
- [ ] Demo video is under 2 minutes.
- [ ] Demo includes Fact Patch and human-edit preservation.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] `pnpm cf:build` passes.
- [ ] `/api/health` returns `ok: true`.
- [ ] Firebase status is represented accurately as configured or unconfigured.
- [ ] Live provider status is represented accurately as mock/cached unless live keys are connected.
- [ ] No secrets are committed or shown in video.
- [ ] Track and partner technology usage is explicit in submission text.

## Files In This Pack

| File | Purpose |
|---|---|
| `context-surgeon-demo-script.md` | 2-minute video script and 5-minute finalist pitch |
| `context-surgeon-release-checklist.md` | Pre-submit operational checklist |
| `session-handoff.md` | Current state and next-session handoff |
| `context-surgeon-prd.md` | Product requirements |
| `context-surgeon-feature-spec.md` | Feature behavior and acceptance notes |
| `context-surgeon-implementation-plan.md` | Build plan and architecture notes |
| `context-surgeon-product-strategy.md` | Positioning, ICP, and strategy |
| `context-surgeon-execution-backlog.md` | Remaining task backlog |
| `context-surgeon-hackathon-winning-plan.md` | Hackathon positioning and judging strategy |
| `ai-visibility-video-agent-prd.md` | Secondary project PRD |
| `ai-visibility-video-agent-feature-spec.md` | Secondary project spec |
