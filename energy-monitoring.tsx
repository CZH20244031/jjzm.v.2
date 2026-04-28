'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts'
import {
  Zap,
  Droplets,
  Flame,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Info,
} from 'lucide-react'

// === Types ===

interface TodaySummary {
  electricity: number
  water: number
  gas: number
  totalCost: number
  elecTrend: number
  waterTrend: number
  gasTrend: number
}

interface HouseData {
  house: string
  electricity: number
  water: number
  gas: number
  cost: number
  trend: number[]
}

interface TrendPoint {
  date: string
  value: number
  cost: number
}

interface CostBreakdownItem {
  name: string
  value: number
  color: string
}

interface Efficiency {
  energyPerBird: number
  costPerKg: number
  waterPerFeed: number
  benchmarkEnergy: number
  benchmarkCost: number
  benchmarkWaterPerFeed: number
}

interface MonthlyProjectionItem {
  month: string
  actual: number | null
  projected: number
}

interface AlertRule {
  id: number
  type: string
  threshold: string
  level: string
  house: string
  status: string
  description: string
}

interface EnergyData {
  todaySummary: TodaySummary
  houseData: HouseData[]
  electricityTrend: TrendPoint[]
  waterTrend: TrendPoint[]
  costBreakdown: CostBreakdownItem[]
  efficiency: Efficiency
  monthlyProjection: MonthlyProjectionItem[]
  alertRules: AlertRule[]
}

// === Fallback Data ===

const fallbackData: EnergyData = {
  todaySummary: {
    electricity: 385,
    water: 12.5,
    gas: 45,
    totalCost: 2867,
    elecTrend: -3.2,
    waterTrend: 1.5,
    gasTrend: -5.0,
  },
  houseData: [
    { house: 'A1栋', electricity: 98, water: 3.2, gas: 12, cost: 728, trend: [95, 102, 98, 88, 92, 96, 98] },
    { house: 'A2栋', electricity: 105, water: 3.5, gas: 13, cost: 785, trend: [100, 108, 112, 99, 103, 107, 105] },
    { house: 'B1栋', electricity: 92, water: 2.8, gas: 11, cost: 682, trend: [88, 95, 90, 85, 89, 94, 92] },
    { house: 'B2栋', electricity: 90, water: 3.0, gas: 9, cost: 672, trend: [85, 92, 88, 82, 87, 91, 90] },
  ],
  electricityTrend: [
    { date: '06-14', value: 392, cost: 294 },
    { date: '06-15', value: 378, cost: 284 },
    { date: '06-16', value: 405, cost: 304 },
    { date: '06-17', value: 398, cost: 299 },
    { date: '06-18', value: 410, cost: 308 },
    { date: '06-19', value: 375, cost: 281 },
    { date: '06-20', value: 385, cost: 289 },
  ],
  waterTrend: [
    { date: '06-14', value: 11.8, cost: 59 },
    { date: '06-15', value: 12.3, cost: 62 },
    { date: '06-16', value: 11.5, cost: 58 },
    { date: '06-17', value: 13.0, cost: 65 },
    { date: '06-18', value: 12.1, cost: 61 },
    { date: '06-19', value: 12.8, cost: 64 },
    { date: '06-20', value: 12.5, cost: 63 },
  ],
  costBreakdown: [
    { name: '电费', value: 11550, color: '#f59e0b' },
    { name: '水费', value: 3750, color: '#3b82f6' },
    { name: '燃气费', value: 6750, color: '#f97316' },
    { name: '饲料', value: 28500, color: '#10b981' },
    { name: '人工及其他', value: 8500, color: '#8b5cf6' },
  ],
  efficiency: {
    energyPerBird: 0.0115,
    costPerKg: 1.82,
    waterPerFeed: 2.1,
    benchmarkEnergy: 0.013,
    benchmarkCost: 2.0,
    benchmarkWaterPerFeed: 2.0,
  },
  monthlyProjection: [
    { month: '1月', actual: 28500, projected: 28000 },
    { month: '2月', actual: 31200, projected: 30500 },
    { month: '3月', actual: 29800, projected: 29200 },
    { month: '4月', actual: 27500, projected: 27800 },
    { month: '5月', actual: 26400, projected: 26000 },
    { month: '6月', actual: null, projected: 25800 },
  ],
  alertRules: [
    { id: 1, type: '电力', threshold: '>500 kWh/天', level: 'warning', house: '全部', status: 'active', description: '单日用电量超过500kWh时发出预警' },
    { id: 2, type: '用水', threshold: '>15 m³/天', level: 'warning', house: '全部', status: 'active', description: '单日用水量超过15立方米时发出预警' },
    { id: 3, type: '燃气', threshold: '>60 m³/天', level: 'danger', house: '全部', status: 'active', description: '单日燃气用量超过60立方米时发出紧急预警' },
    { id: 4, type: '成本', threshold: '>¥3,500/天', level: 'danger', house: '全部', status: 'active', description: '单日总能源成本超过3500元时发出预警' },
    { id: 5, type: '电力', threshold: '连续3天上升', level: 'info', house: '全部', status: 'active', description: '用电量连续3天上升趋势预警' },
  ],
}

