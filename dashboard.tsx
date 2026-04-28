'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Bar,
  BarChart,
} from 'recharts'
import { motion } from 'framer-motion'
import { useCountUp } from '@/lib/animations'
import {
  Bird,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Loader2,
  Utensils,
  Sun,
  Clock,
  MapPin,
  Server,
  Wrench,
  CloudSun,
  Brain,
  Eye,
  Ear,
  HeartPulse,
  Wifi,
  Plus,
  Pill,
  Download,
  Syringe,
  ShieldAlert,
  ClipboardList,
  Settings,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

// ===== Maintenance schedule: every 7 days from base date =====
function getMaintenanceInfo(): string {
  const base = new Date(2026, 3, 20, 2, 0, 0).getTime() // 2026-04-20 02:00
  const now = Date.now()
  const cycle = 7 * 24 * 60 * 60 * 1000 // 7 days
  const elapsed = now - base
  const cycles = Math.floor(elapsed / cycle)
  const lastMaint = new Date(base + cycles * cycle)
  const nextMaint = new Date(base + (cycles + 1) * cycle)
  const fmt = (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    return `${m}-${day} ${h}:00`
  }
  const daysLeft = Math.ceil((nextMaint.getTime() - now) / (24 * 60 * 60 * 1000))
  return `上次维护: ${fmt(lastMaint)} · 下次: ${fmt(nextMaint)}（${daysLeft}天后）`
}

// ===== Animation Variants =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

interface DashboardData {
  totalInventory: number
  activeBatches: number
  todayAlerts: number
  envComplianceRate: number
  recentAlerts: Array<{
    id: string
    type: string
    level: string
    title: string
    message: string
    status: string
    createdAt: string
  }>
  batchOverview: Array<{
    id: string
    batchNo: string
    breed: string
    quantity: number
    status: string
    houseName: string
    mortalityRate: number
    startDate: string
    expectedEndDate: string
  }>
  weeklyStats: {
    totalMortality: number
    avgAmmonia: number
    totalFeedCost: number
    avgWeight: number
  }
  // NEW data
  environmentTrend: Array<{
    date: string
    temperature: number
    humidity: number
    ammonia: number
    co2: number
  }>
  batchProduction: Array<{
    batchNo: string
    breed: string
    houseName: string
    daysSinceStart: number
    totalDays: number
    progress: number
    currentQuantity: number
    estimatedWeight: number
    fcr: number
    stage: string
  }>
  recentActivities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    detail: string
  }>
  weeklyComparison: {
    mortality: { thisWeek: number; lastWeek: number; unit: string; trend: string; change: number }
    feed: { thisWeek: number; lastWeek: number; unit: string; trend: string; change: number }
    medicineCost: { thisWeek: number; lastWeek: number; unit: string; trend: string; change: number }
    envRate: { thisWeek: number; lastWeek: number; unit: string; trend: string; change: number }
  }
  feedWater: {
    todayFeedTon: number
    todayWaterM3: number
    yesterdayFeedTon: number
    yesterdayWaterM3: number
    avgDays: number
    totalInventory: number
    formula: string
    details: Array<{
      batchNo: string
      breed: string
      daysSinceStart: number
      currentQuantity: number
      waterMl: number
      waterL: number
      feedG: number
      feedKg: number
    }>
  }
}

interface EnvData {
  current: {
    temperature: number
    humidity: number
    ammonia: number
    co2: number
  }
  history: Array<{
    time: string
    temperature: number
    humidity: number
    ammonia: number
    co2: number
  }>
}

const defaultEnvData: EnvData = {
  current: { temperature: 24.5, humidity: 62, ammonia: 15, co2: 850 },
  history: [
    { time: '00:00', temperature: 22.1, humidity: 65, ammonia: 12, co2: 780 },
    { time: '02:00', temperature: 21.5, humidity: 66, ammonia: 11, co2: 750 },
    { time: '04:00', temperature: 20.8, humidity: 68, ammonia: 10, co2: 720 },
    { time: '06:00', temperature: 21.2, humidity: 67, ammonia: 11, co2: 760 },
    { time: '08:00', temperature: 23.5, humidity: 62, ammonia: 14, co2: 890 },
    { time: '10:00', temperature: 25.8, humidity: 58, ammonia: 16, co2: 1020 },
    { time: '12:00', temperature: 27.3, humidity: 55, ammonia: 18, co2: 1150 },
    { time: '14:00', temperature: 28.1, humidity: 53, ammonia: 19, co2: 1200 },
    { time: '16:00', temperature: 27.0, humidity: 56, ammonia: 17, co2: 1100 },
    { time: '18:00', temperature: 25.2, humidity: 60, ammonia: 15, co2: 980 },
    { time: '20:00', temperature: 23.8, humidity: 63, ammonia: 13, co2: 870 },
    { time: '22:00', temperature: 22.4, humidity: 65, ammonia: 12, co2: 800 },
  ],
}

