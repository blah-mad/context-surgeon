# Context Surgeon Live Integrations Mode

This document is the cross-session reference for the Composio-powered live mode. The product still wins on the core compiler loop: raw sources become facts, conflicts, VFS files, Fact Patches, and agent checks. Composio is the acquisition layer that brings real business-system data into that same pipeline.

## Product Thesis

Agents do not need another chat box. They need a reliable context supply chain.

Live Mode lets an operator connect their real systems, select the property or business scope, preview source relevance, then compile a source-grounded context repository. The user should feel like they are connecting operating systems to a context engine, not configuring integrations.

## Supported Connector Families

| Family | Connectors | Source examples | Context job |
|---|---|---|---|
| Email | Gmail, Outlook | owner emails, tenant threads, contractor replies, attachments | latest operational truth and contradictions |
| CRM | HubSpot, Salesforce | owner records, companies/accounts, deals/cases, notes | identity resolution and decision authority |
| Files and knowledge | Manual upload, Google Drive, OneDrive, Dropbox, SharePoint, Google Sheets, Notion | PDFs, Word docs, meeting minutes, contracts, handover folders, spreadsheets | static/procedural knowledge |
| Collaboration | Slack, Microsoft Teams | handoff messages, incident updates, internal decisions | trajectory and unresolved questions |
| Support | Zendesk, Intercom | tickets, comments, escalations, SLA state | open issues and task progress |
| Work tracking | Jira, Linear | issues, projects, blockers, owner/status changes | execution trajectory |

## UI/UX Plan

The workbench contains a `Live intake` panel above the compiler controls.

The panel is intentionally split into three modes:

- `Sources`: choose a context scope, select connectors, upload manual evidence, and sync scoped systems.
- `Automation`: configure the ingestion rule for new emails, files, CRM updates, tickets, and work items.
- `Review`: inspect candidate sources and promote approved evidence into the compiler ledger.

Primary states:

- `Public demo`: visible catalog, realistic demo connection data, sync disabled until sign-in.
- `Signed in, demo integrations`: Firebase session exists, Composio env missing, sync returns deterministic demo connector sources.
- `Signed in, live integrations`: Firebase session exists, `INTEGRATIONS_MODE=live`, `COMPOSIO_API_KEY`, and connector auth config ids are present.
- `Connected`: OAuth account exists for the current Firebase user.
- `Needs config`: connector is supported but its Composio auth config id is not deployed.
- `Syncing`: a selected connector is fetching real records through Composio.
- `Synced`: imported records are shown as candidate sources with candidate facts and confidence.

Core interactions:

1. Refresh connector catalog.
2. Connect Gmail, Outlook, HubSpot, Salesforce, Drive, Slack, Zendesk, or another supported system.
3. Sync one connector or the selected scoped set.
4. Upload manual files when the relevant truth lives outside connected systems.
5. Inspect generated connector and file-upload sources in the review queue.
6. Promote approved sources into the compiler ledger.
7. Run the normal compiler flow: relevance -> facts -> conflicts -> VFS -> Fact Patch -> agent check.

UX principle:

The user never sees OAuth tokens, raw provider secrets, or low-level connector plumbing. They see source provenance, source type, candidate facts, confidence, and the next operation.

## API Authentication

Real connection and sync routes require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Public/demo proof routes never expose user account data.

## API Reference

Product-facing live API routes:

| Route | Job |
|---|---|
| `GET /api/live/connectors` | List supported connectors and current connection state. |
| `POST /api/live/connect` | Create a Composio OAuth connect link for one connector. |
| `POST /api/live/sync` | Sync selected connected systems into candidate sources. |
| `GET/POST /api/live/upload` | Document and accept authenticated manual file evidence. |
| `GET/POST /api/live/rules` | Inspect or activate ingestion rules for new evidence. |
| `GET /api/live/sources` | Inspect normalized candidate-source output. |

The `/api/integrations/*` routes are internal implementation routes used by the workbench. The
`/api/live/*` routes are the product API surface to show in demos and docs.

### `GET /api/providers/composio/status`

Public status and contract proof.

Returns:

```json
{
  "provider": "composio",
  "requestedMode": "demo",
  "effectiveMode": "demo",
  "configured": false,
  "missing": ["COMPOSIO_API_KEY"],
  "supportedToolkits": [],
  "contract": {
    "connect": "POST /api/integrations/connect",
    "sync": "POST /api/integrations/sync"
  }
}
```

### `GET /api/integrations`

Lists supported connectors and connection state. Without auth or without live env, it returns a safe demo catalog. With auth and live env, it asks Composio for connected accounts scoped to the Firebase user id.

Product alias: `GET /api/live/connectors`.

### `POST /api/integrations/connect`

Creates a Composio OAuth connect link.

Product alias: `POST /api/live/connect`.

Request:

```json
{
  "toolkitSlug": "gmail"
}
```

Live response:

```json
{
  "ok": true,
  "mode": "live",
  "toolkitSlug": "gmail",
  "redirectUrl": "https://...",
  "connectedAccountId": "..."
}
```

Demo/not configured response:

```json
{
  "ok": true,
  "mode": "demo",
  "toolkitSlug": "gmail",
  "missing": ["COMPOSIO_API_KEY", "COMPOSIO_AUTH_CONFIG_GMAIL"]
}
```

### `GET /api/integrations/callback`

OAuth callback landing route. It redirects back to `/demo` with a connection marker. Composio remains the token custodian; Context Surgeon does not store raw OAuth tokens.

