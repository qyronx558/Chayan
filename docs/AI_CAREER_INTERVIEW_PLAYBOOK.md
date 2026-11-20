# ChayanJobs: complete resume draft and AI interview playbook

Prepared on 19 October 2026 from this checkout. Read alongside [reproducible evidence](interview-evidence.json). This is a preparation and implementation plan; the proposed AI services have not been added to the application.

## Start here: use this document for your application

The emphasis is **AI application engineering, Python backend development, retrieval, document processing, evaluation, and reliable APIs**. Frontend work supports the product story; give more interview time to data flow, ranking, correctness, permissions and failure recovery.

Use the resume draft below as your starting document. Read sections 1–4 for the existing project's evidence, sections 5–6 for AI additions and measurement, section 7 for interview questions, and sections 10–12 for deeper explanations and role-specific practice.

**Status labels used throughout:**

- **IMPLEMENTED:** supported by inspected application code; your own contribution and deployed operation still need confirmation.
- **PLANNED:** an addition to learn, build and evaluate; not an existing project achievement.
- **PERSONAL DETAIL NEEDED:** information such as employment, education, dates or proficiency that cannot be established from this repository.

### Complete resume draft: current implementation

This is an editable resume draft with all standard sections. Replace brackets, keep only skills you can explain independently, and remove irrelevant or unfilled sections before sending it. Aim for one page if your relevant experience fits; use more space when your actual work history warrants it. Do not paste the playbook or implementation status notes into your submitted resume.

---

**[FULL NAME]**  
[City, State] | [Phone] | [Professional email]  
[LinkedIn URL] | [GitHub URL] | [Portfolio/live project URL]

**SOFTWARE DEVELOPER | BACKEND APIs, DOCUMENT PROCESSING & JOB MATCHING**

**PROFESSIONAL SUMMARY**

Software developer with hands-on experience in [your actual contribution] to ChayanJobs, a job discovery platform built with TypeScript, Next.js, PostgreSQL and Prisma. Project work includes [retain only what you owned: document ingestion, explainable job ranking, authenticated APIs, search or reliable notification delivery]. Seeking [one target role] with a focus on [skills you already possess and can demonstrate].

**TECHNICAL SKILLS**

- **Backend and data:** TypeScript, Node.js, Next.js route handlers, HTTP/JSON APIs, PostgreSQL, Prisma ORM.
- **Document processing and matching:** PDF/DOCX text extraction, dictionary and regex extraction, profile normalization, weighted relevance scoring, ranking explanations.
- **Reliability and access control:** input validation, authentication, role/ownership checks, idempotency, database transactions, bounded delivery retries, HTTP cache policies.
- **Development tools:** Git, GitHub, [retain if personally used: GitHub Actions, Docker, Vercel, testing tools].
- **Additional demonstrated skills:** [Python, SQL, pytest, FastAPI or other skills from your own experience; include only if you can substantiate them].

**PROFESSIONAL EXPERIENCE**

**[Actual job title] - [Employer]** | [Location] | [Month Year–Month Year]

- [Action you took] for [specific problem], using [relevant skill], resulting in [verified outcome and measurement context].
- [Backend, automation, integration or data responsibility you personally owned], with [evidence-backed scope or result].
- [A real debugging, testing, reliability or collaboration example].

[Repeat for relevant previous employment. If you have no professional experience, remove this section and place Projects immediately after Technical Skills. Use an internship/freelance heading only for actual internship/freelance work.]

**PROJECTS**

**ChayanJobs - Job Discovery and Resume Matching Platform** | [Actual dates]  
[Repository URL] | [Live demo URL]  
TypeScript, Next.js, PostgreSQL, Prisma, Auth.js

- Developed resume ingestion for **2 formats, PDF and DOCX**, with a **5 MiB upload limit**, extracting skills, education, experience and location for personalized job discovery.
- Implemented explainable ranking across **4 profile dimensions**, scoring up to **300 active private-job candidates per request** and returning matched skills and ranking details.
- Built search across **6 content groups** and configured public API caching with **60-second freshness** and a **120-second stale-while-revalidate window**.
- Implemented durable contact ticket handling with idempotent submissions, database-coordinated delivery claims and retry eligibility capped at **10 delivery attempts**.

[Select the strongest 3 bullets you personally owned. For backend roles, prioritize the contact reliability bullet; for AI application roles, prioritize document processing and ranking.]

**EDUCATION**

**[Degree / qualification] - [Institution]** | [Graduation year]  
[Optional: relevant coursework or verified academic achievement]

**CERTIFICATIONS / ADDITIONAL WORK**

[Relevant completed certification, issuer, year and verification link, or another completed project with a short description. Remove this section if it adds no evidence.]

---

### AI-focused resume upgrade: use after completing the feature

Keep the same contact, employment and education details. Replace the headline, summary, skill emphasis and project bullets with the following only once the work is demonstrable. This is a **PLANNED** version, not a claim about current implementation.

**[ONE TARGET ROLE] | PYTHON, RETRIEVAL & AI BACKEND ENGINEERING**

**PROFESSIONAL SUMMARY**

Software developer building AI application workflows with **Python, FastAPI, PostgreSQL and [actual embedding/LLM technology]**. Implemented [completed semantic retrieval or cited Q&A feature] for ChayanJobs and evaluated it on **[actual number] held-out examples** against [actual baseline]. Combines document processing and API development with [personally demonstrated reliability or evaluation skill].

**TECHNICAL SKILLS - retain only completed, demonstrated skills**

- **Python backend:** Python, FastAPI, Pydantic, async I/O, HTTP APIs, pytest.
- **Retrieval and LLM applications:** embeddings, cosine similarity, lexical/semantic retrieval, RAG, source citations, structured extraction, prompt design.
- **Evaluation:** labeled datasets, baseline comparison, Recall@k, nDCG@k, factual support, abstention evaluation, latency and inference cost measurement.
- **Data and reliability:** PostgreSQL, [pgvector if used], SQL, background processing, idempotency, bounded retries, request tracing, access control.
- **Product integration:** TypeScript, Next.js, Git, [actual deployment and CI tools].

**CHAYANJOBS - AI PROJECT BULLETS**

- Built a **Python/FastAPI [actual workflow]** over **[N] approved job records**, improving **[metric] from [baseline] to [new result]** on **[Q] held-out, labeled queries**.
- Implemented **[completed document Q&A/extraction feature]** with **[actual provenance/citation checks]**, measuring **[numerator]/[denominator]** correct or supported outputs on **[dataset description]**.
- Added **[actual timeout/retry/worker instrumentation]**, recording **[p95 latency]** at **[load]** and **[cost with currency]** variable inference cost per successful request.

For Junior ML applications, substitute one completed training experiment and its evaluation for a generation bullet. State the model, input features, data split, baseline and appropriate test metric.

