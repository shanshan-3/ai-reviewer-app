# AI reviewer: proposed folder structure

Use one repository with separate Android and Express applications. Organize their code by feature, and keep Supabase migrations at the repository root.

This is a proposed layout. The application folders and configuration files have not been created. The [roadmap](planning/ai-powered-reviewer-roadmap.md) records the agreed features and phases, based on the [project overview](AI_Powered_Reviewer_Overview.md).

## Directory layout

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
│   │       ├── api.js             # Authenticated requests to Express
│   │       └── supabase.js        # Mobile Supabase client
│   ├── test/
│   ├── global.css
│   ├── app.config.js
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
│   ├── test/
│   │   └── fixtures/              # Small synthetic test documents
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                # Tables, constraints, RLS, storage policies
│   └── seed.sql                   # Synthetic development data
│
├── planning/
│   └── ai-powered-reviewer-roadmap.md
├── AI_Powered_Reviewer_Overview.md
├── folder-structure.md
├── README.md
└── .gitignore
```

Each application has its own dependencies and lockfile. A root package manifest, workspace manager, and shared package are unnecessary for the initial version. Create the folders as their features are implemented.

## Mobile application

Keep navigation in `mobile/src/app/`. Route files load feature screens and handle navigation parameters. Forms, quiz interactions, hooks, and feature-specific components belong in the corresponding feature folder. Expo treats files in its route directory as routes, so helpers and reusable components must stay outside it. [Expo Router concepts](https://docs.expo.dev/router/basics/core-concepts/)

| Folder | Responsibility |
|---|---|
| `features/auth/` | Account screens, recovery, and profile presentation |
| `features/materials/` | File selection, upload state, extracted-text previews, and subject/topic labels |
| `features/quizzes/` | Quiz configuration, multiple-choice questions, code snippets, feedback, and results |
| `features/flashcards/` | Personal flashcard sets and front/back review |
| `features/progress/` | Scores, streaks, subject/topic estimates, and recommendations |
| `features/reports/` | Personal report display and Android PDF export |
| `components/ui/` | Copied React Native Reusables components shared across features |
| `providers/` | Application-wide session context |
| `lib/` | Shared API and Supabase clients |

Student and instructor entry screens can differ while reusing the same preparation features. Keep role-specific behavior within those features instead of duplicating the whole application by role. Instructors have no access to student histories or shared publishing tools.

App configuration, Metro configuration, Reusables configuration, and build profiles stay at the mobile application root. Add any Babel or Tailwind configuration required by the pinned NativeWind version there as well. Verify the exact configuration with the selected Expo version. [Expo source-directory guidance](https://docs.expo.dev/router/reference/src-directory/)

## Express API

Group HTTP handling and operations by feature. A server feature can start with:

```text
server/src/features/materials/
├── routes.js
└── service.js
```

`routes.js` handles requests and responses. `service.js` performs the feature's operations. Split extraction, scoring, or validation into additional files when those responsibilities become substantial. Express does not require a particular folder architecture. [Express structure guidance](https://expressjs.com/en/starter/faq/)

Keep PDF/DOCX extraction, AI requests, answer keys, scoring, and difficulty rules on the server. The progress feature supplies dashboard and personal report data; the mobile reports feature handles PDF export.

`app.js` configures Express without opening a port. `server.js` starts the listener, allowing tests to import the app without starting a separate server process. Authentication and error handling are shared middleware.

Use `lib/ai.js` for approved provider requests. Groq is primary; Gemini remains a conditional alternative under the roadmap's data-use requirements. A provider plug-in framework is unnecessary at this stage.

## Database, files, and configuration

Store versioned SQL changes in `supabase/migrations/`, including tables, constraints, Row Level Security, and private Storage policies. Use `seed.sql` for synthetic development data. [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations)

Uploaded school modules belong in private Storage. Keep them out of app assets, test fixtures, and the repository. Clean up temporary extraction files; the server's local filesystem is not permanent document storage.

Each application's `.env.example` lists required settings without credentials. Ignore real environment files, dependency folders, caches, generated builds, and signing credentials. The mobile application receives only settings safe to expose to users. AI keys and privileged Supabase credentials remain on the server.

## Tests and implementation order

Use `mobile/test/` for critical screen behavior and `server/test/` for API, ownership, extraction, scoring, and adaptation checks. Keep small synthetic PDF/DOCX samples in `server/test/fixtures/`.

When implementation begins:

1. Create only the folders needed for the current roadmap phase.
2. Verify the Expo, NativeWind, and Reusables setup on Android before expanding the screens.
3. Verify that tests can import Express without opening a port.
4. Apply migrations to an isolated development database and check ownership with separate accounts.
5. Add feature files and tests as each capability is implemented.

This structure does not resolve the roadmap's free-hosting, email-delivery, AI-capacity, or physical-device validation requirements.
