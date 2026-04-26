import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getFirebaseWebConfig } from "@/lib/firebase/config";

function hasD1Binding() {
  try {
    return Boolean(
      (getCloudflareContext().env as { CONTEXT_SURGEON_DB?: unknown }).CONTEXT_SURGEON_DB
    );
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "context-surgeon",
    providerMode: process.env.PROVIDER_MODE ?? "mock",
    integrationsMode: process.env.INTEGRATIONS_MODE ?? "demo",
    composio: process.env.COMPOSIO_API_KEY ? "configured" : "demo",
    runtime: "cloudflare-open-next-ready",
    persistence: hasD1Binding() ? "cloudflare-d1" : "memory-fallback",
    auth: getFirebaseWebConfig() ? "firebase-auth" : "unconfigured"
  });
}
