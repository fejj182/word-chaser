# Word Chaser

This is a documented exploration of AI-assisted software engineering, using the development of a real-time multiplayer word game - Word Chaser - as a vehicle.

My goal wasn't just to build an app, but to understand how AI changes the way experienced engineers design, build and ship software.

The project was mostly built between August and October 2025, during 13 weeks of parental leave, and provided me with the opportunity to experiment with an AI-first development workflow using the models and tools available at the time.

Rather than using AI only to generate code, I integrated it throughout the entire development lifecycle—from product discovery, design and architecture to implementation, debugging, testing and documentation.

![active game](docs/gameplay/active-game.gif)

![multiplayer flow](docs/gameplay/multiplayer-flow.gif)

## Why I Built This

My goal wasn't simply to recreate Boggle — or Yahoo Games' classic *Word Racer*, which was one of my favourite internet games as a child.

Instead, I wanted a project that was technically challenging, but still realistic to build by myself in a relatively short period of time.

Throughout the project, I set out to answer questions such as:

* How much can an experienced solo developer by accelerated?
* Where does this improvement appear most?
* Where do the limits of the technology lie?
* Where is my human judgment still fundamental?


## Features

- **Guest Authentication**: Instant guest sign-in with Firebase Auth
- **Room Management**: Create or join rooms with shareable codes
- **Real-time Lobby**: Live readiness tracking and host controls
- **Multiplayer Ready**: Minimum 2 players required to start games
- **Host Transfer**: Automatic host transfer when current host leaves
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Auth, Realtime Database, Firestore)
- **Testing**: Jest, React Testing Library
- **Storybook**: Component development and documentation
- **Development**: ESLint, Husky hooks, Gitleaks secret scanning

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Firebase project with Realtime Database enabled
- Gitleaks installed locally for the pre-commit secret scan

Install Gitleaks on macOS with Homebrew:

```bash
brew install gitleaks
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd word-chaser
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Fill in your Firebase configuration values in `.env.local`:

**For Production Development:**
- Use your actual Firebase project values (for testing against production)
- Ensure `NEXT_PUBLIC_USE_EMULATORS` is not set or set to `false`

**For Local Development (Recommended):**
- Add these lines to use emulators by default:
```bash
NEXT_PUBLIC_USE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
```

**Environment File Priority:**
- `.env.local` - Used by `npm run dev` (manual development)
- `.env.e2e.local` - Used by E2E tests (automated testing)
- Both should be configured for their respective environments
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`

4. Start the development server:
```bash
npm run dev
```

### Firebase Admin SDK Setup

For production deployments, the application uses Firebase Admin SDK for server-side operations. See [ADR 011](../docs/adrs/adr-011-firebase-admin-sdk-for-serverless-operations.md) for detailed setup instructions.

**Quick Setup:**
- **Development**: No additional setup needed (uses emulators)
- **Production**: Set `GOOGLE_APPLICATION_CREDENTIALS` to your service account JSON file path

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:integration` - Run only integration tests (files matching `.integration.test.(ts|tsx|js)`)
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook for production

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── features/           # Feature-based modules
│   ├── guest-auth/     # Authentication components and logic
│   ├── room-management/ # Room creation, joining, and lobby

├── lib/                # Shared utilities and Firebase config
└── types/              # TypeScript type definitions
```

### Testing

The project uses Jest with React Testing Library for comprehensive testing:

- Unit tests for components and utilities
- Integration tests for Firebase operations
- Storybook for component development and visual testing

#### Running Firebase RTDB Emulator Integration Tests

These backend‑level tests run against the Firebase Realtime Database emulator and are skipped by default when no emulator is detected.

1) Start the RTDB emulator (using npx):

```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --project demo-word-chaser
```

Optionally customize via environment variables (defaults shown):

```bash
export RTD_EMULATOR_HOST=127.0.0.1
export RTD_EMULATOR_PORT=9000
export RTD_EMULATOR_PROJECT=demo-word-chaser
```

2) Run tests as usual:

```bash
npm test
```

Run only the integration tests:

```bash
npm run test:integration
```

