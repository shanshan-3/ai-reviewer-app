# Project terminal commands

Use PowerShell. Run each command separately. Replace values such as PACKAGE_NAME, PATH_TO_APK, and BRANCH_NAME with your own values.

Folder names below mean:

| Folder | Full path |
|---|---|
| Root | C:\ai-reviewer-app |
| Mobile | C:\ai-reviewer-app\mobile |
| Server | C:\ai-reviewer-app\server |

Use npm.cmd and npx.cmd on Windows to avoid PowerShell script execution-policy errors. There is no root package.json. For environment values and prerequisites, see the [installation guide](installation.md).

## Folders and tool versions

Run from any folder.

| Command | Explanation |
|---|---|
| `cd C:\ai-reviewer-app` | Open the project root. |
| `cd C:\ai-reviewer-app\mobile` | Open the mobile app folder. |
| `cd C:\ai-reviewer-app\server` | Open the server folder. |
| `Get-Location` | Show your current folder. |
| `Get-ChildItem -Force` | List files, including hidden files. |
| `git --version` | Show the installed Git version. |
| `node --version` | Show the installed Node.js version. |
| `npm.cmd --version` | Show the installed npm version. |
| `java -version` | Check Java for local Android builds. |
| `adb version` | Check Android platform-tools, if installed and on PATH. |

## Every package script

These are all scripts currently declared in the two package.json files.

| Folder | Command | Explanation |
|---|---|---|
| Mobile | `npm.cmd start` | Start Metro. With expo-dev-client installed, Expo targets a development build by default. |
| Mobile | `npm.cmd run android` | Build and install Android locally, then start Metro. Requires Android build tools. |
| Mobile | `npm.cmd run ios` | Build and run iOS locally. Requires macOS and Xcode; unavailable on this Windows PC. |
| Mobile | `npm.cmd run web` | Open the web development preview. The agreed application target remains Android. |
| Mobile | `npm.cmd run lint` | Run Expo's ESLint checks. |
| Server | `npm.cmd run dev` | Start Express with file watching and values from .env. |
| Server | `npm.cmd start` | Start Express with values from .env, without file watching. |

Neither package currently has a test script or a build script. Use the Android and export commands below to compile or bundle the app.

## Dependencies

Run from Root unless another folder is listed.

| Folder | Command | Explanation |
|---|---|---|
| Root | `npm.cmd ci --prefix mobile` | Restore mobile dependencies from the lockfile. Replaces mobile/node_modules. |
| Root | `npm.cmd ci --prefix server` | Restore server dependencies from the lockfile. Replaces server/node_modules. |
| Mobile or Server | `npm.cmd install` | Install dependencies and reconcile the lockfile; it may change package-lock.json. |
| Mobile or Server | `npm.cmd run` | List the scripts available in that folder. |
| Mobile or Server | `npm.cmd ls --depth=0` | List direct installed dependencies and report missing or invalid ones. |
| Mobile or Server | `npm.cmd outdated` | Show packages with newer versions available. Does not upgrade them. |
| Mobile or Server | `npm.cmd audit` | Check dependencies against npm's vulnerability reports. |
| Mobile | `npx.cmd expo install PACKAGE_NAME` | Add a mobile dependency using Expo's SDK compatibility rules. |
| Mobile | `npx.cmd expo install PACKAGE_NAME --dev` | Add a mobile development dependency. |
| Mobile | `npx.cmd expo install --check` | Check installed versions against Expo's expected versions. |
| Mobile | `npx.cmd expo install --fix` | Change incompatible dependency versions. Review the manifest and lockfile afterward. |
| Mobile or Server | `npm.cmd uninstall PACKAGE_NAME` | Remove a dependency and update the manifest and lockfile. |
| Server | `npm.cmd install PACKAGE_NAME` | Add a server dependency. |
| Server | `npm.cmd install --save-dev PACKAGE_NAME` | Add a server development dependency. |

You do not need to reinstall dependencies for ordinary source edits. Adding or changing a native dependency requires rebuilding the development APK.

## Environment files and networking

The copy commands ask for confirmation. Use them for fresh setup; copying over an existing .env replaces its values. Keep private keys in server/.env and out of EXPO_PUBLIC_ variables.

| Folder | Command | Explanation |
|---|---|---|
| Root | `Test-Path mobile/.env` | Check whether the mobile environment file already exists. |
| Root | `Test-Path server/.env` | Check whether the server environment file already exists. |
| Root | `Copy-Item -LiteralPath mobile/.env.example -Destination mobile/.env -Confirm` | Copy the mobile environment template after confirmation. |
| Root | `Copy-Item -LiteralPath server/.env.example -Destination server/.env -Confirm` | Copy the server environment template after confirmation. |
| Root | `notepad.exe mobile/.env` | Edit local mobile environment values. |
| Root | `notepad.exe server/.env` | Edit local server environment values. |
| Any | `ipconfig` | Find your PC's active LAN IPv4 address. |
| Any | `Invoke-RestMethod -Uri http://localhost:3000/health` | Check the running API. Expect status = ok. Change the port if configured differently. |
| Any | `Get-NetTCPConnection -LocalPort 3000 -State Listen` | Find the process listening on the default API port. No match means no listener was found. |
| Any | `Get-NetTCPConnection -LocalPort 8081 -State Listen` | Find the process listening on Metro's default port. |

