"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCode2,
  GitCompare,
  Mail,
  Microscope,
  Moon,
  Network,
  Play,
  SearchCheck,
  ShieldCheck,
  Sun,
  UploadCloud,
  Workflow,
  X
} from "lucide-react";
import { qontextDatasetProof } from "@/lib/context-surgeon/qontext-proof";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem("context-surgeon-theme", next);
        setTheme(next);
      }}
      className="surface-fill inline-flex size-10 items-center justify-center rounded-xl border border-border text-muted transition duration-200 hover:border-primary/45 hover:text-fg"
    >
      <Icon className="size-4" />
    </button>
  );
}

function BrandMark() {
  return (
    <Link href="/" className="group flex items-center gap-3 rounded-xl">
      <span className="flex size-10 items-center justify-center rounded-xl bg-code text-primary shadow-sm transition duration-200 group-hover:scale-[1.03]">
        <Microscope className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-sm font-semibold leading-5 text-fg">
          Context Surgeon
        </span>
        <span className="block text-xs leading-4 text-muted max-[420px]:hidden">
          trusted context for agents
        </span>
      </span>
    </Link>
  );
}

function PrimaryButton({
  href,
  children,
  newTab = false
}: {
  href: string;
  children: ReactNode;
  newTab?: boolean;
}) {
  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-primary/30"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
  newTab = false
}: {
  href: string;
  children: ReactNode;
  newTab?: boolean;
}) {
  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className="surface-fill inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-fg transition duration-200 hover:-translate-y-0.5 hover:border-primary/45"
    >
      {children}
    </Link>
  );
}

function SiteNav() {
  const links = [
    ["Product", "#product"],
    ["Proof", "#proof"],
    ["Live mode", "#live-mode"],
    ["API", "#api"],
    ["Trust", "#trust"]
  ];

  return (
    <header className="bg-fill-glass fixed inset-x-0 top-0 z-50 border-b border-border/65 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
        <BrandMark />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition duration-200 hover:bg-[var(--surface)] hover:text-fg"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted transition duration-200 hover:bg-[var(--surface)] hover:text-fg sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/demo"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-lg shadow-primary/20 transition duration-200 hover:-translate-y-0.5"
          >
            <Play className="size-4" />
            <span className="hidden min-[430px]:inline">Open demo</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function ContextField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-35" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(to_bottom,oklch(from_var(--primary)_l_c_h_/_0.13),transparent)]" />
      {[
        "left-[9%] top-[18%] h-16",
        "left-[18%] top-[64%] h-10",
        "right-[13%] top-[24%] h-14",
        "right-[24%] top-[70%] h-12",
        "left-[47%] top-[38%] h-9"
      ].map((position) => (
        <span
          key={position}
          className={cx(
            "landing-particle absolute w-px rounded-full bg-primary/40",
            position
          )}
        />
      ))}
    </div>
  );
}

