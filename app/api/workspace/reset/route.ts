import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resetSnapshot } from "@/lib/context-surgeon/server/store";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

export async function POST(request: NextRequest) {
  try {
    await verifyFirebaseRequest(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 }
    );
  }

  return NextResponse.json(await resetSnapshot());
}
