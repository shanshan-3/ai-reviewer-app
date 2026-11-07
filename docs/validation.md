# Phase 1: PDF/DOCX extraction validation

## Three question modalities - 2026-11-07

The new `0012_question_modalities.sql` and backend changes passed **40 isolated checks**, 20 in each independent PGlite 0.5.15 / PostgreSQL 18.6 database; both commands exited 0. Fresh installation applied all migrations before fixtures. Upgrade installation seeded existing Multiple Choice and Coding Syntax quizzes, sessions and submitted answers before applying only 0012; existing answer rows and quiz counts were preserved. Supabase Auth/Storage schemas and roles were local stand-ins.

The matrix covered all three modalities, module/topic sources and 5/10 requested questions using controlled provider responses through the real context selection, JSON-schema generation, output validation and `publish_quiz` SQL function. Tests rejected malformed True/False options, labels, keys, code and citations; checked defaults and conflicting retry identity; checked fewer/empty source and Unicode input bounds; exercised database modality enforcement, two/four option permutations, unavailable submitted-answer IDs, stored correctness and direct client read denial. Existing MVC routes and client SDK transport were unchanged and were not exercised by this suite. This does not repeat the earlier 74 HTTP integration checks or prove hosted Auth/PostgREST behavior.

Two separate real Groq calls on the configured model passed: synthetic JavaScript module True/False requested **5**, actual **5**, serialized input/schema **2,621 bytes**; topic-only True/False requested **10**, actual **10**, **2,602 bytes**. Calls were separated by 60 seconds and used existing timeout/output limits without retries. No hosted database or uploaded user module was touched. These checks validate provider compatibility and structural output, not semantic accuracy or instructional quality. Existing modes were regression-tested with controlled provider output; their earlier live results remain recorded below.

Temporary PGlite packages and task scripts were uninstalled/removed after verification, with no application dependency changes. The maintainer reports 0008 is applied; **0012 is prepared locally and must be applied once before deploying these changes**. No hosted migration or deployment was performed. Mobile modality selection, answering/scoring endpoints, Android behavior, broader content/injection evaluation and multi-process concurrency remain outside this milestone.

## Phase 3 generation backend - 2026-11-07

The implemented generation/status/quiz-metadata endpoints passed **74 isolated integration checks**: 37 in each of two independent PGlite 0.5.15 / PostgreSQL 18.6 databases. The fresh path applied all migrations in filename order; the upgrade path applied the existing migrations before adding only the new `0008_atomic_study_operations.sql`. Both commands exited 0. Node's experimental module mocks substituted Supabase's Auth/client boundary and Groq responses; the real Express routes, authentication middleware, controllers, services, models, validators and SQL functions ran over loopback HTTP and PostgreSQL. Supabase Auth/Storage schemas and roles used local stand-ins. This does not verify hosted PostgREST relationship resolution or actual access tokens.

Checks covered strict request/default validation, authentication before body parsing, malformed/oversized JSON, bounded Unicode context, owned ready sources, module and topic modes, safe status/metadata without keys, duplicate/conflicting and in-flight requests, admission/Retry-After, PDF and DOCX references, invalid citations/options/questions, mode-specific code schemas, full-pool difficulty coverage, fewer/empty-source outcomes, refused/truncated/malformed output, provider quota/timeout failures, atomic publication/rollback/retry, startup interruption recovery, missing-RPC startup failure, direct-client RPC denial and module deletion during generation. Citation regressions verify that exact excerpts from one section merge into an original-text span while fabricated excerpts and spans over 1,500 characters fail. Coding-question identity includes its snippet. Prompt assertions distinguish topic knowledge from module grounding; they do not prove resistance to arbitrary prompt injection.

Separate real Groq calls used synthetic JavaScript loop notes or an owned-label-shaped topic fixture, the configured `openai/gpt-oss-120b` model, strict JSON Schema, low reasoning effort and no automatic retries. No uploaded module, hosted database record or user credential was included in prompts. Successful final cases:

| Source / mode | Requested / actual | Serialized messages + schema | Prompt / completion tokens | Elapsed |
|---|---:|---:|---:|---:|
| Module / conceptual | 5 / 5 | 3,024 bytes | 834 / 1,575 | 4,128 ms |
| Module / coding-syntax | 10 / 10 | 3,072 bytes | 828 / 3,219 | 7,483 ms |
| Topic / coding-syntax | 5 / 5 | 2,481 bytes | 612 / 1,647 | 4,268 ms |
| Topic / conceptual | 10 / 10 | 2,348 bytes | 583 / 1,788 | 4,354 ms |

Earlier live responses exposed three issues corrected before these results: coding questions could omit code, valid questions could cite two excerpts from the same section, and topic-only requests incorrectly received insufficient-source responses. The final schemas require code by mode; validation merges exact same-section evidence; topic prompts explicitly permit established IT knowledge and original code examples without a supplied document. One earlier real coding response returned nine valid questions for ten requested and passed validation when replayed after citation normalization. Live calls were separated by at least 60 seconds. This small synthetic sample establishes provider compatibility within these bounds, not factual accuracy, educational quality, a quota guarantee or campus capacity.

Temporary test packages/scripts were kept outside the repository and removed after verification; no application dependencies or permanent harness were added. The maintainer reports the earlier seven-table/RLS/read-access checks passed after applying 0003–0005. **The new 0008 migration has not been applied to hosted Supabase; apply it before deploying this server.** Missing recovery functions intentionally prevent startup. No deployment or hosted migration was performed. Real two-account API/Auth/PostgREST behavior, overlapping-process concurrency, crash-point/lost-ack fault injection, broader module/injection evaluation, instructor review and Android quiz flows remain unverified. Study sessions, answering, scoring and adaptation are not implemented in this milestone. One active API process with no overlapping generation workers remains required.

## Phase 3 quiz schema: isolated PostgreSQL checks - 2026-11-07

The prepared `0003_generations_and_usage.sql`, `0004_quizzes_and_questions.sql` and `0005_study_sessions_and_answers.sql` passed **92 checks** in PGlite 0.5.15 (PostgreSQL 18.6, WebAssembly). Each of two independent in-memory databases passed 46 checks. The fresh-install case applied every existing SQL migration in filename order. The upgrade case applied the previous 0001/0002/0007/0009/0010/0011 migrations, seeded an existing module, then applied only 0003–0005. Both preserved the existing module during installation. No migration defect was found and no SQL changes were needed during these tests.

