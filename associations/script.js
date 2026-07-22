/* ============================================================
   AAE AI Readiness Check - front end logic
   Ported from the Fresh Strategy Business AI Readiness Assessment
   front end to the AAE (Association of Association Executives)
   question set. Masks the live AAE Google Form. Submits EXACT
   original answer strings; displays clean hyphenated text.
   Source of truth for entry ids / option strings:
   ../aae_form_scraped.json (verbatim scrape of the live form, 42 items).
   ============================================================ */

/* ---------- Google Form config (from aae_form_scraped.json) ---------- */
const FORM_ID = "1FAIpQLSc72fCQJXK-CX4BArXr86ceekjh7zgFQ_VocX0k_jobcmdxIw";
const FORM_POST = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

/* ---------- Non-scored field entry ids ---------- */
const ENTRY = {
  consent1:          "entry.397887017",
  first_name:        "entry.1387282638",
  last_name:         "entry.1204301867",
  association_name:  "entry.242780481",
  sector:             "entry.202848469",
  members_based:      "entry.101510749",
  main_members:        "entry.886118834",
  count_people:         "entry.1214591662",
  count_companies:       "entry.940209604",
  count_assocs:           "entry.609148092",
  staff_size:              "entry.83457971",
  role:                     "entry.1562358796",
  function:                 "entry.787501607",
  slider:                   "entry.1980665430",
  biggest_question:         "entry.1896918240",
  consent2:                 "entry.2031230552",
  referral:                 "entry.401508418",
};

/* ---------- Consent checkbox strings - byte-exact, submit AND display ---------- */
const CONSENT1_TEXT = "I understand that this data is passed to Fresh Solutions GmbH, the partner of AAE to generate the benchmarking report.";
const CONSENT2_TEXT = "I confirm I'm happy for Fresh Solutions GmbH to process my responses for the purpose of generating my personal AI Readiness Report and producing anonymised aggregate findings for the Association of Association Executives and Associations World Congress 2026. I understand I can withdraw consent at any time by emailing hello@freshsolutions.ai .";

/* ---------- Display transform: submit-string -> clean display text ---------- */
function displayText(s) {
  return s.replace(/—/g, "-").replace(/–/g, "-"); // em/en dash -> hyphen (display only)
}

/* ---------- Section stepper model ---------- */
const SECTIONS = [
  { id: "background", label: "Background" },
  { id: "vision",     label: "Vision & Leadership" },
  { id: "operations", label: "Operational Design" },
  { id: "people",     label: "People & Capabilities" },
  { id: "data",       label: "Data Readiness" },
  { id: "governance", label: "AI Governance" },
  { id: "results",    label: "Results & Value Delivery" },
];

const STAGE_LABELS = ["Foundation", "Developing", "Established", "Advanced", "Leading"];

/* ---------- Background choice questions (exact option strings from the form) ----------
   Note: the source JSON includes a trailing "" (empty string) option on sector,
   members_based, main_members, role and function - most likely the form's
   "Other" free-text option, scraped without its label. Google Forms submits
   a real "Other" answer as entry.X=__other_option__ plus a separate
   entry.X.other_option_response field - that protocol isn't in the field map
   we were given, so rather than guess at it we've left the trailing blank
   option OUT of the rendered choices. See README "Known gaps". */
const CHOICE = {
  sector: [
    "Medical / Healthcare Professional Society", "Scientific / Learned Society",
    "Trade or Industry Association", "Professional Services Institute / Chartered Body",
    "Business / Chamber of Commerce", "Educational / Academic Association",
    "Patient / Consumer Advocacy Organisation", "Humanitarian / Development NGO",
    "Cultural / Arts / Heritage Association", "Sports / Recreation Federation",
    "Agricultural / Food / Environmental Body",
  ],
  members_based: ["North America", "Europe", "Middle East / Africa", "Asia-Pacific", "Latin America", "International"],
  main_members: [
    "People (individual members)", "Companies / organisations",
    "Other associations (e.g. a federation of associations)",
  ],
  staff_size: ["1-5", "6-10", "11-20", "21-30", "31-50", "51-100", "101+"],
  role: [
    "Executive Head", "Executive Team", "Director / Vice President / Head of Department",
    "Operations Lead", "Senior Manager", "Manager", "Coordinator", "Secretariat",
    "Consultant", "Non-Executive Head", "Non-Executive Board Member", "Other volunteer",
  ],
  function: [
    "Commercial", "Communications", "Community management", "Conferences / Events",
    "Customer services", "Digital", "Education / Professional development",
    "Facilities management", "Finance / Purchasing", "Human Resources", "Information",
    "IT / Technology", "Leadership / Strategy", "Marketing", "Membership", "Operations",
    "Programme / Project management", "Public policy / lobbying", "Public relations",
    "Publishing", "Regional management", "Research", "Sales / Business development",
    "Social media", "Training / Staff development", "Volunteers", "Website",
  ],
};

/* ---------- 17 maturity questions (exact option strings, index 0..4 = level 1..5) ----------
   Stems are lightly split into stem + hint where the live form asks a
   two-sentence question (context sentence + the actual question), same
   pattern as the business template. Submit strings are the JSON's verbatim
   text, unicode dashes, arrows and the unclosed paren on measure_value[3]
   included. */
