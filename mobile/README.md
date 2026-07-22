# AdsGuard Mobile

AdsGuard is an Expo/React Native app for monitoring the health of `ads.txt` and `app-ads.txt` files. Users can add websites or Google Play apps, run checks, review file issues and history, and track seller lines that are expected to appear in their selected ads files.

The app uses Firebase Authentication and Cloud Firestore for account data and synchronization, Realm for a local read cache, Redux Toolkit for application state, and Expo Notifications for device push-token registration.

## Current functionality

### Accounts and sessions

- Create an account with email, password, and an optional display name.
- Sign in and sign out with Firebase Authentication.
- Keep the authenticated session across app restarts with AsyncStorage-backed Firebase persistence.
- Restore a basic authenticated profile when Firebase Auth is available but Firestore is temporarily unreachable.
- Enforce the account's `domainLimit` when adding monitored properties.

New accounts currently start on the `free` plan with a one-domain limit, email alerts enabled, and Telegram alerts disabled.

### Dashboard

- View every monitored website and app in one list.
- See totals for healthy, warning, and failing properties.
- See each property's type, identifier, selected files, last check time, alert state, and current status.
- Pull to refresh data from Firestore.
- Load locally cached domains before the remote refresh completes.
- Open a property to view its latest result and check history.
- Show onboarding guidance, a rotating ads.txt quote, and an external educational YouTube link when no properties exist.

### Website monitoring

When adding a website, the user supplies a display name and domain such as `example.com`. The app normalizes the domain and allows either or both of these root-level HTTPS files to be selected:

- `https://example.com/ads.txt`
- `https://example.com/app-ads.txt`

The domain must be a hostname; paths and arbitrary URLs are not supported as monitoring targets.

### Google Play app monitoring

When adding an app, the user supplies a Google Play package ID such as `com.example.app`. AdsGuard:

1. Downloads the public Google Play listing.
2. Extracts the developer website URL.
3. Resolves its hostname.
4. Checks `https://<developer-host>/app-ads.txt`.

Only Google Play apps are supported by the current add-app flow. The Play listing must be public and include a valid developer website. Apple App Store lookup is not implemented.

### ads.txt and app-ads.txt checks

Checks are downloaded directly by the app and run in parallel for the files selected on a property. A manual check:

- Uses HTTPS and a 15-second timeout per file.
- Detects missing files, HTTP failures, network failures, empty files, and malformed entries.
- Parses seller domain, publisher ID, `DIRECT`/`RESELLER` relationship, and optional certification authority ID.
- Ignores blank lines, comments, byte-order marks, and inline comments.
- Detects duplicate seller entries.
- Parses variable declarations such as `OWNERDOMAIN` and `MANAGERDOMAIN`.
- Warns when `OWNERDOMAIN` is absent from `app-ads.txt`.
- Counts valid seller entries and hashes file content.
- Compares parsed sellers with the user's tracked seller lines.
- Saves the result to Firestore and the Realm cache.
- Updates the property's latest status and the latest status of tracked lines.

#### Status meanings

| Status | Meaning |
| --- | --- |
| Healthy | Every selected file was fetched and parsed without detected issues, and all relevant tracked lines matched. |
| Warning | A file was fetched, but it contains formatting or duplicate-entry issues, lacks `OWNERDOMAIN` where required, or has a missing/mismatched tracked line. |
| Error | A selected file could not be fetched, was missing, was empty, or the app could not resolve a required host. |
| Unknown | The property or seller line has not been checked yet, or no valid files were selected. |

The overall property status is the worst status across all selected files.

### Property details and history

- View the property identifier, type, current status, selected files, and resolved Google Play developer host.
- Run an immediate check from the device.
- Enable or disable failure notifications for an individual property.
- Review the latest result separately for `ads.txt` and `app-ads.txt`.
- See file availability, seller count, owner domains, manager domains, and a preview of detected issues.
- Open detailed issue information when the latest file has more than two issues.
- Inspect check metadata including file URL, content hash, parsed variables, issue type, and source line number.
- Review up to 50 recent checks per property.
- Remove a property and its local cached history.

Removing a property deletes its Firestore domain document. Cleanup of nested Firestore check documents must be handled by backend administration or a server-side deletion workflow because deleting a Firestore parent document does not automatically delete its subcollections.

### Tracked seller lines

The **My Lines** tab tracks seller entries that should exist in a property's selected files.

- Choose a property using a searchable domain picker.
- Add an exact line such as `bidscube.com, 123, RESELLER`.
- Add a partial match using only a seller domain or a seller domain plus publisher ID.
- Run a property check automatically after adding a line.
- See total, found, and problematic-line counts.
- See whether each line is found, missing, mismatched, or not checked.
- Pull to refresh all properties with tracked lines and re-run their checks sequentially.
- Long-press a tracked line to stop tracking it.

Exact matching compares seller domain, publisher ID, and relationship. Partial matching compares the seller domain and, when supplied, the publisher ID. A relationship mismatch is reported when the domain and publisher ID exist but `DIRECT`/`RESELLER` differs.

Tracked lines currently apply to all files selected for their property. Although the data model supports targeting a specific file type, the current add-line screen does not expose that option.

### Notifications and alerts