// === Chart Configs ===

const elecChartConfig = {
  value: { label: '用电量 (kWh)', color: '#f59e0b' },
  cost: { label: '费用 (¥)', color: '#10b981' },
}

const waterChartConfig = {
  value: { label: '用水量 (m³)', color: '#3b82f6' },
  cost: { label: '费用 (¥)', color: '#10b981' },
}

const projectionChartConfig = {
  actual: { label: '实际费用 (¥)', color: '#10b981' },
  projected: { label: '预测费用 (¥)', color: '#94a3b8' },
}

// === Helpers ===

function TrendIndicator({ value }: { value: number }) {
  const isDown = value < 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isDown ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
      {isDown ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  )
}

function getAlertLevelBadge(level: string) {
  switch (level) {
    case 'danger':
      return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 text-[10px] px-2">紧急</Badge>
    case 'warning':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] px-2">警告</Badge>
    case 'info':
      return <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 text-[10px] px-2">提示</Badge>
    default:
      return <Badge variant="secondary" className="text-[10px] px-2">{level}</Badge>
  }
}

function getAlertTypeIcon(type: string) {
  switch (type) {
    case '电力':
      return <Zap className="h-3.5 w-3.5 text-amber-500" />
    case '用水':
      return <Droplets className="h-3.5 w-3.5 text-blue-500" />
    case '燃气':
      return <Flame className="h-3.5 w-3.5 text-orange-500" />
    case '成本':
      return <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
    default:
      return <Activity className="h-3.5 w-3.5 text-gray-500" />
  }
}

// Mini sparkline component
function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#spark-${color.replace('#', '')})`}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={`${0},${height} ${points} ${width},${height}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}

// Cost breakdown pie chart with custom label
const RADIAN = Math.PI / 180
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.06) return null

  return (
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="fill-foreground text-[10px]">
      {name} {(percent * 100).toFixed(0)}%
    </text>
  )
}

// === Main Component ===