const M = {
  vision: {
    stem: "How would you describe your association's AI vision today?", hint: "",
    entry: "entry.950298785", dim: "vision",
    opts: [
      "No stated position on AI; we react to member or media prompts as they arise.",
      "Leadership has informally discussed AI; no written view.",
      "Written AI position paper or statement aligned to our strategic plan.",
      "AI is a named pillar in our current strategic plan with owners and milestones.",
      "An AI-informed vision shapes how we serve members, run events, and set next-cycle strategy, reviewed annually by the board.",
    ],
  },
  exec_paid: {
    stem: "How engaged is your executive leadership with AI?", hint: "",
    entry: "entry.870169557", dim: "vision",
    opts: [
      "Not on their radar.", "Individual curiosity; no commitments.",
      "One executive champion; episodic backing.",
      "Executive team aligned; named budget and accountability.",
      "Full exec-team sponsorship with regular reporting to the board.",
    ],
  },
  board_vol: {
    stem: "How engaged is your board and volunteer leadership?", hint: "",
    entry: "entry.1023853939", dim: "vision",
    opts: [
      "Board has not discussed AI.", "Raised informally in a meeting or two.",
      "Discussed at board level; minuted, no decision.",
      "Board has approved an AI direction and reviews progress at least annually.",
      "AI is a standing item in board agendas with trustee oversight of risk, ethics, and member trust.",
    ],
  },
  strategy: {
    stem: "How visible is AI within it?", hint: "Think about your current strategic plan or equivalent.",
    entry: "entry.1714830908", dim: "vision",
    opts: [
      "AI is not mentioned in our strategy.", "AI sits in an IT or innovation side-note.",
      "AI is referenced in two or three strategic objectives.",
      "AI is woven through multiple pillars — membership, events, advocacy, operations.",
      "You cannot describe our strategy without describing how AI supports the mission.",
    ],
  },
  ops: {
    stem: "To what extent is AI embedded in how work gets done?", hint: "Think about any repeatable workflow across your secretariat.",
    entry: "entry.728410982", dim: "operations",
    opts: [
      "No AI in any workflow.", "A few staff experiment with ChatGPT or Copilot personally.",
      "AI used in at least one workflow (e.g. member-enquiry triage, event copywriting, policy-paper drafting, CRM segmentation).",
      "AI embedded in several core workflows (member comms, event logistics, content, advocacy monitoring, finance reporting).",
      "AI-native operations end-to-end: member onboarding, renewal outreach, event planning, content curation, advocacy intelligence all AI-augmented.",
    ],
  },
  implementation: {
    stem: "From the moment someone in the association has an AI idea, how does it actually get tried?", hint: "",
    entry: "entry.982031000", dim: "operations",
    opts: [
      "No implementation — individuals try things in isolation.", "One-off pilots with no follow-through.",
      "Structured pilots with success criteria.", "Pilots run with clear intent to scale if they work.",
      "Consistent pipeline from pilot → production, with retirement criteria and lessons logged.",
    ],
  },
  scaling: {
    stem: "When an AI-enhanced workflow works, how well does it spread?", hint: "",
    entry: "entry.1406131163", dim: "operations",
    opts: [
      "We don't scale — what works for one person stays with them.", "Informal sharing between teams.",
      "Documented playbooks for proven use cases.",
      "Systematic scaling process with named owners and measurable uptake across the secretariat.",
      "Scaling is a managed capability: proven use cases spread to every relevant team within months, with central support.",
    ],
  },
  team_capability: {
    stem: "Across your paid secretariat, how confident are staff using AI in their daily work?", hint: "",
    entry: "entry.492309829", dim: "people",
    opts: [
      "Most staff have not used AI tools at work.", "A few curious individuals dabble.",
      "Mixed proficiency across the secretariat; some confident users, many not.",
      "Core functions (membership, events, comms, policy) have confident AI users.",
      "More than three-quarters of paid staff regularly use AI in their work; AI-literate colleagues help peers.",
    ],
  },
  learning: {
    stem: "How do staff mostly build AI skills?", hint: "",
    entry: "entry.351411408", dim: "people",
    opts: [
      "No AI training offered.", "Staff find resources on their own.",
      "Occasional internal sessions or webinars.", "Structured AI learning pathways linked to role.",
      "Continuous AI learning embedded in onboarding, appraisals, and CPD — and, where relevant, extended to members as a benefit.",
    ],
  },
  training_q8b: {
    stem: "In the last 12 months, how many of your paid staff have completed a structured AI course (2 hours or more)?", hint: "",
    entry: "entry.1620105270", dim: "people",
    opts: [
      "None", "A few of our paid staff", "About half of our paid staff",
      "Most of our paid staff", "All paid staff, or an ongoing programme everyone takes part in",
    ],
  },
  change_ready: {
    stem: "How does your secretariat respond when you introduce new tools or ways of working?", hint: "",
    entry: "entry.433848819", dim: "people",
    opts: [
      "Significant resistance; changes get stalled or reversed.", "Change accepted reluctantly when imposed.",
      "Change accepted when the rationale is clear and members are unaffected.",
      "Staff actively suggest improvements; leadership sponsors trial-and-learn cycles.",
      "We run quarterly retrospectives and publish learnings across the secretariat; decisions cite past experiments.",
    ],
  },
  data_quality: {
    stem: "How would you describe the state of your association's data?", hint: "",
    entry: "entry.932368295", dim: "data",
    opts: [
      "Member data is fragmented across spreadsheets, inboxes, and legacy systems.",
      "A CRM exists but data is patchy, duplicates are common, and few staff can query it.",
      "Decent-quality CRM, event, and finance data — accessible to the teams that own them.",
      "Integrated member, event, content, and finance data; trusted and queryable across the secretariat.",
      "Single member view across all touchpoints — membership, events, CPD, content, advocacy — refreshed in near-real time.",
    ],
  },
  data_leverage: {
    stem: "How usable is your data for AI today?", hint: "",
    entry: "entry.1324420810", dim: "data",
    opts: [
      "Our data is not in a usable state for AI.", "A few datasets might be usable with heavy clean-up.",
      "Some datasets (e.g. CRM, event registrations) are usable today for AI tasks.",
      "Most member and operational data is AI-ready with documented definitions and permissions.",
      "Data is fully governed, consented, structured, and actively feeding AI models that serve members.",
    ],
  },
  risk: {
    stem: "How is AI risk managed?", hint: "",
    entry: "entry.1440366055", dim: "governance",
    opts: [
      "No AI policy; staff use tools without guidance.",
      "Informal \"don't put member data into ChatGPT\" guidance.",
      "Written AI-use policy covering member-data handling and disclosure.",
      "Formal governance: AI policy, DPIA-process for member-facing AI, member transparency.",
      "Living governance framework reviewed by the board, aligned to EU AI Act and members' own professional standards; members are informed when AI touches them.",
    ],
  },
  accountability: {
    stem: "If something went wrong with an AI tool your association uses, who would actually be accountable?", hint: "",
    entry: "entry.1959679116", dim: "governance",
    opts: [
      "No one owns AI risk.", "It's assumed IT will deal with it.",
      "A named executive (often the COO or Head of Digital) owns AI risk.",
      "AI risk sits with a cross-functional group (Exec + Data + Legal) reporting to the board.",
      "The board has explicit oversight of AI risk, with a trustee lead and annual external review.",
    ],
  },
  results: {
    stem: "What measurable impact has AI had on {ASSOC}?", hint: "",
    entry: "entry.1522934293", dim: "results",
    opts: [
      "None — too early or no initiatives launched.",
      "Small individual time savings (staff hours back), no organisational impact yet.",
      "Measurable gains in one or two functions: e.g. faster member-enquiry response, lighter event-admin load, or improved email engagement.",
      "Broad impact across functions: member retention, event attendance, content consumption, advocacy reach, or non-dues revenue all moving in the right direction; 15–30% efficiency gains in targeted workflows.",
      "Transformational impact: material lift in member retention or NPS, step-change in engagement, non-dues revenue growth traceable to AI-enabled services, and capacity freed for higher-value member work.",
    ],
  },
  measure_value: {
    stem: "How do you know whether AI is working for your association?", hint: "",
    entry: "entry.1613616710", dim: "results",
    opts: [
      "We don't track it.",
      "Anecdotal — \"it feels like it's helping.\"",
      "We track time saved on specific tasks.",
      "AI impact is linked to our core association KPIs (retention, engagement score, NPS, event attendance, content consumption, advocacy reach, non-dues revenue and reported at least quarterly.",
      "AI value is part of board reporting alongside strategic-plan KPIs, with year-on-year trend lines and a named accountable owner; every AI investment has a declared KPI it is expected to move.",
    ],
  },
};

