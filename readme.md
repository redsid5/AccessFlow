# AccessFlow

Accessibility triage tool for university digital accessibility offices.

Universities already have scanners. WAVE, axe, Lighthouse — they'll tell you a PDF has 47 issues. They won't tell you whether to fix it, replace it, or just delete it. That's the gap this fills.

The app lives in [accessflow-tmp/](accessflow-tmp/).

---

## What it does

Paste a URL or upload a PDF. You get one decision: **fix it**, **review it**, or **delete it** — with a priority score, a suggested owner, an effort estimate, and a plain-language reason written for whoever is reading it.

The triage philosophy behind every decision:

> Remove first → Replace second → Remediate third

Most teams try to fix everything. The right answer is usually to remove or replace first. This is directly aligned with DOJ Title II guidance and how high-performing higher-ed accessibility teams actually operate.

---

## Features

- **Role-based output** — staff, faculty, department admins, and student workers each see different language and framing for the same content
- **Priority scoring** across five dimensions: student impact, legal risk, usage frequency, replaceability, time sensitivity
- **Intake queue** with status tracking, assignee routing, bulk PDF upload, and remediation cost estimates
- **Portfolio dashboard** — breakdown by decision and status, cost analysis showing savings from deletion, critical unresolved list by department
- **Technical review** (staff only, passcode-gated) — per-issue WCAG breakdown with severity, root cause, quick fix for content owners, and a code snippet for developers

---

## Stack

```
Next.js (App Router)   TypeScript   Tailwind CSS v4
Gemini 2.5 Flash       pdf-parse    Cheerio
localStorage — no database
```

---

## Running locally

```bash
cd accessflow-tmp
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Three demo cases are built in and work without an API key — see the demo section at the bottom of the main page.

---

## Deployment

Vercel-ready. Set `GEMINI_API_KEY` in environment variables. Optionally set `NEXT_PUBLIC_EXPERT_PASSCODE` to override the default technical review passcode.
