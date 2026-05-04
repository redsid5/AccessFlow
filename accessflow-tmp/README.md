# AccessFlow

Accessibility scanners tell you what's broken. AccessFlow tells you what to do next.

---

## What it does

AccessFlow is a backlog compression and triage pipeline for university accessibility programs. It converts raw accessibility issues into a prioritized queue of engineering fixes — each fix mapped to an owner, a location, and a verification checklist.

The pipeline follows three stages:

```
Input source → Feature extraction → Deterministic triage → Actionable queue
```

1. **Input source** — Submit a URL or PDF document
2. **Feature extraction** — Content is parsed and scored across five dimensions: student impact, legal risk, usage frequency, replaceability, and time sensitivity (each 0–10)
3. **Deterministic triage** — A fixed rule engine applies explicit weights to those scores and outputs one of three decisions: Fix / Review / Delete. Same input always produces the same output.
4. **Actionable queue** — Each decision includes an owner, a recommended action, and a full decision audit showing exactly which rule fired and which signals were active

---

## Why it exists

Universities managing Title II compliance backlogs face a prioritization problem, not a detection problem. Scanners already produce the issue list. What's missing is a process for deciding which issues block students from doing something critical — applying, enrolling, requesting an accommodation — and which issues are low-value content that should be removed rather than fixed.

AccessFlow is the triage layer that runs before remediation. It reduces a backlog of hundreds of issues into a short queue of discrete engineering tasks.

---

## Backlog compression (V2)

V2 introduces pattern-level clustering. Issues are grouped by canonical pattern key and scope, then compressed into a single `FixOpportunity` per cluster. A nav keyboard trap on 12 pages becomes one fix in the shared header component — not 12 separate tickets.

The north-star metric is **Backlog Compression Ratio** = raw issues / consolidated fixes.

---

## Decision engine

The triage rules are deterministic and documented:

| Rule | Condition | Output |
|------|-----------|--------|
| 1 | Legal risk ≥ 8 | FIX / high |
| 2 | Low-value content + replaceability ≥ 7 | DELETE / low |
| 3 | Extraction accuracy < 60% | REVIEW / medium |
| 4 | Scope confidence < 60% | REVIEW / medium |
| 4b | Mission-critical or 3+ repeated instances | FIX / medium–high |
| 4c | Low-value content (fallback) | DELETE / low |
| Default | None of the above | FIX / medium |

Every result includes a **Decision Audit** panel showing the rule path, active signals, and score breakdown.

---

## Stack

```
Next.js (App Router)   TypeScript   Tailwind CSS v4
pdf-parse              Cheerio      Vitest
localStorage — no backend required for demo
```

---

## Technical architecture

Feature extraction uses Gemini 2.5 Flash as a structured data parser. It is invoked once per source to produce numeric subscores; it does not make triage decisions. The decision engine, scoring weights, and rule thresholds are all server-side TypeScript. Changing risk policy means editing a config file and running the test suite — not adjusting a prompt.

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

## Tests

```bash
npm test
```

41 unit tests cover the full decision engine and cluster logic with no external dependencies. Tests use static input fixtures — no network calls, no API key required.

---

## What it doesn't do

- Not a scanner — it is the decision layer built on top of existing audit data
- Not a compliance platform — it supports decision-making, it does not replace legal review
- Not multi-user — state is local by design for the demo build
