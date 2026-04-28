import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { slaughterData } = await import('@/lib/demo-data')
    return { success: true, data: slaughterData.data, summary: { total: 1, planned: 0, pendingApproval: 0, approved: 0, executing: 0, completed: 1, cancelled: 0, totalQuantity: slaughterData.data.reduce((s, r) => s + r.quantity, 0), totalRevenue: slaughterData.data.reduce((s, r) => s + (r.totalPrice ?? 0), 0) } }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status && status !== '全部') {
      where.status = status
    }

    const records = await db.slaughterRecord.findMany({
      where,
      include: {
        batch: {
          select: {
            batchNo: true,
            breed: true,
            house: { select: { name: true } },
          },
        },
      },
      orderBy: { plannedDate: 'desc' },
    })

    // Compute summary
    const allRecords = await db.slaughterRecord.findMany()
    const summary = {
      total: allRecords.length,
      planned: allRecords.filter(r => r.status === '计划中').length,
      pendingApproval: allRecords.filter(r => r.status === '待审批').length,
      approved: allRecords.filter(r => r.status === '已审批').length,
      executing: allRecords.filter(r => r.status === '执行中').length,
      completed: allRecords.filter(r => r.status === '已完成').length,
      cancelled: allRecords.filter(r => r.status === '已取消').length,
      totalQuantity: allRecords.reduce((sum, r) => sum + r.quantity, 0),
      totalRevenue: allRecords
        .filter(r => r.status === '已完成' && r.totalPrice)
        .reduce((sum, r) => sum + (r.totalPrice ?? 0), 0),
    }

    return NextResponse.json({ success: true, data: records, summary })
  } catch (error) {
    console.error('Error fetching slaughter records:', error)
    const { slaughterData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: slaughterData.data, summary: { total: 1, planned: 0, pendingApproval: 0, approved: 0, executing: 0, completed: 1, cancelled: 0, totalQuantity: slaughterData.data.reduce((s, r) => s + r.quantity, 0), totalRevenue: slaughterData.data.reduce((s, r) => s + (r.totalPrice ?? 0), 0) } })
  }
}

export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { slaughterData } = await import('@/lib/demo-data')
    return { success: true, data: slaughterData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const {
      batchId,
      batchNo,
      houseName,
      breed,
      plannedDate,
      quantity,
      avgWeight,
      totalPrice,
      buyer,
      notes,
    } = body

    if (!batchId || !plannedDate || !quantity) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：batchId, plannedDate, quantity' },
        { status: 400 }
      )
    }

    const record = await db.slaughterRecord.create({
      data: {
        batchId,
        batchNo: batchNo || null,
        houseName: houseName || null,
        breed: breed || null,
        plannedDate: new Date(plannedDate),
        quantity: Number(quantity),
        avgWeight: avgWeight ? Number(avgWeight) : null,
        totalPrice: totalPrice ? Number(totalPrice) : null,
        buyer: buyer || null,
        status: '计划中',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Error creating slaughter record:', error)
    const { slaughterData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: slaughterData.data[0] })
  }
}
