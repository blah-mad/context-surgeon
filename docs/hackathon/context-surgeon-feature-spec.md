# Context Surgeon Feature Spec

## Document Purpose

This file translates the Context Surgeon PRD into implementation-level features. Future coding sessions should use this as the build checklist and source of truth for module boundaries.

## System Architecture

```text
demo_data/
  properties/
    sonnenallee-44/
      emails/
      pdfs/
      csvs/
      docs/

backend/
  app/
    main.py
    config.py
    db/
    ingestion/
    extraction/
    resolution/
    provenance/
    conflicts/
    vfs/
    api/
    mcp/
    integrations/

frontend/
  src/
    api/
    components/
    pages/
    state/
    styles/

generated_vfs/
  properties/
    sonnenallee-44/

docs/
  hackathon/
```

Recommended implementation stack:

- Backend: Python, FastAPI, SQLite, Pydantic.
- Frontend: React, Vite, TypeScript, Tailwind.
- Tests: pytest for backend.
- Local storage: `context_surgeon.sqlite`.
- Optional: Monaco or plain textarea for markdown, `diff2html` or custom unified diff rendering.

## Domain Vocabulary

Property: managed building or unit group.

Source document: original input artifact such as email, PDF, CSV, note, or web extract.

Chunk: normalized text slice with source location.

Entity: canonical object such as property, tenant, owner, vendor, invoice, assembly decision, maintenance issue.

Fact: structured claim extracted from a source and attached to evidence.

Conflict: incompatible facts that require review.

Virtual file system: generated markdown/JSON artifacts for agents and humans.

Fact Patch: minimal update proposal that changes only affected generated blocks and preserves human edits.

## Data Models

Use these Pydantic models and mirror them into SQLite tables.

```python
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

SourceType = Literal["email", "pdf", "csv", "docx", "txt", "web"]
EntityType = Literal[
    "property", "unit", "tenant", "owner", "vendor", "invoice",
    "maintenance_issue", "assembly_decision", "contract", "bank_account",
    "person", "company", "date", "money", "unknown"
]
FactType = Literal[
    "decision", "requirement", "deadline", "owner", "status", "amount",
    "risk", "dependency", "contact", "claim", "approval", "vendor_assignment",
    "tenant_issue", "accounting_flag"
]
ConflictType = Literal[
    "value_mismatch", "date_mismatch", "owner_mismatch", "status_mismatch",
    "duplicate_entity", "unsupported_claim", "missing_required_fact"
]

class SourceDocument(BaseModel):
    id: str
    source_type: SourceType
    filename: str
    title: Optional[str] = None
    author: Optional[str] = None
    property_id: Optional[str] = None
    created_at: Optional[datetime] = None
    ingested_at: datetime
    checksum: str
    metadata: dict[str, Any] = {}

class TextChunk(BaseModel):
    id: str
    source_document_id: str
    chunk_index: int
    text: str
    char_start: int
    char_end: int
    page_number: Optional[int] = None
    row_number: Optional[int] = None
    section_path: Optional[str] = None

class SourceSpan(BaseModel):
    id: str
    source_document_id: str
    chunk_id: str
    char_start: int
    char_end: int
    quote: str
    page_number: Optional[int] = None
    row_number: Optional[int] = None

class Entity(BaseModel):
    id: str
    canonical_name: str
    entity_type: EntityType
    aliases: list[str] = []
    attributes: dict[str, Any] = {}
    confidence: float = Field(ge=0, le=1)

class Fact(BaseModel):
    id: str
    property_id: str
    fact_type: FactType
    subject_entity_id: Optional[str]
    predicate: str
    object_value: str
    object_entity_id: Optional[str] = None
    normalized_value: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    confidence: float = Field(ge=0, le=1)
    extraction_model: str
    source_span_ids: list[str]
    supersedes_fact_ids: list[str] = []
    created_at: datetime

class Conflict(BaseModel):
    id: str
    conflict_type: ConflictType
    fact_ids: list[str]
    entity_ids: list[str]
    title: str
    explanation: str
    severity: Literal["low", "medium", "high"]
    status: Literal["open", "accepted", "dismissed", "resolved"]
    suggested_resolution: Optional[str] = None
    created_at: datetime

class VfsFile(BaseModel):
    id: str
    property_id: str
    path: str
    title: str
    content: str
    generated_hash: str
    last_generated_at: datetime
    source_fact_ids: list[str]

class PatchProposal(BaseModel):
    id: str
    property_id: str
    file_id: str
    path: str
    base_hash: str
    current_hash: str
    proposed_content: str
    unified_diff: str
    patch_status: Literal["pending", "applied", "rejected", "conflict"]
    preserves_human_edits: bool
    changed_fact_ids: list[str]
    reason: str
    created_at: datetime
```

## Feature 1: Demo Dataset Loader

