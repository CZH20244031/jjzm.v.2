'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'
import {
  Bell,
  BellRing,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Shield,
  Thermometer,
  Wrench,
  Pill,
  Settings,
  CheckCheck,
  Eye,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Inbox,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AlertItem {
  id: string
  type: string
  level: string
  title: string
  message: string
  source: string | null
  status: string
  createdAt: string
  updatedAt: string
  farm?: { id: string; name: string }
}

type FilterTab = '全部' | '未读' | '环境预警' | '设备故障' | '用药提醒' | '系统通知' | '出栏锁定'

// ─── Constants ───────────────────────────────────────────────────────────────

const FILTER_TABS: FilterTab[] = ['全部', '未读', '环境预警', '设备故障', '用药提醒', '系统通知', '出栏锁定']

const TYPE_ICONS: Record<string, React.ReactNode> = {
  '环境预警': <Thermometer className="h-4 w-4" />,
  '设备故障': <Wrench className="h-4 w-4" />,
  '用药提醒': <Pill className="h-4 w-4" />,
  '出栏锁定': <Shield className="h-4 w-4" />,
  '系统通知': <Info className="h-4 w-4" />,
}

const LEVEL_CONFIG: Record<string, {
  border: string
  iconBg: string
  iconText: string
  badge: string
  badgeText: string
  label: string
  statBg: string
  statText: string
}> = {
  critical: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-500',
    iconText: 'text-white',
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    badgeText: '紧急',
    statBg: 'bg-red-50 dark:bg-red-950/30',
    statText: 'text-red-600 dark:text-red-400',
  },
  danger: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-500',
    iconText: 'text-white',
    badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    badgeText: '高危',
    statBg: 'bg-orange-50 dark:bg-orange-950/30',
    statText: 'text-orange-600 dark:text-orange-400',
  },
  warning: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-500',
    iconText: 'text-white',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    badgeText: '警告',
    statBg: 'bg-amber-50 dark:bg-amber-950/30',
    statText: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500',
    iconText: 'text-white',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    badgeText: '通知',
    statBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    statText: 'text-emerald-600 dark:text-emerald-400',
  },
}

