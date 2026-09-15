/* =========================================================================
 * CONVERGE2 — Signal Canvas · capture.js
 * The primary workflow: file a signal, have it validated, persist it, and
 * trace it later in the Records panel.
 * ========================================================================= */
(function () {
  "use strict";
  const S = window.CONVERGE2_STORE;
  let C2 = {};
  let store = null;

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------ */
  function init() {
    C2 = window.__c2 || {};
    store = S.createStore();
    buildEntityPicker();
    buildSelects();
    wire();
    renderRecords();
  }

  function buildSelects() {
    const p = $("#f-priority");
    if (p) p.innerHTML = S.PRIORITIES.map((x) => `<option value="${x}">${x}</option>`).join("");
    const q = $("#f-quality");
    if (q) q.innerHTML = S.QUALITIES.map((x) => `<option value="${x}">${x}</option>`).join("");
    const c = $("#f-confidence");
    if (c) c.innerHTML = S.CONFIDENCES.map((x) => `<option value="${x}">${x}</option>`).join("");
  }

  function buildEntityPicker() {
    const box = $("#f-entities");
    if (!box || !C2.G) return;
    box.innerHTML = C2.G.nodes
      .map((n) => `<label class="pick"><input type="checkbox" name="entity" value="${n.id}"><span>${esc(n.label)}</span></label>`)
      .join("");
  }

  /* ------------------------------------------------------------------ */
  function wire() {
    const open = $("#capture-open");
    const modal = $("#capture-modal");
    if (open && modal) {
      open.addEventListener("click", () => {
        clearErrors();
        $("#capture-form").reset();
        modal.classList.remove("hidden");
        const first = $("#f-title");
        if (first) first.focus();
      });
    }
    const close = $("#capture-cancel");
    if (close && modal) close.addEventListener("click", () => modal.classList.add("hidden"));
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

    const form = $("#capture-form");
    if (form) form.addEventListener("submit", onSubmit);
  }

  function clearErrors() {
    const box = $("#capture-errors");
    if (box) { box.innerHTML = ""; box.classList.add("hidden"); }
    document.querySelectorAll("#capture-form [aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  }

  function showErrors(errors) {
    const box = $("#capture-errors");
    if (!box) return;
    const rows = Object.keys(errors).map((k) => `<li><b>${esc(label(k))}</b> — ${esc(errors[k])}</li>`).join("");
    box.innerHTML = `<p class="err-lead">Not saved. Fix the following and try again:</p><ul>${rows}</ul>`;
    box.classList.remove("hidden");
    box.scrollIntoView({ block: "nearest" });
    const fieldMap = { title: "#f-title", source: "#f-source", priority: "#f-priority", quality: "#f-quality", confidence: "#f-confidence", why: "#f-why" };
    Object.keys(fieldMap).forEach((k) => {
      const el = document.querySelector(fieldMap[k]);
      if (el && errors[k]) el.setAttribute("aria-invalid", "true");
    });
    if (errors.entities) $("#f-entities").setAttribute("aria-invalid", "true");
    const firstKey = Object.keys(errors)[0];
    const firstEl = document.querySelector(fieldMap[firstKey]) || (errors.entities ? $("#f-entities") : null);
    if (firstEl && firstEl.focus) firstEl.focus();
  }

  function label(k) {
    return { title: "Title", source: "Source", priority: "Priority", quality: "Source quality", confidence: "Confidence", why: "Why it matters", entities: "Connected entities" }[k] || k;
  }

  function onSubmit(e) {
    e.preventDefault();
    clearErrors();
    const input = {
      title: $("#f-title").value,
      source: $("#f-source").value,
      priority: $("#f-priority").value,
      quality: $("#f-quality").value,
      confidence: $("#f-confidence").value,
      why: $("#f-why").value,
      entities: Array.from(document.querySelectorAll('#f-entities input[name="entity"]:checked')).map((i) => i.value),
    };
    const validIds = C2.G ? C2.G.nodes.map((n) => n.id) : undefined;
    const res = store.captureSignal(input, validIds);

    if (!res.ok) { showErrors(res.errors); return; }   // nothing written

    $("#capture-modal").classList.add("hidden");
    if (C2.toast) C2.toast(`Signal ${res.record.id} filed and stored.`, "green");
    if (C2.renderSignals) C2.renderSignals();
    renderRecords();
  }

  /* ------------------------------------------------------------------ */
  function fmt(iso) {
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
  }

  function renderRecords() {
    const el = $("#records");
    if (!el) return;
    const recs = store.list().slice().reverse();
    const signalCount = recs.filter((r) => r.type === "signal").length;

    el.innerHTML = `
      <div class="panel-head"><h3>Records</h3><span class="tag">${recs.length} stored</span></div>
      <p class="panel-sub">Persistent log (${esc(store.storageKind)}) of every captured signal and pipeline run. Click a row to open it and trace it back to the action that created it.</p>
      <div class="rec-actions">
        <button class="btn btn-primary" id="capture-open" type="button">Capture Signal</button>
        <span class="rec-count">${signalCount} signal${signalCount === 1 ? "" : "s"}</span>
      </div>
      ${recs.length ? `<div class="rec-list">${recs.map(row).join("")}</div>`
        : `<div class="empty">No records yet. Use <b>Capture Signal</b>, or press <b>Run Pipeline</b>.</div>`}
      <div class="rec-foot">
        <button class="btn btn-ghost" id="rec-export" type="button">Download JSON</button>
        <button class="btn btn-ghost" id="rec-clear" type="button">Clear</button>
      </div>`;

    // the capture button lives in this panel, so re-wire after every render
    const open = $("#capture-open");
    if (open) open.addEventListener("click", () => {
      clearErrors();
      const f = $("#capture-form"); if (f) f.reset();
      const m = $("#capture-modal"); if (m) m.classList.remove("hidden");
      const t = $("#f-title"); if (t) t.focus();
    });

    document.querySelectorAll(".rec-row").forEach((b) => b.addEventListener("click", () => openRecord(b.dataset.rec)));

    const ex = $("#rec-export");
    if (ex) ex.addEventListener("click", () => {
      const blob = new Blob([store.exportedJson()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "converge2-records.json";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      if (C2.toast) C2.toast("Downloaded records JSON.", "blue");
    });

    const cl = $("#rec-clear");
    if (cl) cl.addEventListener("click", () => {
      if (!window.confirm("Delete every stored record? This cannot be undone.")) return;
      store.clear();
      if (C2.toast) C2.toast("All records cleared.", "red");
      if (C2.renderSignals) C2.renderSignals();
      renderRecords();
    });
  }

  function row(r) {
    const title = r.type === "signal" ? r.payload.title : (r.payload && r.payload.scenario ? `Pipeline run · ${r.payload.scenario}` : r.action);
    return `<button class="rec-row" data-rec="${esc(r.id)}" type="button">
      <span class="rec-type rec-${esc(r.type)}">${esc(r.type)}</span>
      <span class="rec-main"><b>${esc(title)}</b><small>${esc(r.action)} · ${esc(fmt(r.createdAt))}</small></span>
      <span class="chip chip-ghost">${esc(r.status)}</span>
    </button>`;
  }

  function openRecord(id) {
    const r = store.get(id);
    if (!r) return;
    const c2 = C2;
    let related = "";
    if (r.type === "signal" && c2.G && r.payload.entities) {
      related = r.payload.entities.map((e) => (c2.G.byId.get(e) ? c2.G.byId.get(e).label : e)).join(", ");
    }
    $("#modal-body").innerHTML = `
      <div class="ic">
        <div class="ic-title">STORED RECORD · ${esc(r.id)}</div>
        <div class="ic-grid">
          <div class="ic-row"><dt>Type</dt><dd>${esc(r.type)}</dd></div>
          <div class="ic-row"><dt>Originating action</dt><dd>${esc(r.action)}</dd></div>
          <div class="ic-row"><dt>Created</dt><dd>${esc(fmt(r.createdAt))}</dd></div>
          <div class="ic-row"><dt>Status</dt><dd>${esc(r.status)}</dd></div>
          ${r.type === "signal" ? `
            <div class="ic-row"><dt>Title</dt><dd>${esc(r.payload.title)}</dd></div>
            <div class="ic-row"><dt>Priority</dt><dd>${esc(r.payload.priority)}</dd></div>
            <div class="ic-row"><dt>Source quality</dt><dd>${esc(r.payload.quality)}</dd></div>
            <div class="ic-row"><dt>Confidence</dt><dd>${esc(r.payload.confidence)}</dd></div>
            <div class="ic-row"><dt>Source</dt><dd>${esc(r.payload.source)}</dd></div>
            <div class="ic-row"><dt>Why it matters</dt><dd>${esc(r.payload.why)}</dd></div>
            <div class="ic-row"><dt>Connected to</dt><dd>${esc(related)}</dd></div>` : ""}
        </div>
        <h5>Raw record</h5>
        <pre class="raw">${esc(JSON.stringify(r, null, 2))}</pre>
      </div>`;
    $("#modal").classList.remove("hidden");
  }

  /* Called by app.js when a pipeline run or export completes. */
  function logAction(type, action, payload) {
    if (!store) return null;
    return store.add(type, action, payload, "logged");
  }

  window.CONVERGE2_CAPTURE = {
    init,
    logAction,
    renderRecords,
    get store() { return store; },
  };
})();
