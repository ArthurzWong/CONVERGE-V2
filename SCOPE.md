# CONVERGE2 — Signal Canvas · Scope (v1)

One page. This is what v1 is, and — just as importantly — what it is not.

## Problem

Strategic intelligence work produces fragments: a regulator notice here, a vendor
changelog there, a security paper somewhere else. The fragments are easy to
collect and hard to *reason* with. Teams end up with a pile of links, no shared
model of what connects to what, and no defensible answer to "so what do we do?"

The failure is not a shortage of information. It is that the reasoning is
invisible: no evidence chain, no confidence level, no explicit decision, no
owner for the next action.

## Target user

One analyst or a small strategy team working a single question over weeks — not a
company-wide platform. Concretely: someone answering *"what could agentic AI
payments and autonomous procurement mean for Malaysian SMEs over three years?"*
and needing to show their reasoning to someone else.

## The single primary workflow

**Capture a signal → it is validated → it is stored → it can be traced back later.**

1. Open the workspace (`index.html`).
2. Press **Capture Signal** in the Records panel.
3. Fill the form: title, source, priority (P0–P3), source quality
   (FACT / INFERENCE / HYPOTHESIS / SPECULATION), confidence, "why it matters",
   and at least one connected entity.
4. Submit.
   - **Invalid** → the attempt is rejected with a field-level message, the modal
     stays open, and **nothing is written**.
   - **Valid** → a record is written to the store, the modal closes, a
     confirmation toast appears, and the signal appears in the Signal Inbox
     (badged `local`) and in the Records panel.
5. Reload the page — the record is still there, with its id, created time,
   originating action (`capture-signal`) and status (`filed`). Click it in
   Records to open the full record and its raw JSON.

Around that workflow, v1 also demonstrates the CONVERGE2 pipeline on a shipped
demo dataset: entity graph with a whiteboard reveal, confidence meter,
risk/opportunity radar, three futures, decision brief, and an action board.

## What v1 does not include

- **No server, no database, no accounts.** Persistence is browser
  `localStorage`; the store falls back to in-memory storage if the browser
  refuses it. There is no sync between machines.
- **No multi-user, roles, auth, billing, email or notifications.**
- **No live data ingestion.** The dataset ships as a file
  (`data/intelligence.js`); nothing fetches from the network at runtime.
- **No audio, no video, no PPTX export.**
- **No localization.** English only.
- **No mobile native app.** The layout is responsive to desktop/tablet/phone
  widths, but it is one web page.
- **Not a chatbot and not a search engine.** It does not answer arbitrary
  questions; it structures a defined intelligence workflow.

## Acceptance basis

Where a requirement was ambiguous, the more complete option was chosen and
stated, rather than silently dropped. Evidence for each acceptance criterion —
including the automated check suite and a real browser interaction run — is in
`VERIFICATION.md`.
