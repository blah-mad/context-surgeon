import { NextRequest, NextResponse } from "next/server";
import {
  composioApiKey,
  disableComposioConnectedAccount
} from "@/lib/context-surgeon/integrations/composio";
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

  const body = (await request.json().catch(() => ({}))) as { connectionId?: string };
  if (!body.connectionId) {
    return NextResponse.json({ ok: false, error: "Expected connectionId." }, { status: 400 });
  }

  if (!composioApiKey() || process.env.INTEGRATIONS_MODE !== "live") {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      connectionId: body.connectionId,
      status: "disconnected"
    });
  }

  await disableComposioConnectedAccount(body.connectionId);
  return NextResponse.json({
    ok: true,
    mode: "live",
    connectionId: body.connectionId,
    status: "disabled"
  });
}
