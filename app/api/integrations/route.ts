import { NextRequest, NextResponse } from "next/server";
import {
  composioApiKey,
  composioMissingEnv,
  demoConnections,
  integrationCatalog,
  listComposioConnectedAccounts
} from "@/lib/context-surgeon/integrations/composio";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const liveMode = process.env.INTEGRATIONS_MODE === "live" && Boolean(composioApiKey());

  if (!authHeader || !liveMode) {
    return NextResponse.json({
      mode: "demo",
      authRequiredForLive: true,
      catalog: integrationCatalog,
      connections: demoConnections(),
      missing: composioMissingEnv()
    });
  }

  try {
    const user = await verifyFirebaseRequest(request);
    const payload = await listComposioConnectedAccounts(
      user.uid,
      integrationCatalog.filter((item) => item.connectKind === "oauth").map((item) => item.toolkitSlug)
    );
    const accounts = payload.items ?? [];
    const connections = integrationCatalog.map((item) => {
      const account = accounts.find((candidate) => candidate.toolkit?.slug === item.toolkitSlug);
      return {
        id: account?.id ?? account?.nanoid ?? `available-${item.toolkitSlug}`,
        toolkitSlug: item.toolkitSlug,
        label: item.label,
        status:
          item.connectKind === "manual_upload"
            ? "connected"
            : account
              ? "connected"
              : composioMissingEnv(item.toolkitSlug).length
                ? "needs_config"
                : "available",
        accountLabel: account?.toolkit?.name,
        lastSyncAt: account?.updated_at,
        sourceCount: 0,
        factCount: 0,
        setupMissing: composioMissingEnv(item.toolkitSlug)
      };
    });

    return NextResponse.json({
      mode: "live",
      catalog: integrationCatalog,
      connections,
      missing: composioMissingEnv()
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Integration list failed." },
      { status: 401 }
    );
  }
}
