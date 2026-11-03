# Material import API

The Node Express API implements authenticated module import, extracted-text preview, personal labels, and review approval. Existing `GET /health` and `GET /api/profile` are unchanged. The module review flow is connected in code; its new controls still need physical Android verification.

## Hosting target: Render

Render Web Service is selected for the Express backend, initially using Free for demos/testing. Deployment has not been performed or verified. Supabase continues to provide Auth, database, and private files. See [Render setup](installation.md#render-backend-hosting-selected-deployment-pending) for the root directory, commands, environment variables, and health checks.

Runtime extraction now uses a Node child process and the installed PDF.js/Mammoth libraries, with no PowerShell dependency. Migration `0010_material_import_recovery.sql` stores pending cleanup in Supabase. Linux and Render resource measurements, restart checks, and cold starts remain unverified. Render's local filesystem is used only for temporary source files. [Render filesystem and Free limitations](https://render.com/docs/free).

## GET /api/materials

Requires a Bearer token. Lists only the authenticated user's modules through their Supabase client and an explicit owner filter. Optional `offset` defaults to `0`; it must be an integer from 0 to 2,147,483,627. Invalid offsets return 400. The endpoint returns at most 20 summaries in descending `created_at`, then descending `id` order:

```json
{ "materials": [{ "id": "uuid", "title": "Loops", "original_filename": "loops.pdf", "status": "ready", "created_at": "timestamp" }], "nextOffset": null }
```

`nextOffset` is the next numeric offset when more rows exist, otherwise null. The query reads one extra row to determine whether another page exists. All four import statuses can appear. Source text, object paths, and extraction warnings are omitted; open the owner-only preview endpoint for details. Database failures use the existing safe 503 error response. An empty library returns `{ "materials": [], "nextOffset": null }`.

The Dashboard refreshes on focus and pull-to-refresh. Load more appends summaries and removes duplicate IDs; a full refresh replaces the loaded pages. Returning from upload or approval reloads the list. Requests finishing after blur are ignored. The list uses React Native FlatList and the planned `material-card.jsx`; no database migration is required.

## POST /api/materials

Send one file as the raw request body, not JSON, Base64, or multipart FormData.

```http
Authorization: Bearer USER_ACCESS_TOKEN
Content-Type: application/pdf
X-Filename: module.pdf
```

For DOCX use `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Percent-encode the filename header with `encodeURIComponent` when needed. Filenames must match the MIME type, contain no path separators/control characters, and fit 255 characters. The title is derived from the filename, capped at 200 characters. File size is 1–5,242,880 bytes. Compressed HTTP request bodies are rejected; a DOCX's internal ZIP remains supported.

Authentication runs before file parsing. The route admits one import per server process, with a 15-second idle upload timeout. Extraction allows 5 MiB input, 100 PDF pages, 200,000 text characters, 20 MiB expanded DOCX content, and 2,048 ZIP entries. An independent parent deadline terminates the child after 30 seconds, including worker startup; V8 old space is limited to 192 MiB. Linux polls child RSS every 25 ms against 384 MiB, and successful workers also report peak RSS. Polling can overshoot; V8 old space is not total process memory. Windows development has no live RSS monitor, so only the heap/deadline and final peak check apply. Host/container memory and total API memory still need Render measurement. No OCR is performed. Successful imports stop at `needs_review`; all saved sections remain ineligible for generation. Subject/topic selection and text approval are separate future endpoints.

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

Stop the old server before applying migration 0010: it marks existing processing/failed materials for reconciliation. Preserve any old `.material-local/` directory until database recovery has completed and its records are reconciled. Hard termination can leave OS temporary files; Render discards these on restart. Only one server instance is supported, with no overlapping deploys or concurrent recovery commands; multiple instances require shared admission and recovery leases. This API does not yet enforce campus-wide capacity, provide idempotent upload retries, or implement user-confirmed module deletion.

## Personal labels and review approval

Apply `0011_material_review.sql` after the existing migrations before using approval. All endpoints require a Bearer token. JSON bodies are limited to 512 KiB; upload limits are unchanged.

Label requests use the dedicated `labelRoutes` -> `labelController` -> `labelService` -> `labelModel` files. The label router is mounted under the existing material URL prefix before `/:id`; URLs and response shapes are unchanged. Module approval remains in the material layers. On mobile, `label-picker.jsx` renders controlled selection/creation inputs, while `MaterialReviewForm.jsx` owns loading, selected values, saving, and approval.

| Endpoint | Request | Response |
|---|---|---|
| `GET /api/materials/labels` | None | `{ subjects: [{ id, name }], topics: [{ id, subject_id, name }] }` for the caller only |
| `POST /api/materials/labels/subjects` | `{ name }` | HTTP 201, `{ label: { id, name } }` |
| `POST /api/materials/labels/topics` | `{ subjectId, name }` | HTTP 201, `{ label: { id, subject_id, name } }` |
| `POST /api/materials/:id/approve` | `{ subjectId, topicId, sectionIds: [uuid, ...] }` | `{ status: "ready" }` |

Label names are trimmed, limited to 120 characters, and cannot contain control characters. Case-insensitive duplicates return 409; choose the existing label. Topics must belong to the caller's subject. Approval accepts 1–10,000 unique section IDs and only changes a module owned by the caller. Owner IDs come from authentication, never the request body.

The service-only `approve_material` function locks the module, validates labels and selected sections, sets selected sections eligible, excludes all others, and marks the module ready in one transaction. Selection must contain at least 20 letters/digits in total and no empty or punctuation-only sections. Processing/failed imports and pending cleanup cannot be approved. Repeating the same approval succeeds; a changed selection after approval returns 409. No authenticated client can call this function directly. Extracted text and source references remain unchanged.

The mobile preview starts with no selected sections. Users choose/create labels, select usable sections, and confirm they reviewed meaning/formatting before approval. Changing sections clears confirmation. Saved modules display their labels and included/excluded sections when reopened. Approval does not generate a quiz; AI generation remains planned.

## Verification

Previous verification appears in [validation.md](validation.md). The test harness and commands have been removed. Manual API checks require the migrations listed above and two disposable accounts. Never put privileged keys in the mobile app.
