'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  List,
  BarChart3,
  Plus,
  Search,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Filter,
  Users,
  ClipboardCheck,
  TrendingUp,
  Syringe,
  SprayCan,
  Wrench,
  ShoppingCart,
  UserCog,
  FlaskConical,
  Truck,
  MoreHorizontal,
  Calendar,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// ─── Types ───────────────────────────────────────────────

interface SchedulePlan {
  id: string
  title: string
  description: string | null
  type: string
  priority: string
  status: string
  batchNo: string | null
  houseName: string | null
  scheduledDate: string
  dueDate: string | null
  assignee: string | null
  createdAt: string
  updatedAt: string
}

type PlanType = '疫苗接种' | '消毒计划' | '设备维护' | '饲料采购' | '人员安排' | '环境检测' | '出栏计划' | '其他'
type PlanPriority = '高' | '中' | '低'
type PlanStatus = '待执行' | '进行中' | '已完成' | '已取消' | '已逾期'

// ─── Constants ───────────────────────────────────────────

const TYPE_CONFIG: Record<PlanType, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  '疫苗接种': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Syringe },
  '消毒计划': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: SprayCan },
  '设备维护': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Wrench },
  '饲料采购': { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: ShoppingCart },
  '人员安排': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: UserCog },
  '环境检测': { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', icon: FlaskConical },
  '出栏计划': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: Truck },
  '其他': { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: MoreHorizontal },
}

const PRIORITY_CONFIG: Record<PlanPriority, { color: string; bg: string; dot: string }> = {
  '高': { color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  '中': { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  '低': { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
}

const STATUS_CONFIG: Record<PlanStatus, { color: string; bg: string; border: string; icon: React.ElementType; dot: string }> = {
  '待执行': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock, dot: 'bg-blue-500' },
  '进行中': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: RefreshCw, dot: 'bg-amber-500' },
  '已完成': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-500' },
  '已取消': { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: XCircle, dot: 'bg-gray-400' },
  '已逾期': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, dot: 'bg-red-500' },
}

