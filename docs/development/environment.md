# Environment Configuration

Word Chaser can run against local Firebase emulators or a real Firebase project. Local development should normally use emulators to avoid writing test data to production.

Related ADR: [ADR 008: Environment Configuration Strategy](../adrs/adr-008-environment-configuration-strategy.md).

## Environment Files

- `.env.local` - Used by local development and loaded by the pre-push hook
- `.env.e2e.local` - Optional E2E environment file template target; the current Playwright config does not load it directly
- `env.example` - Template for `.env.local`
- `env.e2e.example` - Template for `.env.e2e.local`
- `src/lib/firebase/config/emulator.json` - Firebase emulator config

## Local Emulator Configuration

Use these values in `.env.local`:

```bash
NEXT_PUBLIC_USE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
```

Start the emulators:

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
```

Default emulator endpoints:

- Realtime Database: `127.0.0.1:9000`
- Auth: `127.0.0.1:9099`

Optional overrides:

```bash
RTD_EMULATOR_HOST=127.0.0.1
RTD_EMULATOR_PORT=9000
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

## Production Firebase Configuration

Use your real Firebase project values in `.env.local` and disable emulator usage:

```bash
NEXT_PUBLIC_USE_EMULATORS=false
NEXT_PUBLIC_FIREBASE_PROJECT_ID=word-chaser
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://word-chaser-default-rtdb.europe-west1.firebasedatabase.app/
```

The public Firebase variables are:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`

## Switching Environments

When switching between emulators and production Firebase:

1. Update `.env.local`.
2. Clear browser data for `localhost`, including localStorage, cookies, and cache.
3. Restart the dev server.

The app defaults to emulator usage in non-production environments unless `NEXT_PUBLIC_USE_EMULATORS=false` is set.

## E2E Environment

Playwright forces emulator settings in `playwright.config.ts` and starts app servers on ports `3000` and `3001`.

`env.e2e.example` documents the intended E2E emulator variables:

```bash
cp env.e2e.example .env.e2e.local
```

The Firebase emulators still need to be running before `npm run e2e`. If you want Playwright to read `.env.e2e.local`, add an explicit env loader first.

## Firebase Admin SDK

Server-side Firebase operations use the Admin SDK through `src/lib/firebase/admin.ts`.

For local emulator development, no service account is needed. If `GOOGLE_APPLICATION_CREDENTIALS` is not set, the Admin SDK initializes with:

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, defaulting to `demo-word-chaser`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, defaulting to `http://127.0.0.1:9000?ns=demo-word-chaser`

For production server-side operations, set:

```bash
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

The app expects the raw service account JSON string in that environment variable. Also set `NEXT_PUBLIC_FIREBASE_DATABASE_URL` to the production database URL.

See [ADR 011: Firebase Admin SDK for Serverless Operations](../adrs/adr-011-firebase-admin-sdk-for-serverless-operations.md) for the design decision.