The checks exercised real PostgreSQL tables, constraints, PL/pgSQL triggers, deferred commit validation, RLS flags and grants. Local fixture schemas supplied stand-ins for Supabase's `auth.users`, `auth.uid()`, Storage tables/functions and the `anon`, `authenticated`, `service_role` roles; this is not a hosted Supabase test.

Verified in both installation paths:

- Atomic publication of conceptual/module, coding/module and topic-only quizzes, including fewer questions than requested; rejection of ready generations without a quiz, module questions without citations and coding questions without code.
- Owned module/topic/session relationships; immutable generation inputs/terminal states; duplicate generation requests, duplicate sessions and duplicate submitted answers; invalid question counts, options and answer keys.
- Citation page/excerpt validation and rejection of a section from another module; processing/deleting source rejection; saved option permutations and current-question membership; correctness computed from the matching stored key.
- Direct SELECT denied for both `anon` and `authenticated` on all seven new tables, and RLS enabled on each. These tests prove blanket access denial, not an owner-visible RLS policy; safe reads will come from future owner-scoped Express endpoints.
- Module deletion cascading through quiz questions/citations, sessions, saved candidate order and submitted answers, while preserving topic-only quizzes and an unrelated module.

The final test command exited 0 and reported `TOTAL PASSED 92`. The temporary test engine and assertion script were kept outside the repository; no application dependency or permanent test harness was added. Hosted PostgreSQL version/configuration, actual Supabase Auth/Storage behavior, multi-connection concurrency, API idempotent response semantics, atomic session advancement, provider calls and Android flows were not exercised. These remain separate checks. No hosted connection, migration or source-data change was made.

## Phase 2 remaining development checks - 2026-11-05

The maintainer requested completion of Phase 2, connected the Android phone, and explicitly moved release-APK checks to Phase 6. They do not plan to use EAS. They also explicitly accepted the development restriction: one active API process, no concurrent local API against the same live database, uploads paused during Render deployments/restarts, and resumption only after Live. Shared import/recovery coordination is required before campus release. Capacity enforcement remains deferred by the earlier decision; no capacity guard, migration or permanent test harness was restored. The checks below retain separate evidence levels for live API/database behavior, physical development-build behavior, simulated boundaries and maintainer-reported Render controls. Phase 2 development acceptance is complete within these limits; this is not campus-release approval.

### Hosted recovery after a controlled restart

Run `addfd4e9-a280-409b-9f06-78e179715f6f` used a disposable account with four administrator-seeded cleanup-only fixtures: a committed deletion with its source still present, a committed deletion whose source was already removed, a processing import with `cleanup_pending: true`, and an unrelated needs-review sentinel. Synthetic original bytes tested recovery/deletion, not extraction. Before restart, processing deletion returned HTTP 409 `MATERIAL_BUSY`; deleting previews returned HTTP 409 `DELETION_PENDING`; repeating each deletion-marker RPC returned the same row. Markers were confirmed durable at `2026-11-05T11:21:04.089Z`.

The maintainer reported restarting Render, and no test uploads were issued during the recovery interval. After health returned HTTP 200, both deleting material rows, originals and sections were absent; owner previews returned HTTP 404 and repeated owner deletion returned HTTP 200. The interrupted import became failed with `IMPORT_INTERRUPTED`, a cleared cleanup marker and no original/sections. The sentinel's full owner preview and original hash were unchanged. Verification passed at `2026-11-05T11:28:56.260Z`; all remaining fixture data and the account were removed and absence checked by `2026-11-05T11:29:02.404Z`. This verifies reconciliation of seeded durable crash-point states after a maintainer-reported hosted restart. It does not inject a real provider outage, interrupt a live Render request, independently inspect the control plane or establish safe recovery during overlapping active imports.

### Genuinely expired signed access token

Run `f66f2cee-47cd-42c2-b9f4-49399fc88bd8` issued a real Supabase access token to a disposable account with client refresh disabled. The unchanged token first returned HTTP 200 for the protected material list. Its recorded expiry was `2026-11-05T12:18:06.000Z`; the test waited until 65 seconds afterward without changing Auth configuration or signing out/deleting the user. Token SHA-256 remained `e13823d22580a34e8f5661c1cdea6562b505680ff5ebeeacd2a0a603b26bc66a`.

The expired token then returned HTTP 401 for both material listing and upload, and no material row was created. A fresh sign-in returned a working token and HTTP 200 for the list. The disposable account was deleted and absence checked by `2026-11-05T12:19:17.017Z`. No edited, malformed or revoked token was substituted for the natural-expiry check.

### Live recovery-code error handling

Run `54ef39e8-db75-4b67-856b-bb1b537cf51d` generated a six-digit recovery code with the Admin API for a disposable account; no email was sent. An incorrect code returned HTTP 403 `otp_expired` without a session. The correct code established a recovery session, and reuse returned HTTP 403 `otp_expired` without a new session. Updating the password through the recovery session succeeded; the old password was rejected and the new one signed in. The account was removed and absence verified at `2026-11-05T11:30:57.706Z`. These are live provider/code/reset checks, not SMTP delivery or independently timed expiry of an unused recovery code.

### Physical Android DOCX, list and deletion checks

The USB-connected Redmi M2101K6G runs Android 13 with `com.anonymous.RebyuIT` version 1.0.0. Package flags establish that this is a debuggable development APK. The existing Metro server was reused; no release APK was built or installed. Mobile lint and `tsc --noEmit -p jsconfig.json` passed.

Run `143ce2e1-7e34-411d-841a-b88af26015a0` imported `PHASE2-DOCX-143ce2e1.docx` through Android's real picker. The synthetic 1,133-byte DOCX passed local extraction with three exact paragraphs before transfer to phone Downloads. Picker cancellation and idle Android Back returned safely without an upload. Offline upload displayed the friendly connection/retry message; Wi-Fi was restored. Rapid repeated upload taps followed by Home/background and app reopening produced exactly one persisted module. Hosted paragraphs, extracted-paragraph references and original SHA-256 matched the local fixture. All sections were ineligible before review.

