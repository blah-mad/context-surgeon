import type { PatchProposal, VfsFile } from "./types";
import { nowIso, stableHash } from "./utils";

interface Block {
  section: string;
  hash: string;
  start: number;
  end: number;
  fullText: string;
  body: string;
}

const BLOCK_RE =
  /<!-- cs:generated:start section=([a-zA-Z0-9_-]+) hash=([a-f0-9]+) -->\n([\s\S]*?)\n<!-- cs:generated:end section=\1 -->/g;

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  for (const match of content.matchAll(BLOCK_RE)) {
    blocks.push({
      section: match[1],
      hash: match[2],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      fullText: match[0],
      body: match[3]
    });
  }
  return blocks;
}

function lineDiff(before: string, after: string, path: string): string {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  const lines = [`--- a${path}`, `+++ b${path}`, "@@ -1 +1 @@"];

  for (let index = 0; index < max; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];
    if (left === right) {
      if (left !== undefined) lines.push(` ${left}`);
      continue;
    }
    if (left !== undefined) lines.push(`-${left}`);
    if (right !== undefined) lines.push(`+${right}`);
  }

  return lines.join("\n");
}

export function injectHumanNote(content: string, note: string): string {
  return content.replace(
    "Add property-manager notes here. This section is never overwritten by Context Surgeon.",
    note
  );
}

export function proposeFactPatch(
  currentFile: VfsFile,
  regeneratedFile: VfsFile,
  changedFactIds: string[],
  reason = "Incoming source changed property context. Context Surgeon patched only generated sections."
): PatchProposal {
  const currentBlocks = parseBlocks(currentFile.content);
  const nextBlocks = parseBlocks(regeneratedFile.content);
  let proposedContent = currentFile.content;
  let hasGeneratedConflict = false;

  for (const nextBlock of nextBlocks) {
    const currentBlock = currentBlocks.find((block) => block.section === nextBlock.section);
    if (!currentBlock) continue;
    const currentBodyHash = stableHash(currentBlock.body);
    if (currentBodyHash !== currentBlock.hash) {
      hasGeneratedConflict = true;
      continue;
    }
    proposedContent = proposedContent.replace(currentBlock.fullText, nextBlock.fullText);
  }

  return {
    id: `patch_${stableHash(currentFile.path + regeneratedFile.generatedHash)}`,
    propertyId: currentFile.propertyId,
    fileId: currentFile.id,
    path: currentFile.path,
    baseHash: currentFile.generatedHash,
    currentHash: stableHash(currentFile.content),
    proposedContent,
    unifiedDiff: lineDiff(currentFile.content, proposedContent, currentFile.path),
    patchStatus: hasGeneratedConflict ? "conflict" : "pending",
    preservesHumanEdits: proposedContent.includes("Manual note:"),
    changedFactIds,
    reason,
    createdAt: nowIso()
  };
}

export function applyPatch(file: VfsFile, proposal: PatchProposal): VfsFile {
  return {
    ...file,
    content: proposal.proposedContent,
    generatedHash: stableHash(proposal.proposedContent),
    lastGeneratedAt: nowIso(),
    sourceFactIds: Array.from(new Set([...file.sourceFactIds, ...proposal.changedFactIds]))
  };
}

export function markPatchApplied(proposal: PatchProposal): PatchProposal {
  return { ...proposal, patchStatus: "applied" };
}

