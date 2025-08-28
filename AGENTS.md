## Word Chaser — Core AI Rules

These are the official project-wide guidelines for AI-generated code. Follow them to keep architecture, style, and tests consistent with the existing codebase.

References: [Cursor Rules — Project Instructions](https://docs.cursor.com/en/context/rules)

## 1) General Principles

- Follow the existing feature-oriented structure under `src/features/**` and shared libs in `src/lib/**`.
- Prefer small, well-named functions over comments; keep code simple and self-documenting.
- Use strict TypeScript. Export explicit types for contexts and public APIs.
- Use the `@` alias for imports from `src/` (configured in `tsconfig.json`).
- Ensure changes compile and pass Jest and Playwright tests; keep ESLint clean.
- Accessibility-first: semantic elements, proper labels/roles; reflect this in tests.
- Favor local Firebase emulators in development; never hardcode prod config.

## 2) File Naming & Structure

- Organize by feature:
  - `src/features/<feature>/components/*` — React components (container or UI).
  - `src/features/<feature>/contexts/*` — React Context providers and hooks.
  - `src/features/<feature>/hooks/*` — feature-specific hooks.
  - `src/features/<feature>/types/*` — TypeScript models for the feature.
  - `src/features/<feature>/stories/*` — Storybook stories for UI components only.
  - `src/features/<feature>/**/__tests__/*` — colocated unit/component tests next to the code under test.
- Shared libraries and runtime:
  - `src/lib/firebase/*` — Firebase initialization (`firebase.ts`) and utilities (`room-utils.ts`, `firebase-utils.ts`).
  - Next.js App Router: pages and API routes live under `src/app/**` (e.g., `src/app/api/<route>/route.ts`).
    - API route tests: `src/app/api/<route>/__tests__/route.test.ts`.
- Naming conventions:
  - Components: `PascalCase.tsx` (e.g., `RoomLobby.tsx`, `CreateRoomUI.tsx`).
  - Hooks: `camelCase.ts` starting with `use` (e.g., `useAuth.ts`).
  - Contexts: `PascalCase.tsx` as `XxxContext.tsx`, exporting `Provider` and `useXxx`.
  - Utilities: `kebab-case.ts` (e.g., `room-utils.ts`).
  - Types: concise file per domain (e.g., `room.ts`, `session.ts`).
  - Tests: `*.test.ts(x)` for unit/component. Use `*.integration.test.ts` only when Jest talks to emulators. Playwright specs in `tests/e2e/*.spec.ts`.

## 3) Component/Module Design

- Client components using hooks must start with `'use client'`.
- Import order: framework → feature/contexts/hooks via `@/...` → relative → types.
- Structure:
  1. Props interface (explicit types).
  2. Local state/refs/derived values.
  3. Effects (`useEffect`) after state.
  4. Event handlers (short, named functions).
  5. Early guard returns.
  6. Final JSX return using Tailwind utilities and shared classes from `globals.css`.
- Keep components focused; extract shared logic to hooks or contexts.
- Prefer accessible patterns (proper roles, labels, `aria-*` states like `aria-busy`).

## 4) State Management

- Global, multiplayer lifecycle state is modeled with React Contexts (see `UserContext`, `RoomContext`, `SessionContext`).
- Use local `useState` for purely component-local UI concerns.
- Introduce/extend contexts when state is shared across routes/components or synchronized with Firebase.
- Context rules:
  - Export `Context`, `Provider`, and a `useXxx` hook that throws if used out of provider.
  - Define explicit context value types and action signatures (promises for async ops).
  - Use adapter/facade patterns to map session ↔ room concepts where appropriate (e.g., `RoomContext`).

## 5) Styling

- Use Tailwind CSS v4 via `@tailwindcss/postcss`. Do not introduce CSS Modules or styled-components.
- Prefer utility classes. For repeated patterns, use shared utilities defined in `src/app/globals.css`:
  - Examples: `.page`, `.card`, `.btn`, `.form-*`, `.text-*`, `.layout-*`, `.badge`, `.progress-bar`.
- Respect dark mode and responsive behavior using Tailwind utilities and existing CSS variables.

## 6) API & Data Fetching

- Firebase is the primary backend:
  - Initialize via `src/lib/firebase/firebase.ts`. Do not re-initialize.
  - Use RTDB helpers in `src/lib/firebase/room-utils.ts` for room flows: `createRoom`, `joinRoom`, `leaveRoom`, `resolveRoomId`, `subscribeToRoom`, `updatePlayerReady`, `startGame`.
  - Do not call RTDB directly from components; go through contexts and lib utilities.
- Auth:
  - Anonymous guest auth handled via `useAuth` and `ensureAnonymousWithAlias` in `firebase-utils.ts`.
  - Update `displayName` when alias changes.
- Next.js API routes:
  - Keep routes thin; validate input and delegate to `lib` (e.g., `leave-room/route.ts`).
  - Prefer idempotent behavior for unload/cleanup endpoints.
- Emulators:
  - Local dev defaults to emulators unless `NEXT_PUBLIC_USE_EMULATORS==='false'`. Keep this behavior.

## 7) Testing

- Unit/Component: Jest 30 + React Testing Library.
  - Config: `jest.config.js` with `jest.setup.js`. JSDOM env; Firebase SDK modules mocked.
  - Use `@` alias in imports. Do not hit emulators in regular unit tests.
  - Prefer a11y-first queries (`getByRole`, `getByLabelText`, `getByText`); use `getByTestId` only when needed. Avoid asserting CSS classes.
  - Colocate tests in `__tests__` directories next to components and modules. For API routes, use `src/app/api/<route>/__tests__/route.test.ts`.
  - Integration tests that talk to emulators must use `*.integration.test.ts` and run with `npm run test:integration`.
- E2E: Playwright.
  - Config: `playwright.config.ts` starts Next dev server with emulator env and resets RTDB between tests.
  - Use accessibility-centric selectors; keep flows deterministic.
- Storybook: only author stories for UI components (not containers/contexts). Do not create separate stories for mobile or dark mode.

## 8) Dependencies

- Keep the dependency surface minimal. Prefer built-ins and the existing Firebase SDK.
- When adding a dependency:
  - Justify the addition and prefer lightweight, well-maintained, type-safe packages.
  - Ensure compatibility with Next.js App Router and Tailwind v4.
  - Add types and scripts as needed; avoid global CLIs. For Firebase CLI, use `npx firebase`.

## 9) Commit Messages

- Use Conventional Commits when possible:
  - `feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `docs: ...`, `chore: ...`, `build: ...`, `ci: ...`.
  - Include a scope when useful, e.g., `feat(room-management): add ready toggle`.

## 10) Performance & Reliability

- Avoid unnecessary re-renders: memoize derived values where needed; keep context values stable.
- Always unsubscribe/cleanup Firebase listeners (`onValue`) to prevent leaks.
- Prefer early returns and explicit guards to reduce branching complexity.
- Handle emulator connection failures gracefully with non-fatal logging.

## 11) Accessibility & UX

- Buttons/controls must have accessible names; toggles should expose `aria-pressed`.
- Use `aria-busy` or disabled states for background work. Avoid obtrusive loading UI; keep the interface responsive and simple.
- Display user-facing errors using existing `.form-error` styles.

## 12) Project Conventions & Tooling

- Imports use `@/*`. Do not use deep relative paths out of feature boundaries.
- Client code using hooks begins with `'use client'`.
- Keep tests colocated with features and components.
- Respect ESLint config (`eslint.config.mjs`) and Next.js defaults.