const envChartConfig = {
  temperature: { label: '温度 (°C)', color: 'oklch(0.65 0.20 25)' },
  humidity: { label: '湿度 (%)', color: 'oklch(0.55 0.15 250)' },
  ammonia: { label: '氨气 (ppm)', color: 'oklch(0.55 0.15 145)' },
}

const envTrendChartConfig = {
  temperature: { label: '温度 (°C)', color: 'oklch(0.65 0.20 25)' },
  humidity: { label: '湿度 (%)', color: 'oklch(0.55 0.15 250)' },
}

const weeklyData = [
  { day: '周一', 日增重: 45.2, 死淘: 3 },
  { day: '周二', 日增重: 46.8, 死淘: 2 },
  { day: '周三', 日增重: 47.5, 死淘: 1 },
  { day: '周四', 日增重: 44.1, 死淘: 4 },
  { day: '周五', 日增重: 46.3, 死淘: 2 },
  { day: '周六', 日增重: 48.0, 死淘: 1 },
  { day: '周日', 日增重: 45.7, 死淘: 2 },
]

const weeklyChartConfig = {
  日增重: { label: '日增重 (g/只)', color: 'oklch(0.55 0.15 145)' },
  死淘: { label: '死淘 (只)', color: 'oklch(0.65 0.20 25)' },
}

// Mock data: 30-day mortality trend
const mortalityTrendData = [
  { date: '3/1', rate: 1.8 }, { date: '3/2', rate: 1.5 }, { date: '3/3', rate: 2.1 },
  { date: '3/4', rate: 1.9 }, { date: '3/5', rate: 2.3 }, { date: '3/6', rate: 2.0 },
  { date: '3/7', rate: 1.7 }, { date: '3/8', rate: 1.6 }, { date: '3/9', rate: 2.2 },
  { date: '3/10', rate: 2.8 }, { date: '3/11', rate: 3.1 }, { date: '3/12', rate: 2.5 },
  { date: '3/13', rate: 2.0 }, { date: '3/14', rate: 3.8 }, { date: '3/15', rate: 4.5 },
  { date: '3/16', rate: 3.6 }, { date: '3/17', rate: 2.9 }, { date: '3/18', rate: 2.3 },
  { date: '3/19', rate: 1.8 }, { date: '3/20', rate: 1.5 }, { date: '3/21', rate: 1.4 },
  { date: '3/22', rate: 1.6 }, { date: '3/23', rate: 1.3 }, { date: '3/24', rate: 1.2 },
  { date: '3/25', rate: 1.5 }, { date: '3/26', rate: 1.1 }, { date: '3/27', rate: 0.9 },
  { date: '3/28', rate: 0.8 }, { date: '3/29', rate: 1.0 }, { date: '3/30', rate: 1.2 },
]

const mortalityChartConfig = {
  rate: { label: '死淘率 (%)', color: 'oklch(0.65 0.20 25)' },
}

// Mock data: medication cost comparison (6 batches)
const medicationCostData = [
  { batch: '第1批', cost: 4200 },
  { batch: '第2批', cost: 2800 },
  { batch: '第3批', cost: 3600 },
  { batch: '第4批', cost: 2100 },
  { batch: '第5批', cost: 3200 },
  { batch: '第6批', cost: 2500 },
]

