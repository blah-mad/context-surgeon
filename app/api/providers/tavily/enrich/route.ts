import { NextResponse } from "next/server";
import { buildTavilyEnvelope } from "@/lib/context-surgeon/providers/contracts";
import { callTavilyEnrichment, providerMode } from "@/lib/context-surgeon/providers/live";

export async function POST() {
  let liveEnrichment: Awaited<ReturnType<typeof callTavilyEnrichment>> | null = null;
  let liveError: string | undefined;

  try {
    liveEnrichment = await callTavilyEnrichment();
  } catch (error) {
    liveError = error instanceof Error ? error.message : "Tavily live call failed.";
  }

  const enrichment = liveEnrichment?.results.length ? liveEnrichment.results.map((result) => ({
    entity: "Sonnenallee 44",
    query: "Berlin property management emergency roof leak temporary sealing vendor context",
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    confidence: result.confidence,
    observedAt: new Date().toISOString(),
    sourceType: result.sourceType
  })) : [
    {
      entity: "Sonnenallee 44",
      query: "Sonnenallee 44 Berlin property context vendor emergency maintenance",
      title: "Mock external verification",
      url: "https://example.com/mock-tavily-sonnenallee-44",
      snippet:
        "Mock Tavily enrichment confirms this provider adapter is wired for source crawling and public verification.",
      confidence: 0.72,
      observedAt: "2026-04-25T00:00:00.000Z",
      sourceType: "cached-search-result"
    }
  ];
  const envelope = buildTavilyEnvelope({
    resultCount: enrichment.length,
    topResult: enrichment[0],
    liveAnswer: liveEnrichment?.answer ?? null,
    citation: {
      title: enrichment[0].title,
      url: enrichment[0].url,
      confidence: enrichment[0].confidence
    }
  }, liveEnrichment
    ? {
        effectiveMode: "live",
        fallbackUsed: false,
        note: "Live Tavily enrichment returned search evidence."
      }
    : liveError && providerMode() === "live"
      ? {
          effectiveMode: "cached",
          health: "degraded",
          fallbackUsed: true,
          fallbackReason: liveError,
          errorCode: "TAVILY_LIVE_CALL_FAILED",
          retryable: true,
          note: "Live Tavily call failed; deterministic enrichment proof is returned."
        }
      : undefined);

  return NextResponse.json({
    provider: "tavily",
    mode: envelope.status.effectiveMode,
    status: envelope.status,
    fallback: envelope.fallback,
    sampleOutput: envelope.sampleOutput,
    providerContract: envelope.providerContract,
    liveAnswer: liveEnrichment?.answer ?? null,
    enrichment
  });
}
