'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'
import {
  Plus,
  Search,
  Eye,
  Calendar,
  MapPin,
  Users,
  Activity,
  Pill,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react'

type BatchStatus = '养殖中' | '已出栏' | '异常' | '待入栏'

interface Batch {
  id: string
  batchNo: string
  breed: string
  quantity: number
  houseName: string
  startDate: string
  expectedEndDate: string | null
  actualEndDate: string | null
  status: BatchStatus
  mortalityRate: number
}

interface BatchDetail extends Batch {
  medications: Array<{
    id: string
    drugName: string
    drugType: string
    applyDate: string
    status: string
  }>
  healthAlerts: Array<{
    id: string
    type: string
    severity: string
    description: string
    createdAt: string
  }>
  costs: Array<{
    id: string
    category: string
    item: string
    amount: number
    date: string
  }>
}

function getStatusBadge(status: BatchStatus) {
  switch (status) {
    case '养殖中': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"><span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>{status}</Badge>
    case '已出栏': return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200">{status}</Badge>
    case '异常': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">{status}</Badge>
    case '待入栏': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">{status}</Badge>
  }
}

function getTimelineIcon(type: string) {
  switch (type) {
    case 'medication': return <Pill className="h-3.5 w-3.5 text-blue-500" />
    case 'alert': return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
    default: return <Activity className="h-3.5 w-3.5 text-green-500" />
  }
}

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const { toast } = useToast()

  // New batch form
  const [newBatch, setNewBatch] = useState({
    batchNo: '',
    breed: 'AA肉鸡',
    quantity: '',
    houseId: '',
    startDate: '',
    expectedEndDate: '',
  })

  useEffect(() => {
    fetchBatches()
  }, [])

  async function fetchBatches() {
    try {
      const res = await fetch('/api/batches')
      if (res.ok) {
        const data = await res.json()
        setBatches(data.batches)
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBatchDetail(id: string) {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/batches/${id}`)
      if (res.ok) {
        const data = await res.json()
        const batch = data.batch || data
        setSelectedBatch({
          id: batch.id,
          batchNo: batch.batchNo,
          breed: batch.breed,
          quantity: batch.quantity,
          houseName: batch.houseName || batch.house?.name || '--',
          startDate: batch.startDate,
          expectedEndDate: batch.expectedEndDate,
          actualEndDate: batch.actualEndDate,
          status: batch.status,
          mortalityRate: batch.mortalityRate,
          medications: data.medications || [],
          healthAlerts: data.healthAlerts || [],
          costs: data.costs || [],
        })
      }
    } catch (err) {
      console.error('Failed to fetch batch detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleCreateBatch() {
    if (!newBatch.batchNo || !newBatch.quantity || !newBatch.houseId || !newBatch.startDate) {
      toast({ title: '请填写完整信息', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBatch,
          quantity: parseInt(newBatch.quantity),
        }),
      })
      if (res.ok) {
        toast({ title: '批次创建成功' })
        setShowNewDialog(false)
        fetchBatches()
        setNewBatch({ batchNo: '', breed: 'AA肉鸡', quantity: '', houseId: '', startDate: '', expectedEndDate: '' })
      } else {
        const err = await res.json()
        toast({ title: err.error || '创建失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '网络错误', variant: 'destructive' })
    }
  }

  const filteredBatches = batches.filter((batch) => {
    const matchSearch =
      batch.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.breed.includes(searchQuery) ||
      batch.houseName.includes(searchQuery)
    const matchStatus = statusFilter === 'all' || batch.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = batches.filter(b => b.status === '养殖中').length
  const totalCount = batches.reduce((acc, b) => acc + (b.status === '养殖中' ? b.quantity : 0), 0)
  const avgMortality = activeCount > 0
    ? (batches.filter(b => b.status === '养殖中').reduce((acc, b) => acc + b.mortalityRate, 0) / activeCount).toFixed(2)
    : '0'

  // Build timeline from batch detail
  function buildTimeline(batch: BatchDetail) {
    const events: Array<{ date: string; event: string; type: string }> = []
    // Add start
    events.push({ date: batch.startDate.split('T')[0], event: `批次入栏 - ${batch.quantity.toLocaleString()}只 ${batch.breed}`, type: 'normal' })
    // Add medications
    batch.medications.forEach(m => {
      events.push({ date: m.applyDate.split('T')[0], event: `${m.drugType}: ${m.drugName}`, type: 'medication' })
    })
    // Add health alerts
    batch.healthAlerts.forEach(a => {
      events.push({ date: a.createdAt.split('T')[0], event: `${a.type} - ${a.description}`, type: 'alert' })
    })
    // Add costs
    batch.costs.forEach(c => {
      events.push({ date: c.date.split('T')[0], event: `${c.category}: ${c.item} ¥${c.amount.toLocaleString()}`, type: 'normal' })
    })
    // Sort by date desc
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return events
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">批次管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理所有养殖批次信息 · 在养 {activeCount} 批 · 存栏 {totalCount.toLocaleString()} 只
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-secondary/80 hover:bg-secondary"
            onClick={() => exportCsv('batches', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建批次
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建养殖批次</DialogTitle>
              <DialogDescription>填写批次基本信息，创建新的养殖批次记录。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>批次号</Label>
                <Input placeholder="PC-2025-008" value={newBatch.batchNo} onChange={e => setNewBatch({ ...newBatch, batchNo: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>品种</Label>
                  <Select value={newBatch.breed} onValueChange={v => setNewBatch({ ...newBatch, breed: v })}>
                    <SelectTrigger><SelectValue placeholder="选择品种" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AA肉鸡">AA肉鸡</SelectItem>
                      <SelectItem value="罗斯308">罗斯308</SelectItem>
                      <SelectItem value="科宝500">科宝500</SelectItem>
                      <SelectItem value="海兰褐">海兰褐</SelectItem>
                      <SelectItem value="京红1号">京红1号</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>数量 (只)</Label>
                  <Input type="number" placeholder="10000" value={newBatch.quantity} onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>鸡舍</Label>
                <Select value={newBatch.houseId} onValueChange={v => setNewBatch({ ...newBatch, houseId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择鸡舍" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1栋</SelectItem>
                    <SelectItem value="A2">A2栋</SelectItem>
                    <SelectItem value="B1">B1栋</SelectItem>
                    <SelectItem value="B2">B2栋</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>入栏日期</Label>
                  <Input type="date" value={newBatch.startDate} onChange={e => setNewBatch({ ...newBatch, startDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>预计出栏日期</Label>
                  <Input type="date" value={newBatch.expectedEndDate} onChange={e => setNewBatch({ ...newBatch, expectedEndDate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>取消</Button>
              <Button onClick={handleCreateBatch}>确认创建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-500/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">总批次</p>
            <p className="text-xl font-bold tabular-nums">{batches.length}</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-500/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">在养批次</p>
            <p className="text-xl font-bold text-green-600 tabular-nums">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-emerald-500/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">总存栏</p>
            <p className="text-xl font-bold tabular-nums">{totalCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2 border-t-orange-500/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">平均死淘率</p>
            <p className="text-xl font-bold tabular-nums">{avgMortality}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索批次号、品种、鸡舍..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="养殖中">养殖中</SelectItem>
            <SelectItem value="已出栏">已出栏</SelectItem>
            <SelectItem value="异常">异常</SelectItem>
            <SelectItem value="待入栏">待入栏</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Table */}
      <Card className="transition-all duration-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">批次号</TableHead>
                  <TableHead className="text-xs">品种</TableHead>
                  <TableHead className="text-xs text-right">数量</TableHead>
                  <TableHead className="text-xs">鸡舍</TableHead>
                  <TableHead className="text-xs">入栏日期</TableHead>
                  <TableHead className="text-xs">预计出栏</TableHead>
                  <TableHead className="text-xs">状态</TableHead>
                  <TableHead className="text-xs text-right">死淘率</TableHead>
                  <TableHead className="text-xs text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id} className="cursor-pointer hover:bg-emerald-50/50 transition-colors duration-200">
                    <TableCell className="text-xs font-medium">{batch.batchNo}</TableCell>
                    <TableCell className="text-xs">{batch.breed}</TableCell>
                    <TableCell className="text-xs text-right">{batch.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{batch.houseName}</TableCell>
                    <TableCell className="text-xs">{batch.startDate.split('T')[0]}</TableCell>
                    <TableCell className="text-xs">{batch.expectedEndDate?.split('T')[0] || '--'}</TableCell>
                    <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    <TableCell className="text-xs text-right">
                      <span className={batch.mortalityRate > 2.5 ? 'text-red-600 font-medium' : ''}>
                        {batch.mortalityRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => fetchBatchDetail(batch.id)}>
                        <Eye className="h-3 w-3 mr-1" />
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Detail Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              批次详情 - {selectedBatch?.batchNo}
              {selectedBatch && getStatusBadge(selectedBatch.status)}
            </DialogTitle>
            <DialogDescription>查看批次详细信息、事件时间线和历史记录</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedBatch ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Users className="h-3 w-3" /> 存栏数量
                    </div>
                    <p className="text-lg font-bold">{selectedBatch.quantity.toLocaleString()} 只</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" /> 鸡舍
                    </div>
                    <p className="text-lg font-bold">{selectedBatch.houseName}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <AlertTriangle className="h-3 w-3" /> 死淘率
                    </div>
                    <p className={`text-lg font-bold ${selectedBatch.mortalityRate > 2.5 ? 'text-red-600' : ''}`}>
                      {selectedBatch.mortalityRate}%
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" /> 入栏日期
                    </div>
                    <p className="text-sm font-bold">{selectedBatch.startDate.split('T')[0]}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" /> 预计出栏
                    </div>
                    <p className="text-sm font-bold">{selectedBatch.expectedEndDate?.split('T')[0] || '--'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Pill className="h-3 w-3" /> 用药记录
                    </div>
                    <p className="text-lg font-bold">{selectedBatch.medications.length} 条</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    事件时间线
                  </h3>
                  <div className="relative space-y-0">
                    {buildTimeline(selectedBatch).map((event, idx) => (
                      <div key={idx} className="flex gap-3 pb-4 relative">
                        {idx < buildTimeline(selectedBatch).length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                        )}
                        <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                          {getTimelineIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground">{event.date}</span>
                          <p className="text-sm mt-0.5">{event.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