The review reused existing subject/topic labels. With three sections selected, approval remained disabled until explicit review confirmation. Offline approval retained selections and confirmation and displayed the friendly error; retry after reconnecting saved ready status with all three sections eligible. A temporary processing status disabled Delete only for the test module while the original module remained usable. Its original Ready state was restored before pagination testing.

Nineteen clearly named synthetic failed-import metadata rows temporarily brought the owner's list to 21 modules. A cold app restart restored the signed-in session. The native list exposed `Load more modules` after the first 20 records; activating it displayed the original module on page two. All 19 pagination rows were then removed and absence verified. This checks the exercised 20/21 boundary, not arbitrary list sizes or campus load.

A temporary deleting status showed Deletion pending, disabled opening and an enabled Retry deletion action. The native confirmation visibly named the disposable module and warned of permanent loss. Rapid repeated card taps produced one dialog; one Cancel returned to Dashboard without a stacked confirmation. Confirmed deletion while offline retained the pending module, original bytes and all three sections; the friendly error and Dashboard Retry were verified after scrolling. Restored connectivity and another named confirmation completed deletion. Material/section queries and a Storage download confirmed absence at `2026-11-05T12:06:34.850Z`. The pre-existing module's full metadata/section hash and original-byte hash remained unchanged throughout and after cleanup.

The Dashboard was visually checked at 130% font scale; the original 100% scale was restored. Wi-Fi was restored to enabled and mobile data remained off. The DOCX in Downloads and one DocumentPicker cache copy were removed only after matching the fixture SHA-256, `a9ab60b290d194f770316b6562b9c8a3c42cd4233f5bad3d089998c73ffb267b`. No broader release, assistive-technology, code-layout or failure-corpus acceptance is claimed by these bounded observations.

### Physical Android account and recovery checks

Run `853df429-732c-4757-87d4-4199337cf92a` used disposable credentials entered into the real Android registration form. Public Auth settings confirmed signup enabled and email autoconfirm enabled. Signup created the expected profile/account without an email-code step, and the phone displayed the new account's empty Dashboard. Registration deliberately uses unremembered storage: a cold restart returned to Sign in. Signing in with Remember me checked and cold-restarting restored that disposable session and empty Dashboard. Native sign-out returned to Sign in.

Direct Set Password access without a recovery session redirected to Verify Email. For code-entry testing, the Admin API generated a recovery code without sending email; the test opened the same OTP route/parameters used after a successful code request. The real phone rejected an incorrect six-digit code, kept the user on OTP and displayed `Token has expired or is invalid`. The valid generated code opened Set Password. Keyboard Next moved from New Password to Confirm Password, and both test values remained masked. These checks exercise native form and live Auth behavior; they do not independently observe inbox delivery.

A temporary, fixture-ID-guarded SDK wrapper injected one sign-out error after the real password update. The physical screen displayed the password-updated/sign-out-retry message, cleared/disabled the password fields and offered Return to sign in. Retrying completed real sign-out and returned to normal Sign in. The device-side counter recorded exactly one password update and one injected sign-out failure, proving the retry did not resend the update. Independent live sign-in checks rejected the old disposable password and accepted the new one. All SDK methods were restored; this simulates a client SDK boundary failure, not a real provider outage. Reusing the consumed code on the phone was rejected with the same invalid/expired-code message and did not reopen Set Password.

Temporary assertion checks extracted the actual `handleResend` and `handleSubmit` functions from the current OTP component. With only SDK/state callbacks substituted, resend checks passed active cooldown, duplicate suppression, the 60-second deadline/reset and cleared inputs, retryable provider/network failures, and invalid-email suppression. OTP submission checks verified that a provider `otp_expired` error blocks recovery even if stale session data accompanies it, a missing-session success response is blocked, and only a valid session marks recovery/navigates. A separate on-device resend SDK stub handled one request without sending email and was restored; its screenshot was not counted as an independent 60-second timing measurement. No permanent tests or UI behavior were added. Initial test-navigation, keyboard and rapid-input calibration errors were corrected before counting passes; they were not treated as application defects.

The disposable phone-auth account/profile were removed and absence verified at `2026-11-05T13:14:44.620Z`. The original module's metadata/sections and original bytes were rechecked unchanged, and DOCX test-data absence was reverified at `2026-11-05T13:14:51.054Z`. A final cold restart cleared all runtime test hooks and left the physical app on normal Sign in with no disposable session. The maintainer must sign back into their own account; no maintainer password was read or changed. Temporary scripts, private state, reports and UI captures were removed after recording this evidence. The downloaded Google platform tools remain in the ignored tool cache for the active USB development connection; no SDK/NDK, EAS setup or application dependency was installed. The existing Metro server was preserved.

### Completion boundary and release gates

The completed development gate combines earlier two-account ownership, real-document extraction, approval/list/deletion evidence with the additional signed-token expiry, reported hosted restarts and physical development-build checks above. The accepted one-process/paused-upload rule is an operating restriction, not implemented distributed locking. Release-APK testing and shared coordination are explicit Phase 6 gates. SMTP delivery remains maintainer-reported; unused recovery-code age expiry, real-inbox delivery/rate windows, campus capacity, broader devices/accessibility and real outage/load behavior have not been independently measured by this run. No quiz, flashcard or reporting implementation is included.

## Hosted PDF restart persistence - 2026-11-05

Run `280bb9a4-0b09-4f2c-b88d-fd4728b0839b` imported a locally validated synthetic 694-byte PDF through the deployed Render API in a disposable account. Health returned HTTP 200 and no cleanup/deletion markers were pending before import. The owner preview and private-original SHA-256 were saved at `2026-11-05T11:09:28.377Z`. The maintainer confirmed the current deployment was live before preparation and subsequently reported completing a Render restart. The agent did not independently inspect Render's control plane, deployed SHA or overlap state.

After the reported restart, health returned HTTP 200, a fresh fixture sign-in succeeded, and the full owner preview matched the baseline exactly at `2026-11-05T11:12:44.190Z`. This includes material metadata, needs-review status, section text/references and generation-disabled flags; the cleanup marker remained false. The downloaded private original matched its pre-restart SHA-256, `cd0ff79ea84653f7c92a1787f673e6df6de81a5ecbdfd10c361f31a959f7fc7e`. This passes bounded PDF persistence and reauthentication across the maintainer-reported restart, complementing the earlier DOCX check.

