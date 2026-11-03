# Handoff: Expiry Everything

This file is for the developer who will turn this prototype into iOS and Android store apps. Do not treat the prototype as already store-ready. It is a mobile-first website with a small Node API. The phone apps have to be a wrapper around a hosted copy of that server. A static export inside the binary will not work.

## What the app does

Expiry Everything is one shared board for dates a household forgets that are not groceries: passports, driver's licenses, car registration, insurance, warranties, medications, makeup, IDs and visas, and home items such as smoke-alarm batteries.

There is no account. The board id in the URL is the only key. A second id is view-only: same dates, no edits. Anyone with a link sees the same board.

Adding a date is one line. `passport Mia jun 2027` is parsed into item, person, and date, shown as a preview, and saved only after confirm. If the line has no date, a short form is the fallback. Items sort by days left and are marked overdue, within 30 days, within 90 days, or later. Each item has a category icon, optional notes, and Renewed, which asks for the new date and keeps the previous one. "Add all to my calendar" downloads an `.ics` file. Each date is an all-day event with display alarms 90, 30, and 7 days before. One item can be downloaded the same way.

The demo board (`/b/demo`, view-only `/b/demo-view`) is public on purpose and is labeled as sample dates for a made-up household. Boards created from the home page get 16-byte base64url ids.

This is not a food tracker, not a medical device, and not advice. It is a date list.

## Tech stack

- Next.js 15.5.28 (App Router, Turbopack in dev and `next build`)
- React 19.1.0, TypeScript 5
- Tailwind CSS 4
- shadcn/ui on Base UI (`@base-ui/react`), Lucide icons, Figtree and Fraunces from `next/font/google`
- Storage: one JSON file, `data/boards.json`, with an in-process promise queue around read-modify-write. There is no database and no auth library.
- Tests: `tsx` plus `node:test` in `lib/*.test.ts`
- Developed on Node 22. Use Node 22.

`next.config.ts` is empty. There is no `output: "export"`. Do not add a static export. Route handlers use `fs`.

## Screens

| Screen | Route | What it does |
|---|---|---|
| Home | `/` | Product explanation, example parse of `passport Mia jun 2027`, link to the demo, form to name a household and create a board. |
| Board | `/b/[id]` | Items grouped overdue / within 30 days / within 90 days / later, person filter, category icons. `[id]` may be the edit id or the view id. Edit shows "Add an item". View-only does not. Fixed bar: calendar and share. `?added=<itemId>` scrolls to a new item and marks it "Just added". |
| Quick add | `/b/[id]/add` | One text field, live preview, confirm. "Use a form instead" collects name, person, date, category, notes. View-only ids are refused. |
| Item | `/b/[id]/i/[itemId]` | Date, days left, urgency, notes, renewal history. Edit: save notes, Renewed (new date), remove. Both access levels can download that one date as `.ics`. |
| Calendar | `/b/[id]/calendar` | Explains the file, downloads `expiry-everything.ics` for every item. |
| Share | `/b/[id]/share` | Family link (`/b/<editId>`) and view-only link (`/b/<viewId>`). The view-only response never includes the edit id. Demo copy says those two links are public on purpose. |
| Missing board | same routes, API 404 | "No board at this link." |
| Not found | anything else | `app/not-found.tsx` |
| Error | render error | `app/error.tsx` retry |

Categories, in form order: passport, license, registration, insurance, warranty, medication, makeup, id (shown as "ID or visa"), home, other.

Urgency, from `lib/dates.ts`: days `< 0` overdue, `0–30` within 30 days, `31–90` within 90 days, `91+` later. A month-only date is stored as the 1st and the UI says so.

## HTTP API

All handlers set `Cache-Control: no-store`. Ids must match `^[A-Za-z0-9_-]{1,80}$`.

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/api/boards` | Body `{ "name": "Our household" }`. Empty name becomes "Our household". Returns the board with `editId` and `viewId`. |
| `GET` | `/api/boards/[id]` | Edit id returns `access: "edit"` and both ids. View id returns `access: "view"` and `editId: null`. |
| `POST` | `/api/boards/[id]/items` | Edit only. Body: `name`, `person`, `category`, `expiresOn` (`YYYY-MM-DD`), `datePrecision` (`day` or `month`), `notes`. 201 with the item. Cap is 200 items. |
| `PATCH` | `/api/boards/[id]/items/[itemId]` | Edit only. `{ "expiresOn" }` renews, records the old date, forces precision `day`. `{ "notes" }` replaces notes. Same date is rejected. |
| `DELETE` | `/api/boards/[id]/items/[itemId]` | Edit only. |
| `GET` | `/api/boards/[id]/calendar` | Edit or view. Optional `?item=<itemId>`. `text/calendar` attachment `expiry-everything.ics`. |

View-only writes return 403. Unknown boards return 404. There is no list-all-boards route and no delete-board route.

## Install, run, test, build

```bash
npm install
npm test          # parser and .ics unit tests
npm run lint
npm run dev       # http://127.0.0.1:4317
npm run build
npm start         # production, same port 4317
```

Demo: `http://127.0.0.1:4317/b/demo`. First API read creates `data/boards.json` and seeds the demo if `seedVersion` is not `1` (`DEMO_SEED` in `lib/store.ts`). Delete `data/boards.json` to reset. That file is gitignored. Do not commit it.

