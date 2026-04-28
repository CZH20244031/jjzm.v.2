'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Calendar,
  Thermometer,
  Droplets,
  HeartPulse,
  Pill,
  Layers,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Download,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Activity,
  CloudSun,
  Loader2,
  Wind,
  Bug,
  FlaskConical,
  Warehouse,
  Bird,
  ArrowRightLeft,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportGenerator } from '@/components/report-generator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ---------- Types ----------

interface EnvironmentSection {
  status: string
  avgTemp: string
  avgHumidity: string
  maxAmmonia: string
  co2: string
  issues: number
  details: { house: string; temp: string; humidity: string; ammonia: string; status: string }[]
}

interface ProductionSection {
  feedConsumption: string
  waterConsumption: string
  eggCount: null | number
  mortality: number
  mortalityRate: string
  mortalityTrend: 'up' | 'down'
  feedTrend: 'up' | 'down'
}

interface HealthSection {
  newAlerts: number
  resolvedAlerts: number
  aiDetections: number
  status: string
  severityBreakdown: { critical: number; high: number; normal: number }
}

interface Treatment {
  batchNo: string
  drug: string
  dosage: string
  startDate: string
  endDate: string
  status: string
}

interface MedicationSection {
  activeTreatments: number
  withdrawalAlerts: number
  upcomingDoses: number
  treatments: Treatment[]
}

interface BatchItem {
  batchNo: string
  breed: string
  house: string
  ageDays: number
  totalBirds: number
  status: string
}

interface BatchesSection {
  active: number
  totalBirds: number
  incoming: number
  outgoing: number
  list: BatchItem[]
}

interface TodayReport {
  date: string
  farmName: string
  weather: string
  overallStatus: string
  sections: {
    environment: EnvironmentSection
    production: ProductionSection
    health: HealthSection
    medication: MedicationSection
    batches: BatchesSection
  }
}

interface HistoricalReport {
  date: string
  dayOfWeek: string
  overallStatus: string
  mortality: number
  mortalityRate: string
  feedConsumption: string
  waterConsumption: string
  complianceRate: string
  newAlerts: number
  resolvedAlerts: number
  aiDetections: number
  activeTreatments: number
}

interface ReportStats {
  consecutiveNormalDays: number
  thisWeekMortality: number
  thisWeekFeedCost: number
  avgCompliance: number
}

interface ReportData {
  todayReport: TodayReport
  historicalReports: HistoricalReport[]
  reportStats: ReportStats
}

// ---------- Helpers ----------

function getStatusColor(status: string) {
  switch (status) {
    case '正常': return 'bg-emerald-500'
    case '关注': return 'bg-amber-500'
    case '异常': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case '正常': return 'default'
    case '关注': return 'secondary'
    case '异常': return 'destructive'
    default: return 'outline'
  }
}

function getStatusTextColor(status: string) {
  switch (status) {
    case '正常': return 'text-emerald-600'
    case '关注': return 'text-amber-600'
    case '异常': return 'text-red-600'
    default: return 'text-gray-500'
  }
}

