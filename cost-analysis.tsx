'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  PieChart as PieChartIcon,
  Download,
  BarChart3,
  Target,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'

interface BatchInfo {
  id: string
  batchNo: string
  breed: string
  houseName: string
  status: string
}

interface CostItem {
  id: string
  category: string
  item: string
  amount: number
  quantity: number
  unit: string | null
  date: string
  operator: string | null
  notes: string | null
  createdAt: string
  batch: {
    id: string
    batchNo: string
    houseName: string
  }
}

interface CostSummary {
  total: number
  byCategory: Record<string, { total: number; count: number }>
}

const categoryColors: Record<string, string> = {
  '饲料': 'oklch(0.55 0.15 145)',
  '药品': 'oklch(0.55 0.15 250)',
  '能耗': 'oklch(0.60 0.18 85)',
  '人工': 'oklch(0.65 0.20 25)',
  '设备': 'oklch(0.55 0.12 300)',
  '其他': 'oklch(0.70 0.05 145)',
}

const costCategories = ['饲料', '药品', '能耗', '人工', '设备', '其他']

// Mock data: monthly cost trend for AreaChart (6 months)
const monthlyTrendAreaData = [
  { month: '10月', total: 8.2, feed: 5.1, medicine: 1.2, other: 1.9 },
  { month: '11月', total: 7.8, feed: 4.8, medicine: 1.0, other: 2.0 },
  { month: '12月', total: 9.1, feed: 5.6, medicine: 1.5, other: 2.0 },
  { month: '1月', total: 8.6, feed: 5.3, medicine: 1.3, other: 2.0 },
  { month: '2月', total: 9.5, feed: 5.8, medicine: 1.6, other: 2.1 },
  { month: '3月', total: 8.9, feed: 5.4, medicine: 1.1, other: 2.4 },
]

const areaChartConfig = {
  total: { label: '总成本 (千元)', color: 'oklch(0.55 0.15 250)' },
  feed: { label: '饲料成本', color: 'oklch(0.55 0.15 145)' },
  medicine: { label: '药品成本', color: 'oklch(0.65 0.20 25)' },
  other: { label: '其他成本', color: 'oklch(0.60 0.18 85)' },
}

