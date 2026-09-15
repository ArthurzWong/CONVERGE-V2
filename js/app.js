/* =========================================================================
 * CONVERGE2 — Signal Canvas  ·  app.js
 * Pipeline: SEE → UNDERSTAND → FORESEE → DECIDE → ACT
 * ========================================================================= */
(function () {
  "use strict";
  const D = window.CONVERGE2_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVGNS = "http://www.w3.org/2000/svg";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nfmt = (n) => n.toLocaleString("en-US");

  const TYPE_META = {
    market:      { color: "var(--c-market)",      label: "Market" },
    technology:  { color: "var(--c-tech)",        label: "Technology" },
    regulation:  { color: "var(--c-reg)",         label: "Regulation" },
    risk:        { color: "var(--c-risk)",        label: "Risk" },
    opportunity: { color: "var(--c-opp)",         label: "Opportunity" },
    capital:     { color: "var(--c-capital)",     label: "Capital" },
    talent:       { color: "var(--c-talent)",      label: "Talent / People" },
    entity:      { color: "var(--c-entity)",      label: "Entity" },
  };
  const EDGE_META = {
    adoption:            "#60a5fa",
    technology:          "#35d0d6",
    regulation:          "#f5b545",
    risk:                "#ff5d6c",
    opportunity:         "#34d399",
    financing:           "#2dd4bf",
    distribution:        "#a78bfa",
    "supply chain":      "#f472b6",
    "customer engagement": "#60a5fa",
  };
  const PRIORITY_TONE = { P0: "red", P1: "amber", P2: "blue", P3: "muted" };
  const QUALITY_TONE = { FACT: "green", INFERENCE: "blue", HYPOTHESIS: "amber", SPECULATION: "muted" };

  /* ---------------- graph prep ---------------- */
  function buildGraph() {
    const nodes = D.nodes.map((n) => ({ ...n }));
    const edges = D.edges.map((e) => ({ ...e, id: `${e.source}->${e.target}` }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const adjacency = new Map(nodes.map((n) => [n.id, []]));
    for (const e of edges) {
      adjacency.get(e.source).push({ ...e });
      adjacency.get(e.target).push({ ...e });
    }
    for (const n of nodes) n.degree = adjacency.get(n.id).length;

    // radial layout: core centre, then rings by BFS depth
    const core = nodes.find((n) => n.core) || nodes[0];
    const level = new Map([[core.id, 0]]);
    const q = [core.id];
    while (q.length) {
      const id = q.shift();
      for (const e of adjacency.get(id)) {
        const other = e.source === id ? e.target : e.source;
        if (!level.has(other)) { level.set(other, level.get(id) + 1); q.push(other); }
      }
    }
    for (const n of nodes) if (!level.has(n.id)) level.set(n.id, 2);
    core.level = 0; core.x = 500; core.y = 322;

    // cluster each ring by type so colours group like a hand-drawn sketch
    const rings = {};
    for (const n of nodes) if (n !== core) (rings[level.get(n.id)] = rings[level.get(n.id)] || []).push(n);
    const ringR = { 1: 168, 2: 288, 3: 360 };
    Object.keys(rings).forEach((lv) => {
      const arr = rings[lv].sort((a, b) => a.type.localeCompare(b.type));
      const R = ringR[lv] || 300;
      const offset = lv === "1" ? -Math.PI / 2 : -Math.PI / 2 + 0.35;
      arr.forEach((n, i) => {
        const a = offset + (i / arr.length) * Math.PI * 2;
        n.x = 500 + Math.cos(a) * R;
        n.y = 322 + Math.sin(a) * R;
        n.level = parseInt(lv, 10);
      });
    });

    function radius(n) { return n.core ? 40 : 15 + Math.min(13, (n.degree || 1) * 1.7); }
    for (const n of nodes) n.r = radius(n);
    return { nodes, edges, byId, adjacency, core, level };
  }
  const G = buildGraph();

  const state = {
    scenario: "base",
    sliders: { ...D.scenarios[0].profile },
    selectedSignal: null,
    selectedNode: null,
    reveal: null,
    running: false,
  };

  /* =====================================================================
   * RENDER · signal inbox
   * =================================================================== */
  /* Signals captured in-app live in the record store; they are merged into the
     inbox alongside the shipped demo feed so a filed signal is immediately
     part of the working set. */
  function localSignals() {
    const cap = window.CONVERGE2_CAPTURE;
    if (!cap || !cap.store) return [];
    return cap.store.list().filter((r) => r.type === "signal").map((r) => ({
      id: r.id, local: true,
      priority: r.payload.priority, quality: r.payload.quality,
      confidence: r.payload.confidence,
      date: (r.createdAt || "").slice(0, 10),
      source: r.payload.source, title: r.payload.title,
      why: r.payload.why, entities: r.payload.entities || [],
    }));
  }
  function allSignals() { return localSignals().concat(D.signals); }

  function renderSignals() {
    const wrap = $("#signal-list");
    const list = allSignals();
    wrap.innerHTML = list.map((s) => `
      <button class="signal-card ${state.selectedSignal === s.id ? "is-active" : ""}" data-signal="${esc(s.id)}" type="button">
        <div class="signal-top">
          <span class="chip chip-${PRIORITY_TONE[s.priority] || "muted"}">${esc(s.priority)}</span>
          <span class="chip chip-ghost chip-${QUALITY_TONE[s.quality] || "muted"}">${esc(s.quality)}</span>
          ${s.local ? '<span class="chip chip-ghost chip-green chip-local">local</span>' : ""}
          <span class="signal-date">${esc(s.date)}</span>
        </div>
        <div class="signal-title">${esc(s.title)}</div>
        <div class="signal-meta">${esc(s.source)}</div>
      </button>`).join("");
    $$(".signal-card", wrap).forEach((b) =>
      b.addEventListener("click", () => selectSignal(b.dataset.signal))
    );
  }

  function selectSignal(id) {
    state.selectedSignal = state.selectedSignal === id ? null : id;
    renderSignals();
    applySignalHighlight();
    const sig = allSignals().find((s) => s.id === id);
    if (sig) showInspector("signal", sig); else hideInspector();
  }

  function applySignalHighlight() {
    const sig = state.selectedSignal ? allSignals().find((s) => s.id === state.selectedSignal) : null;
    const active = new Set(sig ? sig.entities : []);
    $$(".node").forEach((g) => {
      const on = !sig || active.has(g.dataset.id);
      g.classList.toggle("dim", !on);
      g.classList.toggle("hot", !!sig && active.has(g.dataset.id));
    });
    $$(".edge").forEach((g) => {
      const [a, b] = g.dataset.id.split("->");
      const on = !sig || (active.has(a) && active.has(b));
      g.classList.toggle("dim", !on);
      g.classList.toggle("hot", !!sig && on);
    });
  }

  /* =====================================================================
   * RENDER · knowledge graph (SVG)
   * =================================================================== */
  const EDGE_ELEMS = [];
  const NODE_ELEMS = [];
  let svgEl;

  function edgePath(a, b) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const bow = clamp(len * 0.12, 10, 46);
    const cx = mx + nx * bow, cy = my + ny * bow;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }

  function labelLines(text, max = 15) {
    const words = text.split(" ");
    const lines = []; let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  function renderGraph() {
    svgEl = $("#graph");
    const defs = document.createElementNS(SVGNS, "defs");
    defs.innerHTML = `
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="coreGrad" cx="50%" cy="42%" r="70%">
        <stop offset="0%" stop-color="#6aa2ff"/><stop offset="100%" stop-color="#2f66d8"/>
      </radialGradient>`;
    svgEl.appendChild(defs);

    const edgeLayer = document.createElementNS(SVGNS, "g");
    edgeLayer.setAttribute("class", "layer-edges");
    const nodeLayer = document.createElementNS(SVGNS, "g");
    nodeLayer.setAttribute("class", "layer-nodes");
    svgEl.appendChild(edgeLayer); svgEl.appendChild(nodeLayer);

    // faint background arcs, like a drawn sketch grid
    const bg = document.createElementNS(SVGNS, "g");
    bg.setAttribute("class", "layer-bg");
    [168, 288, 360].forEach((r) => {
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", 500); c.setAttribute("cy", 322); c.setAttribute("r", r);
      c.setAttribute("class", "bg-arc"); bg.appendChild(c);
    });
    svgEl.insertBefore(bg, edgeLayer);

    // edges
    for (const e of G.edges) {
      const a = G.byId.get(e.source), b = G.byId.get(e.target);
      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "edge");
      g.dataset.id = e.id;
      g.style.setProperty("--edge-color", EDGE_META[e.type] || "#7c8db5");
      g.style.setProperty("--edge-width", (0.9 + e.strength / 55).toFixed(2));
      const p = document.createElementNS(SVGNS, "path");
      p.setAttribute("class", "edge-line");
      p.setAttribute("d", edgePath(a, b));
      const pen = document.createElementNS(SVGNS, "circle");
      pen.setAttribute("class", "edge-pen"); pen.setAttribute("r", "3.4");
      pen.style.fill = EDGE_META[e.type] || "#7c8db5";
      g.appendChild(p); g.appendChild(pen);
      g.addEventListener("click", (ev) => { ev.stopPropagation(); showInspector("edge", e); });
      edgeLayer.appendChild(g);
      EDGE_ELEMS.push({ id: e.id, pathEl: p, penEl: pen, source: e.source, target: e.target });
    }

    // nodes
    for (const n of G.nodes) {
      const meta = TYPE_META[n.type] || TYPE_META.entity;
      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "node" + (n.core ? " node-core" : ""));
      g.dataset.id = n.id;
      g.style.setProperty("--node-color", meta.color);

      const halo = document.createElementNS(SVGNS, "circle");
      halo.setAttribute("class", "node-halo"); halo.setAttribute("cx", n.x); halo.setAttribute("cy", n.y); halo.setAttribute("r", n.r + 7);
      const fill = document.createElementNS(SVGNS, "circle");
      fill.setAttribute("class", "node-fill"); fill.setAttribute("cx", n.x); fill.setAttribute("cy", n.y); fill.setAttribute("r", n.r);
      const ring = document.createElementNS(SVGNS, "circle");
      ring.setAttribute("class", "node-ring"); ring.setAttribute("cx", n.x); ring.setAttribute("cy", n.y); ring.setAttribute("r", n.r + 3);
      ring.setAttribute("fill", "none");

      const lines = labelLines(n.label);
      const text = document.createElementNS(SVGNS, "text");
      text.setAttribute("class", "node-label");
      text.setAttribute("x", n.x); text.setAttribute("y", n.y + n.r + 16);
      const tspans = lines.map((_, i) => {
        const t = document.createElementNS(SVGNS, "tspan");
        t.setAttribute("x", n.x); t.setAttribute("dy", i === 0 ? 0 : 13);
        text.appendChild(t); return t;
      });

      g.appendChild(halo); g.appendChild(fill); g.appendChild(ring); g.appendChild(text);
      g.addEventListener("click", (ev) => { ev.stopPropagation(); selectNode(n.id); });
      nodeLayer.appendChild(g);
      NODE_ELEMS.push({
        id: n.id, groupEl: g, ringEl: ring, fillEl: fill, labelEl: text, tspans,
        label: lines.join(" "), lines, core: !!n.core,
        // Called by the reveal engine while it types the label out.
        setLabel(str) {
          let rem = str;
          lines.forEach((line, i) => {
            tspans[i].textContent = rem.slice(0, line.length);
            rem = rem.slice(line.length + 1);
          });
        },
      });
    }

    $("#graph-legend").innerHTML = Object.keys(TYPE_META)
      .filter((t) => G.nodes.some((n) => n.type === t))
      .map((t) => `<span class="lg"><i style="background:${TYPE_META[t].color}"></i>${TYPE_META[t].label}</span>`).join("");
  }

  function buildReveal() {
    state.reveal = new window.WhiteboardReveal({
      svg: svgEl, graph: G,
      elements: { edgeEls: EDGE_ELEMS, nodeEls: NODE_ELEMS },
      duration: 9000,
      onStep: ({ progress }) => {
        const bar = $("#reveal-bar"); if (bar) bar.style.width = (progress * 100).toFixed(1) + "%";
      },
    });
  }

  /* =====================================================================
   * RENDER · metrics strip
   * =================================================================== */
  function renderMetrics() {
    const nodes = G.nodes.length, edges = G.edges.length;
    const avg = Math.round(G.edges.reduce((s, e) => s + e.strength, 0) / edges);
    const strongest = G.edges.slice().sort((a, b) => b.strength - a.strength)[0];
    const hub = G.nodes.slice().sort((a, b) => (b.degree * 10 + (b.core ? 99 : 0)) - (a.degree * 10 + (a.core ? 99 : 0)))[0];
    const types = {}; G.edges.forEach((e) => (types[e.type] = (types[e.type] || 0) + 1));
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0][0];
    const cells = [
      { k: nfmt(nodes), v: "Nodes" }, { k: nfmt(edges), v: "Edges" },
      { k: nfmt(avg), v: "Avg strength" }, { k: nfmt(strongest.strength), v: "Strongest link" },
      { k: esc(hub.label), v: "Top hub" }, { k: esc(topType), v: "Top relation" },
    ];
    $("#metrics").innerHTML = cells.map((c) => `<div class="metric"><div class="metric-k">${c.k}</div><div class="metric-v">${c.v}</div></div>`).join("");
  }

  /* =====================================================================
   * RENDER · simulation controls + derived model
   * =================================================================== */
  function model() {
    const s = state.sliders;
    const completeness = 86;
    const stability = clamp(Math.round(28 + s.certainty * 60), 10, 96);
    const historical = clamp(Math.round(58 + s.adoption * 42), 10, 98);
    const aggregate = clamp(Math.round(completeness * 0.4 + stability * 0.24 + historical * 0.36), 5, 99);
    const confTone = aggregate >= 75 ? "green" : aggregate >= 55 ? "amber" : "red";
    return { completeness, stability, historical, aggregate, confTone, ...s };
  }

  function renderSim() {
    const wrap = $("#sim");
    const scen = D.scenarios.find((x) => x.id === state.scenario);
    wrap.innerHTML = `
      <div class="panel-head"><h3>Simulation Controls</h3><span class="tag">${esc(scen.label)} profile</span></div>
      <p class="panel-sub">${esc(scen.blurb)}</p>
      ${slider("adoption", "Adoption velocity", "Cautious", "Aggressive", (state.sliders.adoption * 100).toFixed(0) + "%")}
      ${slider("certainty", "Regulatory certainty", "Murky", "Clear", (state.sliders.certainty * 100).toFixed(0) + "%")}
      ${slider("capital", "Capital availability", "Tight", "Plentiful", (state.sliders.capital * 100).toFixed(0) + "%")}
      <button class="btn btn-primary btn-block" id="run-sim" type="button">
        <span class="spin-ico"></span> Run Full Simulation
      </button>`;
    $$("input[type=range]", wrap).forEach((inp) =>
      inp.addEventListener("input", () => {
        state.sliders[inp.name] = parseInt(inp.value, 10) / 100;
        inp.closest(".slider").querySelector(".slider-val").textContent = inp.value + "%";
        refreshDerived();
      })
    );
  }
  function slider(name, title, lo, hi, val) {
    return `<div class="slider">
      <div class="slider-head"><span>${title}</span><b class="slider-val">${val}</b></div>
      <input type="range" name="${name}" min="10" max="100" value="${parseInt(val, 10)}" />
      <div class="slider-scale"><span>${lo}</span><span>${hi}</span></div>
    </div>`;
  }

  /* =====================================================================
   * RENDER · confidence meter
   * =================================================================== */
  function renderConfidence() {
    const m = model();
    const rows = [
      { label: "Data completeness", val: m.completeness, tone: "green" },
      { label: "Market stability", val: m.stability, tone: m.stability > 60 ? "green" : "amber" },
      { label: "Historical accuracy", val: m.historical, tone: "blue" },
    ];
    $("#confidence").innerHTML = `
      <div class="panel-head"><h3>Confidence Meter</h3><span class="score-dot tone-${m.confTone}">${m.aggregate}%</span></div>
      <p class="panel-sub">Every insight carries a transparency score, so you know when to trust — or question — the pipeline.</p>
      ${rows.map((r) => `
        <div class="bar-row">
          <div class="bar-top"><span>${r.label}</span><b>${r.val}%</b></div>
          <div class="bar"><i class="tone-${r.tone}" style="width:${r.val}%"></i></div>
        </div>`).join("")}
      <div class="note tone-${m.confTone}"><b>Recommendation:</b> ${esc(D.confidence.note)}</div>`;
  }

  /* =====================================================================
   * RENDER · risk & opportunity radar (SVG polar)
   * =================================================================== */
  function renderRadar() {
    const R = D.radar; const m = model();
    const W = 360, H = 300, cx = W / 2, cy = H / 2 + 4, rad = 108;
    const n = R.axes.length;
    const oppScale = 0.6 + 0.5 * m.adoption;
    const riskScale = 1.35 - 0.6 * m.certainty;

    const pt = (i, v) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const rr = rad * clamp(v / 100, 0.04, 1);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    };
    const poly = (vals, scale) => vals.map((v, i) => pt(i, v * scale).join(",")).join(" ");
    const rings = [0.25, 0.5, 0.75, 1].map((f) => `<circle cx="${cx}" cy="${cy}" r="${(rad * f).toFixed(0)}" class="radar-ring"/>`).join("");
    const spokes = R.axes.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="radar-spoke"/>`; }).join("");
    const axisLabels = R.axes.map((ax, i) => {
      const [x, y] = pt(i, 122);
      const anchor = Math.abs(x - cx) < 6 ? "middle" : x > cx ? "start" : "end";
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="radar-axis" text-anchor="${anchor}">${ax}</text>`;
    }).join("");
    const blips = R.blips.map((b) => {
      const i = R.axes.indexOf(b.axis); const [x, y] = pt(i, b.r * 100);
      const col = b.kind === "risk" ? "var(--c-risk)" : "var(--c-opp)";
      return `<g class="blip"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${col}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="none" stroke="${col}" stroke-opacity=".4"/></g>`;
    }).join("");

    $("#radar").innerHTML = `
      <div class="panel-head"><h3>Risk &amp; Opportunity Radar</h3><span class="tag">${esc(state.scenario)} assumption</span></div>
      <svg viewBox="0 0 ${W} ${H}" class="radar-svg" role="img" aria-label="Risk and opportunity radar">
        <g class="radar-grid">${rings}${spokes}${axisLabels}</g>
        <polygon points="${poly(R.risk, riskScale)}" class="radar-area radar-risk"/>
        <polygon points="${poly(R.opportunity, oppScale)}" class="radar-area radar-opp"/>
        ${blips}
      </svg>
      <div class="radar-legend">
        <span class="lg"><i style="background:var(--c-risk)"></i>Risk exposure</span>
        <span class="lg"><i style="background:var(--c-opp)"></i>Opportunity</span>
      </div>
      <div class="blip-list">${R.blips.map((b) => `<span class="chip chip-ghost chip-${b.kind === "risk" ? "red" : "green"}">${esc(b.label)}</span>`).join("")}</div>`;
  }

  /* =====================================================================
   * RENDER · foresight
   * =================================================================== */
  function renderForesight() {
    const emph = { base: "A", optimistic: "B", conservative: "C" }[state.scenario];
    $("#foresight").innerHTML = `
      <div class="panel-head"><h3>Foresight · ${esc(D.meta.horizon)}</h3><span class="tag">3 scenarios</span></div>
      ${D.foresight.scenarios.map((s) => `
        <article class="fsc ${s.key === emph ? "fsc-emph" : ""}">
          <div class="fsc-top"><span class="fsc-key">${s.key}</span><div><b>${esc(s.title)}</b><div class="fsc-tag">${esc(s.tag)} · ${esc(s.confidence)} confidence</div></div></div>
          <p>${esc(s.summary)}</p>
          <div class="fsc-cols">
            <div><h5>Drivers</h5><ul>${s.drivers.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>
            <div><h5>Early indicators</h5><ul>${s.indicators.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>
          </div>
          <div class="fsc-unc"><h5>Uncertainties</h5>${s.uncertainties.map((u) => `<span class="chip chip-ghost">${esc(u)}</span>`).join(" ")}</div>
        </article>`).join("")}`;
  }

  /* =====================================================================
   * RENDER · decision brief
   * =================================================================== */
  function renderDecision() {
    const Dc = D.decision;
    $("#decision").innerHTML = `
      <div class="panel-head"><h3>Decision Brief</h3><span class="tag">Engine 4</span></div>
      <p class="decision-q">${esc(Dc.decision)}</p>
      <div class="two-col">
        <div><h5>Objective</h5><p>${esc(Dc.objective)}</p></div>
        <div><h5>Situation</h5><p>${esc(Dc.situation)}</p></div>
      </div>
      <h5>Evidence</h5>
      <ul class="evidence">${Dc.evidence.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
      <div class="options">
        ${Dc.options.map((o) => `
          <article class="option">
            <div class="option-key">${o.key}</div>
            <div class="option-body">
              <b>${esc(o.title)}</b>
              <p>${esc(o.detail)}</p>
              <div class="opt-split">
                <div><h5>Advantages</h5><ul>${o.advantages.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
                <div><h5>Risks</h5><ul>${o.risks.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
              </div>
            </div>
          </article>`).join("")}
      </div>
      <div class="recommend">
        <div class="rec-head"><span class="chip chip-green">Recommended</span><b>${esc(Dc.recommendation)}</b></div>
        <p>${esc(Dc.why)}</p>
        <div class="rec-foot"><span><b>Assumptions:</b> ${esc(Dc.assumptions.join(" · "))}</span><span><b>Confidence:</b> ${esc(Dc.confidence)}</span></div>
        <div class="rec-next"><b>Next action:</b> ${esc(Dc.nextAction)}</div>
      </div>`;
  }

  /* =====================================================================
   * RENDER · action board
   * =================================================================== */
  function renderActions() {
    $("#actions").innerHTML = `
      <div class="panel-head"><h3>Action Graph</h3><span class="tag">Engine 5 · ${D.actions.length} tasks</span></div>
      <div class="action-grid">
        ${D.actions.map((a) => `
          <article class="task">
            <div class="task-top">
              <span class="chip chip-${PRIORITY_TONE[a.priority]}">${a.priority}</span>
              <span class="task-id">${a.id}</span>
              ${a.executable ? `<span class="chip chip-ghost chip-green" title="AutoClaw can execute this task">autonomous</span>` : ""}
            </div>
            <b class="task-title">${esc(a.task)}</b>
            <p class="task-obj">${esc(a.objective)}</p>
            <dl class="task-meta">
              <div><dt>Why</dt><dd>${esc(a.why)}</dd></div>
              <div><dt>Owner</dt><dd>${esc(a.owner)}</dd></div>
              <div><dt>Output</dt><dd>${esc(a.output)}</dd></div>
              <div><dt>Deadline</dt><dd>${esc(a.deadline)}</dd></div>
            </dl>
            <div class="task-foot"><span class="status status-${a.status.replace(/\s+/g, "").toLowerCase()}">${esc(a.status)}</span></div>
          </article>`).join("")}
      </div>`;
  }

  /* =====================================================================
   * RENDER · impact strip
   * =================================================================== */
  function renderImpact() {
    const b = D.impact.base;
    const span = 0.5 + model().adoption;
    const hours = Math.round(b.hours.value * span);
    const touched = Math.min(b.touched.total, Math.round(b.touched.value * span));
    $("#impact").innerHTML = `
      <div class="impact-grid">
        <div class="impact-card"><span class="impact-label">Intelligence spend</span><b class="impact-val">$${Math.round(b.spend.value * span)}k</b><span class="delta up">${b.spend.delta}</span><span class="impact-sub">${esc(b.spend.sub)}</span></div>
        <div class="impact-card"><span class="impact-label">Workflows instrumented</span><b class="impact-val">${touched} of ${b.touched.total}</b><span class="delta up">${b.touched.delta}</span><span class="impact-sub">${esc(b.touched.sub)}</span></div>
        <div class="impact-card"><span class="impact-label">Analyst hours saved / mo</span><b class="impact-val">${nfmt(hours)}</b><span class="delta up">${b.hours.delta}</span><span class="impact-sub">≈ ${Math.round(hours / 1850)} FTE equivalent</span></div>
        <div class="impact-card adoption-card">
          <span class="impact-label">Adoption curve</span>
          ${b.adoption.map((a) => `
            <div class="adopt-row"><span>${a.segment}</span><b>${a.pct}%</b><span class="chip chip-ghost chip-${a.tone}">${a.badge}</span></div>`).join("")}
        </div>
        <div class="impact-card eff-card">
          <span class="impact-label">Signal yield</span>
          <svg viewBox="0 0 220 90" class="eff-svg"><polyline class="eff-line" points="${b.effectiveness ? "10,70 50,58 85,44 120,30 150,22 180,26 205,34" : ""}"/><line x1="150" y1="8" x2="150" y2="80" class="eff-peak"/><text x="156" y="20" class="eff-note">peak ${b.effectiveness.value}</text><line x1="10" y1="55" x2="210" y2="55" class="eff-grid"/><line x1="10" y1="30" x2="210" y2="30" class="eff-grid"/></svg>
          <div class="radar-legend"><span class="lg"><i style="background:#4f8cff"></i>current</span><span class="lg"><i style="background:#3ddc97"></i>p50 ${b.effectiveness.p50}</span></div>
        </div>
      </div>`;
  }

  /* =====================================================================
   * RENDER · watchlist
   * =================================================================== */
  function renderWatchlist() {
    const w = D.watchlist;
    $("#watchlist").innerHTML = `
      <div class="panel-head"><h3>Monitoring Job</h3><span class="tag">Daily</span></div>
      <p class="panel-sub"><b>MONITOR:</b> ${esc(w.monitor)}</p>
      <div class="chips">${w.check.map((c) => `<span class="chip chip-ghost">${esc(c)}</span>`).join("")}</div>
      <div class="watch-foot"><span><b>Frequency:</b> ${esc(w.frequency)}</span><span><b>Alert:</b> ${esc(w.alert)}</span></div>
      <div class="note">${esc(w.quietRule)}</div>`;
  }

  /* =====================================================================
   * Inspector (node / edge / signal detail)
   * =================================================================== */
  function showInspector(kind, payload) {
    const el = $("#inspector");
    el.classList.remove("hidden");
    if (kind === "node") {
      const n = payload, meta = TYPE_META[n.type] || TYPE_META.entity;
      const rels = G.adjacency.get(n.id) || [];
      el.innerHTML = `
        <button class="insp-close" type="button" aria-label="Close">×</button>
        <div class="insp-head"><span class="dot" style="background:${meta.color}"></span><b>${esc(n.label)}</b></div>
        <div class="insp-meta"><span class="chip chip-ghost">${meta.label}</span><span class="chip chip-ghost">${esc(n.ecosystem)}</span></div>
        <div class="kpi-row"><div><b>${n.degree}</b><span>Degree</span></div><div><b>${Math.round(rels.reduce((s, r) => s + r.strength, 0) / (rels.length || 1))}</b><span>Avg strength</span></div><div><b>${new Set(rels.map((r) => r.type)).size}</b><span>Relation types</span></div></div>
        <h5>Relationships</h5>
        <ul class="rel-list">${rels.map((r) => {
          const other = r.source === n.id ? r.target : r.source;
          const o = G.byId.get(other);
          return `<li><i style="background:${EDGE_META[r.type] || "#7c8db5"}"></i><span>${esc(o.label)}</span><em>${esc(r.type)} · ${r.strength}</em></li>`;
        }).join("")}</ul>`;
    } else if (kind === "edge") {
      const e = payload, a = G.byId.get(e.source), b = G.byId.get(e.target);
      el.innerHTML = `
        <button class="insp-close" type="button" aria-label="Close">×</button>
        <div class="insp-head"><span class="dot" style="background:${EDGE_META[e.type] || "#7c8db5"}"></span><b>${esc(a.label)} ↔ ${esc(b.label)}</b></div>
        <div class="insp-meta"><span class="chip chip-ghost">${esc(e.type)}</span></div>
        <div class="kpi-row"><div><b>${e.strength}</b><span>Strength</span></div><div><b>${esc(e.confidence)}</b><span>Confidence</span></div><div><b>${e.count}</b><span>Signals</span></div></div>
        <div class="insp-period">Period: ${esc(e.period)}</div>
        <h5>Evidence summary</h5><p>${esc(e.evidence)}</p>`;
    } else if (kind === "signal") {
      const s = payload;
      el.innerHTML = `
        <button class="insp-close" type="button" aria-label="Close">×</button>
        <div class="insp-head"><span class="dot" style="background:var(--c-blue)"></span><b>${esc(s.id)} · Signal</b></div>
        <div class="insp-meta"><span class="chip chip-${PRIORITY_TONE[s.priority]}">${s.priority}</span><span class="chip chip-ghost chip-${QUALITY_TONE[s.quality]}">${s.quality}</span><span class="chip chip-ghost">${esc(s.confidence)} confidence</span></div>
        <h5>${esc(s.title)}</h5>
        <p>${esc(s.why)}</p>
        <h5>Source</h5><p class="insp-src">${esc(s.source)} · ${esc(s.date)}</p>
        <button class="btn btn-ghost btn-block" id="open-card" type="button">Open Intelligence Card</button>`;
      setTimeout(() => { const b = $("#open-card"); if (b) b.addEventListener("click", () => openCard(s)); }, 0);
    }
    const close = $(".insp-close", el);
    if (close) close.addEventListener("click", () => { hideInspector(); clearSelection(); });
  }
  function hideInspector() { $("#inspector").classList.add("hidden"); }
  function clearSelection() {
    state.selectedSignal = null; state.selectedNode = null;
    renderSignals(); applySignalHighlight();
  }
  function selectNode(id) {
    state.selectedNode = id;
    const n = G.byId.get(id);
    applySignalHighlight();
    $$(".node").forEach((g) => g.classList.toggle("hot", g.dataset.id === id));
    showInspector("node", n);
  }

  /* ---------------- Intelligence Card modal ---------------- */
  function openCard(s) {
    const related = G.adjacency.get(s.entities[0]) || [];
    $("#modal-body").innerHTML = `
      <div class="ic">
        <div class="ic-rule">━━━━━━━━━━━━━━━━━━━━━━</div>
        <div class="ic-title">CONVERGE2 INTELLIGENCE CARD</div>
        <div class="ic-rule">━━━━━━━━━━━━━━━━━━━━━━</div>
        <div class="ic-grid">
          ${icRow("SIGNAL", s.title)}
          ${icRow("SOURCE", s.source)}
          ${icRow("DATE", s.date)}
          ${icRow("WHY IT MATTERS", s.why)}
          ${icRow("CONNECTED TO", s.entities.map((id) => G.byId.get(id).label).join(", "))}
          ${icRow("OPPORTUNITY", "Automation of a manual, mandate-adjacent workflow for SMEs.")}
          ${icRow("RISK", "Authorization and trust failure converts convenience into direct loss.")}
          ${icRow("SECOND-ORDER EFFECT", "Guardrail providers become the durable chokepoint once autonomy lands.")}
          ${icRow("FORESIGHT", "Feeds Scenario A/B/C; early indicator tracked in the monitoring job.")}
          ${icRow("RECOMMENDED ACTION", D.decision.nextAction)}
          ${icRow("CONFIDENCE", s.confidence + (s.quality === "HYPOTHESIS" ? " — treat as hypothesis" : ""))}
          ${icRow("STATUS", s.priority === "P0" ? "Action Required" : "Monitoring")}
        </div>
        <div class="ic-rule">━━━━━━━━━━━━━━━━━━━━━━</div>
        <p class="ic-note">Illustrative demo content. Replace <code>data/intelligence.js</code> with your own feed to make this live. Related relations: ${related.length}.</p>
      </div>`;
    $("#modal").classList.remove("hidden");
  }
  function icRow(k, v) { return `<div class="ic-row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`; }

  /* =====================================================================
   * Pipeline run
   * =================================================================== */
  function runPipeline() {
    if (state.running) return;
    state.running = true;
    const chips = $$(".pipe-step");
    chips.forEach((c) => c.classList.remove("on", "done"));
    $("#graph").parentElement.classList.add("is-loading");

    chips.forEach((c, i) => setTimeout(() => {
      chips.forEach((x, j) => { x.classList.toggle("on", j === i); if (j < i) x.classList.add("done"); });
    }, i * 420));

    setTimeout(() => {
      chips.forEach((c) => { c.classList.remove("on"); c.classList.add("done"); });
      $("#graph").parentElement.classList.remove("is-loading");
      if (state.reveal) state.reveal.replay();
      const m = model();
      if (window.CONVERGE2_CAPTURE) {
        window.CONVERGE2_CAPTURE.logAction("run", "run-pipeline", {
          scenario: state.scenario,
          assumptions: { ...state.sliders },
          confidence: { aggregate: m.aggregate, completeness: m.completeness, stability: m.stability, historical: m.historical },
          metrics: { nodes: G.nodes.length, edges: G.edges.length },
        });
        window.CONVERGE2_CAPTURE.renderRecords();
      }
      toast("Pipeline complete — graph re-drawn, decision refreshed.", "green");
      state.running = false;
    }, chips.length * 420 + 220);
  }

  /* =====================================================================
   * Derived refresh
   * =================================================================== */
  function refreshDerived() { renderConfidence(); renderRadar(); renderForesight(); renderImpact(); }

  /* =====================================================================
   * Scenario switching
   * =================================================================== */
  function setScenario(id) {
    state.scenario = id;
    const p = D.scenarios.find((s) => s.id === id).profile;
    state.sliders = { ...p };
    $$(".seg-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.scen === id));
    renderSim(); refreshDerived();
    if (state.reveal) state.reveal.replay();
  }

  /* =====================================================================
   * Export
   * =================================================================== */
  function exportState() {
    const m = model();
    const out = {
      generated: new Date().toISOString(),
      scenario: state.scenario,
      assumptions: state.sliders,
      confidence: { aggregate: m.aggregate, completeness: m.completeness, stability: m.stability, historical: m.historical },
      metrics: { nodes: G.nodes.length, edges: G.edges.length },
      decision: D.decision.recommendation,
      actions: D.actions.map((a) => `${a.id} · ${a.priority} · ${a.task}`),
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `converge2-brief-${state.scenario}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    if (window.CONVERGE2_CAPTURE) {
      window.CONVERGE2_CAPTURE.logAction("run", "export-brief", out);
      window.CONVERGE2_CAPTURE.renderRecords();
    }
    toast("Exported current brief as JSON.", "blue");
  }

  /* =====================================================================
   * Toast
   * =================================================================== */
  let toastTimer;
  function toast(msg, tone = "blue") {
    const t = $("#toast");
    t.textContent = msg; t.className = "toast tone-" + tone + " show";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 3200);
  }

  /* =====================================================================
   * Wire-up
   * =================================================================== */
  function init() {
    // Expose the shared context, then bring up the capture/records layer before
    // the inbox renders, so freshly filed signals appear immediately.
    window.__c2 = { G, D, state, esc, nfmt, toast, model, renderSignals, PRIORITY_TONE, QUALITY_TONE };
    if (window.CONVERGE2_CAPTURE) window.CONVERGE2_CAPTURE.init();

    renderSignals();
    renderGraph();
    buildReveal();
    renderMetrics();
    renderSim();
    renderConfidence();
    renderRadar();
    renderForesight();
    renderDecision();
    renderActions();
    renderImpact();
    renderWatchlist();
    $("#meta-idea").textContent = D.meta.idea;
    $("#meta-horizon").textContent = D.meta.horizon;

    $$(".pipe-step").forEach((c) => { c.textContent = c.dataset.step; });

    $$(".seg-btn").forEach((b) => b.addEventListener("click", () => setScenario(b.dataset.scen)));
    $("#run-sim").addEventListener("click", runPipeline);
    $("#run-top").addEventListener("click", runPipeline);
    $("#replay").addEventListener("click", () => { if (state.reveal) state.reveal.replay(); toast("Replaying whiteboard reveal.", "blue"); });
    $("#export").addEventListener("click", exportState);
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.classList.contains("modal-close")) $("#modal").classList.add("hidden"); });
    $("#graph").addEventListener("click", () => { if (state.selectedNode || state.selectedSignal) clearSelection(), hideInspector(); });
    $$("#zoom-in, #zoom-out, #fit").forEach((b) => b.addEventListener("click", () => {
      const v = $("#graph"); const vb = v.getAttribute("viewBox").split(" ").map(Number);
      const f = b.id === "zoom-in" ? 0.85 : b.id === "zoom-out" ? 1.18 : 1;
      if (b.id === "fit") { v.setAttribute("viewBox", "0 0 1000 644"); return; }
      const [x, y, w, h] = vb; const nw = w * f, nh = h * f;
      v.setAttribute("viewBox", `${x + (w - nw) / 2} ${y + (h - nh) / 2} ${nw} ${nh}`);
    }));

    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("#modal").classList.add("hidden"); hideInspector(); clearSelection(); } });

    document.body.classList.add("ready");

    // Honour reduced-motion, and allow a deep link straight to the finished
    // canvas (#skip) — useful for screenshots, print and low-powered devices.
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skip = reduce || location.hash === "#skip";
    setTimeout(() => {
      if (!state.reveal) return;
      if (skip) state.reveal.finish(); else state.reveal.play();
    }, skip ? 30 : 350);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
