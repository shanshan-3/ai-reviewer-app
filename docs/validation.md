# Phase 1: PDF/DOCX extraction validation

Earlier sections record automated checks run before the maintainer requested removal of mobile and server test files. Those tests and npm commands are no longer present. The results remain as historical evidence.

## Confirmed module deletion - 2026-11-03

Implemented the planned `materialDeletion.js` service and `0009_material_deletion.sql` migration, owner-scoped DELETE endpoint, recovery before startup/import, native named confirmation, separate card Delete action with press feedback, duplicate-tap/navigation protection, pending-delete retry, and Dashboard refresh after confirmed success. Sections cascade from the module; personal subject/topic labels remain. Approval is blocked by the new deleting status without editing migration 0011. Capacity handling and future derived-study-content cleanup remain separate work.

Mobile lint, the JavaScript project check, server syntax checks and diff checks passed. Temporary checks covered deletion-service ordering (file before record), caller identity, Storage/database failure retention, recovery retry, missing/foreign IDs, processing conflicts, invalid IDs and unsafe path rejection. Mocked native checks covered confirmation/cancel, duplicate taps, saving/navigation state, failed deletion retaining the card, successful retry/refresh, stale confirmation and processing/deleting actions. Local HTTP checks exercised the real deletion layers with mocked auth/Supabase: 401/400, owner propagation, foreign-row protection, processing 409, safe cleanup 503, success/retry and idempotency. Temporary checks were removed; no test dependency or command was added.

Migration 0009 is not applied or executed against PostgreSQL by the agent. SQL locking, grants, section cascades, real two-account isolation, deleting an already removed Storage object, crash recovery, native confirmation/press feedback and deployed behavior require live checks. Stop old instances, apply the migration once, deploy one updated backend, then reload the mobile app. Existing 0010/0011 migrations do not need rerunning.

## Dashboard saved modules - 2026-11-03

Implemented owner-scoped paginated module summaries in the existing material route/controller/service/model layers, the mobile list helper, planned `material-card.jsx`, and a FlatList Dashboard. The screen reloads on focus and pull refresh, opens the existing module preview, supports loading more, preserves loaded rows after page errors, and ignores responses after blur. Existing upload, review, label, and approval endpoints are unchanged. No dependencies or migrations were added.

Mobile lint, the JavaScript project check, server syntax checks, and diff checks passed. Temporary local HTTP checks used actual route/controller/service/model code with mocked auth/database boundaries: auth rejection, explicit owner filtering, summary field selection, newest-first query ordering, pagination, invalid offsets, empty responses, and safe database errors. Mocked Dashboard checks covered loading/empty/error/retry, page failure/retry, duplicate requests/rows, preview navigation, refocus after approval, pull refresh, and stale-response rejection. Helper checks covered authenticated/encoded requests and malformed response rejection. Temporary checks were removed; no permanent test harness was restored.

These checks do not prove hosted database RLS, real API ownership isolation, native rendering/scrolling, physical Android navigation, or deployed upload/approval-to-Dashboard refresh. Those remain manual verification steps after deployment.

## Module review flow - 2026-11-03

Added personal subject/topic list/create endpoints, mobile label selection and creation, explicit section selection and review confirmation, and approval through the service-only `approve_material` function in migration 0011. Approval preserves extracted text/references, excludes unselected sections, and saves labels/eligibility/ready status in one database transaction. Repeating the same approval is supported after a lost response; changed reviews of ready material are rejected.

Mobile lint, the JavaScript project check (`tsc --noEmit -p jsconfig.json`), server syntax checks, and `git diff --check` passed. Temporary assertion checks passed against actual validation/service/controller/route code with mocked database/auth boundaries, and the Babel-transformed review component with mocked React Native/hooks and request helpers. Covered invalid IDs/selection/labels, caller identity propagation, duplicate/ownership error handling, label load retry/reuse/create, subject-change topic reset, explicit section/confirmation gating, empty-section exclusion, failed save/retry, duplicate-tap prevention, ready display, and unmount cleanup. Local HTTP checks covered route ordering, auth rejection, malformed/oversized JSON, create/approve payloads, and the existing preview route. The temporary harness was removed; no test scripts or dependencies were added.

The maintainer subsequently reported applying migration 0011; the agent has not independently verified its hosted execution. Transaction rollback, locking/concurrency, repeated approval, function grants, two-account label/section ownership and RLS, and persisted ready-state retrieval still need live checks. Physical Android rendering, keyboard behavior, accessibility, and the full deployed review flow remain unverified. No AI generation, dashboard module listing, or module deletion was added.

