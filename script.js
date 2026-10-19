/* ============================================================
   AI Readiness Assessment — front end logic
   Masks the existing Google Form. Submits EXACT original answer
   strings; displays clean hyphenated text.
   ============================================================ */

/* ---------- Google Form config (from survey_bot.py, live-verified) ---------- */
const FORM_ID = "1FAIpQLSfINwAUWd-LSyTydiLgGlD6_gejmb0dbZ5bh4C4k3wxRD8RQQ";
const FORM_POST = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

const ENTRY = {
  first_name:     "entry.1387282638",
  last_name:      "entry.1204301867",
  company:        "entry.242780481",
  industry:       "entry.202848469",
  region:         "entry.101510749",
  company_size:   "entry.83457971",
  role:           "entry.1562358796",
  referral_source:"entry.401508418",
};

/* ---------- Display transform: submit-string -> clean display text ---------- */
function displayText(s) {
  if (s === "Structured rollout + transformation") return "Structured rollout + redesign"; // approved copy
  return s.replace(/—/g, "-").replace(/–/g, "-"); // em/en dash -> hyphen (display only)
}

/* ---------- Section stepper model ---------- */
/* Dimension names follow the website AI Readiness Wheel — one taxonomy everywhere */
const SECTIONS = [
  { id: "background", label: "Background" },
  { id: "vision",     label: "Vision & Leadership" },
  { id: "operations", label: "Operational Design" },
  { id: "people",     label: "People & Capabilities" },
  { id: "data",       label: "Data Readiness" },
  { id: "governance", label: "AI Governance" },
  { id: "results",    label: "Results & Value Delivery" },
];

/* ---------- Background choice questions (exact option strings) ---------- */
const CHOICE = {
  industry: [
    "Healthcare & Life Sciences", "Consumer Goods / Retail", "Financial Services",
    "Professional Services", "Technology / SaaS", "Manufacturing",
    "Education", "Public Sector / NGO",
  ],
  region: ["North America", "Europe", "Middle East / Africa", "Asia-Pacific", "Latin America"],
  company_size: ["0-50", "51–500", "501-1,000", "1,001-5,000", "5,000-10,000", "10,000+"],
  role: [
    "C-Level / Executive", "Director / Department Head", "Innovation / Digital Lead",
    "Operations Lead", "Marketing / Sales Lead", "HR / L&D",
  ],
};

