'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Monitor,
  Maximize,
  Minimize,
  RefreshCw,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Activity,
  Skull,
  Layers,
  AlertTriangle,
  Wrench,
  Pill,
  Info,
  Shield,
  TrendingUp,
  TrendingDown,
  Bird,
  Factory,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ---------- types ---------- */

interface House {
  id: string
  name: string
  batchNo: string | null
  breed: string | null
  birds: number
  age: number
  temperature: number
  humidity: number
  ammonia: number
  co2: number
  status: string
  feedToday: number
}

interface Alert {
  type: string
  level: string
  message: string
  time: string
}

interface EnvPoint {
  time: string
  A1: number
  A2: number
  B1: number
  B2: number
}

interface FeedPoint {
  day: string
  value: number
}

interface MonitorData {
  timestamp: string
  farmOverview: {
    name: string
    totalCapacity: number
    currentInventory: number
    activeBatches: number
    todayMortality: number
    todayFeed: number
    environmentScore: number
  }
  houses: House[]
  alerts: Alert[]
  environmentHistory: EnvPoint[]
  feedTrend: FeedPoint[]
}

/* ---------- chart config ---------- */

const envChartConfig: ChartConfig = {
  A1: { label: 'A1栋', color: '#22c55e' },
  A2: { label: 'A2栋', color: '#3b82f6' },
  B1: { label: 'B1栋', color: '#f59e0b' },
  B2: { label: 'B2栋', color: '#a855f7' },
}

const feedChartConfig: ChartConfig = {
  value: { label: '饲料消耗 (kg)', color: '#06b6d4' },
}

/* ---------- helpers ---------- */

function statusColor(status: string) {
  switch (status) {
    case '正常': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case '关注': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case '消毒中': return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case '待入栏': return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  }
}

function statusBorderColor(status: string) {
  switch (status) {
    case '正常': return 'border-emerald-500/50'
    case '关注': return 'border-amber-500/50'
    case '消毒中': return 'border-blue-500/50'
    case '待入栏': return 'border-slate-600/50'
    default: return 'border-slate-700/50'
  }
}

function alertLevelColor(level: string) {
  switch (level) {
    case 'critical': return 'text-red-400'
    case 'warning': return 'text-amber-400'
    case 'info': return 'text-blue-400'
    default: return 'text-slate-400'
  }
}

function alertLevelBg(level: string) {
  switch (level) {
    case 'critical': return 'bg-red-500/15 border-red-500/30'
    case 'warning': return 'bg-amber-500/15 border-amber-500/30'
    case 'info': return 'bg-blue-500/15 border-blue-500/30'
    default: return 'bg-slate-500/15 border-slate-500/30'
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case '环境预警': return <Thermometer className="h-3.5 w-3.5" />
    case '设备故障': return <Wrench className="h-3.5 w-3.5" />
    case '用药提醒': return <Pill className="h-3.5 w-3.5" />
    case '出栏锁定': return <Shield className="h-3.5 w-3.5" />
    case '系统通知': return <Info className="h-3.5 w-3.5" />
    default: return <AlertTriangle className="h-3.5 w-3.5" />
  }
}

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function scoreRingColor(score: number) {
  if (score >= 90) return 'stroke-emerald-500'
  if (score >= 70) return 'stroke-amber-500'
  return 'stroke-red-500'
}

function metricStatus(value: number, type: 'temp' | 'humidity' | 'ammonia' | 'co2') {
  switch (type) {
    case 'temp': return value >= 20 && value <= 26 ? 'text-emerald-400' : 'text-amber-400'
    case 'humidity': return value >= 50 && value <= 70 ? 'text-emerald-400' : 'text-amber-400'
    case 'ammonia': return value <= 15 ? 'text-emerald-400' : value <= 25 ? 'text-amber-400' : 'text-red-400'
    case 'co2': return value <= 800 ? 'text-emerald-400' : value <= 1500 ? 'text-amber-400' : 'text-red-400'
    default: return 'text-slate-300'
  }
}

/* ---------- score ring component ---------- */

function ScoreRing({ score, size = 80, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-700/60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={cn(scoreRingColor(score), 'transition-all duration-1000 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-xl font-bold tabular-nums', scoreColor(score))}>
          {score}
        </span>
        <span className="text-[9px] text-slate-500">评分</span>
      </div>
    </div>
  )
}

/* ---------- KPI card ---------- */

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-sm hover:border-slate-700/60 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10">
            <Icon className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <span className="text-xs text-slate-400 font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
        {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
        {children}
      </CardContent>
    </Card>
  )
}

/* ---------- house card ---------- */

