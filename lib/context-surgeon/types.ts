export type SourceType = "email" | "pdf" | "csv" | "docx" | "txt" | "web";

export type EntityType =
  | "property"
  | "unit"
  | "tenant"
  | "owner"
  | "vendor"
  | "invoice"
  | "maintenance_issue"
  | "assembly_decision"
  | "contract"
  | "bank_account"
  | "person"
  | "company"
  | "date"
  | "money"
  | "unknown";

export type FactType =
  | "decision"
  | "requirement"
  | "deadline"
  | "owner"
  | "status"
  | "amount"
  | "risk"
  | "dependency"
  | "contact"
  | "claim"
  | "approval"
  | "vendor_assignment"
  | "tenant_issue"
  | "accounting_flag";

export type ConflictType =
  | "value_mismatch"
  | "date_mismatch"
  | "owner_mismatch"
  | "status_mismatch"
  | "duplicate_entity"
  | "unsupported_claim"
  | "missing_required_fact";

export type SourceRelevanceStatus = "included" | "ignored" | "needs_review";

export interface SourceRelevance {
  status: SourceRelevanceStatus;
  score: number;
  reason: string;
  classifier: "pioneer-fastino-mock" | "pioneer-fastino-live" | "rule";
}

export interface SourceDocument {
  id: string;
  sourceType: SourceType;
  filename: string;
  title: string;
  author?: string;
  propertyId: string;
  createdAt?: string;
  ingestedAt: string;
  checksum: string;
  metadata: Record<string, string | number | boolean>;
  relevance: SourceRelevance;
  text: string;
}

export interface TextChunk {
  id: string;
  sourceDocumentId: string;
  chunkIndex: number;
  text: string;
  charStart: number;
  charEnd: number;
  pageNumber?: number;
  rowNumber?: number;
  sectionPath?: string;
}

export interface SourceSpan {
  id: string;
  sourceDocumentId: string;
  chunkId: string;
  charStart: number;
  charEnd: number;
  quote: string;
  pageNumber?: number;
  rowNumber?: number;
}

export interface Entity {
  id: string;
  canonicalName: string;
  entityType: EntityType;
  aliases: string[];
  attributes: Record<string, string | number | boolean>;
  confidence: number;
}

export interface Fact {
  id: string;
  propertyId: string;
  factType: FactType;
  subjectEntityId?: string;
  predicate: string;
  objectValue: string;
  objectEntityId?: string;
  normalizedValue?: string;
  validFrom?: string;
  validUntil?: string;
  confidence: number;
  extractionModel: string;
  sourceSpanIds: string[];
  supersedesFactIds: string[];
  createdAt: string;
}

export interface Conflict {
  id: string;
  conflictType: ConflictType;
  factIds: string[];
  entityIds: string[];
  title: string;
  explanation: string;
  severity: "low" | "medium" | "high";
  status: "open" | "accepted" | "dismissed" | "resolved";
  suggestedResolution?: string;
  createdAt: string;
}

export interface VfsFile {
  id: string;
  propertyId: string;
  path: string;
  title: string;
  content: string;
  generatedHash: string;
  lastGeneratedAt: string;
  sourceFactIds: string[];
}

export interface PatchProposal {
  id: string;
  propertyId: string;
  fileId: string;
  path: string;
  baseHash: string;
  currentHash: string;
  proposedContent: string;
  unifiedDiff: string;
  patchStatus: "pending" | "applied" | "rejected" | "conflict";
  preservesHumanEdits: boolean;
  changedFactIds: string[];
  reason: string;
  createdAt: string;
}

export interface RawDemoFact {
  id: string;
  factType: FactType;
  subjectEntityId?: string;
  predicate: string;
  objectValue: string;
  objectEntityId?: string;
  normalizedValue?: string;
  confidence: number;
  sourceQuote: string;
  supersedesFactIds?: string[];
}

export interface RawDemoSource {
  id: string;
  sourceType: SourceType;
  filename: string;
  title: string;
  author?: string;
  propertyId: string;
  createdAt?: string;
  metadata?: Record<string, string | number | boolean>;
  relevance?: SourceRelevance;
  text: string;
  facts: RawDemoFact[];
  phase: "initial" | "incoming";
}

export interface ContextState {
  propertyId: string;
  propertyName: string;
  sources: SourceDocument[];
  chunks: TextChunk[];
  spans: SourceSpan[];
  entities: Entity[];
  facts: Fact[];
  conflicts: Conflict[];
  files: VfsFile[];
  patch?: PatchProposal;
}

export interface ContextAction {
  id: string;
  label: string;
  rationale: string;
  sourceFactIds: string[];
  status: "blocked" | "ready" | "needs_review";
}

export interface ContextCheckResult {
  score: number;
  blockedActions: number;
  summary: string;
  actions: ContextAction[];
  unresolvedConflictIds: string[];
}
