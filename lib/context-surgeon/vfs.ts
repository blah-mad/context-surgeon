import type { Conflict, Entity, Fact, SourceDocument, SourceSpan, VfsFile } from "./types";
import { escapeMarkdown, nowIso, stableHash, unique } from "./utils";

function generatedBlock(section: string, content: string): string {
  const hash = stableHash(content);
  return `<!-- cs:generated:start section=${section} hash=${hash} -->\n${content}\n<!-- cs:generated:end section=${section} -->`;
}

function sourceLabel(fact: Fact, spans: SourceSpan[], sources: SourceDocument[]): string {
  const span = spans.find((item) => fact.sourceSpanIds.includes(item.id));
  const source = sources.find((item) => item.id === span?.sourceDocumentId);
  if (!source || !span) return "unknown source";
  const locator = span.rowNumber ? `row ${span.rowNumber}` : span.pageNumber ? `p${span.pageNumber}` : "quote";
  return `${source.filename}, ${locator}`;
}

function entityName(entities: Entity[], id?: string): string {
  return entities.find((entity) => entity.id === id)?.canonicalName ?? "Unknown";
}

function activeFacts(facts: Fact[]): Fact[] {
  return facts.filter((fact) => !facts.some((other) => other.supersedesFactIds.includes(fact.id)));
}

function contextMarkdown(
  propertyId: string,
  facts: Fact[],
  conflicts: Conflict[],
  entities: Entity[],
  spans: SourceSpan[],
  sources: SourceDocument[]
): string {
  const currentFacts = activeFacts(facts);
  const openIssueRows = currentFacts
    .filter((fact) => ["status", "tenant_issue", "vendor_assignment", "approval", "deadline"].includes(fact.factType))
    .map(
      (fact) =>
        `| ${escapeMarkdown(entityName(entities, fact.subjectEntityId))} | ${escapeMarkdown(fact.predicate)} | ${escapeMarkdown(fact.objectValue)} | ${(fact.confidence * 100).toFixed(0)}% | ${escapeMarkdown(sourceLabel(fact, spans, sources))} |`
    )
    .join("\n");
  const issueTable = [
    "| Subject | Predicate | Value | Confidence | Source |",
    "|---|---|---:|---:|---|",
    openIssueRows
  ].join("\n");

  const riskList =
    conflicts.length > 0
      ? conflicts.map((conflict) => `- **${conflict.severity.toUpperCase()}** ${conflict.title}`).join("\n")
      : "- No unresolved context conflicts.";

  return `---\nid: ${propertyId}\ntype: property_context\nsource_facts: ${JSON.stringify(currentFacts.map((fact) => fact.id))}\n---\n\n# Sonnenallee 44 Context\n\n${generatedBlock(
    "summary",
    "Sonnenallee 44 is an active Berlin property handover with an unresolved roof-leak workflow above Unit 4B. Context health depends on resolving vendor approval, owner threshold, and invoice amount conflicts before an agent dispatches work."
  )}\n\n## Human Notes\n\nAdd property-manager notes here. This section is never overwritten by Context Surgeon.\n\n## Operational Facts\n\n${generatedBlock("operational_facts", issueTable)}\n\n## Open Risks\n\n${generatedBlock("open_risks", riskList)}\n`;
}

function openRisksMarkdown(conflicts: Conflict[]): string {
  const content =
    conflicts.length > 0
      ? conflicts
          .map(
            (conflict) =>
              `## ${conflict.title}\n\n- Severity: ${conflict.severity}\n- Status: ${conflict.status}\n- Explanation: ${conflict.explanation}\n- Suggested resolution: ${conflict.suggestedResolution ?? "Review source evidence."}`
          )
          .join("\n\n")
      : "No open context risks.";
  return `# Open Risks\n\n${generatedBlock("risk_register", content)}\n`;
}

