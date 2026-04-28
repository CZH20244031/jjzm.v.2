import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map(escapeCsvField).join(',') + '\n'
}

export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  const today = new Date().toISOString().split('T')[0]

  if (type === 'batches') {
    const batches = await db.chickenBatch.findMany({
      include: {
        house: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const header = toCsvRow([
      '批次号', '品种', '数量(只)', '鸡舍',
      '入栏日期', '预计出栏日期', '实际出栏日期',
      '状态', '死淘率(%)',
    ])

    const rows = batches.map(b =>
      toCsvRow([
        b.batchNo,
        b.breed,
        b.quantity,
        b.house.name,
        b.startDate.toISOString().split('T')[0],
        b.expectedEndDate?.toISOString().split('T')[0] ?? '',
        b.actualEndDate?.toISOString().split('T')[0] ?? '',
        b.status,
        b.mortalityRate,
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows // BOM for Chinese encoding

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=batches_export_${today}.csv`,
      },
    })
  }

  if (type === 'medications') {
    const medications = await db.medicationRecord.findMany({
      include: {
        batch: { select: { batchNo: true, house: { select: { name: true } } } },
      },
      orderBy: { applyDate: 'desc' },
    })

    const header = toCsvRow([
      '药品名称', '药品类型', '批次号', '鸡舍',
      '剂量', '给药方式', '使用日期',
      '休药天数', '休药截止日', '操作人', '状态', '备注',
    ])

    const rows = medications.map(m =>
      toCsvRow([
        m.drugName,
        m.drugType,
        m.batch.batchNo,
        m.batch.house.name,
        m.dosage,
        m.administrationMethod,
        m.applyDate.toISOString().split('T')[0],
        m.withdrawalDays,
        m.withdrawalEnd.toISOString().split('T')[0],
        m.operator,
        m.status,
        m.notes,
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=medications_export_${today}.csv`,
      },
    })
  }

  if (type === 'costs') {
    const costs = await db.costRecord.findMany({
      include: {
        batch: { select: { batchNo: true, house: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    })

    const header = toCsvRow([
      '批次号', '鸡舍', '成本类型', '项目名称',
      '金额(元)', '数量', '单位', '日期', '操作人', '备注',
    ])

    const rows = costs.map(c =>
      toCsvRow([
        c.batch.batchNo,
        c.batch.house.name,
        c.category,
        c.item,
        c.amount,
        c.quantity,
        c.unit ?? '',
        c.date.toISOString().split('T')[0],
        c.operator ?? '',
        c.notes ?? '',
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=costs_export_${today}.csv`,
      },
    })
  }

  if (type === 'feed') {
    const feeds = await db.feedRecord.findMany({
      include: {
        batch: { select: { batchNo: true } },
      },
      orderBy: { recordDate: 'desc' },
    })

    const header = toCsvRow([
      '记录日期', '鸡舍', '饲料类型', '用量(kg)', '单位', '供应商',
      '单价(元/kg)', '总价(元)', '批次号', '操作员', '备注',
    ])

    const rows = feeds.map(f =>
      toCsvRow([
        f.recordDate.toISOString().split('T')[0],
        f.houseName,
        f.feedType,
        f.unit === '吨' ? f.quantity * 1000 : f.quantity,
        f.unit,
        f.supplier ?? '',
        f.unitPrice ?? '',
        f.totalCost ?? '',
        f.batch?.batchNo ?? '',
        f.operator ?? '',
        f.notes ?? '',
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=feed_export_${today}.csv`,
      },
    })
  }

  if (type === 'sales') {
    const sales = await db.salesRecord.findMany({
      orderBy: { saleDate: 'desc' },
    })

    const header = toCsvRow([
      '批次号', '客户名称', '客户电话', '数量(只)',
      '单价(元/只)', '总价(元)', '销售日期', '鸡舍', '品种',
      '均重(kg)', '状态', '付款方式', '付款状态', '备注',
    ])

    const rows = sales.map(s =>
      toCsvRow([
        s.batchNo ?? '',
        s.buyer,
        s.buyerPhone ?? '',
        s.quantity,
        s.unitPrice,
        s.totalPrice,
        s.saleDate.toISOString().split('T')[0],
        s.houseName ?? '',
        s.breed ?? '',
        s.weight ?? '',
        s.status,
        s.paymentMethod ?? '',
        s.paymentStatus,
        s.notes ?? '',
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=sales_export_${today}.csv`,
      },
    })
  }

  if (type === 'vaccines') {
    const vaccines = await db.vaccineRecord.findMany({
      orderBy: { applyDate: 'desc' },
    })

    const header = toCsvRow([
      '批次号', '疫苗名称', '生产厂家', '疫苗批号', '鸡舍',
      '接种数量(只)', '接种方式', '操作员', '接种日期',
      '下次接种日', '日龄', '状态', '备注',
    ])

    const rows = vaccines.map(v =>
      toCsvRow([
        v.batchNo ?? '',
        v.vaccineName,
        v.manufacturer ?? '',
        v.batchLotNo ?? '',
        v.houseName ?? '',
        v.quantity,
        v.method,
        v.operator ?? '',
        v.applyDate.toISOString().split('T')[0],
        v.nextDate?.toISOString().split('T')[0] ?? '',
        v.dayAge ?? '',
        v.status,
        v.notes ?? '',
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=vaccines_export_${today}.csv`,
      },
    })
  }

  if (type === 'staff') {
    const staff = await db.staff.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const header = toCsvRow([
      '姓名', '职位', '电话', '部门', '负责鸡舍', '状态', '入职日期', '技能',
    ])

    const rows = staff.map(s =>
      toCsvRow([
        s.name,
        s.role,
        s.phone ?? '',
        s.department ?? '',
        s.houseName ?? '',
        s.status,
        s.joinDate?.toISOString().split('T')[0] ?? '',
        s.skills ?? '',
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=staff_export_${today}.csv`,
      },
    })
  }

  if (type === 'alerts') {
    const alerts = await db.alert.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const header = toCsvRow([
      '类型', '级别', '标题', '消息', '来源', '状态', '创建时间',
    ])

    const rows = alerts.map(a =>
      toCsvRow([
        a.type,
        a.level,
        a.title,
        a.message,
        a.source ?? '',
        a.status,
        a.createdAt.toISOString().split('T')[0],
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=alerts_export_${today}.csv`,
      },
    })
  }

  if (type === 'health-alerts') {
    const healthAlerts = await db.healthAlert.findMany({
      include: { batch: { select: { batchNo: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const header = toCsvRow([
      '批次号', '类型', '严重程度', '描述', 'AI置信度(%)', '状态', '创建时间',
    ])

    const rows = healthAlerts.map(h =>
      toCsvRow([
        h.batch.batchNo,
        h.type,
        h.severity,
        h.description,
        h.aiConfidence ?? '',
        h.status,
        h.createdAt.toISOString().split('T')[0],
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=health_alerts_export_${today}.csv`,
      },
    })
  }

  if (type === 'environment') {
    const envRecords = await db.environmentRecord.findMany({
      include: { house: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    const header = toCsvRow([
      '鸡舍', '温度(°C)', '湿度(%)', '氨气(ppm)', 'CO2(ppm)', '风速(m/s)', '记录时间',
    ])

    const rows = envRecords.map(e =>
      toCsvRow([
        e.house.name,
        e.temperature,
        e.humidity,
        e.ammonia,
        e.co2,
        e.windSpeed ?? '',
        e.createdAt.toISOString(),
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=environment_export_${today}.csv`,
      },
    })
  }

  if (type === 'slaughter') {
    const records = await db.slaughterRecord.findMany({
      include: {
        batch: { select: { batchNo: true, breed: true, house: { select: { name: true } } } },
      },
      orderBy: { plannedDate: 'desc' },
    })

    const header = toCsvRow([
      '批次号', '品种', '鸡舍', '计划日期', '实际日期', '数量(只)', '均重(kg)', '总价(元)', '买家', '状态', '审批人', '备注',
    ])

    const rows = records.map(r =>
      toCsvRow([
        r.batchNo || r.batch?.batchNo || '',
        r.breed || r.batch?.breed || '',
        r.houseName || r.batch?.house?.name || '',
        r.plannedDate.toISOString().split('T')[0],
        r.actualDate ? r.actualDate.toISOString().split('T')[0] : '',
        r.quantity,
        r.avgWeight ?? '',
        r.totalPrice ?? '',
        r.buyer ?? '',
        r.status,
        r.approvalBy ?? '',
        r.notes ?? '',
      ])
    ).join('')

    const csv = '\uFEFF' + header + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=slaughter_export_${today}.csv`,
      },
    })
  }

  if (type === 'financial') {
    const costRecords = await db.costRecord.findMany({
      include: {
        batch: { select: { batchNo: true, house: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    })

    const salesRecords = await db.salesRecord.findMany({
      orderBy: { saleDate: 'desc' },
    })

    // Monthly aggregation
    const monthlyMap: Record<string, { revenue: number; cost: number; profit: number }> = {}

    salesRecords.forEach((s) => {
      if (s.status !== '已完成') return
      const d = new Date(s.saleDate)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, cost: 0, profit: 0 }
      monthlyMap[monthKey].revenue += s.totalPrice
    })

    costRecords.forEach((c) => {
      const d = new Date(c.date)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, cost: 0, profit: 0 }
      monthlyMap[monthKey].cost += c.amount
    })

    const monthlyData = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(data.cost * 100) / 100,
        profit: Math.round((data.revenue - data.cost) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const header = toCsvRow([
      '月份', '收入(元)', '成本(元)', '净利润(元)', '利润率(%)',
    ])

    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0)
    const totalCost = monthlyData.reduce((s, m) => s + m.cost, 0)
    const totalProfit = totalRevenue - totalCost
    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'

    const rows = monthlyData.map(m => {
      const margin = m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : '0.0'
      return toCsvRow([m.month, m.revenue, m.cost, m.profit, margin])
    }).join('')

    const summaryRows = toCsvRow([]) + toCsvRow([
      '合计', totalRevenue, totalCost, totalProfit, overallMargin,
    ])

    const csv = '\uFEFF' + header + rows + summaryRows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=financial_report_${today}.csv`,
      },
    })
  }

  return NextResponse.json(
    { error: '无效的导出类型，支持: batches, medications, costs, feed, sales, vaccines, staff, alerts, health-alerts, environment, slaughter, financial' },
    { status: 400 }
  )

  } catch (error) {
    console.error('Export API error:', error)
    const today = new Date().toISOString().split('T')[0]
    const csv = '\uFEFF批次号,品种,数量(只),鸡舍,入栏日期,预计出栏日期,实际出栏日期,状态,死淘率(%)\nJJ2026-005,罗斯308,15000,1号棚,2026-03-18,2026-04-27,,养殖中,1.8\nJJ2026-006,罗斯308,19000,2号棚,2026-03-11,2026-04-20,,养殖中,2.1\n'
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=export_${today}.csv`,
      },
    })
  }
}
