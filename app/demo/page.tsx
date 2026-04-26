"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  ClipboardList,
  Database,
  ExternalLink,
  FileCode2,
  FileText,
  Filter,
  GitCompare,
  Hammer,
  Layers3,
  Microscope,
  Moon,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  WandSparkles,
  UploadCloud,
  Workflow,
  X
} from "lucide-react";
import { buildDemoWorkflow } from "@/lib/context-surgeon/workflow";
import { qontextDatasetProof } from "@/lib/context-surgeon/qontext-proof";
import type { ProductPhase, ProductSnapshot } from "@/lib/context-surgeon/server/store";
import {
  loadFirebaseAuthConfig,
  readStoredSession,
  refreshSession,
  storeSession,
  type AuthSession,
  type FirebaseAuthConfig
} from "@/lib/firebase/client-auth";
import type {
  ContextState,
  Fact,
  SourceDocument,
  SourceSpan,
  VfsFile
} from "@/lib/context-surgeon/types";

type ViewId = "sources" | "facts" | "conflicts" | "files" | "patch" | "agent";
type HeroLayer = "sources" | "facts" | "patch";
type WorkspaceAction = "compile" | "human-note" | "ingest-email" | "apply-patch";
type ProviderId = "gemini" | "tavily" | "pioneer";
type GuidedDemoStep = "archive" | WorkspaceAction | "agent";
type SourceFilter = "all" | SourceDocument["relevance"]["status"];
type PatchViewMode = "diff" | "facts" | "human";
type IntegrationMode = "demo" | "live";

interface IntegrationCatalogItem {
  id: string;
  toolkitSlug: string;
  label: string;
  category: string;
  categoryLabel: string;
  description: string;
  connectKind: "oauth" | "manual_upload";
  primaryTools: string[];
  sourceTypes: string[];
  triggerExamples: string[];
  ingestionPolicy: string;
}

interface IntegrationConnection {
  id: string;
  toolkitSlug: string;
  label: string;
  status: "connected" | "available" | "needs_config" | "syncing" | "error";
  accountLabel?: string;
  lastSyncAt?: string;
  sourceCount: number;
  factCount: number;
  setupMissing?: string[];
}

interface IntegrationState {
  mode: IntegrationMode;
  authRequiredForLive?: boolean;
  catalog: IntegrationCatalogItem[];
  connections: IntegrationConnection[];
  missing?: string[];
}

interface IntegrationSyncResult {
  ok: boolean;
  mode: IntegrationMode;
  workspaceId: string;
  selectedToolkits: string[];
  generatedAt: string;
  summary: string;
  sources: Array<{
    id: string;
    toolkitSlug: string;
    title: string;
    sourceType: string;
    timestamp: string;
    confidence: number;
    summary: string;
    facts: Array<{ predicate: string; value: string; quote: string }>;
  }>;
  nextActions: string[];
  composio: {
    configured: boolean;
    attemptedLiveTools: string[];
    missing: string[];
  };
}

interface IngestionRule {
  id: string;
  scope: string;
  toolkits: string[];
  events: string[];
  action: string;
  status: string;
  createdAt?: string;
}

interface ProviderStatus {
  id: ProviderId;
  label: string;
  mode: string;
  status: "ready" | "fallback" | "error";
  detail: string;
}

const guidedDemoSteps: Array<{
  id: GuidedDemoStep;
  label: string;
  view: ViewId;
  action?: WorkspaceAction;
  detail: string;
}> = [
  {
    id: "archive",
    label: "Load archive",
    view: "sources",
    detail: "Messy property sources enter the context compiler."
  },
  {
    id: "compile",
    label: "Compile facts",
    view: "facts",
    action: "compile",
    detail: "Sources become typed facts, source spans, conflicts, and VFS files."
  },
  {
    id: "human-note",
    label: "Preserve note",
    view: "files",
    action: "human-note",
    detail: "A property manager adds a human note outside generated blocks."
  },
  {
    id: "ingest-email",
    label: "Ingest new email",
    view: "patch",
    action: "ingest-email",
    detail: "The latest owner email changes the operational truth."
  },
  {
    id: "apply-patch",
    label: "Apply Fact Patch",
    view: "patch",
    action: "apply-patch",
    detail: "Only generated sections change; the human note survives."
  },
  {
    id: "agent",
    label: "Agent check",
    view: "agent",
    detail: "The downstream action plan flips from blocked to actionable."
  }
];

interface ProviderRoutePayload {
  mode?: unknown;
  status?: {
    health?: unknown;
    effectiveMode?: unknown;
    liveReady?: unknown;
  };
  fallback?: {
    used?: unknown;
    reason?: unknown;
  };
}

const views: Array<{ id: ViewId; label: string; icon: ElementType }> = [
  { id: "sources", label: "Sources", icon: UploadCloud },
  { id: "facts", label: "Facts", icon: Database },
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle },
  { id: "files", label: "Files", icon: FileCode2 },
  { id: "patch", label: "Patch Review", icon: GitCompare },
  { id: "agent", label: "Agent Check", icon: Bot }
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const tones = {
    neutral: "border-border bg-surface-2 text-muted",
    good: "border-[oklch(0.55_0.14_150_/_0.35)] bg-[oklch(0.55_0.14_150_/_0.10)] text-[oklch(0.42_0.13_150)]",
    warn: "border-[oklch(0.75_0.15_70_/_0.4)] bg-[oklch(0.75_0.15_70_/_0.10)] text-[oklch(0.54_0.14_65)]",
    bad: "border-[oklch(0.58_0.19_27_/_0.35)] bg-[oklch(0.58_0.19_27_/_0.10)] text-[oklch(0.50_0.18_27)]",
    info: "border-[oklch(from_var(--accent)_l_c_h_/_0.35)] bg-[oklch(from_var(--accent)_l_c_h_/_0.10)] text-accent"
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px]",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: ElementType;
}) {
  return (
    <div className="soft-panel border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          {label}
        </span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-fg">
        {value}
      </div>
    </div>
  );
}

function AuthPanel({
  session,
  loading,
  error,
  onSignOut
}: {
  session: AuthSession | null;
  loading: boolean;
  error?: string;
  onSignOut: () => void;
}) {
  if (session) {
    return (
      <div className="soft-panel flex items-center justify-between gap-4 border border-[oklch(0.55_0.14_150_/_0.30)] bg-[oklch(0.55_0.14_150_/_0.08)] p-4 max-md:block">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.55_0.14_150_/_0.16)] text-[oklch(0.42_0.13_150)]">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Saved workspace
            </p>
            <p className="mt-1 font-semibold">{session.displayName || session.email}</p>
            <p className="mt-1 text-sm text-muted">
              Live sources, protected exports, and audit state are enabled.
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="mt-3 inline-flex h-10 items-center rounded-2xl border border-border bg-bg px-4 font-semibold transition hover:border-primary/40 md:mt-0"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="soft-panel flex items-center justify-between gap-4 border border-border bg-surface p-4 max-lg:block">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Play className="size-4" />
        </span>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Recording mode
          </p>
          <h3 className="mt-1 font-semibold">The full sample-data demo runs without sign-in.</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Sign in only when you want saved workspace state, live source connections, and protected exports.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-[oklch(0.50_0.18_27)]">{error}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0">
        <Badge tone={loading ? "warn" : "good"}>{loading ? "checking access" : "public preview ready"}</Badge>
        <a
          href="/login"
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition hover:-translate-y-px"
        >
          Sign in for live mode
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

function phaseLabel(phase: ProductPhase) {
  const labels: Record<ProductPhase, string> = {
    empty: "Empty",
    loaded: "Archive loaded",
    compiled: "Context compiled",
    human_edited: "Human note added",
    patch_proposed: "Patch proposed",
    patch_applied: "Patch applied"
  };
  return labels[phase];
}

function makeFallbackSnapshot(): ProductSnapshot {
  const workflow = buildDemoWorkflow();
  const generatedAt = new Date().toISOString();
  return {
    workspaceId: "sonnenallee-44-local",
    phase: "loaded",
    propertyId: workflow.initial.propertyId,
    propertyName: workflow.initial.propertyName,
    providerMode: "mock",
    current: workflow.initial,
    initial: workflow.initial,
    withHumanEdit: workflow.withHumanEdit,
    incoming: workflow.incoming,
    applied: workflow.applied,
    beforeCheck: workflow.beforeCheck,
    afterCheck: workflow.afterCheck,
    patch: undefined,
    activeFilePath: `/properties/${workflow.initial.propertyId}/context.md`,
    generatedAt,
    auditEvents: [
      {
        id: `local_loaded_${generatedAt}`,
        workspaceId: "sonnenallee-44-local",
        eventType: "workspace.loaded",
        label: "Sonnenallee 44 loaded",
        detail: "Public preview loaded the bundled property archive.",
        metadata: { publicDemo: true, sources: workflow.initial.sources.length },
        createdAt: generatedAt
      }
    ]
  };
}

function makeLocalSnapshot(
  workflow: ReturnType<typeof buildDemoWorkflow>,
  phase: ProductPhase,
  auditEvents: ProductSnapshot["auditEvents"] = []
): ProductSnapshot {
  const generatedAt = new Date().toISOString();
  const current =
    phase === "loaded" || phase === "compiled"
      ? workflow.initial
      : phase === "human_edited"
        ? workflow.withHumanEdit
        : phase === "patch_proposed"
          ? workflow.incoming
          : workflow.applied;
  const labels: Record<ProductPhase, [string, string, string]> = {
    empty: ["workspace.empty", "Workspace cleared", "Public preview workspace was cleared."],
    loaded: ["workspace.loaded", "Sonnenallee 44 loaded", "Public preview loaded the bundled property archive."],
    compiled: ["context.compiled", "Context compiled", "Sources became facts, conflicts, and VFS files."],
    human_edited: ["human.note_preserved", "Human note inserted", "A manual tenant-communication note was preserved outside generated blocks."],
    patch_proposed: ["patch.proposed", "Fact Patch proposed", "New owner email changed roof repair status, vendor assignment, and approval threshold."],
    patch_applied: ["patch.applied", "Fact Patch applied", "Context now reflects the latest owner instruction while keeping the human note."]
  };
  const [eventType, label, detail] = labels[phase];

  return {
    workspaceId: "sonnenallee-44-local",
    phase,
    propertyId: workflow.initial.propertyId,
    propertyName: workflow.initial.propertyName,
    providerMode: "mock",
    current,
    initial: workflow.initial,
    withHumanEdit: workflow.withHumanEdit,
    incoming: workflow.incoming,
    applied: workflow.applied,
    beforeCheck: workflow.beforeCheck,
    afterCheck: workflow.afterCheck,
    patch: phase === "patch_proposed" ? workflow.incoming.patch : phase === "patch_applied" ? workflow.applied.patch : undefined,
    activeFilePath: `/properties/${workflow.initial.propertyId}/context.md`,
    generatedAt,
    auditEvents: [
      {
        id: `local_${eventType}_${Date.now()}`,
        workspaceId: "sonnenallee-44-local",
        eventType,
        label,
        detail,
        metadata: { publicDemo: true },
        createdAt: generatedAt
      },
      ...auditEvents
    ].slice(0, 12)
  };
}

function buildClientExport(snapshot: ProductSnapshot) {
  return {
    propertyId: snapshot.propertyId,
    propertyName: snapshot.propertyName,
    generatedAt: snapshot.generatedAt,
    phase: snapshot.phase,
    exportMode: snapshot.workspaceId.endsWith("-local") ? "public-demo" : "persisted-workspace",
    sourceRelevance: snapshot.current.sources.map((source) => ({
      sourceId: source.id,
      filename: source.filename,
      title: source.title,
      sourceType: source.sourceType,
      relevance: source.relevance
    })),
    virtualFileSystem: snapshot.current.files.map((file) => ({
      path: file.path,
      title: file.title,
      content: file.content,
      sourceFactIds: file.sourceFactIds,
      generatedHash: file.generatedHash
    })),
    graph: {
      facts: snapshot.current.facts.map((fact) => ({
        id: fact.id,
        type: fact.factType,
        subjectEntityId: fact.subjectEntityId,
        predicate: fact.predicate,
        objectValue: fact.objectValue,
        sourceSpanIds: fact.sourceSpanIds,
        supersedesFactIds: fact.supersedesFactIds
      })),
      conflicts: snapshot.current.conflicts
    },
    provenance: snapshot.current.spans,
    partnerTechnologyProof: {
      gemini: "Structured extraction, conflict explanation, and agent pre-flight reasoning adapter.",
      tavily: "External enrichment and verification adapter for public/vendor context.",
      pioneerFastino: "Schema-first source relevance, document classification, and extraction pre-pass."
    }
  };
}

function sourceForFact(fact: Fact, spans: SourceSpan[], sources: SourceDocument[]) {
  const span = spans.find((item) => fact.sourceSpanIds.includes(item.id));
  const source = sources.find((item) => item.id === span?.sourceDocumentId);
  return { span, source };
}

function relevanceTone(status: SourceDocument["relevance"]["status"]) {
  if (status === "included") return "good";
  if (status === "ignored") return "neutral";
  return "warn";
}

function relevanceLabel(status: SourceDocument["relevance"]["status"]) {
  if (status === "included") return "signal";
  if (status === "ignored") return "noise";
  return "review";
}

function sourceRelevanceRank(status: SourceDocument["relevance"]["status"]) {
  if (status === "included") return 0;
  if (status === "needs_review") return 1;
  return 2;
}

function providerTone(status: ProviderStatus["status"]) {
  if (status === "ready") return "good";
  if (status === "fallback") return "warn";
  return "bad";
}

async function postProviderJson(path: string) {
  const response = await fetch(path, { method: "POST" });
  if (!response.ok) throw new Error(`${path} failed`);
  return (await response.json()) as ProviderRoutePayload;
}

function providerStatusFromPayload(
  payload: ProviderRoutePayload,
  detail: string
): Pick<ProviderStatus, "mode" | "status" | "detail"> {
  const health = String(payload.status?.health ?? "ok");
  const effectiveMode = String(payload.status?.effectiveMode ?? payload.mode ?? "mock");
  const fallbackUsed = payload.fallback?.used === true || effectiveMode !== "live";
  return {
    mode: effectiveMode,
    status: health === "degraded" || fallbackUsed ? "fallback" : "ready",
    detail: health === "degraded" || fallbackUsed ? "cached fallback" : detail
  };
}

function phaseRank(phase: ProductPhase) {
  const order: ProductPhase[] = [
    "empty",
    "loaded",
    "compiled",
    "human_edited",
    "patch_proposed",
    "patch_applied"
  ];
  return order.indexOf(phase);
}

function demoStepComplete(step: GuidedDemoStep, phase: ProductPhase) {
  if (step === "archive") return phaseRank(phase) >= phaseRank("loaded");
  if (step === "compile") return phaseRank(phase) >= phaseRank("compiled");
  if (step === "human-note") return phaseRank(phase) >= phaseRank("human_edited");
  if (step === "ingest-email") return phaseRank(phase) >= phaseRank("patch_proposed");
  if (step === "apply-patch") return phaseRank(phase) >= phaseRank("patch_applied");
  return phase === "patch_applied";
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setTheme(dark ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("context-surgeon-theme", next);
    setTheme(next);
  }

  const Icon = mounted && theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex size-9 items-center justify-center rounded-2xl border border-border/70 bg-surface/80 text-muted shadow-sm backdrop-blur-xl transition hover:-translate-y-px hover:border-primary/40 hover:text-fg"
    >
      <Icon className="size-4" />
    </button>
  );
}

