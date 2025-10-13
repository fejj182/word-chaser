## Word Chaser — Core AI Rules

Follow these guidelines to keep architecture, style, and tests consistent with the existing codebase.

## General Principles

- Follow feature-oriented structure: `src/features/**` and shared libs in `src/lib/**`.
- Prefer small, well-named functions over comments; keep code self-documenting.
- Use strict TypeScript. Export explicit types for contexts and public APIs.
- Use `@` alias for imports from `src/`.
- Accessibility-first: semantic elements, proper labels/roles.
- Use local Firebase emulators in development.

## File Structure

- Features: `src/features/<feature>/components|contexts|hooks|types|__tests__/*`
- Shared: `src/lib/firebase/*` for Firebase utilities
- API routes: `src/app/api/<route>/route.ts`
- Naming: Components `PascalCase.tsx`, hooks `useXxx.ts`, utilities `kebab-case.ts`
- Tests: `*.test.ts` for unit tests, `*.integration.test.ts` for emulator tests

## Styling

- Use Tailwind CSS v4. No CSS Modules or styled-components.
- Use shared utilities from `src/app/globals.css`: `.page`, `.card`, `.btn`, etc.

## Testing

- Unit: Jest + React Testing Library. Mock Firebase SDK.
- Integration: `*.integration.test.ts` with Firebase emulator.
- API Integration: Test actual endpoints with emulator. Set `NEXT_PUBLIC_USE_EMULATORS=true`.
- E2E: Playwright with accessibility-centric selectors.

## React Best Practices

- Use `useEffect` for side effects (DOM manipulation, subscriptions, timers)
- Avoid `setTimeout` for DOM updates; use state + `useEffect` instead
- Prefer declarative state-driven patterns over imperative DOM manipulation
- Use `useCallback` and `useMemo` for performance optimization
- Keep components focused: separate business logic into custom hooks
- Use proper dependency arrays in `useEffect` and `useCallback`

## Code Quality

- Functions max 80 lines, max 5 parameters
- Explicit return types
- Max complexity 15
- Descriptive names (min 2 characters)

**Comments should be rare.** Make code self-documenting through better naming and smaller functions.


