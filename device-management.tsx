'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Plus,
  Map,
  ClipboardList,
  Wrench,
  Wifi,
  WifiOff,
  AlertTriangle,
  Settings,
  Camera,
  Wind,
  Lightbulb,
  Thermometer,
  Cpu,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building2,
  Activity,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

// ============== Types ==============
interface Device {
  id: string
  name: string
  type: string
  model: string | null
  status: string
  location: string | null
  lastOnlineAt: string | null
  lastPing: string | null
  createdAt: string
  updatedAt: string
  houseId: string | null
  house: { id: string; name: string; status: string } | null
}

interface DeviceStats {
  total: number
  online: number
  offline: number
  maintenance: number
  fault: number
}

interface HouseInfo {
  id: string
  name: string
  status: string
}

// ============== Constants ==============
const DEVICE_TYPES = ['传感器', '控制器', '摄像头', '通风机', '照明', '加温设备', '通风设备', '其他']
const DEVICE_STATUSES = ['在线', '离线', '维护', '故障']
const HOUSE_NAMES = ['A1栋', 'A2栋', 'B1栋', 'B2栋', '全场']

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  '在线': { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', icon: Wifi },
  '离线': { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-400', icon: WifiOff },
  '维护': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', icon: Settings },
  '故障': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', icon: AlertTriangle },
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  '传感器': { color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', icon: Thermometer },
  '控制器': { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Cpu },
  '摄像头': { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Camera },
  '通风机': { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', icon: Wind },
  '照明': { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Lightbulb },
  '加温设备': { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: Activity },
  '通风设备': { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', icon: Wind },
  '其他': { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: Settings },
}

const MAP_POSITIONS: Record<string, Record<string, { top: string; left: string }>> = {
  'A1栋': {
    '温湿度传感器-A1-01': { top: '30%', left: '25%' },
    '氨气检测器-A1-01': { top: '15%', left: '70%' },
    '监控摄像头-A1-01': { top: '50%', left: '50%' },
    '环控控制器-A1-01': { top: '80%', left: '20%' },
    'LED照明-A1-01': { top: '8%', left: '45%' },
  },
  'A2栋': {
    '温湿度传感器-A2-01': { top: '35%', left: '70%' },
    '氨气检测器-A2-01': { top: '20%', left: '30%' },
    '监控摄像头-A2-01': { top: '55%', left: '50%' },
    '通风风机-A2-01': { top: '85%', left: '75%' },
  },
  'B1栋': {
    '温湿度传感器-B1-01': { top: '40%', left: '50%' },
    '通风风机-B1-01': { top: '80%', left: '30%' },
    '消毒控制器-B1-01': { top: '12%', left: '50%' },
  },
  'B2栋': {
    '温湿度传感器-B2-01': { top: '45%', left: '40%' },
    '照明控制器-B2-01': { top: '10%', left: '55%' },
  },
}

const MAINTENANCE_PLANS = [
  { id: 'm1', deviceName: '通风风机-A2-01', type: '定期维护', houseName: 'A2栋', scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: '进行中', priority: '高', description: '更换风机皮带，润滑轴承，测试运行参数', assignee: '维修组' },
  { id: 'm2', deviceName: '监控摄像头-A2-01', type: '故障维修', houseName: 'A2栋', scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: '待处理', priority: '紧急', description: '镜头模糊，红外夜视失灵，需更换镜头模组', assignee: '维修组' },
  { id: 'm3', deviceName: '温湿度传感器-B1-01', type: '故障维修', houseName: 'B1栋', scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), status: '待处理', priority: '高', description: '传感器离线超过24小时，检查电源和通信线路', assignee: '刘师傅' },
  { id: 'm4', deviceName: '通风风机-B1-01', type: '定期维护', houseName: 'B1栋', scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: '待执行', priority: '中', description: 'B1栋恢复使用前维护：清洗叶片、检查电机', assignee: '维修组' },
  { id: 'm5', deviceName: '环控控制器-A1-01', type: '定期校准', houseName: 'A1栋', scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: '待执行', priority: '低', description: '季度控制器参数校准和固件升级', assignee: '李技术员' },
  { id: 'm6', deviceName: '氨气检测器-A1-01', type: '定期校准', houseName: 'A1栋', scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: '待执行', priority: '中', description: '使用标准气体进行氨气传感器精度校准', assignee: '李技术员' },
  { id: 'm7', deviceName: '温湿度传感器-A1-01', type: '定期校准', houseName: 'A1栋', scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: '待执行', priority: '低', description: '温湿度传感器季度校准', assignee: '李技术员' },
  { id: 'm8', deviceName: '气象站-01', type: '定期维护', houseName: '全场', scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: '已逾期', priority: '高', description: '年度维护：清洗风速传感器、校准雨量计、更换防辐射罩', assignee: '维修组' },
]

// ============== Animation Variants ==============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const cardHover = {
  rest: { y: 0, boxShadow: '0 0 0 0 rgba(16,185,129,0)' },
  hover: { y: -2, boxShadow: '0 4px 12px rgba(16,185,129,0.12)' },
}

// ============== Utility Functions ==============
function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '从未'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
}

function getDaysUntil(dateStr: string | Date): number {
  const now = new Date()
  const target = new Date(dateStr)
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ============== Main Component ==============
export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([])
  const [stats, setStats] = useState<DeviceStats>({ total: 0, online: 0, offline: 0, maintenance: 0, fault: 0 })
  const [houses, setHouses] = useState<HouseInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('全部')
  const [filterStatus, setFilterStatus] = useState('全部')
  const [filterHouse, setFilterHouse] = useState('全部')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [calMonth, setCalMonth] = useState(new Date())
  const [createForm, setCreateForm] = useState({ name: '', type: '传感器', houseName: 'A1栋', location: '', model: '', status: '在线' })
  const [editForm, setEditForm] = useState({ name: '', type: '', houseName: '', location: '', model: '', status: '' })
  const [submitting, setSubmitting] = useState(false)

  // Fetch devices
  async function fetchDevices() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== '全部') params.set('type', filterType)
      if (filterStatus !== '全部') params.set('status', filterStatus)
      if (filterHouse !== '全部') {
        const house = houses.find((h) => h.name === filterHouse)
        if (house) params.set('houseId', house.id)
      }
      if (search) params.set('search', search)

      const res = await fetch(`/api/devices?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setDevices(json.data)
        setStats(json.stats)
      }
    } catch {
      toast.error('获取设备数据失败')
    } finally {
      setLoading(false)
    }
  }

  // Fetch houses
  async function fetchHouses() {
    try {
      const res = await fetch('/api/batches')
      const json = await res.json()
      if (json.success && json.houses) {
        setHouses(json.houses)
      }
    } catch {
      // Houses will be empty - not critical
    }
  }

  useEffect(() => {
    fetchHouses()
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [filterType, filterStatus, filterHouse])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDevices()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // ============== CRUD Handlers ==============
  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast.error('请输入设备名称')
      return
    }
    try {
      setSubmitting(true)
      const house = houses.find((h) => h.name === createForm.houseName)
      const farmRes = await fetch('/api/batches')
      const farmJson = await farmRes.json()

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          farmId: farmJson.farmId || 'default',
          houseId: house?.id || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('设备创建成功')
        setShowCreateDialog(false)
        setCreateForm({ name: '', type: '传感器', houseName: 'A1栋', location: '', model: '', status: '在线' })
        fetchDevices()
      } else {
        toast.error(json.message || '创建失败')
      }
    } catch {
      toast.error('创建设备失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate() {
    if (!selectedDevice) return
    try {
      setSubmitting(true)
      const house = houses.find((h) => h.name === editForm.houseName)
      const res = await fetch(`/api/devices/${selectedDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          houseId: house?.id || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('设备更新成功')
        setShowEditDialog(false)
        setSelectedDevice(null)
        fetchDevices()
      } else {
        toast.error(json.message || '更新失败')
      }
    } catch {
      toast.error('更新设备失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!selectedDevice) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/devices/${selectedDevice.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('设备已删除')
        setShowDeleteDialog(false)
        setSelectedDevice(null)
        fetchDevices()
      } else {
        toast.error(json.message || '删除失败')
      }
    } catch {
      toast.error('删除设备失败')
    } finally {
      setSubmitting(false)
    }
  }

  function openEditDialog(device: Device) {
    setSelectedDevice(device)
    setEditForm({
      name: device.name,
      type: device.type,
      houseName: device.house?.name || '全场',
      location: device.location || '',
      model: device.model || '',
      status: device.status,
    })
    setShowEditDialog(true)
  }

  function openDeleteDialog(device: Device) {
    setSelectedDevice(device)
    setShowDeleteDialog(true)
  }

  // ============== Filtered Devices ==============
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.model || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [devices, search])

  // ============== Maintenance Plans with Calendar ==============
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7 // Monday-based
    const days: (Date | null)[] = []

    for (let i = 0; i < startPad; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }, [calMonth])

  function getPlansForDate(date: Date) {
    return MAINTENANCE_PLANS.filter((p) => {
      const planDate = new Date(p.scheduledDate)
      return planDate.getFullYear() === date.getFullYear() &&
        planDate.getMonth() === date.getMonth() &&
        planDate.getDate() === date.getDate()
    })
  }

  const overduePlans = MAINTENANCE_PLANS.filter((p) => p.status === '已逾期' || (getDaysUntil(p.scheduledDate) < 0 && p.status !== '已完成'))
  const upcomingPlans = MAINTENANCE_PLANS.filter((p) => {
    const days = getDaysUntil(p.scheduledDate)
    return days >= 0 && days <= 7 && p.status !== '已完成' && p.status !== '已逾期'
  })

  // ============== Render ==============
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">设备管理</h1>
            <p className="text-sm text-muted-foreground">IoT设备监控与维护管理</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加设备
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {[
          { label: '设备总数', value: stats.total, icon: Cpu, color: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-500/10' },
          { label: '在线运行', value: stats.online, icon: Wifi, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/10' },
          { label: '离线设备', value: stats.offline, icon: WifiOff, color: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-500/10' },
          { label: '维护中', value: stats.maintenance, icon: Settings, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/10' },
          { label: '故障设备', value: stats.fault, icon: AlertTriangle, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/10' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md ${stat.shadow}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
          <TabsTrigger value="list" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Cpu className="h-4 w-4 hidden sm:block" />
            设备列表
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Map className="h-4 w-4 hidden sm:block" />
            设备地图
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ClipboardList className="h-4 w-4 hidden sm:block" />
            维护计划
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab 1: 设备列表 ===== */}
        <TabsContent value="list" className="space-y-4">
          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索设备名称、型号..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[110px] h-9 text-xs">
                        <SelectValue placeholder="设备类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部类型</SelectItem>
                        {DEVICE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[100px] h-9 text-xs">
                        <SelectValue placeholder="状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部状态</SelectItem>
                        {DEVICE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterHouse} onValueChange={setFilterHouse}>
                      <SelectTrigger className="w-[100px] h-9 text-xs">
                        <SelectValue placeholder="鸡舍" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全部">全部鸡舍</SelectItem>
                        {HOUSE_NAMES.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Device Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredDevices.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground"
                >
                  <Wrench className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">暂无匹配的设备</p>
                </motion.div>
              ) : (
                filteredDevices.map((device) => {
                  const typeConf = TYPE_CONFIG[device.type] || TYPE_CONFIG['其他']
                  const statusConf = STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']
                  const StatusIcon = statusConf.icon
                  const TypeIcon = typeConf.icon

                  return (
                    <motion.div
                      key={device.id}
                      variants={itemVariants}
                      layout
                      initial="rest"
                      whileHover="hover"
                    >
                      <Card className="relative overflow-hidden border hover:border-primary/20 transition-colors group">
                        {/* Status bar top */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${statusConf.bg}`} />

                        <CardHeader className="pb-2 pt-5 px-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${typeConf.bg} shrink-0`}>
                                <TypeIcon className={`h-4 w-4 ${typeConf.color}`} />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-sm font-semibold truncate">{device.name}</CardTitle>
                                <CardDescription className="text-[11px] mt-0.5">
                                  {device.model || '未指定型号'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <div className={`flex h-2.5 w-2.5 rounded-full ${statusConf.bg} ${device.status === '在线' ? 'animate-pulse' : ''}`} />
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusConf.color} border-current/20`}>
                                {device.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="px-4 pb-4 space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className={`text-[10px] ${typeConf.bg} border ${typeConf.color} border-current/20`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {device.type}
                            </Badge>
                            {device.house && (
                              <Badge variant="secondary" className="text-[10px] bg-muted">
                                <Building2 className="h-3 w-3 mr-1" />
                                {device.house.name}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            {device.location && (
                              <div className="flex items-center gap-1.5">
                                <Map className="h-3 w-3 shrink-0" />
                                <span className="truncate">{device.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className="h-3 w-3 shrink-0" />
                              <span>最后在线: {formatTimeAgo(device.lastOnlineAt)}</span>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(device.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => openEditDialog(device)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                onClick={() => openDeleteDialog(device)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </motion.div>

          <div className="text-center text-xs text-muted-foreground">
            共 {filteredDevices.length} 台设备
          </div>
        </TabsContent>

        {/* ===== Tab 2: 设备地图 ===== */}
        <TabsContent value="map" className="space-y-4">
          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {Object.entries(TYPE_CONFIG).filter(([k]) => !['加温设备', '通风设备', '其他'].includes(k)).map(([type, conf]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`h-3 w-3 rounded-full ${conf.bg.replace('/10', '/30').replace('/20', '/30')} border border-current/20`} />
                <span>{type}</span>
              </div>
            ))}
            <Separator orientation="vertical" className="h-4" />
            {Object.entries(STATUS_CONFIG).map(([status, conf]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`h-3 w-3 rounded-full ${conf.bg}`} />
                <span>{status}</span>
              </div>
            ))}
          </motion.div>

          {/* House Grid Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['A1栋', 'A2栋', 'B1栋', 'B2栋'].map((houseName, houseIdx) => {
              const houseDevices = devices.filter((d) => d.house?.name === houseName)
              const houseStatus = houseIdx === 0 ? '养殖中' : houseIdx === 1 ? '养殖中' : houseIdx === 2 ? '消毒中' : '空闲'
              const statusBorder = houseStatus === '养殖中' ? 'border-emerald-500/30' : houseStatus === '消毒中' ? 'border-amber-500/30' : 'border-gray-500/30'

              return (
                <motion.div
                  key={houseName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: houseIdx * 0.1 }}
                >
                  <Card className={`overflow-hidden border-2 ${statusBorder}`}>
                    <CardHeader className="pb-2 px-4 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm font-bold">{houseName}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {houseDevices.length} 台设备
                          </Badge>
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">
                            {houseStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {/* Room layout visualization */}
                      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-muted/40 to-muted/20 rounded-lg border border-dashed border-muted-foreground/20 overflow-hidden">
                        {/* Room grid lines */}
                        <div className="absolute inset-4 grid grid-cols-4 grid-rows-3 gap-1 opacity-20">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="border border-muted-foreground/30 rounded" />
                          ))}
                        </div>

                        {/* Room label */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/80 rounded text-[10px] font-medium text-muted-foreground border">
                          {houseName}
                        </div>

                        {/* Device dots */}
                        {houseDevices.map((device) => {
                          const positions = MAP_POSITIONS[houseName]
                          const pos = positions?.[device.name]
                          if (!pos) {
                            // Fallback: distribute devices without predefined positions
                            const idx = houseDevices.indexOf(device)
                            const row = Math.floor(idx / 3)
                            const col = idx % 3
                            return (
                              <motion.div
                                key={device.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className="absolute group"
                                style={{ top: `${25 + row * 25}%`, left: `${20 + col * 30}%`, transform: 'translate(-50%, -50%)' }}
                                title={`${device.name} (${device.status})`}
                              >
                                <div className={`relative cursor-pointer`}>
                                  <div className={`h-5 w-5 rounded-full border-2 border-background shadow-md flex items-center justify-center ${(STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']).bg}`} />
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-lg shadow-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <p className="font-medium">{device.name}</p>
                                    <p className="text-muted-foreground">{device.type} · {device.status}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          }

                          const typeConf = TYPE_CONFIG[device.type] || TYPE_CONFIG['其他']
                          return (
                            <motion.div
                              key={device.id}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + houseDevices.indexOf(device) * 0.1 }}
                              className="absolute group"
                              style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                            >
                              <div className="relative cursor-pointer">
                                <div className={`h-6 w-6 rounded-full border-2 border-background shadow-lg flex items-center justify-center ${(STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']).bg}`}>
                                  {device.status === '故障' && (
                                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                  )}
                                </div>
                                {/* Pulse ring for online devices */}
                                {device.status === '在线' && (
                                  <div className={`absolute inset-0 rounded-full ${(STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']).bg} opacity-30 animate-ping`} style={{ animationDuration: '2s' }} />
                                )}
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-popover border rounded-lg shadow-lg text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  <p className="font-semibold text-foreground">{device.name}</p>
                                  <p className="text-muted-foreground">{device.type} · {device.model}</p>
                                  <p className={`text-xs mt-0.5 ${(STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']).color}`}>
                                    {device.status}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}

                        {/* Door indicator */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-muted-foreground/30 rounded-t" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground/50">入口</div>
                      </div>

                      {/* Device list below map */}
                      <div className="mt-3 space-y-1">
                        {houseDevices.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">暂无设备</p>
                        ) : (
                          houseDevices.map((device) => {
                            const typeConf = TYPE_CONFIG[device.type] || TYPE_CONFIG['其他']
                            return (
                              <div key={device.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${(STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']).bg} ${device.status === '在线' ? 'animate-pulse' : ''}`} />
                                  <span className="text-foreground font-medium">{device.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current/20">
                                    {device.type}
                                  </Badge>
                                  <span className={device.status === '故障' ? 'text-red-500' : device.status === '维护' ? 'text-amber-500' : ''}>
                                    {device.status}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Public devices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">公共设备</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-wrap gap-3">
                  {devices.filter((d) => !d.houseId).map((device) => {
                    const typeConf = TYPE_CONFIG[device.type] || TYPE_CONFIG['其他']
                    const statusConf = STATUS_CONFIG[device.status] || STATUS_CONFIG['在线']
                    return (
                      <motion.div
                        key={device.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className={`h-3 w-3 rounded-full ${statusConf.bg} ${device.status === '在线' ? 'animate-pulse' : ''}`} />
                        <div>
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-[11px] text-muted-foreground">{device.model} · {device.location}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ===== Tab 3: 维护计划 ===== */}
        <TabsContent value="maintenance" className="space-y-4">
          {/* Warning cards */}
          {(overduePlans.length > 0 || upcomingPlans.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Overdue warnings */}
              {overduePlans.length > 0 && (
                <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader className="pb-2 px-4 pt-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      <CardTitle className="text-sm font-bold text-red-700 dark:text-red-400">逾期维护 ({overduePlans.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {overduePlans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-red-100/50 dark:bg-red-900/20">
                        <div>
                          <p className="font-medium text-red-700 dark:text-red-300">{plan.deviceName}</p>
                          <p className="text-red-600/70 dark:text-red-400/70 mt-0.5">{plan.description}</p>
                        </div>
                        <Badge className="bg-red-500 text-white border-0 text-[10px]">
                          {plan.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Upcoming maintenance */}
              {upcomingPlans.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-2 px-4 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400">近7日维护 ({upcomingPlans.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {upcomingPlans.map((plan) => {
                      const days = getDaysUntil(plan.scheduledDate)
                      return (
                        <div key={plan.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20">
                          <div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">{plan.deviceName}</p>
                            <p className="text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                              {days === 0 ? '今天' : days === 1 ? '明天' : `${days}天后`} · {plan.assignee}
                            </p>
                          </div>
                          <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                            {days === 0 ? '今天' : `${days}天后`}
                          </Badge>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Calendar View */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold">维护日历</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[100px] text-center">
                      {calMonth.getFullYear()}年{calMonth.getMonth() + 1}月
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                    <div key={day} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, idx) => {
                    const plans = date ? getPlansForDate(date) : []
                    const isToday = date && new Date().toDateString() === date.toDateString()
                    const isPast = date && date < new Date(new Date().setHours(0, 0, 0, 0))

                    return (
                      <div
                        key={idx}
                        className={`relative min-h-[52px] sm:min-h-[64px] rounded-lg p-1 text-xs transition-colors ${
                          date
                            ? `cursor-pointer hover:bg-muted/60 ${isToday ? 'bg-primary/10 ring-1 ring-primary/30' : ''} ${!date ? 'bg-muted/10' : ''} ${isPast ? 'opacity-60' : ''}`
                            : 'bg-muted/5'
                        }`}
                      >
                        {date && (
                          <>
                            <span className={`text-[11px] font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                              {date.getDate()}
                            </span>
                            {plans.length > 0 && (
                              <div className="mt-0.5 space-y-0.5">
                                {plans.slice(0, 2).map((plan) => (
                                  <div
                                    key={plan.id}
                                    className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate ${
                                      plan.priority === '紧急' || plan.status === '已逾期'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        : plan.priority === '高'
                                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    }`}
                                  >
                                    {plan.deviceName.length > 6 ? plan.deviceName.slice(0, 6) + '...' : plan.deviceName}
                                  </div>
                                ))}
                                {plans.length > 2 && (
                                  <div className="text-[9px] text-muted-foreground text-center">
                                    +{plans.length - 2}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Maintenance plan list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">维护任务列表</CardTitle>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{MAINTENANCE_PLANS.length} 项</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {MAINTENANCE_PLANS.map((plan, idx) => {
                      const days = getDaysUntil(plan.scheduledDate)
                      const isOverdue = days < 0 && plan.status !== '已完成'
                      const isToday = days === 0

                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-3 rounded-lg border transition-colors hover:shadow-sm ${
                            isOverdue
                              ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10'
                              : isToday
                                ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10'
                                : 'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${
                                isOverdue ? 'bg-red-100 dark:bg-red-900/30' : isToday ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                              }`}>
                                {isOverdue ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : isToday ? <Clock className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground">{plan.deviceName}</p>
                                  <Badge variant="outline" className="text-[10px]">{plan.type}</Badge>
                                  <Badge className={`text-[10px] border-0 ${
                                    plan.status === '已逾期' ? 'bg-red-500 text-white' :
                                    plan.status === '进行中' ? 'bg-amber-500 text-white' :
                                    plan.status === '待处理' ? 'bg-orange-500 text-white' :
                                    'bg-emerald-500 text-white'
                                  }`}>
                                    {plan.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {plan.houseName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(plan.scheduledDate.toISOString())}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    {plan.assignee}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {isOverdue ? (
                                <Badge className="bg-red-500 text-white border-0 text-[10px]">
                                  逾期{-days}天
                                </Badge>
                              ) : isToday ? (
                                <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                                  今天
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  {days}天后
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ===== Create Device Dialog ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              添加新设备
            </DialogTitle>
            <DialogDescription>填写设备信息并添加到系统中</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">设备名称 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="例：温湿度传感器-A1-02"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">设备类型 <span className="text-red-500">*</span></Label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm({ ...createForm, type: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">所属鸡舍</Label>
                <Select value={createForm.houseName} onValueChange={(v) => setCreateForm({ ...createForm, houseName: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUSE_NAMES.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">安装位置</Label>
              <Input
                placeholder="例：A1栋东侧中部"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">设备型号</Label>
              <Input
                placeholder="例：TH-Pro 2000"
                value={createForm.model}
                onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="mr-2">
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !createForm.name.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {submitting ? '创建中...' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Device Dialog ===== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              编辑设备
            </DialogTitle>
            <DialogDescription>修改设备信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">设备名称</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">设备类型</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">设备状态</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">所属鸡舍</Label>
                <Select value={editForm.houseName} onValueChange={(v) => setEditForm({ ...editForm, houseName: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUSE_NAMES.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">设备型号</Label>
                <Input
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">安装位置</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="mr-2">
              取消
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {submitting ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Device Dialog ===== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除设备 <span className="font-medium text-foreground">{selectedDevice?.name}</span> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="mr-2">
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
