# AI reviewer: folder structure

The project has separate mobile and server applications. Each keeps its own dependencies and lockfile.

The mobile app has Supabase email/password sign-in, Remember me session storage, and shared authentication form components. Registration and password recovery also call Supabase. Brevo delivers recovery emails; the maintainer reported a successful recovery test on their phone. The Express API implements health and authenticated own-profile reads. The first database migration is prepared. Standalone scripts measure PDF and DOCX extraction; module import, AI generation, and study features remain planned.

The server uses MVC with a service layer, grouped by responsibility. The own-profile endpoint runs through routes, authentication middleware, a controller, a service, and a model. Other feature endpoints remain planned.

Follow the [installation guide](docs/installation.md) to install dependencies, configure local environment files, and run the app. The [development page](docs/development.md) links to the project guides. The [command handbook](docs/commands.md) covers Expo, Android, Gradle, ADB, and server commands.

## Current files

Recovery entries updated on 2026-10-31. This tree leaves out installed dependencies, generated native projects, caches and bundles, Git metadata, and agent-tool settings.

```text
ai-reviewer-app/
|-- mobile/
|   |-- assets/
|   |   |-- fonts/
|   |   |   |-- OFL.txt
|   |   |   |-- Geist-Bold.ttf
|   |   |   |-- Geist-Medium.ttf
|   |   |   |-- Geist-Regular.ttf
|   |   |   `-- Geist-SemiBold.ttf
|   |   |-- illustrations/
|   |   |   |-- create-password.png
|   |   |   |-- otp.png
|   |   |   `-- verify-email.png
|   |   `-- logo/
|   |       |-- logo-symbol-transparent.png
|   |       |-- logo-symbol-white-background-1024.png
|   |       |-- logo-symbol-white-background-1254.png
|   |       |-- logo-with-name-dark-background.png
|   |       |-- logo-with-name-transparent.png
|   |       `-- logo-with-name-white-background.png
|   |-- src/
|   |   |-- app/
|   |   |   |-- (auth)/
|   |   |   |   |-- login.jsx                # Supabase sign-in, Remember me, session restoration
|   |   |   |   |-- otp.jsx                  # Supabase recovery-code verification and resend
|   |   |   |   |-- register.jsx             # Supabase registration with full name and validation
|   |   |   |   |-- set-password.jsx         # Verified recovery session, password update, local sign-out
|   |   |   |   `-- verify-email.jsx         # Supabase recovery-email request and error handling
|   |   |   |-- _layout.jsx                  # Theme, fonts, splash, foreground token refresh
|   |   |   `-- index.jsx                    # Starter redirect to login
|   |   |-- components/
|   |   |   |-- AuthButton.jsx               # Submit button, disabled/busy state, footer
|   |   |   |-- AuthMessage.jsx              # Feedback directly above authentication submit buttons
|   |   |   |-- FormField.jsx                # Labeled input with icons, error border, password toggle
|   |   |   |-- PasswordStrength.jsx         # Visual 4-bar password complexity indicator
|   |   |   `-- StartupSplash.jsx            # Animated splash coordinator and motion detection
|   |   `-- lib/
|   |       |-- auth.js                      # Login, registration, and recovery validation rules
|   |       |-- recovery-session.js          # In-memory verified recovery user ID
|   |       |-- session-storage.js           # Remember me; memory or persistent session storage
|   |       |-- supabase.js                  # Public Supabase client and shared auth storage
|   |       |-- theme.js                     # Theme tokens, palette, and navigation theme
|   |       `-- utils.js                     # Class-name merging helper
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
|   |-- scripts/
|   |   `-- extraction/
|   |       |-- benchmark.mjs                # Extraction benchmark and performance harness
|   |       |-- check.mjs                    # Extraction validation checks
|   |       |-- extract.mjs                  # Standalone extractor runner
|   |       |-- fixtures.mjs                 # Test document fixtures
|   |       `-- memory-guard.ps1             # Process memory monitor script
|   |-- src/
|   |   |-- config/
|   |   |   `-- supabase.js                  # Per-request client with caller token
|   |   |-- controllers/
|   |   |   `-- profileController.js         # Own-profile response and safe errors
|   |   |-- middleware/
|   |   |   `-- authMiddleware.js            # Verify Bearer token and attach identity
|   |   |-- models/
|   |   |   `-- profileModel.js              # Read profile by authenticated user ID
|   |   |-- routes/
|   |   |   `-- profileRoutes.js             # Protected GET /api/profile
|   |   |-- services/
|   |   |   `-- profileService.js            # Lookup and missing-profile handling
|   |   |-- app.js                           # Express, health, and profile route mount
|   |   `-- server.js                        # Port validation and listener startup
|   |-- .env.example
|   |-- package.json                         # Dependencies and start/dev commands
|   `-- package-lock.json
|-- supabase/
|   `-- migrations/
|       `-- 0001_profiles_and_labels.sql      # Profiles and private subject/topic labels
|-- docs/
|   |-- adr/
|   |   `-- 0001-private-independent-preparation.md
|   |-- commands.md                          # Comprehensive developer and command handbook
|   |-- development.md                       # Contributor workflow and guide index
|   |-- installation.md                      # Prerequisites, installation, and environment setup
|   `-- validation.md                        # Extraction benchmark results and test evidence
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
| `mobile/` | The Android application code. | Sign-in, registration, Remember me, and recovery implemented; protected navigation and study flows planned |
| `mobile/assets/` | Images, icons, and fonts used by the app. | Fonts, logo assets, and recovery illustrations exist |
| `mobile/src/` | Application source code. | Exists |
| `mobile/src/app/` | Expo Router screens and navigation layouts. Keep helpers outside this folder. | Login, registration, and recovery screens exist; authenticated navigation and main routes planned |
| `mobile/src/components/` | Shared UI and screen components. | Auth button, form, password feedback, and splash components exist; Reusables UI planned |
| `mobile/src/lib/` | Shared mobile helpers, theme values, and client validators. | Auth validation, theme, utils, public Supabase client, session storage, and recovery-session marker exist; Express API helper planned |
| `server/` | The Express API for document processing, AI requests, and scoring. | Health and protected own-profile endpoint implemented; extraction harness exists; other feature APIs planned |
| `server/scripts/` | Development, extraction benchmark, and diagnostic scripts. | Extraction harness and memory monitor exist |
| `server/src/` | Server application code. | App, listener, and own-profile MVC implementation exist |
| `supabase/` | Database migrations, access policies, and development data. | Profiles/labels migration exists; remaining migrations planned; live database state not established by this guide |
| `docs/` | Developer onboarding, setup instructions, commands, and technical decisions. | Installation, commands, validation, development, and ADR docs exist |
| `docs/adr/` | Numbered records of architecture decisions and their reasons. | One decision recorded |
| `planning/` | The agreed scope and implementation roadmap. | Exists |

