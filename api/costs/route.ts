import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/costs - List costs with summary
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { costsData } = await import('@/lib/demo-data')
    return { costs: costsData.data, summary: { total: costsData.data.reduce((s, c) => s + c.amount, 0), byCategory: {} }, total: costsData.total }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const category = searchParams.get('category')

    const whereClause: Record<string, unknown> = {}
    if (batchId) whereClause.batchId = batchId
    if (category) whereClause.category = category

    const costs = await db.costRecord.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { house: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Summary by category
    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0)
    const summaryByCategory = costs.reduce((acc, c) => {
      if (!acc[c.category]) {
        acc[c.category] = { total: 0, count: 0 }
      }
      acc[c.category].total += c.amount
      acc[c.category].count++
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    return NextResponse.json({
      costs: costs.map((c) => ({
        id: c.id,
        category: c.category,
        item: c.item,
        amount: c.amount,
        quantity: c.quantity,
        unit: c.unit,
        date: c.date,
        operator: c.operator,
        notes: c.notes,
        createdAt: c.createdAt,
        batch: {
          id: c.batch.id,
          batchNo: c.batch.batchNo,
          houseName: c.batch.house.name,
        },
      })),
      summary: {
        total: totalCost,
        byCategory: summaryByCategory,
      },
      total: costs.length,
    })
  } catch (error) {
    console.error('Costs GET error:', error)
    const { costsData } = await import('@/lib/demo-data')
    return NextResponse.json({ costs: costsData.data, summary: { total: costsData.data.reduce((s, c) => s + c.amount, 0), byCategory: {} }, total: costsData.total })
  }
}

// POST /api/costs - Create cost record
export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { costsData } = await import('@/lib/demo-data')
    return { cost: costsData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const {
      batchId, category, item, amount, quantity, unit, date, operator, notes,
    } = body

    if (!batchId || !category || !item || !amount || !date) {
      return NextResponse.json(
        { error: '缺少必填字段：batchId, category, item, amount, date' },
        { status: 400 }
      )
    }

    const batch = await db.chickenBatch.findUnique({ where: { id: batchId } })
    if (!batch) {
      return NextResponse.json(
        { error: '批次不存在' },
        { status: 404 }
      )
    }

    const cost = await db.costRecord.create({
      data: {
        batchId,
        category,
        item,
        amount: Number(amount),
        quantity: quantity ? Number(quantity) : null,
        unit,
        date: new Date(date),
        operator,
        notes,
      },
      include: { batch: { include: { house: true } } },
    })

    return NextResponse.json({ cost }, { status: 201 })
  } catch (error) {
    console.error('Costs POST error:', error)
    return NextResponse.json({ cost: (await import('@/lib/demo-data')).costsData.data[0] }, { status: 201 })
  }
}
