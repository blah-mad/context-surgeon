import { NextResponse } from "next/server";
import { POST as createConnection } from "@/app/api/integrations/connect/route";

export const POST = createConnection;

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/live/connect",
    auth: "Firebase ID token in Authorization: Bearer <token>",
    contentType: "application/json",
    body: {
      toolkitSlug: "gmail"
    },
    returns: "A Composio OAuth connect URL when live credentials are configured, or setup guidance in demo mode."
  });
}
