import { NextRequest, NextResponse } from "next/server";
import type { IntegrationSyncResult } from "@/lib/context-surgeon/integrations/composio";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

function printableSnippet(text: string) {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function factCandidates(name: string, text: string) {
  const lower = `${name} ${text}`.toLowerCase();
  const facts = [
    {
      predicate: "uploaded_file.name",
      value: name,
      quote: `Uploaded file ${name}`
    }
  ];
  if (lower.includes("invoice") || lower.includes("rechnung")) {
    facts.push({
      predicate: "uploaded_file.kind",
      value: "invoice_or_accounting_record",
      quote: "Filename or content suggests invoice/accounting evidence."
    });
  }
  if (lower.includes("minutes") || lower.includes("protokoll") || lower.includes("weg")) {
    facts.push({
      predicate: "uploaded_file.kind",
      value: "meeting_minutes_or_owner_assembly",
      quote: "Filename or content suggests meeting minutes or WEG decision evidence."
    });
  }
  if (lower.includes("roof") || lower.includes("dach") || lower.includes("leak")) {
    facts.push({
      predicate: "uploaded_file.topic",
      value: "roof_or_water_ingress",
      quote: "Content references roof, leak, Dach, or water ingress."
    });
  }
  return facts;
}

export async function POST(request: NextRequest) {
  try {
    await verifyFirebaseRequest(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 }
    );
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);
  const generatedAt = new Date().toISOString();

  const sources = await Promise.all(
    files.map(async (file, index) => {
      let text = "";
      try {
        text = printableSnippet(await file.text());
      } catch {
        text = "";
      }
      const summary = text
        ? `Uploaded ${file.name}; extracted ${text.length.toLocaleString("en-US")} characters for source review.`
        : `Uploaded ${file.name}; binary content was accepted and queued with filename/type provenance.`;
      return {
        id: `manual-${Date.now()}-${index}`,
        toolkitSlug: "manual_upload",
        title: file.name,
        sourceType: file.type || "manual_file",
        timestamp: generatedAt,
        confidence: text ? 0.86 : 0.62,
        summary,
        facts: factCandidates(file.name, text)
      };
    })
  );

  const payload: IntegrationSyncResult = {
    ok: true,
    mode: "live",
    workspaceId: "manual-upload-workspace",
    selectedToolkits: ["manual_upload"],
    generatedAt,
    summary: `${sources.length} uploaded file${sources.length === 1 ? "" : "s"} normalized into candidate sources.`,
    sources,
    nextActions: [
      "Review extracted snippets and file metadata.",
      "Approve relevant sources for compilation.",
      "Run the same fact extraction, conflict detection, and Fact Patch loop."
    ],
    composio: {
      configured: true,
      attemptedLiveTools: ["manual_upload"],
      missing: []
    }
  };

  return NextResponse.json(payload);
}