### Planned folder structure correction

Moved labels into the planned server route/controller/service/model files and extracted the controlled mobile `label-picker.jsx`. Material approval remains in the material files, and migration 0011 is unchanged. Mobile lint, the JavaScript project check, server syntax checks, and diff checks passed. Temporary comparisons of the previous and refactored code passed with identical HTTP responses/database arguments for label list/create, input errors, caller ownership propagation, route ordering, approval, and preview. Mocked mobile output matched through loading/retry, creation/reuse, subject/topic reset, section selection/confirmation, save failure/retry, and ready state. These checks used mocked authentication/database/native boundaries and do not verify real RLS, the SQL transaction, or Android. Temporary baseline/check files were removed; no dependencies or test commands were added.

## Node runtime and durable recovery - 2026-11-02

Replaced deleted runtime imports with server-owned Node extraction code using installed PDF.js 6.4.299 and Mammoth 1.13.0. No dependencies were added. The maintainer reported migration `0010_material_import_recovery.sql` applied; the live check confirmed `cleanup_pending` exists and is writable only through privileged material operations. Successful imports clear it with the final preview commit; failed cleanup leaves it for startup/next-upload recovery. Local journals are no longer required.

`npm.cmd test` passed 19 tests on Windows: real PDF/DOCX workers, page/paragraph references, code symbols, review warnings/generation gate, password/corrupt/scanned files, file/page/text/archive/expanded-byte limits (including falsified ZIP sizes), parent timeout, reported peak memory, validation, ambiguous metadata creation, partial failure cleanup, lost final acknowledgement, persistent cleanup retry, and database-only recovery. Service failure tests use mocks, not real outages. The new tests replace the deleted harness commands; older results below are historical.

`npm.cmd run check:materials` passed 6 live groups against the configured Supabase project: health/auth and both API identities; PDF and DOCX persisted previews with two-account database/Storage isolation and denied client marker updates; corrupt/scanned PDF rejection and cleanup; HTTP size/MIME limits; and interrupted import cleanup during real server startup in a fresh Node process, before `/health` responds. Both disposable users and their private objects were removed; exit code 0. This seeds interrupted state rather than killing an active server or causing a real network outage.

Linux and Render were not available locally. Linux RSS polling, host/container memory, full API memory use, cold starts, actual crash/redeploy recovery, overlapping deployments, and physical Android remain unverified. Windows workers run with a V8 heap limit; tests verify the deadline and final reported peak RSS, not heap exhaustion or live RSS enforcement. One server instance with no overlapping deployments is the current boundary. Render deployment remains pending.

## Mobile material import — 2026-11-02

The dashboard upload button now opens the protected `materials/import` screen; successful uploads replace it with `materials/[materialId]`. The existing dashboard styling and Quick Review shortcuts remain. The helper sends the cached File as the raw body using a current session token. It does not send privileged keys or retry uploads automatically.

`npm.cmd run check:materials` from `mobile/` passed 7 isolated helper tests: actual cached-file size and boundaries, PDF/DOCX File bodies and encoded names, fresh session tokens, absent session/configuration, safe server/network/timeout handling without retries, malformed responses, and encoded preview IDs. The tests execute the Babel-transformed helper with mocked Expo File/fetch/session boundaries; they do not exercise native file picking, Back handling, rendering, or a live mobile upload. Mobile lint and JavaScript/JSX validation passed.

The deleted extractor imports previously blocked fresh startup. The Node runtime replacement above resolves that import blocker while preserving those deletions. Physical Android and native-module availability remain unverified.

Android bundle export passed with `npx.cmd expo export --platform android --output-dir .expo/material-import-check --max-workers 2` (1,825 modules). This verifies bundling of the new routes and installed Expo imports; it does not verify file picking, native navigation, or device-to-server connectivity.

## Material upload API verification — 2026-11-02

`npm.cmd run check:materials:unit` passed 9 isolated tests using mocked filesystem/service boundaries: unsafe header and byte validation, successful `needs_review`, ambiguous database creation and Storage upload, partial section-save failure, final status failure, extraction-monitor failure, lost final acknowledgement, and failed cleanup retried by the next import. These mocks do not establish live outage or restart behavior.

