import { NextResponse } from "next/server";
import { loadDemoProperty, normalizeSources, chunkSources } from "@/lib/context-surgeon/ingestion";
import { classifyChunks } from "@/lib/context-surgeon/extraction";
import { buildPioneerFastinoEnvelope } from "@/lib/context-surgeon/providers/contracts";
import { pioneerLiveProof } from "@/lib/context-surgeon/providers/live";

export async function POST() {
  const sources = normalizeSources(loadDemoProperty(false));
  const chunks = chunkSources(sources);
  const sourceRelevance = sources.map((source) => ({
    sourceId: source.id,
    filename: source.filename,
    status: source.relevance.status,
    score: source.relevance.score,
    reason: source.relevance.reason,
    classifier: source.relevance.classifier
  }));
  const hints = classifyChunks(chunks);
  const state = {
    propertyId: "sonnenallee-44",
    propertyName: "Sonnenallee 44",
    sources,
    chunks,
    spans: [],
    entities: [],
    facts: [],
    conflicts: [],
    files: []
  };
  const liveProof = pioneerLiveProof(state);
  const envelope = buildPioneerFastinoEnvelope({
    classifiedSourceCount: sourceRelevance.length,
    includedSourceCount: sourceRelevance.filter((source) => source.status === "included").length,
    sampleSourceRelevance: sourceRelevance[0],
    sampleHint: hints[0],
    liveProof
  }, liveProof
    ? {
        effectiveMode: "live",
        fallbackUsed: false,
        note: "Pioneer API key is configured; deterministic source relevance remains the safe demo output until a specific onsite model id is confirmed."
      }
    : undefined);

  return NextResponse.json({
    provider: "pioneer-fastino",
    mode: envelope.status.effectiveMode,
    contract: "schema-first document classification, source relevance, and extraction hints",
    status: envelope.status,
    fallback: envelope.fallback,
    sampleOutput: envelope.sampleOutput,
    providerContract: envelope.providerContract,
    liveProof,
    sourceRelevance,
    hints
  });
}
