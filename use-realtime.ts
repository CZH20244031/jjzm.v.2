'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

// --- Event payload types ---

export interface EnvUpdate {
  houseId: string
  houseName: string
  temperature: number
  humidity: number
  ammonia: number
  co2: number
  timestamp: string
}

export interface AlertEvent {
  type: string
  level: 'info' | 'warning' | 'danger'
  message: string
  houseId: string
  timestamp: string
}

export interface BatchUpdate {
  batchId: string
  batchNo: string
  currentQuantity: number
  mortality: number
  feedConsumption: number
}

export interface RealtimeData {
  envUpdates: EnvUpdate[]
  alerts: AlertEvent[]
  batchUpdates: BatchUpdate[]
}

export interface RealtimeOptions {
  /** Auto-connect on mount (default: false) */
  enabled?: boolean
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number
  /** Reconnection delay in ms (default: 3000) */
  reconnectDelay?: number
}

export interface UseRealtimeReturn {
  /** Whether the socket is currently connected */
  connected: boolean
  /** Latest environment update received */
  latestEnvUpdate: EnvUpdate | null
  /** Latest alert received */
  latestAlert: AlertEvent | null
  /** Latest batch update received */
  latestBatchUpdate: BatchUpdate | null
  /** Cumulative realtime data buffer */
  realtimeData: RealtimeData
  /** Manually trigger connection */
  connect: () => void
  /** Manually trigger disconnection */
  disconnect: () => void
}

/**
 * Hook for WebSocket realtime data from the 极境智牧 realtime service.
 *
 * Connects to the Socket.io server on port 3003 via the Caddy gateway.
 * Emits simulated env-update, alert-new, and batch-update events.
 */
export function useRealtime(
  onUpdate?: (data: RealtimeData) => void,
  options: RealtimeOptions = {}
): UseRealtimeReturn {
  const {
    enabled = false,
    maxReconnectAttempts = 10,
    reconnectDelay = 3000,
  } = options

  const [connected, setConnected] = useState(false)
  const [latestEnvUpdate, setLatestEnvUpdate] = useState<EnvUpdate | null>(null)
  const [latestAlert, setLatestAlert] = useState<AlertEvent | null>(null)
  const [latestBatchUpdate, setLatestBatchUpdate] = useState<BatchUpdate | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    envUpdates: [],
    alerts: [],
    batchUpdates: [],
  })

  const socketRef = useRef<Socket | null>(null)
  const onUpdateRef = useRef(onUpdate)

  // Keep ref up to date without re-triggering the effect
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  /**
   * Internal: disconnect the socket. The socket 'disconnect' event handler
   * will setConnected(false) asynchronously, avoiding synchronous setState in effects.
   */
  const safeSocketDisconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
    })

    socket.on('connect', () => {
      console.log('[useRealtime] Connected')
      setConnected(true)
      socket.emit('subscribe', ['env-update', 'alert-new', 'batch-update'])
    })

    socket.on('disconnect', () => {
      console.log('[useRealtime] Disconnected')
      setConnected(false)
    })

    socket.on('env-update', (data: EnvUpdate) => {
      setLatestEnvUpdate(data)
      setRealtimeData(prev => {
        const next = {
          ...prev,
          envUpdates: [...prev.envUpdates.slice(-49), data], // Keep last 50
        }
        onUpdateRef.current?.(next)
        return next
      })
    })

    socket.on('alert-new', (data: AlertEvent) => {
      setLatestAlert(data)
      setRealtimeData(prev => {
        const next = {
          ...prev,
          alerts: [...prev.alerts.slice(-19), data], // Keep last 20
        }
        onUpdateRef.current?.(next)
        return next
      })
    })

    socket.on('batch-update', (data: BatchUpdate) => {
      setLatestBatchUpdate(data)
      setRealtimeData(prev => {
        const next = {
          ...prev,
          batchUpdates: [...prev.batchUpdates.slice(-19), data], // Keep last 20
        }
        onUpdateRef.current?.(next)
        return next
      })
    })

    socket.on('connect_error', (err) => {
      console.warn('[useRealtime] Connection error:', err.message)
    })

    socketRef.current = socket
  }, [maxReconnectAttempts, reconnectDelay])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      // State will be updated by the 'disconnect' socket event asynchronously,
      // but also set it here for immediate UI feedback when called manually
      setConnected(false)
    }
  }, [])

  // Auto-connect when enabled changes
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      safeSocketDisconnect()
    }

    return () => {
      safeSocketDisconnect()
    }
  }, [enabled, connect, safeSocketDisconnect])

  return {
    connected,
    latestEnvUpdate,
    latestAlert,
    latestBatchUpdate,
    realtimeData,
    connect,
    disconnect,
  }
}
