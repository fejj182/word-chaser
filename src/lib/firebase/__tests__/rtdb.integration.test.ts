/**
 * @jest-environment node
 */

/*
  Firebase RTDB security rules integration tests using @firebase/rules-unit-testing.
  - Tests actual security rules to ensure database security.
  - Uses proper Firebase rules testing library for accurate rule validation.
  - Fails fast if emulator is not available (no silent failures).
*/

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { ref, set, get } from 'firebase/database'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load the actual security rules as a string
const rulesPath = join(__dirname, '../config/database.rules.json')
const rules = readFileSync(rulesPath, 'utf8')

describe('RTDB security rules integration tests', () => {
  let testEnv: RulesTestEnvironment
  const originalConsoleWarn = console.warn

  beforeAll(async () => {
    // Suppress Firebase permission_denied warnings (expected in security rule tests)
    console.warn = jest.fn((message, ...args) => {
      if (args.some(arg => String(arg).includes('permission_denied'))) {
        return
      }
      originalConsoleWarn(message, ...args)
    })

    // Initialize test environment with actual security rules
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-word-chaser',
      firestore: undefined, // We're only testing RTDB
      database: {
        rules,
        host: process.env.RTD_EMULATOR_HOST || '127.0.0.1',
        port: Number(process.env.RTD_EMULATOR_PORT || 9000),
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
    console.warn = originalConsoleWarn // Restore original console.warn
  })

  afterEach(async () => {
    await testEnv.clearDatabase()
  })

  describe('Authentication Requirements', () => {
    test('unauthenticated users cannot read rooms', async () => {
      const db = testEnv.unauthenticatedContext().database()
      
      await expect(get(ref(db, 'rooms/test-room'))).rejects.toThrow()
    })

    test('unauthenticated users cannot read slugs', async () => {
      const db = testEnv.unauthenticatedContext().database()
      
      await expect(get(ref(db, 'slugs/test-slug'))).rejects.toThrow()
    })

    test('unauthenticated users cannot write to existing rooms', async () => {
      // Setup: Create a room first using authenticated context
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-existing',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-existing'), roomData)
      
      // Test: Unauthenticated user cannot write to existing room
      const db = testEnv.unauthenticatedContext().database()
      await expect(set(ref(db, 'rooms/test-room-existing/status'), 'playing')).rejects.toThrow()
    })

    test('unauthenticated users cannot write to slugs', async () => {
      const db = testEnv.unauthenticatedContext().database()
      
      await expect(set(ref(db, 'slugs/test-slug'), 'room-id')).rejects.toThrow()
    })

    test('deny writes outside allowed paths', async () => {
      const db = testEnv.unauthenticatedContext().database()
      
      await expect(set(ref(db, 'forbidden/path'), { a: 1 })).rejects.toThrow()
    })
  })

  describe('Room Write Permissions', () => {
    test('authenticated users can create new rooms', async () => {
      const db = testEnv.authenticatedContext('user-1').database()
      
      const roomData = {
        id: 'test-room-123',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      
      await expect(set(ref(db, 'rooms/test-room-123'), roomData)).resolves.not.toThrow()
    })

    test('users can only write to rooms they are players in', async () => {
      // Setup: Create a room as user-1
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-123',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-123'), roomData)
      
      // Test: user-2 cannot write to room they're not in
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await expect(set(ref(user2Db, 'rooms/test-room-123/status'), 'playing')).rejects.toThrow()
    })

    test('users can write to rooms after joining', async () => {
      // Setup: Create a room as user-1
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-123',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-123'), roomData)
      
      // user-2 joins the room
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await set(ref(user2Db, 'rooms/test-room-123/players/user-2'), {
        displayName: 'User 2',
        isHost: false,
        isReady: false
      })
      
      // Now user-2 should be able to update their ready status
      await expect(set(ref(user2Db, 'rooms/test-room-123/players/user-2/isReady'), true)).resolves.not.toThrow()
    })

    // this works as player 2 is removing themselves instead of updating all players
    test('users can remove themselves from rooms', async () => {
      // Setup: Create a room as user-1
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-leave',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true },
          'user-2': { displayName: 'User 2', isHost: false }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-leave'), roomData)
      
      // user-2 should be able to remove themselves
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await expect(set(ref(user2Db, 'rooms/test-room-leave/players/user-2'), null)).resolves.not.toThrow()
    })


    test('room creator can update the status of the room', async () => {
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-status',
        name: 'Test Room',
        status: 'waiting',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
      }
      await set(ref(user1Db, 'rooms/test-room-status'), roomData)

      const user2Db = testEnv.authenticatedContext('user-2').database()
      await set(ref(user2Db, 'rooms/test-room-status/players/user-2'), {
        displayName: 'User 2',
        isHost: false,
        isReady: false
      })

      const updatedRoomData = {
        ...roomData,
        status: 'playing'
      }
      await expect(set(ref(user1Db, 'rooms/test-room-status'), updatedRoomData)).resolves.not.toThrow()
      await expect(set(ref(user2Db, 'rooms/test-room-status'), updatedRoomData)).rejects.toThrow()
    })

    test('non-hosts cannot write to room root after joining', async () => {
      // Setup: Create a room as user-1 (host)
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-non-host-write',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-non-host-write'), roomData)
      
      // user-2 joins the room
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await set(ref(user2Db, 'rooms/test-room-non-host-write/players/user-2'), {
        displayName: 'User 2',
        isHost: false,
        isReady: false
      })
      
      // Test: user-2 cannot write to room root (only to their own player data)
      await expect(set(ref(user2Db, 'rooms/test-room-non-host-write/status'), 'playing')).rejects.toThrow()
    })

    test('room creator loses room write permissions after host transfer', async () => {
      // Setup: Create a room as user-1 (creator and host)
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-creator-loses',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-creator-loses'), roomData)
      
      // user-2 joins the room
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await set(ref(user2Db, 'rooms/test-room-creator-loses/players/user-2'), {
        displayName: 'User 2',
        isHost: false,
        isReady: false
      })
      
      // Transfer host to user-2
      await set(ref(user1Db, 'rooms/test-room-creator-loses/players/user-2/isHost'), true)
      await set(ref(user1Db, 'rooms/test-room-creator-loses/players/user-1/isHost'), false)
      
      // Test: user-1 (creator but not host) cannot write to room root
      await expect(set(ref(user1Db, 'rooms/test-room-creator-loses/status'), 'playing')).rejects.toThrow()
      
      // Test: user-2 (new host) can write to room root
      await expect(set(ref(user2Db, 'rooms/test-room-creator-loses/status'), 'playing')).resolves.not.toThrow()
    })

    test('new room creation requires creator to match createdBy field', async () => {
      const user1Db = testEnv.authenticatedContext('user-1').database()
      
      // Test: Cannot create room with different creator
      const invalidRoomData = {
        id: 'test-room-invalid-creator',
        name: 'Test Room',
        createdBy: 'user-2', // Different from authenticated user
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      
      await expect(set(ref(user1Db, 'rooms/test-room-invalid-creator'), invalidRoomData)).rejects.toThrow()
    })

    test('only hosts can delete rooms', async () => {
      // Setup: Create a room as user-1 (host)
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-delete',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-delete'), roomData)
      
      // user-2 joins the room
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await set(ref(user2Db, 'rooms/test-room-delete/players/user-2'), {
        displayName: 'User 2',
        isHost: false,
        isReady: false
      })
      
      // Test: user-2 (non-host) cannot delete room
      await expect(set(ref(user2Db, 'rooms/test-room-delete'), null)).rejects.toThrow()
      
      // But user-1 (host) can delete room
      await expect(set(ref(user1Db, 'rooms/test-room-delete'), null)).resolves.not.toThrow()
    })
  })

  describe('Player Data Permissions', () => {
    test('players can only modify their own data', async () => {
      // Setup: Create a room with user-1 as host
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-players',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true, isReady: false }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-players'), roomData)
      
      // user-2 joins the room
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await set(ref(user2Db, 'rooms/test-room-players/players/user-2'), {
        displayName: 'User 2',
        isHost: false,
        isReady: false
      })
      
      // Test: user-2 cannot modify user-1's data
      await expect(set(ref(user2Db, 'rooms/test-room-players/players/user-1/isReady'), true)).rejects.toThrow()
      
      // But user-2 can modify their own data
      await expect(set(ref(user2Db, 'rooms/test-room-players/players/user-2/isReady'), true)).resolves.not.toThrow()
    })

    test('prevents host privilege escalation by non-host players', async () => {
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-privilege-escalation',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true },
          'user-2': { displayName: 'User 2', isHost: false }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-privilege-escalation'), roomData)

      const user2Db = testEnv.authenticatedContext('user-2').database()
      
      // Test: user-2 (non-host) cannot set themselves as host
      await expect(set(ref(user2Db, 'rooms/test-room-privilege-escalation/players/user-2/isHost'), true)).rejects.toThrow()
      
      // Test: user-2 (non-host) cannot set another player as host
      await expect(set(ref(user2Db, 'rooms/test-room-privilege-escalation/players/user-1/isHost'), false)).rejects.toThrow()
    })

    test('comprehensive host privilege management', async () => {
      // Test 1: Room creator can transfer host privileges
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-host-management',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true },
          'user-2': { displayName: 'User 2', isHost: false },
          'user-3': { displayName: 'User 3', isHost: false }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-host-management'), roomData)

      // Test: user-1 (creator) can transfer host to user-2
      await expect(set(ref(user1Db, 'rooms/test-room-host-management/players/user-2/isHost'), true)).resolves.not.toThrow()
      await expect(set(ref(user1Db, 'rooms/test-room-host-management/players/user-1/isHost'), false)).resolves.not.toThrow()
      
      // Test: user-1 (former host but still creator) can still modify host flags
      await expect(set(ref(user1Db, 'rooms/test-room-host-management/players/user-3/isHost'), true)).resolves.not.toThrow()

      // Test 2: Creator can modify host flags even when not current host
      const user2Db = testEnv.authenticatedContext('user-2').database()
      const roomData2 = {
        id: 'test-room-creator-override',
        name: 'Test Room 2',
        createdBy: 'user-2',
        players: {
          'user-1': { displayName: 'User 1', isHost: true },
          'user-2': { displayName: 'User 2', isHost: false }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user2Db, 'rooms/test-room-creator-override'), roomData2)
      
      // Test: user-2 (creator but not host) can modify host flags
      await expect(set(ref(user2Db, 'rooms/test-room-creator-override/players/user-2/isHost'), true)).resolves.not.toThrow()
      await expect(set(ref(user2Db, 'rooms/test-room-creator-override/players/user-1/isHost'), false)).resolves.not.toThrow()
    })
  })

  describe('Settings Permissions', () => {
    test('only room creator can modify settings', async () => {
      // Setup: Create a room as user-1
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-settings',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-settings'), roomData)
      
      // Test: user-2 cannot modify settings
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await expect(set(ref(user2Db, 'rooms/test-room-settings/settings/gridSize'), 'large')).rejects.toThrow()
      
      // But user-1 (creator) can modify settings
      await expect(set(ref(user1Db, 'rooms/test-room-settings/settings/gridSize'), 'large')).resolves.not.toThrow()
    })
  })

  describe('Slug Management Permissions', () => {
    test('only hosts can write to slugs', async () => {
      // Setup: Create a room as user-1 (host)
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-slug',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-slug'), roomData)
      
      // Test: user-2 (non-host) cannot modify slug
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await expect(set(ref(user2Db, 'slugs/test-slug-123'), 'test-room-slug')).rejects.toThrow()
      
      // But user-1 (host) can modify slug
      await expect(set(ref(user1Db, 'slugs/test-slug-123'), 'test-room-slug')).resolves.not.toThrow()
    })

    test('slug values must be strings', async () => {
      // Setup: Create a room first so the host rule can be satisfied
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-validation',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-validation'), roomData)
      
      // Test: Cannot set non-string values
      await expect(set(ref(user1Db, 'slugs/test-slug'), 123)).rejects.toThrow()
      await expect(set(ref(user1Db, 'slugs/test-slug'), { invalid: 'object' })).rejects.toThrow()
      
      // Test: Can set string values (pointing to the room we created)
      await expect(set(ref(user1Db, 'slugs/test-slug'), 'test-room-validation')).resolves.not.toThrow()
    })

    test('only hosts can delete slugs', async () => {
      // Setup: Create a room and slug as user-1 (host)
      const user1Db = testEnv.authenticatedContext('user-1').database()
      const roomData = {
        id: 'test-room-slug-delete',
        name: 'Test Room',
        createdBy: 'user-1',
        players: {
          'user-1': { displayName: 'User 1', isHost: true }
        },
        maxPlayers: 4,
        settings: { roundDuration: 60, maxRounds: 5, gridSize: "small" }
      }
      await set(ref(user1Db, 'rooms/test-room-slug-delete'), roomData)
      await set(ref(user1Db, 'slugs/test-slug-delete'), 'test-room-slug-delete')
      
      // Test: user-2 (non-host) cannot delete slug
      const user2Db = testEnv.authenticatedContext('user-2').database()
      await expect(set(ref(user2Db, 'slugs/test-slug-delete'), null)).rejects.toThrow()
      
      // But user-1 (host) can delete slug
      await expect(set(ref(user1Db, 'slugs/test-slug-delete'), null)).resolves.not.toThrow()
    })
  })
})