/* Fixed 1..17 order - used for progress numbering and skip-chain logic */
const QUESTION_ORDER = [
  "vision", "exec_paid", "board_vol", "strategy",
  "ops", "implementation", "scaling",
  "team_capability", "learning", "training_q8b", "change_ready",
  "data_quality", "data_leverage",
  "risk", "accountability",
  "results", "measure_value",
];

/* ---------- Dimensions (order + metadata for results) ---------- */
const DIMENSIONS = [
  { id: "vision",     label: "Vision & Leadership",      short: "Vision",     keys: ["vision", "exec_paid", "board_vol", "strategy"] },
  { id: "operations", label: "Operational Design",       short: "Operations", keys: ["ops", "implementation", "scaling"] },
  { id: "people",     label: "People & Capabilities",    short: "People",     keys: ["team_capability", "learning", "training_q8b", "change_ready"] },
  { id: "data",       label: "Data Readiness",           short: "Data",       keys: ["data_quality", "data_leverage"] },
  { id: "governance", label: "AI Governance",            short: "Governance", keys: ["risk", "accountability"] },
  { id: "results",    label: "Results & Value Delivery", short: "Results",    keys: ["results", "measure_value"] },
];

const DIM_FOCUS = {
  vision:     "Put a written AI position in your strategic plan, with an owner and a milestone the board can track. When members and staff know where AI is heading and why, adoption follows.",
  operations: "Move from personal ChatGPT habits to redesigned workflows. Pick one or two high-value processes - member enquiries, event admin, content - rebuild them around AI, then build a repeatable way to scale what works.",
  people:     "Build AI confidence across the whole secretariat, not just the curious few. Structured learning pathways tied to role turn AI from a side habit into everyday practice.",
  data:       "Get member, event and finance data clean, connected and accessible to the teams that need it. Better data is often the single biggest unlock for reliable AI results.",
  governance: "Put a named owner and a simple AI-use policy in place. Clear accountability lets your secretariat move faster with confidence, not slower.",
  results:    "Start tying AI activity to the KPIs your board already tracks - retention, engagement, event attendance, non-dues revenue. Measurement turns anecdotes into a case for the next investment.",
};

/* ---------- Tiers (per spec: 0-30 / 31-50 / 51-70 / 71-85 / 86-100) ---------- */
const TIERS = [
  { name: "Foundation",  max: 30,  blurb: "You're at the starting line. The pieces aren't in place yet, but that's the opportunity: a focused first move on one dimension can shift your whole trajectory." },
  { name: "Developing",  max: 50,  blurb: "Momentum is building. You've made early moves and seen what's possible. The next step is turning scattered activity into a joined-up approach across the secretariat." },
  { name: "Established", max: 70,  blurb: "You have real foundations. AI is working in places and the basics are solid. Now it's about scaling what works and closing the gaps between dimensions." },
  { name: "Advanced",    max: 85,  blurb: "You're operating with maturity. AI is embedded across most of the secretariat. The focus shifts to consistency, measurement and pushing your weakest dimension up to match the rest." },
  { name: "Leading",     max: 100, blurb: "You're AI-native. AI runs through strategy, operations and culture. The edge now is staying ahead - continuous improvement and turning readiness into a compounding advantage for your members." },
];

