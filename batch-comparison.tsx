'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  GitCompareArrows,
  Loader2,
  Trophy,
  TrendingDown,
  Medal,
  Crown,
  Target,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────

interface BatchComparisonData {
  id: string
  batchNo: string
  breed: string
  quantity: number
  currentQuantity: number
  daysSinceStart: number
  totalDays: number
  status: string
  mortalityRate: number
  houseName: string
  startDate: string
  expectedEndDate: string | null
  totalCost: number
  feedCost: number
  medicineCost: number
  laborCost: number
  energyCost: number
  otherCost: number
  costPerBird: number
  fcr: number
  dailyGain: number
  feedConsumption: number
  envScore: number
}

// ─── Color palette ───────────────────────────────────────────

const BATCH_COLORS = [
  { solid: 'oklch(0.55 0.15 160)', light: 'oklch(0.80 0.10 160)', label: '批次A' },
  { solid: 'oklch(0.60 0.18 60)', light: 'oklch(0.82 0.12 60)', label: '批次B' },
  { solid: 'oklch(0.55 0.15 20)', light: 'oklch(0.80 0.10 20)', label: '批次C' },
]

const COST_COLORS: Record<string, string> = {
  '饲料': 'oklch(0.55 0.15 145)',
  '药品': 'oklch(0.60 0.18 25)',
  '人工': 'oklch(0.55 0.12 250)',
  '能耗': 'oklch(0.60 0.18 85)',
  '其他': 'oklch(0.65 0.08 300)',
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function getStatusBadge(status: string) {
  switch (status) {
    case '养殖中':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-[10px]">养殖中</Badge>
    case '已出栏':
      return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 border-0 text-[10px]">已出栏</Badge>
    case '待入栏':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 border-0 text-[10px]">待入栏</Badge>
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>
  }
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-amber-500" />
    case 2:
      return <Medal className="h-4 w-4 text-slate-400" />
    case 3:
      return <Medal className="h-4 w-4 text-amber-700" />
    default:
      return null
  }
}

function getRankBadgeClass(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700/40'
    case 2:
      return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 dark:from-slate-800/30 dark:to-gray-800/30 dark:border-slate-600/40'
    case 3:
      return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-700/40'
    default:
      return 'bg-background border-border'
  }
}

// ─── Radar data builder ──────────────────────────────────────

function buildRadarData(batches: BatchComparisonData[]) {
  // Dimensions: 死淘率(低好), 日增重(高好), 料肉比(低好), 成本效率(高好), 环境达标率(高好)
  // Normalize each to 0-100 scale where 100 is best
  const mortRates = batches.map((b) => b.mortalityRate)
  const maxMort = Math.max(...mortRates, 1)
  const gains = batches.map((b) => b.dailyGain)
  const maxGain = Math.max(...gains, 1)
  const fcrs = batches.map((b) => b.fcr)
  const maxFcr = Math.max(...fcrs, 0.1)
  const costs = batches.map((b) => b.costPerBird)
  const maxCost = Math.max(...costs, 1)

  const mortScore = mortRates.map((m) => Math.round(((maxMort - m) / maxMort) * 100))
  const gainScore = gains.map((g) => Math.round((g / maxGain) * 100))
  const fcrScore = fcrs.map((f) => Math.round(((maxFcr - f) / maxFcr) * 100))
  const costScore = costs.map((c) => Math.round(((maxCost - c) / maxCost) * 100))
  const envScore = batches.map((b) => b.envScore)

  const dimensions = ['死淘率', '日增重', '料肉比', '成本效率', '环境达标率']

  return dimensions.map((dim, i) => {
    const row: Record<string, string | number> = { dimension: dim }
    batches.forEach((b, idx) => {
      const scores = [mortScore[idx], gainScore[idx], fcrScore[idx], costScore[idx], envScore[idx]]
      row[b.batchNo] = scores[i]
    })
    return row
  })
}

// ─── Cost breakdown data ─────────────────────────────────────

