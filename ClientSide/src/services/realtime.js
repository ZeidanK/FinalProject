import { URLS } from '../scripts/config'

let signalRModulePromise = null

const NOOP_CONNECTION_STATE = {
  Disconnected: 'Disconnected',
  Connected: 'Connected',
}

const NOOP_SIGNALR = {
  LogLevel: { Warning: 0 },
  HubConnectionState: NOOP_CONNECTION_STATE,
  HubConnectionBuilder: class {
    withUrl() { return this }
    withAutomaticReconnect() { return this }
    configureLogging() { return this }
    build() {
      const handlers = new Map()
      return {
        state: NOOP_CONNECTION_STATE.Disconnected,
        on(eventName, handler) {
          const list = handlers.get(eventName) || new Set()
          list.add(handler)
          handlers.set(eventName, list)
        },
        off(eventName, handler) {
          const list = handlers.get(eventName)
          if (!list) return
          list.delete(handler)
          if (list.size === 0) handlers.delete(eventName)
        },
        async start() {},
        async stop() {},
        async invoke() {},
        onreconnecting() {},
        onreconnected() {},
        onclose() {},
      }
    }
  },
}

const loadSignalR = async () => {
  if (!signalRModulePromise) {
    const moduleName = '@microsoft/' + 'signalr'
    signalRModulePromise = import(moduleName)
      .catch(() => NOOP_SIGNALR)
  }

  return signalRModulePromise
}

/**
 * Create a realtime client bound to the notification hub.
 *
 * @param {string} token - JWT bearer token.
 * @returns {object} Connection helpers and event subscription methods.
 */
export function createRealtimeClient(token) {
  let stateListener = () => {}
  let signalR = NOOP_SIGNALR

  const pendingRegistrations = []

  const connection = new NOOP_SIGNALR.HubConnectionBuilder().build()

  const hydrateConnection = async () => {
    signalR = await loadSignalR()

    // If SignalR is unavailable, keep running with no-op connection.
    if (signalR === NOOP_SIGNALR) {
      return connection
    }

    const liveConnection = new signalR.HubConnectionBuilder()
      .withUrl(URLS.realtime.notificationsHub, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    liveConnection.onreconnecting(() => stateListener('reconnecting'))
    liveConnection.onreconnected(() => stateListener('connected'))
    liveConnection.onclose(() => stateListener('disconnected'))

    pendingRegistrations.forEach(({ eventName, handler }) => {
      liveConnection.on(eventName, handler)
    })

    return liveConnection
  }

  let activeConnection = connection

  connection.onreconnecting(() => stateListener('reconnecting'))
  connection.onreconnected(() => stateListener('connected'))
  connection.onclose(() => stateListener('disconnected'))

  return {
    on(eventName, handler) {
      pendingRegistrations.push({ eventName, handler })
      activeConnection.on(eventName, handler)
    },
    off(eventName, handler) {
      const idx = pendingRegistrations.findIndex((entry) => entry.eventName === eventName && entry.handler === handler)
      if (idx >= 0) pendingRegistrations.splice(idx, 1)
      activeConnection.off(eventName, handler)
    },
    onStateChange(listener) {
      stateListener = typeof listener === 'function' ? listener : () => {}
    },
    async start() {
      if (activeConnection.state !== signalR.HubConnectionState.Disconnected) return

      if (activeConnection === connection) {
        activeConnection = await hydrateConnection()
      }

      if (activeConnection === connection) {
        stateListener('disconnected')
        return
      }

      stateListener('connecting')
      await activeConnection.start()
      stateListener('connected')
    },
    async stop() {
      if (activeConnection.state === signalR.HubConnectionState.Disconnected) {
        stateListener('disconnected')
        return
      }

      await activeConnection.stop()
      stateListener('disconnected')
    },
    async joinCompany(companyId) {
      if (!companyId || activeConnection.state !== signalR.HubConnectionState.Connected) return
      await activeConnection.invoke('JoinCompany', Number(companyId))
    },
    async leaveCompany(companyId) {
      if (!companyId || activeConnection.state !== signalR.HubConnectionState.Connected) return
      await activeConnection.invoke('LeaveCompany', Number(companyId))
    },
  }
}