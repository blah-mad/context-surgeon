export type IntegrationCategory = "email" | "crm" | "files" | "collaboration" | "support" | "work";
export type IntegrationStatus = "connected" | "available" | "needs_config" | "syncing" | "error";
export type IntegrationConnectKind = "oauth" | "manual_upload";

export interface IntegrationCatalogItem {
  id: string;
  toolkitSlug: string;
  label: string;
  category: IntegrationCategory;
  categoryLabel: string;
  description: string;
  authConfigEnv?: string;
  connectKind: IntegrationConnectKind;
  primaryTools: string[];
  sourceTypes: string[];
  triggerExamples: string[];
  ingestionPolicy: string;
}

export interface IntegrationConnection {
  id: string;
  toolkitSlug: string;
  label: string;
  status: IntegrationStatus;
  accountLabel?: string;
  lastSyncAt?: string;
  sourceCount: number;
  factCount: number;
  setupMissing?: string[];
  redirectUrl?: string;
}

export interface IntegrationSyncSource {
  id: string;
  toolkitSlug: string;
  title: string;
  sourceType: string;
  timestamp: string;
  confidence: number;
  summary: string;
  facts: Array<{
    predicate: string;
    value: string;
    quote: string;
  }>;
}

export interface IntegrationSyncResult {
  ok: boolean;
  mode: "live" | "demo";
  workspaceId: string;
  selectedToolkits: string[];
  generatedAt: string;
  summary: string;
  sources: IntegrationSyncSource[];
  nextActions: string[];
  composio: {
    configured: boolean;
    attemptedLiveTools: string[];
    missing: string[];
  };
}

