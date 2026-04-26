# Context Surgeon Release Checklist

## Purpose

Use this checklist before submitting, recording, or presenting Context Surgeon. It is intentionally concrete so future sessions can verify readiness without reconstructing context.

## Latest Verification Pass

Completed on April 26, 2026 after deploying Worker version `70d0cb60-316d-4a4d-b47f-c8c1bf17f68e`:

- `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm cf:build` passed.
- Production `/api/health` returned `ok: true`, `runtime: cloudflare-open-next-ready`, `persistence: cloudflare-d1`, `auth: firebase-auth`, `providerMode: live`, and `integrationsMode: live`.
- Production Qontext proof returned 12 raw input domains, 7 VFS files, and 9 entity types.
- Production Composio status returned 17 supported toolkits, `effectiveMode: live`, and no missing environment bindings.
- Production provider routes responded for Gemini extraction, Gemini context-check fallback, Tavily live enrichment, and Pioneer/Fastino deterministic classification.
- Unauthenticated production workspace/export/integration mutation routes returned `401`.
- `/demo` guided loop was verified in browser: compile, human note, new email, Fact Patch, apply patch, and Agent Check.
- `/demo` Qontext graph modal was visually verified.
- Browser demo-mode manual upload was verified with a synthetic text fixture and promoted into the compiler ledger.
- Product-facing `GET /api/live/upload` returns the API contract; unauthenticated `POST /api/live/upload` returns `401`.

## Product Readiness

- [ ] Public landing page loads at the final submitted URL.
- [ ] Hero clearly says what Context Surgeon does.
- [ ] Workbench is visible without auth in read-only mode.
- [ ] Firebase Auth status is intentional: configured for signed-in demo, or clearly represented as not configured.
- [ ] If Firebase secrets are deployed, signed-in user can run every workbench action.
- [ ] If Firebase secrets are not deployed, video does not imply production mutations are publicly enabled.
- [ ] Reset starts the demo at `loaded`.
- [ ] Compile shows facts and conflicts.
- [ ] Human note appears in `context.md`.
- [ ] Ingest New Email creates a pending Fact Patch.
- [ ] Apply Patch marks patch as applied.
- [ ] Manual note remains visible after patch.
- [ ] Agent Check shows before/after change.
- [ ] `GET /api/workspace/export` downloads valid JSON with `virtualFileSystem`, `graph`, `provenance`, `sourceRelevance`, and `partnerTechnologyProof`.
- [ ] Generated `qontext_ingest.json` contains `virtualFileSystem`, `entities`, `facts`, `relationships`, `sources`, and `spans`.
- [ ] Generated `qontext_ingest.json` omits raw source `text` but includes source relevance metadata.

## API Readiness

- [ ] `GET /api/health` returns `ok: true`.
- [ ] `GET /api/health` returns the expected `providerMode` value: `live` in production, `mock` for local deterministic recording.
- [ ] `GET /api/health` returns `persistence: cloudflare-d1` in production, or `memory-fallback` only for local/dev fallback.
- [ ] `GET /api/health` returns `auth: firebase-auth` if Firebase secrets are deployed, otherwise `auth: unconfigured`.
- [ ] `GET /api/auth/config` returns `configured: true` only when Firebase runtime config is present.
- [ ] `GET /api/workspace` returns current snapshot.
- [ ] Unauthenticated `POST /api/workspace/action` returns `401`.
- [ ] Authenticated `POST /api/workspace/action` succeeds.
- [ ] Authenticated `GET /api/workspace/export` succeeds.
- [ ] D1 audit events are created after actions.
- [ ] `POST /api/providers/gemini/extract` returns the deterministic structured extraction adapter contract.
- [ ] `POST /api/providers/gemini/context-check` returns live/cached before/after reasoning depending on key availability.
- [ ] `POST /api/providers/tavily/enrich` returns live/cached enrichment depending on key availability.
- [ ] `POST /api/providers/pioneer/classify` returns deterministic classification with key-configured proof until the onsite model id/endpoint is confirmed.

## Verification Commands

Run locally:

```bash
pnpm lint
pnpm test
pnpm build
pnpm cf:build
```

Run against production:

