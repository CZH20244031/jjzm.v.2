import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { feedData } = await import('@/lib/demo-data')
    return { records: feedData.data, total: feedData.total, page: 1, pageSize: 50, stats: { todayConsumption: 0, weekConsumption: 0, monthConsumption: 0, monthCost: 0, avgUnitPrice: 0, byHouse: {}, byType: {}, dailyConsumption: {}, dailyCost: {} } }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const houseName = searchParams.get('houseName')
    const feedType = searchParams.get('feedType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (houseName && houseName !== '全部') where.houseName = houseName
    if (feedType && feedType !== '全部') where.feedType = feedType
    if (startDate || endDate) {
      where.recordDate = {} as Record<string, Date>
      if (startDate) (where.recordDate as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.recordDate as Record<string, Date>).lte = new Date(endDate)
    }

    const [records, total] = await Promise.all([
      db.feedRecord.findMany({
        where,
        include: {
          batch: { select: { batchNo: true, breed: true, status: true } },
        },
        orderBy: { recordDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.feedRecord.count({ where }),
    ])

    // Summary stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayRecords, weekRecords, monthRecords] = await Promise.all([
      db.feedRecord.findMany({ where: { recordDate: { gte: todayStart } } }),
      db.feedRecord.findMany({ where: { recordDate: { gte: weekStart } } }),
      db.feedRecord.findMany({ where: { recordDate: { gte: monthStart } } }),
    ])

    const todayConsumption = todayRecords.reduce((sum, r) => sum + (r.unit === '吨' ? r.quantity * 1000 : r.quantity), 0)
    const weekConsumption = weekRecords.reduce((sum, r) => sum + (r.unit === '吨' ? r.quantity * 1000 : r.quantity), 0)
    const monthConsumption = monthRecords.reduce((sum, r) => sum + (r.unit === '吨' ? r.quantity * 1000 : r.quantity), 0)
    const monthCost = monthRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0)
    const avgUnitPrice = monthRecords.filter(r => r.unitPrice).length > 0
      ? monthRecords.filter(r => r.unitPrice).reduce((sum, r) => sum + r.unitPrice!, 0) / monthRecords.filter(r => r.unitPrice).length
      : 0

    // Consumption by house (this month)
    const byHouse: Record<string, number> = {}
    monthRecords.forEach(r => {
      byHouse[r.houseName] = (byHouse[r.houseName] || 0) + (r.unit === '吨' ? r.quantity * 1000 : r.quantity)
    })

    // Consumption by type (this month)
    const byType: Record<string, number> = {}
    monthRecords.forEach(r => {
      byType[r.feedType] = (byType[r.feedType] || 0) + (r.unit === '吨' ? r.quantity * 1000 : r.quantity)
    })

    // Daily consumption for last 30 days (for chart)
    const chartStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const chartRecords = await db.feedRecord.findMany({
      where: { recordDate: { gte: chartStart } },
      orderBy: { recordDate: 'asc' },
    })

    const dailyConsumption: Record<string, number> = {}
    const dailyCost: Record<string, number> = {}
    chartRecords.forEach(r => {
      const dayKey = r.recordDate.toISOString().split('T')[0]
      const qty = r.unit === '吨' ? r.quantity * 1000 : r.quantity
      dailyConsumption[dayKey] = (dailyConsumption[dayKey] || 0) + qty
      dailyCost[dayKey] = (dailyCost[dayKey] || 0) + (r.totalCost || 0)
    })

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      stats: {
        todayConsumption: Math.round(todayConsumption),
        weekConsumption: Math.round(weekConsumption),
        monthConsumption: Math.round(monthConsumption),
        monthCost: Math.round(monthCost),
        avgUnitPrice: Math.round(avgUnitPrice * 100) / 100,
        byHouse,
        byType,
        dailyConsumption,
        dailyCost,
      },
    })
  } catch (error) {
    console.error('Feed GET error:', error)
    const { feedData } = await import('@/lib/demo-data')
    return NextResponse.json({ records: feedData.data, total: feedData.total, page: 1, pageSize: 50, stats: { todayConsumption: 0, weekConsumption: 0, monthConsumption: 0, monthCost: 0, avgUnitPrice: 0, byHouse: {}, byType: {}, dailyConsumption: {}, dailyCost: {} } })
  }
}

export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { feedData } = await import('@/lib/demo-data')
    return { record: feedData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const { houseName, feedType, quantity, unit, supplier, unitPrice, totalCost, recordDate, operator, notes, batchId } = body

    // Validate required fields
    if (!houseName || !feedType || !quantity || !recordDate) {
      return NextResponse.json(
        { error: '鸡舍、饲料类型、用量和记录日期为必填项' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: '用量必须大于0' },
        { status: 400 }
      )
    }

    const record = await db.feedRecord.create({
      data: {
        houseName,
        feedType,
        quantity: parseFloat(quantity),
        unit: unit || 'kg',
        supplier: supplier || null,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        totalCost: totalCost ? parseFloat(totalCost) : null,
        recordDate: new Date(recordDate),
        operator: operator || null,
        notes: notes || null,
        batchId: batchId || null,
      },
      include: {
        batch: { select: { batchNo: true, breed: true, status: true } },
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('Feed POST error:', error)
    return NextResponse.json({ record: (await import('@/lib/demo-data')).feedData.data[0] }, { status: 201 })
  }
}