`npm.cmd run check:materials` passed all 9 live groups against the configured Supabase project on Windows. The real Express app ran on an ephemeral local port and the real bounded extractor processed generated PDF/DOCX fixtures. Checks covered missing/invalid tokens, owner-only persisted previews, source references with generation disabled, format/size/name/signature/compression rejection, corrupt/scanned PDF failure records with file/section cleanup, and 429 admission while another import was running. Successful and failed imports left no temporary directories or recovery journals for their records. Both disposable accounts and their Storage objects were removed.

Report: `server/.ownership-local/materials-467277ef-2f76-4742-8b74-f737f9117358.json`, exit code 0, no remaining test account IDs. JavaScript syntax checks passed. These are synthetic document tests, not real-module quality validation. See [API contract](api.md).

Still unverified: Android uploads, physical-device previews, real DOCX modules, actual process/network outage recovery, multiple-server admission, campus capacity, and Linux deployment. The current endpoint does not approve text, assign labels, mark material ready, or implement confirmed user deletion. It does not establish the full Phase 2 upload acceptance criteria.

## Ownership verification — 2026-11-02

The maintainer applied `0002_materials_and_sections.sql` in Supabase SQL Editor. The expanded `check:ownership` command then passed all 15 groups, including the new material assertions, against the configured project. JavaScript syntax validation also passed. Only disposable test accounts and their records/files were used.

Ran `npm.cmd run check:ownership` against the project configured in `server/.env`, using two newly created, unrelated disposable accounts. Requests exercised the real Express app on an ephemeral local port and the live Supabase database. Test assertions used the publishable key and user tokens; privileged access was confined to setup, bucket inspection, and cleanup.

| Check | Result |
|---|---|
| API missing/invalid Bearer token | PASS: 401 |
| API own-profile identity, including another user's ID in query parameters | PASS for both accounts |
| Profiles: own read/update, hidden cross-account read/update, forbidden deletion/ID changes, original row unchanged | PASS for both accounts |
| Subjects/topics: own create/read/rename/delete | PASS for both accounts |
| Subjects/topics: cross-account read/update/delete, spoofed owner, topic linked to another owner's subject | PASS: hidden or rejected in both directions, original names preserved |
| Anonymous database reads | PASS: hidden or permission denied |
| Materials/sections: own reads, hidden cross-account reads, anonymous denial, server-only writes | PASS for both accounts; clients could not forge readiness or section approval |
| Material metadata, matching label ownership, section ownership/order and source-reference constraints | PASS: invalid fixtures rejected; valid PDF/DOCX metadata accepted, including the 5 MiB boundary |
| Material states, referenced-label deletion, section cascade | PASS: defaults and valid status writes accepted; unlabelled readiness blocked; referenced labels protected; sections removed with their material |
| Private bucket configuration | PASS: private `modules` bucket, 5 MiB limit, PDF/DOCX MIME types |
| Storage owner upload/list/download/update/move/delete | PASS for both accounts; updated file contents verified with fresh download nonces |
| Cross-account Storage listing/download/signed URL/upload/overwrite/delete/move | PASS: hidden or rejected in both directions; original bytes preserved |
| Anonymous Storage listing/download/upload/overwrite/delete and public file URL | PASS: hidden or rejected |
| Move into another owner's folder | PASS: rejected in both directions |
| PDF/DOCX uploads and unsupported/oversized files | PASS: supported fixtures accepted; text/plain and 5 MiB + 1 byte rejected |
| Temporary file and account cleanup | PASS: test folders empty, both accounts deleted; no outstanding account IDs or file paths |

Final expanded local report: `server/.ownership-local/806993dd-2386-4b41-972a-536f9f3e498c.json`. The command returned exit code 0, with no outstanding account IDs or file paths after cleanup. This run includes material tables and repeats the existing API/database/Storage checks. The earlier Storage-only passing report remains at `server/.ownership-local/8f54e54c-60db-4eda-a3f5-ddbb08e3ed8f.json`. The maintainer applied both migrations through Supabase SQL Editor; no correction to the existing database ownership policies was needed.

The first run was blocked by the absent bucket. Two subsequent runs failed immediate read-after-update content assertions; all their test data was cleaned up. Verification downloads now use the installed Storage client's `cacheNonce` option to avoid cached bytes; both final Storage groups passed. Reports for these attempts remain in the Git-ignored local report directory.