- On sign-in, the app requests notification permission on a physical device and stores the Expo push token on the user's Firestore profile.
- Android creates a high-importance `adsguard-alerts` notification channel.
- Foreground notifications can display alerts, play sound, and update the badge.
- Each property has a failure-notification toggle stored in Firestore.

The mobile app registers tokens and preferences; it does not contain the scheduled checker or push/email/Telegram delivery service. A separate trusted backend must inspect enabled properties and send alerts. The Settings screen states that server checks run every two hours, but that scheduler is outside this directory.

### Offline behavior

Realm caches domains and trimmed check history so previously loaded monitoring data can appear before Firestore responds. Authentication can also restore a fallback profile while Firestore is unavailable.

Offline support is read-oriented. Adding or removing data, running a check, refreshing from Firestore, changing notification preferences, and synchronizing results still require network access.

### Settings

- Display account email, current plan, and domain limit.
- Display the current email and Telegram alert states.
- Display informational Starter, Pro, and Business pricing.
- Sign out.
- Display the app version.

Alert configuration, purchases, subscription upgrades, password reset, profile editing, and account deletion are not implemented in the current mobile UI. The displayed pricing is informational only.

## Data retention limits

To keep Firestore documents and the Realm cache small:

- Remote history queries return the latest 50 checks per property.
- At most 50 issues are stored per check/file payload.
- At most 20 parsed variables are stored per file.
- Full parsed seller arrays and raw file content are not persisted.
- File-level seller counts, issues, hashes, variables, owner/manager domains, and tracked-line results are persisted.

## Technology stack

- Expo SDK 57 and React Native 0.86
- React 19 and TypeScript in strict mode
- React Navigation native stack and bottom tabs
- Redux Toolkit and React Redux
- Firebase Authentication and Cloud Firestore
- Realm local database
- Expo Notifications and Expo Device
- Expo development client

## Project structure

```text
mobile/
├── App.tsx                         # Providers, auth routing, push registration
├── app.json                        # Expo application and native plugin config
├── src/
│   ├── app/                        # Redux store and typed hooks
│   ├── components/                 # Shared cards, badges, loading, snackbar
│   ├── features/                   # Auth, domains, checks, seller-line state
│   ├── navigation/                 # Auth, tab, and detail navigation
│   ├── screens/                    # User-facing screens
│   ├── services/
│   │   ├── adsTxt/                 # Fetching, parsing, and seller matching
│   │   ├── firebase/               # Auth and Firestore persistence
│   │   ├── notifications/          # Expo push-token registration
│   │   ├── playStore/              # Google Play developer-host resolution
│   │   └── realm/                  # Local domain and check cache
│   ├── theme/                      # Color tokens
│   ├── types/                      # Shared TypeScript models
│   └── utils/                      # Validation, payload limits, messages
└── assets/                         # App, adaptive, splash, and web icons
```

## Prerequisites

- Node.js and npm
- Xcode/CocoaPods for iOS development or Android Studio/SDK for Android development
- A Firebase project with:
  - Email/password Authentication enabled
  - A Cloud Firestore database
  - Security rules that restrict each user to their own profile, domains, checks, and seller lines
- A physical device and an Expo development/native build for push notification testing

Realm and notification functionality use native modules, so a native development build is the intended runtime. Expo Go is not sufficient for the complete feature set.

## Environment configuration

Copy the example file:

```bash
cp .env.example .env
```

Fill in the Firebase web-app configuration values:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Values prefixed with `EXPO_PUBLIC_` are bundled into the client and must not be treated as secrets. Protect user data with Firebase Authentication and Firestore security rules.

## Install and run

Install dependencies:

```bash
npm install
```

Create and run a native development build:

```bash
npm run ios
# or
npm run android
```

Start Metro for an already installed development build:

```bash
npm start
```

The project path currently contains spaces. The `postinstall` script runs `scripts/fix-spaced-path.sh` to patch known Expo/iOS build-script quoting problems after dependency installation.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server. |
| `npm run ios` | Generate/build and run the iOS native app. |
| `npm run android` | Generate/build and run the Android native app. |
| `npm run web` | Start Expo's web target; native Realm/notification behavior is not equivalent on web. |
| `npm run fix:paths` | Re-run the local path-with-spaces compatibility patch. |

## Firestore layout

The current client reads and writes this structure:

```text
users/{userId}
├── profile fields and expoPushTokens[]
├── domains/{domainId}
│   └── checks/{checkId}
└── sellerLines/{sellerLineId}
```

All client access should be scoped to the authenticated user's `userId`. Server-side scheduled checks and notification delivery should use trusted credentials and respect each domain's `notificationsEnabled` value.

## Current product boundaries

- Monitoring supports websites and Google Play apps; Apple App Store resolution is not available.
- Only root-level HTTPS `ads.txt` and `app-ads.txt` URLs are checked.
- Scheduled checks and outbound alert delivery require a separate backend.
- Email and Telegram preferences are displayed but cannot be edited in the app.
- Push tokens are registered, but the app itself does not send push notifications.
- Plans and prices are displayed, but billing and upgrades are not implemented.
- Properties and seller lines can be added or removed, not edited.
- Seller-line removal happens immediately on long press without a confirmation dialog.
- The current check-history cards are summaries; detailed navigation is exposed from the latest result's “Show more” action.
- There are no test, lint, or dedicated type-check scripts in `package.json` yet.
