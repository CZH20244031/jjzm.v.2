'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'
import { useCountUp } from '@/lib/animations'
import {
  Egg,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Award,
  Home,
  User,
  Weight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

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

// ===== Mock Data =====
// 15,000 layer hens (海兰褐种鸡) - ~92.5% production rate

function getTodayDateStr() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

function getLast7Days() {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

// 7-day production trend data
const trendData = (() => {
  const days = getLast7Days()
  return days.map((date, i) => ({
    date,
    产蛋量: 12800 + Math.floor(Math.random() * 500) - 250 + (i === 6 ? 100 : 0),
    合格数: 12160 + Math.floor(Math.random() * 400) - 200 + (i === 6 ? 80 : 0),
  }))
})()

// Weight distribution histogram data (ranges in grams)
const weightDistribution = [
  { range: '<55g', count: 320, label: '偏小' },
  { range: '55-58g', count: 980, label: '偏轻' },
  { range: '58-62g', count: 4850, label: '标准' },
  { range: '62-66g', count: 5200, label: '优良' },
  { range: '66-70g', count: 1480, label: '偏重' },
  { range: '>70g', count: 270, label: '超大' },
]

// Quality grade data
const gradeData = [
  { grade: 'A级', count: 8970, rate: 68.5, color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-200' },
  { grade: 'B级', count: 3450, rate: 26.4, color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-200' },
  { grade: 'C级', count: 630, rate: 4.8, color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-200' },
  { grade: '不合格', count: 50, rate: 0.4, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-200' },
]

// Collection records (recent 10 entries)
const collectionRecords = [
  { id: 'EC20250115001', date: '2025-01-15', house: 'B2栋', collector: '张秀兰', count: 13120, weight: 813.4, qualified: 12470, rate: 95.0 },
  { id: 'EC20250115002', date: '2025-01-15', house: 'B1栋', collector: '李秀芬', count: 12980, weight: 804.8, qualified: 12340, rate: 95.1 },
  { id: 'EC20250114001', date: '2025-01-14', house: 'B2栋', collector: '张秀兰', count: 13050, weight: 809.1, qualified: 12390, rate: 94.9 },
  { id: 'EC20250114002', date: '2025-01-14', house: 'B1栋', collector: '王玉梅', count: 12890, weight: 799.2, qualified: 12250, rate: 95.0 },
  { id: 'EC20250113001', date: '2025-01-13', house: 'B2栋', collector: '李秀芬', count: 12780, weight: 792.4, qualified: 12150, rate: 95.1 },
  { id: 'EC20250113002', date: '2025-01-13', house: 'B1栋', collector: '张秀兰', count: 12900, weight: 799.8, qualified: 12260, rate: 95.0 },
  { id: 'EC20250112001', date: '2025-01-12', house: 'B2栋', collector: '王玉梅', count: 13010, weight: 806.6, qualified: 12370, rate: 95.1 },
  { id: 'EC20250112002', date: '2025-01-12', house: 'B1栋', collector: '李秀芬', count: 12850, weight: 796.7, qualified: 12210, rate: 95.0 },
  { id: 'EC20250111001', date: '2025-01-11', house: 'B2栋', collector: '张秀兰', count: 12690, weight: 786.8, qualified: 12060, rate: 95.0 },
  { id: 'EC20250111002', date: '2025-01-11', house: 'B1栋', collector: '王玉梅', count: 12800, weight: 793.6, qualified: 12170, rate: 95.1 },
]

// Chart configs
const trendChartConfig = {
  产蛋量: { label: '产蛋量 (枚)', color: 'oklch(0.55 0.15 160)' },
  合格数: { label: '合格数 (枚)', color: 'oklch(0.60 0.18 145)' },
}

const weightChartConfig = {
  count: { label: '数量 (枚)', color: 'oklch(0.55 0.15 160)' },
}

// ===== Trend Icon =====
function TrendIndicator({ trend, positiveIsGood }: { trend: string; positiveIsGood: boolean }) {
  const isUp = trend === 'up'
  const isGood = positiveIsGood ? isUp : !isUp
  if (trend === 'neutral') return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  if (isGood) return <ArrowDownRight className="h-3.5 w-3.5 text-green-600" />
  return <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
}

// ===== Animated Metric Card =====
function AnimatedStatCard({
  title,
  value,
  unit,
  change,
  trend,
  icon: Icon,
  color,
  index,
}: {
  title: string
  value: number
  unit: string
  change: string
  trend: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  index: number
}) {
  const animatedValue = useCountUp(value, { duration: 1000, delay: index * 0.1, enabled: true })
  const displayValue = value >= 100
    ? animatedValue.toLocaleString()
    : animatedValue.toFixed(1)

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">{displayValue}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
          </div>
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs">
          <TrendIndicator trend={trend} positiveIsGood={trend === 'up'} />
          <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
            {change}
          </span>
          <span className="text-muted-foreground">较昨日</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main Component =====
export function EggCollection() {
  // Derived summary values
  const todayTotal = trendData[trendData.length - 1]?.产蛋量 ?? 13100
  const yesterdayTotal = trendData[trendData.length - 2]?.产蛋量 ?? 13000
  const todayQualified = trendData[trendData.length - 1]?.合格数 ?? 12450
  const avgWeight = 62.1
  const qualifiedRate = 95.0
  const collectionRate = 92.5

  // Monthly stats
  const monthlyProduction = 393000
  const avgDaily = 13100
  const bestHouse = 'B2栋'

  // Trend calculation
  const totalChange = todayTotal > yesterdayTotal ? 'up' : todayTotal < yesterdayTotal ? 'down' : 'neutral'
  const totalChangeVal = (((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1) + '%'

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ===== Header ===== */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Egg className="h-6 w-6 text-emerald-600" />
              种蛋收集管理
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              海兰褐种鸡 · 15,000羽 · B1/B2栋 · 种蛋收集与质量监测
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              实时监控
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <Calendar className="h-3 w-3 mr-1" />
              {getTodayDateStr()}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ===== Today's Collection Summary Cards ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnimatedStatCard
          title="今日收集"
          value={todayTotal}
          unit="枚"
          change={totalChangeVal}
          trend={totalChange}
          icon={Egg}
          color="text-emerald-600 bg-emerald-50"
          index={0}
        />
        <AnimatedStatCard
          title="平均蛋重"
          value={avgWeight}
          unit="g"
          change="+0.3g"
          trend="up"
          icon={Weight}
          color="text-teal-600 bg-teal-50"
          index={1}
        />
        <AnimatedStatCard
          title="合格率"
          value={qualifiedRate}
          unit="%"
          change="+0.2%"
          trend="up"
          icon={CheckCircle2}
          color="text-green-600 bg-green-50"
          index={2}
        />
        <AnimatedStatCard
          title="产蛋率"
          value={collectionRate}
          unit="%"
          change="-0.1%"
          trend="down"
          icon={TrendingUp}
          color="text-amber-600 bg-amber-50"
          index={3}
        />
      </motion.div>

      {/* ===== 7-Day Egg Production Trend Chart ===== */}
      <motion.div variants={itemVariants}>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30 border-t border-t-emerald-400/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                近7日产蛋趋势
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                7天
              </Badge>
            </div>
            <CardDescription>每日产蛋量及合格数变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="fillEggProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.15 160)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.55 0.15 160)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillQualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.60 0.18 145)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.60 0.18 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="产蛋量"
                  stroke="oklch(0.55 0.15 160)"
                  fill="url(#fillEggProduction)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="合格数"
                  stroke="oklch(0.60 0.18 145)"
                  fill="url(#fillQualified)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
              <span>7日均值: <span className="font-medium text-emerald-700">{Math.round(trendData.reduce((s, d) => s + d.产蛋量, 0) / 7).toLocaleString()} 枚</span></span>
              <span>最高: <span className="font-medium text-green-600">{Math.max(...trendData.map(d => d.产蛋量)).toLocaleString()} 枚</span></span>
              <span>最低: <span className="font-medium text-amber-600">{Math.min(...trendData.map(d => d.产蛋量)).toLocaleString()} 枚</span></span>
              <span>波动率: <span className="font-medium">{(((Math.max(...trendData.map(d => d.产蛋量)) - Math.min(...trendData.map(d => d.产蛋量))) / Math.round(trendData.reduce((s, d) => s + d.产蛋量, 0) / 7)) * 100).toFixed(1)}%</span></span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Egg Quality Metrics: Grades + Weight Distribution ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quality Grades */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              种蛋等级分布
            </CardTitle>
            <CardDescription>今日种蛋质量分级统计 (合计 13,100 枚)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gradeData.map((g) => (
                <div key={g.grade} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${g.border} ${g.color}`}>
                        {g.grade}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{g.count.toLocaleString()} 枚</span>
                    </div>
                    <span className={`text-sm font-semibold ${g.color}`}>
                      {g.rate}%
                    </span>
                  </div>
                  <Progress
                    value={g.rate}
                    className="h-2"
                  />
                </div>
              ))}
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>合格蛋 (A+B级)</span>
                <span className="font-semibold text-emerald-700">
                  {(gradeData[0].rate + gradeData[1].rate).toFixed(1)}% ({(gradeData[0].count + gradeData[1].count).toLocaleString()} 枚)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Distribution Histogram */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Weight className="h-4 w-4 text-teal-600" />
              蛋重分布
            </CardTitle>
            <CardDescription>今日种蛋重量区间分布 (平均 62.1g)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weightChartConfig} className="h-[220px] w-full">
              <BarChart data={weightDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="range" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="oklch(0.55 0.15 160)"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: '标准区间', value: '58-66g', sub: `${(4850 + 5200).toLocaleString()}枚`, color: 'text-emerald-700' },
                { label: '偏轻/偏重', value: '55-58/66-70g', sub: `${(980 + 1480).toLocaleString()}枚`, color: 'text-amber-600' },
                { label: '异常', value: '<55/>70g', sub: `${(320 + 270).toLocaleString()}枚`, color: 'text-red-500' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={`text-xs font-semibold ${item.color} mt-0.5`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Collection Records Table ===== */}
      <motion.div variants={itemVariants}>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                近期收集记录
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                共 {collectionRecords.length} 条
              </Badge>
            </div>
            <CardDescription>最近10条种蛋收集明细记录</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead className="text-xs font-semibold min-w-[130px]">编号</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[90px]">日期</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[60px]">鸡舍</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[70px]">收集员</TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[80px]">数量(枚)</TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[80px]">重量(kg)</TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[90px]">合格数(枚)</TableHead>
                    <TableHead className="text-xs font-semibold text-center min-w-[70px]">合格率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionRecords.map((record, idx) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {record.id.slice(-3)}
                      </TableCell>
                      <TableCell className="text-xs">{record.date}</TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            record.house === bestHouse
                              ? 'border-emerald-200 text-emerald-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <Home className="h-2.5 w-2.5 mr-0.5" />
                          {record.house}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {record.collector}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-center font-medium tabular-nums">
                        {record.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-center tabular-nums">
                        {record.weight.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-xs text-center tabular-nums">
                        {record.qualified.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <span
                          className={
                            record.rate >= 95
                              ? 'text-emerald-600 font-medium'
                              : record.rate >= 93
                                ? 'text-amber-600 font-medium'
                                : 'text-red-500 font-medium'
                          }
                        >
                          {record.rate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Quick Stats Cards ===== */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Monthly Production */}
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 text-emerald-600 bg-emerald-50">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">本月累计产量</p>
                  <p className="text-lg font-bold mt-0.5">{monthlyProduction.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">枚</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    较上月同期 +2.1%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Daily */}
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 text-teal-600 bg-teal-50">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">日均产蛋量</p>
                  <p className="text-lg font-bold mt-0.5">{avgDaily.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">枚/天</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Minus className="h-3 w-3 text-muted-foreground" />
                    与上周持平
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Performing House */}
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5 text-amber-600 bg-amber-50">
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">最优鸡舍</p>
                  <p className="text-lg font-bold mt-0.5 flex items-center gap-2">
                    {bestHouse}
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[10px]">
                      最佳
                    </Badge>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    平均合格率 95.0% · 日均 13,080 枚
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
