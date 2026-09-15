/* =========================================================================
 * CONVERGE2 — Signal Canvas · check suite
 * Zero dependencies. Run:  node tests/check.mjs
 * Covers: dataset integrity, the primary workflow's validation rules,
 * persistence across a simulated restart, and the shipped file set.
 * ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

/* ---------------- tiny harness ---------------- */
let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  \u2713 ${name}`); }
  catch (e) { fail++; failures.push({ name, msg: e.message }); console.log(`  \u2717 ${name} \u2014 ${e.message}`); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || "expected truthy"); }
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg ? msg + ": " : ""}expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function section(s) { console.log(`\n${s}`); }

/* ---------------- load the modules under test ---------------- */
function loadDataset() {
  const code = fs.readFileSync(path.join(ROOT, "data", "intelligence.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  new vm.Script(code).runInContext(sandbox);
  return sandbox.window.CONVERGE2_DATA;
}

const D = loadDataset();
const STORE = require(path.join(ROOT, "js", "store.js"));
const NODE_IDS = D.nodes.map((n) => n.id);
const TYPES = ["market", "technology", "regulation", "risk", "opportunity", "capital", "talent", "entity"];

console.log(`CONVERGE2 Signal Canvas \u2014 check suite`);
console.log(`root: ${ROOT}`);

/* ================= 1. dataset integrity ================= */
section("1 \u00b7 Dataset integrity");

t("meta declares a 5-stage pipeline", () => eq(D.meta.pipeline.length, 5));
t("graph has at least 10 nodes", () => ok(D.nodes.length >= 10, `only ${D.nodes.length}`));
t("graph has at least 15 edges", () => ok(D.edges.length >= 15, `only ${D.edges.length}`));
t("node ids are unique", () => eq(new Set(NODE_IDS).size, NODE_IDS.length));
t("every node type is a known type", () => D.nodes.forEach((n) => ok(TYPES.includes(n.type), `node ${n.id} has type ${n.type}`)));
t("exactly one core node", () => eq(D.nodes.filter((n) => n.core).length, 1));
t("every edge references existing nodes", () => D.edges.forEach((e) => {
  ok(NODE_IDS.includes(e.source), `missing source ${e.source}`);
  ok(NODE_IDS.includes(e.target), `missing target ${e.target}`);
}));
t("edge ids are unique (source->target)", () => {
  const ids = D.edges.map((e) => `${e.source}->${e.target}`);
  eq(new Set(ids).size, ids.length);
});
t("every edge strength is 0-100", () => D.edges.forEach((e) => ok(e.strength >= 0 && e.strength <= 100, `edge ${e.source}->${e.target} = ${e.strength}`)));
t("every edge carries an evidence summary", () => D.edges.forEach((e) => ok(e.evidence && e.evidence.length > 20, `edge ${e.source}->${e.target}`)));
t("signals use valid priority and quality enums", () => D.signals.forEach((s) => {
  ok(STORE.PRIORITIES.includes(s.priority), `${s.id} priority ${s.priority}`);
  ok(STORE.QUALITIES.includes(s.quality), `${s.id} quality ${s.quality}`);
}));
t("every signal entity exists on the graph", () => D.signals.forEach((s) => (s.entities || []).forEach((id) => ok(NODE_IDS.includes(id), `${s.id} -> ${id}`))));
t("radar axes align with both series", () => {
  eq(D.radar.opportunity.length, D.radar.axes.length);
  eq(D.radar.risk.length, D.radar.axes.length);
});
t("foresight offers three scenarios A/B/C", () => {
  eq(D.foresight.scenarios.length, 3);
  eq(D.foresight.scenarios.map((s) => s.key).join(""), "ABC");
});
t("decision brief has three options and a recommendation", () => {
  eq(D.decision.options.length, 3);
  ok(D.decision.recommendation && D.decision.nextAction);
});
t("every action task has the full schema", () => D.actions.forEach((a) => {
  ["id", "task", "objective", "why", "priority", "owner", "output", "deadline", "status"].forEach((k) =>
    ok(a[k] !== undefined && a[k] !== "", `task ${a.id} missing ${k}`));
  ok(STORE.PRIORITIES.includes(a.priority), `task ${a.id} priority ${a.priority}`);
}));

/* ================= 2. primary workflow: validation ================= */
section("2 \u00b7 Signal capture \u2014 validation rules");

const good = {
  title: "A regional bank opens agent-initiated payments to SMEs",
  source: "Regulator briefing, 2026-09-12",
  priority: "P1", quality: "FACT", confidence: "Medium",
  why: "Programmatic settlement reaches the segment that runs on manual procurement.",
  entities: ["AGENTS", "PAYRAILS", "SMES"],
};

t("a complete signal is accepted", () => ok(STORE.validateSignal(good, NODE_IDS).ok));
t("title is required", () => ok(!STORE.validateSignal({ ...good, title: "  " }, NODE_IDS).ok));
t("title below minimum length is rejected", () => ok(STORE.validateSignal({ ...good, title: "AI" }, NODE_IDS).errors.title));
t("title above maximum length is rejected", () => ok(STORE.validateSignal({ ...good, title: "x".repeat(121) }, NODE_IDS).errors.title));
t("source is required", () => ok(STORE.validateSignal({ ...good, source: "" }, NODE_IDS).ok === false));
t("\u201cwhy it matters\u201d is required", () => ok(STORE.validateSignal({ ...good, why: "" }, NODE_IDS).ok === false));
t("oversized \u201cwhy it matters\u201d is rejected", () => ok(STORE.validateSignal({ ...good, why: "y".repeat(401) }, NODE_IDS).errors.why));
t("malformed priority is rejected", () => ok(STORE.validateSignal({ ...good, priority: "P9" }, NODE_IDS).errors.priority));
t("malformed source quality is rejected", () => ok(STORE.validateSignal({ ...good, quality: "VIBES" }, NODE_IDS).errors.quality));
t("at least one entity is required", () => ok(STORE.validateSignal({ ...good, entities: [] }, NODE_IDS).errors.entities));
t("unknown entity ids are rejected", () => ok(STORE.validateSignal({ ...good, entities: ["NOT_A_NODE"] }, NODE_IDS).errors.entities));
t("errors are user-readable strings", () => {
  const r = STORE.validateSignal({}, NODE_IDS);
  Object.values(r.errors).forEach((m) => ok(typeof m === "string" && m.length > 5, `weak message: ${m}`));
});

/* ================= 3. persistence ================= */
section("3 \u00b7 Persistence and traceability");

const storage = STORE.memoryStorage();
const storeA = STORE.createStore(storage);

t("store starts empty", () => eq(storeA.count(), 0));

const rejected = storeA.captureSignal({ ...good, title: "" }, NODE_IDS);
t("invalid capture returns ok:false", () => eq(rejected.ok, false));
t("invalid capture writes nothing", () => eq(storeA.count(), 0));

const accepted = storeA.captureSignal(good, NODE_IDS);
t("valid capture returns a record", () => ok(accepted.ok && accepted.record.id));
t("record carries id / action / createdAt / status", () => {
  const r = accepted.record;
  ok(/^SIG-/.test(r.id), `id ${r.id}`);
  eq(r.action, "capture-signal");
  eq(r.status, "filed");
  ok(!Number.isNaN(Date.parse(r.createdAt)), "createdAt is a date");
});
t("store now holds exactly one record", () => eq(storeA.count(), 1));

storeA.add("run", "run-pipeline", { scenario: "base", confidence: { aggregate: 78 } }, "logged");
t("pipeline runs are logged as records", () => eq(storeA.count(), 2));

// simulated restart: a brand-new store over the same storage
const storeB = STORE.createStore(storage);
t("records survive a restart", () => eq(storeB.count(), 2));
t("the captured signal is still readable after restart", () => {
  const found = storeB.list().find((r) => r.type === "signal");
  ok(found, "signal record missing after restart");
  eq(found.payload.title, good.title);
  eq(found.payload.entities.length, 3);
});
t("a single record can be opened by id", () => {
  const r = storeB.get(storeB.list()[0].id);
  ok(r && r.id === storeB.list()[0].id);
});
t("exported JSON parses and lists every record", () => {
  const parsed = JSON.parse(storeB.exportedJson());
  ok(Array.isArray(parsed.records));
  eq(parsed.records.length, 2);
});
t("clearing the store empties it", () => { storeB.clear(); eq(storeB.count(), 0); });

/* ================= 4. shipped file set ================= */
section("4 \u00b7 Shipped file set");

const REQUIRED = [
  "index.html", "styles.css", "data/intelligence.js",
  "js/app.js", "js/whiteboard-reveal.js", "js/store.js", "js/capture.js",
  "assets/architecture.svg", "README.md",
];
t("every required file exists", () => REQUIRED.forEach((f) => ok(fs.existsSync(path.join(ROOT, f)), `missing ${f}`)));

t("index.html loads only same-origin scripts", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const srcs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  srcs.forEach((s) => ok(!/^https?:|^\/\//.test(s), `external reference: ${s}`));
});
t("index.html wires the store and capture layers", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  ok(html.includes("js/store.js"), "store.js not loaded");
  ok(html.includes("js/capture.js"), "capture.js not loaded");
  ok(html.includes('id="capture-form"'), "capture form missing");
  ok(html.includes('id="records"'), "records panel missing");
});
t("index.html exposes the canvas view controls", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  ['id="zoom-in"', 'id="zoom-out"', 'id="fit"', 'id="replay"'].forEach((s) => ok(html.includes(s), `missing ${s}`));
});
t("app.js wires wheel, drag and pinch navigation", () => {
  const js = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
  ok(js.includes("wireCanvasView"), "wireCanvasView missing");
  ok(/addEventListener\("wheel"/.test(js), "wheel handler missing");
  ok(/addEventListener\("pointerdown"/.test(js), "pointerdown handler missing");
  ok(/pointers\.size >= 2/.test(js), "pinch handling missing");
  ok(/stopPropagation/.test(js), "drag-vs-click guard missing");
});
t("canvas declares grab / grabbing cursors", () => {
  const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
  ok(/cursor:\s*grab/.test(css), "grab cursor missing");
  ok(/cursor:\s*grabbing/.test(css), "grabbing cursor missing");
});

/* ---------------- summary ---------------- */
console.log(`\n${"-".repeat(56)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed, ${pass + fail} total`);
if (fail) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  \u2717 ${f.name} \u2014 ${f.msg}`));
  process.exit(1);
}
console.log("All checks passed.");