function vendorHistoryMarkdown(facts: Fact[], entities: Entity[], spans: SourceSpan[], sources: SourceDocument[]): string {
  const rows = activeFacts(facts)
    .filter((fact) => fact.factType === "vendor_assignment" || fact.subjectEntityId?.includes("vendor"))
    .map(
      (fact) =>
        `| ${escapeMarkdown(entityName(entities, fact.subjectEntityId))} | ${escapeMarkdown(fact.predicate)} | ${escapeMarkdown(fact.objectValue)} | ${escapeMarkdown(sourceLabel(fact, spans, sources))} |`
    )
    .join("\n");
  return `# Vendor History\n\n${generatedBlock(
    "vendor_table",
    ["| Vendor / Issue | Predicate | Value | Source |", "|---|---|---|---|", rows || "| None | - | - | - |"].join("\n")
  )}\n`;
}

function accountingFlagsMarkdown(facts: Fact[], spans: SourceSpan[], sources: SourceDocument[]): string {
  const amountFacts = activeFacts(facts).filter((fact) => fact.factType === "amount");
  const rows = amountFacts
    .map(
      (fact) =>
        `| ${fact.id} | ${escapeMarkdown(fact.predicate)} | ${escapeMarkdown(fact.objectValue)} | ${escapeMarkdown(sourceLabel(fact, spans, sources))} |`
    )
    .join("\n");
  return `# Accounting Flags\n\n${generatedBlock(
    "amount_table",
    ["| Fact | Predicate | Amount | Source |", "|---|---|---:|---|", rows].join("\n")
  )}\n`;
}

function factLedgerJsonl(facts: Fact[]): string {
  return facts.map((fact) => JSON.stringify(fact)).join("\n");
}

function sourceMapJson(spans: SourceSpan[], sources: SourceDocument[]): string {
  return JSON.stringify(
    {
      sources: sources.map(({ text: _text, ...source }) => source),
      spans
    },
    null,
    2
  );
}

function qontextIngestJson(facts: Fact[], entities: Entity[], sources: SourceDocument[], spans: SourceSpan[]): string {
  return JSON.stringify(
    {
      virtualFileSystem: `/properties/sonnenallee-44`,
      entities,
      facts,
      relationships: facts.map((fact) => ({
        from: fact.subjectEntityId,
        predicate: fact.predicate,
        to: fact.objectEntityId ?? fact.objectValue,
        sourceSpanIds: fact.sourceSpanIds
      })),
      sources: sources.map(({ text: _text, ...source }) => source),
      spans
    },
    null,
    2
  );
}

function makeFile(propertyId: string, path: string, title: string, content: string, factIds: string[]): VfsFile {
  return {
    id: `file_${stableHash(path)}`,
    propertyId,
    path,
    title,
    content,
    generatedHash: stableHash(content),
    lastGeneratedAt: nowIso(),
    sourceFactIds: unique(factIds)
  };
}

export function generateVfs(
  propertyId: string,
  sources: SourceDocument[],
  entities: Entity[],
  facts: Fact[],
  spans: SourceSpan[],
  conflicts: Conflict[]
): VfsFile[] {
  const factIds = facts.map((fact) => fact.id);
  return [
    makeFile(
      propertyId,
      "/properties/sonnenallee-44/context.md",
      "Property Context",
      contextMarkdown(propertyId, facts, conflicts, entities, spans, sources),
      factIds
    ),
    makeFile(
      propertyId,
      "/properties/sonnenallee-44/facts.jsonl",
      "Fact Ledger",
      factLedgerJsonl(facts),
      factIds
    ),
    makeFile(
      propertyId,
      "/properties/sonnenallee-44/open_risks.md",
      "Open Risks",
      openRisksMarkdown(conflicts),
      conflicts.flatMap((conflict) => conflict.factIds)
    ),
    makeFile(
      propertyId,
      "/properties/sonnenallee-44/vendor_history.md",
      "Vendor History",
      vendorHistoryMarkdown(facts, entities, spans, sources),
      factIds
    ),
    makeFile(
      propertyId,
      "/properties/sonnenallee-44/accounting_flags.md",
      "Accounting Flags",
      accountingFlagsMarkdown(facts, spans, sources),
      factIds
    ),
    makeFile(
      propertyId,
      "/provenance/source_map.json",
      "Source Map",
      sourceMapJson(spans, sources),
      factIds
    ),
    makeFile(
      propertyId,
      "/properties/sonnenallee-44/qontext_ingest.json",
      "Qontext Ingest",
      qontextIngestJson(facts, entities, sources, spans),
      factIds
    )
  ];
}