### Tailor the resume to one vacancy at a time

Use the job's exact role title in your objective or target headline when appropriate; keep your historical employment titles accurate. Match terminology to work you can demonstrate. A technology name appearing in the vacancy is not enough reason to add it to your skills.

| Target role | Highlight these skills most | Lead with this project story | Evidence needed for the AI claim |
|---|---|---|---|
| **Applied AI Engineer** | **Python, baselines, semantic matching, evaluation, API integration** | A measured improvement to job discovery | Same held-out cases, baseline/new metrics, error analysis |
| **Generative AI Engineer** | **RAG, prompt design, structured outputs, citations, evaluation** | Answering notification questions with evidence | Answer correctness, unsupported-claim cases, missing-evidence behavior |
| **Junior ML Engineer** | **Python, pandas/NumPy, scikit-learn, statistics, splits, F1** | Training a modest model against a simple baseline | Reproducible training, leakage controls, untouched test results |
| **LLM Application Engineer** | **Retrieval, context assembly, schema validation, tools, latency/cost** | A reliable retrieve-answer-validate workflow | Retrieval and generation evaluations, versioned outputs |
| **AI Backend Engineer** | **Python/FastAPI, SQL, async, durable jobs, idempotency, observability** | Processing documents despite retries and provider failures | API/worker implementation, failure traces, load measurements |
| **Python Developer - AI/ML** | **Python fundamentals, typing, pytest, SQL, API clients, data processing** | A clean Python service integrated into the product | Runnable code, tests of real failures, debugging ability |
| **AI Solutions Engineer** | **Requirements discovery, architecture, integrations, demos, cost/ROI** | Turning an aspirant/editor problem into a measurable workflow | Working demo, explicit assumptions, measured task outcomes |

The existing code supports the document/backend stories. The Python, retrieval, generation and training columns are learning and implementation priorities until you supply independent evidence.

## 1. Your strongest positioning

ChayanJobs gives you a concrete product problem, data workflows, and backend engineering decisions to discuss. The inspected application is Next.js/TypeScript with PostgreSQL/Prisma. Its resume recommendations currently use a dictionary, regular expressions, and a weighted scoring function. There is no evidence in the inspected implementation of model training, embeddings, RAG, an LLM provider, or a Python AI service.

Use the existing product as your engineering foundation. Add one evaluated AI workflow that solves a real product problem. A defensible headline after that addition is **“Software engineer building AI applications with Python, retrieval, and production APIs.”** Until then, describe the implemented matcher as **explainable rule-based job matching**.

Only use first-person resume wording for work you personally implemented, integrated, or meaningfully maintained. Repository contents alone cannot establish your contribution, deployment ownership, employment history, or user adoption. If a tool generated code, be prepared to explain your design decisions, review, verification, and changes.

### Which roles to prioritize

This is a project-based recommendation, not a survey of current openings or a prediction of selection odds. Actual fit depends on your experience and each job description.

| Role | Evidence you already have | Most useful addition | Preparation emphasis |
|---|---|---|---|
| LLM Application Engineer | Document parsing, search, backend product | Cited job-notification Q&A with retrieval evaluation | Retrieval, grounding, prompts, tool schemas, latency/cost |
| Applied AI Engineer | Real user workflow and deterministic baseline | Resume/job semantic matching with measured comparison | Problem framing, baselines, experiments, shipping |
| Generative AI Engineer | Product integration foundation | Cited Q&A plus structured extraction | Generation failures, schemas, evals, provider failures |
| AI Backend Engineer | APIs, database, auth, retries, caching | Python/FastAPI service and durable worker | Async I/O, queues, idempotency, observability |
| Python Developer - AI/ML | Transferable backend concepts | A Python service you can code and debug independently | Python, typing, pytest, SQL, APIs, packaging |
| AI Solutions Engineer | Product demo and end-to-end workflows | Configurable demo, architecture and cost proposal | Discovery, explaining tradeoffs, integration, ROI |
| Junior Machine Learning Engineer | Existing heuristic recommendation baseline | Train/evaluate one modest supervised model | Statistics, leakage, splits, metrics, deployment |

For an urgent switch, prioritize the application/backend roles once you can demonstrate the Python and AI additions. Junior ML is a separate preparation track: integrating a pretrained LLM does not establish training competence. Apply to roles matching your current skills while building the additions; do not wait to implement every feature below.

## 2. Numbers you can support today

Run from the repository root with the inspected Node v22.15.1 runtime:

```powershell
node --experimental-strip-types scripts/interview-evidence.mjs
```

The script uses Node built-ins and imports the actual matching functions. It writes source hashes, inventory lists, the base commit, and synthetic probe outputs to [interview-evidence.json](interview-evidence.json). It does not install dependencies, connect to a database, call paid services, or use real resumes. Source counts are implementation evidence, not performance evidence.

| Verified fact | Numeric value | Proof and appropriate wording |
|---|---:|---|
| Prisma model declarations | 71 | [Schema](../prisma/schema.prisma); say “schema defines 71 models,” not “71 deployed microservices” |
| API route files | 146 | Complete file list in evidence JSON; one file can contain multiple HTTP handlers |
| Explicit `@@index` declarations | 193 | Schema inventory; not proof that indexes exist in production or improve a particular query |
| Committed migration SQL files | 9 | Migration file list; not proof they were deployed |
| Contact test declarations | 14 | [Test file](../tests/integration/api/contact/route.test.ts); these tests were counted, not run in this checkout |
| Resume input formats | 2 | PDF and DOCX in [upload route](../src/app/api/user/resume/route.ts) |
| Resume upload size limit | 5 MiB | `5 * 1024 * 1024` bytes in upload route; MIME checking alone is not comprehensive file validation |
| Recommendation candidate window | Up to 300 | Latest ACTIVE private jobs in [recommendation route](../src/app/api/private-jobs/recommendations/route.ts); not 300 requests/sec |
| Base score dimensions | 4 | Skills / experience / education / location in [scoring code](../src/lib/skills.ts) |
| Nominal score weights | 50 / 20 / 15 / 15 | Heuristic points, not experimentally optimized weights or calibrated probabilities |
| Additional recommendation bonuses | 5 / 5 / 3 | Remote preference / fresher-friendly / trust threshold; final score capped at 100 |
| “Top match” threshold | 30 points | Code-defined grouping threshold; no validation of relevance quality |
| Search result groups | 6 | Govt jobs, private jobs, results, admit cards, answer keys, blogs in [search API](../src/app/api/search/route.ts) |
| Public API cache policy | 60s + 120s | Shared-cache freshness and stale-while-revalidate in [cache helper](../src/lib/cache.ts); not a measured speedup |
| Defined platform roles | 3 | USER, ADMIN, SUPER_ADMIN in [roles](../src/lib/roles.ts); enforcement needs route-level verification |
| Skill dictionary | 242 entries, 241 unique | Actual exported array; includes education and seniority words, so do not call these 242 validated technical skills |
| Contact email rate limit | 5 per 1h window | [Limiter](../src/lib/contact-server.ts); additional IP cap 5, or fallback global cap 100 when trusted IP unavailable |
| Contact delivery attempt cap | 10 | [Delivery logic](../src/lib/contact-delivery.ts); eligible only while ticket age is under 23h |
| Delivery claim / retry delay | 5min / 15min | Database claim prevents overlapping delivery attempts within its lease; retry delay is fixed |
| Retry batch and schedule | Up to 10 / hourly | [Cron route](../src/app/api/cron/contact/route.ts), Vercel cron in [vercel.json](../vercel.json), manual [workflow](../.github/workflows/contact-delivery.yml); scheduling is configuration, not an execution SLA |
| SSE reconnect / heartbeat | 5s / 25s | [SSE route](../src/app/api/notifications/stream/route.ts); no measured concurrent-client capacity |

