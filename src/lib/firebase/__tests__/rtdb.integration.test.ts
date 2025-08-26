/*
  Lean Firebase RTDB emulator integration tests.
  - Runs ONLY when RTDB emulator is available (or RTD_EMULATOR=1 is set and emulator reachable).
  - Keeps default `npm test` green without emulator.
*/

import type { Database } from 'firebase/database'

// Utility: detect emulator availability
async function isEmulatorRunning(projectId: string, host = '127.0.0.1', port = 9000) {
  try {
    const url = `http://${host}:${port}/.json?ns=${encodeURIComponent(projectId)}`
    const res = await fetch(url, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

// Utility: load RTDB rules into emulator (kept minimal to validate allow/deny semantics)
async function loadRules(projectId: string, rules: unknown, host = '127.0.0.1', port = 9000) {
  const url = `http://${host}:${port}/.settings/rules.json?ns=${encodeURIComponent(projectId)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rules),
  })
  if (!res.ok) {
    throw new Error(`Failed to load RTDB rules: ${res.status}`)
  }
}

describe('RTDB emulator integration (lean)', () => {
  const emulatorHost = process.env.RTD_EMULATOR_HOST || '127.0.0.1'
  const emulatorPort = Number(process.env.RTD_EMULATOR_PORT || 9000)
  const projectId = process.env.RTD_EMULATOR_PROJECT || 'demo-word-chaser'

  let emulatorReady = false
  let db: Database | undefined
  let utils: typeof import('@/lib/firebase/room-utils') | undefined

  const rules = {
    rules: {
      // Allow reads to rooms and slugs
      'rooms': { '.read': true },
      'slugs': { '.read': true },
      // Writes are allowed only under these collections
      'rooms/$roomId': { '.write': true },
      'slugs/$slug': { '.write': true },
      // Everything else denied
      '.read': false,
      '.write': false,
    },
  }

  beforeAll(async () => {
    if (!(await isEmulatorRunning(projectId, emulatorHost, emulatorPort))) {
      emulatorReady = false
      return
    }

    // Point the app at the emulator
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = projectId
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = `${emulatorHost}:${emulatorPort}`
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = `http://${emulatorHost}:${emulatorPort}?ns=${projectId}`

    // Unmock firebase modules that jest.setup mocked for unit tests
    jest.resetModules()
    jest.unmock('@/lib/firebase/firebase')
    jest.unmock('firebase/auth')
    jest.unmock('firebase/storage')

    // Load rules into emulator
    await loadRules(projectId, rules, emulatorHost, emulatorPort)

    // Import after unmocking (use requireActual to bypass any manual mocks)
    const firebase = jest.requireActual('@/lib/firebase/firebase') as typeof import('@/lib/firebase/firebase')
    db = firebase.db as Database

    // Ensure the SDK uses the emulator
    const { connectDatabaseEmulator } = jest.requireActual('firebase/database') as typeof import('firebase/database')
    connectDatabaseEmulator(db, emulatorHost, emulatorPort)

    // Import utils using the real db
    utils = jest.requireActual('@/lib/firebase/room-utils') as typeof import('@/lib/firebase/room-utils')
    emulatorReady = true
  })

  afterEach(async () => {
    if (!emulatorReady || !db) return
    const { ref, set } = await import('firebase/database')
    // Clean all data for isolation between tests
    await set(ref(db), null)
  })

  test('rules: deny writes outside allowed paths', async () => {
    if (!emulatorReady || !db) return
    const { ref, set } = await import('firebase/database')
    await expect(set(ref(db, 'forbidden/path'), { a: 1 })).rejects.toThrow()
  })

  test('joins are capped at maxPlayers', async () => {
    if (!emulatorReady || !db || !utils) return
    const { createRoom, joinRoom } = utils
    const roomId = await createRoom({
      maxPlayers: 2,
      settings: { roundDuration: 60, maxRounds: 5 },
    }, 'host-1', 'Host')

    await joinRoom(roomId, 'user-2', 'U2')
    await expect(joinRoom(roomId, 'user-3', 'U3')).rejects.toThrow('Room is full')
  })

  test('all-ready -> playing', async () => {
    if (!emulatorReady || !db || !utils) return
    const { createRoom, updatePlayerReady, startGame } = utils
    const roomId = await createRoom({
      maxPlayers: 3,
      settings: { roundDuration: 60, maxRounds: 5 },
    }, 'host-1', 'Host')

    await updatePlayerReady(roomId, 'host-1', true)
    // Add players and set ready
    const { joinRoom } = utils
    await joinRoom(roomId, 'user-2', 'U2')
    await joinRoom(roomId, 'user-3', 'U3')
    await updatePlayerReady(roomId, 'user-2', true)
    await updatePlayerReady(roomId, 'user-3', true)

    await startGame(roomId)

    const { ref, get } = await import('firebase/database')
    const snap = await get(ref(db, `rooms/${roomId}/status`))
    expect(snap.val()).toBe('playing')
  })

  test('host transfer on leave, room delete when last leaves', async () => {
    if (!emulatorReady || !db || !utils) return
    const { createRoom, joinRoom, leaveRoom } = utils
    const roomId = await createRoom({
      maxPlayers: 3,
      settings: { roundDuration: 60, maxRounds: 5 },
    }, 'host-1', 'Host')
    await joinRoom(roomId, 'user-2', 'U2')

    await leaveRoom(roomId, 'host-1')

    const { ref, get } = await import('firebase/database')
    const playersSnap = await get(ref(db, `rooms/${roomId}/players`))
    const players = playersSnap.val() as Array<{ id: string; isHost?: boolean }>
    expect(players.length).toBe(1)
    expect(players[0].id).toBe('user-2')
    expect(players[0].isHost).toBe(true)

    await leaveRoom(roomId, 'user-2')
    const roomSnap = await get(ref(db, `rooms/${roomId}`))
    expect(roomSnap.exists()).toBe(false)
  })

  test('slug mapping uniqueness and storage', async () => {
    if (!emulatorReady || !db || !utils) return
    const { createRoom } = utils
    const roomId1 = await createRoom({
      maxPlayers: 4,
      settings: { roundDuration: 60, maxRounds: 5 },
    }, 'host-1', 'Host')
    const roomId2 = await createRoom({
      maxPlayers: 4,
      settings: { roundDuration: 60, maxRounds: 5 },
    }, 'host-2', 'Host2')

    const { ref, get } = await import('firebase/database')
    const room1Snap = await get(ref(db, `rooms/${roomId1}`))
    const room2Snap = await get(ref(db, `rooms/${roomId2}`))
    const slug1 = (room1Snap.val() as any).slug
    const slug2 = (room2Snap.val() as any).slug
    expect(slug1).toBeTruthy()
    expect(slug2).toBeTruthy()
    expect(slug1).not.toBe(slug2)

    const slugMap1 = await get(ref(db, `slugs/${slug1}`))
    const slugMap2 = await get(ref(db, `slugs/${slug2}`))
    expect(slugMap1.val()).toBe(roomId1)
    expect(slugMap2.val()).toBe(roomId2)
  })

  test('subscribeToRoom emits updates (sanity)', async () => {
    if (!emulatorReady || !db || !utils) return
    const { createRoom, subscribeToRoom, updatePlayerReady } = utils
    const roomId = await createRoom({
      maxPlayers: 2,
      settings: { roundDuration: 60, maxRounds: 5 },
    }, 'host-1', 'Host')

    const events: any[] = []
    const unsubscribe = subscribeToRoom(roomId, (room) => {
      events.push(room)
    })

    await updatePlayerReady(roomId, 'host-1', false)

    // Wait briefly for subscription cycle
    await new Promise((r) => setTimeout(r, 50))
    unsubscribe()

    expect(events.length).toBeGreaterThan(0)
    expect(events[events.length - 1]?.id).toBe(roomId)
  })
})