```bash
export BASE_URL="https://contextsurgeon.fnctn.io"

curl -fsS "$BASE_URL/api/health" | jq '{ok, app, runtime, persistence, auth, providerMode}'

curl -fsS "$BASE_URL/api/auth/config" | jq '{configured}'

curl -fsS "$BASE_URL/api/workspace" \
  | jq '{phase, propertyName, sources: .current.sources|length, facts: .current.facts|length, conflicts: .current.conflicts|length, files: .current.files|length}'

curl -fsS "$BASE_URL/api/workspace" \
  | jq -e '.current.sources[] | select(.id=="src_vendor_newsletter_noise") | .relevance.status == "ignored"'

curl -fsS "$BASE_URL/api/workspace" \
  | jq -e '.current.files[] | select(.path|endswith("/qontext_ingest.json")) | .content | fromjson | has("virtualFileSystem") and has("entities") and has("facts") and has("relationships") and has("sources") and has("spans")'

curl -fsS -X POST "$BASE_URL/api/providers/gemini/extract" | jq '{provider, mode, facts: .facts|length}'
curl -fsS -X POST "$BASE_URL/api/providers/gemini/context-check" | jq '{provider, mode, before: .before.score, after: .after.score}'
curl -fsS -X POST "$BASE_URL/api/providers/tavily/enrich" | jq '{provider, mode, enrichment: .enrichment|length}'
curl -fsS -X POST "$BASE_URL/api/providers/pioneer/classify" | jq '{provider, mode, sources: .sourceRelevance|length}'
```

Protected endpoint checks without auth:

```bash
export BASE_URL="https://contextsurgeon.fnctn.io"

curl -sS -o /tmp/cs-action-unauth.json -w "%{http_code}\n" \
  -X POST "$BASE_URL/api/workspace/action" \
  -H 'content-type: application/json' \
  -d '{"action":"compile"}'
cat /tmp/cs-action-unauth.json | jq

curl -sS -o /tmp/cs-export-unauth.json -w "%{http_code}\n" \
  "$BASE_URL/api/workspace/export"
cat /tmp/cs-export-unauth.json | jq

curl -sS -o /tmp/cs-reset-unauth.json -w "%{http_code}\n" \
  -X POST "$BASE_URL/api/workspace/reset"
cat /tmp/cs-reset-unauth.json | jq
```

Each unauthenticated protected endpoint command should print `401`.

Protected endpoint checks with Firebase auth:

```bash
export BASE_URL="https://contextsurgeon.fnctn.io"
export FIREBASE_API_KEY="replace-with-web-api-key"
export FIREBASE_EMAIL="replace-with-demo-user-email"
export FIREBASE_PASSWORD="replace-with-demo-user-password"

export ID_TOKEN="$(
  curl -fsS \
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$FIREBASE_API_KEY" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$FIREBASE_EMAIL\",\"password\":\"$FIREBASE_PASSWORD\",\"returnSecureToken\":true}" \
    | jq -r '.idToken'
)"

curl -fsS -X POST "$BASE_URL/api/workspace/reset" \
  -H "authorization: Bearer $ID_TOKEN" \
  | jq '{phase, auditEvents: .auditEvents|length}'

curl -fsS -X POST "$BASE_URL/api/workspace/action" \
  -H "authorization: Bearer $ID_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"action":"compile"}' \
  | jq '{phase, facts: .current.facts|length, conflicts: .current.conflicts|length}'

curl -fsS -X POST "$BASE_URL/api/workspace/action" \
  -H "authorization: Bearer $ID_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"action":"human-note"}' \
  | jq -e '.phase == "human_edited" and (.current.files[] | select(.path|endswith("/context.md")) | .content | contains("Manual note:"))'

curl -fsS -X POST "$BASE_URL/api/workspace/action" \
  -H "authorization: Bearer $ID_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"action":"ingest-email"}' \
  | jq '{phase, patchStatus: .patch.patchStatus, preservesHumanEdits: .patch.preservesHumanEdits, changedFactIds: .patch.changedFactIds}'

curl -fsS -X POST "$BASE_URL/api/workspace/action" \
  -H "authorization: Bearer $ID_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"action":"apply-patch"}' \
  | jq '{phase, patchStatus: .patch.patchStatus, before: .beforeCheck.score, after: .afterCheck.score}'

curl -fsS "$BASE_URL/api/workspace/export" \
  -H "authorization: Bearer $ID_TOKEN" \
  | jq -e '.virtualFileSystem|length > 0 and .graph.facts|length > 0 and .sourceRelevance|length > 0 and .partnerTechnologyProof.gemini'
```