export const integrationCatalog: IntegrationCatalogItem[] = [
  {
    id: "manual_upload",
    toolkitSlug: "manual_upload",
    label: "Manual Upload",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Drag in PDFs, Word docs, TXT, CSV, JSON, Markdown, scans, contracts, minutes, or exports.",
    connectKind: "manual_upload",
    primaryTools: [],
    sourceTypes: ["pdf", "docx", "txt", "csv", "json", "markdown", "image"],
    triggerExamples: ["User drops file", "Bulk handover import", "One-off evidence upload"],
    ingestionPolicy: "Manual uploads enter the candidate source queue with filename, type, size, extracted text, and provenance."
  },
  {
    id: "gmail",
    toolkitSlug: "gmail",
    label: "Gmail",
    category: "email",
    categoryLabel: "Email",
    description: "Owner emails, tenant messages, contractor replies, attachments, and thread history.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_GMAIL",
    connectKind: "oauth",
    primaryTools: ["GMAIL_FETCH_EMAILS", "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID", "GMAIL_GET_ATTACHMENT"],
    sourceTypes: ["email", "attachment"],
    triggerExamples: ["New email matching scope", "New attachment", "Thread reply after patch"],
    ingestionPolicy: "Consume scoped threads and attachments, ignore newsletters/noise, and create Fact Patch proposals for new operational truth."
  },
  {
    id: "outlook",
    toolkitSlug: "outlook",
    label: "Outlook",
    category: "email",
    categoryLabel: "Email",
    description: "Microsoft 365 mailbox threads, claim updates, vendor correspondence, and calendar context.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_OUTLOOK",
    connectKind: "oauth",
    primaryTools: ["OUTLOOK_LIST_MESSAGES", "OUTLOOK_GET_MESSAGE", "OUTLOOK_LIST_ATTACHMENTS"],
    sourceTypes: ["email", "calendar", "attachment"],
    triggerExamples: ["New matching email", "Updated meeting", "Attachment added"],
    ingestionPolicy: "Convert Microsoft 365 mail and calendar context into source documents with sender, timestamp, and thread provenance."
  },
  {
    id: "hubspot",
    toolkitSlug: "hubspot",
    label: "HubSpot",
    category: "crm",
    categoryLabel: "CRM",
    description: "Customers, companies, deals, owner records, lifecycle status, and recent notes.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_HUBSPOT",
    connectKind: "oauth",
    primaryTools: ["HUBSPOT_SEARCH_CONTACTS_BY_CRITERIA", "HUBSPOT_SEARCH_COMPANIES", "HUBSPOT_GET_DEAL"],
    sourceTypes: ["crm_contact", "crm_company", "deal"],
    triggerExamples: ["Contact updated", "Deal stage changed", "Note added"],
    ingestionPolicy: "Use CRM as identity and authority context, not as a dumping ground for every field."
  },
  {
    id: "salesforce",
    toolkitSlug: "salesforce",
    label: "Salesforce",
    category: "crm",
    categoryLabel: "CRM",
    description: "Accounts, contacts, cases, ownership records, opportunities, and field-level account context.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_SALESFORCE",
    connectKind: "oauth",
    primaryTools: ["SALESFORCE_SEARCH_ACCOUNTS", "SALESFORCE_SEARCH_CONTACTS", "SALESFORCE_QUERY_RECORDS"],
    sourceTypes: ["crm_account", "case", "contact"],
    triggerExamples: ["Account field changed", "Case updated", "Opportunity note changed"],
    ingestionPolicy: "Resolve canonical identities, ownership, account status, cases, and approval limits."
  },
  {
    id: "googledrive",
    toolkitSlug: "googledrive",
    label: "Google Drive",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Meeting minutes, PDFs, contracts, handover docs, scans, spreadsheets, and folders.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_GOOGLEDRIVE",
    connectKind: "oauth",
    primaryTools: ["GOOGLEDRIVE_SEARCH_FILES", "GOOGLEDRIVE_DOWNLOAD_FILE", "GOOGLEDRIVE_FETCH_FILE"],
    sourceTypes: ["document", "spreadsheet", "pdf"],
    triggerExamples: ["File added to scoped folder", "PDF updated", "Minutes uploaded"],
    ingestionPolicy: "Sync scoped folders and files; attach document provenance and file revision metadata to facts."
  },
  {
    id: "onedrive",
    toolkitSlug: "one_drive",
    label: "OneDrive",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Microsoft files, PDFs, Word documents, Excel exports, folder handovers, and shared evidence.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_ONEDRIVE",
    connectKind: "oauth",
    primaryTools: ["ONE_DRIVE_SEARCH", "ONE_DRIVE_DOWNLOAD_FILE", "ONE_DRIVE_LIST_FILES"],
    sourceTypes: ["document", "spreadsheet", "pdf", "docx"],
    triggerExamples: ["File added", "Folder updated", "Document shared"],
    ingestionPolicy: "Treat OneDrive as the Microsoft file evidence layer for leases, minutes, invoices, and SOPs."
  },
  {
    id: "dropbox",
    toolkitSlug: "dropbox",
    label: "Dropbox",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Shared folders, contractor packets, scans, invoices, legacy document archives, and handover bundles.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_DROPBOX",
    connectKind: "oauth",
    primaryTools: ["DROPBOX_SEARCH", "DROPBOX_DOWNLOAD_FILE", "DROPBOX_LIST_FOLDER"],
    sourceTypes: ["document", "pdf", "image", "folder"],
    triggerExamples: ["Folder file added", "PDF revised", "Shared folder synced"],
    ingestionPolicy: "Bring legacy file archives into the same source queue as live email and CRM records."
  },
  {
    id: "sharepoint",
    toolkitSlug: "share_point",
    label: "SharePoint",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Enterprise document libraries, policy folders, team sites, Word docs, PDFs, and Excel records.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_SHAREPOINT",
    connectKind: "oauth",
    primaryTools: ["SHARE_POINT_SEARCH", "SHARE_POINT_DOWNLOAD_FILE", "SHARE_POINT_LIST_FILES"],
    sourceTypes: ["document", "policy", "spreadsheet", "pdf"],
    triggerExamples: ["Library file updated", "Policy changed", "Folder item added"],
    ingestionPolicy: "Use SharePoint for durable procedural context and policy provenance."
  },
  {
    id: "googlesheets",
    toolkitSlug: "googlesheets",
    label: "Google Sheets",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Maintenance registers, budget spreadsheets, vendor tables, approval trackers, and audit logs.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_GOOGLESHEETS",
    connectKind: "oauth",
    primaryTools: ["GOOGLESHEETS_LOOKUP_SPREADSHEET_ROW", "GOOGLESHEETS_GET_SPREADSHEET_INFO"],
    sourceTypes: ["spreadsheet", "row", "table"],
    triggerExamples: ["Row changed", "Sheet imported", "Tracker updated"],
    ingestionPolicy: "Normalize tabular operational records into typed facts with row-level provenance."
  },
  {
    id: "notion",
    toolkitSlug: "notion",
    label: "Notion",
    category: "files",
    categoryLabel: "Files & knowledge",
    description: "Internal knowledge bases, SOPs, handover pages, project databases, and runbooks.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_NOTION",
    connectKind: "oauth",
    primaryTools: ["NOTION_SEARCH", "NOTION_FETCH_PAGE", "NOTION_QUERY_DATABASE"],
    sourceTypes: ["page", "database", "runbook"],
    triggerExamples: ["Page updated", "Database row changed", "Runbook revised"],
    ingestionPolicy: "Turn living internal docs into context files with links back to page/database provenance."
  },
  {
    id: "slack",
    toolkitSlug: "slack",
    label: "Slack",
    category: "collaboration",
    categoryLabel: "Collaboration",
    description: "Operational chat, incident updates, internal decisions, handoffs, and unresolved questions.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_SLACK",
    connectKind: "oauth",
    primaryTools: ["SLACK_SEARCH_MESSAGES", "SLACK_FETCH_CONVERSATION_HISTORY"],
    sourceTypes: ["chat", "handoff"],
    triggerExamples: ["Message matches scope", "Thread marked decision", "Incident channel update"],
    ingestionPolicy: "Only consume decision-bearing or unresolved operational messages, not the whole firehose."
  },
  {
    id: "microsoft_teams",
    toolkitSlug: "microsoft_teams",
    label: "Microsoft Teams",
    category: "collaboration",
    categoryLabel: "Collaboration",
    description: "Team channels, incident discussions, handoffs, meeting context, and decision breadcrumbs.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_MICROSOFT_TEAMS",
    connectKind: "oauth",
    primaryTools: ["MICROSOFT_TEAMS_SEARCH_MESSAGES", "MICROSOFT_TEAMS_LIST_CHANNEL_MESSAGES"],
    sourceTypes: ["chat", "meeting", "handoff"],
    triggerExamples: ["Channel message matches scope", "Thread decision posted", "Meeting note created"],
    ingestionPolicy: "Extract decisions and open questions from collaboration streams with channel/thread provenance."
  },
  {
    id: "zendesk",
    toolkitSlug: "zendesk",
    label: "Zendesk",
    category: "support",
    categoryLabel: "Support & tickets",
    description: "Tickets, tenant issues, customer support notes, SLA state, and escalation history.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_ZENDESK",
    connectKind: "oauth",
    primaryTools: ["ZENDESK_SEARCH_TICKETS", "ZENDESK_GET_TICKET"],
    sourceTypes: ["ticket", "comment"],
    triggerExamples: ["Ticket created", "Ticket status changed", "Comment added"],
    ingestionPolicy: "Track open issues, status, SLA risk, and tenant-facing history."
  },
  {
    id: "intercom",
    toolkitSlug: "intercom",
    label: "Intercom",
    category: "support",
    categoryLabel: "Support & tickets",
    description: "Customer conversations, support inbox threads, account notes, and escalation state.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_INTERCOM",
    connectKind: "oauth",
    primaryTools: ["INTERCOM_SEARCH_CONVERSATIONS", "INTERCOM_GET_CONVERSATION"],
    sourceTypes: ["conversation", "comment", "customer"],
    triggerExamples: ["Conversation updated", "New reply", "Escalation note added"],
    ingestionPolicy: "Convert support conversations into trajectory facts and risk flags."
  },
  {
    id: "jira",
    toolkitSlug: "jira",
    label: "Jira",
    category: "work",
    categoryLabel: "Work tracking",
    description: "Engineering or operations tickets, incidents, backlog items, status, owners, and blockers.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_JIRA",
    connectKind: "oauth",
    primaryTools: ["JIRA_SEARCH_ISSUES", "JIRA_GET_ISSUE"],
    sourceTypes: ["issue", "project", "comment"],
    triggerExamples: ["Issue updated", "Status changed", "Blocker added"],
    ingestionPolicy: "Treat task systems as trajectory context: what is open, blocked, assigned, or shipped."
  },
  {
    id: "linear",
    toolkitSlug: "linear",
    label: "Linear",
    category: "work",
    categoryLabel: "Work tracking",
    description: "Product/engineering issues, cycles, owners, labels, status, and execution history.",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_LINEAR",
    connectKind: "oauth",
    primaryTools: ["LINEAR_SEARCH_ISSUES", "LINEAR_GET_ISSUE"],
    sourceTypes: ["issue", "cycle", "comment"],
    triggerExamples: ["Issue updated", "Cycle changed", "Comment added"],
    ingestionPolicy: "Use issue trackers to maintain project trajectory and unblock agent planning."
  }
];