function HeroScene({
  activeLayer,
  setActiveLayer
}: {
  activeLayer: HeroLayer;
  setActiveLayer: (layer: HeroLayer) => void;
}) {
  const layerCopy = {
    sources: {
      title: "Raw property handover",
      body: "Emails, WEG minutes, quote PDFs, invoices, and handover notes arrive with conflicting operational truth.",
      rows: ["tenant_roof_leak.email", "2025_weg_minutes.pdf", "invoices.csv"]
    },
    facts: {
      title: "Source-grounded fact ledger",
      body: "Every claim becomes a typed fact with source spans, confidence, and conflict status.",
      rows: ["roof.status = open", "threshold = EUR 500", "quote.status = rejected"]
    },
    patch: {
      title: "Fact Patch",
      body: "Generated markdown updates surgically while human notes remain untouched.",
      rows: ["+ TempSeal approved", "- quote pending", "preserved: tenant prefers email"]
    }
  } satisfies Record<HeroLayer, { title: string; body: string; rows: string[] }>;

  return (
    <div className="relative hidden min-h-[570px] lg:block">
      <div className="glass-panel absolute -left-5 top-10 z-10 w-[300px] border border-border/80 p-4 shadow-2xl shadow-earth/10 xl:-left-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            incoming source
          </span>
          <Badge tone="bad">contradiction</Badge>
        </div>
        <p className="text-sm font-semibold">Roof quote rejected</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          A new owner email changes what the agent should do next.
        </p>
      </div>

      <div className="dark-panel absolute inset-y-0 right-0 w-[92%] overflow-hidden border border-[oklch(from_var(--primary)_l_c_h_/_0.18)]">
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2 font-mono text-xs text-cream/70">
            <Microscope className="size-4 text-primary" />
            context-surgeon://sonnenallee-44
          </div>
          <Badge tone="good">health 91</Badge>
        </div>

        <div className="grid h-[calc(100%-48px)] grid-cols-[174px_1fr]">
          <div className="border-r border-white/10 bg-white/[0.015] p-3">
            {(["sources", "facts", "patch"] as const).map((layer) => (
              <button
                key={layer}
                onMouseEnter={() => setActiveLayer(layer)}
                onFocus={() => setActiveLayer(layer)}
                className={cx(
                  "mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left font-mono text-xs transition",
                  activeLayer === layer
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.03] text-cream/65"
                )}
              >
                {layer}
                <ArrowRight className="size-3" />
              </button>
            ))}
          </div>

          <div className="relative p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  live compiler layer
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.01em] text-cream">
                  {layerCopy[activeLayer].title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-cream/62">
                  {layerCopy[activeLayer].body}
                </p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right font-mono text-xs text-cream/62">
                <div>changed facts</div>
                <div className="mt-1 text-xl text-primary">03</div>
              </div>
            </div>

            <div className="space-y-3">
              {layerCopy[activeLayer].rows.map((row, index) => (
                <div
                  key={row}
                  className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[oklch(0.23_0.018_40)] px-4 py-3"
                >
                  <span className="font-mono text-xs text-cream/78">{row}</span>
                  <span className="font-mono text-[11px] text-primary">
                    {index === 0 ? "cited" : index === 1 ? "patched" : "verified"}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
              {[
                ["sources", "07"],
                ["facts", "14"],
                ["conflicts", "04"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/45">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-xl text-cream">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ onOpenDemo }: { onOpenDemo: () => void }) {
  const [activeLayer, setActiveLayer] = useState<HeroLayer>("patch");

  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      <div className="pointer-events-none absolute inset-0 ambient-glow" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <nav className="glass-panel relative z-20 mx-auto mt-4 flex max-w-7xl items-center justify-between border border-border/70 px-4 py-3 max-xl:mx-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[18px] bg-code text-primary shadow-lg shadow-black/10">
            <Microscope className="size-5" />
          </span>
          <div>
            <p className="font-semibold leading-none">Context Surgeon</p>
            <p className="mt-1 font-mono text-[11px] text-muted">Bldg.md context compiler</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="#demo" className="hidden px-3 py-2 text-sm text-muted transition hover:text-fg sm:inline">
            Live demo
          </a>
          <a href="#architecture" className="hidden px-3 py-2 text-sm text-muted transition hover:text-fg sm:inline">
            Architecture
          </a>
          <ThemeToggle />
          <button
            onClick={onOpenDemo}
            className="inline-flex h-9 items-center gap-2 rounded-2xl bg-primary px-3 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition hover:-translate-y-px hover:shadow-primary/30 sm:px-4"
          >
            <Play className="size-4" />
            <span className="whitespace-nowrap max-sm:sr-only">Run demo</span>
          </button>
        </div>
      </nav>

      <div className="relative z-10 mx-auto grid min-h-[calc(92vh-80px)] max-w-7xl grid-cols-[0.86fr_1.14fr] items-center gap-12 px-6 pb-24 pt-10 max-lg:grid-cols-1 max-lg:pb-16">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
            Buena + Qontext flagship
          </p>
          <h1 className="mt-5 max-w-4xl text-6xl font-semibold leading-[0.96] tracking-normal text-fg max-md:text-4xl">
            <span className="surgeon-gradient-text">Clean context</span> for agents that can’t afford to guess.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-8 text-muted max-md:text-lg">
            Context Surgeon turns scattered property-management data into living Markdown
            and VFS context, then keeps it current without overwriting the work humans already fixed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onOpenDemo}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 font-semibold text-cream shadow-xl shadow-primary/20 transition hover:-translate-y-px hover:shadow-primary/30"
            >
              Inspect the workbench
              <ArrowRight className="size-4" />
            </button>
            <a
              href="#architecture"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface/90 px-5 font-semibold text-fg shadow-sm transition hover:-translate-y-px hover:border-primary/40"
            >
              See the architecture
              <Sparkles className="size-4 text-primary" />
            </a>
          </div>
          <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3 max-sm:grid-cols-1">
            {[
              ["Living VFS", "agent-readable property memory"],
              ["Fact Patch", "refresh context without erasing edits"],
              ["Agent Check", "know when it is safe to act"]
            ].map(([title, body]) => (
              <div key={title} className="soft-panel border border-border bg-surface/85 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <HeroScene activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section id="proof" className="border-b border-border bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              The context layer agents were missing
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Stale context breaks agents.</h2>
            <p className="mt-4 leading-7 text-muted">
              Leases change. Vendors update terms. Owners override defaults. Agents keep acting on
              yesterday’s facts unless the context layer is rebuilt with intent.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Living Markdown + VFS",
                body: "Messy property inputs become structured, agent-readable Markdown and virtual files."
              },
              {
                icon: Braces,
                title: "Source-grounded facts",
                body: "Every claim carries a quote, source span, confidence score, and conflict status."
              },
              {
                icon: Hammer,
                title: "Fact Patch preserves work",
                body: "Generated context refreshes at fact level while human edits stay intact."
              }
            ].map(({ icon: Icon, title, body }) => (
              <article key={title} className="soft-panel border border-border bg-bg/90 p-5">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QontextProofSection() {
  const [graphOpen, setGraphOpen] = useState(false);
  const totalRecords = qontextDatasetProof.rawInputs.reduce((sum, item) => sum + item.records, 0);
  const topInputs = [...qontextDatasetProof.rawInputs]
    .sort((a, b) => b.records - a.records)
    .slice(0, 6);
  const memoryLanes = [
    {
      label: "Static memory",
      count: "3 files",
      body: "Customers, employees, products, vendors, orders.",
      icon: Database
    },
    {
      label: "Procedural memory",
      count: "1 file",
      body: "Policy PDFs, rules, security, SDLC, leave policy.",
      icon: ClipboardList
    },
    {
      label: "Trajectory memory",
      count: "3 files",
      body: "Tickets, mail, GitHub, collaboration, support progress.",
      icon: Workflow
    }
  ];
  const graphProof = [
    ["Entities", qontextDatasetProof.graphSummary.entityTypes.length.toString()],
    ["Edges", qontextDatasetProof.graphSummary.edgeTypes.length.toString()],
    ["Provenance", "fact span"],
    ["Updates", "Fact Patch"]
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-bg py-16">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-35" />
      <div className="relative mx-auto max-w-[1500px] px-6">
        <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="self-center">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Hackathon sample-data run
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight max-md:text-3xl">
              Inazuma.co becomes a context repository, not a prompt dump.
            </h2>
            <p className="mt-4 leading-7 text-muted">
              The supplied dataset spans CRM, HR, enterprise mail, support, policy PDFs, IT tickets,
              GitHub, social data, and order PDFs. Context Surgeon compiles it into a file system,
              graph, review queue, and patchable update layer.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <Metric label="Raw records" value={totalRecords.toLocaleString("en-US")} icon={Database} />
              <Metric label="Domains" value={qontextDatasetProof.rawInputs.length} icon={Layers3} />
              <Metric label="VFS files" value={qontextDatasetProof.virtualFileSystem.length} icon={FileCode2} />
            </div>
            <button
              type="button"
              onClick={() => setGraphOpen(true)}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 text-sm font-semibold text-primary shadow-[0_14px_34px_rgba(195,91,44,0.12)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Workflow className="size-4" />
              Open VFS graph
            </button>
            <div className="mt-5 rounded-[24px] border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p className="font-semibold">What the judges need to see</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    We start with raw company state, produce an inspectable VFS plus graph, preserve
                    fact-level provenance, and involve humans only where ambiguity matters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="dark-panel overflow-hidden border border-[oklch(from_var(--primary)_l_c_h_/_0.30)] text-cream">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  context-surgeon://inazuma.co/compile
                </p>
                <p className="mt-1 text-sm text-cream/62">
                  Raw dataset {"->"} VFS {"->"} graph {"->"} human review {"->"} Fact Patch
                </p>
              </div>
              <Badge tone="good">sample dataset compiled</Badge>
            </div>

            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-r border-white/10 p-5 max-lg:border-b max-lg:border-r-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Raw company state</p>
                    <p className="mt-1 text-xs text-cream/52">Top source domains by volume</p>
                  </div>
                  <Badge tone="info">{qontextDatasetProof.rawInputs.length} domains</Badge>
                </div>
                <div className="grid gap-2">
                  {topInputs.map((input) => (
                    <div key={input.domain} className="rounded-[20px] border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{input.domain}</p>
                        <Badge tone="info">{input.records.toLocaleString("en-US")}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-cream/48">
                        {input.examples.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {graphProof.map(([label, value]) => (
                    <div key={label} className="rounded-[18px] border border-white/10 bg-white/[0.035] p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/42">{label}</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-cream">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 md:grid-cols-3">
                  {memoryLanes.map(({ icon: Icon, label, count, body }) => (
                    <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                      <Icon className="size-4 text-primary" />
                      <p className="mt-3 font-semibold">{label}</p>
                      <p className="mt-1 font-mono text-xs text-primary">{count}</p>
                      <p className="mt-2 text-xs leading-5 text-cream/56">{body}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/15 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Generated repository files</p>
                    <Badge tone="good">source-linked</Badge>
                  </div>
                  <div className="grid gap-2">
                    {qontextDatasetProof.virtualFileSystem.slice(0, 5).map((file) => (
                      <div
                        key={file.path}
                        className="grid gap-3 rounded-[18px] border border-white/10 bg-white/[0.035] p-3 md:grid-cols-[1fr_0.9fr]"
                      >
                        <div>
                          <p className="font-mono text-[11px] text-primary">{file.path}</p>
                          <p className="mt-1 text-sm font-semibold">{file.title}</p>
                        </div>
                        <p className="text-xs leading-5 text-cream/56">{file.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-[oklch(0.55_0.14_150_/_0.35)] bg-[oklch(0.55_0.14_150_/_0.10)] p-4">
                  <div className="flex items-center gap-3">
                    <GitCompare className="size-5 text-[oklch(0.65_0.13_150)]" />
                    <div>
                      <p className="font-semibold">Maintained by Fact Patch</p>
                      <p className="mt-1 text-xs leading-5 text-cream/64">
                        {qontextDatasetProof.graphSummary.provenanceGranularity}. New or changed
                        records update the right files without destructive regeneration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-6">
          {qontextDatasetProof.challengeFit.slice(0, 6).map((item, index) => (
            <div key={item} className="rounded-[22px] border border-border bg-surface/80 p-3">
              <p className="font-mono text-[11px] text-primary">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-sm leading-5 text-muted">{item}</p>
            </div>
          ))}
        </div>
      </div>
      </section>
      <QontextDatasetGraphModal open={graphOpen} onClose={() => setGraphOpen(false)} />
    </>
  );
}

function QontextDatasetGraphModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedPath, setSelectedPath] = useState(qontextDatasetProof.virtualFileSystem[0]?.path ?? "");
  const selectedFile =
    qontextDatasetProof.virtualFileSystem.find((file) => file.path === selectedPath) ??
    qontextDatasetProof.virtualFileSystem[0];
  const topDomains = [...qontextDatasetProof.rawInputs].sort((a, b) => b.records - a.records).slice(0, 8);
  const entityRows = qontextDatasetProof.graphSummary.entityTypes.slice(0, 9);
  const edgeRows = qontextDatasetProof.graphSummary.edgeTypes.slice(0, 8);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b100b]/52 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Qontext graph view"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-border bg-bg shadow-[0_32px_100px_rgba(54,34,24,0.24)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/80 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Inazuma.co context repository
            </p>
            <h3 className="mt-1 text-2xl font-semibold">VFS graph with fact-level provenance</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close graph view"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-bg text-muted transition hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-82px)] overflow-y-auto lg:grid-cols-[0.68fr_1.32fr]">
          <aside className="border-r border-border bg-surface/45 p-5 max-lg:border-b max-lg:border-r-0">
            <p className="text-sm font-semibold">Generated files</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Each file is a stable product surface, with links back to entities, facts, and source spans.
            </p>
            <div className="mt-4 grid gap-2">
              {qontextDatasetProof.virtualFileSystem.map((file) => (
                <button
                  type="button"
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`rounded-[22px] border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    selectedFile?.path === file.path
                      ? "border-primary/45 bg-primary/10 text-fg"
                      : "border-border bg-bg/70 text-muted hover:border-primary/25 hover:bg-primary/5"
                  }`}
                >
                  <p className="font-mono text-[11px] text-primary">{file.path}</p>
                  <p className="mt-1 text-sm font-semibold text-fg">{file.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="p-5">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-border bg-surface p-5">
                <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Graph canvas</p>
                    <p className="mt-1 text-lg font-semibold">{selectedFile?.title}</p>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{selectedFile?.purpose}</p>
                  </div>
                  <Badge tone="good">inspectable</Badge>
                </div>

                <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-[0.9fr_1.1fr_0.9fr]">
                  <div className="grid content-start gap-2">
                    {topDomains.slice(0, 4).map((domain) => (
                      <div key={domain.domain} className="rounded-[20px] border border-border bg-bg/80 p-3">
                        <p className="text-sm font-semibold">{domain.domain}</p>
                        <p className="mt-1 font-mono text-xs text-primary">
                          {domain.records.toLocaleString("en-US")} records
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
                    <div className="rounded-[28px] border border-primary/35 bg-primary/10 p-5 text-center shadow-[0_18px_60px_rgba(195,91,44,0.16)]">
                      <FileCode2 className="mx-auto size-7 text-primary" />
                      <p className="mt-3 text-lg font-semibold">Context repository</p>
                      <p className="mt-1 text-sm text-muted">VFS + graph + review queue</p>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2">
                      {entityRows.slice(0, 6).map((entity) => (
                        <span
                          key={entity}
                          className="rounded-full border border-border bg-bg/80 px-3 py-2 text-center text-xs font-semibold text-muted"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid content-start gap-2">
                    {topDomains.slice(4).map((domain) => (
                      <div key={domain.domain} className="rounded-[20px] border border-border bg-bg/80 p-3">
                        <p className="text-sm font-semibold">{domain.domain}</p>
                        <p className="mt-1 font-mono text-xs text-primary">
                          {domain.records.toLocaleString("en-US")} records
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-border bg-surface p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Provenance chain</p>
                  <div className="mt-4 grid gap-3">
                    {["Fact", "Source record", "Source file/path", "Quote/span"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-[20px] border border-border bg-bg/70 p-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border bg-surface p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Edge types</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {edgeRows.map((edge) => (
                      <span key={edge} className="rounded-full border border-border bg-bg/80 px-3 py-2 text-xs font-semibold text-muted">
                        {edge}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">
                    {qontextDatasetProof.graphSummary.updateMechanic}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sourceForFactLabel(fact: Fact, spans: SourceSpan[], sources: SourceDocument[]) {
  const { span, source } = sourceForFact(fact, spans, sources);
  return { span, source };
}

function SourcePanel({
  state,
  filter = "all",
  focusedSourceId,
  focusedFactId,
  onFilterChange
}: {
  state: ContextState;
  filter?: SourceFilter;
  focusedSourceId?: string;
  focusedFactId?: string;
  onFilterChange?: (filter: SourceFilter) => void;
}) {
  const orderedSources = useMemo(
    () =>
      [...state.sources].sort(
        (a, b) =>
          sourceRelevanceRank(a.relevance.status) - sourceRelevanceRank(b.relevance.status) ||
          b.relevance.score - a.relevance.score
      ),
    [state.sources]
  );
  const defaultSourceId =
    focusedSourceId ??
    orderedSources.find((item) => item.relevance.status === "included")?.id ??
    orderedSources[0]?.id;
  const [selected, setSelected] = useState(defaultSourceId);
  const filteredSources =
    filter === "all" ? orderedSources : orderedSources.filter((item) => item.relevance.status === filter);

  useEffect(() => {
    if (focusedSourceId) {
      setSelected(focusedSourceId);
    }
  }, [focusedSourceId]);

  useEffect(() => {
    if (filter !== "all" && !filteredSources.some((item) => item.id === selected)) {
      setSelected(filteredSources[0]?.id ?? defaultSourceId);
    }
  }, [defaultSourceId, filter, filteredSources, selected]);

  const source = orderedSources.find((item) => item.id === selected) ?? orderedSources[0];
  const sourceFacts = state.facts.filter((fact) =>
    fact.sourceSpanIds.some((spanId) => {
      const span = state.spans.find((item) => item.id === spanId);
      return span?.sourceDocumentId === source.id;
    })
  );

  return (
    <section className="grid min-h-0 grid-cols-[360px_1fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-2 overflow-y-auto pr-1">
        <div className="sticky top-0 z-10 mb-3 rounded-2xl border border-border bg-surface/95 p-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-1">
            {([
              ["all", "All"],
              ["included", "Signal"],
              ["needs_review", "Review"],
              ["ignored", "Noise"]
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onFilterChange?.(id)}
                className={cx(
                  "rounded-xl px-2 py-2 text-xs font-semibold transition",
                  filter === id ? "bg-primary text-cream" : "text-muted hover:bg-bg hover:text-fg"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {filteredSources.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item.id)}
            className={cx(
              "w-full rounded-2xl border px-4 py-3 text-left transition",
              selected === item.id
                ? "border-primary bg-[oklch(from_var(--primary)_l_c_h_/_0.09)]"
                : "border-border bg-surface hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <div className="flex shrink-0 gap-1">
                <Badge>{item.sourceType}</Badge>
                <Badge tone={relevanceTone(item.relevance.status)}>
                  {relevanceLabel(item.relevance.status)}
                </Badge>
              </div>
            </div>
            <p className="mt-2 truncate font-mono text-xs text-muted">{item.filename}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
              {item.relevance.reason}
            </p>
          </button>
        ))}
      </div>
      <div className="soft-panel min-h-0 overflow-hidden border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold">{source.title}</h2>
            <p className="font-mono text-xs text-muted">
              {source.filename} · {source.checksum}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge tone={relevanceTone(source.relevance.status)}>
              {relevanceLabel(source.relevance.status)} · {Math.round(source.relevance.score * 100)}%
            </Badge>
            <Badge tone="info">{sourceFacts.length} facts</Badge>
          </div>
        </div>
        <div className="border-b border-border bg-bg/70 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Filter className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Signal classifier decision</p>
              <p className="mt-1 text-sm leading-6 text-muted">{source.relevance.reason}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                classifier: {source.relevance.classifier}
              </p>
            </div>
          </div>
        </div>
        <pre className="h-[520px] overflow-auto whitespace-pre-wrap bg-code p-5 font-mono text-xs leading-6 text-cream">
          {source.text}
        </pre>
        <div className="border-t border-border bg-bg/70 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Extracted from this source
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceFacts.map((fact) => (
              <span
                key={fact.id}
                className={cx(
                  "rounded-full border px-3 py-1 font-mono text-[11px]",
                  focusedFactId === fact.id
                    ? "demo-flash border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted"
                )}
              >
                {fact.id}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FactPanel({
  state,
  focusedFactId,
  onOpenSource
}: {
  state: ContextState;
  focusedFactId?: string;
  onOpenSource?: (sourceId: string, factId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const facts = state.facts.filter((fact) => {
    const searchable = `${fact.id} ${fact.predicate} ${fact.objectValue} ${fact.factType}`.toLowerCase();
    return searchable.includes(query.toLowerCase());
  });
  return (
    <section className="soft-panel min-h-0 overflow-hidden border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Fact ledger
          </p>
          <p className="mt-1 text-sm text-muted">Click evidence to jump straight to its source document.</p>
        </div>
        <label className="relative min-w-[260px] max-sm:w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search facts, predicates, values..."
            className="h-10 w-full rounded-2xl border border-border bg-bg pl-9 pr-3 text-sm outline-none transition focus:border-primary"
          />
        </label>
      </div>
      <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-surface-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <tr>
            <th className="border-b border-border px-4 py-3">Fact</th>
            <th className="border-b border-border px-4 py-3">Predicate</th>
            <th className="border-b border-border px-4 py-3">Value</th>
            <th className="border-b border-border px-4 py-3">Source Quote</th>
            <th className="border-b border-border px-4 py-3">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {facts.map((fact) => {
            const { span, source } = sourceForFactLabel(fact, state.spans, state.sources);
            return (
              <tr
                key={fact.id}
                className={cx(
                  "border-b border-border/70 align-top transition",
                  focusedFactId === fact.id && "demo-flash bg-primary/10"
                )}
              >
                <td className="px-4 py-3 font-mono text-xs">{fact.id}</td>
                <td className="px-4 py-3">{fact.predicate}</td>
                <td className="px-4 py-3 font-medium">{fact.objectValue}</td>
                <td className="max-w-[440px] px-4 py-3 text-muted">
                  <button
                    type="button"
                    onClick={() => source && onOpenSource?.(source.id, fact.id)}
                    className="block text-left text-fg underline-offset-4 transition hover:text-primary hover:underline"
                  >
                    “{span?.quote}”
                  </button>
                  <button
                    type="button"
                    onClick={() => source && onOpenSource?.(source.id, fact.id)}
                    className="mt-1 block font-mono text-[11px] text-muted transition hover:text-primary"
                  >
                    {source?.filename}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={fact.confidence > 0.9 ? "good" : "warn"}>
                    {Math.round(fact.confidence * 100)}%
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </section>
  );
}

function ConflictPanel({
  state,
  onOpenFact,
  onOpenSource
}: {
  state: ContextState;
  onOpenFact?: (factId: string) => void;
  onOpenSource?: (sourceId: string, factId: string) => void;
}) {
  const factById = new Map(state.facts.map((fact) => [fact.id, fact]));
  return (
    <section className="grid gap-3">
      {state.conflicts.map((conflict) => (
        <div key={conflict.id} className="soft-panel overflow-hidden border border-border bg-surface">
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-primary" />
                <h2 className="font-semibold">{conflict.title}</h2>
              </div>
              <p className="mt-1 text-sm text-muted">{conflict.explanation}</p>
            </div>
            <Badge tone={conflict.severity === "high" ? "bad" : "warn"}>
              {conflict.severity}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 max-md:grid-cols-1">
            {conflict.factIds.map((factId) => {
              const fact = factById.get(factId);
              if (!fact) return null;
              const { span, source } = sourceForFactLabel(fact, state.spans, state.sources);
              return (
                <div key={factId} className="rounded-2xl border border-border bg-surface-2 p-3">
                  <p className="font-mono text-xs text-muted">{fact.id}</p>
                  <p className="mt-2 font-semibold">{fact.objectValue}</p>
                  <p className="mt-3 text-sm text-muted">“{span?.quote}”</p>
                  <p className="mt-2 font-mono text-[11px] text-muted">{source?.filename}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFact?.(fact.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-bg px-3 text-xs font-semibold transition hover:border-primary/40"
                    >
                      <Braces className="size-3" />
                      View fact
                    </button>
                    <button
                      type="button"
                      onClick={() => source && onOpenSource?.(source.id, fact.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-cream transition hover:-translate-y-px"
                    >
                      <FileText className="size-3" />
                      Evidence
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function FilePanel({
  files,
  onOpenFact
}: {
  files: VfsFile[];
  onOpenFact?: (factId: string) => void;
}) {
  const [selectedPath, setSelectedPath] = useState(files[0]?.path);
  const file = files.find((item) => item.path === selectedPath) ?? files[0];
  return (
    <section className="grid min-h-0 grid-cols-[340px_1fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-2 overflow-auto pr-1">
        {files.map((item) => (
          <button
            key={item.path}
            onClick={() => setSelectedPath(item.path)}
            className={cx(
              "w-full rounded-2xl border px-3 py-2 text-left",
              selectedPath === item.path
                ? "border-primary bg-[oklch(from_var(--primary)_l_c_h_/_0.09)]"
                : "border-border bg-surface"
            )}
          >
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="truncate font-mono text-[11px] text-muted">{item.path}</p>
          </button>
        ))}
      </div>
      <div className="dark-panel min-h-0 overflow-hidden border border-border bg-code">
        <div className="flex items-center justify-between border-b border-[oklch(0.32_0.015_40)] px-4 py-3 text-cream">
          <span className="font-mono text-xs">{file.path}</span>
          <Badge tone="info">{file.sourceFactIds.length} facts</Badge>
        </div>
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {file.sourceFactIds.map((factId) => (
              <button
                key={factId}
                type="button"
                onClick={() => onOpenFact?.(factId)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-cream/70 transition hover:border-primary/50 hover:text-primary"
              >
                {factId}
              </button>
            ))}
          </div>
        </div>
        <pre className="h-[520px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-cream">
          {file.content}
        </pre>
      </div>
    </section>
  );
}

function PatchPanel({ workflow }: { workflow: ReturnType<typeof buildDemoWorkflow> }) {
  const patch = workflow.incoming.patch;
  if (!patch) return null;
  return (
    <section className="grid min-h-0 grid-cols-[360px_1fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-3">
        <div className="soft-panel border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Hammer className="size-4 text-primary" />
            <h2 className="font-semibold">Fact Patch</h2>
          </div>
          <p className="mt-2 text-sm text-muted">{patch.reason}</p>
          <div className="mt-4 grid gap-2">
            <Badge tone="good">preserves human edits: yes</Badge>
            <Badge tone="info">{patch.changedFactIds.length} changed facts</Badge>
            <Badge tone={workflow.applied.patch?.patchStatus === "applied" ? "good" : "warn"}>
              {workflow.applied.patch?.patchStatus ?? patch.patchStatus}
            </Badge>
          </div>
        </div>
        <div className="soft-panel border border-border bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Incoming source
          </p>
          <p className="mt-2 font-semibold">Quote rejected, emergency repair approved</p>
          <p className="mt-2 text-sm text-muted">
            Context Surgeon replaces generated blocks while keeping the manual note intact.
          </p>
        </div>
      </div>
      <pre className="dark-panel h-[620px] overflow-auto border border-border bg-code p-5 font-mono text-xs leading-6 text-cream">
        {patch.unifiedDiff}
      </pre>
    </section>
  );
}

function SnapshotPatchPanel({ snapshot }: { snapshot: ProductSnapshot }) {
  const patch = snapshot.patch;
  const [mode, setMode] = useState<PatchViewMode>("diff");
  if (!patch) {
    return (
      <section className="soft-panel border border-border bg-surface p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GitCompare className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">No Fact Patch yet</h2>
            <p className="mt-1 text-sm text-muted">
              Add the human note, then ingest the new owner email to produce a minimal diff.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid min-h-0 grid-cols-[390px_1fr] gap-4 max-lg:grid-cols-1">
      <div className="space-y-3">
        <div className="soft-panel border border-primary/35 bg-[oklch(from_var(--primary)_l_c_h_/_0.10)] p-4">
          <div className="flex items-center gap-2">
            <Hammer className="size-4 text-primary" />
            <h2 className="font-semibold">Fact Patch</h2>
          </div>
          <p className="mt-2 text-sm text-muted">{patch.reason}</p>
          <div className="mt-4 grid gap-2">
            <Badge tone={patch.preservesHumanEdits ? "good" : "bad"}>
              preserves human edits: {patch.preservesHumanEdits ? "yes" : "no"}
            </Badge>
            <Badge tone="info">{patch.changedFactIds.length} changed facts</Badge>
            <Badge tone={patch.patchStatus === "applied" ? "good" : "warn"}>
              {patch.patchStatus}
            </Badge>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[oklch(0.58_0.19_27_/_0.35)] bg-[oklch(0.58_0.19_27_/_0.08)] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-[oklch(0.50_0.18_27)]" />
              <p className="font-semibold">Regenerate would be risky</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Full regeneration rewrites the whole file and can erase property-manager notes.
            </p>
          </div>
          <div className="rounded-[22px] border border-[oklch(0.55_0.14_150_/_0.35)] bg-[oklch(0.55_0.14_150_/_0.09)] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[oklch(0.42_0.13_150)]" />
              <p className="font-semibold">Fact Patch is surgical</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Generated blocks update by hash. Human-owned sections are preserved and visibly checked.
            </p>
          </div>
        </div>
        <div className="soft-panel border border-border bg-surface p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Incoming source
          </p>
          <p className="mt-2 font-semibold">Quote rejected, emergency repair approved</p>
          <p className="mt-2 text-sm text-muted">
            The generated blocks update, while the manual tenant-communication note remains.
          </p>
        </div>
      </div>
      <div className="dark-panel overflow-hidden border border-border bg-code">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-cream">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Unified Fact Patch
            </p>
            <p className="mt-1 text-sm text-cream/62">{patch.path}</p>
          </div>
          <Badge tone={patch.preservesHumanEdits ? "good" : "bad"}>human note locked</Badge>
        </div>
        <div className="border-b border-white/10 p-3">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {([
              ["diff", "Unified diff"],
              ["facts", "Changed facts"],
              ["human", "Human note check"]
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cx(
                  "rounded-xl px-3 py-2 text-xs font-semibold transition",
                  mode === id ? "bg-primary text-cream" : "text-cream/60 hover:text-cream"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {mode === "diff" ? (
          <pre className="h-[540px] overflow-auto p-5 font-mono text-xs leading-6 text-cream">
            {patch.unifiedDiff}
          </pre>
        ) : mode === "facts" ? (
          <div className="grid h-[540px] content-start gap-3 overflow-auto p-5">
            {patch.changedFactIds.map((factId) => {
              const fact = snapshot.current.facts.find((item) => item.id === factId)
                ?? snapshot.incoming.facts.find((item) => item.id === factId)
                ?? snapshot.applied.facts.find((item) => item.id === factId);
              return (
                <div key={factId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-mono text-xs text-primary">{factId}</p>
                  <p className="mt-2 font-semibold text-cream">{fact?.predicate ?? "changed fact"}</p>
                  <p className="mt-1 text-sm text-cream/68">{fact?.objectValue ?? "Updated by incoming source."}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[540px] overflow-auto p-5">
            <div className="rounded-[24px] border border-[oklch(0.55_0.14_150_/_0.35)] bg-[oklch(0.55_0.14_150_/_0.10)] p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[oklch(0.65_0.13_150)]" />
                <p className="font-semibold text-cream">Manual tenant note preserved</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-cream/70">
                The patch changed generated fact blocks only. Human-owned guidance remains outside
                generated hashes, so the property manager’s communication preference survives.
              </p>
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-cream/72">
                {`<!-- human note: tenant prefers email before phone; do not overwrite -->`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AgentPanel({ workflow }: { workflow: ReturnType<typeof buildDemoWorkflow> }) {
  const before = workflow.beforeCheck;
  const after = workflow.afterCheck;
  return (
    <section className="grid gap-4">
      <div className="soft-panel grid gap-3 border border-border bg-surface p-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            downstream agent changed its mind
          </p>
          <h2 className="mt-2 text-2xl font-semibold">From “do not dispatch” to cited emergency action.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The agent is not smarter because of a larger prompt. It is safer because the underlying
            context changed, and every action now points back to fact IDs.
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-[22px] border border-[oklch(0.58_0.19_27_/_0.30)] bg-[oklch(0.58_0.19_27_/_0.08)] p-4">
            <p className="font-mono text-3xl font-semibold">{before.score}</p>
            <p className="mt-1 text-sm font-semibold">Blocked / review-heavy</p>
            <p className="mt-2 text-xs leading-5 text-muted">{before.summary}</p>
          </div>
          <ArrowRight className="size-5 text-primary" />
          <div className="rounded-[22px] border border-[oklch(0.55_0.14_150_/_0.35)] bg-[oklch(0.55_0.14_150_/_0.09)] p-4">
            <p className="font-mono text-3xl font-semibold text-[oklch(0.42_0.13_150)]">{after.score}</p>
            <p className="mt-1 text-sm font-semibold">Actionable with citations</p>
            <p className="mt-2 text-xs leading-5 text-muted">{after.summary}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
      {([
        ["Before Fact Patch", before],
        ["After Fact Patch", after]
      ] as const).map(([label, result]) => (
        <div key={label} className="soft-panel overflow-hidden border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-semibold">{label}</h2>
            <Badge tone={result.score >= 85 ? "good" : result.score >= 70 ? "warn" : "bad"}>
              {result.score}/100 context health
            </Badge>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted">{result.summary}</p>
            <div className="mt-4 space-y-3">
              {result.actions.map((action) => (
                <div key={action.id} className="rounded-2xl border border-border bg-surface-2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{action.label}</p>
                    <Badge
                      tone={
                        action.status === "ready"
                          ? "good"
                          : action.status === "blocked"
                            ? "bad"
                            : "warn"
                      }
                    >
                      {action.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{action.rationale}</p>
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    {action.sourceFactIds.join(", ") || "no facts"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      </div>
    </section>
  );
}

function LiveModePanel({
  session,
  integrationState,
  integrationSync,
  integrationsLoading,
  syncLoading,
  onRefresh,
  onConnect,
  onSync,
  onUploadFiles,
  onSaveRule,
  onPromoteSync
}: {
  session: AuthSession | null;
  integrationState?: IntegrationState;
  integrationSync?: IntegrationSyncResult;
  integrationsLoading: boolean;
  syncLoading: boolean;
  onRefresh: () => Promise<void>;
  onConnect: (toolkitSlug: string) => Promise<void>;
  onSync: (toolkitSlugs: string[]) => Promise<void>;
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  onSaveRule: (rule: { scope: string; toolkits: string[]; events: string[]; autoPatch: boolean }) => Promise<IngestionRule | undefined>;
  onPromoteSync: () => void;
}) {
  const [scope, setScope] = useState("Sonnenallee 44");
  const [dateRange, setDateRange] = useState("Last 90 days");
  const [selectedToolkits, setSelectedToolkits] = useState<string[]>(["manual_upload", "gmail", "hubspot", "googledrive"]);
  const [activeCategory, setActiveCategory] = useState("Files & knowledge");
  const [activeLivePanel, setActiveLivePanel] = useState<"sources" | "automation" | "review">("sources");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["new_email", "new_attachment", "crm_update", "file_update"]);
  const [autoPatch, setAutoPatch] = useState(true);
  const [savedRule, setSavedRule] = useState<IngestionRule>();
  const [savingRule, setSavingRule] = useState(false);
  const [liveError, setLiveError] = useState<string | undefined>();
  const connected = integrationState?.connections.filter((item) => item.status === "connected") ?? [];
  const groupedCatalog = (integrationState?.catalog ?? []).reduce<Record<string, IntegrationCatalogItem[]>>(
    (groups, item) => {
      groups[item.categoryLabel] = [...(groups[item.categoryLabel] ?? []), item];
      return groups;
    },
    {}
  );
  const categoryNames = Object.keys(groupedCatalog);
  const selectedCategory = categoryNames.includes(activeCategory) ? activeCategory : categoryNames[0];
  const visibleCatalog = selectedCategory ? groupedCatalog[selectedCategory] ?? [] : [];
  const primaryToolkits = selectedToolkits.length
    ? selectedToolkits
    : connected.length
      ? connected.slice(0, 3).map((item) => item.toolkitSlug)
      : ["gmail", "hubspot", "googledrive"];
  const selectedCatalog = (integrationState?.catalog ?? []).filter((item) =>
    selectedToolkits.includes(item.toolkitSlug)
  );
  const syncFactCount = integrationSync?.sources.reduce((sum, source) => sum + source.facts.length, 0) ?? 0;
  const livePanelTabs = [
    { id: "sources", label: "Sources", detail: `${selectedToolkits.length} scoped` },
    { id: "automation", label: "Automation", detail: savedRule ? "active rule" : "draft rule" },
    { id: "review", label: "Review", detail: `${integrationSync?.sources.length ?? 0} candidates` }
  ] as const;

  function toggleToolkit(toolkitSlug: string) {
    setSelectedToolkits((current) =>
      current.includes(toolkitSlug)
        ? current.filter((item) => item !== toolkitSlug)
        : [...current, toolkitSlug]
    );
  }

  function toggleEvent(event: string) {
    setSelectedEvents((current) =>
      current.includes(event) ? current.filter((item) => item !== event) : [...current, event]
    );
  }

  async function runLiveOperation(operation: () => Promise<void>) {
    setLiveError(undefined);
    try {
      await operation();
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Live intake action failed.");
    }
  }

  return (
    <div className="soft-panel mb-4 overflow-hidden border border-border bg-surface">
      <div className="grid gap-0 lg:grid-cols-[430px_1fr]">
        <div className="border-r border-border p-4 max-lg:border-b max-lg:border-r-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                Live intake
              </p>
              <h3 className="mt-2 text-xl font-semibold">One scope, many systems.</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Choose the business scope, collect evidence, then promote reviewed sources into the
                same compiler as the guided demo.
              </p>
            </div>
            <Badge tone={integrationState?.mode === "live" ? "good" : "warn"}>
              {integrationState?.mode === "live" ? "live connectors" : "preview catalog"}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
              <label className="grid gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  Context scope
                </span>
                <input
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  className="h-11 rounded-2xl border border-border bg-bg px-3 text-sm outline-none transition focus:border-primary"
                />
              </label>
              <label className="grid gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  Window
                </span>
                <select
                  value={dateRange}
                  onChange={(event) => setDateRange(event.target.value)}
                  className="h-11 rounded-2xl border border-border bg-bg px-3 text-sm outline-none transition focus:border-primary"
                >
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                  <option>All connected history</option>
                </select>
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void runLiveOperation(onRefresh)}
                disabled={integrationsLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-bg px-4 text-sm font-semibold transition hover:border-primary/40 disabled:opacity-60"
              >
                <RefreshCw className={cx("size-4 text-primary", integrationsLoading && "animate-spin")} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLivePanel("review");
                  void runLiveOperation(() => onSync(primaryToolkits));
                }}
                disabled={!session || syncLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Workflow className="size-4" />
                {syncLoading ? "Syncing..." : `Sync ${primaryToolkits.length} sources`}
              </button>
            </div>

            {!session ? (
              <p className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-xs leading-5 text-muted">
                Sign in to connect real systems, activate rules, and save approved sources.
              </p>
            ) : null}
            {liveError ? (
              <p className="rounded-2xl border border-[oklch(0.58_0.19_27_/_0.32)] bg-[oklch(0.58_0.19_27_/_0.08)] p-3 text-xs leading-5 text-[oklch(0.50_0.18_27)]">
                {liveError}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-1 rounded-[22px] border border-border bg-bg/70 p-1">
              {livePanelTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLivePanel(tab.id)}
                  className={cx(
                    "rounded-[18px] px-2 py-2 text-left transition",
                    activeLivePanel === tab.id
                      ? "bg-primary text-cream shadow-sm"
                      : "text-muted hover:bg-surface hover:text-fg"
                  )}
                >
                  <span className="block text-xs font-semibold">{tab.label}</span>
                  <span className="block truncate font-mono text-[10px] opacity-70">{tab.detail}</span>
                </button>
              ))}
            </div>

            {activeLivePanel === "sources" ? (
              <div className="grid gap-3">
                <label className="grid min-h-[132px] cursor-pointer content-center rounded-[22px] border border-dashed border-primary/45 bg-bg/70 p-4 transition hover:-translate-y-px hover:border-primary">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.rtf,.html,.xml,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={(event) => {
                      if (event.target.files?.length) {
                        void runLiveOperation(() => onUploadFiles(event.target.files as FileList));
                        event.currentTarget.value = "";
                        setActiveLivePanel("review");
                      }
                    }}
                  />
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <UploadCloud className="size-4 text-primary" />
                    Upload evidence
                  </span>
                  <span className="mt-2 text-xs leading-5 text-muted">
                    PDFs, Word docs, text, CSV, JSON, Markdown, scans, and exports become reviewable
                    sources with provenance.
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-border bg-bg/70 p-3">
                    <p className="font-mono text-2xl font-semibold">{connected.length}</p>
                    <p className="mt-1 text-xs text-muted">connected</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-bg/70 p-3">
                    <p className="font-mono text-2xl font-semibold">{integrationSync?.sources.length ?? 0}</p>
                    <p className="mt-1 text-xs text-muted">sources</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-bg/70 p-3">
                    <p className="font-mono text-2xl font-semibold">{syncFactCount}</p>
                    <p className="mt-1 text-xs text-muted">facts</p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-border bg-bg/70 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    Scoped sources
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(selectedCatalog.length ? selectedCatalog : integrationState?.catalog.slice(0, 4) ?? []).map((item) => (
                      <span key={item.toolkitSlug} className="rounded-full border border-border bg-surface px-2 py-1 text-xs text-muted">
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeLivePanel === "automation" ? (
              <div className="rounded-[22px] border border-border bg-bg/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Ingestion rule</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Watch the scoped systems and produce a candidate Fact Patch when meaningful
                      evidence arrives.
                    </p>
                  </div>
                  <Badge tone={savedRule ? "good" : "neutral"}>{savedRule ? "active" : "draft"}</Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["new_email", "New email"],
                    ["new_attachment", "New attachment"],
                    ["crm_update", "CRM update"],
                    ["file_update", "File update"],
                    ["support_update", "Ticket update"],
                    ["work_update", "Work item update"]
                  ].map(([id, label]) => (
                    <label key={id} className="flex min-h-9 items-center gap-2 rounded-2xl border border-border bg-surface px-3 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(id)}
                        onChange={() => toggleEvent(id)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <label className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-3 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={autoPatch}
                    onChange={() => setAutoPatch((value) => !value)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  Classify source, extract facts, and draft a Fact Patch automatically
                </label>
                <button
                  type="button"
                  disabled={!session || savingRule}
                  onClick={async () => {
                    setSavingRule(true);
                    try {
                      await runLiveOperation(async () => {
                        const rule = await onSaveRule({
                          scope,
                          toolkits: primaryToolkits,
                          events: selectedEvents,
                          autoPatch
                        });
                        if (rule) setSavedRule(rule);
                      });
                    } finally {
                      setSavingRule(false);
                    }
                  }}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-cream transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Workflow className="size-4" />
                  {savingRule ? "Saving rule..." : "Activate rule"}
                </button>
                {savedRule ? (
                  <p className="mt-2 font-mono text-[10px] text-muted">
                    {savedRule.id} · {savedRule.events.length} events · {savedRule.action}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[22px] border border-border bg-bg/70 p-4">
                {integrationSync ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">Review candidate sources</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{integrationSync.summary}</p>
                      </div>
                      <Badge tone={integrationSync.mode === "live" ? "good" : "warn"}>
                        {integrationSync.mode === "live" ? "live" : "preview"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {integrationSync.sources.slice(0, 2).map((source) => (
                        <div key={source.id} className="rounded-2xl border border-border bg-surface p-3">
                          <p className="font-mono text-[11px] text-primary">{source.toolkitSlug}</p>
                          <p className="mt-1 text-sm font-semibold">{source.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{source.summary}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={onPromoteSync}
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition hover:-translate-y-px"
                    >
                      <CheckCircle2 className="size-4" />
                      Approve into compiler
                    </button>
                  </>
                ) : (
                  <div className="grid min-h-[220px] place-items-center text-center">
                    <div>
                      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Workflow className="size-5" />
                      </span>
                      <p className="mt-3 font-semibold">No candidate sources yet</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Sync scoped systems or upload files to review evidence before it reaches the
                        context compiler.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {activeLivePanel === "sources" ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-4 max-md:block">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                    Connector catalog
                  </p>
                  <h4 className="mt-2 font-semibold">Pick systems for this context scope.</h4>
                </div>
                <Badge tone="info">{integrationState?.catalog.length ?? 0} supported</Badge>
              </div>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {categoryNames.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={cx(
                      "shrink-0 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                      selectedCategory === category
                        ? "border-primary bg-primary text-cream"
                        : "border-border bg-bg text-muted hover:border-primary/45 hover:text-fg"
                    )}
                  >
                    {category}
                    <span className="ml-2 font-mono opacity-70">{groupedCatalog[category]?.length ?? 0}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {visibleCatalog.map((item) => {
                  const connection = integrationState?.connections.find(
                    (candidate) => candidate.toolkitSlug === item.toolkitSlug
                  );
                  const status = connection?.status ?? "available";
                  const selectedForSync = selectedToolkits.includes(item.toolkitSlug);
                  return (
                    <div
                      key={item.toolkitSlug}
                      className={cx(
                        "rounded-[22px] border bg-bg/72 p-3 transition hover:-translate-y-px",
                        selectedForSync ? "border-primary/55" : "border-border hover:border-primary/35"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="mt-1 font-mono text-[11px] text-muted">
                            {item.connectKind === "manual_upload" ? "manual intake" : item.categoryLabel}
                          </p>
                        </div>
                        <Badge tone={status === "connected" ? "good" : status === "needs_config" ? "warn" : "neutral"}>
                          {status === "needs_config" ? "setup" : status}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.sourceTypes.slice(0, 3).map((type) => (
                          <span key={type} className="rounded-full bg-surface px-2 py-1 font-mono text-[10px] text-muted">
                            {type}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                        <label className="flex min-h-9 items-center gap-2 rounded-2xl border border-border bg-surface px-3 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={selectedForSync}
                            onChange={() => toggleToolkit(item.toolkitSlug)}
                            className="size-4 accent-[var(--primary)]"
                          />
                          Scope
                        </label>
                        <button
                          type="button"
                          onClick={() => void runLiveOperation(() => onConnect(item.toolkitSlug))}
                          disabled={!session || item.connectKind === "manual_upload"}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-2xl border border-border bg-surface px-3 text-xs font-semibold transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ExternalLink className="size-3" />
                          {item.connectKind === "manual_upload" ? "Upload" : "Connect"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLivePanel("review");
                            void runLiveOperation(() => onSync([item.toolkitSlug]));
                          }}
                          disabled={!session || syncLoading}
                          className="inline-flex h-9 items-center justify-center rounded-2xl bg-primary px-3 text-xs font-semibold text-cream transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Sync
                        </button>
                      </div>
                      {connection?.setupMissing?.length ? (
                        <p className="mt-2 font-mono text-[10px] text-muted">
                          configure: {connection.setupMissing.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeLivePanel === "automation" ? (
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-border bg-bg/72 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Automation path
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {[
                    ["01", "Watch", "Listen for scoped updates in connected systems."],
                    ["02", "Classify", "Reject noise before it reaches context."],
                    ["03", "Patch", "Generate a minimal fact-level update."],
                    ["04", "Review", "Human approves before the compiler changes."]
                  ].map(([step, title, body]) => (
                    <div key={step} className="rounded-2xl border border-border bg-surface p-3">
                      <p className="font-mono text-[11px] text-primary">{step}</p>
                      <p className="mt-2 text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-border bg-bg/72 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Current rule scope
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {selectedCatalog.map((item) => (
                    <div key={item.toolkitSlug} className="rounded-2xl border border-border bg-surface p-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.ingestionPolicy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-border bg-bg/72 p-4">
              <div className="flex items-start justify-between gap-3 max-md:block">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                    Evidence review
                  </p>
                  <h4 className="mt-2 font-semibold">
                    {integrationSync ? "Candidate sources ready for approval." : "Run a sync or upload evidence."}
                  </h4>
                </div>
                {integrationSync ? (
                  <Badge tone={integrationSync.mode === "live" ? "good" : "warn"}>
                    {integrationSync.mode === "live" ? "live sync" : "preview sync"}
                  </Badge>
                ) : null}
              </div>
              {integrationSync ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-muted">{integrationSync.summary}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {integrationSync.sources.map((source) => (
                      <div key={source.id} className="rounded-2xl border border-border bg-surface p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[11px] text-primary">{source.toolkitSlug}</p>
                          <Badge tone={source.confidence > 0.75 ? "good" : "warn"}>
                            {Math.round(source.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm font-semibold">{source.title}</p>
                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted">{source.summary}</p>
                        <p className="mt-2 font-mono text-[11px] text-muted">{source.facts.length} facts</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-4">
                    {["Preview", "Approve", "Compile", "Publish"].map((step, index) => (
                      <div key={step} className="rounded-2xl border border-border bg-surface p-3">
                        <p className="font-mono text-[11px] text-primary">{String(index + 1).padStart(2, "0")}</p>
                        <p className="mt-1 text-sm font-semibold">{step}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onPromoteSync}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition hover:-translate-y-px"
                  >
                    <CheckCircle2 className="size-4" />
                    Approve sources into compiler
                  </button>
                </>
              ) : (
                <div className="mt-4 grid min-h-[360px] place-items-center rounded-[22px] border border-dashed border-border bg-surface/60 p-8 text-center">
                  <div>
                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Workflow className="size-5" />
                    </span>
                    <p className="mt-3 font-semibold">No live candidates yet</p>
                    <p className="mt-1 max-w-md text-sm leading-6 text-muted">
                      Select systems in Sources, then sync them into a review queue before promoting
                      evidence into the context compiler.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MainView({
  view,
  snapshot,
  workflow,
  sourceFilter,
  focusedSourceId,
  focusedFactId,
  onSourceFilterChange,
  onOpenFact,
  onOpenSource
}: {
  view: ViewId;
  snapshot: ProductSnapshot;
  workflow: ReturnType<typeof buildDemoWorkflow>;
  sourceFilter: SourceFilter;
  focusedSourceId?: string;
  focusedFactId?: string;
  onSourceFilterChange: (filter: SourceFilter) => void;
  onOpenFact: (factId: string) => void;
  onOpenSource: (sourceId: string, factId: string) => void;
}) {
  if (view === "sources") {
    return (
      <SourcePanel
        state={snapshot.current}
        filter={sourceFilter}
        focusedSourceId={focusedSourceId}
        focusedFactId={focusedFactId}
        onFilterChange={onSourceFilterChange}
      />
    );
  }
  if (view === "facts") {
    return <FactPanel state={snapshot.current} focusedFactId={focusedFactId} onOpenSource={onOpenSource} />;
  }
  if (view === "conflicts") {
    return <ConflictPanel state={snapshot.current} onOpenFact={onOpenFact} onOpenSource={onOpenSource} />;
  }
  if (view === "files") return <FilePanel files={snapshot.current.files} onOpenFact={onOpenFact} />;
  if (view === "patch") return <SnapshotPatchPanel snapshot={snapshot} />;
  return <AgentPanel workflow={workflow} />;
}

function AuditTimeline({
  snapshot,
  guidedStep,
  onSelectView
}: {
  snapshot: ProductSnapshot;
  guidedStep?: GuidedDemoStep;
  onSelectView?: (view: ViewId) => void;
}) {
  const items = guidedDemoSteps.map((step, index) => {
    const complete = demoStepComplete(step.id, snapshot.phase);
    const active = guidedStep === step.id;
    const proof =
      step.id === "archive"
        ? `${snapshot.current.sources.length} sources`
        : step.id === "compile"
          ? `${snapshot.current.facts.length} facts · ${snapshot.current.conflicts.length} conflicts`
          : step.id === "human-note"
            ? "human note preserved"
            : step.id === "ingest-email"
              ? `${snapshot.patch?.changedFactIds.length ?? 0} facts changed`
              : step.id === "apply-patch"
                ? snapshot.patch?.preservesHumanEdits
                  ? "note survived patch"
                  : "patch reviewed"
                : `${snapshot.afterCheck.score}/100 health`;
    return { ...step, complete, active, index, proof };
  });

  return (
    <div className="soft-panel max-h-[520px] overflow-auto border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            Audit timeline
          </p>
          <h3 className="mt-2 font-semibold">Every context mutation leaves a trail.</h3>
        </div>
        <Badge tone={snapshot.workspaceId.endsWith("-local") ? "warn" : "good"}>
          {snapshot.workspaceId.endsWith("-local") ? "preview state" : "saved"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView?.(item.view)}
            className={cx(
              "grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 rounded-[20px] border p-2.5 text-left transition hover:border-primary/40",
              item.active
                ? "demo-pulse border-primary bg-primary/10"
                : item.complete
                  ? "border-[oklch(0.55_0.14_150_/_0.28)] bg-[oklch(0.55_0.14_150_/_0.07)]"
                  : "border-border bg-bg/70"
            )}
          >
            <span
              className={cx(
                "flex size-7 items-center justify-center rounded-full font-mono text-[11px]",
                item.complete ? "bg-[oklch(0.55_0.14_150_/_0.16)] text-[oklch(0.42_0.13_150)]" : "bg-surface-2 text-muted"
              )}
            >
              {item.complete ? <CheckCircle2 className="size-3.5" /> : String(item.index + 1)}
            </span>
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
              {(item.complete || item.active) && (
                <p className="mt-1 font-mono text-[11px] text-primary">{item.proof}</p>
              )}
            </div>
            <Badge tone={item.active ? "info" : item.complete ? "good" : "neutral"}>
              {item.active ? "running" : item.complete ? "done" : "queued"}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkbenchSection({
  snapshot,
  workflow,
  activeView,
  setActiveView,
  runAction,
  resetWorkspace,
  exportWorkspace,
  providerStatuses,
  refreshProviders,
  providersLoading,
  integrationState,
  integrationSync,
  integrationsLoading,
  syncLoading,
  refreshIntegrations,
  connectIntegration,
  syncIntegrations,
  onUploadFiles,
  saveIngestionRule,
  promoteIntegrationSync,
  session,
  loadingAction,
  runWinningDemo,
  guidedDemoRunning,
  guidedDemoStep
}: {
  snapshot: ProductSnapshot;
  workflow: ReturnType<typeof buildDemoWorkflow>;
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  runAction: (action: WorkspaceAction) => Promise<void>;
  resetWorkspace: () => Promise<void>;
  exportWorkspace: () => Promise<void>;
  providerStatuses: ProviderStatus[];
  refreshProviders: () => Promise<void>;
  providersLoading: boolean;
  integrationState?: IntegrationState;
  integrationSync?: IntegrationSyncResult;
  integrationsLoading: boolean;
  syncLoading: boolean;
  refreshIntegrations: () => Promise<void>;
  connectIntegration: (toolkitSlug: string) => Promise<void>;
  syncIntegrations: (toolkitSlugs: string[]) => Promise<void>;
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  saveIngestionRule: (rule: { scope: string; toolkits: string[]; events: string[]; autoPatch: boolean }) => Promise<IngestionRule | undefined>;
  promoteIntegrationSync: () => void;
  session: AuthSession | null;
  loadingAction?: WorkspaceAction | "reset";
  runWinningDemo: () => Promise<void>;
  guidedDemoRunning: boolean;
  guidedDemoStep?: GuidedDemoStep;
}) {
  const state = snapshot.current;
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [focusedSourceId, setFocusedSourceId] = useState<string | undefined>();
  const [focusedFactId, setFocusedFactId] = useState<string | undefined>();
  const [showLiveIntake, setShowLiveIntake] = useState(false);
  const signalSources = state.sources.filter((source) => source.relevance.status === "included").length;
  const reviewSources = state.sources.filter((source) => source.relevance.status === "needs_review").length;
  const ignoredSources = state.sources.filter((source) => source.relevance.status === "ignored").length;
  const guidedStepIndex = guidedDemoStep
    ? guidedDemoSteps.findIndex((step) => step.id === guidedDemoStep)
    : -1;
  const guidedStepMeta = guidedStepIndex >= 0 ? guidedDemoSteps[guidedStepIndex] : undefined;
  const steps: Array<{
    action: WorkspaceAction;
    label: string;
    detail: string;
    enabled: boolean;
    complete: boolean;
    view: ViewId;
  }> = [
    {
      action: "compile",
      label: "Compile",
      detail: "Extract facts, spans, conflicts, and VFS files.",
      enabled: snapshot.phase === "loaded",
      complete: ["compiled", "human_edited", "patch_proposed", "patch_applied"].includes(snapshot.phase),
      view: "facts"
    },
    {
      action: "human-note",
      label: "Add Human Note",
      detail: "Insert a manual tenant preference outside generated blocks.",
      enabled: snapshot.phase === "compiled",
      complete: ["human_edited", "patch_proposed", "patch_applied"].includes(snapshot.phase),
      view: "files"
    },
    {
      action: "ingest-email",
      label: "Ingest New Email",
      detail: "Detect changed facts and propose a Fact Patch.",
      enabled: snapshot.phase === "human_edited",
      complete: ["patch_proposed", "patch_applied"].includes(snapshot.phase),
      view: "patch"
    },
    {
      action: "apply-patch",
      label: "Apply Patch",
      detail: "Patch context.md and rerun the agent pre-flight.",
      enabled: snapshot.phase === "patch_proposed",
      complete: snapshot.phase === "patch_applied",
      view: "agent"
    }
  ];

  function openFact(factId: string) {
    setFocusedFactId(factId);
    setActiveView("facts");
  }

  function openSource(sourceId: string, factId?: string) {
    setFocusedSourceId(sourceId);
    setFocusedFactId(factId);
    setSourceFilter("all");
    setActiveView("sources");
  }

  function filterSources(filter: SourceFilter) {
    setSourceFilter(filter);
    setActiveView("sources");
  }

  return (
    <section id="demo" className="border-b border-border bg-bg py-16">
      <div className="mx-auto max-w-[1500px] px-6">
        <div className="mb-6 flex items-end justify-between gap-6 max-lg:block">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Demo workbench</p>
            <h2 className="mt-3 text-3xl font-semibold">Operate on context before agents operate on the business.</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Load source material, compile context, preserve a human note, ingest new evidence,
              apply a Fact Patch, and watch the agent action plan change.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
            <Badge tone="info">phase: {phaseLabel(snapshot.phase)}</Badge>
            <Badge tone={session ? "good" : "warn"}>{session ? "saved workspace" : "public preview"}</Badge>
            <button
              onClick={runWinningDemo}
              disabled={guidedDemoRunning || Boolean(loadingAction)}
              className="inline-flex items-center rounded-2xl bg-primary px-3 py-2 font-mono text-[11px] font-semibold text-cream shadow-lg shadow-primary/20 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="mr-1 size-3.5" />
              {guidedDemoRunning && guidedStepMeta
                ? `Step ${guidedStepIndex + 1}/${guidedDemoSteps.length} · ${guidedStepMeta.label}`
                : "Run guided loop"}
            </button>
            <button
              onClick={exportWorkspace}
              disabled={Boolean(loadingAction)}
              className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {session ? "Qontext export" : "Qontext export preview"}
            </button>
            <button
              onClick={resetWorkspace}
              disabled={Boolean(loadingAction) || guidedDemoRunning}
              className="inline-flex items-center rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mb-4 grid items-start gap-3 xl:grid-cols-[1fr_390px]">
          <div className="soft-panel border border-border bg-surface p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Recording path
                </p>
                <p className="mt-1 text-sm text-muted">Four clicks tell the full Fact Patch story.</p>
              </div>
              <Badge tone="info">2 min ready</Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
            {steps.map((step, index) => {
              const active = loadingAction === step.action || guidedDemoStep === step.action;
              return (
              <button
                key={step.action}
                disabled={Boolean(loadingAction) || (!step.enabled && !step.complete)}
                onClick={async () => {
                  setActiveView(step.view);
                  if (step.complete) return;
                  await runAction(step.action);
                  setActiveView(step.view);
                }}
                className={cx(
                  "group min-h-[128px] rounded-[18px] border p-3 text-left transition",
                  step.complete
                    ? "border-[oklch(0.55_0.14_150_/_0.35)] bg-[oklch(0.55_0.14_150_/_0.08)]"
                    : step.enabled
                      ? "border-primary/35 bg-primary/10 hover:-translate-y-px"
                      : "border-border bg-bg/70 opacity-70",
                  active && "demo-pulse border-primary bg-primary/15",
                  (Boolean(loadingAction) || (!step.enabled && !step.complete)) && "cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-2">
                    {step.enabled && !step.complete && !active && <Badge tone="info">Next</Badge>}
                    {active ? (
                      <RefreshCw className="size-4 animate-spin text-primary" />
                    ) : step.complete ? (
                      <CheckCircle2 className="size-4 text-[oklch(0.42_0.13_150)]" />
                    ) : (
                      <ArrowRight className="size-4 text-primary" />
                    )}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{step.label}</p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {active ? "Running live mutation..." : step.complete ? "Click to review this step." : step.detail}
                </p>
              </button>
              );
            })}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                ["Preserved", "human note remains untouched"],
                ["Patched", "only stale generated facts change"],
                ["Changed", "agent plan flips to cited action"]
              ].map(([label, body]) => (
                <div key={label} className="rounded-[18px] border border-primary/20 bg-primary/10 p-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">{label}</p>
                  <p className="mt-1 text-sm leading-5 text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={resetWorkspace}
            disabled={Boolean(loadingAction)}
            className="soft-panel inline-flex min-h-[92px] items-center justify-center gap-2 border border-border bg-surface px-5 font-semibold transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60 xl:hidden"
          >
            <UploadCloud className="size-4 text-primary" />
            Reset Demo
          </button>
          <AuditTimeline snapshot={snapshot} guidedStep={guidedDemoStep} onSelectView={setActiveView} />
        </div>

        <div className="soft-panel mb-4 flex items-center justify-between gap-4 border border-border bg-surface p-4 max-lg:block">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Workflow className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                Live intake available
              </p>
              <h3 className="mt-1 font-semibold">Connect real systems after the sample-data loop.</h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                The recording path stays focused on the provided demo data. Live mode can still sync
                Gmail, CRM, files, support, collaboration, work tracking, and manual uploads.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0">
            <Badge tone="info">{integrationState?.catalog.length ?? 17} connectors</Badge>
            <button
              type="button"
              onClick={() => setShowLiveIntake((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-bg px-4 text-sm font-semibold transition hover:border-primary/40"
            >
              {showLiveIntake ? "Hide live intake" : "Show live intake"}
              <ArrowRight className={cx("size-4 text-primary transition", showLiveIntake && "rotate-90")} />
            </button>
          </div>
        </div>

        {showLiveIntake ? (
          <LiveModePanel
            session={session}
            integrationState={integrationState}
            integrationSync={integrationSync}
            integrationsLoading={integrationsLoading}
            syncLoading={syncLoading}
            onRefresh={refreshIntegrations}
            onConnect={connectIntegration}
            onSync={syncIntegrations}
            onUploadFiles={onUploadFiles}
            onSaveRule={saveIngestionRule}
            onPromoteSync={promoteIntegrationSync}
          />
        ) : null}

        <div className="mb-4 grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="soft-panel border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  Buena hard problem
                </p>
                <h3 className="mt-2 font-semibold">Signal vs noise before context.</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Pioneer/Fastino classifies sources before extraction so irrelevant emails do not
                  pollute `context.md` or downstream agent plans.
                </p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Filter className="size-5" />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => filterSources("included")}
                className="rounded-2xl border border-[oklch(0.55_0.14_150_/_0.28)] bg-[oklch(0.55_0.14_150_/_0.08)] p-3 text-left transition hover:-translate-y-px hover:border-primary/50"
              >
                <p className="font-mono text-2xl font-semibold">{signalSources}</p>
                <p className="mt-1 text-xs text-muted">included</p>
              </button>
              <button
                type="button"
                onClick={() => filterSources("needs_review")}
                className="rounded-2xl border border-[oklch(0.75_0.15_70_/_0.32)] bg-[oklch(0.75_0.15_70_/_0.08)] p-3 text-left transition hover:-translate-y-px hover:border-primary/50"
              >
                <p className="font-mono text-2xl font-semibold">{reviewSources}</p>
                <p className="mt-1 text-xs text-muted">needs review</p>
              </button>
              <button
                type="button"
                onClick={() => filterSources("ignored")}
                className="rounded-2xl border border-border bg-bg/70 p-3 text-left transition hover:-translate-y-px hover:border-primary/50"
              >
                <p className="font-mono text-2xl font-semibold">{ignoredSources}</p>
                <p className="mt-1 text-xs text-muted">ignored noise</p>
              </button>
            </div>
          </div>

          <div className="soft-panel border border-border bg-surface p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Partner technologies
            </p>
            <button
              type="button"
              onClick={refreshProviders}
              disabled={providersLoading}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-border bg-bg px-3 text-xs font-semibold transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cx("size-3.5 text-primary", providersLoading && "animate-spin")} />
              Refresh partner status
            </button>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                {
                  id: "gemini" as const,
                  icon: WandSparkles,
                  label: "Gemini",
                  body: "structured reasoning, conflict explanation, agent pre-flight"
                },
                {
                  id: "tavily" as const,
                  icon: Database,
                  label: "Tavily",
                  body: "external enrichment and verification for public/vendor context"
                },
                {
                  id: "pioneer" as const,
                  icon: Filter,
                  label: "Pioneer",
                  body: "schema-first source relevance and extraction pre-pass"
                }
              ].map(({ id, icon: Icon, label, body }) => {
                const provider = providerStatuses.find((item) => item.id === id);
                return (
                <div key={label} className="rounded-2xl border border-border bg-bg/70 p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <p className="font-semibold">{label}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">{body}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge tone={provider ? providerTone(provider.status) : "neutral"}>
                      {provider?.mode ?? "checking"}
                    </Badge>
                    <Badge tone="neutral">{provider?.detail ?? "ready"}</Badge>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <Metric label="Sources" value={state.sources.length} icon={FileText} />
          <Metric label="Facts" value={state.facts.length} icon={Braces} />
          <Metric label="Open conflicts" value={state.conflicts.length} icon={AlertTriangle} />
          <Metric
            label="Context health"
            value={`${snapshot.phase === "patch_applied" ? snapshot.afterCheck.score : snapshot.beforeCheck.score}/100`}
            icon={CheckCircle2}
          />
        </div>

        <div className="soft-panel mt-4 overflow-hidden border border-border bg-surface">
          <div className="flex flex-wrap gap-1 border-b border-white/10 bg-[oklch(0.20_0.015_38)] p-2">
            {views.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
                  activeView === id
                    ? "bg-primary text-cream"
                    : "text-cream/70 hover:bg-white/5 hover:text-cream"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="p-4">
            <MainView
              view={activeView}
              snapshot={snapshot}
              workflow={workflow}
              sourceFilter={sourceFilter}
              focusedSourceId={focusedSourceId}
              focusedFactId={focusedFactId}
              onSourceFilterChange={setSourceFilter}
              onOpenFact={openFact}
              onOpenSource={openSource}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="soft-panel border border-border bg-surface p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Agent pre-flight delta
            </p>
            <div className="mt-4 flex items-end gap-4">
              <div>
                <p className="font-mono text-3xl font-semibold">{snapshot.beforeCheck.score}</p>
                <p className="text-sm text-muted">before patch</p>
              </div>
              <ArrowRight className="mb-6 size-5 text-primary" />
              <div>
                <p className="font-mono text-3xl font-semibold text-[oklch(0.42_0.13_150)]">
                  {snapshot.afterCheck.score}
                </p>
                <p className="text-sm text-muted">after patch</p>
              </div>
            </div>
          </div>
          <div className="soft-panel border border-border bg-surface p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              Persisted audit events
            </p>
            <div className="mt-3 grid gap-2">
              {snapshot.auditEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border bg-bg/80 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{event.label}</p>
                    <span className="font-mono text-[10px] text-muted">
                      {event.eventType}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{event.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section id="architecture" className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Sponsor-native architecture
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Built around partner tech jobs, not logo stacking.</h2>
            <p className="mt-4 leading-7 text-muted">
              Gemini handles structured reasoning, Tavily enriches and verifies external evidence,
              Pioneer/Fastino supplies schema-first extraction hints, and the Qontext export makes
              the property memory inspectable by humans and agents.
            </p>
          </div>
          <div className="dark-panel overflow-hidden border border-border p-5 text-cream">
            {[
              ["Sources", "emails, PDFs, CSVs, handover notes"],
              ["Pioneer pre-pass", "document kind + likely entities"],
              ["Gemini extraction", "typed facts + source quotes"],
              ["Conflict engine", "stale, missing, contradictory context"],
              ["Fact Patch", "minimal markdown diff with preserved human edits"],
              ["Agent check", "safe action plan with citations"]
            ].map(([label, body], index) => (
              <div key={label} className="flex gap-4 border-b border-white/10 py-3 last:border-b-0">
                <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="mt-1 text-sm text-cream/58">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const fallbackSnapshot = useMemo(() => makeFallbackSnapshot(), []);
  const [snapshot, setSnapshot] = useState<ProductSnapshot>(fallbackSnapshot);
  const workflow = useMemo(
    () => ({
      initial: snapshot.initial,
      withHumanEdit: snapshot.withHumanEdit,
      incoming: snapshot.incoming,
      applied: snapshot.applied,
      beforeCheck: snapshot.beforeCheck,
      afterCheck: snapshot.afterCheck
    }),
    [snapshot]
  );
  const [activeView, setActiveView] = useState<ViewId>("sources");
  const [loadingAction, setLoadingAction] = useState<WorkspaceAction | "reset" | undefined>();
  const [authConfig, setAuthConfig] = useState<FirebaseAuthConfig>({ configured: false });
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | undefined>();
  const [guidedDemoRunning, setGuidedDemoRunning] = useState(false);
  const [guidedDemoStep, setGuidedDemoStep] = useState<GuidedDemoStep | undefined>();
  const [providersLoading, setProvidersLoading] = useState(false);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [integrationState, setIntegrationState] = useState<IntegrationState>();
  const [integrationSync, setIntegrationSync] = useState<IntegrationSyncResult>();
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([
    {
      id: "gemini",
      label: "Gemini",
      mode: "checking",
      status: "fallback",
      detail: "structured extraction"
    },
    {
      id: "tavily",
      label: "Tavily",
      mode: "checking",
      status: "fallback",
      detail: "web enrichment"
    },
    {
      id: "pioneer",
      label: "Pioneer",
      mode: "checking",
      status: "fallback",
      detail: "source relevance"
    }
  ]);

  async function refreshProviderStatuses() {
    setProvidersLoading(true);
    try {
      const checks: Array<Promise<ProviderStatus>> = [
        postProviderJson("/api/providers/gemini/context-check")
          .then((payload) => ({
            id: "gemini" as const,
            label: "Gemini",
            ...providerStatusFromPayload(payload, "agent pre-flight")
          }))
          .catch(() => ({
            id: "gemini" as const,
            label: "Gemini",
            mode: "fallback",
            status: "error" as const,
            detail: "route unavailable"
          })),
        postProviderJson("/api/providers/tavily/enrich")
          .then((payload) => ({
            id: "tavily" as const,
            label: "Tavily",
            ...providerStatusFromPayload(payload, "vendor enrichment")
          }))
          .catch(() => ({
            id: "tavily" as const,
            label: "Tavily",
            mode: "fallback",
            status: "error" as const,
            detail: "route unavailable"
          })),
        postProviderJson("/api/providers/pioneer/classify")
          .then((payload) => ({
            id: "pioneer" as const,
            label: "Pioneer",
            ...providerStatusFromPayload(payload, "signal classifier")
          }))
          .catch(() => ({
            id: "pioneer" as const,
            label: "Pioneer",
            mode: "fallback",
            status: "error" as const,
            detail: "route unavailable"
          }))
      ];

      setProviderStatuses(await Promise.all(checks));
    } finally {
      setProvidersLoading(false);
    }
  }

  async function authHeaders() {
    const session = await validSession();
    return {
      "content-type": "application/json",
      authorization: `Bearer ${session.idToken}`
    };
  }

  async function refreshIntegrations() {
    setIntegrationsLoading(true);
    try {
      const headers = authSession ? await authHeaders() : undefined;
      const response = await fetch("/api/integrations", { headers });
      setIntegrationState((await response.json()) as IntegrationState);
    } finally {
      setIntegrationsLoading(false);
    }
  }

  async function connectIntegration(toolkitSlug: string) {
    const response = await fetch("/api/integrations/connect", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ toolkitSlug })
    });
    const payload = (await response.json()) as { redirectUrl?: string; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Connector setup failed.");
    if (payload.redirectUrl) {
      window.location.href = payload.redirectUrl;
      return;
    }
    await refreshIntegrations();
  }

  async function syncIntegrations(toolkitSlugs: string[]) {
    setSyncLoading(true);
    try {
      const response = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ toolkitSlugs, query: snapshot.propertyName, limit: 10 })
      });
      const payload = (await response.json()) as IntegrationSyncResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Integration sync failed.");
      setIntegrationSync(payload);
    } finally {
      setSyncLoading(false);
    }
  }

  async function uploadManualFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setSyncLoading(true);
    try {
      if (authSession) {
        const form = new FormData();
        for (const file of list) form.append("files", file);
        const session = await validSession();
        const response = await fetch("/api/integrations/upload", {
          method: "POST",
          headers: { authorization: `Bearer ${session.idToken}` },
          body: form
        });
        const payload = (await response.json()) as IntegrationSyncResult & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Manual upload failed.");
        setIntegrationSync(payload);
        return;
      }

      const generatedAt = new Date().toISOString();
      const sources = await Promise.all(
        list.map(async (file, index) => {
          let text = "";
          try {
            text = (await file.text())
              .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 900);
          } catch {
            text = "";
          }
          return {
            id: `manual-browser-${Date.now()}-${index}`,
            toolkitSlug: "manual_upload",
            title: file.name,
            sourceType: file.type || "manual_file",
            timestamp: generatedAt,
            confidence: text ? 0.84 : 0.62,
            summary: text
              ? `Browser extracted ${text.length.toLocaleString("en-US")} characters from ${file.name}.`
              : `${file.name} was accepted as binary evidence with filename/type provenance.`,
            facts: [
              {
                predicate: "uploaded_file.name",
                value: file.name,
                quote: `Uploaded file ${file.name}`
              },
              {
                predicate: "uploaded_file.size",
                value: `${Math.round(file.size / 1024)} KB`,
                quote: "File metadata captured during manual intake."
              }
            ]
          };
        })
      );
      setIntegrationSync({
        ok: true,
        mode: "demo",
        workspaceId: "manual-upload-browser",
        selectedToolkits: ["manual_upload"],
        generatedAt,
        summary: `${sources.length} uploaded file${sources.length === 1 ? "" : "s"} normalized in browser demo mode.`,
        sources,
        nextActions: [
          "Review uploaded file snippets.",
          "Approve relevant sources.",
          "Compile facts, conflicts, and Fact Patch proposals."
        ],
        composio: {
          configured: false,
          attemptedLiveTools: ["manual_upload"],
          missing: []
        }
      });
    } finally {
      setSyncLoading(false);
    }
  }

  async function saveIngestionRule(rule: {
    scope: string;
    toolkits: string[];
    events: string[];
    autoPatch: boolean;
  }) {
    if (!authSession) return undefined;
    const response = await fetch("/api/integrations/rules", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(rule)
    });
    const payload = (await response.json()) as { rule?: IngestionRule; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Rule activation failed.");
    return payload.rule;
  }

  function promoteIntegrationSync() {
    if (!integrationSync?.sources.length) return;
    const generatedAt = new Date().toISOString();
    setSnapshot((current) => {
      const existingSourceIds = new Set(current.current.sources.map((source) => source.id));
      const nextSources = [];
      const nextChunks = [];
      const nextSpans = [];
      const nextFacts = [];

      for (const [sourceIndex, candidate] of integrationSync.sources.entries()) {
        const sourceId = `integration-${candidate.id}`.replace(/[^a-zA-Z0-9_-]/g, "-");
        if (existingSourceIds.has(sourceId)) continue;
        const text = [
          candidate.summary,
          ...candidate.facts.map((fact) => `${fact.predicate}: ${fact.value}. Evidence: ${fact.quote}`)
        ].join("\n");
        const chunkId = `${sourceId}-chunk-0`;
        const sourceType: SourceDocument["sourceType"] = candidate.sourceType.includes("email")
          ? "email"
          : candidate.sourceType.includes("pdf")
            ? "pdf"
            : candidate.sourceType.includes("csv") || candidate.sourceType.includes("sheet") || candidate.sourceType.includes("row")
              ? "csv"
              : candidate.sourceType.includes("doc")
                ? "docx"
                : candidate.sourceType.includes("web")
                  ? "web"
                  : "txt";
        nextSources.push({
          id: sourceId,
          sourceType,
          filename: `${candidate.toolkitSlug}:${candidate.title}`,
          title: candidate.title,
          propertyId: current.propertyId,
          createdAt: candidate.timestamp,
          ingestedAt: generatedAt,
          checksum: `integration-${candidate.id}-${candidate.confidence}`,
          metadata: {
            integrationToolkit: candidate.toolkitSlug,
            integrationMode: integrationSync.mode,
            candidateSourceId: candidate.id,
            promotedFromLiveMode: true
          },
          relevance: {
            status: candidate.confidence > 0.75 ? "included" : "needs_review",
            score: candidate.confidence,
            reason: candidate.summary,
            classifier: "rule"
          },
          text
        } satisfies SourceDocument);
        nextChunks.push({
          id: chunkId,
          sourceDocumentId: sourceId,
          chunkIndex: 0,
          text,
          charStart: 0,
          charEnd: text.length
        });
        for (const [factIndex, candidateFact] of candidate.facts.entries()) {
          const quoteStart = Math.max(0, text.indexOf(candidateFact.quote));
          const spanId = `${sourceId}-span-${factIndex}`;
          nextSpans.push({
            id: spanId,
            sourceDocumentId: sourceId,
            chunkId,
            charStart: quoteStart,
            charEnd: quoteStart + candidateFact.quote.length,
            quote: candidateFact.quote
          });
          const predicate = candidateFact.predicate.toLowerCase();
          nextFacts.push({
            id: `integration_fact_${sourceIndex}_${factIndex}_${Date.now()}`,
            propertyId: current.propertyId,
            factType: predicate.includes("status")
              ? "status"
              : predicate.includes("approval") || predicate.includes("approved")
                ? "approval"
                : predicate.includes("vendor")
                  ? "vendor_assignment"
                  : predicate.includes("contact")
                    ? "contact"
                    : predicate.includes("issue") || predicate.includes("tenant")
                      ? "tenant_issue"
                      : predicate.includes("threshold") || predicate.includes("amount")
                        ? "amount"
                        : "claim",
            predicate: candidateFact.predicate,
            objectValue: candidateFact.value,
            confidence: candidate.confidence,
            extractionModel: "context-surgeon-live-intake",
            sourceSpanIds: [spanId],
            supersedesFactIds: [],
            createdAt: generatedAt
          } satisfies Fact);
        }
      }

      if (!nextSources.length) return current;
      const promotedCurrent = {
        ...current.current,
        sources: [...nextSources, ...current.current.sources],
        chunks: [...nextChunks, ...current.current.chunks],
        spans: [...nextSpans, ...current.current.spans],
        facts: [...nextFacts, ...current.current.facts]
      };
      return {
        ...current,
        current: promotedCurrent,
        auditEvents: [
          {
            id: `integration_promoted_${Date.now()}`,
            workspaceId: current.workspaceId,
            eventType: "integrations.sources_promoted",
            label: "Live intake sources approved",
            detail: `${nextSources.length} live/manual intake sources were added to the compiler source ledger.`,
            metadata: { sourceCount: nextSources.length, factCount: nextFacts.length },
            createdAt: generatedAt
          },
          ...current.auditEvents
        ].slice(0, 12)
      };
    });
    setActiveView("sources");
  }

  useEffect(() => {
    let ignore = false;
    async function loadAuth() {
      try {
        const config = await loadFirebaseAuthConfig();
        if (ignore) return;
        setAuthConfig(config);
        const stored = readStoredSession();
        if (stored && config.configured) {
          const refreshed = await refreshSession(config, stored);
          if (!ignore) setAuthSession(refreshed);
        }
      } catch (error) {
        storeSession(null);
        if (!ignore) setAuthError(error instanceof Error ? error.message : "Auth failed.");
      } finally {
        if (!ignore) setAuthLoading(false);
      }
    }
    loadAuth();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (authLoading || !authSession) return;
    let ignore = false;
    fetch("/api/workspace")
      .then((response) => response.json() as Promise<ProductSnapshot>)
      .then((next) => {
        if (!ignore) setSnapshot(next);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [authLoading, authSession]);

  useEffect(() => {
    refreshProviderStatuses().catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshIntegrations().catch(() => undefined);
  }, [authSession?.uid]);

  async function validSession() {
    if (!authSession) throw new Error("Sign in before operating the workspace.");
    const refreshed = await refreshSession(authConfig, authSession);
    setAuthSession(refreshed);
    return refreshed;
  }

  async function runAction(action: WorkspaceAction) {
    setLoadingAction(action);
    try {
      if (!authSession) {
        const nextPhase: Record<WorkspaceAction, ProductPhase> = {
          compile: "compiled",
          "human-note": "human_edited",
          "ingest-email": "patch_proposed",
          "apply-patch": "patch_applied"
        };
        setSnapshot((current) => makeLocalSnapshot(buildDemoWorkflow(), nextPhase[action], current.auditEvents));
        return;
      }
      const session = await validSession();
      const response = await fetch("/api/workspace/action", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.idToken}`
        },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error(await response.text());
      setSnapshot((await response.json()) as ProductSnapshot);
    } finally {
      setLoadingAction(undefined);
    }
  }

  async function resetWorkspace() {
    setLoadingAction("reset");
    try {
      if (!authSession) {
        setSnapshot(makeFallbackSnapshot());
        setActiveView("sources");
        return;
      }
      const session = await validSession();
      const response = await fetch("/api/workspace/reset", {
        method: "POST",
        headers: { authorization: `Bearer ${session.idToken}` }
      });
      if (!response.ok) throw new Error(await response.text());
      setSnapshot((await response.json()) as ProductSnapshot);
      setActiveView("sources");
    } finally {
      setLoadingAction(undefined);
    }
  }

  function scrollDemoIntoView() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runWinningDemo() {
    if (guidedDemoRunning) return;
    setGuidedDemoRunning(true);
    try {
      await resetWorkspace();
      scrollDemoIntoView();
      for (const step of guidedDemoSteps) {
        setGuidedDemoStep(step.id);
        setActiveView(step.view);
        scrollDemoIntoView();
        await sleep(step.action ? 650 : 850);
        if (step.action) {
          await runAction(step.action);
          setActiveView(step.view);
          scrollDemoIntoView();
          await sleep(step.action === "apply-patch" ? 900 : 650);
        }
      }
      setActiveView("agent");
    } finally {
      setGuidedDemoStep(undefined);
      setGuidedDemoRunning(false);
    }
  }

  async function exportWorkspace() {
    setLoadingAction("reset");
    try {
      if (!authSession) {
        const blob = new Blob([JSON.stringify(buildClientExport(snapshot), null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "context-surgeon-qontext-export-preview.json";
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }
      const session = await validSession();
      const response = await fetch("/api/workspace/export", {
        headers: { authorization: `Bearer ${session.idToken}` }
      });
      if (!response.ok) throw new Error(await response.text());
      const blob = new Blob([JSON.stringify(await response.json(), null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "context-surgeon-qontext-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoadingAction(undefined);
    }
  }

  function handleSignOut() {
    storeSession(null);
    setAuthSession(null);
  }

  function openDemo() {
    setActiveView("sources");
    scrollDemoIntoView();
  }

  return (
    <main className="bg-bg text-fg">
      <Hero onOpenDemo={openDemo} />
      <ProofSection />
      <QontextProofSection />
      <section className="border-b border-border bg-bg py-6">
        <div className="mx-auto max-w-[1500px] px-6">
          <AuthPanel
            session={authSession}
            loading={authLoading}
            error={authError}
            onSignOut={handleSignOut}
          />
        </div>
      </section>
      <WorkbenchSection
        snapshot={snapshot}
        workflow={workflow}
        activeView={activeView}
        setActiveView={setActiveView}
        runAction={runAction}
        resetWorkspace={resetWorkspace}
        exportWorkspace={exportWorkspace}
        providerStatuses={providerStatuses}
        refreshProviders={refreshProviderStatuses}
        providersLoading={providersLoading}
        integrationState={integrationState}
        integrationSync={integrationSync}
        integrationsLoading={integrationsLoading}
        syncLoading={syncLoading}
        refreshIntegrations={refreshIntegrations}
        connectIntegration={connectIntegration}
        syncIntegrations={syncIntegrations}
        onUploadFiles={uploadManualFiles}
        saveIngestionRule={saveIngestionRule}
        promoteIntegrationSync={promoteIntegrationSync}
        session={authSession}
        loadingAction={loadingAction}
        runWinningDemo={runWinningDemo}
        guidedDemoRunning={guidedDemoRunning}
        guidedDemoStep={guidedDemoStep}
      />
      <ArchitectureSection />
      <footer className="border-t border-border bg-code px-6 py-14 text-cream">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <p className="text-2xl font-semibold">Context Surgeon</p>
            <p className="mt-2 text-sm text-cream/60">
              Fact-patched property context for reliable agents.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Tracks</p>
              <div className="mt-3 flex gap-2">
            <Badge tone="neutral">
              <Workflow className="mr-1 size-3" />
              Buena
            </Badge>
            <Badge tone="neutral">
              <Layers3 className="mr-1 size-3" />
              Qontext
            </Badge>
            <Badge tone="neutral">
              <ShieldCheck className="mr-1 size-3" />
              Aikido-ready
            </Badge>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Actions</p>
              <div className="mt-3 grid gap-2 text-sm text-cream/64">
                <a href="/login" className="hover:text-cream">Sign in</a>
                <a href="/" className="hover:text-cream">Landing</a>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Proof</p>
              <div className="mt-3 grid gap-2 text-sm text-cream/64">
                <a href="/api/health" className="hover:text-cream">Health</a>
                <a href="/api/qontext/proof" className="hover:text-cream">Qontext JSON</a>
              </div>
            </div>
          </div>
          </div>
          <p className="mt-12 max-w-4xl text-5xl font-semibold leading-none tracking-normal max-md:text-3xl">
            Built by the Context Surgeon team for Big Hack Berlin.
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-cream/45">
            live build 2026-04-25.5
          </p>
        </div>
      </footer>
    </main>
  );
}