function tierFor(pct) {
  return TIERS.find(t => pct <= t.max) || TIERS[TIERS.length - 1];
}

/* ============================================================
   Build the flat step list
   ============================================================ */
const STEPS = [
  { kind: "consent", section: "background", field: "consent1" },
  { kind: "profile", section: "background" },
  { kind: "choice",  section: "background", field: "sector" },
  { kind: "choice",  section: "background", field: "members_based" },
  { kind: "choice",  section: "background", field: "main_members" },
  { kind: "counts",  section: "background" },
  { kind: "choice",  section: "background", field: "staff_size" },
  { kind: "choice",  section: "background", field: "role" },
  { kind: "multiselect", section: "background", field: "function" },
  { kind: "scale",   section: "vision" },
];
DIMENSIONS.forEach(dim =>
  dim.keys.forEach(key => STEPS.push({ kind: "maturity", section: dim.id, key })));
STEPS.push({ kind: "finish", section: "results" });

/* ---------- State ---------- */
const state = {
  consent1: false,
  profile: { first_name: "", last_name: "", association_name: "" },
  choice:  { sector: null, members_based: null, main_members: null, staff_size: null, role: null },
  counts:  { count_people: "", count_companies: "", count_assocs: "" },
  function: [], // array of selected CHOICE.function strings
  slider: null, // 0..10 or null
  maturity: {}, // key -> selected index 0..4
  biggest_question: "",
  email: "", // where the personalised report is sent (Google Forms form-level "Collect email addresses" field, submitted as emailAddress)
  consent2: false,
};

let current = 0;

/* Referral source from URL (?source=...) - mirrors the business template */
const REFERRAL = new URLSearchParams(location.search).get("source") || "";

/* ---------- Element refs ---------- */
const el = id => document.getElementById(id);
const introScreen = el("intro"), wizardScreen = el("wizard"), resultsScreen = el("results");

/* ============================================================
   Skip logic (AAE-specific)
   Q4 ops = "No AI in any workflow." -> hide results (Q16), auto-score level 1.
   results = its option 1 (manually chosen OR auto-set by the rule above)
     -> hide measure_value (Q17), auto-score level 1.
   Auto-scored answers are never rendered but DO submit their option-1 string
   (buildPayload falls back to state.maturity[key] ?? 0, i.e. index 0, for any
   key that was never answered - which is exactly the skipped case).
   ============================================================ */
function opsSaysNoAI() { return (state.maturity["ops"] ?? 0) === 0; }

/* The *effective* level for a skip-chained key ignores any stale answer left
   over from before the skip condition was true (e.g. the user answered
   results, then went back and changed ops to "No AI in any workflow.") -
   scoring and submission must reflect the current skip state, not history. */
function resultsEffectiveLevel() {
  if (opsSaysNoAI()) return 0;
  return state.maturity["results"] ?? 0;
}
function resultsIsNone() { return resultsEffectiveLevel() === 0; }
function measureValueEffectiveLevel() {
  if (resultsIsNone()) return 0;
  return state.maturity["measure_value"] ?? 0;
}
function levelForKey(key) {
  if (key === "results") return resultsEffectiveLevel();
  if (key === "measure_value") return measureValueEffectiveLevel();
  return state.maturity[key] ?? 0;
}

function isStepVisible(idx) {
  const step = STEPS[idx];
  if (step.kind === "maturity" && step.key === "results") return !opsSaysNoAI();
  if (step.kind === "maturity" && step.key === "measure_value") return !resultsIsNone();
  return true;
}

function visibleIndices() {
  const out = [];
  for (let i = 0; i < STEPS.length; i++) if (isStepVisible(i)) out.push(i);
  return out;
}

/* ============================================================
   Intro
   ============================================================ */
el("startBtn").addEventListener("click", () => {
  introScreen.hidden = true;
  wizardScreen.hidden = false;
  buildStepper();
  render();
  window.scrollTo(0, 0);
});

/* Greyscale radar preview beside the expectations, decorative sample data
   only - same approach as the business template's intro. */
const introRadar = el("introRadar");
if (introRadar) {
  const SAMPLE_DIMS = [
    { short: "Vision",     pct: 68 },
    { short: "Operations", pct: 48 },
    { short: "People",     pct: 57 },
    { short: "Data",       pct: 35 },
    { short: "Governance", pct: 42 },
    { short: "Results",    pct: 40 },
  ];
  introRadar.innerHTML = radarSVG(SAMPLE_DIMS);
}

/* ============================================================
   Stepper
   ============================================================ */
function buildStepper() {
  const nav = el("stepper");
  nav.innerHTML = SECTIONS.map(s => `
    <div class="step-item" data-section="${s.id}">
      <span class="step-dot"></span>
      <span class="step-name">${s.label}</span>
    </div>`).join("");
}

function updateStepper() {
  const activeSection = STEPS[current].section;
  const activeIdx = SECTIONS.findIndex(s => s.id === activeSection);
  document.querySelectorAll(".step-item").forEach((node, i) => {
    node.classList.toggle("is-active", i === activeIdx);
    node.classList.toggle("is-done", i < activeIdx);
  });
}

/* ============================================================
   Render current step
   ============================================================ */
