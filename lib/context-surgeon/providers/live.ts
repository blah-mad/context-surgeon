import type { ContextCheckResult, ContextState } from "../types";

export function providerMode() {
  return process.env.PROVIDER_MODE === "live" ? "live" : process.env.PROVIDER_MODE === "cached" ? "cached" : "mock";
}

export async function callGeminiContextCheck(input: {
  before: ContextCheckResult;
  after: ContextCheckResult;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || providerMode() !== "live") return null;

  const prompt = [
    "Return a compact JSON object for a hackathon UI. Do not use markdown.",
    "Schema: {\"judgment\":\"one sentence\",\"riskBefore\":\"short phrase\",\"actionAfter\":\"short phrase\"}.",
    "Context: Context Surgeon applies a Fact Patch to preserve human edits and update stale property facts before an agent acts.",
    `Before: ${JSON.stringify(input.before)}`,
    `After: ${JSON.stringify(input.after)}`
  ].join("\n\n");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text.");

  try {
    return JSON.parse(text) as {
      judgment: string;
      riskBefore: string;
      actionAfter: string;
    };
  } catch {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as {
          judgment: string;
          riskBefore: string;
          actionAfter: string;
        };
      } catch {
        // Fall through to bounded text proof.
      }
    }
    return {
      judgment: text.replace(/```json|```/g, "").trim().slice(0, 500),
      riskBefore: "Gemini returned live natural-language reasoning instead of strict JSON.",
      actionAfter: "Context Surgeon normalized the live response into a safe bounded proof object."
    };
  }
}

export async function callTavilyEnrichment() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || providerMode() !== "live") return null;

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: "Berlin property management emergency roof leak temporary sealing vendor context",
      search_depth: "basic",
      max_results: 3,
      include_answer: true
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
  };

  return {
    answer: payload.answer ?? "Tavily returned search evidence for the property-management context check.",
    results: (payload.results ?? []).slice(0, 3).map((result) => ({
      title: result.title ?? "Untitled result",
      url: result.url ?? "",
      snippet: result.content ?? "",
      confidence: typeof result.score === "number" ? result.score : 0.5,
      sourceType: "live-search-result" as const
    }))
  };
}

export function pioneerLiveProof(state: ContextState) {
  const liveReady = Boolean(process.env.PIONEER_API_KEY) && providerMode() === "live";
  if (!liveReady) return null;

  return {
    modelFamily: "Pioneer/Fastino",
    apiKeyConfigured: true,
    liveCall: "not executed",
    reason:
      "Pioneer credentials are configured. The route keeps deterministic schema-first relevance output until the onsite model/inference endpoint is confirmed.",
    classifiedSourceCount: state.sources.length
  };
}