const medicationChartConfig = {
  cost: { label: '用药成本 (元)', color: 'oklch(0.55 0.15 145)' },
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function getAlertLevel(level: string) {
  switch (level) {
    case 'critical': return { text: '紧急', color: 'bg-red-500', badge: 'destructive' as const }
    case 'danger': return { text: '紧急', color: 'bg-red-500', badge: 'destructive' as const }
    case 'warning': return { text: '高', color: 'bg-orange-500', badge: 'secondary' as const }
    case 'info': return { text: '一般', color: 'bg-yellow-500', badge: 'outline' as const }
    default: return { text: '低', color: 'bg-blue-500', badge: 'outline' as const }
  }
}

function formatTime(createdAt: string) {
  const date = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

function formatTimeExact(timestamp: string) {
  const d = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getBatchProgress(startDate: string, expectedEndDate: string): number {
  const start = new Date(startDate).getTime()
  const end = expectedEndDate ? new Date(expectedEndDate).getTime() : start + 40 * 86400000
  const now = Date.now()
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

function formatClock(now: Date): string {
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const day = dayNames[now.getDay()]
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${y}年${m}月${d}日 ${day} ${h}:${min}:${s}`
}

function getActivityIcon(type: string) {
  switch (type) {
    case '用药记录': return { icon: Syringe, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-l-violet-500' }
    case '环境预警': return { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' }
    case '批次操作': return { icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-500' }
    case '设备维护': return { icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-l-slate-400' }
    case '日常巡检': return { icon: Search, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' }
    default: return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-l-gray-400' }
  }
}

function getStageColor(stage: string) {
  switch (stage) {
    case 'early': return { bar: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200', label: '前期' }
    case 'mid': return { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '中期' }
    case 'late': return { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: '后期' }
    case 'near-out': return { bar: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-50 text-red-700 border-red-200', label: '待出栏' }
    default: return { bar: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200', label: '前期' }
  }
}

function TrendIcon({ trend, positiveIsGood }: { trend: string; positiveIsGood: boolean }) {
  const isUp = trend === 'up'
  const isGood = positiveIsGood ? isUp : !isUp
  if (trend === 'neutral') return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  if (isGood) return <ArrowDownRight className="h-3.5 w-3.5 text-green-600" />
  return <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
}

// ===== Metric Card with count-up animation =====
function MetricCard({ metric, index, dataLoaded }: { metric: { title: string; value: string; unit: string; change: string; trend: string; icon: React.ComponentType<{ className?: string }>; color: string }; index: number; dataLoaded: boolean }) {
  const numericValue = typeof metric.value === 'string' && metric.value !== '--' ? parseFloat(metric.value.replace(/,/g, '')) : 0
  const animatedValue = useCountUp(numericValue, { duration: 1000, delay: index * 0.1, enabled: dataLoaded })
  const displayValue = dataLoaded && numericValue > 0
    ? (Number.isInteger(numericValue) ? animatedValue.toLocaleString() : animatedValue.toFixed(1))
    : metric.value

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{metric.title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">{displayValue}</span>
              <span className="text-sm text-muted-foreground">{metric.unit}</span>
            </div>
          </div>
          <div className={`rounded-lg p-2.5 ${metric.color}`}>
            <metric.icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs">
          {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
          {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
          <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
            {metric.change}
          </span>
          <span className="text-muted-foreground">较昨日</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [envData, setEnvData] = useState<EnvData>(defaultEnvData)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(formatClock(new Date()))

  // Real-time clock: update every second
  const tick = useCallback(() => {
    setCurrentTime(formatClock(new Date()))
  }, [])

  useEffect(() => {
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [tick])

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, envRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/environment?range=24h'),
        ])
        if (dashRes.ok) {
          const dashData = await dashRes.json()
          setDashboardData(dashData)
        }
        if (envRes.ok) {
          const env = await envRes.json()
          if (env.history && env.history.length > 0) {
            setEnvData(env)
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const metrics = dashboardData ? [
    { title: '总存栏量', value: dashboardData.totalInventory.toLocaleString(), unit: '只', change: '+2.3%', trend: 'up' as const, icon: Bird, color: 'text-green-600 bg-green-50' },
    { title: '在养批次', value: String(dashboardData.activeBatches), unit: '批', change: '0', trend: 'neutral' as const, icon: Layers, color: 'text-emerald-600 bg-emerald-50' },
    { title: '今日预警', value: String(dashboardData.todayAlerts), unit: '条', change: '-15%', trend: 'down' as const, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
    { title: '环境达标率', value: dashboardData.envComplianceRate.toFixed(1), unit: '%', change: '+1.8%', trend: 'up' as const, icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' },
  ] : [
    { title: '总存栏量', value: '--', unit: '只', change: '--', trend: 'neutral' as const, icon: Bird, color: 'text-green-600 bg-green-50' },
    { title: '在养批次', value: '--', unit: '批', change: '--', trend: 'neutral' as const, icon: Layers, color: 'text-emerald-600 bg-emerald-50' },
    { title: '今日预警', value: '--', unit: '条', change: '--', trend: 'neutral' as const, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
    { title: '环境达标率', value: '--', unit: '%', change: '--', trend: 'neutral' as const, icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' },
  ]

  const recentAlerts = dashboardData?.recentAlerts || []

  const activeBatches = (dashboardData?.batchOverview || []).map(b => ({
    id: b.batchNo,
    breed: b.breed,
    count: b.quantity,
    house: b.houseName,
    progress: getBatchProgress(b.startDate, b.expectedEndDate || ''),
    status: b.status,
  }))

  // New data from API
  // Fallback 7-day environment trend data
  const fallbackEnvTrend = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      const hour = 12
      const dayNightOffset = Math.sin((hour - 6) * Math.PI / 12) * 2.5
      return {
        date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
        temperature: Math.round((23.5 + dayNightOffset + (Math.random() - 0.5) * 2) * 10) / 10,
        humidity: Math.round((62 + (Math.random() - 0.5) * 8) * 10) / 10,
        ammonia: Math.round((14 + (Math.random() - 0.5) * 6) * 10) / 10,
        co2: Math.round(750 + (Math.random() - 0.5) * 200),
      }
    })
  }, [])

  const environmentTrend = dashboardData?.environmentTrend?.length ? dashboardData.environmentTrend : fallbackEnvTrend
  const batchProduction = dashboardData?.batchProduction || []
  const recentActivities = dashboardData?.recentActivities || []
  const weeklyComparison = dashboardData?.weeklyComparison

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">加载中...</span>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ===== 1. Farm Info Hero Banner ===== */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl">
          {/* Background image with gradient overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/farm-hero.png"
              alt="极境智牧养殖基地"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-800/90 via-green-700/80 to-emerald-600/70" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-4 sm:px-6 py-5 sm:py-8">
            {/* Top row: farm name + location + clock */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                  </span>
                  极境智牧养殖基地
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-green-100 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  黑龙江省哈尔滨市宾县
                </p>
              </div>

              {/* Real-time Clock */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 border border-white/10">
                <Clock className="h-4 w-4 text-green-200" />
                <span className="text-sm sm:text-base font-mono font-medium text-white tabular-nums">
                  {currentTime}
                </span>
              </div>
            </div>

            {/* Key stats row */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {[
                { label: '养殖棚', value: '4 栋', icon: Layers },
                { label: '总容量', value: '70,000 只', icon: Bird },
                { label: '智能设备', value: '11 台', icon: Wifi },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 border border-white/10"
                >
                  <stat.icon className="h-4 w-4 text-green-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-xs text-green-200">{stat.label}</span>
                    <span className="text-sm sm:text-base font-semibold text-white">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== 2. System Status Bar ===== */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-green-600" />
            <span>模拟运行 128 天</span>
          </div>
          <Separator orientation="vertical" className="h-3 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 font-medium">数据同步正常</span>
          </div>
          <Separator orientation="vertical" className="h-3 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            <span>{getMaintenanceInfo()}</span>
          </div>
          <Separator orientation="vertical" className="h-3 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <CloudSun className="h-3.5 w-3.5 text-amber-500" />
            <span>宾县 · 晴 8°C~18°C</span>
          </div>
        </div>
      </motion.div>

      {/* ===== 2.5. Last Updated Timestamp ===== */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>数据最后更新: <span className="font-medium text-foreground">{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span></span>
      </motion.div>

      {/* ===== 3. Metric Cards ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <MetricCard key={metric.title} metric={metric} index={idx} dataLoaded={!!dashboardData} />
        ))}
      </motion.div>

      {/* ===== 4. Quick Action Buttons Row ===== */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-muted/60 to-muted/30 rounded-xl px-4 py-3 border border-border/50">
          {[
            { label: '新建批次', icon: Plus, color: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' },
            { label: '环境预警', icon: AlertTriangle, color: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm' },
            { label: '用药记录', icon: Pill, color: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' },
            { label: '数据导出', icon: Download, color: 'bg-foreground text-background hover:bg-foreground/80 shadow-sm' },
          ].map((action) => (
            <Button
              key={action.label}
              size="sm"
              className={`rounded-full gap-2 transition-all duration-200 hover:-translate-y-0.5 ${action.color}`}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ===== 5. Charts Row ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Environment Chart */}
        <Card className="lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30 border-t border-t-emerald-400/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              环境数据趋势 (24小时)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={envChartConfig} className="h-[280px] w-full">
              <AreaChart data={envData.history}>
                <defs>
                  <linearGradient id="fillTemperature" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillHumidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="time" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="oklch(0.65 0.20 25)"
                  fill="url(#fillTemperature)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="oklch(0.55 0.15 250)"
                  fill="url(#fillHumidity)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ammonia"
                  stroke="oklch(0.55 0.15 145)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30 border-t border-t-orange-400/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              最新预警
              {recentAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-[10px]">{recentAlerts.length} 条</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {recentAlerts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">暂无预警</p>
                )}
                {recentAlerts.map((alert) => {
                  const levelInfo = getAlertLevel(alert.level)
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${levelInfo.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={levelInfo.badge} className="text-[10px] px-1.5 py-0">
                            {levelInfo.text}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatTime(alert.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed">{alert.title}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 6. Bottom Row (Batches + Weekly Production) ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Batches */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              在养批次概览
              {activeBatches.length > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px]">{activeBatches.length} 批在养</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBatches.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">暂无在养批次</p>
              )}
              {activeBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{batch.id}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {batch.breed}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{batch.house}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>存栏 {batch.count.toLocaleString()} 只</span>
                    <span>养殖进度 {batch.progress}%</span>
                  </div>
                  <Progress value={batch.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Production */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              本周生产数据
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyChartConfig} className="h-[260px] w-full">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="日增重" fill="oklch(0.55 0.15 145)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="死淘" fill="oklch(0.65 0.20 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 7. Mortality Trend + Medication Cost Row ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mortality Trend (30 days) */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              死淘率趋势 (30天)
              <Badge variant="outline" className="ml-auto text-[10px] border-orange-200 text-orange-700">30天</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={mortalityChartConfig} className="h-[200px] w-full">
              <LineChart data={mortalityTrendData}>
                <defs>
                  <linearGradient id="fillMortalityRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} domain={[0, 'auto']} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="oklch(0.65 0.20 25)"
                  fill="url(#fillMortalityRate)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
              <span>月均死淘率: <span className="font-medium text-orange-700">2.1%</span></span>
              <span>最高: <span className="font-medium text-red-600">4.5%</span> (3月15日)</span>
              <span>最低: <span className="font-medium text-green-600">0.8%</span> (3月28日)</span>
            </div>
          </CardContent>
        </Card>

        {/* Medication Cost Comparison (6 batches) */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-emerald-600" />
              用药成本对比 (近6批)
              <Badge variant="outline" className="ml-auto text-[10px] border-emerald-200 text-emerald-700">6批次</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={medicationChartConfig} className="h-[200px] w-full">
              <BarChart data={medicationCostData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="batch" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="cost"
                  fill="oklch(0.55 0.15 145)"
                  radius={[6, 6, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
              <span>总用药成本: <span className="font-medium text-emerald-700">¥18,400</span></span>
              <span>平均: <span className="font-medium text-emerald-700">¥3,067</span>/批</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 8. AI Monitoring + Quick Stats ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Monitoring Card */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI 智能监测
              <Badge variant="outline" className="ml-auto text-[10px] border-green-300 text-green-700">实时</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Monitoring image preview */}
            <div className="relative rounded-lg overflow-hidden mb-4 aspect-video bg-muted">
              <Image
                src="/images/ai-monitor.png"
                alt="AI智能监测画面"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
              {/* Live indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-white font-medium">LIVE</span>
              </div>
            </div>

            {/* AI detection results */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '行为分析', status: '正常', confidence: 96.8, icon: Eye },
                { label: '声音监测', status: '正常', confidence: 98.2, icon: Ear },
                { label: '体温检测', status: '正常', confidence: 97.5, icon: HeartPulse },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center rounded-lg border p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="h-4 w-4 mx-auto mb-1.5 text-green-600" />
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-medium text-green-700 mt-0.5">{item.status}</p>
                  <Badge variant="outline" className="mt-1 text-[9px] px-1 py-0 border-green-200 text-green-700">
                    {item.confidence}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - 采食量/饮水量基于老师公式计算 */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: '今日采食量',
              value: dashboardData?.feedWater ? `${dashboardData.feedWater.todayFeedTon} 吨` : '--',
              icon: Utensils,
              color: 'text-amber-600 bg-amber-50',
              desc: dashboardData?.feedWater
                ? `较昨日 ${(dashboardData.feedWater.todayFeedTon - dashboardData.feedWater.yesterdayFeedTon) >= 0 ? '+' : ''}${(dashboardData.feedWater.todayFeedTon - dashboardData.feedWater.yesterdayFeedTon).toFixed(2)} 吨`
                : '--',
              sub: dashboardData?.feedWater ? `公式: 日龄×10×数量÷2（均${dashboardData.feedWater.avgDays}日龄）` : '',
            },
            {
              label: '饮水量',
              value: dashboardData?.feedWater ? `${dashboardData.feedWater.todayWaterM3} m³` : '--',
              icon: Droplets,
              color: 'text-sky-600 bg-sky-50',
              desc: dashboardData?.feedWater
                ? `较昨日 ${(dashboardData.feedWater.todayWaterM3 - dashboardData.feedWater.yesterdayWaterM3) >= 0 ? '+' : ''}${(dashboardData.feedWater.todayWaterM3 - dashboardData.feedWater.yesterdayWaterM3).toFixed(2)} m³`
                : '--',
              sub: dashboardData?.feedWater ? `公式: 日龄×10×数量（均${dashboardData.feedWater.avgDays}日龄）` : '',
            },
            { label: '光照时长', value: '16h', icon: Sun, color: 'text-orange-500 bg-orange-50', desc: '当前光照强度 正常' },
            { label: '通风量', value: '正常', icon: Wind, color: 'text-teal-600 bg-teal-50', desc: '风速 2.5 m/s' },
          ].map((stat) => (
            <Card key={stat.label} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.desc}</p>
                    {(stat as { sub?: string }).sub && (
                      <p className="text-[9px] text-emerald-500/70 mt-0.5 font-medium">{(stat as { sub?: string }).sub}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* ===== NEW: 本周对比 (Weekly Comparison) ===== */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">本周对比</h3>
          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">周报</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeklyComparison ? [
            {
              label: '死淘率',
              thisWeek: weeklyComparison.mortality.thisWeek,
              lastWeek: weeklyComparison.mortality.lastWeek,
              unit: '%',
              trend: weeklyComparison.mortality.trend,
              change: weeklyComparison.mortality.change,
              positiveIsGood: false,
              color: 'border-t-red-400/30',
              icon: AlertTriangle,
              iconColor: 'text-red-600 bg-red-50',
            },
            {
              label: '饲料消耗',
              thisWeek: weeklyComparison.feed.thisWeek,
              lastWeek: weeklyComparison.feed.lastWeek,
              unit: '元',
              trend: weeklyComparison.feed.trend,
              change: weeklyComparison.feed.change,
              positiveIsGood: false,
              color: 'border-t-amber-400/30',
              icon: Utensils,
              iconColor: 'text-amber-600 bg-amber-50',
            },
            {
              label: '用药成本',
              thisWeek: weeklyComparison.medicineCost.thisWeek,
              lastWeek: weeklyComparison.medicineCost.lastWeek,
              unit: '元',
              trend: weeklyComparison.medicineCost.trend,
              change: weeklyComparison.medicineCost.change,
              positiveIsGood: false,
              color: 'border-t-violet-400/30',
              icon: Pill,
              iconColor: 'text-violet-600 bg-violet-50',
            },
            {
              label: '环境达标率',
              thisWeek: weeklyComparison.envRate.thisWeek,
              lastWeek: weeklyComparison.envRate.lastWeek,
              unit: '%',
              trend: weeklyComparison.envRate.trend,
              change: weeklyComparison.envRate.change,
              positiveIsGood: true,
              color: 'border-t-emerald-400/30',
              icon: CheckCircle2,
              iconColor: 'text-emerald-600 bg-emerald-50',
            },
          ].map((item) => (
            <Card key={item.label} className={`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 ${item.color}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <div className={`rounded-lg p-2 ${item.iconColor}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">本周</p>
                    <span className="text-xl font-bold">
                      {item.label === '饲料消耗' || item.label === '用药成本' ? `¥${item.thisWeek.toLocaleString()}` : `${item.thisWeek}`}
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                  </div>
                  <div className="text-right flex-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5">上周</p>
                    <span className="text-sm text-muted-foreground">
                      {item.label === '饲料消耗' || item.label === '用药成本' ? `¥${item.lastWeek.toLocaleString()}` : `${item.lastWeek}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs pt-2 border-t border-border/50">
                  <TrendIcon trend={item.trend} positiveIsGood={item.positiveIsGood} />
                  <span className={item.positiveIsGood
                    ? (item.trend === 'up' ? 'text-green-600' : 'text-red-500')
                    : (item.trend === 'up' ? 'text-red-500' : 'text-green-600')
                  }>
                    {item.change}{item.unit}
                  </span>
                  <span className="text-muted-foreground">较上周</span>
                </div>
              </CardContent>
            </Card>
          )) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>

      {/* ===== NEW: 环境趋势卡片 (7-day Environment Trend) ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-day Temperature + Humidity Trend */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              环境趋势 (7天)
              <Badge variant="outline" className="ml-auto text-[10px] border-orange-200 text-orange-700">温度+湿度</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {environmentTrend.length > 0 ? (
              <ChartContainer config={envTrendChartConfig} className="h-[220px] w-full">
                <AreaChart data={environmentTrend}>
                  <defs>
                    <linearGradient id="fillTrendTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.65 0.20 25)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillTrendHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="oklch(0.65 0.20 25)"
                    fill="url(#fillTrendTemp)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="oklch(0.55 0.15 250)"
                    fill="url(#fillTrendHum)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground border-t pt-2">
              <span>温度阈值: <span className="text-green-600">18-28°C 正常</span> / <span className="text-amber-600">&lt;18°C 或 &gt;28°C 预警</span></span>
              <span>湿度阈值: <span className="text-green-600">40-75% 正常</span></span>
            </div>
          </CardContent>
        </Card>

        {/* 7-day Ammonia + CO2 Trend */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wind className="h-4 w-4 text-teal-600" />
              空气质量趋势 (7天)
              <Badge variant="outline" className="ml-auto text-[10px] border-teal-200 text-teal-700">氨气+CO₂</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {environmentTrend.length > 0 ? (
              <ChartContainer
                config={{
                  ammonia: { label: '氨气 (ppm)', color: 'oklch(0.65 0.20 85)' },
                  co2: { label: 'CO₂ (ppm)', color: 'oklch(0.55 0.10 200)' },
                }}
                className="h-[220px] w-full"
              >
                <AreaChart data={environmentTrend}>
                  <defs>
                    <linearGradient id="fillTrendNh3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.20 85)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.65 0.20 85)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillTrendCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.10 200)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.55 0.10 200)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="ammonia"
                    stroke="oklch(0.65 0.20 85)"
                    fill="url(#fillTrendNh3)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="co2"
                    stroke="oklch(0.55 0.10 200)"
                    fill="url(#fillTrendCo2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground border-t pt-2">
              <span>氨气阈值: <span className="text-green-600">≤25ppm 正常</span> / <span className="text-amber-600">&gt;25ppm 预警</span></span>
              <span>CO₂阈值: <span className="text-green-600">≤1000ppm 正常</span></span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== NEW: 批次生产进度 (Batch Production Progress) ===== */}
      <motion.div variants={itemVariants}>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-400/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              批次生产进度
              {batchProduction.length > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px] border-emerald-200 text-emerald-700">
                  {batchProduction.length} 批在养
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {batchProduction.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">暂无在养批次</p>
            ) : (
              <div className="space-y-4">
                {batchProduction.map((batch) => {
                  const stageInfo = getStageColor(batch.stage)
                  return (
                    <div
                      key={batch.batchNo}
                      className="rounded-lg border p-4 transition-all duration-200 hover:bg-muted/50"
                    >
                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{batch.batchNo}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{batch.breed}</Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stageInfo.badge}`}>
                            {stageInfo.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{batch.houseName}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>养殖进度 {batch.daysSinceStart}/{batch.totalDays} 天</span>
                          <span className="font-medium">{batch.progress}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stageInfo.bar}`}
                            style={{ width: `${batch.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">当前存栏</p>
                          <p className="text-sm font-semibold">{batch.currentQuantity.toLocaleString()}<span className="text-[10px] text-muted-foreground ml-0.5">只</span></p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">预估体重</p>
                          <p className="text-sm font-semibold">{batch.estimatedWeight}<span className="text-[10px] text-muted-foreground ml-0.5">kg</span></p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">料肉比</p>
                          <p className={`text-sm font-semibold ${batch.fcr <= 1.8 ? 'text-green-600' : batch.fcr <= 2.0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {batch.fcr}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== NEW: 最近动态 (Recent Activities Feed) + 批次生产进度 Stats ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activities Feed */}
        <Card className="lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-blue-400/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              最近动态
              <Badge variant="outline" className="ml-auto text-[10px] border-blue-200 text-blue-700">
                实时更新
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[340px]">
              <div className="space-y-0">
                {recentActivities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">暂无动态</p>
                )}
                {recentActivities.map((activity, idx) => {
                  const actInfo = getActivityIcon(activity.type)
                  const ActIcon = actInfo.icon
                  return (
                    <div
                      key={activity.id}
                      className={`flex gap-3 border-l-2 ${actInfo.border} pl-4 py-3 ${idx < recentActivities.length - 1 ? 'border-b border-border/30' : ''} transition-colors hover:bg-muted/30 rounded-r-lg`}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 rounded-lg p-2 shrink-0 ${actInfo.bg}`}>
                        <ActIcon className={`h-3.5 w-3.5 ${actInfo.color}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {activity.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                            {formatTimeExact(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed">{activity.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{activity.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Batch Production Summary Stats */}
        <div className="space-y-4">
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-400/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bird className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium">生产概要</p>
              </div>
              <div className="space-y-3">
                {batchProduction.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">平均日龄</span>
                      <span className="text-sm font-semibold">
                        {Math.round(batchProduction.reduce((s, b) => s + b.daysSinceStart, 0) / batchProduction.length)} 天
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">平均预估体重</span>
                      <span className="text-sm font-semibold">
                        {(batchProduction.reduce((s, b) => s + b.estimatedWeight, 0) / batchProduction.length).toFixed(2)} kg
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">平均料肉比</span>
                      <span className={`text-sm font-semibold ${(batchProduction.reduce((s, b) => s + b.fcr, 0) / batchProduction.length) <= 1.8 ? 'text-green-600' : 'text-amber-600'}`}>
                        {(batchProduction.reduce((s, b) => s + b.fcr, 0) / batchProduction.length).toFixed(2)}
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">总存栏</span>
                      <span className="text-sm font-semibold">
                        {batchProduction.reduce((s, b) => s + b.currentQuantity, 0).toLocaleString()} 只
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无数据</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-amber-400/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium">健康指标</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">平均死淘率</span>
                  <span className="text-sm font-semibold text-orange-700">
                    {dashboardData
                      ? (dashboardData.batchOverview
                          .filter(b => b.status === '养殖中')
                          .reduce((s, b) => s + b.mortalityRate, 0) /
                          Math.max(1, dashboardData.batchOverview.filter(b => b.status === '养殖中').length)
                        ).toFixed(2)
                      : '--'
                    }%
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">环境达标率</span>
                  <span className="text-sm font-semibold text-green-700">
                    {dashboardData ? `${dashboardData.envComplianceRate.toFixed(1)}%` : '--'}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">活跃预警</span>
                  <span className="text-sm font-semibold text-red-600">
                    {dashboardData?.todayAlerts || 0} 条
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Footer spacing */}
      <div className="h-2" />
    </motion.div>
  )
}
