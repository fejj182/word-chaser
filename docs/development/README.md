# Development Guide

This guide covers the setup and commands needed for day-to-day development. For deeper Firebase and debugging notes, see:

- [Environment configuration](environment.md)
- [Debugging local and E2E tests](debugging.md)
- [Troubleshooting Firebase emulators and auth](troubleshooting.md)

## Quick Start

```bash
npm install
cp env.example .env.local
```

For local development, set these values in `.env.local`:

```bash
NEXT_PUBLIC_USE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
```

Start Firebase emulators:

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
```

In another terminal, start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase Auth, Realtime Database, Firestore, Firebase Admin SDK
- **Testing**: Jest, React Testing Library, Playwright
- **Tooling**: ESLint, Husky, Gitleaks, Storybook

## Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Gitleaks installed locally for the pre-commit secret scan

Install Gitleaks on macOS with Homebrew:

```bash
brew install gitleaks
```

Firebase CLI commands are run through `npx firebase`, so no global Firebase install is required.

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd word-chaser
```

2. Install dependencies:

```bash
npm install
```

3. Copy the local environment file:

```bash
cp env.example .env.local
```

4. Configure Firebase values in `.env.local`.

For emulator development, the important values are:

```bash
NEXT_PUBLIC_USE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
```

For production Firebase, fill in the public Firebase values from your Firebase project and set:

```bash
NEXT_PUBLIC_USE_EMULATORS=false
```

See [environment configuration](environment.md) for all environment files, switching notes, and production Admin SDK setup.

## Available Scripts

- `npm run dev` - Start the Next.js development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:coverage` - Run Jest with coverage
- `npm run test:integration` - Run `*.integration.test.*` files
- `npm run e2e` - Run Playwright E2E tests
- `npm run e2e:headed` - Run Playwright with the browser visible
- `npm run e2e:ui` - Run Playwright UI mode
- `npm run storybook` - Start Storybook on port 6006
- `npm run build-storybook` - Build Storybook
- `npm run gitleaks:scan` - Scan the repository for secrets
- `npm run gitleaks:staged` - Scan staged changes for secrets

Husky runs `npm run gitleaks:staged` before commits. Before pushes, it runs `npm test`, then conditionally runs Firebase integration tests or E2E tests when related files changed. Those conditional checks require the Firebase emulators to be running.

## Testing

Run the default Jest suite:

```bash
npm test
```

Run Firebase RTDB integration tests:

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database --project demo-word-chaser
npm run test:integration
```

The RTDB integration suite lives at `src/lib/firebase/__tests__/rtdb.integration.test.ts`. If the emulator is not running, the suite exits early instead of failing.

Run Playwright E2E tests:

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
npm run e2e
```

Playwright starts the app servers defined in `playwright.config.ts`. The E2E tests live in `tests/e2e/`.

See [debugging local and E2E tests](debugging.md) for headed runs, UI mode, reports, traces, and emulator data inspection.

## Project Structure

```text
src/
├── app/                 # Next.js App Router pages and API routes
├── features/            # Feature-oriented modules
├── lib/                 # Shared utilities, Firebase, dictionary, workers
└── types/               # Shared TypeScript declarations

tests/e2e/               # Playwright tests and fixtures
docs/adrs/               # Architecture Decision Records
```

Feature code should stay under `src/features/<feature>/`. Shared Firebase utilities belong under `src/lib/firebase/`.
