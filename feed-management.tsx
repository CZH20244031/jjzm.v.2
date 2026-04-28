'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wheat,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart3,
  ShoppingCart,
  AlertTriangle,
  Package,
  Filter,
  CalendarDays,
  Leaf,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────

interface FeedRecord {
  id: string
  batchId: string | null
  houseName: string
  feedType: string
  quantity: number
  unit: string
  supplier: string | null
  unitPrice: number | null
  totalCost: number | null
  recordDate: string
  operator: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  batch?: { batchNo: string; breed: string; status: string } | null
}

interface FeedStats {
  todayConsumption: number
  weekConsumption: number
  monthConsumption: number
  monthCost: number
  avgUnitPrice: number
  byHouse: Record<string, number>
  byType: Record<string, number>
  dailyConsumption: Record<string, number>
  dailyCost: Record<string, number>
}

type FeedType = '肉鸡前期料' | '肉鸡中期料' | '肉鸡后期料' | '预混料' | '其他'
type HouseName = 'A1栋' | 'A2栋' | 'B1栋' | 'B2栋' | '全场'

// ─── Constants ───────────────────────────────────────────

const FEED_TYPE_CONFIG: Record<FeedType, { color: string; bg: string; border: string }> = {
  '肉鸡前期料': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  '肉鸡中期料': { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  '肉鸡后期料': { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  '预混料': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  '其他': { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
}

const PIE_COLORS = [
  'oklch(0.55 0.15 145)',
  'oklch(0.60 0.12 160)',
  'oklch(0.65 0.15 145)',
  'oklch(0.50 0.13 170)',
  'oklch(0.58 0.14 150)',
]

const CHART_COLORS = ['#10b981', '#14b8a6', '#22c55e', '#059669', '#0d9488']

// ─── Animation Variants ──────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── Helper Components ───────────────────────────────────

function FeedTypeBadge({ type }: { type: string }) {
  const cfg = FEED_TYPE_CONFIG[type as FeedType]
  if (!cfg) return <Badge variant="secondary" className="text-[10px]">{type}</Badge>
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {type}
    </Badge>
  )
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Main Component ──────────────────────────────────────

export function FeedManagement() {
  const { toast } = useToast()
  const [records, setRecords] = useState<FeedRecord[]>([])
  const [stats, setStats] = useState<FeedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterHouse, setFilterHouse] = useState<string>('全部')
  const [filterType, setFilterType] = useState<string>('全部')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FeedRecord | null>(null)
  const [formData, setFormData] = useState({
    houseName: 'A1栋' as string,
    feedType: '肉鸡前期料' as string,
    quantity: '',
    unit: 'kg' as string,
    supplier: '',
    unitPrice: '',
    totalCost: '',
    recordDate: formatDateFull(new Date().toISOString()),
    operator: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterHouse !== '全部') params.set('houseName', filterHouse)
      if (filterType !== '全部') params.set('feedType', filterType)
      if (filterStartDate) params.set('startDate', filterStartDate)
      if (filterEndDate) params.set('endDate', filterEndDate)
      const query = params.toString()
      const res = await fetch(`/api/feed${query ? `?${query}` : ''}`)
      if (!res.ok) throw new Error('请求失败')
      const json = await res.json()
      setRecords(json.records || [])
      setStats(json.stats || null)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [filterHouse, filterType, filterStartDate, filterEndDate])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Filtered records for search
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records
    return records.filter((r) =>
      (r.operator && r.operator.includes(searchTerm)) ||
      (r.notes && r.notes.includes(searchTerm)) ||
      (r.supplier && r.supplier.includes(searchTerm)) ||
      r.houseName.includes(searchTerm) ||
      r.feedType.includes(searchTerm)
    )
  }, [records, searchTerm])

  // Chart data: last 7 days consumption
  const last7DaysData = useMemo(() => {
    if (!stats?.dailyConsumption) return []
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = formatDateFull(d.toISOString())
      const month = d.getMonth() + 1
      const day = d.getDate()
      result.push({
        name: `${month}/${day}`,
        消耗量: Math.round(stats.dailyConsumption[key] || 0),
      })
    }
    return result
  }, [stats])

  // Chart data: feed by house (Pie)
  const housePieData = useMemo(() => {
    if (!stats?.byHouse) return []
    return Object.entries(stats.byHouse)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [stats])

  // Chart data: cost trend last 30 days
  const costTrendData = useMemo(() => {
    if (!stats?.dailyCost) return []
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = formatDateFull(d.toISOString())
      const month = d.getMonth() + 1
      const day = d.getDate()
      result.push({
        name: `${month}/${day}`,
        成本: Math.round(stats.dailyCost[key] || 0),
      })
    }
    return result
  }, [stats])

  // Purchase plan estimates
  const purchasePlan = useMemo(() => {
    if (!stats) return []
    const plans = [
      {
        feedType: '肉鸡后期料',
        houseName: 'A1栋',
        dailyRate: 960,
        currentStock: 5000,
        supplier: '哈铁饲料公司',
      },
      {
        feedType: '肉鸡后期料',
        houseName: 'A2栋',
        dailyRate: 680,
        currentStock: 3500,
        supplier: '北大荒饲料',
      },
      {
        feedType: '预混料',
        houseName: '全场',
        dailyRate: 20,
        currentStock: 300,
        supplier: '正大集团',
      },
      {
        feedType: '肉鸡中期料',
        houseName: 'A2栋',
        dailyRate: 700,
        currentStock: 4200,
        supplier: '北大荒饲料',
      },
      {
        feedType: '其他(微生态)',
        houseName: '全场',
        dailyRate: 5,
        currentStock: 80,
        supplier: '生物科技',
      },
    ]
    return plans.map(p => {
      const daysLeft = Math.floor(p.currentStock / p.dailyRate)
      return {
        ...p,
        daysLeft,
        status: daysLeft <= 3 ? 'danger' : daysLeft <= 7 ? 'warning' : 'normal',
      }
    })
  }, [stats])

  // Auto calculate totalCost
  function handleQuantityOrPriceChange(field: 'quantity' | 'unitPrice', value: string) {
    const newFormData = { ...formData, [field]: value }
    if (newFormData.quantity && newFormData.unitPrice) {
      const qty = parseFloat(newFormData.quantity)
      const price = parseFloat(newFormData.unitPrice)
      if (!isNaN(qty) && !isNaN(price)) {
        newFormData.totalCost = (qty * price).toFixed(2)
      }
    }
    setFormData(newFormData)
  }

  // Dialog handlers
  function openNewDialog() {
    setEditingRecord(null)
    setFormData({
      houseName: 'A1栋',
      feedType: '肉鸡前期料',
      quantity: '',
      unit: 'kg',
      supplier: '',
      unitPrice: '',
      totalCost: '',
      recordDate: formatDateFull(new Date().toISOString()),
      operator: '',
      notes: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(record: FeedRecord) {
    setEditingRecord(record)
    setFormData({
      houseName: record.houseName,
      feedType: record.feedType,
      quantity: String(record.quantity),
      unit: record.unit,
      supplier: record.supplier || '',
      unitPrice: record.unitPrice ? String(record.unitPrice) : '',
      totalCost: record.totalCost ? String(record.totalCost) : '',
      recordDate: formatDateFull(record.recordDate),
      operator: record.operator || '',
      notes: record.notes || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.houseName || !formData.feedType || !formData.quantity || !formData.recordDate) return
    setSubmitting(true)
    try {
      const body = {
        houseName: formData.houseName,
        feedType: formData.feedType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        supplier: formData.supplier.trim() || null,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
        totalCost: formData.totalCost ? parseFloat(formData.totalCost) : null,
        recordDate: formData.recordDate,
        operator: formData.operator.trim() || null,
        notes: formData.notes.trim() || null,
      }

      if (editingRecord) {
        const res = await fetch(`/api/feed/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('创建失败')
      }

      setDialogOpen(false)
      fetchRecords()
    } catch {
      // error handling
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/feed/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchRecords()
      }
    } catch {
      // error
    } finally {
      setDeleting(false)
    }
  }

  // Loading skeleton state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-white/20" />
              <Skeleton className="h-4 w-48 bg-white/20" />
            </div>
          </div>
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        {/* Content skeleton */}
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Wheat className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">饲料管理</h1>
                <p className="text-sm text-emerald-100">饲料采购、消耗与成本管理</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Leaf className="h-3.5 w-3.5" />
                <span>本月消耗 <span className="font-bold text-white">{stats ? (stats.monthConsumption / 1000).toFixed(1) : 0}</span> 吨</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Package className="h-3.5 w-3.5" />
                <span>本月成本 <span className="font-bold text-white">{stats ? (stats.monthCost / 10000).toFixed(2) : 0}</span> 万元</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>平均单价 <span className="font-bold text-white">{stats ? stats.avgUnitPrice.toFixed(2) : 0}</span> 元/kg</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Statistics Cards ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">今日消耗</p>
                  <p className="text-xl font-bold mt-1">{stats?.todayConsumption.toLocaleString() || 0} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Wheat className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {stats && stats.todayConsumption > 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-[11px] text-muted-foreground">较昨日正常消耗</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-teal-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">本月消耗</p>
                  <p className="text-xl font-bold mt-1">{stats ? (stats.monthConsumption / 1000).toFixed(1) : 0} <span className="text-xs font-normal text-muted-foreground">吨</span></p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {stats && stats.weekConsumption > 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-teal-500" />
                    <span className="text-[11px] text-teal-600">本周 {(stats.weekConsumption / 1000).toFixed(1)} 吨</span>
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground">暂无数据</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-green-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">平均单价</p>
                  <p className="text-xl font-bold mt-1">{stats?.avgUnitPrice.toFixed(2) || 0} <span className="text-xs font-normal text-muted-foreground">元/kg</span></p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Minus className="h-3 w-3 text-green-500" />
                <span className="text-[11px] text-muted-foreground">本月均价持平</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-amber-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">本月成本</p>
                  <p className="text-xl font-bold mt-1">{stats ? (stats.monthCost / 10000).toFixed(2) : 0} <span className="text-xs font-normal text-muted-foreground">万元</span></p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Leaf className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] text-muted-foreground">饲料成本稳定</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Main Tabs ──────────────────────────────────── */}
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              <Wheat className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              记录列表
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              消耗分析
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-xs sm:text-sm">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              采购计划
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-secondary/80 hover:bg-secondary"
              onClick={() => exportCsv('feed', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              导出数据
            </Button>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              添加记录
            </Button>
          </div>
        </div>

        {/* ─── 记录列表 Tab ─────────────────────────────── */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters Row */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索操作员、备注、供应商..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterHouse} onValueChange={setFilterHouse}>
                <SelectTrigger className="w-[110px] h-9 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="鸡舍" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部鸡舍</SelectItem>
                  <SelectItem value="A1栋">A1栋</SelectItem>
                  <SelectItem value="A2栋">A2栋</SelectItem>
                  <SelectItem value="B1栋">B1栋</SelectItem>
                  <SelectItem value="B2栋">B2栋</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="饲料类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部类型</SelectItem>
                  <SelectItem value="肉鸡前期料">肉鸡前期料</SelectItem>
                  <SelectItem value="肉鸡中期料">肉鸡中期料</SelectItem>
                  <SelectItem value="肉鸡后期料">肉鸡后期料</SelectItem>
                  <SelectItem value="预混料">预混料</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-[140px] h-9 text-xs"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                placeholder="开始日期"
              />
              <Input
                type="date"
                className="w-[140px] h-9 text-xs"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                placeholder="结束日期"
              />
            </div>
          </motion.div>

          {/* Records Table */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[480px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">日期</TableHead>
                          <TableHead className="text-xs">鸡舍</TableHead>
                          <TableHead className="text-xs">饲料类型</TableHead>
                          <TableHead className="text-xs text-right">用量(kg)</TableHead>
                          <TableHead className="text-xs text-right">单价(元)</TableHead>
                          <TableHead className="text-xs text-right">总价(元)</TableHead>
                          <TableHead className="text-xs">操作员</TableHead>
                          <TableHead className="text-xs">备注</TableHead>
                          <TableHead className="text-xs text-center">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                              暂无饲料记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecords.map((record) => (
                            <TableRow key={record.id} className="hover:bg-muted/50">
                              <TableCell className="text-xs font-medium">{formatDateShort(record.recordDate)}</TableCell>
                              <TableCell className="text-xs">{record.houseName}</TableCell>
                              <TableCell>
                                <FeedTypeBadge type={record.feedType} />
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {record.unit === '吨' ? (record.quantity * 1000).toFixed(0) : record.quantity.toFixed(0)}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {record.unitPrice ? record.unitPrice.toFixed(2) : '--'}
                              </TableCell>
                              <TableCell className="text-xs text-right font-mono">
                                {record.totalCost ? record.totalCost.toFixed(0) : '--'}
                              </TableCell>
                              <TableCell className="text-xs">{record.operator || '--'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                {record.notes || '--'}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-xs"
                                    onClick={() => openEditDialog(record)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteId(record.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── 消耗分析 Tab ─────────────────────────────── */}
        <TabsContent value="analysis" className="space-y-4">
          {/* Summary Stats */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4 border-t-2 border-t-emerald-500/30">
                <p className="text-[11px] text-muted-foreground">总消耗(本月)</p>
                <p className="text-lg font-bold mt-1">{stats ? (stats.monthConsumption / 1000).toFixed(1) : 0} <span className="text-xs font-normal text-muted-foreground">吨</span></p>
              </Card>
              <Card className="p-4 border-t-2 border-t-teal-500/30">
                <p className="text-[11px] text-muted-foreground">日均消耗</p>
                <p className="text-lg font-bold mt-1">{stats ? Math.round(stats.monthConsumption / 30).toLocaleString() : 0} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
              </Card>
              <Card className="p-4 border-t-2 border-t-green-500/30">
                <p className="text-[11px] text-muted-foreground">总成本(本月)</p>
                <p className="text-lg font-bold mt-1">{stats ? (stats.monthCost / 10000).toFixed(2) : 0} <span className="text-xs font-normal text-muted-foreground">万元</span></p>
              </Card>
              <Card className="p-4 border-t-2 border-t-amber-500/30">
                <p className="text-[11px] text-muted-foreground">只均日耗</p>
                <p className="text-lg font-bold mt-1">{stats ? (Math.round(stats.monthConsumption / 30) / 34000 * 1000).toFixed(1) : 0} <span className="text-xs font-normal text-muted-foreground">g/只</span></p>
              </Card>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Consumption BarChart */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">近7日消耗量</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {last7DaysData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={last7DaysData} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(value: number) => [`${value} kg`, '消耗量']}
                        />
                        <Bar dataKey="消耗量" radius={[4, 4, 0, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">暂无数据</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Feed by House PieChart */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                      <Wheat className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">鸡舍消耗分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {housePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={housePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {housePieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(value: number) => [`${value} kg`, '消耗量']}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => <span className="text-xs">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">暂无数据</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Cost Trend AreaChart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">近30日成本趋势</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {costTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={costTrendData} margin={{ left: -10, right: 10 }}>
                      <defs>
                        <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={4} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        formatter={(value: number) => [`¥${value}`, '成本']}
                      />
                      <Area type="monotone" dataKey="成本" stroke="#10b981" strokeWidth={2} fill="url(#costGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">暂无数据</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── 采购计划 Tab ─────────────────────────────── */}
        <TabsContent value="plan" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-t-2 border-t-amber-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">采购计划提醒</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                    基于当前消耗率估算
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="max-h-96">
                  <div className="space-y-3 pr-3">
                    {purchasePlan.map((plan, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-sm
                          ${plan.status === 'danger'
                            ? 'border-red-200 bg-red-50/50'
                            : plan.status === 'warning'
                              ? 'border-amber-200 bg-amber-50/50'
                              : 'border-border'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-medium">{plan.feedType}</h4>
                              <Badge variant="outline" className="text-[10px]">{plan.houseName}</Badge>
                              {plan.status === 'danger' && (
                                <Badge className="bg-red-500 text-white text-[10px] hover:bg-red-500">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  紧急
                                </Badge>
                              )}
                              {plan.status === 'warning' && (
                                <Badge className="bg-amber-500 text-white text-[10px] hover:bg-amber-500">
                                  <CalendarDays className="h-3 w-3 mr-1" />
                                  即将不足
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                              <span>供应商: <span className="text-foreground">{plan.supplier}</span></span>
                              <span>日消耗: <span className="text-foreground font-mono">{plan.dailyRate} kg</span></span>
                              <span>库存: <span className={`font-mono ${plan.status === 'danger' ? 'text-red-600 font-semibold' : 'text-foreground'}`}>{plan.currentStock.toLocaleString()} kg</span></span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold ${plan.status === 'danger' ? 'text-red-600' : plan.status === 'warning' ? 'text-amber-600' : 'text-foreground'}`}>
                              {plan.daysLeft}
                            </p>
                            <p className="text-[10px] text-muted-foreground">预计剩余天数</p>
                          </div>
                        </div>
                        {plan.daysLeft <= 7 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    plan.daysLeft <= 3 ? 'bg-red-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (plan.daysLeft / 14) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{plan.daysLeft}/14天</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              建议: 立即采购 <span className="font-medium text-foreground">{Math.ceil(plan.dailyRate * 14 - plan.currentStock).toLocaleString()}</span> kg 以保证14天用量
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ─── Add/Edit Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingRecord ? '编辑饲料记录' : '添加饲料记录'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord ? '修改饲料消耗记录信息' : '记录饲料使用情况，系统将自动计算成本'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>鸡舍 <span className="text-red-500">*</span></Label>
                <Select value={formData.houseName} onValueChange={(v) => setFormData({ ...formData, houseName: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择鸡舍" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1栋">A1栋</SelectItem>
                    <SelectItem value="A2栋">A2栋</SelectItem>
                    <SelectItem value="B1栋">B1栋</SelectItem>
                    <SelectItem value="B2栋">B2栋</SelectItem>
                    <SelectItem value="全场">全场</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>饲料类型 <span className="text-red-500">*</span></Label>
                <Select value={formData.feedType} onValueChange={(v) => setFormData({ ...formData, feedType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="肉鸡前期料">肉鸡前期料</SelectItem>
                    <SelectItem value="肉鸡中期料">肉鸡中期料</SelectItem>
                    <SelectItem value="肉鸡后期料">肉鸡后期料</SelectItem>
                    <SelectItem value="预混料">预混料</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>用量 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityOrPriceChange('quantity', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>单位</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="吨">吨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>单价(元/kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) => handleQuantityOrPriceChange('unitPrice', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>总价(元)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="自动计算或手动输入"
                  value={formData.totalCost}
                  onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">输入用量和单价后自动计算</p>
              </div>
              <div className="grid gap-2">
                <Label>供应商</Label>
                <Input
                  placeholder="饲料供应商"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>记录日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>操作员</Label>
                <Input
                  placeholder="操作员姓名"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>备注</Label>
              <Textarea
                placeholder="饲料使用备注信息..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.houseName || !formData.feedType || !formData.quantity || !formData.recordDate}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {editingRecord ? '更新中...' : '添加中...'}
                </>
              ) : (
                editingRecord ? '保存修改' : '确认添加'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              此操作不可恢复，确定要删除这条饲料记录吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
