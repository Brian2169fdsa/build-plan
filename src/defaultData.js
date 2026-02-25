export function getDefaultData() {
  return {
    clientName: "New Client",
    solutionName: "Solution Name",
    version: "1.0",
    stack: "Claude + Make.com",
    confidentialLine: "Prepared for Client Name",
    businessObjective: "Describe the business objective and what this AI automation solution does for the client.",
    metrics: [
      { num: "0", label: "Metric 1", icon: "📄" },
      { num: "0", label: "Metric 2", icon: "⏱️" },
      { num: "0", label: "Metric 3", icon: "⬇️" },
      { num: "0", label: "Metric 4", icon: "💰" },
      { num: "$0", label: "Custom code required", icon: "✅" },
    ],
    inScope: ["Scope item 1", "Scope item 2", "Scope item 3"],
    outOfScope: ["Exclusion 1", "Exclusion 2", "Exclusion 3"],
    calloutTitle: "Key Callout Title",
    calloutBody: "Describe the key architectural or design decision that matters most to this client.",
    accounts: [
      { name: "Anthropic (Claude API)", setup: "Create account at console.anthropic.com. Generate API key. Fund ~$50 initial credits.", connection: "HTTP module with API key in headers", icon: "🧠" },
      { name: "Make.com", setup: "Core plan ($10.99/mo). 10,000 operations. Assign to client team workspace.", connection: "Orchestration platform (N/A)", icon: "⚙️" },
    ],
    costs: [
      { resource: "Claude Sonnet (input)", unit: "$3.00 / 1M tokens", usage: "~0K tokens/run × 0", monthly: "0.00" },
      { resource: "Claude Sonnet (output)", unit: "$15.00 / 1M tokens", usage: "~0K tokens/run × 0", monthly: "0.00" },
      { resource: "Make.com (Core)", unit: "$10.99/month", usage: "~0 ops/run × 0", monthly: "10.99" },
    ],
    integrations: [
      { system: "Make.com", role: "Automation orchestration", phase: "1", icon: "⚙️" },
      { system: "Claude (Anthropic API)", role: "AI processing", phase: "1", icon: "🧠" },
    ],
    timeline: [
      { week: "0–1", focus: "Discovery + Design", deliverables: "Accounts created & connected. Folder mapping confirmed. Schema locked." },
      { week: "2–3", focus: "Phase 1 MVP", deliverables: "Core scenarios functional. PM review loops working." },
      { week: "4–6", focus: "Phase 2 MVP", deliverables: "Extended scenarios. UAT on pilot." },
      { week: "7–8", focus: "Hardening", deliverables: "Error handling. Training. Production readiness." },
    ],
    promptRules: [
      { title: "NO INVENTED DATA", desc: "Only use information from source documents. Flag missing info with [NEEDS_PM_DECISION]. Never invent scope or commercial terms." },
      { title: "SOURCE TRANSPARENCY", desc: "Cite sources for every field populated. Reference document, section, and page." },
      { title: "STRICT SCHEMA", desc: "Always output valid JSON matching the provided schema. No extra keys, no missing required fields." },
    ],
    schemas: [
      { name: "Intake_Record", fields: 10, used: "SC-01", desc: "Primary structured output schema", arrays: ["sources_used", "flags"] },
    ],
    scenarios: [
      {
        id: "SC-01",
        name: "Scenario 1",
        modules: 5,
        trigger: "Manual trigger or webhook",
        purpose: "Describe what this scenario does and why.",
        details: "Detailed description of the scenario flow, inputs, outputs, and edge cases.",
        moduleList: ["Trigger / Webhook", "Get file from source", "Send to Claude API", "Parse JSON response", "Save output"]
      },
    ],
    folderMappings: [
      { content: "Source files", find: "Where source files live in SharePoint/Drive", variable: "VAR_SOURCE_PATH" },
      { content: "Output files", find: "Where outputs are saved", variable: "VAR_OUTPUT_PATH" },
      { content: "Templates", find: "Where templates are stored", variable: "VAR_TEMPLATE_PATH" },
    ],
    systemFolders: [
      { folder: "/00_Admin/", purpose: "Status files, logs, config" },
      { folder: "/01_Outputs/", purpose: "Generated outputs and drafts" },
      { folder: "/02_Templates/", purpose: "Master templates (read-only)" },
    ],
    makeVars: [
      { name: "CLAUDE_MODEL", purpose: "Claude model identifier", example: "claude-sonnet-4-5-20250929" },
      { name: "ANTHROPIC_KEY", purpose: "Anthropic API key", example: "sk-ant-..." },
      { name: "SOURCE_PATH", purpose: "Path to source files", example: "/Sites/Project/Docs/" },
    ],
    permissions: [
      { area: "Claude API", level: "Scoped", scope: "Solution-specific prompts only — no general-purpose access" },
      { area: "Source Files", level: "Read", scope: "Project folders only" },
      { area: "Output Folder", level: "Read/Write", scope: "Output directory only" },
    ],
    errorHandling: [
      { trigger: "API timeout or 5xx", response: "Retry up to 2x with exponential backoff. If still failing, save partial state + notify user.", severity: "warning" },
      { trigger: "Invalid JSON from Claude", response: "Retry with stricter prompt reinforcement. If second attempt fails, save raw output for manual review.", severity: "danger" },
      { trigger: "Source file not found", response: "Log missing path. Skip file. Flag in output as [FILE_NOT_FOUND]. Do not halt pipeline.", severity: "warning" },
    ],
    guardrails: [
      "Never invent missing data — flag for human decision",
      "Maintain version control on all outputs",
      "Human review required before any external action",
    ],
    frRequirements: [
      { id: "FR 1.1", title: "Intake + Extraction", desc: "Extract structured data from source documents. Normalize into JSON.", icon: "📥", scenario: "SC-01" },
      { id: "FR 1.2", title: "AI Processing", desc: "Send structured data to Claude. Receive and validate response.", icon: "🧠", scenario: "SC-01" },
      { id: "FR 1.3", title: "Output Generation", desc: "Generate output document from AI response. Save to correct location.", icon: "📄", scenario: "SC-01" },
      { id: "FR 1.4", title: "Human Review Gate", desc: "Notify reviewer. Await approval before proceeding.", icon: "👤", scenario: "SC-01" },
    ],
    bestDo: [
      "Test with representative data before going live to calibrate prompt quality",
      "Confirm file paths with the actual user who manages them — not assumptions",
      "Keep system prompts versioned so you can roll back if quality drops",
      "Review AI flags weekly for the first month to tune sensitivity",
    ],
    bestDont: [
      "Don't skip the human review gate — even if outputs look perfect, sign-off is required",
      "Don't store API keys in scenario modules — use Make.com variables",
      "Don't assume input format is consistent — build for variance",
      "Don't ignore [NEEDS_PM_DECISION] tags in outputs — these are not optional",
    ],
    openQuestions: [
      { q: "File path locations", detail: "Where exactly do source files live? Map during discovery." },
      { q: "Output naming convention", detail: "What file naming pattern is preferred for outputs?" },
      { q: "Review workflow", detail: "Who reviews outputs and how do they approve them?" },
    ],
  };
}