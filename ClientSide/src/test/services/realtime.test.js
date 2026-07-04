import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRealtimeClient } from '../../services/realtime'

const mockConnection = vi.hoisted(function () {
  return {
    on: vi.fn(),
    off: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    invoke: vi.fn().mockResolvedValue(undefined),
    state: 0,
    connectionId: 'conn-1',
    onreconnecting: vi.fn(),
    onreconnected: vi.fn(),
    onclose: vi.fn(),
  }
})

vi.mock('@microsoft/signalr', function () {
  const builder = {
    withUrl: vi.fn(function () { return this }),
    withAutomaticReconnect: vi.fn(function () { return this }),
    configureLogging: vi.fn(function () { return this }),
    build: vi.fn(function () { return mockConnection }),
  }

  const HubConnectionBuilder = vi.fn(function () { return builder })

  return {
    HubConnectionBuilder,
    HubConnectionState: { Disconnected: 0, Connected: 1 },
    LogLevel: { Warning: 3 },
  }
})

describe('createRealtimeClient', () => {
  beforeEach(function () {
    vi.clearAllMocks()
  })

  it('returns an object with event subscription methods', function () {
    const client = createRealtimeClient('test-token')
    expect(client).toHaveProperty('on')
    expect(client).toHaveProperty('off')
    expect(client).toHaveProperty('onStateChange')
    expect(client).toHaveProperty('start')
    expect(client).toHaveProperty('stop')
    expect(client).toHaveProperty('joinCompany')
    expect(client).toHaveProperty('leaveCompany')
  })

  it('start sets state to connecting then connected', async function () {
    const client = createRealtimeClient('test-token')
    const stateChanges = []
    client.onStateChange(function (state, details) {
      stateChanges.push({ state, details })
    })

    await client.start()

    expect(stateChanges.length).toBe(2)
    expect(stateChanges[0].state).toBe('connecting')
    expect(stateChanges[1].state).toBe('connected')
  })

  it('start does nothing when already connected', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 1

    await client.start()
    expect(mockConnection.start).not.toHaveBeenCalled()

    await client.start()
    expect(mockConnection.start).not.toHaveBeenCalled()
  })

  it('start calls stateListener with disconnected on failure', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 0
    mockConnection.start.mockRejectedValue(new Error('fail'))

    const stateChanges = []
    client.onStateChange(function (state, details) {
      stateChanges.push({ state, details })
    })

    await expect(client.start()).rejects.toThrow('fail')
    expect(stateChanges.some(function (s) { return s.state === 'disconnected' && s.details.startFailed })).toBe(true)
  })

  it('stop disconnects and fires state change', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 1

    const stateChanges = []
    client.onStateChange(function (state, details) {
      stateChanges.push({ state, details })
    })

    await client.stop()

    expect(mockConnection.stop).toHaveBeenCalled()
    expect(stateChanges.some(function (s) { return s.state === 'disconnected' && s.details.stopped })).toBe(true)
  })

  it('stop does nothing when already disconnected', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 0

    await client.stop()

    expect(mockConnection.stop).not.toHaveBeenCalled()
  })

  it('joinCompany invokes JoinCompany on the connection', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 1

    await client.joinCompany(5)

    expect(mockConnection.invoke).toHaveBeenCalledWith('JoinCompany', 5)
  })

  it('joinCompany skips when not connected', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 0

    await client.joinCompany(5)

    expect(mockConnection.invoke).not.toHaveBeenCalled()
  })

  it('joinCompany skips when companyId is falsy', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 1

    await client.joinCompany(null)

    expect(mockConnection.invoke).not.toHaveBeenCalled()
  })

  it('leaveCompany invokes LeaveCompany on the connection', async function () {
    const client = createRealtimeClient('test-token')
    mockConnection.state = 1

    await client.leaveCompany(10)

    expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveCompany', 10)
  })

  it('leaveCompany skips when companyId is falsy', async function () {
    const client = createRealtimeClient('test-token')

    await client.leaveCompany(null)

    expect(mockConnection.invoke).not.toHaveBeenCalled()
  })

  it('on registers a handler via connection.on', function () {
    const client = createRealtimeClient('test-token')
    const handler = vi.fn()
    client.on('NotificationReceived', handler)
    expect(mockConnection.on).toHaveBeenCalledWith('NotificationReceived', handler)
  })

  it('off deregisters a handler via connection.off', function () {
    const client = createRealtimeClient('test-token')
    const handler = vi.fn()
    client.off('NotificationReceived', handler)
    expect(mockConnection.off).toHaveBeenCalledWith('NotificationReceived', handler)
  })

  it('sets up reconnecting handler on connection', function () {
    createRealtimeClient('test-token')
    expect(mockConnection.onreconnecting).toHaveBeenCalled()
  })

  it('sets up reconnected handler on connection', function () {
    createRealtimeClient('test-token')
    expect(mockConnection.onreconnected).toHaveBeenCalled()
  })

  it('sets up onclose handler on connection', function () {
    createRealtimeClient('test-token')
    expect(mockConnection.onclose).toHaveBeenCalled()
  })
})
