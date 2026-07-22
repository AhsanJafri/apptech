# AdsGuard — ads.txt & app-ads.txt Monitor

A React Native mobile app that monitors `ads.txt` and `app-ads.txt` files for publishers and app developers. Protect ad revenue by getting alerted when files break, disappear, or become invalid.

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) + TypeScript |
| State | Redux Toolkit |
| Offline DB | Realm |
| Backend | Firebase (Auth + Firestore only — **free Spark plan**) |
| Scheduler | NestJS cron service (runs on your machine, VPS, or Docker) |
| Alerts | Email + Telegram (configurable) |

## MVP Features

- [x] User signup / login (Firebase Auth)
- [x] Add domain or app package
- [x] Manual ads.txt check from the app
- [x] Scheduled checks every 6 hours (NestJS scheduler)
- [x] Email / Telegram alerts on failure
- [x] Dashboard with status history
- [x] Offline mode via Realm (cached domains & checks)

## Project Structure

```
AppTech Ads/
├── mobile/                  # React Native Expo app
├── scheduler/               # NestJS cron service (replaces Cloud Functions)
│   └── src/
│       ├── monitor/         # Cron job + HTTP endpoints
│       ├── ads-txt/         # Fetch & parse ads.txt
│       ├── notifications/   # Email & Telegram alerts
│       └── firebase/        # Firebase Admin (Firestore access)
├── firestore.rules
├── firebase.json            # Firestore only — no Cloud Functions needed
└── docker-compose.yml       # Optional: run scheduler in Docker
```

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Expo CLI
- iOS Simulator or Android Emulator (Realm requires a dev build, not Expo Go)

### 1. Firebase Setup (Firestore only — no Blaze plan needed)

```bash
firebase login
firebase init   # Select **Firestore only** (skip Functions)
```

Enable **Email/Password** auth in [Firebase Console](https://console.firebase.google.com) → Authentication → Sign-in method.

Deploy rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 2. Firebase Service Account (for NestJS scheduler)

1. Firebase Console → Project Settings → Service accounts
2. Click **Generate new private key**
3. Save as `scheduler/service-account.json` (already gitignored)

### 3. NestJS Scheduler

```bash
cd scheduler
cp .env.example .env
# Set FIREBASE_PROJECT_ID and path to service-account.json

npm install
npm run start:dev
```

Test it:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/check-now   # run all checks immediately
```

**Docker (optional):**

```bash
# Place service-account.json in scheduler/ first
docker compose up --build
```

Run in production on any $5/month VPS (Railway, Render, DigitalOcean, your MacMini, etc.).

### 4. Mobile App

```bash
cd mobile
cp .env.example .env
# Fill in Firebase config from Console → Project Settings → Your apps

npm install
npx expo prebuild
npx expo run:ios     # or: npx expo run:android
```

## Pricing Plans (built into user model)

| Plan | Price | Domains |
|------|-------|---------|
| Starter | $3.99/mo | 1 |
| Pro | $9.99/mo | 5 |
| Business | $24.99/mo | 20 |

## How ads.txt Checking Works

1. **Scheduled** — NestJS cron runs every 6 hours (configurable via `CRON_SCHEDULE`)
2. **Manual (app)** — User taps "Run Check Now" in the mobile app
3. **Manual (server)** — `POST /check-now` on the scheduler
4. Fetches `https://{domain}/ads.txt`, parses sellers, detects issues
5. Saves results to Firestore (mobile reads via Firebase SDK)
6. Sends alert if status changes to error/warning

## Environment Variables

### Mobile (`mobile/.env`)

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

### Scheduler (`scheduler/.env`)

```
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
CRON_SCHEDULE=0 */6 * * *
TELEGRAM_BOT_TOKEN=          # optional
RUN_ON_STARTUP=false         # set true to test immediately
PORT=3000
```

## Why NestJS instead of Cloud Functions?

| | Cloud Functions | NestJS Scheduler |
|--|----------------|------------------|
| Firebase plan | Requires **Blaze** (pay-as-you-go) | **Spark (free)** for Firestore + Auth |
| Cost | Per invocation + egress | Free on your machine, ~$5/mo on a VPS |
| Control | Limited | Full — logs, cron, manual triggers |
| Setup | `firebase deploy` | `npm run start:dev` |

## Next Steps (post-MVP)

- [ ] Stripe / RevenueCat subscription integration
- [ ] Push notifications (FCM)
- [ ] app-ads.txt separate check for mobile apps
- [ ] Change detection (diff between checks)
- [ ] Protect `/check-now` with an API key in production

## License

Private — All rights reserved.
