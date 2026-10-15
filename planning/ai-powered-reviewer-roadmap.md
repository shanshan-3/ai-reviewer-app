# AI-Powered Interactive Reviewer: implementation plan and roadmap

## 1. Status, goal, and success criteria

**Status: Partially blocked.** The product scope is agreed. Development requires separate authorization and the checks listed below. Before campus release, the team must verify free hosting, authentication emails, AI quotas, and the app's behavior with school modules. This plan does not authorize implementation or external account changes.

Planning date: 2026-10-15.

Source: [AI_Powered_Reviewer_Overview.md](../AI_Powered_Reviewer_Overview.md), with the decisions from Q1-Q13. The initial workspace contained only the overview. There is no application, package manifest, test suite, database migration, or deployment. The file layout and interfaces below are proposed.

The goal is an installed Android review application for BSIT students and IT instructors at Pangasinan State University, Asingan Campus. Students and instructors prepare independently using school modules or IT topics. The app generates practice questions and explanations, provides flashcards, and tracks each user's progress. All operating services must remain free.

### Observable success criteria

1. A student or instructor can install the Android APK, create an account, sign in, recover access, and return to their own saved material and history.
2. A user can import a selectable-text PDF or `.docx` module, verify extracted text, and generate a quiz from the supported content or a selected IT topic.
3. Both ordinary multiple-choice questions and code-snippet multiple-choice questions work without executing submitted code.
4. Each accepted answer receives immediate corrective feedback. The app saves results, scores, and subject/topic diagnostics without counting duplicate submissions.
5. Practice difficulty changes according to a documented performance rule. Recommendations identify weak topics from recorded answers, and the interface describes mastery as a practice estimate.
6. Flashcards support front/back review. The dashboard shows scores, study streaks, and subject/topic practice estimates. Users can view and download a performance report based on the same data.
7. One user's documents, generated content, answers, and reports remain inaccessible to another user, including instructors.
8. Physical Android testing verifies document import, code readability, interrupted sessions, authentication return links, report export, and service-error behavior.
9. Before release, an instructor checks representative module questions for correct answers, support in the source material, and clear wording. A working app alone does not establish educational effectiveness or examination readiness.

### Uncertainty map

| Category | Current position |
|---|---|
| Settled: verified facts | The overview defines six selected features, adaptation, recommendations, and a student review flow. No application exists in this workspace. Official service documentation was checked during planning; it does not establish live account availability or runtime behavior. |
| Settled: user decisions | Students and instructors; independent preparation; Android only; free services only; React Native Reusables + NativeWind; users confirmed 18+; external module processing permitted; selectable-text PDF and `.docx`; code-based multiple choice. |
| Questions | No further product question is required to draft this roadmap. Gemini-specific content-use approval remains conditional. Any scope change discovered during validation must be recorded here before dependent implementation. |
| Still unclear | Representative module sizes/content, launch subjects and topic labels, expected active/concurrent users, free hosting suitability, authentication sender availability, actual provider/model quotas, account retention settings, and supported Android/Expo versions. Each needs a specific validation check. |
| Excluded | Instructor publishing and shared quiz libraries; classes, assignments, grading, and access to other students' results; iOS, browser and desktop clients; OCR, scanned documents, `.doc`, PowerPoint and photo imports; typed code exercises and code execution; paid service upgrades; full offline synchronization; tickets and implementation in this planning task. |

## 2. Scope

### Included

- Secure accounts and profiles for students and instructors, with entry screens suited to each role and private resources. Instructors use their accounts for personal preparation and cannot access students' accounts.
- Importing authorized school modules as selectable-text PDF and `.docx`, with subject/topic labels and an extraction preview.
- Configuring and generating IT quizzes from a module or selected topic. Label topic-only output as AI-generated general review; it cannot claim support from an uploaded module or the official curriculum.
- Multiple choice for conceptual and coding-syntax questions, including snippets asking about syntax, errors, or output.
- Immediate explanations, adaptive difficulty, diagnostic results, weak-topic recommendations, and saved practice history.
- Technical-term flashcards, student progress dashboard, study streaks, subject/topic practice estimates, and performance reports.
- Viewing personal performance reports on the device and exporting them as PDFs. Exporting instructor quizzes is excluded.
- Android APK delivery and checks of network behavior, devices, accounts, and services.