A phone uses a reachable PC LAN address for the local API. The standard Android emulator uses http://10.0.2.2:3000. The mobile API client is still unimplemented; setting EXPO_PUBLIC_API_URL alone does not connect it.

## Metro and app previews

Run from Mobile. Stop an existing Metro process with Ctrl+C before restarting it with different options. A development client must already be installed for --dev-client commands.

| Command | Explanation |
|---|---|
| `npx.cmd expo start` | Start Metro. Equivalent to npm.cmd start. |
| `npx.cmd expo start --dev-client` | Start Metro explicitly for the installed RebyuIT development APK. |
| `npm.cmd start -- --dev-client` | Run the same development-client command through the npm script. |
| `npx.cmd expo start --go` | Start Metro for a compatible Expo Go installation. |
| `npm.cmd start -- --go` | Run the Expo Go command through the npm script. |
| `npx.cmd expo start --dev-client --clear` | Clear the bundler cache and restart Metro for the development APK. |
| `npx.cmd expo start --dev-client --lan` | Serve over the local network. LAN is the default host mode. |
| `npx.cmd expo start --dev-client --localhost` | Serve through localhost; a physical phone needs a suitable USB forwarding setup. |
| `npx.cmd expo start --dev-client --tunnel` | Use a tunnel when LAN access fails. Requires internet and may prompt for ngrok tooling. |
| `npx.cmd expo start --dev-client --port 8082` | Use another Metro port when 8081 is occupied. |
| `npx.cmd expo start --dev-client --android` | Start Metro and open the app on a connected Android device or emulator using ADB. |
| `npx.cmd expo start --web` | Start the browser preview. Equivalent to npm.cmd run web. |
| `npx.cmd expo start --offline` | Skip Expo CLI network requests. Does not make backend-dependent app features work offline. |

A Metro tunnel only exposes Metro. Your Express API still needs its own reachable address. Expo Go does not reproduce every native setting or prove standalone splash behavior.

## Checks, configuration, and exports

Run from Mobile.

| Command | Explanation |
|---|---|
| `npx.cmd expo lint` | Run the linter directly. Equivalent to npm.cmd run lint. |
| `npx.cmd expo lint --fix` | Apply automatic lint fixes where available. Changes source files. |
| `npx.cmd expo-doctor` | Check common Expo configuration and dependency problems. May download the doctor tool. |
| `npx.cmd expo config` | Print the resolved Expo configuration. |
| `npx.cmd expo config --json` | Print the resolved configuration as JSON. |
| `npx.cmd expo config --type public` | Inspect public Expo configuration. |
| `npx.cmd expo config --type introspect` | Inspect the native configuration produced by config plugins. |
| `npx.cmd expo export --platform android` | Bundle Android JavaScript and assets into dist. Does not compile an APK. |
| `npx.cmd expo export --platform android --clear` | Clear the bundler cache before exporting Android files. |
| `npx.cmd expo export --platform web` | Export web files into dist. Does not deploy them. |
| `npx.cmd expo serve` | Serve an existing web export locally; export it first. |
| `npx.cmd expo customize` | Interactively generate supported configuration files. Review changes to existing configuration. |

Use this full command for the JavaScript/JSX type check:

```powershell
node node_modules/typescript/bin/tsc -p jsconfig.json --allowJs --checkJs --noEmit --jsx react-native --skipLibCheck --esModuleInterop --types nativewind/types --noImplicitAny false --noUncheckedSideEffectImports false
```

It uses TypeScript from the current dependency tree, permits implicit argument types and side-effect imports, and writes no compiled output. Linting, type checks, and bundling do not prove native compilation or device behavior.

## Local Android builds

Run from Mobile. Requires a compatible JDK and the Android SDK. Phones also need USB debugging enabled and authorized; start an emulator before selecting it.

| Command | Explanation |
|---|---|
| `npx.cmd expo run:android` | Build, install, and launch Android locally. Equivalent to npm.cmd run android. |
| `npx.cmd expo run:android --device` | Choose the phone or emulator to build and install on. |
| `npx.cmd expo run:android --no-bundler` | Build and install without starting another Metro process. |
| `npx.cmd expo run:android --no-build-cache` | Clear the native build cache before rebuilding. Takes longer. |
| `npx.cmd expo run:android --variant release` | Compile and run the release variant locally. Store distribution still requires appropriate signing. |
| `npx.cmd expo prebuild --platform android` | Regenerate the native Android project from Expo configuration. Can replace manual native edits. |
| `npx.cmd expo prebuild --platform android --no-clean` | Apply native configuration changes to the existing Android folder without recreating it. Still changes native files. |