/* ---------- 15 maturity questions (exact option strings, index 0..4 = level 1..5) ---------- */
const M = {
  vision: {
    stem: "How clear is your organisation's AI vision?", entry: "entry.950298785", dim: "vision",
    opts: ["No formal vision — reacting to trends", "Aware AI matters but no clear direction",
      "Written AI strategy with general goals", "Clear strategy tied to growth or efficiency targets",
      "AI-native vision integrated in business planning"],
  },
  exec_sponsorship: {
    stem: "How strongly does leadership back AI?", entry: "entry.870169557", dim: "vision",
    opts: ["Skeptical or absent", "Curious but hands-off", "Supportive with some budget",
      "Actively championing and monitoring", "Strategic priority with full leadership alignment"],
  },
  strategy_integ: {
    stem: "How embedded is AI in your strategy?", entry: "entry.1714830908", dim: "vision",
    opts: ["AI is separate from core business strategy", "AI acknowledged but planning remains separate",
      "AI initiatives aligned with some strategic priorities", "AI embedded in business planning",
      "AI strategy inseparable from business strategy"],
  },
  ops_integration: {
    stem: "How far is AI built into your operations?", entry: "entry.728410982", dim: "operations",
    opts: ["Not at all — manual processes dominate", "Testing tools without workflow change",
      "Pilots in 1-2 areas with partial integration", "Core workflows redesigned with AI",
      "End-to-end AI-native operations"],
  },
  implementation: {
    stem: "How structured is your AI rollout?", entry: "entry.982031000", dim: "operations",
    opts: ["No structured approach", "Tool adoption without redesign", "Piloting with scaling intent",
      "Structured rollout + transformation", "Continuous improvement cycle"],
  },
  scaling: {
    stem: "How well do you scale what works?", entry: "entry.1406131163", dim: "operations",
    opts: ["Each initiative is unique — no replication process", "Some informal knowledge sharing between teams",
      "We document what works and attempt to replicate", "Structured approach to scaling proven use cases",
      "Systematic scaling system with clear protocols"],
  },
  team_capability: {
    stem: "How capable is your team with AI?", entry: "entry.492309829", dim: "people",
    opts: ["No skills or training", "Basic awareness, low proficiency", "Mixed proficiency across teams",
      "Most can use and integrate AI", "Org-wide AI literacy and skill fluency"],
  },
  learning_dev: {
    stem: "How do you build AI skills?", entry: "entry.351411408", dim: "people",
    opts: ["None — self-led exploration", "Ad-hoc or team-led", "Some formal training, not consistent",
      "Structured learning pathways", "Continuous learning embedded in roles"],
  },
  change_ready: {
    stem: "How ready is your culture for change?", entry: "entry.433848819", dim: "people",
    opts: ["Resistant or risk-averse", "Cautious and slow-moving", "Open to change if justified",
      "Agile and iterative", "Innovation-driven, experimentation embraced"],
  },
  data_quality: {
    stem: "How good and accessible is your data?", entry: "entry.932368295", dim: "data",
    opts: ["Poor, siloed, hard to access", "Inconsistent quality, some access",
      "Decent quality, limited teams can use", "High quality, broadly accessible",
      "Excellent, clean, governed, accessible"],
  },
  data_leverage: {
    stem: "Is your data ready for AI today?", entry: "entry.1324420810", dim: "data",
    opts: ["Not without major effort", "Partially; some usable datasets", "Needs manual prep, partly usable",
      "Mostly ready and standardized", "Fully AI-optimized and maintained"],
  },
  risk_ethics: {
    stem: "How do you manage AI risk and compliance?", entry: "entry.1440366055", dim: "governance",
    opts: ["No framework in place", "Aware of issues but unstructured", "Basic policies emerging",
      "Formal governance structure exists", "Mature, continuously monitored framework"],
  },
  accountability: {
    stem: "Who owns AI accountability?", entry: "entry.1959679116", dim: "governance",
    opts: ["No one", "Ad hoc / informal assignment", "Named owner, unclear responsibilities",
      "Clearly defined accountability", "Embedded into executive oversight and reporting"],
  },
  results: {
    stem: "What results is AI delivering?", entry: "entry.1522934293", dim: "results",
    opts: ["None; still exploring", "Minor improvements in isolated areas (5-10% efficiency gains)",
      "Moderate gains in 1-2 functions (15-30% productivity/cost improvements)",
      "Significant results across multiple areas (30-50% improvements, measurable ROI)",
      "Breakthrough business impact (50%+ gains, revenue growth, competitive advantage)"],
  },
  measure_value: {
    stem: "How do you measure AI's value?", entry: "entry.1613616710", dim: "results",
    opts: ["We don't measure AI impact systematically", "Informal tracking — anecdotal evidence",
      "Basic metrics tracked (time saved, tasks automated)", "Comprehensive measurement with clear ROI metrics",
      "AI impact integrated into core business KPIs and reporting"],
  },
};

/* ---------- Dimensions (order + metadata for results) ---------- */
const DIMENSIONS = [
  { id: "vision",     label: "Vision & Leadership",     short: "Vision",     keys: ["vision", "exec_sponsorship", "strategy_integ"] },
  { id: "operations", label: "Operational Design",      short: "Operations", keys: ["ops_integration", "implementation", "scaling"] },
  { id: "people",     label: "People & Capabilities",   short: "People",     keys: ["team_capability", "learning_dev", "change_ready"] },
  { id: "data",       label: "Data Readiness",          short: "Data",       keys: ["data_quality", "data_leverage"] },
  { id: "governance", label: "AI Governance",           short: "Governance", keys: ["risk_ethics", "accountability"] },
  { id: "results",    label: "Results & Value Delivery",short: "Results",    keys: ["results", "measure_value"] },
];