### Excluded and scope interpretation

The exclusions in the uncertainty map apply to every phase. Scope follows the overview. Classroom-management additions, a shared content library, instructor approval queues, student surveillance, and a separate administrative application are excluded.

Instructors use the same personal import, generation, preview, and practice functions. They do not publish quizzes to students. Each user's content remains separate, even when students and instructors use the same source module.

The app is intended for campus use. Free-tier evaluation must establish whether the services can support ongoing use; it does not change the target to an academic prototype.

## 3. Decisions and rationale

### Technology stack

| Part | Technology | Status |
|---|---|---|
| Android application | React Native + Expo | Selected |
| Language | JavaScript / JSX | Selected |
| UI components | React Native Reusables | Selected |
| Styling | NativeWind | Selected |
| Backend API | Node.js + Express | Selected |
| Database | Supabase PostgreSQL | Selected |
| Authentication | Supabase Auth | Selected |
| Private module storage | Supabase Storage | Selected |
| AI question generation | Groq API | Primary provider |
| Alternative AI | Gemini API | Conditional on approved data-use terms |
| PDF text extraction | PDF.js | Proposed; requires validation |
| Word `.docx` extraction | Mammoth | Proposed; requires validation |
| Document selection | Expo DocumentPicker | Proposed |
| PDF performance reports | Expo Print | Proposed |
| Backend hosting | Free hosting or existing school infrastructure | Undecided |

Package versions require compatibility testing before they are pinned. The system currently consists of planning documents; the application has not been implemented.

### Decision details

| Decision | Basis | Rationale and consequence |
|---|---|---|
| Use the overview as the feature baseline | User-confirmed, Q2 and Q7 clarifications | Preserve the stated review features and intended campus audience. User count and service reliability requirements were not specified. |
| Serve both students and instructors | User-confirmed, Q1 B | Provide separate entry experiences while reusing private preparation functions. |
| Independent preparation; no instructor-published library | User-confirmed, Q12 B | Instructors prepare their own quizzes; students generate theirs independently. |
| Installed Android application only | User-confirmed, Q5 A and Q6 A | Replaces the initial browser-based React/Vite proposal. No web frontend is planned. |
| React Native + Expo | Delegated, Q3 A; refined following platform decision | Use the React ecosystem for Android development and APK generation. |
| React Native Reusables + NativeWind | User-confirmed, Q8 | Reuse editable component source and consistent styling. Paper and gluestack remain alternatives and will not be installed alongside Reusables. |
| JavaScript ecosystem; JavaScript/JSX application code | Delegated, Q3 A | Keep the proposed language choice. Test the Reusables/template setup in Phase 1. If generated component templates require a language change, document that decision explicitly. |
| Node.js + Express API | Delegated, Q3 A | Keep extraction, secrets, question generation, and authoritative scoring on the server. |
| Supabase PostgreSQL, Auth, and private Storage | Delegated, Q3 A | Reuse managed accounts and persistent storage. Use SQL migrations and Supabase clients; no ORM or second database is currently justified. |
| Free services only | User-confirmed, Q4 A | No automatic paid upgrade or paid fallback when quotas are reached. Verify availability and capacity before release. |
| Groq primary; Gemini conditional alternative | User-confirmed, Q10 clarification | The user permits external processing of school modules. Gemini needs separate acceptance of its content-use terms. Switching providers must be explicit. |
| Intended users are 18+ | User-confirmed, Q9 A | Record as an eligibility constraint. Revisit the provider decision if the audience changes. |
| Selectable-text PDF and `.docx` | User-confirmed, Q11 | Extract text without OCR. Reject image-only, corrupt, encrypted/unsupported documents with an actionable explanation. |
| Coding questions use multiple choice | User-confirmed, Q13 A | Code snippets are displayed as text and checked against a saved answer key; no runtime or sandbox is needed. |
| Email/password accounts and personal role selection | Assumption: implementation proposal | Roles control entry presentation only. They do not verify university membership or grant elevated access. Confirmation and password recovery require working email delivery. |
| Internet required for authenticated study operations | Assumption: implementation proposal | Cloud generation and persistence require connectivity. Preserve retry/recovery behavior without promising full offline study. |
| PDF performance reports | Assumption: implementation proposal | Provides a practical downloadable report on Android; validate export using Android's file/share flow. |
| Explain answers from pre-generated, validated content | Delegated technical approach | Generate explanations with the questions so feedback does not require a new AI call for every answer. |
| Simple performance-driven adaptation and recommendations | Assumption: implementation proposal | Use clear rules based on saved answers, with no additional AI agent or claim of a scientific mastery model. Evaluate the rules below as part of the agreed feature. |

