import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

const eventLabels: Record<string, string> = {
  new_email: "New scoped email or reply",
  new_attachment: "New matching attachment",
  crm_update: "CRM account/contact/case changed",
  file_update: "File added or revised",
  support_update: "Ticket or conversation updated",
  work_update: "Issue/task status changed"
};

export async function GET() {
  return NextResponse.json({
    mode: "demo",
    rules: [
      {
        id: "demo-rule-scope-patch",
        scope: "Sonnenallee 44",
        events: ["new_email", "new_attachment", "crm_update", "file_update", "support_update"],
        action: "create_candidate_source_and_propose_fact_patch",
        status: "active",
        eventLabels
      }
    ]
  });
}

export async function POST(request: NextRequest) {
  let userId = "public-demo";
  try {
    userId = (await verifyFirebaseRequest(request)).uid;
  } catch {
    if (process.env.INTEGRATIONS_MODE === "live") {
      return NextResponse.json({ ok: false, error: "Missing Firebase ID token." }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => ({}))) as {
    scope?: string;
    toolkits?: string[];
    events?: string[];
    autoPatch?: boolean;
  };

  const events = body.events?.length ? body.events : ["new_email", "file_update", "support_update"];
  return NextResponse.json({
    ok: true,
    mode: process.env.INTEGRATIONS_MODE === "live" ? "live" : "demo",
    rule: {
      id: `rule-${Date.now()}`,
      userId,
      scope: body.scope ?? "Sonnenallee 44",
      toolkits: body.toolkits ?? ["gmail", "hubspot", "googledrive"],
      events,
      action: body.autoPatch
        ? "create_candidate_source_classify_and_propose_fact_patch"
        : "create_candidate_source_for_review",
      status: "active",
      eventLabels,
      createdAt: new Date().toISOString()
    }
  });
}
