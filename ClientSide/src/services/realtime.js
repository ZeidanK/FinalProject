import * as signalR from '@microsoft/signalr'
import { URLS } from '../scripts/config'

/**
 * Create a realtime SignalR client bound to the authenticated notification hub.
 * Connection failures are intentionally surfaced so the provider can retry.
 *
 * @param {string} token - JWT bearer token.
 * @returns {object} Connection helpers and event subscription methods.
 */
export function createRealtimeClient(token) {
  let stateListener = () => {}

  const isDev = import.meta.env.DEV
  const hubUrl = isDev
    ? 'http://localhost:5050/api/realtime/notifications'
    : URLS.realtime.notificationsHub

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  connection.onreconnecting((error) => {
    stateListener('reconnecting', { error })
  })
  connection.onreconnected((connectionId) => {
    stateListener('connected', { reconnected: true, connectionId })
  })
  connection.onclose((error) => {
    stateListener('disconnected', { closed: true, error })
  })

  return {
    on(eventName, handler) {
      connection.on(eventName, handler)
    },
    off(eventName, handler) {
      connection.off(eventName, handler)
    },
    onStateChange(listener) {
      stateListener = typeof listener === 'function' ? listener : () => {}
    },
    async start() {
      if (connection.state !== signalR.HubConnectionState.Disconnected) return

      stateListener('connecting')
      try {
        await connection.start()
        stateListener('connected', { reconnected: false, connectionId: connection.connectionId })
      } catch (error) {
        stateListener('disconnected', { startFailed: true, error })
        throw error
      }
    },
    async stop() {
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop()
      }
      stateListener('disconnected', { stopped: true })
    },
    async joinCompany(companyId) {
      if (!companyId || connection.state !== signalR.HubConnectionState.Connected) return
      await connection.invoke('JoinCompany', Number(companyId))
    },
    async leaveCompany(companyId) {
      if (!companyId || connection.state !== signalR.HubConnectionState.Connected) return
      await connection.invoke('LeaveCompany', Number(companyId))
    },
  }
}