The fixture original, material/section rows and disposable account were removed and absence checked by `2026-11-05T11:12:47.457Z`. Temporary local script, source PDF and private state were removed; maintainer-owned modules were not modified. No application code, dependency, migration or ADB/device behavior changed in this check. Genuinely signed expired-token rejection, independent deployment-overlap assurance, hosted interrupted-deletion recovery and broader Android/release checks remain open; Phase 2 is not fully accepted.

## Linux extraction worker shutdown fix - 2026-11-05

The maintainer supplied the diagnostic log for the deployed PDF failure: `stage: rss-unavailable`, `exitCode: 0`, `exitSignal: null`, `receivedOutcome: true`, 3,795 ms elapsed and 115,240,960 bytes peak memory on Node v24.22.2/Linux. No heap/module-load failure was indicated. This points to the parent RSS monitor overriding a returned result during normal worker shutdown.

A temporary regression harness reproduced this behavior against the actual parent extractor with substituted child-process events and `/proc` status: returned results were incorrectly replaced by `WORKER_FAILED` for zombie/dead processes with no RSS. Both cases failed before the fix. The monitor now skips RSS-less snapshots only when Linux explicitly reports zombie (`Z`) or dead (`X`) state, leaving exit/result handling and the timeout in charge. Missing RSS for live/unknown states still fails; no resource limits were relaxed.

All eight focused checks passed after the fix: zombie/dead result preservation, live/unknown missing-RSS failures, memory excess, normal RSS, zombie exit without a result, and RSS permission failure. Syntax and diff checks passed; the temporary harness was removed. These are simulated Linux-boundary checks.

Fix commit `8233757842fb3932e77879b3b255891f2a3c4626` was pushed and verified on `origin/main`; the maintainer reported it live. Run `e1dca090-8b29-47c1-af39-23effcf0c9dc` then passed the deployed PDF check at `2026-11-05T11:03:41.106Z`: health HTTP 200, no pending cleanup/deletion markers before upload, locally validated 694-byte PDF accepted with HTTP 201, needs-review status, exact local/hosted text and references, generation-disabled sections, cleared cleanup marker and matching SHA-256 for the owner's private original. Signing out and back in returned the same complete preview. Fixture original, material/section rows and disposable account were removed and absence checked by `2026-11-05T11:03:51.070Z`; the temporary script, PDF and sanitized report were removed locally. No maintainer-owned modules changed. The deployed commit/control plane was not independently inspected, and no ADB or broader load/document-corpus checks ran. This is a passing hosted reproduction of the formerly failing PDF import; PDF persistence across a hosted restart remains a separate open check.

## Extraction worker failure diagnostics - 2026-11-05

The parent extractor now emits one structured `Material extraction failed` log for infrastructure failures. It records the failure code/stage, child exit code/signal, whether an outcome arrived, elapsed time, peak memory, Node version/platform and boolean stderr/heap/module-load indicators. It does not log document text, file paths, credentials or raw stderr. Existing rejection codes, resource limits and API payloads are preserved.

Syntax and `git diff --check` passed. A temporary assertion harness exercised the actual parent extractor with child-process and Linux `/proc` reads substituted: 12 cases covered success, ordinary invalid-document rejection, worker exit/error, IPC failure, timeout, heap/module indicators, missing RSS, RSS read failure, memory excess and a disappearing process. Checks verified infrastructure logging, unchanged success/document-rejection behavior and exclusion of private text/paths/stderr. This is local simulated-boundary evidence, not a real Linux or hosted reproduction. The temporary harness was removed; no permanent test suite, dependency or migration was added.

Commit `c9db290de7b0298c73645644b0c7c25c8356e52c` was pushed to `origin/main`, verified with `git ls-remote`, and reported live by the maintainer. Run `c83a362e-1490-43db-a8b9-226f85b84a7f` then repeated the live synthetic PDF check: health returned HTTP 200, zero cleanup markers/deleting rows were pending, and the 694-byte PDF passed local extraction with one section. The deployed upload returned HTTP 422 `WORKER_FAILED` at `2026-11-05T10:59:22.983Z`; its retained row was failed with `cleanup_pending: false`. Cleanup verified removal of the fixture original, material/section rows and disposable account at `2026-11-05T10:59:28.286Z`. Temporary local script, PDF and sanitized report were removed. The agent did not inspect Render's deployed SHA/control plane or logs; the new structured log line was requested from the maintainer. The hosted failure is reproduced, but its cause and fix remain unconfirmed; this is not a passing PDF-import result or a restart-persistence check.

## Hosted DOCX restart persistence - 2026-11-05

Run `3b22632a-0df9-4c3c-8d07-a70696b571c9` exercised the deployed Render API and configured Supabase project with one disposable account. The maintainer confirmed readiness after checking the service's single-instance/no-active-deployment state and subsequently reported restarting Render. The agent has no Render control-plane access; the restart, deployed SHA and absence of deployment overlap were not independently observed.

A synthetic DOCX uploaded through `POST /api/materials` and produced one needs-review section. Before the restart, the authenticated owner preview, section text/references, generation-disabled state and private original were captured at `2026-11-05T10:45:33.675Z`. After the reported restart, health returned HTTP 200, a fresh owner sign-in succeeded, and the complete preview plus original SHA-256 matched the baseline exactly at `2026-11-05T10:47:55.990Z`. The cleanup marker remained false. Original SHA-256: `c6b03524de053a09896af6ecc159a233179f6cb7117c650886e043a148c8f84c`. This establishes bounded DOCX persistence across the maintainer-reported restart and reauthentication, not hosted interrupted-deletion recovery or Android behavior.

Two earlier uploads of the same synthetic 694-byte selectable-text PDF returned HTTP 422 `WORKER_FAILED` on Render. The exact PDF passed the local runtime extractor with one section; the synthetic DOCX also passed locally before its successful hosted upload. The first failed PDF row was inspected as failed with `cleanup_pending: false`. These results identify a repeated hosted PDF extraction failure, but do not establish its cause; PDF restart persistence remains unverified. No application fix or deployment change was made by the agent.

