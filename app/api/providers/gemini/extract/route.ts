import { NextResponse } from "next/server";
import { loadDemoProperty, normalizeSources, chunkSources } from "@/lib/context-surgeon/ingestion";
import { extractFacts } from "@/lib/context-surgeon/extraction";
import { buildGeminiExtractionEnvelope } from "@/lib/context-surgeon/providers/contracts";

export async function POST() {
  const rawSources = loadDemoProperty(false);
  const sources = normalizeSources(rawSources);
  const chunks = chunkSources(sources);
  const result = extractFacts(sources, chunks, rawSources);
  const envelope = buildGeminiExtractionEnvelope({
    entityCount: result.entities.length,
    factCount: result.facts.length,
    spanCount: result.spans.length,
    sampleFact: result.facts.find((fact) => fact.id === "fact_roof_status_open_tenant") ?? result.facts[0],
    sampleSpan: result.spans[0]
  });

  return NextResponse.json({
    provider: "gemini",
    mode: envelope.status.effectiveMode,
    contract: "structured property fact extraction",
    status: envelope.status,
    fallback: envelope.fallback,
    sampleOutput: envelope.sampleOutput,
    providerContract: envelope.providerContract,
    ...result
  });
}
