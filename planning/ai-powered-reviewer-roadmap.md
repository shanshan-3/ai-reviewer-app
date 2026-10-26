# AI-Powered Interactive Reviewer: implementation plan and roadmap

## 1. Status, goal, and success criteria

Status: Local starters are running; product features and Phase 1 validation remain pending. The agreed scope is unchanged. Campus release still requires verified free hosting, authentication emails, AI quotas, and the app's behavior with school modules.

Planning date: 2026-10-15.

Status updated: 2026-10-22 (Expo development client installed and Android development build instructions added; MVC with a service layer grouped by responsibility remains selected; no new device validation).

Setup reference: the [installation guide](../docs/installation.md) explains contributor setup after cloning, including local configuration, startup, and checks. The [development page](../docs/development.md) links to the project guides. The [folder guide](../folder-structure.md) separates existing files from planned additions.

Android development uses the RebyuIT Dev APK, a project-specific development build that loads JavaScript through Metro. Expo Go is an optional preview limited to its bundled native libraries. JavaScript and styling edits do not require a new APK; native library, Expo SDK, and native configuration changes require rebuilding. The release APK for users is built separately and runs without Metro. See the [workflow comparison](../docs/installation.md#4-choose-how-to-run-the-android-app) and [Expo's explanation](https://docs.expo.dev/develop/development-builds/faq/).

The [cleanup guide](../docs/RebyuIT_Android_Dev_Cleanup_Guide.md) covers removing local Android tools. A compatible Dev APK already installed on a phone can keep loading JavaScript over the network. Future native builds require restored local tools or configured EAS cloud builds; EAS profiles remain planned. These instructions add no build, installation, or device-validation evidence.

Source: [AI_Powered_Reviewer_Overview.md](../AI_Powered_Reviewer_Overview.md), with the decisions from Q1-Q26 and the selected MVC design below. See the [domain glossary](../GLOSSARY.md) and [private preparation decision](../docs/adr/0001-private-independent-preparation.md). MVC with a service layer is agreed; feature implementation and API interfaces remain planned.

### Completed starter setup

- The mobile app has a JavaScript/JSX Expo SDK 57 starter with Router, NativeWind, Reusables configuration, a fixed color palette, and aliases. The shared screen background is `#F8F8FF`; the app does not switch appearance with the device theme. No Reusables UI components have been copied yet.
- `expo-dev-client ~57.0.20` is installed for SDK 57. The installation guide now covers the first Android development build and later Metro sessions. Native compilation, APK installation, and device behavior remain unverified. Lint and JavaScript type checks passed after installation; Expo Doctor passed 20/21 checks, with the compatibility check flagging newer patches for the existing `expo`, `expo-router`, and `expo-sharing` packages, which were left unchanged.
- Express runs locally with `GET /health`, returning HTTP 200 and `{"status":"ok"}`. The server has start and watch commands. Its starter test folder and test command were removed at the user's request.
- Mobile lint, JavaScript type checks, SDK compatibility, Expo Doctor (21/21), and an Android bundle export passed. The server dependency check and a fresh startup/health check also passed. These checks do not establish physical-device behavior or live service integration.
- Both applications have manifests, lockfiles, environment examples, and local environment files. The root ignore rules protect local credentials and dependencies. Supabase and Groq clients, database migrations, authentication flows, and feature APIs are not implemented. Live services, extraction, device behavior, and deployment remain unverified.

The goal is an installed Android review application for BSIT students and IT instructors at Pangasinan State University, Asingan Campus. Students and instructors prepare independently using school modules or IT topics. The app generates practice questions and explanations, provides flashcards, and tracks each user's progress. All operating services must remain free.

### Observable success criteria

1. A student or instructor can install the Android APK, create an account, sign in, recover access, and return to their own saved material and history.
2. A user can import a selectable-text PDF or `.docx` module, verify extracted text, and generate a quiz from the supported content or a selected IT topic.
3. Users choose conceptual or coding-syntax multiple choice, 5 or 10 questions (default 10), and an initial difficulty (default medium). Each new study session generates a fresh quiz; interrupted sessions resume their existing quiz. Saved-quiz retakes and mixed question types are excluded.
4. Each accepted answer receives immediate corrective feedback. The app saves results, scores, and subject/topic diagnostics without counting duplicate submissions.
5. Difficulty moves one level after two consecutive correct or incorrect answers. Topic practice estimates show percentage correct over the latest 20 first-submission answers, with a five-answer minimum and sample counts. Recommendations suggest weak topics; users choose what to study next.
6. Flashcards support front/back review. The dashboard shows scores, study streaks, and subject/topic practice estimates. Users can view an in-app performance report based on the same data.
7. One user's documents, generated content, answers, and reports remain inaccessible to another user, including instructors. Confirmed module deletion removes its source and derived content/results, then recalculates affected progress and streaks; capacity limits block uploads without automatically deleting retained data.
8. Physical Android testing verifies document import, code readability, interrupted sessions, registration without email confirmation, password recovery by email code, in-app reports, and service-error behavior.
9. Before release, an instructor checks representative module questions for correct answers, support in the source material, and clear wording. A working app alone does not establish educational effectiveness or examination readiness.

### Uncertainty map

| Category | Current position |
|---|---|
| Settled: verified facts | The overview defines six selected features, adaptation, recommendations, and a student review flow. Mobile and Express starters now exist, and the local checks listed above passed. Official service documentation was checked during planning; live account availability, service behavior, and physical-device behavior remain unverified. |
| Settled: user decisions | Q1-Q26: private independent preparation, Android only, free services, selected stack, authorized modules, supported formats, quiz settings and source support, fresh sessions/resumption, adaptation, practice estimates, personal labels, study days, online study, registration, retention, recommendations, and deletion. MVC with a service layer, grouped by responsibility, was selected on 2026-10-21. See the decision details and behavior rules below. |
| Questions | No further product question is required to draft this roadmap. Gemini-specific content-use approval remains conditional. Any scope change discovered during validation must be recorded here before dependent implementation. |
| Still unclear | Representative module sizes/content, expected active/concurrent users, free hosting suitability, authentication sender availability, actual provider/model quotas and provider retention controls, and supported physical Android devices. Expo SDK 57 is the local baseline; the full stack still needs device validation. Subject/topic labels are personal; an official curriculum catalog is not required. |
| Excluded | Instructor publishing and shared quiz libraries; classes, assignments, grading, and access to other students' results; iOS, browser and desktop clients; OCR, scanned documents, `.doc`, PowerPoint and photo imports; typed code exercises and code execution; mixed question types; saved-quiz retakes; paid service upgrades; offline answering and synchronization; ticket creation. |

## 2. Scope

### Included

- Secure accounts and profiles for students and instructors, with one shared account type, registration flow, and private resources. Instructors use their accounts for personal preparation and cannot access students' accounts.
- Importing authorized school modules as selectable-text PDF and `.docx`, with personal subject/topic labels that users create, choose, and reuse, and an extraction preview.
- Configuring and generating IT quizzes from a module or selected topic. Label topic-only output as AI-generated general review; it cannot claim support from an uploaded module or the official curriculum.
- Multiple choice for conceptual and coding-syntax questions, including snippets asking about syntax, errors, or output.
- Immediate explanations, adaptive difficulty, diagnostic results, optional weak-topic recommendations, and saved practice history. Generation and answering require internet; interrupted sessions resume after reconnecting.
- Fresh quizzes for new study sessions, source-supported module questions, and confirmed deletion of a module and its derived study content/results. Modules and history have no automatic expiry; at capacity, block new uploads and explain the limit.
- Technical-term flashcards, student progress dashboard, study streaks, subject/topic practice estimates, and performance reports.
- Viewing personal performance reports on the device. Report downloads and exports are excluded. Exporting instructor quizzes is excluded.
- Android APK delivery and checks of network behavior, devices, accounts, and services.

### Excluded and scope interpretation

The exclusions in the uncertainty map apply to every phase. Scope follows the overview. Classroom-management additions, a shared content library, instructor approval queues, student surveillance, and a separate administrative application are excluded.

Instructors use the same personal import, generation, preview, and practice functions. They do not publish quizzes to students. Each user's content remains separate, even when students and instructors use the same source module.

The app is intended for campus use. Free-tier evaluation must establish whether the services can support ongoing use; it does not change the target to an academic prototype.

## 3. Decisions and rationale

### Technology stack

| Part | Technology | Status |
|---|---|---|
| Android application | React Native + Expo | SDK 57 starter configured; device validation pending |
| Language | JavaScript / JSX | Used in the starters |
| UI components | React Native Reusables | Configuration ready; components not yet added |
| Styling | NativeWind | Version 4.2.7 configured with one fixed palette and a `#F8F8FF` screen background; device rendering unverified |
| Interface icons | Tabler React Native + react-native-svg | Direct named outline icons integrated in the authentication screens; Android rendering unverified |
| Backend API | Node.js + Express | Local starter and health endpoint running |
| Application design | MVC with a service layer, grouped by responsibility | Selected; routes, controllers, services, and models folders not implemented |
| Database | Supabase PostgreSQL | Selected |
| Authentication | Supabase Auth | Selected |
| Private module storage | Supabase Storage | Selected |
| AI question generation | Groq API | Primary provider; SDK installed, integration pending |
| Alternative AI | Gemini API | Conditional on approved data-use terms |
| PDF text extraction | PDF.js | Library installed; extraction approach still requires validation |
| Word `.docx` extraction | Mammoth | Library installed; extraction approach still requires validation |
| Document selection | Expo DocumentPicker | Installed; import behavior unverified |
| Backend hosting | Free hosting or existing school infrastructure | Undecided |

Current dependency versions are recorded in the application manifests and lockfiles. Local checks passed for the starter baseline. Physical-device compatibility and the planned feature integrations still need testing.

### Decision details

| Decision | Basis | Rationale and consequence |
|---|---|---|
| Use the overview as the feature baseline | User-confirmed, Q2 and Q7 clarifications | Preserve the stated review features and intended campus audience. User count and service reliability requirements were not specified. |
| Serve both students and instructors | User-confirmed, Q1 B; shared account type confirmed on 2026-10-25 | Use the same registration flow and private preparation functions for everyone. |
| Independent preparation; no instructor-published library | User-confirmed, Q12 B | Instructors prepare their own quizzes; students generate theirs independently. |
| Installed Android application only | User-confirmed, Q5 A and Q6 A | Replaces the initial browser-based React/Vite proposal. No web frontend is planned. |
| React Native + Expo | Delegated, Q3 A; refined following platform decision | Use the React ecosystem for Android development and APK generation. |
| React Native Reusables + NativeWind | User-confirmed, Q8 | Reuse editable component source and consistent styling. Paper and gluestack remain alternatives and will not be installed alongside Reusables. |
| JavaScript ecosystem; JavaScript/JSX application code | Delegated, Q3 A | Keep the proposed language choice. Test the Reusables/template setup in Phase 1. If generated component templates require a language change, document that decision explicitly. |
| Node.js + Express API | Delegated, Q3 A | Keep extraction, secrets, question generation, and authoritative scoring on the server. |
| MVC with a service layer, grouped by responsibility | User-confirmed, 2026-10-21 | React Native screens provide the view; Express uses separate routes, controllers, services, and models folders. Controllers handle HTTP, services apply business rules, and models access Supabase. Keep one Express application and add files as features are implemented. |
| Supabase PostgreSQL, Auth, and private Storage | Delegated, Q3 A | Reuse managed accounts and persistent storage. Use SQL migrations and Supabase clients; no ORM or second database is currently justified. |
| Free services only | User-confirmed, Q4 A | No automatic paid upgrade or paid fallback when quotas are reached. Verify availability and capacity before release. |
| Groq primary; Gemini conditional alternative | User-confirmed, Q10 clarification | The user permits external processing of school modules. Gemini needs separate acceptance of its content-use terms. Switching providers must be explicit. |
| Intended users are 18+ | User-confirmed, Q9 A | Record as an eligibility constraint. Revisit the provider decision if the audience changes. |
| Selectable-text PDF and `.docx` | User-confirmed, Q11 | Extract text without OCR. Reject image-only, corrupt, encrypted/unsupported documents with an actionable explanation. |
| Coding questions use multiple choice | User-confirmed, Q13 A | Code snippets are displayed as text and checked against a saved answer key; no runtime or sandbox is needed. |
| Email/password self-registration with one shared account type | User-confirmed, Q22; role selection and signup email confirmation removed on 2026-10-25 | Registration collects full name, email, and password without a student/instructor role or email confirmation. It does not verify email ownership or university membership. Password recovery still requires working email delivery. |
| Password recovery by email code | User-confirmed on 2026-10-25 | Use three screens: Verify Email requests a code, OTP verifies the six-digit code, and Set Password saves the new password using the recovery session. Registration has no email confirmation step. No recovery link or callback route is required. |
| Internet required for generation and answering | User-confirmed, Q21 | Resume interrupted sessions after reconnecting. No offline answer queue or synchronization. |
| Explain answers from pre-generated, validated content | Delegated technical approach | Generate explanations with the questions so feedback does not require a new AI call for every answer. |
| Module-based answers and explanations need source support | User-confirmed, Q14 | Keep supporting excerpts/references. Return fewer questions when evidence is limited, or an insufficient-source state when none are usable. Topic-only general review remains available and separately labeled. |
| Fresh quiz per new study session; resume interruptions | User-confirmed, Q15 | Preserve completed history and resume the same interrupted quiz. Do not offer saved-quiz retakes. |
| Mastery is a practice estimate | User-confirmed, Q16 and Q18 | Percentage correct over the latest 20 first-submission answers per topic; require five answers and show the sample count. This does not establish exam readiness. |
| Rule-based adaptive difficulty | User-confirmed, Q17 | Start at the selected level, default medium. Two consecutive correct answers move up one level; two consecutive incorrect answers move down. Reset the counter after a change and stay within easy/medium/hard. |
| Personal subject/topic labels | User-confirmed, Q19 | Users create, choose, and reuse labels. No fixed official PSU curriculum catalog or coverage claim. |
| Completed study activities determine study days | User-confirmed, Q20 | A completed quiz or viewing every card back in a set that day qualifies. Use the device timezone initially and preserve recorded completion dates. |
| Retain data until user deletion; block uploads at capacity | User-confirmed, Q23 | No automatic expiry or deletion to recover space. Explain capacity limits to the user. |
| Fixed quiz choices | User-confirmed, Q24 | Choose 5 or 10 questions, default 10; easy/medium/hard starting difficulty, default medium; conceptual or coding-syntax MCQ, default conceptual. No mixed question types. |
| Recommendations remain suggestions | User-confirmed, Q25 | Users choose the next topic. Do not override selected material/topics or automatically generate the next quiz. |
| Module deletion removes derived content and results | User-confirmed, Q26 | Confirm the loss, delete the original and extracted source, derived quizzes, flashcards, and study session results, then recalculate affected progress and streaks. |

### Verified technical evidence and constraints

- Reusables copies component source into the project and supports NativeWind/Uniwind. Use NativeWind and add only the components needed. The source is MIT-licensed. [Introduction](https://github.com/founded-labs/react-native-reusables/blob/main/apps/docs/content/docs/index.mdx), [repository and license](https://github.com/founded-labs/react-native-reusables).
- Expo supports directly installable Android APKs and a limited free cloud-build allowance. Distribute an APK initially. Before release, check account eligibility, installation requirements, signing, and applicable Android distribution rules. Play Store publication has not been required or confirmed free. [APK builds](https://docs.expo.dev/build-reference/apk/), [distribution](https://docs.expo.dev/build/internal-distribution/), [plans](https://docs.expo.dev/billing/plans/).
- Supabase provides PostgreSQL, Auth, and Storage. When checked for this plan, the free plan listed a 500 MB database, 1 GB file storage, 5 GB egress, inactivity pausing, and no automatic backups. Test application capacity against those allowances and establish manual database and file recovery before campus use. [Architecture](https://supabase.com/docs/guides/getting-started/architecture), [pricing](https://supabase.com/pricing).
- Password recovery needs an authorized email sender with suitable delivery quotas. Supabase's default SMTP service is restricted to project-team addresses and is unsuitable for campus recovery. Verify a free provider or an existing school sender, including sender authorization and recovery-code delivery. When authentication is connected, disable signup email confirmation and configure the Reset Password template to send `{{ .Token }}` instead of a recovery link. These are planned Auth settings, not database migrations or verified live configuration. [Auth email requirements](https://supabase.com/docs/guides/auth/auth-smtp), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [password authentication settings](https://supabase.com/docs/guides/auth/passwords).
- Render Free runs Node services, but its documentation advises against production use. It sleeps after 15 minutes of inactivity, may take about a minute to wake, and loses local files on restart. It remains a candidate for evaluation only. Campus release requires a suitable free Express host or authorized existing school infrastructure. [Render Free limitations](https://render.com/docs/free).
- Groq's agreement disallows training on inputs/outputs without the customer's permission. Its documentation describes retention conditions and Zero Data Retention. Check the controls on the actual account and enable the agreed setting before processing school modules. Claims about provider access and retention must reflect those conditions. [Services agreement](https://console.groq.com/docs/legal/services-agreement), [data controls](https://console.groq.com/docs/your-data).
- Groq free quotas are shared across the organization. Select and pin an available production text model after checking structured-output support, account limits, and educational quality. Schema compliance alone cannot establish answer correctness. [Rate limits](https://console.groq.com/docs/rate-limits), [structured outputs](https://console.groq.com/docs/structured-outputs).
- Gemini's unpaid services use submitted content/responses for product improvement and may involve human review. They prohibit submitting sensitive, confidential, or personal information. Permission for external processing does not cover this additional use automatically. Keep Gemini disabled unless its terms fit the authorized materials. [Gemini terms](https://ai.google.dev/gemini-api/terms), [free-tier availability](https://ai.google.dev/gemini-api/docs/pricing).

## 4. Implementation plan

### User flows

Students and instructors install the APK, self-register with full name, email, and password using one shared account type, sign in, and open their workspace. They select a saved personal module, import a supported file, or choose an IT topic, then configure a fresh quiz using the confirmed settings below. Each answer receives immediate feedback while online. After the quiz, users see results and suggested weak topics; they choose what to study next and can review progress, flashcards, and their personal report.

Registration will not require email confirmation. For a forgotten password, the user enters their address on Verify Email (`verify-email.jsx`), verifies the six-digit code on OTP (`otp.jsx`), then sets a new password on Set Password (`set-password.jsx`). The password update requires the recovery session established by code verification. Finish recovery before opening Dashboard. A mistyped address at signup can prevent recovery because email ownership is not checked during registration. Only login and registration routes currently exist; the recovery screens and service connections remain planned.

Instructors use the same registration and sign-in screens as students. In their personal preparation workspace, they import a module or select a topic to generate and inspect quizzes or flashcards. They can also practice the quizzes. They cannot publish or assign them, or access student histories.

For module imports, the server checks the selected file's type and size limit, stores it privately, and extracts plain text. The user previews the text and its subject/topic. Mark the material ready only if it contains meaningful text; a `.docx` extension alone does not establish validity. Warn about image-dependent diagrams and formatting-dependent code, or exclude them from generated questions. Mixed PDFs must not appear to support OCR.

When the user submits a source and quiz options, create a generation record with a client request identifier. Extract or select relevant text within the configured limits, call the approved provider, and validate its response and source references before saving a complete quiz. Show whether the quiz is ready, the source is empty or insufficient, generation failed, or a quota was reached. Reopening a request returns its saved status. If a restart leaves the outcome uncertain, show a failure and require a deliberate retry. Provider execution cannot be guaranteed exactly once.

For a study session, save the question sequence and answer key on the server. Send the current question without its answer, accept one answer per question in that session, then save the result and return the explanation. Select the next difficulty from the result. Finalize the session once and calculate its totals. Retrying a lost response must not count scores or streaks twice. After reconnecting, the user can resume the same interrupted quiz even if the app was closed; starting a new session generates a fresh quiz and preserves completed history.

For module deletion, show a confirmation naming the module and warning that its generated quizzes, flashcards, and study session results will also be lost. Delete the original file, extracted source, and derived content/results, then recalculate affected progress and streaks. Keep unrelated topic-only content and other users' resources intact.

### Behavior rules

- Offer 5 or 10 questions (default 10), easy/medium/hard starting difficulty (default medium), and conceptual or coding-syntax multiple choice (default conceptual). A quiz uses one question type only. Test both count options and both types against the provider budget; feasibility failures require an explicit decision rather than silently changing these settings.
- Generate a bounded question pool covering easy, medium, and hard levels for the chosen topic/module, within the tested token budget. Start at the user's selected level. Two consecutive correct answers move up one level; two consecutive incorrect answers move down one level. Reset the counter after each change and clamp to easy/medium/hard. If that level has no unused question, select the nearest available level and record the difficulty used. Preserve adaptation state on resume. This avoids an AI request for each answer.
- Keep semantic question identifiers and the original answer key. When shuffling options, preserve the correct option's identifier. Check answers against that stored identifier without asking the AI to score them.
- Show AI-authored explanations for incorrect answers and identify the correct option. Every module-based correct answer and explanation must be supported by the uploaded module. Keep supporting excerpts and PDF page or DOCX section/paragraph references when available. Generate fewer questions if support is limited, or show insufficient source if none are usable. Module-based coding questions require usable code in the source; do not silently switch types. Topic-only conceptual or coding review remains available for the selected IT topic, clearly labeled without invented module citations.
- Generate front/back flashcards for technical terms from the same supported sources. A flashcard review qualifies for a study day only after the back of every card in the set has been viewed at least once that day. Empty sets and partial reviews do not qualify. Spaced repetition and a separate scheduling algorithm are excluded from this version.
- Show overall scores, accuracy by subject/topic, answer counts, and trends over time. The practice estimate is percentage correct among the latest 20 first-submission answers per topic. Show insufficient data before five answers and the actual sample count thereafter. Use eligible estimates to suggest weak topics, without changing the user's topic/material or automatically generating a quiz. Subject mastery is a practice estimate, not validated examination readiness.
- Count one study day per calendar date with a completed quiz or qualifying flashcard review. Opening the app and incomplete activity do not count. Use the device timezone initially, save the completion date, and preserve historical dates when the device timezone changes. No manual timezone setting is required.
- Personal reports use the same saved data as the dashboard to summarize scores, activity, subject/topic estimates, strengths, weaknesses, and sample sizes. Reports must show when history is empty or too sparse for conclusions.
- Require an IT topic within the input length limit and a subject label. Users create, choose, and reuse their own labels consistently. Reject unsupported or insufficient context; do not claim an official PSU syllabus or require a fixed curriculum catalog.
- Keep modules and practice history until the user deletes them, without automatic expiry. At capacity, block new uploads and explain the limit. Confirmed module deletion removes original/extracted source and derived quizzes, flashcards, and study session results, then recalculates affected progress and streaks.

These product rules were confirmed in Q14-Q26. They still need implementation and evaluation with representative students and instructors; confirmation does not establish educational validity. Record any agreed material change before changing the behavior.

### Architecture and remaining files

Use the existing repository with its mobile starter, Express starter, and planned Supabase integration. Reuse the configured libraries and platform functions. The folder guide records which files already exist; the table below describes the intended responsibilities as features are added.

Use MVC with a service layer, grouping server files by responsibility under `server/src/`: `config/`, `routes/`, `controllers/`, `services/`, `models/`, and `middleware/`. Use camelCase names that identify the feature, such as `quizRoutes.js`, `quizController.js`, `quizService.js`, and `quizModel.js`. The folder guide lists the planned files for profiles, labels, materials, quizzes, flashcards, and progress.

| Part | Responsibility |
|---|---|
| View | React Native screens directly in `mobile/src/app/`, with shared UI in `components/`. Mobile `lib/` helpers call the API and handle public Supabase authentication. |
| Routes | Files in `routes/` bind HTTP methods and paths to authentication middleware and controller functions. |
| Controller | Files in `controllers/` read the authenticated identity and input, validate request shape, call the service, and send a safe response. |
| Service | Files in `services/` apply business rules and ownership checks; coordinate extraction, AI generation, scoring, adaptation, and progress calculations. |
| Model | Files in `models/` perform owner-scoped database/private Storage operations through the server Supabase client, including atomic database functions. |

```text
React Native screen -> mobile API helper -> Express route + auth middleware
                    -> controller -> service -> model -> Supabase
```

Return the result through those layers as safe JSON. Express serves the API; no server-rendered `views/` folder or separate mobile controller/model hierarchy is needed. Keep settings and server clients in `config/`, request/output checks in `validation/`, and extraction, generation, prompts, and calculation helpers in `services/`. Shared usage limits and error definitions remain in `lib/`. Keep business rules out of controllers and database access out of mobile screens and server controllers; mobile Supabase use is limited to public authentication/session handling.

Use plain JavaScript functions and add files only when they contain implementation. Begin Phase 2 with one authenticated own-profile read through all layers before expanding the pattern. In Phase 3, trace an answer submission from its quiz screen through the controller, scoring service, and model's atomic database operation, returning feedback without exposing unanswered keys. No generic base classes, repository wrappers, empty forwarding functions, or new architecture dependency is required.

| Area | Responsibility |
|---|---|
| `mobile/` | Expo application, shared registration and sign-in screens, import, quiz, flashcards, progress, reports; requested Reusables components and NativeWind theme |
| `server/` | Auth verification, private-resource checks, extraction, AI generation, answer submission, result aggregation, limits, cleanup |
| `supabase/migrations/` | Versioned SQL schema, owner policies, storage policies, uniqueness constraints, atomic answer/finalization operations |
| Feature verification | Answer/adaptation rules, extraction fixtures, authorization, duplicate submissions, and critical screen behaviors. No automated server test folder currently exists. |
| Setup documentation and environment examples | Existing installation guides and placeholder examples cover the starters. Add feature-specific setup, deployment, and recovery instructions as those capabilities are implemented; keep secrets out of documentation. |

Add remaining files when their feature work needs them. A generic repository framework, provider plug-in system, message broker, vector database, and separate administrative app are outside the planned work.

The backend uses authenticated requests and a consistent JSON format for success and error responses. It needs operations to import, check, and delete personal material; request and read generation results/status; start, read, and resume study sessions; submit answers; read personal results, progress, and report data; and create, read, and review personal flashcards. Check ownership for every identifier. Configure the provider on the server, outside ordinary user controls.

Store profiles, materials and extracted sections, generation records, quizzes and questions, study sessions and answers, and flashcard sets and review completions. Each resource needs an owner ID. Calculate subject/topic summaries from answers until performance measurements justify caching them. Save the provider/model, source identity, and generation settings with generated content so deletion can identify all dependencies. Module deletion removes its original/extracted source and derived study content/results, then recalculates affected estimates and streaks from remaining activity. Keep unrelated topic-only history intact. Do not retain deleted module evidence merely to preserve historical scores.

Evaluate PDF.js for PDF extraction and Mammoth's raw-text API for `.docx` on the selected Node runtime. Use Phase 1 samples to set file-size, page-count, extracted-text, decompressed-DOCX, processing-time, and memory limits. Enforce those limits; if a library cannot, isolate extraction in a worker/process that can be terminated. Render no raw DOCX-generated HTML and fetch no links embedded in modules. [PDF.js](https://mozilla.github.io/pdf.js/getting_started/), [Mammoth raw text and security guidance](https://github.com/mwilliamson/mammoth.js).

Use Expo DocumentPicker for import and check that the selected file is readable before uploading it. Its cache-copy option affects FileSystem access. [DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/).

### Permissions, trust boundaries, and failure handling

- Verify Supabase tokens on protected API requests. Add database Row Level Security and private bucket policies, and check ownership explicitly when using a privileged server client. Keep administrative/service credentials and AI keys out of the APK.
- Each account can access only its own materials and reports. Students and instructors use one shared account type without cross-user privileges. University-domain restrictions and institutional identity verification require a confirmed school identity process before either can be claimed.
- Treat uploaded text, including instructions inside modules, as untrusted data. Separate it from system instructions and give generation no tool, network, or arbitrary-code privileges. Check source pointers against submitted excerpts and reject malformed or unverifiable output. An instructor must still evaluate whether the answers are correct.
- Send only the selected topic/material text and necessary anonymous generation options to the model. Exclude account identifiers and identifiable performance records. Keep raw module text and tokens out of server logs.
- Limit concurrent imports and generations per account, total provider usage, and retries. Save quota accounting so a restart cannot reset the limit. On a 429 response, show a retry state without creating an empty quiz, fabricating an explanation, or switching to a paid provider.
- Handle corrupt, password-protected, and image-only files, along with extraction that loses code layout. Give explicit responses to cancelled imports, exhausted storage, expired sessions, provider refusals, invalid output, insufficient text, connectivity loss, duplicate answers, and server restarts.
- Save data before acknowledging success. Retry cleanup of failed or orphaned uploads using paths restricted to the owner, and keep server files temporary. Quiz history, results, and documents need persistent storage.
- Implement the confirmed no-expiry and module-deletion policy before storing campus data. Document account/history deletion operations. Verify that a free/manual process can restore database exports and private Storage object backups without silently reintroducing deleted content or results.

### UX and validation approach

Use the selected components with a central theme and a readable content hierarchy. The school has not supplied branding, exact colors, or a visual identity. Do not present invented branding as official. A separate website and visual concept are outside this plan.

Check font scaling, screen-reader labels and answer announcements, and touch-target sizes on Android. Code must retain indentation and remain readable when scrolled horizontally. Test keyboard avoidance, system back behavior, and loading, error, and empty states. Selected answers must be identifiable without color alone. Shuffling options must not move controls while the user is reading.

Verify controller input validation and safe responses, service business rules, and model persistence/ownership, including one complete route-to-database flow. Automate checks for rejected extraction, private-resource authorization, generation validation, answer-key integrity, difficulty transitions, dates and streaks, duplicate-safe scoring, and report/dashboard consistency. Run integration checks against an isolated Supabase environment, followed by live provider tests and physical-device checks. Mocks, builds, and screenshots alone cannot verify the live services.

## 5. Phase-by-phase roadmap

Checked items below record completed setup, authentication UI, or migration-preparation substeps. The original phase tasks remain unchecked because their full acceptance checks have not passed. No full phase is complete. Release tasks remain provisional until their stated requirements are met.

### Phase 1: Test module extraction, question generation, and free services

Outcome: Document the tested technical limits using authorized samples. Keep the agreed audience and features.

Prerequisites: Representative modules and permitted development accounts for the remaining checks. Local starter setup has already been carried out under the user's instructions. Further external account creation or changes need explicit instructions.

- [x] Configure the mobile/server starters, manifests, lockfiles, environment examples, and contributor installation instructions. This completes local setup only.
- [x] Add the Expo SDK 57 development-client dependency and document Android build/start commands. Native build and installation remain unverified.
- [x] Install Tabler React Native with Expo-compatible SVG support and use direct named imports in the authentication screens. Android rendering remains unverified.

- [x] Obtain representative selectable-text PDFs and `.docx` modules. Include code snippets, tables, and a longer module, and record the subjects and permitted processing conditions.
- [x] Verify the configured Expo SDK 57/React Native/Reusables/NativeWind setup on target Android devices. The JavaScript/JSX starter, Node runtime, dependency checks, and Android bundle export have passed locally; copied UI components and device behavior still need validation. Record the device results alongside the locked versions.
- [x] Measure PDF/DOCX extraction quality and resource use. Set supported limits and rejection messages, accounting for mixed image/text PDFs and code that depends on formatting. [Local validation](../docs/validation.md): one real six-page PDF plus 40 synthetic fixtures; 145 measured runs passed. Limits are 5 MiB/file, 100 PDF pages, 200,000 extracted characters, 20 MiB expanded DOCX, 10 seconds, and a monitored 384 MiB child-memory budget. Images are excluded and formatting-dependent content requires review. Real DOCX modules and production-host validation remain pending.
- [ ] Check the Groq account's no-training terms, retention controls, free production models, structured-output support, and quotas. Evaluate samples before pinning the model.
- [ ] Ask an instructor to evaluate a small question/flashcard sample. Accepted answers must be correct and unambiguous, explanations supported, and source references valid. Reject or correct failed questions before passing the sample.
- [ ] Establish expected active users, peak concurrent generation, and normal module size for campus use. Test the confirmed 5/10-question settings and both separate question types against measured provider and storage budgets.
- [ ] Identify a suitable free Express host or authorized existing school infrastructure, and a free SMTP provider or custom school sender. Document any missing evidence. Render Free remains excluded from production hosting.

Acceptance checks: Both document formats produce text a user can review. The chosen UI components load on a physical Android device, and sample generation stays within the account's limits. Check module support for every accepted answer/explanation, fewer-question output for limited evidence, and insufficient-source output when none is usable. Resolve all correctness errors in the accepted sample. Record the tested limits and sample size; the sample does not establish general accuracy.

Decision: Dependent work waits if extraction, UI compatibility, or primary-provider checks fail. Hosting, email, or capacity failures block campus release. Paid services, removed features, or a change to a prototype audience would require new decisions.

### Phase 2: Private accounts and trusted module import

Outcome: Each user can access only their own workspace and supported school modules.

Prerequisites: The runtime and extraction setup tested in Phase 1, plus an isolated development configuration. Keep email limitations documented until a working sender is verified.

- [x] Build the initial login UI with input validation, mail/lock icons, password visibility, local Remember me selection, and recovery/registration links. Authentication, persistence, recovery, and device validation remain pending.
- [x] Build the registration UI with full name, email, password, password visibility/strength, local validation, and navigation between login and registration. Account creation remains unconnected.
- [x] Build Verify Email, OTP, and Set Password screens with local email/code/password validation and navigation between the recovery screens. Code delivery, resend requests, verification, recovery-session protection, and password updates remain unconnected; Android behavior is unverified.
- [x] Create the server config, routes, controllers, services, models, and middleware folders. These are structural placeholders; authenticated route/controller/service/model behavior remains pending.
- [x] Prepare the profiles and personal subject/topic labels migration with ownership policies and setup instructions. Applying the migration and verifying database behavior with two accounts remain pending.

- [ ] Implement the server structure using separate config, routes, controllers, services, models, and middleware folders, schema migrations, and their setup instructions. The mobile/server starters, environment examples, and starter installation guides already exist. Validate one authenticated own-profile read through route, controller, service, and model before expanding; keep additions limited to the current feature work.
- [ ] Implement email/password self-registration without email confirmation, sign-in, session restoration, sign-out, and recovery by emailed six-digit code. Use separate Verify Email, OTP, and Set Password screens. Verify Email collects the recovery address; allow a new password only after the OTP establishes a recovery session. Use one shared account type and registration flow without a student/instructor selection or claiming verified PSU membership.
- [ ] Add owner-scoped database and private Storage policies. Test API identity and ownership checks with two unrelated accounts.
- [ ] Implement PDF/`.docx` upload within the tested limits, extraction previews, reusable personal subject/topic labels, ready/failed states, and private retrieval. Clean up failed or deleted files.
- [ ] Implement no automatic expiry, blocked uploads at capacity, and confirmed module deletion with dependency cleanup. Extend deletion coverage as derived content is introduced in later phases. Keep privileged credentials out of the application bundle and logs.

Acceptance checks: User A and User B cannot access each other's documents by changing IDs or object paths. Reject corrupt, scanned, oversized, and unsupported files safely. Register and sign in without email confirmation, then complete Verify Email -> OTP -> Set Password on Android. Reject invalid, expired, or reused codes, and block Set Password access without a verified recovery session. Cover resend limits and interrupted password updates. Verify that uploads survive an API restart and reauthentication. Reuse a personal subject/topic label; at capacity, reject new uploads without deleting existing data. Verify the module-deletion warning and removal of original/extracted source.

Release requirement: Verify custom email delivery and personal-data retention/deletion before onboarding campus users.

### Phase 3: Generate, complete, and score a quiz

Outcome: Any user can generate a quiz from a module or topic, complete it with immediate explanations, and save the scored session.

Prerequisites: Private accounts and module imports, an approved model, and tested extraction limits.

- [ ] Define the question schema, source references, public question payload, protected answer key, confirmed quiz choices/defaults, and state transitions for generation and study sessions.
- [ ] Implement Groq requests and context selection within the tested limits. Add schema/content/source checks, fewer-question and insufficient-source outcomes, saved generation status, duplicate-request protection, and handling for quotas, refusals, and timeouts.
- [ ] Implement separate conceptual and coding-syntax multiple-choice modes, instructors' personal previews, answer submission, immediate explanations, final results, fresh quizzes for new sessions, and resumption of interrupted sessions. Exclude mixed types and saved-quiz retakes.
- [ ] Route answer submissions through the quiz controller, scoring service, and model's atomic database operations. Save answers and completion effects atomically, make retries idempotent, and exclude the answer key from question payloads sent before the student answers.
- [ ] Test incorrect option mapping, duplicate submissions, incomplete output, invalid source references, expired identity, prompt injection, and unauthorized access.

Acceptance checks: Complete module and topic quizzes on Android in each question mode. Verify defaults of 10 questions, medium difficulty, and conceptual MCQ, plus the 5-question and other difficulty choices. Reject unsupported module-based coding generation without silently switching types. Check fewer-question and insufficient-source states. Verify saved keys, source support, and duplicate-safe results. A new session generates a fresh quiz; reconnecting resumes the same interrupted quiz and adaptation state. Answering requires connectivity. Network interruptions, provider 429 responses, and API restarts leave a recoverable state with an accurate message. An instructor can prepare a personal quiz without publishing it.

Decision: Revise or reject the generation approach if representative questions remain incorrect or the token budget cannot support the documented quiz size. Keep Gemini disabled until its separate content-use requirements are met.

### Phase 4: Adaptive practice and flashcard review

Outcome: Practice difficulty responds to performance, and flashcards support technical-term review.

Prerequisites: Stable question/answer interfaces and saved study sessions.

- [ ] Implement selected starting difficulty, two-answer consecutive transitions, counter resets, easy/medium/hard bounds, and nearest-available selection from the limited pool, without a provider request for each answer.
- [ ] Generate and save personal technical-term flashcards from the approved sources, with output validation. Track each card-back view so only a full-set review within the same day qualifies as completed.
- [ ] Use saved answers to suggest weak topics with sufficient history. Explain the recommendations while leaving topic/material selection and next-quiz generation to the user.
- [ ] Test difficulty limits, mixed correct/incorrect sequences, exhausted question pools, restart/resume consistency, empty flashcard sets, and repeated review-completion requests.

Acceptance checks: Controlled consecutive and alternating answer sequences verify transitions, counter resets, level bounds, and nearest-available fallback; resumed study sessions preserve that state. Flashcards reveal the correct back text; a full set reviewed that day qualifies once, while partial or empty reviews do not. Reproduce recommendations from saved answers and verify that they neither change the selected topic/material nor generate the next quiz automatically.

Decision: If generating the question pool exceeds free limits, revise its size or selection strategy and test again. Adaptive difficulty stays in scope.

### Phase 5: Explain progress and display a personal report

Outcome: Users can view consistent scores, streaks, practice estimates, and reports of strengths and weaknesses.

Prerequisites: Correctly saved completed study sessions and review events.

- [ ] Build the student dashboard and personal progress views. Show scores, trends, streaks, and topic practice estimates using percentage correct among the latest 20 first-submission answers, a five-answer minimum, and visible sample counts. Explain subject mastery as a practice estimate.
- [ ] Implement the shared reporting query and in-app personal report.
- [ ] Test empty history, four/five-answer thresholds, the rolling 20-answer window, repeated completion, full/partial flashcard reviews, timezone boundaries/changes with preserved completion dates, and report/dashboard agreement. Verify that confirmed module deletion removes all derived content/results and recalculates progress and streaks without changing unrelated history.
- [ ] Check large fonts, screen-reader announcements, touch targets, code readability, system-back navigation, and error states throughout the review flow.

Acceptance checks: Report totals match the same user's dashboard for the same data range. Empty history produces no invented strengths claim; four answers show insufficient data, five show an estimate, and answers older than the latest 20 leave the calculation. Completed quizzes or full flashcard reviews qualify once per date; opening the app and incomplete activity do not. Streaks remain correct across midnight, device-timezone changes, duplicate events, and module deletion. Check that the in-app report is readable on Android.

Release requirement: Have instructors and users evaluate practice estimates and recommendations before making claims about learning benefits.

### Phase 6: Validate the installed application for campus use

Outcome: A signed, installable Android application with tested services and documented operating limits.

Prerequisites: Earlier acceptance checks, suitable free API hosting and SMTP, measured capacity, and implemented retention/deletion and backup decisions. This phase remains provisional until those requirements are met.

- [ ] Configure authorized free services and secrets, deploy the API and database policies, and test registration without email confirmation and recovery-code emails with the live services on Android.
- [ ] Build and install a signed APK on representative physical Android devices. Verify distribution eligibility, safe installation instructions, signing-key custody, and an update path.
- [ ] Test separate user accounts against live Supabase and Groq. Cover import, generation, answers, resumption, flashcards, dashboard, in-app reports, sign-out, recovery, and denied access to other users' resources.
- [ ] Test the measured concurrent generation load, cold starts, exhausted quotas/storage, host/database restart or pause recovery, and lost connectivity. Verify that scores are not duplicated and material remains private.
- [ ] Export the database and private objects, then restore them into an isolated environment. Verify account/resource ownership and that recovery does not silently reintroduce deleted modules or derived results; record who handles backups and how often.
- [ ] Evaluate quiz correctness and usability with representative students and instructors. Compare findings with the overview's intended outcomes and update the affected rules here.
- [ ] Document operating limits, monitoring, provider/model maintenance, manual recovery, remaining defects, and the evidence supporting the release decision.

Acceptance checks: Provide evidence for every observable success criterion. Complete the live flow on a physical device and verify that service limits support the agreed campus workload. Resolve privacy, ownership, data-loss, email, signing, and critical correctness failures before release. A successful build alone does not meet these requirements.

Release decision: If free infrastructure cannot support the intended workload or availability, keep campus rollout blocked. Present a specific alternative within the budget or request a change to the constraint. An unsuitable evaluation host cannot be used as the campus service.

## 6. Dependencies, remaining uncertainties, and next step

### Ordering and independent work

Phase 1 tests the runtime, extraction, provider, and capacity assumptions. Phase 2 needs the tested runtime/extraction setup. Phase 3 needs working ownership checks and defined source/quiz interfaces. Phase 4 depends on stable answer behavior; Phase 5 depends on the rules for completed study sessions and reviews. Phase 6 requires all product acceptance checks and external service requirements to pass.

Report layout and flashcard presentation can be developed independently once the Phase 2 ownership interface and Phase 3 question/report formats are fixed. Both use the same mobile navigation, Reusables components, NativeWind tokens, migrations, and API payloads, so assign ownership of those shared files before parallel work. This plan requests no parallel agent work or ticket creation.

### Unresolved requirements and evidence needed

| Gate | Evidence required | Blocks |
|---|---|---|
| Module extraction | Representative PDF/`.docx` samples, supported limits, code/table fidelity and memory/time measurements | Import and source-grounded generation |
| Toolchain | Local SDK 57 starter checks and bundle export have passed. Still needed: an installed Android build with the chosen Reusables components, verified styling/portal behavior, and recorded device results | Mobile feature/device validation |
| Primary AI | Actual free model availability/quotas, accepted retention settings, instructor-checked sample output | AI-dependent features |
| Gemini alternative | Explicit acceptance of unpaid content-use terms for the actual materials and a separate quality/schema check | Gemini enablement only; Groq work continues |
| Hosting | A free host or existing authorized school server suitable for intended use, measured extraction/API behavior and restart recovery | Campus release; Render Free remains evaluation-only |
| Account email | Signup email confirmation disabled, authorized free sender, delivery quotas, recovery-code template, and recovery verified on Android | Password recovery and production Auth configuration |
| Capacity | Campus usage expectations compared with measured token/storage/email/host limits | Claiming suitability for campus rollout |
| Retention and recovery | Implemented confirmed no-expiry/capacity/deletion rules, documented account/history deletion operations, and verified database/file restoration respecting deletions | Storing real campus data and release |
| Android distribution | Actual target devices, signing custody, installation/update path, and current distribution requirements | APK release |
| Educational quality | Instructor evaluation and student usability evidence against the overview; record sample and limitations | Release claims and acceptance |

Continue the remaining Phase 1 checks with representative authorized PDF/`.docx` samples and permitted development accounts. Test extraction and generate one valid, instructor-checked quiz through the free Groq account. Verify the UI on Android and document the hosting/email gaps before expanding beyond the starters.

The agreed scope and acceptance criteria remain in place. Completed starter work is recorded at the top of this document. Product features, migrations, live integrations, installed-device checks, deployment, and learning-outcome validation remain pending.