After comparison, all three fixture material rows (two failed PDFs and one DOCX), their Storage paths, cascading sections and the disposable account were removed. Checks confirmed the original paths were no longer downloadable, section/material queries returned no fixture rows, and the account was absent. Temporary scripts, local synthetic files and private state were removed. Maintainer-owned modules were not modified. No application code, dependency or migration changed; no permanent test harness was restored and no ADB/device test ran. Genuinely signed expired-token rejection, PDF extraction diagnosis/persistence, independently verified deployment-overlap controls, interrupted-cleanup recovery and remaining Android/release checks are still open.

## Material network feedback fix - 2026-11-04

The shared mobile material request helper now maps native fetch failures before a response arrives to a friendly connection/retry message. Expo's installed fetch implementation wraps native failures in an ordinary Error subclass with a `fetch failed:` prefix; checking only TypeError missed the Java/DNS messages seen on the device. Response presence now separates transport failures from safe HTTP/API error messages, preserving server validation/auth/conflict feedback.

The request's abort signal identifies the existing 90-second deadline, including cancellation reported with a generic native error and interruption while reading the response body. Other canceled/aborted requests show an interruption message. Upload timeout/interruption messages retain the warning that the upload may have completed and direct the user to check saved modules before submitting a duplicate. No automatic retry, timeout increase, new dependency, API contract change or migration was added.

A temporary harness reproduced the captured DNS failure against the real Babel-transformed helper before the fix. Twelve focused groups then passed, covering all seven material operations, generic/native network errors, cancellation, upload/non-upload deadlines, response-body timeout, preserved API/auth errors, malformed responses, success, timer cleanup and exactly one fetch per operation. Only Expo file/fetch, session and timer boundaries were mocked; no live credentials or provider calls were used. Mobile lint and `tsc --noEmit -p jsconfig.json` passed. The temporary harness was removed; no permanent test command or framework was restored. The maintainer subsequently reported the exact friendly offline message, "Could not reach the server. Check your connection and retry." This confirms the changed offline wording by user-reported manual evidence; the complete ADB flow and release-build feedback have not been rerun after this fix. Earlier raw-error findings below describe the pre-fix build.

## Physical Android import, approval and deletion checks - 2026-11-04

Thirteen behavior groups passed on a USB-connected Xiaomi/Redmi M2101K6G running Android 13, using the installed `com.anonymous.RebyuIT` Expo development build. Observations combined ADB input, native UI inspection/screenshots and fixture-scoped live Supabase queries. The source environment targeted `https://rebyuit-api.onrender.com`; the deployed commit and Render control-plane state were not independently inspected. This is physical development-build evidence, not release-APK validation.

- Android Back from idle import returned to Dashboard. Cancelling the native document picker returned to import without submitting an upload. Back during an active upload showed the blocking wait dialog.
- A generated 681-byte PDF, `ADB-CHECK-9eff81ec.pdf`, uploaded through the actual picker/upload flow and opened its needs-review preview. Existing personal labels and one usable section were selected; approval stayed disabled until explicit review confirmation.
- With Wi-Fi temporarily disabled and mobile data already off, approval displayed an actual DNS failure while retaining the review form. Restoring Wi-Fi and retrying saved ready status, confirmed by a live database read. The approved module reopened successfully after Dashboard recovery.
- The native deletion dialog named the disposable module and warned about permanent content loss. Cancel retained the module. Two rapid card Delete taps produced one confirmation; cancelling it retained the module again. This does not establish request counts or duplicate-confirmation behavior under load.
- Offline deletion displayed a DNS error, retained the card and offered Retry. The database row remained ready with no pending-cleanup marker. After Wi-Fi restoration, Dashboard Retry/reopening worked; subsequent confirmed deletion removed the test card while the original saved module remained visible.

The disposable material ID was `1b16384c-d1ed-48f9-81d2-849f81013890`. Post-deletion queries confirmed no material or section rows for that ID and empty source folders under the matching owner scope. No labels or accounts were created. The test PDF and UI dump were removed from phone Downloads; three private DocumentPicker cache copies were removed only after their size and binary SHA-256 matched the generated test PDF. Wi-Fi was restored to its original enabled state, and mobile data remained disabled. Temporary local tooling, APK copy, screenshots and driver scripts were removed after checks. Personal source files, the existing module and the user's ADB installation were preserved.

Two findings remain: an initial upload surfaced `Fetch request has been canceled` and succeeded on retry after reconnecting the development build; offline approval/deletion show raw Java/DNS errors instead of friendly network feedback. The latter was confirmed visually even where text-only UI inspection did not expose the message. Early assertions based on screen-transition timing or broad text matching were corrected and are not counted as application failures or passing evidence. Application source was not changed during verification.

Genuinely signed expired-token rejection, hosted restart persistence, deployment-overlap assurance and hosted interrupted-cleanup recovery remain unverified. No Render restart, auth-expiry change, migration or outage injection occurred. Broader Android interruption cases, keyboard/large-text coverage, DOCX-specific device behavior and release-build checks remain outside this bounded PDF run. Earlier live API/database evidence remains separate; Phase 2 is not fully accepted.

## Phase 2 implementation reconciliation - 2026-11-04

Source inspection confirmed that the requested import/review and retention/deletion flows already exist. Upload routes validate PDF/DOCX headers and bytes, enforce existing extraction limits, store private originals and extracted source references, and persist needs-review/failed states with durable cleanup markers. Personal label endpoints create/reuse owner-scoped subjects/topics; transactional approval validates ownership and selected sections before marking material ready. Owner-filtered reads and database policies protect private retrieval. The mobile import, preview, review and saved-module screens call those existing APIs.

Confirmed deletion uses the existing named native confirmation, owner-scoped deletion marker, Storage-first original removal and cascading section cleanup. Failure markers support retry and startup/import recovery. The inspected application has no automatic expiry job for retained modules. Privileged Supabase credentials are read only by server configuration; mobile source uses the public project URL/publishable key. Inspected application logging does not log privileged credentials. This is source inspection, not an audit of an exported APK or hosted environment.