The declared framework version in `package.json` is **Next.js 16.2.10**; the README still says Next.js 15. Use the package declaration when discussing this checkout. Installed/runtime versions were not independently verified.

Numbers that still need external proof: monthly active users, request volume, uptime, p95 latency, conversion improvement, extraction accuracy, recommendation relevance, cloud costs, and hours saved. The README's “thousands of aspirants” wording is not analytics evidence. Its overview also describes official-source aggregation, while the inspected importer config points to a third-party listing source. Verify and preserve authoritative notification provenance before claiming direct official-source ingestion.

## 3. Resume text

### Version you can adapt now

**ChayanJobs - Job Discovery and Resume Matching Platform**  
Next.js, TypeScript, PostgreSQL, Prisma, Auth.js

- Developed resume ingestion for **2 document formats (PDF/DOCX)** with a **5 MiB upload cap**, extracting skills, education, experience, and location for personalized discovery.
- Implemented explainable ranking across **4 profile dimensions**, evaluating up to **300 active job candidates per request** and returning matched skills and score details.
- Built search across **6 content groups** and configured public API caching with **60-second freshness and a 120-second stale-while-revalidate window**.
- Implemented durable contact ticket storage with idempotent submissions, database-coordinated delivery claims, and retry eligibility capped at **10 delivery attempts**.

Pick the best 2–3 bullets for your own contribution and the vacancy. Replace “Developed/Implemented/Built” with “Extended,” “Integrated,” or “Maintained” where that better describes your work. These are scope/configuration claims. Do not describe them as measured business impact.

Use “deployed” or “production” with a live demo and evidence of your deployment work. This review did not certify production readiness. The [contact deployment notes](contact-production.md) still list migration, publication, cron and email verification as pending; confirm their present state before presenting that subsystem as operational.

### Version after implementing and evaluating AI

These are templates, not completed achievements. Replace **every** bracket with an observed value and retain the evaluation artifact:

- Built a Python/FastAPI semantic recommendation service over **[N]** job records; improved **nDCG@10 from [A] to [B]** on **[Q] held-out, human-labeled queries** against the existing heuristic baseline.
- Added retrieval-grounded notification Q&A with document/page citations; achieved **[supported claims]/[all factual claims] claim support** and **[correct abstentions]/[unanswerable questions] abstention** on a versioned evaluation set.
- Deployed asynchronous document processing with **[observed p95]** end-to-end latency at **[specified load]**, **[error numerator]/[request denominator]** failed requests, and **[currency + cost]** average variable inference cost per successful request.

If you only completed local evaluation, say “evaluated locally.” If you used synthetic data, say so. If a change goes from 0.50 to 0.65, that is +0.15 absolute and +30% relative, not “15% better.” No numerical example in this guide is an achieved result unless explicitly listed as observed.

## 4. Explain the existing product in an interview

### 60–90 second introduction

“ChayanJobs brings job and exam information into a searchable portal. The implementation uses Next.js, TypeScript, PostgreSQL and Prisma. My contribution was [specific modules and decisions]. One workflow accepts PDF or DOCX resumes, extracts profile information, then ranks up to 300 active private jobs using an explainable rule-based score. That gave me a baseline I can inspect and compare against semantic retrieval. I also worked on [personally owned auth/search/retry/caching workflow]. The code has concrete limitations, including substring skill matches and incomplete education comparison. My next increment is [planned feature].”

Only replace the final sentence with a completed AI result once you can demonstrate it and show its evaluation. Do not memorize a pitch that claims work you have not done.

### Current architecture

```text
Browser / Next.js UI
  -> Next.js route handlers
     -> Auth.js session + endpoint-specific authorization
     -> Prisma -> PostgreSQL
     -> Resume parser -> dictionary/regex extraction -> stored profile
     -> latest 300 ACTIVE private jobs -> weighted score -> sorted matches
     -> public search -> six parallel Prisma queries -> cacheable response
     -> contact -> transaction saves ticket -> delivery attempt
                    -> authenticated cron retries eligible tickets

SSE notifications: authenticated connection -> process-local subscriber Set
```

Be ready to draw the resume flow, the contact failure flow, and the proposed AI flow independently. Know the input, stored data, permissions, failure response, and retry boundary at every step.

### Four observed limitations to discuss honestly

These are actual executions of the current functions, not hypothetical concerns:

1. `extractSkills("JavaScript developer")` returns **C, Java, JavaScript, R**. Substring matching causes false positives. Start with phrase/token boundaries and an alias dictionary; carefully handle skills such as C++, C#, Node.js and R.
2. A profile with **10th** education receives a **100/100** score in a synthetic job example requiring a master's degree. The education branch gives known levels points without comparing the required level. Parse the requirement explicitly; use `eligible/ineligible/unknown` separately from relevance ranking.
3. The same relevant Python profile scores **100**, then **67** after adding Sales and Marketing. The skill score divides by candidate skills, penalizing a broader profile. Compare against required-job-skill coverage and a labeled ranking baseline.
4. `extractEducationLevel("B.Tech and M.Tech")` returns **bachelor** because the first matching pattern wins. Parse all qualifications and choose the relevant highest recognized level; keep unknown cases visible.

Good response: “I found these cases by running the baseline. I would preserve them as regression examples, fix deterministic eligibility first, and evaluate retrieval improvements separately.” Say “fixed” only after the change and verification exist.

Additional review findings: the recommendation window excludes older jobs; search parses a page offset but does not apply it to its queries; process-local SSE subscribers do not provide cross-instance fanout; serving a Redis container does not prove the application uses Redis. Search publication/status filtering needs review across result groups before it is reused by an AI retriever.

## 5. Features to add and what each teaches

### P0 - Correctness and evidence foundation

