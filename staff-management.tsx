'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Building2,
  Home,
  CalendarDays,
  BarChart3,
  Filter,
  UserCheck,
  UserX,
  GraduationCap,
  Clock,
  Award,
  Briefcase,
  Download,
  LayoutGrid,
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
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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

// ─── Types ───────────────────────────────────────────────

interface StaffMember {
  id: string
  name: string
  role: string
  phone: string | null
  department: string | null
  houseName: string | null
  status: string
  joinDate: string | null
  avatar: string | null
  skills: string | null
  createdAt: string
  updatedAt: string
}

type StaffRole = '饲养员' | '技术员' | '兽医' | '主管' | '场长'
type StaffStatus = '在岗' | '休假' | '离职' | '培训中'
type Department = '生产部' | '兽医部' | '后勤部' | '管理部'

// ─── Constants ───────────────────────────────────────────

const ROLE_CONFIG: Record<StaffRole, { color: string; bg: string; border: string }> = {
  '场长': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  '主管': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  '技术员': { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  '兽医': { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  '饲养员': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

const STATUS_CONFIG: Record<StaffStatus, { color: string; bg: string; border: string; dot: string; icon: React.ElementType }> = {
  '在岗': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: UserCheck },
  '休假': { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400', icon: UserX },
  '离职': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', icon: UserX },
  '培训中': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', icon: GraduationCap },
}

const DEPT_CONFIG: Record<Department, { color: string; bg: string }> = {
  '生产部': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  '兽医部': { color: 'text-rose-700', bg: 'bg-rose-50' },
  '后勤部': { color: 'text-blue-700', bg: 'bg-blue-50' },
  '管理部': { color: 'text-purple-700', bg: 'bg-purple-50' },
}

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-green-500', 'bg-amber-500',
  'bg-purple-500', 'bg-rose-500', 'bg-blue-500', 'bg-cyan-500',
  'bg-lime-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
]

const PIE_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const BAR_COLORS = ['#10b981', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444']

const HOUSES = ['A1', 'A2', 'B1', 'B2'] as const
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

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

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role as StaffRole]
  if (!cfg) return <Badge variant="secondary" className="text-[10px]">{role}</Badge>
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {role}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StaffStatus]
  if (!cfg) return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  )
}

function DepartmentBadge({ department }: { department: string }) {
  const cfg = DEPT_CONFIG[department as Department]
  if (!cfg) return <span className="text-[11px] text-muted-foreground">{department}</span>
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
      {department}
    </span>
  )
}