The maintainer reports successful Android review, approval and reopening. Device/build details and independent reproduction were not supplied. Both roadmap implementation items are now complete; remaining hosted, expired-token and Android recovery checks are separate unchecked verification items. Quiz/flashcard/study-result cleanup remains work for the phases that create those schemas. No application code change was needed to implement the requested current behavior; no new migration, capacity guard, dependency or test harness was added. No tests, backups, migrations or deployment operations were run in this task. Earlier evidence and unrelated working-tree changes were preserved.

## Upload capacity deferred - 2026-11-04

At the maintainer's request, the local shared-capacity guard, migration, and capacity-specific test files were removed. The existing import and cleanup behavior is restored; the per-file 5 MiB extraction limit remains. No live capacity migration or deployment was performed by the agent. Ticket 05 is deferred; earlier import, review, listing and deletion evidence remains unchanged.

Earlier sections record automated checks run before the maintainer requested removal of mobile and server test files. Those tests and npm commands are no longer present. The results remain as historical evidence.

## Live deletion and scoped recovery - 2026-11-04

Ticket 04 passed 12 check groups using the deployed Render API, the configured live Supabase project, and two disposable accounts. Local service/recovery checks used checkout `c3abe82`; the deployed SHA was not independently identified. No migration was rerun or deployment changed. The effective deletion function and deleting-state support were already present.

- Missing/invalid identity returned HTTP 401; malformed module IDs returned HTTP 400. Missing and foreign module IDs returned the same successful deletion response without disclosing ownership. Cross-account DELETE requests in both directions left the target's original bytes and module/section snapshots unchanged, including with a spoofed owner query parameter.
- Anonymous and both authenticated clients were denied direct `begin_material_deletion` execution with PostgreSQL code `42501`. Privileged execution and the deployed owner-scoped DELETE path worked.
- Owner DELETE removed private originals and cascading sections for both accounts, preserving reusable labels. Missing originals, repeated DELETE, and simultaneous DELETE requests completed safely. Processing and cleanup-pending modules returned HTTP 409 `MATERIAL_BUSY` without changing their rows, sections, or original bytes.
- Two concurrent privileged marker requests returned the same durable deleting state. Deleting material rejected preview with HTTP 409 `DELETION_PENDING` and approval with HTTP 409 `MATERIAL_NOT_REVIEWABLE`; owner deletion then completed.
- Controlled failures ran the actual local deletion service against real Supabase through a loopback proxy. Table requests were restricted to the two disposable owners, deletion RPC calls to those owners, and Storage removals to recorded fixture paths. The proxy did not change provider configuration or affect unrelated users' requests.
- An injected Storage removal failure produced the service's safe 503 `DELETION_PENDING` error while retaining the durable marker, original bytes, and sections. Removing the fault and retrying completed cleanup.
- An injected database DELETE failure occurred after real Storage removal. The module stayed deleting with sections retained and its original absent; a retry completed cleanup. Proxy observations checked the row/sections were present at Storage removal and the original was absent before the database delete attempt, verifying operation ordering.
- Fresh local processes ran the actual server startup path through the scoped proxy. With Storage cleanup blocked, startup exited with code 1 without listening. With the fault removed, a new process recovered the pending deletion before `/health` became available. A separate fresh process also recovered a committed deletion marker whose original had already been removed. Each local process was stopped after its check; Render was not restarted.
- Unrelated sentinel module/section snapshots, original byte hashes, and personal labels remained unchanged before final test cleanup.

The sanitized report is `ticket04-live.json` (historical report; file removed during cleanup), run `830a5e0c-70e1-478d-8a1e-bb9b4254161d`. Both disposable accounts, all recorded private object paths, and associated material, section, subject, and topic rows were cleaned up. Follow-up queries confirmed zero remaining rows, empty owner Storage listings, and missing disposable accounts. The opaque synthetic original bytes tested deletion and byte preservation, not PDF validity or extraction quality.

No application defect was found, so no application code or dependency changed. The temporary assertion script and proxy were removed without restoring the deleted test harness. These are bounded live-operation and scoped local failure/restart checks: they do not prove Render crash/redeploy recovery, a real provider outage, next-import recovery, multi-instance coordination, campus load, physical Android confirmation, or cleanup of unimplemented quiz/flashcard schemas. Physical Android deletion remains ticket 07; capacity handling and full Phase 2 acceptance remain incomplete. Historical deletion notes below are superseded only for the checks listed here.

## Live saved-module listing - 2026-11-04

Ticket 03 passed 11 live check groups against `https://rebyuit-api.onrender.com` and the configured Supabase project. Two disposable accounts held 41 and three administrator-seeded synthetic modules, with synthetic labels and source sections. The local checkout was `c3abe82`; the deployed SHA was not independently identified. These results establish the exercised live list/database behavior, not native Dashboard behavior or document-import correctness.

- Missing and invalid access tokens returned HTTP 401. Both accounts initially received empty lists. Each account subsequently received only its own expected summaries; spoofed owner/user query parameters did not change the authenticated scope. Direct cross-account material and section reads returned no rows in both directions.
- Exactly 20 modules returned one page with `nextOffset: null`; the next offset returned an empty page. At 21 modules, the first page returned 20 rows and offset 20 returned the final row. At 41 modules, traversal returned 20, 20, and one row with offsets 20, 40, and null, without missing or duplicate IDs.
- Ordering matched descending `created_at`, then descending UUID, including repeated timestamps spanning page boundaries. A 19-row partial page, beyond-final offsets, the maximum accepted offset 2,147,483,627, and a ten-digit zero offset behaved as expected. Fixtures remained unchanged during each traversal; this does not establish snapshot pagination during concurrent inserts/deletions.
- Empty, negative, fractional, exponential, nonnumeric, whitespace, explicitly positive, repeated, overlong, and over-maximum offsets returned HTTP 400 `INVALID_OFFSET`.
- Needs-review, ready, failed, and processing modules retained their persisted statuses in summaries and opened only for their owner. Needs-review/ready previews returned the seeded section; failed/processing previews returned no sections. A briefly marked deleting module remained listed, returned owner-preview HTTP 409 `DELETION_PENDING`, and remained hidden from the other account with HTTP 404.
- Every summary on every page contained exactly `id`, `title`, `original_filename`, `status`, and `created_at`, with expected values. Responses omitted extracted text, Storage paths, credentials, and foreign metadata.

