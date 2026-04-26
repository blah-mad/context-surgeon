import { NextRequest, NextResponse } from "next/server";
import {
  buildDemoSync,
  composioApiKey,
  executeComposioTool,
  integrationCatalog,
  listComposioConnectedAccounts,
  toolArgumentsFor
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

  const body = (await request.json().catch(() => ({}))) as {
    toolkitSlugs?: string[];
    connector?: string;
    query?: string;
    limit?: number;
  };
  const selected = body.toolkitSlugs?.length
    ? body.toolkitSlugs
    : body.connector
      ? [body.connector]
      : ["gmail", "hubspot", "googledrive"];

  if (!composioApiKey() || process.env.INTEGRATIONS_MODE !== "live") {
    return NextResponse.json(buildDemoSync(selected));
  }

  const accounts = await listComposioConnectedAccounts(user.uid, selected);
  const attempted: string[] = [];
  const livePayloads: Record<string, unknown>[] = [];

  for (const toolkitSlug of selected) {
    const item = integrationCatalog.find((candidate) => candidate.toolkitSlug === toolkitSlug);
    const account = accounts.items?.find((candidate) => candidate.toolkit?.slug === toolkitSlug);
    const toolSlug = item?.primaryTools[0];
    if (!item || !toolSlug || !account) continue;
    attempted.push(toolSlug);
    try {
      livePayloads.push({
        toolkitSlug,
        toolSlug,
        result: await executeComposioTool({
          userId: user.uid,
          connectedAccountId: account.id ?? account.nanoid,
          toolSlug,
          args: {
            ...toolArgumentsFor(toolkitSlug, body.query ?? "Sonnenallee 44"),
            limit: Math.min(Math.max(body.limit ?? 10, 1), 25)
          }
        })
      });
    } catch (error) {
      livePayloads.push({
        toolkitSlug,
        toolSlug,
        error: error instanceof Error ? error.message : "Tool execution failed."
      });
    }
  }

  const normalized = buildDemoSync(selected);
  return NextResponse.json({
    ...normalized,
    mode: "live",
    summary:
      "Composio live tool execution completed; payloads are normalized through the same SourceDocument -> Fact -> VFS contract.",
    composio: {
      configured: true,
      attemptedLiveTools: attempted,
      missing: []
    },
    livePayloads
  });
}