function buildCostBreakdownData(batches: BatchComparisonData[]) {
  const categories = ['饲料', '药品', '人工', '能耗']
  return categories.map((cat) => {
    const row: Record<string, string | number> = { category: cat }
    batches.forEach((b) => {
      row[b.batchNo] = b.status === '待入栏'
        ? 0
        : cat === '饲料'
          ? Math.round(b.feedCost / 1000)
          : cat === '药品'
            ? Math.round(b.medicineCost / 1000)
            : cat === '人工'
              ? Math.round(b.laborCost / 1000)
              : Math.round(b.energyCost / 1000)
    })
    return row
  })
}

// ─── Main Component ──────────────────────────────────────────

export function BatchComparison() {
  const { toast } = useToast()
  const [allBatches, setAllBatches] = useState<BatchComparisonData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchComparisonData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/batch-comparison')
      if (!res.ok) throw new Error('获取对比数据失败')
      const data = await res.json()
      setAllBatches(data.batches || [])
      // Default: select up to 3 active batches (养殖中 or 已出栏)
      const activeBatches = (data.batches || [])
        .filter((b: BatchComparisonData) => b.status === '养殖中' || b.status === '已出栏')
        .slice(0, 3)
      setSelectedIds(new Set(activeBatches.map((b: BatchComparisonData) => b.id)))
    } catch {
      toast({
        title: '加载失败',
        description: '获取批次对比数据失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchComparisonData()
  }, [fetchComparisonData])

  const toggleBatch = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      } else {
        toast({
          title: '最多选择3个批次',
          description: '请取消选择一个批次后再选择新的批次',
          variant: 'destructive',
        })
        return prev
      }
      return next
    })
  }

  const selectAll = () => {
    const active = allBatches
      .filter((b) => b.status === '养殖中' || b.status === '已出栏')
      .slice(0, 3)
    setSelectedIds(new Set(active.map((b) => b.id)))
  }

  const clearAll = () => {
    setSelectedIds(new Set())
  }

  // Filtered & ordered selected batches
  const selectedBatches = allBatches
    .filter((b) => selectedIds.has(b.id))
    .slice(0, 3)

  // Build chart configs
  const chartConfig: Record<string, { label: string; color: string }> = {}
  selectedBatches.forEach((b, idx) => {
    chartConfig[b.batchNo] = {
      label: b.batchNo,
      color: BATCH_COLORS[idx % BATCH_COLORS.length].solid,
    }
  })

  const costChartConfig: Record<string, { label: string; color: string }> = {}
  Object.entries(COST_COLORS).forEach(([key, color]) => {
    costChartConfig[key] = { label: key, color }
  })

  const radarData = selectedBatches.length > 0 ? buildRadarData(selectedBatches) : []
  const costData = selectedBatches.length > 0 ? buildCostBreakdownData(selectedBatches) : []

  // ─── Performance Ranking ───────────────────────────────────
  // Rank 1 = best for each metric
  const activeBatches = selectedBatches.filter((b) => b.status !== '待入栏')

  function rankBatches(
    batches: BatchComparisonData[],
    metric: keyof BatchComparisonData,
    lowerIsBetter: boolean
  ) {
    if (batches.length < 2) return null
    const sorted = [...batches].sort((a, b) => {
      const va = a[metric] as number
      const vb = b[metric] as number
      return lowerIsBetter ? va - vb : vb - va
    })
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      ranks: sorted.map((b, i) => ({ batch: b, rank: i + 1 })),
    }
  }

  const mortRanking = rankBatches(activeBatches, 'mortalityRate', true)
  const costRanking = rankBatches(activeBatches, 'costPerBird', true)
  const fcrRanking = rankBatches(activeBatches, 'fcr', true)
  const gainRanking = rankBatches(activeBatches, 'dailyGain', false)

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
    }),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-primary" />
            批次对比分析
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            多维度对比分析养殖批次绩效 · 最多可选3个批次
          </p>
        </div>
        <Button variant="outline" onClick={fetchComparisonData} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          刷新数据
        </Button>
      </div>

      {/* Batch Selector */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-t-2 border-t-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                选择对比批次
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                  默认选择
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                  清除全部
                </Button>
              </div>
            </div>
            <CardDescription>
              已选择 {selectedIds.size}/3 个批次 · {selectedIds.size < 2 && '请至少选择2个批次进行对比'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allBatches.map((batch, idx) => {
                  const isSelected = selectedIds.has(batch.id)
                  const colorIdx = selectedBatches.findIndex((b) => b.id === batch.id)
                  const borderColor = isSelected
                    ? BATCH_COLORS[colorIdx % BATCH_COLORS.length].solid
                    : 'transparent'

                  return (
                    <motion.div
                      key={batch.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <label
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-sm ${
                          isSelected
                            ? getRankBadgeClass(colorIdx + 1) + ' shadow-sm'
                            : 'bg-card hover:border-muted-foreground/20'
                        }`}
                        style={isSelected ? { borderColor } : undefined}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleBatch(batch.id)}
                          disabled={!isSelected && selectedIds.size >= 3}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">
                              {batch.batchNo}
                            </span>
                            {getStatusBadge(batch.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {batch.breed} · {batch.houseName} · {batch.quantity.toLocaleString()}只
                          </p>
                        </div>
                        {isSelected && colorIdx >= 0 && (
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: BATCH_COLORS[colorIdx % BATCH_COLORS.length].solid }}
                          />
                        )}
                      </label>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Comparison Content */}
      {selectedBatches.length >= 2 && (
        <>
          {/* KPI Comparison Table */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCompareArrows className="h-4 w-4 text-primary" />
                  KPI 指标对比
                </CardTitle>
                <CardDescription>核心养殖指标横向对比一览</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="sticky top-0 bg-background z-10">
                        <TableHead className="text-xs font-semibold min-w-[100px]">指标</TableHead>
                        {selectedBatches.map((b, idx) => (
                          <TableHead key={b.id} className="text-xs font-semibold text-center min-w-[130px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <div
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: BATCH_COLORS[idx].solid }}
                              />
                              {b.batchNo}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          label: '品种',
                          key: 'breed',
                          render: (b: BatchComparisonData) => b.breed,
                        },
                        {
                          label: '数量',
                          key: 'quantity',
                          render: (b: BatchComparisonData) => b.quantity.toLocaleString() + '只',
                        },
                        {
                          label: '日龄',
                          key: 'days',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏'
                              ? '--'
                              : b.daysSinceStart + '天',
                        },
                        {
                          label: '状态',
                          key: 'status',
                          render: (b: BatchComparisonData) => getStatusBadge(b.status),
                        },
                        {
                          label: '死淘率',
                          key: 'mort',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏'
                              ? '--'
                              : (
                                  <span className={b.mortalityRate <= 2 ? 'text-emerald-600 font-medium' : b.mortalityRate <= 3 ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'}>
                                    {b.mortalityRate}%
                                  </span>
                                ),
                        },
                        {
                          label: '饲料成本',
                          key: 'feedCost',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏' ? '--' : formatCurrency(b.feedCost),
                        },
                        {
                          label: '药品成本',
                          key: 'medCost',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏' ? '--' : formatCurrency(b.medicineCost),
                        },
                        {
                          label: '料肉比(FCR)',
                          key: 'fcr',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏'
                              ? '--'
                              : (
                                  <span className={b.fcr <= 1.6 ? 'text-emerald-600 font-medium' : b.fcr <= 1.8 ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'}>
                                    {b.fcr.toFixed(2)}
                                  </span>
                                ),
                        },
                        {
                          label: '日增重(g)',
                          key: 'dailyGain',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏' ? '--' : b.dailyGain + 'g',
                        },
                        {
                          label: '每只成本',
                          key: 'costPerBird',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏' ? '--' : '¥' + b.costPerBird.toFixed(2),
                        },
                        {
                          label: '总成本',
                          key: 'totalCost',
                          render: (b: BatchComparisonData) =>
                            b.status === '待入栏' ? '--' : formatCurrency(b.totalCost),
                        },
                      ].map((row) => (
                        <TableRow key={row.key} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs font-medium text-muted-foreground">
                            {row.label}
                          </TableCell>
                          {selectedBatches.map((b) => (
                            <TableCell key={b.id} className="text-xs text-center">
                              {row.render(b)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar Chart */}
            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    综合绩效雷达图
                  </CardTitle>
                  <CardDescription>
                    五维度标准化评分 (0-100，越高越优)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBatches.length < 2 ? (
                    <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                      至少需要2个有效批次
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[320px] w-full">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid className="stroke-border/30" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          className="text-[11px] fill-muted-foreground"
                          tick={{ fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          className="text-[10px]"
                          tick={{ fontSize: 10 }}
                        />
                        {selectedBatches.map((b, idx) => (
                          <Radar
                            key={b.id}
                            name={b.batchNo}
                            dataKey={b.batchNo}
                            stroke={BATCH_COLORS[idx % BATCH_COLORS.length].solid}
                            fill={BATCH_COLORS[idx % BATCH_COLORS.length].solid}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RadarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Grouped Bar Chart: Cost Breakdown */}
            <motion.div
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-primary" />
                    成本结构对比
                  </CardTitle>
                  <CardDescription>分项成本对比 (千元)</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeBatches.length < 2 ? (
                    <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                      至少需要2个有效批次
                    </div>
                  ) : (
                    <ChartContainer config={costChartConfig} className="h-[320px] w-full">
                      <BarChart data={costData} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="category" className="text-xs" tickLine={false} axisLine={false} />
                        <YAxis className="text-xs" tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {selectedBatches.map((b, idx) => (
                          <Bar
                            key={b.id}
                            dataKey={b.batchNo}
                            fill={BATCH_COLORS[idx % BATCH_COLORS.length].solid}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Ranking */}
          <motion.div
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-t-2 border-t-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  绩效排行榜
                </CardTitle>
                <CardDescription>各维度最优/最差批次排名</CardDescription>
              </CardHeader>
              <CardContent>
                {activeBatches.length < 2 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    至少需要2个有效批次才能排名
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Mortality Ranking */}
                    {mortRanking && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold">死淘率最优</span>
                        </div>
                        <div className={`rounded-md border p-2.5 ${getRankBadgeClass(1)}`}>
                          <p className="text-sm font-bold">{mortRanking.best.batchNo}</p>
                          <p className="text-lg font-bold text-emerald-600">{mortRanking.best.mortalityRate}%</p>
                          <p className="text-[10px] text-muted-foreground">{mortRanking.best.breed} · {mortRanking.best.houseName}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span>最差: {mortRanking.worst.batchNo} ({mortRanking.worst.mortalityRate}%)</span>
                        </div>
                      </div>
                    )}

                    {/* Cost Ranking */}
                    {costRanking && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold">成本最优</span>
                        </div>
                        <div className={`rounded-md border p-2.5 ${getRankBadgeClass(1)}`}>
                          <p className="text-sm font-bold">{costRanking.best.batchNo}</p>
                          <p className="text-lg font-bold text-emerald-600">¥{costRanking.best.costPerBird.toFixed(2)}/只</p>
                          <p className="text-[10px] text-muted-foreground">{costRanking.best.breed} · {costRanking.best.houseName}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span>最差: {costRanking.worst.batchNo} (¥{costRanking.worst.costPerBird.toFixed(2)}/只)</span>
                        </div>
                      </div>
                    )}

                    {/* FCR Ranking */}
                    {fcrRanking && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold">FCR最优</span>
                        </div>
                        <div className={`rounded-md border p-2.5 ${getRankBadgeClass(1)}`}>
                          <p className="text-sm font-bold">{fcrRanking.best.batchNo}</p>
                          <p className="text-lg font-bold text-emerald-600">{fcrRanking.best.fcr.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{fcrRanking.best.breed} · {fcrRanking.best.houseName}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span>最差: {fcrRanking.worst.batchNo} ({fcrRanking.worst.fcr.toFixed(2)})</span>
                        </div>
                      </div>
                    )}

                    {/* Daily Gain Ranking */}
                    {gainRanking && (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span className="text-xs font-semibold">日增重最优</span>
                        </div>
                        <div className={`rounded-md border p-2.5 ${getRankBadgeClass(1)}`}>
                          <p className="text-sm font-bold">{gainRanking.best.batchNo}</p>
                          <p className="text-lg font-bold text-emerald-600">{gainRanking.best.dailyGain}g</p>
                          <p className="text-[10px] text-muted-foreground">{gainRanking.best.breed} · {gainRanking.best.houseName}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span>最差: {gainRanking.worst.batchNo} ({gainRanking.worst.dailyGain}g)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Ranking Table */}
                {activeBatches.length >= 2 && (
                  <div className="mt-4">
                    <Separator className="mb-4" />
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Medal className="h-3.5 w-3.5" />
                      综合排名总览
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { title: '死淘率排名', ranking: mortRanking, lowerBetter: true },
                        { title: '成本效率排名', ranking: costRanking, lowerBetter: true },
                        { title: '料肉比排名', ranking: fcrRanking, lowerBetter: true },
                        { title: '日增重排名', ranking: gainRanking, lowerBetter: false },
                      ].map(({ title, ranking, lowerBetter }) =>
                        ranking ? (
                          <div key={title} className="rounded-lg border p-3">
                            <p className="text-[10px] text-muted-foreground mb-2 font-medium">{title}</p>
                            <div className="space-y-1.5">
                              {ranking.ranks.map(({ batch, rank }) => (
                                <div key={batch.id} className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-muted/50">
                                    {getRankIcon(rank) || (
                                      <span className="text-[10px] text-muted-foreground">{rank}</span>
                                    )}
                                  </div>
                                  <span className="text-xs font-medium flex-1 truncate">{batch.batchNo}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {lowerBetter
                                      ? (title.includes('增重')
                                          ? batch.dailyGain + 'g'
                                          : title.includes('FCR')
                                            ? batch.fcr.toFixed(2)
                                            : title.includes('成本')
                                              ? '¥' + batch.costPerBird.toFixed(2)
                                              : batch.mortalityRate + '%')
                                      : batch.dailyGain + 'g'}
                                  </span>
                                  {rank === 1 && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Banner */}
          <motion.div
            custom={5}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-transparent to-amber-50/50 pointer-events-none" />
              <CardContent className="relative p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <GitCompareArrows className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">对比分析摘要</h3>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">
                    自动生成
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">对比批次数</p>
                    <p className="text-lg font-bold">{selectedBatches.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      有效批次 {activeBatches.length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">最低死淘率</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {activeBatches.length > 0
                        ? Math.min(...activeBatches.map((b) => b.mortalityRate)) + '%'
                        : '--'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      行业标准 ≤3%
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">最优料肉比</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {activeBatches.length > 0
                        ? Math.min(...activeBatches.map((b) => b.fcr)).toFixed(2)
                        : '--'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      行业标准 ≤1.8
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">总成本均值</p>
                    <p className="text-lg font-bold">
                      {activeBatches.length > 0
                        ? formatCurrency(
                            Math.round(
                              activeBatches.reduce((s, b) => s + b.totalCost, 0) / activeBatches.length
                            )
                          )
                        : '--'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      基于已选批次平均
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {selectedBatches.length < 2 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="rounded-full bg-muted/50 p-4 mb-4">
            <GitCompareArrows className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">选择批次开始对比</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            请在上方选择至少2个（最多3个）养殖批次，系统将自动生成多维度对比分析报告
          </p>
        </motion.div>
      )}
    </div>
  )
}
