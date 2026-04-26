import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildDemoWorkflow, type DemoWorkflow } from "../workflow";
import type { ContextCheckResult, ContextState, PatchProposal } from "../types";

type D1Result<T = unknown> = { results?: T[] };

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

interface CloudflareEnv {
  CONTEXT_SURGEON_DB?: D1DatabaseLike;
}

export type ProductPhase =
  | "empty"
  | "loaded"
  | "compiled"
  | "human_edited"
  | "patch_proposed"
  | "patch_applied";

export interface AuditEvent {
  id: string;
  workspaceId: string;
  eventType: string;
  label: string;
  detail: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface ProductSnapshot {
  workspaceId: string;
  phase: ProductPhase;
  propertyId: string;
  propertyName: string;
  providerMode: "mock" | "live";
  current: ContextState;
  initial: ContextState;
  withHumanEdit: ContextState;
  incoming: ContextState;
  applied: ContextState;
  beforeCheck: ContextCheckResult;
  afterCheck: ContextCheckResult;
  patch?: PatchProposal;
  activeFilePath: string;
  generatedAt: string;
  auditEvents: AuditEvent[];
}

const WORKSPACE_ID = "sonnenallee-44-live";
const memory = new Map<string, ProductSnapshot>();
let warnedD1Fallback = false;

function now() {
  return new Date().toISOString();
}

function makeEvent(
  eventType: string,
  label: string,
  detail: string,
  metadata: Record<string, string | number | boolean> = {}
): AuditEvent {
  return {
    id: `${eventType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    eventType,
    label,
    detail,
    metadata,
    createdAt: now()
  };
}

function snapshotFromWorkflow(workflow: DemoWorkflow, phase: ProductPhase): ProductSnapshot {
  const current =
    phase === "loaded" || phase === "compiled"
      ? workflow.initial
      : phase === "human_edited"
        ? workflow.withHumanEdit
        : phase === "patch_proposed"
          ? workflow.incoming
          : workflow.applied;

  return {
    workspaceId: WORKSPACE_ID,
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
    patch: phase === "patch_proposed" ? workflow.incoming.patch : workflow.applied.patch,
    activeFilePath: `/properties/${workflow.initial.propertyId}/context.md`,
    generatedAt: now(),
    auditEvents: [
      makeEvent(
        "workspace.loaded",
        "Sonnenallee 44 loaded",
        "Demo property archive is ready for compilation.",
        { sources: workflow.initial.sources.length }
      )
    ]
  };
}

function snapshotNeedsUpgrade(snapshot: ProductSnapshot) {
  return !snapshot.current.sources.every((source) => source.relevance);
}

function upgradeSnapshot(snapshot: ProductSnapshot) {
  if (!snapshotNeedsUpgrade(snapshot)) return snapshot;
  const fresh = createFreshSnapshot(snapshot.phase === "empty" ? "loaded" : snapshot.phase);
  const event = makeEvent(
    "workspace.upgraded",
    "Workspace snapshot upgraded",
    "Persisted demo state was refreshed to include source signal/noise classification.",
    { schema: "source_relevance_v1" }
  );
  return {
    ...fresh,
    auditEvents: [event, ...snapshot.auditEvents].slice(0, 12),
    generatedAt: now()
  };
}

function getDb(): D1DatabaseLike | undefined {
  try {
    return (getCloudflareContext().env as CloudflareEnv).CONTEXT_SURGEON_DB;
  } catch {
    return undefined;
  }
}

function warnD1Fallback(error: unknown) {
  if (warnedD1Fallback) return;
  warnedD1Fallback = true;
  console.warn(
    "Context Surgeon D1 persistence is unavailable; using in-memory workspace state for this runtime.",
    error instanceof Error ? error.message : error
  );
}

async function readSnapshotFromD1(db: D1DatabaseLike): Promise<ProductSnapshot | null> {
  const row = await db
    .prepare("SELECT payload FROM workspace_snapshots WHERE id = ?")
    .bind(WORKSPACE_ID)
    .first<{ payload: string }>();
  return row?.payload ? (JSON.parse(row.payload) as ProductSnapshot) : null;
}

async function writeSnapshotToD1(db: D1DatabaseLike, snapshot: ProductSnapshot) {
  await db
    .prepare(
      `INSERT INTO workspace_snapshots (id, payload, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP`
    )
    .bind(snapshot.workspaceId, JSON.stringify(snapshot))
    .run();
}

async function appendAuditToD1(db: D1DatabaseLike, event: AuditEvent) {
  await db
    .prepare(
      `INSERT INTO audit_events (id, workspace_id, event_type, label, detail, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      event.id,
      event.workspaceId,
      event.eventType,
      event.label,
      event.detail,
      JSON.stringify(event.metadata),
      event.createdAt
    )
    .run();
}

export function createFreshSnapshot(phase: ProductPhase = "loaded") {
  return snapshotFromWorkflow(buildDemoWorkflow(), phase);
}

function getMemorySnapshot(phase: ProductPhase = "loaded") {
  const persisted = memory.get(WORKSPACE_ID);
  if (persisted) {
    const upgraded = upgradeSnapshot(persisted);
    memory.set(WORKSPACE_ID, upgraded);
    return upgraded;
  }
  const fresh = createFreshSnapshot(phase);
  memory.set(WORKSPACE_ID, fresh);
  return fresh;
}

async function tryAppendAuditToD1(db: D1DatabaseLike | undefined, event: AuditEvent) {
  if (!db) return;
  try {
    await appendAuditToD1(db, event);
  } catch (error) {
    warnD1Fallback(error);
  }
}

export async function getSnapshot() {
  const db = getDb();
  if (db) {
    try {
      const persisted = await readSnapshotFromD1(db);
      if (persisted) {
        const upgraded = upgradeSnapshot(persisted);
        if (upgraded !== persisted) {
          await writeSnapshotToD1(db, upgraded);
          await appendAuditToD1(db, upgraded.auditEvents[0]);
        }
        return upgraded;
      }
      const fresh = createFreshSnapshot("loaded");
      await writeSnapshotToD1(db, fresh);
      await appendAuditToD1(db, fresh.auditEvents[0]);
      return fresh;
    } catch (error) {
      warnD1Fallback(error);
      return getMemorySnapshot("loaded");
    }
  }

  return getMemorySnapshot("loaded");
}

export async function saveSnapshot(snapshot: ProductSnapshot) {
  const db = getDb();
  if (db) {
    try {
      await writeSnapshotToD1(db, snapshot);
      return snapshot;
    } catch (error) {
      warnD1Fallback(error);
    }
  }
  memory.set(snapshot.workspaceId, snapshot);
  return snapshot;
}

export async function resetSnapshot() {
  const fresh = createFreshSnapshot("loaded");
  await saveSnapshot(fresh);
  await tryAppendAuditToD1(getDb(), fresh.auditEvents[0]);
  return fresh;
}

export async function transitionSnapshot(action: string) {
  const current = await getSnapshot();
  const workflow = buildDemoWorkflow();
  let next = current;
  let event: AuditEvent;

  if (action === "compile") {
    next = {
      ...current,
      phase: "compiled",
      current: workflow.initial,
      patch: undefined,
      generatedAt: now()
    };
    event = makeEvent(
      "context.compiled",
      "Context compiled",
      "Sources became facts, conflicts, and a property VFS.",
      {
        facts: workflow.initial.facts.length,
        conflicts: workflow.initial.conflicts.length,
        files: workflow.initial.files.length
      }
    );
  } else if (action === "human-note") {
    next = {
      ...current,
      phase: "human_edited",
      current: workflow.withHumanEdit,
      patch: undefined,
      generatedAt: now()
    };
    event = makeEvent(
      "human.note_preserved",
      "Human note inserted",
      "A manual tenant-communication note was added outside generated blocks.",
      { preserved: true }
    );
  } else if (action === "ingest-email") {
    next = {
      ...current,
      phase: "patch_proposed",
      current: workflow.incoming,
      patch: workflow.incoming.patch,
      generatedAt: now()
    };
    event = makeEvent(
      "patch.proposed",
      "Fact Patch proposed",
      "New owner email changed roof repair status, vendor assignment, and approval threshold.",
      {
        changedFacts: workflow.incoming.patch?.changedFactIds.length ?? 0,
        preservesHumanEdits: workflow.incoming.patch?.preservesHumanEdits ?? false
      }
    );
  } else if (action === "apply-patch") {
    next = {
      ...current,
      phase: "patch_applied",
      current: workflow.applied,
      patch: workflow.applied.patch,
      generatedAt: now()
    };
    event = makeEvent(
      "patch.applied",
      "Fact Patch applied",
      "Context now reflects the latest owner instruction while keeping the human note.",
      {
        healthBefore: workflow.beforeCheck.score,
        healthAfter: workflow.afterCheck.score,
        preservedHumanEdits: true
      }
    );
  } else {
    throw new Error(`Unknown workspace action: ${action}`);
  }

  next = { ...next, auditEvents: [event, ...current.auditEvents].slice(0, 12) };
  await saveSnapshot(next);
  await tryAppendAuditToD1(getDb(), event);
  return next;
}
