# AccessFlow
Accessibility scanners find issues. AccessFlow tells you what to do about them.

---

## The idea

University accessibility teams don't have a scanning problem. They have a prioritization problem.

The backlog grows because teams remediate everything the scanner flags — including a 2019 event flyer and a PDF that's been replaced by a web page. The right move, in most cases, is to remove or replace the content entirely. Remediation comes last.

> Remove first. Replace second. Remediate third.

AccessFlow enforces that order. Same input, same decision. No ambiguity.

---

## What it does

Paste a URL or upload a PDF. You get one decision card:

- **Decision** — fix it, review it, or delete/replace it
- **Priority score** — weighted across student impact, legal risk, usage, replaceability, and time sensitivity
- **Effort estimate** — not low/medium/high. Actual time: 10 min, 2 hours, or multi-team project
- **Suggested owner** — who acts next: Accessibility office, Web team, Department content owner, or Document owner
- **Plain-language reason** — written for whoever is reading it, not whoever wrote the WCAG criterion

Every result goes into an intake queue. The queue tracks status, assignee, department, and remediation cost. The dashboard shows what it would cost to fix everything versus what you'd save by removing the low-value content first.

Role selector changes the language of every field — not a disclaimer at the bottom. Staff see WCAG context. Faculty see student impact. Admins see who's responsible and whether there's a deadline. Student workers get one sentence and one action.

---

## Why it exists

DOJ Title II compliance hits public universities in April 2026. Most teams are looking at hundreds of PDFs and no clear process for deciding what to fix. AccessFlow is the triage layer that runs before remediation starts — it reduces the backlog by identifying what shouldn't be remediated in the first place.

The real cost isn't fixing content. It's spending specialist time on content that should have been deleted two years ago.

---

## Stack

```
Next.js (App Router)   TypeScript   Tailwind CSS v4
Gemini 2.5 Flash       pdf-parse    Cheerio
localStorage — no database, no auth
```

State lives in localStorage. Intentional. The tool is self-contained for demos and doesn't require infrastructure to evaluate.

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

Open [http://localhost:3000](http://localhost:3000)

---

## Demo cases

Three cases are built in and work without an API key:

- **Spring 2022 event flyer.pdf** — expired low-value content. Decision: delete. No remediation time required.
- **disability-accommodation-request.pdf** — highest-priority document type on any campus. Decision: fix immediately or replace with an HTML form.
- **university.edu/tuition-payment-deadlines** — active, time-bound, student-facing. Decision: fix before the next payment cycle.

Run these first. They show the range of decisions and how the reasoning changes by role. For the technical review panel: set role to **Staff**, run any analysis, click **Unlock**.

---

## What it doesn't do

No full audit reports — axe-core and WAVE already do that. No authentication, no compliance certification, no ticketing integrations.

This is one tool that does one thing: helps a team decide what to work on next, in what order, and who owns it. The scope is intentional. The value is in the decision, not the feature count.
