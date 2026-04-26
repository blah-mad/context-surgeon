export const qontextDatasetProof = {
  company: "Inazuma.co",
  source: "Qontext hackathon dataset",
  datasetPath: "/Users/blah_mad/Downloads/qontext_Dataset",
  note:
    "No Qontext account is required or used. Context Surgeon compiles the supplied raw company data into a Qontext-style context repository surface.",
  rawInputs: [
    { domain: "Business and Management", records: 800, examples: ["clients.json", "vendors.json"] },
    { domain: "CRM", records: 14951, examples: ["customers.json", "products.json", "sales.json"] },
    { domain: "Customer Support", records: 1000, examples: ["customer_support_chats.json"] },
    { domain: "Product Sentiment", records: 13510, examples: ["product_sentiment.json"] },
    { domain: "Enterprise Mail", records: 11928, examples: ["emails.json"] },
    { domain: "Collaboration", records: 2897, examples: ["conversations.json"] },
    { domain: "HR", records: 96884, examples: ["employees.json", "resume_information.csv"] },
    { domain: "IT Service", records: 163, examples: ["it_tickets.json"] },
    { domain: "Engineering Workspace", records: 750, examples: ["Workspace/GitHub/GitHub.json"] },
    { domain: "Policy Documents", records: 24, examples: ["Information Security", "AUP", "SDLC", "Leave Policy"] },
    { domain: "Inazuma Overflow", records: 10823, examples: ["overflow.json"] },
    { domain: "Order PDFs", records: 267, examples: ["invoice_*.pdf", "purchase_order_*.pdf", "shipping_order_*.pdf"] }
  ],
  virtualFileSystem: [
    {
      path: "/company/inazuma/context.md",
      title: "Company Operating Context",
      purpose: "Dense executive context for AI agents and humans."
    },
    {
      path: "/company/inazuma/static/customers.md",
      title: "Customers and Revenue",
      purpose: "Static customer, product, sales, and order memory."
    },
    {
      path: "/company/inazuma/static/employees.md",
      title: "Employees and Roles",
      purpose: "Employee directory, HR relationships, resumes, ownership references."
    },
    {
      path: "/company/inazuma/procedures/policies.md",
      title: "Policy Repository",
      purpose: "Procedural company rules from policy PDFs."
    },
    {
      path: "/company/inazuma/trajectory/projects.md",
      title: "Projects and Progress",
      purpose: "Trajectory memory from mail, collaboration, GitHub, support, and IT tickets."
    },
    {
      path: "/company/inazuma/graph/facts.jsonl",
      title: "Fact Ledger",
      purpose: "Fact-level provenance graph for retrieval and validation."
    },
    {
      path: "/company/inazuma/review/conflicts.md",
      title: "Human Review Queue",
      purpose: "Ambiguities and conflicts that matter enough for a human."
    }
  ],
  graphSummary: {
    entityTypes: ["employee", "customer", "vendor", "product", "policy", "ticket", "repository", "conversation", "order"],
    edgeTypes: ["owns", "mentioned_in", "requested_by", "assigned_to", "purchased", "governed_by", "conflicts_with", "supersedes"],
    provenanceGranularity: "fact -> source record -> source file/path -> quote/span",
    updateMechanic: "new/changed source records produce fact patches instead of destructive context regeneration"
  },
  challengeFit: [
    "Starts with company data, not an agent.",
    "Produces a virtual file system plus graph.",
    "Preserves references inside files and back to source records.",
    "Separates static, procedural, and trajectory knowledge.",
    "Uses human review only where ambiguity matters.",
    "Optimizes for long-term maintainability by humans and machines."
  ]
};
