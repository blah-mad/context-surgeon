import { NextResponse } from "next/server";
import {
  composioApiKey,
  composioMissingEnv,
  demoConnections,
  integrationCatalog
} from "@/lib/context-surgeon/integrations/composio";

export async function GET() {
  const missing = composioMissingEnv();
  return NextResponse.json({
    provider: "composio",
    requestedMode: process.env.INTEGRATIONS_MODE ?? "demo",
    effectiveMode: composioApiKey() && process.env.INTEGRATIONS_MODE === "live" ? "live" : "demo",
    configured: missing.length === 0,
    missing,
    supportedToolkits: integrationCatalog.map((item) => ({
      id: item.id,
      toolkitSlug: item.toolkitSlug,
      label: item.label,
      category: item.category,
      authConfigEnv: item.authConfigEnv,
      configured: composioMissingEnv(item.toolkitSlug).length === 0,
      primaryTools: item.primaryTools,
      sourceTypes: item.sourceTypes
    })),
    demoConnections: demoConnections(),
    contract: {
      connect: "POST /api/integrations/connect",
      sync: "POST /api/integrations/sync",
      sources: "GET /api/integrations/sources",
      export: "GET /api/workspace/export"
    }
  });
}
