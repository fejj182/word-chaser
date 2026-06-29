/**
 * @jest-environment node
 */

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  cleanupFirebaseAdminApps,
  getEmulatorUnavailableMessage,
} from '@/lib/firebase/test-utils/emulator-test-utils'

const rulesPath = join(__dirname, '../config/database.rules.json')
const rules = readFileSync(rulesPath, 'utf8')

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: jest.fn(),
}));

describe('API Route Integration Tests', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    try {
      testEnv = await initializeTestEnvironment({
        projectId: 'demo-word-chaser',
        database: {
          rules,
          host: process.env.RTD_EMULATOR_HOST || '127.0.0.1',
          port: Number(process.env.RTD_EMULATOR_PORT || 9000),
        },
      })
    } catch (error) {
      throw new Error(getEmulatorUnavailableMessage(error))
    }
  })

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup()
    }
    await cleanupFirebaseAdminApps()
  })

  afterEach(async () => {
    if (testEnv) {
      await testEnv.clearDatabase()
    }
  })

  describe('Leave Room API', () => {
    it('should successfully call leave room API endpoint', async () => {
      const { POST } = await import('@/app/api/leave-room/route');
      
      const req = {
        json: async () => ({ roomId: 'test-room', userId: 'test-user' })
      } as any;

      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 for missing parameters', async () => {
      const { POST } = await import('@/app/api/leave-room/route');
      
      const req = {
        json: async () => ({})
      } as any;

      const res = await POST(req);
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing required fields: roomId and userId');
    });
  });
});