function render() {
  const step = STEPS[current];
  updateStepper();
  document.body.dataset.step = current; // stable step marker (tests + tools)

  const vis = visibleIndices();
  const posInVis = vis.indexOf(current);
  el("progressFill").style.width = `${Math.min(Math.max((posInVis / (vis.length - 1)) * 100, 5), 95)}%`;

  if (step.kind === "maturity") {
    const qNum = QUESTION_ORDER.indexOf(step.key) + 1;
    el("progressLabel").textContent = `Question ${qNum} of 17`;
  } else if (step.kind === "finish") {
    el("progressLabel").textContent = "Last step";
  } else {
    el("progressLabel").textContent = "";
  }

  const answers = el("answers");
  answers.className = "answers";
  answers.removeAttribute("role");
  answers.removeAttribute("aria-label");

  if (step.kind === "consent") renderConsent1(answers);
  else if (step.kind === "profile") renderProfile(answers);
  else if (step.kind === "choice") renderChoice(step, answers);
  else if (step.kind === "counts") renderCounts(answers);
  else if (step.kind === "multiselect") renderMultiselect(step, answers);
  else if (step.kind === "scale") renderScale(answers);
  else if (step.kind === "maturity") renderMaturity(step, answers);
  else if (step.kind === "finish") renderFinish(answers);

  el("prevBtn").disabled = false; // on step 1 it returns to the intro
  const isLast = current === STEPS.length - 1;
  el("nextBtn").textContent = isLast ? "Show my results" : "Next";
  updateNextEnabled();
}

/* ---------- Consent 1 step ---------- */
function renderConsent1(container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "Before we begin";
  el("qHint").textContent = "Please confirm to continue.";
  container.className = "answers answers--consent";
  container.innerHTML = `
    <button class="consent-card ${state.consent1 ? "is-selected" : ""}" role="checkbox" aria-checked="${state.consent1}">
      <span class="consent-check">${tickSVG()}</span>
      <span class="consent-text">${esc(CONSENT1_TEXT)}</span>
    </button>`;
  container.querySelector(".consent-card").addEventListener("click", (e) => {
    state.consent1 = !state.consent1;
    e.currentTarget.classList.toggle("is-selected", state.consent1);
    e.currentTarget.setAttribute("aria-checked", String(state.consent1));
    updateNextEnabled();
    if (state.consent1) autoAdvance();
  });
}

/* ---------- Profile step (name + association) ---------- */
function renderProfile(container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "Tell us who you are";
  el("qHint").textContent = "";
  const p = state.profile;
  container.innerHTML = `
    <div class="profile-grid">
      <div class="field">
        <label for="f_first">First name</label>
        <input id="f_first" type="text" autocomplete="given-name" value="${esc(p.first_name)}">
      </div>
      <div class="field">
        <label for="f_last">Last name</label>
        <input id="f_last" type="text" autocomplete="family-name" value="${esc(p.last_name)}">
      </div>
      <div class="field field--full">
        <label for="f_assoc">Association / Organisation name</label>
        <input id="f_assoc" type="text" autocomplete="organization" value="${esc(p.association_name)}">
      </div>
    </div>`;
  const bind = (key, id) => {
    const input = el(id);
    input.addEventListener("input", () => { p[key] = input.value; updateNextEnabled(); });
  };
  bind("first_name", "f_first"); bind("last_name", "f_last"); bind("association_name", "f_assoc");
}

/* ---------- Choice step (single-select radios) ---------- */
function renderChoice(step, container) {
  const labelMap = {
    sector: "Which sector does your association represent?",
    members_based: "Where are your members based?",
    main_members: "Who are your main members?",
    staff_size: "What's your staff size (paid headcount)?",
    role: "What's your role?",
  };
  el("qIndex").textContent = "";
  el("qStem").textContent = labelMap[step.field];
  el("qHint").textContent = "";
  container.className = "answers answers--grid";
  container.setAttribute("role", "radiogroup");
  container.setAttribute("aria-label", labelMap[step.field]);
  const selected = state.choice[step.field];
  container.innerHTML = CHOICE[step.field].map(opt => `
    <button class="answer ${selected === opt ? "is-selected" : ""}" role="radio" aria-checked="${selected === opt}" data-val="${esc(opt)}">
      <span class="answer-text">${esc(displayText(opt))}</span>
      <span class="answer-tick">${tickSVG()}</span>
    </button>`).join("");
  container.querySelectorAll(".answer").forEach(btn => {
    btn.addEventListener("click", () => {
      state.choice[step.field] = btn.dataset.val;
      container.querySelectorAll(".answer").forEach(b => { b.classList.remove("is-selected"); b.setAttribute("aria-checked", "false"); });
      btn.classList.add("is-selected");
      btn.setAttribute("aria-checked", "true");
      updateNextEnabled();
      autoAdvance();
    });
  });
}

/* ---------- Counts step (conditional member-count fields) ----------
   All three fields are optional (short_text, "roughly how many" invites an
   approximate or blank answer). The one matching main_members is highlighted
   as the primary field; the others stay available in case an association
   has more than one member type. Design choice - see README "Known gaps". */
function renderCounts(container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "Roughly how many members of each type?";
  el("qHint").textContent = "Approximate is fine. Leave any that don't apply blank.";
  const c = state.counts;
  const primary = {
    "People (individual members)": "count_people",
    "Companies / organisations": "count_companies",
    "Other associations (e.g. a federation of associations)": "count_assocs",
  }[state.choice.main_members];
  const fieldDef = [
    { key: "count_people", label: "People", id: "f_cp" },
    { key: "count_companies", label: "Companies / organisations", id: "f_cc" },
    { key: "count_assocs", label: "Other associations", id: "f_ca" },
  ];
  container.innerHTML = `
    <div class="counts-grid">
      ${fieldDef.map(f => `
        <div class="field ${f.key === primary ? "is-primary" : ""}">
          <span class="field-primary-tag ${f.key === primary ? "" : "is-empty"}">your main members</span>
          <label for="${f.id}">${f.label}</label>
          <input id="${f.id}" type="text" inputmode="numeric" placeholder="e.g. 1,200" value="${esc(c[f.key])}">
        </div>`).join("")}
    </div>`;
  fieldDef.forEach(f => {
    el(f.id).addEventListener("input", () => { c[f.key] = el(f.id).value; updateNextEnabled(); });
  });
}