## Important existing files

Paths in this table are relative to `mobile/` unless stated otherwise.

| File | Purpose |
|---|---|
| `src/app/_layout.jsx` | Sets the navigation theme, status bar, screen stack, fonts, splash, and portal host; starts/stops token refresh with app foreground state and cleans up its listener. |
| `src/app/index.jsx` | Redirects initial entry to the login screen. |
| `src/app/(auth)/login.jsx` | Signs in through Supabase, restores Remember me and an available session, and displays loading/error/success states. |
| `src/app/(auth)/register.jsx` | Calls Supabase registration with full name, email, password strength feedback, and validation. |
| `src/app/(auth)/verify-email.jsx` | Requests a recovery email through Supabase and passes the address to OTP after success. |
| `src/app/(auth)/otp.jsx` | Verifies a six-digit recovery code through Supabase before opening Set Password; resends with a 60-second cooldown. |
| `src/app/(auth)/set-password.jsx` | Checks the verified recovery user against the current session, updates the password, signs out locally, and returns to Login. |
| `src/components/AuthButton.jsx` | Shared submit button with optional disabled/busy accessibility state and footer content. |
| `src/components/AuthMessage.jsx` | Shared feedback directly above each authentication submit button; `isError` selects red text, while success and informational messages use the normal text color. Hidden when empty and announced politely to screen readers. |
| `src/components/FormField.jsx` | Reusable labeled input with leading icon, password toggle, error text, and an optional `invalid` flag for red borders/icons without duplicate messages. Invalid borders stay red while focused. |
| `src/components/PasswordStrength.jsx` | Visual 4-bar password complexity indicator for registration. |
| `src/components/StartupSplash.jsx` | Shows the animated logo during startup and respects reduced-motion settings. |
| `src/lib/auth.js` | Client-side email, login, registration, recovery-code, and password-confirmation validation. |
| `src/lib/recovery-session.js` | Keeps the verified recovery user ID in memory for Set Password access; clears on completion, cancellation, or app restart. Supabase authorizes password updates. |
| `src/lib/session-storage.js` | Supplies Supabase-compatible storage: checked Remember me saves sessions with AsyncStorage; unchecked sessions stay in memory until the app process ends. |
| `src/lib/supabase.js` | Creates the public mobile Supabase client using Expo environment variables and exports its shared auth storage. |
| `src/lib/theme.js` | Defines the fixed color palette, destructive tokens, and navigation theme. |
| `src/lib/utils.js` | Combines style class names and resolves conflicts. |
| `app.json` | Sets the app name, icons, appearance, link scheme, and Expo plugins. |
| `global.css` | Contains Tailwind directives and fixed color variables including destructive foreground. |
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
| `server/package.json` (from the repository root) | Lists server dependencies, enables ES modules, and defines startup and extraction commands. |
| `server/package-lock.json` (from the repository root) | Records the server dependency versions. |
| `server/scripts/extraction/benchmark.mjs` (from the repository root) | Measures PDF and DOCX extraction latency, throughput, and memory limits. |
| `server/scripts/extraction/check.mjs` (from the repository root) | Checks synthetic fixtures and extraction limits. |
| `server/scripts/extraction/extract.mjs` (from the repository root) | Runs bounded extraction in a child process and returns text, warnings, and metrics. |
| `server/scripts/extraction/fixtures.mjs` (from the repository root) | Creates synthetic PDF and DOCX test documents. |
| `server/scripts/extraction/memory-guard.ps1` (from the repository root) | Monitors extraction processes against memory and time limits on Windows. |
| `server/src/app.js` (from the repository root) | Configures Express, the health endpoint, and `/api/profile` without opening a port. |
| `server/src/config/supabase.js` (from the repository root) | Creates a Supabase client using the caller's access token, with server session persistence disabled. |
| `server/src/middleware/authMiddleware.js` (from the repository root) | Verifies Bearer tokens and attaches the authenticated user and Supabase client to the request. |
| `server/src/routes/profileRoutes.js` (from the repository root) | Connects the protected own-profile GET route to its controller. |
| `server/src/controllers/profileController.js` (from the repository root) | Returns the authenticated profile or safe not-found/server errors. |
| `server/src/services/profileService.js` (from the repository root) | Loads the own profile and reports a missing profile. |
| `server/src/models/profileModel.js` (from the repository root) | Reads profile ID, full name, and creation date using the authenticated user ID. |
| `server/src/server.js` (from the repository root) | Validates the port and starts the listener, reporting startup errors. |
| `supabase/migrations/0001_profiles_and_labels.sql` (from the repository root) | Defines profiles, personal subject/topic labels, and ownership policies; file presence does not establish live database execution. |
| `mobile/.env.example` and `server/.env.example` (from the repository root) | List required settings with placeholders. Local `.env` files are ignored and omitted from the tree. |
| `docs/commands.md` (from the repository root) | Project command handbook covering Expo, Android, Gradle, ADB, Node, and Metro. |
| `docs/validation.md` (from the repository root) | Records extraction benchmark evidence, memory budgets, and test verification data. |
| `.gitignore` (at the repository root) | Sets ignore rules that apply across the repository. |

