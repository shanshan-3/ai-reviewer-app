# Installation

Follow this guide after cloning the project. Open PowerShell in the repository root, the folder containing `mobile/` and `server/`. These instructions cover Windows and an Android phone or emulator.

## 1. Install the prerequisites

- Install [Git for Windows](https://git-scm.com/downloads/win).
- Install [Node.js 24](https://nodejs.org/en/download), which includes npm and matches `server/.node-version`. Current backend tests passed on Node.js `24.22.1`.
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

`@tabler/icons-react-native` and the Expo SDK-compatible `react-native-svg` are included in the mobile dependencies; `npm.cmd ci --prefix mobile` installs both. Use direct named imports from `@tabler/icons-react-native` and pass `size`, `color`, and `strokeWidth` props as needed. Use outline icons and an explicit color from the shared palette.

```jsx
import { IconBook } from '@tabler/icons-react-native';
import { THEME } from '@/lib/theme';

<IconBook size={24} color={THEME.foreground} strokeWidth={2} />
```

`THEME` is the shared color object from `src/lib/theme.js`. No shared icon wrapper is required. The authentication screens use Tabler icons. Rebuild an existing development app after adding the native SVG dependency, following section 4. See the [Tabler React Native guide](https://github.com/tabler/tabler-icons/blob/main/packages/icons-react-native/README.md) and [Expo SDK 57 SVG reference](https://docs.expo.dev/versions/v57.0.0/sdk/svg/).

Geist Sans v1.8.2 is bundled locally in `mobile/assets/fonts/` in Regular, Medium, SemiBold, and Bold weights, alongside its SIL Open Font License. The fonts come from the [official Geist release](https://github.com/vercel/geist-font/tree/v1.8.2/fonts/Geist/ttf). The root layout loads them with `expo-font` before rendering the interface. Use `font-geist`, `font-geist-medium`, `font-geist-semibold`, and `font-geist-bold` for text and inputs. No runtime font download is required.

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

The standard Android emulator reaches the PC at `http://10.0.2.2:3000`. A phone or emulator uses its own `localhost`, so the PC API needs the appropriate address. The mobile material client uses this variable for authenticated uploads and previews; device connectivity and native behavior still need verification. After a verified Render deployment, replace the local address with the service's HTTPS URL as described below.

### Authentication configuration

Login and registration call Supabase Auth. Recovery is connected through Verify Email -> OTP -> Set Password. Brevo is the configured SMTP sender, as reported by the maintainer. The maintainer also reported a successful recovery test on their phone. This is user-reported validation, not an independently observed device test. Protected navigation and the general sign-out UI remain planned.

- Keep email/password registration enabled and disable **Confirm Email** in the hosted project's email Auth provider settings. Registration collects full name, email, and password without an email confirmation step. See [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords).
- Set **Email OTP length** to **6** in Supabase's Email provider settings to match the app's inputs and validation. The template alone does not set the code length.
- Configure the **Reset Password** email template to display `{{ .Token }}` and omit the `{{ .ConfirmationURL }}` link. Supabase creates and verifies the code; Brevo delivers the email. See [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
- Verify Email calls `resetPasswordForEmail` and passes the recovery address to OTP. OTP calls `verifyOtp({ email, token, type: 'recovery' })`; resend has a 60-second initial cooldown and restarts that cooldown after success. Set Password checks the recovery session, calls `updateUser({ password })`, signs out locally, and returns to Login. See [OTP verification](https://supabase.com/docs/reference/javascript/auth-verifyotp) and [password recovery](https://supabase.com/docs/guides/auth/passwords#resetting-a-password).

`src/lib/recovery-session.js` remembers the verified user ID in memory. Set Password requires that ID to match the current Supabase session. The marker clears on completion, cancellation, or app restart; restarting requires code verification again. This controls screen access; Supabase authorizes the password update. Codes, passwords, and session tokens are not passed through route parameters.

Verify Email collects the address used for password recovery. Registration has no email confirmation screen, and code-based recovery needs no authentication callback route. Configure the Auth provider and email template in Supabase; no SQL migration is needed for these settings. Email ownership is not checked at registration, so a mistyped address can prevent delivery of a recovery code.

#### Brevo SMTP setup

For another development Supabase project, configure its sender separately:

1. In Brevo, verify the sender under **Settings -> Senders, Domains, IPs -> Senders**. Authenticate a domain you control for reliable delivery; the current project's domain-authentication status is not recorded here.
2. Open **Settings -> SMTP & API -> SMTP**. Copy the displayed SMTP login and generate an SMTP key.
3. In Supabase, open **Authentication -> Emails -> SMTP Settings**, enable custom SMTP, and enter:

| Field | Value |
|---|---|
| Sender email | The sender address verified in Brevo |
| Sender name | `RebyuIT` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` (STARTTLS) |
| Username | The SMTP login displayed in Brevo; it may differ from your account email |
| Password | A Brevo SMTP key, not an API key or account password |

4. Save, configure the six-digit code and Reset Password template above, then request recovery for an existing Auth account. Check inbox and spam; use **Brevo -> Transactional -> Email logs** and Supabase Auth logs for failures.

Keep SMTP credentials only in the hosted SMTP configuration, never in mobile code, `EXPO_PUBLIC_` variables, Markdown, or Git. See [Brevo SMTP credentials](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP) and [Brevo's Supabase setup](https://developers.brevo.com/docs/supabase-smtp-integration).

Brevo's account sending allowance and Supabase's project/IP/per-user limits apply separately. The app's 60-second cooldown is not a daily per-user quota. Review actual account allowances and [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits) before campus use. Delivery capacity, invalid/expired/reused codes, interrupted updates, and broader Android coverage remain unverified by the reported phone test.

### Apply the profiles and labels migration

The [profiles and labels migration](../supabase/migrations/0001_profiles_and_labels.sql) creates `public.profiles`, `public.subjects`, and `public.topics`. These are personal subject/topic labels, as defined in the [glossary](../GLOSSARY.md); there is no shared curriculum catalog or separate instructor role. Supabase Auth continues to manage credentials in `auth.users`. The migration does not configure Auth providers, email confirmation, SMTP, or the app's authentication client. This file replaces the unapplied `20261026000100_create_profiles.sql`; apply only `0001_profiles_and_labels.sql` to a development database without those existing objects.

1. Open an isolated development project's Supabase **SQL Editor** and start a new query.
2. Paste the complete migration, including `begin;` and `commit;`, and run it once. Existing objects with the same names cause an error rather than being replaced. If a query fails and leaves a transaction open, run `rollback;` before retrying the corrected query.
3. Open **Table Editor** and confirm that all three tables exist with Row Level Security enabled. Existing Auth accounts receive a profile; a missing full name becomes an empty string. `created_at` records when each profile or label is created, including profiles created by the backfill. No subjects or topics are preloaded.

Registration sends the full name as `options.data.full_name` in `supabase.auth.signUp`. The trigger creates the profile automatically; the mobile client must not insert a second profile. Authenticated users can read their own profile and update only `full_name`; they cannot change `id` or `created_at`, or insert/delete profiles directly. Privileged server access still requires API identity and ownership checks. See [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data) and [column privileges](https://supabase.com/docs/guides/database/postgres/column-level-security).

Subjects contain `id`, `owner_id`, `name`, and `created_at`; topics have those fields plus `subject_id`. IDs and timestamps are generated by the database. `owner_id` defaults to the authenticated account, and a composite foreign key requires the topic and its subject to have the same owner, including for privileged server writes. Owners can create/read/rename/delete their labels; clients cannot change IDs, ownership, timestamps, or a topic's subject. Names must be 1–120 characters without leading/trailing whitespace. Duplicate names are rejected case-insensitively within an account for subjects and within an account/subject for topics. Separate accounts can reuse names, and the same topic name can appear under different subjects. Deleting a subject removes its topics; deleting an Auth account removes its profile and labels. Future material/history migrations must define their own references and deletion rules before exposing label deletion alongside study content.

Before applying the migration to a database that already has Auth accounts, record the accounts and their `raw_user_meta_data.full_name` values. After applying it, confirm each has a matching profile. To check the backfill without touching another project, create a development test account before running the migration. Database execution and policy checks have not been performed in this workspace because PostgreSQL tooling is unavailable.

### Apply module metadata and extracted sections

Run [0002_materials_and_sections.sql](../supabase/migrations/0002_materials_and_sections.sql) once in the same project's SQL Editor after `0001`. It can be applied even if `0007_private_storage.sql` has already been applied. Keep existing tables; do not rerun `0001` or `0007`. If this migration fails inside a transaction, run `rollback;` before retrying the corrected query.

The migration adds `materials` and `material_sections` with owner-only authenticated reads. All writes require server-side service-role access, after API authentication and ownership checks. The mobile client cannot write extraction results, readiness, section approval, or deletions directly. Existing profile and label permissions remain intact, but deleting a subject/topic referenced by a material is blocked until the material is removed or relabeled through the server.

Material fields include `owner_id`, `title`, `original_filename`, `mime_type`, `file_bytes`, `storage_path`, optional `subject_id`/`topic_id`, `status`, `warnings`, `error_code`, and `created_at`. Paths use `<owner UUID>/<file ID>/<filename>` within the existing `modules` bucket. Types are PDF/DOCX with matching extensions and 1–5,242,880 bytes. Paths and filenames reject traversal segments and backslashes; metadata checks do not inspect file contents or establish that a Storage object exists.

Status defaults to `processing`; `needs_review`, `ready`, and `failed` are also accepted. Both labels are required for `ready`. Only `failed` carries a non-null uppercase error code. These checks validate record state, not the full transition sequence. The future service must require reviewed usable text before readiness and permit generation only from ready material and approved sections.

Sections contain `material_id`, matching `owner_id`, positive unique `section_order` per material, `text`, `reference`, and `eligible_for_generation` (false by default). References match extraction output: `{ "page": 1 }` for PDF or `{ "paragraph": 1, "kind": "extracted-paragraph" }` for DOCX. Empty text is allowed for blank extracted pages; a section is capped at 200,000 characters. The future extraction service must enforce the 200,000-character total across the whole material and validate reference type against its file type.

Deleting a material cascades to its sections. SQL cascades do not remove Storage objects. A future deletion service must clean up files and derived study content; this migration does not implement uploads, review confirmation, capacity accounting, or deletion endpoints.

Historical full ownership/constraint results are recorded in [validation](validation.md). Automated check scripts were removed at the user's request. These checks can be repeated manually using disposable accounts.

### Apply private module Storage policies

After the profiles/labels migration, run the complete [private Storage migration](../supabase/migrations/0007_private_storage.sql) once in the same project's SQL Editor. The `0007` filename follows the planned structure; it does not depend on migrations numbered 0002–0006. Do not rerun the profiles migration on existing tables.

This creates a private `modules` bucket with a 5 MiB limit and PDF/DOCX MIME types. Authenticated users can operate only on object paths beginning with their own user UUID: `<user-id>/<file-id>/<filename>`. Updates check both the old and new paths. Existing bucket settings that differ cause the transaction to fail rather than silently changing an existing bucket. Review existing `storage.objects` policies as well: permissive policies combine with OR, so unrelated broad policies can weaken these restrictions.

These bucket checks do not validate document contents or implement extraction, material records, capacity accounting, or module deletion. Those remain upload-feature work.

From `server/`, run:

The previous automated ownership and Storage checks are documented in [validation](validation.md). Repeat them manually with two disposable accounts when needed. Never share or commit the server secret key.

The check starts the real Express app on an ephemeral local port. Stop other backend instances first because recovery assumes a single server. Missing migrations/bucket or failed assertions return nonzero. Cleanup failure prints the disposable account ID: remove only its objects before deleting that account. The check does not apply migrations or repair policies automatically.

### Run the material import API

Start Express with `npm.cmd run dev` from `server/`. The authenticated [material API](api.md) accepts a raw PDF/DOCX file body at `POST /api/materials` and returns a persisted `needs_review` record. Use `GET /api/materials/:id` to retrieve its extracted preview with the same user's Bearer token. Supabase's configured secret key must remain server-only because material writes are privileged.

Use Node 24 to run the backend. Runtime extraction is a Node child process with no PowerShell dependency. Historical automated test results are recorded in [validation](validation.md); the test scripts and npm commands have been removed.

Stop the old backend, then apply [0010 material import recovery](../supabase/migrations/0010_material_import_recovery.sql) in Supabase SQL Editor. It adds `cleanup_pending` and flags existing processing/failed rows for reconciliation. Startup removes incomplete sections/private objects before clearing those markers; committed previews are preserved. Do not delete old `.material-local/` records until reconciliation is complete. Startup fails safely if recovery cannot reach Supabase or the migration is missing. Restart with `npm.cmd start` after fixing the cause.

### Try the mobile module upload

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to `http://YOUR_PC_LAN_IP:3000` for a physical Android phone. Keep phone and PC on the same network, verify `/health` in the phone browser, and restart Metro after changing environment values. Use the API port configured in `server/.env` if different.

On Dashboard, choose **Upload material**, then select one PDF/DOCX. The screen validates the cached file's actual size (maximum 5 MiB), displays its name and size, and sends its raw `File` body with the current user's token. Canceling the picker sends nothing. Duplicate submissions are blocked while uploading, and Back navigation prompts the user to wait. A successful upload replaces the import screen with its saved text preview. No automatic upload retry is performed because an interrupted request may already have created a material.

The preview shows warnings, text, page/paragraph references, and loading/error/retry states. It does not approve text, assign labels, enable generation, or populate the dashboard module list. FileSystem, DocumentPicker, and `expo/fetch` are already installed; a development APK missing these native modules needs rebuilding.

The mobile test script has been removed. The import flow still requires Android device verification.

### Render backend hosting (selected; deployment pending)

Render is the selected Express backend host. Start with a Free Web Service for demos/testing. This checkout has not been deployed, and selecting Render does not establish Linux compatibility or campus readiness. Keep Supabase for Auth, PostgreSQL, and private module files; do not provision a second database on Render.

The Node extractor and Supabase cleanup marker now replace the deleted runtime scripts and local recovery journals. Apply migration 0010 before startup. Linux `/proc` memory monitoring is implemented but not exercised on this Windows machine; verify memory/time limits and total API memory on the chosen instance. Keep one backend instance, stop old instances before cutover, and avoid overlapping deployments until shared recovery leases/admission are implemented.

For subject/topic selection and module approval, apply [0011_material_review.sql](../supabase/migrations/0011_material_review.sql) once in Supabase SQL Editor after migrations 0001, 0002, 0007, and 0010. It adds a service-role-only approval function; it does not rewrite existing material or label data. Deploy the updated backend after the migration, then reload the mobile app. The review endpoints are documented in [api.md](api.md#personal-labels-and-review-approval). The maintainer reported applying migration 0011; the agent has not independently verified its hosted execution. The label folder refactor does not require rerunning it.

Create a Render **Web Service** connected to the repository using these settings:

| Setting | Value |
|---|---|
| Language/runtime | Node |
| Root directory | `server` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/health` |
| Instance type | Free for initial demos/testing |

`server/.node-version` selects Node 24. `npm start` uses environment variables supplied by Render; it does not load a local `.env`. For local development, use `npm.cmd run dev` to load `server/.env`. The listener binds `0.0.0.0` and reads `process.env.PORT`; keep Render's supplied port instead of copying local `PORT=3000`. Startup completes database recovery before listening. See [Express deployment](https://render.com/docs/deploy-node-express-app) and [Render port binding](https://render.com/docs/web-services#port-binding).

In the service's **Environment** settings, add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` from the intended project's configuration. Add `GROQ_API_KEY` and the approved `GROQ_MODEL` when generation is implemented; the current upload API does not use Groq. Never commit actual values or copy server secrets into mobile variables. See [Render environment variables](https://render.com/docs/configure-environment-variables).

After deployment succeeds, verify `https://YOUR_SERVICE.onrender.com/health` returns HTTP 200 and `{"status":"ok"}`. Then repeat authenticated profile, two-account ownership, PDF/DOCX import/preview, rejection, cleanup, and restart checks on the deployed service. Health alone does not verify Supabase access, extraction, or recovery. Record actual results before claiming deployment acceptance.

Set `EXPO_PUBLIC_API_URL=https://YOUR_SERVICE.onrender.com` in `mobile/.env` and restart Metro; a distributed APK needs rebuilding with the hosted address. This is the Express API URL, not the Supabase URL. Test from a physical Android phone without relying on the PC's LAN address.

Render Free services sleep after 15 minutes without inbound traffic and take about one minute to wake. Cold start plus extraction can exceed the mobile client's 90-second request timeout; test this and avoid automatic duplicate upload retries. Local files disappear on restart, redeploy, and sleep, and Free services cannot attach persistent disks. Render advises against using Free instances for production. No paid upgrade is authorized; campus hosting suitability remains pending. See [Free-tier limits](https://render.com/docs/free).

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

Open the installed development app and connect to Metro, or press `a` for the emulator. For a phone connecting over LAN, keep the PC and phone on the same reachable network. Installing the package or starting Metro alone does not install the app. The app currently opens Login; protected navigation remains planned.

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

The [folder guide](../folder-structure.md) explains where files belong. The [roadmap](../planning/ai-powered-reviewer-roadmap.md) covers the planned features. Login, registration, and recovery call Supabase; protected navigation, general sign-out UI, document imports, quizzes, flashcards, progress, and in-app reports remain planned.

This guide reflects the maintainer's local checkout. Fresh-clone installation and broader live-service/device checks remain unverified; the recovery phone test above was reported by the maintainer.
