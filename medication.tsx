'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'
import {
  Plus,
  Search,
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
} from 'lucide-react'

type DrugType = '抗生素' | '疫苗' | '营养剂' | '消毒剂' | '其他'
type WithdrawalStatus = '休药中' | '已过休药期' | '无需休药'

interface MedicationRecord {
  id: string
  batchId: string
  batchNo?: string
  houseName?: string
  drugName: string
  drugType: DrugType
  dosage: string
  administrationMethod: string
  applyDate: string
  withdrawalDays: number
  withdrawalEnd: string
  operator: string
  notes: string | null
  status: string
}

function getDrugTypeBadge(type: DrugType) {
  const pillStyles = 'rounded-full px-2 py-0.5 text-[10px] font-medium border'
  switch (type) {
    case '抗生素': return <span className={`${pillStyles} bg-red-50 text-red-700 border-red-200`}>{type}</span>
    case '疫苗': return <span className={`${pillStyles} bg-teal-50 text-teal-700 border-teal-200`}>{type}</span>
    case '营养剂': return <span className={`${pillStyles} bg-emerald-50 text-emerald-700 border-emerald-200`}>{type}</span>
    case '消毒剂': return <span className={`${pillStyles} bg-amber-50 text-amber-700 border-amber-200`}>{type}</span>
    default: return <span className={`${pillStyles} bg-gray-50 text-gray-600 border-gray-200`}>{type}</span>
  }
}

function getWithdrawalStatus(record: MedicationRecord): { status: WithdrawalStatus; daysLeft: number } {
  if (!record.withdrawalDays || record.withdrawalDays === 0) {
    return { status: '无需休药', daysLeft: 0 }
  }
  const end = new Date(record.withdrawalEnd)
  const today = new Date()
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) {
    return { status: '已过休药期', daysLeft: 0 }
  }
  return { status: '休药中', daysLeft: diffDays }
}