Fix the four demonstrated matcher limitations. Add focused regression coverage for those real failures. Establish consented or synthetic resume fixtures and manually labeled job/query examples. Record dataset versions, label rules, difficult examples, and the baseline before tuning.

Deliverable: a reproducible baseline report with errors, not a new model. This is the foundation for credible numerical resume claims.

### P1 - Python semantic job retrieval

**Product benefit:** find relevant jobs when the resume and description use different wording.

**Proposed implementation:** keep the Next.js product; add one FastAPI service with Pydantic request/response models, timeouts and service authentication. Precompute embeddings for approved job records; use PostgreSQL with pgvector if your provider supports it. Start with exact search at small corpus sizes. Combine lexical retrieval with semantic retrieval and explicit status/location/eligibility filters. Reuse the existing matcher as a comparison baseline and failure fallback.

`POST /v1/recommendations` should accept an authorized profile/query reference and return job IDs, component scores, evidence and model/index versions. Never trust a caller-supplied user ID without checking ownership. Keep “job relevance” separate from “verified eligibility” and “chance of getting hired.”

**Learn to defend:** embeddings, cosine similarity, exact versus approximate search, lexical versus semantic retrieval, candidate generation, filter ordering, recall versus latency, batching, cache invalidation, model version changes, and why not to generate a whole answer for every candidate.