function HouseCard({ house }: { house: House }) {
  return (
    <Card className={cn('bg-slate-900/60 backdrop-blur-sm transition-colors border-t-2', statusBorderColor(house.status))}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-sm font-semibold text-white">{house.name}</CardTitle>
          </div>
          <Badge variant="outline" className={cn('text-[10px] font-medium', statusColor(house.status))}>
            {house.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {/* Batch info */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-400">
          {house.batchNo ? (
            <>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {house.batchNo}
              </span>
              <span className="text-slate-600">|</span>
              <span>{house.breed}</span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Bird className="h-3 w-3" />
                {house.birds.toLocaleString()}只
              </span>
              <span className="text-slate-600">|</span>
              <span>{house.age}日龄</span>
            </>
          ) : (
            <span className="text-slate-500">暂无在养批次</span>
          )}
        </div>

        {/* Environment metrics 2x2 grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
              <Thermometer className="h-3 w-3" />
              温度
            </div>
            <span className={cn('text-sm font-semibold tabular-nums', metricStatus(house.temperature, 'temp'))}>
              {house.temperature}°C
            </span>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
              <Droplets className="h-3 w-3" />
              湿度
            </div>
            <span className={cn('text-sm font-semibold tabular-nums', metricStatus(house.humidity, 'humidity'))}>
              {house.humidity}%
            </span>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
              <Wind className="h-3 w-3" />
              氨气
            </div>
            <span className={cn('text-sm font-semibold tabular-nums', metricStatus(house.ammonia, 'ammonia'))}>
              {house.ammonia} ppm
            </span>
          </div>
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
              <Cloud className="h-3 w-3" />
              CO₂
            </div>
            <span className={cn('text-sm font-semibold tabular-nums', metricStatus(house.co2, 'co2'))}>
              {house.co2} ppm
            </span>
          </div>
        </div>

        {/* Feed today */}
        <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-1.5">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            今日饲喂
          </span>
          <span className="text-xs font-semibold text-cyan-400 tabular-nums">
            {house.feedToday > 0 ? `${house.feedToday} kg` : '--'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- main component ---------- */

export function MonitorScreen() {
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(30)
  const [currentTime, setCurrentTime] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const alertEndRef = useRef<HTMLDivElement>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/monitor')
      const json = await res.json()
      setData(json)
      setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('Failed to fetch monitor data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (loading) return

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [loading, fetchData])

  // Real-time clock
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekDay = weekDays[now.getDay()]
      setCurrentTime(`${year}年${month}月${day}日 ${weekDay} ${h}:${m}:${s}`)
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll alerts
  useEffect(() => {
    if (alertEndRef.current) {
      alertEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [data?.alerts])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-6 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48 bg-slate-800" />
          <Skeleton className="h-6 w-32 bg-slate-800" />
          <Skeleton className="h-8 w-20 bg-slate-800" />
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-slate-800/60" />
          ))}
        </div>
        {/* Middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 rounded-xl bg-slate-800/60 lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl bg-slate-800/60" />
        </div>
        {/* Bottom row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl bg-slate-800/60" />
          ))}
        </div>
      </div>
    )
  }

  const { farmOverview, houses, alerts, environmentHistory, feedTrend } = data
  const capacityPercent = Math.round((farmOverview.currentInventory / farmOverview.totalCapacity) * 100)
  const mortalityRate = farmOverview.currentInventory > 0 ? ((farmOverview.todayMortality / farmOverview.currentInventory) * 100).toFixed(3) : '0'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* === Top Bar === */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Left: Farm name */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/20">
              <Monitor className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {farmOverview.name}
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">实时监控大屏 · 智慧养殖管理平台</p>
            </div>
          </div>

          {/* Center: Live clock */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-lg font-bold tabular-nums text-slate-200 tracking-wider">
              {currentTime.split(' ').pop()}
            </span>
            <span className="text-[10px] text-slate-500">
              {currentTime.split(' ').slice(0, -1).join(' ')}
            </span>
          </div>

          {/* Right: Score + controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Environment score */}
            <div className="hidden sm:flex items-center gap-2">
              <ScoreRing score={farmOverview.environmentScore} size={44} strokeWidth={4} />
            </div>

            {/* Refresh indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <RefreshCw className={cn('h-3 w-3', countdown <= 5 && 'animate-spin text-cyan-400')} />
              <span className="hidden sm:inline tabular-nums">{countdown}s</span>
            </div>

            {/* Last update */}
            <span className="hidden lg:inline text-[10px] text-slate-600">
              更新于 {lastUpdate}
            </span>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              aria-label={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* === Main Content === */}
      <main className="p-3 md:p-4 lg:p-6 space-y-4">
        {/* --- KPI Row --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total inventory */}
          <KpiCard
            icon={Bird}
            label="总存栏量"
            value={farmOverview.currentInventory.toLocaleString()}
            sub={`总容量 ${farmOverview.totalCapacity.toLocaleString()}`}
          >
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">容量使用</span>
                <span className="text-cyan-400 font-medium tabular-nums">{capacityPercent}%</span>
              </div>
              <Progress value={capacityPercent} className="h-1.5 bg-slate-800" />
            </div>
          </KpiCard>

          {/* Active batches */}
          <KpiCard
            icon={Layers}
            label="在养批次"
            value={`${farmOverview.activeBatches} 批`}
            sub="当前进行中"
          >
            <div className="mt-2 space-y-1">
              {houses
                .filter((h) => h.batchNo)
                .map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">{h.id}</span>
                    <span className="text-slate-400 tabular-nums">{h.breed}</span>
                  </div>
                ))}
            </div>
          </KpiCard>

          {/* Today mortality */}
          <KpiCard
            icon={Skull}
            label="今日死淘"
            value={
              <span className="flex items-center gap-1.5">
                {farmOverview.todayMortality}
                <span className="text-xs font-normal text-slate-500">只</span>
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
              </span>
            }
            sub={`死淘率 ${mortalityRate}%`}
          >
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <TrendingDown className="h-3 w-3" />
              较昨日下降 2 只
            </div>
          </KpiCard>

          {/* Environment score */}
          <KpiCard
            icon={Activity}
            label="环境评分"
            value={
              <span className="flex items-center gap-2">
                {farmOverview.environmentScore}
                <span className="text-xs font-normal text-slate-500">分</span>
              </span>
            }
            sub="综合环境评估"
          >
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              环境状态优秀
            </div>
          </KpiCard>
        </div>

        {/* --- Middle Row: Chart + Alerts --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Temperature trend chart */}
          <Card className="lg:col-span-2 bg-slate-900/60 border-slate-800/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-cyan-400" />
                  <CardTitle className="text-sm font-semibold text-white">24小时温度趋势</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-800/60 text-slate-400 border-slate-700/60">
                  实时数据
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <ChartContainer config={envChartConfig} className="h-[260px] sm:h-[280px] w-full">
                <AreaChart data={environmentHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradA1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradA2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradB1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradB2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(v: number) => `${v}°`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `时间: ${label}`}
                        formatter={(value, name) => (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span>{value}°C</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent nameKey="value" className="text-[10px]" />} />
                  <Area type="monotone" dataKey="A1" stroke="#22c55e" fill="url(#gradA1)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="A2" stroke="#3b82f6" fill="url(#gradA2)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="B1" stroke="#f59e0b" fill="url(#gradB1)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="B2" stroke="#a855f7" fill="url(#gradB2)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Alert feed */}
          <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-sm font-semibold text-white">预警动态</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                  {alerts.length} 条
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <ScrollArea className="h-[244px] sm:h-[264px]">
                <div className="space-y-2.5 pr-3">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        alertLevelBg(alert.level)
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn('mt-0.5 shrink-0', alertLevelColor(alert.level))}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-medium text-slate-400">{alert.type}</span>
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] px-1 py-0', statusColor(
                                alert.level === 'critical' ? '关注' : alert.level === 'warning' ? '关注' : '正常'
                              ))}
                            >
                              {alert.level === 'critical' ? '紧急' : alert.level === 'warning' ? '警告' : '信息'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={alertEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* --- Feed trend + House cards row --- */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 md:gap-4">
          {/* Feed trend (spans 1 col on xl) */}
          <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm font-semibold text-white">7日饲料消耗</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <ChartContainer config={feedChartConfig} className="h-[180px] w-full">
                <AreaChart data={feedTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFeed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `日期: ${label}`}
                        formatter={(value) => (
                          <div className="text-[11px]">{value} kg</div>
                        )}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="url(#gradFeed)" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }} />
                </AreaChart>
              </ChartContainer>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>日均: {Math.round(feedTrend.reduce((s, d) => s + d.value, 0) / feedTrend.length).toLocaleString()} kg</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +3.2%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* House cards (span 3 cols on xl) */}
          <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {houses.map((house) => (
              <HouseCard key={house.id} house={house} />
            ))}
          </div>
        </div>
      </main>

      {/* === Footer === */}
      <footer className="border-t border-slate-800/40 py-3 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-600">
          <span>极境智牧 · 智慧养殖管理平台 · 数据大屏</span>
          <span>数据每30秒自动刷新 · {currentTime}</span>
        </div>
      </footer>
    </div>
  )
}
