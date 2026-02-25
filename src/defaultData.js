export function getDefaultData() {
  return {
    clientName: "New Client",
    solutionName: "Solution Name",
    version: "1.0",
    stack: "Claude + Make.com",
    confidentialLine: "Prepared for Client Name",
    systemPromptText: "You are the AI assistant for this solution.\n\nDefine your system prompt rules here. Each rule should be numbered and titled.\n\n1. RULE ONE: Description of first rule.\n\n2. RULE TWO: Description of second rule.",
    scopeIn: ["Scope item 1", "Scope item 2", "Scope item 3"],
    scopeOut: ["Exclusion 1", "Exclusion 2"],
    calloutTitle: "Key Callout Title",
    calloutBody: "Describe the key architectural or design decision that matters most to this client.",
    accounts: [
      { name: "Anthropic (Claude API)", setup: "Create account at console.anthropic.com. Generate API key. Fund ~$50 initial credits.", connection: "HTTP module with API key in headers", icon: "\u{1F9E0}", color: "#7C5CFC" },
      { name: "Make.com", setup: "Core plan ($10.99/mo). 10,000 operations. Assign to client team workspace.", connection: "Orchestration platform \u2014 no separate connection needed", icon: "\u2699\uFE0F", color: "#4A8FD6" },
    ],
    spFolders: [
      { content: "Source files", find: "Where source files live in SharePoint/Drive", variable: "VAR_SOURCE_PATH", color: "#4A8FD6" },
      { content: "Output files", find: "Where outputs are saved", variable: "VAR_OUTPUT_PATH", color: "#7C5CFC" },
      { content: "Templates", find: "Where templates are stored", variable: "VAR_TEMPLATE_PATH", color: "#1AA8A8" },
    ],
    trainingRows: [
      { num: 1, name: "Scenario 1", type: "Workflow", tools: "Make.com, Claude API", trigger: "Manual trigger or webhook", inputs: "Describe inputs for this training row.", outputs: "Describe expected outputs.", typeColor: "#4A8FD6" },
    ],
    scenarios: [
      {
        id: "SC-01",
        name: "Scenario 1",
        trigger: "Manual trigger or webhook",
        purpose: "Describe what this scenario does and why.",
        icon: "\uD83D\uDCCB",
        modules: 5,
        type: "auto",
        claude: false,
        details: "Detailed description of the scenario flow, inputs, outputs, and edge cases.",
        frMap: ["Feature 1"],
        moduleList: ["Trigger / Webhook", "Get file from source", "Send to Claude API", "Parse JSON response", "Save output"],
        template: null,
      },
    ],
    systemPromptRules: [
      { num: 1, title: "NO INVENTED DATA", desc: "Only use information from source documents passed to you. If information is missing, output a placeholder and flag it.", color: "#E04848" },
      { num: 2, title: "SOURCE TRANSPARENCY", desc: "For every content block, include sources_used[] referencing source file names. Never cite a source you were not given.", color: "#22A860" },
      { num: 3, title: "STRICT SCHEMA", desc: "Always output valid JSON matching the schema provided. No extra keys, no missing required fields.", color: "#4A8FD6" },
    ],
    jsonSchemas: [
      { name: "Schema_Name", fields: 10, used: "SC-01", desc: "Primary structured output schema", arrays: ["sources_used", "flags"] },
    ],
    makeVars: [
      { name: "CLAUDE_MODEL", purpose: "Claude model identifier", example: "claude-sonnet-4-5-20250929" },
      { name: "ANTHROPIC_KEY", purpose: "Anthropic API key", example: "sk-ant-..." },
      { name: "SOURCE_PATH", purpose: "Path to source files", example: "/Documents/Source/" },
    ],
    conditionalLogic: [
      { scenario: "SC-01", condition: "Condition to evaluate", action: "Action if condition is true...", elseAction: "Action if condition is false...", color: "#E8723A" },
    ],
    errorHandling: [
      { trigger: "API timeout or 5xx", response: "Retry up to 2x with exponential backoff. If still failing, save partial state and notify user.", severity: "warning" },
      { trigger: "Invalid JSON from Claude", response: "Retry with stricter prompt reinforcement. If second attempt fails, save raw output for manual review.", severity: "danger" },
    ],
    guardrails: [
      "Never invent missing data \u2014 flag for human decision",
      "Human review required before any external action",
      "Never store API keys in scenario module fields \u2014 use Make.com team variables only",
    ],
    operationalBP: [
      {
        category: "Workflow Operations",
        icon: "\uD83D\uDCDD",
        color: "#4A8FD6",
        items: [
          { label: "Test with representative data before going live", detail: "Calibrate prompt quality with real examples before enabling production triggers.", type: "do" },
          { label: "Confirm file paths with the actual user who manages them", detail: "Do not assume folder structure. Map during discovery.", type: "do" },
          { label: "Don't skip human review gates", detail: "Even if outputs look perfect, sign-off is required before any downstream action.", type: "dont" },
        ],
      },
    ],
    buildBP: [
      {
        category: "Prompt Architecture",
        icon: "\u{1F9E0}",
        color: "#7C5CFC",
        items: [
          { label: "Always version your system prompt", detail: "Name prompts V1, V2, etc. Store in Make.com data store or variable. Roll back if quality drops.", type: "do" },
          { label: "Separate system prompt from user message", detail: "System prompt sets rules. User message contains task, schema, and source documents. Never mix them.", type: "do" },
          { label: "Don't prompt for multiple output formats in one call", detail: "If you need both a summary and full JSON, make two calls. Mixing degrades schema compliance.", type: "dont" },
        ],
      },
    ],
  };
}
