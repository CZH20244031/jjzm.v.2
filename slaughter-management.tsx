'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Truck,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ShieldCheck,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  ArrowUpRight,
  Loader2,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'

interface BatchInfo {
  batchNo: string
  breed: string | null
  house: { name: string }
}

interface SlaughterRecord {
  id: string
  batchId: string
  batchNo: string | null
  houseName: string | null
  breed: string | null
  plannedDate: string
  actualDate: string | null
  quantity: number
  avgWeight: number | null
  totalPrice: number | null
  buyer: string | null
  status: string
  approvalBy: string | null
  approvalAt: string | null
  notes: string | null
  createdAt: string
  batch: BatchInfo
}

interface SlaughterSummary {
  total: number
  planned: number
  pendingApproval: number
  approved: number
  executing: number
  completed: number
  cancelled: number
  totalQuantity: number
  totalRevenue: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function getStatusColor(status: string) {
  switch (status) {
    case '计划中': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case '待审批': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case '已审批': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
    case '执行中': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case '已完成': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case '已取消': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case '计划中': return <CalendarClock className="h-4 w-4 text-blue-500" />
    case '待审批': return <ShieldCheck className="h-4 w-4 text-amber-500" />
    case '已审批': return <ShieldCheck className="h-4 w-4 text-teal-500" />
    case '执行中': return <Truck className="h-4 w-4 text-purple-500" />
    case '已完成': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case '已取消': return <XCircle className="h-4 w-4 text-gray-400" />
    default: return <Clock className="h-4 w-4 text-gray-400" />
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getCountdown(plannedDate: string) {
  const now = new Date()
  const target = new Date(plannedDate)
  const diff = target.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return { text: `已过${Math.abs(days)}天`, urgent: false }
  if (days === 0) return { text: '今天', urgent: true }
  if (days <= 3) return { text: `${days}天后`, urgent: true }
  return { text: `${days}天后`, urgent: false }
}

const barChartConfig = {
  quantity: { label: '出栏数量(只)', color: '#10b981' },
  revenue: { label: '收入(万元)', color: '#14b8a6' },
} satisfies ChartConfig

const pieChartConfig = {
  计划中: { label: '计划中', color: '#3b82f6' },
  待审批: { label: '待审批', color: '#f59e0b' },
  已审批: { label: '已审批', color: '#14b8a6' },
  执行中: { label: '执行中', color: '#8b5cf6' },
  已完成: { label: '已完成', color: '#10b981' },
  已取消: { label: '已取消', color: '#6b7280' },
} satisfies ChartConfig

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#14b8a6', '#8b5cf6', '#10b981', '#6b7280']

export function SlaughterManagement() {
  const [records, setRecords] = useState<SlaughterRecord[]>([])
  const [summary, setSummary] = useState<SlaughterSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editRecord, setEditRecord] = useState<SlaughterRecord | null>(null)
  const [viewRecord, setViewRecord] = useState<SlaughterRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state for create/edit
  const [formData, setFormData] = useState({
    batchId: '',
    batchNo: '',
    houseName: '',
    breed: '',
    plannedDate: '',
    quantity: '',
    avgWeight: '',
    totalPrice: '',
    buyer: '',
    notes: '',
  })

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== '全部') params.set('status', filterStatus)
      const res = await fetch(`/api/slaughter?${params}`)
      const json = await res.json()
      if (json.success) {
        setRecords(json.data)
        setSummary(json.summary)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const filteredRecords = records.filter(r =>
    !searchTerm ||
    (r.batchNo && r.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.batch?.batchNo && r.batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.buyer && r.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.houseName && r.houseName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Monthly chart data
  const monthlyData = (() => {
    const map = new Map<string, { month: string; quantity: number; revenue: number }>()
    records.filter(r => r.status === '已完成' && r.actualDate).forEach(r => {
      const month = r.actualDate!.slice(0, 7)
      const existing = map.get(month) || { month, quantity: 0, revenue: 0 }
      existing.quantity += r.quantity
      existing.revenue += (r.totalPrice ?? 0) / 10000
      map.set(month, existing)
    })
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
  })()

  // Status distribution for pie chart
  const statusData = (() => {
    const counts: Record<string, number> = {}
    records.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })()

  // Upcoming plans (计划中 and 待审批)
  const upcomingPlans = records
    .filter(r => r.status === '计划中' || r.status === '待审批')
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())

  const resetForm = () => {
    setFormData({
      batchId: '',
      batchNo: '',
      houseName: '',
      breed: '',
      plannedDate: '',
      quantity: '',
      avgWeight: '',
      totalPrice: '',
      buyer: '',
      notes: '',
    })
  }

  const handleCreate = async () => {
    if (!formData.batchId || !formData.plannedDate || !formData.quantity) {
      toast({ title: '请填写必填字段', description: '批次、计划日期、数量为必填', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/slaughter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: '创建成功', description: '出栏记录已创建' })
        setShowAddDialog(false)
        resetForm()
        fetchRecords()
      } else {
        toast({ title: '创建失败', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: '创建失败', description: '网络错误', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editRecord) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/slaughter/${editRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: '更新成功', description: '出栏记录已更新' })
        setEditRecord(null)
        fetchRecords()
      } else {
        toast({ title: '更新失败', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: '更新失败', description: '网络错误', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/slaughter/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast({ title: '删除成功' })
        setEditRecord(null)
        fetchRecords()
      } else {
        toast({ title: '删除失败', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: '删除失败', description: '网络错误', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = (record: SlaughterRecord, newStatus: string) => {
    handleUpdate({ status: newStatus })
  }

  const openEdit = (record: SlaughterRecord) => {
    setEditRecord(record)
    setFormData({
      batchId: record.batchId,
      batchNo: record.batchNo || record.batch?.batchNo || '',
      houseName: record.houseName || record.batch?.house?.name || '',
      breed: record.breed || record.batch?.breed || '',
      plannedDate: record.plannedDate.slice(0, 10),
      quantity: String(record.quantity),
      avgWeight: record.avgWeight ? String(record.avgWeight) : '',
      totalPrice: record.totalPrice ? String(record.totalPrice) : '',
      buyer: record.buyer || '',
      notes: record.notes || '',
    })
  }

  const completedRecords = records.filter(r => r.status === '已完成')
  const avgWeightAll = completedRecords.length > 0
    ? (completedRecords.reduce((sum, r) => sum + (r.avgWeight ?? 0), 0) / completedRecords.length).toFixed(2)
    : '--'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-600" />
            出栏管理
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {summary ? (
              <>
                共 <span className="font-medium text-foreground">{summary.total}</span> 条记录 ·
                <span className="text-emerald-600"> 已完成 {summary.completed}</span> ·
                <span className="text-amber-600"> 待审批 {summary.pendingApproval}</span> ·
                <span className="text-blue-600"> 计划中 {summary.planned}</span>
              </>
            ) : '加载中...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-secondary/80 hover:bg-secondary" onClick={() => exportCsv('slaughter', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}>
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                新建出栏计划
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  新建出栏计划
                </DialogTitle>
                <DialogDescription>创建新的出栏申请记录</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">批次ID *</Label>
                  <Input
                    placeholder="选择关联批次"
                    value={formData.batchId}
                    onChange={e => setFormData(prev => ({ ...prev, batchId: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">批次号</Label>
                    <Input
                      placeholder="如 PC-2025-006"
                      value={formData.batchNo}
                      onChange={e => setFormData(prev => ({ ...prev, batchNo: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">品种</Label>
                    <Input
                      placeholder="如 AA肉鸡"
                      value={formData.breed}
                      onChange={e => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">计划日期 *</Label>
                    <Input
                      type="date"
                      value={formData.plannedDate}
                      onChange={e => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">出栏数量(只) *</Label>
                    <Input
                      type="number"
                      placeholder="如 19000"
                      value={formData.quantity}
                      onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">预计均重(kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="如 2.85"
                      value={formData.avgWeight}
                      onChange={e => setFormData(prev => ({ ...prev, avgWeight: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">买家</Label>
                    <Input
                      placeholder="买家名称"
                      value={formData.buyer}
                      onChange={e => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">备注</Label>
                  <Textarea
                    placeholder="出栏相关备注信息"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="text-xs min-h-[60px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setShowAddDialog(false); resetForm() }}>取消</Button>
                <Button size="sm" onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-blue-400 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  计划出栏
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">计划出栏数量</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary ? `${(summary.totalQuantity / 10000).toFixed(2)}万只` : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-amber-400 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  {summary ? summary.pendingApproval : '--'} 条
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">待审批</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {summary ? `${summary.pendingApproval} 条待处理` : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-t-2 border-t-emerald-400 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  已完成
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">已完成出栏</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {summary ? `${summary.completed} 批次` : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                  <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                  总收入
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-white/70 mb-1">累计出栏总收入</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary ? formatCurrency(summary.totalRevenue) : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="records" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ClipboardList className="h-3.5 w-3.5" />
            出栏记录
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            出栏统计
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarClock className="h-3.5 w-3.5" />
            出栏计划
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Records Table */}
        <TabsContent value="records" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">出栏记录列表</CardTitle>
                  <CardDescription className="text-xs">管理所有出栏申请和记录</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索批次号/买家..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs w-44 sm:w-56"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 w-24 sm:w-28 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部状态</SelectItem>
                      <SelectItem value="计划中">计划中</SelectItem>
                      <SelectItem value="待审批">待审批</SelectItem>
                      <SelectItem value="已审批">已审批</SelectItem>
                      <SelectItem value="执行中">执行中</SelectItem>
                      <SelectItem value="已完成">已完成</SelectItem>
                      <SelectItem value="已取消">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Truck className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-xs">暂无出栏记录</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <ScrollArea className="max-h-[480px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs h-9">批次号</TableHead>
                            <TableHead className="text-xs h-9">品种</TableHead>
                            <TableHead className="text-xs h-9">鸡舍</TableHead>
                            <TableHead className="text-xs h-9">计划日期</TableHead>
                            <TableHead className="text-xs h-9">实际日期</TableHead>
                            <TableHead className="text-xs h-9 text-right">数量(只)</TableHead>
                            <TableHead className="text-xs h-9 text-right">均重(kg)</TableHead>
                            <TableHead className="text-xs h-9 text-right">总价(元)</TableHead>
                            <TableHead className="text-xs h-9">买家</TableHead>
                            <TableHead className="text-xs h-9">状态</TableHead>
                            <TableHead className="text-xs h-9 text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecords.map((record, idx) => (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.02 }}
                              className="border-b hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="text-xs py-2.5 font-medium">
                                {record.batchNo || record.batch?.batchNo || '--'}
                              </TableCell>
                              <TableCell className="text-xs py-2.5">{record.breed || record.batch?.breed || '--'}</TableCell>
                              <TableCell className="text-xs py-2.5">{record.houseName || record.batch?.house?.name || '--'}</TableCell>
                              <TableCell className="text-xs py-2.5 tabular-nums">{formatDate(record.plannedDate)}</TableCell>
                              <TableCell className="text-xs py-2.5 tabular-nums">{record.actualDate ? formatDate(record.actualDate) : '--'}</TableCell>
                              <TableCell className="text-xs py-2.5 text-right tabular-nums font-medium">{record.quantity.toLocaleString()}</TableCell>
                              <TableCell className="text-xs py-2.5 text-right tabular-nums">{record.avgWeight ? record.avgWeight.toFixed(2) : '--'}</TableCell>
                              <TableCell className="text-xs py-2.5 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                                {record.totalPrice ? formatCurrency(record.totalPrice) : '--'}
                              </TableCell>
                              <TableCell className="text-xs py-2.5">{record.buyer || '--'}</TableCell>
                              <TableCell className="text-xs py-2.5">
                                <Badge className={`text-[10px] ${getStatusColor(record.status)}`}>{record.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {record.status === '待审批' && (
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                      onClick={() => handleStatusChange(record, '已审批')}>
                                      审批
                                    </Button>
                                  )}
                                  {(record.status === '已审批' || record.status === '执行中') && (
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                      onClick={() => handleStatusChange(record, '已完成')}>
                                      完成
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]"
                                    onClick={() => setViewRecord(record)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]"
                                    onClick={() => openEdit(record)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>

                  {/* Mobile List */}
                  <div className="md:hidden divide-y">
                    {filteredRecords.map((record, idx) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                        onClick={() => setViewRecord(record)}
                      >
                        <div className="shrink-0">
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-muted/50">
                            {getStatusIcon(record.status)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">
                              {record.batchNo || record.batch?.batchNo || '--'}
                            </span>
                            <Badge className={`text-[10px] shrink-0 ${getStatusColor(record.status)}`}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{record.houseName || record.batch?.house?.name || '--'}</span>
                            <span>·</span>
                            <span>{record.quantity.toLocaleString()}只</span>
                            {record.totalPrice && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {formatCurrency(record.totalPrice)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {record.status === '待审批' && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-teal-600"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(record, '已审批') }}>
                              审批
                            </Button>
                          )}
                          {(record.status === '已审批' || record.status === '执行中') && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-emerald-600"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(record, '已完成') }}>
                              完成
                            </Button>
                          )}
                          <Eye className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Statistics */}
        <TabsContent value="stats" className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">总出栏量</p>
                <p className="text-xl font-bold tabular-nums">
                  {summary ? `${summary.totalQuantity.toLocaleString()}` : '--'}
                  <span className="text-xs font-normal text-muted-foreground ml-1">只</span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">总收入</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {summary ? formatCurrency(summary.totalRevenue) : '--'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">平均均重</p>
                <p className="text-xl font-bold tabular-nums">
                  {avgWeightAll}
                  <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar Chart - Monthly */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  月度出栏统计
                </CardTitle>
                <CardDescription className="text-xs">已完成出栏的月度数量与收入</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-muted-foreground text-xs">
                    暂无已完成出栏数据
                  </div>
                ) : (
                  <ChartContainer config={barChartConfig} className="h-[240px] w-full">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Status Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-600" />
                  状态分布
                </CardTitle>
                <CardDescription className="text-xs">各状态出栏记录数量占比</CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-muted-foreground text-xs">
                    暂无数据
                  </div>
                ) : (
                  <ChartContainer config={pieChartConfig} className="h-[240px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={2}
                      >
                        {statusData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Plans Timeline */}
        <TabsContent value="plans" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-emerald-600" />
                    出栏计划时间线
                  </CardTitle>
                  <CardDescription className="text-xs">即将到来的出栏计划</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {upcomingPlans.length} 个计划
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CalendarClock className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-xs">暂无待执行出栏计划</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {upcomingPlans.map((record) => {
                    const countdown = getCountdown(record.plannedDate)
                    return (
                      <motion.div
                        key={record.id}
                        variants={itemVariants}
                        className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                      >
                        {/* Timeline Dot */}
                        <div className="flex flex-col items-center pt-1">
                          <div className={`h-3 w-3 rounded-full shrink-0 ${
                            countdown.urgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <div className="w-px h-12 bg-border mt-1" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {record.batchNo || record.batch?.batchNo || '--'}
                              </span>
                              <Badge className={`text-[10px] ${getStatusColor(record.status)}`}>
                                {record.status}
                              </Badge>
                              <span className={`text-[10px] font-medium ${countdown.urgent ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                {countdown.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {record.status === '计划中' && (
                                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                                  onClick={() => handleStatusChange(record, '待审批')}>
                                  <ShieldCheck className="h-3 w-3" />
                                  提交审批
                                </Button>
                              )}
                              {record.status === '待审批' && (
                                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:hover:bg-teal-900/20"
                                  onClick={() => handleStatusChange(record, '已审批')}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  审批通过
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 text-[10px]"
                                onClick={() => openEdit(record)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>品种:</span>
                              <span className="font-medium text-foreground">{record.breed || record.batch?.breed || '--'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>鸡舍:</span>
                              <span className="font-medium text-foreground">{record.houseName || record.batch?.house?.name || '--'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>数量:</span>
                              <span className="font-medium text-foreground tabular-nums">{record.quantity.toLocaleString()}只</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>计划日期:</span>
                              <span className="font-medium text-foreground tabular-nums">{formatDate(record.plannedDate)}</span>
                            </div>
                          </div>
                          {record.buyer && (
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                              买家: <span className="text-foreground">{record.buyer}</span>
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Detail Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              出栏记录详情
            </DialogTitle>
            <DialogDescription>查看出栏记录完整信息</DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">批次号</p>
                  <p className="text-sm font-medium">{viewRecord.batchNo || viewRecord.batch?.batchNo || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">品种</p>
                  <p className="text-sm">{viewRecord.breed || viewRecord.batch?.breed || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">鸡舍</p>
                  <p className="text-sm">{viewRecord.houseName || viewRecord.batch?.house?.name || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">买家</p>
                  <p className="text-sm">{viewRecord.buyer || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">计划日期</p>
                  <p className="text-sm tabular-nums">{formatDate(viewRecord.plannedDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">实际日期</p>
                  <p className="text-sm tabular-nums">{viewRecord.actualDate ? formatDate(viewRecord.actualDate) : '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">出栏数量</p>
                  <p className="text-sm font-medium tabular-nums">{viewRecord.quantity.toLocaleString()} 只</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">均重</p>
                  <p className="text-sm tabular-nums">{viewRecord.avgWeight ? `${viewRecord.avgWeight} kg` : '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">总售价</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {viewRecord.totalPrice ? formatCurrency(viewRecord.totalPrice) : '--'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">审批人</p>
                  <p className="text-sm">{viewRecord.approvalBy || '--'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(viewRecord.status)}>{viewRecord.status}</Badge>
                {viewRecord.approvalAt && (
                  <p className="text-[10px] text-muted-foreground">
                    审批时间: {formatDate(viewRecord.approvalAt)}
                  </p>
                )}
              </div>
              {viewRecord.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">备注</p>
                  <p className="text-xs">{viewRecord.notes}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => { setViewRecord(null); openEdit(viewRecord) }}>
                  <Edit className="h-3 w-3" />
                  编辑
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={() => { setViewRecord(null); handleDelete(viewRecord.id) }}>
                  <Trash2 className="h-3 w-3" />
                  删除
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={(open) => { if (!open) setEditRecord(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              编辑出栏记录
            </DialogTitle>
            <DialogDescription>修改出栏记录信息</DialogDescription>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">批次号</Label>
                  <Input
                    value={formData.batchNo}
                    onChange={e => setFormData(prev => ({ ...prev, batchNo: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">品种</Label>
                  <Input
                    value={formData.breed}
                    onChange={e => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">计划日期</Label>
                  <Input
                    type="date"
                    value={formData.plannedDate}
                    onChange={e => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">实际日期</Label>
                  <Input
                    type="date"
                    value={editRecord.actualDate ? editRecord.actualDate.slice(0, 10) : ''}
                    onChange={e => handleUpdate({ actualDate: e.target.value || null })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">数量(只)</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">均重(kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.avgWeight}
                    onChange={e => setFormData(prev => ({ ...prev, avgWeight: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">总价(元)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={e => setFormData(prev => ({ ...prev, totalPrice: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">买家</Label>
                <Input
                  value={formData.buyer}
                  onChange={e => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">状态</Label>
                <Select value={editRecord.status} onValueChange={val => handleUpdate({ status: val })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="计划中">计划中</SelectItem>
                    <SelectItem value="待审批">待审批</SelectItem>
                    <SelectItem value="已审批">已审批</SelectItem>
                    <SelectItem value="执行中">执行中</SelectItem>
                    <SelectItem value="已完成">已完成</SelectItem>
                    <SelectItem value="已取消">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">备注</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditRecord(null)}>取消</Button>
            <Button size="sm" onClick={() => {
              if (!editRecord) return
              handleUpdate({
                batchNo: formData.batchNo || null,
                breed: formData.breed || null,
                houseName: formData.houseName || null,
                plannedDate: formData.plannedDate,
                quantity: Number(formData.quantity),
                avgWeight: formData.avgWeight ? Number(formData.avgWeight) : null,
                totalPrice: formData.totalPrice ? Number(formData.totalPrice) : null,
                buyer: formData.buyer || null,
                notes: formData.notes || null,
              })
            }} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
