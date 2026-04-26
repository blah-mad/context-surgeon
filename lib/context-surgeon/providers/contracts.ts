export type ProviderId = "gemini" | "tavily" | "pioneer-fastino";

export type ProviderMode = "mock" | "cached" | "live";

export type ProviderHealth = "ok" | "degraded" | "unavailable";

export interface ProviderCacheMetadata {
  key: string;
  source: "bundled-demo" | "last-known-good" | "none";
  ttlSeconds: number;
  generatedAt: string;
}

export interface ProviderStatusMetadata {
  provider: ProviderId;
  requestedMode: ProviderMode;
  effectiveMode: ProviderMode;
  health: ProviderHealth;
  liveReady: boolean;
  requiredEnv: string[];
  missingEnv: string[];
  cache: ProviderCacheMetadata;
  note: string;
}

export interface ProviderFallbackMetadata {
  used: boolean;
  reason: string;
  errorCode: string | null;
  retryable: boolean;
  responseShape: "provider-contract-fallback-v1";
  sampleSafe: boolean;
}

interface ProviderRuntimeOverride {
  effectiveMode?: ProviderMode;
  health?: ProviderHealth;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  errorCode?: string | null;
  retryable?: boolean;
  note?: string;
}

export interface ProviderContractMetadata {
  id: string;
  version: "2026-04-25";
  provider: ProviderId;
  purpose: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  status: ProviderStatusMetadata;
  fallback: ProviderFallbackMetadata;
  sampleOutput: Record<string, unknown>;
}

export interface ProviderEnvelope {
  status: ProviderStatusMetadata;
  fallback: ProviderFallbackMetadata;
  sampleOutput: Record<string, unknown>;
  providerContract: ProviderContractMetadata;
}

