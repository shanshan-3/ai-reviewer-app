# Installation and remaining setup

For the current Windows checkout. Updated on 2026-10-17.

## Current status

The mobile app uses Expo SDK 57 with JavaScript/JSX. Router, NativeWind, Reusables configuration, themes, and aliases are set up. Server dependencies are installed, but API code and service connections still need to be written. The Supabase folder is empty.

Mobile lint, JavaScript checks, Expo Doctor, and an Android bundle export passed. The server dependency check also passed. Android device testing is pending.

See the [folder structure](../folder-structure.md) for file locations and the [roadmap](../planning/ai-powered-reviewer-roadmap.md) for implementation and release requirements.

## 1. Restore dependencies

Use these commands when restoring this checkout. Skip them if dependencies are already installed. Node.js and npm must be available. Use `npm.cmd` and `npx.cmd` in PowerShell to avoid script-policy errors.

Mobile:

```powershell
Set-Location 'C:\Users\Administrator\Desktop\ai-reviewer-app\mobile'
npm.cmd ci
```

Server:

```powershell
Set-Location 'C:\Users\Administrator\Desktop\ai-reviewer-app\server'
npm.cmd ci
```

Both folders already have manifests and lockfiles. Keep their dependencies separate and use the locked versions.

## 2. Finish service setup

Start here if dependencies are installed. Add the ignore rules in Section 3 before saving credentials.

### Supabase

1. Create a development project on the free plan in the [Supabase dashboard](https://supabase.com/dashboard). Check the account limits.
2. Copy the project URL and publishable key into the environment files below. Keep secret or legacy `service_role` keys on the server.
3. Implement the application schema and owner policies in `supabase/migrations/`. Enable Row Level Security and use a private Storage bucket with owner policies before uploading real modules.
4. Configure email/password authentication, confirmation and recovery emails, and the app return URLs. Test return links in the installed Android build.

The hosted setup does not require a local PostgreSQL installation. Schema and authentication implementation follow the roadmap.

### Groq

Create an API key using the [Groq quickstart](https://console.groq.com/docs/quickstart). Check the model free quotas, structured-output support, and retention settings, then record the tested model ID in the server environment.

Use synthetic text for the first request. Follow the roadmap material-use requirements before sending school content. Keep Gemini disabled.

## 3. Add environment files

The environment files have not been created. The root `.gitignore` exists but is empty. Before adding real credentials, add these rules to it:

```gitignore
**/node_modules/
**/.expo/
**/.env
**/.env.*
!**/.env.example
**/dist/
**/build/
*.jks
*.keystore
```

Create the following `.env.example` files with placeholders, then copy each to `.env` locally. The application code must read these variable names when service connections are implemented.

`mobile/.env.example`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3000
```

`server/.env.example`:

```dotenv
PORT=3000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
GROQ_API_KEY=YOUR_SERVER_ONLY_GROQ_KEY
GROQ_MODEL=YOUR_TESTED_MODEL_ID
```

Public mobile variables are bundled into the app. Keep AI keys and privileged Supabase credentials on the server, and enforce ownership through API checks and database/Storage policies. See [Supabase API keys](https://supabase.com/docs/guides/api/api-keys).

Commit placeholder examples and lockfiles. Keep credentials, uploaded modules, generated APKs, and signing keys out of Git. Restart Expo after changing public environment values.

## 4. Run the app and API

The API needs implementation before it can run. Its generated manifest points to a missing entry file, and its test script is a failing placeholder. Follow the roadmap and folder guide when writing the server.

Once the API entry point and environment file exist, run from `server/`:

```powershell
node --env-file=.env --watch src/server.js
```

Use a second terminal for Expo:

```powershell
# Run from mobile/
npx.cmd expo start
```

For a physical Android device, set `EXPO_PUBLIC_API_URL` to the PC LAN IPv4 address and API port. Keep both devices on the same reachable network and allow the development connection through Windows Firewall. The server must listen on an interface the device can reach. `localhost` on the phone refers to the phone; the standard Android emulator reaches the PC through `10.0.2.2`.

A Metro tunnel does not expose the Express API. Use HTTPS for a deployed API and verify network access in the installed build.

After bundler configuration changes, clear the cache:

```powershell
npx.cmd expo start --clear
```

Use an [Expo development build](https://docs.expo.dev/develop/development-builds/introduction/) when the native configuration requires one.

## 5. Check the setup

Run from `mobile/`:

```powershell
npx.cmd expo install --check
npx.cmd expo-doctor
npm.cmd ls --depth=0
npm.cmd ls react react-dom react-native-reanimated react-native-worklets expo-font
npm.cmd run lint
node node_modules/typescript/bin/tsc -p jsconfig.json --allowJs --checkJs --noEmit --jsx react-native --skipLibCheck --esModuleInterop --types nativewind/types --noImplicitAny false --noUncheckedSideEffectImports false
```

The type check covers JavaScript/JSX under `src/`. It allows implicit argument types and the CSS import; Metro checks the import when bundling. TypeScript is currently available through the dependency tree rather than as a direct dependency.

Run from `server/`:

```powershell
npm.cmd ls --depth=0
```

The Reusables diagnostic command is:

```powershell
npx.cmd @react-native-reusables/cli@latest doctor
```

CLI 0.7.1 reports missing layout, theme, and helper files because it expects TypeScript filenames. This project uses JavaScript/JSX. That diagnostic has not passed; the app passed the separate checks listed above.

Device rendering, portal behavior, authentication, private access, document extraction, AI requests, and PDF export still need runtime checks. Follow the roadmap before storing real campus data or releasing the app.
