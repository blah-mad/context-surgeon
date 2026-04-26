# Context Surgeon

Context Surgeon is a Big Berlin Hack submission for property-management context engineering. It compiles messy building artifacts into an agent-readable property memory with source-grounded facts, conflict detection, generated Markdown files, and surgical **Fact Patch** updates that preserve human edits.

The demo property is `Sonnenallee 44, 12045 Berlin`. The core claim is simple: agents fail when their context is stale, contradictory, or unverifiable. Context Surgeon fixes the context before agents act on the business.

Live product: [contextsurgeon.fnctn.io](https://contextsurgeon.fnctn.io/)

Public repository: [github.com/blah-mad/context-surgeon](https://github.com/blah-mad/context-surgeon)

## Hackathon Fit

Primary tracks:

- **Buena: The Context Engine**: property context compiler, source relevance, conflict detection, and agent pre-flight context checks.
- **Qontext**: virtual file system, fact graph, provenance ledger, and export shape ready for a company context base.

Technology jobs:

The first three rows are the Big Berlin Hack partner technologies used for eligibility.

| Partner technology | Job in this project | Current status |
|---|---|---|
| Google DeepMind / Gemini | Agent context-check reasoning plus the structured extraction adapter contract | Live key configured for context-check proof with cached fallback; bundled extraction remains deterministic for the recording path. |
| Tavily | External enrichment and public/vendor verification | Live search enrichment configured with cached fallback. |
| Pioneer / Fastino / GLiNER2 | Schema-first source classification, relevance scoring, and extraction hints | Pioneer key configured; deterministic schema-first relevance remains the safe demo output until the onsite model id is confirmed. |
| Composio | Live connector layer for Gmail, Outlook, HubSpot, Salesforce, Drive, Slack, Zendesk, and other business apps | API and workbench live-intake surface implemented; production OAuth-link path and candidate-source normalization verified. |
| Firebase Auth | Protect API workspace mutations and export in production | Configured in production for the `big-berlin-hack` Firebase project. Public browser demo still works without sign-in. |
| Cloudflare Workers + D1 | Edge deployment and persisted workspace/audit state | Configured through OpenNext Cloudflare and D1 binding. Local fallback uses memory when D1 is unavailable. |

## What The Demo Shows

1. Load messy handover sources for a Berlin property.
2. Compile sources into a fact ledger with quotes, spans, and confidence.
3. Detect seeded contradictions before an agent acts.
4. Generate Markdown context files plus machine exports.
5. Add a human operational note to `context.md`.
6. Ingest a new owner email.
7. Propose a minimal Fact Patch instead of regenerating the whole file.
8. Apply the patch and show the agent action plan change.

The memorable moment is Fact Patch: generated blocks update, stale facts are superseded, and the human note remains intact.

## Architecture

```text
demo_data/properties/sonnenallee-44/
  -> ingestion + chunking
  -> provider adapter contracts
       Gemini live/cached: context check + extraction contract
       Tavily live/cached: enrichment proof
       Pioneer/Fastino key-configured: classification hints
       Composio live/demo: connected app candidate-source normalization
  -> fact ledger + source spans
  -> conflict detector
  -> Markdown virtual file system
  -> Fact Patch proposal and apply flow
  -> agent context health check
  -> Cloudflare D1 workspace store when deployed
```

Project layout:

```text
app/                              Next.js UI and API routes
lib/context-surgeon/              Pure TypeScript context engine
lib/firebase/                     Firebase client config and server token verification
demo_data/properties/sonnenallee-44/
                                  Demo source artifacts
migrations/                       Cloudflare D1 schema
docs/hackathon/                   Submission, strategy, demo, and release docs
tests/                            Vitest coverage for demo-critical behavior
```

## API Surface

The browser workbench has a public local-first demo path so judges can run the full compile,
human-note, Fact Patch, and agent-check loop immediately. The server mutation/export endpoints
below remain Firebase-protected for persisted D1 workspace operations.

| Method | Route | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Runtime, provider mode, persistence, and auth status | Public |
| `GET` | `/api/auth/config` | Firebase web config availability | Public, no-store |
| `GET` | `/api/workspace` | Current demo workspace snapshot | Public read |
| `POST` | `/api/workspace/reset` | Reset workspace to the loaded demo state | Firebase ID token |
| `POST` | `/api/workspace/action` | Run `compile`, `human-note`, `ingest-email`, or `apply-patch` | Firebase ID token |
| `GET` | `/api/workspace/export` | Qontext-ready JSON export with VFS, graph, provenance, and partner proof | Firebase ID token |
| `GET` | `/api/qontext/proof` | Qontext dataset proof: Inazuma.co VFS, graph, provenance, and no-account challenge framing | Public |
| `POST` | `/api/providers/gemini/extract` | Mock structured extraction adapter contract | Public demo route |
| `POST` | `/api/providers/gemini/context-check` | Live/cached before/after context-check adapter contract | Public demo route |
| `POST` | `/api/providers/tavily/enrich` | Mock enrichment adapter contract | Public demo route |
| `POST` | `/api/providers/pioneer/classify` | Mock source classification and extraction-hint adapter contract | Public demo route |
| `GET` | `/api/providers/composio/status` | Composio connector status, supported toolkits, and missing env report | Public proof route |
| `GET` | `/api/integrations` | Supported connectors plus connection state | Demo public, live with Firebase token |
| `POST` | `/api/integrations/connect` | Create a Composio OAuth connect link | Firebase ID token |
| `GET` | `/api/integrations/callback` | OAuth callback redirect back to the demo workbench | Public callback |
| `POST` | `/api/integrations/disconnect` | Disable a connected account | Firebase ID token |
| `POST` | `/api/integrations/sync` | Fetch connected app records and normalize them into candidate sources | Firebase ID token |
| `POST` | `/api/integrations/upload` | Normalize manual PDF, Word, TXT, CSV, JSON, Markdown, image, or export uploads | Firebase ID token |
| `GET/POST` | `/api/integrations/rules` | Inspect or activate scoped ingestion rules for new email/file/CRM/ticket/work updates | Firebase ID token for activation |
| `GET` | `/api/integrations/sources` | Return normalized connector source contract | Firebase ID token |

`/api/workspace/action` accepts:

```json
{ "action": "compile" }
```

Allowed actions are `compile`, `human-note`, `ingest-email`, and `apply-patch`.

## Local Setup

Prerequisites:

- Node.js compatible with Next.js 16
- `pnpm` 10.x

Install and run:

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000
```

Default local mode:

```bash
PROVIDER_MODE=mock
```

Mock mode is intentional for the submission demo. It uses bundled property artifacts and deterministic provider outputs so the full story works without live partner keys.

## Verification

Run before recording or submitting:

```bash
pnpm lint
pnpm test
pnpm build
pnpm cf:build
```

Production verification completed on April 26, 2026 for Worker version `a466a871-dcf6-452e-8288-dd624415ff2f`:

- `GET /api/health` reports live provider and live integration mode.
- `GET /api/providers/composio/status` reports 17 supported toolkits and configured Composio mode.
- Protected integration routes reject unauthenticated `connect`, `sync`, `upload`, and live rule activation.
- Authenticated live mode can create a Gmail OAuth link, normalize synced connector records into candidate sources, activate an ingestion rule, upload a manual evidence file, and read normalized source contracts.
- The `/demo` guided loop was verified in the in-app browser: compile, human note, new email, Fact Patch, apply patch, and Agent Check all reach the expected visible states.
- Manual upload was verified with a synthetic text file in browser demo mode; the file became a candidate source and was promoted into the compiler ledger.

Useful local API checks:

```bash
curl -s http://localhost:3000/api/health | jq
curl -s http://localhost:3000/api/workspace | jq '{phase, propertyName, facts: .current.facts|length, conflicts: .current.conflicts|length}'
curl -s -X POST http://localhost:3000/api/providers/gemini/extract | jq '{provider, mode, facts: .facts|length}'
```

An unauthenticated workspace mutation should return `401` when Firebase verification is active:

```bash
curl -s -X POST http://localhost:3000/api/workspace/action \
  -H 'content-type: application/json' \
  -d '{"action":"compile"}' | jq
```

## Cloudflare Deployment

The app is configured for Cloudflare Workers through OpenNext:

- `open-next.config.ts`
- `wrangler.jsonc`
- `@opennextjs/cloudflare`
- `nodejs_compat`
- D1 binding: `CONTEXT_SURGEON_DB`

Build and preview:

```bash
pnpm cf:build
pnpm cf:preview
```

Deploy:

```bash
pnpm cf:deploy
```

Apply D1 migrations:

```bash
pnpm wrangler d1 migrations apply context-surgeon-db --remote
```

## Firebase Auth

Firebase Auth gates production API mutations and export:

- `POST /api/workspace/reset`
- `POST /api/workspace/action`
- `GET /api/workspace/export`

The deployed UI also includes a public local-first demo mode. Without a Firebase session, button
clicks mutate browser state and `Qontext export preview` downloads the same export shape from the
current client snapshot. With a Firebase session, the same workflow uses the protected D1-backed
API routes.

Required runtime variables:

```bash
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
```

Production Firebase secrets were approved by the user and deployed to Cloudflare on April 25, 2026.
Do not commit Firebase config values to the repository. Future updates should go through Cloudflare
secrets:

```bash
printf "$FIREBASE_API_KEY" | pnpm wrangler secret put FIREBASE_API_KEY
printf "$FIREBASE_AUTH_DOMAIN" | pnpm wrangler secret put FIREBASE_AUTH_DOMAIN
printf "$FIREBASE_PROJECT_ID" | pnpm wrangler secret put FIREBASE_PROJECT_ID
printf "$FIREBASE_APP_ID" | pnpm wrangler secret put FIREBASE_APP_ID
```

`GET /api/health` reports `auth: "firebase-auth"` only when Firebase runtime config is present. Otherwise it reports `auth: "unconfigured"`.

## Qontext Track Proof

Qontext clarified that no Qontext account is necessary and that using Qontext itself to generate the
context repository is not the task. Context Surgeon therefore treats Qontext as a challenge target,
not an API dependency.

The app includes a Qontext proof section and `/api/qontext/proof` built from the supplied
`Inazuma.co` dataset shape:

- 12 raw company domains
- 153,997 counted records/artifacts
- CRM, sales, support, sentiment, email, HR, ITSM, GitHub, policies, collaboration, order PDFs
- a generated virtual file system plan
- graph entity/edge contract
- provenance and Fact Patch update mechanics

## Provider Keys

Live provider mode is enabled in production. Keys are deployed as Cloudflare secrets and must not be
committed to the repository.

Reserved environment variables:

```bash
GEMINI_API_KEY=
TAVILY_API_KEY=
PIONEER_API_KEY=
PROVIDER_MODE=live
INTEGRATIONS_MODE=demo
COMPOSIO_API_KEY=
COMPOSIO_REDIRECT_URI=
COMPOSIO_AUTH_CONFIG_GMAIL=
COMPOSIO_AUTH_CONFIG_OUTLOOK=
COMPOSIO_AUTH_CONFIG_HUBSPOT=
COMPOSIO_AUTH_CONFIG_SALESFORCE=
COMPOSIO_AUTH_CONFIG_GOOGLEDRIVE=
COMPOSIO_AUTH_CONFIG_ONEDRIVE=
COMPOSIO_AUTH_CONFIG_DROPBOX=
COMPOSIO_AUTH_CONFIG_SHAREPOINT=
COMPOSIO_AUTH_CONFIG_GOOGLESHEETS=
COMPOSIO_AUTH_CONFIG_NOTION=
COMPOSIO_AUTH_CONFIG_SLACK=
COMPOSIO_AUTH_CONFIG_MICROSOFT_TEAMS=
COMPOSIO_AUTH_CONFIG_ZENDESK=
COMPOSIO_AUTH_CONFIG_INTERCOM=
COMPOSIO_AUTH_CONFIG_JIRA=
COMPOSIO_AUTH_CONFIG_LINEAR=
```

Current production behavior uses `PROVIDER_MODE=live`; every provider route still has a deterministic
fallback so the demo remains reliable if a sponsor API is slow or unavailable.

## Live Integrations Mode

The `/demo` workbench includes a live-mode panel for connecting real systems through Composio and
manual upload. The catalog is grouped by product job:

- Email: Gmail, Outlook
- CRM: HubSpot, Salesforce
- Files and knowledge: manual upload, Google Drive, OneDrive, Dropbox, SharePoint, Google Sheets, Notion
- Collaboration: Slack, Microsoft Teams
- Support and tickets: Zendesk, Intercom
- Work tracking: Jira, Linear

In public demo mode, it shows the connector UX with deterministic source payloads. In authenticated
live mode, the API creates Composio OAuth connect links, lists user-scoped connected accounts,
executes selected toolkit tools where credentials are available, accepts manual file uploads, and
normalizes returned records into the same candidate-source contract used by the compiler.

The product boundary is intentional:

- Composio handles OAuth and connected-account custody.
- Firebase Auth scopes connector operations to the signed-in user.
- Context Surgeon normalizes records into source documents, facts, provenance, conflicts, VFS files,
  and Fact Patches.
- Public status routes expose missing environment variable names, never secrets.

Detailed API and UI plan:

- [Live integrations API](docs/hackathon/context-surgeon-live-integrations-api.md)

## Submission Checklist

- Public repository includes this README and `docs/hackathon/`.
- Demo video is under 2 minutes and follows `docs/hackathon/context-surgeon-demo-script.md`.
- `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm cf:build` pass.
- `/api/health` returns `ok: true`.
- Demo shows compile, conflicts, human note, Fact Patch, apply patch, and agent check.
- Partner technology usage is explained as live/cached adapters, with exact route health shown in the UI.
- Public demo mode runs end-to-end without sign-in.
- Firebase production auth is configured before recording authenticated D1 mutations.
- No secrets, dashboards, or private keys appear in the repository or video.

## Documentation Map

- [Hackathon documentation pack](docs/hackathon/README.md)
- [Demo script](docs/hackathon/context-surgeon-demo-script.md)
- [Release checklist](docs/hackathon/context-surgeon-release-checklist.md)
- [Product strategy](docs/hackathon/context-surgeon-product-strategy.md)
- [PRD](docs/hackathon/context-surgeon-prd.md)
- [Feature spec](docs/hackathon/context-surgeon-feature-spec.md)
- [Implementation plan](docs/hackathon/context-surgeon-implementation-plan.md)
- [Live integrations API](docs/hackathon/context-surgeon-live-integrations-api.md)
- [Session handoff](docs/hackathon/session-handoff.md)

## Built

- Demo property source data
- Source relevance classification
- Structured fact extraction from bundled sources
- Source quote and span mapping
- Deterministic conflict detection
- Markdown virtual file system generation
- `facts.jsonl` and Qontext-style export shape
- Generated-block anchors for patching
- Fact Patch proposal and apply flow
- Human edit preservation
- Before/after agent context check
- Cloudflare D1 persistence path
- Firebase ID-token verification path
- Audit trail for workspace actions
- Live/cached provider API routes for Gemini, Tavily, and Pioneer/Fastino
- Composio live-mode connector API and workbench panel
- Tests for demo-critical behavior

## Not Built Yet

- Persisted connector-run history beyond the current workspace snapshot
- Real Qontext API push, intentionally not required for the Qontext challenge
- Full MCP server
- Confirmed Pioneer/Fastino model-specific live inference call
- Multi-property portfolio workflows
