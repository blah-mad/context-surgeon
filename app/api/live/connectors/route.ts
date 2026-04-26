import { NextResponse } from "next/server";
import { GET as listIntegrations } from "@/app/api/integrations/route";

export const GET = listIntegrations;

export async function OPTIONS() {
  return NextResponse.json({
    ok: true,
    endpoint: "GET /api/live/connectors",
    purpose: "List supported live-mode connectors and current connection state.",
    auth: "Optional. Without auth, returns the safe demo catalog. With Firebase auth, returns user-scoped live connection state."
  });
}
