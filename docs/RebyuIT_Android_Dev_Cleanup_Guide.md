# RebyuIT Android development cleanup on Windows

You can remove the Android SDK, emulator, JDK 17, Gradle caches, and development APK when you no longer need them for local RebyuIT builds or testing. RebyuIT uses Expo and React Native.

These steps are optional. Keep the build tools if you still need `npx expo run:android` or local APK builds. Keep your project and Node.js tooling to continue development with Expo Go, an existing development build, or EAS cloud builds.

## Expo Go and the RebyuIT Dev APK

Expo Go is a ready-made app from Expo that loads your project using its fixed set of native libraries. The RebyuIT Dev APK is a development build of your own app, with RebyuIT's configured name, icon, and compiled native libraries. Both can load JavaScript changes from Metro during development. See [Expo's comparison](https://docs.expo.dev/develop/development-builds/faq/).

Keep the RebyuIT Dev APK on your phone if you want to keep developing with it after removing local build tools. JavaScript/JSX and styling edits can still reload over the network. Native library, Expo SDK, or native configuration changes require a rebuilt APK, using restored local tools or EAS cloud builds. The [installation guide](installation.md#4-choose-how-to-run-the-android-app) covers these workflows.

A release APK is built separately for normal users and includes its JavaScript bundle, so it runs without Metro. Removing local build tools does not turn a development APK into a release APK. See [Expo's native app and JavaScript explanation](https://docs.expo.dev/develop/development-builds/faq/#native-app-and-javascript-bundle).

## 0. Choose what to remove

| Item | Remove if no longer building Android locally? | Notes |
|---|---|---|
| RebyuIT source code (`C:\ai-reviewer-app`) | No | Contains your mobile app and backend. Back it up. |
| Node.js, npm, VS Code | Usually no | Still needed for React Native/Expo and Express development. |
| Android Studio | Optional | Uninstall if only installed for Android testing. |
| Android SDK, build tools, platform tools, NDK/CMake | Yes, if no local Android builds | `adb` will stop working after platform-tools are removed. |
| Android Emulator / AVDs | Yes | Can consume many GB. |
| Eclipse Temurin JDK 17 | Optional | Remove only if no other Java-based tools need it. |
| Gradle user cache | Yes | Regenerates if you build again. |
| RebyuIT development build on phone | Optional | Uninstall from Android Settings. |
| `android` folder in project | Only after checking for native changes | See section 7 before deleting it. |

## 1. Before removing anything

1. Back up `C:\ai-reviewer-app`, especially your `mobile` and backend folders.
2. Commit your current work to Git if you use it.
3. Close Android Studio, emulators, VS Code terminals running Gradle/Metro, and any active builds.
4. If an emulator is running, shut it down from Android Studio's Device Manager or the emulator window.

Press Ctrl+C in Metro's terminal to stop it.

## 2. Uninstall Android Studio (optional)

Open Windows Settings, then Apps, then Installed apps (Apps & features on Windows 10). Find Android Studio and select Uninstall.

The Android SDK, emulator images, and user data may remain after uninstalling Android Studio. Check those folders separately.

## 3. Remove Android SDK and emulator files

Find the SDK directory in PowerShell:

```powershell
Write-Output $env:ANDROID_HOME
Test-Path "$env:LOCALAPPDATA\Android\Sdk"
```

The usual SDK location for this Windows account is:

```text
C:\Users\Administrator\AppData\Local\Android\Sdk
```

If you no longer need the SDK, check the folder path before deleting it through File Explorer or PowerShell:

```powershell
Remove-Item -LiteralPath "$env:LOCALAPPDATA\Android\Sdk" -Recurse -Force
```

If files are in use, close Android Studio and all emulator or Gradle processes, then try again. A folder with a similar name may contain something else; check the full path.

Android Virtual Devices (AVDs) and emulator data are often stored separately:

```text
C:\Users\Administrator\.android\avd
```

If you no longer need any Android emulators, delete the AVD directory:

```powershell
Remove-Item -LiteralPath "$env:USERPROFILE\.android\avd" -Recurse -Force
```

Keep the rest of `%USERPROFILE%\.android` unless you want to reset all Android developer configuration. It also contains settings and debug keys. Check whether other apps need the SDK or ADB before removing them.

## 4. Uninstall Eclipse Temurin JDK 17 (optional)

1. Open Settings, then Apps, then Installed apps.
2. Find Eclipse Temurin JDK 17 or a similarly named Temurin/Adoptium entry.
3. Select Uninstall.

Keep Java if other software needs it. After uninstalling, open System Properties, then Advanced, then Environment Variables. Remove or correct `JAVA_HOME` if it points to the deleted JDK, and remove any `Path` entries for that JDK.

Check your current Java path with:

```powershell
where.exe java
$env:JAVA_HOME
```

## 5. Remove Gradle caches and local build output

Gradle downloads and caches are commonly stored in:

```text
C:\Users\Administrator\.gradle
```

You can remove this cache if you will no longer build Android apps locally:

```powershell
Remove-Item -LiteralPath "$env:USERPROFILE\.gradle" -Recurse -Force
```

This cache is shared by all Gradle projects under your Windows account. Gradle can download it again later.

To remove RebyuIT's generated Android build output while keeping its source code, use:

```powershell
Remove-Item -LiteralPath 'C:\ai-reviewer-app\mobile\android\build' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\ai-reviewer-app\mobile\android\app\build' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'C:\ai-reviewer-app\mobile\android\.gradle' -Recurse -Force -ErrorAction SilentlyContinue
```

Future builds regenerate these folders. Keep `C:\ai-reviewer-app\mobile\android` unless you have checked for custom native changes and want to regenerate the native project.

## 6. Clean up environment variables

Search Start for "Edit the system environment variables", open it, and select Environment Variables.

Check for variables you added specifically for Android development:

- `ANDROID_HOME`
- `ANDROID_SDK_ROOT` (if present)
- `JAVA_HOME` (only if uninstalling Java)

Remove variables only when they refer to uninstalled tools and other software no longer needs them. Check both User and System `Path` for entries such as:

```text
%ANDROID_HOME%\platform-tools
C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools
<deleted-JDK-directory>\bin
```

Close and reopen PowerShell after editing variables. Do not delete unrelated `Path` entries.

## 7. What about `android`, `local.properties`, and `node_modules`?

The mobile project is under:

```text
C:\ai-reviewer-app\mobile
```

- `android\local.properties` stores your local SDK path. After uninstalling the SDK, you can remove this local-only file because its path is invalid. Recreate it if you build locally again.
- The `android` directory contains the generated native project. Keep it if you changed native code or configuration. You can regenerate it with `npx expo prebuild --clean`, but that overwrites native changes.
- Keep `node_modules` for development. Removing Android Studio does not require deleting it. You can remove it to reclaim space if you are prepared to run `npm install` again.
- Keep your `src`, `app`, `assets`, `package.json`, `app.json`, and backend folders.

## 8. Remove the RebyuIT development APK from your phone

On your Android phone:

1. Open Settings, then Apps, then Manage apps. The wording varies by phone.
2. Find RebyuIT.
3. Tap Uninstall.

You can also long-press the RebyuIT icon and choose Uninstall.

Uninstalling removes the phone's development build. Your source code stays on your laptop.

## 9. Verify the cleanup

Open a new PowerShell window:

```powershell
Test-Path "$env:LOCALAPPDATA\Android\Sdk"
Test-Path "$env:USERPROFILE\.android\avd"
Test-Path "$env:USERPROFILE\.gradle"
where.exe adb
where.exe java
```

`False` confirms that a folder is absent. If `where.exe` cannot find a command you removed, the result is expected. Java may still be available through another installed JDK.

Open Windows Settings, then System, then Storage to check how much space you reclaimed.

## 10. Continue working on RebyuIT without local Android build tools

For a compatible RebyuIT Dev APK already installed on your phone, start Metro with:

```powershell
cd C:\ai-reviewer-app\mobile
npm.cmd start -- --dev-client
```

Open RebyuIT on your phone and connect through its launcher or Metro's QR code. Keep your PC and phone on the same reachable network. This uses Node.js and Metro; it does not compile another APK. Without platform-tools, `adb` and ADB-based launching are unavailable. Without the emulator and its images, use a physical phone.

For a limited preview in a compatible Expo Go app, run this from the same folder instead:

```powershell
npm.cmd start -- --go
```

- Expo Go supports features available in its runtime. It cannot verify all RebyuIT native configuration or release splash behavior.
- A previously installed development build must stay compatible with the project. Rebuild and reinstall it after native library, Expo SDK, or native configuration changes. Ordinary JavaScript and styling edits do not need another APK.
- EAS can build Android APKs remotely without a local Android SDK or JDK. It requires an Expo account and build configuration; EAS configuration remains planned in this repository. See [Expo's build options](https://docs.expo.dev/develop/development-builds/introduction/).
- Your Express backend can still run locally with Node.js after removing the Android tools.

## Suggested cleanup order

1. Uninstall the RebyuIT development APK from your phone only if you no longer need it.
2. Uninstall Android Studio if unnecessary.
3. Remove unused AVD emulator images.
4. Remove Android SDK if you will use cloud builds or Expo Go only.
5. Clear Gradle caches and generated build output.
6. Uninstall Temurin JDK 17 only if no other tools require Java.
7. Remove stale environment variables.
8. Verify the project still exists and is backed up.

The cleanup commands delete files. Check every path before pressing Enter, and remove tools a few at a time if you prefer.