const TYPE_STATS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  '环境预警': { icon: <Thermometer className="h-3.5 w-3.5" />, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', label: '环境预警' },
  '设备故障': { icon: <Wrench className="h-3.5 w-3.5" />, bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', label: '设备故障' },
  '用药提醒': { icon: <Pill className="h-3.5 w-3.5" />, bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', label: '用药提醒' },
  '出栏锁定': { icon: <Shield className="h-3.5 w-3.5" />, bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', label: '出栏锁定' },
  '系统通知': { icon: <Info className="h-3.5 w-3.5" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', label: '系统通知' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getLevelConfig(level: string) {
  return LEVEL_CONFIG[level] || LEVEL_CONFIG.info
}

function getTypeIcon(type: string) {
  return TYPE_ICONS[type] || <Bell className="h-4 w-4" />
}

function getQuickActions(alert: AlertItem) {
  if (alert.status === '已处理') return []
  const actions: { label: string; icon: React.ReactNode; action: 'view' | 'process' }[] = []
  if (alert.status === '未读') {
    actions.push({ label: '标为已读', icon: <Eye className="h-3 w-3" />, action: 'view' })
  }
  if (['critical', 'danger', 'warning'].includes(alert.level)) {
    actions.push({ label: '处理', icon: <CheckCircle2 className="h-3 w-3" />, action: 'process' })
  }
  return actions
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-3 w-16 rounded ml-auto" />
        </div>
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-3 w-full max-w-xs rounded" />
      </div>
    </div>
  )
}

function EmptyState({ filter }: { filter: FilterTab }) {
  const isUnread = filter === '未读'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-muted-foreground"
    >
      <div className="rounded-2xl bg-muted/50 p-4 mb-4">
        {isUnread ? (
          <CheckCheck className="h-10 w-10 text-emerald-500" />
        ) : (
          <Inbox className="h-10 w-10 text-muted-foreground/50" />
        )}
      </div>
      <p className="text-sm font-medium">
        {isUnread ? '所有消息已读' : '暂无消息'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {isUnread
          ? '当前没有未读消息，一切正常'
          : filter === '全部'
            ? '当前没有任何通知消息'
            : `暂无${filter}类型的消息`
        }
      </p>
    </motion.div>
  )
}

// ─── Animated Number ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value === prevValue.current) return
    prevValue.current = value
    const startTime = performance.now()
    let frameId: number
    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / 500, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }
    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [value])
  return <>{display}</>
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function NotificationCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('全部')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [totalUnread, setTotalUnread] = useState(0)
  const { toast } = useToast()

  // ── Fetch alerts ──

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setTotalUnread(data.unreadCount || 0)
      } else {
        toast({ title: '获取消息失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '网络错误，请重试', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // ── Mark as read ──

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '已读' }),
      })
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: '已读', updatedAt: new Date().toISOString() } : a))
        setTotalUnread(prev => Math.max(0, prev - 1))
      }
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }, [toast])

  const handleMarkProcessed = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '已处理' }),
      })
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: '已处理', updatedAt: new Date().toISOString() } : a))
        setTotalUnread(prev => Math.max(0, prev - 1))
        toast({ title: '已标记为已处理' })
      }
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }, [toast])

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = alerts.filter(a => a.status === '未读').map(a => a.id)
    if (unreadIds.length === 0) return

    try {
      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/alerts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: '已读' }),
          })
        )
      )
      setAlerts(prev => prev.map(a => ({ ...a, status: '已读', updatedAt: new Date().toISOString() })))
      setTotalUnread(0)
      toast({ title: `已将 ${unreadIds.length} 条消息标为已读` })
    } catch {
      toast({ title: '操作失败，请重试', variant: 'destructive' })
    }
  }, [alerts, toast])

  // ── Toggle expand ──

  const handleToggleExpand = useCallback((id: string, currentStatus: string) => {
    setExpandedId(prev => prev === id ? null : id)
    if (currentStatus === '未读') {
      handleMarkRead(id)
    }
  }, [handleMarkRead])

  // ── Export ──

  const handleExport = useCallback(() => {
    exportCsv('alerts', {
      onSuccess: () => toast({ title: '导出成功' }),
      onError: (err) => toast({ title: '导出失败', description: err, variant: 'destructive' }),
    })
  }, [toast])

  // ── Computed values ──

  const filteredAlerts = useMemo(() => {
    if (activeFilter === '全部') return alerts
    if (activeFilter === '未读') return alerts.filter(a => a.status === '未读')
    return alerts.filter(a => a.type === activeFilter)
  }, [alerts, activeFilter])

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    const types = ['环境预警', '设备故障', '用药提醒', '系统通知', '出栏锁定']
    for (const type of types) {
      stats[type] = alerts.filter(a => a.type === type && a.status === '未读').length
    }
    return stats
  }, [alerts])

  const totalAlerts = alerts.length
  const unreadInFilter = filteredAlerts.filter(a => a.status === '未读').length
  const criticalCount = alerts.filter(a => a.level === 'critical').length

  // ── Loading state ──

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Filter tabs skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>

        {/* List skeleton */}
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <SkeletonCard />
                {i < 4 && <Separator className="ml-14" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Render ──

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <BellRing className="h-5 w-5" />
            </div>
            {totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 shadow-sm"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </motion.span>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              消息通知中心
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              共 {totalAlerts} 条消息
              {totalUnread > 0 && (
                <span className="text-red-500 font-medium">，{totalUnread} 条未读</span>
              )}
              {criticalCount > 0 && (
                <span className="text-red-600 font-medium">，{criticalCount} 条紧急</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-secondary/80 hover:bg-secondary"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          {totalUnread > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              全部已读
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* ── Category Statistics ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {Object.entries(TYPE_STATS_CONFIG).map(([type, config]) => {
          const count = categoryStats[type] || 0
          return (
            <motion.div
              key={type}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="relative overflow-hidden rounded-xl border bg-card p-3 cursor-default"
            >
              {count > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                    {count}
                  </span>
                </div>
              )}
              <div className={`inline-flex rounded-lg p-1.5 ${config.bg}`}>
                <span className={config.text}>{config.icon}</span>
              </div>
              <p className="text-xs font-medium mt-2">{config.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {count > 0 ? (
                  <span className={config.text}>{count} 条未读</span>
                ) : (
                  <span className="text-emerald-500">全部已读</span>
                )}
              </p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Filter Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex flex-wrap gap-2"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab
          const count = tab === '全部'
            ? totalAlerts
            : tab === '未读'
              ? totalUnread
              : alerts.filter(a => a.type === tab).length
          const unreadInTab = tab === '全部'
            ? totalUnread
            : tab === '未读'
              ? totalUnread
              : alerts.filter(a => a.type === tab && a.status === '未读').length

          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`
                relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
                transition-all duration-200 active:scale-95
                ${isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              {tab}
              <span className={`
                text-[10px] tabular-nums
                ${isActive ? 'text-emerald-100' : 'text-muted-foreground/70'}
              `}>
                {count}
              </span>
              {isActive && unreadInTab > 0 && tab !== '未读' && (
                <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold text-white px-1">
                  {unreadInTab}
                </span>
              )}
            </button>
          )
        })}
      </motion.div>

      {/* ── Filter summary bar ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {activeFilter === '全部' && `显示全部 ${filteredAlerts.length} 条消息`}
          {activeFilter === '未读' && `${filteredAlerts.length} 条未读消息`}
          {activeFilter !== '全部' && activeFilter !== '未读' && `${activeFilter} · ${filteredAlerts.length} 条消息`}
          {unreadInFilter > 0 && activeFilter !== '未读' && (
            <span className="text-emerald-600 ml-1">· {unreadInFilter} 条未读</span>
          )}
        </p>
      </div>

      {/* ── Message List ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            {filteredAlerts.length === 0 ? (
              <EmptyState filter={activeFilter} />
            ) : (
              <div className="divide-y">
                <AnimatePresence>
                  {filteredAlerts.map((alert, index) => {
                    const levelConf = getLevelConfig(alert.level)
                    const isUnread = alert.status === '未读'
                    const isExpanded = expandedId === alert.id
                    const quickActions = getQuickActions(alert)

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                        className={`
                          border-l-[3px] ${levelConf.border}
                          ${isUnread ? 'bg-muted/20' : ''}
                          transition-colors duration-200
                        `}
                      >
                        <div
                          className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => handleToggleExpand(alert.id, alert.status)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleToggleExpand(alert.id, alert.status)
                            }
                          }}
                        >
                          {/* Icon */}
                          <div className={`
                            mt-0.5 rounded-lg p-2 shrink-0 shadow-sm
                            ${levelConf.iconBg} ${levelConf.iconText}
                          `}>
                            {getTypeIcon(alert.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Top row: badges + time */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className={`text-[10px] px-1.5 py-0 border ${levelConf.badge}`}>
                                {levelConf.badgeText}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {alert.type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto shrink-0 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(alert.createdAt)}
                              </span>
                              {isUnread && (
                                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                              )}
                            </div>

                            {/* Title */}
                            <h4 className={`text-sm mt-1.5 ${isUnread ? 'font-bold' : 'font-medium'} truncate`}>
                              {alert.title}
                            </h4>

                            {/* Message preview */}
                            <p className={`
                              text-xs text-muted-foreground mt-0.5 leading-relaxed
                              ${isExpanded ? '' : 'line-clamp-2'}
                            `}>
                              {alert.message}
                            </p>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 pt-2 border-t border-dashed">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDateTime(alert.createdAt)}
                                      </span>
                                      {alert.source && (
                                        <span className="flex items-center gap-1">
                                          <Settings className="h-3 w-3" />
                                          来源: {alert.source}
                                        </span>
                                      )}
                                      {alert.farm && (
                                        <span>所属: {alert.farm.name}</span>
                                      )}
                                      <Badge
                                        variant="outline"
                                        className={`
                                          text-[10px] px-1.5 py-0
                                          ${alert.status === '已处理'
                                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/20'
                                            : alert.status === '已读'
                                              ? 'text-muted-foreground'
                                              : 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/20'
                                          }
                                        `}
                                      >
                                        {alert.status === '已处理' && <CheckCircle2 className="h-3 w-3 mr-0.5" />}
                                        {alert.status === '已读' && <Eye className="h-3 w-3 mr-0.5" />}
                                        {alert.status === '未读' && <AlertCircle className="h-3 w-3 mr-0.5" />}
                                        {alert.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Quick actions */}
                            {quickActions.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                                {quickActions.map((action) => (
                                  <Button
                                    key={action.label}
                                    variant="ghost"
                                    size="sm"
                                    className={`
                                      h-7 text-[11px] px-2 gap-1 rounded-md
                                      ${action.action === 'process'
                                        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                                        : 'text-muted-foreground hover:text-foreground'
                                      }
                                    `}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (action.action === 'view') handleMarkRead(alert.id)
                                      else handleMarkProcessed(alert.id)
                                    }}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Expand toggle */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-1 shrink-0 text-muted-foreground"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ── Footer info ── */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {totalUnread > 0
            ? `还有 ${totalUnread} 条未读消息待处理`
            : '所有消息已处理完毕'
          }
        </span>
        <span className="flex items-center gap-1">
          <div className={`h-1.5 w-1.5 rounded-full ${totalUnread > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          {refreshing ? '正在刷新...' : '自动同步中'}
        </span>
      </div>
    </div>
  )
}
