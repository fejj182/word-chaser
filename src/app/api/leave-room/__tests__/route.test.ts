jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
  NextRequest: jest.fn(),
}))

jest.mock('@/lib/firebase/room-utils', () => ({
  leaveRoom: jest.fn(),
}))

describe('POST /api/leave-room', () => {
  const { POST } = require('../route')
  const { leaveRoom } = jest.requireMock('@/lib/firebase/room-utils') as {
    leaveRoom: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: unknown): any => ({
    json: async () => body,
  })

  it('returns 400 when required fields are missing', async () => {
    const req = createRequest({})

    const res = await POST(req as any)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: 'Missing required fields: roomId and userId',
    })
    expect(leaveRoom).not.toHaveBeenCalled()
  })

  it('calls leaveRoom and returns success on valid payload', async () => {
    leaveRoom.mockResolvedValueOnce(undefined)

    const req = createRequest({ roomId: 'room-1', userId: 'user-1' })

    const res = await POST(req as any)
    expect(leaveRoom).toHaveBeenCalledWith('room-1', 'user-1')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
  })

  it('returns success even when leaveRoom throws (best-effort cleanup)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    leaveRoom.mockRejectedValueOnce(new Error('boom'))

    const req = createRequest({ roomId: 'room-1', userId: 'user-1' })

    const res = await POST(req as any)
    expect(leaveRoom).toHaveBeenCalled()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })

    consoleSpy.mockRestore()
  })

  it('returns success when request parsing throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const badReq: any = {
      json: async () => {
        throw new Error('invalid json')
      },
    }

    const res = await POST(badReq)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })

    expect(leaveRoom).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})


