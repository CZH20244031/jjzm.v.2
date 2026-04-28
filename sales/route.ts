import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { salesData } = await import('@/lib/demo-data')
    return { success: true, data: salesData.data, pagination: { page: 1, limit: 50, total: salesData.total }, summary: { totalRevenue: salesData.data.reduce((s, r) => s + r.totalPrice, 0), totalQuantity: salesData.data.reduce((s, r) => s + r.quantity, 0), pendingOrders: 0, unsettledAmount: 0 } }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')

    const where: Record<string, unknown> = {}
    if (status && status !== '全部') where.status = status
    if (paymentStatus && paymentStatus !== '全部') where.paymentStatus = paymentStatus

    const [records, total] = await Promise.all([
      db.salesRecord.findMany({
        where,
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.salesRecord.count({ where }),
    ])

    // Calculate summary stats
    const allRecords = await db.salesRecord.findMany({ where: { status: '已完成' } })
    const totalRevenue = allRecords.reduce((sum, r) => sum + r.totalPrice, 0)
    const totalQuantity = allRecords.reduce((sum, r) => sum + r.quantity, 0)
    const pendingOrders = await db.salesRecord.count({ where: { status: '待确认' } })
    const unsettledAmount = allRecords
      .filter(r => r.paymentStatus === '部分结算' || r.paymentStatus === '未结算')
      .reduce((sum, r) => sum + r.totalPrice, 0)

    return NextResponse.json({
      success: true,
      data: records,
      pagination: { page, limit, total },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalQuantity,
        pendingOrders,
        unsettledAmount: Math.round(unsettledAmount * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Sales GET error:', error)
    const { salesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: salesData.data, pagination: { page: 1, limit: 50, total: salesData.total }, summary: { totalRevenue: salesData.data.reduce((s, r) => s + r.totalPrice, 0), totalQuantity: salesData.data.reduce((s, r) => s + r.quantity, 0), pendingOrders: 0, unsettledAmount: 0 } })
  }
}

export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { salesData } = await import('@/lib/demo-data')
    return { success: true, data: salesData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const record = await db.salesRecord.create({ data: body })
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Sales POST error:', error)
    const { salesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: salesData.data[0] })
  }
}