function env(name: string) {
  return process.env[name];
}

export function composioApiKey() {
  return env("COMPOSIO_API_KEY");
}

export function authConfigIdFor(toolkitSlug: string) {
  const item = integrationCatalog.find((candidate) => candidate.toolkitSlug === toolkitSlug);
  if (!item?.authConfigEnv) return undefined;
  return env(item.authConfigEnv);
}

export function composioMissingEnv(toolkitSlug?: string) {
  const missing: string[] = [];
  if (!composioApiKey()) missing.push("COMPOSIO_API_KEY");
  if (toolkitSlug) {
    const item = integrationCatalog.find((candidate) => candidate.toolkitSlug === toolkitSlug);
    if (item?.connectKind === "oauth" && item.authConfigEnv && !authConfigIdFor(toolkitSlug)) {
      missing.push(item.authConfigEnv);
    }
  }
  return missing;
}

async function composioFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = composioApiKey();
  if (!apiKey) throw new Error("COMPOSIO_API_KEY is not configured.");
  const response = await fetch(`https://backend.composio.dev/api/v3.1${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      ...(init?.headers ?? {})
    }
  });
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Composio request failed: ${response.status}`);
  }
  return payload;
}

export async function createComposioConnectLink(input: {
  userId: string;
  toolkitSlug: string;
  callbackUrl: string;
}) {
  const authConfigId = authConfigIdFor(input.toolkitSlug);
  if (!authConfigId) {
    throw new Error(`Missing auth config for ${input.toolkitSlug}.`);
  }
  return composioFetch<{
    link_token: string;
    redirect_url: string;
    expires_at: string;
    connected_account_id: string;
  }>("/connected_accounts/link", {
    method: "POST",
    body: JSON.stringify({
      auth_config_id: authConfigId,
      user_id: input.userId,
      alias: `context-surgeon-${input.toolkitSlug}`,
      callback_url: input.callbackUrl
    })
  });
}

