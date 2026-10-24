# AI reviewer: folder structure

The project has separate mobile and server applications. Each keeps its own dependencies and lockfile.

The mobile starter is configured, and the Express starter runs a health endpoint. Application features, service connections, and database migrations still need to be written. The Supabase folder is empty.

MVC with a service layer, grouped into folders by responsibility, is the selected design for future feature work. The controllers, services, and models described below are planned; the current starters do not implement them yet.

After cloning, contributors can follow the [installation guide](docs/installation.md) for prerequisites, dependencies, local environment files, startup, and Android preview. The [development page](docs/development.md) links to the setup and project guides.

## Current files

Checked on 2026-10-17. This tree leaves out installed dependencies, generated caches and bundles, Git metadata, and agent-tool settings.

```text
ai-reviewer-app/
|-- mobile/
|   |-- assets/
|   |-- src/
|   |   |-- app/
|   |   |   |-- _layout.jsx          # Navigation theme, status bar, stack, portal host
|   |   |   `-- index.jsx            # Starter screen
|   |   `-- lib/
|   |       |-- theme.js            # Fixed colors and navigation theme
|   |       `-- utils.js            # Class-name merging helper
|   |-- .env.example
|   |-- .gitignore
|   |-- AGENTS.md
|   |-- LICENSE
|   |-- app.json
|   |-- babel.config.js
|   |-- components.json
|   |-- eslint.config.js
|   |-- global.css
|   |-- jsconfig.json
|   |-- metro.config.js
|   |-- package.json
|   |-- package-lock.json
|   `-- tailwind.config.js
|-- server/
|   |-- src/
|   |   |-- app.js                  # Express app and health endpoint
|   |   `-- server.js               # Validates the port and starts the listener
|   |-- .env.example
|   |-- package.json                # Dependencies and start/dev commands
|   `-- package-lock.json
|-- supabase/                       # Empty; no migrations or local configuration
|-- docs/
|   |-- development.md
|   |-- installation.md
|   |-- RebyuIT_Android_Dev_Cleanup_Guide.md
|   `-- adr/
|       `-- 0001-private-independent-preparation.md
|-- planning/
|   `-- ai-powered-reviewer-roadmap.md
|-- AI_Powered_Reviewer_Overview.md
|-- GLOSSARY.md
|-- folder-structure.md
`-- .gitignore
```

## What the main folders are for

| Folder | Purpose | Status |
|---|---|---|
| `mobile/` | The Android application code. | Starter configured |
| `mobile/assets/` | Images, icons, and fonts used by the app. | Exists |
| `mobile/src/` | Application source code. | Exists |
| `mobile/src/app/` | Expo Router screens and navigation layouts. Keep helpers outside this folder. | Starter routes exist |
| `mobile/src/lib/` | Shared helpers, theme values, and service clients. | Theme and helper exist; clients planned |
| `server/` | The Express API for document processing, AI requests, and scoring. | Health starter runs; feature APIs planned |
| `server/src/` | Server application code. | App and listener exist |
| `supabase/` | Database migrations, access policies, and development data. | Empty |
| `docs/` | Developer onboarding, setup instructions, and technical decisions. | Exists |
| `docs/adr/` | Numbered records of architecture decisions and their reasons. | One decision recorded |
| `planning/` | The agreed scope and implementation roadmap. | Exists |

## Important existing files

Paths in this table are relative to `mobile/` unless stated otherwise.

| File | Purpose |
|---|---|
| `src/app/_layout.jsx` | Sets the navigation theme, status bar, screen stack, and portal host. |
| `src/app/index.jsx` | The current starter screen. |
| `src/lib/theme.js` | Defines the fixed color palette and navigation theme. |
| `src/lib/utils.js` | Combines style class names and resolves conflicts. |
| `app.json` | Sets the app name, icons, appearance, link scheme, and Expo plugins. |
| `global.css` | Contains Tailwind directives and fixed color variables. |
| `tailwind.config.js` | Sets scanned source paths, theme colors, rounded corners, and animations. |
| `babel.config.js` | Configures JavaScript and NativeWind transformation. |
| `metro.config.js` | Configures the bundler and connects the global stylesheet. |
| `jsconfig.json` | Maps imports beginning with `@/` to `src/`. |
| `components.json` | Tells the Reusables CLI where to place JavaScript components and helpers. |
| `eslint.config.js` | Configures lint rules and alias resolution. |
| `package.json` | Lists the mobile dependencies, commands, and Router entry point. |
| `package-lock.json` | Records the dependency versions used by clean installs. |
| `.gitignore` | Excludes mobile dependencies, caches, and generated files from Git. |
| `AGENTS.md` | Gives coding agents instructions for this mobile project. |
| `LICENSE` | Contains the mobile starter license. |
| `server/package.json` (from the repository root) | Lists server dependencies, enables ES modules, and defines start and development commands. |
| `server/package-lock.json` (from the repository root) | Records the server dependency versions. |
| `server/src/app.js` (from the repository root) | Configures Express and the health endpoint without opening a port. |
| `server/src/server.js` (from the repository root) | Validates the port and starts the listener, reporting startup errors. |
| `mobile/.env.example` and `server/.env.example` (from the repository root) | List required settings with placeholders. Local `.env` files are ignored and omitted from the tree. |
| `.gitignore` (at the repository root) | Sets ignore rules that apply across the repository. |