## Cloudflare Readiness

- [ ] Worker deploy succeeds.
- [ ] Current custom domain route is `contextsurgeon.fnctn.io`.
- [ ] D1 binding exists as `CONTEXT_SURGEON_DB`.
- [ ] D1 migrations applied remotely.
- [ ] Firebase secrets deployed if auth is required for recording.
- [ ] No local-only assumptions in deployed code.
- [ ] `pnpm cf:build` succeeds from a clean checkout.
- [ ] `pnpm cf:preview` can boot the OpenNext Worker locally.
- [ ] Production `GET /api/health` reports `runtime: cloudflare-open-next-ready`.
- [ ] Production `GET /api/health` reports `persistence: cloudflare-d1`, not `memory-fallback`.
- [ ] Production `GET /api/health` reports `auth: firebase-auth` when protected endpoints are part of the demo.
- [ ] Production `GET /api/workspace` has `cache-control` behavior acceptable for live demo state.
- [ ] D1 snapshot persists after page refresh and new browser session.
- [ ] D1 audit trail records `context.compiled`, `human.note_preserved`, `patch.proposed`, and `patch.applied`.
- [ ] Provider routes return live/cached contracts exactly as described in the README.

## Firebase Auth Readiness

- [ ] User has explicitly approved deploying Firebase production secrets.
- [ ] Firebase project selected.
- [ ] Email/password sign-in enabled in Firebase Auth.
- [ ] `FIREBASE_API_KEY` deployed to Cloudflare.
- [ ] `FIREBASE_AUTH_DOMAIN` deployed to Cloudflare.
- [ ] `FIREBASE_PROJECT_ID` deployed to Cloudflare.
- [ ] `FIREBASE_APP_ID` deployed to Cloudflare.
- [ ] Demo account exists.
- [ ] Password reset works or is hidden from demo path.
- [ ] Signed-in browser session persists across refresh.

## README Readiness

- [ ] Project summary is clear.
- [ ] Architecture is clear.
- [ ] Hackathon track fit is explicit.
- [ ] Partner technologies are listed with their jobs.
- [ ] Partner technologies are described as live/cached/deterministic adapters with exact current status.
- [ ] Public API list is complete.
- [ ] Setup instructions are complete.
- [ ] Verification commands are listed.
- [ ] Cloudflare deployment is documented.
- [ ] Firebase Auth setup is documented.
- [ ] Firebase production secrets are documented as requiring explicit user approval.
- [ ] D1 migration is documented.
- [ ] Demo story is clear.
- [ ] Submission checklist is present.
- [ ] Strategic docs are linked.

## Video Readiness

- [ ] Use `context-surgeon-demo-script.md`.
- [ ] Browser zoom 100%.
- [ ] Window width large enough for workbench.
- [ ] Workspace reset before recording.
- [ ] Signed in before recording.
- [ ] No secret values visible.
- [ ] No devtools visible unless intentionally showing API.
- [ ] Final video under 2 minutes.
- [ ] Text is readable at submission resolution.
- [ ] Video includes Fact Patch and Agent Check.

## Submission Readiness

- [ ] Public GitHub repository exists.
- [ ] Repository includes source code.
- [ ] Repository includes README.
- [ ] Repository includes docs pack.
- [ ] Repository does not include secrets.
- [ ] Deployed URL is included.
- [ ] Demo video link is included.
- [ ] Track opt-in submitted before Sunday 14:00.
- [ ] Partner technology usage is explained accurately.
- [ ] Claims do not imply live provider keys are connected unless they really are.
- [ ] Firebase production secret status is accurate.

## Known Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Firebase secrets not deployed | Auth gate cannot be fully demonstrated | Use explicit approval flow, deploy secrets, verify auth before recording |
| Live provider keys unavailable | Sponsor credibility weaker | Mock-first demo remains complete; explain adapter contracts |
| UI feels too static | Judges may see it as prototype only | Use step flow, D1 audit trail, export, auth, and API calls visibly |
| Fact Patch hard to understand | Differentiator gets missed | Slow down demo at patch diff and preserved note |
| README overclaims | Jury may penalize | Keep live vs mock status explicit |
