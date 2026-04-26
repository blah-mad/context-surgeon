import { NextResponse } from "next/server";
import { buildGeminiContextCheckEnvelope } from "@/lib/context-surgeon/providers/contracts";
import { callGeminiContextCheck, providerMode } from "@/lib/context-surgeon/providers/live";
import { buildDemoWorkflow } from "@/lib/context-surgeon/workflow";

export async function POST() {
  const workflow = buildDemoWorkflow();
  let liveOutput: Awaited<ReturnType<typeof callGeminiContextCheck>> | null = null;
  let liveError: string | undefined;

  try {
    liveOutput = await callGeminiContextCheck({
      before: workflow.beforeCheck,
      after: workflow.afterCheck
    });
  } catch (error) {
    liveError = error instanceof Error ? error.message : "Gemini live call failed.";
  }

  const envelope = buildGeminiContextCheckEnvelope({
    beforeScore: workflow.beforeCheck.score,
    afterScore: workflow.afterCheck.score,
    blockedActionsBefore: workflow.beforeCheck.blockedActions,
    readyActionAfter: workflow.afterCheck.actions.find((action) => action.status === "ready") ?? null,
    liveOutput
  }, liveOutput
    ? {
        effectiveMode: "live",
        fallbackUsed: false,
        note: "Live Gemini context-check proof returned successfully."
      }
    : liveError && providerMode() === "live"
      ? {
          effectiveMode: "cached",
          health: "degraded",
          fallbackUsed: true,
          fallbackReason: liveError,
          errorCode: "GEMINI_LIVE_CALL_FAILED",
          retryable: true,
          note: "Live Gemini call failed; deterministic context-check output is returned."
        }
      : undefined);

  return NextResponse.json({
    provider: "gemini",
    mode: envelope.status.effectiveMode,
    status: envelope.status,
    fallback: envelope.fallback,
    sampleOutput: envelope.sampleOutput,
    providerContract: envelope.providerContract,
    liveOutput,
    before: workflow.beforeCheck,
    after: workflow.afterCheck
  });
}