Notes:
- The suite lives at `src/lib/firebase/__tests__/rtdb.integration.test.ts`.
- When the emulator is running, the suite validates: minimal rules allow/deny, join caps, all‑ready → playing, host transfer/room delete, slug uniqueness/mapping, and a subscription sanity check.
- When the emulator is not running, the suite exits early and does not fail CI/local runs.

Silencing emulator warnings:
- A minimal `src/lib/firebase/config/emulator.json` and `database.rules.json` are included to avoid config/rules warnings.
- To silence the auth warning without interactive login, add a Firebase CI token to your environment:
  1. Generate once: `npx firebase login:ci`
  2. Add to your local `.env.local` as `FIREBASE_TOKEN=...`
  3. The pre-push one-shot emulator run will use the token automatically.

#### Running Playwright E2E Tests

The project includes automated end-to-end tests using Playwright that test the full multiplayer flows:

**Prerequisites:**
- Firebase emulator must be running for E2E tests
- Development server should be running

**Setup:**
1) Start the Firebase emulator:
```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
```

2) In another terminal, start the development server:
```bash
npm run dev
```

**Running E2E Tests (requires emulator to be running):**

Run all E2E tests:
```bash
npm run e2e
```

Run E2E tests with browser visible (headed mode):
```bash
npm run e2e:headed
```

Run E2E tests with Playwright UI for debugging:
```bash
npm run e2e:ui
```

**Available E2E Test Files:**
- `tests/e2e/room-management.spec.ts` - Room management flows (creation, joining, ready up, host transfer, game start)

**E2E Test Features:**
- Tests run against the Firebase emulator for consistent state
- Each test resets the database before running
- Uses isolated browser contexts to simulate multiple players
- Validates real-time multiplayer interactions

**Debugging E2E Tests:**
- Use `npm run e2e:headed` to see the browser during test execution
- Use `npm run e2e:ui` for interactive debugging with Playwright's UI
- Check test reports in `/playwright-report/` after test runs
- Review test traces in `/test-results/` for detailed execution logs

### Environment Configuration Guide

The project supports switching between Firebase production and emulator environments. This guide explains how to configure each environment properly.

#### Environment Files

- **`.env.local`** - Used by `npm run dev` (manual development)
- **`.env.e2e.local`** - Used by E2E tests (automated testing)
- **`src/lib/firebase/config/emulator.json`** - Firebase CLI configuration (emulator settings)

#### Local Firebase Emulators (Default)

In local development, the app connects to Firebase emulators by default. This prevents accidental writes to production while running the dev server or E2E tests.

**Important Setup for Local Development:**

1. **Update your `.env.local`** to use emulators:
```bash
# Add these lines to your .env.local file
NEXT_PUBLIC_USE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser
NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
```

2. **Start the emulator** before running the dev server:
```bash
npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser
```

3. **Start the dev server** (will now use emulators):
```bash
npm run dev
```

**Default Behavior:**
- In non-production environments, the app auto-connects to emulators
- Override:
  - Force ON: set `NEXT_PUBLIC_USE_EMULATORS=true`
  - Force OFF: set `NEXT_PUBLIC_USE_EMULATORS=false`

**Emulator Endpoints:**
- Realtime Database: `127.0.0.1:9000`
- Auth: `127.0.0.1:9099`

**Customization:**
```bash
export RTD_EMULATOR_HOST=127.0.0.1
export RTD_EMULATOR_PORT=9000
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

#### Switching Between Environments

**To use Production Firebase:**
1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_USE_EMULATORS=false
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=word-chaser
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://word-chaser-default-rtdb.europe-west1.firebasedatabase.app/
   ```
2. Clear browser data (localStorage, cookies, cache)
3. Restart dev server

**To use Emulators:**
1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_USE_EMULATORS=true
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser
   ```
2. Start emulator: `npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser`
3. Restart dev server

**Important Notes:**
- `src/lib/firebase/config/emulator.json` project must match `NEXT_PUBLIC_FIREBASE_PROJECT_ID` when using emulators
- E2E tests always use emulators (configured in `.env.e2e.local`)
- Clear browser data when switching environments to avoid auth token conflicts

#### Querying Emulator Data (Manual Testing)

Using the REST API (quickest):

```bash
# Dump entire DB
curl -s "http://127.0.0.1:9000/.json?ns=demo-word-chaser" | jq .

