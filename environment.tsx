'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Sun,
  Snowflake,
  Fan,
  Power,
  Settings,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Radio,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealtime, type EnvUpdate } from '@/hooks/use-realtime'

interface HouseOption {
  id: string
  name: string
}

interface CurrentValue {
  houseId: string
  houseName: string
  temperature: number | null
  humidity: number | null
  ammonia: number | null
  co2: number | null
  windSpeed: number | null
  updatedAt: string | null
}

interface EnvStats {
  avgTemperature: number | null
  avgHumidity: number | null
  maxAmmonia: number | null
  maxCO2: number | null
  recordCount: number
}

interface HistoryRecord {
  id: string
  houseId: string
  houseName: string
  temperature: number
  humidity: number
  ammonia: number
  co2: number
  windSpeed: number | null
  timestamp: string
}

interface EnvData {
  range: string
  currentValues: CurrentValue[]
  stats: EnvStats
  records: HistoryRecord[]
}

// Device list (mock - no real-time API)
const devices = [
  { name: '温湿度传感器-A1-01', house: 'A1栋', status: 'online', lastUpdate: '实时' },
  { name: '温湿度传感器-A2-01', house: 'A2栋', status: 'online', lastUpdate: '实时' },
  { name: '温湿度传感器-B1-01', house: 'B1栋', status: 'offline', lastUpdate: '2小时前' },
  { name: '氨气检测器-A1-01', house: 'A1栋', status: 'online', lastUpdate: '实时' },
  { name: '氨气检测器-A2-01', house: 'A2栋', status: 'online', lastUpdate: '实时' },
  { name: '监控摄像头-A1-01', house: 'A1栋', status: 'online', lastUpdate: '实时' },
  { name: '监控摄像头-A2-01', house: 'A2栋', status: 'online', lastUpdate: '实时' },
  { name: '通风风机-B1-01', house: 'B1栋', status: 'offline', lastUpdate: '2小时前' },
]

// Weather forecast (mock)
const weatherForecast = [
  { day: '今天', icon: Sun, temp: '-5°C ~ 8°C', desc: '晴' },
  { day: '明天', icon: Cloud, temp: '-8°C ~ 5°C', desc: '多云' },
  { day: '后天', icon: Snowflake, temp: '-12°C ~ -2°C', desc: '小雪' },
]

const chartConfig = {
  temp: { label: '温度 (°C)', color: 'oklch(0.65 0.20 25)' },
  hum: { label: '湿度 (%)', color: 'oklch(0.55 0.15 200)' },
  nh3: { label: '氨气 (ppm)', color: 'oklch(0.55 0.15 145)' },
  co2: { label: 'CO₂ (ppm)', color: 'oklch(0.60 0.15 300)' },
}

// Fallback mock data for charts when API returns empty
function generateFallbackChartData(range: string): Array<{ time: string; temp: number; hum: number; nh3: number; co2: number }> {
  const now = new Date()
  const points = range === '24h' ? 24 : range === '7d' ? 42 : 30
  const data: Array<{ time: string; temp: number; hum: number; nh3: number; co2: number }> = []

  for (let i = points - 1; i >= 0; i--) {
    let timestamp: Date
    let time: string
    if (range === '24h') {
      timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      time = `${String(timestamp.getHours()).padStart(2, '0')}:00`
    } else if (range === '7d') {
      timestamp = new Date(now.getTime() - i * 4 * 60 * 60 * 1000)
      time = `${String(timestamp.getMonth() + 1).padStart(2, '0')}/${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:00`
    } else {
      timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      time = `${String(timestamp.getMonth() + 1).padStart(2, '0')}/${String(timestamp.getDate()).padStart(2, '0')}`
    }

    const hourOfDay = timestamp.getHours()
    const dayNightOffset = Math.sin((hourOfDay - 6) * Math.PI / 12) * 2.5
    const dayFactor = range === '30d' ? Math.sin(i * 0.2) * 1.5 : 0

    data.push({
      time,
      temp: Math.round((23.5 + dayNightOffset + dayFactor + (Math.random() - 0.5) * 2) * 10) / 10,
      hum: Math.round((62 + (Math.random() - 0.5) * 8) * 10) / 10,
      nh3: Math.round((14 + (Math.random() - 0.5) * 6) * 10) / 10,
      co2: Math.round((750 + (Math.random() - 0.5) * 200)),
    })
  }
  return data
}

