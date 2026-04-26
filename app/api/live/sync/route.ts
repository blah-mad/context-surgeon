import { NextResponse } from "next/server";
import { POST as syncIntegrations } from "@/app/api/integrations/sync/route";

export const POST = syncIntegrations;

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/live/sync",
    auth: "Firebase ID token in Authorization: Bearer <token>",
    contentType: "application/json",
    body: {
      toolkitSlugs: ["gmail", "hubspot", "googledrive"],
      query: "Sonnenallee 44",
      limit: 10
    },
    returns: "Candidate sources normalized from connected systems into the same source/fact contract used by the compiler."
  });
}
