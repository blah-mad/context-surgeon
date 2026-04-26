import type { Entity, RawDemoSource } from "./types";

export const PROPERTY_ID = "sonnenallee-44";
export const PROPERTY_NAME = "Sonnenallee 44, 12045 Berlin";

export const DEMO_ENTITIES: Entity[] = [
  {
    id: "ent_property_sonnenallee_44",
    canonicalName: PROPERTY_NAME,
    entityType: "property",
    aliases: ["Sonnenallee 44", "Sonnenallee 44, Berlin"],
    attributes: { city: "Berlin", district: "Neukolln" },
    confidence: 0.99
  },
  {
    id: "ent_unit_4b",
    canonicalName: "Unit 4B",
    entityType: "unit",
    aliases: ["Wohnung 4B", "4B"],
    attributes: { floor: 4 },
    confidence: 0.95
  },
  {
    id: "ent_tenant_hoffmann",
    canonicalName: "Klara Hoffmann",
    entityType: "tenant",
    aliases: ["K. Hoffmann", "Frau Hoffmann"],
    attributes: { unit: "Unit 4B" },
    confidence: 0.94
  },
  {
    id: "ent_owner_board",
    canonicalName: "WEG Sonnenallee 44 Owner Board",
    entityType: "owner",
    aliases: ["Eigentumerbeirat", "Owner Board"],
    attributes: { approvalRequired: true },
    confidence: 0.93
  },
  {
    id: "ent_vendor_dachkraft",
    canonicalName: "Dachkraft Berlin GmbH",
    entityType: "vendor",
    aliases: ["Dachkraft", "Dachkraft Berlin"],
    attributes: { trade: "roofing" },
    confidence: 0.92
  },
  {
    id: "ent_vendor_tempseal",
    canonicalName: "TempSeal Notdienst",
    entityType: "vendor",
    aliases: ["TempSeal", "TempSeal Emergency"],
    attributes: { trade: "emergency sealing" },
    confidence: 0.9
  },
  {
    id: "ent_issue_roof_leak",
    canonicalName: "Roof leak above Unit 4B",
    entityType: "maintenance_issue",
    aliases: ["roof leak", "Dachleck", "leak above 4B"],
    attributes: { property: PROPERTY_NAME },
    confidence: 0.96
  },
  {
    id: "ent_invoice_2048",
    canonicalName: "Invoice INV-2048",
    entityType: "invoice",
    aliases: ["INV-2048"],
    attributes: { vendor: "Dachkraft Berlin GmbH" },
    confidence: 0.94
  }
];

