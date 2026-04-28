'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface NotificationAlert {
  id: string
  type: string
  level: string
  title: string
  message: string
  status: string
  createdAt: string
}

// Simulated new alerts that appear periodically
const simulatedAlerts: Omit<NotificationAlert, 'id' | 'createdAt'>[] = [
  { type: '环境预警', level: 'warning', title: 'A1栋温度波动', message: '温度在10分钟内变化了2.5°C，请关注', status: '未读' },
  { type: '环境预警', level: 'danger', title: 'A2栋氨气浓度超标', message: '氨气浓度达到25ppm，已超过安全标准', status: '未读' },
  { type: '设备故障', level: 'warning', title: 'B1栋传感器信号弱', message: '温湿度传感器-B1-01信号强度低于阈值', status: '未读' },
  { type: '系统通知', level: 'info', title: '数据同步完成', message: '环境数据同步已成功完成，共同步372条记录', status: '未读' },
  { type: '用药提醒', level: 'warning', title: 'PC-2025-003用药提醒', message: '泰乐菌素需在今日18:00前投喂第二剂', status: '未读' },
  { type: '环境预警', level: 'info', title: 'B2栋环境优秀', message: 'B2栋所有环境指标均在最优范围内', status: '未读' },
]

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(3)
  const [recentAlerts, setRecentAlerts] = useState<NotificationAlert[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const lastAlertTimeRef = useRef<number>(Date.now())
  const alertIndexRef = useRef(0)

  // Fetch initial alerts
  useEffect(() => {
    async function fetchInitial() {
      try {
        const res = await fetch('/api/alerts?status=未读')
        if (res.ok) {
          const data = await res.json()
          const alerts = (data.alerts || []) as NotificationAlert[]
          setRecentAlerts(alerts.slice(0, 5))
          setUnreadCount(alerts.length)
        }
      } catch {
        // Use default count
      }
    }
    fetchInitial()
  }, [])

  // Simulate new notifications every 45-90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return

      const now = Date.now()
      if (now - lastAlertTimeRef.current < 45000) return
      lastAlertTimeRef.current = now

      const alert = simulatedAlerts[alertIndexRef.current % simulatedAlerts.length]
      alertIndexRef.current++

      const newAlert: NotificationAlert = {
        ...alert,
        id: `sim-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }

      // Show toast notification based on level
      const levelConfig: Record<string, { type: 'success' | 'warning' | 'error' | 'info' }> = {
        critical: { type: 'error' },
        danger: { type: 'error' },
        warning: { type: 'warning' },
        info: { type: 'info' },
      }

      const config = levelConfig[alert.level] || { type: 'info' }

      toast(alert.title, {
        description: alert.message,
        type: config.type,
        duration: 5000,
      })

      setRecentAlerts(prev => [newAlert, ...prev.slice(0, 4)])
      setUnreadCount(prev => prev + 1)
    }, 60000) // Check every 60s

    return () => clearInterval(interval)
  }, [])

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
    setRecentAlerts(prev => prev.map(a => ({ ...a, status: '已读' })))
    toast.success('所有通知已标记为已读')
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setRecentAlerts(prev => prev.filter(a => a.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const togglePanel = useCallback(() => {
    setShowPanel(prev => !prev)
  }, [])

  return {
    unreadCount,
    recentAlerts,
    showPanel,
    setShowPanel,
    markAllRead,
    dismissNotification,
    togglePanel,
  }
}
