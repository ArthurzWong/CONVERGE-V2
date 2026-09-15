# CONVERGE2 — Signal Canvas

A self-contained strategic-intelligence workspace for the browser. It turns a
fragmented pile of signals into an entity graph, three futures, a decision brief
and an executable task list — and it **draws all of it on screen, stroke by
stroke**, the way an analyst would sketch it on a whiteboard.

Open `index.html`. There is no build step, no server, no dependency and no API key.

---

## What this is (and what it is not)

It is a **front-end shell for the CONVERGE2 pipeline**:

```
SEE → UNDERSTAND → FORESEE → DECIDE → ACT
```

It is not a chatbot, not a search engine, and not a generic dashboard. Its job is
to make the *reasoning* visible: where each claim came from, how strong each
relationship is, how confident the pipeline is, and what to do next.

The demo dataset answers one concrete question:

> What could agentic AI payments and autonomous procurement mean for Malaysian
> SMEs over the next three years?

---

## Why it looks the way it does

Two references were combined.

**1. `whiteboard-animator` (github.com/masihsultani/whiteboard-animator)** — a
Python engine that animates a finished whiteboard image. Its *concepts* were
rebuilt here as a browser-native SVG engine (`js/whiteboard-reveal.js`):

| whiteboard-animator concept | Signal Canvas equivalent |
|---|---|
| Connected-component ordering | BFS layers outward from the core node |
| Containers before contents | Hub drawn first, then its relations |
| Skeleton path from a real endpoint | Edge drawn source → target, never from the middle |
| Text written word by word | Node labels typed character by character |
| Committed vs fading pixel model | Settled strokes vs the one live stroke |
| "A marker sprite that follows the pen" (their roadmap) | A pen dot travels the edge being drawn |

**2. Seven intelligence-dashboard references** — the visual language was merged
from ORION (confidence meter, risk radar, explainable-AI trace), Pulzar
Intelligence (dark knowledge graph, relationship evidence, metrics strip),
the financial-scenario board (segmented scenario control, tag cards), ServiceNow
AI Control Tower (tabs, sparkline metric tiles), Interos (radial ecosystem graph
with score breakdown), STS42 (AI-colleague panel) and the AI Impact dashboard
(impact metrics, adoption curve).

### Deliberate amendments

Where the references disagreed or were thin, this build changed course:

- **One canvas, not five tabs.** The references each isolate a view. Here the
  graph, confidence, radar, foresight, decision and actions sit on one screen so
  the *chain* stays visible.
- **Confidence is interactive.** ORION shows a static confidence score. Here the
  assumption sliders (adoption, regulatory certainty, capital) recompute
  confidence, radar and impact live.
- **Evidence is first-class.** Every relationship carries strength, confidence,
  signal count, period and a written evidence summary — no unexplained edges.
- **Scenario control changes the model,** not just a label: switching
  Base / Optimistic / Conservative re-weights foresight, radar and the impact
  strip.
- **The animation is informative, not decorative.** Reveal order encodes
  dependency: you literally watch the graph build outward from the core.

---

## Run it

Open `index.html` in any modern browser. That is the whole procedure.

Optional local server (only if you prefer a URL):

```bash
cd converge2-signal-canvas
python3 -m http.server 8080
# then open http://127.0.0.1:8080
```

Both work: the app uses plain `<script>` tags and no `fetch()`, so it runs from
`file://` without CORS problems.

Run the check suite (no dependencies, needs only Node):

```bash
node tests/check.mjs
```

---

## The primary workflow

**Capture a signal → it is validated → it is stored → it can be traced later.**

1. Press **Capture Signal** in the **Records** panel.
2. Fill in title, source, priority, source quality, confidence, "why it matters",
   and pick at least one connected entity.
3. Submit.
   - Invalid input is **rejected with a field-level message** and nothing is
     written.
   - Valid input is **written to the store**, added to the Signal Inbox with a
     `local` badge, and listed in Records.
4. Reload the page — the record is still there. Click it in **Records** to open
   its fields and raw JSON. **Download JSON** exports the whole store.

Records use browser `localStorage`; if a browser refuses it, the store falls
back to in-memory storage and the panel shows which is active.

## Using it

- **Signal Inbox** (left) — click a signal to isolate the entities it touches on
  the canvas. Click again to clear.
- **Canvas** (centre) — click a node for its relationships; click an edge for its
  evidence. `↺ Reveal` replays the whiteboard animation. `＋ / － / Fit` control
  the view.
- **Run Pipeline** — plays the SEE→ACT sequence, then re-draws the graph and
  refreshes the brief.
- **Scenario** (Base / Optimistic / Conservative) — switches the assumption
  profile and re-derives every downstream number.
- **Simulation Controls** (right) — drag the sliders to stress-test confidence.
- **Open Intelligence Card** — from a selected signal, opens the full CONVERGE2
  intelligence card.
- **Export** — downloads the current brief (scenario, assumptions, confidence,
  metrics, recommended action, task list) as JSON.
- `Esc` closes any overlay.

---

## Project structure