/* Tie-break order for the weakest dimension, per tier — mirrors the deployed
   Apps Script prioritySequences exactly so screen and emailed report always
   name the same focus dimension. */
const TIE_PRIORITY = {
  Foundation:  ["vision", "people", "operations", "data", "governance", "results"],
  Developing:  ["vision", "operations", "people", "data", "governance", "results"],
  Established: ["operations", "people", "data", "vision", "governance", "results"],
  Advanced:    ["data", "governance", "operations", "people", "results", "vision"],
  Leading:     ["data", "governance", "operations", "people", "vision", "results"],
};

const DIM_FOCUS = {
  vision:     "Set a clear, written AI direction tied to a growth or efficiency target, and get leadership visibly behind it. When people know where AI is heading and why, adoption follows.",
  operations: "Move from scattered tools to redesigned workflows. Pick one or two high-value processes, rebuild them around AI, then create a repeatable way to scale what works.",
  people:     "Build AI fluency across teams, not just enthusiasts. Structured learning pathways and a culture that rewards experimentation turn AI from a side project into everyday practice.",
  data:       "Get your data clean, accessible and AI-ready. Better data quality and access is often the single biggest unlock for reliable AI results.",
  governance: "Put clear ownership and a simple risk framework in place. Defined accountability lets you move faster with confidence, not slower.",
  results:    "Start measuring AI impact against real business metrics. Tracking time saved, cost and ROI turns anecdotes into a case for the next investment.",
};

/* ---------- Tiers ---------- */
const TIERS = [
  { name: "Foundation",  max: 30,  blurb: "You're at the starting line. The pieces aren't in place yet, but that's the opportunity: a focused first move on one dimension can shift your whole trajectory." },
  { name: "Developing",  max: 50,  blurb: "Momentum is building. You've made early moves and seen what's possible. The next step is turning scattered activity into a joined-up approach." },
  { name: "Established", max: 70,  blurb: "You have real foundations. AI is working in places and the basics are solid. Now it's about scaling what works and closing the gaps between dimensions." },
  { name: "Advanced",   max: 84,  blurb: "You're operating with maturity. AI is embedded across most of the organisation. The focus shifts to consistency, measurement and pushing your weakest dimension up to match the rest." },
  { name: "Leading",    max: 100, blurb: "You're AI-native. AI runs through strategy, operations and culture. The edge now is staying ahead: continuous improvement and turning readiness into compounding advantage." },
];

function tierFor(pct) {
  return TIERS.find(t => pct <= t.max) || TIERS[TIERS.length - 1];
}

/* ============================================================
   Build the flat step list
   ============================================================ */
const STEPS = [];
["industry", "region", "company_size", "role"].forEach(id =>
  STEPS.push({ kind: "choice", section: "background", field: id }));
DIMENSIONS.forEach(dim =>
  dim.keys.forEach(key => STEPS.push({ kind: "maturity", section: dim.id, key })));
// Contact gate LAST (PwC pattern): anonymous until invested, ask right before results
STEPS.push({ kind: "contact", section: "results" });

const TOTAL_Q = STEPS.length; // used for progress
let current = 0;

/* ---------- State ---------- */
const state = {
  contact: { first_name: "", last_name: "", company: "", email: "" },
  choice:  { industry: null, region: null, company_size: null, role: null },
  maturity: {}, // key -> selected index 0..4
};

/* Referral source from URL (?source=...) — mirrors AWC attribution */
const REFERRAL = new URLSearchParams(location.search).get("source") || "";

/* ---------- Element refs ---------- */
const el = id => document.getElementById(id);
const introScreen = el("intro"), wizardScreen = el("wizard"), resultsScreen = el("results");

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

/* Greyscale radar preview beside the expectations (approved mock 2026-07-09).
   Decorative sample data only — uneven on purpose so it reads as a diagnosis,
   not decoration. The container is aria-hidden; greyscale filter lives in CSS. */
