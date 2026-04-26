import type { Conflict, Entity, Fact } from "./types";
import { nowIso } from "./utils";

const STATUS_ORDER = new Set(["open", "closed", "pending", "rejected"]);

function pairKey(fact: Fact): string {
  return `${fact.subjectEntityId ?? "unknown"}:${fact.predicate}`;
}

function valuesConflict(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a === b) return false;
  if (STATUS_ORDER.has(a) && STATUS_ORDER.has(b)) return true;
  if (a.startsWith("EUR") && b.startsWith("EUR")) return true;
  return false;
}

function conflictTypeFor(predicate: string) {
  if (predicate.includes("threshold") || predicate.includes("amount")) return "value_mismatch" as const;
  if (predicate.includes("status")) return "status_mismatch" as const;
  return "value_mismatch" as const;
}

export function detectConflicts(facts: Fact[], entities: Entity[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const factsById = new Map(facts.map((fact) => [fact.id, fact]));
  const entityName = (id?: string) =>
    entities.find((entity) => entity.id === id)?.canonicalName ?? "Unknown entity";

  const activeFacts = facts.filter(
    (fact) => !facts.some((other) => other.supersedesFactIds.includes(fact.id))
  );
  const byPair = new Map<string, Fact[]>();
  for (const fact of activeFacts) {
    const key = pairKey(fact);
    byPair.set(key, [...(byPair.get(key) ?? []), fact]);
  }

  for (const [key, groupedFacts] of byPair.entries()) {
    for (let leftIndex = 0; leftIndex < groupedFacts.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < groupedFacts.length; rightIndex += 1) {
        const left = groupedFacts[leftIndex];
        const right = groupedFacts[rightIndex];
        if (!valuesConflict(left.normalizedValue, right.normalizedValue)) continue;
        const [subjectId, predicate] = key.split(":");
        conflicts.push({
          id: `conflict_${left.id}_${right.id}`,
          conflictType: conflictTypeFor(predicate),
          factIds: [left.id, right.id],
          entityIds: [subjectId].filter(Boolean),
          title: `${entityName(subjectId)} has conflicting ${predicate.replaceAll("_", " ")}`,
          explanation: `"${left.objectValue}" conflicts with "${right.objectValue}". Context Surgeon blocks overconfident agent action until this is resolved or superseded.`,
          severity: predicate.includes("status") || predicate.includes("threshold") ? "high" : "medium",
          status: "open",
          suggestedResolution: "Review the newer source and accept the Fact Patch only if the cited evidence is current.",
          createdAt: nowIso()
        });
      }
    }
  }

  const hasEmergencyVendor = activeFacts.some(
    (fact) => fact.predicate === "emergency_vendor" && fact.normalizedValue !== "missing"
  );
  const missingEmergencyVendor = activeFacts.find(
    (fact) => fact.predicate === "emergency_vendor" && fact.normalizedValue === "missing"
  );
  if (missingEmergencyVendor && !hasEmergencyVendor) {
    conflicts.push({
      id: "conflict_missing_emergency_vendor",
      conflictType: "missing_required_fact",
      factIds: [missingEmergencyVendor.id],
      entityIds: [missingEmergencyVendor.subjectEntityId ?? ""].filter(Boolean),
      title: "Emergency vendor is missing for active roof leak",
      explanation:
        "The building context says no emergency vendor is assigned while the tenant issue is still active.",
      severity: "high",
      status: "open",
      suggestedResolution: "Assign or approve an emergency vendor before dispatching an agent action.",
      createdAt: nowIso()
    });
  }

  return conflicts;
}

export function factsById(facts: Fact[]): Map<string, Fact> {
  return new Map(facts.map((fact) => [fact.id, fact]));
}

