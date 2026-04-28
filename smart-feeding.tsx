'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wheat,
  Droplets,
  Thermometer,
  Clock,
  TrendingUp,
  Calculator,
  Calendar,
  UtensilsCrossed,
  Beaker,
  FlaskConical,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Sun,
  Moon,
  CloudSun,
  Bird,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────

interface TodaySummary {
  totalFeed: number
  totalCost: number
  avgFCR: number
  waterRatio: number
  batchCount: number
  avgTemp: number
  avgHumidity: number
}

interface BatchPlan {
  batchId: string
  house: string
  breed: string
  ageDays: number
  quantity: number
  currentWeight: number
  targetWeight: number
  feedPerBird: number
  formula: string
  feedings: number
  waterRatio: number
  protein: string
  energy: string
  dailyFeed: number
  healthStatus: string
  stageProgress: number
}

interface FeedFormula {
  name: string
  stage: string
  protein: number
  energy: number
  calcium: number
  phosphorus: number
  lysine: number
  methionine: number
  fat: number
  fiber: number
  suitableAge: string
  pricePerKg: number
}

interface FeedingScheduleItem {
  time: string
  type: string
  percent: number
  feed: number
  notes: string
  icon: string
}

interface FCRTrendItem {
  week: string
  fcr: number
  costPerKg: number
  weightGain: number
  feedIntake: number
}