`npm run build` needs network on first run because `next/font/google` downloads Figtree and Fraunces.

There is no CI config in the repo.

## Env vars and secrets

Names only. This prototype has no secret values, no `.env` file, and no third-party API keys.

| Name | Required now | What it is |
|---|---|---|
| `BOARDS_PATH` | No | Absolute path of the JSON file. Default is `data/boards.json` under the process working directory. Set it to a persistent disk path in production. It is a path, not a credential. |

The store pipeline will create these later. They are not read by the app today. Do not put their values in the repo, the zip, or this file.

| Name | Used for |
|---|---|
| `APPLE_TEAM_ID` | App Store Connect / signing |
| `APPLE_DISTRIBUTION_CERT_P12` | iOS distribution certificate file, stored outside the repo |
| `APPLE_DISTRIBUTION_CERT_PASSWORD` | Password for that certificate |
| `APPLE_PROVISIONING_PROFILE` | App Store provisioning profile |
| `ANDROID_KEYSTORE_PATH` | Upload keystore file, stored outside the repo |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `APP_PUBLIC_ORIGIN` | HTTPS origin the wrapper loads and that share links must copy. Not implemented as an env var yet. Share links use `window.location.origin`. |

No `.env`, `.pem`, keystore, or p12 is in the source.

## Stubbed or missing

- Photo capture and date OCR. The research brief called this a stretch. There is no camera UI.
- Push notifications and local notifications. Reminders are only the `.ics` alarms.
- Accounts, email, password reset, and "forgot my link". Losing the family link means losing edit access. The view-only link cannot recover it, by design.
- Delete-board and export-my-data endpoints. Items can be removed one at a time. A privacy contact has to delete a whole board on the server until that API exists.
- Multi-instance safety. The write lock lives in one Node process. Two instances will corrupt `boards.json`.
- Hosting, custom domain, TLS, backups.
- App icons beyond `app/favicon.ico`. No splash, no manifest, no service worker, no home-screen install prompt.
- Store listing copy, screenshots, privacy policy page, age rating, signing assets.
- Offline use. The board always fetches the API.
- Native calendar write. The app only downloads `.ics`.
- The demo ids `demo` and `demo-view` are guessable. Leave them labeled, or disable seeding before a public launch if you do not want a public sample.

## Backend and hosting, before any store binary

Do this first. The wrapper is useless without it.

1. Run the Next.js server as one long-lived Node process (`npm run build` then `npm start`, or a process manager). Do not put it on a serverless platform with an ephemeral disk or more than one instance.
2. Mount a persistent volume and set `BOARDS_PATH` to a file on that volume. Back it up. `data/boards.json` is the entire database.
3. Serve it on HTTPS. Share links, the family link, and the view-only link are built from the browser origin, so the origin must be the public `https://` host users will keep.
4. Confirm in production: create a board, add `passport Mia jun 2027`, open the view-only link in a second browser, confirm it cannot add, download the `.ics`, and confirm three `VALARM` blocks (`-P90D`, `-P30D`, `-P7D`).
5. Publish a privacy policy at a stable URL on that host, for example `https://HOST/privacy`. The app does not have this page yet. You will add it. It must be reachable without a board link.

Suggested policy facts, matching this code: no account; the link is the secret; the server stores board name, item name, person name, category, expiry date, notes, and renewal history; categories can include medications and identity documents; data is not sold; this build has no analytics SDK and no ad SDK; calendar files are generated on request and downloaded to the user's device; to delete, remove items in the app or email the operator because there is no delete-board API yet. Include a contact email.

6. Decide whether the public demo stays. If it stays, the listing and the in-app banner must keep calling it sample data.

## Ship as iOS and Android apps

Recommended shape: Capacitor shell that loads the hosted origin. Do not bundle the Next app as static files inside the binary (`output: "export"` will break the API).

Apple review guideline 4.2 (minimum functionality) often rejects a site wrapped in a WebView with no native behavior. Budget for one native capability before submission. The smallest one that matches this product: a Capacitor plugin that offers "Add all to my calendar" as a write into the device calendar (EventKit on iOS, Calendar Provider on Android), in addition to the existing `.ics` download. Keep the `.ics` path working for people who prefer a file.

There is no bundle id in the repo. Claim these only if the publisher's store accounts do not already use them:

- iOS bundle id: `app.expiryeverything.household`
- Android applicationId: `app.expiryeverything.household`
- URL scheme: `expiryeverything`
- Display name: `Expiry Everything`
- Splash and status-bar background: `#f4efe6` (the web `themeColor`)

### 1. Icons and splash

