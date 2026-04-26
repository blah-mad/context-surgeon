import type { Conflict, ContextCheckResult, Fact } from "./types";

function activeFacts(facts: Fact[]): Fact[] {
  return facts.filter((fact) => !facts.some((other) => other.supersedesFactIds.includes(fact.id)));
}

function findFact(facts: Fact[], predicate: string, normalizedValue?: string): Fact | undefined {
  return activeFacts(facts).find(
    (fact) =>
      fact.predicate === predicate &&
      (normalizedValue === undefined || fact.normalizedValue === normalizedValue)
  );
}

export function runContextCheck(facts: Fact[], conflicts: Conflict[]): ContextCheckResult {
  const active = activeFacts(facts);
  const unresolvedConflicts = conflicts.filter((conflict) => conflict.status === "open");
  const hasApprovedTempSeal = Boolean(findFact(active, "emergency_vendor", "tempseal_approved"));
  const hasRejectedPermanentQuote = Boolean(findFact(active, "permanent_repair_quote_status", "rejected"));
  const roofOpen = Boolean(findFact(active, "status", "open"));
  const notifyTenant = findFact(active, "notify_today");

  const actions = [
    {
      id: "action_dispatch_tempseal",
      label: hasApprovedTempSeal
        ? "Dispatch TempSeal Notdienst for temporary emergency sealing today"
        : "Do not dispatch a vendor yet",
      rationale: hasApprovedTempSeal
        ? "The latest owner-board email approves TempSeal for temporary sealing up to EUR 500."
        : "The compiled context does not yet contain an approved emergency vendor.",
      sourceFactIds: active
        .filter((fact) => ["emergency_vendor", "emergency_spend_threshold"].includes(fact.predicate))
        .map((fact) => fact.id),
      status: hasApprovedTempSeal ? ("ready" as const) : ("blocked" as const)
    },
    {
      id: "action_get_second_quote",
      label: "Keep permanent repair quote in review and request a second quote",
      rationale: hasRejectedPermanentQuote
        ? "Dachkraft quote DK-991 was rejected for now because the board wants a second quote."
        : "Permanent repair quote status is still unresolved.",
      sourceFactIds: active
        .filter((fact) => fact.predicate === "permanent_repair_quote_status")
        .map((fact) => fact.id),
      status: hasRejectedPermanentQuote ? ("ready" as const) : ("needs_review" as const)
    },
    {
      id: "action_notify_tenant",
      label: "Notify Klara Hoffmann with the temporary sealing plan",
      rationale: notifyTenant
        ? "The latest source explicitly asks the property manager to notify Klara Hoffmann today."
        : "Tenant requested a status update, but the current plan is not yet complete.",
      sourceFactIds: active
        .filter((fact) => fact.subjectEntityId === "ent_tenant_hoffmann" || fact.predicate === "tenant_update_due")
        .map((fact) => fact.id),
      status: notifyTenant ? ("ready" as const) : ("needs_review" as const)
    },
    {
      id: "action_keep_issue_open",
      label: roofOpen ? "Keep roof leak open until permanent repair is approved" : "Block closure of roof leak",
      rationale: roofOpen
        ? "The active fact ledger says the leak should stay open until permanent repair is approved."
        : "The context contains unresolved status conflict for the roof leak.",
      sourceFactIds: active.filter((fact) => fact.predicate === "status").map((fact) => fact.id),
      status: roofOpen && unresolvedConflicts.length === 0 ? ("ready" as const) : ("needs_review" as const)
    }
  ];

  const blockedActions = actions.filter((action) => action.status === "blocked").length;
  const score = Math.max(35, Math.min(96, 88 - unresolvedConflicts.length * 9 - blockedActions * 12 + (hasApprovedTempSeal ? 10 : 0)));

  return {
    score,
    blockedActions,
    summary:
      unresolvedConflicts.length > 0
        ? "Context is usable for a constrained recommendation, but unresolved conflicts still require review."
        : "Context is sufficiently grounded for the property manager to act with citations.",
    actions,
    unresolvedConflictIds: unresolvedConflicts.map((conflict) => conflict.id)
  };
}

