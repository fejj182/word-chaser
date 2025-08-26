# Word Chaser

A real-time, multiplayer word party game built with Next.js, TypeScript, and Firebase. Players authenticate as guests, create or join code-based rooms, and compete in live word challenges.

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
- **Development**: ESLint, Husky pre-commit hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Firebase project with Realtime Database enabled

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
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook for production

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── features/           # Feature-based modules
│   ├── guest-auth/     # Authentication components and logic
│   ├── room-management/ # Room creation, joining, and lobby
│   └── session-management/ # Session state management
├── lib/                # Shared utilities and Firebase config
└── types/              # TypeScript type definitions
```

### Testing

The project uses Jest with React Testing Library for comprehensive testing:

- Unit tests for components and utilities
- Integration tests for Firebase operations
- Storybook for component development and visual testing

### Code Quality

- ESLint for code linting
- Husky pre-commit hooks for automated checks
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