export const RAW_DEMO_SOURCES: RawDemoSource[] = [
  {
    id: "src_vendor_newsletter_noise",
    sourceType: "email",
    filename: "000_vendor_newsletter.txt",
    title: "Vendor newsletter: spring discount campaign",
    author: "Dachkraft Berlin GmbH",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-19T06:20:00.000Z",
    metadata: { inbox: "property-manager@hausmail.de", noiseSeed: true },
    relevance: {
      status: "ignored",
      score: 0.12,
      reason: "Marketing newsletter mentions roofing services but does not change property state, obligations, approvals, or open issues.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `From: Dachkraft Berlin GmbH <newsletter@dachkraft.example.de>
Subject: Spring roofing inspection discount
Date: 19 Apr 2026

This month only: 15% off preventive roof inspections across Berlin.
Reply to book a general consultation for your portfolio.
No reference to Sonnenallee 44, DK-991, WEG approvals, invoices, tenants, or active emergency work.`,
    facts: []
  },
  {
    id: "src_tenant_roof_leak",
    sourceType: "email",
    filename: "001_tenant_roof_leak.txt",
    title: "Tenant complaint: roof leak still active",
    author: "Klara Hoffmann",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-20T08:15:00.000Z",
    metadata: { inbox: "property-manager@hausmail.de", unit: "4B" },
    relevance: {
      status: "included",
      score: 0.94,
      reason: "Tenant reports active water ingress, status, and a response deadline for Sonnenallee 44.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `From: Klara Hoffmann <klara.hoffmann@example.de>
To: property-manager@hausmail.de
Subject: Dachleck in Wohnung 4B weiterhin offen
Date: 20 Apr 2026

Objekt: Sonnenallee 44, 12045 Berlin.
The roof leak above unit 4B is still open.
Water marks expanded after the weekend rain and the tenant asks for a status update by 22 Apr 2026.
Please do not mark this as resolved until the ceiling is dry.`,
    facts: [
      {
        id: "fact_roof_status_open_tenant",
        factType: "tenant_issue",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "status",
        objectValue: "open",
        normalizedValue: "open",
        confidence: 0.94,
        sourceQuote: "The roof leak above unit 4B is still open."
      },
      {
        id: "fact_roof_deadline_status",
        factType: "deadline",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "tenant_update_due",
        objectValue: "22 Apr 2026",
        normalizedValue: "2026-04-22",
        confidence: 0.9,
        sourceQuote: "the tenant asks for a status update by 22 Apr 2026"
      }
    ]
  },
  {
    id: "src_weg_minutes",
    sourceType: "pdf",
    filename: "2025_weg_minutes.pdf.txt",
    title: "WEG minutes: maintenance approvals",
    author: "WEG Sonnenallee 44",
    propertyId: PROPERTY_ID,
    createdAt: "2025-11-18T16:00:00.000Z",
    metadata: { pageCount: 6, simulatedPdf: true },
    relevance: {
      status: "included",
      score: 0.9,
      reason: "WEG minutes define approval thresholds and preferred vendor rules used by agents.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `WEG Sonnenallee 44 - Eigentumerversammlung 18 Nov 2025

Beschluss 7: Emergency maintenance above EUR 300 requires owner-board approval before work starts.
Beschluss 8: Dachkraft Berlin GmbH remains preferred roofing vendor for non-emergency work.
Beschluss 9: Reserve funds may be used for urgent water ingress mitigation.`,
    facts: [
      {
        id: "fact_threshold_300",
        factType: "approval",
        subjectEntityId: "ent_owner_board",
        predicate: "emergency_spend_threshold",
        objectValue: "EUR 300",
        normalizedValue: "EUR300",
        confidence: 0.93,
        sourceQuote: "Emergency maintenance above EUR 300 requires owner-board approval before work starts."
      },
      {
        id: "fact_dachkraft_preferred",
        factType: "vendor_assignment",
        subjectEntityId: "ent_vendor_dachkraft",
        predicate: "preferred_for",
        objectValue: "non-emergency roofing work",
        normalizedValue: "non_emergency_roofing",
        confidence: 0.89,
        sourceQuote: "Dachkraft Berlin GmbH remains preferred roofing vendor for non-emergency work."
      }
    ]
  },
  {
    id: "src_vendor_quote",
    sourceType: "pdf",
    filename: "vendor_quote_roof_repair.pdf.txt",
    title: "Dachkraft roof repair quote",
    author: "Dachkraft Berlin GmbH",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-16T10:30:00.000Z",
    metadata: { simulatedPdf: true, quoteId: "DK-991" },
    relevance: {
      status: "included",
      score: 0.92,
      reason: "Vendor quote contains amount, start date dependency, and approval status for the roof issue.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `Dachkraft Berlin GmbH
Quote DK-991 for Sonnenallee 44.
Permanent roof membrane repair above unit 4B is quoted at EUR 4,800.
Work can start 29 Apr 2026 after written owner approval.
The quote is pending approval as of 16 Apr 2026.`,
    facts: [
      {
        id: "fact_quote_amount_4800",
        factType: "amount",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "permanent_repair_quote",
        objectValue: "EUR 4,800",
        normalizedValue: "EUR4800",
        confidence: 0.96,
        sourceQuote: "Permanent roof membrane repair above unit 4B is quoted at EUR 4,800."
      },
      {
        id: "fact_quote_pending",
        factType: "status",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "permanent_repair_quote_status",
        objectValue: "pending approval",
        normalizedValue: "pending",
        confidence: 0.92,
        sourceQuote: "The quote is pending approval as of 16 Apr 2026."
      }
    ]
  },
  {
    id: "src_maintenance_log",
    sourceType: "txt",
    filename: "maintenance_log.md",
    title: "Old manager maintenance log",
    author: "Altbau Verwaltung",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-18T17:00:00.000Z",
    metadata: { handover: true },
    relevance: {
      status: "included",
      score: 0.84,
      reason: "Handover log contains issue status and emergency vendor assignment gaps.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `# Sonnenallee 44 maintenance log

18 Apr 2026: Roof leak above unit 4B marked closed after visual inspection.
Dachkraft Berlin GmbH said permanent repair can wait until the next dry weather window.
No emergency vendor has been assigned for the roof leak.`,
    facts: [
      {
        id: "fact_roof_status_closed_log",
        factType: "status",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "status",
        objectValue: "closed",
        normalizedValue: "closed",
        confidence: 0.72,
        sourceQuote: "Roof leak above unit 4B marked closed after visual inspection."
      },
      {
        id: "fact_no_emergency_vendor",
        factType: "risk",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "emergency_vendor",
        objectValue: "not assigned",
        normalizedValue: "missing",
        confidence: 0.83,
        sourceQuote: "No emergency vendor has been assigned for the roof leak."
      }
    ]
  },
  {
    id: "src_invoices",
    sourceType: "csv",
    filename: "invoices.csv",
    title: "Invoice export",
    author: "ERP CSV export",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-21T09:00:00.000Z",
    metadata: { rows: 3 },
    relevance: {
      status: "needs_review",
      score: 0.74,
      reason: "Invoice export overlaps with the roof quote but contains a conflicting EUR 4,200 amount.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `invoice_id,vendor,property,amount,status
INV-2048,Dachkraft Berlin GmbH,Sonnenallee 44,EUR 4200,received
INV-2049,TempSeal Notdienst,Sonnenallee 44,EUR 650,draft
INV-2050,Berlin Wasser,Sonnenallee 44,EUR 180,paid`,
    facts: [
      {
        id: "fact_invoice_2048_amount_4200",
        factType: "amount",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "permanent_repair_quote",
        objectValue: "EUR 4,200",
        normalizedValue: "EUR4200",
        confidence: 0.97,
        sourceQuote: "INV-2048,Dachkraft Berlin GmbH,Sonnenallee 44,EUR 4200,received"
      }
    ]
  },
  {
    id: "src_owner_update",
    sourceType: "email",
    filename: "002_owner_approval_threshold.txt",
    title: "Owner board approval update",
    author: "Maja Kruger",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-22T12:45:00.000Z",
    metadata: { senderRole: "owner_board" },
    relevance: {
      status: "included",
      score: 0.91,
      reason: "Owner-board email supersedes the older emergency spending threshold for water ingress.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "initial",
    text: `From: Maja Kruger <maja.kruger@example.de>
Subject: Temporary threshold update for Sonnenallee 44

For water ingress issues at Sonnenallee 44, emergency sealing up to EUR 500 may be approved by the property manager without waiting for the full owner board.
Permanent roof repair still needs owner-board approval.`,
    facts: [
      {
        id: "fact_threshold_500",
        factType: "approval",
        subjectEntityId: "ent_owner_board",
        predicate: "emergency_spend_threshold",
        objectValue: "EUR 500",
        normalizedValue: "EUR500",
        confidence: 0.91,
        sourceQuote: "emergency sealing up to EUR 500 may be approved by the property manager without waiting for the full owner board"
      },
      {
        id: "fact_permanent_repair_board_approval",
        factType: "approval",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "permanent_repair_approval",
        objectValue: "owner-board approval required",
        normalizedValue: "board_required",
        confidence: 0.92,
        sourceQuote: "Permanent roof repair still needs owner-board approval."
      }
    ]
  },
  {
    id: "src_new_owner_email",
    sourceType: "email",
    filename: "003_vendor_quote_rejected_new_email.txt",
    title: "New email: quote rejected, emergency repair approved",
    author: "Maja Kruger",
    propertyId: PROPERTY_ID,
    createdAt: "2026-04-25T08:30:00.000Z",
    metadata: { incoming: true, demoTrigger: true },
    relevance: {
      status: "included",
      score: 0.98,
      reason: "New owner instruction rejects a stale quote, approves an emergency vendor, and changes today's action plan.",
      classifier: "pioneer-fastino-mock"
    },
    phase: "incoming",
    text: `From: Maja Kruger <maja.kruger@example.de>
To: property-manager@hausmail.de
Subject: Sonnenallee 44 roof leak - emergency approval
Date: 25 Apr 2026

The Dachkraft quote DK-991 is rejected for now because the board wants a second quote for permanent repair.
TempSeal Notdienst is approved for temporary emergency sealing today up to EUR 500.
Please keep the roof leak above unit 4B open until permanent repair is approved.
Notify Klara Hoffmann today with the temporary sealing plan.`,
    facts: [
      {
        id: "fact_quote_rejected",
        factType: "status",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "permanent_repair_quote_status",
        objectValue: "rejected for now",
        normalizedValue: "rejected",
        confidence: 0.95,
        sourceQuote: "The Dachkraft quote DK-991 is rejected for now because the board wants a second quote for permanent repair.",
        supersedesFactIds: ["fact_quote_pending"]
      },
      {
        id: "fact_tempseal_approved",
        factType: "vendor_assignment",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "emergency_vendor",
        objectValue: "TempSeal Notdienst approved for temporary emergency sealing today up to EUR 500",
        normalizedValue: "tempseal_approved",
        confidence: 0.96,
        sourceQuote: "TempSeal Notdienst is approved for temporary emergency sealing today up to EUR 500.",
        supersedesFactIds: ["fact_no_emergency_vendor"]
      },
      {
        id: "fact_roof_keep_open",
        factType: "status",
        subjectEntityId: "ent_issue_roof_leak",
        predicate: "status",
        objectValue: "open until permanent repair is approved",
        normalizedValue: "open",
        confidence: 0.96,
        sourceQuote: "Please keep the roof leak above unit 4B open until permanent repair is approved.",
        supersedesFactIds: ["fact_roof_status_closed_log"]
      },
      {
        id: "fact_notify_hoffmann_today",
        factType: "deadline",
        subjectEntityId: "ent_tenant_hoffmann",
        predicate: "notify_today",
        objectValue: "Notify Klara Hoffmann today with the temporary sealing plan",
        normalizedValue: "2026-04-25",
        confidence: 0.94,
        sourceQuote: "Notify Klara Hoffmann today with the temporary sealing plan."
      }
    ]
  }
];