/* ---------- Multi-select step (function - checkbox, several allowed) ---------- */
function renderMultiselect(step, container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "Which functions do you work in?";
  el("qHint").textContent = "Select all that apply.";
  container.className = "answers answers--multi";
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Which functions do you work in?");
  container.innerHTML = CHOICE[step.field].map(opt => `
    <button class="answer ${state.function.includes(opt) ? "is-selected" : ""}" role="checkbox" aria-checked="${state.function.includes(opt)}" data-val="${esc(opt)}">
      <span class="answer-text">${esc(displayText(opt))}</span>
      <span class="answer-tick">${tickSVG()}</span>
    </button>`).join("");
  container.querySelectorAll(".answer").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.val;
      const idx = state.function.indexOf(val);
      if (idx === -1) state.function.push(val); else state.function.splice(idx, 1);
      const nowSelected = state.function.includes(val);
      btn.classList.toggle("is-selected", nowSelected);
      btn.setAttribute("aria-checked", String(nowSelected));
      updateNextEnabled();
    });
  });
}

/* ---------- Opinion scale step (0-10, unscored) ---------- */
function renderScale(container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "AI will fundamentally change how our association serves its members in the next three years.";
  el("qHint").textContent = "Your honest read, not your hope. This question isn't scored.";
  container.innerHTML = `
    <div class="scale-row" role="radiogroup" aria-label="Agreement scale, 0 to 10">
      ${Array.from({ length: 11 }, (_, i) => `
        <button class="scale-pip ${state.slider === i ? "is-selected" : ""}" role="radio" aria-checked="${state.slider === i}" data-val="${i}">${i}</button>`).join("")}
    </div>
    <div class="scale-labels"><span>Strongly disagree</span><span>Strongly agree</span></div>`;
  container.querySelectorAll(".scale-pip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.slider = Number(btn.dataset.val);
      container.querySelectorAll(".scale-pip").forEach(b => { b.classList.remove("is-selected"); b.setAttribute("aria-checked", "false"); });
      btn.classList.add("is-selected");
      btn.setAttribute("aria-checked", "true");
      updateNextEnabled();
      autoAdvance();
    });
  });
}

/* ---------- Maturity step (17 scored questions) ---------- */
function renderMaturity(step, container) {
  const q = M[step.key];
  const qNum = QUESTION_ORDER.indexOf(step.key) + 1;
  el("qIndex").textContent = `Q${qNum}`;
  const assocName = state.profile.association_name.trim() || "your association";
  el("qStem").textContent = q.stem.replace("{ASSOC}", assocName);
  el("qHint").textContent = q.hint || "Pick the option that fits best today, not where you hope to be.";
  container.setAttribute("role", "radiogroup");
  container.setAttribute("aria-label", q.stem);
  const selected = state.maturity[step.key];
  container.innerHTML = q.opts.map((opt, i) => `
    <button class="answer ${selected === i ? "is-selected" : ""}" role="radio" aria-checked="${selected === i}" data-idx="${i}">
      <span class="answer-stage"><span class="stage-label">${STAGE_LABELS[i]}</span></span>
      <span class="answer-text">${esc(displayText(opt))}</span>
      <span class="answer-tick">${tickSVG()}</span>
    </button>`).join("");
  container.querySelectorAll(".answer").forEach(btn => {
    btn.addEventListener("click", () => {
      state.maturity[step.key] = Number(btn.dataset.idx);
      container.querySelectorAll(".answer").forEach(b => { b.classList.remove("is-selected"); b.setAttribute("aria-checked", "false"); });
      btn.classList.add("is-selected");
      btn.setAttribute("aria-checked", "true");
      updateNextEnabled();
      autoAdvance();
    });
  });
}

/* ---------- Finish step: work email (required) + optional free text + consent2 (required) ---------- */
function renderFinish(container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "Last step - where should we send your report?";
  const tier = computeScores().tier.name;
  el("qHint").innerHTML = `Your result is ready: ${esc(tier)}. Enter your work email and confirm to see your full breakdown - we'll email your personalised report there too. We store your answers to prepare your results. <a href="https://www.freshstrategy.ai/privacy-policy" target="_blank" rel="noopener">No third parties beyond Fresh Solutions GmbH.</a>`;
  container.innerHTML = `
    <div class="finish-stack">
      <div class="field field--full">
        <label for="f_email">Work email</label>
        <input id="f_email" type="email" autocomplete="email" value="${esc(state.email)}">
        <span class="field-error" id="emailErr"></span>
      </div>
      <div class="field field--full">
        <label for="f_question">What's your biggest AI question right now? (optional)</label>
        <textarea id="f_question">${esc(state.biggest_question)}</textarea>
      </div>
      <button class="consent-card ${state.consent2 ? "is-selected" : ""}" id="consent2Card" role="checkbox" aria-checked="${state.consent2}">
        <span class="consent-check">${tickSVG()}</span>
        <span class="consent-text">${esc(CONSENT2_TEXT)}</span>
      </button>
    </div>`;
  const emailInput = el("f_email");
  emailInput.addEventListener("input", () => {
    state.email = emailInput.value;
    el("emailErr").textContent = "";
    updateNextEnabled();
  });
  emailInput.addEventListener("blur", () => {
    if (state.email.trim() && !validEmail(state.email)) el("emailErr").textContent = "Please enter a valid email.";
  });
  el("f_question").addEventListener("input", () => { state.biggest_question = el("f_question").value; });
  el("consent2Card").addEventListener("click", (e) => {
    state.consent2 = !state.consent2;
    e.currentTarget.classList.toggle("is-selected", state.consent2);
    e.currentTarget.setAttribute("aria-checked", String(state.consent2));
    updateNextEnabled();
  });
}