Source of truth should be one 1024×1024 PNG, no transparency, no rounded corners (the stores mask them). The only image in the repo today is `app/favicon.ico`. Design a new icon. Do not ship the favicon scaled up.

Needed:

- iOS: 1024×1024 App Store icon. Xcode asset catalog for the rest. Capacitor's `cordova-res` or `@capacitor/assets` can generate the set from the 1024 and a splash source.
- Android: adaptive icon, foreground and background, plus a 512×512 Play listing icon. Play requires a 1024×500 feature graphic as well.
- Splash: the wordmark "Expiry Everything" on `#f4efe6`. No spinner that depends on a network call.

### 2. Capacitor wrapper

From a clean checkout, after the site is live at `https://HOST`:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Expiry Everything" app.expiryeverything.household --web-dir out
```

`--web-dir out` is only a local placeholder so Capacitor has a directory. Do not put the real app there. In `capacitor.config.ts` set:

```ts
server: {
  url: "https://HOST",
  cleartext: false,
  androidScheme: "https",
}
```

Allow navigation only to that host. Then:

```bash
npx cap add ios
npx cap add android
npx cap sync
```

iOS: set the bundle id, display name, launch screen color `#f4efe6`, and `ITSAppUsesNonExemptEncryption` to `false` in Info.plist (the app adds no encryption beyond HTTPS). Require a calendar usage string only if you add the native calendar write: explain that the app writes expiry dates and 90/30/7-day alarms the user asked for.

Android: `applicationId` as above, target the current Play API level, `android:usesCleartextTraffic="false"`, network security config pinned to `HOST`. File downloads of `.ics` must succeed inside the WebView (set a download listener). The prototype triggers a download with an `<a download>` element.

Versioning: start at version `1.0.0`, iOS `CFBundleVersion` `1`, Android `versionCode` `1`.

### 3. Privacy and store listing

Both stores require the privacy policy URL from the hosting step.

App Store Connect:

- Name: Expiry Everything
- Subtitle: Shared dates for a household
- Category: Productivity
- Age rating: 4+ if the questionnaire stays clear of unrestricted web and medical diagnosis. Answer that it is a user-entered date list, not a medical device.
- Privacy nutrition labels: data is stored on the operator's server and is not linked to an Apple ID. Types to declare: name (the person field), user content (item name, notes). Identifiers: none collected by the app. Do not declare tracking. There is no ATT prompt because there is no tracking.
- Screenshots: 6.7-inch and 6.1-inch iPhone, real UI, demo data only. Capture home, board, quick-add preview, item with Renewed, calendar, share.
- Support URL and marketing URL on the same host.
- Reviewer notes: no login. Give them `https://HOST/b/demo` and say the demo is sample data. Tell them a new board is created from the home page and the link is the credential. Do not send a real person's passport dates.

Google Play Console:

- App name, short description, full description. Same positioning: household dates, no account, not food, not medical advice.
- Category: Productivity.
- Content rating questionnaire (IARC).
- Data safety: data is collected and stored on the server (names, user content), not shared with third parties, not used for ads, user can request deletion by email until a delete-board control ships. State that clearly. Do not claim "data is only stored on device". It is not.
- Phone screenshots, 512 icon, 1024×500 feature graphic.
- Target audience: not directed at children. The demo names are fictional adults and a child named Leo appears only as a household member on sample dates. If you keep a child persona in the demo, say the app is a household organizer and is not a child-directed service.
- Closed testing track first, then production.

### 4. Build and upload

iOS, on a Mac with Xcode:

```bash
npx cap open ios
```

Archive with an App Store distribution certificate and the provisioning profile. Upload with Xcode or Transporter. The certificate and profile stay outside this repo.

Android:

```bash
npx cap open android
```

Build an AAB signed with the upload key. Enroll in Play App Signing. Store the keystore outside the repo.

```bash
cd android && ./gradlew bundleRelease
```

Smoke-test on a physical iPhone and Android phone: create a board, parse `passport Mia jun 2027`, confirm it sorts onto the board, open Renewed and save a new date, download the calendar file and import it, copy the view-only link into the other platform and confirm it cannot edit.

### 5. What not to do

- Do not ship `demo` / `demo-view` as the only board, and do not put real document numbers in the demo. The data model has no document-number field. Do not add one for the store launch.
- Do not commit `data/boards.json`, `.env`, keystores, or p12 files.
- Do not point the store binary at `http://127.0.0.1`.
- Do not turn on Capacitor live reload in the release build.

## Source map

- `app/page.tsx`, `app/b/[id]/**` — screens
- `app/api/boards/**` — API
- `lib/parse.ts` — one-line parser. Tests in `lib/parse.test.ts`. Do not "fix" month-only dates to today; the 1st is intentional and disclosed.
- `lib/ics.ts` — calendar file. Tests in `lib/ics.test.ts`.
- `lib/store.ts` — JSON storage and demo seed
- `lib/dates.ts` — urgency bands
- `components/` — UI
- `app/favicon.ico` — only current icon asset