### Verified technical evidence and constraints

- Reusables copies component source into the project and supports NativeWind/Uniwind. Use NativeWind and add only the components needed. The source is MIT-licensed. [Introduction](https://github.com/founded-labs/react-native-reusables/blob/main/apps/docs/content/docs/index.mdx), [repository and license](https://github.com/founded-labs/react-native-reusables).
- Expo supports directly installable Android APKs and a limited free cloud-build allowance. Distribute an APK initially. Before release, check account eligibility, installation requirements, signing, and applicable Android distribution rules. Play Store publication has not been required or confirmed free. [APK builds](https://docs.expo.dev/build-reference/apk/), [distribution](https://docs.expo.dev/build/internal-distribution/), [plans](https://docs.expo.dev/billing/plans/).
- Supabase provides PostgreSQL, Auth, and Storage. When checked for this plan, the free plan listed a 500 MB database, 1 GB file storage, 5 GB egress, inactivity pausing, and no automatic backups. Test application capacity against those allowances and establish manual database and file recovery before campus use. [Architecture](https://supabase.com/docs/guides/getting-started/architecture), [pricing](https://supabase.com/pricing).
- Supabase's default SMTP service sends only to project-team addresses and currently allows two messages per hour. Student confirmation and password recovery need a custom SMTP sender. Verify a free provider or an existing school sender, including sender authorization, quotas, and mobile links. Keep confirmation enabled when resolving delivery failures. [Auth email requirements](https://supabase.com/docs/guides/auth/auth-smtp).
- Render Free runs Node services, but its documentation advises against production use. It sleeps after 15 minutes of inactivity, may take about a minute to wake, and loses local files on restart. It remains a candidate for evaluation only. Campus release requires a suitable free Express host or authorized existing school infrastructure. [Render Free limitations](https://render.com/docs/free).
- Groq's agreement disallows training on inputs/outputs without the customer's permission. Its documentation describes retention conditions and Zero Data Retention. Check the controls on the actual account and enable the agreed setting before processing school modules. Claims about provider access and retention must reflect those conditions. [Services agreement](https://console.groq.com/docs/legal/services-agreement), [data controls](https://console.groq.com/docs/your-data).
- Groq free quotas are shared across the organization. Select and pin an available production text model after checking structured-output support, account limits, and educational quality. Schema compliance alone cannot establish answer correctness. [Rate limits](https://console.groq.com/docs/rate-limits), [structured outputs](https://console.groq.com/docs/structured-outputs).
- Gemini's unpaid services use submitted content/responses for product improvement and may involve human review. They prohibit submitting sensitive, confidential, or personal information. Permission for external processing does not cover this additional use automatically. Keep Gemini disabled unless its terms fit the authorized materials. [Gemini terms](https://ai.google.dev/gemini-api/terms), [free-tier availability](https://ai.google.dev/gemini-api/docs/pricing).

## 4. Implementation plan

### User flows

Students install the APK, register or sign in, and open the dashboard. They select a saved personal module, import a supported file, or choose an IT topic, then configure a quiz. Each answer receives immediate feedback. After the quiz, students see their results and guidance on weak topics, and can review progress, flashcards, and their personal report.

Instructors install the same Android application and register or sign in with an instructor profile. In their personal preparation workspace, they import a module or select a topic to generate and inspect quizzes or flashcards. They can also practice the quizzes. They cannot publish or assign them, or access student histories.

For module imports, the server checks the selected file's type and size limit, stores it privately, and extracts plain text. The user previews the text and its subject/topic. Mark the material ready only if it contains meaningful text; a `.docx` extension alone does not establish validity. Warn about image-dependent diagrams and formatting-dependent code, or exclude them from generated questions. Mixed PDFs must not appear to support OCR.

When the user submits a source and quiz options, create a generation record with a client request identifier. Extract or select relevant text within the configured limits, call the approved provider, and validate its response and source references before saving a complete quiz. Show whether the quiz is ready, the source is empty or insufficient, generation failed, or a quota was reached. Reopening a request returns its saved status. If a restart leaves the outcome uncertain, show a failure and require a deliberate retry. Provider execution cannot be guaranteed exactly once.

For a quiz session, save the question sequence and answer key on the server. Send the current question without its answer, accept one answer per question in that attempt, then save the result and return the explanation. Select the next difficulty from the result. Finalize the attempt once and calculate its totals. Retrying a lost response must not count scores or streaks twice. After reconnecting, the user can resume a saved attempt even if the app was closed.

### Proposed behavior rules

- Start with a configurable quiz of 5-10 questions. Check generation sizes against the provider's input/output budget before setting UI limits.
- Generate a limited question pool covering easy, medium, and hard levels for the chosen topic/module, within the tested token budget. Start at medium. Two consecutive correct answers move the user up one level; two consecutive incorrect answers move them down one level. Reset the counter after each change. If that level has no unused question, select the nearest available level and record the difficulty used. This avoids an AI request for each answer.
- Keep semantic question identifiers and the original answer key. When shuffling options, preserve the correct option's identifier. Check answers against that stored identifier without asking the AI to score them.
- Show AI-authored explanations for incorrect answers and identify the correct option. Keep each module-based question's supporting excerpt and its PDF page or DOCX section/paragraph reference when available. Topic-only questions must not have invented module citations.
- Generate front/back flashcards for technical terms from the same supported sources. Users flip and review cards. Spaced repetition and a separate scheduling algorithm are excluded from this version.
- Show overall scores, accuracy by subject/topic, answer counts, and trends over time. Base the proposed practice estimate on the latest 20 first-submission answers per topic. Show insufficient data before five answers; once that threshold is met, recommend the weakest topics. Label limited history clearly and do not describe the estimate as validated examination readiness.
- Count a study day when the user completes a practice session or explicitly completes a flashcard review. Save their selected IANA timezone, initially taken from the device, and count distinct calendar days rather than taps. Show the timezone used and preserve historical completion dates when it changes.
- Personal reports use the same saved data as the dashboard to summarize scores, activity, subject/topic estimates, strengths, weaknesses, and sample sizes. Reports must show when history is empty or too sparse for conclusions.
- Require an IT topic within the input length limit and a subject label. Reject unsupported or insufficient context. Derive initial suggestions from authorized modules or a confirmed subject list; do not invent a PSU syllabus.

The numeric defaults are proposed implementation assumptions. The user has not confirmed them as educational rules. Evaluate them with representative students and instructors, and update the plan if the results require material changes to behavior.

### Architecture and proposed files

Use one repository with a mobile application, an Express server, and one Supabase project. The workspace has no existing application code; reuse the selected libraries and platform functions.

| Proposed area | Responsibility |
|---|---|
| `mobile/` | Expo application, role entry screens, import, quiz, flashcards, progress, reports; requested Reusables components and NativeWind theme |
| `server/` | Auth verification, private-resource checks, extraction, AI generation, answer submission, result aggregation, limits, cleanup |
| `supabase/migrations/` | Versioned SQL schema, owner policies, storage policies, uniqueness constraints, atomic answer/finalization operations |
| `server/test/` and focused mobile tests | Answer/adaptation rules, extraction fixtures, authorization, duplicate submissions, and critical screen behaviors |
| `README.md` and environment examples | Exact setup/run/verification commands discovered during implementation, configuration names, deployment and recovery steps; no secrets |

Create these files only after implementation is authorized. A generic repository framework, provider plug-in system, message broker, vector database, and separate administrative app are outside the planned work.

The backend uses authenticated requests and a consistent JSON format for success and error responses. It needs operations to import, check, and delete personal material; request and read generation results/status; start, read, and resume attempts; submit answers; read personal results, progress, and report data; and create, read, and review personal flashcards. Check ownership for every identifier. Configure the provider on the server, outside ordinary user controls.

Store profiles, materials and extracted sections, generation records, quizzes and questions, attempts and answers, and flashcard sets and review completions. Each resource needs an owner ID. Calculate subject/topic summaries from answers until performance measurements justify caching them. Save the provider/model, source identity, and generation settings with generated content. Deleting a source file must preserve historical scores. Retain only the private question evidence existing attempts need, and document the deletion policy before campus use.

Evaluate PDF.js for PDF extraction and Mammoth's raw-text API for `.docx` on the selected Node runtime. Use Phase 1 samples to set file-size, page-count, extracted-text, decompressed-DOCX, processing-time, and memory limits. Enforce those limits; if a library cannot, isolate extraction in a worker/process that can be terminated. Render no raw DOCX-generated HTML and fetch no links embedded in modules. [PDF.js](https://mozilla.github.io/pdf.js/getting_started/), [Mammoth raw text and security guidance](https://github.com/mwilliamson/mammoth.js).

Use Expo DocumentPicker for import and check that the selected file is readable before uploading it. Its cache-copy option affects FileSystem access. Expo Print can create report PDFs in the application cache. Verify saving/sharing on Android and remove temporary report files when appropriate. [DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/), [Print](https://docs.expo.dev/versions/latest/sdk/print/).

### Permissions, trust boundaries, and failure handling

- Verify Supabase tokens on protected API requests. Add database Row Level Security and private bucket policies, and check ownership explicitly when using a privileged server client. Keep administrative/service credentials and AI keys out of the APK.
- An instructor account cannot access another user's materials or reports. Selecting a role grants no cross-user privileges. University-domain restrictions and institutional identity verification require a confirmed school identity process before either can be claimed.
- Treat uploaded text, including instructions inside modules, as untrusted data. Separate it from system instructions and give generation no tool, network, or arbitrary-code privileges. Check source pointers against submitted excerpts and reject malformed or unverifiable output. An instructor must still evaluate whether the answers are correct.
- Send only the selected topic/material text and necessary anonymous generation options to the model. Exclude account identifiers and identifiable performance records. Keep raw module text and tokens out of server logs.
- Limit concurrent imports and generations per account, total provider usage, and retries. Save quota accounting so a restart cannot reset the limit. On a 429 response, show a retry state without creating an empty quiz, fabricating an explanation, or switching to a paid provider.
- Handle corrupt, password-protected, and image-only files, along with extraction that loses code layout. Give explicit responses to cancelled imports, exhausted storage, expired sessions, provider refusals, invalid output, insufficient text, connectivity loss, duplicate answers, and server restarts.
- Save data before acknowledging success. Retry cleanup of failed or orphaned uploads using paths restricted to the owner, and keep server files temporary. Quiz history, results, and documents need persistent storage.
- Define retention and deletion for accounts, materials, and history before storing campus data. Verify that a free/manual process can restore database exports and private Storage object backups.

### UX and validation approach

Use the selected components with a central theme and a readable content hierarchy. The school has not supplied branding, exact colors, or a visual identity. Do not present invented branding as official. A separate website and visual concept are outside this plan.

Check font scaling, screen-reader labels and answer announcements, and touch-target sizes on Android. Code must retain indentation and remain readable when scrolled horizontally. Test keyboard avoidance, system back behavior, and loading, error, and empty states. Selected answers must be identifiable without color alone. Shuffling options must not move controls while the user is reading.

Automate checks for rejected extraction, private-resource authorization, generation validation, answer-key integrity, difficulty transitions, dates and streaks, duplicate-safe scoring, and report/dashboard consistency. Run integration checks against an isolated Supabase environment, followed by live provider tests and physical-device checks. Mocks, builds, and screenshots alone cannot verify the live services.

## 5. Phase-by-phase roadmap

Every checkbox below is unfinished work. Release tasks remain provisional until their stated requirements are met.

### Phase 1: Test module extraction, question generation, and free services

Outcome: Document the tested technical limits using authorized samples. Keep the agreed audience and features.

Prerequisites: Separate authorization for implementation or technical investigations, plus representative modules and permitted development accounts. Creating or configuring external accounts requires separate authorization.

- [ ] Obtain representative selectable-text PDFs and `.docx` modules. Include code snippets, tables, and a longer module, and record the subjects and permitted processing conditions.
- [ ] Test the Expo/React Native/Reusables/NativeWind setup, JavaScript/JSX approach, Node runtime, build tools, and target Android devices together. Record and pin the versions that work.
- [ ] Measure PDF/DOCX extraction quality and resource use. Set supported limits and rejection messages, accounting for mixed image/text PDFs and code that depends on formatting.
- [ ] Check the Groq account's no-training terms, retention controls, free production models, structured-output support, and quotas. Evaluate samples before pinning the model.
- [ ] Ask an instructor to evaluate a small question/flashcard sample. Accepted answers must be correct and unambiguous, explanations supported, and source references valid. Reject or correct failed questions before passing the sample.
- [ ] Establish expected active users, peak concurrent generation, quiz size, and normal module size for campus use. Compare these with measured provider and storage budgets.
- [ ] Identify a suitable free Express host or authorized existing school infrastructure, and a free SMTP provider or custom school sender. Document any missing evidence. Render Free remains excluded from production hosting.

Acceptance checks: Both document formats produce text a user can review. The chosen UI components load on a physical Android device, and sample generation stays within the account's limits. Resolve all correctness errors in the accepted sample. Record the tested limits and sample size; the sample does not establish general accuracy.

Decision: Dependent work waits if extraction, UI compatibility, or primary-provider checks fail. Hosting, email, or capacity failures block campus release. Paid services, removed features, or a change to a prototype audience would require new decisions.

### Phase 2: Private accounts and trusted module import

Outcome: Each user can access only their own workspace and supported school modules.

Prerequisites: The runtime and extraction setup tested in Phase 1, plus an isolated development configuration. Keep email limitations documented until a working sender is verified.

- [ ] Create the proposed mobile/server/database structure, environment examples, schema migrations, and exact setup instructions. Keep the structure minimal.
- [ ] Implement registration, confirmation, sign-in, session restoration, sign-out, and recovery with working Android return links. Add the student and instructor profile entry screens.
- [ ] Add owner-scoped database and private Storage policies. Test API identity and ownership checks with two unrelated accounts.
- [ ] Implement PDF/`.docx` upload within the tested limits, extraction previews, subject/topic labels, ready/failed states, and private retrieval. Clean up failed or deleted files.
- [ ] Implement the agreed retention and deletion behavior. Keep privileged credentials out of the application bundle and logs.

Acceptance checks: Student A and Instructor B cannot access each other's documents by changing IDs or object paths. Reject corrupt, scanned, oversized, and unsupported files safely. Complete confirmation and recovery on Android, and verify that uploads survive an API restart and reauthentication.

Release requirement: Verify custom email delivery and personal-data retention/deletion before onboarding campus users.

### Phase 3: Generate, complete, and score a quiz

Outcome: Either role can generate a quiz from a module or topic, complete it with immediate explanations, and save the scored session.

Prerequisites: Private accounts and module imports, an approved model, and tested extraction limits.

- [ ] Define the question schema, source references, public question payload, protected answer key, quiz configuration limits, and state transitions for generation and attempts.
- [ ] Implement Groq requests and context selection within the tested limits. Add schema and content checks, saved generation status, duplicate-request protection, and handling for quotas, refusals, and timeouts.
- [ ] Implement ordinary and code-snippet multiple choice, instructors' personal previews, answer submission, immediate explanations, final results, and attempt resumption.
- [ ] Save answers and completion effects atomically. Make retries idempotent and exclude the answer key from question payloads sent before the student answers.
- [ ] Test incorrect option mapping, duplicate submissions, incomplete output, invalid source references, expired identity, prompt injection, and unauthorized access.

Acceptance checks: Complete a module quiz and a topic quiz on Android. Verify that answers and explanations match the saved keys and that repeated requests do not duplicate results. Network interruptions, provider 429 responses, and API restarts must leave a recoverable state with an accurate message. An instructor can prepare a personal quiz without publishing it.

Decision: Revise or reject the generation approach if representative questions remain incorrect or the token budget cannot support the documented quiz size. Keep Gemini disabled until its separate content-use requirements are met.

### Phase 4: Adaptive practice and flashcard review

Outcome: Practice difficulty responds to performance, and flashcards support technical-term review.

Prerequisites: Stable question/answer interfaces and saved attempts.

- [ ] Implement the documented difficulty transitions and selection from the limited question pool, without making a provider request for each answer.
- [ ] Generate and save personal technical-term flashcards from the approved sources, with output validation. Implement flipping cards and completing reviews.
- [ ] Use saved answers to recommend weak topics. Explain the recommendations and show when history is insufficient.
- [ ] Test difficulty limits, mixed correct/incorrect sequences, exhausted question pools, restart/resume consistency, empty flashcard sets, and repeated review-completion requests.

Acceptance checks: Controlled answer sequences change difficulty as documented, and resumed attempts preserve that state. Flashcards reveal the correct back text, and completing a review counts once. Reproduce recommendations from the saved answers.

Decision: If generating the question pool exceeds free limits, revise its size or selection strategy and test again. Adaptive difficulty stays in scope.

### Phase 5: Explain progress and export a personal report

Outcome: Users can view consistent scores, streaks, practice estimates, and reports of strengths and weaknesses.

Prerequisites: Correctly saved completed attempts and review events.

- [ ] Build the student dashboard and personal progress views. Show subject/topic scores, sample counts, trends, streaks, and explanations of mastery estimates.
- [ ] Implement the shared reporting query and Android PDF export. Escape untrusted text and test Android save/share behavior.
- [ ] Test empty history, sparse samples, repeated completion, timezone boundaries/changes, and agreement between reports and the dashboard.
- [ ] Check large fonts, screen-reader announcements, touch targets, code readability, system-back navigation, and error states throughout the review flow.

Acceptance checks: Report totals match the same user's dashboard for the same data range. Empty history produces no invented strengths claim. Streaks remain correct in midnight and duplicate-event tests. Export a PDF and check that it opens and is readable on Android.

Release requirement: Have instructors and users evaluate practice estimates and recommendations before making claims about learning benefits.

### Phase 6: Validate the installed application for campus use

Outcome: A signed, installable Android application with tested services and documented operating limits.

Prerequisites: Earlier acceptance checks, suitable free API hosting and SMTP, measured capacity, and implemented retention/deletion and backup decisions. This phase remains provisional until those requirements are met.

- [ ] Configure authorized free services and secrets, deploy the API and database policies, and test confirmation/recovery emails and Android links with the live services.
- [ ] Build and install a signed APK on representative physical Android devices. Verify distribution eligibility, safe installation instructions, signing-key custody, and an update path.
- [ ] Test both roles against live Supabase and Groq. Cover import, generation, answers, resumption, flashcards, dashboard, report export, sign-out, recovery, and denied access to other users' resources.
- [ ] Test the measured concurrent generation load, cold starts, exhausted quotas/storage, host/database restart or pause recovery, and lost connectivity. Verify that scores are not duplicated and material remains private.
- [ ] Export the database and private objects, then restore them into an isolated environment. Verify account/resource ownership after restoration, and record who handles backups and how often.
- [ ] Evaluate quiz correctness and usability with representative students and instructors. Compare findings with the overview's intended outcomes and update the affected rules here.
- [ ] Document operating limits, monitoring, provider/model maintenance, manual recovery, remaining defects, and the evidence supporting the release decision.

Acceptance checks: Provide evidence for every observable success criterion. Complete the live flow on a physical device and verify that service limits support the agreed campus workload. Resolve privacy, ownership, data-loss, email, signing, and critical correctness failures before release. A successful build alone does not meet these requirements.

Release decision: If free infrastructure cannot support the intended workload or availability, keep campus rollout blocked. Present a specific alternative within the budget or request a change to the constraint. An unsuitable evaluation host cannot be used as the campus service.

## 6. Dependencies, remaining uncertainties, and next step

### Ordering and independent work

Phase 1 tests the runtime, extraction, provider, and capacity assumptions. Phase 2 needs the tested runtime/extraction setup. Phase 3 needs working ownership checks and defined source/quiz interfaces. Phase 4 depends on stable answer behavior; Phase 5 depends on the rules for completed attempts and reviews. Phase 6 requires all product acceptance checks and external service requirements to pass.

Report layout and flashcard presentation can be developed independently once the Phase 2 ownership interface and Phase 3 question/report formats are fixed. Both use the same mobile navigation, Reusables components, NativeWind tokens, migrations, and API payloads, so assign ownership of those shared files before parallel work. This plan requests no parallel agent work or ticket creation.

### Unresolved requirements and evidence needed

| Gate | Evidence required | Blocks |
|---|---|---|
| Module extraction | Representative PDF/`.docx` samples, supported limits, code/table fidelity and memory/time measurements | Import and source-grounded generation |
| Toolchain | One working Android build with the chosen Expo/Reusables/NativeWind versions and documented JS/JSX setup | Mobile implementation baseline |
| Primary AI | Actual free model availability/quotas, accepted retention settings, instructor-checked sample output | AI-dependent features |
| Gemini alternative | Explicit acceptance of unpaid content-use terms for the actual materials and a separate quality/schema check | Gemini enablement only; Groq work continues |
| Hosting | A free host or existing authorized school server suitable for intended use, measured extraction/API behavior and restart recovery | Campus release; Render Free remains evaluation-only |
| Account email | Authorized free sender, delivery quotas, confirmation/recovery on Android, and sender/return-link configuration | Real onboarding and recovery |
| Capacity | Campus usage expectations compared with measured token/storage/email/host limits | Claiming suitability for campus rollout |
| Retention and recovery | Documented account/material/history deletion semantics plus verified database and file restoration | Storing real campus data and release |
| Android distribution | Actual target devices, signing custody, installation/update path, and current distribution requirements | APK release |
| Educational quality | Instructor evaluation and student usability evidence against the overview; record sample and limitations | Release claims and acceptance |

After separate implementation authorization, start Phase 1 with representative authorized PDF/`.docx` samples and permitted development accounts. Test extraction and generate one valid, instructor-checked quiz through the free Groq account. Verify toolchain compatibility and document the hosting/email gaps before scaffolding the rest of the application.

The plan covers all six selected overview features, adaptive difficulty, recommendations, both audiences, and every confirmed clarification in its scope, behavior, phases, and acceptance checks. Implementation, account provisioning, runtime tests, builds, deployment, and learning-outcome validation have not been performed during this planning task.