function getStatusBgColor(status: string) {
  switch (status) {
    case '正常': return 'bg-emerald-50 border-emerald-200'
    case '关注': return 'bg-amber-50 border-amber-200'
    case '异常': return 'bg-red-50 border-red-200'
    default: return 'bg-gray-50 border-gray-200'
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 周${days[d.getDay()]}`
}

// ---------- Animation Variants ----------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ---------- Sparkline Mini Component ----------

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const h = 28
  const w = 80
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------- Environment Section ----------

function EnvironmentCard({ data }: { data: EnvironmentSection }) {
  const sparkData = [22.1, 22.8, 23.5, 23.1, 22.9, 23.5, 24.0]
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-t-2 border-t-emerald-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Thermometer className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">环境监测</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {data.issues > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {data.issues} 项异常
                </Badge>
              )}
              <span className={`flex items-center gap-1.5 text-xs font-medium ${getStatusTextColor(data.status)}`}>
                <span className={`h-2 w-2 rounded-full ${getStatusColor(data.status)}`} />
                {data.status}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { icon: Thermometer, label: '平均温度', value: data.avgTemp, color: 'text-orange-600', bg: 'bg-orange-50' },
              { icon: Droplets, label: '平均湿度', value: data.avgHumidity, color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Wind, label: '最高氨气', value: data.maxAmmonia, color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: CloudSun, label: 'CO₂浓度', value: data.co2, color: 'text-slate-600', bg: 'bg-slate-50' },
            ].map((chip) => (
              <div key={chip.label} className={`rounded-lg ${chip.bg} border p-2.5`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <chip.icon className={`h-3 w-3 ${chip.color}`} />
                  <span className="text-[10px] text-muted-foreground">{chip.label}</span>
                </div>
                <span className="text-sm font-semibold">{chip.value}</span>
              </div>
            ))}
          </div>

          {/* House Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">各鸡舍状态</span>
              <MiniSparkline values={sparkData} color="#10b981" />
            </div>
            {data.details.map((house) => (
              <div key={house.house} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{house.house}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{house.temp}</span>
                  <span>{house.humidity}</span>
                  <span>{house.ammonia}</span>
                  <span className={`flex items-center gap-1 ${getStatusTextColor(house.status)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(house.status)}`} />
                    {house.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------- Production Section ----------

function ProductionCard({ data }: { data: ProductionSection }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-t-2 border-t-orange-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold">生产数据</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            {/* Feed */}
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted-foreground">饲料消耗</span>
                {data.feedTrend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                )}
              </div>
              <span className="text-base font-bold">{data.feedConsumption}</span>
            </div>

            {/* Water */}
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted-foreground">饮水量</span>
                <Droplets className="h-3 w-3 text-blue-500" />
              </div>
              <span className="text-base font-bold">{data.waterConsumption}</span>
            </div>

            {/* Mortality */}
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted-foreground">今日死淘</span>
                {data.mortalityTrend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold">{data.mortality}</span>
                <span className="text-xs text-muted-foreground">只 ({data.mortalityRate})</span>
              </div>
            </div>

            {/* Mortality Rate Visual */}
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted-foreground">死淘率等级</span>
                <Bug className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <Progress value={15} className="h-2 flex-1" />
                <span className="text-xs text-emerald-600 font-medium">正常</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------- Health Section ----------

function HealthCard({ data }: { data: HealthSection }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-t-2 border-t-rose-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <HeartPulse className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">健康预警</CardTitle>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${getStatusTextColor(data.status)}`}>
              <span className={`h-2 w-2 rounded-full ${getStatusColor(data.status)}`} />
              {data.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center rounded-lg bg-red-50 border border-red-100 p-3">
              <div className="text-lg font-bold text-red-600">{data.newAlerts}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">新增预警</div>
            </div>
            <div className="text-center rounded-lg bg-emerald-50 border border-emerald-100 p-3">
              <div className="text-lg font-bold text-emerald-600">{data.resolvedAlerts}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">已处理</div>
            </div>
            <div className="text-center rounded-lg bg-purple-50 border border-purple-100 p-3">
              <div className="text-lg font-bold text-purple-600">{data.aiDetections}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">AI检测</div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">预警严重程度分布</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs">紧急 {data.severityBreakdown.critical}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs">高 {data.severityBreakdown.high}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-xs">一般 {data.severityBreakdown.normal}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------- Medication Section ----------

function MedicationCard({ data }: { data: MedicationSection }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-t-2 border-t-violet-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Pill className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold">用药管理</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center rounded-lg bg-muted/40 p-2.5">
              <FlaskConical className="h-4 w-4 mx-auto text-violet-500 mb-1" />
              <div className="text-sm font-bold">{data.activeTreatments}</div>
              <div className="text-[10px] text-muted-foreground">治疗中</div>
            </div>
            <div className="text-center rounded-lg bg-amber-50 border border-amber-100 p-2.5">
              <ShieldAlert className="h-4 w-4 mx-auto text-amber-500 mb-1" />
              <div className="text-sm font-bold text-amber-600">{data.withdrawalAlerts}</div>
              <div className="text-[10px] text-muted-foreground">休药期预警</div>
            </div>
            <div className="text-center rounded-lg bg-blue-50 border border-blue-100 p-2.5">
              <Calendar className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <div className="text-sm font-bold text-blue-600">{data.upcomingDoses}</div>
              <div className="text-[10px] text-muted-foreground">待用药</div>
            </div>
          </div>

          {/* Treatment List */}
          <div className="space-y-2">
            {data.treatments.map((t) => (
              <div key={t.batchNo + t.drug} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                <div>
                  <div className="text-xs font-medium">{t.drug}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.batchNo} · {t.dosage} · {t.startDate}~{t.endDate}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------- Batches Section ----------

function BatchesCard({ data }: { data: BatchesSection }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-t-2 border-teal-400 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <Layers className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">批次概览</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {data.active} 个活跃批次
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center rounded-lg bg-muted/40 p-2">
              <Layers className="h-3.5 w-3.5 mx-auto text-teal-500 mb-1" />
              <div className="text-xs font-bold">{data.active}</div>
              <div className="text-[10px] text-muted-foreground">活跃</div>
            </div>
            <div className="text-center rounded-lg bg-muted/40 p-2">
              <Bird className="h-3.5 w-3.5 mx-auto text-teal-500 mb-1" />
              <div className="text-xs font-bold">{data.totalBirds.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">总存栏</div>
            </div>
            <div className="text-center rounded-lg bg-muted/40 p-2">
              <ArrowRightLeft className="h-3.5 w-3.5 mx-auto text-emerald-500 mb-1" />
              <div className="text-xs font-bold">{data.incoming}</div>
              <div className="text-[10px] text-muted-foreground">待进</div>
            </div>
            <div className="text-center rounded-lg bg-muted/40 p-2">
              <ArrowRightLeft className="h-3.5 w-3.5 mx-auto text-orange-500 mb-1" />
              <div className="text-xs font-bold">{data.outgoing}</div>
              <div className="text-[10px] text-muted-foreground">待出</div>
            </div>
          </div>

          {/* Batch Cards */}
          <div className="space-y-2">
            {data.list.map((batch) => (
              <div key={batch.batchNo} className={`rounded-lg border p-3 ${getStatusBgColor(batch.status === '养殖中' ? '正常' : '关注')}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{batch.batchNo}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{batch.breed}</Badge>
                  </div>
                  <Badge variant={getStatusBadgeVariant(batch.status === '养殖中' ? '正常' : '关注')} className="text-[10px] h-5">
                    {batch.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>📍 {batch.house}</span>
                  <span>📅 {batch.ageDays}日龄</span>
                  <span>🐔 {batch.totalBirds.toLocaleString()} 只</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------- Historical Report Row ----------

function HistoricalRow({ report }: { report: HistoricalReport }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor(report.overallStatus)}`} />
          <div>
            <div className="text-xs font-medium">{formatDate(report.date)}</div>
            <div className="text-[10px] text-muted-foreground">{report.dayOfWeek}</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          <span>死淘 <span className="font-medium text-foreground">{report.mortality}</span></span>
          <span>饲料 <span className="font-medium text-foreground">{report.feedConsumption}</span></span>
          <span>达标 <span className={`font-medium ${report.complianceRate === '100.0%' ? 'text-emerald-600' : 'text-foreground'}`}>{report.complianceRate}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(report.overallStatus)} className="text-[10px] h-5">
            {report.overallStatus}
          </Badge>
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Separator />
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">死淘数/率</div>
              <div className="text-xs font-medium">{report.mortality} 只 ({report.mortalityRate})</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">饲料/饮水</div>
              <div className="text-xs font-medium">{report.feedConsumption} / {report.waterConsumption}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">新增/已处理预警</div>
              <div className="text-xs font-medium">{report.newAlerts} / {report.resolvedAlerts}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground mb-0.5">AI检测/治疗中</div>
              <div className="text-xs font-medium">{report.aiDetections} / {report.activeTreatments}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ---------- Main Component ----------

export function DailyReport() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch('/api/reports')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <span className="text-sm">正在加载养殖日报...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <FileText className="h-10 w-10 mb-3 opacity-40" />
        <span className="text-sm">无法加载报告数据</span>
      </div>
    )
  }

  const { todayReport, historicalReports, reportStats } = data

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ===== Header Section ===== */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">养殖日报</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{formatDate(todayReport.date)}</span>
                <Separator orientation="vertical" className="h-3" />
                <CloudSun className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{todayReport.weather}</span>
                <Separator orientation="vertical" className="h-3" />
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{todayReport.farmName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${getStatusBgColor(todayReport.overallStatus)}`}>
            <span className={`h-2 w-2 rounded-full ${getStatusColor(todayReport.overallStatus)} animate-pulse`} />
            {todayReport.overallStatus}
          </span>
          <ReportGenerator />
        </div>
      </motion.div>

      {/* ===== Report Statistics Bar ===== */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: CheckCircle, label: '连续正常天数', value: `${reportStats.consecutiveNormalDays}天`, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
            { icon: Bug, label: '本周死淘', value: `${reportStats.thisWeekMortality}只`, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' },
            { icon: BarChart3, label: '本周饲料成本', value: `¥${reportStats.thisWeekFeedCost.toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
            { icon: Activity, label: '环境达标率', value: `${reportStats.avgCompliance}%`, color: 'text-teal-600', bg: 'bg-teal-50', iconBg: 'bg-teal-100' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border ${stat.bg} p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ===== Today's Report Sections ===== */}
      <div className="space-y-4">
        <motion.h2 variants={itemVariants} className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          今日报告详情
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnvironmentCard data={todayReport.sections.environment} />
          <ProductionCard data={todayReport.sections.production} />
          <HealthCard data={todayReport.sections.health} />
          <MedicationCard data={todayReport.sections.medication} />
          <div className="lg:col-span-2">
            <BatchesCard data={todayReport.sections.batches} />
          </div>
        </div>
      </div>

      {/* ===== Historical Reports ===== */}
      <motion.div variants={itemVariants}>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">历史报告（近7天）</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">
                共 {historicalReports.length} 条记录
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-96">
              <div className="space-y-2 pr-3">
                {historicalReports.map((report) => (
                  <HistoricalRow key={report.date} report={report} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
