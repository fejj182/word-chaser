import { NextRequest } from 'next/server'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: jest.fn(),
}))

jest.mock('@/lib/firebase/admin-room-utils', () => ({
  leaveRoomAdmin: jest.fn(),
}))

import { POST } from '../route'

const { leaveRoomAdmin } = jest.requireMock('@/lib/firebase/admin-room-utils') as {
  leaveRoomAdmin: jest.Mock
}

describe('POST /api/leave-room', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: unknown): { json: () => Promise<unknown> } => ({
    json: async () => body,
  })

  it('returns 400 when required fields are missing', async () => {
    const req = createRequest({})

    const res = await POST(req as NextRequest)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: 'Missing required fields: roomId and userId',
    })
    expect(leaveRoomAdmin).not.toHaveBeenCalled()
  })

  it('calls leaveRoomAdmin and returns success on valid payload', async () => {
    leaveRoomAdmin.mockResolvedValueOnce(undefined)

    const req = createRequest({ roomId: 'room-1', userId: 'user-1' })

    const res = await POST(req as NextRequest)
    expect(leaveRoomAdmin).toHaveBeenCalledWith('room-1', 'user-1')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
  })

  it('returns success even when leaveRoomAdmin throws (best-effort cleanup)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    leaveRoomAdmin.mockRejectedValueOnce(new Error('boom'))

    const req = createRequest({ roomId: 'room-1', userId: 'user-1' })

    const res = await POST(req as NextRequest)
    expect(leaveRoomAdmin).toHaveBeenCalled()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })

    consoleSpy.mockRestore()
  })

  it('returns success when request parsing throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const badReq: { json: () => Promise<unknown> } = {
      json: async () => {
        throw new Error('invalid json')
      },
    }

    const res = await POST(badReq as NextRequest)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })

    expect(leaveRoomAdmin).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})


