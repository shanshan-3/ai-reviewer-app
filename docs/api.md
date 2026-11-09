# API contracts

The Node Express API implements authenticated module import, extracted-text preview, personal labels, and review approval. Existing `GET /health` and `GET /api/profile` are unchanged. The module review flow is connected in code; its new controls still need physical Android verification.

The [Phase 3 quiz contract](#phase-3-quiz-contract-planned) below includes the implemented generation/status/metadata backend and the still-planned session/answer endpoints. Source implementation does not establish deployment, applied migrations or Android verification.

## Hosting target: Render

Render Web Service is selected for the Express backend, initially using Free for demos/testing. Deployment has not been performed or verified. Supabase continues to provide Auth, database, and private files. See [Render setup](installation.md#render-backend-hosting-selected-deployment-pending) for the root directory, commands, environment variables, and health checks.

Runtime extraction now uses a Node child process and the installed PDF.js/Mammoth libraries, with no PowerShell dependency. Migration `0010_material_import_recovery.sql` stores pending cleanup in Supabase. Linux and Render resource measurements, restart checks, and cold starts remain unverified. Render's local filesystem is used only for temporary source files. [Render filesystem and Free limitations](https://render.com/docs/free).

## GET /api/materials

Requires a Bearer token. Lists only the authenticated user's modules through their Supabase client and an explicit owner filter. Optional `offset` defaults to `0`; it must be an integer from 0 to 2,147,483,627. Invalid offsets return 400. The endpoint returns at most 20 summaries in descending `created_at`, then descending `id` order:

```json
{ "materials": [{ "id": "uuid", "title": "Loops", "original_filename": "loops.pdf", "status": "ready", "created_at": "timestamp" }], "nextOffset": null }
```

`nextOffset` is the next numeric offset when more rows exist, otherwise null. The query reads one extra row to determine whether another page exists. All import statuses, including `deleting` for pending cleanup, can appear. Source text, object paths, and extraction warnings are omitted; open the owner-only preview endpoint for details. Database failures use the existing safe 503 error response. An empty library returns `{ "materials": [], "nextOffset": null }`.

The Dashboard refreshes on focus and pull-to-refresh. Load more appends summaries and removes duplicate IDs; a full refresh replaces the loaded pages. Returning from upload or approval reloads the list. Requests finishing after blur are ignored. The list uses React Native FlatList and the planned `material-card.jsx`; no database migration is required.

## POST /api/materials

Send one file as the raw request body, not JSON, Base64, or multipart FormData.

```http
Authorization: Bearer USER_ACCESS_TOKEN
Content-Type: application/pdf
X-Filename: module.pdf
```

For DOCX use `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Percent-encode the filename header with `encodeURIComponent` when needed. Filenames must match the MIME type, contain no path separators/control characters, and fit 255 characters. The title is derived from the filename, capped at 200 characters. File size is 1–5,242,880 bytes. Compressed HTTP request bodies are rejected; a DOCX's internal ZIP remains supported.

Authentication runs before file parsing. The route admits one import per server process, with a 15-second idle upload timeout. Extraction allows 5 MiB input, 100 PDF pages, 200,000 text characters, 20 MiB expanded DOCX content, and 2,048 ZIP entries. An independent parent deadline terminates the child after 30 seconds, including worker startup; V8 old space is limited to 192 MiB. Linux polls child RSS every 25 ms against 384 MiB, and successful workers also report peak RSS. Polling can overshoot; V8 old space is not total process memory. Windows development has no live RSS monitor, so only the heap/deadline and final peak check apply. Host/container memory and total API memory still need Render measurement. No OCR is performed. Successful imports stop at `needs_review`; all saved sections remain ineligible for generation. Subject selection, automatic topic setup, and text approval use the separate label and approval endpoints documented below.

Successful response: HTTP 201 with `{ "material": { ... } }`, containing persisted material metadata and extraction warnings. The server generates the ID, owner, and private Storage path; callers cannot set them. Original files use `<user-id>/<material-id>/source.pdf` or `source.docx` in the private `modules` bucket. Use the preview endpoint to obtain sections.

| Status | Meaning |
|---|---|
| 400 | Missing/unsafe/mismatched filename, empty file, or invalid preview ID |
| 401 | Missing or invalid access token |
| 413 | File exceeds 5 MiB |
| 415 | Unsupported MIME type or compressed HTTP request body |
| 422 | Invalid document, no usable text, or extractor rejection |
| 429 | Another import owns this process's admission slot; `Retry-After: 5` |
| 503 | Import, extraction infrastructure, or pending-cleanup failure |

Errors return `{ "error": "Safe explanation", "code": "ERROR_CODE" }`. Extraction rejections include `materialId` when the failed row is available. Parser internals, filesystem paths, raw source text and credentials are not logged or returned as errors. Authentication retains its existing safe 500/503 behavior for internal/service failures.

## GET /api/materials/:id

Requires the same Bearer token. Returns `{ "material": { ... }, "sections": [...] }`. Each section includes `section_order`, `text`, `reference`, and `eligible_for_generation`. PDF references name real pages; DOCX references name extracted paragraphs. Warnings require review of lost formatting or excluded images. Failed/processing materials return no preview sections. Missing and other users' IDs both return 404.

## Cleanup and recovery

Server-only credentials write the material tables; user-scoped credentials upload files. The read path uses the user's client plus explicit ID/owner filters. The initial material insert sets `cleanup_pending=true` before uploading the private object. Successful preview status and `cleanup_pending=false` commit together. Temporary source files use a generated OS temporary directory; recursive deletion checks its resolved path before removal. Source text is never written to a recovery journal.

If import fails, cleanup marks the material failed, removes partial sections and the private object, then clears the database marker. An outage leaves the marker set for retry. Startup and each admitted upload drain pending records in batches of 50. Startup refuses to listen if recovery fails. Interrupted `processing` rows become `failed` with `IMPORT_INTERRUPTED`; committed `needs_review`/`ready` data is preserved, including when the final database acknowledgement was lost.

Stop the old server before applying migration 0010: it marks existing processing/failed materials for reconciliation. Preserve any old `.material-local/` directory until database recovery has completed and its records are reconciled. Hard termination can leave OS temporary files; Render discards these on restart. Only one server instance is supported, with no overlapping deploys or concurrent recovery commands; multiple instances require shared admission and recovery leases. This API does not yet enforce campus-wide capacity or provide idempotent upload retries.

## Personal labels and review approval

Apply `0011_material_review.sql` after the existing migrations before using approval. All endpoints require a Bearer token. JSON bodies are limited to 512 KiB; upload limits are unchanged.

Label requests use the dedicated `labelRoutes` -> `labelController` -> `labelService` -> `labelModel` files. The label router is mounted under the existing material URL prefix before `/:id`; URLs and response shapes are unchanged. Module approval remains in the material layers. On mobile, `label-picker.jsx` shows the supplied 31 BSIT subjects grouped by year with search. `MaterialReviewForm.jsx` owns loading, subject selection, automatic topic setup, and approval; there is no topic picker or custom-label creation form.

Selecting a subject reuses or creates the caller's subject row, then reuses or creates a `General` topic under it through the existing label endpoints. Both selected IDs update only after setup succeeds. Supabase still uses `public.subjects`, `public.topics`, and the module's `subject_id` and `topic_id`; approval still requires a topic owned by the caller and linked to the selected subject. This UI change requires no additional migration or manual SQL, but normal API reads and writes still occur. Existing labels are not deleted, and earlier approved modules keep their saved subject/topic links.

| Endpoint | Request | Response |
|---|---|---|
| `GET /api/materials/labels` | None | `{ subjects: [{ id, name }], topics: [{ id, subject_id, name }] }` for the caller only |
| `POST /api/materials/labels/subjects` | `{ name }` | HTTP 201, `{ label: { id, name } }` |
| `POST /api/materials/labels/topics` | `{ subjectId, name }` | HTTP 201, `{ label: { id, subject_id, name } }` |
| `POST /api/materials/:id/approve` | `{ subjectId, topicId, sectionIds: [uuid, ...] }` | `{ status: "ready" }` |

Label names are trimmed, limited to 120 characters, and cannot contain control characters. New subject names must match the supplied BSIT list and are saved using its canonical spelling; this list has not been independently verified as an official curriculum. Case-insensitive duplicates return 409; choose the existing label. Topics must belong to the caller's subject. Approval accepts 1–10,000 unique section IDs and only changes a module owned by the caller. Owner IDs come from authentication, never the request body.

The service-only `approve_material` function locks the module, validates labels and selected sections, sets selected sections eligible, excludes all others, and marks the module ready in one transaction. Selection must contain at least 20 letters/digits in total and no empty or punctuation-only sections. Processing/failed imports and pending cleanup cannot be approved. Repeating the same approval succeeds; a changed selection after approval returns 409. No authenticated client can call this function directly. Extracted text and source references remain unchanged.

The mobile preview starts with no selected sections. Users choose a subject, include usable pages (or select all), and confirm they reviewed meaning/formatting before approval. Page controls select the underlying section IDs; changing the selection clears confirmation. Approved modules display their saved subject and included/excluded text when reopened, with the topic kept hidden. Approval does not generate a quiz; AI generation remains planned.

## DELETE /api/materials/:id

Apply the planned `0009_material_deletion.sql` migration once before deploying deletion. Existing installations that already applied 0010/0011 apply only 0009 now; do not rerun those migrations. DELETE requires a Bearer token and returns `{ "status": "deleted" }` after cleanup. Invalid UUIDs return 400. Missing or other users' module IDs return the same success without changing data, making retries safe without exposing ownership.

The service-role-only `begin_material_deletion` function locks the owner-scoped row, rejects processing or import-recovery work with 409, and commits `status=deleting` before external cleanup. Existing approval rejects this status. The service validates the expected owner/module source path, removes the private Storage file, then deletes the module row; existing foreign keys cascade its extracted sections. Reusable subject/topic labels remain. A module marked deleting cannot be previewed or opened from its card, but its Delete action supports retry.

Storage/database failures return a safe 503 with `DELETION_PENDING`; the deletion marker remains. Startup and the next admitted upload retry pending deletions before import recovery. Failed recovery prevents startup. This retains the existing single-instance/no-overlapping-deployments restriction. Confirmed deletion has no undo and cannot be cancelled after the request starts. The native confirmation names the module and warns about source and linked study-content loss; cancellation sends no request. Only successful server confirmation removes the card, then the Dashboard refreshes to reset pagination.

Only materials and extracted sections exist as persisted study content today. Future quizzes, flashcards, answers/results, and derived progress must extend deletion and its verification when those schemas are introduced; this implementation does not claim cleanup of unimplemented features. Upload capacity handling remains separate.

## Phase 3 quiz contract (planned)

Defined on 2026-11-07 against [Phase 3 of the roadmap](../planning/ai-powered-reviewer-roadmap.md#phase-3-generate-complete-and-score-a-quiz). This is the implementation contract for a private quiz generation and study flow. The generation/status/quiz-metadata endpoints are implemented in source; study-session/answer/result endpoints remain planned. Every endpoint requires a verified Bearer token. Ownership comes from authentication, never a client-supplied owner ID. Students and instructors use the same private flow; there is no publishing or privileged instructor answer-key endpoint.

### Quiz choices and source

| Field | Contract |
|---|---|
| `source` | Exactly `{ "kind": "module", "materialId": "uuid" }` or `{ "kind": "topic", "topicId": "uuid" }` |
| `questionType` | `conceptual` (Multiple Choice, default), `true_false`, or `coding_syntax` (code with four choices); one type per quiz |
| `questionCount` | `5`, `10`, or `20` (default `10`); requested session length, not the pool size |
| `startingDifficulty` | `easy`, `medium` (default), or `hard` |
| `requestId` | Client-generated UUID, retained across retries of the same generation request |

A module must belong to the caller, be `ready`, and have meaningful sections marked `eligible_for_generation`. Derive its subject/topic from the saved module. Supply only approved sections to Groq. A topic must belong to the caller and resolve to its owned subject; its saved name supplies the topic-only context. Reject unsupported/non-IT or insufficient context. Do not treat the account's topic labels as detected document content.

Module-based coding questions require usable code in the approved source. Missing code produces an insufficient-source outcome without switching question types. Topic-only quizzes are labeled as topic practice and carry no invented module citations. Gemini remains disabled. Current provider configuration and its evaluation boundary are described below.

### Generation backend configuration and rollout

The implementation follows `quizRoutes` -> `quizController` -> `quizService` -> `quizModel`, with context/provider work in `quizGeneration`, structured prompts in `quizPrompts`, request/output checks in `quizValidation`, and the installed Groq SDK in `config/ai.js`. No new application dependency is required.

| Setting | Implemented value |
|---|---|
| Provider/model | Groq `openai/gpt-oss-120b`, matching the existing server configuration; other model IDs are rejected until evaluated |
| Output | Strict JSON Schema requiring code objects in coding mode and null in Multiple Choice/True or False; non-streaming, low reasoning effort |
| Input bound | 3,072 UTF-8 bytes for serialized messages plus output schema; context is truncated to this bound without splitting Unicode characters |
| Completion bound | 8,192 tokens, including reasoning; incomplete/truncated output fails validation |
| Provider timeout/retries | 60 seconds; SDK retries disabled |
| Pool | At most the requested 5, 10, or 20 distinct questions; full pools must cover easy/medium/hard; fewer are accepted with explicit actual count |
| Admission | One active generation per API process; dynamic cooldown (10s for 5, 15s for 10, 30s for 20 questions) to protect Groq TPM limits; duplicates of an existing request bypass admission and return saved status |
| Source selection | First 200 approved sections in source order, filled into the bounded context; coding mode considers sections containing common code markers |

These are conservative development bounds, not measured campus capacity or a guarantee that any account's remaining quota is sufficient. Groq organization quotas may be shared with other applications. Published model/structured-output/rate-limit references: [models](https://console.groq.com/docs/models), [strict outputs](https://console.groq.com/docs/structured-outputs), [rate limits](https://console.groq.com/docs/rate-limits). The lexical coding filter is not a parser for every programming language. A code sample beyond the first 200 sections, or insufficient supported text within the byte budget, can yield insufficient source; retrieval ranking remains future evaluation work. Source checks verify exact excerpts/owned references, not semantic truth of every AI-authored explanation. Instructor/content-quality and broader module evaluation remain required.

The maintainer reports [`0008_atomic_study_operations.sql`](../supabase/migrations/0008_atomic_study_operations.sql) is applied after 0003–0005. Do not rerun applied files. Its service-only `publish_quiz` RPC saves quiz/questions/citations and the ready status in one transaction, rechecks source readiness and returns an already committed quiz on retry. `recover_quiz_generations` fails interrupted processing records at startup without changing ready records. Startup recovery requires this migration; the server will refuse to listen if it is missing or recovery fails. This file implements generation publication/recovery only, not answering/scoring RPCs. Three-modality support additionally requires 0012 as described below.

Use `GROQ_API_KEY` and `GROQ_MODEL=openai/gpt-oss-120b` on the server only. Generation remains unavailable without the key or with a different model setting; unrelated existing routes do not require a Groq call. `POST /api/quizzes/generations` authenticates before parsing an uncompressed JSON body capped at 8 KiB, saves a processing record and starts bounded background work before responding. Poll its saved status; do not automatically create another request ID after a timeout. Database errors and provider failures return/store safe messages without logging document content or credentials. The accepted single-active-API-process/no-overlapping-deployment restriction remains mandatory: startup recovery must not run beside another active generation worker.

### Stored records and privacy

These records are represented by the prepared schema files. The maintainer reported the seven table/RLS/read-privilege checks passed after applying 0003–0005; that is user-reported schema/access evidence, not independent hosted behavior verification. IDs are server-generated UUIDs except the client generation `requestId`; timestamps use server time.

The schema files are prepared locally under the planned names:

- [`0003_generations_and_usage.sql`](../supabase/migrations/0003_generations_and_usage.sql): generation identity, choices, lifecycle and source ownership; campus usage accounting remains deferred.
- [`0004_quizzes_and_questions.sql`](../supabase/migrations/0004_quizzes_and_questions.sql): quizzes, private questions/keys, validated source references and transactional readiness checks.
- [`0005_study_sessions_and_answers.sql`](../supabase/migrations/0005_study_sessions_and_answers.sql): sessions, saved candidate/option order, answer uniqueness and correctness derived from the matching stored key.

These files passed [92 isolated PostgreSQL checks](validation.md#phase-3-quiz-schema-isolated-postgresql-checks---2026-11-07), covering fresh installation and an existing-schema upgrade. The maintainer subsequently reported successful hosted table/RLS/read-privilege checks; hosted constraints and concurrent behavior were not independently verified. Existing installations apply only missing files, not previously applied migrations. A fresh installation runs all existing migration files in filename order through 0012 before enabling three-modality generation (the generation guard also checks the import-recovery field introduced in 0010). Generation `quizId` and quiz source/settings are projected through the generation-to-quiz relationship, rather than duplicated in a circular foreign key. Option columns map to the public two- or four-option array, omitting null columns; citations and session candidate order use child tables. All seven tables enable RLS and deny direct anonymous/authenticated access; Express enforces ownership and returns safe projections through its server-only client. The implemented generation pipeline uses 0008 for atomic publication. Atomic answer submission, session advancement and idempotent answer responses still require later functions/services; table constraints alone do not implement those operations.

| Record | Required stored information |
|---|---|
| Generation | `id`, `owner_id`, `request_id`, normalized source and quiz choices, `status`, nullable `quiz_id`, nullable safe `error_code`, `created_at`, `updated_at` |
| Quiz | `id`, `owner_id`, unique `generation_id`, source module/topic and subject links, question type, requested count, achievable session count, starting difficulty, provider/model identity, `created_at` |
| Question | `id`, `quiz_id`, stable pool position, prompt, optional code/language, options, difficulty, private correct option ID, private explanation and supporting sources |
| Study session | `id`, `owner_id`, unique `quiz_id`, `status`, saved candidate question order and option orders, current question ID, starting/current difficulty, correct/incorrect streak counters, start/completion timestamps and final totals |
| Submitted answer | `session_id`, `question_id`, selected option ID, difficulty actually used, correctness, answered sequence position and first-submission timestamp |

Use owner-consistent foreign keys for module/topic, quiz and session relationships. There is at most one generation per `(owner_id, request_id)`, one session per quiz, and one answer per `(session_id, question_id)`. A new study attempt requires a new generation and quiz; it cannot create another session over a saved quiz.

Private question rows include answer keys and must not be directly readable through anonymous/authenticated Supabase clients, even by the owner. Ownership RLS alone would expose those keys to the learner. Keep question/key writes, grading and session mutations server-only, with explicit owner-scoped safe projections through Express. Other records must also enforce ownership. Do not return full question rows, provider output or unused pool questions from public endpoints.

### Provider question and public question

Validate provider output before saving a complete quiz. Multiple Choice and Coding Syntax use four nonempty, distinct options with stable IDs `a`, `b`, `c`, `d`. True or False uses exactly `a = True`, `b = False`, with a factual statement as the prompt and `code: null`; persisted `option_c` and `option_d` are null. Every mode has exactly one matching correct option ID, one difficulty, a nonempty prompt and an explanation. Provider-local question identifiers are not database IDs. The server assigns question UUIDs after validation. Duplicate questions and invalid option mappings fail validation; structural checks cannot establish semantic correctness. Treat source documents as untrusted data, not instructions.

### Three-modality migration and compatibility

The maintainer reports 0008 is applied. Apply only the missing `0012_question_modalities.sql` before deploying three-modality support; do not rerun applied migrations. Fresh installations apply every migration in filename order through 0012. The new migration preserves existing rows and extends generation types, question option shapes, session option permutations and submitted-answer membership checks. It adds no answering endpoints. Existing `conceptual` and `coding_syntax` API values and the default remain unchanged; True or False adds `true_false` to generation requests and quiz metadata. Do not rename stored `conceptual` values to a new MC identifier.

The existing publication RPC already supports null option columns and needs no replacement. New question triggers enforce modality-specific code and option shapes on inserts/updates. Saved session orders must contain precisely the question's two or four option IDs; future session creation must explicitly supply `['a', 'b']` (or its saved permutation) for True or False instead of using the four-option database default. Submitted answers outside that saved order are rejected. A new modality on an existing request ID remains a conflicting retry. Ownership, source evidence, atomic publication and private answer-key rules apply to all three modes.

Persist each module question's supporting excerpt, owned `sectionId`, and the section's original reference. A PDF reference is `{ "page": 2 }`; DOCX uses `{ "kind": "extracted-paragraph", "paragraph": 7 }`. Validate section ownership/eligibility, reference equality and excerpt presence in the approved text. Multiple exact excerpts from one section merge into one contiguous original-text span, capped at 1,500 characters; invented excerpts or oversized spans fail validation. Question identity includes the code snippet so different snippets can share a prompt. These structural checks do not by themselves establish factual correctness; the accepted correct answer and explanation must also be supported by the source. Topic-only questions use an empty source list.

An unanswered question sent to the app has this shape; content here is illustrative:

```json
{
  "id": "question-uuid",
  "questionType": "conceptual",
  "difficulty": "medium",
  "prompt": "Which loop checks its condition after running the body?",
  "code": null,
  "options": [
    { "id": "a", "text": "for" },
    { "id": "b", "text": "while" },
    { "id": "c", "text": "do...while" },
    { "id": "d", "text": "for...of" }
  ]
}
```

For coding-syntax questions, `code` is `{ "language": "javascript", "text": "..." }`; render it as inert text, never execute it. Correct option IDs, correctness, explanations and supporting excerpts stay private until the entire quiz is completed. Option shuffling changes presentation order only; grade against the saved option ID and preserve option order across resume.

### Generation endpoints and lifecycle

`POST /api/quizzes/generations` accepts the source and choices above:

```json
{
  "requestId": "client-request-uuid",
  "source": { "kind": "module", "materialId": "material-uuid" },
  "questionType": "conceptual",
  "questionCount": 10,
  "startingDifficulty": "medium"
}
```

Persist a `processing` record before starting provider work. Return HTTP 202 with `{ "generation": { "id": "generation-uuid", "status": "processing", "quizId": null, "errorCode": null } }`. `GET /api/quizzes/generations/:id` returns the same safe status shape with HTTP 200 for an owned record, including terminal outcomes.

Transitions are `processing -> ready | insufficient_source | failed`; terminal records do not restart. `ready` requires a fully validated quiz and a non-null `quizId`, saved atomically with the status change. Other terminal outcomes have no quiz. If the source supports fewer usable questions than requested, save a ready quiz with the achievable count and explicitly report requested versus available counts in quiz metadata. Zero usable questions yields `insufficient_source`, not an empty quiz.

Repeating an owner's `requestId` with identical normalized input returns the existing record without another provider call: HTTP 202 while processing, otherwise HTTP 200. Different input with that ID returns HTTP 409 `REQUEST_CONFLICT`. Enforce uniqueness in the database so concurrent requests cannot start duplicate work. Provider execution itself is not guaranteed exactly once.

Reconcile interrupted processing records under the accepted single-active-API-process restriction: preserve an atomically committed ready quiz; otherwise mark the interrupted generation failed with `GENERATION_INTERRUPTED`. Retrying a failed/insufficient request requires a deliberate user action and a new `requestId`. A lost network response is retried with the existing ID first. Do not silently regenerate after an API restart or provider timeout.

### Study endpoints and answer submission

| Endpoint (metadata implemented; study endpoints planned) | Input | Safe response |
|---|---|---|
| `GET /api/quizzes/:id` | Owned quiz ID | `{ quiz: { id, source, subjectId, topicId, questionType, requestedQuestionCount, questionCount, startingDifficulty } }`; no question bank or keys |
| `POST /api/quizzes/:id/sessions` | No body | HTTP 201, `{ session, currentQuestion, answers: [] }` for a newly started session; HTTP 200 with current saved state on retry |
| `GET /api/study-sessions/:id` | Owned session ID | `{ session, currentQuestion, answers }`; answers contain only `{ questionId, selectedOptionId }` acknowledgements; no correctness or feedback |
| `POST /api/study-sessions/:id/answers` | `{ questionId, optionId }` | `{ submission: { questionId, selectedOptionId }, session, currentQuestion }`, HTTP 200; null current question on completion; no correctness or feedback |
| `GET /api/study-sessions/:id/results` | Owned completed session ID | `{ sessionId, correctCount, answeredCount, questionCount, answers }`; HTTP 409 `SESSION_INCOMPLETE` while active |

Public `session` includes `id`, `quizId`, `status`, `questionCount`, `answeredCount`, starting/current difficulty, and start/completion timestamps. Keep unused candidate IDs and adaptive counters server-side. Session states are `active -> completed`; there is no public reopen/reset operation. Save a candidate pool order and each question's option order when the session starts, and persist the current question before exposing it. Repeated start/resume requests return that same session and current question.

Phase 3 initializes the selected starting difficulty and the durable current-difficulty/streak fields. The two-consecutive-answer adaptation algorithm belongs to Phase 4; defining its storage here does not implement it early. The saved candidate order provides deterministic selection and resume without another AI call. Difficulty selection uses an unused question at the current level, then the nearest available level; ties prefer the easier level. Preserve the actual question difficulty on its submitted answer. Phase 4 must reuse these records rather than regenerate a pool after each answer.

Feedback timing was changed by the user on 2026-11-08: show results only after completing the entire quiz. Active-session reads, answer submissions and retries must omit correctness, correct-option IDs, explanations, source excerpts and running correct-count/accuracy. Grade privately on the server. The completed results endpoint is the only public source of feedback and returns HTTP 409 `SESSION_INCOMPLETE` before completion. The final answer response signals completion through session status; the client then requests results.

Example answer review, returned inside the completed results response only:

```json
{
  "questionId": "question-uuid",
  "selectedOptionId": "b",
  "correct": false,
  "correctOptionId": "c",
  "explanation": "A do...while loop evaluates its condition after executing the body.",
  "sources": [
    { "sectionId": "section-uuid", "reference": { "page": 2 }, "excerpt": "Supporting text from the approved section." }
  ]
}
```

Accept a new answer only for the session's current question and an option actually attached to it. One owner-scoped database transaction must lock the session, insert the answer, calculate correctness from the stored key, advance the current question and finalize totals/completion exactly once when the achievable count is reached. Client-supplied correctness, scores, keys and completion timestamps are rejected. No AI call is used for scoring.

An identical retry of an answered `(sessionId, questionId, optionId)` returns the stored submission acknowledgement plus the latest authoritative safe session/current question, without changing totals, timestamps or difficulty counters. This response omits grading fields even after completion; use the results endpoint for review. A different option for an answered question returns HTTP 409 `ANSWER_CONFLICT`. An unserved/out-of-order question returns HTTP 409 `QUESTION_NOT_CURRENT`; an invalid option returns HTTP 400. Identical answer retries remain valid after completion. A lost answer response must be resolved by retrying that answer or reading the session before proceeding. Reopening the app resumes the saved session; it never creates a fresh quiz automatically. Answering requires connectivity.

### Failures, deletion and acceptance checks

- Missing/invalid/expired identity returns HTTP 401. Missing or foreign quiz, generation, session and source IDs return the same HTTP 404. Invalid source combinations, UUIDs or choices return HTTP 400; an owned module not ready for generation returns HTTP 409 `MODULE_NOT_READY`.
- Reject quota/admission failures before accepting work with HTTP 429 and a meaningful `Retry-After`. Failures discovered after accepting a generation remain visible through its saved status: use safe codes such as `QUOTA_EXCEEDED`, `PROVIDER_TIMEOUT`, `PROVIDER_REFUSED`, `INVALID_GENERATION` and `GENERATION_INTERRUPTED`. Return safe HTTP 503 errors for infrastructure failures. Never display tokens, keys, provider internals or source content in error messages/logs. Unsupported coding context yields `insufficient_source` with `CODE_SOURCE_REQUIRED`.
- Module deletion must remove its generations, quizzes, private questions, sessions and answers when their migrations are introduced. Prevent an in-flight generation from saving a quiz after its source enters deletion. Preserve unrelated topic-only quizzes, personal labels and other users' data. Extend deletion verification in the same implementation milestone; progress/streak recalculation follows the phases that introduce those persisted effects.
- Test both source kinds, all three modalities, the 5/10 choices and defaults; valid and invalid PDF/DOCX citations; missing code, fewer-question and empty-source outcomes; option shuffling; malformed/duplicate provider output; untrusted source instructions; and provider quota/refusal/timeout behavior.
- Test two-account isolation through API and direct database access, key omission before answering, concurrent duplicate generation/answers, conflicting retries, final-answer idempotency, interrupted generation recovery, session resume with stable option order, and module deletion during generation. These are required future checks, not results claimed by this document.

## Verification

Previous verification appears in [validation.md](validation.md). The test harness and commands have been removed. Manual API checks require the migrations listed above and two disposable accounts. Never put privileged keys in the mobile app.