**Proof:** labeled relevance judgments, baseline and new ranked lists, nDCG@10/Recall@10, latency distributions, corpus size and machine details. Sentence Transformers documents retrieval evaluators with these metrics in its [evaluation reference](https://www.sbert.net/docs/package_reference/sentence_transformer/evaluation.html). pgvector documents exact/approximate search and cosine distance in its [official repository](https://github.com/pgvector/pgvector).

### P2 - Notification Q&A with citations

**Product benefit:** answer “What is the fee?”, “Which date is the deadline?” and “What qualification is required?” using an approved source notification.

**Proposed implementation:** store document version, origin URL, retrieval date and checksum; extract text with page/section metadata; chunk and embed approved documents; retrieve relevant passages; generate a short answer with references. Validate citation IDs against retrieved chunks and check supporting text. Abstain when evidence is missing or contradictory. Show source freshness and authoritative links; a citation's existence does not establish that it supports the answer.

Start with a deterministic retrieval-then-answer workflow. A simple controlled pipeline is easier to evaluate than an autonomous agent for this task, consistent with the design guidance in [Anthropic's engineering article](https://www.anthropic.com/engineering/building-effective-agents).

**Learn to defend:** chunk boundaries, overlap, retrieval misses, context length, grounding, unsupported claims, OCR failures, source updates, Hindi/English queries, malicious instructions inside retrieved text, and answer versus abstain decisions.

**Proof:** answerable and unanswerable evaluation cases, citation support labels, exact date/fee checks, repeated generation runs, latency and token/cost records. Keep age and eligibility calculations deterministic and tied to the notification; the LLM can explain verified results.

### P3 - Structured extraction with human review

**Product benefit:** prepare a draft job record from a notification PDF for an editor to approve.

**Proposed implementation:** extract title, organization, dates, fees, qualifications and links to a validated schema. Store per-field source spans and `unknown` values. Validate date order and fee formats, then show a comparison screen. Require an editor to publish; do not let a model invent missing fields or auto-publish critical deadlines.

**Learn to defend:** schema validity versus factual correctness, extraction precision/recall, normalization, scanned PDFs/OCR, retries, document provenance and review thresholds. A schema-valid wrong date is still wrong.

**Proof:** a manually annotated PDF set, field-level metrics, date/fee exact match, parse failure count, and paired manual-versus-assisted editor timings. Count review and correction time when estimating savings.

### P4 - AI backend reliability

**Product benefit:** uploads and AI calls recover from transient failure without duplicate processing or uncontrolled cost.

**Proposed implementation:** durable jobs for ingest/embedding, content-hash idempotency, bounded retries with backoff/jitter for retryable errors, failed-job handling, request IDs, latency/token/cost logging and per-user quotas. Authenticate worker operations. Reuse the contact subsystem's durable-state ideas, while acknowledging its fixed retry interval and finite eligibility window.

**Learn to defend:** at-least-once delivery, deduplication versus exactly-once effects, worker crashes, partial writes, cancellation, provider timeouts, 429s, circuit breaking, and private-data retention. Async I/O helps waiting on services; CPU-heavy OCR/embedding work needs appropriate worker execution. See [FastAPI's concurrency guidance](https://fastapi.tiangolo.com/async/).

### Optional ML track - A small supervised model

After you have enough representative, human-labeled examples, compare TF-IDF plus a linear model with embeddings and the rules baseline. Suitable tasks include job category classification or relevance prediction. Do not train against the current heuristic score and then claim independent accuracy.

Learn train/validation/test separation, stratification, imbalance, regularization, macro-F1, confusion matrices, calibration and error analysis. Group duplicate notifications or employers appropriately and consider time-based evaluation. Fit preprocessing only on training data; scikit-learn explains this in its [data leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html).

Fine-tuning, Kubernetes, autonomous multi-agent systems and additional vector databases are optional later decisions. Add them only for a demonstrated requirement you can explain.

## 6. Measurement plan: how to earn stronger resume numbers

The quantities below are suggested experiment sizes and starting goals, not observed project results or hiring standards.

| Experiment | Suggested initial sample | What to report | Example starting goal |
|---|---|---|---|
| Resume extraction | 50 synthetic/consented files, varied layouts | Skill precision/recall/F1, education/experience exact match, failures; separate scanned files | Improve over baseline without increasing false positives |
| Job retrieval | 100 labeled queries over at least 500 real approved job records, if available | nDCG@10 and Recall@10 for rules/lexical/semantic/hybrid | Positive improvement on untouched test queries |
| Notification Q&A | 100 cases: 60 answerable, 20 unanswerable, 20 adversarial/conflicting | Answer correctness, factual-claim support, citation validity, correct abstention by category | At least 90% supported factual claims on this set |
| Structured extraction | 50 varied notifications | Per-field precision/recall, date/fee exact match, review corrections | No fabricated critical fields accepted for publication |
| API load | Start with 10 concurrent clients for 5min in staging | Requests, successes/errors, p50/p95/p99, cold/warm, resource usage | Choose latency/error budget after baseline and cost review |
| Editor efficiency | 20 paired tasks, counterbalanced order | Median manual and assisted total times; corrections included | Demonstrable savings with equal or better correctness |

If the real corpus is smaller, report its actual size. These are small pilot sets; do not generalize them to all applicants, document formats, languages or future traffic.

Definitions you should be able to calculate:

- **Precision:** correct extracted items / all extracted items. **Recall:** correct extracted items / all gold items. **F1:** harmonic mean of precision and recall. Specify matching rules and macro versus micro averaging.
- **Recall@10:** labeled relevant jobs retrieved in the first 10 / all labeled relevant jobs, averaged over eligible queries. Distinguish from hit-rate@10, which only asks whether at least one relevant result appeared.
- **nDCG@10:** ranking gain discounted by position, normalized by the ideal labeled ranking. Declare relevance grades and the exact metric implementation.
- **Citation validity:** citations resolving to an allowed document/page. **Claim support:** factual claims supported by their evidence / factual claims reviewed. Evaluate both separately.
- **Correct abstention rate:** correctly refused unanswerable questions / unanswerable questions. Also measure false refusals on answerable questions.
- **p95 latency:** the 95th percentile of end-to-end request times for a specified workload; report sample count, warm/cold conditions and errors. Distinguish time-to-first-token from complete-answer latency.
- **Variable request cost:** input tokens × recorded input rate + output tokens × recorded output rate + attributed embedding/retrieval cost. Normalize per-token rates correctly. Track retries and failed calls too; report hosting/storage separately and record the pricing date.
- **Time saved:** `(manual total - assisted total) / manual total × 100`, with comparable tasks and review included.

Freeze the evaluation set before optimizing. Use a development set for changes and a held-out test set for the final report. For stochastic answers, repeat runs and report variation. Use human review for critical fields and samples of any LLM-judge labels; an automated judge is not ground truth. Evaluation should cover task outcomes and failure cases, following the principles in [Anthropic's evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

Each report should include source commit, dataset checksum, split/label instructions, prompt/model/index version, hardware/environment, command, raw outputs, aggregate metrics and known failures. Keep only synthetic or properly consented/anonymized examples in a public portfolio.

## 7. Likely interview questions and answer guidance

These are high-value preparation questions inferred from the project and roles, not a prediction of any employer's interview.

### Product and ownership

1. **What problem does ChayanJobs solve?** Explain fragmented job/exam information, the target user, and one complete discovery-to-application workflow. Support adoption claims with actual analytics or leave them out.
2. **What did you personally build?** Name files, design decisions, alternatives, review and verification. Separate your work from libraries, collaborators and generated code.
3. **What makes this production work?** Discuss deployment, migrations, authorization, failure recovery and observability you actually verified. A live URL alone does not prove reliability.
4. **What was your hardest bug?** Use a real incident: symptom, evidence, root cause, fix, verification. The four observed matcher failures are available examples, but do not claim a fix already shipped.
5. **Why is AI useful here?** Paraphrase retrieval, document extraction and cited explanations. Exact deadlines, permissions and eligibility constraints still need deterministic checks.
6. **What would you build next and why?** Start with matcher correctness and evaluation; then choose one measured feature based on user value and role fit.

### Current implementation

7. **Walk through resume upload.** Session check → MIME and size gates → parser → heuristic extraction → Prisma upsert → audit → metadata response. Discuss scanned PDFs and private-data retention limits.
8. **Is this an ML recommendation engine?** Currently it is a rule-based baseline; no trained parameters or held-out accuracy have been established.
9. **Explain the score.** Skills get up to 50 points, experience 20, education 15, location 15; endpoint bonuses are applied afterward and capped at 100. Explain the observed education bug.
10. **Does 80/100 mean 80% hiring probability?** No. It is an uncalibrated heuristic score, not probability, eligibility certification or predictive hiring accuracy.
11. **Why only 300 jobs?** It bounds per-request work, but excludes older relevant candidates. Discuss a filtered indexed retrieval stage rather than ranking the entire catalogue synchronously.
12. **How does search work?** Six concurrent Prisma queries with case-insensitive substring conditions; no embedding retrieval. Pagination is incomplete because the computed offset is unused.
13. **Why might substring search become slow?** Query shape and selectivity matter; a normal B-tree does not automatically optimize arbitrary substring matching. Inspect query plans before choosing full-text/trigram indexes.
14. **How does caching work?** Shared caches may serve public API responses fresh for 60 seconds and stale during a 120-second revalidation window. Explain freshness tradeoffs and verify deployed headers.
15. **Does CMS invalidation clear every cache?** Path revalidation is present, but separate CDN/API cache behavior must be verified. Do not promise instant global invalidation from a helper alone.
16. **How is access restricted?** Authentication identifies the user; authorization checks role and ownership. Explain ADMIN owner-scoping and SUPER_ADMIN privileges, then show enforcement in a relevant route.
17. **Why JWT sessions?** Explain the implemented strategy, expiration and revocation/role freshness tradeoffs. Verify the actual callbacks before claiming immediate revocation.
18. **How does contact survive an email failure?** Ticket storage commits first, then delivery is attempted. A cron route retries eligible unsent portions. Initial missing provider configuration rejects a new submission before saving.
19. **What if a request is retried?** UUID-derived ticket ID, replay lookup and payload comparison; different payload with same key returns conflict. A concurrent unique-key collision can return 409 for retry.
20. **What if two workers deliver the same ticket?** A conditional update claims a 5-minute lease and increments attempts. Explain stale workers and why a lease is not a complete exactly-once guarantee.
21. **What happens after 10 attempts or 23 hours?** Automatic selection stops under current rules. Add operational visibility/manual recovery before promising guaranteed eventual delivery.
22. **Why is Redis listed?** Docker provisions it, but application Redis use was not found in the inspected source. Do not claim distributed caching/pub-sub is implemented.
23. **Can SSE scale across instances?** The current subscriber Set is process-local. A shared event system and connection/replay design would be required for cross-instance delivery guarantees.
24. **How are schema changes deployed?** A manually triggered workflow with a single concurrency group runs migrations separately from builds. Committed migrations do not prove successful production application.

### Retrieval and LLM applications - proposed additions

25. **What is an embedding?** A learned vector representation used for similarity; demonstrate where semantic similarity helps and where exact dates/identifiers still matter.
26. **Why cosine similarity?** Compare direction rather than raw magnitude; know how normalization changes the relationship with dot product and Euclidean distance.
27. **Lexical or vector search?** Lexical helps exact names, exam codes and explicit skills; vectors help paraphrases. Compare both and hybrid retrieval on the same labeled queries.
28. **What is RAG?** Retrieve external evidence, supply it as context, then generate an answer. It does not guarantee correctness or update model weights.
29. **How do you choose chunks?** Preserve headings/page/source boundaries, experiment with token sizes/overlap, then compare retrieval and answer quality. No universal optimal chunk size.
30. **What is a reranker?** A second model scores a small candidate set more carefully, trading additional latency/cost for ranking quality. Add it only after measuring.
31. **How do you choose top-k?** Compare recall, context cost and noise; tune on development queries and report held-out performance.
32. **How do you handle hallucinations?** Source restrictions, evidence checks, citation validation, deterministic critical-field checks and abstention; measure failures rather than claim elimination.
33. **How do you handle prompt injection?** Treat document text as untrusted data, isolate it from instructions, restrict tools/access and validate outputs. Prompt wording alone is insufficient.
34. **How do you select a model?** Evaluate on your own tasks, language coverage, latency, cost, output schema reliability and data-handling constraints; record the exact version.
35. **RAG or fine-tuning?** Use retrieval for changing, citable notification knowledge; consider fine-tuning for demonstrated behavior/task needs with suitable data and evaluation.
36. **What does temperature control?** Sampling behavior; lower temperature may reduce variation but does not guarantee determinism or factual accuracy.
37. **Does valid JSON mean a correct answer?** No. Validate structure and semantics independently, especially dates, fees, citation targets and allowed record IDs.
38. **What if a provider times out or rate limits you?** Timeouts, limited retry with jitter for retryable failures, quotas, fallback and user-visible status; account for duplicate requests and cost.
39. **How do you prevent private resume leakage?** Enforce ownership before retrieval, scope indexes/caches, minimize content sent externally, redact logs and implement retention/deletion across derived artifacts.
40. **How do you know a change improved the product?** Frozen benchmark and baseline comparison first; production experiments later with real consenting usage and defined success metrics.
41. **Would you use an agent?** Only when dynamic tool selection solves a need. A fixed retrieve-answer-validate flow handles the first Q&A increment; added autonomy adds evaluation and control requirements.

### Python, backend and ML foundations

42. **Why Python alongside Next.js?** Python supports the intended retrieval/ML ecosystem; keep a service boundary only if that benefit justifies another deployment and failure surface.
43. **`async def` versus worker processing?** Await I/O-bound service calls; blocking CPU work can stall the event loop. Know when to use workers/processes and bounded concurrency.
44. **How do you design an upload API?** Authorization, byte limits, content validation, safe parsing, job status, idempotency, backpressure and controlled failures. Know what the current code does versus planned hardening.
45. **Which Python topics should you be able to code?** Collections, comprehensions, iterators/generators, exceptions, context managers, typing, dataclasses/Pydantic, async, modules, environments and pytest fixtures/mocks.
46. **Classification versus ranking metrics?** Accuracy/F1 evaluate classification decisions; nDCG/Recall@k evaluate ranked retrieval. Do not use “accuracy” without defining the task.
47. **What is leakage in this project?** Near-identical notifications across splits, tuning on test queries, using future records for historical predictions, or fitting preprocessing on all data.
48. **How do you handle imbalance?** Inspect per-class performance, use appropriate splits/weights/thresholds, and report macro-F1 and confusion matrices instead of aggregate accuracy alone.
49. **What is overfitting?** Optimization that fits training quirks rather than generalizable signal; explain validation, regularization, simpler baselines and error analysis.
50. **How do you monitor a deployed model?** Versioned latency/error/cost/retrieval metrics, sampled quality review, drift indicators, alerts and rollback; acknowledge delayed or missing relevance labels.
51. **What would you do with no labeled data?** Build a small human-reviewed pilot set with explicit labeling rules, compare simple baselines and acknowledge uncertainty. Do not convert a heuristic's outputs into ground truth.
52. **How would you demonstrate ROI as a Solutions Engineer?** Map a customer's current workflow, measure paired task times and error rates, estimate total operating cost, and state assumptions without promising unmeasured revenue.

### Coding drills connected to this product

- Parse varied experience/date expressions and explain ambiguous cases.
- Implement boundary-aware skill matching with punctuation and aliases.
- Rank candidate jobs and return explanations without exposing private fields.
- Build a typed FastAPI endpoint with a provider timeout and mocked failure path.
- Write SQL for active jobs, duplicate notifications and daily event counts; explain indexes and query plans.
- Compute precision/recall/F1 and Recall@k from a small labeled example by hand.
- Explain and implement idempotent job creation and safe worker retries.

## 8. A focused preparation schedule

Illustrative 14-day plan assuming about 4–6 focused hours/day and working Python fundamentals. If Python is new, extend the timeline; this is not a delivery guarantee.

| Days | Work | Concrete outcome |
|---|---|---|
| 1–2 | Trace current flows, record your contribution, reproduce and fix demonstrated matcher failures | Accurate pitch, baseline report, focused regression examples |
| 3–4 | Build a small Python API with auth, schemas, mocked failures and one endpoint | Runnable service and API contract you can explain |
| 5–7 | Build approved-job embeddings and lexical/semantic retrieval comparison | Versioned corpus, labeled query set, baseline/new metrics |
| 8–10 | Add one notification Q&A flow with citations and abstention | Demo plus answerable/unanswerable failure cases |
| 11–12 | Add bounded retries, request IDs and latency/cost instrumentation; verify staging | Failure demo and measured limits |
| 13–14 | Re-run untouched evaluations, record demo, update resume, do mock interviews | Evidence-backed bullets and practiced explanations |

If time is tighter, finish one feature and its evaluation, then apply. Structured extraction and the supervised ML track can follow. Spend interview practice time writing Python/SQL and explaining tradeoffs, not only watching framework tutorials.

## 9. Portfolio evidence to prepare

1. Resume with your own contribution and only verified metrics.
2. Three-minute demo: user problem, current flow, AI feature if implemented, evidence, one failure and fallback.
3. Architecture diagram with current versus proposed components clearly labeled.
4. Evaluation report with baseline, fixed data split, raw outputs and limitations.
5. Sanitized deployment evidence: release/commit, health checks and measured workload. Never publish secrets or real resume contents.
6. One-page design note: alternatives, chosen design, known limitations and next improvement.
7. A real troubleshooting story and one code path you can explain line by line.

Before an interview, you should be able to answer: **What did I own? What does the code actually do? How did I measure it? Where does it fail? Why did I choose this design?** Those answers make the numbers credible.

## 10. Priority skill explanations connected to this product

Use this answer pattern: **define the skill → connect it to a product flow → explain the design choice → name the evidence → acknowledge a limitation**. Definitions below describe concepts; proposed examples are not completed application features.

### A. Python and typed API development - highest priority for Python/backend roles

**Meaning:** Python fundamentals let you transform data, handle errors and implement services. Type hints and request/response models make contracts clearer; validation checks actual incoming values.

**Product connection - PLANNED:** a FastAPI endpoint takes an authenticated resume/profile reference, loads the authorized profile, retrieves candidate jobs and returns typed recommendations. It should return job IDs and score explanations, rather than loosely formatted text the frontend must interpret.

**Practice answer:** “The existing product's backend is TypeScript. My proposed Python boundary is a retrieval service, because I want to use and evaluate Python retrieval tooling. I would keep ownership checks explicit, validate request and response shapes, set deadlines for external calls, and return structured failures. I would only claim FastAPI experience after building and debugging that service.”

**Follow-ups to practice:** mutable defaults; list versus generator; dictionary/set lookup; exception handling; context managers; Python environments; dependency locking; unit versus integration tests. These are practical coding topics even when the vacancy emphasizes LLMs.

### B. Document processing and information extraction - strongest existing AI-adjacent skill

**Meaning:** turn a document into text, then turn text into structured fields. Text extraction, field extraction and field verification are separate steps.

**Product connection - IMPLEMENTED:** PDF parsing or Mammoth DOCX extraction produces raw text; dictionary/regex functions extract profile attributes; Prisma stores the result. OCR is not established by this path.

**Practice answer:** “The existing parser supports PDF and DOCX. A successfully parsed file can still produce incorrect profile fields. I would evaluate skill extraction with precision and recall, and education or experience with explicit matching rules. A scanned PDF may require a separate OCR path. The MIME and size checks are useful gates, but they do not prove extraction quality.”

**Example:** if the gold skills are `{Python, SQL}` and output is `{Python, SQL, Java}`, precision is **2/3**, recall is **2/2**, and F1 is **0.80**. This is a teaching example, not a project result.

### C. SQL, PostgreSQL and data modeling - highest priority across backend roles

**Meaning:** model entities and relationships, enforce invariants and retrieve data efficiently. ORM methods still produce queries whose plans and transaction behavior matter.

**Product connection - IMPLEMENTED:** users, resumes, jobs, applications and contact tickets are stored through Prisma. Think about one resume per user, ownership, active-job filters, unique ticket identifiers and delivery-state transitions.

**Practice answer:** “I would start with the query shape and data distribution, inspect the plan, then choose an index. The schema's 193 explicit index declarations describe scope; they do not prove faster search. The current substring search and latest-300 candidate limit have different bottlenecks, so I would measure them separately.”

**Follow-ups:** joins, unique versus ordinary indexes, composite index order, transactions, isolation, offset versus keyset pagination, connection pooling. Be able to write a query for active jobs and explain what happens as rows increase.

### D. Embeddings and semantic retrieval - highest priority for Applied AI/LLM roles

**Meaning:** an embedding model maps text to a numerical vector. A retrieval system compares query/profile vectors with job vectors to identify candidates with related meaning.

**Product connection - PLANNED:** a query such as “build Python APIs” could retrieve “backend services using FastAPI,” even without identical wording. Exact exam codes and hard constraints still need explicit handling.

**Practice answer:** “I would precompute job embeddings, compute a query/profile embedding when needed, and retrieve candidates after enforcing the appropriate visibility constraints. I would compare this with a lexical baseline. Embedding similarity is relevance evidence, not proof that a candidate meets every qualification.”

**Small mathematical example:** for `a = [1, 0]` and `b = [1, 1]`, cosine similarity is `1 / sqrt(2)`, approximately **0.707**. It is not a 70.7% chance of hiring. For unit-length vectors, cosine similarity equals their dot product.

**Follow-ups:** model dimension, normalization, exact/approximate nearest neighbors, versioned embeddings, re-embedding after model changes, multilingual queries and expired records.

### E. RAG and evidence-grounded answers - highest priority for GenAI/LLM roles

**Meaning:** retrieve relevant material, assemble context, then ask a language model to answer using that material. Retrieval quality and answer quality need separate diagnosis.

**Product connection - PLANNED:** “What is the application fee for this notification?” retrieves an approved notification section and returns a short answer with a valid page reference.

**Practice answer:** “I would first check whether the fee appears in the retrieved evidence. If retrieval missed the correct page, prompt changes alone will not solve it. If the evidence is present but the generated answer is wrong, I would inspect context assembly and generation. I would validate citations and abstain when the source does not establish the answer.”

**Follow-ups:** chunking, top-k, reranking, source versions, conflicting amendments, context limits, unanswerable questions and evidence freshness.

### F. Prompt design and structured outputs - important for generation roles

**Meaning:** give clear task instructions, delimit untrusted source content, specify allowed outputs and define missing-data behavior. Schema validation controls output shape; semantic verification checks the actual claim.

**Product connection - PLANNED:** extract `deadline`, `fee`, `qualification`, `sourcePage` and `unknownFields` into a typed record for editor review.

**Practice answer:** “I would require source-backed fields and use null or an explicit unknown state when the document omits a value. A syntactically valid date can still be the wrong date, so I would compare critical fields with source spans and validation rules. I would version prompts and evaluate changes on fixed examples.”

**Follow-ups:** malformed outputs, truncation, retry limits, contradictory source text, tools with side effects and prompt injection. Do not rely on an LLM's self-reported confidence as calibrated confidence.

### G. Evaluation and experiment design - highest priority for all AI roles

**Meaning:** define success, choose representative examples, establish a baseline, then compare under the same conditions. A compelling demo and a reliable evaluation answer different questions.

**Product connection - IMPLEMENTED BASELINE, PLANNED AI EVALUATION:** the existing scorer gives a comparison point. The evidence script exposes deterministic failures; it does not establish recommendation accuracy over real users.

**Practice answer:** “I would separate development queries from untouched test queries, write label guidelines, and keep duplicate notifications together when splitting. For ranking I would use nDCG@10 and Recall@10. For Q&A I would measure answer correctness, claim support and correct abstention separately. I would report raw counts as well as rates.”

**Example:** **18 supported answers out of 20 reviewed** is 90% on that sample. It is insufficient to claim 90% accuracy on every notification and language. Identify what was labeled and how cases were selected.

### H. Async I/O and background jobs - highest priority for AI backend roles

**Meaning:** async I/O allows useful work while waiting on external operations. Durable background jobs allow work to resume after the initial request and survive application restarts when properly persisted.

**Product connection - PLANNED:** return a document-processing job reference after acceptance; a worker performs extraction and embedding; the client reads pending/running/completed/failed state.

**Practice answer:** “A slow provider call and CPU-heavy OCR are different workloads. I would await network I/O with bounded concurrency, but run long or CPU-heavy processing in suitable workers. I would store job state durably, make processing repeatable and define what happens after a crash between an external effect and a state update.”

**Follow-ups:** cancellation, queue backlog, concurrency caps, poison jobs, dead-letter handling, per-user fairness and worker shutdown.

### I. Idempotency, retries and transactions - strongest existing backend story

**Meaning:** a repeated request should not unintentionally repeat its intended effect. Retries require limits and safe effect handling; a database transaction only covers operations inside its boundary.

**Product connection - IMPLEMENTED:** contact submission uses a UUID-derived reference, stores the ticket transactionally, then attempts delivery. Delivery uses a conditional database claim and distinct provider idempotency keys for team and acknowledgment messages.

**Practice answer:** “If the initial response is lost, the client can retry using the same key. The route checks for the stored reference and compares the payload. Ticket persistence occurs before delivery, so provider failure can leave a saved ticket for retry. A finite lease and provider idempotency reduce duplicate risk, but I would not call this an unconditional exactly-once guarantee.”

**Follow-ups:** identical key/different payload, concurrent submissions, lease expiry, attempt exhaustion and missing provider credentials. The current retry delay is fixed; exponential backoff is a proposed improvement.

### J. Authentication, authorization and privacy - essential across roles

**Meaning:** authentication establishes identity; authorization decides what that identity can do. AI retrieval and derived data need the same ownership boundaries as ordinary APIs.

**Product connection - IMPLEMENTED AUTH, PLANNED AI SCOPING:** resume routes check sessions. Future retrieval must prevent one user's query from accessing another user's private resume, vector, cached answer or logs.

**Practice answer:** “I would scope access before returning data, derive identity from the authenticated session and verify resource ownership. Cache keys and embedding storage must preserve those boundaries. I would document deletion for raw text and derived artifacts, and avoid logging full resume content.”

**Follow-ups:** role changes, stale JWT claims, service-to-service authentication, secrets, deletion/retention and malicious retrieved instructions.

### K. Observability, latency and cost - important for AI/backend/solutions roles

**Meaning:** trace a request through stages so quality, speed, failures and variable costs can be explained. An average alone can hide slow or expensive cases.

**Product connection - PLANNED AI INSTRUMENTATION:** record parsing, retrieval and generation timings, model version, input/output token counts, retry count and outcome using a request ID. Keep private content out of routine traces.

**Practice answer:** “I would measure end-to-end p95 and stage timings at a declared workload. I would separate cold requests, time-to-first-token and complete-answer latency. For cost, I would include retries and failed calls, record the pricing date and distinguish variable inference from hosting and storage.”

**Follow-ups:** provider outage, alert thresholds, sampled quality review, stale indexes, regression rollback and cache invalidation.

### L. Statistics and supervised learning - highest priority for Junior ML roles

**Meaning:** learn parameters from labeled data and estimate performance on unseen examples. Baselines, splits, leakage prevention and uncertainty are as important as the algorithm name.

**Product connection - PLANNED:** classify job categories or learn relevance from appropriately labeled examples. Start with a simple model and compare against heuristic or majority baselines.

**Practice answer:** “I would define the label and unit of prediction first. I would fit preprocessing on training data only, tune on validation data and report final test results once. For imbalanced categories, I would inspect macro-F1 and the confusion matrix. I would avoid using the current scorer's output as independent ground truth.”

**Follow-ups:** train/validation/test roles, cross-validation, regularization, precision/recall tradeoffs, confidence intervals, calibration and distribution shift. Applying a pretrained embedding model and training your own model are distinct experiences.

## 11. Role-specific mock interview practice

Use these as practice prompts, not memorized claims. Answer from completed work first, then explicitly label the design you would implement next.

| Role | Main mock question | Strong answer should cover | Be ready to show |
|---|---|---|---|
| Applied AI Engineer | “How would semantic recommendations improve this product?” | User problem, current baseline, candidate retrieval, hard filters, fixed evaluation and limits | Existing scorer and baseline/new ranked outputs when implemented |
| Generative AI Engineer | “How would you prevent a wrong deadline answer?” | Authoritative source version, retrieval, critical-field checks, citations, abstention and review | Conflicting/missing-deadline evaluation cases |
| Junior ML Engineer | “How would you train and validate job classification?” | Labels, baseline, splits, preprocessing, imbalance, error analysis | Actual training script and untouched test report when completed |
| LLM Application Engineer | “Design notification Q&A end to end.” | Ingestion, chunk metadata, retrieval, context, generation, output checks, evaluation | Source-to-answer trace with failure cases |
| AI Backend Engineer | “What if document processing crashes halfway through?” | Durable state, idempotency, worker claim, partial effects, retries and recovery | Existing contact flow; separate proposed AI worker state machine |
| Python Developer - AI/ML | “Implement a reliable retrieval endpoint.” | Python fundamentals, schemas, ownership, errors, timeouts, tests | Runnable Python code you wrote and can debug |
| AI Solutions Engineer | “An editor wants to halve publishing time. What do you propose?” | Discovery, current timing, assisted draft/review flow, acceptance criteria, cost and risks | Measured paired tasks when available; clearly labeled proposal otherwise |

### Three useful longer answers

**“Why did you start with rules?”**

“The current workflow uses a dictionary and weighted score. Rules make it possible to inspect why a job received points without a model dependency or inference bill. Inspection also exposed limitations: substring matches, incomplete education comparison and a candidate-skill denominator that penalizes unrelated skills. My next step is to fix those correctness problems, preserve the baseline and test whether semantic retrieval adds measurable relevance.”

**“How do you prove your resume numbers?”**

“I separate code scope from observed outcomes. Two document formats, a 5 MiB cap and a 300-job candidate window are visible in the source. The evidence script reproduces inventory counts and selected function behaviors. Those are not throughput or accuracy claims. For performance or AI quality, I need an evaluation artifact that names the dataset, environment, workload, metric and raw results.”

**“Why are you a fit for an AI role if the current product is TypeScript?”**

“The current project demonstrates [my actual contribution] in document workflows, backend APIs, data modeling and failure handling. Those are useful integration skills for AI applications. My Python and AI evidence is [a separate completed service or experiment, if available]. I would be explicit about what I have shipped, what I evaluated locally and what remains planned.”

Replace bracketed parts with your own evidence. If you have not yet built Python/AI functionality, say that plainly and use the implementation plan as a learning discussion.

## 12. Readiness check before sending an application

For each highlighted skill, mark **Explain**, **Demonstrate** or **Measured**. Explain means you can describe the concept and tradeoffs; Demonstrate means you have runnable work; Measured means you also have a reproducible evaluation. These are preparation labels, not an employer scoring system.

| Skill | Your current level | Evidence to attach or rehearse |
|---|---|---|
| Python and FastAPI | [Fill] | Runnable endpoint and a real failure case |
| Document extraction | [Fill] | Parser path, example input/output and errors |
| SQL/data modeling | [Fill] | Query, constraints and query-plan discussion |
| Embeddings/retrieval | [Fill] | Labeled queries, baseline and retrieval output |
| RAG/structured generation | [Fill] | Source trace, valid citation and abstention case |
| Evaluation/statistics | [Fill] | Split rules, raw results and metric calculation |
| Idempotency/reliability | [Fill] | Retry timeline and worker-crash explanation |
| Access control/privacy | [Fill] | Ownership checks and derived-data handling |
| Observability/cost | [Fill] | Trace, latency distribution and cost accounting |
| Supervised training, for ML roles | [Fill] | Training code, leakage controls and test report |

Before submitting, replace personal placeholders, choose one role, remove unused template text, confirm your contribution and dates, and trace each numeric bullet to its evidence. Put demonstrated skills first. Keep planned technologies in your learning roadmap until you can show them in code or another completed project.