/* ============================================================
   Navigation
   ============================================================ */
function isStepAnswered() {
  const step = STEPS[current];
  if (step.kind === "consent") return state.consent1 === true;
  if (step.kind === "profile") {
    const p = state.profile;
    return !!(p.first_name.trim() && p.last_name.trim() && p.association_name.trim());
  }
  if (step.kind === "choice") return state.choice[step.field] != null;
  if (step.kind === "counts") return true; // optional - see renderCounts
  if (step.kind === "multiselect") return state.function.length > 0;
  if (step.kind === "scale") return state.slider != null;
  if (step.kind === "maturity") return state.maturity[step.key] != null;
  if (step.kind === "finish") return state.consent2 === true && validEmail(state.email);
  return true;
}

function updateNextEnabled() { el("nextBtn").disabled = !isStepAnswered(); }

let advanceTimer = null;
function autoAdvance() {
  clearTimeout(advanceTimer);
  if (current === STEPS.length - 1) return;
  advanceTimer = setTimeout(() => { if (isStepAnswered()) goNext(); }, 700);
}

function nextVisibleIndex(from) {
  let i = from + 1;
  while (i < STEPS.length && !isStepVisible(i)) i++;
  return Math.min(i, STEPS.length - 1);
}
function prevVisibleIndex(from) {
  let i = from - 1;
  while (i > 0 && !isStepVisible(i)) i--;
  return Math.max(i, 0);
}

function goNext() {
  clearTimeout(advanceTimer);
  if (!isStepAnswered()) return;
  if (current === STEPS.length - 1) { finish(); return; }
  current = nextVisibleIndex(current);
  render();
  scrollStageTop();
}

function goPrev() {
  clearTimeout(advanceTimer);
  if (current === 0) { // back to the intro, not a dead end
    wizardScreen.hidden = true;
    introScreen.hidden = false;
    window.scrollTo(0, 0);
    return;
  }
  current = prevVisibleIndex(current);
  render();
  scrollStageTop();
}

function scrollStageTop() {
  if (window.innerWidth <= 860) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }
}

el("nextBtn").addEventListener("click", goNext);
el("prevBtn").addEventListener("click", goPrev);

/* ============================================================
   Scoring
   17 questions across 6 dimensions. Dimension score = mean of its
   questions' 1-5 scores. Overall = round(mean(6 dimension means) x 20).
   Skipped questions (results/measure_value auto-scored via skip logic)
   default to level 1 through the (state.maturity[k] ?? 0) fallback.
   ============================================================ */
function computeScores() {
  let total = 0;
  const dimMeans = [];
  const dims = DIMENSIONS.map(d => {
    let sum = 0;
    d.keys.forEach(k => { sum += levelForKey(k) + 1; });
    const max = d.keys.length * 5;
    total += sum;
    dimMeans.push(sum / d.keys.length);
    return { id: d.id, label: d.label, short: d.short, score: sum, max, pct: Math.round((sum / max) * 100) };
  });
  const maxTotal = 17 * 5; // 85
  const pct = Math.round(dimMeans.reduce((a, b) => a + b, 0) / dimMeans.length * 20);
  const weakest = dims.slice().sort((a, b) => a.pct - b.pct || a.score - b.score)[0];
  const strongest = dims.slice().sort((a, b) => b.pct - a.pct || b.score - a.score)[0];
  return { total, maxTotal, pct, tier: tierFor(pct), dims, weakest, strongest };
}

/* ============================================================
   Finish -> submit + results
   ============================================================ */
function finish() {
  const scores = computeScores();
  submitToGoogleForm(); // fire-and-forget (no-cors)
  wizardScreen.hidden = true;
  resultsScreen.hidden = false;
  renderResults(scores);
  window.scrollTo(0, 0);
}

function buildPayload() {
  const p = new URLSearchParams();
  p.append(ENTRY.consent1, CONSENT1_TEXT);
  // Google Forms form-level "Collect email addresses (Responder input)" field:
  // submitted as the special key `emailAddress`, NOT an entry.X. The backend
  // emails the personalised report here, so this is required.
  p.append("emailAddress", state.email.trim());
  p.append(ENTRY.first_name, state.profile.first_name.trim());
  p.append(ENTRY.last_name, state.profile.last_name.trim());
  p.append(ENTRY.association_name, state.profile.association_name.trim());
  p.append(ENTRY.sector, state.choice.sector);
  p.append(ENTRY.members_based, state.choice.members_based);
  p.append(ENTRY.main_members, state.choice.main_members);
  p.append(ENTRY.count_people, state.counts.count_people.trim());
  p.append(ENTRY.count_companies, state.counts.count_companies.trim());
  p.append(ENTRY.count_assocs, state.counts.count_assocs.trim());
  p.append(ENTRY.staff_size, state.choice.staff_size);
  p.append(ENTRY.role, state.choice.role);
  // checkbox multi-select: same entry id once per selected value
  state.function.forEach(val => p.append(ENTRY.function, val));
  p.append(ENTRY.slider, state.slider != null ? String(state.slider) : "");
  // 17 maturity answers - EXACT original strings; skipped keys default to opts[0]
  QUESTION_ORDER.forEach(key => {
    const idx = levelForKey(key);
    p.append(M[key].entry, M[key].opts[idx]);
  });
  p.append(ENTRY.biggest_question, state.biggest_question.trim());
  p.append(ENTRY.consent2, CONSENT2_TEXT);
  if (REFERRAL) p.append(ENTRY.referral, REFERRAL);
  p.append("pageHistory", "0,1,2,3,4,5,6,7");
  p.append("fvv", "1");
  return p;
}