interface BuildProviderContractOptions {
  provider: ProviderId;
  contractId: string;
  purpose: string;
  requiredEnv: string[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  sampleOutput: Record<string, unknown>;
  runtime?: ProviderRuntimeOverride;
}

const CONTRACT_VERSION = "2026-04-25";
const GENERATED_AT = "2026-04-25T00:00:00.000Z";
const VALID_MODES: ProviderMode[] = ["mock", "cached", "live"];

function requestedProviderMode(): ProviderMode {
  const raw = process.env.PROVIDER_MODE;
  if (raw && VALID_MODES.includes(raw as ProviderMode)) return raw as ProviderMode;
  return "mock";
}

function missingEnv(requiredEnv: string[]): string[] {
  return requiredEnv.filter((name) => !process.env[name]);
}

function cacheKey(provider: ProviderId, contractId: string): string {
  return `context-surgeon:${provider}:${contractId}:${CONTRACT_VERSION}`;
}

export function buildProviderEnvelope(options: BuildProviderContractOptions): ProviderEnvelope {
  const requestedMode = requestedProviderMode();
  const missing = missingEnv(options.requiredEnv);
  const liveReady = missing.length === 0;
  const effectiveMode: ProviderMode =
    options.runtime?.effectiveMode ??
    (requestedMode === "live" && liveReady ? "live" : requestedMode === "live" || requestedMode === "cached" ? "cached" : "mock");
  const fallbackUsed = options.runtime?.fallbackUsed ?? effectiveMode !== "live";
  const liveBlocked = requestedMode === "live" && !liveReady;
  const health = options.runtime?.health ?? (liveBlocked ? "degraded" : "ok");

  const status: ProviderStatusMetadata = {
    provider: options.provider,
    requestedMode,
    effectiveMode,
    health,
    liveReady,
    requiredEnv: options.requiredEnv,
    missingEnv: missing,
    cache: {
      key: cacheKey(options.provider, options.contractId),
      source: effectiveMode === "live" ? "none" : effectiveMode === "mock" ? "bundled-demo" : "last-known-good",
      ttlSeconds: 86400,
      generatedAt: GENERATED_AT
    },
    note:
      options.runtime?.note ??
      (effectiveMode === "live"
        ? "Live provider call completed and returned a bounded proof payload."
        : liveBlocked
          ? "Live provider credentials are not configured; returning the cached contract shape."
          : "Deterministic provider contract response. No live provider call is required.")
  };

  const fallback: ProviderFallbackMetadata = {
    used: fallbackUsed,
    reason:
      options.runtime?.fallbackReason ??
      (liveBlocked
        ? `Missing required provider environment variables: ${missing.join(", ")}.`
        : effectiveMode === "live"
          ? "Live provider response used."
          : "Mock/cached contract mode is active for partner-tech proof."),
    errorCode: options.runtime?.errorCode ?? (liveBlocked ? "PROVIDER_CREDENTIALS_MISSING" : null),
    retryable: options.runtime?.retryable ?? liveBlocked,
    responseShape: "provider-contract-fallback-v1",
    sampleSafe: true
  };

  const providerContract: ProviderContractMetadata = {
    id: options.contractId,
    version: CONTRACT_VERSION,
    provider: options.provider,
    purpose: options.purpose,
    inputSchema: options.inputSchema,
    outputSchema: options.outputSchema,
    status,
    fallback,
    sampleOutput: options.sampleOutput
  };

  return {
    status,
    fallback,
    sampleOutput: options.sampleOutput,
    providerContract
  };
}

export function buildGeminiExtractionEnvelope(sampleOutput: Record<string, unknown>): ProviderEnvelope {
  return buildProviderEnvelope({
    provider: "gemini",
    contractId: "gemini.structured-extraction.v1",
    purpose: "Extract normalized property facts, entities, and source spans from ingested documents.",
    requiredEnv: ["GEMINI_API_KEY"],
    inputSchema: {
      sources: "SourceDocument[]",
      chunks: "TextChunk[]",
      propertyId: "string"
    },
    outputSchema: {
      entities: "Entity[]",
      facts: "Fact[]",
      spans: "SourceSpan[]"
    },
    sampleOutput
  });
}

export function buildGeminiContextCheckEnvelope(
  sampleOutput: Record<string, unknown>,
  runtime?: ProviderRuntimeOverride
): ProviderEnvelope {
  return buildProviderEnvelope({
    provider: "gemini",
    contractId: "gemini.context-check.v1",
    purpose: "Run agent pre-flight reasoning over facts and conflicts before operational action.",
    requiredEnv: ["GEMINI_API_KEY"],
    inputSchema: {
      facts: "Fact[]",
      conflicts: "Conflict[]",
      candidateActions: "ContextAction[]"
    },
    outputSchema: {
      before: "ContextCheckResult",
      after: "ContextCheckResult"
    },
    sampleOutput,
    runtime
  });
}

export function buildTavilyEnvelope(
  sampleOutput: Record<string, unknown>,
  runtime?: ProviderRuntimeOverride
): ProviderEnvelope {
  return buildProviderEnvelope({
    provider: "tavily",
    contractId: "tavily.external-enrichment.v1",
    purpose: "Verify property, vendor, and public web context for extracted operational claims.",
    requiredEnv: ["TAVILY_API_KEY"],
    inputSchema: {
      entity: "string",
      query: "string",
      maxResults: "number"
    },
    outputSchema: {
      enrichment: "ExternalEnrichmentResult[]"
    },
    sampleOutput,
    runtime
  });
}

export function buildPioneerFastinoEnvelope(
  sampleOutput: Record<string, unknown>,
  runtime?: ProviderRuntimeOverride
): ProviderEnvelope {
  return buildProviderEnvelope({
    provider: "pioneer-fastino",
    contractId: "pioneer-fastino.classification.v1",
    purpose: "Classify source relevance and produce schema-first extraction hints before fact extraction.",
    requiredEnv: ["PIONEER_API_KEY"],
    inputSchema: {
      sources: "SourceDocument[]",
      chunks: "TextChunk[]"
    },
    outputSchema: {
      sourceRelevance: "SourceRelevance[]",
      hints: "ChunkClassificationHint[]"
    },
    sampleOutput,
    runtime
  });
}