# Inspect rooms
curl -s "http://127.0.0.1:9000/rooms.json?ns=demo-word-chaser" | jq .

# Inspect slugs mapping
curl -s "http://127.0.0.1:9000/slugs.json?ns=demo-word-chaser" | jq .

# Clear all data (use with care)
curl -X PUT -H 'Content-Type: application/json' \
  -d 'null' "http://127.0.0.1:9000/.json?ns=demo-word-chaser"
```

Using the Firebase CLI against the emulator:

```bash
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
npx firebase database:get / --project demo-word-chaser | jq .
```

#### Emulator Usage in E2E Tests

- Playwright starts the Next.js dev server with `NEXT_PUBLIC_USE_EMULATORS=true` to ensure the app talks to emulators.
- The pre-push hook runs E2E tests (requires emulator to be running):

```bash
npm run -s e2e
```

- Each E2E test resets the RTDB emulator at the start of the test:

```ts
// tests/e2e/lobby.multiplayer.spec.ts
await host.request.put('http://127.0.0.1:9000/.json?ns=demo-word-chaser', { data: null });
```

This ensures no test data leaks between tests. For an extra safety net during manual sessions, you can clear the emulator data anytime using the REST or CLI examples above.

#### Troubleshooting: Environment Switching Issues

**Problem: Data Not Appearing in Emulator**

If you're not seeing data in the emulator during manual testing:

1. **Check which environment is being used:**
   ```bash
   # Check if dev server is using emulators
   curl -s http://localhost:3000 | grep -o "demo-word-chaser\|word-chaser"
   ```

2. **Verify emulator is running:**
   ```bash
   curl -s "http://127.0.0.1:9000/.json?ns=demo-word-chaser" | jq .
   ```

3. **Common issues:**
   - **Production data**: If you see `word-chaser` (your real project), your `.env.local` is still pointing to production
   - **Empty emulator**: Make sure the emulator is started with `--project demo-word-chaser`
   - **Wrong namespace**: Ensure `NEXT_PUBLIC_FIREBASE_DATABASE_URL` includes `?ns=demo-word-chaser`

4. **Force emulator usage:**
   ```bash
   # Stop dev server, then restart with explicit emulator settings
   NEXT_PUBLIC_USE_EMULATORS=true \
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-word-chaser \
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=http://127.0.0.1:9000?ns=demo-word-chaser \
   npm run dev
   ```

**Problem: INVALID_ID_TOKEN Error**

When switching from emulators to production:

1. **Clear browser data** (localStorage, cookies, cache)
2. **Use incognito/private mode** for testing production
3. **Ensure correct environment variables**:
   ```bash
   # For production
   NEXT_PUBLIC_USE_EMULATORS=false
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=word-chaser
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://word-chaser-default-rtdb.europe-west1.firebasedatabase.app/
   ```

**Problem: WebSocket Connection Failed**

When switching to production but still connecting to emulator:

1. **Check database URL** in environment variables
2. **Ensure project ID matches** between environment and src/lib/firebase/config/emulator.json
3. **Clear browser cache** and reload

### Code Quality

- ESLint for code linting
- Husky pre-commit hook for Gitleaks staged secret scanning
- Husky pre-push hooks for automated testing:
  - Unit tests run on every push
  - Integration tests run when Firebase code changes
  - E2E tests run when UI components or E2E tests change (requires emulator to be running)
- TypeScript for type safety
- Feature-based directory structure

## Architecture

### State Management

- **Room State**: Managed with React Context + Reducer pattern
- **User State**: Firebase Auth for authentication
- **Real-time Data**: Firebase Realtime Database for live game state
- **Session Management**: Separate context for session-specific data

### Firebase Integration

- **Authentication**: Guest sign-in with Firebase Auth
- **Realtime Database**: Live room state, player readiness, game status
- **Firestore**: Reserved for future profiles and leaderboards
- **Cloud Functions**: Planned for AI-assisted content

## Roadmap

- [ ] Gameplay rounds and word board
- [ ] Word submissions and scoring system
- [ ] Game timers and round management
- [ ] AI-assisted content via Cloud Functions
- [ ] User profiles and leaderboards
- [ ] Invite links and social sharing
- [ ] Mobile app optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is private and proprietary.
