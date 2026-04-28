'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  HeartPulse,
  Brain,
  Mic,
  Eye,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  TrendingUp,
  Activity,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCountUp } from '@/lib/animations'

type SeverityLevel = '紧急' | '高' | '一般' | '低'

interface BatchInfo {
  id: string
  batchNo: string
  breed: string
  houseName: string
}

interface HealthAlertItem {
  id: string
  type: string
  severity: SeverityLevel
  description: string
  aiConfidence: number | null
  status: string
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  batch: BatchInfo
}

function getSeverityColor(level: SeverityLevel) {
  switch (level) {
    case '紧急': return 'text-red-600 bg-red-50 border-red-200'
    case '高': return 'text-orange-600 bg-orange-50 border-orange-200'
    case '一般': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case '低': return 'text-teal-600 bg-teal-50 border-teal-200'
  }
}

function getSeverityBorderColor(level: SeverityLevel) {
  switch (level) {
    case '紧急': return 'border-l-red-500'
    case '高': return 'border-l-orange-500'
    case '一般': return 'border-l-yellow-500'
    case '低': return 'border-l-teal-500'
  }
}

function getSeverityIcon(level: SeverityLevel) {
  switch (level) {
    case '紧急': return <AlertTriangle className="h-4 w-4" />
    case '高': return <AlertCircle className="h-4 w-4" />
    case '一般': return <Info className="h-4 w-4" />
    case '低': return <Shield className="h-4 w-4" />
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case '扎堆行为': return <Activity className="h-3.5 w-3.5 text-green-500" />
    case '活动异常': return <HeartPulse className="h-3.5 w-3.5 text-green-500" />
    case '呼吸道异常': return <Mic className="h-3.5 w-3.5 text-purple-500" />
    case '采食下降': return <Eye className="h-3.5 w-3.5 text-amber-500" />
    case '冷应激': return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
    default: return <Activity className="h-3.5 w-3.5" />
  }
}