type SensorStatus = 'normal' | 'warning' | 'danger'

function getSensorStatus(value: number | null, optimalMin: number, optimalMax: number, dangerMin?: number, dangerMax?: number): SensorStatus {
  if (value === null) return 'normal'
  if (dangerMin !== undefined && value < dangerMin) return 'danger'
  if (dangerMax !== undefined && value > dangerMax) return 'danger'
  if (value < optimalMin || value > optimalMax) return 'warning'
  return 'normal'
}

function getStatusColor(status: SensorStatus) {
  switch (status) {
    case 'normal': return 'text-green-600'
    case 'warning': return 'text-yellow-600'
    case 'danger': return 'text-red-600'
  }
}

function getStatusBg(status: SensorStatus) {
  switch (status) {
    case 'normal': return 'bg-green-50 border-green-200'
    case 'warning': return 'bg-yellow-50 border-yellow-200'
    case 'danger': return 'bg-red-50 border-red-200'
  }
}

function getStatusIcon(status: SensorStatus) {
  switch (status) {
    case 'normal': return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'danger': return <XCircle className="h-4 w-4 text-red-600" />
  }
}

function getDeviceStatusIcon(status: string) {
  switch (status) {
    case 'online': return <Wifi className="h-4 w-4 text-green-600" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />
    default: return <Wifi className="h-4 w-4 text-muted-foreground" />
  }
}