export function EnergyMonitoring() {
  const [data, setData] = useState<EnergyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnergyData()
  }, [])

  async function fetchEnergyData() {
    try {
      setLoading(true)
      const res = await fetch('/api/energy-monitoring')
      if (!res.ok) throw new Error('获取能耗数据失败')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch energy data:', err)
      setData(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  // === Loading Skeleton ===
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-44" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const d = data || fallbackData
  const totalCostBreakdown = d.costBreakdown.reduce((s, c) => s + c.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            能耗监控
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            实时能耗数据监测与成本分析
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEnergyData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          刷新数据
        </Button>
      </div>

      {/* 1. Energy Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 opacity-90" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
            <CardContent className="relative p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 text-white/90">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">今日能耗总览</span>
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] ml-auto">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date().toLocaleDateString('zh-CN')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Electricity */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-white/80">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">用电量</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {d.todaySummary.electricity}
                    <span className="text-sm font-normal ml-1 text-white/70">kWh</span>
                  </p>
                  <div className="mt-1.5">
                    <TrendIndicator value={d.todaySummary.elecTrend} />
                    <span className="text-[10px] text-white/60 ml-1">较昨日</span>
                  </div>
                </motion.div>

                {/* Water */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-white/80">
                    <Droplets className="h-4 w-4" />
                    <span className="text-xs">用水量</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {d.todaySummary.water}
                    <span className="text-sm font-normal ml-1 text-white/70">m³</span>
                  </p>
                  <div className="mt-1.5">
                    <TrendIndicator value={d.todaySummary.waterTrend} />
                    <span className="text-[10px] text-white/60 ml-1">较昨日</span>
                  </div>
                </motion.div>

                {/* Gas */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-white/80">
                    <Flame className="h-4 w-4" />
                    <span className="text-xs">燃气量</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {d.todaySummary.gas}
                    <span className="text-sm font-normal ml-1 text-white/70">m³</span>
                  </p>
                  <div className="mt-1.5">
                    <TrendIndicator value={d.todaySummary.gasTrend} />
                    <span className="text-[10px] text-white/60 ml-1">较昨日</span>
                  </div>
                </motion.div>

                {/* Total Cost */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-4 col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center gap-2 mb-2 text-white/80">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">今日总费用</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    ¥{d.todaySummary.totalCost.toLocaleString()}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-300" />
                    <span className="text-[10px] text-white/70">能耗成本实时统计</span>
                  </div>
                </motion.div>

                {/* Energy Score */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/15 backdrop-blur-sm rounded-xl p-4 col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center gap-2 mb-2 text-white/80">
                    <Gauge className="h-4 w-4" />
                    <span className="text-xs">能耗评分</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    87<span className="text-sm font-normal ml-1 text-white/70">/100</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-300" />
                    <span className="text-[10px] text-white/70">低于行业均值，表现良好</span>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* 2. Per-House Energy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {d.houseData.map((house, index) => (
          <motion.div
            key={house.house}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    {house.house}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                    ¥{house.cost}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Sparkline trend */}
                <div className="flex justify-center">
                  <MiniSparkline data={house.trend} color="#f59e0b" />
                </div>
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                      <Zap className="h-2.5 w-2.5 text-amber-500" />
                      电力
                    </div>
                    <p className="text-xs font-bold tabular-nums">{house.electricity}<span className="text-[9px] text-muted-foreground font-normal">kWh</span></p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                      <Droplets className="h-2.5 w-2.5 text-blue-500" />
                      用水
                    </div>
                    <p className="text-xs font-bold tabular-nums">{house.water}<span className="text-[9px] text-muted-foreground font-normal">m³</span></p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                      <Flame className="h-2.5 w-2.5 text-orange-500" />
                      燃气
                    </div>
                    <p className="text-xs font-bold tabular-nums">{house.gas}<span className="text-[9px] text-muted-foreground font-normal">m³</span></p>
                  </div>
                </div>
                {/* Cost bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>占全场比例</span>
                    <span className="font-medium">{((house.cost / d.houseData.reduce((s, h) => s + h.cost, 0)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={(house.cost / d.houseData.reduce((s, h) => s + h.cost, 0)) * 100}
                    className="h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 3. Energy Trend Charts (Tabs) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Tabs defaultValue="electricity" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="electricity" className="text-xs">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              用电趋势
            </TabsTrigger>
            <TabsTrigger value="water" className="text-xs">
              <Droplets className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
              用水趋势
            </TabsTrigger>
            <TabsTrigger value="cost" className="text-xs">
              <PieChartIcon className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
              费用构成
            </TabsTrigger>
          </TabsList>

          {/* Electricity Trend */}
          <TabsContent value="electricity">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    7日用电趋势
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      <BarChart3 className="h-3 w-3 mr-1 text-amber-500" />
                      {d.electricityTrend.reduce((s, t) => s + t.value, 0)} kWh 总计
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={elecChartConfig} className="h-[300px] w-full">
                  <AreaChart data={d.electricityTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="elecGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#elecGradient)"
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#10b981' }}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Water Trend */}
          <TabsContent value="water">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    7日用水趋势
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                      {d.waterTrend.reduce((s, t) => s + t.value, 0).toFixed(1)} m³ 总计
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={waterChartConfig} className="h-[300px] w-full">
                  <AreaChart data={d.waterTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} domain={[10, 14]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#waterGradient)"
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#10b981' }}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Breakdown Pie */}
          <TabsContent value="cost">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-purple-500" />
                    月度费用构成分析
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    <DollarSign className="h-3 w-3 mr-1 text-emerald-500" />
                    ¥{totalCostBreakdown.toLocaleString()} 总费用
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Pie Chart */}
                  <div className="w-full lg:w-1/2">
                    <ChartContainer config={{
                      ...Object.fromEntries(d.costBreakdown.map(item => [item.name, { label: item.name, color: item.color }])),
                    }} className="h-[300px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={d.costBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={renderCustomLabel}
                          labelLine={false}
                        >
                          {d.costBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </div>
                  {/* Legend + Details */}
                  <div className="w-full lg:w-1/2 space-y-3">
                    {d.costBreakdown.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{item.name}</span>
                            <span className="text-xs font-bold tabular-nums">¥{item.value.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={(item.value / totalCostBreakdown) * 100}
                              className="h-1.5 flex-1"
                              style={{ '--progress-color': item.color } as React.CSSProperties}
                            />
                            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                              {((item.value / totalCostBreakdown) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* 4. Energy Alert Rules */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                能耗预警规则
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {d.alertRules.length} 条规则
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">类型</TableHead>
                    <TableHead className="text-xs">预警阈值</TableHead>
                    <TableHead className="text-xs">适用鸡舍</TableHead>
                    <TableHead className="text-xs">级别</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.alertRules.map((rule, index) => (
                    <motion.tr
                      key={rule.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="hover:bg-muted/30 border-b transition-colors"
                    >
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(rule.type)}
                          <span className="font-medium">{rule.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {rule.threshold}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{rule.house}</TableCell>
                      <TableCell className="text-xs">{getAlertLevelBadge(rule.level)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[240px] truncate">
                        {rule.description}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. Energy Efficiency + 6. Monthly Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 5. Energy Efficiency Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                能效指标
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Energy per bird */}
              <div className="rounded-lg border p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">单羽能耗</p>
                      <p className="text-[10px] text-muted-foreground">kWh/只</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-amber-600">{d.efficiency.energyPerBird}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">行业基准: {d.efficiency.benchmarkEnergy}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    <TrendingDown className="h-3 w-3 inline mr-0.5" />
                    优于 {(((d.efficiency.benchmarkEnergy - d.efficiency.energyPerBird) / d.efficiency.benchmarkEnergy) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min((d.efficiency.energyPerBird / d.efficiency.benchmarkEnergy) * 100, 100)}
                  className="h-2"
                />
              </div>

              {/* Cost per kg */}
              <div className="rounded-lg border p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">公斤肉能耗成本</p>
                      <p className="text-[10px] text-muted-foreground">元/kg</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-emerald-600">¥{d.efficiency.costPerKg}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">行业基准: ¥{d.efficiency.benchmarkCost}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    <TrendingDown className="h-3 w-3 inline mr-0.5" />
                    节省 {(((d.efficiency.benchmarkCost - d.efficiency.costPerKg) / d.efficiency.benchmarkCost) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min((d.efficiency.costPerKg / d.efficiency.benchmarkCost) * 100, 100)}
                  className="h-2"
                />
              </div>

              {/* Water to feed ratio */}
              <div className="rounded-lg border p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Droplets className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">水料比</p>
                      <p className="text-[10px] text-muted-foreground">水/饲料</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-blue-600">{d.efficiency.waterPerFeed}:1</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">行业基准: {d.efficiency.benchmarkWaterPerFeed}:1</span>
                  <span className="text-[10px] text-amber-600 font-medium">
                    <TrendingUp className="h-3 w-3 inline mr-0.5" />
                    偏高 {(((d.efficiency.waterPerFeed - d.efficiency.benchmarkWaterPerFeed) / d.efficiency.benchmarkWaterPerFeed) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min((d.efficiency.waterPerFeed / 3) * 100, 100)}
                  className="h-2"
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">综合能效评价</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      当前能耗水平整体表现良好，单羽能耗和公斤肉成本均优于行业基准。建议关注水料比偏高问题，可考虑优化饮水系统管理。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. Monthly Cost Projection */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  月度费用预测
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-1" />
                    实际
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <div className="h-2 w-2 rounded-full bg-slate-400 mr-1" />
                    预测
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={projectionChartConfig} className="h-[300px] w-full">
                <BarChart data={d.monthlyProjection} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `¥${(v / 10000).toFixed(1)}万`} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => [`¥${Number(value).toLocaleString()}`, '']} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="projected" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">半年总费</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ¥{(d.monthlyProjection.reduce((s, m) => s + (m.actual || m.projected), 0) / 10000).toFixed(1)}万
                  </p>
                </div>
                <div className="text-center rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">月均费用</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    ¥{(d.monthlyProjection.filter(m => m.actual).reduce((s, m) => s + (m.actual || 0), 0) / d.monthlyProjection.filter(m => m.actual).length / 10000).toFixed(1)}万
                  </p>
                </div>
                <div className="text-center rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">环比变化</p>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center justify-center gap-0.5">
                    <TrendingDown className="h-3 w-3" />
                    -1.5%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