function getConfidenceColor(confidence: number | null) {
  if (confidence === null) return 'text-muted-foreground'
  if (confidence >= 85) return 'text-green-600'
  if (confidence >= 70) return 'text-yellow-600'
  return 'text-orange-500'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// Summary count-up card component
function SummaryCountCard({ label, count, icon: Icon, colorClass, borderClass }: { label: string; count: number; icon: React.ComponentType<{ className?: string }>; colorClass: string; borderClass: string }) {
  const animatedCount = useCountUp(count, { duration: 800, enabled: true })
  return (
    <Card className={`${borderClass} bg-gradient-to-br from-background to-muted/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-2`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className={`text-xs ${colorClass}`}>{label}</p>
          <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>{animatedCount}</p>
        </div>
        <Icon className={`h-8 w-8 ${colorClass} opacity-30`} />
      </CardContent>
    </Card>
  )
}

export function HealthAlerts() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<HealthAlertItem[]>([])
  const [batches, setBatches] = useState<BatchInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (batchFilter !== 'all') params.set('batchId', batchFilter)

      const res = await fetch(`/api/health-alerts?${params.toString()}`)
      if (!res.ok) throw new Error('获取健康预警失败')
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch {
      toast({
        title: '加载失败',
        description: '获取健康预警数据失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [severityFilter, batchFilter, toast])

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches')
      if (!res.ok) return
      const data = await res.json()
      const batchList: BatchInfo[] = (data.batches || []).map((b: { id: string; batchNo: string; breed: string; houseName: string }) => ({
        id: b.id,
        batchNo: b.batchNo,
        breed: b.breed,
        houseName: b.houseName,
      }))
      setBatches(batchList)
    } catch {
      // silently fail for batch list
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleResolve = async (alertId: string, status: string) => {
    try {
      setUpdatingId(alertId)
      const res = await fetch(`/api/health-alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('更新失败')
      toast({
        title: '操作成功',
        description: status === '已解决' ? '预警已标记为已解决' : '预警已忽略',
      })
      fetchAlerts()
    } catch {
      toast({
        title: '操作失败',
        description: '更新预警状态失败，请重试',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  // Calculate summary from current alerts (from API)
  const allAlertsSummary = { 紧急: 0, 高: 0, 一般: 0, 低: 0 }
  // We need unfiltered count for summary - fetch once on mount
  const [summaryCounts, setSummaryCounts] = useState({ 紧急: 0, 高: 0, 一般: 0, 低: 0 })

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/health-alerts')
        if (!res.ok) return
        const data = await res.json()
        const allAlerts = data.alerts || []
        const counts = { 紧急: 0, 高: 0, 一般: 0, 低: 0 }
        allAlerts.forEach((a: HealthAlertItem) => {
          if (a.severity in counts) {
            (counts as Record<string, number>)[a.severity]++
          }
        })
        setSummaryCounts(counts)
      } catch {
        // ignore
      }
    }
    fetchSummary()
  }, [])

  const unresolvedCount = alerts.filter(a => a.status !== '已解决' && a.status !== '已忽略').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">健康预警</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI智能健康监测与预警系统 · {unresolvedCount} 条未处理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-full px-3 py-1.5 border border-green-200">
            <Brain className="h-3.5 w-3.5" />
            AI模型运行中
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCountCard label="紧急" count={summaryCounts['紧急']} icon={AlertTriangle} colorClass="text-red-600" borderClass="border-red-200" />
        <SummaryCountCard label="高" count={summaryCounts['高']} icon={AlertCircle} colorClass="text-orange-600" borderClass="border-orange-200" />
        <SummaryCountCard label="一般" count={summaryCounts['一般']} icon={Info} colorClass="text-yellow-600" borderClass="border-yellow-200" />
        <SummaryCountCard label="低" count={summaryCounts['低']} icon={Shield} colorClass="text-teal-600" borderClass="border-teal-200" />
      </div>

      {/* AI Detection Status */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            AI检测状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">行为分析</span>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">运行中</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>置信度阈值: 70%</span>
                <span>检测类型: 活动异常/扎堆/采食</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">声音分析</span>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">运行中</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>置信度阈值: 65%</span>
                <span>检测类型: 呼吸道异常</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">视觉识别</span>
                </div>
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">校准中</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>置信度阈值: 75%</span>
                <span>检测类型: 采食/饮水/冷应激</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="预警级别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部级别</SelectItem>
            <SelectItem value="紧急">紧急</SelectItem>
            <SelectItem value="高">高</SelectItem>
            <SelectItem value="一般">一般</SelectItem>
            <SelectItem value="低">低</SelectItem>
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="选择批次" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部批次</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.batchNo} - {b.breed}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">暂无匹配的预警记录</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => {
            const isResolved = alert.status === '已解决' || alert.status === '已忽略'
            return (
              <Card
                key={alert.id}
                className={`hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
                  !isResolved ? `border-l-4 ${getSeverityBorderColor(alert.severity)}` : 'opacity-70'
                } ${alert.severity === '紧急' && !isResolved ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`rounded-lg p-2 ${getSeverityColor(alert.severity)} shrink-0 mt-0.5`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{alert.type}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{alert.severity}</Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{alert.status}</Badge>
                          {isResolved && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1.5 py-0">已处理</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {getTypeIcon(alert.type)} {alert.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground">批次: {alert.batch.batchNo}</span>
                          <span className="text-[10px] text-muted-foreground">{alert.batch.houseName}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      {alert.aiConfidence !== null && (
                        <>
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3 text-primary" />
                            <span className={`text-sm font-bold ${getConfidenceColor(alert.aiConfidence)}`}>
                              {alert.aiConfidence}%
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">AI置信度</span>
                        </>
                      )}
                      {!isResolved && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                            disabled={updatingId === alert.id}
                            onClick={() => handleResolve(alert.id, '已解决')}
                          >
                            {updatingId === alert.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            已解决
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-muted-foreground"
                            disabled={updatingId === alert.id}
                            onClick={() => handleResolve(alert.id, '已忽略')}
                          >
                            忽略
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
