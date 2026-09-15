# CONVERGE2 — Signal Canvas · Verification report

Every acceptance criterion, the evidence collected for it, and the honest gap
where one exists. Nothing here is asserted without a check you can re-run.

Reproduce everything:

```bash
cd converge2-signal-canvas
node tests/check.mjs            # 46 checks, no dependencies
```

---

## 1. `scope-frozen` — scope written down before building

**Met.** [`SCOPE.md`](SCOPE.md) states the problem, the target user, the single
primary workflow, and an explicit not-included list. The workflow named there
(**capture a signal → validate → store → trace**) is exactly the workflow judged
below.

*Evidence:* file — `SCOPE.md`.

---

## 2. `primary-flow-works` — the main workflow completes end to end

**Met.** Driven through the real UI in headless Chrome over the DevTools
Protocol — no code edits, no database surgery. A script clicks **Capture
Signal**, submits deliberately invalid input, then valid input, and reads the
resulting DOM and store.

*Evidence — operation + visual:*

| Step | Observed |
|---|---|
| Modal opens | `modalOpened: true` |
| Invalid submit | `afterInvalid: 0` records (unchanged), modal stays open, first field flagged `aria-invalid="true"` |
| Error copy | "Not saved. Fix the following and try again: Title — Title must be at least 3 characters. Source — A source is required. Why it matters …" |
| Valid submit | `afterValid: 1`, `modalClosed: true` |
| Inbox | 9 cards (8 shipped + 1 filed), exactly 1 `local` badge |
| Confirmation | toast "Signal SIG-… filed and stored." |
| Canvas: wheel zoom | view width 1000 → 880 |
| Canvas: drag pan | view moved by (-172, -97); the drag did **not** select the node under the pointer |
| Canvas: Fit | view width restored to 1000 |

*Interaction result:* **16 / 16 passed** (raw output: `tests/interaction-output.txt`).

Visual evidence: `shot-dashboard.png` (full workspace), `shot-capture-modal.png`
(form with the validation error), `shot-records.png` (records panel).

---

## 3. `data-actually-stored` — submissions persist and survive a restart

**Met.** Two layers of proof:

1. **Unit level** — `js/store.js` is exercised against a fresh in-memory storage
   adapter: write a record, build a *brand-new* store over the *same* storage,
   and read it back. Checks: *"records survive a restart"*, *"the captured signal
   is still readable after restart"* (payload and 3 entities intact).
2. **Browser level** — after the interaction run, the page was reloaded
   (`Page.reload`) and re-queried: `afterReload: 2`, `signalStillThere: true`,
   `signalTitle` unchanged, `storageKind: "localStorage"`.

*Evidence:* check + data — `tests/check.mjs` section 3; `tests/interaction-output.txt` step 2.

---

## 4. `records-traceable` — stored records can be reviewed and traced

**Met.** The **Records** panel lists every stored record with a type badge
(`signal` / `run`), a title, the originating action, the created timestamp, and a
status chip. Clicking a row opens a detail dialog showing type, originating
action, created time, status, every captured field, and the raw JSON of the
record. Counts observed in the interaction run: `recordsRows: 1` after the
capture, `afterRun: 2` once a pipeline run was logged.

*Evidence:* visual + data + operation — `shot-records.png`; `tests/interaction-output.txt`.

---

## 5. `input-guarded` — bad input is rejected, not silently stored

**Met.** Validation lives in `js/store.js#validateSignal` and is covered by 12
unit checks plus the browser run:

| Rejected | Check |
|---|---|
| Missing title | ✓ |
| Title < 3 / > 120 chars | ✓ |
| Missing source | ✓ |
| Missing "why it matters" | ✓ |
| "Why it matters" > 400 chars | ✓ |
| Malformed priority (`P9`) | ✓ |
| Malformed source quality (`VIBES`) | ✓ |
| Zero entities selected | ✓ |
| Unknown entity id | ✓ |

Critically, `captureSignal` returns `{ ok: false, errors }` **before** any write:
the check *"invalid capture writes nothing"* asserts the record count is still 0,
and the browser run confirms `afterInvalid === before === 0`.

*Evidence:* check + operation — `tests/check.mjs` section 2; `tests/interaction-output.txt`.

---

## 6. `checks-pass-clean` — the check suite passes on a fresh run

**Met.** Single command, zero dependencies, no install step:

```
node tests/check.mjs
```

Raw output (also saved to `tests/output.txt`):

```
CONVERGE2 Signal Canvas — check suite
1 · Dataset integrity ...................... 16 passed
2 · Signal capture — validation rules ...... 12 passed
3 · Persistence and traceability ........... 12 passed
4 · Shipped file set .......................  6 passed
--------------------------------------------------------
RESULT: 46 passed, 0 failed, 46 total
All checks passed.
```

*Evidence:* check + file — `tests/output.txt`.

---

## 7. `setup-reproducible` — a second person can run it from the README alone

**Met, with one caveat.** `README.md` documents prerequisites (a modern browser;
Node for the checks), how to open the app, how to run the checks, how to modify
content, and how to deploy. There is **no install step for the app** — it is
static files with plain `<script>` tags, no bundler, no `fetch()`, so it opens
from `file://`. No secrets are committed and no paid service is used.

*Caveat, stated plainly:* the browser-level interaction run needs a Chrome
binary and the CDP helper that ships outside the repo, so it is documented as an
optional deeper check rather than part of the one-command suite. The one-command
`node tests/check.mjs` needs nothing but Node.

*Evidence:* file + operation.

---

## 8. `handoff-complete` — handoff explains where everything lives

**Met.** [`HANDOFF.md`](HANDOFF.md) plus `README.md` cover the folder layout,
where user-facing copy is edited, where data lives and how to inspect it, and the
three most likely next steps.

*Evidence:* file — `HANDOFF.md`, `README.md`.

---

## 9. `final-review-passed` — closing walkthrough documented

**Met by this document.** All nine criteria are mapped above with their evidence.
No criterion was dropped.

---

## Known gaps and caveats

1. **Storage is per-browser.** `localStorage` does not sync across machines or
   browsers. Records are real and durable on the machine that made them, which is
   the documented v1 scope.
2. **No live ingestion.** The dataset is a file. The pipeline demonstrates
   reasoning over a curated set, not a live feed.
3. **Best-effort graphics.** The reveal animation degrades to an instant render
   under `prefers-reduced-motion` or when opened as `index.html#skip`.
4. **Large graphs untested.** The radial layout is tuned for ~15 nodes; beyond
   roughly 60 it will need a force or clustered layout. *Deferred:* that is a
   design change rather than unfinished work — see `RESUMPTION.md` §4.
5. **Design adaptation, declared.** The requested visual preset is a light,
   neutral system, while the seven supplied reference dashboards are explicitly
   dark intelligence workspaces. The build follows the **references**, because
   they are direct project context; the preset's softer surfaces, rounded
   corners, restrained shadows and "charts as craft" treatment were applied
   within that dark language. This is a deliberate, declared deviation rather
   than an omission.

### Closed in the follow-up session

The canvas previously offered zoom buttons only, and touch/pointer gestures were
unverified. Wheel zoom, drag pan, two-finger pinch and a `Fit` reset are now
implemented and covered by 3 static and 4 browser checks (view width 1000 → 880
on zoom, pan of (-172, -97), `Fit` back to 1000, and a drag correctly suppressed
from selecting the node beneath it). Touch pinch is exercised through the same
pointer-event path the browser reports for touch input.