export async function executeComposioTool(input: {
  userId: string;
  toolSlug: string;
  connectedAccountId?: string;
  args: Record<string, unknown>;
}) {
  return composioFetch<Record<string, unknown>>(`/tools/execute/${input.toolSlug}`, {
    method: "POST",
    body: JSON.stringify({
      connected_account_id: input.connectedAccountId,
      user_id: input.userId,
      userId: input.userId,
      arguments: input.args,
      version: "latest"
    })
  });
}

export async function listComposioConnectedAccounts(userId: string, toolkitSlugs?: string[]) {
  const params = new URLSearchParams();
  params.set("user_ids", userId);
  params.set("limit", "50");
  if (toolkitSlugs?.length) {
    for (const slug of toolkitSlugs) params.append("toolkit_slugs", slug);
  }
  return composioFetch<{
    items?: Array<{
      id?: string;
      nanoid?: string;
      status?: string;
      toolkit?: { slug?: string; name?: string };
      auth_config?: { id?: string };
      created_at?: string;
      updated_at?: string;
    }>;
  }>(`/connected_accounts?${params.toString()}`);
}

export async function disableComposioConnectedAccount(connectionId: string) {
  return composioFetch<{ success?: boolean }>(`/connected_accounts/${connectionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ enabled: false })
  });
}

export function toolArgumentsFor(toolkitSlug: string, propertyName: string) {
  const query = `${propertyName} roof leak vendor owner invoice approval`;
  if (toolkitSlug === "gmail") return { query, max_results: 10, limit: 10 };
  if (toolkitSlug === "outlook") return { search: query, top: 10, limit: 10 };
  if (toolkitSlug === "hubspot") return { query: propertyName, limit: 10 };
  if (toolkitSlug === "salesforce") return { query: propertyName, limit: 10 };
  if (toolkitSlug === "googledrive") return { query: propertyName, pageSize: 10, limit: 10 };
  if (toolkitSlug === "one_drive" || toolkitSlug === "dropbox" || toolkitSlug === "share_point") {
    return { query: propertyName, limit: 10 };
  }
  if (toolkitSlug === "notion" || toolkitSlug === "googlesheets") return { query: propertyName, limit: 10 };
  if (toolkitSlug === "slack") return { query, count: 10, limit: 10 };
  if (toolkitSlug === "microsoft_teams") return { query, limit: 10 };
  if (toolkitSlug === "zendesk" || toolkitSlug === "intercom") return { query, limit: 10 };
  if (toolkitSlug === "jira" || toolkitSlug === "linear") return { query, limit: 10 };
  return { query, limit: 10 };
}

export function demoConnections() {
  return integrationCatalog.map<IntegrationConnection>((item) => {
    const activeToolkits = ["manual_upload", "gmail", "hubspot", "googledrive", "slack", "zendesk"];
    const activeIndex = activeToolkits.indexOf(item.toolkitSlug);
    const active = activeIndex >= 0;
    return {
      id: `demo-${item.toolkitSlug}`,
      toolkitSlug: item.toolkitSlug,
      label: item.label,
      status: item.connectKind === "manual_upload" || active ? "connected" : composioMissingEnv(item.toolkitSlug).length ? "needs_config" : "available",
      accountLabel: active ? `demo-${item.toolkitSlug}@contextsurgeon.io` : undefined,
      lastSyncAt: active ? new Date(Date.now() - (activeIndex + 1) * 3600_000).toISOString() : undefined,
      sourceCount: active ? Math.max(1, 7 - activeIndex) : 0,
      factCount: active ? Math.max(2, 12 - activeIndex) : 0,
      setupMissing: composioMissingEnv(item.toolkitSlug)
    };
  });
}

export function buildDemoSync(toolkits: string[]): IntegrationSyncResult {
  const selected = toolkits.length > 0 ? toolkits : ["gmail", "hubspot", "googledrive"];
  const generatedAt = new Date().toISOString();
  const sources: IntegrationSyncSource[] = selected.flatMap((toolkit) => {
    const item = integrationCatalog.find((candidate) => candidate.toolkitSlug === toolkit);
    if (toolkit === "manual_upload") {
      return [
        {
          id: "manual-upload-building-minutes",
          toolkitSlug: toolkit,
          title: "Uploaded WEG minutes and contractor packet",
          sourceType: "manual_file",
          timestamp: generatedAt,
          confidence: 0.91,
          summary: "Manual upload confirms the approved emergency procedure and names the preferred sealing vendor.",
          facts: [
            {
              predicate: "meeting.decision",
              value: "emergency sealing can proceed before full vote",
              quote: "Urgent water ingress mitigation may be commissioned immediately."
            },
            {
              predicate: "vendor.preferred",
              value: "TempSeal GmbH",
              quote: "TempSeal remains the preferred emergency roof sealing contractor."
            }
          ]
        }
      ];
    }
    if (toolkit === "gmail" || toolkit === "outlook") {
      return [
        {
          id: `${toolkit}-owner-approval`,
          toolkitSlug: toolkit,
          title: "Owner approval thread: roof emergency sealing",
          sourceType: "email",
          timestamp: generatedAt,
          confidence: 0.94,
          summary: "Owner rejects stale roof quote and approves emergency temporary sealing with TempSeal.",
          facts: [
            {
              predicate: "roof.vendor.approved",
              value: "TempSeal GmbH",
              quote: "Please proceed with TempSeal today; the old quote is rejected."
            },
            {
              predicate: "roof.repair.status",
              value: "emergency_sealing_approved",
              quote: "Treat the leak as urgent and seal before the next rain."
            }
          ]
        }
      ];
    }
    if (toolkit === "hubspot" || toolkit === "salesforce") {
      return [
        {
          id: `${toolkit}-owner-record`,
          toolkitSlug: toolkit,
          title: "Owner account record: Sonnenallee 44 WEG",
          sourceType: "crm_account",
          timestamp: generatedAt,
          confidence: 0.89,
          summary: "CRM confirms the decision owner, preferred escalation route, and billing contact.",
          facts: [
            {
              predicate: "owner.escalation_contact",
              value: "Miriam Voss",
              quote: "Primary escalation owner for building decisions."
            },
            {
              predicate: "billing.approval_threshold",
              value: "EUR 5,000",
              quote: "Emergency roof and heating work pre-approved up to EUR 5,000."
            }
          ]
        }
      ];
    }
    if (item?.category === "collaboration") {
      return [
        {
          id: `${toolkit}-handoff-thread`,
          toolkitSlug: toolkit,
          title: "Operations handoff: roof leak escalation",
          sourceType: "chat",
          timestamp: generatedAt,
          confidence: 0.84,
          summary: "Collaboration thread confirms the leak is active, the tenant prefers email, and TempSeal dispatch is unblocked.",
          facts: [
            {
              predicate: "tenant.communication_preference",
              value: "email_first",
              quote: "Please email first; phone only if dispatch timing changes."
            },
            {
              predicate: "dispatch.blocker",
              value: "none",
              quote: "Owner approval is in; dispatch can be scheduled."
            }
          ]
        }
      ];
    }
    if (item?.category === "support") {
      return [
        {
          id: `${toolkit}-support-ticket`,
          toolkitSlug: toolkit,
          title: "Tenant support ticket: active roof leak",
          sourceType: "ticket",
          timestamp: generatedAt,
          confidence: 0.88,
          summary: "Support thread confirms issue severity, tenant availability, and open communication state.",
          facts: [
            {
              predicate: "tenant_issue.status",
              value: "open_urgent",
              quote: "Water is still entering during rain; tenant is available after 16:00."
            }
          ]
        }
      ];
    }
    if (item?.category === "work") {
      return [
        {
          id: `${toolkit}-work-item`,
          toolkitSlug: toolkit,
          title: "Operations work item: roof incident follow-through",
          sourceType: "issue",
          timestamp: generatedAt,
          confidence: 0.82,
          summary: "Work tracker preserves task owner, status, and blocked/unblocked state for agent planning.",
          facts: [
            {
              predicate: "operations_task.status",
              value: "ready_for_dispatch",
              quote: "Task is unblocked once owner approval email is attached."
            }
          ]
        }
      ];
    }
    return [
      {
        id: `${toolkit}-handover-doc`,
        toolkitSlug: toolkit,
        title: "Building handover folder: vendor and maintenance docs",
        sourceType: "document",
        timestamp: generatedAt,
        confidence: 0.87,
        summary: "Document workspace contains the latest vendor list and handover procedure.",
        facts: [
          {
            predicate: "maintenance.handover.folder",
            value: "current",
            quote: "Sonnenallee 44 operational handover, updated this quarter."
          }
        ]
      }
    ];
  });

  return {
    ok: true,
    mode: composioApiKey() ? "live" : "demo",
    workspaceId: "sonnenallee-44-live-mode",
    selectedToolkits: selected,
    generatedAt,
    summary: `${sources.length} app-derived sources normalized into the same SourceDocument -> Fact -> VFS pipeline.`,
    sources,
    nextActions: [
      "Run source relevance classifier against imported app records.",
      "Extract source-grounded facts and conflicts from connected app data.",
      "Propose a Fact Patch for context.md instead of regenerating the file.",
      "Expose the compiled VFS through API and Qontext-ready export."
    ],
    composio: {
      configured: Boolean(composioApiKey()),
      attemptedLiveTools: selected
        .map((toolkit) => integrationCatalog.find((item) => item.toolkitSlug === toolkit)?.primaryTools[0])
        .filter((tool): tool is string => Boolean(tool)),
      missing: Array.from(new Set(selected.flatMap((toolkit) => composioMissingEnv(toolkit))))
    }
  };
}
