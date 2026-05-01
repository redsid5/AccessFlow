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

- **Backlog reduction** — content removal is a faster way to reduce compliance liability than remediation
- **Priority-driven** — focuses effort on high-impact journeys: admissions, financial aid, disability services
- **Ownership** — forces clear handoffs between the central accessibility office and departments

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

## What it doesn't do

- Not a scanner — it's the decision layer built on top of your existing audit data
- Not a compliance platform — it supports decision-making, it does not replace legal review
- Not multi-user — state is local by design for the MVP