Preserve manual native changes before prebuild. This installed Expo CLI exposes --no-clean; use its help output when regenerating, since older guides may show different flags.

## Android device commands

Run from any folder with adb on PATH. Commands without a device selector require a single connected target. With several targets, add -s DEVICE_SERIAL immediately after adb.

| Command | Explanation |
|---|---|
| `adb devices -l` | List connected phones and emulators, including authorization status. |
| `adb -s DEVICE_SERIAL get-state` | Check whether a particular device is connected. |
| `adb install -r "PATH_TO_APK"` | Install an APK or update an existing app when its signing identity is compatible. |
| `adb reverse tcp:8081 tcp:8081` | Forward the phone's localhost:8081 to the PC's Metro port over USB. |
| `adb reverse tcp:3000 tcp:3000` | Forward the phone's localhost:3000 to the PC's API port over USB. |
| `adb reverse --list` | Show active reverse port mappings. |
| `adb reverse --remove tcp:8081` | Remove the Metro USB mapping. |
| `adb reverse --remove tcp:3000` | Remove the API USB mapping. |
| `adb logcat` | Stream Android device logs. Stop with Ctrl+C. |
| `adb logcat "*:E"` | Stream device logs at error priority and above. |
| `adb shell am force-stop com.anonymous.RebyuIT` | Fully stop RebyuIT before testing a fresh launch from its icon. |

USB API forwarding requires the app's API URL to use the forwarded localhost address. ADB does not change the app's environment values. See the [Android Debug Bridge reference](https://developer.android.com/tools/adb).

## Expo account commands

Run from Mobile. Account access is needed for cloud services, not ordinary local source edits.

| Command | Explanation |
|---|---|
| `npx.cmd expo login` | Sign in to an Expo account. |
| `npx.cmd expo whoami` | Show the signed-in account. |
| `npx.cmd expo logout` | Sign out. |
| `npx.cmd expo register` | Start Expo account registration. |

## Git commands

Run from Root. Review the diff before committing. Replace PATH_TO_FILE with a specific file, and check your branch before pulling or pushing.

| Command | Explanation |
|---|---|
| `git status --short` | Show modified, staged, and untracked files. |
| `git diff` | Show unstaged changes to tracked files. |
| `git diff --staged` | Show changes staged for the next commit. |
| `git diff --check` | Check unstaged tracked changes for whitespace problems. |
| `git diff --stat` | Show a summary of unstaged tracked changes. |
| `git log -10 --oneline` | Show the latest ten commits. |
| `git branch --show-current` | Show the current branch. |
| `git branch --all` | List local and known remote branches. |
| `git switch -c BRANCH_NAME` | Create and switch to a new branch. |
| `git switch BRANCH_NAME` | Switch to an existing branch; may stop if local changes conflict. |
| `git add -- PATH_TO_FILE` | Stage a specific file. |
| `git restore --staged -- PATH_TO_FILE` | Unstage a file while retaining its working changes. |
| `git commit -m "MESSAGE"` | Commit the staged changes locally. |
| `git remote -v` | Show configured remotes. |
| `git fetch` | Refresh remote branch information without merging. |
| `git pull --ff-only` | Update from the upstream only when a fast-forward is possible. |
| `git push` | Publish committed changes to the configured upstream. |
| `git push -u origin BRANCH_NAME` | Publish a new branch and set its upstream. |

## Find every available option

Help output lists the complete command families and flags supported by your tools, including options beyond this project's usual workflow.

| Folder | Command | Explanation |
|---|---|---|
| Mobile | `npx.cmd expo --help` | List the installed Expo CLI commands. |
| Mobile | `npx.cmd expo start --help` | List every Metro startup option. |
| Mobile | `npx.cmd expo run:android --help` | List local Android build options. |
| Mobile | `npx.cmd expo prebuild --help` | List native generation options for this installed Expo version. |
| Mobile | `npx.cmd expo export --help` | List export options. |
| Mobile | `npx.cmd expo install --help` | List dependency installation options. |
| Mobile or Server | `npm.cmd help` | Show npm help. |
| Any | `git help` | Show Git help. |
| Any | `adb --help` | Show ADB options, if installed. |

Expo commands were checked against this checkout's installed CLI help. The [Expo CLI reference](https://docs.expo.dev/more/expo-cli/) covers the wider tool. iOS commands are included because the mobile package declares them; local iOS compilation requires a Mac.