const TYPE_BORDER_COLORS: Record<PlanType, string> = {
  '疫苗接种': 'border-t-emerald-400',
  '消毒计划': 'border-t-blue-400',
  '设备维护': 'border-t-amber-400',
  '饲料采购': 'border-t-orange-400',
  '人员安排': 'border-t-purple-400',
  '环境检测': 'border-t-teal-400',
  '出栏计划': 'border-t-red-400',
  '其他': 'border-t-gray-400',
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

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

function TypeBadge({ type }: { type: PlanType }) {
  const cfg = TYPE_CONFIG[type]
  if (!cfg) return <Badge variant="secondary" className="text-[10px]">{type}</Badge>
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <cfg.icon className="h-3 w-3 mr-1" />
      {type}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: PlanPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: PlanStatus }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <cfg.icon className="h-3 w-3 mr-1" />
      {status}
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

export function FarmPlanning() {
  const [plans, setPlans] = useState<SchedulePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SchedulePlan | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '疫苗接种' as PlanType,
    priority: '中' as PlanPriority,
    scheduledDate: '',
    dueDate: '',
    batchNo: '',
    houseName: '',
    assignee: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterPriority !== 'all') params.set('priority', filterPriority)
      const query = params.toString()
      const res = await fetch(`/api/schedules${query ? `?${query}` : ''}`)
      if (!res.ok) throw new Error('请求失败')
      const json = await res.json()
      setPlans(json.plans || [])
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, filterPriority])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Computed stats
  const stats = useMemo(() => {
    const now = new Date()
    const todayStr = formatDateFull(now.toISOString())
    const weekEnd = new Date(now.getTime() + 7 * 86400000)

    const todayCompleted = plans.filter(
      (p) => p.status === '已完成' && formatDateFull(p.scheduledDate) === todayStr
    ).length
    const overdue = plans.filter(
      (p) => p.status === '已逾期' || (p.dueDate && new Date(p.dueDate) < now && p.status !== '已完成' && p.status !== '已取消')
    ).length
    const thisWeek = plans.filter(
      (p) => {
        const d = new Date(p.scheduledDate)
        return d >= now && d <= weekEnd && p.status !== '已完成' && p.status !== '已取消'
      }
    ).length

    return {
      total: plans.length,
      todayCompleted,
      overdue,
      thisWeek,
    }
  }, [plans])

  // Filtered plans for search
  const filteredPlans = useMemo(() => {
    if (!searchTerm) return plans
    return plans.filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.assignee && p.assignee.includes(searchTerm)) ||
      (p.batchNo && p.batchNo.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [plans, searchTerm])

  // Stats for charts
  const completionData = useMemo(() => {
    const counts: Record<string, number> = { '已完成': 0, '进行中': 0, '待执行': 0, '已逾期': 0, '已取消': 0 }
    plans.forEach((p) => { if (counts[p.status] !== undefined) counts[p.status]++ })
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [plans])

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {}
    plans.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [plans])

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calMonth)
    const monthEnd = endOfMonth(calMonth)
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [calMonth])

  const plansForDate = (date: Date) => {
    const dateStr = formatDateFull(date.toISOString())
    return plans.filter((p) => formatDateFull(p.scheduledDate) === dateStr)
  }

  const selectedDatePlans = selectedDate ? plansForDate(selectedDate) : []

  // Dialog handlers
  function openNewDialog() {
    setEditingPlan(null)
    setFormData({
      title: '',
      description: '',
      type: '疫苗接种',
      priority: '中',
      scheduledDate: formatDateFull(new Date().toISOString()),
      dueDate: '',
      batchNo: '',
      houseName: '',
      assignee: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(plan: SchedulePlan) {
    setEditingPlan(plan)
    setFormData({
      title: plan.title,
      description: plan.description || '',
      type: plan.type as PlanType,
      priority: plan.priority as PlanPriority,
      scheduledDate: formatDateFull(plan.scheduledDate),
      dueDate: plan.dueDate ? formatDateFull(plan.dueDate) : '',
      batchNo: plan.batchNo || '',
      houseName: plan.houseName || '',
      assignee: plan.assignee || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.type || !formData.scheduledDate) return
    setSubmitting(true)
    try {
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        priority: formData.priority,
        scheduledDate: formData.scheduledDate,
        dueDate: formData.dueDate || null,
        batchNo: formData.batchNo.trim() || null,
        houseName: formData.houseName.trim() || null,
        assignee: formData.assignee.trim() || null,
      }

      if (editingPlan) {
        const res = await fetch(`/api/schedules/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('创建失败')
      }

      setDialogOpen(false)
      fetchPlans()
    } catch {
      // error handling
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkComplete(id: string) {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '已完成' }),
      })
      if (res.ok) fetchPlans()
    } catch {
      // error
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/schedules/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchPlans()
      }
    } catch {
      // error
    } finally {
      setDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">加载计划数据中...</span>
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
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">养殖计划排程</h1>
                <p className="text-sm text-emerald-100">养殖任务、疫苗排期与运营规划管理</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>总计划 <span className="font-bold text-white">{stats.total}</span> 项</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>今日完成 <span className="font-bold text-white">{stats.todayCompleted}</span> 项</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>逾期 <span className="font-bold text-white">{stats.overdue}</span> 项</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>本周待办 <span className="font-bold text-white">{stats.thisWeek}</span> 项</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Main Tabs ──────────────────────────────────── */}
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              <List className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              计划列表
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              日历视图
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              统计面板
            </TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={openNewDialog}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            新建计划
          </Button>
        </div>

        {/* ─── Plan List Tab ─────────────────────────────── */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters Row */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索计划标题、描述、负责人、批次号..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.keys(TYPE_CONFIG).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.keys(STATUS_CONFIG).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[100px] h-9 text-xs">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="高">高</SelectItem>
                  <SelectItem value="中">中</SelectItem>
                  <SelectItem value="低">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Plan Cards */}
          <div className="space-y-3">
            {filteredPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ClipboardCheck className="h-10 w-10 mb-3 opacity-40" />
                <span className="text-sm">暂无匹配的计划</span>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className={`border-t-2 ${TYPE_BORDER_COLORS[plan.type as PlanType] || 'border-t-gray-400'} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Plan info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="text-sm font-semibold truncate">{plan.title}</h3>
                            <TypeBadge type={plan.type as PlanType} />
                            <PriorityBadge priority={plan.priority as PlanPriority} />
                          </div>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{plan.description}</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                            <StatusBadge status={plan.status as PlanStatus} />
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDateShort(plan.scheduledDate)}
                            </span>
                            {plan.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                截止 {formatDateShort(plan.dueDate)}
                              </span>
                            )}
                            {plan.assignee && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {plan.assignee}
                              </span>
                            )}
                            {plan.batchNo && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{plan.batchNo}</span>
                            )}
                            {plan.houseName && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{plan.houseName}</span>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {plan.status !== '已完成' && plan.status !== '已取消' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleMarkComplete(plan.id)}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              完成
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(plan.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ─── Calendar Tab ─────────────────────────────── */}
        <TabsContent value="calendar" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">月度日历</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCalMonth(subMonths(calMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[100px] text-center">
                      {format(calMonth, 'yyyy年MM月', { locale: zhCN })}
                    </span>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-7 gap-px">
                  {/* Weekday headers */}
                  {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {d}
                    </div>
                  ))}
                  {/* Calendar days */}
                  {calendarDays.map((day) => {
                    const dayPlans = plansForDate(day)
                    const inMonth = isSameMonth(day, calMonth)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const today = isToday(day)

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`relative min-h-[72px] p-1.5 text-left border rounded-sm transition-colors hover:bg-muted/50 cursor-pointer
                          ${!inMonth ? 'opacity-30' : ''}
                          ${isSelected ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'border-transparent'}
                          ${today ? 'bg-primary/5' : ''}
                        `}
                      >
                        <span className={`text-xs font-medium ${today ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayPlans.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {dayPlans.slice(0, 3).map((p) => (
                              <span
                                key={p.id}
                                className={`h-1.5 w-1.5 rounded-full ${TYPE_CONFIG[p.type as PlanType]?.dot || 'bg-gray-400'}`}
                                style={{ backgroundColor: p.type === '疫苗接种' ? '#10b981' : p.type === '消毒计划' ? '#3b82f6' : p.type === '设备维护' ? '#f59e0b' : p.type === '饲料采购' ? '#f97316' : p.type === '人员安排' ? '#8b5cf6' : p.type === '环境检测' ? '#14b8a6' : p.type === '出栏计划' ? '#ef4444' : '#9ca3af' }}
                              />
                            ))}
                            {dayPlans.length > 3 && (
                              <span className="text-[9px] text-muted-foreground leading-none">+{dayPlans.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Selected date detail */}
                {selectedDate && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">
                        {format(selectedDate, 'MM月dd日 EEEE', { locale: zhCN })} 的计划
                        {selectedDatePlans.length > 0 && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">{selectedDatePlans.length} 项</Badge>
                        )}
                      </h4>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedDate(null)}>
                        关闭
                      </Button>
                    </div>
                    {selectedDatePlans.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">该日期暂无计划</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDatePlans.map((plan) => (
                          <div key={plan.id} className={`flex items-center justify-between rounded-lg border p-3 ${TYPE_CONFIG[plan.type as PlanType]?.bg || 'bg-gray-50'} ${TYPE_CONFIG[plan.type as PlanType]?.border || 'border-gray-200'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {(() => {
                                const typeCfg = TYPE_CONFIG[plan.type as PlanType]
                                if (!typeCfg) return null
                                const IconComp = typeCfg.icon
                                return <IconComp className={`h-4 w-4 shrink-0 ${typeCfg.color}`} />
                              })()}
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{plan.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <StatusBadge status={plan.status as PlanStatus} />
                                  {plan.assignee && <span className="text-[10px] text-muted-foreground">{plan.assignee}</span>}
                                </div>
                              </div>
                            </div>
                            <PriorityBadge priority={plan.priority as PlanPriority} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Calendar legend */}
          <motion.div variants={itemVariants}>
            <div className="flex flex-wrap gap-3">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} style={{ backgroundColor: type === '疫苗接种' ? '#10b981' : type === '消毒计划' ? '#3b82f6' : type === '设备维护' ? '#f59e0b' : type === '饲料采购' ? '#f97316' : type === '人员安排' ? '#8b5cf6' : type === '环境检测' ? '#14b8a6' : type === '出栏计划' ? '#ef4444' : '#9ca3af' }} />
                  <span className="text-[11px] text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── Stats Tab ────────────────────────────────── */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Completion Rate Pie Chart */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">完成率分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {completionData.length > 0 ? (
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={completionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {completionData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            iconSize={8}
                            formatter={(value: string) => <span className="text-xs">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                      暂无数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Plans by Type Bar Chart */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">计划类型分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={typeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          width={70}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                      暂无数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Overdue Warning Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-t-2 border-t-red-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">逾期警告</CardTitle>
                    <Badge className="bg-red-500 text-white text-[10px] hover:bg-red-500">
                      {stats.overdue} 项
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {plans.filter((p) => p.status === '已逾期').length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无逾期计划</p>
                ) : (
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2 pr-3">
                      {plans
                        .filter((p) => p.status === '已逾期')
                        .map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-red-800 truncate">{plan.title}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <TypeBadge type={plan.type as PlanType} />
                                {plan.dueDate && (
                                  <span className="text-[10px] text-red-600">
                                    截止 {formatDateShort(plan.dueDate)}
                                  </span>
                                )}
                                {plan.assignee && (
                                  <span className="text-[10px] text-muted-foreground">{plan.assignee}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-100 shrink-0"
                              onClick={() => handleMarkComplete(plan.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              完成
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ─── New/Edit Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingPlan ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  编辑计划
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  新建计划
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? '修改养殖计划排程信息' : '创建新的养殖计划排程'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                计划标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="输入计划标题"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">描述</Label>
              <Textarea
                placeholder="输入计划描述（可选）"
                className="min-h-[80px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  类型 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as PlanType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(TYPE_CONFIG).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">优先级</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as PlanPriority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="高">高</SelectItem>
                    <SelectItem value="中">中</SelectItem>
                    <SelectItem value="低">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  计划日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">截止日期</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Batch & House */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">批次号</Label>
                <Input
                  placeholder="如 PC-2025-002"
                  value={formData.batchNo}
                  onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">鸡舍</Label>
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
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">负责人</Label>
              <Input
                placeholder="输入负责人姓名"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.title.trim() || !formData.scheduledDate}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {editingPlan ? '更新中...' : '创建中...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {editingPlan ? '保存修改' : '创建计划'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除该计划吗？此操作不可撤销。
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
                <>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  确认删除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
