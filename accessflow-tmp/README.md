# AccessFlow — Access Decision Assistant

**Not a scanner. A decision layer.**

Universities already have accessibility scanners (WAVE, axe, Lighthouse, Siteimprove). What they don't have is a tool that tells staff **what to do next** — in plain English, by role, with a clear decision. That's the gap this fills.

---

## What it does

Paste a URL or upload a PDF. Get one decision: **fix it**, **review it**, or **delete it** — with a priority score, ownership routing, effort estimate, and a full WCAG issue breakdown for the accessibility team.

The triage philosophy baked into every decision:

> Remove first → Replace second → Remediate third

This is directly aligned with current DOJ Title II guidance and higher-ed accessibility best practice. Most teams try to fix everything. The right answer is usually to remove or replace first.

---

## Features

**Triage (main page)**
- URL scraping + PDF upload analysis powered by Gemini 2.5 Flash
- Role-based output — staff, faculty, admin, student worker each get different language and framing
- Priority score breakdown across 5 dimensions: student impact, legal risk, usage frequency, replaceability, time sensitivity
- Effort estimate (10 min / 2 hours / multi-team project) and usage signal (high-traffic / seasonal / archived)
- Auto-added to intake queue on every real analysis

**Intake Queue (`/queue`)**
- Status tracking per item: New → Assigned → In Progress → Fixed → Archived → Exempted
- Assignee and department routing
- Bulk PDF upload with sequential processing and progress counter
- Filter by status and decision
- Remediation cost estimate per item ($150/hr model)

**Portfolio Dashboard (`/dashboard`)**
- Total items, critical unresolved, resolved this month
- Cost analysis: total if all fixed, projected savings from deletion, actual spend needed
- By-decision and by-status distribution
- Critical unresolved list
- Department cost ranking

**Technical Review (staff only)**
- Gated behind passcode — for accessibility team, not general users
- Per-issue: severity, WCAG criterion, location, plain description, detailed root cause analysis, quick fix, technical fix with code example, owner suggestion
- 3-tab fix view: Quick fix / Technical fix / Owner

---

## Tech stack

```
Framework:    Next.js (App Router, Turbopack)
Language:     TypeScript
Styling:      Tailwind CSS v4
AI layer:     Google Gemini 2.5 Flash
PDF parsing:  pdf-parse v4 (class-based API)
URL scraping: Cheerio + node-fetch
Storage:      localStorage (no database required)
Deployment:   Vercel-ready
```

---

## Setup

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

## Demo

Three pre-loaded demo cases work without any API call:

- **Spring 2022 event flyer.pdf** — expired low-value content → Delete, Low priority
- **disability-accommodation-request.pdf** — mission-critical form → Fix, High priority  
- **university.edu/tuition-payment-deadlines** — active high-stakes page → Fix, High priority

For the Technical Review panel: set role to **Staff**, analyze any URL, click **Unlock** and enter the access code.

---

## What is intentionally out of scope

- Full WCAG audit reports (use axe-core or WAVE for that)
- Authentication or user accounts
- Notifications or workflow automation
- Legal compliance certification

This is a decision-support tool. It reduces triage time — it does not replace a full accessibility audit or legal review.
