# Installation

Follow this guide after cloning the project. Open PowerShell in the repository root, the folder containing `mobile/` and `server/`. These instructions cover Windows and an Android phone or emulator.

## 1. Install the prerequisites

- Install [Git for Windows](https://git-scm.com/downloads/win).
- Install [Node.js](https://nodejs.org/en/download), which includes npm. The maintainer checked this workspace with Node.js `24.20.0` and npm `11.19.0`; use those as the tested reference.
- For an initial phone preview, install [Expo Go for SDK 57](https://expo.dev/go?sdkVersion=57&platform=android&device=true). Follow the [Expo environment guide](https://docs.expo.dev/get-started/set-up-your-environment/) if using an emulator or development build.

Reopen PowerShell after installation and check:

```powershell
git --version
node --version
npm.cmd --version
```

## 2. Install dependencies

From the repository root:

```powershell
npm.cmd ci --prefix mobile
npm.cmd ci --prefix server
```

Each application has its own manifest and lockfile. There is no root install command. Expo, NativeWind, and Reusables configuration is already in the repository; do not generate a new starter or repeat their initial setup.

## 3. Add your local environment files

On a fresh checkout, create local copies of the templates. Skip a copy if its destination already exists so you keep your local values:

```powershell
Copy-Item -LiteralPath mobile/.env.example -Destination mobile/.env
Copy-Item -LiteralPath server/.env.example -Destination server/.env
```

Ask the maintainer privately for the authorized development values, then edit the local files:

| File | Values |
|---|---|
| `mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `EXPO_PUBLIC_API_URL`. |
| `server/.env` | `PORT`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`, and `GROQ_MODEL`. |

Set `PORT=3000` for the default local API. The starter currently reads only `PORT`; the service variables are for the integrations still to be implemented. Request privileged service keys only when your assigned work needs them.

Keep placeholders in `.env.example`. Real values belong in ignored `.env` files. Groq keys and privileged Supabase keys must stay on the server and must never use an `EXPO_PUBLIC_` prefix.

For an Android phone, set `EXPO_PUBLIC_API_URL` to your own PC LAN IPv4 address and API port, such as `http://192.168.1.20:3000`. Replace that example address with yours. You can find the active network adapter IPv4 address with:

```powershell
ipconfig
```

The standard Android emulator reaches the PC at `http://10.0.2.2:3000`. A phone or emulator uses its own `localhost`, so the PC API needs the appropriate address. The mobile API client has not been implemented yet; setting this variable alone does not connect the app.

## 4. Start Express and Expo

Open two PowerShell terminals at the repository root.

In the first terminal:

```powershell
cd server
npm.cmd run dev
```

Open `http://localhost:3000/health` on your PC. The expected response is HTTP 200 with `{"status":"ok"}`. Use your configured port if it differs from 3000. This confirms that Express is running; it does not verify Supabase or Groq.

In the second terminal:

```powershell
cd mobile
npm.cmd start
```

For a phone preview, keep the PC and phone on the same reachable network and scan the terminal QR code with a compatible Expo Go app. For a configured Android emulator, start it and press `a` in the Expo terminal. The expected app screen is still a placeholder.

Use a matching development build when the native configuration requires one. The [Expo environment guide](https://docs.expo.dev/get-started/set-up-your-environment/) explains that setup.

## 5. Check the installation

From `mobile/`, run:

```powershell
npm.cmd run lint
npx.cmd expo install --check
npx.cmd expo-doctor
node node_modules/typescript/bin/tsc -p jsconfig.json --allowJs --checkJs --noEmit --jsx react-native --skipLibCheck --esModuleInterop --types nativewind/types --noImplicitAny false --noUncheckedSideEffectImports false
```

From `server/`, run:

```powershell
npm.cmd ls --depth=0
```

The type check covers JavaScript/JSX under `src/` using the TypeScript package currently available in the dependency tree. It allows implicit argument types and the CSS import; Metro checks that import when bundling. The server has no automated test folder or test command; use the health response for its startup check.

If you run Reusables doctor, CLI 0.7.1 reports missing layout, theme, and helper files because it expects TypeScript filenames. This project uses JavaScript/JSX, so use the checks above and verify the app on Android.

## Common setup problems

| Problem | What to check |
|---|---|
| `EADDRINUSE` when starting Express | Check whether another terminal already runs the API. Stop that instance or choose a free port and update the mobile API URL to match. |
| Expo reports an SDK mismatch | Use an Expo Go version or development build matching the project SDK 57. |
| The phone cannot load the preview or reach the API | Check the PC address, shared network, and Windows Firewall permissions for development traffic. A Metro tunnel does not expose Express. |
| Styling changes are not picked up | Stop Expo, then run `npx.cmd expo start --clear` from `mobile/`. |
| An environment template or source file is missing | Confirm you have the branch and commits shared by the maintainer. |

The [folder guide](../folder-structure.md) explains where files belong. The [roadmap](../planning/ai-powered-reviewer-roadmap.md) covers the planned features. Authentication, document imports, quizzes, flashcards, progress, and PDF reports are not implemented yet.

This guide reflects the maintainer's local checkout. Fresh-clone installation on a collaborator's computer, live service connections, and Android device behavior remain unverified.