The sanitized machine-readable report is `ticket03-live.json` (historical report; file removed during cleanup), including run identifier, timestamps, group results, and cleanup results. Both disposable accounts and all associated material, section, subject, and topic rows were removed, with independent absence checks. No source files or Storage objects were uploaded, and no import or deletion-recovery endpoint was called.

No application defect was found; no application code, API contract, dependency, migration, deployment, or Dashboard layout changed. The temporary assertion script was removed without restoring the removed test harness. Ticket 03 is complete for live API/database verification. Physical Android Dashboard loading, scrolling, pagination, refresh, error recovery, and navigation remain ticket 07; ticket 01 and the overall Phase 2 acceptance item remain incomplete.

## Live personal labels and approval - 2026-11-04

Ticket 02 passed 12 live check groups against `https://rebyuit-api.onrender.com` and the configured Supabase project, using two disposable accounts and administrator-seeded synthetic needs-review modules. The local checkout was `c3abe82`; the deployed SHA was not independently identified. These are live API/database results, not document-import or physical-device evidence.

- Personal subject/topic creation, whitespace trimming, listing/reuse, and two-account isolation passed. Empty, oversized, control-character, case-insensitive duplicate, and foreign-subject label requests were rejected.
- Anonymous and both authenticated clients were denied direct execution of `approve_material` with PostgreSQL code `42501`; the real API successfully executed approval through its privileged server path. This verifies effective permissions and behavior, without claiming inspection of the migration-history table. No migration was rerun.
- Empty, duplicate, malformed, missing, foreign, unrelated, punctuation-only, and insufficient-text section selections were rejected. Mismatched and foreign labels were rejected. Stored module/section snapshots remained unchanged after every rejected approval.
- Foreign module approval and retrieval were denied in both directions. Approved labels, ready status, and selected-section eligibility persisted together; excluded sections remained ineligible. Extracted text and source references were unchanged.
- Repeating an identical approved request succeeded; changed selections or labels conflicted without overwriting saved state. The acknowledgement-discard check retried an already completed request; it did not simulate a transport failure.
- Reauthentication preserved owner retrieval of the ready module. Another account could not retrieve its preview or section rows, and the owner could not directly update module state through the public database client.
- Two simultaneous identical approvals both succeeded. Three pairs of simultaneous conflicting approvals each produced one HTTP 200 and one HTTP 409 `REVIEW_CONFLICT`; stored labels and eligibility matched one complete winning request, never a mixed selection. This is bounded concurrency evidence, not a campus-load measurement.
- Processing, failed, deleting, and cleanup-pending modules rejected approval with HTTP 409 `MATERIAL_NOT_REVIEWABLE`, without changing state.

The sanitized machine-readable report is `ticket02-live.json` (historical report; file removed during cleanup), run `2068811c-e07d-4323-afeb-e5e84181eed0`. Both disposable accounts and all associated material, section, subject, and topic rows were removed; independent follow-up reads confirmed their absence. No source documents or Storage objects were uploaded. No application defect was found, and no application code, dependencies, migrations, deployment, or restart changed. The temporary assertion script was removed; no permanent test harness or test command was restored.

Source inspection confirmed the existing mobile approval handler and button require explicit review confirmation. Its physical-device interaction remains ticket 06. Ticket 01 remains in progress; the broader Phase 2 acceptance item remains unchecked. Older notes below describing review SQL/RLS as unverified are historical and are superseded only for the checks listed here.

## Live imports and representative documents - 2026-11-04

Ticket 01 passed nine synthetic live check groups and three representative-document groups against `https://rebyuit-api.onrender.com` and the configured Supabase project. The maintainer identified live commit `eeb2db616ad8ef1243856daf58e248c69eb58e59` and confirmed the API runs only on Render, with Supabase providing data/Storage. Its tracked backend/migration trees match local checkout `c3abe82`. Render control-plane state and absence of deployment overlap were not independently inspected. No deployment, restart, or migration was performed.

- Two disposable accounts each imported a generated selectable-text PDF and DOCX through the real deployed endpoint. Owner previews persisted needs-review status, unassigned labels, source references, formatting warnings, and generation-disabled sections. Synthetic prose, code tokens, and table values survived extraction. Stored rows/sections matched owner previews, cleanup markers cleared, and both privileged and owner downloads matched original SHA-256 hashes.
- Missing and invalid identity returned HTTP 401 for import and preview, without creating fixture rows. In both ownership directions, foreign previews returned HTTP 404 even with a spoofed owner query parameter; direct material and section queries returned no foreign rows. Foreign original download, signed URL creation, listing and overwrite failed or returned no accessible objects. Foreign removal attempts left complete owner row/section snapshots and original hashes unchanged. Anonymous download and public original URLs were also denied. This does not substitute for a genuinely signed expired-token check.
- Corrupt PDF and DOCX returned HTTP 422 `INVALID_FILE`; a valid image-only PDF returned HTTP 422 `NO_USABLE_TEXT`. Each retained a failed row with no pending cleanup, original object, or sections. A 5 MiB + 1 byte PDF returned HTTP 413 `FILE_LIMIT`; unsupported text returned HTTP 415 `UNSUPPORTED_TYPE`, neither creating a material row. Previously imported fixture rows and original hashes remained unchanged.
- Signing out and signing back in preserved exact synthetic previews and original bytes.
- The maintainer supplied `C:\Users\Administrator\Desktop\Subjects\SP-APPDEV-WS` for representative samples. `WS101_Module5_JavaScript_Basics.docx` (98,234 bytes, 22 source tables, two embedded media files) produced 539 sections and 24,603 characters. `CC106_Study Guide_5.pdf` (536,468 bytes) produced six sections and 11,219 characters. Both were uploaded through the deployed API in a third disposable account. Hosted text and references exactly matched fresh local PDF.js/Mammoth extraction; private originals matched their input hashes; all sections remained ineligible before approval. DOCX warnings included library, excluded-images, and formatting review; PDF warnings included excluded-images and formatting review. Both previews survived sign-out/sign-in unchanged.