function ProductPreview() {
  const [activeStage, setActiveStage] = useState("Fact ledger");
  const stages = [
    {
      label: "Sources",
      detail: "Email, files, CRM, tickets",
      icon: UploadCloud,
      title: "Messy evidence enters one intake queue",
      left: [
        ["Tenant email", "roof leak still active"],
        ["Vendor quote", "EUR 4,800 pending"]
      ],
      right: [
        ["included", "tenant complaint"],
        ["needs review", "old handover note"],
        ["ignored", "vendor newsletter"]
      ]
    },
    {
      label: "Fact ledger",
      detail: "Typed facts with source spans",
      icon: Database,
      title: "Claims become source-grounded facts",
      left: [
        ["Tenant email", "roof leak still active"],
        ["Old log", "roof issue closed"]
      ],
      right: [
        ["fact_roof_open", "tenant quote cited"],
        ["conflict", "closed vs open"],
        ["span", "line-level evidence"]
      ]
    },
    {
      label: "Fact Patch",
      detail: "Only stale context changes",
      icon: GitCompare,
      title: "Changed truth becomes a surgical patch",
      left: [
        ["Owner email", "TempSeal approved"],
        ["Old quote", "do not proceed"]
      ],
      right: [
        ["+ emergency sealing approved", "cited"],
        ["- quote pending", "patched"],
        ["= tenant prefers email", "preserved"]
      ]
    }
  ];
  const active = stages.find((stage) => stage.label === activeStage) ?? stages[1];

  return (
    <div className="surface-fill landing-console relative overflow-hidden rounded-[28px] border border-border p-4 shadow-2xl shadow-earth/10">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Workflow className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Sonnenallee 44 context run</p>
            <p className="text-xs text-muted">public sample data · ready to inspect</p>
          </div>
        </div>
        <span className="rounded-full border border-[oklch(0.55_0.14_150_/_0.32)] bg-[oklch(0.55_0.14_150_/_0.10)] px-3 py-1 text-xs font-semibold text-[oklch(0.42_0.13_150)]">
          health +38
        </span>
      </div>

      <div className="grid gap-3 py-4 sm:grid-cols-3">
        {stages.map(({ icon: Icon, label, detail }) => (
          <button
            key={label}
            type="button"
            onMouseEnter={() => setActiveStage(label)}
            onFocus={() => setActiveStage(label)}
            onClick={() => setActiveStage(label)}
            className={cx(
              "rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/35",
              activeStage === label
                ? "border-primary/35 bg-primary/10"
                : "border-border bg-fill-soft"
            )}
          >
            <Icon className="size-4 text-primary" />
            <p className="mt-3 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-fill-soft rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted">{active.title}</p>
          <div className="mt-4 space-y-3">
            {active.left.map(([source, claim]) => (
              <div key={source} className="surface-fill rounded-xl border border-border p-3">
                <p className="text-xs text-muted">{source}</p>
                <p className="mt-1 text-sm font-semibold">{claim}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-code p-4 text-cream">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-cream/62">judge-visible proof</p>
            <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs text-primary">
              {active.label}
            </span>
          </div>
          <div className="mt-4 space-y-2 font-mono text-xs leading-6">
            {active.right.map(([claim, status], index) => (
              <p
                key={claim}
                className={cx(
                  "flex justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2",
                  index === 0 ? "text-[oklch(0.72_0.13_150)]" : index === 1 ? "text-[oklch(0.74_0.15_45)]" : "text-cream/70"
                )}
              >
                <span>{claim}</span>
                <span className="text-primary">{status}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type GraphMode = "repository" | "provenance" | "updates";

const graphModeCopy: Record<GraphMode, { label: string; kicker: string; title: string; body: string }> = {
  repository: {
    label: "Repository",
    kicker: "VFS + graph",
    title: "A company memory agents can browse.",
    body: "Raw domains compile into files and graph entities instead of a single opaque prompt."
  },
  provenance: {
    label: "Provenance",
    kicker: "fact lineage",
    title: "Every fact traces back to evidence.",
    body: "The graph preserves record, file, and quote/span references so humans can validate claims."
  },
  updates: {
    label: "Updates",
    kicker: "Fact Patch",
    title: "New evidence updates the right nodes.",
    body: "Changed records produce minimal patches that supersede stale facts without destructive regeneration."
  }
};

function GraphCanvas({ mode }: { mode: GraphMode }) {
  const nodes = [
    {
      id: "raw",
      label: "Raw data",
      sub: "12 domains",
      position: "left-[7%] top-[22%]",
      tone: "muted"
    },
    {
      id: "facts",
      label: "Fact ledger",
      sub: "source spans",
      position: "left-[38%] top-[12%]",
      tone: mode === "provenance" ? "primary" : "default"
    },
    {
      id: "vfs",
      label: "Virtual files",
      sub: "7 generated files",
      position: "right-[8%] top-[28%]",
      tone: mode === "repository" ? "primary" : "default"
    },
    {
      id: "review",
      label: "Human review",
      sub: "ambiguity only",
      position: "left-[18%] bottom-[18%]",
      tone: "default"
    },
    {
      id: "patch",
      label: "Fact Patch",
      sub: "supersedes stale facts",
      position: "right-[18%] bottom-[14%]",
      tone: mode === "updates" ? "primary" : "default"
    }
  ];

  return (
    <div className="bg-fill relative min-h-[430px] overflow-hidden rounded-[28px] border border-border p-4 max-sm:min-h-0">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <svg className="absolute inset-0 size-full" viewBox="0 0 800 430" aria-hidden="true">
        {[
          ["155", "120", "360", "95"],
          ["420", "115", "650", "145"],
          ["380", "150", "250", "330"],
          ["430", "150", "560", "330"],
          ["260", "345", "548", "345"]
        ].map(([x1, y1, x2, y2], index) => (
          <path
            key={`${x1}-${y1}`}
            d={`M ${x1} ${y1} C ${(Number(x1) + Number(x2)) / 2} ${Number(y1) - 34 + index * 8}, ${(Number(x1) + Number(x2)) / 2} ${Number(y2) + 24 - index * 4}, ${x2} ${y2}`}
            fill="none"
            stroke="oklch(from var(--primary) l c h / 0.34)"
            strokeWidth={mode === "provenance" && index < 2 ? 2.4 : 1.3}
            strokeDasharray={mode === "updates" && index > 2 ? "6 7" : "0"}
          />
        ))}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          className={cx(
            "absolute w-[170px] rounded-2xl border p-4 shadow-lg backdrop-blur-xl transition duration-200 max-sm:static max-sm:mb-3 max-sm:w-full",
            node.position,
            node.tone === "primary"
              ? "border-primary/45 bg-primary/10"
              : node.tone === "muted"
                ? "border-border surface-fill-soft"
                : "border-border surface-fill-soft"
          )}
        >
          <p className="text-sm font-semibold">{node.label}</p>
          <p className="mt-1 text-xs text-muted">{node.sub}</p>
        </div>
      ))}

      <div className="surface-fill-soft absolute bottom-4 left-4 right-4 rounded-2xl border border-border p-4 backdrop-blur-xl max-sm:static max-sm:mt-3">
        <p className="text-xs font-semibold uppercase text-primary">
          {graphModeCopy[mode].kicker}
        </p>
        <p className="mt-2 text-lg font-semibold">{graphModeCopy[mode].title}</p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{graphModeCopy[mode].body}</p>
      </div>
    </div>
  );
}

function GraphModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<GraphMode>("repository");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-code/72 p-4 backdrop-blur-xl">
      <div className="surface-fill mx-auto my-8 max-w-6xl rounded-[32px] border border-border p-4 shadow-2xl shadow-black/35 max-sm:my-4 max-sm:rounded-[28px]">
        <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4 pr-14">
          <div>
            <p className="text-sm font-semibold text-primary">Inazuma.co graph view</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-fg">
              How raw company state becomes inspectable context.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              A judge can inspect the VFS, fact graph, source lineage, and patch mechanism without
              reading every generated file.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close graph view"
            onClick={onClose}
            className="bg-fill absolute right-0 top-0 inline-flex size-10 items-center justify-center rounded-xl border border-border text-muted transition hover:border-primary/40 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 py-4 lg:grid-cols-[220px_1fr]">
          <div className="grid gap-2 sm:grid-cols-3 lg:block lg:space-y-2">
            {(Object.keys(graphModeCopy) as GraphMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={cx(
                  "w-full rounded-2xl border p-4 text-left transition duration-200",
                  mode === item
                    ? "border-primary/45 bg-primary/10"
                    : "border-border bg-fill hover:border-primary/35"
                )}
              >
                <p className="text-sm font-semibold">{graphModeCopy[item].label}</p>
                <p className="mt-1 text-xs leading-5 text-muted max-sm:hidden">{graphModeCopy[item].body}</p>
              </button>
            ))}
          </div>

          <GraphCanvas mode={mode} />
        </div>

        <div className="grid gap-3 border-t border-border pt-4 md:grid-cols-3">
          {[
            ["Entity types", qontextDatasetProof.graphSummary.entityTypes.join(", ")],
            ["Edge types", qontextDatasetProof.graphSummary.edgeTypes.join(", ")],
            ["Provenance", qontextDatasetProof.graphSummary.provenanceGranularity]
          ].map(([label, body]) => (
            <div key={label} className="bg-fill rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold uppercase text-primary">{label}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-fill relative isolate overflow-hidden border-b border-border pt-[72px]">
      <ContextField />
      <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
        <div>
          <p className="surface-fill max-w-max rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted">
            Built for Big Berlin Hack
          </p>
          <h1 className="mt-6 max-w-4xl text-[2.85rem] font-semibold leading-[1.04] text-fg sm:text-6xl lg:text-7xl">
            Context your agents can trust before they act.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
            Context Surgeon turns scattered operational knowledge into a source-grounded context
            base, then keeps it current as facts change.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton href="/demo">
              View sample demo
              <ArrowRight className="size-4" />
            </PrimaryButton>
            <SecondaryButton href="/login">
              Try with live data
              <Network className="size-4 text-primary" />
            </SecondaryButton>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["153,997", "sample records"],
              ["7", "VFS files"],
              ["Fact Patch", "not regenerate"]
            ].map(([value, label]) => (
              <div key={label} className="min-w-0 border-l border-border pl-3 sm:pl-4">
                <p className="break-words text-xl font-semibold text-fg sm:text-2xl">{value}</p>
                <p className="mt-1 text-xs text-muted sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

function PartnerStrip() {
  return (
    <section className="surface-fill border-b border-border px-5 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-muted">Built with Big Berlin Hack partner technologies</p>
        <div className="flex flex-wrap gap-2">
          {["Google DeepMind / Gemini", "Tavily", "Pioneer / Fastino"].map((partner) => (
            <span
              key={partner}
              className="bg-fill rounded-full border border-border px-3 py-1.5 text-sm font-semibold"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection() {
  const rows = [
    {
      icon: Mail,
      title: "Connect the systems teams already use",
      body: "Email, CRM, files, tickets, collaboration, and manual uploads become reviewable source material before extraction."
    },
    {
      icon: SearchCheck,
      title: "Build a transparent context base",
      body: "The system produces typed facts, source quotes, conflicts, and a virtual file system that humans and agents can inspect."
    },
    {
      icon: GitCompare,
      title: "Update only what changed",
      body: "New evidence updates the right context without overwriting human judgment or trusted notes."
    }
  ];

  return (
    <section id="product" className="bg-fill border-b border-border px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Product</p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-fg sm:text-5xl">
              The missing operating layer between business systems and agents.
            </h2>
          </div>
          <div className="grid gap-3">
            {rows.map(({ icon: Icon, title, body }, index) => (
              <article
                key={title}
                className="surface-fill group grid gap-5 rounded-2xl border border-border p-5 transition duration-200 hover:border-primary/35 md:grid-cols-[auto_1fr_auto] md:items-center"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold">{title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{body}</p>
                </div>
                <span className="hidden text-sm font-semibold text-muted md:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofSection({ onOpenGraph }: { onOpenGraph: () => void }) {
  const totalRecords = qontextDatasetProof.rawInputs.reduce((sum, item) => sum + item.records, 0);
  const files = qontextDatasetProof.virtualFileSystem.slice(0, 5);

  return (
    <section id="proof" className="surface-fill border-b border-border px-5 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-primary">Sample-data proof</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight text-fg sm:text-5xl">
            The supplied Inazuma dataset becomes a context base, not a prompt dump.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            The demo compiles CRM, HR, enterprise mail, support, policies, IT tickets, GitHub,
            social data, and order artifacts into a virtual file system plus graph.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [totalRecords.toLocaleString("en-US"), "raw records"],
              [qontextDatasetProof.rawInputs.length.toString(), "domains"],
              [qontextDatasetProof.graphSummary.entityTypes.length.toString(), "entity types"]
            ].map(([value, label]) => (
              <div key={label} className="bg-fill rounded-2xl border border-border p-4">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenGraph}
            className="bg-fill mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-fg transition duration-200 hover:-translate-y-0.5 hover:border-primary/45"
          >
            Open graph view
            <Network className="size-4 text-primary" />
          </button>
        </div>

        <div className="bg-fill rounded-[28px] border border-border p-4 shadow-xl shadow-earth/10">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold">Generated repository</p>
              <p className="text-xs text-muted">source-linked VFS for humans and agents</p>
            </div>
            <FileCode2 className="size-5 text-primary" />
          </div>
          <div className="mt-4 grid gap-2">
            {files.map((file) => (
              <div
                key={file.path}
                className="surface-fill grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[0.8fr_1fr]"
              >
                <div>
                  <p className="font-mono text-xs text-primary">{file.path}</p>
                  <p className="mt-1 font-semibold">{file.title}</p>
                </div>
                <p className="text-sm leading-6 text-muted">{file.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveModeSection() {
  const categories = [
    ["Email", "Gmail, Outlook", Mail],
    ["CRM", "HubSpot, Salesforce", Database],
    ["Files", "Google Drive, OneDrive, Dropbox", FileCode2],
    ["Work streams", "Slack, Teams, Zendesk, Jira, Linear", Workflow]
  ] as const;

  return (
    <section id="live-mode" className="bg-fill border-b border-border px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Live mode</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-fg sm:text-5xl">
              Connect the systems teams already use.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-muted">
            Teams choose the sources that matter, review new evidence, and approve what becomes
            part of the shared context base.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {categories.map(([title, body, Icon]) => (
            <article key={title} className="surface-fill rounded-2xl border border-border p-5">
              <Icon className="size-5 text-primary" />
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApiSection() {
  const code = [
    "curl -X POST https://contextsurgeon.fnctn.io/api/live/upload \\",
    "  -H 'Authorization: Bearer <FIREBASE_ID_TOKEN>' \\",
    "  -F 'files=@owner-email.txt'"
  ];
  const endpoints = [
    ["GET", "/api/live/connectors", "Connector catalog"],
    ["POST", "/api/live/connect", "OAuth link"],
    ["POST", "/api/live/sync", "Sync systems"],
    ["POST", "/api/live/upload", "Upload evidence"],
    ["POST", "/api/live/rules", "Ingestion rule"]
  ];

  return (
    <section id="api" className="surface-fill border-b border-border px-5 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-primary">Live API</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-fg sm:text-5xl">
            Upload evidence without opening the UI.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            The API mirrors live mode: list connectors, create connect links, sync systems, upload
            evidence, and activate scoped ingestion rules.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Connect"],
              ["02", "Normalize"],
              ["03", "Patch"]
            ].map(([step, label]) => (
              <div key={step} className="bg-fill rounded-2xl border border-border p-4">
                <p className="font-mono text-xs text-primary">{step}</p>
                <p className="mt-2 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-code p-5 text-cream shadow-2xl shadow-earth/10">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                POST /api/live/upload
              </p>
              <p className="mt-1 text-sm text-cream/60">multipart file intake for live mode</p>
            </div>
            <span className="rounded-full bg-[oklch(0.55_0.14_150_/_0.16)] px-3 py-1 text-xs font-semibold text-[oklch(0.72_0.14_150)]">
              Firebase scoped
            </span>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-cream/78">
            <code>{code.join("\n")}</code>
          </pre>
          <div className="mt-4 grid gap-2">
            {endpoints.map(([method, path, label]) => (
              <div key={path} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[66px_1fr_auto] sm:items-center">
                <span className="font-mono text-xs text-primary">{method}</span>
                <span className="font-mono text-xs text-cream/72">{path}</span>
                <span className="text-xs font-semibold text-cream/58">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <UploadCloud className="size-4 text-primary" />
              <p className="mt-3 text-sm font-semibold">Input</p>
              <p className="mt-1 text-xs leading-5 text-cream/58">PDF, Word, text, CSV, JSON, Markdown, image, or exported evidence.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <FileCode2 className="size-4 text-primary" />
              <p className="mt-3 text-sm font-semibold">Output</p>
              <p className="mt-1 text-xs leading-5 text-cream/58">Candidate sources, confidence, fact hints, and next actions.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const points = [
    "Every fact carries a source quote.",
    "Conflicts appear before an agent acts.",
    "Human notes survive generated updates.",
    "The agent plan changes only after context changes."
  ];

  return (
    <section id="trust" className="surface-fill border-b border-border px-5 py-20 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="rounded-[28px] border border-border bg-code p-5 text-cream shadow-2xl shadow-earth/10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold">Agent pre-flight check</p>
              <span className="rounded-full bg-[oklch(0.55_0.14_150_/_0.16)] px-3 py-1 text-xs font-semibold text-[oklch(0.72_0.14_150)]">
                actionable
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {points.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                  <p className="text-sm leading-6 text-cream/76">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-primary">Trust model</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight text-fg sm:text-5xl">
            The product shows its work.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            Context Surgeon does not ask people to trust a black-box answer. It exposes source
            evidence, conflict explanations, patch diffs, preserved notes, and before/after plans.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton href="/demo">
              Inspect the demo
              <ChevronRight className="size-4" />
            </PrimaryButton>
            <SecondaryButton href="/login">
              Sign in
              <ShieldCheck className="size-4 text-primary" />
            </SecondaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-fill px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl border-y border-border py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Ready for the judges</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-fg sm:text-5xl">
              Give agents the context before giving them the keys.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryButton href="/demo">
              Open demo
              <Play className="size-4" />
            </PrimaryButton>
            <SecondaryButton href="/login">
              Try now
              <ArrowRight className="size-4 text-primary" />
            </SecondaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const columns = [
    {
      header: "Product",
      links: [
        ["Overview", "#product"],
        ["Sample proof", "#proof"],
        ["Live mode", "#live-mode"],
        ["API", "#api"]
      ]
    },
    {
      header: "Actions",
      links: [
        ["Open demo", "/demo"],
        ["Sign in", "/login"],
        ["Trust model", "#trust"]
      ]
    },
    {
      header: "Partners",
      links: [
        ["Gemini", "#"],
        ["Tavily", "#"],
        ["Pioneer / Fastino", "#"]
      ]
    }
  ];

  return (
    <footer className="bg-code px-5 py-14 text-cream sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.3fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Microscope className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Context Surgeon</p>
                <p className="text-sm text-cream/58">trusted context for agents</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-cream/62">
              Source-grounded context repositories for teams that want agents to act with evidence,
              not guesses.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.header}>
                <h3 className="text-sm font-semibold text-cream">{column.header}</h3>
                <div className="mt-4 grid gap-3">
                  {column.links.map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="text-sm text-cream/58 transition duration-200 hover:text-cream"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-3xl text-3xl font-semibold leading-tight text-cream sm:text-5xl">
            Made with love by humans on planet earth.
          </p>
          <p className="text-lg font-semibold text-primary">Big. Hack. Berlin!</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [graphOpen, setGraphOpen] = useState(false);

  return (
    <main className="bg-fill text-fg">
      <SiteNav />
      <Hero />
      <PartnerStrip />
      <ProductSection />
      <ProofSection onOpenGraph={() => setGraphOpen(true)} />
      <LiveModeSection />
      <ApiSection />
      <TrustSection />
      <FinalCta />
      <SiteFooter />
      <GraphModal open={graphOpen} onClose={() => setGraphOpen(false)} />
    </main>
  );
}
