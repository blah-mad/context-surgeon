import { describe, expect, it, afterEach } from "vitest";
import {
  buildGeminiExtractionEnvelope,
  buildPioneerFastinoEnvelope,
  buildTavilyEnvelope
} from "@/lib/context-surgeon/providers/contracts";

const ORIGINAL_PROVIDER_MODE = process.env.PROVIDER_MODE;
const ORIGINAL_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ORIGINAL_TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const ORIGINAL_PIONEER_API_KEY = process.env.PIONEER_API_KEY;

afterEach(() => {
  process.env.PROVIDER_MODE = ORIGINAL_PROVIDER_MODE;
  process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_API_KEY;
  process.env.TAVILY_API_KEY = ORIGINAL_TAVILY_API_KEY;
  process.env.PIONEER_API_KEY = ORIGINAL_PIONEER_API_KEY;
});

describe("provider partner-tech contracts", () => {
  it("returns a Gemini fallback contract without a real API key", () => {
    process.env.PROVIDER_MODE = "live";
    delete process.env.GEMINI_API_KEY;

    const envelope = buildGeminiExtractionEnvelope({ factCount: 12 });

    expect(envelope.status.provider).toBe("gemini");
    expect(envelope.status.requestedMode).toBe("live");
    expect(envelope.status.effectiveMode).toBe("cached");
    expect(envelope.status.health).toBe("degraded");
    expect(envelope.status.missingEnv).toContain("GEMINI_API_KEY");
    expect(envelope.fallback).toMatchObject({
      used: true,
      errorCode: "PROVIDER_CREDENTIALS_MISSING",
      responseShape: "provider-contract-fallback-v1",
      sampleSafe: true
    });
    expect(envelope.providerContract.sampleOutput).toEqual({ factCount: 12 });
  });

  it("exposes Tavily sample output and cache metadata in mock mode", () => {
    delete process.env.PROVIDER_MODE;
    delete process.env.TAVILY_API_KEY;

    const envelope = buildTavilyEnvelope({
      resultCount: 1,
      topResult: { title: "Mock external verification" }
    });

    expect(envelope.status.effectiveMode).toBe("mock");
    expect(envelope.status.cache.source).toBe("bundled-demo");
    expect(envelope.status.cache.key).toContain("tavily.external-enrichment.v1");
    expect(envelope.providerContract.outputSchema.enrichment).toBe("ExternalEnrichmentResult[]");
    expect(envelope.sampleOutput.resultCount).toBe(1);
  });

  it("captures Pioneer/Fastino classification schemas and missing credentials", () => {
    process.env.PROVIDER_MODE = "live";
    delete process.env.PIONEER_API_KEY;

    const envelope = buildPioneerFastinoEnvelope({
      classifiedSourceCount: 4,
      includedSourceCount: 3
    });

    expect(envelope.status.provider).toBe("pioneer-fastino");
    expect(envelope.status.missingEnv).toEqual(["PIONEER_API_KEY"]);
    expect(envelope.providerContract.inputSchema.sources).toBe("SourceDocument[]");
    expect(envelope.providerContract.outputSchema.hints).toBe("ChunkClassificationHint[]");
    expect(envelope.fallback.retryable).toBe(true);
  });
});