Sanitized reports: `ticket01-live.json` (historical report; file removed during cleanup), run `26a167ed-a408-4e2e-a41a-b057eb24f906`, and `ticket01-real.json` (historical report; file removed during cleanup), run `327b6df7-aad3-437c-a8f7-f100a945472b`. All three disposable accounts, nine recorded material paths (including already-cleaned rejection paths), material rows and cascading sections were removed. Post-cleanup queries/downloads confirmed absence. Local source documents and maintainer-uploaded modules were not changed. Reports contain no credentials or extracted source text. Temporary assertion scripts were removed; no permanent test harness or dependencies were added. No application defect was found and no application code changed.

Ticket 01 remains in progress: controlled hosted restart/persistent-preview verification and rejection of a genuinely signed expired token remain untested. Token expiry settings were not changed and invalid/edited tokens are not counted as expired-token evidence. Matching local extraction establishes output consistency, not visual code indentation or table-layout fidelity; images remain excluded and OCR is unsupported. Physical Android interaction, provider outages, campus load, and full Phase 2 acceptance are not established. These results supersede earlier missing live-import and representative-DOCX evidence only for the checks listed here.

## User-reported PDF and DOCX uploads - 2026-11-04

The maintainer reports that both PDF and DOCX imports through Upload Module succeeded. This is user-reported workflow evidence. Device/build, document identities, extracted-text fidelity, source references, private original-byte persistence, and retrieval after a hosted restart have not been independently established. No maintainer-uploaded material was inspected or deleted by the verification agent. Ticket 01 remains in progress pending its remaining deployment, security, rejection/cleanup, representative-document, and restart checks; this report alone does not complete ticket 06 or Phase 2.

### Read-only preflight refresh

After this run, the maintainer identified Render's deployed commit as `eeb2db6`. Local Git resolves it to `eeb2db616ad8ef1243856daf58e248c69eb58e59` (`docs: document confirmed module deletion and migration setup`). Comparing its tracked `server/` and `supabase/` trees with local checkout `c3abe82` found no differences. This establishes local source equivalence for the user-reported deployed version; Render deployment identity, instance count, and absence of overlapping deployment were not independently inspected. The deployed-SHA input is supplied; single-instance/no-overlap confirmation, the permitted representative DOCX, and controlled restart access remain outstanding.

Run `9d199260-49f6-4cbf-bfe3-6c3f0d1d9cec` passed six check groups against the configured hosted API and Supabase: health; missing identity; invalid identity; expected material/section column resolution; private PDF/DOCX bucket configuration with a 5 MiB limit; and recovery-marker counts. Missing and invalid identity checks each exercised list, preview, and import requests and returned HTTP 401. Exact counts were zero pending imports and zero deleting modules at inspection time. Schema presence does not establish migration history or effective grants; invalid tokens do not establish rejection of genuinely signed expired tokens.

Sanitized report: `ticket01-preflight.json` (historical report; file removed during cleanup). The initial sandbox-denied connection attempt was superseded by this successful network-enabled run. No disposable accounts, material rows, or Storage objects were created, no cleanup/recovery function was called, and no hosted restart or deployment occurred. The temporary assertion script was removed; no test commands, dependencies, or application code changed. Deployed SHA, single-instance/no-overlap confirmation, a permitted representative text-rich DOCX, and controlled restart access remain outstanding inputs before the dependent checks.

## Live import preflight - 2026-11-04

Ticket 01 is in progress. These checks used the API URL currently configured in the mobile environment, `https://rebyuit-api.onrender.com`, and the server's configured Supabase project. The local checkout was at `c3abe82`; the deployed commit and single-instance/no-overlapping-deployment state have not been independently established. No deployment, migration, or restart was performed.

| Check | Current evidence |
|---|---|
| Render health | Live `GET /health` returned HTTP 200 with `{"status":"ok"}`. This does not identify the deployed commit or prove authenticated imports. |
| Missing identity | Live module-list and preview GET requests, and a PDF import POST, returned HTTP 401. |
| Invalid identity | Live import POST and preview GET with an invalid token returned HTTP 401 and the safe Unauthorized response. A genuinely signed expired token was not tested. |
| Supabase import schema | Privileged zero-row reads resolved the expected material/section columns, including `cleanup_pending`, references, and eligibility. Public-schema OpenAPI metadata included `begin_material_deletion` and `approve_material`. This establishes presence, not migration history, grants, locking, or transaction correctness. |
| Private Storage configuration | The configured `modules` bucket is private, allows PDF/DOCX MIME types, and has a 5,242,880-byte file limit. No cross-account Storage operations were attempted in this preflight. |
| Recovery preflight | Exact read-only counts found zero pending import markers and zero deleting modules at the time of inspection. This does not prove restart recovery or rule out later activity. |
| Local synthetic documents | Fresh local assertion checks passed selectable-text PDF and DOCX extraction into needs-review, formatting-review warnings, and generation-disabled sections. Image-only PDF returned `NO_USABLE_TEXT`; corrupt PDF returned `INVALID_FILE`. No document was uploaded. |
| Local real PDF | The previously documented `CC106_Study Guide_5.pdf` produced six sections and 11,219 characters, with image-exclusion and formatting-review warnings. This was extraction on Windows, not hosted upload or a new semantic fidelity evaluation. |
| Local real DOCX candidate | `MODULE-4-GROUP-3_USER-INTERFACE-UIDESIGN.docx` from Downloads produced one section with only 68 characters, plus library, image-exclusion, and formatting-review warnings. ZIP inspection found 10 embedded media files. It is an image-heavy case and does not establish representative text-rich DOCX fidelity. Permission for its live upload was requested and remains pending. |

Checks used Node 24.22.1 and the installed PDF.js/Mammoth dependencies, without restoring removed test commands or adding dependencies. Source text, tokens, and secret keys were not logged. No disposable accounts, live material rows, or Storage objects were created, so no remote cleanup was required. Generated synthetic local fixtures were removed after checking; original documents were left intact.

Still required: confirm the deployed version and single-instance state before imports; run authenticated PDF/DOCX imports and owner previews with disposable accounts; verify original-byte persistence, source references, review/eligibility state, live invalid-document cleanup, cross-account access restrictions, reauthentication, signed expired-token rejection, and a controlled restart. The existing import operation triggers shared cleanup, so testing against an unconfirmed overlapping deployment is inappropriate. Restart access and a permitted real DOCX sample remain external inputs. No ticket or Phase 2 acceptance checkbox is completed by this preflight.

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