let submitStatus = "pending"; // "pending" | "sent" | "failed"

function submitNoteText() {
  if (submitStatus === "sent")
    return `Your responses have been recorded for the AAE benchmark. A copy of your full report is on its way to ${state.email}.`;
  if (submitStatus === "failed")
    return "We couldn't reach our server - your results above are complete, but the email copy may not arrive. Let us know at rewire@freshstrategy.ai so we can check your response was saved.";
  return `Sending your results to ${state.email}...`;
}

function updateSubmitNote() {
  const note = document.querySelector(".submit-note");
  if (note) note.textContent = submitNoteText();
}

function submitToGoogleForm() {
  const body = buildPayload();
  submitStatus = "pending";
  fetch(FORM_POST, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
    .then(() => { submitStatus = "sent"; updateSubmitNote(); })
    .catch(() => { submitStatus = "failed"; updateSubmitNote(); });
}

/* ============================================================
   Results rendering
   ============================================================ */
function renderResults(s) {
  const weak = s.weakest, strong = s.strongest;
  el("resultsInner").innerHTML = `
    <div class="result-hero">
      <p class="result-eyebrow">Your AI Readiness</p>
      <h1 class="result-tier-name">${s.tier.name}</h1>
      <p class="result-score-line"><b>${s.pct}%</b> ready</p>
      <p class="result-discuss"><a href="https://calendar.app.google/JqRL5oLcV3M5N4rb9" target="_blank" rel="noopener">Discuss these results with us</a></p>
      <p class="result-blurb">${s.tier.blurb}</p>
      <p class="submit-note">${esc(submitNoteText())}</p>
    </div>

    <div class="result-panel">
      <h2>Your six dimensions</h2>
      <div class="result-cols">
        <div class="radar-wrap">${radarSVG(s.dims)}</div>
        <div class="dim-bars">
          ${s.dims.map(d => `
            <div class="dim-bar-row ${d.id === weak.id ? "is-weak" : ""}">
              <div class="dim-bar-top">
                <span class="dim-bar-name">${d.label}</span>
                <span class="dim-bar-pct">${d.pct}%</span>
              </div>
              <div class="dim-bar-track"><div class="dim-bar-fill" style="width:${d.pct}%"></div></div>
            </div>`).join("")}
        </div>
      </div>

      <div class="focus-block">
        <h3>Where to focus first: ${weak.label}</h3>
        <p>${DIM_FOCUS[weak.id]}</p>
      </div>
      <div class="focus-block">
        <h3>Your strongest dimension: ${strong.label} (${strong.pct}%)</h3>
        <p>Build from here. Your ${strong.short.toLowerCase()} strength is an asset you can use to pull the weaker dimensions up.</p>
      </div>
    </div>

    <div class="result-cta">
      <h2>What your results mean in practice</h2>
      <p>In 30 minutes, we walk through your six scores and where to focus first, specific to your association.</p>
      <a class="btn btn--primary btn--lg" href="https://calendar.app.google/JqRL5oLcV3M5N4rb9" target="_blank" rel="noopener">Discuss these results with us</a>
    </div>

    <div class="result-foot"><button id="restartBtn">Answer differently? Retake the check</button></div>
  `;
  requestAnimationFrame(() => {
    document.querySelectorAll(".dim-bar-fill").forEach(f => {
      const w = f.style.width; f.style.width = "0%";
      requestAnimationFrame(() => { f.style.width = w; });
    });
  });
  el("restartBtn").addEventListener("click", () => location.reload());
}

/* ============================================================
   SVG helpers
   ============================================================ */
function radarSVG(dims) {
  const cx = 150, cy = 150, R = 110, n = dims.length;
  const angle = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  let rings = "";
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const p = dims.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ");
    rings += `<polygon points="${p}" fill="none" stroke="#E4E0DA" stroke-width="1"/>`;
  });
  let spokes = "", labels = "";
  dims.forEach((d, i) => {
    const [x, y] = pt(i, R);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#E4E0DA" stroke-width="1"/>`;
    const [lx, ly] = pt(i, R + 22);
    const anchor = Math.abs(lx - cx) < 8 ? "middle" : (lx > cx ? "start" : "end");
    const dy = ly < cy ? -2 : 12;
    labels += `<text x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}" text-anchor="${anchor}" class="radar-lbl">${d.short}</text>`;
  });
  const dataPts = dims.map((d, i) => pt(i, R * (d.pct / 100)).map(v => v.toFixed(1)).join(",")).join(" ");
  const dots = dims.map((d, i) => {
    const [x, y] = pt(i, R * (d.pct / 100));
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#2F1541"/>`;
  }).join("");

  return `<svg viewBox="-55 -8 410 316" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Radar chart of your six dimension scores">
    <style>.radar-lbl{font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;fill:#2F1541;}</style>
    ${rings}${spokes}
    <polygon points="${dataPts}" fill="#88DBBD" fill-opacity="0.45" stroke="#2F1541" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
}

function tickSVG() {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
}

/* ---------- small utils ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim()); }

/* keyboard: Enter advances */
document.addEventListener("keydown", e => {
  if (document.activeElement && (document.activeElement.classList.contains("answer") || document.activeElement.classList.contains("consent-card") || document.activeElement.classList.contains("scale-pip"))) return;
  if (e.key === "Enter" && !wizardScreen.hidden && !el("nextBtn").disabled) goNext();
});