function Avatar({ name, index }: { name: string; index: number }) {
  const char = name.charAt(0)
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold shrink-0 ${color}`}>
      {char}
    </div>
  )
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: `${monday.getMonth() + 1}/${monday.getDate()}`,
    end: `${sunday.getMonth() + 1}/${sunday.getDate()}`,
  }
}

// ─── Main Component ──────────────────────────────────────

export function StaffManagement() {
  const { toast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '饲养员' as string,
    phone: '',
    department: '生产部' as string,
    houseName: '',
    status: '在岗' as string,
    joinDate: '',
    skills: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchStaff = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterRole !== 'all') params.set('role', filterRole)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterDepartment !== 'all') params.set('department', filterDepartment)
      const query = params.toString()
      const res = await fetch(`/api/staff${query ? `?${query}` : ''}`)
      if (!res.ok) throw new Error('请求失败')
      const json = await res.json()
      setStaff(json.staff || [])
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [filterRole, filterStatus, filterDepartment])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Filtered staff for search
  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff
    const term = searchTerm.toLowerCase()
    return staff.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      (s.phone && s.phone.includes(term)) ||
      s.role.includes(term)
    )
  }, [staff, searchTerm])

  // ─── Stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = staff.length
    const onDuty = staff.filter((s) => s.status === '在岗').length
    const onLeave = staff.filter((s) => s.status === '休假').length
    const resigned = staff.filter((s) => s.status === '离职').length
    const training = staff.filter((s) => s.status === '培训中').length
    const onDutyRate = total > 0 ? ((onDuty / total) * 100).toFixed(1) : '0.0'

    // Average tenure
    const now = new Date()
    const tenuredStaff = staff.filter((s) => s.joinDate && s.status !== '离职')
    let avgTenureMonths = 0
    if (tenuredStaff.length > 0) {
      const totalMonths = tenuredStaff.reduce((sum, s) => {
        const join = new Date(s.joinDate!)
        return sum + (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
      }, 0)
      avgTenureMonths = Math.round(totalMonths / tenuredStaff.length)
    }

    return { total, onDuty, onLeave, resigned, training, onDutyRate, avgTenureMonths }
  }, [staff])

  // ─── Chart Data ──────────────────────────────────────
  const departmentPieData = useMemo(() => {
    const counts: Record<string, number> = {}
    staff.forEach((s) => {
      const dept = s.department || '未分配'
      counts[dept] = (counts[dept] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [staff])

  const roleBarData = useMemo(() => {
    const counts: Record<string, number> = {}
    staff.forEach((s) => { counts[s.role] = (counts[s.role] || 0) + 1 })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [staff])

  // ─── Schedule Board Data ─────────────────────────────
  const weekRange = useMemo(() => getWeekRange(), [])

  const scheduleByHouse = useMemo(() => {
    const activeStaff = staff.filter((s) => s.status !== '离职')
    return HOUSES.map((house) => ({
      house,
      members: activeStaff.filter((s) => s.houseName === house || s.houseName === '全场'),
    }))
  }, [staff])

  // ─── Dialog handlers ─────────────────────────────────
  function openNewDialog() {
    setEditingStaff(null)
    setFormData({
      name: '',
      role: '饲养员',
      phone: '',
      department: '生产部',
      houseName: '',
      status: '在岗',
      joinDate: formatDateFull(new Date().toISOString()),
      skills: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(s: StaffMember) {
    setEditingStaff(s)
    setFormData({
      name: s.name,
      role: s.role,
      phone: s.phone || '',
      department: s.department || '',
      houseName: s.houseName || '',
      status: s.status,
      joinDate: s.joinDate ? formatDateFull(s.joinDate) : '',
      skills: s.skills || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.role.trim()) return
    setSubmitting(true)
    try {
      const body = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        houseName: formData.houseName.trim() || null,
        status: formData.status.trim() || '在岗',
        joinDate: formData.joinDate || null,
        skills: formData.skills.trim() || null,
      }

      if (editingStaff) {
        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('创建失败')
      }

      setDialogOpen(false)
      fetchStaff()
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
      const res = await fetch(`/api/staff/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchStaff()
      }
    } catch {
      // error
    } finally {
      setDeleting(false)
    }
  }

  // ─── Loading skeleton ────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-white/20" />
              <Skeleton className="h-4 w-48 bg-white/20" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
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
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">员工管理</h1>
                <p className="text-sm text-emerald-100">养殖场人员信息、部门统计与排班管理</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <Users className="h-3.5 w-3.5" />
                <span>总人数 <span className="font-bold text-white">{stats.total}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                <UserCheck className="h-3.5 w-3.5" />
                <span>在岗 <span className="font-bold text-white">{stats.onDuty}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-200">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>培训中 <span className="font-bold text-white">{stats.training}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-200">
                <UserX className="h-3.5 w-3.5" />
                <span>休假 <span className="font-bold text-white">{stats.onLeave}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-200">
                <UserX className="h-3.5 w-3.5" />
                <span>离职 <span className="font-bold text-white">{stats.resigned}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="border-white/60 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                onClick={() => exportCsv('staff', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
              >
                <Download className="h-4 w-4 mr-2" />
                导出数据
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Main Tabs ──────────────────────────────────── */}
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="list" className="text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              员工列表
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              部门统计
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-flex" />
              排班看板
            </TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={openNewDialog}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            新建员工
          </Button>
        </div>

        {/* ─── 员工列表 Tab ─────────────────────────────── */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters Row */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、手机号、岗位..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[110px] h-9 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="岗位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部岗位</SelectItem>
                  {Object.keys(ROLE_CONFIG).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[100px] h-9 text-xs">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.keys(STATUS_CONFIG).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[110px] h-9 text-xs">
                  <SelectValue placeholder="部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {Object.keys(DEPT_CONFIG).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-10 w-10 mb-3 opacity-40" />
                <span className="text-sm">暂无匹配的员工</span>
              </div>
            ) : (
              filteredStaff.map((s, idx) => (
                <motion.div
                  key={s.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Card className={`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden border-l-4 ${
                    s.status === '在岗' ? 'border-l-emerald-500' :
                    s.status === '培训中' ? 'border-l-amber-500' :
                    s.status === '休假' ? 'border-l-gray-400' :
                    'border-l-red-400'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} index={idx} />
                          <div>
                            <h3 className="text-sm font-semibold">{s.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <RoleBadge role={s.role} />
                              <StatusBadge status={s.status} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openEditDialog(s)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        {s.department && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <DepartmentBadge department={s.department} />
                          </div>
                        )}
                        {s.houseName && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Home className="h-3 w-3" />
                            <span>{s.houseName}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.joinDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <span>入职 {formatDateShort(s.joinDate)}</span>
                          </div>
                        )}
                        {s.skills && (
                          <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                            <Award className="h-3 w-3 shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {s.skills.split(',').map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                  {skill.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ─── 部门统计 Tab ─────────────────────────────── */}
        <TabsContent value="stats" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}>
              <Card className="border-t-2 border-t-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">总人数</p>
                      <p className="text-xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-t-2 border-t-teal-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">在岗率</p>
                      <p className="text-xl font-bold mt-1">{stats.onDutyRate}<span className="text-xs font-normal text-muted-foreground">%</span></p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-t-2 border-t-green-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">平均工龄</p>
                      <p className="text-xl font-bold mt-1">{stats.avgTenureMonths}<span className="text-xs font-normal text-muted-foreground">月</span></p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-t-2 border-t-purple-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">部门数</p>
                      <p className="text-xl font-bold mt-1">{departmentPieData.length}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Status Overview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">人员状态概览</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['在岗', '培训中', '休假', '离职'] as StaffStatus[]).map((status) => {
                    const cfg = STATUS_CONFIG[status]
                    const Icon = cfg.icon
                    const count = staff.filter((s) => s.status === status).length
                    return (
                      <div key={status} className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                          <span className={`text-xs font-medium ${cfg.color}`}>{status}</span>
                        </div>
                        <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          <span className="text-[10px] text-muted-foreground">
                            {stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Distribution PieChart */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">部门分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {departmentPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={departmentPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {departmentPieData.map((_, index) => (
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
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">暂无数据</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Role Distribution BarChart */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">岗位分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {roleBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={roleBarData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {roleBarData.map((_, index) => (
                            <Cell key={`bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">暂无数据</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── 排班看板 Tab ─────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">本周排班</CardTitle>
                    <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                      {weekRange.start} - {weekRange.end}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-muted-foreground">在岗</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-muted-foreground">培训中</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                      <span className="text-[10px] text-muted-foreground">休假</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Week day headers */}
                <div className="grid grid-cols-8 gap-2 mb-3">
                  <div className="text-xs font-medium text-muted-foreground p-2">鸡舍</div>
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-xs font-medium text-center text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Schedule rows per house */}
                <div className="space-y-3">
                  {scheduleByHouse.map(({ house, members }) => (
                    <div key={house} className="grid grid-cols-8 gap-2">
                      {/* House label */}
                      <div className="flex items-center justify-center rounded-lg bg-muted/50 p-2">
                        <Badge variant="outline" className="text-xs font-semibold">{house}</Badge>
                      </div>
                      {/* 7 day columns */}
                      {WEEKDAYS.map((day) => (
                        <div key={day} className="rounded-lg border border-border/50 p-2 min-h-[80px]">
                          <ScrollArea className="max-h-[200px]">
                            <div className="space-y-1.5">
                              {members.map((member) => (
                                <div
                                  key={member.id}
                                  className={`rounded px-2 py-1 text-[10px] font-medium ${
                                    member.status === '在岗'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : member.status === '培训中'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : member.status === '休假'
                                          ? 'bg-gray-50 text-gray-600 border border-gray-200'
                                          : 'bg-red-50 text-red-600 border border-red-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full shrink-0 ${
                                      member.status === '在岗' ? 'bg-emerald-500' :
                                      member.status === '培训中' ? 'bg-amber-500' :
                                      member.status === '休假' ? 'bg-gray-400' :
                                      'bg-red-500'
                                    }" />
                                    <span className="truncate">{member.name}</span>
                                  </div>
                                  <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{member.role}</div>
                                </div>
                              ))}
                              {members.length === 0 && (
                                <div className="text-[10px] text-muted-foreground text-center py-2 opacity-60">
                                  无
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ─── New/Edit Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingStaff ? (
                <>
                  <Pencil className="h-4 w-4" />
                  编辑员工
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  新建员工
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? '修改员工基本信息' : '添加新的养殖场员工'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">姓名 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm">岗位 <span className="text-red-500">*</span></Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择岗位" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROLE_CONFIG).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">手机号</Label>
                <Input
                  id="phone"
                  placeholder="请输入手机号"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="text-sm">入职日期</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm">部门</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="生产部">生产部</SelectItem>
                    <SelectItem value="兽医部">兽医部</SelectItem>
                    <SelectItem value="后勤部">后勤部</SelectItem>
                    <SelectItem value="管理部">管理部</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="houseName" className="text-sm">分配鸡舍</Label>
                <Select value={formData.houseName} onValueChange={(v) => setFormData({ ...formData, houseName: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择鸡舍" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="全场">全场</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_CONFIG).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-sm">技能标签</Label>
              <Input
                id="skills"
                placeholder="用逗号分隔，如：肉鸡饲养,疫苗接种,设备操作"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-9">
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.name.trim() || !formData.role.trim()}
              className="h-9"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {editingStaff ? '保存修改' : '创建员工'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除该员工吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-9" disabled={deleting}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-9"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
