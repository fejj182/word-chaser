import { deleteApp, getApps } from 'firebase-admin/app'

export const getEmulatorUnavailableMessage = (error: unknown): string => {
  const host = process.env.RTD_EMULATOR_HOST || '127.0.0.1'
  const port = process.env.RTD_EMULATOR_PORT || '9000'
  const cause = error instanceof Error ? error.message : String(error)

  return [
    `Firebase RTDB emulator is required for npm run test:integration, but ${host}:${port} is unavailable.`,
    'Start it with: npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database --project demo-word-chaser',
    `Original error: ${cause}`,
  ].join('\n')
}

export const cleanupFirebaseAdminApps = async (): Promise<void> => {
  await Promise.all(getApps().map(app => deleteApp(app)))
}
