'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Syringe,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  SkipForward,
  Building2,
  Shield,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Droplets,
  Stethoscope,
  Activity,
  ChevronRight,
  ClipboardList,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'

interface VaccineRecord {
  id: string
  batchNo: string | null
  vaccineName: string
  manufacturer: string | null
  batchLotNo: string | null
  houseName: string | null
  quantity: number
  method: string
  operator: string | null
  applyDate: string
  nextDate: string | null
  dayAge: number | null
  status: string
  notes: string | null
}

interface VaccineSummary {
  completedCount: number
  plannedCount: number
  upcomingVaccines: VaccineRecord[]
}

function getStatusColor(status: string) {
  switch (status) {
    case '已完成': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case '计划中': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case '已跳过': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case '已完成': return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    case '计划中': return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    case '已跳过': return <SkipForward className="h-4 w-4 text-gray-500" />
    default: return null
  }
}

function getMethodColor(method: string) {
  switch (method) {
    case '饮水': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    case '注射': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case '滴鼻': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
    case '点眼': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getMethodIcon(method: string) {
  switch (method) {
    case '饮水': return <Droplets className="h-3 w-3" />
    case '注射': return <Syringe className="h-3 w-3" />
    case '滴鼻': return <Stethoscope className="h-3 w-3" />
    case '点眼': return <Eye className="h-3 w-3" />
    default: return <Syringe className="h-3 w-3" />
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getDaysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days < 0) return { text: '已过期', color: 'text-red-600 dark:text-red-400', urgent: true }
  if (days === 0) return { text: '今天', color: 'text-amber-600 dark:text-amber-400', urgent: true }
  if (days <= 3) return { text: `${days}天后`, color: 'text-orange-600 dark:text-orange-400', urgent: true }
  return { text: `${days}天后`, color: 'text-muted-foreground', urgent: false }
}

export function VaccineManagement() {
  const { toast } = useToast()
  const [records, setRecords] = useState<VaccineRecord[]>([])
  const [summary, setSummary] = useState<VaccineSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('全部')
  const [filterHouse, setFilterHouse] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewRecord, setViewRecord] = useState<VaccineRecord | null>(null)

  const fetchVaccines = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== '全部') params.set('status', filterStatus)
      if (filterHouse !== '全部') params.set('houseName', filterHouse)
      const res = await fetch(`/api/vaccines?${params}`)
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
  }, [filterStatus, filterHouse])

  useEffect(() => { fetchVaccines() }, [fetchVaccines])

  const filteredRecords = records.filter(r =>
    !searchTerm ||
    r.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.batchNo && r.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.manufacturer && r.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.operator && r.operator.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Group records by batch for immunization program view
  const immunizationProgram = records.reduce((acc, r) => {
    if (!r.batchNo) return acc
    const existing = acc.find(b => b.batchNo === r.batchNo)
    if (existing) {
      existing.records.push(r)
    } else {
      acc.push({ batchNo: r.batchNo, houseName: r.houseName, records: [r] })
    }
    return acc
  }, [] as { batchNo: string; houseName: string | null; records: VaccineRecord[][] }).sort((a, b) => a.batchNo.localeCompare(b.batchNo))

  // Sort records within each batch by applyDate
  immunizationProgram.forEach(batch => {
    batch.records.sort((a, b) => new Date(a.applyDate).getTime() - new Date(b.applyDate).getTime())
  })

  const totalCount = summary ? summary.completedCount + summary.plannedCount : 0
  const completionRate = totalCount > 0 ? Math.round((summary?.completedCount || 0) / totalCount * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">疫苗管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            疫苗接种记录与免疫程序管理 · 共 {records.length} 条记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-secondary/80 hover:bg-secondary"
            onClick={() => exportCsv('vaccines', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Syringe className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-white/70 mb-1">已完成接种</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">{summary?.completedCount || 0}</p>
              <p className="text-[10px] text-white/50 mt-1">完成率 {completionRate}%</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">计划中接种</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">{summary?.plannedCount || 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">待执行</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">累计接种量</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary ? `${(records.reduce((sum, r) => sum + r.quantity, 0) / 10000).toFixed(1)}万只` : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">近期待接种</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary?.upcomingVaccines.filter(v => {
                  const days = new Date(v.applyDate).getTime() - Date.now()
                  return days > 0 && days < 7 * 24 * 60 * 60 * 1000
                }).length || 0}
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">7天内</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Immunization Progress Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">免疫计划总体进度</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2.5" />
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>已完成 {summary?.completedCount || 0} 次</span>
            <span>计划中 {summary?.plannedCount || 0} 次</span>
            <span>总计 {totalCount} 次</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="records" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ClipboardList className="h-3.5 w-3.5" />
            接种记录
          </TabsTrigger>
          <TabsTrigger value="program" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="h-3.5 w-3.5" />
            免疫程序
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-3.5 w-3.5" />
            接种计划
          </TabsTrigger>
        </TabsList>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">疫苗接种记录</CardTitle>
                  <CardDescription className="text-xs">全部批次免疫记录</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索疫苗/批次..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs w-40 sm:w-52"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 w-24 sm:w-28 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部状态</SelectItem>
                      <SelectItem value="已完成">已完成</SelectItem>
                      <SelectItem value="计划中">计划中</SelectItem>
                      <SelectItem value="已跳过">已跳过</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterHouse} onValueChange={setFilterHouse}>
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部鸡舍</SelectItem>
                      <SelectItem value="A1栋">A1栋</SelectItem>
                      <SelectItem value="A2栋">A2栋</SelectItem>
                      <SelectItem value="B1栋">B1栋</SelectItem>
                      <SelectItem value="B2栋">B2栋</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[480px]">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    加载中...
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Syringe className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-xs">暂无接种记录</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredRecords.map((record, idx) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => setViewRecord(record)}
                      >
                        <div className="shrink-0">
                          {getStatusIcon(record.status)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-medium text-sm">{record.vaccineName}</span>
                            {record.batchNo && (
                              <Badge variant="outline" className="text-[10px]">{record.batchNo}</Badge>
                            )}
                            <Badge className={`text-[10px] ${getMethodColor(record.method)}`}>
                              {getMethodIcon(record.method)}
                              {record.method}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                            <span>{formatDate(record.applyDate)}</span>
                            {record.houseName && <span>· {record.houseName}</span>}
                            {record.dayAge && <span>· {record.dayAge}日龄</span>}
                            <span>· {record.quantity.toLocaleString()}只</span>
                          </div>
                        </div>

                        <Badge className={`text-[10px] shrink-0 ${getStatusColor(record.status)}`}>
                          {record.status}
                        </Badge>

                        <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Immunization Program Tab */}
        <TabsContent value="program" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {immunizationProgram.map((batch, idx) => (
              <motion.div
                key={batch.batchNo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{batch.batchNo}</CardTitle>
                          <CardDescription className="text-[10px]">{batch.houseName}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {batch.records.length} 次接种
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

                      <div className="space-y-3">
                        {batch.records.map((record, rIdx) => (
                          <div key={record.id} className="flex items-start gap-3 relative">
                            <div className={`relative z-10 h-[18px] w-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              record.status === '已完成' ? 'bg-emerald-500' :
                              record.status === '计划中' ? 'bg-blue-500' :
                              'bg-gray-300 dark:bg-gray-600'
                            }`}>
                              {record.status === '已完成' ? (
                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{record.vaccineName}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                                <span>{record.dayAge}日龄</span>
                                <span>·</span>
                                <span>{formatDate(record.applyDate)}</span>
                                <Badge className={`text-[9px] px-1 py-0 ${getMethodColor(record.method)}`}>
                                  {record.method}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">近期待接种计划</CardTitle>
              <CardDescription className="text-xs">按接种日期排序的待执行计划</CardDescription>
            </CardHeader>
            <CardContent>
              {(!summary?.upcomingVaccines || summary.upcomingVaccines.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">暂无待执行计划</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.upcomingVaccines.map((vaccine, idx) => {
                    const daysInfo = getDaysUntil(vaccine.applyDate)
                    return (
                      <motion.div
                        key={vaccine.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          daysInfo.urgent ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' :
                          'border-border hover:bg-muted/30'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          daysInfo.urgent ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <Clock className={`h-5 w-5 ${daysInfo.urgent ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{vaccine.vaccineName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                            <span>{vaccine.batchNo}</span>
                            {vaccine.houseName && <span>· {vaccine.houseName}</span>}
                            <span>· {vaccine.method}</span>
                            <span>· {vaccine.quantity.toLocaleString()}只</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-medium ${daysInfo.color}`}>{daysInfo.text}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(vaccine.applyDate)}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
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
              <Syringe className="h-4 w-4" />
              接种详情
            </DialogTitle>
            <DialogDescription>疫苗接种详细信息</DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">疫苗名称</p>
                  <p className="text-sm font-medium">{viewRecord.vaccineName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">生产厂家</p>
                  <p className="text-sm">{viewRecord.manufacturer || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">疫苗批号</p>
                  <p className="text-sm font-mono">{viewRecord.batchLotNo || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">接种批次</p>
                  <p className="text-sm">{viewRecord.batchNo || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">鸡舍</p>
                  <p className="text-sm">{viewRecord.houseName || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">接种日龄</p>
                  <p className="text-sm">{viewRecord.dayAge ? `${viewRecord.dayAge}日龄` : '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">接种数量</p>
                  <p className="text-sm">{viewRecord.quantity.toLocaleString()} 只</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">接种方式</p>
                  <Badge className={getMethodColor(viewRecord.method)}>
                    {getMethodIcon(viewRecord.method)}
                    {viewRecord.method}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">操作员</p>
                  <p className="text-sm">{viewRecord.operator || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">接种日期</p>
                  <p className="text-sm">{formatDate(viewRecord.applyDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">下次接种</p>
                  <p className="text-sm">{viewRecord.nextDate ? formatDate(viewRecord.nextDate) : '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">状态</p>
                  <Badge className={getStatusColor(viewRecord.status)}>{viewRecord.status}</Badge>
                </div>
              </div>
              {viewRecord.notes && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">备注</p>
                    <p className="text-xs">{viewRecord.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
