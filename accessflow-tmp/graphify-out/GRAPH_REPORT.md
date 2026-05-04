# Graph Report - accessflow-tmp  (2026-05-04)

## Corpus Check
- Corpus is ~9,921 words - fits in a single context window. You may not need a graph.

## Summary
- 134 nodes · 180 edges · 14 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Product Documentation|Product Documentation]]
- [[_COMMUNITY_API Routes & Extractors|API Routes & Extractors]]
- [[_COMMUNITY_Classifier & Scoring|Classifier & Scoring]]
- [[_COMMUNITY_Dashboard & Queue View|Dashboard & Queue View]]
- [[_COMMUNITY_Queue Store|Queue Store]]
- [[_COMMUNITY_Technical Review & Expert Gate|Technical Review & Expert Gate]]
- [[_COMMUNITY_Main Triage Page|Main Triage Page]]
- [[_COMMUNITY_Result Card UI|Result Card UI]]
- [[_COMMUNITY_Input Card UI|Input Card UI]]
- [[_COMMUNITY_Navigation|Navigation]]
- [[_COMMUNITY_Decision Card UI|Decision Card UI]]
- [[_COMMUNITY_Header Component|Header Component]]
- [[_COMMUNITY_Role Selector|Role Selector]]
- [[_COMMUNITY_Audit Test Harness|Audit Test Harness]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 13 edges
2. `AccessFlow` - 13 edges
3. `reload()` - 11 edges
4. `getQueue()` - 7 edges
5. `updateQueueItem()` - 7 edges
6. `classifyContent()` - 6 edges
7. `saveQueue()` - 6 edges
8. `addToQueue()` - 6 edges
9. `Decision Engine` - 6 edges
10. `queueResult()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `queueResult()` --calls--> `addToQueue()`  [INFERRED]
  C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\app\page.tsx → C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\lib\queue-store.ts
- `POST()` --calls--> `classifyContent()`  [INFERRED]
  C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\app\api\technical-review\route.ts → C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\lib\classifier.ts
- `POST()` --calls--> `withRetry()`  [INFERRED]
  C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\app\api\technical-review\route.ts → C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\lib\config.ts
- `getClient()` --calls--> `getGeminiKey()`  [INFERRED]
  C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\app\api\technical-review\route.ts → C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\lib\config.ts
- `reload()` --calls--> `getQueue()`  [INFERRED]
  C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\app\queue\page.tsx → C:\Users\msid5\Downloads\Pictures\Documents\uni-team\AccessFlow\accessflow-tmp\lib\queue-store.ts

## Hyperedges (group relationships)
- **Core Triage Pipeline: LLM Extraction â†’ Decision Engine â†’ Decision Trace** — readme_llm_feature_extraction, readme_decision_engine, readme_decision_trace [EXTRACTED 0.95]
- **Accessibility Problem Context: University Backlogs + DOJ Deadline â†’ Rationale for Triage First** — readme_university_accessibility_backlogs, readme_doj_title_ii, readme_rationale_triage_first [EXTRACTED 0.90]
- **Scoring Subsystem: LLM Subscores + Weighted Scoring + Decision Engine** — readme_scoring_subscores, readme_weighted_scoring, readme_decision_engine [EXTRACTED 0.95]

## Communities

### Community 0 - "Product Documentation"
Cohesion: 0.11
Nodes (23): AccessFlow, Accessibility Scanner (existing tools), Ground-Truth Audit Set (tests/audit_set.json), Cheerio, Decision Engine, Decision Trace / Audit Panel, DOJ Title II April 2026 Deadline, Gemini 2.5 Flash (+15 more)

### Community 1 - "API Routes & Extractors"
Cohesion: 0.17
Nodes (6): analyzeFilename(), extractPDF(), buildPrompt(), getClient(), POST(), scrapeURL()

### Community 2 - "Classifier & Scoring"
Cohesion: 0.23
Nodes (8): buildPrompt(), classifyContent(), getClient(), getGeminiKey(), isTransient(), withRetry(), buildDecisionTrace(), computePriorityTotal()

### Community 3 - "Dashboard & Queue View"
Cohesion: 0.32
Nodes (9): Bar(), fmt(), reload(), remove(), runBulkAnalysis(), setAssignedTo(), setDepartment(), setStatus() (+1 more)

### Community 4 - "Queue Store"
Cohesion: 0.49
Nodes (9): addToQueue(), clearQueue(), computeStats(), getActiveCount(), getQueue(), remediationCost(), removeFromQueue(), saveQueue() (+1 more)

### Community 5 - "Technical Review & Expert Gate"
Cohesion: 0.31
Nodes (5): isExpertUnlocked(), lockExpert(), unlockExpert(), handleUnlock(), runReview()

### Community 6 - "Main Triage Page"
Cohesion: 0.67
Nodes (4): handleDemo(), handlePDF(), handleURL(), queueResult()

### Community 7 - "Result Card UI"
Cohesion: 0.6
Nodes (4): buildDraftEmailHref(), buildExportText(), buildImpactLines(), handleExport()

### Community 8 - "Input Card UI"
Cohesion: 0.67
Nodes (2): handleFileChange(), handleSubmit()

### Community 9 - "Navigation"
Cohesion: 0.67
Nodes (2): toggleDark(), update()

### Community 10 - "Decision Card UI"
Cohesion: 0.67
Nodes (1): DecisionCard()

### Community 11 - "Header Component"
Cohesion: 0.67
Nodes (1): Header()

### Community 12 - "Role Selector"
Cohesion: 0.67
Nodes (1): RoleSelector()

### Community 13 - "Audit Test Harness"
Cohesion: 0.67
Nodes (1): triageURL()

## Knowledge Gaps
- **11 isolated node(s):** `Queue (status tracking: New â†’ Assigned â†’ In Progress â†’ Fixed â†’ Archived)`, `WCAG Remediation Steps`, `Remove â†’ Replace â†’ Remediate Workflow`, `DOJ Title II April 2026 Deadline`, `University Accessibility Backlogs` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Input Card UI`** (4 nodes): `InputCard.tsx`, `InputCard.tsx`, `handleFileChange()`, `handleSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Navigation`** (4 nodes): `Nav.tsx`, `Nav.tsx`, `toggleDark()`, `update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Decision Card UI`** (3 nodes): `DecisionCard.tsx`, `DecisionCard.tsx`, `DecisionCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Header Component`** (3 nodes): `Header.tsx`, `Header.tsx`, `Header()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Role Selector`** (3 nodes): `RoleSelector.tsx`, `RoleSelector.tsx`, `RoleSelector()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audit Test Harness`** (3 nodes): `triageURL()`, `audit.mjs`, `audit.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `POST()` connect `API Routes & Extractors` to `Classifier & Scoring`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `reload()` connect `Dashboard & Queue View` to `Queue Store`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `POST()` (e.g. with `extractPDF()` and `analyzeFilename()`) actually correct?**
  _`POST()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `reload()` (e.g. with `getQueue()` and `computeStats()`) actually correct?**
  _`reload()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `updateQueueItem()` (e.g. with `setStatus()` and `setDepartment()`) actually correct?**
  _`updateQueueItem()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Queue (status tracking: New â†’ Assigned â†’ In Progress â†’ Fixed â†’ Archived)`, `WCAG Remediation Steps`, `Remove â†’ Replace â†’ Remediate Workflow` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._