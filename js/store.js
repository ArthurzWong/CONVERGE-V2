/* =========================================================================
 * CONVERGE2 — Signal Canvas · store.js
 * The persistent data layer: a tiny, dependency-free record store with
 * schema validation. Records survive a reload/restart (localStorage) and are
 * inspectable from the in-app Records panel.
 *
 * UMD-ish: works in the browser (window.CONVERGE2_STORE) and in Node
 * (module.exports) so the check suite can test the same validation code.
 * ========================================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.CONVERGE2_STORE = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const KEY = "converge2.records.v1";
  const SCHEMA = 1;
  const PRIORITIES = ["P0", "P1", "P2", "P3"];
  const QUALITIES = ["FACT", "INFERENCE", "HYPOTHESIS", "SPECULATION"];
  const CONFIDENCES = ["High", "Medium", "Low"];
  const LIMITS = {
    title: { min: 3, max: 120 },
    source: { min: 2, max: 120 },
    why: { min: 5, max: 400 },
  };

  const trim = (v) => (typeof v === "string" ? v.trim() : "");

  /* ---------------------------------------------------------------
   * Validation. Returns { ok, errors, value }. When ok is false the caller
   * MUST NOT write a record — invalid attempts leave no trace.
   * ------------------------------------------------------------- */
  function validateSignal(input, validEntityIds) {
    const errors = {};
    const v = {
      title: trim(input.title),
      source: trim(input.source),
      priority: trim(input.priority),
      quality: trim(input.quality),
      confidence: trim(input.confidence) || "Medium",
      why: trim(input.why),
      entities: Array.isArray(input.entities) ? input.entities.filter(Boolean) : [],
    };

    if (!v.title) errors.title = "A title is required.";
    else if (v.title.length < LIMITS.title.min) errors.title = `Title must be at least ${LIMITS.title.min} characters.`;
    else if (v.title.length > LIMITS.title.max) errors.title = `Title must be ${LIMITS.title.max} characters or fewer.`;

    if (!v.source) errors.source = "A source is required.";
    else if (v.source.length < LIMITS.source.min) errors.source = `Source must be at least ${LIMITS.source.min} characters.`;
    else if (v.source.length > LIMITS.source.max) errors.source = `Source must be ${LIMITS.source.max} characters or fewer.`;

    if (!PRIORITIES.includes(v.priority)) errors.priority = `Priority must be one of ${PRIORITIES.join(", ")}.`;
    if (!QUALITIES.includes(v.quality)) errors.quality = `Source quality must be one of ${QUALITIES.join(", ")}.`;
    if (!CONFIDENCES.includes(v.confidence)) errors.confidence = `Confidence must be one of ${CONFIDENCES.join(", ")}.`;

    if (!v.why) errors.why = "“Why it matters” is required.";
    else if (v.why.length < LIMITS.why.min) errors.why = `“Why it matters” must be at least ${LIMITS.why.min} characters.`;
    else if (v.why.length > LIMITS.why.max) errors.why = `“Why it matters” must be ${LIMITS.why.max} characters or fewer.`;

    if (!v.entities.length) errors.entities = "Select at least one connected entity.";
    else if (Array.isArray(validEntityIds)) {
      const bad = v.entities.filter((e) => !validEntityIds.includes(e));
      if (bad.length) errors.entities = `Unknown entity: ${bad.join(", ")}.`;
    }

    return { ok: Object.keys(errors).length === 0, errors, value: v };
  }

  /* ---------------------------------------------------------------
   * Storage adapters
   * ------------------------------------------------------------- */
  function memoryStorage() {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, s) => map.set(k, String(s)),
      removeItem: (k) => map.delete(k),
      __kind: "memory",
    };
  }
  function defaultStorage() {
    try {
      if (typeof localStorage !== "undefined" && localStorage) {
        localStorage.setItem("__c2_probe", "1");
        localStorage.removeItem("__c2_probe");
        return localStorage;
      }
    } catch (e) { /* private mode / file:// restrictions */ }
    return memoryStorage();
  }

  let seq = 0;
  function newId(prefix) {
    seq += 1;
    const t = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 6);
    return `${prefix}-${t}${r}${seq}`;
  }

  /* ---------------------------------------------------------------
   * Store
   * ------------------------------------------------------------- */
  function createStore(storage) {
    const s = storage || defaultStorage();

    function readAll() {
      try {
        const raw = s.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.records)) return parsed.records;
        return [];
      } catch (e) { return []; }
    }
    function writeAll(records) {
      s.setItem(KEY, JSON.stringify({ schema: SCHEMA, records }));
      return records;
    }

    return {
      storageKind: s.__kind || "localStorage",
      list() { return readAll(); },
      count() { return readAll().length; },
      get(id) { return readAll().find((r) => r.id === id) || null; },

      /** Append a record. Never called for invalid input. */
      add(type, action, payload, status) {
        const rec = {
          id: newId(type === "signal" ? "SIG" : "RUN"),
          type, action,
          createdAt: new Date().toISOString(),
          status: status || "filed",
          payload,
        };
        const all = readAll();
        all.push(rec);
        writeAll(all);
        return rec;
      },

      /**
       * Validate then store a captured signal. Returns
       * { ok:true, record } or { ok:false, errors } — nothing is written
       * when validation fails.
       */
      captureSignal(input, validEntityIds) {
        const res = validateSignal(input, validEntityIds);
        if (!res.ok) return { ok: false, errors: res.errors };
        const record = this.add("signal", "capture-signal", res.value, "filed");
        return { ok: true, record };
      },

      exportedJson() { return JSON.stringify({ schema: SCHEMA, records: readAll() }, null, 2); },
      clear() { s.removeItem(KEY); return true; },
    };
  }

  return {
    KEY, SCHEMA, PRIORITIES, QUALITIES, CONFIDENCES, LIMITS,
    validateSignal, createStore, memoryStorage, defaultStorage, newId,
  };
});