Goal:

Load a realistic property-management dataset in one click.

Acceptance criteria:

- `POST /api/demo/reset` clears DB and generated files.
- `POST /api/demo/load` ingests `demo_data/properties/sonnenallee-44`.
- UI shows source count by type.
- Demo can run without external API calls using cached extraction outputs.

Recommended files:

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
```

Use `.txt` for PDF-like content if time is short. Name them as PDFs in metadata if needed.

## Feature 2: Ingestion and Chunking

Goal:

Normalize source files into source documents and text chunks.

Supported types for MVP:

- `.txt`
- `.md`
- `.csv`
- `.pdf` if parser setup is quick
- `.docx` optional

Acceptance criteria:

- Each source gets stable ID, checksum, type, filename, metadata.
- CSV rows become chunks with row numbers.
- Text files become chunks with character offsets.
- Chunks preserve enough location data for evidence display.

API:

```http
POST /api/ingest
GET /api/sources
GET /api/sources/{id}/chunks
```

## Feature 3: Extraction Pre-Pass

Goal:

Use Pioneer/Fastino/GLiNER2 or a compatible adapter to identify likely entities and fact types before expensive Gemini extraction.

Acceptance criteria:

- `ExtractionHint` exists per chunk.
- If Pioneer is unavailable, fallback heuristic pass returns the same shape.
- README documents how Pioneer/Fastino is used.

Adapter output:

```json
{
  "chunk_id": "chk_001",
  "document_kind": "tenant_complaint",
  "likely_entities": ["Sonnenallee 44", "Unit 4B", "Klara Hoffmann"],
  "likely_fact_types": ["tenant_issue", "status", "deadline"],
  "relevance_score": 0.93
}
```

## Feature 4: Gemini Structured Extraction

Goal:

Extract source-grounded entities and facts from chunks.

Acceptance criteria:

- Gemini prompt returns strict JSON.
- Invalid JSON is retried or falls back to cached extraction.
- Extracted fact includes `source_quote`.
- `source_quote` is mapped to a `SourceSpan`.
- Extraction output is validated before storing.

Prompt requirements:

- Mention property-management schema.
- Require citations via exact source quote.
- Require normalized values for dates, money, and statuses.
- Mark irrelevant/noise chunks.
- Avoid inventing facts not present in source.

Example extraction output:

```json
{
  "entities": [
    {
      "name": "Sonnenallee 44",
      "type": "property",
      "aliases": ["Sonnenallee 44, Berlin"],
      "confidence": 0.98,
      "source_quote": "Objekt: Sonnenallee 44, 12045 Berlin"
    }
  ],
  "facts": [
    {
      "type": "tenant_issue",
      "subject": "Roof leak at Sonnenallee 44",
      "predicate": "status",
      "object_value": "open",
      "normalized_value": "open",
      "confidence": 0.91,
      "source_quote": "The roof leak above unit 4B is still open."
    }
  ]
}
```

## Feature 5: Entity Resolution

Goal:

Merge duplicate entities with obvious evidence.

Acceptance criteria:

- Exact normalized property names merge.
- Vendor aliases merge when phone/email/domain matches.
- Tenant names merge when unit and email match.
- UI shows aliases under canonical entity.

Do not overbuild fuzzy matching. Use deterministic rules plus Gemini only for ambiguous pairs if time permits.

## Feature 6: Conflict Detection

Goal:

Detect stale, contradictory, or missing context before agents rely on it.

MVP conflict rules:

- Same subject + predicate + incompatible normalized value.
- Same invoice + different amount.
- Same issue + conflicting status.
- Same vendor task + conflicting approval state.
- Required property context missing emergency vendor.

Acceptance criteria:

- Conflicts list shows severity, title, explanation, evidence side by side.
- Each conflict links to source spans.
- Gemini can produce a human-readable explanation, but deterministic conflict object exists without Gemini.

Seed conflicts:

- Roof quote approved vs rejected.
- Roof issue closed vs open.
- Emergency spending threshold EUR 300 vs EUR 500.
- Invoice amount EUR 4,200 vs EUR 4,800.

## Feature 7: Markdown Virtual File System

Goal:

Generate agent-readable markdown and JSON artifacts per property.

Required output:

```text
generated_vfs/properties/sonnenallee-44/
  context.md
  facts.jsonl
  open_risks.md
  vendor_history.md
  accounting_flags.md
  agent_brief.md
  source_map.json
  qontext_ingest.json
```

Markdown generated blocks:

```markdown
<!-- cs:generated:start section=open_issues hash=abc123 -->
...
<!-- cs:generated:end section=open_issues -->
```

Human-edit area:

```markdown
## Human Notes

