/* =========================================================================
 * CONVERGE2 — Signal Canvas
 * Sample intelligence dataset (demo). Replace with your own feed.
 * Loaded as a plain <script> so the app runs from file:// with no server.
 * ========================================================================= */
window.CONVERGE2_DATA = {
  meta: {
    product: "CONVERGE2",
    subtitle: "Signal Canvas",
    idea: "What could agentic AI payments and autonomous procurement mean for Malaysian SMEs over the next three years?",
    horizon: "2026 → 2029",
    generated: "2026-09-15",
    pipeline: ["SEE", "UNDERSTAND", "FORESEE", "DECIDE", "ACT"],
  },

  /* Per-scenario assumption profiles. The segmented control in the top bar
     swaps these; every derived number (confidence, radar, impact, foresight
     weight) is recomputed from them. The sliders in the Simulation panel
     blend on top of the active profile. */
  scenarios: [
    {
      id: "base", label: "Base",
      blurb: "Assisted adoption. Agents draft, humans approve.",
      profile: { adoption: 0.55, certainty: 0.60, capital: 0.55 },
    },
    {
      id: "optimistic", label: "Optimistic",
      blurb: "Autonomous spend enclaves become normal.",
      profile: { adoption: 0.82, certainty: 0.68, capital: 0.78 },
    },
    {
      id: "conservative", label: "Conservative",
      blurb: "Trust incidents slow agentic spend sharply.",
      profile: { adoption: 0.30, certainty: 0.44, capital: 0.35 },
    },
  ],

  /* ---------------------------------------------------------------------
   * SIGNAL INBOX  (Engine 1 — Signal)
   * priority: P0..P3   quality: FACT|INFERENCE|HYPOTHESIS|SPECULATION
   * ------------------------------------------------------------------- */
  signals: [
    {
      id: "S1", priority: "P0", quality: "FACT", confidence: "High",
      date: "2026-09-09", source: "Regional central-bank working paper (primary)",
      title: "Two APAC banks pilot agent-initiated B2B payments with programmatic authorization",
      why: "Agent-to-agent settlement moves from demo to supervised rails. Whoever owns authorization owns the chokepoint where SME spend actually happens.",
      entities: ["AGENTS", "PAYRAILS", "BANKS"],
      themes: ["Agentic commerce", "Payment rails"],
    },
    {
      id: "S2", priority: "P0", quality: "FACT", confidence: "High",
      date: "2026-09-05", source: "LHDN / MyInvois portal (government)",
      title: "MyInvois e-invoicing phase extends to SMEs under RM500k turnover",
      why: "Mandated structured invoices create the machine-readable substrate agents need. Compliance becomes the Trojan horse for automation.",
      entities: ["MYINVOIS", "SMES", "COMPLIANCE"],
      themes: ["Regulation", "Digital rails"],
    },
    {
      id: "S3", priority: "P1", quality: "FACT", confidence: "High",
      date: "2026-08-28", source: "Vendor release notes (primary)",
      title: "Major agent frameworks ship native tool-use and payment connectors",
      why: "The integration tax collapses. Any SME tool with an API becomes reachable by an agent in weeks, not quarters.",
      entities: ["AGENTS", "OPENBANK", "PAYRAILS"],
      themes: ["Technology"],
    },
    {
      id: "S4", priority: "P1", quality: "FACT", confidence: "Medium",
      date: "2026-08-21", source: "Industry regulator briefing",
      title: "Open-banking sandbox widens to SME lending and payment initiation",
      why: "Bank data and payment rails open to third parties — the precondition for agent-run working capital.",
      entities: ["OPENBANK", "BANKS", "SMES"],
      themes: ["Open banking"],
    },
    {
      id: "S5", priority: "P2", quality: "FACT", confidence: "Medium",
      date: "2026-08-14", source: "MDEC / grant portal (government)",
      title: "Digitalisation grant eligibility broadens for micro and small firms",
      why: "Cheap capital for tooling lowers the adoption floor; the grant becomes a distribution channel.",
      entities: ["MDEC", "SMES"],
      themes: ["Capital", "Adoption"],
    },
    {
      id: "S6", priority: "P1", quality: "INFERENCE", confidence: "Medium",
      date: "2026-08-30", source: "Industry procurement survey (secondary)",
      title: "Roughly two-thirds of SME indirect spend still runs through manual, email-based cycles",
      why: "Large addressable inefficiency, but the buyer is the owner — value must be obvious in weeks, not quarters.",
      entities: ["SMES", "PROCURE", "SUPPLY"],
      themes: ["Procurement", "SME operations"],
    },
    {
      id: "S7", priority: "P0", quality: "HYPOTHESIS", confidence: "Low",
      date: "2026-09-11", source: "Security research community",
      title: "Attackers begin experimenting with prompt-injected payment instructions against agent workflows",
      why: "Autonomy without authorization guardrails converts a convenience feature into a direct loss channel. Trust is the real bottleneck.",
      entities: ["FRAUD", "PAYRAILS", "AGENTS", "COMPLIANCE"],
      themes: ["Security", "Trust"],
    },
    {
      id: "S8", priority: "P2", quality: "INFERENCE", confidence: "Medium",
      date: "2026-08-19", source: "Regional job-market data (secondary)",
      title: "AI-operations talent supply tightens across Southeast Asia",
      why: "Adoption is gated by the people who can supervise agents and wire guardrails, not by the models.",
      entities: ["TALENT", "SMES", "AGENTS"],
      themes: ["Talent", "Adoption"],
    },
  ],

  /* ---------------------------------------------------------------------
   * ENTITY / RELATIONSHIP MODEL  (Engine 2 — Intelligence + ARCC layer)
   * type drives colour: entity|technology|market|regulation|risk|
   *                     opportunity|capital|talent
   * ------------------------------------------------------------------- */
  nodes: [
    { id: "SMES",        label: "Malaysian SMEs",              type: "market",      ecosystem: "SME Economy",  core: true },
    { id: "AGENTS",      label: "AI Agents",                   type: "technology",  ecosystem: "AI Layer" },
    { id: "PAYRAILS",    label: "Agentic Payment Rails",       type: "technology",  ecosystem: "Fintech" },
    { id: "OPENBANK",    label: "Open Banking APIs",           type: "technology",  ecosystem: "Fintech" },
    { id: "MYINVOIS",    label: "LHDN MyInvois e-Invoicing",   type: "regulation",  ecosystem: "Regulation" },
    { id: "COMPLIANCE",  label: "PDPA & Data Regime",          type: "regulation",  ecosystem: "Regulation" },
    { id: "MDEC",        label: "MDEC Digitalisation Grant",   type: "capital",     ecosystem: "Public Capital" },
    { id: "PROCURE",     label: "Procurement Automation SaaS",  type: "opportunity", ecosystem: "Venture Opportunities" },
    { id: "CASHFLOW",    label: "SME Cashflow Copilot",        type: "opportunity", ecosystem: "Venture Opportunities" },
    { id: "AGENTMKT",    label: "Local Agent Marketplace",     type: "opportunity", ecosystem: "Venture Opportunities" },
    { id: "BANKS",       label: "Malaysian Banks",             type: "entity",      ecosystem: "Finance" },
    { id: "SUPPLY",      label: "Regional Supply Chains",      type: "market",      ecosystem: "Trade" },
    { id: "FRAUD",       label: "Agent Fraud & Auth Risk",     type: "risk",        ecosystem: "Trust & Risk" },
    { id: "CONCENTRATION", label: "Provider Concentration",    type: "risk",        ecosystem: "Trust & Risk" },
    { id: "TALENT",      label: "AI-Ops Talent Gap",           type: "talent",      ecosystem: "People", risk: true },
  ],

  /* edges: strength 0-100, confidence, per-relationship evidence */
  edges: [
    { source: "AGENTS", target: "SMES", type: "adoption", strength: 72, confidence: "Medium", count: 4, period: "2026-07-01 → 2026-09-11",
      evidence: "Agent frameworks and SME tooling are repeatedly co-mentioned in adoption research; the SME is framed as the beneficiary endpoint of agentic workflows." },
    { source: "PAYRAILS", target: "AGENTS", type: "technology", strength: 88, confidence: "High", count: 5, period: "2026-08-01 → 2026-09-11",
      evidence: "Every agentic-commerce release pairs a reasoning layer with a settlement mechanism; payment authorization is the recurring integration surface." },
    { source: "OPENBANK", target: "AGENTS", type: "technology", strength: 64, confidence: "Medium", count: 3, period: "2026-08-14 → 2026-09-05",
      evidence: "Sandbox expansion to payment initiation is the precondition for agents acting on bank-held accounts." },
    { source: "MYINVOIS", target: "SMES", type: "regulation", strength: 80, confidence: "High", count: 4, period: "2026-08-20 → 2026-09-05",
      evidence: "Mandated structured e-invoicing touches every SME above the phase threshold; explicitly scoped to turnover bands." },
    { source: "MYINVOIS", target: "PAYRAILS", type: "regulation", strength: 58, confidence: "Medium", count: 2, period: "2026-09-05 → 2026-09-09",
      evidence: "Structured invoice data is the natural input for machine-checked settlement; regulators and rails converge on the same standard." },
    { source: "MDEC", target: "SMES", type: "financing", strength: 55, confidence: "Medium", count: 2, period: "2026-08-14 → 2026-08-30",
      evidence: "Grant eligibility broadening is framed as lowering the cost of SME digital tooling." },
    { source: "BANKS", target: "SMES", type: "customer engagement", strength: 60, confidence: "Medium", count: 3, period: "2026-07-20 → 2026-09-01",
      evidence: "Incumbent banks remain the default SME financial counterparty; agentic layers must interoperate with them." },
    { source: "BANKS", target: "OPENBANK", type: "technology", strength: 66, confidence: "Medium", count: 3, period: "2026-08-14 → 2026-08-28",
      evidence: "Bank participation in open-banking sandboxes is the gate for third-party payment initiation." },
    { source: "PROCURE", target: "SMES", type: "opportunity", strength: 76, confidence: "Medium", count: 4, period: "2026-08-01 → 2026-09-05",
      evidence: "Procurement automation is repeatedly positioned as the highest-friction, highest-leverage SME back-office target." },
    { source: "PROCURE", target: "MYINVOIS", type: "distribution", strength: 52, confidence: "Medium", count: 2, period: "2026-09-05 → 2026-09-12",
      evidence: "Mandated e-invoicing doubles as a distribution wedge for procurement tooling that must already speak the format." },
    { source: "CASHFLOW", target: "SMES", type: "opportunity", strength: 68, confidence: "Medium", count: 3, period: "2026-08-10 → 2026-09-05",
      evidence: "Working-capital visibility is a recurring SME pain theme in agentic-finance coverage." },
    { source: "AGENTMKT", target: "SMES", type: "opportunity", strength: 61, confidence: "Low", count: 2, period: "2026-08-22 → 2026-09-08",
      evidence: "Localised agent marketplaces are emerging as the packaging layer for SME-facing capabilities." },
    { source: "FRAUD", target: "PAYRAILS", type: "risk", strength: 74, confidence: "Medium", count: 3, period: "2026-09-08 → 2026-09-11",
      evidence: "Security research explicitly links prompt injection to payment instruction manipulation." },
    { source: "FRAUD", target: "AGENTS", type: "risk", strength: 81, confidence: "Medium", count: 4, period: "2026-09-01 → 2026-09-11",
      evidence: "Autonomous tool-use is the attack surface; authorization boundaries are the mitigation repeatedly proposed." },
    { source: "CONCENTRATION", target: "PAYRAILS", type: "risk", strength: 59, confidence: "Low", count: 2, period: "2026-08-25 → 2026-09-09",
      evidence: "Few credible settlement providers create single-point dependency for SMEs that adopt early." },
    { source: "CONCENTRATION", target: "BANKS", type: "risk", strength: 44, confidence: "Low", count: 1, period: "2026-09-01 → 2026-09-09",
      evidence: "Incumbent concentration amplifies the impact of any agent-layer outage." },
    { source: "TALENT", target: "SMES", type: "risk", strength: 63, confidence: "Medium", count: 3, period: "2026-08-19 → 2026-09-08",
      evidence: "Adoption gated by supervision capacity rather than model capability." },
    { source: "COMPLIANCE", target: "AGENTS", type: "regulation", strength: 57, confidence: "Medium", count: 2, period: "2026-08-30 → 2026-09-10",
      evidence: "Data-protection regime shapes what agent context may contain." },
    { source: "COMPLIANCE", target: "SMES", type: "regulation", strength: 50, confidence: "Medium", count: 2, period: "2026-08-30 → 2026-09-10",
      evidence: "SMEs remain the accountable data controller when agents process customer data." },
    { source: "SUPPLY", target: "SMES", type: "supply chain", strength: 62, confidence: "Medium", count: 3, period: "2026-07-15 → 2026-09-02",
      evidence: "Trade exposure makes SME procurement a second-order agentic use case." },
    { source: "SUPPLY", target: "PROCURE", type: "distribution", strength: 49, confidence: "Low", count: 2, period: "2026-08-18 → 2026-09-02",
      evidence: "Supplier networks are the distribution path for procurement tooling." },
    { source: "AGENTMKT", target: "AGENTS", type: "technology", strength: 66, confidence: "Medium", count: 2, period: "2026-08-22 → 2026-09-08",
      evidence: "Marketplaces package general agent capability into SME-sized, priced units." },
  ],

  /* ---------------------------------------------------------------------
   * CONFIDENCE METER  (transparency layer, ORION-style)
   * ------------------------------------------------------------------- */
  confidence: {
    base: { completeness: 86, volatilityStability: 48, historical: 79 },
    note: "Proceed with caution. Internal evidence is robust; external market volatility and a low-confidence security signal pull the aggregate down.",
    drivers: [
      { label: "Data completeness", key: "completeness", tone: "green" },
      { label: "Market stability", key: "volatilityStability", tone: "amber" },
      { label: "Historical accuracy", key: "historical", tone: "blue" },
    ],
  },

  /* ---------------------------------------------------------------------
   * RISK & OPPORTUNITY RADAR  (polar, two overlays)
   * ------------------------------------------------------------------- */
  radar: {
    axes: ["Adoption", "Regulation", "Capital", "Technology", "Talent", "Trust"],
    opportunity: [70, 58, 62, 84, 40, 52],
    risk:        [44, 66, 38, 57, 72, 78],
    blips: [
      { label: "Payment-injection risk", kind: "risk",        axis: "Trust",    r: 0.86 },
      { label: "Undervalued procurement niche", kind: "opportunity", axis: "Adoption", r: 0.74 },
      { label: "Talent squeeze", kind: "risk", axis: "Talent", r: 0.70 },
    ],
  },

  /* ---------------------------------------------------------------------
   * FORESIGHT  (Engine 3) — three scenarios, never one future
   * ------------------------------------------------------------------- */
  foresight: {
    scenarios: [
      {
        key: "A", tag: "Most likely", confidence: "Medium-High", weight: 0.5,
        title: "Assisted Procurement",
        summary: "Agents prepare, humans approve. SMEs adopt agentic procurement through the accounting and invoicing tools they already trust, not through new point products.",
        drivers: ["Mandated e-invoicing", "Cheap integration", "Owner-level trust"],
        uncertainties: ["Approval UX", "Fraud narrative"],
        indicators: ["Agent features shipped inside incumbent SME suites", "Approval-step telemetry published"],
      },
      {
        key: "B", tag: "High-impact alternative", confidence: "Medium", weight: 0.3,
        title: "Autonomous Spend Enclaves",
        summary: "Bounded budgets where agents negotiate and settle within policy. A meaningful share of SME indirect spend becomes machine-negotiated, compressing supplier margins.",
        drivers: ["Programmatic authorization", "Open banking rails", "Cost pressure"],
        uncertainties: ["Loss tolerance", "Insurer posture", "Regulator appetite"],
        indicators: ["First supervised SME enclave pilots", "Agent-specific insurance products"],
      },
      {
        key: "C", tag: "Disruptive", confidence: "Low", weight: 0.2,
        title: "Payment-Layer Capture",
        summary: "A dominant super-app or agent platform becomes the procurement gatekeeper, taking a toll on SME trade and triggering a regulatory backlash.",
        drivers: ["Network effects", "Distribution power", "Data advantage"],
        uncertainties: ["Competition policy", "Bank response"],
        indicators: ["Platform toll announcements", "Regulator market study"],
      },
    ],
  },

  /* ---------------------------------------------------------------------
   * DECISION BRIEF  (Engine 4)
   * ------------------------------------------------------------------- */
  decision: {
    decision: "Where should we position in agentic payments and procurement for Malaysian SMEs?",
    objective: "Capture durable value from SME back-office automation before the settlement layer consolidates, without carrying uninsurable trust risk.",
    situation: "Rails are being piloted, e-invoicing is mandated, and frameworks have made integration cheap — but authorization guardrails and trust are unsolved, and incumbents still hold the SME relationship.",
    evidence: [
      "S1 — supervised agent-initiated B2B payment pilots (fact)",
      "S2 — e-invoicing mandate extending to SMEs (fact)",
      "S6 — ~68% of SME indirect spend still manual (inference)",
      "S7 — prompt-injected payment instruction research (hypothesis, low confidence)",
    ],
    options: [
      { key: "A", title: "Compliance-first wedge",
        detail: "Ship an e-invoicing-native procurement layer with human-in-the-loop approvals; monetise per workflow.",
        advantages: ["Rides a mandate", "Low trust risk", "Fast time-to-value"],
        risks: ["Crowded", "Thin margin", "Platform bundle risk"] },
      { key: "B", title: "Guardrail infrastructure",
        detail: "Build authorization, spend-policy and audit primitives that any agent or rail can call.",
        advantages: ["Sits at the chokepoint", "Defensible", "Insurer/regulator aligned"],
        risks: ["Long sales cycle", "Standards risk", "Needs security depth"] },
      { key: "C", title: "Autonomous enclave pilot",
        detail: "Run bounded, supervised agent-spend pilots with a small cohort of SMEs and one bank partner.",
        advantages: ["Real learning", "Option value", "Narrative asset"],
        risks: ["Operational risk", "Cohort fragility", "Consent burden"] },
    ],
    recommendation: "Do A now, B as the moat, and C as a bounded learning loop — in that sequence.",
    why: "The mandate creates immediate, low-risk demand (A). Guardrails are the durable chokepoint once autonomy arrives (B). Pilots de-risk the leap to autonomy without betting the firm on it (C).",
    assumptions: ["MyInvois phase thresholds hold", "At least one viable settlement partner emerges", "SME owners accept assisted autonomy first"],
    confidence: "Medium",
    nextAction: "Stand up a 10-SME procurement shadow pilot with one bank partner and a written authorization policy.",
  },

  /* ---------------------------------------------------------------------
   * ACTION ENGINE  (Engine 5) — tasks with full schema
   * ------------------------------------------------------------------- */
  actions: [
    { id: "T-01", task: "Run 10-SME procurement shadow pilot", objective: "Prove assisted-autonomy value with real spend", priority: "P0",
      owner: "AutoClaw", why: "Cheapest path to real evidence and a referenceable story.", inputs: "SME cohort, bank partner, policy draft",
      output: "Pilot report + baseline metrics", deadline: "2026-10-20", status: "In progress",
      executable: true },
    { id: "T-02", task: "Draft agent authorization policy", objective: "Define spend, scope and escalation guardrails", priority: "P0",
      owner: "AutoClaw", why: "Guardrails are the product and the licence to operate.", inputs: "S7 signal, insurer input, PDPA notes",
      output: "Versioned policy doc", deadline: "2026-10-05", status: "In progress",
      executable: true },
    { id: "T-03", task: "Integrate MyInvois-native e-invoicing", objective: "Speak the mandated format end-to-end", priority: "P1",
      owner: "Engineering", why: "Compliance is the distribution wedge.", inputs: "LHDN spec, sandbox credentials",
      output: "Working integration + tests", deadline: "2026-11-14", status: "Planned",
      executable: false },
    { id: "T-04", task: "Score candidate settlement partners", objective: "Pick rails with tolerable concentration risk", priority: "P1",
      owner: "AutoClaw", why: "Single-provider dependency is a structural SME risk.", inputs: "Vendor docs, security posture",
      output: "Weighted scorecard", deadline: "2026-10-28", status: "Planned",
      executable: true },
    { id: "T-05", task: "Publish SME agent-onboarding kit", objective: "Lower the adoption floor", priority: "P2",
      owner: "Growth", why: "Adoption is gated by confidence, not capability.", inputs: "Pilot learnings",
      output: "Guide + checklist", deadline: "2026-11-30", status: "Planned",
      executable: false },
    { id: "T-06", task: "Stand up signal monitoring job", objective: "Watch rails, fraud and regulator moves", priority: "P1",
      owner: "AutoClaw", why: "Foresight needs a live feed, not a snapshot.", inputs: "Source list, alert thresholds",
      output: "Recurring monitor + alerts", deadline: "2026-09-30", status: "Ready",
      executable: true },
  ],

  /* ---------------------------------------------------------------------
   * INTELLIGENCE IMPACT STRIP  (AI Impact dashboard, repurposed)
   * ------------------------------------------------------------------- */
  impact: {
    base: {
      spend: { value: 240, unit: "k", delta: "+15%", sub: "$1.6k per monitored entity" },
      touched: { value: 38, total: 142, delta: "+22%", sub: "workflows instrumented" },
      hours: { value: 14820, delta: "+22%", sub: "≈ 8 FTE equivalent" },
      adoption: [
        { segment: "Observers", pct: 18, badge: "Needs awareness", tone: "red" },
        { segment: "Experimenters", pct: 31, badge: "Needs guidance", tone: "amber" },
        { segment: "Operators", pct: 29, badge: "On track", tone: "blue" },
        { segment: "Canvassers", pct: 22, badge: "Leading", tone: "green" },
      ],
      effectiveness: { value: 74, label: "Peak signal yield", p50: 52, top: 84 },
    },
  },

  /* ---------------------------------------------------------------------
   * WATCHLIST  (monitoring configuration)
   * ------------------------------------------------------------------- */
  watchlist: {
    monitor: "Agentic payments & procurement for Malaysian SMEs",
    frequency: "Daily",
    check: ["startups", "funding", "product launches", "partnerships", "regulations", "fraud incidents", "enterprise adoption"],
    alert: "High-impact developments immediately",
    quietRule: "Report NO MATERIAL CHANGE rather than a repetitive digest.",
  },
};