function getWithdrawalBadge(status: WithdrawalStatus, daysLeft: number, totalDays?: number) {
  // Calculate progress percentage for gradient
  const progress = totalDays && totalDays > 0 ? Math.min(100, ((totalDays - daysLeft) / totalDays) * 100) : 100
  const gradientColor = status === '休药中'
    ? daysLeft <= 2 ? 'from-red-500 to-red-400' : daysLeft <= 5 ? 'from-amber-500 to-yellow-400' : 'from-emerald-500 to-emerald-400'
    : 'from-emerald-500 to-emerald-400'
  switch (status) {
    case '休药中':
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r ${gradientColor} shadow-sm`}>
          <Clock className="h-3 w-3 mr-1" />
          {daysLeft}天
        </span>
      )
    case '已过休药期':
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          安全
        </span>
      )
    case '无需休药':
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          免休药
        </span>
      )
  }
}

export function Medication() {
  const [records, setRecords] = useState<MedicationRecord[]>([])
  const [batches, setBatches] = useState<Array<{ id: string; batchNo: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const { toast } = useToast()

  const [newMed, setNewMed] = useState({
    drugName: '',
    drugType: '抗生素',
    dosage: '',
    administrationMethod: '饮水',
    batchId: '',
    withdrawalDays: '0',
    applyDate: new Date().toISOString().split('T')[0],
    operator: '',
    notes: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [medRes, batchRes] = await Promise.all([
          fetch('/api/medications'),
          fetch('/api/batches'),
        ])
        if (medRes.ok) {
          const medData = await medRes.json()
          setRecords((medData.medications || []).map((m: Record<string, unknown>) => ({
            ...m,
            batchNo: (m.batch as Record<string, unknown>)?.batchNo as string || '--',
            houseName: (m.batch as Record<string, unknown>)?.houseName as string || '--',
          })))
        }
        if (batchRes.ok) {
          const batchData = await batchRes.json()
          setBatches((batchData.batches || []).map((b: { id: string; batchNo: string }) => ({ id: b.id, batchNo: b.batchNo })))
        }
      } catch (err) {
        console.error('Failed to fetch medications:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleCreate() {
    if (!newMed.drugName || !newMed.batchId || !newMed.applyDate) {
      toast({ title: '请填写必要信息', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMed,
          withdrawalDays: parseInt(newMed.withdrawalDays) || 0,
        }),
      })
      if (res.ok) {
        toast({ title: '用药记录添加成功' })
        setShowNewDialog(false)
        const medRes = await fetch('/api/medications')
        if (medRes.ok) {
          const medData = await medRes.json()
          setRecords((medData.medications || []).map((m: Record<string, unknown>) => ({
            ...m,
            batchNo: (m.batch as Record<string, unknown>)?.batchNo as string || '--',
            houseName: (m.batch as Record<string, unknown>)?.houseName as string || '--',
          })))
        }
        setNewMed({
          drugName: '', drugType: '抗生素', dosage: '', administrationMethod: '饮水',
          batchId: '', withdrawalDays: '0', applyDate: new Date().toISOString().split('T')[0],
          operator: '', notes: '',
        })
      } else {
        const err = await res.json()
        toast({ title: err.error || '添加失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '网络错误', variant: 'destructive' })
    }
  }

  const filteredRecords = records.filter((record) => {
    const matchSearch =
      record.drugName.includes(searchQuery) ||
      (record.batchNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchBatch = batchFilter === 'all' || record.batchId === batchFilter
    const matchType = typeFilter === 'all' || record.drugType === typeFilter
    return matchSearch && matchBatch && matchType
  })

  const activeWithdrawals = records.filter(
    (r) => getWithdrawalStatus(r).status === '休药中'
  ).length

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
          <h1 className="text-2xl font-bold tracking-tight">用药管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            药品使用记录与休药期管理 · 共 {records.length} 条记录 · {activeWithdrawals} 条休药中
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-secondary/80 hover:bg-secondary"
            onClick={() => exportCsv('medications', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增用药记录
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增用药记录</DialogTitle>
              <DialogDescription>记录药品使用信息，系统将自动计算休药期。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>药品名称</Label>
                <Input placeholder="输入药品名称" value={newMed.drugName} onChange={e => setNewMed({ ...newMed, drugName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>药品类型</Label>
                  <Select value={newMed.drugType} onValueChange={v => setNewMed({ ...newMed, drugType: v })}>
                    <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="抗生素">抗生素</SelectItem>
                      <SelectItem value="疫苗">疫苗</SelectItem>
                      <SelectItem value="营养剂">营养剂</SelectItem>
                      <SelectItem value="消毒剂">消毒剂</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>给药方式</Label>
                  <Select value={newMed.administrationMethod} onValueChange={v => setNewMed({ ...newMed, administrationMethod: v })}>
                    <SelectTrigger><SelectValue placeholder="选择方式" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="饮水">饮水</SelectItem>
                      <SelectItem value="拌料">拌料</SelectItem>
                      <SelectItem value="注射">注射</SelectItem>
                      <SelectItem value="喷雾">喷雾</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>剂量</Label>
                <Input placeholder="例如: 100g/100L水" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>使用批次</Label>
                  <Select value={newMed.batchId} onValueChange={v => setNewMed({ ...newMed, batchId: v })}>
                    <SelectTrigger><SelectValue placeholder="选择批次" /></SelectTrigger>
                    <SelectContent>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.batchNo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>休药天数</Label>
                  <Input type="number" placeholder="0表示无需休药" value={newMed.withdrawalDays} onChange={e => setNewMed({ ...newMed, withdrawalDays: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>使用日期</Label>
                  <Input type="date" value={newMed.applyDate} onChange={e => setNewMed({ ...newMed, applyDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>操作人</Label>
                  <Input placeholder="操作人姓名" value={newMed.operator} onChange={e => setNewMed({ ...newMed, operator: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>备注</Label>
                <Input placeholder="用药原因等" value={newMed.notes} onChange={e => setNewMed({ ...newMed, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>取消</Button>
              <Button onClick={handleCreate}>确认添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Withdrawal Alert */}
      {activeWithdrawals > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                当前有 {activeWithdrawals} 条用药记录处于休药期
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">请注意休药期内的批次不得出栏销售，系统已自动锁定相关出栏申请</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索药品名称、批次号..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="筛选批次" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部批次</SelectItem>
            {batches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.batchNo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="药品类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="抗生素">抗生素</SelectItem>
            <SelectItem value="疫苗">疫苗</SelectItem>
            <SelectItem value="营养剂">营养剂</SelectItem>
            <SelectItem value="消毒剂">消毒剂</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">药品名称</TableHead>
                  <TableHead className="text-xs">类型</TableHead>
                  <TableHead className="text-xs">批次</TableHead>
                  <TableHead className="text-xs">剂量</TableHead>
                  <TableHead className="text-xs">给药方式</TableHead>
                  <TableHead className="text-xs">使用日期</TableHead>
                  <TableHead className="text-xs">操作人</TableHead>
                  <TableHead className="text-xs">休药状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const ws = getWithdrawalStatus(record)
                  return (
                    <TableRow key={record.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                      <TableCell className="text-xs font-medium">{record.drugName}</TableCell>
                      <TableCell>{getDrugTypeBadge(record.drugType)}</TableCell>
                      <TableCell className="text-xs">{record.batchNo || '--'}</TableCell>
                      <TableCell className="text-xs">{record.dosage}</TableCell>
                      <TableCell className="text-xs">{record.administrationMethod}</TableCell>
                      <TableCell className="text-xs">{record.applyDate.split('T')[0]}</TableCell>
                      <TableCell className="text-xs">{record.operator}</TableCell>
                      <TableCell>{getWithdrawalBadge(ws.status, ws.daysLeft, record.withdrawalDays)}</TableCell>
                    </TableRow>
                  )
                })}
                {filteredRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      暂无用药记录
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
