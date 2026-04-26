import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSnapshot } from "@/lib/context-surgeon/server/store";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

export async function GET(request: NextRequest) {
  try {
    await verifyFirebaseRequest(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 }
    );
  }

  const snapshot = await getSnapshot();
  return NextResponse.json({
    propertyId: snapshot.propertyId,
    propertyName: snapshot.propertyName,
    generatedAt: snapshot.generatedAt,
    phase: snapshot.phase,
    sourceRelevance: snapshot.current.sources.map((source) => ({
      sourceId: source.id,
      filename: source.filename,
      title: source.title,
      sourceType: source.sourceType,
      relevance: source.relevance
    })),
    virtualFileSystem: snapshot.current.files.map((file) => ({
      path: file.path,
      title: file.title,
      content: file.content,
      sourceFactIds: file.sourceFactIds,
      generatedHash: file.generatedHash
    })),
    graph: {
      facts: snapshot.current.facts.map((fact) => ({
        id: fact.id,
        type: fact.factType,
        subjectEntityId: fact.subjectEntityId,
        predicate: fact.predicate,
        objectValue: fact.objectValue,
        sourceSpanIds: fact.sourceSpanIds,
        supersedesFactIds: fact.supersedesFactIds
      })),
      conflicts: snapshot.current.conflicts
    },
    provenance: snapshot.current.spans,
    partnerTechnologyProof: {
      gemini: "Structured extraction, conflict explanation, and agent pre-flight reasoning adapter.",
      tavily: "External enrichment and verification adapter for public/vendor context.",
      pioneerFastino: "Schema-first source relevance, document classification, and extraction pre-pass."
    }
  });
}
