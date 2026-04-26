# Context Surgeon Execution Backlog

## Purpose

This is the tactical build backlog for the hackathon product. It translates the product strategy into work items that should be executed in order. Future sessions should read this after `context-surgeon-product-strategy.md`.

## Current Product State

Implemented:

- Public landing page at `contextsurgeon.fnctn.io`.
- Next.js 16 / React 19 / Tailwind 4 app on Cloudflare Workers via OpenNext.
- Cloudflare D1 database `context-surgeon-db`.
- Workspace snapshot and audit-event persistence.
- Firebase Auth code path via Identity Toolkit REST.
- Server-side Firebase ID token verification for workspace mutations and export.
- Bundled Sonnenallee 44 demo dataset.
- Source-grounded fact extraction from deterministic fixtures.
- Conflict detection.
- Markdown VFS generation.
- Fact Patch proposal and application.
- Preserved human note in `context.md`.
- Before/after agent check.
- Qontext-ready export endpoint.
- Source relevance/signal-vs-noise layer with included, ignored, and needs-review statuses.
- Pioneer/Fastino provider route returns source relevance and chunk classification hints.

Not fully finished until explicitly completed:

- Firebase secrets deployed to Cloudflare.
- Production Firebase test/demo account created.
- Live Gemini/Tavily/Pioneer adapters connected to real keys. Mock/cached contracts exist.
- Aikido scan and screenshot.
- Demo video.
- Public GitHub repo setup.

## Priority Principles

1. Protect the core demo loop before adding breadth.
2. Favor visible proof over hidden capability.
3. Every sponsor integration must have a specific job in the product.
4. The demo must work in mock/cached mode even if live APIs fail.
5. Do not start Peec/Hera until Context Surgeon can be recorded.

## P0: Must Ship Before Recording

### P0.1 Firebase Auth Production Completion

Outcome:

The deployed workbench can be operated by a signed-in user and rejects unauthenticated mutation/export requests.

Tasks:

- Deploy Firebase runtime secrets to Cloudflare.
- Verify `/api/auth/config` returns `configured: true`.
- Create or use a Firebase Auth demo account.
- Sign in on production.
- Run reset, compile, human note, ingest email, apply patch, export.
- Verify unauthenticated `POST /api/workspace/action` returns `401`.
- Verify `/api/health` reports `auth: firebase-auth`.

Acceptance criteria:

- No "Firebase config is not deployed yet" message on production.
- Signed-in session persists after refresh.
- Protected actions use bearer ID token.
- D1 audit trail updates after each action.

Blocked by:

- Explicit user approval to transmit Firebase web config to Cloudflare and Firebase/Google.

### P0.2 Product Demo Flow Polish

Outcome:

The judge can understand the product by clicking through the workbench without explanation.

Tasks:

- Ensure initial state after reset starts at "Archive loaded."
- Set default active view to Sources after reset.
- Each step should move to the most relevant view automatically.
- Add brief step-level outcome text after each successful action.
- Show "human note preserved" visibly in Files and Patch Review.
- Make Qontext export feedback visible after download.
- Avoid disabled controls looking broken; explain why sign-in is needed.
- Add visible badges for Buena hard problems: schema alignment, signal/noise, surgical update.
- Add visible badges for Qontext hard problems: VFS, graph/export, fact provenance, human review.

Acceptance criteria:

- A user can run the demo in 90 seconds.
- Every step has a visible before/after.
- No user gets stuck wondering what to click next.

### P0.3 Demo Script + Video Readiness

Outcome:

We can record the 2-minute submission video without improvising.

Tasks:

- Use `context-surgeon-demo-script.md`.
- Prepare signed-in browser state.
- Reset workspace before recording.
- Record full flow once slowly for safety.
- Record final 2-minute version.
- Validate video has readable text at 1080p.

Acceptance criteria:

- Video shows the product, not slides.
- Fact Patch and agent delta are clearly visible.
- The first 20 seconds establish why this is not RAG.

### P0.4 README Submission Quality

Outcome:

The public repo reads like a serious technical project.

Tasks:

- Add architecture diagram or text flow.
- Document D1 migration.
- Document Firebase Auth behavior.
- Document provider modes.
- Document demo account instructions if allowed.
- Document partner technologies and their product jobs.
- Include verification commands and deployed URL.

