import { RAW_DEMO_SOURCES } from "./demo-data";
import type { RawDemoSource, SourceDocument, SourceRelevance, TextChunk } from "./types";
import { nowIso, stableHash } from "./utils";

export function loadDemoProperty(includeIncoming = false): RawDemoSource[] {
  return RAW_DEMO_SOURCES.filter((source) =>
    includeIncoming ? true : source.phase === "initial"
  );
}

export function loadIncomingSource(): RawDemoSource {
  const source = RAW_DEMO_SOURCES.find((item) => item.phase === "incoming" && item.metadata?.demoTrigger);
  if (!source) throw new Error("Incoming demo source is missing.");
  return source;
}

function relevanceForSource(source: RawDemoSource): SourceRelevance {
  if (source.relevance) return source.relevance;
  if (source.facts.length === 0) {
    return {
      status: "ignored",
      score: 0.18,
      reason: "No durable property facts, commitments, deadlines, approvals, or contradictions found.",
      classifier: "pioneer-fastino-mock"
    };
  }
  return {
    status: "included",
    score: source.phase === "incoming" ? 0.96 : 0.86,
    reason: "Contains operational facts that affect the property memory or downstream agent actions.",
    classifier: "pioneer-fastino-mock"
  };
}

export function normalizeSources(rawSources: RawDemoSource[]): SourceDocument[] {
  return rawSources.map((source) => ({
    id: source.id,
    sourceType: source.sourceType,
    filename: source.filename,
    title: source.title,
    author: source.author,
    propertyId: source.propertyId,
    createdAt: source.createdAt,
    ingestedAt: nowIso(),
    checksum: stableHash(source.text),
    metadata: source.metadata ?? {},
    relevance: relevanceForSource(source),
    text: source.text
  }));
}

export function chunkSources(sources: SourceDocument[]): TextChunk[] {
  return sources.flatMap<TextChunk>((source) => {
    if (source.sourceType === "csv") {
      return source.text.split("\n").map((row, index) => ({
        id: `chk_${source.id}_${index}`,
        sourceDocumentId: source.id,
        chunkIndex: index,
        text: row,
        charStart: source.text.indexOf(row),
        charEnd: source.text.indexOf(row) + row.length,
        pageNumber: undefined,
        rowNumber: index + 1,
        sectionPath: "csv-row"
      }));
    }

    const paragraphs = source.text
      .split(/\n{2,}/)
      .map((text) => text.trim())
      .filter(Boolean);

    let cursor = 0;
    return paragraphs.map((paragraph, index) => {
      const start = source.text.indexOf(paragraph, cursor);
      cursor = start + paragraph.length;
      return {
        id: `chk_${source.id}_${index}`,
        sourceDocumentId: source.id,
        chunkIndex: index,
        text: paragraph,
        charStart: start,
        charEnd: start + paragraph.length,
        pageNumber: source.sourceType === "pdf" ? Math.max(1, index) : undefined,
        rowNumber: undefined,
        sectionPath: index === 0 ? "header" : "body"
      };
    });
  });
}