Add property-manager notes here. This section is never overwritten.
```

Acceptance criteria:

- Generated sections are anchored.
- Files include source fact IDs.
- `facts.jsonl` stores one fact per line.
- `qontext_ingest.json` includes entities, relationships, facts, sources, and paths.

## Feature 8: Surgical Patch Engine

Goal:

Update generated markdown without overwriting human edits.

Algorithm:

1. Parse current markdown.
2. Locate `cs:generated` blocks.
3. Compare current block hash with stored generated hash.
4. If unchanged, replace block.
5. If changed by human, mark patch conflict.
6. Preserve all text outside generated blocks.
7. Produce unified diff.
8. Allow apply/reject.

Acceptance criteria:

- Human notes outside generated blocks survive regeneration.
- Human edits inside generated blocks produce a patch conflict.
- Unified diff shows changed lines.
- UI shows `preserves_human_edits: true`.
- Tests cover the patcher.

## Feature 9: Agent Context Check

Goal:

Show how downstream agents benefit from compiled context.

Input prompt:

> Tenant in Unit 4B says the roof leak is still active. What should the property manager do today?

Output:

- Action plan.
- Context Health Score.
- Blocked actions.
- Facts used.
- Sources cited.
- Remaining uncertainty.

Acceptance criteria:

- Before patch: answer is incomplete or blocked due to conflicts.
- After patch: answer changes based on updated facts.
- UI makes the before/after difference visible.

## Feature 10: MCP/API Interface

Goal:

Expose Context Surgeon as an agent-usable context service.

REST endpoints:

```http
POST /api/demo/reset
POST /api/demo/load
POST /api/ingest
GET  /api/sources
GET  /api/entities
GET  /api/facts
GET  /api/conflicts
POST /api/vfs/generate
GET  /api/vfs/files
GET  /api/vfs/files/{id}
POST /api/vfs/files/{id}/edit
POST /api/patches/propose
POST /api/patches/{id}/apply
POST /api/patches/{id}/reject
POST /api/context-check
```

MCP tools:

```text
context_surgeon.search_facts
context_surgeon.get_property_context
context_surgeon.list_conflicts
context_surgeon.propose_fact_patch
context_surgeon.apply_patch
context_surgeon.context_check
```

MCP can be documented if implementation time runs out.

## Feature 11: UI

Navigation:

- Ingest
- Sources
- Facts
- Conflicts
- Files
- Patch Review
- Agent Check

Design requirements:

- Dense operational interface.
- No marketing hero.
- Clear status badges.
- Compact tables.
- Source evidence panel.
- Diff review panel.
- Context Health Score visible.

Primary demo screens:

1. Ingest demo data.
2. Fact ledger with citations.
3. Conflict review.
4. `context.md` file view.
5. Patch diff.
6. Agent context check.

## Feature 12: Cached Provider Mode

Goal:

Make the demo resilient.

Acceptance criteria:

- `PROVIDER_MODE=mock` uses cached extraction/enrichment and deterministic adapter contracts.
- `PROVIDER_MODE=live` calls live Gemini context-check and Tavily enrichment where keys are present, while preserving cached fallback contracts. Pioneer/Fastino is key-configured and model-id-gated; deterministic schema-first classification is the safe recording path until the onsite endpoint is confirmed.
- UI shows provider mode discreetly.
- README explains API keys but demo can run without them.

Environment variables:

```text
GEMINI_API_KEY=
TAVILY_API_KEY=
PIONEER_API_KEY=
PROVIDER_MODE=mock
```

## Testing Requirements

Critical tests:

```python
def test_human_notes_survive_regeneration():
    ...

def test_modified_generated_block_creates_patch_conflict():
    ...

def test_same_issue_different_status_flags_conflict():
    ...

def test_same_invoice_different_amount_flags_conflict():
    ...

def test_source_quote_maps_to_span():
    ...
```

Test command:

```bash
pytest
```

## Build Order

1. Demo dataset.
2. Data models and SQLite.
3. Ingestion/chunking.
4. Cached extraction output.
5. Conflict detector.
6. VFS generator.
7. Patch engine.
8. Minimal FastAPI endpoints.
9. UI for core flow.
10. Live Gemini/Tavily/Pioneer adapters.
11. MCP/API docs.
12. README, tests, demo video.

## Demo Script

1. Load Sonnenallee 44 demo data.
2. Show messy source list.
3. Open fact ledger and source citations.
4. Show open conflicts.
5. Generate property context VFS.
6. Add human note to `context.md`.
7. Ingest new vendor/owner email.
8. Show Fact Patch diff.
9. Apply patch and confirm human note survived.
10. Run agent context check.
11. Show changed action plan with citations.

## Submission Checklist

- Public GitHub repo.
- README with setup.
- Partner technology section.
- Architecture diagram.
- Demo data included.
- Cached provider mode works.
- 2-minute Loom/video.
- Aikido screenshot if entering side challenge.
- Clear track selection: Buena first, Qontext second if allowed.