Acceptance criteria:

- A judge can clone, run, and understand the product.
- README clearly references strategic docs.
- README does not overclaim live integrations that are not configured.

## P1: Sponsor Credibility

### P1.1 Gemini Live Adapter

Outcome:

Gemini is used for a specific and visible job: structured extraction or context-check explanation.

Tasks:

- Add environment variable handling for `GEMINI_API_KEY`.
- Implement live adapter behind existing `/api/providers/gemini/extract`.
- Implement live adapter behind `/api/providers/gemini/context-check`.
- Add provider status UI.
- Cache/fallback to deterministic output on failure.

Acceptance criteria:

- Live mode can be demonstrated if API key is available.
- Mock mode remains deterministic.
- Failure does not break the demo.

### P1.2 Tavily Enrichment

Outcome:

Tavily verifies or enriches external vendor/property context.

Tasks:

- Add real Tavily adapter behind `/api/providers/tavily/enrich`.
- Use it to enrich vendor profile or public risk context.
- Display enrichment as optional evidence.
- Cache fallback output.

Acceptance criteria:

- UI can point to one Tavily-enriched result.
- README explains Tavily's job.

### P1.3 Pioneer/Fastino Pre-Pass

Outcome:

Pioneer/Fastino has a concrete role: document classification or schema-first entity extraction.

Tasks:

- Add adapter behind `/api/providers/pioneer/classify`.
- Display document kind/entity hints.
- Explain how this could replace expensive LLM calls.

Acceptance criteria:

- The integration is not logo stacking.
- Demo can show where Pioneer changes the pipeline.

### P1.4 Signal-vs-Noise Classifier

Outcome:

The product directly answers Buena's "90% of emails are irrelevant" challenge.

Tasks:

- Add source relevance field: `included`, `ignored`, `needs_review`. Done.
- Add deterministic mock relevance for demo sources. Done.
- Show incoming owner email as `included`. Done.
- Add one synthetic irrelevant email if time permits.
- Route relevance through Pioneer/Fastino adapter when live mode is available.

Acceptance criteria:

- The UI can say why each source belongs in context, needs review, or is noise. Done.
- The README explains signal-vs-noise handling. Done.

## P2: Product Depth

### P2.1 Real Uploads

Outcome:

Users can upload text/CSV-like sources instead of only bundled demo data.

Tasks:

- Add upload surface for `.txt`, `.md`, `.csv`.
- Store uploaded source content in D1 snapshot or R2 if needed.
- Run ingestion/chunking on uploaded data.
- Keep demo dataset reset available.

Acceptance criteria:

- A judge can add one extra source.
- The system produces facts or classifies unsupported sources gracefully.

### P2.2 Review Queue

Outcome:

Conflicts become actionable review work, not just warnings.

Tasks:

- Add accept/dismiss/resolve controls.
- Persist conflict decision in D1 audit events.
- Reflect resolved conflicts in context health.

Acceptance criteria:

- Reviewer actions are source-grounded and auditable.

### P2.3 Multi-Property Shell

Outcome:

The product implies portfolio scale.

Tasks:

- Add property switcher.
- Add second synthetic property stub.
- Show portfolio context health summary.

Acceptance criteria:

- Does not distract from Sonnenallee 44 demo.
- Helps Buena/Qontext see platform potential.

## P3: Side Challenges

### P3.1 Aikido

Outcome:

Compete for Most Secure Build.

Tasks:

- Connect repo to Aikido.
- Run scan.
- Fix high-confidence issues.
- Add screenshot to docs/submission material.

Acceptance criteria:

- Screenshot clearly shows issue counts and categories.

### P3.2 Peec/Hera Side Project

Outcome:

Only after Context Surgeon is recordable, build the compact side bet.

Tasks:

- Read side project PRD/spec.
- Build minimal Peec visibility-to-video pipeline.
- Do not cannibalize Context Surgeon polish time.

Acceptance criteria:

- Side project can be submitted separately without weakening main submission.

## Recommended Next Session Order

1. Finish Firebase production auth after explicit approval.
2. Polish demo-step feedback in the workbench.
3. Update README for submission.
4. Record and review a local dry-run video.
5. Add one live provider if keys are available.
6. Run Aikido scan.
