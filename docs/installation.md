# Installation

Follow this guide after cloning the project. Open PowerShell in the repository root, the folder containing `mobile/` and `server/`. These instructions cover Windows and an Android phone or emulator.

## 1. Install the prerequisites

- Install [Git for Windows](https://git-scm.com/downloads/win).
- Install [Node.js](https://nodejs.org/en/download), which includes npm. The maintainer checked this workspace with Node.js `24.20.0` and npm `11.19.0`; use those as the tested reference.
- For local Android development builds, install Android Studio, the Android SDK, and the compatible JDK using the [Expo Android environment guide](https://docs.expo.dev/workflow/android-studio-emulator/). Use a configured emulator or an Android phone with USB debugging enabled.

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

`expo-dev-client ~57.0.20` is included in the mobile dependencies for SDK 57. Restoring dependencies installs the package, but you still need to build and install the Android app once before using the development client.

The app uses one fixed color palette with a `#F8F8FF` screen background. It does not switch appearance with the device theme. Shared colors live in `src/lib/theme.js` and `global.css`.

`lucide-react-native` and the Expo SDK-compatible `react-native-svg` are included in the mobile dependencies; `npm.cmd ci --prefix mobile` installs both. Use direct named imports from `lucide-react-native` and pass `size`, `color`, and `strokeWidth` props as needed. Use an explicit color from the shared palette.

```jsx
import { BookOpen } from 'lucide-react-native';
import { THEME } from '@/lib/theme';

<BookOpen size={24} color={THEME.foreground} strokeWidth={2} />
```

`THEME` is the shared color object from `src/lib/theme.js`. No shared icon wrapper is required. The login screen already uses Lucide icons. Rebuild an existing development app after adding the native SVG dependency, following section 4. See the [Lucide React Native guide](https://lucide.dev/guide/react-native/getting-started) and [Expo SDK 57 SVG reference](https://docs.expo.dev/versions/v57.0.0/sdk/svg/).

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

## 4. Choose how to run the Android app

Expo Go is Expo's ready-made Android app. It loads RebyuIT's JavaScript using the native libraries already included in Expo Go. The RebyuIT Dev APK is a development build of this project with `expo-dev-client` and the native libraries compiled into that build.

| | Expo Go | RebyuIT Dev APK |
|---|---|---|
| Installed app | Expo Go, with a compatible Expo SDK version | A development build of RebyuIT |
| Native libraries | Fixed set included in Expo Go | Libraries included when you build RebyuIT |
| App name and icon | Opens the project inside Expo Go | Uses RebyuIT's configured name and icon |
| First setup | Install compatible Expo Go | Build and install the APK locally or through EAS |
| Later JavaScript/JSX and styling edits | Reload through Metro | Reload through Metro |
| Native library or configuration changes | Limited to what Expo Go supports | Rebuild and reinstall the APK |

Use the RebyuIT Dev APK for project development and native feature testing. Expo Go is an optional preview for supported features. See [Expo's comparison](https://docs.expo.dev/develop/development-builds/faq/).

A release APK is a separate build for normal users. It includes the JavaScript bundle and runs without your development Metro server. The Dev APK is for development and debugging; installing it does not establish release readiness. See [Expo's native app and JavaScript explanation](https://docs.expo.dev/develop/development-builds/faq/#native-app-and-javascript-bundle).

### Start Express and build the development app

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
npx.cmd expo run:android --device
```

For a physical phone, connect it by USB and authorize USB debugging. The command lets you select a device, generates the ignored `android/` project if needed, builds and installs the development app, and starts Metro. For an emulator, start it first and use `npx.cmd expo run:android`. See [Expo's development build guide](https://docs.expo.dev/develop/development-builds/introduction/).

`mobile/app.json` currently sets the display name to `RebyuIT` and the Android application ID to `com.anonymous.RebyuIT`. Keep the application ID consistent when rebuilding an existing installation.

### Use an installed RebyuIT Dev APK

On later sessions, start Metro from `mobile/` with:

```powershell
npm.cmd start -- --dev-client
```

Open the installed development app and connect to Metro, or press `a` for the emulator. For a phone connecting over LAN, keep the PC and phone on the same reachable network. Installing the package or starting Metro alone does not install the app. The expected app screen is still a placeholder.

JavaScript/JSX and styling edits, such as changing the login screen, use Fast Refresh without rebuilding the APK. Adding or updating a native dependency, upgrading the Expo SDK, or changing native settings in `app.json` requires a new build. Regenerate the native project and rebuild from `mobile/`:

```powershell
npx.cmd expo prebuild --clean --platform android
npx.cmd expo run:android --device
```

The clean prebuild replaces generated native files; keep native configuration in `app.json` and config plugins. Use `npx.cmd expo run:android` for an emulator.

See [Expo's rebuild guidance](https://docs.expo.dev/develop/development-builds/introduction/#rebuild-when-native-code-changes).

### Use Expo Go for a limited preview

Install [Expo Go for SDK 57](https://expo.dev/go?sdkVersion=57&platform=android&device=true), then run this from `mobile/`:

```powershell
npm.cmd start -- --go
```

Open the project in Expo Go using Metro's QR code. Expo Go does not include this project's development client or reproduce all native configuration. Use an installed RebyuIT build to check the app's native behavior; Expo Go cannot confirm release splash behavior.

### Continue after removing local Android build tools

Keep Node.js, npm, the project, its dependencies, and the compatible RebyuIT Dev APK installed on your phone. Start Metro with `npm.cmd start -- --dev-client` and connect over a reachable network. Android Studio, the SDK, and the JDK are needed for local native builds, but are not required to serve JavaScript to the phone through Metro. Removing platform-tools also removes `adb`, so use the phone's launcher or QR code instead of ADB-based launching.

When a native change requires another APK, restore the local build tools or configure an EAS cloud development build. EAS requires an Expo account and build configuration; it does not require the local Android SDK or JDK. EAS configuration remains planned in this repository. See [Expo's build options](https://docs.expo.dev/develop/development-builds/introduction/) and the [cleanup guide](RebyuIT_Android_Dev_Cleanup_Guide.md) before removing tools.

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
| Expo reports an SDK mismatch | Rebuild the development client for SDK 57, or use a matching Expo Go version for the optional preview. |
| No development build is installed | Run `npx.cmd expo run:android --device` from `mobile/` to build and install it; starting Metro does not create an APK. |
| The phone cannot load the preview or reach the API | Check the PC address, shared network, and Windows Firewall permissions for development traffic. A Metro tunnel does not expose Express. |
| Styling changes are not picked up | Stop Expo, then run `npx.cmd expo start --clear` from `mobile/`. |
| An environment template or source file is missing | Confirm you have the branch and commits shared by the maintainer. |

The [folder guide](../folder-structure.md) explains where files belong. The [roadmap](../planning/ai-powered-reviewer-roadmap.md) covers the planned features. Authentication, document imports, quizzes, flashcards, progress, and PDF reports are not implemented yet.

This guide reflects the maintainer's local checkout. Fresh-clone installation on a collaborator's computer, live service connections, and Android device behavior remain unverified.