const introRadar = el("introRadar");
if (introRadar) {
  const SAMPLE_DIMS = [
    { short: "Vision",     pct: 72 },
    { short: "Operations", pct: 55 },
    { short: "People",     pct: 63 },
    { short: "Data",       pct: 38 },
    { short: "Governance", pct: 50 },
    { short: "Results",    pct: 45 },
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

  // progress: count only the 15 scored questions, per the intro promise;
  // cap at 95% until results show (C10: a full bar before the gate reads dishonest)
  el("progressFill").style.width = `${Math.min(Math.max((current / (TOTAL_Q - 1)) * 100, 5), 95)}%`;
  if (step.kind === "maturity") {
    const qNum = STEPS.slice(0, current + 1).filter(s => s.kind === "maturity").length;
    el("progressLabel").textContent = `Question ${qNum} of 15`;
  } else if (step.kind === "choice") {
    el("progressLabel").textContent = "";
  } else {
    el("progressLabel").textContent = "Last step";
  }

  const answers = el("answers");
  answers.className = "answers";
  answers.removeAttribute("role");
  answers.removeAttribute("aria-label");

  if (step.kind === "contact") {
    renderContact(answers);
  } else if (step.kind === "choice") {
    renderChoice(step, answers);
  } else {
    renderMaturity(step, answers);
  }

  el("prevBtn").disabled = false; // on step 1 it returns to the intro
  const isLast = current === TOTAL_Q - 1;
  el("nextBtn").textContent = isLast ? "Show my results" : "Next";
  updateNextEnabled();
}

/* ---------- Contact step ---------- */
function renderContact(container) {
  el("qIndex").textContent = "";
  el("qStem").textContent = "Last step - where should we send your results?";
  const tier = computeScores().tier.name;
  el("qHint").innerHTML = `Your result is ready: ${esc(tier)}. Enter your details to see the full breakdown. All fields required. We store your answers to prepare your results. <a href="https://www.freshstrategy.ai/privacy-policy" target="_blank" rel="noopener">No third parties.</a>`;
  const c = state.contact;
  container.innerHTML = `
    <div class="contact-grid">
      <div class="field">
        <label for="f_first">First name</label>
        <input id="f_first" type="text" autocomplete="given-name" value="${esc(c.first_name)}">
      </div>
      <div class="field">
        <label for="f_last">Last name</label>
        <input id="f_last" type="text" autocomplete="family-name" value="${esc(c.last_name)}">
      </div>
      <div class="field field--full">
        <label for="f_company">Organisation</label>
        <input id="f_company" type="text" autocomplete="organization" value="${esc(c.company)}">
      </div>
      <div class="field field--full">
        <label for="f_email">Work email</label>
        <input id="f_email" type="email" autocomplete="email" aria-describedby="emailSuggest" value="${esc(c.email)}">
        <span class="field-error" id="emailErr"></span>
        <span class="field-suggest" id="emailSuggest" role="status" aria-live="polite" hidden></span>
      </div>
    </div>`;
  const bind = (idKey, elId) => {
    const input = el(elId);
    input.addEventListener("input", () => {
      c[idKey] = input.value;
      if (idKey === "email") { el("emailErr").textContent = ""; onEmailTyped(); }
      updateNextEnabled();
    });
  };
  bind("first_name", "f_first"); bind("last_name", "f_last");
  bind("company", "f_company"); bind("email", "f_email");
  el("f_email").addEventListener("blur", () => {
    clearTimeout(suggestTimer);
    if (c.email.trim() && !validEmail(c.email)) { el("emailErr").textContent = "Please enter a valid email."; return; }
    offerSuggestion(emailSuggestion(c.email));
  });
}

/* ---------- Email suggestion state ----------
   The prompt has to arrive before the reader can submit a typo, not after they
   happen to leave the field: the last thing many people do at this gate is
   type the address and hit the button, so a blur-only prompt never fires. */

// The suggestion the reader has already dealt with, by dismissing it or by
// pressing on past it. Never re-interrupt for the same address.
let suggestionSettled = "";
let suggestTimer = null;

function onEmailTyped() {
  clearTimeout(suggestTimer);
  hideSuggestion();
  // Wait for a pause in typing, otherwise "alex@gmail.com" gets nagged at
  // every keystroke on its way through "alex@gmai", "alex@gmail.c" and so on.
  suggestTimer = setTimeout(() => offerSuggestion(emailSuggestion(state.contact.email)), 700);
}

function offerSuggestion(suggested) {
  if (!suggested || suggested === suggestionSettled) { hideSuggestion(); return; }
  showSuggestion(suggested);
}

function hideSuggestion() {
  const box = el("emailSuggest");
  if (box) { box.hidden = true; box.innerHTML = ""; delete box.dataset.for; }
}

/* Advisory only: the reader can accept it, dismiss it, or ignore it entirely
   and submit the address they typed. Both controls are real buttons, so the
   whole flow is reachable by Tab and Enter; the container is a polite live
   region so the prompt is announced when it appears mid-typing. */
function showSuggestion(suggested) {
  const box = el("emailSuggest");
  if (!box) return;
  if (!suggested) { hideSuggestion(); return; }
  // Already offering this exact address: leave the DOM alone. Rebuilding it
  // would destroy the buttons mid-interaction - moving focus to one of them
  // blurs the input, and the blur handler lands right back here.
  if (!box.hidden && box.dataset.for === suggested) return;
  box.hidden = false;
  box.dataset.for = suggested;
  box.innerHTML =
    `Did you mean <button type="button" class="suggest-btn" id="emailSuggestBtn">${esc(suggested)}</button>? ` +
    `<button type="button" class="suggest-dismiss" id="emailSuggestNo">Keep mine</button>`;
  el("emailSuggestBtn").addEventListener("click", () => {
    state.contact.email = suggested;
    el("f_email").value = suggested;
    el("emailErr").textContent = "";
    suggestionSettled = "";           // corrected address: nothing left to warn about
    hideSuggestion();
    updateNextEnabled();
    el("f_email").focus();
  });
  el("emailSuggestNo").addEventListener("click", () => {
    suggestionSettled = suggested;    // asked and answered; do not interrupt again
    hideSuggestion();
    el("f_email").focus();
  });
}

/* ---------- Choice step (background) ---------- */
function renderChoice(step, container) {
  const labelMap = {
    industry: "What industry does your organisation operate in?",
    region: "Where is your organisation based?",
    company_size: "How large is your organisation?",
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

/* ---------- Maturity step ---------- */
function renderMaturity(step, container) {
  const q = M[step.key];
  const dimIndex = DIMENSIONS.findIndex(d => d.id === step.dim || d.id === q.dim);
  const qNum = STEPS.slice(0, current + 1).filter(s => s.kind === "maturity").length;
  el("qIndex").textContent = `Q${qNum}`;
  el("qStem").textContent = q.stem;
  el("qHint").textContent = "Pick the option that fits best today, not where you hope to be.";
  container.setAttribute("role", "radiogroup");
  container.setAttribute("aria-label", q.stem);
  const selected = state.maturity[step.key];
  // No maturity chip on the option: showing the answer key invites a defensive
  // reader to inflate, then discount their own result. Order, option text,
  // index and the submitted payload are all unchanged.
  container.innerHTML = q.opts.map((opt, i) => `
    <button class="answer ${selected === i ? "is-selected" : ""}" role="radio" aria-checked="${selected === i}" data-idx="${i}">
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

/* ============================================================
   Navigation
   ============================================================ */
function isStepAnswered() {
  const step = STEPS[current];
  if (step.kind === "contact") {
    const c = state.contact;
    return c.first_name.trim() && c.last_name.trim() && c.company.trim() && validEmail(c.email);
  }
  if (step.kind === "choice") return state.choice[step.field] != null;
  return state.maturity[step.key] != null;
}

function updateNextEnabled() { el("nextBtn").disabled = !isStepAnswered(); }

let advanceTimer = null;
function autoAdvance() {
  // gentle auto-advance for single-select cards, PwC-style
  clearTimeout(advanceTimer);
  if (current === TOTAL_Q - 1) return;
  advanceTimer = setTimeout(() => { if (isStepAnswered()) goNext(); }, 700);
}

function goNext() {
  clearTimeout(advanceTimer); // else Enter within the auto-advance window double-advances
  if (!isStepAnswered()) return;
  if (STEPS[current].kind === "contact") {
    if (!validEmail(state.contact.email)) {
      el("emailErr").textContent = "Please enter a valid email.";
      return;
    }
    // Last line of defence, for the reader who types the address and goes
    // straight for the button. Stop once, put them back in the email field
    // with the prompt showing; a second press submits what they typed.
    clearTimeout(suggestTimer);
    const suggested = emailSuggestion(state.contact.email);
    if (suggested && suggested !== suggestionSettled) {
      suggestionSettled = suggested;
      showSuggestion(suggested);
      el("f_email").focus();
      return;
    }
  }
  if (current === TOTAL_Q - 1) { finish(); return; }
  current++;
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
  current--;
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
   ============================================================ */
function computeScores() {
  let total = 0;
  const dimMeans = [];
  const dims = DIMENSIONS.map(d => {
    let sum = 0;
    d.keys.forEach(k => { sum += (state.maturity[k] ?? 0) + 1; });
    const max = d.keys.length * 5;
    total += sum;
    dimMeans.push(sum / d.keys.length);
    return { id: d.id, label: d.label, short: d.short, score: sum, max, pct: Math.round((sum / max) * 100) };
  });
  const maxTotal = 75;
  // Overall = equal-weighted dimensions (mean of the six dimension means x20).
  // EXACTLY mirrors the deployed Apps Script so screen and emailed report agree.
  const pct = Math.round(dimMeans.reduce((a, b) => a + b, 0) / dimMeans.length * 20);
  const tier = tierFor(pct);
  // Weakest = lowest dimension mean; ties broken by the per-tier matrix
  // (TIE_PRIORITY), exactly like the deployed Apps Script. Means are compared
  // exactly via cross-multiplication (score/max as integer fractions).
  const cmp = (a, b) => a.score * b.max - b.score * a.max;
  const lowest = dims.reduce((m, d) => (cmp(d, m) < 0 ? d : m), dims[0]);
  const tiedIds = dims.filter(d => cmp(d, lowest) === 0).map(d => d.id);
  const weakestId = TIE_PRIORITY[tier.name].find(id => tiedIds.includes(id));
  const weakest = dims.find(d => d.id === weakestId);
  const strongest = dims.slice().sort((a, b) => b.pct - a.pct || b.score - a.score)[0];
  return { total, maxTotal, pct, tier, dims, weakest, strongest };
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
  p.append(ENTRY.first_name, state.contact.first_name.trim());
  p.append(ENTRY.last_name, state.contact.last_name.trim());
  p.append(ENTRY.company, state.contact.company.trim());
  p.append("emailAddress", state.contact.email.trim());
  p.append(ENTRY.industry, state.choice.industry);
  p.append(ENTRY.region, state.choice.region);
  p.append(ENTRY.company_size, state.choice.company_size);
  p.append(ENTRY.role, state.choice.role);
  // 15 maturity answers — EXACT original strings
  Object.keys(M).forEach(key => {
    const idx = state.maturity[key] ?? 0;
    p.append(M[key].entry, M[key].opts[idx]);
  });
  if (REFERRAL) p.append(ENTRY.referral_source, REFERRAL);
  p.append("pageHistory", "0,1,2,3,4,5,6,7");
  p.append("fvv", "1");
  return p;
}

let submitStatus = "pending"; // "pending" | "sent" | "failed"

function submitNoteText() {
  if (submitStatus === "sent")
    return `Your responses have been recorded. A copy of your results is on its way to ${state.contact.email}.`;
  if (submitStatus === "failed")
    return "We couldn't reach our server - your results above are complete, but the email copy may not arrive.";
  return `Sending your results to ${state.contact.email}...`;
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
  const weak = s.weakest;
  el("resultsInner").innerHTML = `
    <div class="result-hero">
      <p class="result-eyebrow">Your AI Readiness</p>
      <h1 class="result-tier-name">${s.tier.name}</h1>
      <p class="result-score-line"><b>${s.pct}%</b> ready</p>
      <p class="result-discuss"><a href="https://www.freshstrategy.ai/debrief" target="_blank" rel="noopener">Book your free debrief</a></p>
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
    </div>

    <div class="result-cta">
      <h2>Put your first few moves in order</h2>
      <p>A free 30-minute debrief with Stéphanie, online, at a time you pick. You leave with your first few moves, in order, agreed for your organisation.</p>
      <a class="btn btn--primary btn--lg" href="https://www.freshstrategy.ai/debrief" target="_blank" rel="noopener">Book your debrief</a>
    </div>

    <div class="result-foot"><button id="restartBtn">Answer differently? Retake the assessment</button></div>
  `;
  // animate bars in
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

  // grid rings
  let rings = "";
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const p = dims.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ");
    rings += `<polygon points="${p}" fill="none" stroke="#E4E0DA" stroke-width="1"/>`;
  });
  // spokes + labels
  let spokes = "", labels = "";
  dims.forEach((d, i) => {
    const [x, y] = pt(i, R);
    spokes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#E4E0DA" stroke-width="1"/>`;
    const [lx, ly] = pt(i, R + 22);
    const anchor = Math.abs(lx - cx) < 8 ? "middle" : (lx > cx ? "start" : "end");
    const dy = ly < cy ? -2 : 12;
    labels += `<text x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}" text-anchor="${anchor}" class="radar-lbl">${d.short}</text>`;
  });
  // data polygon
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

/* ---------- Email domain typo detection ----------
   `alex@gmial.com` is a valid address by the regex above, so it passes the
   gate, the report is sent into a void and the reader concludes we never sent
   it. This suggests a correction; it never blocks. A domain we do not
   recognise is assumed correct, because most respondents are on corporate
   domains we have never seen. */
const KNOWN_DOMAINS = [
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
  "yahoo.com", "yahoo.co.uk", "icloud.com", "me.com", "aol.com", "msn.com",
  "protonmail.com", "proton.me", "gmx.de", "gmx.ch", "gmx.net", "web.de",
  "bluewin.ch", "sunrise.ch", "hispeed.ch",
];

function editDistance(a, b) {
  // Damerau-Levenshtein: transposition is one edit, so gmial/gmail is
  // distance 1, which is the single most common way to mistype it.
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }
  return d[m][n];
}

/** The corrected address, or "" when the domain looks fine or unfamiliar. */
function emailSuggestion(value) {
  const v = (value || "").trim();
  if (!validEmail(v)) return "";
  const at = v.lastIndexOf("@");
  const local = v.slice(0, at);
  const domain = v.slice(at + 1).toLowerCase();
  if (KNOWN_DOMAINS.indexOf(domain) !== -1) return "";   // already correct

  let best = "", bestDist = Infinity;
  for (const known of KNOWN_DOMAINS) {
    // A one-character domain is not a near-miss of a nine-character one.
    if (Math.abs(known.length - domain.length) > 2) continue;
    const dist = editDistance(domain, known);
    if (dist < bestDist) { bestDist = dist; best = known; }
  }
  // Short domains get one edit of latitude, longer ones two. Anything further
  // away is treated as a real domain we simply do not know.
  const allowed = best.length <= 9 ? 1 : 2;
  if (bestDist === 0 || bestDist > allowed) return "";
  return local + "@" + best;
}

/* keyboard: Enter advances */
document.addEventListener("keydown", e => {
  // ignore Enter while one of these has focus: the button's own activation
  // handles it, and acting twice on one keypress would either skip a question
  // or submit the moment the reader accepts an email correction
  const held = ["answer", "suggest-btn", "suggest-dismiss"];
  if (document.activeElement && held.some(c => document.activeElement.classList.contains(c))) return;
  if (e.key === "Enter" && !wizardScreen.hidden && !el("nextBtn").disabled) goNext();
});
