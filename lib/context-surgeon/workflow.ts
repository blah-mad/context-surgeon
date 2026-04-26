import { PROPERTY_ID, PROPERTY_NAME } from "./demo-data";
import { detectConflicts } from "./conflicts";
import { runContextCheck } from "./context-check";
import { extractFacts } from "./extraction";
import { chunkSources, loadDemoProperty, loadIncomingSource, normalizeSources } from "./ingestion";
import { applyPatch, injectHumanNote, markPatchApplied, proposeFactPatch } from "./patcher";
import type { ContextCheckResult, ContextState, PatchProposal, VfsFile } from "./types";
import { generateVfs } from "./vfs";

export interface DemoWorkflow {
  initial: ContextState;
  withHumanEdit: ContextState;
  incoming: ContextState;
  applied: ContextState;
  beforeCheck: ContextCheckResult;
  afterCheck: ContextCheckResult;
}

function buildState(includeIncoming: boolean): ContextState {
  const rawSources = loadDemoProperty(includeIncoming);
  const sources = normalizeSources(rawSources);
  const chunks = chunkSources(sources);
  const { entities, facts, spans } = extractFacts(sources, chunks, rawSources);
  const conflicts = detectConflicts(facts, entities);
  const files = generateVfs(PROPERTY_ID, sources, entities, facts, spans, conflicts);
  return {
    propertyId: PROPERTY_ID,
    propertyName: PROPERTY_NAME,
    sources,
    chunks,
    spans,
    entities,
    facts,
    conflicts,
    files
  };
}

function contextFile(files: VfsFile[]): VfsFile {
  const file = files.find((item) => item.path.endsWith("/context.md"));
  if (!file) throw new Error("context.md missing from VFS.");
  return file;
}

export function buildDemoWorkflow(): DemoWorkflow {
  const initial = buildState(false);
  const beforeCheck = runContextCheck(initial.facts, initial.conflicts);

  const editedContextFile = {
    ...contextFile(initial.files),
    content: injectHumanNote(
      contextFile(initial.files).content,
      "Manual note: Tenant prefers email updates before 18:00. Preserve this operational note during regeneration."
    )
  };
  const withHumanEdit: ContextState = {
    ...initial,
    files: initial.files.map((file) => (file.id === editedContextFile.id ? editedContextFile : file))
  };

  const incoming = buildState(true);
  const incomingContextFile = contextFile(incoming.files);
  const patch = proposeFactPatch(
    editedContextFile,
    incomingContextFile,
    loadIncomingSource().facts.map((fact) => fact.id)
  );
  const incomingWithPatch: ContextState = { ...incoming, patch };
  const appliedContextFile = applyPatch(editedContextFile, patch);
  const appliedPatch = markPatchApplied(patch);
  const applied: ContextState = {
    ...incomingWithPatch,
    files: incoming.files.map((file) =>
      file.path.endsWith("/context.md") ? appliedContextFile : file
    ),
    patch: appliedPatch
  };
  const afterCheck = runContextCheck(applied.facts, applied.conflicts);

  return {
    initial,
    withHumanEdit,
    incoming: incomingWithPatch,
    applied,
    beforeCheck,
    afterCheck
  };
}

export type { PatchProposal };

