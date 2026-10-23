# Project command handbook

RebyuIT has two applications: an Expo Android app in `mobile/` and an Express API in `server/`. Open separate PowerShell terminals when both need to run.

## Contents

- [Project map and prerequisites](#project-map-and-prerequisites)
- [How to read the commands](#how-to-read-the-commands)
- [1. Project setup and installation](#1-project-setup-and-installation)
- [2. Running development servers](#2-running-development-servers)
- [3. Frontend configuration and exports](#3-frontend-configuration-and-exports)
- [4. Backend and API development](#4-backend-and-api-development)
- [5. React Native and Expo native builds](#5-react-native-and-expo-native-builds)
- [6. Android SDK, Gradle, and ADB](#6-android-sdk-gradle-and-adb)
- [7. Building and installing APKs](#7-building-and-installing-apks)
- [8. EAS cloud builds](#8-eas-cloud-builds)
- [9. Testing and debugging](#9-testing-and-debugging)
- [10. Dependency management](#10-dependency-management)
- [11. Cache cleaning and troubleshooting](#11-cache-cleaning-and-troubleshooting)
- [12. Git and GitHub](#12-git-and-github)
- [13. Production and deployment](#13-production-and-deployment)
- [14. System and environment commands](#14-system-and-environment-commands)
- [15. Project-specific help](#15-project-specific-help)
- [Practical workflows](#practical-workflows)
- [Official references](#official-references)
- [Quick reference](#quick-reference)

## Project map and prerequisites

| Area | Files and tools | Current behavior |
|---|---|---|
| Mobile application | JavaScript/JSX, React 19.2.3, React Native 0.86.3, Expo ~57.0.30, Expo Router ~57.0.28 | Android is the agreed target. Entry redirects to the login screen. Login and registration perform local validation; service authentication is not connected. |
| Styling and UI | CSS, NativeWind 4.2.7, Tailwind CSS 3.4.17, tailwindcss-animate, clsx, tailwind-merge, class-variance-authority | Metro and Babel already connect NativeWind to global.css. Reusables generator settings exist in components.json. |
| Native UI libraries | Lucide icons, react-native-svg, Reanimated, Worklets, safe-area-context, screens, @rn-primitives/portal | Native dependencies are compiled into the development app. |
| Expo modules | constants, dev-client, document-picker, file-system, font, linking, print, sharing, splash-screen, status-bar, system-ui | Packages are declared; installing a library does not mean its feature is implemented. |
| Mobile storage and service libraries | AsyncStorage, @supabase/supabase-js | Dependencies exist; persistent authentication and Supabase integration are pending. |
| Backend | JavaScript ES modules, Node.js, Express ^5.3.0 | Only GET /health is implemented. The listener validates PORT and defaults to 3000. |
| Backend service libraries | @supabase/supabase-js, groq-sdk, mammoth, pdfjs-dist | Supabase, AI requests, DOCX extraction, and PDF extraction are planned integrations. |
| Database | Supabase PostgreSQL, Auth, and Storage selected | supabase/migrations/ contains no migrations. No Supabase CLI configuration, local database stack, SQL scripts, or ORM is configured. |
| Dependency installation | Separate package.json and package-lock.json in mobile/ and server/ | Use npm for each package. There is no root package.json or workspace script. |
| Bundling and checks | Metro, babel-preset-expo, ESLint 9 with eslint-config-expo; TypeScript available transitively | JavaScript checks use jsconfig.json. No automated test runner or test script is configured. |
| Local Android build | Generated mobile/android/, Gradle wrapper 9.3.1, Android Gradle plugin, Java/Kotlin native tooling, Android SDK, ADB | android/ is ignored by Git. app.json and config plugins hold reproducible native configuration. |
| Cloud build and hosting | EAS is a planned option; backend host undecided | No eas.json, EAS Update setup, Dockerfile, or deployment pipeline is present. |

The complete dependency names and requested versions are in [mobile/package.json](../mobile/package.json) and [server/package.json](../server/package.json). There is no PHP/Composer, Python application, Vite frontend, or MySQL project to run here.

Use Node.js compatible with both packages. The [installation guide](installation.md) records Node.js 24.20.0 and npm 11.19.0 as its tested reference; this handbook does not repeat that runtime validation. Node 20 alone is insufficient for the installed PDF library, whose package requires Node >=22.13.0 or >=24.

For local native builds, install a compatible JDK and Android SDK using the [Expo Android environment guide](https://docs.expo.dev/workflow/android-studio-emulator/). Android Studio provides SDK and emulator management. Cloud EAS builds supply their own native build tools. ADB still needs local Android platform-tools when you want USB installation or debugging.

### Declared npm scripts

Each script has a full command entry below.

| Package | Script | Exact script value |
|---|---|---|
| Mobile | start | expo start |
| Mobile | android | expo run:android |
| Mobile | ios | expo run:ios |
| Mobile | web | expo start --web |
| Mobile | lint | expo lint |
| Server | start | node --env-file=.env src/server.js |
| Server | dev | node --env-file=.env --watch src/server.js |

Neither package declares build, test, typecheck, migration, or deployment scripts. Supabase management commands are omitted until a database workflow is configured. EAS examples are explicitly conditional because their configuration does not exist yet.

## How to read the commands

| Folder name | Full path |
|---|---|
| Root | C:\ai-reviewer-app |
| Mobile | C:\ai-reviewer-app\mobile |
| Server | C:\ai-reviewer-app\server |
| Android | C:\ai-reviewer-app\mobile\android |

- Run each command separately. A server keeps its terminal occupied; use another terminal for the next task.
- Examples use PowerShell. npm.cmd and npx.cmd select Windows command launchers and avoid PowerShell's npm.ps1/npx.ps1 execution-policy errors. In CMD, npm and npx usually work too. Do not change system execution policy just to run them.
- npm runs package scripts or manages dependencies. npx runs a package's executable, using the local installation when available; it may offer to download missing tools.
- A flag starts with a hyphen and changes command behavior. An argument supplies a value, such as a port, package name, file path, or profile.
- Replace uppercase placeholders such as PACKAGE_NAME, DEVICE_SERIAL, PATH_TO_APK, BUILD_ID, and BRANCH_NAME. They are not real project values. Keep quotes around paths or messages containing spaces.
- Metro is the development server that bundles JavaScript and assets. Fast Refresh reloads supported source changes. Neither operation compiles a new native APK.
- An APK is an installable Android package. An AAB is a store publishing bundle and cannot be installed directly with ADB.
- A development build contains expo-dev-client and normally loads JavaScript from Metro. A preview or release build embeds JavaScript so it can start without Metro; its online features still need a reachable API.
- Stop a foreground development server or log stream with Ctrl+C. This is a keyboard shortcut, not text to paste.
- Read Important notes before commands that regenerate files, change dependencies, stop processes, publish commits, or upload builds.

## 1. Project setup and installation

Install dependencies separately. The clean-install commands require both lockfiles to match their manifests. [npm explains how clean installs use the lockfile](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

### Command: `cd C:\ai-reviewer-app`

**Purpose:** Open the repository root.

**Explanation:** PowerShell changes its current working directory. Relative paths in later commands start from this folder.

**When to use:** Before repository-wide setup or Git work.

**Where to run:** Any folder.

**Command:**

```powershell
cd C:\ai-reviewer-app
```

**Command components:**

- `cd`: Alias for Set-Location.
- `C:\ai-reviewer-app`: This checkout's root folder.

**Important notes:**

- Change the path if you cloned the repository elsewhere.

### Command: `cd C:\ai-reviewer-app\mobile`

**Purpose:** Open the Expo app folder.

**Explanation:** This selects the package containing app.json and the mobile npm scripts.

**When to use:** Before Expo, mobile dependency, lint, or export commands.

**Where to run:** Any folder.

**Command:**

```powershell
cd C:\ai-reviewer-app\mobile
```

**Command components:**

- `cd`: Changes the current folder.
- `The full path`: Selects the mobile package.

**Important notes:**

- Running npm start at the repository root fails because the root has no package.json.

### Command: `cd C:\ai-reviewer-app\server`

**Purpose:** Open the Express package.

**Explanation:** This selects the package containing the server scripts and its own dependency tree.

**When to use:** Before API startup or server package changes.

**Where to run:** Any folder.

**Command:**

```powershell
cd C:\ai-reviewer-app\server
```

**Command components:**

- `cd`: Changes the current folder.
- `The full path`: Selects the server package.

**Important notes:**

- Mobile and server dependencies are independent.

### Command: `npm.cmd ci --prefix mobile`

**Purpose:** Restore the mobile dependency tree.

**Explanation:** npm installs the exact locked dependency tree after checking that package.json agrees with package-lock.json.

**When to use:** After cloning, or when you need a reproducible dependency reinstall.

**Where to run:** Root.

**Command:**

```powershell
npm.cmd ci --prefix mobile
```

**Command components:**

- `npm.cmd`: Runs npm.
- `ci`: Performs a clean install.
- `--prefix mobile`: Operates on the mobile package.

**Important notes:**

- Replaces mobile/node_modules and can run dependency lifecycle scripts. It does not rewrite the lockfile to repair mismatches. It does not create an APK.

### Command: `npm.cmd ci --prefix server`

**Purpose:** Restore the server dependency tree.

**Explanation:** This installs the Express package's locked dependencies without needing to change folders.

**When to use:** During initial setup or a server dependency reinstall.

**Where to run:** Root.

**Command:**

```powershell
npm.cmd ci --prefix server
```

**Command components:**

- `npm.cmd`: Runs npm.
- `ci`: Performs a clean install.
- `--prefix server`: Selects the server package.

**Important notes:**

- Replaces server/node_modules. Requires network access for packages absent from npm's cache.

### Command: `npm.cmd install`

**Purpose:** Install dependencies and reconcile the lockfile.

**Explanation:** npm reads the current package manifest, installs packages, and may update package-lock.json to match.

**When to use:** When intentionally changing dependencies or resolving a reviewed manifest/lockfile mismatch.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd install
```

**Command components:**

- `npm.cmd`: Runs npm.
- `install`: Installs dependencies in the current package.

**Important notes:**

- For an unchanged fresh clone, prefer ci. Review manifest and lockfile changes before committing.

### Command: `Test-Path mobile/.env`

**Purpose:** Check for an existing mobile environment file.

**Explanation:** PowerShell returns True if the path exists and False otherwise, without reading its contents.

**When to use:** Before copying an environment template.

**Where to run:** Root.

**Command:**

```powershell
Test-Path mobile/.env
```

**Command components:**

- `Test-Path`: Checks whether a path exists.
- `mobile/.env`: The mobile environment file.

**Important notes:**

- If True, edit the existing file instead of replacing your values.

### Command: `Test-Path server/.env`

**Purpose:** Check for an existing backend environment file.

**Explanation:** This checks the server environment path without printing any credentials.

**When to use:** Before setting up the server environment.

**Where to run:** Root.

**Command:**

```powershell
Test-Path server/.env
```

**Command components:**

- `Test-Path`: Tests path existence.
- `server/.env`: The server's local settings file.

**Important notes:**

- An existing file may already contain private service credentials.

### Command: `Copy-Item -LiteralPath mobile/.env.example -Destination mobile/.env -Confirm`

**Purpose:** Create mobile environment settings from the template.

**Explanation:** PowerShell copies placeholder settings to the filename Expo loads locally, asking before the copy.

**When to use:** Fresh setup, after confirming mobile/.env does not already exist.

**Where to run:** Root.

**Command:**

```powershell
Copy-Item -LiteralPath mobile/.env.example -Destination mobile/.env -Confirm
```

**Command components:**

- `Copy-Item`: Copies a file.
- `-LiteralPath`: Treats the source as an exact path.
- `-Destination`: Names the output file.
- `-Confirm`: Prompts before copying.

**Important notes:**

- Approving the copy when .env exists can overwrite its contents. EXPO_PUBLIC_ values are included in the app and must not contain private keys.

### Command: `Copy-Item -LiteralPath server/.env.example -Destination server/.env -Confirm`

**Purpose:** Create backend environment settings from the template.

**Explanation:** The server scripts expect a .env file. This copies the example settings into that location.

**When to use:** Fresh backend setup, when server/.env is absent.

**Where to run:** Root.

**Command:**

```powershell
Copy-Item -LiteralPath server/.env.example -Destination server/.env -Confirm
```

**Command components:**

- `Copy-Item`: Copies the template.
- `-LiteralPath`: Uses the exact source path.
- `-Destination`: Sets the target.
- `-Confirm`: Asks before the operation.

**Important notes:**

- An approved overwrite replaces existing settings. Keep Groq and privileged Supabase keys server-only.

### Command: `notepad.exe mobile/.env`

**Purpose:** Edit mobile environment values.

**Explanation:** Notepad opens the local settings file so you can set public Supabase values and the development API URL.

**When to use:** After copying the mobile template or changing the API address.

**Where to run:** Root.

**Command:**

```powershell
notepad.exe mobile/.env
```

**Command components:**

- `notepad.exe`: Opens Windows Notepad.
- `mobile/.env`: File to edit.

**Important notes:**

- Use your PC's reachable LAN address for a phone, 10.0.2.2 for the standard Android emulator, or USB forwarding as documented below. The API client is not connected yet.

### Command: `notepad.exe server/.env`

**Purpose:** Edit backend environment values.

**Explanation:** Open the local server settings and configure PORT or service values when their integrations are needed.

**When to use:** After copying the backend template.

**Where to run:** Root.

**Command:**

```powershell
notepad.exe server/.env
```

**Command components:**

- `notepad.exe`: Opens the editor.
- `server/.env`: Backend settings file.

**Important notes:**

- The current starter reads PORT only. Preserve placeholder examples in Git and keep real keys out of commits, screenshots, and terminal logs.

## 2. Running development servers

Use the installed RebyuIT development app for native testing. Expo Go is a separate, limited preview. Start Express in a second terminal when you need the health endpoint or later API work.

### Command: `npm.cmd start`

**Purpose:** Start the mobile development server.

**Explanation:** The mobile start script runs expo start. With expo-dev-client installed, Expo normally targets a development build.

**When to use:** At the beginning of an ordinary mobile editing session.

**Where to run:** Mobile.

**Command:**

```powershell
npm.cmd start
```

**Command components:**

- `npm.cmd`: Runs npm.
- `start`: Executes the package's start script.

**Important notes:**

- Requires installed dependencies and a compatible app on your target device. It serves JavaScript and does not create an APK.

### Command: `npx.cmd expo start`

**Purpose:** Start Metro directly through Expo CLI.

**Explanation:** This invokes the same Expo startup command as the mobile start script.

**When to use:** When you prefer the direct Expo command or need to add Expo flags.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start
```

**Command components:**

- `npx.cmd`: Runs a package executable.
- `expo`: Uses this project's Expo CLI.
- `start`: Starts its development server.

**Important notes:**

- Do not run this alongside another Metro instance on the same port.

### Command: `npm.cmd start -- --dev-client`

**Purpose:** Start Metro for the RebyuIT development APK.

**Explanation:** npm forwards the supplied flag to expo start, which generates links for a custom development app.

**When to use:** Daily development after installing a compatible RebyuIT Dev APK.

**Where to run:** Mobile.

**Command:**

```powershell
npm.cmd start -- --dev-client
```

**Command components:**

- `npm.cmd start`: Runs the start script.
- `--`: Ends npm option parsing and forwards the following arguments.
- `--dev-client`: Selects the custom development client.

**Important notes:**

- Does not install expo-dev-client or build the APK. Open the installed app and connect it to this server.

### Command: `npx.cmd expo start --dev-client`

**Purpose:** Explicitly target the installed development app.

**Explanation:** Expo serves the JavaScript bundle and produces development-client connection links.

**When to use:** When you want the direct equivalent of the npm command above.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client
```

**Command components:**

- `npx.cmd expo start`: Starts Expo.
- `--dev-client`: Targets a custom native development build.

**Important notes:**

- Native dependencies in the APK must match the project. Rebuild after native dependency changes.

### Command: `npx.cmd expo start --go`

**Purpose:** Start a compatible Expo Go preview.

**Explanation:** Expo generates links for Expo Go instead of the project's development client.

**When to use:** For a quick preview of features supported by your Expo Go version.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --go
```

**Command components:**

- `npx.cmd expo start`: Starts Metro.
- `--go`: Selects Expo Go.

**Important notes:**

- Requires Expo Go compatible with SDK 57. Native libraries and configuration are limited to what Expo Go supports. This does not validate the installed app's splash screen.

### Command: `npm.cmd start -- --go`

**Purpose:** Use Expo Go through the npm script.

**Explanation:** This forwards Expo Go selection to the existing mobile start script.

**When to use:** When using npm scripts for an optional Expo Go session.

**Where to run:** Mobile.

**Command:**

```powershell
npm.cmd start -- --go
```

**Command components:**

- `npm.cmd start`: Runs expo start.
- `--`: Forwards following flags.
- `--go`: Selects Expo Go.

**Important notes:**

- Use either this command or the direct --go command, not both.

### Command: `npx.cmd expo start --dev-client --lan`

**Purpose:** Serve the development app across the local network.

**Explanation:** Expo advertises a local network address for Metro so a reachable phone can connect.

**When to use:** When the PC and phone share a usable LAN or Wi-Fi network.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --lan
```

**Command components:**

- `--dev-client`: Targets RebyuIT's development build.
- `--lan`: Selects LAN hosting, which is normally the default.

**Important notes:**

- Windows Firewall or Wi-Fi isolation can block the phone. Metro access and Express API access are separate.

### Command: `npx.cmd expo start --dev-client --localhost`

**Purpose:** Bind the development connection to localhost.

**Explanation:** Expo supplies a localhost Metro connection. A physical phone can reach it using ADB reverse forwarding.

**When to use:** During the USB workflow described later.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --localhost
```

**Command components:**

- `--dev-client`: Uses the installed development app.
- `--localhost`: Selects localhost hosting.

**Important notes:**

- A phone's localhost is the phone itself until the required USB port mapping exists.

### Command: `npx.cmd expo start --dev-client --tunnel`

**Purpose:** Expose Metro through a tunnel.

**Explanation:** Expo uses a relay service so the phone can reach Metro when direct LAN access fails.

**When to use:** On a network that blocks local device connections.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --tunnel
```

**Command components:**

- `--dev-client`: Targets the development app.
- `--tunnel`: Requests a tunnel connection.

**Important notes:**

- Requires internet and may request additional ngrok tooling. The tunnel exposes Metro; it does not expose Express or deploy your backend.

### Command: `npx.cmd expo start --dev-client --port 8082`

**Purpose:** Use a different Metro port.

**Explanation:** Expo starts its local development server on the requested port.

**When to use:** When another process occupies the normal 8081 port.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --port 8082
```

**Command components:**

- `--dev-client`: Selects the development app.
- `--port 8082`: Chooses TCP port 8082.

**Important notes:**

- Reconnect the app to the new address. Any USB reverse mapping must use 8082 too. This port flag does not apply to tunnel or web mode in this CLI.

### Command: `npx.cmd expo start --dev-client --android`

**Purpose:** Start Metro and open Android.

**Explanation:** Expo uses ADB to open the project in an installed development app on Android.

**When to use:** When an authorized phone or running emulator is ready.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --android
```

**Command components:**

- `--dev-client`: Selects the custom development app.
- `--android`: Opens Android after startup.

**Important notes:**

- Requires local ADB and an installed compatible APK. This command does not compile a missing development build.

### Command: `npx.cmd expo start --offline`

**Purpose:** Start Expo without its normal network requests.

**Explanation:** Expo skips CLI network requests and uses anonymous manifest signatures.

**When to use:** When developing locally without access to Expo services.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --offline
```

**Command components:**

- `--offline`: Disables Expo CLI network requests during startup.

**Important notes:**

- Dependencies and a usable client must already be available. This does not provide offline Supabase, Groq, API features, or a tunnel.

### Command: `npm.cmd run dev`

**Purpose:** Start Express with automatic restarts.

**Explanation:** The server dev script runs Node with --env-file=.env and --watch, restarting the process when watched source files change.

**When to use:** Backend development or a joint mobile/API session.

**Where to run:** Server.

**Command:**

```powershell
npm.cmd run dev
```

**Command components:**

- `npm.cmd run`: Executes a named script.
- `dev`: Selects node --env-file=.env --watch src/server.js.

**Important notes:**

- Requires server/.env. PORT defaults to 3000. A successful startup does not verify Supabase or Groq.

### Command: `npm.cmd start`

**Purpose:** Start Express without file watching.

**Explanation:** The server start script loads .env and launches src/server.js once.

**When to use:** When checking normal server startup or running a configured host's start command.

**Where to run:** Server.

**Command:**

```powershell
npm.cmd start
```

**Command components:**

- `npm.cmd`: Runs npm.
- `start`: Executes node --env-file=.env src/server.js.

**Important notes:**

- This is a different script from mobile/npm start. Stop and restart it to load source changes. Its .env file must exist.

## 3. Frontend configuration and exports

Metro and Babel already handle JSX and NativeWind. There is no separate Tailwind watcher or Vite server. The browser commands are optional previews; Android remains the application target.

### Command: `npm.cmd run web`

**Purpose:** Open the browser development preview.

**Explanation:** The declared web script runs expo start --web.

**When to use:** For a quick browser check of supported screens.

**Where to run:** Mobile.

**Command:**

```powershell
npm.cmd run web
```

**Command components:**

- `npm.cmd run`: Executes a named script.
- `web`: Selects expo start --web.

**Important notes:**

- This does not prove Android behavior. If Expo reports missing web prerequisites, resolve them with SDK-compatible Expo installs; react-native-web is not directly declared in this manifest.

### Command: `npx.cmd expo start --web`

**Purpose:** Start the optional web preview directly.

**Explanation:** Expo starts its development server and opens the browser target.

**When to use:** When you want to use Expo CLI instead of the web npm script.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --web
```

**Command components:**

- `expo start`: Starts development serving.
- `--web`: Opens the browser target.

**Important notes:**

- Requires the same web prerequisites as npm run web. Do not infer phone layout, keyboard, or splash behavior from a browser preview.

### Command: `npx.cmd expo config`

**Purpose:** Inspect the resolved app configuration.

**Explanation:** Expo combines app.json and supported configuration inputs into the configuration it uses.

**When to use:** Before checking app identity, plugins, icons, or native settings.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo config
```

**Command components:**

- `npx.cmd expo`: Runs the local CLI.
- `config`: Resolves and prints app configuration.

**Important notes:**

- It does not build an APK. Inspect output privately before sharing because resolved configuration can contain project values.

### Command: `npx.cmd expo config --json`

**Purpose:** Print app configuration in machine-readable form.

**Explanation:** JSON output is useful when comparing configuration or feeding another tool.

**When to use:** When you need structured configuration output.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo config --json
```

**Command components:**

- `config`: Resolves the app configuration.
- `--json`: Outputs JSON instead of the normal display.

**Important notes:**

- Do not post raw configuration output publicly without reviewing it.

### Command: `npx.cmd expo config --type public`

**Purpose:** Inspect the public Expo configuration.

**Explanation:** Expo shows the configuration intended to be available to the app.

**When to use:** Before checking which configuration fields may be exposed to clients.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo config --type public
```

**Command components:**

- `config`: Resolves Expo settings.
- `--type public`: Selects the public configuration view.

**Important notes:**

- Public output must not contain private backend credentials. This check alone is not a complete secret scan.

### Command: `npx.cmd expo config --type introspect`

**Purpose:** Inspect config-plugin native results.

**Explanation:** Expo evaluates config plugins and prints an in-memory view of supported native changes.

**When to use:** When investigating a native plugin, splash, icon, or Android configuration problem.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo config --type introspect
```

**Command components:**

- `--type introspect`: Requests native configuration introspection.

**Important notes:**

- It does not compile or install Android. Plugin errors can still occur during evaluation.

### Command: `npx.cmd expo export --platform android`

**Purpose:** Create an Android JavaScript and asset export.

**Explanation:** Metro bundles the Android application into dist for a bundle check or other tooling.

**When to use:** Before a native build when you want to catch bundling problems.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo export --platform android
```

**Command components:**

- `expo export`: Generates bundle output.
- `--platform android`: Selects the Android target.

**Important notes:**

- Writes generated output to mobile/dist. It does not run Gradle or create an installable APK.

### Command: `npx.cmd expo export --platform android --clear`

**Purpose:** Export Android after resetting Metro's cache.

**Explanation:** Expo clears bundler cache data before generating the Android JavaScript and assets.

**When to use:** When an export may be using stale transformed source.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo export --platform android --clear
```

**Command components:**

- `--platform android`: Selects Android.
- `--clear`: Clears the bundler cache before export.

**Important notes:**

- Expect a slower first export. Native build caches and device app data are unaffected.

### Command: `npx.cmd expo export --platform web`

**Purpose:** Generate optional web output.

**Explanation:** Expo bundles supported browser routes and assets into dist.

**When to use:** When testing a browser export after setting up its web prerequisites.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo export --platform web
```

**Command components:**

- `expo export`: Generates files.
- `--platform web`: Selects browser output.

**Important notes:**

- Does not upload or host the files, and is not an Android build. Review the chosen Router web output mode before hosting.

### Command: `npx.cmd expo serve`

**Purpose:** Preview an existing web export locally.

**Explanation:** Expo serves the exported web output so you can check it outside the development server.

**When to use:** After a successful web export.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo serve
```

**Command components:**

- `npx.cmd expo`: Uses the project CLI.
- `serve`: Serves the exported web project.

**Important notes:**

- Requires an existing compatible web export. It does not deploy the application.

### Command: `npx.cmd expo customize`

**Purpose:** Generate a supported Expo configuration file interactively.

**Explanation:** Expo offers configuration templates that can be copied into the project for customization.

**When to use:** Only when you have a specific need to customize a currently implicit configuration.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo customize
```

**Command components:**

- `expo`: Runs Expo CLI.
- `customize`: Opens the configuration generator.

**Important notes:**

- This project already has Babel, Metro, ESLint, and Tailwind configuration. Review prompts and diffs carefully to avoid replacing working setup.

## 4. Backend and API development

Only the health route exists. There are no upload, quiz, login, extraction, or AI routes to call yet. Node supports the environment-file and watch flags used by the scripts; see the [Node CLI reference](https://nodejs.org/api/cli.html).

### Command: `Invoke-RestMethod -Uri http://localhost:3000/health`

**Purpose:** Check the local Express health route.

**Explanation:** PowerShell makes an HTTP GET request and converts its JSON response into an object.

**When to use:** After starting the API, or when checking whether it responds.

**Where to run:** Any folder, while the API is running.

**Command:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/health
```

**Command components:**

- `Invoke-RestMethod`: Sends an HTTP request and parses its response.
- `-Uri`: Supplies the endpoint address.
- `localhost:3000/health`: Uses the PC's default API port.

**Important notes:**

- Expected HTTP response: 200 with {"status":"ok"}. Change the port if PORT differs. It checks this route, not database or AI connectivity.

### Command: `node --env-file=.env --watch src/server.js`

**Purpose:** Run the backend's development command directly.

**Explanation:** Node loads variables from .env, runs the ES-module entry point, and watches for source changes.

**When to use:** When you need to understand or reproduce what npm run dev does.

**Where to run:** Server.

**Command:**

```powershell
node --env-file=.env --watch src/server.js
```

**Command components:**

- `node`: Runs JavaScript.
- `--env-file=.env`: Loads environment settings from the file.
- `--watch`: Restarts for watched changes.
- `src/server.js`: Starts the API listener.

**Important notes:**

- A missing .env causes startup failure. Existing process environment values take precedence over values from the file. Restart after changing environment values.

### Command: `node --env-file=.env src/server.js`

**Purpose:** Run the backend's normal start command directly.

**Explanation:** Node loads local settings and starts the Express listener without a watcher.

**When to use:** When reproducing server/npm start or investigating startup errors.

**Where to run:** Server.

**Command:**

```powershell
node --env-file=.env src/server.js
```

**Command components:**

- `node`: Runs the entry file.
- `--env-file=.env`: Loads the local settings.
- `src/server.js`: Validates PORT and starts Express.

**Important notes:**

- Requires .env. For a host that injects environment variables and has no .env file, use the host-compatible Node command in the production section.

### Command: `node --check src/app.js`

**Purpose:** Check the Express app file for JavaScript syntax errors.

**Explanation:** Node parses the file without executing the app or opening a port.

**When to use:** After editing the API app file.

**Where to run:** Server.

**Command:**

```powershell
node --check src/app.js
```

**Command components:**

- `node`: Runs the Node executable.
- `--check`: Parses without execution.
- `src/app.js`: Selects the file to inspect.

**Important notes:**

- Does not check imported code, route behavior, service connections, or types.

### Command: `node --check src/server.js`

**Purpose:** Check the server entry point's syntax.

**Explanation:** Node parses the listener file without starting the HTTP server.

**When to use:** After editing startup or PORT validation.

**Where to run:** Server.

**Command:**

```powershell
node --check src/server.js
```

**Command components:**

- `--check`: Checks syntax only.
- `src/server.js`: Selects the entry point.

**Important notes:**

- A successful parse does not prove the port is free or that the server will start.

## 5. React Native and Expo native builds

These commands require local Android build tools, except the macOS-only iOS script. Native dependency or app.json changes require regeneration and a new APK. The installed SDK 57 prebuild implementation recreates native folders by default; --no-clean opts into updating the existing folder.

### Command: `npm.cmd run android`

**Purpose:** Build and open Android locally.

**Explanation:** The declared android script invokes expo run:android, which generates Android files if needed, compiles the native application, installs it, and starts Metro.

**When to use:** The first local development build or a rebuild after native changes.

**Where to run:** Mobile.

**Command:**

```powershell
npm.cmd run android
```

**Command components:**

- `npm.cmd run`: Executes a package script.
- `android`: Runs expo run:android.

**Important notes:**

- Requires a compatible JDK, Android SDK, and authorized device or running emulator. Rebuilding does not automatically synchronize every app.json change into an existing native folder; use prebuild when configuration changes.

### Command: `npx.cmd expo run:android`

**Purpose:** Build and launch Android through Expo CLI.

**Explanation:** Expo orchestrates the native Gradle build, device installation, and development server.

**When to use:** When you want the direct equivalent of npm run android.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo run:android
```

**Command components:**

- `npx.cmd`: Runs the local package CLI.
- `expo`: Selects Expo CLI.
- `run:android`: Compiles and opens Android.

**Important notes:**

- A local debug development build normally needs Metro. This can download Gradle and native dependencies.

### Command: `npx.cmd expo run:android --device`

**Purpose:** Choose the Android device for a local build.

**Explanation:** Expo lets you select a connected phone or emulator before building, installing, and opening the app.

**When to use:** When testing on a physical phone or choosing between multiple targets.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo run:android --device
```

**Command components:**

- `run:android`: Builds Android.
- `--device`: Opens device selection
- this CLI also accepts a device name.

**Important notes:**

- Enable USB debugging and accept the authorization prompt on the phone. Start an emulator before selecting it.

### Command: `npx.cmd expo run:android --no-bundler`

**Purpose:** Build Android without starting another Metro server.

**Explanation:** Expo performs the native work but skips launching the bundler.

**When to use:** When Metro is already running in another terminal.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo run:android --no-bundler
```

**Command components:**

- `--no-bundler`: Skips starting Metro.

**Important notes:**

- A debug development app still needs a reachable Metro server when opening the project. This flag does not embed a release bundle.

### Command: `npx.cmd expo run:android --no-build-cache`

**Purpose:** Rebuild after clearing the native build cache.

**Explanation:** Expo clears its native build cache before compiling Android.

**When to use:** When a native build appears stale after ordinary rebuilds fail.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo run:android --no-build-cache
```

**Command components:**

- `--no-build-cache`: Clears native build-cache use for the build.

**Important notes:**

- Takes longer. It does not reset the database, npm dependencies, or the phone's saved app data.

### Command: `npx.cmd expo run:android --variant release`

**Purpose:** Compile and run a local release variant.

**Explanation:** Expo selects Gradle's release variant and creates an app with embedded JavaScript.

**When to use:** For local checks of behavior that differs from a Metro-connected debug build.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo run:android --variant release
```

**Command components:**

- `--variant release`: Chooses the release build type.

**Important notes:**

- The current generated app/build.gradle signs release with the debug signing configuration. This is not ready for store distribution; production requires a suitable signing key.

### Command: `npx.cmd expo prebuild --platform android`

**Purpose:** Regenerate the Android project from Expo configuration.

**Explanation:** Expo runs config plugins and generates mobile/android from app.json and the current dependencies.

**When to use:** After native configuration changes or when the generated Android project is absent.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo prebuild --platform android
```

**Command components:**

- `prebuild`: Generates native project files.
- `--platform android`: Limits generation to Android.

**Important notes:**

- Destructive to manual native edits: this SDK 57 CLI defaults to recreating native folders. android/ is ignored by Git, so git diff is not a backup of its contents. Preserve any manual edits elsewhere first.

### Command: `npx.cmd expo prebuild --platform android --no-clean`

**Purpose:** Apply native changes to the existing Android folder.

**Explanation:** Expo runs prebuild without first recreating the native folder.

**When to use:** When deliberately updating an existing native project and accepting the possibility of accumulated native changes.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo prebuild --platform android --no-clean
```

**Command components:**

- `--platform android`: Selects Android.
- `--no-clean`: Updates the existing native folder instead of recreating it.

**Important notes:**

- Still changes native files and is not a guarantee that manual edits survive. A clean regeneration is easier to reproduce when all customizations live in config plugins.

### Command: `npx.cmd expo prebuild --clean --platform android`

**Purpose:** Explicitly request a fresh Android generation.

**Explanation:** The installed CLI accepts --clean. Its current default already uses clean generation unless --no-clean is supplied.

**When to use:** When following an explicit clean-rebuild workflow.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo prebuild --clean --platform android
```

**Command components:**

- `--clean`: Accepted clean-generation flag in the installed CLI.
- `--platform android`: Regenerates only Android.

**Important notes:**

- The installed help emphasizes --no-clean. Recheck help after upgrades. Replaces generated native files; preserve manual changes and keep configuration in app.json/plugins.

### Command: `npm run ios`

**Purpose:** Run the package's local iOS build script on a Mac.

**Explanation:** The script invokes expo run:ios, which requires Apple's native build environment.

**When to use:** Only if you intentionally work on the existing optional iOS target on macOS.

**Where to run:** Mobile, on macOS with Xcode.

**Command:**

```bash
npm run ios
```

**Command components:**

- `npm run`: Executes the package script.
- `ios`: Selects expo run:ios.

**Important notes:**

- Local iOS compilation is unavailable on this Windows PC. This is the macOS command for the existing ios script; npm is used there instead of Windows' npm.cmd. The agreed application target remains Android.

## 6. Android SDK, Gradle, and ADB

Install Android platform-tools and place adb on PATH for device commands. The Gradle wrapper lives in the generated Android folder and downloads the project-selected Gradle version; a separate global Gradle installation is unnecessary. See the [ADB reference](https://developer.android.com/tools/adb) and [Android command-line build guide](https://developer.android.com/build/building-cmdline).

### Command: `java -version`

**Purpose:** Check the Java runtime selected by your terminal.

**Explanation:** Java prints its version so you can compare it with the native build tool requirements.

**When to use:** Before a local Gradle build or when investigating JDK errors.

**Where to run:** Any folder.

**Command:**

```powershell
java -version
```

**Command components:**

- `java`: Runs the selected Java executable.
- `-version`: Prints its version and exits.

**Important notes:**

- The Java on PATH can differ from the JDK Android Studio or JAVA_HOME selects. This command alone does not prove Gradle compatibility.

### Command: `adb version`

**Purpose:** Check Android Debug Bridge availability.

**Explanation:** ADB prints the installed platform-tools version.

**When to use:** Before USB installation or device debugging.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb version
```

**Command components:**

- `adb`: Runs Android Debug Bridge.
- `version`: Prints its version.

**Important notes:**

- If PowerShell cannot find adb, install Android platform-tools or correct PATH.

### Command: `adb devices`

**Purpose:** List connected Android targets.

**Explanation:** ADB shows device serial numbers and connection states.

**When to use:** Before building for or installing onto a phone or emulator.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb devices
```

**Command components:**

- `adb`: Runs Android Debug Bridge.
- `devices`: Lists targets.

**Important notes:**

- device means connected; unauthorized means the phone needs to approve this PC; offline means the connection is not ready.

### Command: `adb devices -l`

**Purpose:** List devices with extra identifying information.

**Explanation:** ADB adds available model, product, and transport details to the target list.

**When to use:** When choosing between multiple devices.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb devices -l
```

**Command components:**

- `devices`: Lists targets.
- `-l`: Adds detailed identifying fields.

**Important notes:**

- If more than one target is connected, use a device serial selector for later ADB commands.

### Command: `adb -s DEVICE_SERIAL get-state`

**Purpose:** Check one selected device's connection state.

**Explanation:** ADB targets the supplied serial and reports whether it is connected.

**When to use:** When multiple phones or emulators are attached.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb -s DEVICE_SERIAL get-state
```

**Command components:**

- `-s DEVICE_SERIAL`: Selects a serial from adb devices.
- `get-state`: Reports target state.

**Important notes:**

- Place -s and its value immediately after adb. For other device commands, add the same selector in that position.

### Command: `adb reverse tcp:8081 tcp:8081`

**Purpose:** Connect the phone's Metro port to the PC over USB.

**Explanation:** Requests to the device's port 8081 are forwarded to the host PC's port 8081.

**When to use:** Before a USB localhost Metro session.

**Where to run:** Any folder with adb on PATH and one connected target.

**Command:**

```powershell
adb reverse tcp:8081 tcp:8081
```

**Command components:**

- `reverse`: Creates device-to-host forwarding.
- `First tcp:8081`: Device-side port.
- `Second tcp:8081`: PC-side port.

**Important notes:**

- Metro must be running. If it uses another port, change both values. Reconnects or device restarts can require recreating mappings.

### Command: `adb reverse tcp:3000 tcp:3000`

**Purpose:** Connect the phone's API port to the PC over USB.

**Explanation:** The phone can reach the PC's local API through its own localhost:3000.

**When to use:** When using a USB localhost API address after an API client is implemented.

**Where to run:** Any folder with adb on PATH and one connected target.

**Command:**

```powershell
adb reverse tcp:3000 tcp:3000
```

**Command components:**

- `reverse`: Creates reverse forwarding.
- `First tcp:3000`: Device port.
- `Second tcp:3000`: Host API port.

**Important notes:**

- Set the mobile API address to http://localhost:3000 for this route. ADB does not change environment values or implement the missing API client.

### Command: `adb reverse --list`

**Purpose:** Inspect current USB port mappings.

**Explanation:** ADB lists reverse forwarding rules for the selected target.

**When to use:** When localhost connections fail or after reconnecting a phone.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb reverse --list
```

**Command components:**

- `reverse`: Manages device-to-host forwarding.
- `--list`: Displays configured mappings.

**Important notes:**

- Checking a mapping does not prove the corresponding server is running.

### Command: `adb reverse --remove tcp:8081`

**Purpose:** Remove the phone's Metro forwarding rule.

**Explanation:** ADB deletes only the reverse mapping for device port 8081.

**When to use:** After ending USB Metro development or changing ports.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb reverse --remove tcp:8081
```

**Command components:**

- `--remove tcp:8081`: Removes that device-side port mapping.

**Important notes:**

- This ends connections using that mapping; it does not stop Metro itself.

### Command: `adb reverse --remove tcp:3000`

**Purpose:** Remove the phone's API forwarding rule.

**Explanation:** ADB deletes the reverse mapping for device port 3000.

**When to use:** When ending USB API testing.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb reverse --remove tcp:3000
```

**Command components:**

- `--remove tcp:3000`: Removes that device-side API mapping.

**Important notes:**

- It does not stop Express or modify the app's configured API URL.

### Command: `adb shell am force-stop com.anonymous.RebyuIT`

**Purpose:** Fully stop RebyuIT on the selected Android device.

**Explanation:** Android's activity manager stops the app process so the next launch starts it again.

**When to use:** Before manually testing launch and splash behavior.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb shell am force-stop com.anonymous.RebyuIT
```

**Command components:**

- `shell`: Runs a device shell command.
- `am`: Uses Android's activity manager.
- `force-stop`: Stops the application.
- `com.anonymous.RebyuIT`: Current application ID from app.json.

**Important notes:**

- Open the app from its launcher afterward. This stops the app without uninstalling it or clearing saved data.

### Command: `cd C:\ai-reviewer-app\mobile\android`

**Purpose:** Open the generated native build folder.

**Explanation:** PowerShell selects the folder containing gradlew.bat.

**When to use:** Before direct Gradle wrapper commands.

**Where to run:** Any folder, after Android generation.

**Command:**

```powershell
cd C:\ai-reviewer-app\mobile\android
```

**Command components:**

- `cd`: Changes folders.
- `The full path`: Selects the generated Android project.

**Important notes:**

- If the folder is missing, generate it with Expo prebuild or the first run:android command.

### Command: `.\gradlew.bat --version`

**Purpose:** Inspect the project's Gradle and JVM versions.

**Explanation:** The Windows wrapper starts the configured Gradle distribution and prints its environment.

**When to use:** When diagnosing Gradle/JDK selection.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat --version
```

**Command components:**

- `.\gradlew.bat`: Runs the repository's Windows Gradle wrapper.
- `--version`: Displays version and JVM information.

**Important notes:**

- May download Gradle on first use. The current wrapper requests Gradle 9.3.1; do not replace it with an arbitrary global version.

### Command: `.\gradlew.bat tasks --all`

**Purpose:** List the native project's available Gradle tasks.

**Explanation:** Gradle configures the project and prints its task catalog.

**When to use:** Before using a task from a guide or investigating variant names.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat tasks --all
```

**Command components:**

- `tasks`: Lists tasks.
- `--all`: Includes additional tasks beyond the default grouped list.

**Important notes:**

- Requires the JDK and may resolve Gradle plugins or dependencies even though it does not compile an APK.

### Command: `.\gradlew.bat :app:assembleDebug --stacktrace`

**Purpose:** Build the debug APK with detailed failure traces.

**Explanation:** Gradle runs the debug assembly task and prints a fuller Java exception trace if it fails.

**When to use:** When diagnosing a native compilation error.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat :app:assembleDebug --stacktrace
```

**Command components:**

- `:app:assembleDebug`: Builds the app module's debug APK.
- `--stacktrace`: Expands failure traces.

**Important notes:**

- Does not install the APK or start Metro. Logs may contain local paths and build configuration; review before sharing.

## 7. Building and installing APKs

Direct Gradle commands use the generated project as it currently exists. Run prebuild first when native configuration needs synchronization. Debug APKs normally need Metro; release APKs embed JavaScript. Typical paths below assume the current app module and variants.

### Command: `.\gradlew.bat :app:assembleDebug`

**Purpose:** Create a local debug APK.

**Explanation:** Gradle compiles the Android app module into an installable debug package.

**When to use:** When you want an APK file without immediately launching it.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat :app:assembleDebug
```

**Command components:**

- `.\gradlew.bat`: Uses the project's Gradle wrapper.
- `:app:assembleDebug`: Builds the debug variant.

**Important notes:**

- Typical output: mobile/android/app/build/outputs/apk/debug/app-debug.apk. Requires local native tools. Does not start Metro or install the file.

### Command: `.\gradlew.bat :app:installDebug`

**Purpose:** Build and install the debug variant.

**Explanation:** Gradle assembles the debug app and installs it on available connected Android targets.

**When to use:** When using Gradle directly for development installation.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat :app:installDebug
```

**Command components:**

- `:app:installDebug`: Runs the app module's debug installation task.

**Important notes:**

- Requires authorized targets and Android tooling. Gradle may install to multiple connected devices; disconnect unwanted targets. Start Metro separately.

### Command: `.\gradlew.bat :app:assembleRelease`

**Purpose:** Create a local release APK.

**Explanation:** Gradle compiles native code and embeds the release JavaScript bundle.

**When to use:** For standalone local APK testing after reviewing release configuration.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat :app:assembleRelease
```

**Command components:**

- `:app:assembleRelease`: Builds the release APK.

**Important notes:**

- Typical output: mobile/android/app/build/outputs/apk/release/app-release.apk. Current generated release signing uses the debug key. Configure proper production signing before distributing as a production release.

### Command: `.\gradlew.bat :app:bundleRelease`

**Purpose:** Create an Android App Bundle.

**Explanation:** Gradle generates the release AAB used for store distribution.

**When to use:** When a store build is needed after signing and release configuration are ready.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat :app:bundleRelease
```

**Command components:**

- `:app:bundleRelease`: Builds the app module's release AAB.

**Important notes:**

- Typical output: mobile/android/app/build/outputs/bundle/release/app-release.aab. It cannot be installed with adb install. The current debug-key release signing must be corrected for production.

### Command: `adb install -r "PATH_TO_APK"`

**Purpose:** Install an APK or replace a compatible installed version.

**Explanation:** ADB transfers the APK to the selected phone or emulator and requests installation.

**When to use:** After a successful local or cloud APK build.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb install -r "PATH_TO_APK"
```

**Command components:**

- `install`: Installs an APK.
- `-r`: Replaces an existing app while keeping its data when Android permits the update.
- `"PATH_TO_APK"`: Full or relative APK file path.

**Important notes:**

- Replacement requires compatible app identity, signing key, and version rules. Do not uninstall just to bypass a signing mismatch without considering loss of local data. AAB files are unsupported.

### Command: `adb -s DEVICE_SERIAL install -r "PATH_TO_APK"`

**Purpose:** Install an APK on one specific device.

**Explanation:** ADB limits installation to the serial you select.

**When to use:** When several Android targets are connected.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb -s DEVICE_SERIAL install -r "PATH_TO_APK"
```

**Command components:**

- `-s DEVICE_SERIAL`: Selects one target.
- `install -r`: Installs or replaces a compatible app.
- `"PATH_TO_APK"`: Selects the APK file.

**Important notes:**

- Use a serial from adb devices. The same signing and data-preservation limitations as ordinary install -r apply.

## 8. EAS cloud builds

Setup required: there is no mobile/eas.json or EAS project link in app.json. EAS CLI is not a declared dependency; npx.cmd eas-cli@latest can download it. Run these commands from Mobile so EAS treats mobile/ as the app root. Builds upload project source and consume account build allowance. See [EAS setup](https://docs.expo.dev/build/setup/) and the [EAS CLI reference](https://docs.expo.dev/eas/cli/).

### Command: `npx.cmd eas-cli@latest --version`

**Purpose:** Check the EAS CLI version you are about to use.

**Explanation:** npm's runner resolves the EAS CLI package and prints its version.

**When to use:** Before setting up or troubleshooting cloud builds.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest --version
```

**Command components:**

- `npx.cmd`: Runs a package executable.
- `eas-cli@latest`: Resolves the latest EAS CLI release.
- `--version`: Prints its version.

**Important notes:**

- Requires internet when uncached. @latest can change between sessions; record the version if you need to reproduce a workflow.

### Command: `npx.cmd eas-cli@latest login`

**Purpose:** Sign in to an Expo account for EAS.

**Explanation:** EAS authenticates your terminal for permitted cloud operations.

**When to use:** Before the first EAS project setup or build.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest login
```

**Command components:**

- `eas-cli@latest`: Runs EAS CLI.
- `login`: Starts Expo account sign-in.

**Important notes:**

- Use the intended personal or organization account. Enter credentials only in the official sign-in flow.

### Command: `npx.cmd eas-cli@latest whoami`

**Purpose:** Check the active Expo account.

**Explanation:** EAS displays which account the CLI is currently using.

**When to use:** Before linking a project or uploading a build.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest whoami
```

**Command components:**

- `whoami`: Reports the authenticated account.

**Important notes:**

- Does not create a project or build. Account membership still controls which projects you can access.

### Command: `npx.cmd eas-cli@latest logout`

**Purpose:** Sign out of EAS CLI.

**Explanation:** The CLI removes its local sign-in session.

**When to use:** When switching accounts or finishing on a shared computer.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest logout
```

**Command components:**

- `logout`: Ends the local CLI session.

**Important notes:**

- Does not delete an Expo project, cancel builds, or sign out other machines.

### Command: `npx.cmd eas-cli@latest build:configure --platform android`

**Purpose:** Configure this app for EAS Android builds.

**Explanation:** EAS guides project setup and writes build configuration. Review any app metadata changes it proposes.

**When to use:** Once you choose to set up cloud builds.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build:configure --platform android
```

**Command components:**

- `build:configure`: Initializes EAS Build settings.
- `--platform android`: Configures only Android.

**Important notes:**

- Changes mobile/eas.json and may link/create an Expo project or update app configuration. This handbook does not execute setup. Verify owner, project ID, and generated profiles before building.

### Command: `npx.cmd eas-cli@latest build --platform android --profile development`

**Purpose:** Request a cloud development build.

**Explanation:** EAS builds an Android development client using the named profile.

**When to use:** After configuring a development profile and when you need a new Dev APK.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
```

**Command components:**

- `build`: Starts a build.
- `--platform android`: Selects Android.
- `--profile development`: Reads build.development from eas.json.

**Important notes:**

- Requires a configured profile with developmentClient enabled and suitable signing. Install the resulting APK, then start Metro. Uploads project source; cloud builds do not deploy Express.

### Command: `npx.cmd eas-cli@latest build --platform android --profile preview`

**Purpose:** Request a standalone Android preview.

**Explanation:** EAS builds the profile intended for an installable test package.

**When to use:** After configuring a preview APK profile, for testing without Metro.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

**Command components:**

- `--platform android`: Chooses Android.
- `--profile preview`: Reads build.preview.

**Important notes:**

- Set android.buildType to apk for an explicit APK artifact. Test this build on a real device for standalone splash and startup behavior. API features still require a reachable server.

### Command: `npx.cmd eas-cli@latest build --platform android --profile production`

**Purpose:** Request a production Android build.

**Explanation:** EAS uses your production profile and signing configuration to build a store artifact.

**When to use:** After release configuration, production environment values, and device checks are ready.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
```

**Command components:**

- `--platform android`: Selects Android.
- `--profile production`: Reads build.production.

**Important notes:**

- Usually produces an AAB unless overridden. A successful build does not publish to Google Play or establish release readiness.

### Command: `npx.cmd eas-cli@latest build --platform android --profile preview --clear-cache`

**Purpose:** Retry a cloud preview without its build cache.

**Explanation:** EAS clears the remote build cache before executing the requested profile.

**When to use:** When cloud logs point to a stale native build cache.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview --clear-cache
```

**Command components:**

- `--profile preview`: Selects the configured preview build.
- `--clear-cache`: Clears the EAS build cache.

**Important notes:**

- Starts another cloud build and consumes build allowance. It does not clear local Metro caches or phone data.

### Command: `npx.cmd eas-cli@latest build:list --platform android --limit 5`

**Purpose:** Find recent Android cloud builds.

**Explanation:** EAS lists a small number of project build records.

**When to use:** To find a build ID, result, or artifact link.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build:list --platform android --limit 5
```

**Command components:**

- `build:list`: Lists project builds.
- `--platform android`: Filters the platform.
- `--limit 5`: Requests five records.

**Important notes:**

- Requires authentication and an EAS-linked project. Verify the profile and source revision before installing a result.

### Command: `npx.cmd eas-cli@latest build:view BUILD_ID`

**Purpose:** Inspect a specific EAS build.

**Explanation:** EAS shows the selected build record and its available status/artifact details.

**When to use:** After finding a build ID or receiving a build failure.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build:view BUILD_ID
```

**Command components:**

- `build:view`: Opens build details in the terminal.
- `BUILD_ID`: Identifies a cloud build.

**Important notes:**

- Use the build's linked logs and artifact page for further inspection. No new build is requested.

### Command: `npx.cmd eas-cli@latest credentials --platform android`

**Purpose:** Manage Android signing credentials interactively.

**Explanation:** EAS opens the credential-management workflow for the project.

**When to use:** When reviewing or deliberately configuring cloud signing.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest credentials --platform android
```

**Command components:**

- `credentials`: Opens signing management.
- `--platform android`: Selects Android credentials.

**Important notes:**

- Credential changes can prevent future updates from matching installed or published apps. Preserve the established key; do not generate or replace signing credentials casually.

### Required build profile settings

The profile names in the commands are examples you must configure. After running build:configure in the future, review mobile/eas.json and ensure its build section has the intended settings. This is a configuration example, not an existing project file:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

developmentClient enables the native development launcher. Internal distribution supports direct testing. The preview profile explicitly requests an APK. An otherwise standard production Android profile produces an AAB. See [Expo's build profile guide](https://docs.expo.dev/build/eas-json/) and [APK configuration guide](https://docs.expo.dev/build-reference/apk/).

In this repository, Android native files are generated locally and ignored by Git. Review the files EAS will upload: when no native Android folder is included, EAS generates one from app.json and plugins. If you later include native files through changed ignore rules, those files need their own configuration synchronization.

Cloud builds do not automatically receive ignored local .env files. Configure the required public mobile values in the intended EAS environment before building, following [Expo's environment-variable guide](https://docs.expo.dev/eas/environment-variables/). Never upload server-only secrets as mobile variables. Every EXPO_PUBLIC_ value can be recovered from the app.

EAS Build does not host the Express server, provision Supabase, or set up EAS Update. This project has no expo-updates configuration, so an over-the-air update command is not part of its current workflow.

## 9. Testing and debugging

There is no configured automated test suite or npm test script. Lint, syntax checks, a bundle export, the health route, and manual Android checks provide different kinds of evidence. None alone proves the app works on a physical phone.

### Command: `npm.cmd run lint`

**Purpose:** Check mobile source against the project's lint rules.

**Explanation:** The declared lint script runs Expo's ESLint integration using eslint.config.js.

**When to use:** After changing JavaScript/JSX and before committing mobile changes.

**Where to run:** Mobile.

**Command:**

```powershell
npm.cmd run lint
```

**Command components:**

- `npm.cmd run`: Executes a script.
- `lint`: Selects expo lint.

**Important notes:**

- Reports code-quality and rule violations. It does not compile Android or exercise app behavior.

### Command: `npx.cmd expo lint`

**Purpose:** Run the mobile linter directly.

**Explanation:** Expo invokes the configured ESLint checks.

**When to use:** When you want the direct equivalent of npm run lint.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo lint
```

**Command components:**

- `expo`: Uses this project's CLI.
- `lint`: Runs the configured lint checks.

**Important notes:**

- Use either this command or the npm script for the same check.

### Command: `npx.cmd expo lint --fix`

**Purpose:** Apply available automatic lint fixes.

**Explanation:** ESLint rewrites problems it can fix safely according to its rules.

**When to use:** After inspecting lint results and deciding to accept automatic edits.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo lint --fix
```

**Command components:**

- `lint`: Runs ESLint.
- `--fix`: Enables source-file changes for fixable issues.

**Important notes:**

- Changes project files. Review git diff afterward; remaining errors still need attention.

### Command: `npx.cmd expo-doctor`

**Purpose:** Diagnose Expo setup and dependency problems.

**Explanation:** Expo Doctor checks common configuration and compatibility issues across the project.

**When to use:** During setup, after dependency changes, or while diagnosing an Expo error.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo-doctor
```

**Command components:**

- `npx.cmd`: Runs a package tool.
- `expo-doctor`: Runs Expo's separate diagnostic package.

**Important notes:**

- May download the tool and contact Expo services. A passing report does not prove native compilation or device behavior.

### Command: `node node_modules/typescript/bin/tsc -p jsconfig.json --allowJs --checkJs --noEmit --jsx react-native --skipLibCheck --esModuleInterop --types nativewind/types --noImplicitAny false --noUncheckedSideEffectImports false`

**Purpose:** Check the project's JavaScript and JSX types.

**Explanation:** The TypeScript compiler checks the files selected by jsconfig.json using the existing project's diagnostic flags, without generating JavaScript.

**When to use:** When checking mobile source before a commit or build.

**Where to run:** Mobile.

**Command:**

```powershell
node node_modules/typescript/bin/tsc -p jsconfig.json --allowJs --checkJs --noEmit --jsx react-native --skipLibCheck --esModuleInterop --types nativewind/types --noImplicitAny false --noUncheckedSideEffectImports false
```

**Command components:**

- `node`: Runs the locally available compiler script.
- `node_modules/typescript/bin/tsc`: Selects TypeScript from the current dependency tree.
- `-p jsconfig.json`: Uses the project's file selection and import aliases.
- `--allowJs`: Includes JavaScript.
- `--checkJs`: Reports type errors in JavaScript.
- `--noEmit`: Writes no compiled output.
- `--jsx react-native`: Uses React Native JSX handling.
- `--skipLibCheck`: Skips checking declaration-library internals.
- `--esModuleInterop`: Allows common module interoperability.
- `--types nativewind/types`: Loads NativeWind declarations.
- `--noImplicitAny false`: Permits inferred any types.
- `--noUncheckedSideEffectImports false`: Disables checking unresolved side-effect-only imports.

**Important notes:**

- TypeScript is available transitively and is not a direct manifest dependency. If it disappears after dependency changes, this command needs an explicitly agreed compiler setup. Image imports can still need module declarations. This command can fail on existing source errors; it is not a claim of a clean baseline.

### Command: `adb logcat`

**Purpose:** Stream Android system and application logs.

**Explanation:** ADB displays device logs while the app runs or crashes.

**When to use:** When a native error is absent from Metro's output.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb logcat
```

**Command components:**

- `logcat`: Streams Android's device log buffers.

**Important notes:**

- Output covers many processes and can contain sensitive runtime data. Stop with Ctrl+C and review before sharing.

### Command: `adb logcat "*:E"`

**Purpose:** Stream Android error logs.

**Explanation:** Logcat filters displayed messages to error priority and above.

**When to use:** When looking for a crash or reducing device-log noise.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb logcat "*:E"
```

**Command components:**

- `logcat`: Reads device logs.
- `"*:E"`: Applies error-level filtering to all tags
- quotes preserve the filter.

**Important notes:**

- This can hide useful warnings and context. If the error is unclear, inspect the full log stream.

### Command: `node --inspect --env-file=.env --watch src/server.js`

**Purpose:** Run the API with Node's debugger enabled.

**Explanation:** Node starts its inspector alongside environment loading and file watching so a compatible debugger can attach.

**When to use:** When tracing server startup or future API request handling.

**Where to run:** Server.

**Command:**

```powershell
node --inspect --env-file=.env --watch src/server.js
```

**Command components:**

- `--inspect`: Enables the local inspector, normally on 127.0.0.1:9229.
- `--env-file=.env`: Loads settings.
- `--watch`: Restarts for source changes.
- `src/server.js`: Runs the entry point.

**Important notes:**

- Stop the ordinary API process first to free its port. Keep the inspector on its default local binding; exposing it gives remote debugging access.

### Command: `git diff --check`

**Purpose:** Find whitespace errors in tracked edits.

**Explanation:** Git reports problems such as trailing whitespace in the unstaged diff.

**When to use:** Before committing documentation or source changes.

**Where to run:** Root.

**Command:**

```powershell
git diff --check
```

**Command components:**

- `diff`: Compares tracked working files.
- `--check`: Reports whitespace errors.

**Important notes:**

- Does not validate Markdown links, code logic, or untracked file contents. Check staged changes separately if they are what you will commit.

### Interactive debugging and manual checks

In Metro's terminal, press a to open Android or j to open React Native DevTools when a compatible app is connected. These are terminal shortcuts, not shell commands. Fast Refresh should apply ordinary JSX and styling edits. If a reload cannot apply a change, restart the app; native changes require a rebuilt APK.

For the current login and registration UI, manually check empty fields, invalid email, password visibility, keyboard behavior, text scaling, and scrolling. A valid-looking submission still shows that authentication is not connected.

For splash checks, install the intended standalone preview/release APK, stop the app completely, and reopen it from its icon. Check both the native splash configured in app.json and the StartupSplash overlay. A Metro session or Expo Go preview does not establish standalone startup behavior.

## 10. Dependency management

Run commands in the package you intend to change. Use Expo's installer for mobile additions and version corrections. Review dependency changes before rebuilding native code; see [Expo CLI dependency installation](https://docs.expo.dev/more/expo-cli/#installing-dependencies).

### Command: `npm.cmd run`

**Purpose:** List scripts declared by the current package.

**Explanation:** npm prints the available lifecycle and custom scripts from package.json.

**When to use:** Before assuming a script exists.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd run
```

**Command components:**

- `npm.cmd`: Runs npm.
- `run without a script name`: Lists available scripts.

**Important notes:**

- There is no root script list because the root has no package manifest.

### Command: `npm.cmd ls --depth=0`

**Purpose:** Inspect the direct installed dependencies.

**Explanation:** npm lists top-level packages and can report missing, invalid, or extraneous installations.

**When to use:** After setup or when investigating package resolution.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd ls --depth=0
```

**Command components:**

- `ls`: Lists the installed dependency tree.
- `--depth=0`: Shows direct dependencies rather than every nested package.

**Important notes:**

- Does not install or upgrade anything. A nonzero exit status can indicate an unhealthy dependency tree.

### Command: `npm.cmd outdated`

**Purpose:** Check for newer dependency versions.

**Explanation:** npm compares installed versions with allowed and latest registry versions.

**When to use:** Before planning a dependency update.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd outdated
```

**Command components:**

- `outdated`: Reports available package updates.

**Important notes:**

- Does not update files. On Mobile, the latest registry release may be incompatible with SDK 57. Review Expo compatibility first.

### Command: `npm.cmd audit`

**Purpose:** Check npm's published vulnerability advisories.

**Explanation:** npm compares dependency metadata with advisory information from its configured registry.

**When to use:** When reviewing dependency security.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd audit
```

**Command components:**

- `audit`: Requests a dependency vulnerability report.

**Important notes:**

- Requires registry access and sends dependency metadata. A clean report does not guarantee application security; assess each finding in context.

### Command: `npx.cmd expo install PACKAGE_NAME`

**Purpose:** Add a mobile dependency using Expo compatibility rules.

**Explanation:** Expo chooses its recommended version when it knows one for the current SDK, then installs using the package manager.

**When to use:** When adding an approved mobile library.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo install PACKAGE_NAME
```

**Command components:**

- `expo install`: Uses Expo's package installer.
- `PACKAGE_NAME`: Replace with the intended package name.

**Important notes:**

- Updates package.json and the lockfile. Expo cannot guarantee compatibility for every third-party library. Rebuild the development APK after native dependency changes.

### Command: `npx.cmd expo install PACKAGE_NAME --dev`

**Purpose:** Add a mobile development dependency.

**Explanation:** Expo installs the package in devDependencies while applying its available compatibility guidance.

**When to use:** When adding an approved tool used during development.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo install PACKAGE_NAME --dev
```

**Command components:**

- `PACKAGE_NAME`: Selects the package.
- `--dev`: Saves it as a development dependency.

**Important notes:**

- Do not classify runtime/native libraries as development-only just to shrink the manifest. Review the resulting dependency changes.

### Command: `npx.cmd expo install --check`

**Purpose:** Check Expo's expected package versions.

**Explanation:** Expo compares installed package versions with the current SDK's compatibility guidance.

**When to use:** After a clean install or before investigating dependency mismatch errors.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo install --check
```

**Command components:**

- `install`: Uses Expo dependency tooling.
- `--check`: Checks versions rather than automatically fixing them.

**Important notes:**

- May offer an interactive correction. Decline it if you only intend to inspect. Version compatibility does not prove runtime behavior.

### Command: `npx.cmd expo install --fix`

**Purpose:** Correct versions Expo considers incompatible.

**Explanation:** Expo installs its expected versions for dependencies that need alignment.

**When to use:** After reviewing compatibility warnings and deciding to apply them.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo install --fix
```

**Command components:**

- `--fix`: Applies compatibility version changes.

**Important notes:**

- Changes the manifest, lockfile, and installed tree. Review the diff, run checks, and rebuild native apps if their dependencies changed.

### Command: `npm.cmd install PACKAGE_NAME`

**Purpose:** Add a backend runtime dependency.

**Explanation:** npm installs the package and records it under the server's dependencies.

**When to use:** When implementing server work that needs an approved package.

**Where to run:** Server.

**Command:**

```powershell
npm.cmd install PACKAGE_NAME
```

**Command components:**

- `install`: Adds a package.
- `PACKAGE_NAME`: Names the required library.

**Important notes:**

- Do not use this as the default mobile addition workflow. Check whether existing Express, Supabase, Groq, Mammoth, or PDF tooling already solves the need.

### Command: `npm.cmd install --save-dev PACKAGE_NAME`

**Purpose:** Add a backend development tool.

**Explanation:** npm records a package in devDependencies so production installs can omit it.

**When to use:** When adding an approved backend test, lint, or development tool.

**Where to run:** Server.

**Command:**

```powershell
npm.cmd install --save-dev PACKAGE_NAME
```

**Command components:**

- `install`: Adds a package.
- `--save-dev`: Saves it under devDependencies.
- `PACKAGE_NAME`: Selects the tool.

**Important notes:**

- No server test or lint tooling is currently configured. Adding a package alone does not create those workflows.

### Command: `npm.cmd update PACKAGE_NAME`

**Purpose:** Update one backend dependency within its allowed range.

**Explanation:** npm resolves a newer compatible version under the existing manifest range and updates the installed dependency tree and lockfile.

**When to use:** During a deliberate, reviewed backend dependency update.

**Where to run:** Server.

**Command:**

```powershell
npm.cmd update PACKAGE_NAME
```

**Command components:**

- `update`: Updates packages allowed by manifest constraints.
- `PACKAGE_NAME`: Limits the requested update.

**Important notes:**

- Review transitive changes as well. This does not necessarily install the latest major version. Use Expo's compatibility workflow for Mobile.

### Command: `npm.cmd uninstall PACKAGE_NAME`

**Purpose:** Remove a dependency from the current package.

**Explanation:** npm removes the package declaration and adjusts the lockfile and installed tree.

**When to use:** After removing all imports/configuration that depend on an unused package.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd uninstall PACKAGE_NAME
```

**Command components:**

- `uninstall`: Removes a dependency.
- `PACKAGE_NAME`: Selects the package to remove.

**Important notes:**

- Search callers and plugin references first. Removing a native mobile dependency requires rebuilding the app.

### Command: `npm.cmd explain PACKAGE_NAME`

**Purpose:** Find why a dependency is installed.

**Explanation:** npm shows the dependency chains responsible for including the named package.

**When to use:** When a package is present in node_modules but absent from direct dependencies.

**Where to run:** Mobile or Server.

**Command:**

```powershell
npm.cmd explain PACKAGE_NAME
```

**Command components:**

- `explain`: Shows dependency ancestry.
- `PACKAGE_NAME`: Selects the package.

**Important notes:**

- Useful for the transitively installed TypeScript compiler. It does not make a transitive dependency a permanent project guarantee.

## 11. Cache cleaning and troubleshooting

Start with the cache related to the failure. Stop Metro before restarting it. Avoid deleting lockfiles or all Android caches as a routine fix.

### Command: `npx.cmd expo start --dev-client --clear`

**Purpose:** Restart Metro with a clean bundler cache.

**Explanation:** Expo discards cached JavaScript transforms before serving the development app.

**When to use:** When Metro serves stale code or styling after a normal restart.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --clear
```

**Command components:**

- `--dev-client`: Targets the installed development APK.
- `--clear`: Resets the Metro bundler cache.

**Important notes:**

- Does not clean Gradle, reinstall npm packages, rebuild an APK, or clear device data.

### Command: `npx.cmd expo start --clear`

**Purpose:** Clear Metro cache using automatic client selection.

**Explanation:** Expo starts development serving with fresh transformation caches.

**When to use:** When following a generic Metro reset workflow.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --clear
```

**Command components:**

- `expo start`: Starts development serving.
- `--clear`: Clears the bundler cache.

**Important notes:**

- With expo-dev-client installed, the default target is normally the development build.

### Command: `npx.cmd expo start --dev-client --reset-cache`

**Purpose:** Use the installed CLI's alternate Metro reset spelling.

**Explanation:** The installed Expo CLI maps --reset-cache to --clear.

**When to use:** When adapting a guide that uses this supported alias.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --dev-client --reset-cache
```

**Command components:**

- `--dev-client`: Targets the custom development app.
- `--reset-cache`: Alias for --clear in the installed start command.

**Important notes:**

- Prefer --clear for everyday use. This alias does not mean every Expo subcommand accepts --reset-cache.

### Command: `.\gradlew.bat clean`

**Purpose:** Remove generated native build outputs.

**Explanation:** Gradle runs the project's clean tasks so the next native build recreates their outputs.

**When to use:** When build logs suggest stale native output.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat clean
```

**Command components:**

- `.\gradlew.bat`: Uses the project's Gradle wrapper.
- `clean`: Removes task-defined build outputs.

**Important notes:**

- Does not remove source files or uninstall the app. The next build takes longer. This is different from deleting the entire Android project or global Gradle cache.

### Command: `.\gradlew.bat --stop`

**Purpose:** Stop Gradle's background build processes.

**Explanation:** The wrapper asks compatible Gradle daemons to exit.

**When to use:** When Java processes hold build files or after changing the JDK.

**Where to run:** Android.

**Command:**

```powershell
.\gradlew.bat --stop
```

**Command components:**

- `--stop`: Stops daemons associated with this Gradle version.

**Important notes:**

- Finish active builds first. This can affect other projects using the same Gradle daemon version.

### Command: `npm.cmd cache verify`

**Purpose:** Check and tidy npm's package download cache.

**Explanation:** npm verifies cached content and performs its supported cache cleanup.

**When to use:** When package downloads or cached package integrity appear faulty.

**Where to run:** Any folder with npm installed.

**Command:**

```powershell
npm.cmd cache verify
```

**Command components:**

- `cache`: Selects npm cache operations.
- `verify`: Checks integrity and performs cache maintenance.

**Important notes:**

- Does not reinstall either package or repair Metro/Gradle caches. Avoid routine npm cache clean --force; it discards reusable downloads and is unnecessary for most install problems.

### Command: `adb kill-server`

**Purpose:** Stop the PC's ADB server.

**Explanation:** ADB shuts down its host background service and disconnects current ADB sessions.

**When to use:** When device detection is stuck after checking USB cable and phone authorization.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb kill-server
```

**Command components:**

- `kill-server`: Stops the host ADB service.

**Important notes:**

- Disconnects all ADB clients and targets on this PC. Recheck reverse port mappings afterward.

### Command: `adb start-server`

**Purpose:** Restart the PC's ADB background service.

**Explanation:** ADB starts the host service used to discover and communicate with Android devices.

**When to use:** After deliberately stopping ADB or while recovering a device connection.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb start-server
```

**Command components:**

- `start-server`: Starts the host ADB service.

**Important notes:**

- Run adb devices afterward. The phone may ask for authorization again. This does not restart the phone or the app.

### Troubleshooting choices

| Symptom | First action | Escalation |
|---|---|---|
| npm.ps1 or npx.ps1 is blocked | Use the .cmd examples in this handbook | Check the executable location with Get-Command if the launcher is missing. |
| Metro shows old source or styles | Stop Metro, then use the development-client --clear command | Check imports, NativeWind scanned paths, and Babel/Metro configuration before reinstalling dependencies. |
| "No development build installed" | Build and install a compatible Dev APK | Starting Metro alone cannot supply native code. |
| Development app reports a missing native module | Rebuild after installing the native dependency | Confirm the installed APK matches this dependency set. |
| Port 3000 or 8081 is occupied | Identify its listener and existing terminal | Stop the known process or deliberately choose another port. Do not kill every Node process. |
| Phone cannot reach Metro | Check Wi-Fi isolation/firewall or USB reverse mapping | A Metro tunnel can help when LAN fails. |
| Phone cannot reach the API | Use the correct LAN, emulator, or USB address and confirm /health | A Metro tunnel does not expose Express. Current UI has no connected API client. |
| Gradle output seems stale | Run Gradle clean and rebuild | Use the detailed stack trace before changing SDK/JDK versions. |
| Native app.json changes are absent | Regenerate Android and rebuild | Back up ignored native edits first. |
| APK replacement fails with a signing mismatch | Check which signing key produced each APK | Keep the original key. Uninstalling can erase local app data and should be a deliberate choice. |
| npm ci reports a lockfile mismatch | Review package.json and lockfile changes together | Reconcile with npm install only when the dependency change is intended; keep the lockfile. |

Flags belong to specific tools. --clear here resets Metro, --clear-cache resets an EAS build cache, and Gradle clean removes native build outputs. --force changes behavior differently across tools. In particular, npm audit fix --force can cross dependency version constraints; it is not a routine fix for Expo compatibility. No force-based repair is required by the current project.

## 12. Git and GitHub

Run these from Root and review the branch and diff before publishing. Git commands work with the configured remote without requiring GitHub CLI. The project has no GitHub-specific build workflow to document.

### Command: `git status --short`

**Purpose:** See pending repository changes.

**Explanation:** Git lists tracked modifications, staged changes, and untracked files in a compact format.

**When to use:** Before editing, staging, switching branches, or committing.

**Where to run:** Root.

**Command:**

```powershell
git status --short
```

**Command components:**

- `git`: Runs version control.
- `status`: Reports working-tree and index state.
- `--short`: Uses compact output.

**Important notes:**

- The left status column describes staged changes and the right describes working-file changes. Ignored dependencies and local environment files are usually hidden.

### Command: `git diff`

**Purpose:** Review unstaged tracked-file changes.

**Explanation:** Git compares working files with the staging area.

**When to use:** Before staging your edits.

**Where to run:** Root.

**Command:**

```powershell
git diff
```

**Command components:**

- `diff`: Prints the unstaged patch.

**Important notes:**

- Does not show untracked file contents or changes already staged.

### Command: `git diff --staged`

**Purpose:** Review the next commit's staged changes.

**Explanation:** Git compares the staging area with the last commit.

**When to use:** Immediately before committing.

**Where to run:** Root.

**Command:**

```powershell
git diff --staged
```

**Command components:**

- `diff`: Shows a patch.
- `--staged`: Selects changes in the staging area.

**Important notes:**

- Review for unrelated changes and accidental credentials before recording the commit.

### Command: `git diff --stat`

**Purpose:** See a compact change summary.

**Explanation:** Git lists changed tracked files and line counts for unstaged changes.

**When to use:** When checking the scope of current work.

**Where to run:** Root.

**Command:**

```powershell
git diff --stat
```

**Command components:**

- `--stat`: Summarizes file and line changes.

**Important notes:**

- A small line count does not prove a safe change. Read the actual diff too.

### Command: `git log -10 --oneline`

**Purpose:** Read the latest ten commits.

**Explanation:** Git shows abbreviated commit IDs and subjects.

**When to use:** When checking recent work or finding a baseline.

**Where to run:** Root.

**Command:**

```powershell
git log -10 --oneline
```

**Command components:**

- `log`: Reads commit history.
- `-10`: Limits results to ten.
- `--oneline`: Prints a compact line for each commit.

**Important notes:**

- Shows the current branch's reachable history. It does not show uncommitted work.

### Command: `git branch --show-current`

**Purpose:** Check your current branch name.

**Explanation:** Git prints the checked-out branch.

**When to use:** Before pulling, pushing, or creating branch-specific work.

**Where to run:** Root.

**Command:**

```powershell
git branch --show-current
```

**Command components:**

- `branch`: Works with branch information.
- `--show-current`: Prints the active branch name.

**Important notes:**

- An empty result can indicate a detached HEAD. Check git status before continuing.

### Command: `git branch --all`

**Purpose:** List local and known remote branches.

**Explanation:** Git shows branch names stored in your local checkout.

**When to use:** When choosing an existing branch.

**Where to run:** Root.

**Command:**

```powershell
git branch --all
```

**Command components:**

- `--all`: Includes remote-tracking branches.

**Important notes:**

- Remote-tracking information can be stale until git fetch.

### Command: `git switch -c BRANCH_NAME`

**Purpose:** Create and enter a new working branch.

**Explanation:** Git creates a branch at the current commit and checks it out.

**When to use:** Before starting a separate feature or fix.

**Where to run:** Root.

**Command:**

```powershell
git switch -c BRANCH_NAME
```

**Command components:**

- `switch`: Changes the checked-out branch.
- `-c`: Creates the branch.
- `BRANCH_NAME`: Replace with the chosen name.

**Important notes:**

- Review your current branch and uncommitted changes first. Existing uncommitted changes can follow you onto the new branch.

### Command: `git switch BRANCH_NAME`

**Purpose:** Switch to an existing local branch.

**Explanation:** Git updates working files to the selected branch when local changes allow it.

**When to use:** When continuing work on another branch.

**Where to run:** Root.

**Command:**

```powershell
git switch BRANCH_NAME
```

**Command components:**

- `switch`: Changes branches.
- `BRANCH_NAME`: Names the existing branch.

**Important notes:**

- Git can refuse if the switch would overwrite local work. Do not force the switch to bypass that protection.

### Command: `git add -- PATH_TO_FILE`

**Purpose:** Stage a specific file.

**Explanation:** Git copies the file's current contents into the index used by the next commit.

**When to use:** After reviewing the intended change.

**Where to run:** Root.

**Command:**

```powershell
git add -- PATH_TO_FILE
```

**Command components:**

- `add`: Stages content.
- `--`: Ends option parsing.
- `PATH_TO_FILE`: Names the file to stage.

**Important notes:**

- Prefer explicit files to staging the whole repository. Staging does not check for secrets or validate code.

### Command: `git restore --staged -- PATH_TO_FILE`

**Purpose:** Remove a file's changes from staging.

**Explanation:** Git resets the index entry to the last commit while keeping your working file.

**When to use:** When you staged an unrelated file or need to edit before staging again.

**Where to run:** Root.

**Command:**

```powershell
git restore --staged -- PATH_TO_FILE
```

**Command components:**

- `restore`: Restores selected Git state.
- `--staged`: Changes the index only.
- `--`: Ends options.
- `PATH_TO_FILE`: Selects the file.

**Important notes:**

- Keep --staged in this command. Restoring working files without it can discard edits.

### Command: `git commit -m "MESSAGE"`

**Purpose:** Record the staged changes locally.

**Explanation:** Git creates a commit containing only the staged content and your message.

**When to use:** After reviewing the staged diff and relevant checks.

**Where to run:** Root.

**Command:**

```powershell
git commit -m "MESSAGE"
```

**Command components:**

- `commit`: Records a snapshot.
- `-m "MESSAGE"`: Supplies a short commit message.

**Important notes:**

- Does not upload anything. Git identity must already be configured, and repository hooks may run.

### Command: `git remote -v`

**Purpose:** Inspect the configured repository remotes.

**Explanation:** Git prints remote names and fetch/push URLs.

**When to use:** Before fetching or publishing to GitHub.

**Where to run:** Root.

**Command:**

```powershell
git remote -v
```

**Command components:**

- `remote`: Manages remote repositories.
- `-v`: Shows URLs.

**Important notes:**

- Review output before sharing: improperly configured URLs can contain credentials. Do not assume a remote called origin exists without checking.

### Command: `git fetch`

**Purpose:** Refresh remote branch information.

**Explanation:** Git downloads new remote objects and updates remote-tracking references.

**When to use:** Before checking whether your branch is behind its remote.

**Where to run:** Root.

**Command:**

```powershell
git fetch
```

**Command components:**

- `fetch`: Retrieves remote changes without merging them into your branch.

**Important notes:**

- Requires remote access. It leaves working files unchanged but updates local Git references.

### Command: `git pull --ff-only`

**Purpose:** Update your branch only by fast-forward.

**Explanation:** Git fetches and advances the current branch only when no merge commit is needed.

**When to use:** When bringing a clean working branch up to date with its upstream.

**Where to run:** Root.

**Command:**

```powershell
git pull --ff-only
```

**Command components:**

- `pull`: Fetches and integrates upstream changes.
- `--ff-only`: Refuses divergent histories requiring a merge.

**Important notes:**

- This updates working files when it succeeds. Commit or otherwise preserve local work first; inspect divergence instead of forcing a reset.

### Command: `git push`

**Purpose:** Upload commits to the configured upstream.

**Explanation:** Git publishes committed history to the remote branch selected by your configuration.

**When to use:** When sharing completed local commits.

**Where to run:** Root.

**Command:**

```powershell
git push
```

**Command components:**

- `push`: Sends local commits to the remote.

**Important notes:**

- Requires permission and an upstream configuration. It can trigger remote automation if one is added later.

### Command: `git push -u origin BRANCH_NAME`

**Purpose:** Publish a new branch and set its upstream.

**Explanation:** Git pushes the named branch to origin and remembers that tracking relationship.

**When to use:** The first time you publish a new working branch.

**Where to run:** Root.

**Command:**

```powershell
git push -u origin BRANCH_NAME
```

**Command components:**

- `push`: Uploads commits.
- `-u`: Sets upstream tracking.
- `origin`: Names the configured remote.
- `BRANCH_NAME`: Names the branch.

**Important notes:**

- Confirm the remote and branch before publishing. It uploads all commits on that branch that the remote needs.

### Command: `git check-ignore -v -- mobile/.env server/.env`

**Purpose:** Check which ignore rules protect local settings.

**Explanation:** Git reports matching ignore rules for the two environment paths.

**When to use:** Before staging changes involving local configuration.

**Where to run:** Root.

**Command:**

```powershell
git check-ignore -v -- mobile/.env server/.env
```

**Command components:**

- `check-ignore`: Explains ignored paths.
- `-v`: Shows the rule and source file.
- `--`: Ends options.
- `The two paths`: Select the environment files.

**Important notes:**

- Ignore rules do not remove a secret already committed in history and do not protect secrets manually placed in other files.

## 13. Production and deployment

The backend host is undecided, and no automated deployment command exists. EAS builds the mobile application separately from Express. Use the production EAS entry above only after its configuration and signing prerequisites are satisfied.

### Command: `npm.cmd ci --omit=dev`

**Purpose:** Install locked runtime dependencies for a server deployment.

**Explanation:** npm restores the lockfile while omitting development-only dependencies from disk.

**When to use:** In a prepared server host or deployment workspace.

**Where to run:** Server.

**Command:**

```powershell
npm.cmd ci --omit=dev
```

**Command components:**

- `ci`: Performs a clean locked install.
- `--omit=dev`: Omits development dependencies from the installed tree.

**Important notes:**

- Replaces node_modules. Use it for the backend, not as a default mobile cloud-build install: mobile compilation uses development tooling.

### Command: `node src/server.js`

**Purpose:** Start Express with environment values supplied by the host.

**Explanation:** Node runs the entry point and reads PORT from the process environment; no .env loading flag is used.

**When to use:** On a host configured to inject runtime environment variables.

**Where to run:** Server.

**Command:**

```powershell
node src/server.js
```

**Command components:**

- `node`: Runs the JavaScript entry point.
- `src/server.js`: Validates PORT and starts the listener.

**Important notes:**

- Requires server dependencies and the host's Node environment. It does not provision hosting, HTTPS, restart supervision, service secrets, or a database. If your host relies on a .env file, the existing server npm start command loads that file.

### Release preparation

Before sharing an APK or uploading an AAB, verify production signing, application ID, versioning, and the environment values embedded at build time. Set a reachable HTTPS backend address when API features exist; localhost, 10.0.2.2, and a laptop's private LAN address are development addresses.

A successful build is only one release check. Test an installed standalone artifact on supported Android devices, including its splash, navigation, keyboard, text scaling, and network failure behavior. Current login and registration are UI-only, so a production-profile build would still lack working authentication.

No store submission command is included because this checkout has no Google Play submission configuration or release workflow. No EAS Update or provider-specific backend deployment command is configured.

## 14. System and environment commands

These are Windows PowerShell diagnostics. Avoid printing the contents of .env files or all process environment variables when sharing terminal output.

### Command: `Get-Location`

**Purpose:** Show the current terminal folder.

**Explanation:** PowerShell displays the directory used to resolve relative file paths.

**When to use:** Before a command whose working folder matters.

**Where to run:** Any folder.

**Command:**

```powershell
Get-Location
```

**Command components:**

- `Get-Location`: Reads the current working directory.

**Important notes:**

- If you are at Root, change to Mobile or Server before using their npm scripts.

### Command: `Get-ChildItem -Force`

**Purpose:** List files including hidden entries.

**Explanation:** PowerShell lists the current folder and includes entries normally hidden.

**When to use:** When locating .env, .gitignore, or configuration files.

**Where to run:** Any folder.

**Command:**

```powershell
Get-ChildItem -Force
```

**Command components:**

- `Get-ChildItem`: Lists directory entries.
- `-Force`: Includes hidden/system entries.

**Important notes:**

- Here -Force changes visibility; it does not delete files or bypass dependency compatibility. Listing names does not print file contents.

### Command: `git --version`

**Purpose:** Check the Git installation.

**Explanation:** Git prints its installed version.

**When to use:** During setup or when a Git feature is unavailable.

**Where to run:** Any folder.

**Command:**

```powershell
git --version
```

**Command components:**

- `git`: Runs Git.
- `--version`: Displays its version.

**Important notes:**

- If the executable is missing, install Git for Windows and reopen the terminal.

### Command: `node --version`

**Purpose:** Check the Node.js executable selected by PATH.

**Explanation:** Node prints the runtime version used by this terminal.

**When to use:** Before installing dependencies or diagnosing Node engine errors.

**Where to run:** Any folder.

**Command:**

```powershell
node --version
```

**Command components:**

- `node`: Runs Node.js.
- `--version`: Displays its version.

**Important notes:**

- Use a version satisfying both React Native and server dependencies. Consult the setup notes above.

### Command: `npm.cmd --version`

**Purpose:** Check the npm launcher and version.

**Explanation:** The Windows npm launcher prints the package manager version.

**When to use:** During setup or installation troubleshooting.

**Where to run:** Any folder.

**Command:**

```powershell
npm.cmd --version
```

**Command components:**

- `npm.cmd`: Selects the Windows command launcher.
- `--version`: Displays npm's version.

**Important notes:**

- npm is normally installed with Node.js. Reopen terminals after replacing Node.

### Command: `Get-Command node, npm.cmd, npx.cmd, java, adb`

**Purpose:** Find the executables PowerShell will run.

**Explanation:** PowerShell resolves each command to its selected location.

**When to use:** When multiple Node/JDK installations exist or a tool is missing.

**Where to run:** Any folder.

**Command:**

```powershell
Get-Command node, npm.cmd, npx.cmd, java, adb
```

**Command components:**

- `Get-Command`: Resolves command names.
- `The comma-separated names`: Requests these five tools.

**Important notes:**

- Missing Java or ADB matters for local native/USB work, but serving Metro to an installed phone app over LAN does not require those tools.

### Command: `ipconfig`

**Purpose:** Find the PC's local network addresses.

**Explanation:** Windows prints adapter details including IPv4 addresses.

**When to use:** When preparing a phone's LAN API URL or investigating connectivity.

**Where to run:** Any folder.

**Command:**

```powershell
ipconfig
```

**Command components:**

- `ipconfig`: Displays Windows IP configuration.

**Important notes:**

- Choose the active network adapter shared with the phone. VPN and virtual adapters can show unrelated addresses. Addresses can change.

### Command: `Get-NetTCPConnection -LocalPort 3000 -State Listen`

**Purpose:** Find the listener on the default API port.

**Explanation:** PowerShell shows matching TCP listeners and their OwningProcess values.

**When to use:** When Express reports EADDRINUSE or you need to find the existing server.

**Where to run:** Any folder.

**Command:**

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

**Command components:**

- `Get-NetTCPConnection`: Lists TCP connections.
- `-LocalPort 3000`: Filters to API port 3000.
- `-State Listen`: Selects listening sockets.

**Important notes:**

- No result means no matching listener was found. Change the port if your server uses another value.

### Command: `Get-NetTCPConnection -LocalPort 8081 -State Listen`

**Purpose:** Find the listener on Metro's default port.

**Explanation:** PowerShell identifies any process listening on port 8081.

**When to use:** When Metro reports a port conflict.

**Where to run:** Any folder.

**Command:**

```powershell
Get-NetTCPConnection -LocalPort 8081 -State Listen
```

**Command components:**

- `-LocalPort 8081`: Filters to Metro's usual port.
- `-State Listen`: Shows listeners only.

**Important notes:**

- A listening process may be a valid Metro instance in another terminal. Identify it before stopping anything.

### Command: `Get-Process -Id PROCESS_ID`

**Purpose:** Identify a process by its numeric ID.

**Explanation:** PowerShell displays the process name for an OwningProcess value.

**When to use:** After finding the process occupying a development port.

**Where to run:** Any folder.

**Command:**

```powershell
Get-Process -Id PROCESS_ID
```

**Command components:**

- `Get-Process`: Reads process information.
- `-Id PROCESS_ID`: Selects the numeric process identifier.

**Important notes:**

- Replace PROCESS_ID with the actual number. Do not assume every node process belongs to this project.

### Command: `Stop-Process -Id PROCESS_ID -Confirm`

**Purpose:** Stop one identified process after confirmation.

**Explanation:** PowerShell terminates the selected process if you approve the prompt.

**When to use:** Only when you have identified a stale project server and cannot stop it in its terminal.

**Where to run:** Any folder.

**Command:**

```powershell
Stop-Process -Id PROCESS_ID -Confirm
```

**Command components:**

- `Stop-Process`: Terminates a process.
- `-Id PROCESS_ID`: Chooses the target.
- `-Confirm`: Asks before termination.

**Important notes:**

- Prefer Ctrl+C in the process's own terminal. Terminating the wrong process can interrupt unrelated work or an active build; this is not a command to run routinely.

## 15. Project-specific help

Use help after upgrading tools because flags can change. Help can require a download when the requested CLI is not installed. These entries preserve the useful account and command-discovery operations from the existing handbook.

### Command: `npx.cmd expo --help`

**Purpose:** List the installed Expo CLI command families.

**Explanation:** Expo prints the top-level commands available in this SDK's CLI.

**When to use:** Before using a command from an older guide.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo --help
```

**Command components:**

- `expo`: Uses the local Expo CLI.
- `--help`: Displays top-level usage.

**Important notes:**

- Reading help does not start Metro or build the app.

### Command: `npx.cmd expo start --help`

**Purpose:** Check supported Metro startup flags.

**Explanation:** Expo prints options for the start command.

**When to use:** Before choosing a connection mode or cache flag.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo start --help
```

**Command components:**

- `start`: Selects the Metro startup command.
- `--help`: Prints its usage.

**Important notes:**

- Do not assume a flag listed here also works on prebuild or EAS.

### Command: `npx.cmd expo run:android --help`

**Purpose:** Check local Android build options.

**Explanation:** Expo displays device, variant, bundler, and native-cache options.

**When to use:** Before changing local Android build behavior.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo run:android --help
```

**Command components:**

- `run:android`: Selects local Android compilation.
- `--help`: Prints its options.

**Important notes:**

- Does not compile Android.

### Command: `npx.cmd expo prebuild --help`

**Purpose:** Check native regeneration options for the installed CLI.

**Explanation:** Expo lists the current prebuild flags, including --no-clean in this version.

**When to use:** Before regenerating native files, especially after an Expo upgrade.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo prebuild --help
```

**Command components:**

- `prebuild`: Selects native generation.
- `--help`: Prints supported usage.

**Important notes:**

- The installed implementation defaults to recreating folders. Read the generation entries before running prebuild itself.

### Command: `npx.cmd expo export --help`

**Purpose:** Inspect bundle export options.

**Explanation:** Expo prints target platform, cache, and output options.

**When to use:** Before changing bundle export behavior.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo export --help
```

**Command components:**

- `export`: Selects bundle generation.
- `--help`: Displays its available options.

**Important notes:**

- Does not generate bundle files.

### Command: `npx.cmd expo install --help`

**Purpose:** Inspect Expo's dependency installation options.

**Explanation:** Expo lists compatibility checks, fixes, and package-manager selection.

**When to use:** Before modifying SDK-related dependencies.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo install --help
```

**Command components:**

- `install`: Selects dependency management.
- `--help`: Lists its options.

**Important notes:**

- Expo help should be consulted instead of adding unsupported npm flags directly to Expo subcommands.

### Command: `npx.cmd eas-cli@latest build --help`

**Purpose:** Inspect current cloud build options.

**Explanation:** EAS shows flags for the resolved CLI version.

**When to use:** Before running an EAS build, especially if a guide names different flags.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd eas-cli@latest build --help
```

**Command components:**

- `eas-cli@latest`: Resolves EAS CLI.
- `build`: Selects cloud builds.
- `--help`: Prints build usage.

**Important notes:**

- May download EAS CLI. Does not upload a build just by showing help.

### Command: `npm.cmd help`

**Purpose:** Open npm's general command help.

**Explanation:** npm provides help navigation for package management and scripts.

**When to use:** When looking up an npm operation.

**Where to run:** Any folder with npm installed.

**Command:**

```powershell
npm.cmd help
```

**Command components:**

- `npm.cmd`: Runs npm.
- `help`: Opens npm's help system.

**Important notes:**

- The viewer depends on your npm and Windows setup.

### Command: `git help`

**Purpose:** Show Git's general command guide.

**Explanation:** Git lists common commands and help topics.

**When to use:** When you need to find the appropriate Git operation.

**Where to run:** Any folder.

**Command:**

```powershell
git help
```

**Command components:**

- `git`: Runs Git.
- `help`: Shows the general guide.

**Important notes:**

- Inspect a command's documentation before using destructive or history-rewriting options.

### Command: `adb --help`

**Purpose:** List ADB device and connection options.

**Explanation:** ADB prints command usage for the installed platform-tools version.

**When to use:** Before using a device command from another guide.

**Where to run:** Any folder with adb on PATH.

**Command:**

```powershell
adb --help
```

**Command components:**

- `adb`: Runs Android Debug Bridge.
- `--help`: Shows supported operations.

**Important notes:**

- Requires installed platform-tools but no APK build.

### Command: `npx.cmd expo login`

**Purpose:** Sign in through Expo CLI.

**Explanation:** Expo starts account authentication for services requiring an Expo account.

**When to use:** When using an Expo CLI service that needs authentication.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo login
```

**Command components:**

- `expo`: Runs Expo CLI.
- `login`: Starts sign-in.

**Important notes:**

- Ordinary local source edits and LAN Metro serving do not require cloud build setup. EAS account commands are documented in their own section.

### Command: `npx.cmd expo whoami`

**Purpose:** Check Expo CLI's active account.

**Explanation:** Expo displays the authenticated account name.

**When to use:** Before an account-specific Expo operation.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo whoami
```

**Command components:**

- `whoami`: Reports the signed-in account.

**Important notes:**

- Does not link or configure EAS by itself.

### Command: `npx.cmd expo logout`

**Purpose:** Sign out through Expo CLI.

**Explanation:** Expo clears the local CLI authentication session.

**When to use:** When switching accounts or using a shared PC.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo logout
```

**Command components:**

- `logout`: Ends the local sign-in session.

**Important notes:**

- Does not delete the project or cancel cloud builds.

### Command: `npx.cmd expo register`

**Purpose:** Start Expo account registration.

**Explanation:** Expo opens its supported account-registration flow.

**When to use:** If you need an account before using cloud services.

**Where to run:** Mobile.

**Command:**

```powershell
npx.cmd expo register
```

**Command components:**

- `register`: Starts account creation.

**Important notes:**

- Requires internet. Use the official Expo flow and keep account credentials private.

## Practical workflows

Each command below has a full entry above. Follow the sequence for your situation; running all workflows is unnecessary.

### First development session

Use three PowerShell terminals. Install local Android tooling for the local build step.

1. `cd C:\ai-reviewer-app` opens the checkout.
2. Run `node --version` and `npm.cmd --version` separately. Confirm the runtime meets both packages' requirements.
3. `npm.cmd ci --prefix mobile` restores app dependencies.
4. `npm.cmd ci --prefix server` restores API dependencies.
5. Run `Test-Path mobile/.env` and `Test-Path server/.env` separately. Copy only missing files using their section 1 template-copy commands.
6. Run `notepad.exe mobile/.env` and `notepad.exe server/.env` separately. Replace required placeholders and set the development addresses.
7. In terminal 1, run `cd C:\ai-reviewer-app\server`, then `npm.cmd run dev`. Leave Express running.
8. In terminal 2, run `Invoke-RestMethod -Uri http://localhost:3000/health`. Confirm status is ok.
9. In terminal 2, run `cd C:\ai-reviewer-app\mobile`, then `npx.cmd expo run:android --device` after authorizing your phone. This builds, installs, and starts the development app. If a compatible Dev APK is already installed, use `npm.cmd start -- --dev-client` instead.
10. In terminal 3 in Mobile, run `npm.cmd run lint`, `npx.cmd expo install --check`, and `npx.cmd expo-doctor` separately. Address reported problems.

Without local native tools, use the conditional EAS development-build workflow for the initial APK.

### Daily mobile and backend development together

A compatible Dev APK must already be installed.

1. In terminal 1, `cd C:\ai-reviewer-app\server` selects the API package.
2. In terminal 1, `npm.cmd run dev` starts Express with watching.
3. In terminal 2, `cd C:\ai-reviewer-app\mobile` selects the app package.
4. In terminal 2, `npm.cmd start -- --dev-client` starts Metro.
5. Open RebyuIT on the phone and connect to Metro. Edit JSX or styling and check Fast Refresh.
6. In a spare terminal, `Invoke-RestMethod -Uri http://localhost:3000/health` checks the running API when needed.

The services run independently. The current UI does not make API calls, so this does not establish end-to-end connectivity.

### Connect an Android phone over USB

Install a compatible Dev APK and Android platform-tools; enable USB debugging.

1. Connect a data-capable USB cable and accept the PC authorization prompt on the phone.
2. `adb devices -l` confirms that the phone reports device rather than unauthorized.
3. `adb reverse tcp:8081 tcp:8081` maps the phone's Metro port to the PC.
4. If you need API forwarding, `adb reverse tcp:3000 tcp:3000` maps its port. Use http://localhost:3000 in the mobile API configuration when the client is implemented.
5. `cd C:\ai-reviewer-app\mobile` selects the app.
6. `npx.cmd expo start --dev-client --localhost` starts Metro with localhost links.
7. Open the installed development app and connect to this server.
8. `adb reverse --list` checks forwarding rules if the connection fails.

With several targets, add -s DEVICE_SERIAL immediately after adb in the applicable device commands. Keep Express running separately when using its port.

### Build a debug APK and install it manually

Dependencies, synchronized native configuration, local Android tools, and an authorized phone are required.

1. `cd C:\ai-reviewer-app\mobile\android` selects the native project. Generate Android from Mobile first if it is absent.
2. `.\gradlew.bat :app:assembleDebug` creates the debug APK. Continue only after a successful build.
3. `adb devices -l` confirms which phone will receive it.
4. Use `adb install -r "PATH_TO_APK"` with PATH_TO_APK replaced by `C:\ai-reviewer-app\mobile\android\app\build\outputs\apk\debug\app-debug.apk`. This installs or replaces a compatibly signed app. Use the documented -s variant when several devices are connected.
5. `cd C:\ai-reviewer-app\mobile` returns to the app package.
6. `npm.cmd start -- --dev-client` serves the JavaScript loaded by the debug app.

For an EAS preview APK, download its successful artifact and use its actual path with the same install command. Preview builds launch without Metro. Do not install an old output while assuming it is from a failed new build.

### Recover from stale Metro output

1. Press Ctrl+C in the old Metro terminal to stop that instance.
2. `cd C:\ai-reviewer-app\mobile` selects the app package.
3. `npx.cmd expo start --dev-client --clear` restarts Metro with fresh transformation caches.
4. Reconnect or reload the installed development app.
5. If dependency mismatch remains, `npx.cmd expo install --check` helps identify it. A missing native module requires rebuilding the APK.

Do not delete lockfiles or use force flags as an automatic follow-up.

### Clean native build outputs and investigate failures

1. Stop active local builds.
2. `cd C:\ai-reviewer-app\mobile\android` selects the native project.
3. `.\gradlew.bat clean` removes generated native build outputs.
4. `.\gradlew.bat :app:assembleDebug --stacktrace` attempts the debug build and provides a detailed failure trace.
5. Read the first meaningful error. Check JDK, SDK, dependency, or file-lock causes before further cleanup.
6. Use `.\gradlew.bat --stop` only when a stale Gradle daemon is part of the problem.

This does not reset phone data, regenerate app.json configuration, or install the APK.

### Rebuild after changing native dependencies, icons, or splash configuration

1. `cd C:\ai-reviewer-app`, then `git status --short`, identifies current tracked and untracked work.
2. Preserve manual changes under mobile/android separately. Git ignores that folder, so status does not protect its contents.
3. `cd C:\ai-reviewer-app\mobile` selects the app.
4. `npx.cmd expo prebuild --platform android` recreates Android configuration from app.json and plugins.
5. `npx.cmd expo run:android --device` builds and installs the updated native app.
6. Open the app on the target phone and verify the change.

Ordinary JSX or styling edits use Metro/Fast Refresh. For standalone splash validation, install a preview/release APK, fully stop it, and reopen it from its icon.

### Review and update dependencies

1. From Root, `git status --short` identifies existing work. Keep unrelated work separate.
2. In the package being reviewed, `npm.cmd outdated` reports newer releases without applying them.
3. In Mobile, `npx.cmd expo install --check` checks SDK alignment.
4. If you choose to apply Expo's corrections, `npx.cmd expo install --fix` changes the relevant versions.
5. For a deliberate backend update, run `npm.cmd update PACKAGE_NAME` in Server with the actual package name. Skip this step when only Mobile needs changes.
6. From Root, `git diff` reviews manifest and lockfile changes together.
7. In Mobile, run `npm.cmd run lint` and the full JavaScript type-check command from section 9. Use `npx.cmd expo export --platform android` to check bundle compatibility.
8. Rebuild the Dev APK when native dependencies changed. For server changes, restart Express and check its health route; manually test changed feature routes once they exist.

A compatibility fix is not an Expo major-SDK migration. Plan major upgrades separately.

### First EAS development build

Requires internet, an Expo account, and a decision to create cloud configuration.

1. `cd C:\ai-reviewer-app\mobile` selects the EAS app root.
2. `npx.cmd eas-cli@latest login` authenticates the intended account.
3. `npx.cmd eas-cli@latest whoami` confirms it before project linking.
4. `npx.cmd eas-cli@latest build:configure --platform android` creates configuration. Review owner, project link, app metadata, and generated files.
5. Review mobile/eas.json so development has developmentClient enabled, using the section 8 example. Configure EAS environment values and preserve the established Android signing key.
6. `npx.cmd eas-cli@latest build --platform android --profile development` uploads and builds the app.
7. `npx.cmd eas-cli@latest build:list --platform android --limit 5` finds the build. Inspect it with `npx.cmd eas-cli@latest build:view BUILD_ID`, replacing the ID.
8. Download the successful APK and install it with the documented ADB install command, or open the trusted build's installation link on the phone.
9. `npm.cmd start -- --dev-client` starts local Metro for the installed app.

Cloud compilation does not need the local JDK or SDK. ADB installation still needs platform-tools; a phone installation link is an alternative.

### Create a standalone preview or production artifact

EAS profiles, intended environment values, signing, and relevant checks must be ready.

1. In Mobile, `npm.cmd run lint` checks source rules.
2. `npx.cmd expo export --platform android` checks Android bundling. It does not create the final APK.
3. `npx.cmd eas-cli@latest build --platform android --profile preview` builds the configured standalone test APK.
4. Download and install it through its trusted link or the documented ADB install command.
5. `adb shell am force-stop com.anonymous.RebyuIT` stops the app before a fresh launcher test. Open its icon and check startup without Metro.
6. After release preparation, `npx.cmd eas-cli@latest build --platform android --profile production` builds the production profile, normally an AAB.

A local standalone test can instead use the documented Gradle assembleRelease command, subject to its current debug-signing limitation. Build success does not publish to an app store.

### Push a reviewed change to GitHub

1. `cd C:\ai-reviewer-app` selects the repository.
2. `git branch --show-current` confirms your branch.
3. `git status --short` identifies all pending work.
4. `git diff` reviews unstaged tracked changes.
5. `git diff --check` checks their whitespace.
6. `git add -- PATH_TO_FILE` stages the intended file after replacing the placeholder. Repeat for each intended file.
7. `git diff --staged` reviews exactly what the commit will contain.
8. `git commit -m "MESSAGE"` records it locally with your descriptive message.
9. `git remote -v` confirms the destination.
10. `git push` publishes to an existing upstream. For a new branch, use `git push -u origin BRANCH_NAME` with its actual name.

If you need remote changes first, fetch and inspect them. Use the documented fast-forward-only pull when appropriate; do not force-push or reset local work to make synchronization appear successful.

## Official references

- [Expo CLI commands and flags](https://docs.expo.dev/more/expo-cli/)
- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build setup](https://docs.expo.dev/build/setup/)
- [EAS build profiles](https://docs.expo.dev/build/eas-json/)
- [Android APK artifacts through EAS](https://docs.expo.dev/build-reference/apk/)
- [EAS CLI reference](https://docs.expo.dev/eas/cli/)
- [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Android Debug Bridge](https://developer.android.com/tools/adb)
- [Android Gradle command-line builds](https://developer.android.com/build/building-cmdline)
- [Node.js command-line flags](https://nodejs.org/api/cli.html)
- [npm clean installs](https://docs.npmjs.com/cli/v11/commands/npm-ci/)
- [npm dependency updates](https://docs.npmjs.com/cli/v11/commands/npm-update/)
- [Git reference](https://git-scm.com/docs)

## Quick reference

Mobile and Server identify the working folder. EAS entries require section 8 setup.

| Command | Explanation | When to Use |
|---|---|---|
| `cd C:\ai-reviewer-app` | Open the repository root. | Any folder. Before repository-wide setup or Git work. |
| `cd C:\ai-reviewer-app\mobile` | Open the Expo app folder. | Any folder. Before Expo, mobile dependency, lint, or export commands. |
| `cd C:\ai-reviewer-app\server` | Open the Express package. | Any folder. Before API startup or server package changes. |
| `npm.cmd ci --prefix mobile` | Restore the mobile dependency tree. | Root. After cloning, or when you need a reproducible dependency reinstall. |
| `npm.cmd ci --prefix server` | Restore the server dependency tree. | Root. During initial setup or a server dependency reinstall. |
| `npm.cmd install` | Install dependencies and reconcile the lockfile. | Mobile or Server. When intentionally changing dependencies or resolving a reviewed manifest/lockfile mismatch. |
| `Test-Path mobile/.env` | Check for an existing mobile environment file. | Root. Before copying an environment template. |
| `Test-Path server/.env` | Check for an existing backend environment file. | Root. Before setting up the server environment. |
| `Copy-Item -LiteralPath mobile/.env.example -Destination mobile/.env -Confirm` | Create mobile environment settings from the template. | Root. Fresh setup, after confirming mobile/.env does not already exist. |
| `Copy-Item -LiteralPath server/.env.example -Destination server/.env -Confirm` | Create backend environment settings from the template. | Root. Fresh backend setup, when server/.env is absent. |
| `notepad.exe mobile/.env` | Edit mobile environment values. | Root. After copying the mobile template or changing the API address. |
| `notepad.exe server/.env` | Edit backend environment values. | Root. After copying the backend template. |
| `npm.cmd start` | Start the mobile development server. | Mobile. At the beginning of an ordinary mobile editing session. |
| `npx.cmd expo start` | Start Metro directly through Expo CLI. | Mobile. When you prefer the direct Expo command or need to add Expo flags. |
| `npm.cmd start -- --dev-client` | Start Metro for the RebyuIT development APK. | Mobile. Daily development after installing a compatible RebyuIT Dev APK. |
| `npx.cmd expo start --dev-client` | Explicitly target the installed development app. | Mobile. When you want the direct equivalent of the npm command above. |
| `npx.cmd expo start --go` | Start a compatible Expo Go preview. | Mobile. For a quick preview of features supported by your Expo Go version. |
| `npm.cmd start -- --go` | Use Expo Go through the npm script. | Mobile. When using npm scripts for an optional Expo Go session. |
| `npx.cmd expo start --dev-client --lan` | Serve the development app across the local network. | Mobile. When the PC and phone share a usable LAN or Wi-Fi network. |
| `npx.cmd expo start --dev-client --localhost` | Bind the development connection to localhost. | Mobile. During the USB workflow described later. |
| `npx.cmd expo start --dev-client --tunnel` | Expose Metro through a tunnel. | Mobile. On a network that blocks local device connections. |
| `npx.cmd expo start --dev-client --port 8082` | Use a different Metro port. | Mobile. When another process occupies the normal 8081 port. |
| `npx.cmd expo start --dev-client --android` | Start Metro and open Android. | Mobile. When an authorized phone or running emulator is ready. |
| `npx.cmd expo start --offline` | Start Expo without its normal network requests. | Mobile. When developing locally without access to Expo services. |
| `npm.cmd run dev` | Start Express with automatic restarts. | Server. Backend development or a joint mobile/API session. |
| `npm.cmd start` | Start Express without file watching. | Server. When checking normal server startup or running a configured host's start command. |
| `npm.cmd run web` | Open the browser development preview. | Mobile. For a quick browser check of supported screens. |
| `npx.cmd expo start --web` | Start the optional web preview directly. | Mobile. When you want to use Expo CLI instead of the web npm script. |
| `npx.cmd expo config` | Inspect the resolved app configuration. | Mobile. Before checking app identity, plugins, icons, or native settings. |
| `npx.cmd expo config --json` | Print app configuration in machine-readable form. | Mobile. When you need structured configuration output. |
| `npx.cmd expo config --type public` | Inspect the public Expo configuration. | Mobile. Before checking which configuration fields may be exposed to clients. |
| `npx.cmd expo config --type introspect` | Inspect config-plugin native results. | Mobile. When investigating a native plugin, splash, icon, or Android configuration problem. |
| `npx.cmd expo export --platform android` | Create an Android JavaScript and asset export. | Mobile. Before a native build when you want to catch bundling problems. |
| `npx.cmd expo export --platform android --clear` | Export Android after resetting Metro's cache. | Mobile. When an export may be using stale transformed source. |
| `npx.cmd expo export --platform web` | Generate optional web output. | Mobile. When testing a browser export after setting up its web prerequisites. |
| `npx.cmd expo serve` | Preview an existing web export locally. | Mobile. After a successful web export. |
| `npx.cmd expo customize` | Generate a supported Expo configuration file interactively. | Mobile. Only when you have a specific need to customize a currently implicit configuration. |
| `Invoke-RestMethod -Uri http://localhost:3000/health` | Check the local Express health route. | Any folder, while the API is running. After starting the API, or when checking whether it responds. |
| `node --env-file=.env --watch src/server.js` | Run the backend's development command directly. | Server. When you need to understand or reproduce what npm run dev does. |
| `node --env-file=.env src/server.js` | Run the backend's normal start command directly. | Server. When reproducing server/npm start or investigating startup errors. |
| `node --check src/app.js` | Check the Express app file for JavaScript syntax errors. | Server. After editing the API app file. |
| `node --check src/server.js` | Check the server entry point's syntax. | Server. After editing startup or PORT validation. |
| `npm.cmd run android` | Build and open Android locally. | Mobile. The first local development build or a rebuild after native changes. |
| `npx.cmd expo run:android` | Build and launch Android through Expo CLI. | Mobile. When you want the direct equivalent of npm run android. |
| `npx.cmd expo run:android --device` | Choose the Android device for a local build. | Mobile. When testing on a physical phone or choosing between multiple targets. |
| `npx.cmd expo run:android --no-bundler` | Build Android without starting another Metro server. | Mobile. When Metro is already running in another terminal. |
| `npx.cmd expo run:android --no-build-cache` | Rebuild after clearing the native build cache. | Mobile. When a native build appears stale after ordinary rebuilds fail. |
| `npx.cmd expo run:android --variant release` | Compile and run a local release variant. | Mobile. For local checks of behavior that differs from a Metro-connected debug build. |
| `npx.cmd expo prebuild --platform android` | Regenerate the Android project from Expo configuration. | Mobile. After native configuration changes or when the generated Android project is absent. |
| `npx.cmd expo prebuild --platform android --no-clean` | Apply native changes to the existing Android folder. | Mobile. When deliberately updating an existing native project and accepting the possibility of accumulated native changes. |
| `npx.cmd expo prebuild --clean --platform android` | Explicitly request a fresh Android generation. | Mobile. When following an explicit clean-rebuild workflow. |
| `npm run ios` | Run the package's local iOS build script on a Mac. | Mobile, on macOS with Xcode. Only if you intentionally work on the existing optional iOS target on macOS. |
| `java -version` | Check the Java runtime selected by your terminal. | Any folder. Before a local Gradle build or when investigating JDK errors. |
| `adb version` | Check Android Debug Bridge availability. | Any folder with adb on PATH. Before USB installation or device debugging. |
| `adb devices` | List connected Android targets. | Any folder with adb on PATH. Before building for or installing onto a phone or emulator. |
| `adb devices -l` | List devices with extra identifying information. | Any folder with adb on PATH. When choosing between multiple devices. |
| `adb -s DEVICE_SERIAL get-state` | Check one selected device's connection state. | Any folder with adb on PATH. When multiple phones or emulators are attached. |
| `adb reverse tcp:8081 tcp:8081` | Connect the phone's Metro port to the PC over USB. | Any folder with adb on PATH and one connected target. Before a USB localhost Metro session. |
| `adb reverse tcp:3000 tcp:3000` | Connect the phone's API port to the PC over USB. | Any folder with adb on PATH and one connected target. When using a USB localhost API address after an API client is implemented. |
| `adb reverse --list` | Inspect current USB port mappings. | Any folder with adb on PATH. When localhost connections fail or after reconnecting a phone. |
| `adb reverse --remove tcp:8081` | Remove the phone's Metro forwarding rule. | Any folder with adb on PATH. After ending USB Metro development or changing ports. |
| `adb reverse --remove tcp:3000` | Remove the phone's API forwarding rule. | Any folder with adb on PATH. When ending USB API testing. |
| `adb shell am force-stop com.anonymous.RebyuIT` | Fully stop RebyuIT on the selected Android device. | Any folder with adb on PATH. Before manually testing launch and splash behavior. |
| `cd C:\ai-reviewer-app\mobile\android` | Open the generated native build folder. | Any folder, after Android generation. Before direct Gradle wrapper commands. |
| `.\gradlew.bat --version` | Inspect the project's Gradle and JVM versions. | Android. When diagnosing Gradle/JDK selection. |
| `.\gradlew.bat tasks --all` | List the native project's available Gradle tasks. | Android. Before using a task from a guide or investigating variant names. |
| `.\gradlew.bat :app:assembleDebug --stacktrace` | Build the debug APK with detailed failure traces. | Android. When diagnosing a native compilation error. |
| `.\gradlew.bat :app:assembleDebug` | Create a local debug APK. | Android. When you want an APK file without immediately launching it. |
| `.\gradlew.bat :app:installDebug` | Build and install the debug variant. | Android. When using Gradle directly for development installation. |
| `.\gradlew.bat :app:assembleRelease` | Create a local release APK. | Android. For standalone local APK testing after reviewing release configuration. |
| `.\gradlew.bat :app:bundleRelease` | Create an Android App Bundle. | Android. When a store build is needed after signing and release configuration are ready. |
| `adb install -r "PATH_TO_APK"` | Install an APK or replace a compatible installed version. | Any folder with adb on PATH. After a successful local or cloud APK build. |
| `adb -s DEVICE_SERIAL install -r "PATH_TO_APK"` | Install an APK on one specific device. | Any folder with adb on PATH. When several Android targets are connected. |
| `npx.cmd eas-cli@latest --version` | Check the EAS CLI version you are about to use. | Mobile. Before setting up or troubleshooting cloud builds. |
| `npx.cmd eas-cli@latest login` | Sign in to an Expo account for EAS. | Mobile. Before the first EAS project setup or build. |
| `npx.cmd eas-cli@latest whoami` | Check the active Expo account. | Mobile. Before linking a project or uploading a build. |
| `npx.cmd eas-cli@latest logout` | Sign out of EAS CLI. | Mobile. When switching accounts or finishing on a shared computer. |
| `npx.cmd eas-cli@latest build:configure --platform android` | Configure this app for EAS Android builds. | Mobile. Once you choose to set up cloud builds. |
| `npx.cmd eas-cli@latest build --platform android --profile development` | Request a cloud development build. | Mobile. After configuring a development profile and when you need a new Dev APK. |
| `npx.cmd eas-cli@latest build --platform android --profile preview` | Request a standalone Android preview. | Mobile. After configuring a preview APK profile, for testing without Metro. |
| `npx.cmd eas-cli@latest build --platform android --profile production` | Request a production Android build. | Mobile. After release configuration, production environment values, and device checks are ready. |
| `npx.cmd eas-cli@latest build --platform android --profile preview --clear-cache` | Retry a cloud preview without its build cache. | Mobile. When cloud logs point to a stale native build cache. |
| `npx.cmd eas-cli@latest build:list --platform android --limit 5` | Find recent Android cloud builds. | Mobile. To find a build ID, result, or artifact link. |
| `npx.cmd eas-cli@latest build:view BUILD_ID` | Inspect a specific EAS build. | Mobile. After finding a build ID or receiving a build failure. |
| `npx.cmd eas-cli@latest credentials --platform android` | Manage Android signing credentials interactively. | Mobile. When reviewing or deliberately configuring cloud signing. |
| `npm.cmd run lint` | Check mobile source against the project's lint rules. | Mobile. After changing JavaScript/JSX and before committing mobile changes. |
| `npx.cmd expo lint` | Run the mobile linter directly. | Mobile. When you want the direct equivalent of npm run lint. |
| `npx.cmd expo lint --fix` | Apply available automatic lint fixes. | Mobile. After inspecting lint results and deciding to accept automatic edits. |
| `npx.cmd expo-doctor` | Diagnose Expo setup and dependency problems. | Mobile. During setup, after dependency changes, or while diagnosing an Expo error. |
| `node node_modules/typescript/bin/tsc -p jsconfig.json --allowJs --checkJs --noEmit --jsx react-native --skipLibCheck --esModuleInterop --types nativewind/types --noImplicitAny false --noUncheckedSideEffectImports false` | Check the project's JavaScript and JSX types. | Mobile. When checking mobile source before a commit or build. |
| `adb logcat` | Stream Android system and application logs. | Any folder with adb on PATH. When a native error is absent from Metro's output. |
| `adb logcat "*:E"` | Stream Android error logs. | Any folder with adb on PATH. When looking for a crash or reducing device-log noise. |
| `node --inspect --env-file=.env --watch src/server.js` | Run the API with Node's debugger enabled. | Server. When tracing server startup or future API request handling. |
| `git diff --check` | Find whitespace errors in tracked edits. | Root. Before committing documentation or source changes. |
| `npm.cmd run` | List scripts declared by the current package. | Mobile or Server. Before assuming a script exists. |
| `npm.cmd ls --depth=0` | Inspect the direct installed dependencies. | Mobile or Server. After setup or when investigating package resolution. |
| `npm.cmd outdated` | Check for newer dependency versions. | Mobile or Server. Before planning a dependency update. |
| `npm.cmd audit` | Check npm's published vulnerability advisories. | Mobile or Server. When reviewing dependency security. |
| `npx.cmd expo install PACKAGE_NAME` | Add a mobile dependency using Expo compatibility rules. | Mobile. When adding an approved mobile library. |
| `npx.cmd expo install PACKAGE_NAME --dev` | Add a mobile development dependency. | Mobile. When adding an approved tool used during development. |
| `npx.cmd expo install --check` | Check Expo's expected package versions. | Mobile. After a clean install or before investigating dependency mismatch errors. |
| `npx.cmd expo install --fix` | Correct versions Expo considers incompatible. | Mobile. After reviewing compatibility warnings and deciding to apply them. |
| `npm.cmd install PACKAGE_NAME` | Add a backend runtime dependency. | Server. When implementing server work that needs an approved package. |
| `npm.cmd install --save-dev PACKAGE_NAME` | Add a backend development tool. | Server. When adding an approved backend test, lint, or development tool. |
| `npm.cmd update PACKAGE_NAME` | Update one backend dependency within its allowed range. | Server. During a deliberate, reviewed backend dependency update. |
| `npm.cmd uninstall PACKAGE_NAME` | Remove a dependency from the current package. | Mobile or Server. After removing all imports/configuration that depend on an unused package. |
| `npm.cmd explain PACKAGE_NAME` | Find why a dependency is installed. | Mobile or Server. When a package is present in node_modules but absent from direct dependencies. |
| `npx.cmd expo start --dev-client --clear` | Restart Metro with a clean bundler cache. | Mobile. When Metro serves stale code or styling after a normal restart. |
| `npx.cmd expo start --clear` | Clear Metro cache using automatic client selection. | Mobile. When following a generic Metro reset workflow. |
| `npx.cmd expo start --dev-client --reset-cache` | Use the installed CLI's alternate Metro reset spelling. | Mobile. When adapting a guide that uses this supported alias. |
| `.\gradlew.bat clean` | Remove generated native build outputs. | Android. When build logs suggest stale native output. |
| `.\gradlew.bat --stop` | Stop Gradle's background build processes. | Android. When Java processes hold build files or after changing the JDK. |
| `npm.cmd cache verify` | Check and tidy npm's package download cache. | Any folder with npm installed. When package downloads or cached package integrity appear faulty. |
| `adb kill-server` | Stop the PC's ADB server. | Any folder with adb on PATH. When device detection is stuck after checking USB cable and phone authorization. |
| `adb start-server` | Restart the PC's ADB background service. | Any folder with adb on PATH. After deliberately stopping ADB or while recovering a device connection. |
| `git status --short` | See pending repository changes. | Root. Before editing, staging, switching branches, or committing. |
| `git diff` | Review unstaged tracked-file changes. | Root. Before staging your edits. |
| `git diff --staged` | Review the next commit's staged changes. | Root. Immediately before committing. |
| `git diff --stat` | See a compact change summary. | Root. When checking the scope of current work. |
| `git log -10 --oneline` | Read the latest ten commits. | Root. When checking recent work or finding a baseline. |
| `git branch --show-current` | Check your current branch name. | Root. Before pulling, pushing, or creating branch-specific work. |
| `git branch --all` | List local and known remote branches. | Root. When choosing an existing branch. |
| `git switch -c BRANCH_NAME` | Create and enter a new working branch. | Root. Before starting a separate feature or fix. |
| `git switch BRANCH_NAME` | Switch to an existing local branch. | Root. When continuing work on another branch. |
| `git add -- PATH_TO_FILE` | Stage a specific file. | Root. After reviewing the intended change. |
| `git restore --staged -- PATH_TO_FILE` | Remove a file's changes from staging. | Root. When you staged an unrelated file or need to edit before staging again. |
| `git commit -m "MESSAGE"` | Record the staged changes locally. | Root. After reviewing the staged diff and relevant checks. |
| `git remote -v` | Inspect the configured repository remotes. | Root. Before fetching or publishing to GitHub. |
| `git fetch` | Refresh remote branch information. | Root. Before checking whether your branch is behind its remote. |
| `git pull --ff-only` | Update your branch only by fast-forward. | Root. When bringing a clean working branch up to date with its upstream. |
| `git push` | Upload commits to the configured upstream. | Root. When sharing completed local commits. |
| `git push -u origin BRANCH_NAME` | Publish a new branch and set its upstream. | Root. The first time you publish a new working branch. |
| `git check-ignore -v -- mobile/.env server/.env` | Check which ignore rules protect local settings. | Root. Before staging changes involving local configuration. |
| `npm.cmd ci --omit=dev` | Install locked runtime dependencies for a server deployment. | Server. In a prepared server host or deployment workspace. |
| `node src/server.js` | Start Express with environment values supplied by the host. | Server. On a host configured to inject runtime environment variables. |
| `Get-Location` | Show the current terminal folder. | Any folder. Before a command whose working folder matters. |
| `Get-ChildItem -Force` | List files including hidden entries. | Any folder. When locating .env, .gitignore, or configuration files. |
| `git --version` | Check the Git installation. | Any folder. During setup or when a Git feature is unavailable. |
| `node --version` | Check the Node.js executable selected by PATH. | Any folder. Before installing dependencies or diagnosing Node engine errors. |
| `npm.cmd --version` | Check the npm launcher and version. | Any folder. During setup or installation troubleshooting. |
| `Get-Command node, npm.cmd, npx.cmd, java, adb` | Find the executables PowerShell will run. | Any folder. When multiple Node/JDK installations exist or a tool is missing. |
| `ipconfig` | Find the PC's local network addresses. | Any folder. When preparing a phone's LAN API URL or investigating connectivity. |
| `Get-NetTCPConnection -LocalPort 3000 -State Listen` | Find the listener on the default API port. | Any folder. When Express reports EADDRINUSE or you need to find the existing server. |
| `Get-NetTCPConnection -LocalPort 8081 -State Listen` | Find the listener on Metro's default port. | Any folder. When Metro reports a port conflict. |
| `Get-Process -Id PROCESS_ID` | Identify a process by its numeric ID. | Any folder. After finding the process occupying a development port. |
| `Stop-Process -Id PROCESS_ID -Confirm` | Stop one identified process after confirmation. | Any folder. Only when you have identified a stale project server and cannot stop it in its terminal. |
| `npx.cmd expo --help` | List the installed Expo CLI command families. | Mobile. Before using a command from an older guide. |
| `npx.cmd expo start --help` | Check supported Metro startup flags. | Mobile. Before choosing a connection mode or cache flag. |
| `npx.cmd expo run:android --help` | Check local Android build options. | Mobile. Before changing local Android build behavior. |
| `npx.cmd expo prebuild --help` | Check native regeneration options for the installed CLI. | Mobile. Before regenerating native files, especially after an Expo upgrade. |
| `npx.cmd expo export --help` | Inspect bundle export options. | Mobile. Before changing bundle export behavior. |
| `npx.cmd expo install --help` | Inspect Expo's dependency installation options. | Mobile. Before modifying SDK-related dependencies. |
| `npx.cmd eas-cli@latest build --help` | Inspect current cloud build options. | Mobile. Before running an EAS build, especially if a guide names different flags. |
| `npm.cmd help` | Open npm's general command help. | Any folder with npm installed. When looking up an npm operation. |
| `git help` | Show Git's general command guide. | Any folder. When you need to find the appropriate Git operation. |
| `adb --help` | List ADB device and connection options. | Any folder with adb on PATH. Before using a device command from another guide. |
| `npx.cmd expo login` | Sign in through Expo CLI. | Mobile. When using an Expo CLI service that needs authentication. |
| `npx.cmd expo whoami` | Check Expo CLI's active account. | Mobile. Before an account-specific Expo operation. |
| `npx.cmd expo logout` | Sign out through Expo CLI. | Mobile. When switching accounts or using a shared PC. |
| `npx.cmd expo register` | Start Expo account registration. | Mobile. If you need an account before using cloud services. |
