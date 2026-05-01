# AccessFlow

Universities already have accessibility scanners. What they don't have is something that tells staff what to actually do about the results.

WAVE and axe will tell you a PDF has 47 issues. They won't tell you whether it's worth fixing. They won't ask if the event it describes already happened two years ago. They won't suggest deleting it instead.

That's the gap this fills.

---

## The idea

The triage philosophy in higher-ed accessibility — and it's not mine, it comes from DOJ Title II guidance and practitioners at schools like Ohio State and UMKC — is:

> Remove first. Replace second. Remediate third.

Most teams do the opposite. They get a scan report, sort by severity, and start fixing. They spend a week remediating a PDF that nobody has clicked in three years. AccessFlow tries to interrupt that pattern.

Paste a URL or upload a PDF. Get one decision: fix it, review it, or delete it. With a reason. With a priority. With a suggested owner. That's it.

---

## Role-based output

The same content reads differently depending on who you are. An accessibility specialist wants WCAG criterion references. A faculty member wants to know how it affects their students. A department admin needs to know who is responsible and whether there's a deadline risk.

The role selector changes the language of every field — not just a disclaimer at the bottom. The "why" and "action" fields are rewritten for the audience.

---

## What's in it

**Main triage** — URL or PDF → one decision with priority score, effort estimate, and usage signal. Results go straight into the queue.

**Intake queue** — status workflow per item (New → Assigned → In Progress → Fixed → Archived → Exempted). Bulk PDF upload if you have a folder of documents to process. Estimated remediation cost per item.

**Dashboard** — breakdown by decision, status, and priority. Cost analysis: what it would cost to fix everything vs. what you'd save by deleting the low-value items first.

**Technical review** — behind a passcode, for the accessibility team only. Per-issue WCAG breakdown with severity, root cause, quick fix for content owners, and a code snippet for developers. This is the layer for staff who need more than a triage decision.

---

## Stack

```
Next.js (App Router)   TypeScript   Tailwind CSS v4
Gemini 2.5 Flash       pdf-parse    Cheerio
localStorage only — no database
```

No auth. No database. State lives in localStorage. It's a decision-support tool, not an enterprise platform.

---

## Running it

```bash
git clone https://github.com/redsid5/AccessFlow.git
cd AccessFlow/accessflow-tmp
npm install
```

Add a `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

---

## Trying it without an API key

Three demo cases are baked in and work offline:

- A 2022 event flyer → deletes cleanly, no analysis needed
- A disability accommodation form → highest priority fix, shows the WCAG breakdown
- A tuition deadline page → active, high-stakes, time-sensitive

The demo cases are the clearest way to show what the tool actually does. Run them before connecting a real API key.

For the technical review panel: set role to **Staff**, run any analysis, click **Unlock**.

---

## What it doesn't do

No full audit reports — that's what axe-core and WAVE are for. No authentication. No compliance certification. No notifications.

This is one tool that does one thing: helps a team decide what to work on next. The scope is intentional.
