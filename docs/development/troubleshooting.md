# Troubleshooting

## Data Is Not Appearing in the Emulator

Check whether the app is using the emulator project or a production project:

```bash
curl -s http://localhost:3000 | grep -o "demo-word-chaser\|word-chaser"
```

Verify the Realtime Database emulator is running:

```bash
curl -s "http://127.0.0.1:9000/.json?ns=demo-word-chaser" | jq .
```

Common causes:

- `.env.local` is still pointing to production.
- The emulator was started with the wrong project.
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is missing `?ns=demo-word-chaser`.
- The dev server was not restarted after changing environment variables.

Force emulator settings for a one-off dev server run:

```bash
NEXT_PUBLIC_USE_EMULATORS=true \
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser \
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser \
npm run dev
```

## INVALID_ID_TOKEN After Switching Environments

This usually means the browser still has auth state from the previous Firebase environment.

Fix it by:

1. Clearing browser data for `localhost`.
2. Restarting the dev server.
3. Using a private browser window if you need to switch often.

## Production Still Connects to Emulators

Check `.env.local`:

```bash
NEXT_PUBLIC_USE_EMULATORS=false
```

Then restart the dev server and clear browser cache. Also verify `NEXT_PUBLIC_FIREBASE_DATABASE_URL` points to the production database URL.

## Emulator Auth Warning

The Firebase CLI may warn when it cannot authenticate non-interactively. For local development, this is usually harmless.

To silence the warning, generate a CI token:

```bash
npx firebase login:ci
```

Then add it to `.env.local`:

```bash
FIREBASE_TOKEN=...
```

Do not commit real tokens.

## Pre-push E2E or Integration Tests Fail Immediately

The pre-push hook conditionally runs emulator-backed tests when Firebase, UI, or E2E files changed. Start the emulators before pushing:

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
```

Then retry the push.
