'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Banknote,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DollarSign,
  Truck,
  User,
  Phone,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
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
import { useToast } from '@/hooks/use-toast'
import { exportCsv } from '@/lib/export'

interface SalesRecord {
  id: string
  batchNo: string | null
  buyer: string
  buyerPhone: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  saleDate: string
  houseName: string | null
  breed: string | null
  weight: number | null
  status: string
  paymentMethod: string | null
  paymentStatus: string
  notes: string | null
}

interface SalesSummary {
  totalRevenue: number
  totalQuantity: number
  pendingOrders: number
  unsettledAmount: number
}

function getStatusColor(status: string) {
  switch (status) {
    case '已完成': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case '待确认': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case '已取消': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case '已结算': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case '部分结算': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case '未结算': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function SalesManagement() {
  const { toast } = useToast()
  const [records, setRecords] = useState<SalesRecord[]>([])
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('全部')
  const [filterPayment, setFilterPayment] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewRecord, setViewRecord] = useState<SalesRecord | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchSales = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== '全部') params.set('status', filterStatus)
      if (filterPayment !== '全部') params.set('paymentStatus', filterPayment)
      const res = await fetch(`/api/sales?${params}`)
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
  }, [filterStatus, filterPayment])

  useEffect(() => { fetchSales() }, [fetchSales])

  const filteredRecords = records.filter(r =>
    !searchTerm ||
    r.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.batchNo && r.batchNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const completedRecords = records.filter(r => r.status === '已完成')
  const topBuyers = completedRecords.reduce((acc, r) => {
    const existing = acc.find(b => b.name === r.buyer)
    if (existing) {
      existing.total += r.totalPrice
      existing.count += 1
      existing.quantity += r.quantity
    } else {
      acc.push({ name: r.buyer, total: r.totalPrice, count: 1, quantity: r.quantity })
    }
    return acc
  }, [] as { name: string; total: number; count: number; quantity: number }[]).sort((a, b) => b.total - a.total)

  const monthlyRevenue = completedRecords.reduce((acc, r) => {
    const month = r.saleDate.slice(0, 7) // YYYY-MM
    const existing = acc.find(m => m.month === month)
    if (existing) {
      existing.revenue += r.totalPrice
      existing.count += 1
    } else {
      acc.push({ month, revenue: r.totalPrice, count: 1 })
    }
    return acc
  }, [] as { month: string; revenue: number; count: number }[]).sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">销售管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            销售记录与收入管理 · 共 {records.length} 条记录
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-secondary/80 hover:bg-secondary"
            onClick={() => exportCsv('sales', { onSuccess: () => toast({ title: '导出成功' }), onError: (msg) => toast({ title: msg, variant: 'destructive' }) })}
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />新增销售记录</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增销售记录</DialogTitle>
                <DialogDescription>填写销售订单信息</DialogDescription>
              </DialogHeader>
              <div className="text-sm text-muted-foreground text-center py-8">
                请通过批次出栏流程创建销售记录
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                  <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                  已完成
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-white/70 mb-1">累计销售收入</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary ? formatCurrency(summary.totalRevenue) : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">累计出栏量</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary ? `${(summary.totalQuantity / 10000).toFixed(2)}万只` : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">待确认订单</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">
                {summary ? `${summary.pendingOrders} 笔` : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">待结算金额</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-400">
                {summary ? formatCurrency(summary.unsettledAmount) : '--'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="orders" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Receipt className="h-3.5 w-3.5" />
            销售记录
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            收入分析
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs sm:text-sm gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="h-3.5 w-3.5" />
            客户管理
          </TabsTrigger>
        </TabsList>

        {/* Sales Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">销售订单列表</CardTitle>
                  <CardDescription className="text-xs">管理所有出栏销售记录</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索客户/批次号..."
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
                      <SelectItem value="已完成">已完成</SelectItem>
                      <SelectItem value="待确认">待确认</SelectItem>
                      <SelectItem value="已取消">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPayment} onValueChange={setFilterPayment}>
                    <SelectTrigger className="h-8 w-28 sm:w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全部">全部结算</SelectItem>
                      <SelectItem value="已结算">已结算</SelectItem>
                      <SelectItem value="部分结算">部分结算</SelectItem>
                      <SelectItem value="未结算">未结算</SelectItem>
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
                    <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-xs">暂无销售记录</p>
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
                          <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center ${
                            record.status === '已完成' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                            record.status === '待确认' ? 'bg-amber-50 dark:bg-amber-900/20' :
                            'bg-red-50 dark:bg-red-900/20'
                          }`}>
                            {record.status === '已完成' ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" /> :
                             record.status === '待确认' ? <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" /> :
                             <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">{record.buyer}</span>
                            {record.batchNo && (
                              <Badge variant="outline" className="text-[10px] shrink-0">{record.batchNo}</Badge>
                            )}
                            <Badge className={`text-[10px] shrink-0 ${getStatusColor(record.status)}`}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{formatDate(record.saleDate)}</span>
                            {record.quantity > 0 && <span>· {record.quantity.toLocaleString()}只</span>}
                            {record.weight && <span>· {record.weight}kg/只</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-bold text-sm tabular-nums ${
                            record.status === '已完成' ? 'text-emerald-600 dark:text-emerald-400' :
                            record.status === '待确认' ? 'text-amber-600 dark:text-amber-400' :
                            'text-muted-foreground'
                          }`}>
                            {record.totalPrice > 0 ? formatCurrency(record.totalPrice) : '--'}
                          </p>
                          <Badge className={`text-[9px] ${getPaymentStatusColor(record.paymentStatus)}`}>
                            {record.paymentStatus}
                          </Badge>
                        </div>

                        <Eye className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">月度收入趋势</CardTitle>
                <CardDescription className="text-xs">按月统计销售收入</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyRevenue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">暂无数据</div>
                  ) : (
                    monthlyRevenue.map(m => {
                      const maxRevenue = Math.max(...monthlyRevenue.map(r => r.revenue))
                      const percentage = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0
                      return (
                        <div key={m.month} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{m.month}</span>
                            <span className="font-medium tabular-nums">{formatCurrency(m.revenue)}</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">{m.count} 笔订单</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">批次销售利润概览</CardTitle>
                <CardDescription className="text-xs">各批次销售情况对比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">暂无数据</div>
                  ) : (
                    completedRecords
                      .reduce((acc, r) => {
                        const batch = r.batchNo || '未知批次'
                        const existing = acc.find(b => b.batch === batch)
                        if (existing) {
                          existing.revenue += r.totalPrice
                          existing.quantity += r.quantity
                        } else {
                          acc.push({ batch, revenue: r.totalPrice, quantity: r.quantity, houseName: r.houseName, breed: r.breed })
                        }
                        return acc
                      }, [] as { batch: string; revenue: number; quantity: number; houseName: string | null; breed: string | null }[])
                      .sort((a, b) => b.revenue - a.revenue)
                      .map(item => (
                        <div key={item.batch} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.batch}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {item.houseName} · {item.breed} · {item.quantity.toLocaleString()}只
                            </p>
                          </div>
                          <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">客户排名</CardTitle>
              <CardDescription className="text-xs">按累计采购金额排序</CardDescription>
            </CardHeader>
            <CardContent>
              {topBuyers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">暂无客户数据</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topBuyers.map((buyer, idx) => (
                    <motion.div
                      key={buyer.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        idx === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                        idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{buyer.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {buyer.count} 笔订单 · {buyer.quantity.toLocaleString()} 只
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm tabular-nums">{formatCurrency(buyer.total)}</p>
                        {idx === 0 && (
                          <Badge className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                            TOP 1
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
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
              <ShoppingCart className="h-4 w-4" />
              销售详情
            </DialogTitle>
            <DialogDescription>订单详细信息</DialogDescription>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">客户名称</p>
                  <p className="text-sm font-medium">{viewRecord.buyer}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">联系电话</p>
                  <p className="text-sm">{viewRecord.buyerPhone || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">批次号</p>
                  <p className="text-sm">{viewRecord.batchNo || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">销售日期</p>
                  <p className="text-sm">{formatDate(viewRecord.saleDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">鸡舍/品种</p>
                  <p className="text-sm">{viewRecord.houseName || '--'} · {viewRecord.breed || '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">数量/单价</p>
                  <p className="text-sm">{viewRecord.quantity > 0 ? `${viewRecord.quantity.toLocaleString()}只` : '--'} / {viewRecord.unitPrice > 0 ? `${viewRecord.unitPrice}元` : '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">均重</p>
                  <p className="text-sm">{viewRecord.weight ? `${viewRecord.weight}kg/只` : '--'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">支付方式</p>
                  <p className="text-sm">{viewRecord.paymentMethod || '--'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(viewRecord.status)}>{viewRecord.status}</Badge>
                  <Badge className={getPaymentStatusColor(viewRecord.paymentStatus)}>{viewRecord.paymentStatus}</Badge>
                </div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(viewRecord.totalPrice)}
                </p>
              </div>
              {viewRecord.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">备注</p>
                  <p className="text-xs">{viewRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