The mobile app starts through `expo-router/entry`. Lint, JavaScript checks, Expo Doctor, and an Android bundle export passed. Device rendering and portal behavior still need testing. The server test folder and test command have been removed; the health endpoint remains available for a local startup check. The installation guide explains how contributors can repeat the setup checks.

On 2026-10-22, `expo-dev-client ~57.0.20` was added to the mobile manifest and lockfile for SDK 57. The [installation guide](docs/installation.md) covers building the Android development app and starting Metro with `--dev-client`. Lint and JavaScript checks passed; Expo Doctor passed 20/21 checks, with the compatibility check flagging newer patches for `expo`, `expo-router`, and `expo-sharing`. No native build or device validation was performed for this installation.

The [installation guide's Android workflow comparison](docs/installation.md#4-choose-how-to-run-the-android-app) explains Expo Go, the RebyuIT Dev APK, and release APKs. The Dev APK loads JavaScript edits through Metro and needs rebuilding after native changes. The [cleanup guide](docs/RebyuIT_Android_Dev_Cleanup_Guide.md) explains which local tools can be removed while keeping an installed development build usable over the network. EAS build profiles remain planned.

On 2026-10-22, `lucide-react-native ^1.61.0` and Expo SDK 57-compatible `react-native-svg 15.15.4` were added to the mobile manifest and lockfile. Use direct named icon imports in screens and components; no icon wrapper or new folder was added. The current screens are unchanged, and Android icon rendering remains unverified.

## Planned structure

This target includes existing setup files and proposed additions for the full system. Only paths listed under Current files above are part of the documented starter; the rest are planned. Create files when their features are implemented, rather than scaffolding empty folders. Local credentials, installed dependencies, caches, and build output are omitted.

The mobile app keeps screen implementations directly in Expo Router's `src/app/` directory. Shared components, session state, and API request helpers live outside it. There is no separate mobile `screens/` or `features/` layer in this plan. The server groups files by responsibility under `server/src/`: `config/`, `routes/`, `controllers/`, `services/`, `models/`, and `middleware/`, with supporting validation and shared helpers.

```text
ai-reviewer-app/
|-- mobile/
|   |-- assets/
|   |   |-- images/                         # App images and logo
|   |   |-- icons/                          # Launcher and splash assets
|   |   `-- fonts/                          # Custom fonts, if used
|   |-- src/
|   |   |-- app/
|   |   |   |-- _layout.jsx                 # Root navigation, theme, providers
|   |   |   |-- index.jsx                   # Restore session and redirect
|   |   |   |-- +not-found.jsx              # Unknown route
|   |   |   |-- (auth)/
|   |   |   |   |-- _layout.jsx             # Authentication navigation
|   |   |   |   |-- login.jsx
|   |   |   |   |-- register.jsx            # Account and personal role selection
|   |   |   |   |-- verify-email.jsx
|   |   |   |   |-- forgot-password.jsx
|   |   |   |   |-- reset-password.jsx
|   |   |   |   `-- callback.jsx            # Confirmation/recovery return links
|   |   |   `-- (main)/
|   |   |       |-- _layout.jsx             # Signed-in stack and session checks
|   |   |       |-- (tabs)/
|   |   |       |   |-- _layout.jsx         # Four bottom tabs
|   |   |       |   |-- dashboard.jsx
|   |   |       |   |-- quizzes.jsx         # History and interrupted sessions
|   |   |       |   |-- flashcards.jsx      # Saved flashcard sets
|   |   |       |   `-- profile.jsx         # Account details and sign-out
|   |   |       |-- materials/
|   |   |       |   |-- index.jsx           # Personal module library
|   |   |       |   |-- import.jsx          # Pick/upload PDF or DOCX
|   |   |       |   `-- [materialId].jsx    # Status, text preview, labels, deletion
|   |   |       |-- quizzes/
|   |   |       |   |-- create.jsx          # Source, type, count, difficulty
|   |   |       |   `-- [sessionId]/
|   |   |       |       |-- index.jsx       # Generation, answering, feedback, resume
|   |   |       |       `-- results.jsx     # Score, explanations, diagnostics
|   |   |       |-- flashcards/
|   |   |       |   |-- create.jsx          # Module/topic selection and generation
|   |   |       |   `-- [setId].jsx         # Front/back review and completion
|   |   |       `-- reports/
|   |   |           `-- index.jsx           # Personal report and PDF export
|   |   |-- components/
|   |   |   |-- ui/                         # Reusables components, added as needed
|   |   |   |-- screen-state.jsx            # Shared loading, empty, error display
|   |   |   |-- material-card.jsx
|   |   |   |-- source-picker.jsx           # Saved module or IT topic
|   |   |   |-- label-picker.jsx            # Personal subject/topic labels
|   |   |   |-- question-card.jsx           # Question, options, readable code
|   |   |   |-- answer-feedback.jsx
|   |   |   |-- flashcard.jsx
|   |   |   |-- progress-summary.jsx
|   |   |   `-- topic-estimate.jsx          # Practice estimate and sample count
|   |   |-- providers/
|   |   |   `-- session-provider.jsx        # Auth session and profile
|   |   `-- lib/
|   |       |-- theme.js                    # Existing theme/navigation tokens
|   |       |-- utils.js                    # Existing class-name helper
|   |       |-- supabase.js                 # Public mobile Supabase client
|   |       |-- api.js                      # Authenticated API requests/errors
|   |       |-- auth.js                     # Auth actions and return-link handling
|   |       |-- materials.js                # Import, status, retrieval, deletion
|   |       |-- quizzes.js                  # Generate, resume, answer, results
|   |       |-- flashcards.js               # Generate, list, review
|   |       |-- progress.js                 # Dashboard/report data requests
|   |       |-- report-pdf.js               # Escaped report HTML, print/share
|   |       `-- study-date.js               # Device timezone and local study date
|   |-- test/
|   |   |-- auth-flow.test.jsx
|   |   |-- material-import.test.jsx
|   |   |-- quiz-session.test.jsx
|   |   |-- flashcard-review.test.jsx
|   |   `-- report-pdf.test.js
|   |-- .env.example                        # Public URL/key placeholders
|   |-- .gitignore
|   |-- AGENTS.md
|   |-- LICENSE
|   |-- app.json
|   |-- babel.config.js
|   |-- components.json
|   |-- eas.json                            # Android build profiles
|   |-- eslint.config.js
|   |-- global.css
|   |-- jsconfig.json
|   |-- metro.config.js
|   |-- package.json
|   |-- package-lock.json
|   `-- tailwind.config.js
|-- server/
|   |-- src/
|   |   |-- app.js                          # Express setup, health, feature routes
|   |   |-- server.js                       # Validate configuration/start listener
|   |   |-- config/
|   |   |   |-- env.js                      # Validated server settings/limits
|   |   |   |-- supabase.js                 # Server database/private Storage client
|   |   |   `-- ai.js                       # Groq client and bounded requests
|   |   |-- controllers/
|   |   |   |-- profileController.js        # Profile requests and responses
|   |   |   |-- labelController.js          # Label requests and responses
|   |   |   |-- materialController.js       # Import and material responses
|   |   |   |-- quizController.js           # Quiz and answer request/response
|   |   |   |-- flashcardController.js      # Flashcard requests and responses
|   |   |   `-- progressController.js       # Progress and report responses
|   |   |-- middleware/
|   |   |   |-- authMiddleware.js           # Verify Supabase access tokens
|   |   |   `-- errorMiddleware.js          # Consistent safe error responses
|   |   |-- models/
|   |   |   |-- profileModel.js             # Owner-scoped profile reads/writes
|   |   |   |-- labelModel.js               # Owner-scoped label reads/writes
|   |   |   |-- materialModel.js            # Material records and private files
|   |   |   |-- quizModel.js                # Quiz data and atomic answer saves
|   |   |   |-- flashcardModel.js           # Sets, cards, and review records
|   |   |   `-- progressModel.js            # Owner-scoped answer/study queries
|   |   |-- routes/
|   |   |   |-- profileRoutes.js            # Read/update own profile
|   |   |   |-- labelRoutes.js              # List/create personal subject/topics
|   |   |   |-- materialRoutes.js           # Upload, status, preview, delete
|   |   |   |-- quizRoutes.js               # Generate, resume, answer, results
|   |   |   |-- flashcardRoutes.js          # Generate, retrieve, record review
|   |   |   `-- progressRoutes.js           # Dashboard and personal report data
|   |   |-- services/
|   |   |   |-- profileService.js           # Profile validation and ownership
|   |   |   |-- labelService.js             # Personal label rules and ownership
|   |   |   |-- materialService.js          # Ownership, storage, import lifecycle
|   |   |   |-- materialExtraction.js       # PDF.js/Mammoth extraction
|   |   |   |-- materialDeletion.js         # Source/derived-data cleanup
|   |   |   |-- quizService.js              # Generation, scoring, session rules
|   |   |   |-- quizGeneration.js           # Context selection and Groq requests
|   |   |   |-- quizPrompts.js              # Conceptual/coding question prompts
|   |   |   |-- quizAdaptation.js           # Difficulty transitions/selection
|   |   |   |-- flashcardService.js         # Generation and review completion
|   |   |   |-- flashcardPrompts.js         # Flashcard generation prompts
|   |   |   |-- progressService.js          # Shared dashboard/report aggregation
|   |   |   |-- progressEstimates.js        # Latest-20 answers, minimum five
|   |   |   |-- studyStreaks.js             # Qualifying recorded study dates
|   |   |   `-- topicRecommendations.js     # Suggested weak topics
|   |   |-- validation/
|   |   |   |-- materialValidation.js       # File/type/size and label validation
|   |   |   |-- quizValidation.js           # Settings, output, source checks
|   |   |   `-- flashcardValidation.js      # Settings, card/source checks
|   |   `-- lib/
|   |       |-- usage.js                    # Persistent usage/concurrency limits
|   |       `-- errors.js                   # Shared application error definitions
|   |-- .env.example                        # Server-only credential placeholders
|   |-- package.json
|   `-- package-lock.json
|-- supabase/
|   |-- config.toml                         # Local Supabase configuration
|   |-- migrations/
|   |   |-- 0001_profiles_and_labels.sql
|   |   |-- 0002_materials_and_sections.sql
|   |   |-- 0003_generations_and_usage.sql
|   |   |-- 0004_quizzes_and_questions.sql
|   |   |-- 0005_study_sessions_and_answers.sql
|   |   |-- 0006_flashcards_and_reviews.sql
|   |   |-- 0007_private_storage.sql
|   |   |-- 0008_atomic_study_operations.sql
|   |   `-- 0009_material_deletion.sql
|   `-- seed.sql                            # Synthetic development data
|-- docs/
|   |-- development.md                      # Contributor guide links
|   |-- RebyuIT_Android_Dev_Cleanup_Guide.md # Optional local Android tool cleanup
|   |-- installation.md                     # Clone, configure, run
|   |-- api.md                              # Requests, responses, auth, errors
|   |-- database.md                         # Tables, relationships, ownership
|   |-- validation.md                       # Checks and recorded evidence
|   |-- deployment.md                       # API, Supabase, APK setup
|   |-- operations.md                       # Quotas, cleanup, backup/recovery
|   `-- adr/
|       `-- 0001-private-independent-preparation.md
|-- planning/
|   `-- ai-powered-reviewer-roadmap.md
|-- AI_Powered_Reviewer_Overview.md
|-- GLOSSARY.md
|-- folder-structure.md
|-- README.md
`-- .gitignore
```

### Mobile organization and navigation

- Write each screen in its route file under `mobile/src/app/`. Keep filenames lowercase or kebab-case; bracketed names such as `[sessionId]` identify dynamic routes. Keep non-route code outside `app/`.
- Use Dashboard, Quizzes, Flashcards, and Profile as the four tabs. Dashboard opens the module library and personal reports. Recommendations stay on Dashboard; the user chooses the next topic.
- Keep module details, quiz answering, flashcard review, and reports outside `(tabs)` so these flows can hide the bottom navigation. Quiz setup generates a fresh quiz; history resumes interrupted sessions or opens completed results, without saved-quiz retakes.
- Restore the session before choosing login or Dashboard. Confirmation and recovery callbacks must work without an existing session; finish password recovery before redirecting to Dashboard. Both roles share routes and private resources, with role-appropriate presentation.
- Keep reusable UI in `components/`, shared session state in `providers/`, and service requests/helpers in `lib/`. Add Reusables component files only as needed. The configured `@/hooks` alias does not require an empty hooks folder.
- Loading, empty, error, answer feedback, and deletion confirmation are screen states or components. They do not each need a separate route. Confirm module deletion with a warning about losing its derived content and results.

The asset subfolders are a proposed organization. Existing assets currently remain directly under `mobile/assets/`; update image imports and `app.json` references together if assets are moved. Create `fonts/` only if custom fonts are used.

### MVC responsibilities and request flow

| Part | Location | Responsibility |
|---|---|---|
| View | Mobile `src/app/` and `components/` | Display data and handle user interaction using React Native components. |
| Routes | `server/src/routes/*Routes.js` | Connect HTTP methods and paths to authentication middleware and controller functions. |
| Controller | `server/src/controllers/*Controller.js` | Read the authenticated identity and input, validate request shape, call the service, and send a safe response. |
| Service | `server/src/services/*Service.js` | Apply business rules and ownership checks; coordinate extraction, AI generation, scoring, and progress calculations. |
| Model | `server/src/models/*Model.js` | Use the server Supabase client for owner-scoped database/private Storage operations and atomic database functions. |

```text
React Native screen -> mobile API helper -> Express route + auth middleware
                    -> controller -> service -> model -> Supabase
```

The result returns through the same layers as a safe JSON response. This is an API-backed MVC design: React Native provides the view, so Express does not need a server-side `views/` folder. Mobile `lib/` files handle API requests and public Supabase authentication; they do not duplicate authoritative scoring or progress calculations.

Group server files by layer and use camelCase names that identify their feature, such as `quizRoutes.js`, `quizController.js`, `quizService.js`, and `quizModel.js`. Keep server settings and clients in `config/`, request/output checks in `validation/`, and extraction, generation, prompts, and calculation helpers in `services/`. Shared usage limits and error definitions remain in `lib/`.

Use plain JavaScript functions and add files with their implementation. Start with one authenticated own-profile read in Phase 2 before expanding the pattern. Services call helper functions and models as needed. Do not add generic base classes, repository wrappers, or empty forwarding functions.

### Server and database safeguards

Keep answer keys and scoring on the server. Store stable option identifiers, accept one answer per question/session, and use atomic database operations for answer saving and completion. Preserve quiz sequence and adaptation state when resuming. Dashboard and report data use the same progress calculations.

The migration names describe the intended responsibilities and order; the exact SQL remains to be designed. Add owner policies and constraints with each table migration. Keep answer keys inaccessible through direct mobile database access. Private bucket policies belong with the Storage migration, and atomic scoring/finalization functions belong with study operations.

Keep uploads in private Storage and real credentials out of Git. AI keys and privileged Supabase credentials belong only on the server. Students and instructors can access only their own resources; instructors cannot view student histories or publish shared quizzes. Confirmed module deletion removes its source, derived quizzes, flashcards, and study results, then recalculates affected progress and streaks while preserving unrelated history.

### Verification and remaining decisions

The mobile test files are planned additions, not installed test tooling or passing checks. Cover authentication return links, rejected imports, interrupted sessions, duplicate answer submissions, complete versus partial flashcard reviews, and safe report export.

The previously removed server test folder and command remain omitted. Verify controller validation and safe responses, service business rules, and model persistence/ownership, including one complete route-to-database flow. Backend verification still needs extraction fixtures, two-account ownership checks, generation/source validation, answer-key integrity, difficulty transitions, duplicate-safe scoring, study dates/streaks, dashboard/report agreement, and deletion cleanup. Record commands and results in `docs/validation.md` when implemented.

Hosting-specific files, extraction worker/process isolation, validated file limits, and the approved Groq model depend on Phase 1 findings. Gemini stays disabled pending separate approval. Live-service and physical Android checks remain necessary; this tree does not establish working integrations.

## Project documents

| Document | Purpose |
|---|---|
| [Project overview](AI_Powered_Reviewer_Overview.md) | Explains the problem, intended users, and selected features. |
| [Roadmap](planning/ai-powered-reviewer-roadmap.md) | Records scope, implementation phases, and acceptance checks. |
| [Installation guide](docs/installation.md) | Explains contributor setup after cloning, including dependencies, environment files, startup, Android preview, and troubleshooting. |
| [Development page](docs/development.md) | Links developers to installation, folder, and roadmap documentation. |
| [Glossary](GLOSSARY.md) | Defines the terms used throughout the project. |
| [Private preparation decision](docs/adr/0001-private-independent-preparation.md) | Records privacy boundaries and module-deletion behavior. |
| `folder-structure.md` | Explains where existing and planned files belong. |
