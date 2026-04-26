import { NextRequest, NextResponse } from "next/server";
import { transitionSnapshot } from "@/lib/context-surgeon/server/store";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

const allowedActions = new Set(["compile", "human-note", "ingest-email", "apply-patch"]);

export async function POST(request: NextRequest) {
  try {
    await verifyFirebaseRequest(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (!body.action || !allowedActions.has(body.action)) {
    return NextResponse.json(
      { ok: false, error: "Expected action: compile, human-note, ingest-email, or apply-patch." },
      { status: 400 }
    );
  }

  return NextResponse.json(await transitionSnapshot(body.action));
}
