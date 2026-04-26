import { DEMO_ENTITIES, RAW_DEMO_SOURCES } from "./demo-data";
import type { Entity, Fact, RawDemoSource, SourceDocument, SourceSpan, TextChunk } from "./types";
import { nowIso } from "./utils";

function findRawSource(sourceId: string, rawSources: RawDemoSource[]): RawDemoSource | undefined {
  return rawSources.find((source) => source.id === sourceId);
}

function findChunkForQuote(chunks: TextChunk[], sourceId: string, quoteStart: number): TextChunk {
  const matching = chunks.find(
    (chunk) =>
      chunk.sourceDocumentId === sourceId &&
      quoteStart >= chunk.charStart &&
      quoteStart <= chunk.charEnd
  );
  return matching ?? chunks.find((chunk) => chunk.sourceDocumentId === sourceId)!;
}

export function extractFacts(
  sources: SourceDocument[],
  chunks: TextChunk[],
  rawSources: RawDemoSource[] = RAW_DEMO_SOURCES
): { entities: Entity[]; facts: Fact[]; spans: SourceSpan[] } {
  const spans: SourceSpan[] = [];
  const facts: Fact[] = [];
  const sourceIds = new Set(sources.map((source) => source.id));
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  for (const sourceId of sourceIds) {
    const raw = findRawSource(sourceId, rawSources);
    const normalized = sourceById.get(sourceId);
    if (!raw || !normalized) continue;

    for (const rawFact of raw.facts) {
      const quoteStart = normalized.text.indexOf(rawFact.sourceQuote);
      const safeStart = quoteStart >= 0 ? quoteStart : 0;
      const chunk = findChunkForQuote(chunks, sourceId, safeStart);
      const span: SourceSpan = {
        id: `span_${rawFact.id}`,
        sourceDocumentId: sourceId,
        chunkId: chunk.id,
        charStart: safeStart,
        charEnd: safeStart + rawFact.sourceQuote.length,
        quote: rawFact.sourceQuote,
        pageNumber: chunk.pageNumber,
        rowNumber: chunk.rowNumber
      };
      spans.push(span);
      facts.push({
        id: rawFact.id,
        propertyId: normalized.propertyId,
        factType: rawFact.factType,
        subjectEntityId: rawFact.subjectEntityId,
        predicate: rawFact.predicate,
        objectValue: rawFact.objectValue,
        objectEntityId: rawFact.objectEntityId,
        normalizedValue: rawFact.normalizedValue,
        confidence: rawFact.confidence,
        extractionModel: "mock:pioneer-prepass+gemini-structured",
        sourceSpanIds: [span.id],
        supersedesFactIds: rawFact.supersedesFactIds ?? [],
        createdAt: nowIso()
      });
    }
  }

  return { entities: DEMO_ENTITIES, facts, spans };
}

export function classifyChunks(chunks: TextChunk[]) {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    documentKind: chunk.text.toLowerCase().includes("roof")
      ? "maintenance_update"
      : chunk.text.toLowerCase().includes("invoice")
        ? "accounting_export"
        : "property_context",
    likelyFactTypes: chunk.text.toLowerCase().includes("approved")
      ? ["approval", "status"]
      : ["claim"],
    relevanceScore: chunk.text.toLowerCase().includes("sonnenallee") ? 0.94 : 0.71
  }));
}