function getDeviceStatusText(status: string) {
  switch (status) {
    case 'online': return '在线'
    case 'warning': return '异常'
    case 'offline': return '离线'
    default: return '未知'
  }
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

type SensorSize = 'sm' | 'md' | 'lg'

interface SensorCardProps {
  value: number | null
  unit: string
  min: number
  max: number
  optimalMin: number
  optimalMax: number
  dangerMin?: number
  dangerMax?: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  updatedAt: string | null
  size?: SensorSize
}

const sizeConfig = {
  sm: { container: 'w-16 h-16', svgViewBox: '0 0 64 64', cx: 32, radius: 25, strokeWidth: 4, valueClass: 'text-sm font-bold', unitClass: 'text-[8px]' },
  md: { container: 'w-24 h-24', svgViewBox: '0 0 96 96', cx: 48, radius: 38, strokeWidth: 6, valueClass: 'text-xl font-bold', unitClass: 'text-[9px]' },
  lg: { container: 'w-32 h-32', svgViewBox: '0 0 128 128', cx: 64, radius: 52, strokeWidth: 8, valueClass: 'text-3xl font-bold', unitClass: 'text-xs' },
}

function SensorCard({ value, unit, min, max, optimalMin, optimalMax, dangerMin, dangerMax, label, icon: Icon, loading, updatedAt, size = 'md' }: SensorCardProps) {
  const status = getSensorStatus(value, optimalMin, optimalMax, dangerMin, dangerMax)
  const percentage = value !== null ? ((value - min) / (max - min)) * 100 : 0
  const inOptimal = value !== null && value >= optimalMin && value <= optimalMax

  const cfg = sizeConfig[size]
  const circumference = 2 * Math.PI * cfg.radius
  const strokeDashoffset = circumference - (inOptimal ? circumference * 0.8 : circumference * (percentage / 100))
  const strokeColor = inOptimal ? 'oklch(0.55 0.15 145)' : status === 'warning' ? 'oklch(0.75 0.18 85)' : 'oklch(0.65 0.20 25)'

  return (
    <Card className={`${getStatusBg(status)} border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${getStatusColor(status)}`} />
            <span className="text-sm font-medium">{label}</span>
          </div>
          {/* Pulsing status dot */}
          <div className="relative flex items-center justify-center">
            <span className={`absolute h-3 w-3 rounded-full ${inOptimal ? 'bg-emerald-400/50' : status === 'warning' ? 'bg-yellow-400/50' : 'bg-red-400/50'} animate-ping`} />
            <span className={`relative h-2 w-2 rounded-full ${inOptimal ? 'bg-emerald-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
          </div>
        </div>
        {/* Circular progress + value */}
        <div className="flex items-center gap-4 mb-3">
          <div className={`relative ${cfg.container} flex-shrink-0`}>
            <svg className={`${cfg.container} -rotate-90`} viewBox={cfg.svgViewBox}>
              <circle cx={cfg.cx} cy={cfg.cx} r={cfg.radius} fill="none" className="stroke-muted" strokeWidth={cfg.strokeWidth} />
              <circle
                cx={cfg.cx} cy={cfg.cx} r={cfg.radius} fill="none"
                stroke={strokeColor}
                strokeWidth={cfg.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <Skeleton className="h-6 w-10" />
              ) : (
                <>
                  <span className={`${cfg.valueClass} leading-none`}>{value !== null ? value : '--'}</span>
                  <span className={`${cfg.unitClass} text-muted-foreground mt-0.5`}>{unit}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">适宜范围</span>
                <span className="font-medium text-primary">{optimalMin}-{optimalMax}{unit}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">当前范围</span>
                <span className={inOptimal ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  {value === null ? '--' : inOptimal ? '✓ 适宜' : '⚠ 偏离'}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">量程</span>
                <span className="text-muted-foreground">{min}-{max}{unit}</span>
              </div>
            </div>
          </div>
        </div>
        {updatedAt && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {formatTimestamp(updatedAt)}
            </span>
            <span className={`text-[10px] font-medium ${inOptimal ? 'text-green-600' : 'text-amber-600'}`}>
              {inOptimal ? '正常' : status === 'warning' ? '注意' : '异常'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Environment() {
  const { toast } = useToast()
  const [houses, setHouses] = useState<HouseOption[]>([])
  const [selectedHouse, setSelectedHouse] = useState<string>('all')
  const [controlMode, setControlMode] = useState<'auto' | 'manual'>('auto')
  const [envData, setEnvData] = useState<EnvData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [flash, setFlash] = useState(false)
  const prevEnvDataRef = useRef<EnvData | null>(null)
  const realtimeUpdateRef = useRef<EnvUpdate[]>([])

  // --- WebSocket realtime integration ---
  const { connected: wsConnected, latestEnvUpdate } = useRealtime(
    useCallback((data) => {
      // Buffer env updates for applying to current data
      realtimeUpdateRef.current = data.envUpdates
      setFlash(true)
      setLastUpdate(new Date())
      const timer = setTimeout(() => setFlash(false), 1500)
      return () => clearTimeout(timer)
    }, []),
    { enabled: realtimeEnabled }
  )

  // When WebSocket env-update arrives, merge into envData without full API reload
  useEffect(() => {
    if (!latestEnvUpdate || !envData) return
    setEnvData(prev => {
      if (!prev) return prev
      const update = latestEnvUpdate
      const updatedValues = prev.currentValues.map(cv => {
        if (cv.houseName === update.houseName) {
          return {
            ...cv,
            temperature: update.temperature,
            humidity: update.humidity,
            ammonia: update.ammonia,
            co2: update.co2,
            updatedAt: update.timestamp,
          }
        }
        return cv
      })
      // Recompute stats from updated values
      const temps = updatedValues.filter(v => v.temperature !== null).map(v => v.temperature!)
      const hums = updatedValues.filter(v => v.humidity !== null).map(v => v.humidity!)
      const amms = updatedValues.filter(v => v.ammonia !== null).map(v => v.ammonia!)
      const co2s = updatedValues.filter(v => v.co2 !== null).map(v => v.co2!)
      const newStats: EnvStats = {
        avgTemperature: temps.length > 0 ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : prev.stats.avgTemperature,
        avgHumidity: hums.length > 0 ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : prev.stats.avgHumidity,
        maxAmmonia: amms.length > 0 ? Math.max(...amms) : prev.stats.maxAmmonia,
        maxCO2: co2s.length > 0 ? Math.max(...co2s) : prev.stats.maxCO2,
        recordCount: prev.stats.recordCount + 1,
      }
      return { ...prev, currentValues: updatedValues, stats: newStats }
    })
  }, [latestEnvUpdate, envData])

  // When WebSocket connects, disable auto-refresh (redundant)
  useEffect(() => {
    if (wsConnected && autoRefresh) {
      setAutoRefresh(false)
    }
  }, [wsConnected, autoRefresh])

  // Connection status label
  const realtimeStatus = useMemo(() => {
    if (realtimeEnabled && wsConnected) return 'connected'
    if (realtimeEnabled && !wsConnected) return 'connecting'
    return 'off'
  }, [realtimeEnabled, wsConnected])

  // Fetch houses from DB
  const fetchHouses = useCallback(async () => {
    try {
      const res = await fetch('/api/batches')
      if (!res.ok) return
      const data = await res.json()
      // Extract unique houses from batches
      const houseSet = new Map<string, string>()
      ;(data.batches || []).forEach((b: { houseName: string }) => {
        if (b.houseName) houseSet.set(b.houseName, b.houseName)
      })
      setHouses(Array.from(houseSet.entries()).map(([id, name]) => ({ id, name })))
    } catch {
      // Use defaults
    }
  }, [])

  useEffect(() => {
    fetchHouses()
  }, [fetchHouses])

  // Use static house list from seed data
  const allHouses: HouseOption[] = [
    { id: 'A1', name: 'A1栋' },
    { id: 'A2', name: 'A2栋' },
    { id: 'B1', name: 'B1栋' },
    { id: 'B2', name: 'B2栋' },
  ]

  // Map house selector value to query param (need actual house ID)
  // The environment API uses houseId which is the DB house ID, not the name
  // Since we can't easily get the house ID from the name, we'll use the houses from envData.currentValues
  const getHouseIdFromName = useCallback((name: string) => {
    if (name === 'all') return undefined
    const current = envData?.currentValues.find(v => v.houseName === name)
    return current?.houseId
  }, [envData])

  const fetchEnvData = useCallback(async (houseId?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('range', range)
      if (houseId) params.set('houseId', houseId)

      const res = await fetch(`/api/environment?${params.toString()}`)
      if (!res.ok) throw new Error('获取环境数据失败')
      const data = await res.json()
      setEnvData(data)
    } catch (err) {
      console.error('Failed to fetch env data:', err)
      toast({
        title: '加载失败',
        description: '获取环境数据失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [range, toast])

  useEffect(() => {
    if (selectedHouse === 'all') {
      fetchEnvData()
    } else {
      const houseId = getHouseIdFromName(selectedHouse)
      fetchEnvData(houseId)
    }
  }, [selectedHouse, range, fetchEnvData, getHouseIdFromName])

  // Auto-refresh countdown timer
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (document.hidden) return
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger refresh when countdown reaches 0
          if (selectedHouse === 'all') {
            fetchEnvData()
          } else {
            const houseId = getHouseIdFromName(selectedHouse)
            fetchEnvData(houseId)
          }
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedHouse, fetchEnvData, getHouseIdFromName])

  // Track last update and flash when data changes
  useEffect(() => {
    if (envData && prevEnvDataRef.current) {
      setFlash(true)
      setLastUpdate(new Date())
      const timer = setTimeout(() => setFlash(false), 1500)
      return () => clearTimeout(timer)
    } else if (envData) {
      setLastUpdate(new Date())
    }
    prevEnvDataRef.current = envData
  }, [envData])

  // Get current values for the selected house
  const currentValues: CurrentValue | null = (() => {
    if (!envData) return null
    if (selectedHouse === 'all') {
      // Average of all houses
      const vals = envData.currentValues
      if (vals.length === 0) return null
      return {
        houseId: 'all',
        houseName: '全部鸡舍',
        temperature: vals.reduce((s, v) => s + (v.temperature ?? 0), 0) / vals.filter(v => v.temperature !== null).length || null,
        humidity: vals.reduce((s, v) => s + (v.humidity ?? 0), 0) / vals.filter(v => v.humidity !== null).length || null,
        ammonia: vals.reduce((s, v) => s + (v.ammonia ?? 0), 0) / vals.filter(v => v.ammonia !== null).length || null,
        co2: vals.reduce((s, v) => s + (v.co2 ?? 0), 0) / vals.filter(v => v.co2 !== null).length || null,
        windSpeed: null,
        updatedAt: vals.reduce((latest, v) => {
          if (!v.updatedAt) return latest
          if (!latest) return v.updatedAt
          return new Date(v.updatedAt) > new Date(latest) ? v.updatedAt : latest
        }, null as string | null),
      }
    }
    return envData.currentValues.find(v => v.houseName === selectedHouse) || null
  })()

  // Chart data from records (with fallback when API returns empty)
  const chartData = useMemo(() => {
    if (!envData || envData.records.length === 0) {
      return generateFallbackChartData(range)
    }
    let records = envData.records
    if (selectedHouse !== 'all') {
      records = records.filter(r => r.houseName === selectedHouse)
    }
    if (records.length === 0) {
      return generateFallbackChartData(range)
    }
    // Sample data to prevent overcrowding
    const maxPoints = range === '24h' ? 96 : range === '7d' ? 168 : 180
    let sampled = records
    if (records.length > maxPoints) {
      const step = Math.ceil(records.length / maxPoints)
      sampled = records.filter((_, i) => i % step === 0)
    }
    return sampled.map(r => {
      const d = new Date(r.timestamp)
      let time: string
      if (range === '24h') {
        time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      } else if (range === '7d') {
        time = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`
      } else {
        time = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      }
      return {
        time,
        temp: Math.round(r.temperature * 10) / 10,
        hum: Math.round(r.humidity * 10) / 10,
        nh3: Math.round(r.ammonia * 10) / 10,
        co2: Math.round(r.co2),
      }
    })
  }, [envData, range, selectedHouse])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">环境智控</h1>
          <p className="text-muted-foreground text-sm mt-1">
            实时环境监控与智能调控
            {autoRefresh && (
              <span className="ml-2">
                · 最后更新 {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Realtime WebSocket toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200/50 bg-emerald-50/30 px-3 py-1.5">
            <Switch
              checked={realtimeEnabled}
              onCheckedChange={(checked) => {
                setRealtimeEnabled(checked)
                if (!checked) {
                  // When turning off realtime, revert to normal refresh
                  realtimeUpdateRef.current = []
                }
              }}
              aria-label="实时连接开关"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              <Radio className={`h-3 w-3 inline mr-1 ${realtimeEnabled && wsConnected ? 'text-emerald-600' : ''}`} />
              实时连接
            </span>
            {realtimeStatus === 'connected' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 border-emerald-200">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                实时
              </Badge>
            )}
            {realtimeStatus === 'connecting' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                连接中
              </Badge>
            )}
          </div>
          {/* Auto-refresh toggle (hidden when realtime is active) */}
          {!realtimeEnabled && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200/50 bg-emerald-50/30 px-3 py-1.5">
            <Switch
              checked={autoRefresh}
              onCheckedChange={(checked) => {
                setAutoRefresh(checked)
                setCountdown(30)
              }}
              aria-label="自动刷新开关"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              <RefreshCw className={`h-3 w-3 inline mr-1 ${autoRefresh ? 'animate-spin text-emerald-600' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : undefined} />
              自动刷新
            </span>
            {autoRefresh && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono tabular-nums">
                {countdown}s
                <span className="ml-1 inline-block w-3 h-3">
                  <svg className="w-3 h-3 -rotate-90" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="4" fill="none" className="stroke-muted" strokeWidth="2" />
                    <circle cx="6" cy="6" r="4" fill="none" className="stroke-emerald-500" strokeWidth="2" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 4}`}
                      strokeDashoffset={`${2 * Math.PI * 4 * (1 - countdown / 30)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                </span>
              </Badge>
            )}
          </div>
          )}
          <Select value={selectedHouse} onValueChange={setSelectedHouse}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="选择鸡舍" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部鸡舍</SelectItem>
              {allHouses.map(h => (
                <SelectItem key={h.id} value={h.name}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant={controlMode === 'auto' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setControlMode('auto')}>
            <Settings className="h-3 w-3 mr-1" />
            自动模式
          </Badge>
          <Badge variant={controlMode === 'manual' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setControlMode('manual')}>
            手动模式
          </Badge>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-300 ${flash ? 'ring-2 ring-green-400/50 rounded-lg' : ''}`}>
        <SensorCard
          value={currentValues?.temperature ?? null}
          unit="°C"
          min={15}
          max={35}
          optimalMin={22}
          optimalMax={26}
          dangerMin={18}
          dangerMax={32}
          label="温度"
          icon={Thermometer}
          loading={loading}
          updatedAt={currentValues?.updatedAt ?? null}
          size="lg"
        />
        <SensorCard
          value={currentValues?.humidity ?? null}
          unit="%"
          min={30}
          max={90}
          optimalMin={55}
          optimalMax={70}
          label="湿度"
          icon={Droplets}
          loading={loading}
          updatedAt={currentValues?.updatedAt ?? null}
          size="lg"
        />
        <SensorCard
          value={currentValues?.ammonia ?? null}
          unit="ppm"
          min={0}
          max={40}
          optimalMin={0}
          optimalMax={20}
          dangerMax={30}
          label="氨气浓度"
          icon={Wind}
          loading={loading}
          updatedAt={currentValues?.updatedAt ?? null}
          size="md"
        />
        <SensorCard
          value={currentValues?.co2 ?? null}
          unit="ppm"
          min={0}
          max={3000}
          optimalMin={0}
          optimalMax={1500}
          dangerMax={2500}
          label="CO₂浓度"
          icon={Cloud}
          loading={loading}
          updatedAt={currentValues?.updatedAt ?? null}
          size="sm"
        />
      </div>

      {/* Trend Chart & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">环境趋势{selectedHouse !== 'all' ? ` - ${selectedHouse}` : ' - 全部鸡舍'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="inline-flex rounded-lg border p-1 bg-muted/50 gap-1">
                {([
                  { value: '24h', label: '24小时' },
                  { value: '7d', label: '7天' },
                  { value: '30d', label: '30天' },
                ] as const).map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setRange(tab.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      range === tab.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {loading && chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="time" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="temp" stroke="oklch(0.65 0.20 25)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hum" stroke="oklch(0.55 0.15 200)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="nh3" stroke="oklch(0.55 0.15 145)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Right Panel: Weather + Control */}
        <div className="space-y-4">
          {/* Stats */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-primary" />
                统计数据
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !envData ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : envData ? (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors duration-500 ${flash ? 'bg-green-50 border-green-200' : ''}`}>
                    <span className="text-xs text-muted-foreground">平均温度</span>
                    <span className={`text-sm font-bold ${flash ? 'text-green-600' : ''}`}>{envData.stats.avgTemperature !== null ? envData.stats.avgTemperature + '°C' : '--'}</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors duration-500 ${flash ? 'bg-green-50 border-green-200' : ''}`}>
                    <span className="text-xs text-muted-foreground">平均湿度</span>
                    <span className={`text-sm font-bold ${flash ? 'text-green-600' : ''}`}>{envData.stats.avgHumidity !== null ? envData.stats.avgHumidity + '%' : '--'}</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors duration-500 ${flash ? 'bg-green-50 border-green-200' : ''}`}>
                    <span className="text-xs text-muted-foreground">最高氨气</span>
                    <span className={`text-sm font-bold ${envData.stats.maxAmmonia && envData.stats.maxAmmonia > 20 ? 'text-red-600' : 'text-green-600'}`}>
                      {envData.stats.maxAmmonia !== null ? envData.stats.maxAmmonia + 'ppm' : '--'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors duration-500 ${flash ? 'bg-green-50 border-green-200' : ''}`}>
                    <span className="text-xs text-muted-foreground">最高CO₂</span>
                    <span className={`text-sm font-bold ${envData.stats.maxCO2 && envData.stats.maxCO2 > 1500 ? 'text-red-600' : 'text-green-600'}`}>
                      {envData.stats.maxCO2 !== null ? envData.stats.maxCO2.toLocaleString() + 'ppm' : '--'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg border transition-colors duration-500 ${flash ? 'bg-green-50 border-green-200' : ''}`}>
                    <span className="text-xs text-muted-foreground">数据记录数</span>
                    <span className={`text-sm font-bold ${flash ? 'text-green-600' : ''}`}>{envData.stats.recordCount.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Weather */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                天气预报
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weatherForecast.map((w) => (
                  <div key={w.day} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <w.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{w.day}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{w.temp}</p>
                      <p className="text-[10px] text-muted-foreground">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Smart Control */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Fan className="h-4 w-4 text-primary" />
                智能控制
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Fan className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">通风系统</p>
                    <p className="text-[10px] text-muted-foreground">A1栋</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Power className="h-3 w-3 mr-1" />
                  运行中
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">供暖系统</p>
                    <p className="text-[10px] text-muted-foreground">全部鸡舍</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Power className="h-3 w-3 mr-1" />
                  待机
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-teal-500" />
                  <div>
                    <p className="text-sm font-medium">水帘降温</p>
                    <p className="text-[10px] text-muted-foreground">A2栋</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Power className="h-3 w-3 mr-1" />
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Device Status */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            设备状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {devices.map((device) => (
              <div
                key={device.name}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{device.name}</p>
                  <p className="text-[10px] text-muted-foreground">{device.house}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  {getDeviceStatusIcon(device.status)}
                  <span className="text-[10px] text-muted-foreground mt-1">{device.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
