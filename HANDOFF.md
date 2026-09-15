# CONVERGE2 — Signal Canvas · Handoff

For whoever picks this up next. Enough to make a small change without reading
the whole codebase.

## Folder layout

```
converge2-signal-canvas/
├── index.html               entry point — panel skeleton + capture form modal
├── styles.css               all styling: dark theme, grid, responsive breakpoints
├── data/
│   └── intelligence.js      ← ALL demo content and the dataset schema
├── js/
│   ├── store.js             ← persistence + validation (the data layer)
│   ├── whiteboard-reveal.js the stroke-by-stroke reveal engine
│   ├── capture.js           capture form + Records panel wiring
│   └── app.js               graph, panels, interactions, pipeline run
├── assets/
│   └── architecture.svg     pipeline diagram
├── tests/
│   ├── check.mjs            the automated check suite (43 checks)
│   └── output.txt           raw output of a passing run
├── SCOPE.md                 what v1 is and is not
├── VERIFICATION.md          acceptance criteria → evidence
└── README.md                run / modify / quality notes
```

Load order matters: `data/intelligence.js` → `js/store.js` →
`js/whiteboard-reveal.js` → `js/capture.js` → `js/app.js`. Everything shares state
through `window.__c2` (created in `app.js#init`) and
`window.CONVERGE2_CAPTURE`.

## Where to change things

| I want to change… | File | What to look for |
|---|---|---|
| The question being asked | `data/intelligence.js` | `meta.idea`, `meta.horizon` |
| Demo signals | `data/intelligence.js` | `signals[]` |
| Entities on the graph | `data/intelligence.js` | `nodes[]` (`type` = colour, `core` = hub) |
| Relationships + evidence | `data/intelligence.js` | `edges[]` |
| Confidence scores | `data/intelligence.js` | `confidence.base` |
| Radar shape / blips | `data/intelligence.js` | `radar` |
| The three futures | `data/intelligence.js` | `foresight.scenarios` |
| Decision brief | `data/intelligence.js` | `decision` |
| Task board | `data/intelligence.js` | `actions[]` |
| **Validation rules and limits** | `js/store.js` | `LIMITS`, `PRIORITIES`, `QUALITIES`, `validateSignal` |
| Storage key / schema version | `js/store.js` | `KEY`, `SCHEMA` |
| Accent + semantic colours | `styles.css` | `:root` variables (`--blue`, `--c-risk`, …) |
| Edge colours | `js/app.js` | `EDGE_META` |
| Reveal speed / pacing | `js/app.js` | `buildReveal()` → `duration` |
| Reveal ordering logic | `js/whiteboard-reveal.js` | `_build()` |
| Capture form fields | `index.html` | `#capture-form` |
| Panel copy | `js/*.js` | the `innerHTML` templates in each `render*()` |

## Where the data lives, and how to inspect it

- **Runtime records** live in browser `localStorage` under the key defined in
  `js/store.js` (`KEY`). Shape is
  `{ schema, records: [{ id, type, action, createdAt, status, payload }] }`.
- **Inspect it from inside the product:** the **Records** panel lists every
  record; click one to see its fields and raw JSON. **Download JSON** writes the
  whole store to a file.
- **Inspect it from outside:** DevTools → Application → Local Storage, or
  `JSON.parse(localStorage.getItem(...))` in the console.
- **Inspect the shipped dataset:** it is plain JS —
  `window.CONVERGE2_DATA` in the console.
- **Clear everything:** the **Clear** button in the Records panel (asks for
  confirmation first).

## Three most likely next steps

1. **Feed it for real.** Replace `data/intelligence.js` with a generated file —
   emit the same object shape from a backend job, or swap the `<script>` tag for
   a loader that assigns `window.CONVERGE2_DATA` before `app.js` runs. The
   capture + records layer already works unchanged.
2. **Make storage shared.** The store is deliberately tiny and behind one
   interface (`createStore(storage)` in `js/store.js`). Point it at a remote
   adapter and the whole app becomes multi-user without touching the UI.
3. **Scale the graph.** Replace the radial layout in `js/app.js#buildGraph()` with
   a force-directed or clustered layout; the reveal engine consumes whatever
   coordinates the layout produces, so it needs no changes.

## Gotcha

`js/store.js` is written as a UMD-ish module on purpose so the **same validation
code** runs in the browser *and* under `node tests/check.mjs`. If you refactor it,
keep the `module.exports` branch or the check suite breaks.
