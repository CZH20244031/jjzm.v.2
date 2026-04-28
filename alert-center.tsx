'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Shield,
  Thermometer,
  Wrench,
  Pill,
  ScanLine,
  Loader2,
  CheckCheck,
  Eye,
} from 'lucide-react'

interface AlertItem {
  id: string
  type: string
  level: string
  title: string
  message: string
  source: string | null
  status: string
  createdAt: string
}

function getAlertIcon(type: string) {
  switch (type) {
    case '环境预警': return <Thermometer className="h-4 w-4" />
    case '设备故障': return <Wrench className="h-4 w-4" />
    case '用药提醒': return <Pill className="h-4 w-4" />
    case '出栏锁定': return <Shield className="h-4 w-4" />
    case '系统通知': return <Info className="h-4 w-4" />
    default: return <Bell className="h-4 w-4" />
  }
}

function getLevelStyle(level: string) {
  switch (level) {
    case 'critical': return { bg: 'bg-red-50 border-red-200', icon: 'bg-red-500 text-white', badge: 'bg-red-100 text-red-700 border-red-200', text: '紧急', bar: 'bg-red-500' }
    case 'danger': return { bg: 'bg-red-50 border-red-200', icon: 'bg-orange-500 text-white', badge: 'bg-orange-100 text-orange-700 border-orange-200', text: '高危', bar: 'bg-orange-500' }
    case 'warning': return { bg: 'bg-yellow-50 border-yellow-200', icon: 'bg-yellow-500 text-white', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: '警告', bar: 'bg-amber-500' }
    case 'info': return { bg: 'bg-teal-50 border-teal-200', icon: 'bg-teal-500 text-white', badge: 'bg-teal-100 text-teal-700 border-teal-200', text: '通知', bar: 'bg-teal-500' }
    default: return { bg: 'bg-gray-50 border-gray-200', icon: 'bg-gray-400 text-white', badge: 'bg-gray-100 text-gray-600 border-gray-200', text: '信息', bar: 'bg-gray-400' }
  }
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function AlertCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [statsAnimated, setStatsAnimated] = useState(false)
  const { toast } = useToast()

  // Trigger count-up animation after data loads
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setStatsAnimated(true), 200)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Simple count-up display
  function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
      if (!statsAnimated) { setDisplay(0); return }
      const startTime = performance.now()
      function animate(now: number) {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.round(eased * value))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, [value, duration, statsAnimated])
    return <>{display}</>
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function fetchAlerts() {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (levelFilter !== 'all') params.set('level', levelFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/alerts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchAlerts()
  }, [typeFilter, levelFilter, statusFilter])

  async function handleMarkRead(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '已读' }),
      })
      if (res.ok) {
        fetchAlerts()
      }
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }

  async function handleMarkResolved(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '已处理' }),
      })
      if (res.ok) {
        fetchAlerts()
      }
    } catch {
      toast({ title: '操作失败', variant: 'destructive' })
    }
  }

  async function handleMarkAllRead() {
    const unread = alerts.filter(a => a.status === '未读')
    for (const alert of unread) {
      await handleMarkRead(alert.id)
    }
    toast({ title: `已将 ${unread.length} 条标记为已读` })
  }

  const unreadCount = alerts.filter(a => a.status === '未读').length
  const criticalCount = alerts.filter(a => a.level === 'critical' || a.level === 'danger').length
  const totalCount = alerts.length
  const resolvedCount = alerts.filter(a => a.status === '已处理').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">预警中心</h1>
          <p className="text-muted-foreground text-sm mt-1">
            系统预警与消息通知管理
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            全部标为已读
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-teal-50">
                <Bell className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总预警</p>
                <p className="text-lg font-bold"><AnimatedNumber value={totalCount} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">未读</p>
                <p className="text-lg font-bold text-orange-600"><AnimatedNumber value={unreadCount} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">紧急/高危</p>
                <p className="text-lg font-bold text-red-600"><AnimatedNumber value={criticalCount} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已处理</p>
                <p className="text-lg font-bold text-emerald-600"><AnimatedNumber value={resolvedCount} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="预警类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="环境预警">环境预警</SelectItem>
            <SelectItem value="设备故障">设备故障</SelectItem>
            <SelectItem value="用药提醒">用药提醒</SelectItem>
            <SelectItem value="出栏锁定">出栏锁定</SelectItem>
            <SelectItem value="系统通知">系统通知</SelectItem>
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="预警等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            <SelectItem value="critical">紧急</SelectItem>
            <SelectItem value="danger">高危</SelectItem>
            <SelectItem value="warning">警告</SelectItem>
            <SelectItem value="info">通知</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="处理状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="未读">未读</SelectItem>
            <SelectItem value="已读">已读</SelectItem>
            <SelectItem value="已处理">已处理</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {alerts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-3 text-green-400" />
                  <p className="text-sm">暂无预警消息</p>
                </div>
              )}
              {alerts.map((alert, index) => {
                const levelStyle = getLevelStyle(alert.level)
                const isCritical = alert.level === 'critical'
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                    className={`flex ${isCritical ? 'breathing-critical' : ''}`}
                  >
                    {/* Severity color bar */}
                    <div className={`w-[3px] shrink-0 self-stretch rounded-full ${levelStyle.bar}`} />
                    <div
                      className={`flex-1 p-4 transition-colors hover:bg-muted/30 ${alert.status === '未读' ? 'bg-muted/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-lg p-1.5 ${levelStyle.icon}`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] px-1.5 py-0 ${levelStyle.badge}`}>
                            {levelStyle.text}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {alert.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                          {alert.status === '未读' && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <h4 className="text-sm font-medium mt-1">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(alert.createdAt)}
                          </span>
                          {alert.source && (
                            <span className="text-[10px] text-muted-foreground">
                              来源: {alert.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {alert.status === '未读' && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => handleMarkRead(alert.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            标为已读
                          </Button>
                        )}
                        {alert.status !== '已处理' && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => handleMarkResolved(alert.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            标为已处理
                          </Button>
                        )}
                        {alert.status === '已处理' && (
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            已处理
                          </Badge>
                        )}
                      </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