This establishes the tested API/database/Storage boundaries on the configured project. It does not establish Android upload behavior, document-content validation, extraction integration, capacity accounting, or module dependency deletion. See [setup and cleanup instructions](installation.md#apply-private-module-storage-policies).

---

## Status and reproduction

Measured locally on 2026-10-23. This is a standalone Windows benchmark, not an upload API or an Android import implementation. No source file is uploaded, sent to an AI provider, or added to Git. The existing Express health endpoint is unchanged.

From `server/` in PowerShell:

```powershell
npm.cmd run check:extraction
npm.cmd run benchmark:extraction -- "C:\Users\Administrator\Documents\CC106_Study Guide_5.pdf"
```

Pass additional authorized PDF/DOCX paths as separate arguments. The benchmark requires at least one real sample and fails if an expected fixture outcome is wrong. It runs sequentially: five fresh extraction processes per usable sample, one per rejected fixture. Repeated extracted text and references must match exactly.

Inputs stay at their original paths. Synthetic fixtures, extracted text, full JSON results, hashes, and rendered real-PDF previews are written under the Git-ignored `server/.extraction-local/`. These files remain on this computer after benchmarking; delete that directory when the local evidence is no longer needed. The check command removes only its own temporary `check/` subdirectory, including after a failed assertion.

The independent PowerShell memory monitor uses a process-scoped execution-policy bypass to run the repository's monitor script. It does not change the machine's execution policy. Do not use this command to process unknown files in production.

## Measured corpus and quality

The real sample is `CC106_Study Guide_5.pdf`: CC106, Application Development and Emerging Technologies, Module 5, User Interface Prototyping. It is 536,468 bytes with six pages. The user supplied its local path for this task; processing was local only. Redistribution and external-provider processing rights have not been established, so the module and extracted text remain ignored.

All six rendered pages were visually compared with extracted text. This is a qualitative review, not a measured word-accuracy percentage or instructor evaluation.

| Content | Observed result | Support decision |
|---|---|---|
| Real PDF pages 1–6 | All six page references present; prose, headings, lists, and reference text readable; no duplicated or missing whole pages observed | Text preview supported, with review |
| Real PDF headers and footers | Footer/author text appears before body text; a superscript edition marker splits across lines; bullet glyphs remain private-use characters | Reading order and typography are imperfect; do not infer layout from text order |
| Real PDF page 2, Figure 5.1; page 3, Figure 5.3 | Text-based table cells present, but columns and row relationships flatten into text | Exclude table-dependent questions unless relationships are verified |
| Real PDF page 2, Figure 5.2 | Prototype-development diagram absent from extracted text; image flag present | Exclude diagram-dependent content; no OCR |
| Real PDF page 4, Figure 5.4 | Phone mockup images absent; image flag present | Exclude image-dependent content |
| Real PDF page 5, Figure 5.5 | Entire image-based comparison table absent; caption remains; image flag present | The caption cannot stand in for the missing table |
| Synthetic ordinary PDF/DOCX | Expected text matches exactly; PDF page and DOCX extracted-paragraph references verified | Controlled prose extraction passes |
| Synthetic mixed PDF | Text retained, both image pages warned; entirely image-only PDF rejected | Partial text is reviewable; images excluded |
| Synthetic multi-column PDF | Content-stream order differs from intended visual column order | No automatic column reconstruction or approval |
| Synthetic code PDF/DOCX | Operators `>=`, `<=`, `!=`, `&&` preserved; exact indentation results recorded below | Formatting-dependent code requires verified layout |
| Synthetic tables | PDF spacing and DOCX table relationships cannot be relied upon | Warn and require verification; raw text is not a table model |

The remaining 40 samples are generated fixtures covering ordinary text, code, tables, mixed content, multiple columns, external hyperlink labels, increasing pages/text/bytes/expanded sizes, and malformed or unsupported files. DOCX coverage is **synthetic only**; no real DOCX module was supplied. Long-module coverage is synthetic. The password fixture exercises PDF.js's password-required branch with a synthetic security dictionary; it does not establish support for every encryption variant.

## Resource measurements

Environment: Node **v24.22.1**, Windows **10.0.26200 x64**, Intel Core i7-6820HQ @ 2.70 GHz, **7.83 GiB** reported physical RAM. Installed versions: PDF.js **6.4.299**, Mammoth **1.13.0**, Mammoth's JSZip **3.10.2**. These measurements are not portable performance guarantees.

The final benchmark passed **41 samples / 145 extraction runs**: 26 usable samples, each run five times, plus 15 expected rejections. “Usable” means reviewable text, not approval for generation. The following figures are the maximum of the five runs, not averages:

| Sample | Extracted characters | Extraction time | Peak child memory |
|---|---:|---:|---:|
| Real CC106 module, 6 pages | 11,219 | 1,666 ms | 146.2 MiB |
| Ordinary synthetic PDF | 103 | 676 ms | 92.7 MiB |
| Ordinary synthetic DOCX | 106 | 136 ms | 60.4 MiB |
| Synthetic 100-page PDF | 7,092 | 1,188 ms | 97.8 MiB |
| Synthetic 200,000-character PDF | 200,000 | 1,432 ms | 113.6 MiB |
| Synthetic 200,000-character DOCX | 200,000 | 197 ms | 66.5 MiB |
| Synthetic 20 MiB expanded DOCX | 61 | 267 ms | 69.6 MiB |
| Synthetic 5 MiB PDF | 62 | 665 ms | 99.0 MiB |
| Synthetic 5 MiB DOCX | 61 | 243 ms | 60.6 MiB |

Real-module full elapsed time, including monitor/worker setup and shutdown, ranged from **1,610 to 2,811 ms**; extraction-only time ranged from **1,083 to 1,666 ms**. The largest observed extraction time and memory across the final corpus were **1,666 ms / 146.2 MiB**. The chosen 10-second and 384 MiB termination budgets provide local headroom; they are not measured maximum server capacity. CPU time includes child bootstrap and multiple runtime threads, so it can exceed wall time.

The synthetic PDF code fixture preserved all four tested operators but **lost indentation** (`exactLines: false`); it fails the requirement for formatting-dependent code. The DOCX code fixture preserved the tested operators and leading spaces (`exactLines: true`), but this single case does not establish support for all Word code formatting. Both remain in review state.

Byte-boundary fixtures contain padding, and the expanded-DOCX fixture contains highly compressible placeholder media. The text-boundary fixtures repeat simple text; the 100-page fixture has short paragraphs. These isolate individual limits and do not establish performance at every combined worst case or for complex real documents. Only the real module's six-page prose/image mix was examined visually.

Real source SHA-256: `3391c580a375ec2f1652f75d0d92191e790c101a45c45901f5559a3bef2daead`. Five-run extracted-section hash: `c7e328e837c717d9a9413a52dffc7602d09a7f9d1c78d40c9cbd881d5c056ac5`. The private report records individual runs and all fixture hashes.

## Local processing limits

These were the supported ceilings for this historical benchmark corpus on the measured Windows machine, not a guarantee for arbitrary documents or a production host. The deleted harness enforced them in `server/scripts/extraction/extract.mjs`; current runtime limits live in `server/src/services/materialExtractionLimits.js`.

| Limit | Ceiling and unit | Enforcement and evidence |
|---|---|---|
| File size, either format | 5,242,880 bytes (5 MiB) | Stat check plus bounded read; exact boundary accepted for both formats, one byte over rejected |
| PDF pages | 100 | Read page count before iterating; 10/50/100 pass, 101 rejects |
| Extracted text, either format | 200,000 JavaScript string code units | PDF checked per page; DOCX after bounded extraction; 10,000/100,000/200,000 pass, 200,001 rejects |
| Expanded DOCX | 20,971,520 bytes (20 MiB), summed over all non-directory ZIP entries | Check declared sizes, then count actual streamed decompression before Mammoth; 1/10/20 MiB pass, one byte over rejects; falsified small size metadata also rejects |
| DOCX archive entries | 2,048 non-directory entries | Checked before decompression; over-limit fixture rejects |
| Extraction duration | 10 seconds after monitor readiness | Parent kills child independently of parser/event-loop progress; a reduced-budget test verifies termination |
| Extraction memory | 384 MiB process peak working set; additionally 192 MiB V8 old-space | Independent monitor reads peak working set every 25 ms and kills an over-budget child; reduced-budget test verifies termination and recovery |
| Concurrency | One extraction at a time in the benchmark CLI | No parallel benchmark calls; no production concurrency control is implemented |

PDF text count includes a normalized trailing line break per nonempty page. DOCX counts only nonempty raw-text paragraphs after splitting Mammoth's paragraph separators. These are character limits, not token budgets. DOCX has no reliable page count and is not assigned a fictional page limit.

The memory monitor detects and terminates excess allocation; it is not an OS reservation or a strict no-overshoot cap. Its 25 ms polling can overshoot, and the OS may schedule it later. Production requires host-specific containment and a rerun under that host's actual memory budget. Memory figures exclude the parent, PowerShell monitor, and optional PDF preview rendering. A file that meets byte/page limits can still be rejected for time or memory.

Elapsed extraction time begins when the monitor is ready and ends when the child exits. Full elapsed time additionally includes worker/monitor startup and monitor shutdown; both are in the private report. CPU time and child maximum RSS are also recorded. No extraction is repeated concurrently. Preview rendering happens afterward, outside these measurements, for the authorized real PDF.

## Result contract and rejection messages

The local runner returns `{ status, sections, warnings, metrics, limits }`, plus `code` and `message` for rejection. It creates no public route, database schema, or mobile interface. Rejections return no extracted sections. Missing/unreadable files use `INVALID_FILE`; parser internals and filesystem paths are not included in user-facing messages.

Usable documents return `needs_review`. Each section has `eligibleForGeneration: false`: the benchmark does not perform approval or implement a review screen. PDF references use actual page numbers. DOCX references are ordinal **extracted paragraphs**, not original Word pages or exact source-XML paragraph numbers; table cells may become paragraphs. Review is required for all content because image detection cannot establish semantic completeness and raw text cannot establish code/table fidelity. If affected content cannot be isolated safely, the material remains unapproved. Blank/image-only PDF pages are flagged; fewer than 20 letter/number characters across the entire document is rejected as no usable text. This small threshold checks text presence, not educational sufficiency.

Every usable document receives `FORMATTING_REVIEW`: “Some code or tables may have lost their layout. Affected content cannot support questions until verified.” Image flags or pages without usable text receive: “Only selectable text was extracted. Images and scanned content are excluded. Review the extracted text before continuing.” DOCX embedded media is flagged conservatively even when it may be unreferenced. Vector diagrams and page decorations may evade image detection; the general review requirement remains.

| Code | Rejection message |
|---|---|
| `UNSUPPORTED_TYPE` | Choose a selectable-text PDF or a .docx file. Other formats are not supported. |
| `INVALID_FILE` | This file could not be read as a valid PDF or DOCX. Export a new copy and try again. |
| `PASSWORD_REQUIRED` | Password-protected documents are not supported. Upload an authorized, unprotected copy. |
| `NO_USABLE_TEXT` | No usable selectable text was found. Upload a text-based PDF or DOCX; scanned images are not read. |
| `FILE_LIMIT` | The file exceeds 5242880 bytes (5 MiB). Split it into smaller documents. |
| `PAGE_LIMIT` | The PDF exceeds 100 pages. Split it into smaller documents. |
| `TEXT_LIMIT` | Extracted text exceeds 200000 characters. Split the document into smaller sections. |
| `DOCX_EXPANDED_LIMIT` | Expanded DOCX content exceeds 20971520 bytes (20 MiB). Remove large embedded content or split the document. |
| `DOCX_ENTRY_LIMIT` | The DOCX contains more than 2048 archive entries. Export a simpler copy. |
| `TIME_LIMIT` | Extraction exceeded 10 seconds. Split or simplify the document and try again. |
| `MEMORY_LIMIT` | Extraction exceeded its 384 MiB memory budget. Split or simplify the document. |
| `WORKER_FAILED` | Extraction stopped unexpectedly. Export a simpler copy and try again. |

The runner accepts only lower limit overrides for self-checks; the `limits` field records the effective values. Display messages describe the configured default ceilings above. Infrastructure failure to start or maintain the memory monitor aborts the command rather than silently running without monitoring.

## Checks and remaining gates

`npm.cmd run check:extraction` passed all 40 fixture cases, exact/over-limit boundaries, missing-file handling, lowered timeout/memory budgets, recovery after termination, and refusal of increased limits. Cleanup completed. The benchmark additionally checks five-run text/reference stability for usable samples, exact expected prose, and code-operator preservation. `node --check` passed for all four JavaScript scripts, and `git diff --check` passed. No mobile build or live-service checks were needed for this standalone change.

The extraction scripts use the existing PDF.js and Mammoth dependencies, Mammoth's installed JSZip, and PDF.js's installed canvas renderer. There are no new packages or changes to application routes. The pinned JSZip internal declared-size field is supplemented by actual streamed-byte counting; rerun these checks when dependencies change. Raw DOCX HTML is never generated or rendered, archive entries are never written to filesystem paths, and external module links are not fetched by the extraction path.

Remaining validation: real DOCX modules, broader code/table/module samples, instructor review, production memory/time/concurrency, malicious-file containment on the chosen host, upload and deletion integration, and physical Android behavior. This sample does not establish general extraction accuracy or campus capacity. Phase 2 must reuse the enforced policy in its eventual upload flow and implement review/exclusion before generation; this CLI does not itself authorize generation.
