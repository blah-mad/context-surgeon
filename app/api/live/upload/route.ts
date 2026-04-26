import { NextResponse } from "next/server";
import { POST as uploadEvidence } from "@/app/api/integrations/upload/route";

export const POST = uploadEvidence;

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "Context Surgeon Live API",
    endpoint: "POST /api/live/upload",
    auth: "Firebase ID token in Authorization: Bearer <token>",
    contentType: "multipart/form-data",
    fields: {
      files: "One or more PDF, Word, text, CSV, JSON, Markdown, image, or export files."
    },
    returns: {
      sources: "Normalized candidate sources with source type, confidence, summary, and fact candidates.",
      nextActions: "Review, approve, compile, and publish through the same Fact Patch workflow."
    },
    example: [
      "curl -X POST https://contextsurgeon.fnctn.io/api/live/upload \\",
      "  -H 'Authorization: Bearer <FIREBASE_ID_TOKEN>' \\",
      "  -F 'files=@owner-email.txt'"
    ].join("\n")
  });
}
