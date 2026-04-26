import { describe, expect, it } from "vitest";
import { detectConflicts } from "@/lib/context-surgeon/conflicts";
import { extractFacts } from "@/lib/context-surgeon/extraction";
import { loadDemoProperty, normalizeSources, chunkSources } from "@/lib/context-surgeon/ingestion";
import { injectHumanNote, proposeFactPatch } from "@/lib/context-surgeon/patcher";
import { buildDemoWorkflow } from "@/lib/context-surgeon/workflow";

describe("Context Surgeon demo engine", () => {
  function fileContent(
    workflow: ReturnType<typeof buildDemoWorkflow>,
    pathSuffix: string,
    phase: "initial" | "incoming" | "applied" = "applied"
  ) {
    const file = workflow[phase].files.find((item) => item.path.endsWith(pathSuffix));
    expect(file).toBeTruthy();
    return file!.content;
  }

  it("maps source quotes back to source spans", () => {
    const rawSources = loadDemoProperty(false);
    const sources = normalizeSources(rawSources);
    const chunks = chunkSources(sources);
    const { facts, spans } = extractFacts(sources, chunks, rawSources);
    const roofFact = facts.find((fact) => fact.id === "fact_roof_status_open_tenant");
    const span = spans.find((item) => roofFact?.sourceSpanIds.includes(item.id));

    expect(span?.quote).toBe("The roof leak above unit 4B is still open.");
    expect(span?.charStart).toBeGreaterThanOrEqual(0);
  });

  it("flags roof status and invoice amount conflicts before incoming patch", () => {
    const rawSources = loadDemoProperty(false);
    const sources = normalizeSources(rawSources);
    const chunks = chunkSources(sources);
    const { entities, facts } = extractFacts(sources, chunks, rawSources);
    const conflicts = detectConflicts(facts, entities);

    expect(conflicts.some((conflict) => conflict.conflictType === "status_mismatch")).toBe(true);
    expect(conflicts.some((conflict) => conflict.conflictType === "value_mismatch")).toBe(true);
  });

  it("classifies source signal before extraction so irrelevant emails are ignored", () => {
    const rawSources = loadDemoProperty(false);
    const sources = normalizeSources(rawSources);
    const newsletter = sources.find((source) => source.id === "src_vendor_newsletter_noise");
    const tenantEmail = sources.find((source) => source.id === "src_tenant_roof_leak");

    expect(newsletter?.relevance.status).toBe("ignored");
    expect(newsletter?.relevance.score).toBeLessThan(0.2);
    expect(tenantEmail?.relevance.status).toBe("included");
  });

  it("keeps ignored source signal in provenance without creating facts or spans", () => {
    const rawSources = loadDemoProperty(false);
    const sources = normalizeSources(rawSources);
    const chunks = chunkSources(sources);
    const { facts, spans } = extractFacts(sources, chunks, rawSources);
    const sourceMap = JSON.parse(fileContent(buildDemoWorkflow(), "/source_map.json", "initial"));
    const ignoredSource = sourceMap.sources.find(
      (source: { id: string }) => source.id === "src_vendor_newsletter_noise"
    );

    expect(ignoredSource.relevance).toMatchObject({
      status: "ignored",
      classifier: "pioneer-fastino-mock"
    });
    expect(ignoredSource.text).toBeUndefined();
    expect(facts.some((fact) => fact.id.includes("newsletter"))).toBe(false);
    expect(spans.some((span) => span.sourceDocumentId === "src_vendor_newsletter_noise")).toBe(false);
  });

  it("keeps human notes outside generated blocks during a Fact Patch", () => {
    const workflow = buildDemoWorkflow();
    const original = workflow.initial.files.find((file) => file.path.endsWith("/context.md"));
    const regenerated = workflow.incoming.files.find((file) => file.path.endsWith("/context.md"));
    expect(original).toBeTruthy();
    expect(regenerated).toBeTruthy();

    const edited = {
      ...original!,
      content: injectHumanNote(original!.content, "Manual note: preserve this note.")
    };
    const patch = proposeFactPatch(edited, regenerated!, ["fact_tempseal_approved"]);

    expect(patch.proposedContent).toContain("Manual note: preserve this note.");
    expect(patch.proposedContent).toContain("TempSeal Notdienst approved for temporary emergency sealing today");
    expect(patch.patchStatus).toBe("pending");
    expect(patch.preservesHumanEdits).toBe(true);
  });

  it("creates a patch conflict when a human edits inside a generated block", () => {
    const workflow = buildDemoWorkflow();
    const original = workflow.initial.files.find((file) => file.path.endsWith("/context.md"))!;
    const regenerated = workflow.incoming.files.find((file) => file.path.endsWith("/context.md"))!;
    const editedInsideGeneratedBlock = {
      ...original,
      content: original.content.replace(
        "Sonnenallee 44 is an active",
        "Human changed generated block. Sonnenallee 44 is an active"
      )
    };
    const patch = proposeFactPatch(editedInsideGeneratedBlock, regenerated, ["fact_tempseal_approved"]);

    expect(patch.patchStatus).toBe("conflict");
    expect(patch.proposedContent).toContain("Human changed generated block. Sonnenallee 44 is an active");
  });

  it("generates facts.jsonl and qontext_ingest.json from the same fact ledger", () => {
    const workflow = buildDemoWorkflow();
    const factsJsonl = workflow.applied.files.find((file) => file.path.endsWith("/facts.jsonl"))!;
    const qontext = workflow.applied.files.find((file) => file.path.endsWith("/qontext_ingest.json"))!;
    const factIdsFromJsonl = factsJsonl.content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line).id)
      .sort();
    const factIdsFromQontext = JSON.parse(qontext.content).facts
      .map((fact: { id: string }) => fact.id)
      .sort();

    expect(factIdsFromQontext).toEqual(factIdsFromJsonl);
  });

  it("exports a Qontext ingest payload with graph, source relevance, and provenance shape", () => {
    const workflow = buildDemoWorkflow();
    const qontext = JSON.parse(fileContent(workflow, "/qontext_ingest.json"));
    const factIds = new Set(qontext.facts.map((fact: { id: string }) => fact.id));
    const sourceIds = new Set(qontext.sources.map((source: { id: string }) => source.id));
    const spanIds = new Set(qontext.spans.map((span: { id: string }) => span.id));

    expect(qontext.virtualFileSystem).toBe("/properties/sonnenallee-44");
    expect(qontext.entities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ent_issue_roof_leak" })])
    );
    expect(qontext.relationships).toHaveLength(qontext.facts.length);
    expect(
      qontext.sources.every(
        (source: { text?: string; relevance?: unknown }) => source.text === undefined && source.relevance
      )
    ).toBe(true);
    expect(
      qontext.spans.every(
        (span: { id: string; sourceDocumentId: string }) =>
          spanIds.has(span.id) && sourceIds.has(span.sourceDocumentId)
      )
    ).toBe(true);
    expect(
      qontext.facts.every(
        (fact: { id: string; sourceSpanIds: string[] }) =>
          factIds.has(fact.id) && fact.sourceSpanIds.every((spanId) => spanIds.has(spanId))
      )
    ).toBe(true);
    expect(qontext.relationships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "ent_issue_roof_leak",
          predicate: "emergency_vendor",
          to: "TempSeal Notdienst approved for temporary emergency sealing today up to EUR 500",
          sourceSpanIds: ["span_fact_tempseal_approved"]
        })
      ])
    );
  });

  it("changes the agent action plan after applying the incoming source patch", () => {
    const workflow = buildDemoWorkflow();
    const beforeLabels = workflow.beforeCheck.actions.map((action) => action.label);
    const afterLabels = workflow.afterCheck.actions.map((action) => action.label);

    expect(beforeLabels).toContain("Do not dispatch a vendor yet");
    expect(afterLabels).toContain("Dispatch TempSeal Notdienst for temporary emergency sealing today");
    expect(workflow.afterCheck.score).toBeGreaterThan(workflow.beforeCheck.score);
  });
});
