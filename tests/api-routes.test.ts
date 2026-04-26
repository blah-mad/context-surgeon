import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as workspaceAction } from "@/app/api/workspace/action/route";
import { GET as workspaceExport } from "@/app/api/workspace/export/route";
import { POST as integrationSync } from "@/app/api/integrations/sync/route";
import { GET as composioStatus } from "@/app/api/providers/composio/status/route";

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
});
