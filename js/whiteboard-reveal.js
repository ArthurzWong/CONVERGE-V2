/* =========================================================================
 * CONVERGE2 — Whiteboard Reveal Engine
 * -------------------------------------------------------------------------
 * A browser-native reinterpretation of the raster "whiteboard animation"
 * idea from github.com/masihsultani/whiteboard-animator, rebuilt for SVG:
 *
 *   repo concept                    this engine
 *   -----------------------------   ---------------------------------------
 *   connected-component ordering    BFS layers outward from the core node
 *   containers before contents      hub node first, then its relations
 *   skeleton path from an endpoint  edge drawn source -> target, never mid-way
 *   text written word by word       node labels typed character by character
 *   committed / fading pixel model  committed (settled) vs live (animating)
 *   "marker sprite follows pen"     a pen dot travels the edge being drawn
 *
 * Everything is dependency-free and works offline from file://.
 * ========================================================================= */
(function (global) {
  "use strict";

  const EASE = (t) => 1 - Math.pow(1 - t, 3);            // easeOutCubic
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  class WhiteboardReveal {
    /* elements: { svg, edgeEls:[{id,pathEl,penEl,source,target}],
     *             nodeEls:[{id,groupEl,ringEl,fillEl,labelEl,label,core}] }
     * graph:    normalized graph { nodes, edges, adjacency } */
    constructor({ svg, graph, elements, duration = 9000, onStep = null, onDone = null }) {
      this.svg = svg;
      this.graph = graph;
      this.el = elements;
      this.duration = duration;
      this.onStep = onStep;
      this.onDone = onDone;

      this.schedule = [];
      this.t0 = 0;
      this.raf = null;
      this.running = false;
      this.playing = false;
      this._pauseAt = 0;
      this._build();
    }

    /* ---- ordering: BFS layers outward from the core, hubs first ------- */
    _build() {
      const g = this.graph;
      const nodeById = new Map(g.nodes.map((n) => [n.id, n]));
      const core = g.nodes.find((n) => n.core) || g.nodes[0];

      const level = new Map([[core.id, 0]]);
      const queue = [core.id];
      const edgeOrder = [];
      while (queue.length) {
        const id = queue.shift();
        const neighbours = (g.adjacency.get(id) || []).slice().sort((a, b) => b.strength - a.strength);
        for (const nb of neighbours) {
          const other = nb.source === id ? nb.target : nb.source;
          if (!level.has(other)) {
            level.set(other, level.get(id) + 1);
            queue.push(other);
          }
          edgeOrder.push({ edge: nb, depth: level.get(id) + 1, from: id });
        }
      }
      // any node unreachable (defensive) still gets drawn
      for (const n of g.nodes) if (!level.has(n.id)) level.set(n.id, 99);

      const edgeById = new Map(this.el.edgeEls.map((e) => [e.id, e]));
      const nodeElById = new Map(this.el.nodeEls.map((e) => [e.id, e]));

      // Assign relative weights; deeper layers get slightly less time each.
      const items = [];
      const maxDepth = Math.max(...level.values());

      // Group edges + nodes by their BFS depth and interleave: at each depth,
      // draw incoming edges, then the nodes they reach (repo: shape, then label).
      const byDepth = new Map();
      for (const eo of edgeOrder) {
        const d = eo.depth;
        if (!byDepth.has(d)) byDepth.set(d, { edges: [], nodes: [] });
        byDepth.get(d).edges.push(eo);
      }
      for (const n of g.nodes) {
        const d = level.get(n.id);
        if (!byDepth.has(d)) byDepth.set(d, { edges: [], nodes: [] });
        byDepth.get(d).nodes.push(n);
      }

      const seenEdges = new Set();
      for (let d = 0; d <= maxDepth; d++) {
        const bucket = byDepth.get(d);
        if (!bucket) continue;
        for (const eo of bucket.edges) {
          const key = eo.edge.id || `${eo.edge.source}->${eo.edge.target}`;
          if (seenEdges.has(key)) continue;
          seenEdges.add(key);
          const el = edgeById.get(key);
          if (el) items.push({ kind: "edge", el, depth: d, weight: 1.0 * (1 - d * 0.08) });
        }
        for (const n of bucket.nodes) {
          const el = nodeElById.get(n.id);
          if (el) items.push({ kind: "node", el, depth: d, weight: n.core ? 0 : 1.15 * (1 - d * 0.06) });
        }
      }

      // normalize weights to the requested duration, keeping 4% tail
      const usable = this.duration * 0.96;
      const total = items.reduce((s, it) => s + Math.max(0.05, it.weight), 0) || 1;
      let cursor = 0;
      for (const it of items) {
        const share = (Math.max(0.05, it.weight) / total) * usable;
        it.t0 = cursor;
        it.dur = Math.max(140, share);
        cursor += share;
      }
      this.schedule = items;
      this.totalDuration = this.duration;
    }

    /* ---- rendering state helpers ------------------------------------- */
    _reset() {
      for (const e of this.el.edgeEls) {
        const len = e._len || (e._len = safeLen(e.pathEl));
        e.pathEl.style.strokeDasharray = `${len}`;
        e.pathEl.style.strokeDashoffset = `${len}`;
        e.pathEl.style.opacity = "0";
        if (e.penEl) e.penEl.style.opacity = "0";
      }
      for (const n of this.el.nodeEls) {
        const c = n._circ || (n._circ = safeCirc(n.ringEl));
        n.ringEl.style.strokeDasharray = `${c}`;
        n.ringEl.style.strokeDashoffset = `${c}`;
        n.ringEl.style.opacity = "1";
        n.fillEl.style.opacity = "0";
        n.fillEl.style.transform = "scale(0.2)";
        n.fillEl.style.transformOrigin = "center";
        n.fillEl.style.transformBox = "fill-box";
        this._setLabel(n, "");
        n.groupEl.classList.remove("revealed");
      }
    }

    /* Label writing goes through an optional callback so the caller can keep
     * multi-line <tspan> structure intact while text types out character by
     * character. Without that, assigning textContent would detach the tspans. */
    _setLabel(n, str) {
      if (typeof n.setLabel === "function") n.setLabel(str);
      else if (n.labelEl) n.labelEl.textContent = str;
    }

    _commitEdge(e) {
      e.pathEl.style.strokeDashoffset = "0";
      e.pathEl.style.opacity = "";
      if (e.penEl) e.penEl.style.opacity = "0";
      e.pathEl.classList.add("revealed");
    }
    _commitNode(n) {
      const c = n._circ || (n._circ = safeCirc(n.ringEl));
      n.ringEl.style.strokeDashoffset = "0";
      n.fillEl.style.opacity = "";
      n.fillEl.style.transform = "scale(1)";
      this._setLabel(n, n.label);
      n.groupEl.classList.add("revealed");
    }

    /* ---- frame loop -------------------------------------------------- */
    _frame(now) {
      if (!this.playing) return;
      if (!this.t0) this.t0 = now - this._pauseAt;
      const t = now - this.t0;
      let active = null;

      for (const it of this.schedule) {
        const p = clamp((t - it.t0) / it.dur, 0, 1);
        if (it.kind === "edge") {
          const e = it.el;
          const len = e._len || (e._len = safeLen(e.pathEl));
          e.pathEl.style.opacity = "1";
          e.pathEl.style.strokeDashoffset = `${len * (1 - EASE(p))}`;
          if (e.penEl) {
            if (p > 0 && p < 1) {
              e.penEl.style.opacity = "1";
              const pt = pointAt(e.pathEl, EASE(p));
              if (pt) {
                e.penEl.setAttribute("cx", pt.x);
                e.penEl.setAttribute("cy", pt.y);
              }
            } else if (p >= 1) {
              e.penEl.style.opacity = "0";
            }
          }
          if (p >= 1 && !it._done) { it._done = true; this._commitEdge(e); }
          if (p < 1) active = { it, p };
        } else {
          const n = it.el;
          const c = n._circ || (n._circ = safeCirc(n.ringEl));
          if (p > 0) n.ringEl.style.strokeDashoffset = `${c * (1 - EASE(p))}`;
          const fp = clamp((p - 0.25) / 0.5, 0, 1);
          n.fillEl.style.opacity = `${0.15 + 0.85 * EASE(fp)}`;
          n.fillEl.style.opacity = `${EASE(fp)}`;
          n.fillEl.style.transform = `scale(${0.2 + 0.8 * EASE(fp)})`;
          // label typed after the ring closes
          const lp = clamp((p - 0.55) / 0.45, 0, 1);
          this._setLabel(n, n.label.slice(0, Math.round(n.label.length * lp)));
          if (p >= 1 && !it._done) { it._done = true; this._commitNode(n); }
          if (p < 1) active = { it, p };
        }
      }

      const progress = clamp(t / this.totalDuration, 0, 1);
      if (this.onStep) {
        this.onStep({
          progress,
          depth: active ? active.it.depth : maxDepthOf(this.schedule),
          kind: active ? active.it.kind : null,
        });
      }

      if (t >= this.totalDuration) {
        this.playing = false;
        this.running = false;
        this._finishAll();
        if (this.onDone) this.onDone();
        return;
      }
      this.raf = requestAnimationFrame((n) => this._frame(n));
    }

    _finishAll() {
      for (const e of this.el.edgeEls) this._commitEdge(e);
      for (const n of this.el.nodeEls) this._commitNode(n);
      if (this.onStep) this.onStep({ progress: 1, depth: 99, kind: null });
    }

    /* ---- public API -------------------------------------------------- */
    play({ replay = false } = {}) {
      if (replay) this._reset();
      this._pauseAt = 0; this.t0 = 0;
      this.playing = true; this.running = true;
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame((n) => this._frame(n));
    }
    replay() { this._reset(); this.play(); }
    pause() {
      if (!this.playing) return;
      this.playing = false;
      cancelAnimationFrame(this.raf);
      this._pauseAt = performance.now() - this.t0;
    }
    resume() {
      if (this.playing || !this.running) return;
      this.playing = true; this.t0 = 0;
      this.raf = requestAnimationFrame((n) => this._frame(n));
    }
    toggle() { this.playing ? this.pause() : this.resume(); }
    finish() { cancelAnimationFrame(this.raf); this.playing = false; this.running = false; this._finishAll(); }
  }

  /* ---- tiny geometry helpers (jsdom-safe) ---------------------------- */
  function safeLen(path) { try { return path.getTotalLength() || 200; } catch (e) { return 200; } }
  function safeCirc(el) {
    try {
      const r = parseFloat(el.getAttribute("r")) || 24;
      return 2 * Math.PI * r;
    } catch (e) { return 150; }
  }
  function pointAt(path, t) {
    try {
      const L = path.getTotalLength() || 1;
      return path.getPointAtLength(L * t);
    } catch (e) { return null; }
  }
  function maxDepthOf(schedule) {
    return schedule.reduce((m, it) => Math.max(m, it.depth), 0);
  }

  global.WhiteboardReveal = WhiteboardReveal;
})(window);
