# Changelog

## 2026-09-15 · session `sess-2026-09-15-continue` (continue)

Baseline at session start: branch `main`, head `58bc2d3`, check suite 43/43,
browser run 12/12.

### Added

- **Canvas navigation.** Wheel zoom, pointer drag pan, two-finger pinch zoom, and
  a `Fit` reset. Zoom is anchored at the pointer/pinch centre; the view is
  clamped between 240 and 2400 units wide. A drag no longer triggers the node or
  edge click underneath it.
- Cursor affordances: `grab` on the canvas, `grabbing` while panning.
- `RESUMPTION.md` — what was done, unfinished, and completed this session.
- `CHANGELOG.md` — this file.
- `LEDGER.json` / `LEDGER.md` — durable session ledger, 15 items with id, status
  and timestamps.
- `VERIFICATION-LOG.md` — each acceptance check with the command run and the
  observed result.
- 3 static checks and 4 browser checks covering the new navigation.

### Changed

- `js/app.js` — the zoom-button handler was replaced by a `wireCanvasView()`
  module that owns the view state (`view`, `zoomAt`, `panBy`, `resetView`).
  `window.__c2` now exposes `view()` and `resetView()` for inspection.
- `styles.css` — canvas cursor states; `.tool:active` feedback.
- `index.html` — canvas help copy now mentions drag / scroll / pinch.
- `VERIFICATION.md` — the "touch gestures unverified" gap is closed; counts
  updated to 46 static and 16 browser checks.
- `README.md` — verification numbers and the document list refreshed.

### Fixed

- Nothing was broken. No regression: the 43 pre-existing checks and 12
  pre-existing browser checks were re-run unchanged and still pass.

### Deferred (explicitly, not silently dropped)

- Force-directed layout for graphs beyond ~60 nodes.
- Shared/multi-user storage and live data ingestion — both outside the v1 scope
  recorded in `SCOPE.md`.

---

## 2026-09-15 · initial release (prior session)

- First release of CONVERGE2 — Signal Canvas: the CONVERGE2 pipeline
  (`SEE → UNDERSTAND → FORESEE → DECIDE → ACT`) as a self-contained web workspace.
- Whiteboard Reveal engine: a browser-native SVG reinterpretation of the
  stroke-by-stroke `whiteboard-animator` idea.
- Entity/relationship graph with per-edge strength, confidence and evidence;
  confidence meter; risk & opportunity radar; three futures; decision brief;
  action board; impact strip; monitoring job.
- Primary workflow: capture a signal → validate → persist → trace, on a
  localStorage-backed store with field-level validation and a Records inspector.
- 43 automated checks plus a 12-check browser interaction run.
- `SCOPE.md`, `VERIFICATION.md`, `HANDOFF.md`, `README.md`, `LICENSE`,
  architecture diagram and three screenshots.