### `POST /api/integrations/disconnect`

Disables a connected account in live mode or returns a demo disconnect result.

Request:

```json
{
  "connectionId": "connected-account-id"
}
```

### `POST /api/integrations/sync`

Fetches records from selected connected systems and normalizes them into the same source contract the compiler already understands.

Product alias: `POST /api/live/sync`.

Request:

```json
{
  "toolkitSlugs": ["gmail", "hubspot", "googledrive"],
  "query": "Sonnenallee 44",
  "limit": 10
}
```

Response:

```json
{
  "ok": true,
  "mode": "live",
  "workspaceId": "sonnenallee-44-live-mode",
  "selectedToolkits": ["gmail", "hubspot"],
  "summary": "Composio live tool execution completed...",
  "sources": [
    {
      "id": "gmail-owner-approval",
      "toolkitSlug": "gmail",
      "title": "Owner approval thread: roof emergency sealing",
      "sourceType": "email",
      "confidence": 0.94,
      "facts": [
        {
          "predicate": "roof.vendor.approved",
          "value": "TempSeal GmbH",
          "quote": "Please proceed with TempSeal today..."
        }
      ]
    }
  ],
  "composio": {
    "configured": true,
    "attemptedLiveTools": ["GMAIL_FETCH_EMAILS"],
    "missing": []
  }
}
```

### `POST /api/integrations/upload`

Accepts manual files from the operator and normalizes them into candidate sources. The route accepts
`multipart/form-data` with one or more `files` fields. Supported intake types include PDF, Word,
TXT, Markdown, CSV, JSON, RTF, HTML, XML, PNG, and JPG. Text-like files are read directly; binary
files are accepted with filename/type/size provenance and can be enriched by the extraction layer.

Response shape is the same as `/api/integrations/sync`, with `selectedToolkits: ["manual_upload"]`.

Product alias: `POST /api/live/upload`.

### `GET /api/live/upload`

Product-facing API contract for file intake. This is the route to show in the UI and submission
materials because it reads like an external product API instead of an internal integration route.

Returns:

```json
{
  "ok": true,
  "product": "Context Surgeon Live API",
  "endpoint": "POST /api/live/upload",
  "auth": "Firebase ID token in Authorization: Bearer <token>",
  "contentType": "multipart/form-data"
}
```

### `POST /api/live/upload`

Product-facing alias for manual evidence upload. It accepts the same authenticated multipart payload
as `/api/integrations/upload`, then returns normalized candidate sources.

Example:

```bash
curl -X POST https://contextsurgeon.fnctn.io/api/live/upload \
  -H 'Authorization: Bearer <FIREBASE_ID_TOKEN>' \
  -F 'files=@owner-email.txt'
```

### `GET /api/integrations/sources`

Returns the last normalized source contract shape. The current hackathon implementation returns the deterministic sync shape; production should persist per-user connector runs and return the latest stored run.

Product alias: `GET /api/live/sources`.

### `GET /api/integrations/rules`

Returns the default rule contract for live monitoring.

Product alias: `GET /api/live/rules`.

### `POST /api/integrations/rules`

Activates a scoped ingestion rule.

Product alias: `POST /api/live/rules`.

Request:

```json
{
  "scope": "Sonnenallee 44",
  "toolkits": ["gmail", "hubspot", "googledrive"],
  "events": ["new_email", "new_attachment", "crm_update", "file_update"],
  "autoPatch": true
}
```

The rule action is either `create_candidate_source_for_review` or
`create_candidate_source_classify_and_propose_fact_patch`. In production this is the policy object
that governs webhook/trigger handling for new emails, files, tickets, CRM updates, and work items.

## Environment Variables

```bash
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

Use `INTEGRATIONS_MODE=live` only when `COMPOSIO_API_KEY` and at least one connector auth config id are deployed.

## Security Model

- Firebase Auth scopes live connector actions to a user id.
- Composio stores OAuth credentials; Context Surgeon does not persist raw OAuth tokens.
- API routes return setup-missing markers instead of secrets.
- Public status routes expose only connector availability and environment variable names.
- Live payloads should be redacted before a public demo recording if real customer data is connected.

## Implementation Notes

Current implementation:

- `lib/context-surgeon/integrations/composio.ts`
- `GET /api/providers/composio/status`
- `GET /api/integrations`
- `POST /api/integrations/connect`
- `GET /api/integrations/callback`
- `POST /api/integrations/disconnect`
- `POST /api/integrations/sync`
- `GET /api/integrations/sources`
- Workbench `Live intake` panel on `/demo`

Verified on production on April 26, 2026:

- `GET /api/health` reports `integrationsMode: "live"` and `composio: "configured"`.
- `GET /api/providers/composio/status` reports 17 supported toolkits and no missing Composio configuration.
- Public `GET /api/integrations` returns a preview catalog without exposing user account data.
- Unauthenticated `connect`, `sync`, `upload`, and live rule activation return `401`.
- Authenticated Firebase session can list live integrations, create a Gmail OAuth connect link, run sync normalization, activate an ingestion rule, upload a manual file, and read normalized source contracts.

Next production hardening:

- Persist connected account metadata and sync runs in D1.
- Feed normalized sync sources into the `ContextState.sources` ledger instead of displaying them as candidate sources only.
- Add per-source approve/ignore controls before compilation.
- Add webhook-triggered sync for new email/ticket/CRM updates.
- Add tenant/workspace isolation if multiple users operate the same deployment.
