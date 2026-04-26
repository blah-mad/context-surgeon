import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as workspaceAction } from "@/app/api/workspace/action/route";
import { GET as workspaceExport } from "@/app/api/workspace/export/route";
import { POST as integrationSync } from "@/app/api/integrations/sync/route";
import { GET as composioStatus } from "@/app/api/providers/composio/status/route";
import { GET as liveUploadDocs, POST as liveUpload } from "@/app/api/live/upload/route";
import { GET as liveConnectDocs } from "@/app/api/live/connect/route";
import { GET as liveConnectors } from "@/app/api/live/connectors/route";
import { GET as liveSyncDocs, POST as liveSync } from "@/app/api/live/sync/route";
import { GET as liveRules } from "@/app/api/live/rules/route";

describe("public and protected API route contracts", () => {
  it("rejects unauthenticated workspace mutations", async () => {
    const response = await workspaceAction(
      new NextRequest("https://contextsurgeon.test/api/workspace/action", {
        method: "POST",
        body: JSON.stringify({ action: "compile" }),
        headers: { "content-type": "application/json" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false });
    expect(payload.error).toContain("Firebase ID token");
  });

  it("rejects unauthenticated Qontext export", async () => {
    const response = await workspaceExport(
      new NextRequest("https://contextsurgeon.test/api/workspace/export")
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false });
  });

  it("rejects unauthenticated live integration sync", async () => {
    const response = await integrationSync(
      new NextRequest("https://contextsurgeon.test/api/integrations/sync", {
        method: "POST",
        body: JSON.stringify({ toolkitSlugs: ["gmail"] }),
        headers: { "content-type": "application/json" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false });
  });

  it("exposes Composio connector proof without leaking secrets", async () => {
    const response = await composioStatus();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.provider).toBe("composio");
    expect(payload.supportedToolkits.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(payload)).not.toContain("ak_");
    expect(JSON.stringify(payload)).not.toContain("COMPOSIO_API_KEY=");
  });

  it("documents the live upload API as a product endpoint", async () => {
    const response = await liveUploadDocs();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.endpoint).toBe("POST /api/live/upload");
    expect(payload.auth).toContain("Firebase ID token");
    expect(payload.example).toContain("contextsurgeon.fnctn.io/api/live/upload");
  });

  it("rejects unauthenticated live upload API calls", async () => {
    const form = new FormData();
    form.append("files", new File(["synthetic evidence"], "evidence.txt", { type: "text/plain" }));

    const response = await liveUpload(
      new NextRequest("https://contextsurgeon.test/api/live/upload", {
        method: "POST",
        body: form
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false });
  });

  it("exposes the live connector catalog through product API", async () => {
    const response = await liveConnectors(
      new NextRequest("https://contextsurgeon.test/api/live/connectors")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.catalog.length).toBeGreaterThanOrEqual(10);
    expect(payload.catalog.some((item: { toolkitSlug: string }) => item.toolkitSlug === "gmail")).toBe(true);
    expect(payload.authRequiredForLive).toBe(true);
  });

  it("documents live connect and sync API contracts", async () => {
    const connect = await liveConnectDocs();
    const sync = await liveSyncDocs();
    const connectPayload = await connect.json();
    const syncPayload = await sync.json();

    expect(connectPayload.endpoint).toBe("POST /api/live/connect");
    expect(connectPayload.body.toolkitSlug).toBe("gmail");
    expect(syncPayload.endpoint).toBe("POST /api/live/sync");
    expect(syncPayload.body.toolkitSlugs).toContain("gmail");
  });

  it("rejects unauthenticated live sync API calls", async () => {
    const response = await liveSync(
      new NextRequest("https://contextsurgeon.test/api/live/sync", {
        method: "POST",
        body: JSON.stringify({ toolkitSlugs: ["gmail"] }),
        headers: { "content-type": "application/json" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ ok: false });
  });

  it("exposes default live ingestion rule contract", async () => {
    const response = await liveRules();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.rules[0].events).toContain("new_email");
    expect(payload.rules[0].action).toContain("candidate_source");
  });
});