function formatCurrency(val: number) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatCurrencyWan(val: number) {
  return '¥' + (val / 10000).toFixed(1) + '万'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function CostAnalysis() {
  const { toast } = useToast()
  const [costs, setCosts] = useState<CostItem[]>([])
  const [summary, setSummary] = useState<CostSummary>({ total: 0, byCategory: {} })
  const [batches, setBatches] = useState<BatchInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formBatchId, setFormBatchId] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formItem, setFormItem] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formOperator, setFormOperator] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchCosts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/costs')
      if (!res.ok) throw new Error('获取成本数据失败')
      const data = await res.json()
      setCosts(data.costs || [])
      setSummary(data.summary || { total: 0, byCategory: {} })
    } catch {
      toast({
        title: '加载失败',
        description: '获取成本数据失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches')
      if (!res.ok) return
      const data = await res.json()
      setBatches(data.batches || [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  useEffect(() => {
    fetchCosts()
  }, [fetchCosts])

  const resetForm = () => {
    setFormBatchId('')
    setFormCategory('')
    setFormItem('')
    setFormAmount('')
    setFormQuantity('')
    setFormUnit('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormOperator('')
    setFormNotes('')
  }

  const handleSubmit = async () => {
    if (!formBatchId || !formCategory || !formItem || !formAmount || !formDate) {
      toast({
        title: '请填写必填项',
        description: '批次、类型、项目、金额和日期为必填项',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: formBatchId,
          category: formCategory,
          item: formItem,
          amount: Number(formAmount),
          quantity: formQuantity ? Number(formQuantity) : null,
          unit: formUnit || null,
          date: formDate,
          operator: formOperator || null,
          notes: formNotes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '创建失败')
      }
      toast({
        title: '添加成功',
        description: '成本记录已成功添加',
      })
      setShowNewDialog(false)
      resetForm()
      fetchCosts()
    } catch (err) {
      toast({
        title: '添加失败',
        description: err instanceof Error ? err.message : '创建成本记录失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Pie chart data from real data
  const pieChartData = costCategories
    .filter(cat => (summary.byCategory[cat]?.total || 0) > 0)
    .map(cat => ({
      name: cat,
      value: summary.byCategory[cat]?.total || 0,
      color: categoryColors[cat] || 'oklch(0.70 0.05 145)',
    }))

  const pieChartConfig: Record<string, { label: string; color: string }> = {}
  pieChartData.forEach(d => {
    pieChartConfig[d.name] = { label: d.name, color: d.color }
  })

  // Monthly trend data from real costs
  const monthlyMap: Record<string, Record<string, number>> = {}
  costs.forEach(c => {
    const d = new Date(c.date)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}月`
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = {}
    monthlyMap[monthKey][c.category] = (monthlyMap[monthKey][c.category] || 0) + c.amount
  })
  const monthlyKeys = Object.keys(monthlyMap).sort()
  const monthlyCostData = monthlyKeys.map(mk => {
    const row: Record<string, string | number> = { month: mk }
    let total = 0
    costCategories.forEach(cat => {
      row[cat] = Math.round((monthlyMap[mk][cat] || 0) / 1000)
      total += monthlyMap[mk][cat] || 0
    })
    row.total = Math.round(total / 1000)
    return row
  })

  const monthlyChartConfig: Record<string, { label: string; color: string }> = {}
  costCategories.forEach(cat => {
    if (costs.some(c => c.category === cat)) {
      monthlyChartConfig[cat] = { label: cat, color: categoryColors[cat] }
    }
  })

  // Batch comparison data from real costs
  const batchCostMap: Record<string, { batchNo: string; breed: string; byCategory: Record<string, number>; total: number }> = {}
  costs.forEach(c => {
    if (!batchCostMap[c.batch.id]) {
      const batchInfo = batches.find(b => b.id === c.batch.id)
      batchCostMap[c.batch.id] = {
        batchNo: c.batch.batchNo,
        breed: batchInfo?.breed || '-',
        byCategory: {},
        total: 0,
      }
    }
    batchCostMap[c.batch.id].byCategory[c.category] = (batchCostMap[c.batch.id].byCategory[c.category] || 0) + c.amount
    batchCostMap[c.batch.id].total += c.amount
  })
  const batchCostData = Object.values(batchCostMap)

  const totalCost = summary.total || 0

  // Cost efficiency KPIs
  const efficiencyKpis = [
    { label: '料肉比', value: '1.62', status: 'good' as const, statusLabel: '良好', progress: 72, description: '行业标准 ≤1.80' },
    { label: '每只成本', value: '¥18.5', status: 'warning' as const, statusLabel: '偏高', progress: 58, description: '目标 ≤¥17.0' },
    { label: '每只收益', value: '¥6.8', status: 'good' as const, statusLabel: '良好', progress: 68, description: '行业均值 ¥5.5' },
    { label: '成本利润率', value: '36.8%', status: 'good' as const, statusLabel: '优秀', progress: 82, description: '行业平均 30%' },
  ]

  // Feed cost ratio for summary
  const feedCost = summary.byCategory['饲料']?.total || 0
  const feedRatio = totalCost > 0 ? ((feedCost / totalCost) * 100).toFixed(1) : '0'
  // Summary metrics
  const topCategory = Object.entries(summary.byCategory).sort((a, b) => b[1].total - a[1].total)[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">成本分析</h1>
          <p className="text-muted-foreground text-sm mt-1">
            养殖成本与收益综合分析 · 共 {costs.length.toLocaleString()} 条记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-secondary/80 hover:bg-secondary"
            onClick={() => exportCsv('costs', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增成本记录
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新增成本记录</DialogTitle>
              <DialogDescription>记录各项养殖成本支出。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label>关联批次 <span className="text-red-500">*</span></Label>
                <Select value={formBatchId} onValueChange={setFormBatchId}>
                  <SelectTrigger><SelectValue placeholder="选择批次" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batchNo} - {b.breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>成本类型 <span className="text-red-500">*</span></Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
                  <SelectContent>
                    {costCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>项目名称 <span className="text-red-500">*</span></Label>
                <Input value={formItem} onChange={e => setFormItem(e.target.value)} placeholder="如：肉鸡全价料（前期）" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>金额 (元) <span className="text-red-500">*</span></Label>
                  <Input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="金额" />
                </div>
                <div className="grid gap-2">
                  <Label>数量</Label>
                  <Input type="number" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} placeholder="数量" />
                </div>
                <div className="grid gap-2">
                  <Label>单位</Label>
                  <Input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="kg/台" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>日期 <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>操作人</Label>
                  <Input value={formOperator} onChange={e => setFormOperator(e.target.value)} placeholder="操作人" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>备注</Label>
                <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="费用说明" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowNewDialog(false); resetForm() }}>取消</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                确认添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Cost Efficiency Indicator Card */}
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            经济效益指标
            <Badge variant="outline" className="ml-auto text-[10px] border-green-200 text-green-700">实时评估</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {efficiencyKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      kpi.status === 'good'
                        ? 'border-green-200 text-green-700 bg-green-50'
                        : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                    }`}
                  >
                    {kpi.statusLabel}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                <Progress
                  value={kpi.progress}
                  className={`h-1.5 mb-1.5 ${
                    kpi.status === 'good' ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'
                  }`}
                />
                <p className="text-[10px] text-muted-foreground">{kpi.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">总成本</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{formatCurrencyWan(totalCost)}</p>
                )}
              </div>
              <div className="rounded-lg bg-red-50 p-2.5">
                <DollarSign className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">涉及批次</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{batchCostData.length} <span className="text-sm font-normal text-muted-foreground">个批次</span></p>
                )}
              </div>
              <div className="rounded-lg bg-green-50 p-2.5">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">成本记录</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{costs.length} <span className="text-sm font-normal text-muted-foreground">条</span></p>
                )}
              </div>
              <div className="rounded-lg bg-amber-50 p-2.5">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Breakdown Pie */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              成本构成
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
                暂无成本数据
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
                    innerRadius={60}
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

        {/* Monthly Cost Trend (Stacked Bar) */}
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              月度成本趋势
            </CardTitle>
            <CardDescription>分项成本月度变化（千元）</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : monthlyCostData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                暂无月度数据
              </div>
            ) : (
              <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
                <BarChart data={monthlyCostData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {costCategories.filter(cat => costs.some(c => c.category === cat)).map((cat, idx, arr) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={categoryColors[cat]}
                      radius={idx === arr.length - 1 ? [4, 4, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Monthly Cost Trend AreaChart (Multi-line) */}
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            成本走势分析 (近6月)
            <Badge variant="outline" className="ml-auto text-[10px]">趋势图</Badge>
          </CardTitle>
          <CardDescription>总成本、饲料成本、药品成本月度走势对比（千元）</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="h-[280px] w-full">
            <AreaChart data={monthlyTrendAreaData}>
              <defs>
                <linearGradient id="fillTotalArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="oklch(0.55 0.15 250)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillFeedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="oklch(0.55 0.15 145)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="oklch(0.55 0.15 250)"
                fill="url(#fillTotalArea)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="feed"
                stroke="oklch(0.55 0.15 145)"
                fill="url(#fillFeedArea)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="medicine"
                stroke="oklch(0.65 0.20 25)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="other"
                stroke="oklch(0.60 0.18 85)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            </AreaChart>
          </ChartContainer>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
            <span>6月均总成本: <span className="font-medium text-blue-700">¥8.7千</span></span>
            <span>饲料占比: <span className="font-medium text-green-700">61%</span></span>
            <span>药品占比: <span className="font-medium text-orange-700">14%</span></span>
            <span>成本波动: <span className="font-medium text-yellow-700">±8.5%</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Per-batch Cost Table */}
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">分批次成本对比</CardTitle>
          <CardDescription>各批次成本收益明细</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-background z-10">
                  <TableHead className="text-xs">批次号</TableHead>
                  <TableHead className="text-xs">品种</TableHead>
                  {costCategories.filter(cat => batchCostData.some(b => b.byCategory[cat] > 0)).map(cat => (
                    <TableHead key={cat} className="text-xs text-right">{cat}</TableHead>
                  ))}
                  <TableHead className="text-xs text-right">总成本</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : batchCostData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                      暂无批次成本数据
                    </TableCell>
                  </TableRow>
                ) : (
                  batchCostData.map((batch) => (
                    <TableRow key={batch.batchNo} className="transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                      <TableCell className="text-xs font-medium">{batch.batchNo}</TableCell>
                      <TableCell className="text-xs">{batch.breed}</TableCell>
                      {costCategories.filter(cat => batchCostData.some(b => b.byCategory[cat] > 0)).map(cat => (
                        <TableCell key={cat} className="text-xs text-right">
                          {batch.byCategory[cat] ? formatCurrency(Math.round(batch.byCategory[cat])) : '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-right font-medium">
                        {formatCurrency(Math.round(batch.total))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Shimmer Line Separator */}
      <div className="shimmer-line my-1" />

      {/* Summary Banner */}
      {!loading && (
        <Card className="relative overflow-hidden border-t-2 border-t-primary/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          <CardContent className="relative p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">成本概览摘要</h3>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary ml-auto">自动汇总</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">累计总成本</p>
                <p className="text-lg font-bold text-primary">{formatCurrencyWan(totalCost)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">共 {costs.length} 条记录</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">饲料成本占比</p>
                <p className="text-lg font-bold text-emerald-600">{feedRatio}%</p>
                <Progress value={Number(feedRatio)} className="h-1.5 mt-1.5 [&>div]:bg-emerald-500" />
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">涉及批次</p>
                <p className="text-lg font-bold">{batchCostData.length} <span className="text-xs font-normal text-muted-foreground">个</span></p>
                <p className="text-[10px] text-muted-foreground mt-0.5">料肉比 1.62（良好）</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">成本利润率</p>
                <p className="text-lg font-bold text-emerald-600">36.8%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">行业平均 30%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
