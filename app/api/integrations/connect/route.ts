import { NextRequest, NextResponse } from "next/server";
import {
  authConfigIdFor,
  composioApiKey,
  composioMissingEnv,
  createComposioConnectLink,
  integrationCatalog
} from "@/lib/context-surgeon/integrations/composio";
import { verifyFirebaseRequest } from "@/lib/firebase/server-auth";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await verifyFirebaseRequest(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { toolkitSlug?: string; connector?: string };
  const toolkitSlug = body.toolkitSlug ?? body.connector;
  const item = integrationCatalog.find((candidate) => candidate.toolkitSlug === toolkitSlug || candidate.id === toolkitSlug);
  if (!item) {
    return NextResponse.json({ ok: false, error: "Unsupported connector." }, { status: 400 });
  }

  if (item.connectKind === "manual_upload") {
    return NextResponse.json({
      ok: true,
      mode: "manual_upload",
      toolkitSlug: item.toolkitSlug,
      label: item.label,
      message: "Manual uploads do not require OAuth. Drop files in the live-mode upload zone."
    });
  }

  const missing = composioMissingEnv(item.toolkitSlug);
  if (!composioApiKey() || !authConfigIdFor(item.toolkitSlug) || process.env.INTEGRATIONS_MODE !== "live") {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      toolkitSlug: item.toolkitSlug,
      label: item.label,
      missing,
      message: "Composio live mode is not fully configured. The UI will use demo connection data until credentials are provided.",
      setup: {
        required: ["COMPOSIO_API_KEY", item.authConfigEnv, "INTEGRATIONS_MODE=live"],
        authConfigEnv: item.authConfigEnv
      }
    });
  }

  const callbackUrl =
    process.env.COMPOSIO_REDIRECT_URI ??
    `${new URL(request.url).origin}/api/integrations/callback`;
  const link = await createComposioConnectLink({
    userId: user.uid,
    toolkitSlug: item.toolkitSlug,
    callbackUrl
  });

  return NextResponse.json({
    ok: true,
    mode: "live",
    toolkitSlug: item.toolkitSlug,
    label: item.label,
    redirectUrl: link.redirect_url,
    linkToken: link.link_token,
    expiresAt: link.expires_at,
    connectedAccountId: link.connected_account_id
  });
}
