'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ScanLine,
  QrCode,
  Download,
  Eye,
  EyeOff,
  Package,
  Pill,
  HeartPulse,
  Calendar,
  ShieldCheck,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Layers,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface BatchOption {
  id: string
  batchNo: string
  breed: string
  status: string
}

interface TraceBatch {
  id: string
  batchNo: string
  breed: string
  quantity: number
  currentQuantity: number
  status: string
  startDate: string
  expectedEndDate: string | null
  actualEndDate: string | null
  mortalityRate: number
}

interface TraceFarm {
  id: string
  name: string
  address: string
  owner: string
}

interface TraceHouse {
  id: string
  name: string
  capacity: number
}

interface TimelineEvent {
  date: string
  type: string
  title: string
  description: string
  severity?: string
  status?: string
}

interface TraceSummary {
  totalDays: number
  totalCost: number
  costPerBird: number
  costByCategory: Record<string, number>
  medicationCount: number
  medicationTypes: string[]
  healthAlertCount: number
  unresolvedAlerts: number
}

interface TraceCompliance {
  canSell: boolean
  activeWithdrawals: Array<{
    drugName: string
    withdrawalEnd: string
    daysRemaining: number
  }>
}

interface TraceData {
  batch: TraceBatch
  farm: TraceFarm
  house: TraceHouse
  timeline: TimelineEvent[]
  summary: TraceSummary
  compliance: TraceCompliance
}

