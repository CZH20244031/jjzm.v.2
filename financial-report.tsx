'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Wallet,
  Download,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  DollarSign,
  Percent,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface FinancialData {
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  costByCategory: { category: string; total: number }[]
  monthlyData: { month: string; revenue: number; cost: number; profit: number }[]
  recentSales: {
    id: string
    batchNo: string | null
    buyer: string
    quantity: number
    unitPrice: number
    totalPrice: number
    saleDate: string
    status: string
    paymentStatus: string
  }[]
  recentCosts: {
    id: string
    category: string
    item: string
    amount: number
    date: string
    batchNo: string
    houseName: string
  }[]
}

const categoryColors: Record<string, string> = {
  '饲料': 'oklch(0.55 0.15 145)',
  '药品': 'oklch(0.65 0.20 25)',
  '人工': 'oklch(0.60 0.18 85)',
  '能耗': 'oklch(0.60 0.15 55)',
  '设备': 'oklch(0.55 0.12 310)',
  '其他': 'oklch(0.70 0.05 145)',
}

const costCategories = ['饲料', '药品', '人工', '能耗', '设备', '其他']

function formatCurrency(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatCurrencyWan(val: number) {
  if (Math.abs(val) >= 10000) {
    return '¥' + (val / 10000).toFixed(1) + '万'
  }
  return formatCurrency(val)
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return `${year}年${parseInt(month)}月`
}

export function FinancialReport() {
  const { toast } = useToast()
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/financial-report')
      if (!res.ok) throw new Error('获取财务数据失败')
      const json = await res.json()
      setData(json)
    } catch {
      toast({
        title: '加载失败',
        description: '获取财务报表数据失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportCsv('financial', {
        onSuccess: () => toast({ title: '导出成功', description: '财务报表已导出' }),
        onError: (msg) => toast({ title: '导出失败', description: msg, variant: 'destructive' }),
      })
    } finally {
      setExporting(false)
    }
  }

  // KPI data
  const totalRevenue = data?.totalRevenue ?? 0
  const totalCost = data?.totalCost ?? 0
  const netProfit = data?.netProfit ?? 0
  const profitMargin = data?.profitMargin ?? 0
  const isProfit = netProfit >= 0

  // Data range
  const months = data?.monthlyData ?? []
  const dateRange =
    months.length > 0
      ? `${formatMonth(months[0].month)} - ${formatMonth(months[months.length - 1].month)}`
      : '暂无数据'

  // Bar chart: Revenue vs Cost by month
  const barChartData = months.map((m) => ({
    month: formatMonth(m.month),
    收入: m.revenue,
    成本: m.cost,
  }))

  const barChartConfig = {
    收入: { label: '收入 (元)', color: 'oklch(0.55 0.15 145)' },
    成本: { label: '成本 (元)', color: 'oklch(0.65 0.20 25)' },
  }

  // Pie chart: Cost breakdown by category
  const pieChartData = (data?.costByCategory ?? [])
    .filter((item) => item.total > 0)
    .map((item) => ({
      name: item.category,
      value: item.total,
      color: categoryColors[item.category] || 'oklch(0.70 0.05 145)',
    }))

  const pieChartConfig: Record<string, { label: string; color: string }> = {}
  pieChartData.forEach((d) => {
    pieChartConfig[d.name] = { label: d.name, color: d.color }
  })

  // Line chart: Profit trend
  const lineChartData = months.map((m) => ({
    month: formatMonth(m.month),
    利润: m.profit,
  }))

  const lineChartConfig = {
    利润: { label: '净利润 (元)', color: isProfit ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.20 25)' },
  }

  // KPI Cards
  const kpiCards = [
    {
      label: '总收入',
      value: totalRevenue,
      formatted: formatCurrencyWan(totalRevenue),
      icon: DollarSign,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: totalRevenue > 0 ? 'up' : 'neutral',
    },
    {
      label: '总成本',
      value: totalCost,
      formatted: formatCurrencyWan(totalCost),
      icon: BarChart3,
      iconBg: 'bg-red-50 dark:bg-red-950/40',
      iconColor: 'text-red-500 dark:text-red-400',
      trend: totalCost > 0 ? 'down' : 'neutral',
    },
    {
      label: '净利润',
      value: netProfit,
      formatted: formatCurrencyWan(netProfit),
      icon: isProfit ? TrendingUp : TrendingDown,
      iconBg: isProfit ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40',
      iconColor: isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      trend: netProfit > 0 ? 'up' : netProfit < 0 ? 'down' : 'neutral',
    },
    {
      label: '利润率',
      value: profitMargin,
      formatted: profitMargin.toFixed(1) + '%',
      icon: Percent,
      iconBg: isProfit ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400',
      trend: profitMargin > 0 ? 'up' : profitMargin < 0 ? 'down' : 'neutral',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">财务报表</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              养殖收支综合分析 · {dateRange}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-secondary/80 hover:bg-secondary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            导出报表
          </Button>
        </div>
      </motion.div>

      {/* Summary KPI Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpiCards.map((kpi) => (
          <motion.div key={kpi.label} variants={staggerItem}>
            <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <>
                        <p className="text-xl sm:text-2xl font-bold mt-0.5 truncate">
                          {kpi.formatted}
                        </p>
                        {kpi.trend !== 'neutral' && (
                          <div className={`flex items-center gap-0.5 mt-1 text-[11px] ${kpi.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {kpi.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>{kpi.trend === 'up' ? '增长' : '下降'}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`rounded-lg p-2.5 shrink-0 ${kpi.iconBg}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Cost Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                收入与成本对比
                <Badge variant="outline" className="ml-auto text-[10px]">月度</Badge>
              </CardTitle>
              <CardDescription>月度收入与成本分组对比</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : barChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  暂无月度数据
                </div>
              ) : (
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                  <BarChart data={barChartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="收入" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="成本" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cost Breakdown Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                成本构成分析
                <Badge variant="outline" className="ml-auto text-[10px]">分类</Badge>
              </CardTitle>
              <CardDescription>各类成本占比分布</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pieChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  暂无成本分类数据
                </div>
              ) : (
                <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={2}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Profit Trend Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {isProfit ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              利润趋势
              <Badge
                variant="outline"
                className={`ml-auto text-[10px] ${isProfit ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'}`}
              >
                {isProfit ? '盈利' : '亏损'}
              </Badge>
            </CardTitle>
            <CardDescription>月度净利润走势变化</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : lineChartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                暂无利润趋势数据
              </div>
            ) : (
              <>
                <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
                  <LineChart data={lineChartData}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isProfit ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.20 25)'}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor={isProfit ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.20 25)'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="利润"
                      stroke={isProfit ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.20 25)'}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: isProfit ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.20 25)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
                  <span>
                    累计净利润:{' '}
                    <span className={`font-medium ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {formatCurrency(netProfit)}
                    </span>
                  </span>
                  <span>
                    利润率:{' '}
                    <span className={`font-medium ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {profitMargin.toFixed(1)}%
                    </span>
                  </span>
                  <span>
                    统计月数: <span className="font-medium">{months.length} 个月</span>
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Monthly Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              月度财务明细
              <Badge variant="outline" className="ml-auto text-[10px]">
                {months.length} 条记录
              </Badge>
            </CardTitle>
            <CardDescription>按月汇总的收入、成本、利润与利润率</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead className="text-xs">月份</TableHead>
                    <TableHead className="text-xs text-right">收入 (元)</TableHead>
                    <TableHead className="text-xs text-right">成本 (元)</TableHead>
                    <TableHead className="text-xs text-right">净利润 (元)</TableHead>
                    <TableHead className="text-xs text-right">利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : months.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        暂无月度财务数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    months.map((row) => {
                      const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0.0'
                      const rowProfit = row.profit
                      return (
                        <TableRow
                          key={row.month}
                          className="transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                        >
                          <TableCell className="text-xs font-medium">
                            {formatMonth(row.month)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatCurrency(row.revenue)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-red-500 dark:text-red-400">
                            {formatCurrency(row.cost)}
                          </TableCell>
                          <TableCell
                            className={`text-xs text-right font-medium ${
                              rowProfit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {rowProfit >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {formatCurrency(Math.abs(rowProfit))}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                Number(margin) >= 0
                                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/40'
                                  : 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950/40'
                              }`}
                            >
                              {margin}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Bottom Summary Banner */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-t-2 border-t-primary/30">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            <CardContent className="relative p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">财务概览摘要</h3>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">
                  自动汇总
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">累计总收入</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyWan(totalRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{data.recentSales.length} 条销售记录</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">累计总成本</p>
                  <p className="text-lg font-bold text-red-500 dark:text-red-400">{formatCurrencyWan(totalCost)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{data.recentCosts.length} 条成本记录</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">累计净利润</p>
                  <p className={`text-lg font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {formatCurrencyWan(netProfit)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isProfit ? '当前盈利' : '当前亏损'}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">综合利润率</p>
                  <p className={`text-lg font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">行业平均 30%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