The mobile app starts through `expo-router/entry`. Earlier setup checks passed lint, JavaScript checks, Expo Doctor, and an Android bundle export. Device rendering and portal behavior still need testing. The server has no general test folder or test command; its health endpoint supports a local startup check, and its extraction scripts have separate check and benchmark commands. The installation guide explains how to repeat the setup checks.

On 2026-10-22, `expo-dev-client ~57.0.20` was added to the mobile manifest and lockfile for SDK 57. The [installation guide](docs/installation.md) covers building the Android development app and starting Metro with `--dev-client`. Lint and JavaScript checks passed; Expo Doctor passed 20/21 checks, with the compatibility check flagging newer patches for `expo`, `expo-router`, and `expo-sharing`. No native build or device validation was performed for this installation.

The [installation guide's Android workflow comparison](docs/installation.md#4-choose-how-to-run-the-android-app) explains Expo Go, the RebyuIT Dev APK, and release APKs. The Dev APK loads JavaScript edits through Metro and needs rebuilding after native changes. Section 11 of the [command handbook](docs/commands.md#11-cache-cleaning-and-troubleshooting) explains cache management and troubleshooting. EAS build profiles remain planned.

The mobile interface uses `@tabler/icons-react-native` with Expo SDK 57-compatible `react-native-svg 15.15.4`. Use direct named outline icon imports in screens and components; no icon wrapper is required. Geist Sans is bundled locally in four weights under `mobile/assets/fonts/` and loaded by the root layout.

The auth screens use `FormField.jsx` for labeled inputs, password visibility, and inline errors. `AuthButton.jsx` shares the submit button and disabled/busy state. Each screen groups `AuthMessage.jsx` directly above `AuthButton.jsx` in its action area. Feedback stays aligned with the button and is hidden when empty. On Login, Supabase's `invalid_credentials` response marks both Email and Password red; editing either field or starting another submission clears that state. Network and storage failures show feedback without marking credentials invalid. Registration uses `PasswordStrength.jsx` for password feedback and sends full name, email, and password to Supabase for one shared account type.

Login calls Supabase email/password authentication. Remember me controls persistent versus in-memory session storage; disabling it removes saved tokens while preserving the current in-memory session. On mount, Login restores the saved preference and recognizes an available session. The root layout controls foreground token refresh. `index.jsx` still redirects to Login: authenticated routing, sign-out UI, and the mobile call to `/api/profile` remain planned. Live Android sign-in and cold-restart behavior remain unverified.

Registration does not require email confirmation. Recovery is connected through `verify-email.jsx`, `otp.jsx`, and `set-password.jsx`: request a code, verify it, then save a new password using the recovery session. Brevo is the configured SMTP sender, as reported by the maintainer. Resend uses a 60-second cooldown. The in-memory recovery marker blocks Set Password without successful verification matching the current session. Completion signs out locally and returns to Login; no callback route is needed. The maintainer reported a successful phone test; failure scenarios and broader device coverage remain unverified. See [authentication configuration](docs/installation.md#authentication-configuration).

The first migration is prepared under `supabase/migrations/`; the remaining migration files below are planned. The server implements `GET /api/profile` through the MVC layers using the verified token's user ID. This guide describes source files, not proof of current live migrations, database policies, or cross-account isolation.

## Planned structure

The target keeps the agreed folder layout. Existing files are listed under Current files; the remaining files below are planned. Add files as their features are implemented. Local credentials, installed dependencies, caches, and build output are omitted.

Write mobile screens directly in Expo Router's `src/app/` directory. Keep shared components, session state, and API helpers outside it. The server groups settings and clients in `config/`, requests in `routes/` and `controllers/`, business rules in `services/`, persistence in `models/`, checks in `validation/`, middleware in `middleware/`, and shared helpers in `lib/`.

```text
ai-reviewer-app/
|-- mobile/
|   |-- assets/
|   |   |-- images/                         # App images and logo
|   |   |-- icons/                          # Launcher and splash assets
|   |   `-- fonts/                          # Custom fonts (Geist Sans currently in assets/fonts/)
|   |-- src/
|   |   |-- app/
|   |   |   |-- _layout.jsx                 # Root navigation, theme, providers
|   |   |   |-- index.jsx                   # Restore session and redirect
|   |   |   |-- +not-found.jsx              # Unknown route
|   |   |   |-- (auth)/
|   |   |   |   |-- _layout.jsx             # Authentication navigation
|   |   |   |   |-- login.jsx               # Implemented sign-in, Remember me, session recognition
|   |   |   |   |-- register.jsx            # UI exists; account creation planned
|   |   |   |   |-- verify-email.jsx        # Implemented recovery email request
|   |   |   |   |-- otp.jsx                 # Implemented recovery-code verification and resend
|   |   |   |   `-- set-password.jsx        # Implemented recovery password update and local sign-out
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
|   |   |           `-- index.jsx           # In-app personal report
|   |   |-- components/
|   |   |   |-- ui/                         # Reusables components, added as needed
|   |   |   |-- AuthButton.jsx              # Existing submit button and disabled/busy state
|   |   |   |-- AuthMessage.jsx             # Existing feedback above submit buttons
|   |   |   |-- FormField.jsx               # Implemented
|   |   |   |-- PasswordStrength.jsx        # Implemented
|   |   |   |-- StartupSplash.jsx           # Implemented
|   |   |   |-- screen-state.jsx            # Shared loading, empty, error display
|   |   |   |-- material-card.jsx
|   |   |   |-- source-picker.jsx           # Saved module or IT topic
|   |   |   |-- label-picker.jsx            # Personal subject/topic labels
|   |   |   |-- question-card.jsx           # Question, options, readable code
|   |   |   |-- answer-feedback.jsx
|   |   |   |-- flashcard.jsx
|   |   |   |-- progress-summary.jsx
|   |   |   `-- topic-estimate.jsx          # Practice estimate and sample count
|   |   |-- hooks/                          # Custom hooks, added as needed
|   |   |-- providers/
|   |   |   `-- session-provider.jsx        # Auth session and profile
|   |   `-- lib/
|   |       |-- theme.js                    # Existing theme/navigation tokens
|   |       |-- utils.js                    # Existing class-name helper
|   |       |-- auth.js                     # Implemented auth validation rules
|   |       |-- supabase.js                 # Implemented public mobile Supabase client
|   |       |-- recovery-session.js         # Implemented in-memory recovery marker
|   |       |-- session-storage.js          # Implemented Remember me session storage
|   |       |-- api.js                      # Authenticated API requests/errors
|   |       |-- materials.js                # Import, status, retrieval, deletion
|   |       |-- quizzes.js                  # Generate, resume, answer, results
|   |       |-- flashcards.js               # Generate, list, review
|   |       |-- progress.js                 # Dashboard/report data requests
|   |       `-- study-date.js               # Device timezone and local study date
|   |-- test/
|   |   |-- auth-flow.test.jsx
|   |   |-- material-import.test.jsx
|   |   |-- quiz-session.test.jsx
|   |   `-- flashcard-review.test.jsx
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
|   |-- installation.md                     # Clone, configure, run
|   |-- commands.md                         # Detailed command handbook
|   |-- validation.md                       # Checks, benchmarks, and recorded evidence
|   |-- api.md                              # Requests, responses, auth, errors
|   |-- database.md                         # Tables, relationships, ownership
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
- Restore the session before choosing login or Dashboard. Registration does not require email confirmation. Password recovery starts without an existing session and follows Verify Email -> OTP -> Set Password. Require a valid six-digit code and the resulting recovery session before allowing a password change. Finish recovery before opening Dashboard. Students and instructors use one shared account type with the same features, permissions, core UI, and routes. Each account's resources remain private.
- Keep reusable UI in `components/`, custom hooks in `hooks/`, shared session state in `providers/`, and service requests/helpers in `lib/`. Add Reusables component files and custom hooks only as needed. The configured `@/hooks` alias does not require an empty hooks folder until hooks are written.
- Loading, empty, error, answer feedback, and deletion confirmation are screen states or components. They do not each need a separate route. Confirm module deletion with a warning about losing its derived content and results.

`mobile/src/lib/` holds client-side auth helpers, theme tokens, and API requests. The planned `server/src/lib/` holds usage limits and shared error definitions. The two applications do not share these directories.

The asset subfolders are a proposed organization. Existing assets currently remain directly under `mobile/assets/fonts/` and `mobile/assets/logo/`; update image imports and `app.json` references together if assets are consolidated into `images/` or `icons/`.

### MVC responsibilities and request flow

| Part | Location | Responsibility |
|---|---|---|
| View | Mobile `src/app/` and `components/` | Display data and handle user interaction using React Native components. |
| Routes | `server/src/routes/*Routes.js` | Connect HTTP methods and paths to authentication middleware and controller functions. |
| Controller | `server/src/controllers/*Controller.js` | Read the authenticated identity and input, validate request shape, call the service, and send a safe response. |
| Validation | `server/src/validation/*Validation.js` | Validate request shape, file limits, and parameter constraints before passing to service layer. |
| Service | `server/src/services/*Service.js` | Apply business rules and ownership checks; coordinate extraction, AI generation, scoring, and progress calculations. |
| Model | `server/src/models/*Model.js` | Use the server Supabase client for owner-scoped database/private Storage operations and atomic database functions. |

```text
React Native screen -> mobile API helper -> Express route + auth middleware
                    -> controller -> validation -> service -> model -> Supabase
```

The result returns through the same layers as a safe JSON response. React Native provides the view. Mobile `lib/` files handle API requests and public Supabase authentication; scoring and progress calculations stay on the server.

Group server files by layer and use camelCase names that identify their feature, such as `quizRoutes.js`, `quizController.js`, `quizService.js`, and `quizModel.js`. Keep server settings and clients in `config/`, request/output checks in `validation/`, and extraction, generation, prompts, and calculation helpers in `services/`. Shared usage limits and error definitions remain in `lib/`.

Use plain JavaScript functions and add files with their implementation. Start with one authenticated own-profile read in Phase 2 before expanding the pattern. Services call helper functions and models as needed. Do not add generic base classes, repository wrappers, or empty forwarding functions.

### Server and database safeguards

Keep answer keys and scoring on the server. Store stable option identifiers, accept one answer per question/session, and use atomic database operations for answer saving and completion. Preserve quiz sequence and adaptation state when resuming. Dashboard and report data use the same progress calculations.

The first migration defines the profiles and personal-label schema. The remaining migration names describe the intended responsibilities and order; their SQL remains to be designed. Add owner policies and constraints with each table migration. Keep answer keys inaccessible through direct mobile database access. Private bucket policies belong with the Storage migration, and atomic scoring/finalization functions belong with study operations.

Keep uploads in private Storage and real credentials out of Git. AI keys and privileged Supabase credentials belong only on the server. Students and instructors can access only their own resources; instructors cannot view student histories or publish shared quizzes. Confirmed module deletion removes its source, derived quizzes, flashcards, and study results, then recalculates affected progress and streaks while preserving unrelated history.

### Verification and remaining decisions

The mobile test files shown in the planned tree are not present. `session-storage.test.mjs`, used during development, is also absent from the current checkout; no repeatable mobile regression suite is retained here. When adding that suite, cover checked/unchecked Remember me, cold restarts, token refresh, disabling persistence, sign-out, and storage failures. Cover registration without email confirmation, the Verify Email -> OTP -> Set Password flow, rejected imports, interrupted sessions, duplicate answer submissions, complete versus partial flashcard reviews, and in-app report viewing. For recovery, check code delivery, resend limits, interrupted password updates, and rejection of invalid, expired, or reused codes. The Set Password screen must reject access without a verified recovery session.

The server has no general test folder or test command. Local extraction fixture checks and benchmark results are recorded in `docs/validation.md`; they do not verify an upload API. Feature verification still needs controller validation and safe responses, service business rules, model persistence and ownership, and a complete route-to-database flow. Cover two-account isolation, generation and source validation, answer-key integrity, difficulty transitions, duplicate-safe scoring, study dates and streaks, dashboard/report agreement, and deletion cleanup. Record commands and results in `docs/validation.md` when implemented.

The local extraction harness already uses a child process and bounded file, time, and memory limits. Production isolation, upload limits, hosting configuration, and the approved Groq model still depend on Phase 1 findings. Gemini stays disabled pending separate approval. Live-service and physical Android checks remain necessary before treating the planned integrations as working features.

## Project documents

| Document | Purpose |
|---|---|
| [Project overview](AI_Powered_Reviewer_Overview.md) | Explains the problem, intended users, and selected features. |
| [Roadmap](planning/ai-powered-reviewer-roadmap.md) | Records scope, implementation phases, and acceptance checks. |
| [Installation guide](docs/installation.md) | Explains contributor setup after cloning, including dependencies, environment files, startup, Android preview, and troubleshooting. |
| [Command handbook](docs/commands.md) | Detailed command reference covering Expo, Android SDK, Gradle, ADB, Node, and Metro. |
| [Validation evidence](docs/validation.md) | Records measured benchmark results, memory budgets, and test checks. |
| [Development page](docs/development.md) | Links developers to installation, folder, and roadmap documentation. |
| [Glossary](GLOSSARY.md) | Defines the terms used throughout the project. |
| [Private preparation decision](docs/adr/0001-private-independent-preparation.md) | Records privacy boundaries and module-deletion behavior. |
| `folder-structure.md` | Explains where existing and planned files belong. |
