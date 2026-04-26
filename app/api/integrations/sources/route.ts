import { NextRequest, NextResponse } from "next/server";
import { buildDemoSync } from "@/lib/context-surgeon/integrations/composio";
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

  const url = new URL(request.url);
  const toolkits = url.searchParams.getAll("toolkit");
  const sync = buildDemoSync(toolkits);
  return NextResponse.json({
    mode: sync.mode,
    workspaceId: sync.workspaceId,
    sources: sync.sources,
    provenanceContract: {
      connector: "toolkitSlug",
      externalId: "id",
      timestamp: "timestamp",
      sourceType: "sourceType",
      retainedFields: ["title", "summary", "facts.quote", "confidence"]
    }
  });
}