```
converge2-signal-canvas/
├── index.html               # panel skeleton + capture form modal
├── styles.css               # dark theme, responsive grid
├── data/
│   └── intelligence.js      # ← ALL demo content lives here
├── js/
│   ├── store.js             # ← persistence + validation (data layer)
│   ├── whiteboard-reveal.js # the reveal engine
│   ├── capture.js           # capture form + Records panel
│   └── app.js               # graph, panels, interactions
├── assets/
│   └── architecture.svg     # pipeline diagram
├── tests/
│   ├── check.mjs            # automated check suite (43 checks)
│   └── output.txt           # raw output of a passing run
├── SCOPE.md                 # what v1 is and is not
├── VERIFICATION.md          # acceptance criteria → evidence
└── HANDOFF.md               # layout, where to edit, next steps
```

---

## Modify it

**Content — 95% of edits happen in `data/intelligence.js`.**

| Want to change | Edit |
|---|---|
| The question being answered | `meta.idea`, `meta.horizon` |
| The three scenarios + assumptions | `scenarios[].profile` |
| Signals, priorities, source grading | `signals[]` |
| Entities on the graph | `nodes[]` (`type` sets the colour, `core` sets the hub) |
| Relationships + evidence | `edges[]` (`strength`, `confidence`, `count`, `evidence`) |
| Confidence scores | `confidence.base` |
| Radar shape and blips | `radar` |
| The three futures | `foresight.scenarios` |
| Decision brief | `decision` |
| Tasks | `actions[]` |
| Impact strip | `impact.base` |
| Monitoring job | `watchlist` |

Adding a node is just an object in `nodes[]` plus edges referencing its `id`; the
layout, legend and metrics update themselves. Valid `type` values:
`market, technology, regulation, risk, opportunity, capital, talent, entity`.

**Colour — edit the CSS variables at the top of `styles.css`.**
Node colours are `--c-*`; edge colours are in the `EDGE_META` map near the top of
`js/app.js`.

**Animation — in `js/app.js`, `buildReveal()`:** change `duration` (ms) for the
whole reveal, or edit the weight formula in `_build()` in
`js/whiteboard-reveal.js` to change pacing between hubs, edges and labels.

**Data source — to go live**, have your backend emit the same JSON shape and
either (a) generate `data/intelligence.js` on a schedule, or (b) replace the
`<script src="data/intelligence.js">` tag with a module that loads your JSON and
assigns `window.CONVERGE2_DATA` before `app.js` runs.

---

## Quality coverage

- **Responsive** — three-column desktop grid → two columns at 1240px → single
  column at 900px → compact at 620px. The graph is an SVG that scales with its
  container.
- **States** — animated loading sweep during a pipeline run; empty selection
  clears highlight; every panel has real content (no placeholder shells); toasts
  for actions and a modal for the intelligence card.
- **Interaction affordances** — hover, active and disabled styles on buttons,
  chips, task cards and graph elements; keyboard `Esc` closes overlays; buttons
  are real `<button>` elements.
- **Accessibility** — semantic landmarks (`header/main/aside/footer`), `aria-label`
  on the graph and controls, `role="status"` live region for toasts, `role="dialog"`
  for the modal, and a `prefers-reduced-motion` rule that disables animation.
- **Offline/CSP-safe** — no CDN, no web fonts, no remote images, no `fetch()`.
  Everything is same-origin, so it works under a strict Content-Security-Policy.

---

## Verification

- `node tests/check.mjs` → **43 passed, 0 failed** (dataset integrity, validation
  rules, persistence across a simulated restart, shipped file set). Raw output in
  `tests/output.txt`.
- A real browser interaction run over the DevTools Protocol → **12 / 12 passed**:
  capture modal opens, invalid input writes nothing and shows readable errors,
  valid input writes exactly one record, the signal appears in the inbox, the
  pipeline run is logged, and the record survives a page reload
  (`storageKind: localStorage`). Raw output in `tests/interaction-output.txt`.
- Rendered headlessly in Chrome at full page height: 15 nodes / 22 edges, every
  node label drawn, and all panels populated with real content.
- Full criteria-to-evidence mapping: [`VERIFICATION.md`](VERIFICATION.md).

Not yet verified: touch gestures on mobile (pinch-zoom on the canvas), and very
large graphs (>60 nodes) where the radial layout will need a force layout or
clustering.

---

## Sensible next steps

1. **Swap the demo feed for a real one** — the whole value is in live signals.
2. **Persist scenario runs** — store each simulation so decisions can be compared
   over time.
3. **Real layout** for dense graphs (force-directed or clustered) with the same
   reveal engine on top.
4. **Hand/marker sprite** — the repo lists this as an open want; the pen dot is
   the cheap version, a drawn hand is the polished one.
5. **Non-white, non-grid canvas** — the repo also wants dark boards; the reveal
   engine here already works on any background.

---

## License / attribution

Demo content is illustrative — replace it before drawing conclusions. The reveal
engine is an independent SVG implementation inspired by the ideas in
`whiteboard-animator` (MIT); no code was copied from it.

## Screenshots

- `docs/screenshots/01-dashboard.jpg` — the full workspace
- `docs/screenshots/02-capture-validation.jpg` — the capture form rejecting bad input
- `docs/screenshots/03-records.jpg` — the Records inspector
