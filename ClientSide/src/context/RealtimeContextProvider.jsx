import { createContext } from 'react'

/**
 * Realtime context that exposes websocket connection state and event subscription helpers.
 */
export const RealtimeContext = createContext(undefined)