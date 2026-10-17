# AI reviewer: folder structure

The project has separate mobile and server applications. Each keeps its own dependencies and lockfile.

The mobile starter is configured, and the Express starter runs a health endpoint. Application features, service connections, and database migrations still need to be written. The Supabase folder is empty.

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
|   |       |-- theme.js            # Light/dark tokens and navigation themes
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
| `src/lib/theme.js` | Defines light/dark colors and navigation themes. |
| `src/lib/utils.js` | Combines style class names and resolves conflicts. |
| `app.json` | Sets the app name, icons, appearance, link scheme, and Expo plugins. |
| `global.css` | Contains Tailwind directives and light/dark CSS variables. |
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

## Planned structure

This target includes both existing files and future additions. The tables below identify the planned folders and files. Create them when their features are implemented.

```text
ai-reviewer-app/
├── mobile/
│   ├── assets/                     # App images, fonts, icons
│   ├── src/
│   │   ├── app/                    # Expo Router screens and layouts only
│   │   │   ├── _layout.jsx
│   │   │   ├── index.jsx
│   │   │   ├── (auth)/             # Sign-in, registration, recovery routes
│   │   │   └── (main)/             # Authenticated application routes
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── materials/
│   │   │   ├── quizzes/
│   │   │   ├── flashcards/
│   │   │   ├── progress/
│   │   │   └── reports/
│   │   ├── components/
│   │   │   └── ui/                # React Native Reusables components
│   │   ├── providers/
│   │   │   └── session-provider.jsx
│   │   └── lib/
│   │       ├── theme.js           # Existing light/dark tokens and navigation themes
│   │       ├── utils.js           # Existing class-name merging helper
│   │       ├── api.js             # Authenticated requests to Express
│   │       └── supabase.js        # Mobile Supabase client
│   ├── test/
│   ├── global.css
│   ├── app.json
│   ├── babel.config.js
│   ├── tailwind.config.js
│   ├── jsconfig.json
│   ├── eslint.config.js
│   ├── metro.config.js
│   ├── components.json
│   ├── eas.json
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── server/
│   ├── src/
│   │   ├── app.js                 # Configure Express and mount routes
│   │   ├── server.js              # Start the HTTP listener
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── error-handler.js
│   │   ├── features/
│   │   │   ├── materials/         # Import and extract PDF/DOCX content
│   │   │   ├── quizzes/           # Generate, answer, score, adapt
│   │   │   ├── flashcards/
│   │   │   └── progress/          # Dashboard and personal report data
│   │   └── lib/
│   │       ├── supabase.js        # Server database and storage access
│   │       └── ai.js              # Requests to the approved AI provider
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                # Tables, constraints, RLS, storage policies
│   └── seed.sql                   # Synthetic development data
│
├── docs/
│   ├── development.md
│   ├── installation.md
│   └── adr/
│       └── 0001-private-independent-preparation.md
├── planning/
│   └── ai-powered-reviewer-roadmap.md
├── AI_Powered_Reviewer_Overview.md
├── GLOSSARY.md
├── folder-structure.md
├── README.md
└── .gitignore
```

### Planned mobile folders

These paths are relative to `mobile/src/`. None of these folders exists yet.

| Folder | Purpose |
|---|---|
| `app/(auth)/` | Sign-in, registration, and account-recovery routes. |
| `app/(main)/` | Routes for signed-in users. |
| `features/` | Groups application code by feature. |
| `features/auth/` | Account forms and session-related behavior. |
| `features/materials/` | Module selection, uploads, extracted-text previews, and personal labels. |
| `features/quizzes/` | Quiz settings, questions, feedback, and results. |
| `features/flashcards/` | Flashcard sets and front/back review. |
| `features/progress/` | Scores, streaks, topic estimates, and recommendations. |
| `features/reports/` | Personal reports and PDF export. |
| `components/` | Reusable interface components. |
| `components/ui/` | Copied React Native Reusables components. |
| `providers/` | Shared application context, such as the signed-in session. |

### Planned server and database folders

| Folder | Purpose |
|---|---|
| `server/src/middleware/` | Shared request checks and error handling. |
| `server/src/features/` | Groups API operations by feature. |
| `server/src/features/materials/` | Validates imports and extracts PDF/DOCX text. |
| `server/src/features/quizzes/` | Generates questions, checks answers, scores sessions, and adjusts difficulty. |
| `server/src/features/flashcards/` | Generates and saves personal flashcards. |
| `server/src/features/progress/` | Calculates dashboard and report data. |
| `server/src/lib/` | Shared database, storage, and AI clients. |
| `mobile/test/` | Tests critical mobile screen behavior. |
| `supabase/migrations/` | Versioned SQL for tables, constraints, and access policies. |

### Planned files

| File | Purpose |
|---|---|
| `mobile/src/providers/session-provider.jsx` | Makes the current account session available to screens. |
| `mobile/src/lib/api.js` | Sends authenticated requests to Express. |
| `mobile/src/lib/supabase.js` | Creates the mobile Supabase client. |
| `mobile/eas.json` | Defines Android build profiles. |
| `server/src/middleware/auth.js` | Verifies identity on protected requests. |
| `server/src/middleware/error-handler.js` | Returns consistent API errors. |
| `server/src/lib/supabase.js` | Connects the server to the database and private Storage. |
| `server/src/lib/ai.js` | Sends requests to the approved AI provider. |
| `supabase/config.toml` | Configures the Supabase CLI when needed. |
| `supabase/seed.sql` | Adds synthetic development data. |
| `README.md` | Introduces the project and links to its guides. |

Keep uploads in private Storage and real credentials out of Git. AI keys and privileged Supabase credentials belong only on the server. Student and instructor accounts remain private; instructors cannot access student histories or publish shared quizzes.

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