interface QrBatchItem {
  batchNo: string
  breed: string
  status: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getEventIcon(type: string) {
  switch (type) {
    case 'lifecycle': return <Package className="h-4 w-4 text-green-600" />
    case 'medication': return <Pill className="h-4 w-4 text-purple-600" />
    case 'withdrawal': return <ShieldCheck className="h-4 w-4 text-green-600" />
    case 'health_alert': return <AlertTriangle className="h-4 w-4 text-red-600" />
    case 'health_alert_resolved': return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'cost': return <DollarSign className="h-4 w-4 text-amber-600" />
    default: return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function getEventIconBg(type: string) {
  switch (type) {
    case 'lifecycle': return 'bg-green-100'
    case 'medication': return 'bg-purple-100'
    case 'withdrawal': return 'bg-emerald-100'
    case 'health_alert': return 'bg-red-100'
    case 'health_alert_resolved': return 'bg-green-100'
    case 'cost': return 'bg-amber-100'
    default: return 'bg-muted'
  }
}

function getSeverityBadge(level?: string) {
  if (!level) return null
  const styles: Record<string, string> = {
    '紧急': 'bg-red-100 text-red-700 border-red-200',
    '高': 'bg-orange-100 text-orange-700 border-orange-200',
    '一般': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '低': 'bg-teal-100 text-teal-700 border-teal-200',
  }
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${styles[level] || 'bg-muted'}`}>
      {level}
    </Badge>
  )
}

function getStatusBadge(status?: string) {
  if (!status) return null
  const styles: Record<string, string> = {
    '已记录': 'bg-gray-100 text-gray-700 border-gray-200',
    '休药中': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '已过休药期': 'bg-green-100 text-green-700 border-green-200',
    '待处理': 'bg-orange-100 text-orange-700 border-orange-200',
    '处理中': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '已解决': 'bg-green-100 text-green-700 border-green-200',
    '已忽略': 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${styles[status] || ''}`}>
      {status}
    </Badge>
  )
}

function buildQrData(batch: TraceBatch, farm: TraceFarm, house: TraceHouse): string {
  return JSON.stringify({
    batchNo: batch.batchNo,
    farm: farm.name,
    breed: batch.breed,
    house: house.name,
    startDate: batch.startDate,
    status: batch.status,
    quantity: batch.quantity,
    currentQuantity: batch.currentQuantity,
    url: `https://farm.example.com/trace/${batch.batchNo}`,
  })
}

export function Traceability() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [traceData, setTraceData] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPublicView, setShowPublicView] = useState(false)

  // QR Code Dialog state
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string>('')
  const [qrLoading, setQrLoading] = useState(false)

  // Batch QR Dialog state
  const [batchQrDialogOpen, setBatchQrDialogOpen] = useState(false)
  const [batchQrItems, setBatchQrItems] = useState<QrBatchItem[]>([])
  const [batchQrLoading, setBatchQrLoading] = useState(false)

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches')
      if (!res.ok) return
      const data = await res.json()
      const list: BatchOption[] = (data.batches || []).map((b: BatchOption) => ({
        id: b.id,
        batchNo: b.batchNo,
        breed: b.breed,
        status: b.status || '',
      }))
      setBatches(list)
      if (list.length > 0 && !selectedBatchId) {
        setSelectedBatchId(list[0].id)
      }
    } catch {
      // silently fail
    }
  }, [selectedBatchId])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const fetchTraceData = useCallback(async () => {
    if (!selectedBatchId) return
    try {
      setLoading(true)
      setTraceData(null)
      const res = await fetch(`/api/traceability?batchId=${selectedBatchId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '获取溯源数据失败')
      }
      const data = await res.json()
      setTraceData(data)
    } catch (err) {
      toast({
        title: '加载失败',
        description: err instanceof Error ? err.message : '获取溯源数据失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedBatchId, toast])

  useEffect(() => {
    if (selectedBatchId) {
      fetchTraceData()
    }
  }, [selectedBatchId, fetchTraceData])

  // Open single QR dialog for current batch
  const handleOpenQrDialog = useCallback(async () => {
    if (!traceData) return
    setQrLoading(true)
    setQrDialogOpen(true)
    try {
      const qrDataStr = buildQrData(traceData.batch, traceData.farm, traceData.house)
      const encoded = encodeURIComponent(qrDataStr)
      setQrImageUrl(`/api/qrcode?data=${encoded}&size=280`)
    } catch {
      toast({
        title: '生成失败',
        description: '二维码数据编码失败',
        variant: 'destructive',
      })
      setQrDialogOpen(false)
    } finally {
      setQrLoading(false)
    }
  }, [traceData, toast])

  // Download QR code as PNG
  const handleDownloadQr = useCallback(async () => {
    if (!qrImageUrl || !traceData) return
    try {
      const res = await fetch(qrImageUrl)
      if (!res.ok) throw new Error('下载失败')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `溯源二维码_${traceData.batch.batchNo}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: '下载成功',
        description: `已保存 ${traceData.batch.batchNo} 二维码`,
      })
    } catch {
      toast({
        title: '下载失败',
        description: '二维码下载出错，请重试',
        variant: 'destructive',
      })
    }
  }, [qrImageUrl, traceData, toast])

  // Print QR code
  const handlePrintQr = useCallback(() => {
    window.print()
  }, [])

  // Open batch QR dialog (all active batches)
  const handleOpenBatchQrDialog = useCallback(async () => {
    if (batches.length === 0) return
    setBatchQrLoading(true)
    setBatchQrDialogOpen(true)
    try {
      const activeBatches = batches.filter(b => b.status === '养殖中')
      setBatchQrItems(activeBatches.length > 0 ? activeBatches : batches)
    } catch {
      toast({
        title: '获取失败',
        description: '获取批次列表失败',
        variant: 'destructive',
      })
      setBatchQrDialogOpen(false)
    } finally {
      setBatchQrLoading(false)
    }
  }, [batches, toast])

  // Download QR code for batch item
  const handleDownloadBatchQr = useCallback(async (item: QrBatchItem) => {
    try {
      const qrDataStr = JSON.stringify({
        batchNo: item.batchNo,
        breed: item.breed,
        status: item.status,
        url: `https://farm.example.com/trace/${item.batchNo}`,
      })
      const encoded = encodeURIComponent(qrDataStr)
      const res = await fetch(`/api/qrcode?data=${encoded}&size=280`)
      if (!res.ok) throw new Error('下载失败')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `溯源二维码_${item.batchNo}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: '下载成功',
        description: `已保存 ${item.batchNo} 二维码`,
      })
    } catch {
      toast({
        title: '下载失败',
        description: '二维码下载出错，请重试',
        variant: 'destructive',
      })
    }
  }, [toast])

  // Filter timeline for public view
  const filteredTimeline = showPublicView
    ? (traceData?.timeline || []).filter(e =>
        e.type === 'lifecycle' || e.type === 'withdrawal'
      )
    : (traceData?.timeline || [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">溯源管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            产品全生命周期溯源与数据管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showPublicView ? 'outline' : 'default'}
            size="sm"
            onClick={() => setShowPublicView(!showPublicView)}
          >
            {showPublicView ? <Eye className="h-3.5 w-3.5 mr-1.5" /> : <EyeOff className="h-3.5 w-3.5 mr-1.5" />}
            {showPublicView ? '公开数据' : '完整数据'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenBatchQrDialog}>
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            批量生成
          </Button>
          <Button variant="outline" size="sm" className="bg-secondary/80 hover:bg-secondary">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            导出报告
          </Button>
        </div>
      </div>

      {/* Batch Selection */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">选择溯源批次</p>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择批次" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batchNo} - {b.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenQrDialog}
                disabled={!traceData}
              >
                <QrCode className="h-3.5 w-3.5 mr-1.5" />
                生成二维码
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : traceData ? (
        <>
          {/* Batch Basic Info */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                批次基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">批次号</p>
                  <p className="text-sm font-bold mt-0.5">{traceData.batch.batchNo}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">品种</p>
                  <p className="text-sm font-bold mt-0.5">{traceData.batch.breed}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">入栏数量</p>
                  <p className="text-sm font-bold mt-0.5">{traceData.batch.quantity.toLocaleString()} 只</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">当前存栏</p>
                  <p className="text-sm font-bold mt-0.5">{traceData.batch.currentQuantity.toLocaleString()} 只</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">养殖天数</p>
                  <p className="text-sm font-bold mt-0.5">{traceData.summary.totalDays} 天</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">状态</p>
                  <Badge variant={traceData.batch.status === '养殖中' ? 'default' : 'secondary'} className="mt-0.5">
                    {traceData.batch.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  <p className="text-[10px] text-muted-foreground">总成本</p>
                </div>
                <p className="text-lg font-bold">¥{traceData.summary.totalCost.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">单只: ¥{traceData.summary.costPerBird}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="h-4 w-4 text-purple-500" />
                  <p className="text-[10px] text-muted-foreground">用药记录</p>
                </div>
                <p className="text-lg font-bold">{traceData.summary.medicationCount} <span className="text-sm font-normal text-muted-foreground">条</span></p>
                <p className="text-[10px] text-muted-foreground">类型: {traceData.summary.medicationTypes.join('、') || '无'}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HeartPulse className="h-4 w-4 text-red-500" />
                  <p className="text-[10px] text-muted-foreground">健康预警</p>
                </div>
                <p className="text-lg font-bold">{traceData.summary.healthAlertCount} <span className="text-sm font-normal text-muted-foreground">条</span></p>
                <p className="text-[10px] text-muted-foreground">未处理: {traceData.summary.unresolvedAlerts} 条</p>
              </CardContent>
            </Card>
            <Card className={`hover:shadow-md transition-shadow ${traceData.compliance.canSell ? 'border-green-200' : 'border-red-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className={`h-4 w-4 ${traceData.compliance.canSell ? 'text-green-600' : 'text-red-600'}`} />
                  <p className="text-[10px] text-muted-foreground">出栏合规</p>
                </div>
                <p className={`text-lg font-bold ${traceData.compliance.canSell ? 'text-green-600' : 'text-red-600'}`}>
                  {traceData.compliance.canSell ? '可出栏' : '锁定中'}
                </p>
                {traceData.compliance.activeWithdrawals.length > 0 && (
                  <p className="text-[10px] text-red-500">
                    {traceData.compliance.activeWithdrawals.map(w => `${w.drugName}: ${w.daysRemaining}天`).join('、')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Farm & House Info */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                养殖场信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">养殖场</p>
                  <p className="text-sm font-bold">{traceData.farm.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{traceData.farm.address}</p>
                  <p className="text-xs text-muted-foreground">负责人: {traceData.farm.owner}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">鸡舍</p>
                  <p className="text-sm font-bold">{traceData.house.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">容量: {traceData.house.capacity.toLocaleString()} 只</p>
                  <p className="text-xs text-muted-foreground">
                    入栏: {formatDate(traceData.batch.startDate)}
                    {traceData.batch.actualEndDate && ` · 出栏: ${formatDate(traceData.batch.actualEndDate)}`}
                    {!traceData.batch.actualEndDate && traceData.batch.expectedEndDate && ` · 预计出栏: ${formatDate(traceData.batch.expectedEndDate)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline with Tab Filters */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                全生命周期时间线
              </CardTitle>
              <CardDescription>批次从入栏到出栏的所有事件记录</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <Tabs defaultValue="all">
                  <div className="px-4 pt-3 pb-0">
                    <TabsList>
                      <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
                      <TabsTrigger value="lifecycle" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />生命周期
                      </TabsTrigger>
                      {!showPublicView && (
                        <>
                          <TabsTrigger value="medication" className="text-xs">
                            <Pill className="h-3 w-3 mr-1" />用药
                          </TabsTrigger>
                          <TabsTrigger value="health_alert" className="text-xs">
                            <HeartPulse className="h-3 w-3 mr-1" />健康
                          </TabsTrigger>
                          <TabsTrigger value="cost" className="text-xs">
                            <DollarSign className="h-3 w-3 mr-1" />成本
                          </TabsTrigger>
                        </>
                      )}
                    </TabsList>
                  </div>
                  <TabsContent value="all">
                    <TimelineList events={filteredTimeline} showPublic={showPublicView} />
                  </TabsContent>
                  <TabsContent value="lifecycle">
                    <TimelineList events={filteredTimeline.filter(e => e.type === 'lifecycle')} showPublic={showPublicView} />
                  </TabsContent>
                  {!showPublicView && (
                    <>
                      <TabsContent value="medication">
                        <TimelineList events={filteredTimeline.filter(e => e.type === 'medication' || e.type === 'withdrawal')} showPublic={showPublicView} />
                      </TabsContent>
                      <TabsContent value="health_alert">
                        <TimelineList events={filteredTimeline.filter(e => e.type === 'health_alert' || e.type === 'health_alert_resolved')} showPublic={showPublicView} />
                      </TabsContent>
                      <TabsContent value="cost">
                        <TimelineList events={filteredTimeline.filter(e => e.type === 'cost')} showPublic={showPublicView} />
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Data Privacy Notice */}
          <Card className="bg-muted/30 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ScanLine className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">数据溯源说明</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    当前显示{showPublicView ? '公开' : '完整'}溯源数据。公开数据仅包含基础信息、免疫记录和环境数据，
                    完整数据包含用药详情、健康事件等敏感信息。消费者扫码可查看公开溯源信息。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">请选择一个批次查看溯源信息</p>
          </CardContent>
        </Card>
      )}

      {/* ====== Single Batch QR Code Dialog ====== */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              溯源二维码
            </DialogTitle>
            <DialogDescription>
              {traceData?.batch.batchNo} - {traceData?.batch.breed}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {qrLoading ? (
              <motion.div
                key="qr-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">正在生成二维码...</p>
              </motion.div>
            ) : (
              <motion.div
                key="qr-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* QR Code Image */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                    <img
                      src={qrImageUrl}
                      alt={`溯源二维码 ${traceData?.batch.batchNo}`}
                      width={224}
                      height={224}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {/* Batch Info Summary */}
                {traceData && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">批次号</span>
                        <span className="font-medium">{traceData.batch.batchNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">品种</span>
                        <span className="font-medium">{traceData.batch.breed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">鸡舍</span>
                        <span className="font-medium">{traceData.house.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">状态</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {traceData.batch.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">入栏日期</span>
                        <span className="font-medium">{formatDate(traceData.batch.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">养殖天数</span>
                        <span className="font-medium">{traceData.summary.totalDays} 天</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
                  消费者扫码可查看公开溯源信息（不含用药及健康敏感数据）
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintQr}
              disabled={qrLoading}
              className="flex-1 sm:flex-none"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              打印二维码
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadQr}
              disabled={qrLoading}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              下载二维码
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQrDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Batch QR Code Dialog (批量生成) ====== */}
      <Dialog open={batchQrDialogOpen} onOpenChange={setBatchQrDialogOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              批量生成二维码
            </DialogTitle>
            <DialogDescription>
              共 {batchQrItems.length} 个批次
              {batchQrItems.length > 0 && batchQrItems[0].status === '养殖中' ? '（仅显示养殖中批次）' : ''}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {batchQrLoading ? (
              <motion.div
                key="batch-qr-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">正在加载批次列表...</p>
              </motion.div>
            ) : batchQrItems.length === 0 ? (
              <motion.div
                key="batch-qr-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">暂无可用批次</p>
              </motion.div>
            ) : (
              <motion.div
                key="batch-qr-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-h-[400px] overflow-y-auto space-y-3"
              >
                {batchQrItems.map((item, idx) => {
                  const qrDataStr = JSON.stringify({
                    batchNo: item.batchNo,
                    breed: item.breed,
                    status: item.status,
                    url: `https://farm.example.com/trace/${item.batchNo}`,
                  })
                  const encoded = encodeURIComponent(qrDataStr)
                  return (
                    <motion.div
                      key={item.batchNo}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      {/* QR Code Thumbnail */}
                      <div className="bg-white border rounded-lg p-2 shrink-0">
                        <img
                          src={`/api/qrcode?data=${encoded}&size=100`}
                          alt={`二维码 ${item.batchNo}`}
                          width={80}
                          height={80}
                          className="rounded"
                          loading="lazy"
                        />
                      </div>

                      {/* Batch Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.batchNo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.breed}</p>
                        <Badge
                          variant={item.status === '养殖中' ? 'default' : 'secondary'}
                          className="text-[10px] mt-1"
                        >
                          {item.status}
                        </Badge>
                      </div>

                      {/* Download Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBatchQr(item)}
                        className="shrink-0"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        下载
                      </Button>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBatchQrDialogOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TimelineList({ events, showPublic }: { events: TimelineEvent[]; showPublic: boolean }) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">暂无记录</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {events.map((event, idx) => (
        <div key={idx} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
          <div className={`w-8 h-8 rounded-full ${getEventIconBg(event.type)} flex items-center justify-center shrink-0 mt-0.5`}>
            {getEventIcon(event.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{event.title}</span>
              {event.severity && getSeverityBadge(event.severity)}
              {event.status && getStatusBadge(event.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(event.date)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