interface EnvAdjustments {
  currentTemp: number
  currentHumidity: number
  tempEffect: string
  humidityEffect: string
  overall: string
  suggestions: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

interface SmartFeedingData {
  todaySummary: TodaySummary
  batchPlans: BatchPlan[]
  feedFormulas: FeedFormula[]
  feedingSchedule: FeedingScheduleItem[]
  fcrTrend: FCRTrendItem[]
  envAdjustments: EnvAdjustments
}

// ─── Constants ─────────────────────────────────────────────

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6']

const FORMULA_COLORS: Record<string, string> = {
  starter: '#f59e0b',
  grower: '#10b981',
  finisher: '#06b6d4',
  'pre-market': '#8b5cf6',
}

const STAGE_LABELS: Record<string, string> = {
  starter: '育雏期',
  grower: '生长期',
  finisher: '育肥期',
  'pre-market': '出栏前期',
}

const SCHEDULE_ICONS: Record<string, React.ReactNode> = {
  sunrise: <Sun className="h-5 w-5" />,
  sun: <CloudSun className="h-5 w-5" />,
  'cloud-sun': <CloudSun className="h-5 w-5" />,
  sunset: <Moon className="h-5 w-5" />,
}

// ─── Animation Variants ────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Helper Functions ──────────────────────────────────────

function getHealthBadge(status: string) {
  switch (status) {
    case '健康':
      return <Badge className="bg-emerald-500 text-white text-[10px] hover:bg-emerald-500">{status}</Badge>
    case '良好':
      return <Badge className="bg-green-500 text-white text-[10px] hover:bg-green-500">{status}</Badge>
    case '待出栏':
      return <Badge className="bg-amber-500 text-white text-[10px] hover:bg-amber-500">{status}</Badge>
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>
  }
}

function getFormulaBadge(formula: string) {
  const map: Record<string, { bg: string; color: string }> = {
    '育雏期': { bg: 'bg-amber-50', color: 'text-amber-700 border-amber-200' },
    '生长期': { bg: 'bg-emerald-50', color: 'text-emerald-700 border-emerald-200' },
    '育肥期': { bg: 'bg-teal-50', color: 'text-teal-700 border-teal-200' },
    '出栏前期': { bg: 'bg-purple-50', color: 'text-purple-700 border-purple-200' },
  }
  const cfg = map[formula] || { bg: 'bg-gray-50', color: 'text-gray-700 border-gray-200' }
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color}`}>
      {formula}
    </Badge>
  )
}

function getRiskBadge(level: string) {
  switch (level) {
    case 'low':
      return <Badge className="bg-green-500 text-white text-[10px] hover:bg-green-500">低风险</Badge>
    case 'medium':
      return <Badge className="bg-amber-500 text-white text-[10px] hover:bg-amber-500">中等</Badge>
    case 'high':
      return <Badge className="bg-red-500 text-white text-[10px] hover:bg-red-500">高风险</Badge>
    default:
      return <Badge variant="outline" className="text-[10px]">{level}</Badge>
  }
}

// ─── Main Component ────────────────────────────────────────

export function SmartFeeding() {
  const [data, setData] = useState<SmartFeedingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/smart-feeding')
        if (res.ok) {
          const json = await res.json()
          setData(json)
          if (json.batchPlans?.length > 0) {
            setSelectedBatch(json.batchPlans[0].batchId)
          }
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived data
  const feedDistribution = data?.batchPlans.map((b) => ({
    name: b.house,
    value: b.dailyFeed,
    batch: b.batchId,
  })) || []

  const fcrData = data?.fcrTrend || []
  const costData = data?.fcrTrend.map((f) => ({
    week: f.week,
    costPerKg: f.costPerKg,
    weightGain: f.weightGain,
  })) || []

  const activeBatch = data?.batchPlans.find((b) => b.batchId === selectedBatch)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 bg-white/20" />
              <Skeleton className="h-4 w-56 bg-white/20" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ─── Header ───────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute right-1/4 bottom-0 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">智能饲喂建议</h1>
                  <Badge className="bg-white/20 text-white text-[10px] hover:bg-white/30 backdrop-blur-sm border-white/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI驱动
                  </Badge>
                </div>
                <p className="text-sm text-emerald-100">基于批次数据、环境条件与生长阶段的智能饲喂方案</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Wheat className="h-3.5 w-3.5" />
                <span>今日总饲喂 <span className="font-bold text-white">{data.todaySummary.totalFeed.toLocaleString()}</span> kg</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Calculator className="h-3.5 w-3.5" />
                <span>预计成本 <span className="font-bold text-white">¥{data.todaySummary.totalCost.toLocaleString()}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Target className="h-3.5 w-3.5" />
                <span>平均FCR <span className="font-bold text-white">{data.todaySummary.avgFCR}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Thermometer className="h-3.5 w-3.5" />
                <span>当前温度 <span className="font-bold text-white">{data.todaySummary.avgTemp}°C</span></span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Summary Cards ────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-2 border-t-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">今日饲喂总量</p>
                <p className="text-xl font-bold mt-1">{data.todaySummary.totalFeed.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Wheat className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] text-muted-foreground">6个批次在养</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-amber-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">预计饲料成本</p>
                <p className="text-xl font-bold mt-1">¥{data.todaySummary.totalCost.toLocaleString()}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Calculator className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[11px] text-muted-foreground">均价 ¥{(data.todaySummary.totalCost / data.todaySummary.totalFeed).toFixed(1)}/kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-teal-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">平均料肉比</p>
                <p className="text-xl font-bold mt-1">{data.todaySummary.avgFCR}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] text-emerald-600">优于行业标准</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-cyan-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">平均水料比</p>
                <p className="text-xl font-bold mt-1">{data.todaySummary.waterRatio}:1</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <Droplets className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">饮水量 {Math.round(data.todaySummary.totalFeed * data.todaySummary.waterRatio)}L</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Main Tabs ────────────────────────────────────── */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-5">
          <TabsTrigger value="plans" className="text-xs sm:text-sm">
            <Wheat className="h-3.5 w-3.5 mr-1 hidden sm:inline-flex" />
            饲喂方案
          </TabsTrigger>
          <TabsTrigger value="formulas" className="text-xs sm:text-sm">
            <FlaskConical className="h-3.5 w-3.5 mr-1 hidden sm:inline-flex" />
            饲料配方
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 mr-1 hidden sm:inline-flex" />
            时间表
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="text-xs sm:text-sm">
            <TrendingUp className="h-3.5 w-3.5 mr-1 hidden sm:inline-flex" />
            效率指标
          </TabsTrigger>
          <TabsTrigger value="env" className="text-xs sm:text-sm">
            <Thermometer className="h-3.5 w-3.5 mr-1 hidden sm:inline-flex" />
            环境调节
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: 饲喂方案 ───────────────────────────── */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Batch Cards */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bird className="h-4 w-4 text-emerald-600" />
                  批次饲喂方案
                </h3>
                <Badge variant="outline" className="text-[10px]">{data.batchPlans.length} 个批次</Badge>
              </div>
              <ScrollArea className="max-h-[640px]">
                <div className="space-y-3 pr-3">
                  {data.batchPlans.map((batch, index) => (
                    <motion.div
                      key={batch.batchId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                          selectedBatch === batch.batchId
                            ? 'border-2 border-emerald-500 shadow-emerald-500/10 shadow-md'
                            : 'border'
                        }`}
                        onClick={() => setSelectedBatch(batch.batchId)}
                      >
                        <CardContent className="p-4">
                          {/* Top row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold">{batch.batchId}</h4>
                              {getFormulaBadge(batch.formula)}
                              {getHealthBadge(batch.healthStatus)}
                            </div>
                            <Badge variant="outline" className="text-[10px]">{batch.house}</Badge>
                          </div>

                          {/* Batch info grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">品种</p>
                              <p className="text-xs font-medium">{batch.breed}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">日龄 / 数量</p>
                              <p className="text-xs font-medium">{batch.ageDays}天 / {batch.quantity.toLocaleString()}只</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">当前体重</p>
                              <p className="text-xs font-medium">{batch.currentWeight} kg</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">每日饲喂</p>
                              <p className="text-xs font-bold text-emerald-600">{batch.feedPerBird}g/只 · {batch.feedings}次/天</p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">养殖进度</span>
                              <span className="font-medium">{batch.stageProgress}%</span>
                            </div>
                            <Progress value={batch.stageProgress} className="h-1.5" />
                          </div>

                          {/* Bottom stats */}
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t text-[11px]">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Wheat className="h-3 w-3" />
                              <span>日饲料 {batch.dailyFeed}kg</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Droplets className="h-3 w-3" />
                              <span>水料比 {batch.waterRatio}:1</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Scale className="h-3 w-3" />
                              <span>目标 {batch.targetWeight}kg</span>
                            </div>
                            <div className="ml-auto flex items-center gap-1 text-emerald-600">
                              <Zap className="h-3 w-3" />
                              <span>{batch.protein} · {batch.energy}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Feed Distribution Chart */}
            <div className="space-y-4">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">鸡舍饲喂分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={feedDistribution} margin={{ left: -15, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        formatter={(value: number) => [`${value} kg`, '日饲喂量']}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {feedDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Feed by house list */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">鸡舍明细</p>
                    {data.batchPlans.map((batch, i) => (
                      <div key={batch.batchId} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span>{batch.house} · {batch.batchId}</span>
                        </div>
                        <span className="font-mono font-medium">{batch.dailyFeed} kg</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected batch detail */}
              <AnimatePresence mode="wait">
                {activeBatch && (
                  <motion.div
                    key={activeBatch.batchId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-l-4 border-l-emerald-500">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <Target className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-sm font-semibold">
                            {activeBatch.batchId} 智能建议
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-emerald-50 p-2.5">
                            <p className="text-[10px] text-emerald-600 mb-0.5">推荐饲喂量</p>
                            <p className="text-sm font-bold text-emerald-700">{activeBatch.feedPerBird} g/只/天</p>
                          </div>
                          <div className="rounded-lg bg-teal-50 p-2.5">
                            <p className="text-[10px] text-teal-600 mb-0.5">建议频次</p>
                            <p className="text-sm font-bold text-teal-700">{activeBatch.feedings} 次/天</p>
                          </div>
                          <div className="rounded-lg bg-amber-50 p-2.5">
                            <p className="text-[10px] text-amber-600 mb-0.5">水料比</p>
                            <p className="text-sm font-bold text-amber-700">{activeBatch.waterRatio}:1</p>
                          </div>
                          <div className="rounded-lg bg-cyan-50 p-2.5">
                            <p className="text-[10px] text-cyan-600 mb-0.5">日总饲料</p>
                            <p className="text-sm font-bold text-cyan-700">{activeBatch.dailyFeed} kg</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          💡 <span className="font-medium">AI建议：</span>
                          {activeBatch.ageDays < 14 && '育雏期注意温度保持和少食多餐，确保雏鸡充分采食。'}
                          {activeBatch.ageDays >= 14 && activeBatch.ageDays < 28 && '生长期是增重关键阶段，保持饲料营养均衡，逐步提高能量浓度。'}
                          {activeBatch.ageDays >= 28 && activeBatch.ageDays < 42 && '育肥期适当增加能量饲料，控制蛋白质略降，促进脂肪沉积。'}
                          {activeBatch.ageDays >= 42 && '接近出栏标准，注意出栏前7天停用药物，调整饲料配方。'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab 2: 饲料配方 ───────────────────────────── */}
        <TabsContent value="formulas" className="space-y-4">
          {/* Formula Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.feedFormulas.map((formula, index) => (
              <motion.div
                key={formula.stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2"
                  style={{ borderTopColor: FORMULA_COLORS[formula.stage] || '#10b981' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className="text-[10px] text-white hover:opacity-90"
                        style={{ backgroundColor: FORMULA_COLORS[formula.stage] || '#10b981' }}
                      >
                        {STAGE_LABELS[formula.stage] || formula.stage}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formula.suitableAge}</span>
                    </div>
                    <h4 className="text-sm font-bold mb-3">{formula.name}</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">粗蛋白</span>
                        <span className="font-medium">{formula.protein}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">代谢能</span>
                        <span className="font-medium">{formula.energy} kcal/kg</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">钙</span>
                        <span className="font-medium">{formula.calcium}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">磷</span>
                        <span className="font-medium">{formula.phosphorus}%</span>
                      </div>
                      <Separator className="my-1.5" />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">赖氨酸</span>
                        <span className="font-medium">{formula.lysine}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">蛋氨酸</span>
                        <span className="font-medium">{formula.methionine}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">粗脂肪</span>
                        <span className="font-medium">{formula.fat}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">粗纤维</span>
                        <span className="font-medium">{formula.fiber}%</span>
                      </div>
                    </div>
                    <Separator className="my-2.5" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">参考价格</span>
                      <span className="text-sm font-bold text-emerald-600">¥{formula.pricePerKg.toFixed(1)}/kg</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Nutrition Comparison Table */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Beaker className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">配方营养对比</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">营养指标</TableHead>
                        {data.feedFormulas.map((f) => (
                          <TableHead key={f.stage} className="text-xs text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-2 w-6 rounded-full" style={{ backgroundColor: FORMULA_COLORS[f.stage] }} />
                              {f.name}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: '粗蛋白 (%)', key: 'protein', unit: '%' },
                        { label: '代谢能 (kcal/kg)', key: 'energy', unit: 'kcal/kg' },
                        { label: '钙 (%)', key: 'calcium', unit: '%' },
                        { label: '磷 (%)', key: 'phosphorus', unit: '%' },
                        { label: '赖氨酸 (%)', key: 'lysine', unit: '%' },
                        { label: '蛋氨酸 (%)', key: 'methionine', unit: '%' },
                        { label: '粗脂肪 (%)', key: 'fat', unit: '%' },
                        { label: '粗纤维 (%)', key: 'fiber', unit: '%' },
                        { label: '参考价格 (元/kg)', key: 'pricePerKg', unit: '元/kg' },
                      ].map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="text-xs font-medium">{row.label}</TableCell>
                          {data.feedFormulas.map((f) => {
                            const val = f[row.key as keyof FeedFormula]
                            return (
                              <TableCell key={f.stage} className="text-xs text-center font-mono">
                                {typeof val === 'number' ? val.toFixed(row.key === 'pricePerKg' ? 1 : 2) : val}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Tab 3: 饲喂时间表 ─────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Timeline */}
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">今日饲喂时间表</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-300 via-emerald-400 to-teal-500 rounded-full" />

                  <div className="space-y-4">
                    {data.feedingSchedule.map((schedule, index) => (
                      <motion.div
                        key={schedule.time}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex gap-4"
                      >
                        {/* Time badge */}
                        <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white border-2 shadow-sm"
                          style={{ borderColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        >
                          <div className="text-center">
                            <span className="text-[10px] font-bold" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                              {schedule.time}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 rounded-lg border p-3 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{schedule.type}</span>
                              <Badge variant="outline" className="text-[10px]">
                                占比 {schedule.percent}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-amber-600">
                              <Wheat className="h-3.5 w-3.5" />
                              <span className="text-xs font-bold">{schedule.feed} kg</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{schedule.notes}</span>
                          </div>
                          {/* Progress bar for percentage */}
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${schedule.percent}%` }}
                              transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Total summary */}
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">今日饲喂计划</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-700">
                      共 {data.feedingSchedule.length} 次 · {data.todaySummary.totalFeed} kg
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Distribution Chart */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">饲喂量分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.feedingSchedule.map((s) => ({ name: s.time, value: s.feed, percent: s.percent }))} margin={{ left: -15, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        formatter={(value: number, name: string) => [name === 'value' ? `${value} kg` : `${value}%`, name === 'value' ? '饲料量' : '占比']}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.feedingSchedule.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Water schedule */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                      <Droplets className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">饮水提示</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="rounded-lg bg-cyan-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-cyan-700 font-medium">总需水量</span>
                      <span className="text-sm font-bold text-cyan-700">
                        {Math.round(data.todaySummary.totalFeed * data.todaySummary.waterRatio).toLocaleString()} L
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-600">
                      水料比 {data.todaySummary.waterRatio}:1，确保全天不间断供水
                    </p>
                  </div>
                  <div className="space-y-2">
                    {data.feedingSchedule.map((s, i) => (
                      <div key={s.time} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span>{s.time} · {s.type}</span>
                        </div>
                        <span className="font-mono text-cyan-600">{Math.round(s.feed * data.todaySummary.waterRatio)} L</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>高温天气需增加10-15%饮水量，水温控制在18-22°C</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab 4: 效率指标 ───────────────────────────── */}
        <TabsContent value="efficiency" className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 border-t-2 border-t-emerald-500/30">
              <p className="text-[11px] text-muted-foreground">当前FCR</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">{data.fcrTrend[data.fcrTrend.length - 1]?.fcr}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">行业标准 ≤1.8</p>
            </Card>
            <Card className="p-4 border-t-2 border-t-amber-500/30">
              <p className="text-[11px] text-muted-foreground">增重成本</p>
              <p className="text-lg font-bold text-amber-700 mt-1">¥{data.fcrTrend[data.fcrTrend.length - 1]?.costPerKg}/kg</p>
              <p className="text-[10px] text-amber-600 mt-0.5">较上周持平</p>
            </Card>
            <Card className="p-4 border-t-2 border-t-teal-500/30">
              <p className="text-[11px] text-muted-foreground">周增重</p>
              <p className="text-lg font-bold text-teal-700 mt-1">{data.fcrTrend[data.fcrTrend.length - 1]?.weightGain} kg</p>
              <p className="text-[10px] text-teal-600 mt-0.5">只均增重</p>
            </Card>
            <Card className="p-4 border-t-2 border-t-cyan-500/30">
              <p className="text-[11px] text-muted-foreground">FCR趋势</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">逐步优化</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* FCR Trend Chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">FCR (料肉比) 趋势</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={fcrData} margin={{ left: -15, right: 5 }}>
                    <defs>
                      <linearGradient id="fcrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1.0, 2.0]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value: number) => [value.toFixed(2), 'FCR']}
                    />
                    <Area
                      type="monotone"
                      dataKey="fcr"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#fcrGradient)"
                      dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground border-t pt-2">
                  <span>起始FCR: <span className="font-medium">{fcrData[0]?.fcr}</span></span>
                  <span>当前FCR: <span className="font-medium text-emerald-600">{fcrData[fcrData.length - 1]?.fcr}</span></span>
                  <span className="text-emerald-600">
                    ↑ {((fcrData[fcrData.length - 1]?.fcr - fcrData[0]?.fcr) / fcrData[0]?.fcr * 100).toFixed(1)}% (正常波动)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cost per kg Gain Chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">增重成本趋势</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={costData} margin={{ left: -15, right: 5 }}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[3, 6]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      formatter={(value: number, name: string) => [
                        name === 'costPerKg' ? `¥${value}/kg` : `${value} kg`,
                        name === 'costPerKg' ? '增重成本' : '周增重',
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-[11px]">{value === 'costPerKg' ? '增重成本' : '周增重'}</span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="costPerKg"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weightGain"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#10b981', r: 3, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground border-t pt-2">
                  <span>起始成本: <span className="font-medium">¥{costData[0]?.costPerKg}/kg</span></span>
                  <span>当前成本: <span className="font-medium text-amber-600">¥{costData[costData.length - 1]?.costPerKg}/kg</span></span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FCR Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <Target className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">各批次效率对比</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">批次号</TableHead>
                      <TableHead className="text-xs">鸡舍</TableHead>
                      <TableHead className="text-xs">品种</TableHead>
                      <TableHead className="text-xs text-center">日龄</TableHead>
                      <TableHead className="text-xs text-center">当前体重</TableHead>
                      <TableHead className="text-xs text-center">日饲喂</TableHead>
                      <TableHead className="text-xs text-center">阶段</TableHead>
                      <TableHead className="text-xs text-center">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.batchPlans.map((batch) => (
                      <TableRow key={batch.batchId} className="hover:bg-muted/50">
                        <TableCell className="text-xs font-medium">{batch.batchId}</TableCell>
                        <TableCell className="text-xs">{batch.house}</TableCell>
                        <TableCell className="text-xs">{batch.breed}</TableCell>
                        <TableCell className="text-xs text-center">{batch.ageDays}天</TableCell>
                        <TableCell className="text-xs text-center font-mono">{batch.currentWeight} kg</TableCell>
                        <TableCell className="text-xs text-center font-mono">{batch.feedPerBird} g/只</TableCell>
                        <TableCell className="text-center">{getFormulaBadge(batch.formula)}</TableCell>
                        <TableCell className="text-center">{getHealthBadge(batch.healthStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 5: 环境调节 ───────────────────────────── */}
        <TabsContent value="env" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Environmental Status */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Thermometer className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">环境参数</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Temperature */}
                <div className="rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">温度</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{data.envAdjustments.currentTemp}°C</span>
                  </div>
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-300 via-green-300 via-yellow-300 to-red-400 relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 rounded-full bg-white border-2 border-red-500 shadow-sm"
                      style={{ left: `${Math.min(95, Math.max(5, (data.envAdjustments.currentTemp / 40) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>10°C</span>
                    <span>20°C</span>
                    <span>30°C</span>
                    <span>40°C</span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">湿度</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{data.envAdjustments.currentHumidity}%</span>
                  </div>
                  <Progress value={data.envAdjustments.currentHumidity} className="h-2" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>适宜50-65%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Risk Level */}
                <div className="rounded-lg p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-700">综合风险等级</span>
                    {getRiskBadge(data.envAdjustments.riskLevel)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adjustment Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">AI智能调节建议</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Overall recommendation */}
                <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 mb-1">综合建议</p>
                      <p className="text-xs text-emerald-600 leading-relaxed">{data.envAdjustments.overall}</p>
                    </div>
                  </div>
                </div>

                {/* Temperature effect */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <h4 className="text-sm font-semibold">温度影响分析</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.envAdjustments.tempEffect}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="text-center rounded-lg bg-red-50 p-2">
                      <p className="text-[10px] text-red-600">饲料减少</p>
                      <p className="text-sm font-bold text-red-700">3-5%</p>
                    </div>
                    <div className="text-center rounded-lg bg-blue-50 p-2">
                      <p className="text-[10px] text-blue-600">饮水增加</p>
                      <p className="text-sm font-bold text-blue-700">10-15%</p>
                    </div>
                    <div className="text-center rounded-lg bg-amber-50 p-2">
                      <p className="text-[10px] text-amber-600">Vit C 添加</p>
                      <p className="text-sm font-bold text-amber-700">200mg/kg</p>
                    </div>
                  </div>
                </div>

                {/* Humidity effect */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-semibold">湿度影响分析</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{data.envAdjustments.humidityEffect}</p>
                </div>

                {/* Detailed suggestions */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-semibold">具体操作建议</h4>
                  </div>
                  <div className="space-y-2.5">
                    {data.envAdjustments.suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.08 }}
                        className="flex items-start gap-2.5"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{suggestion}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Environment vs feeding chart */}
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: '正常', feed: 100, water: 100 },
                        { name: '当前环境', feed: 96, water: 115 },
                      ]}
                      margin={{ left: -15, right: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 130]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                      <Legend
                        verticalAlign="top"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-[11px]">{value === 'feed' ? '饲料投放' : '饮水量'}</span>
                        )}
                      />
                      <Bar dataKey="feed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-[11px] text-muted-foreground text-center mt-1">
                    📊 当前环境条件下饲料/饮水调整比例（以正常为100%基准）
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
