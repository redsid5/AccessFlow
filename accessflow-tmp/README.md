# AccessFlow
Accessibility scanners tell you what's broken. AccessFlow tells you what to do next.

---

## The idea

Most accessibility tools create noise. AccessFlow creates a decision layer.

The workflow is: **Remove first → Replace second → Remediate third.**

Most teams start by trying to fix every issue a scanner flags. That's a trap. AccessFlow focuses on triage — identifying content that is high-impact, low-value, or better served as HTML — turning a massive backlog into an actionable queue.

---

## How it works

The LLM is used for feature extraction only — it outputs 5 numeric subscores (0–10) across student impact, legal risk, usage frequency, replaceability, and time sensitivity. It never makes the final decision.

The decision engine applies those scores through a fixed rule set with explicit weights (student impact ×2, legal risk ×2, time sensitivity ×2). The weighted total is computed server-side. Same input always produces the same output.

Every result card includes a **View trace** panel that shows exactly which rule fired, which signals were active, and how each subscore was weighted to reach the final score. If a decision looks wrong, the trace shows you why.

Ambiguous cases — where signals conflict — route to "Review" by default. The system does not guess.

## What it does

- **Triage** — URL or PDF → decision card (fix / review / delete)
- **Queue** — status tracking per item: New → Assigned → In Progress → Fixed → Archived
- **Decision engine** — rule-based scoring with explicit weights, computed server-side
- **Decision trace** — collapsible audit panel on every result card
- **Staff layer** — passcode-gated technical view for WCAG-specific remediation steps

---

## Why it exists

An inaccessible admissions page isn't a technical error. It's a "Keep Out" sign for any student who relies on a screen reader or keyboard navigation. An unlabeled form field means they can't apply. A broken tab order means they can't reach the Submit button. A missing image description means they can't tell what they're looking at.

Universities know this. What they don't have is a process for deciding where to start. Backlogs run into the hundreds, staff time is limited, and most tools produce issue lists without telling anyone which issues actually block students from doing something critical — applying, enrolling, requesting an accommodation, paying tuition.

AccessFlow is the triage layer that runs before remediation. It identifies which content is a barrier right now, which content should be deleted rather than fixed, and who owns the next step. The April 2026 DOJ Title II deadline is the forcing function. The goal is making sure every student has the same shot at applying and succeeding, regardless of how they access the internet.

---

## Stack

```
Next.js (App Router)   TypeScript   Tailwind CSS v4
Gemini 2.5 Flash       pdf-parse    Cheerio
localStorage — demo mode, no backend required
```

---

## Running it

```bash
git clone https://github.com/redsid5/AccessFlow.git
cd AccessFlow/accessflow-tmp
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

---

## Demo cases (no API key required)

Three built-in cases demonstrate the triage model end-to-end:

- `Spring 2022 event flyer.pdf` → Remove (expired, low value)
- `disability-accommodation-request.pdf` → Fix (highest priority document type)
- `university.edu/tuition-payment-deadlines` → Fix (active, time-sensitive, student-facing)

For the technical review panel: set role to **Staff**, run any analysis, click **Unlock**.

---

## Validation

A ground-truth audit set lives in `tests/audit_set.json` — 12 diverse university content samples with human-classified decisions, expected owners, and reasoning notes covering the full range of cases: mission-critical forms, expired flyers, ambiguous policy documents, and high-traffic service pages.

To run it against the live pipeline:

```bash
npm run dev   # in one terminal
node tests/audit.mjs
```

Results write to `tests/audit_results.json`. Any mismatch between system and human decision is flagged with a diagnosis: low-confidence extraction (LLM signal issue) or rule mismatch (policy logic issue). These are fixed differently — the former by improving the prompt, the latter by updating the scoring weights or rule thresholds.

---

## What it doesn't do

- Not a scanner — it's the decision layer built on top of your existing audit data
- Not a compliance platform — it supports decision-making, it does not replace legal review
- Not multi-user — state is local by design for the MVP
