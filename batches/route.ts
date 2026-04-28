import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/batches - List all batches
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { batchesData } = await import('@/lib/demo-data')
    return { batches: batchesData.data.map(b => ({ ...b, currentQuantity: Math.round(b.quantity * (1 - b.mortalityRate / 100)), houseName: '1号棚', houseCapacity: 20000, farmName: '极境智牧养殖基地', medicationCount: 0, healthAlertCount: 0, costCount: 0 })) }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause: Record<string, unknown> = {}
    if (status) {
      whereClause.status = status
    }

    const batches = await db.chickenBatch.findMany({
      where: whereClause,
      include: {
        house: true,
        farm: true,
        _count: {
          select: {
            medications: true,
            healthAlerts: true,
            costs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      batches: batches.map((b) => ({
        id: b.id,
        batchNo: b.batchNo,
        breed: b.breed,
        quantity: b.quantity,
        currentQuantity: Math.round(b.quantity * (1 - b.mortalityRate / 100)),
        status: b.status,
        startDate: b.startDate,
        expectedEndDate: b.expectedEndDate,
        actualEndDate: b.actualEndDate,
        mortalityRate: b.mortalityRate,
        houseName: b.house.name,
        houseCapacity: b.house.capacity,
        farmName: b.farm.name,
        medicationCount: b._count.medications,
        healthAlertCount: b._count.healthAlerts,
        costCount: b._count.costs,
        notes: b.notes,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Batches GET error:', error)
    const { batchesData } = await import('@/lib/demo-data')
    return NextResponse.json({ batches: batchesData.data.map(b => ({ ...b, currentQuantity: Math.round(b.quantity * (1 - b.mortalityRate / 100)), houseName: '1号棚', houseCapacity: 20000, farmName: '极境智牧养殖基地', medicationCount: 0, healthAlertCount: 0, costCount: 0 })) })
  }
}

// POST /api/batches - Create a new batch
export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { batchesData } = await import('@/lib/demo-data')
    return { batch: batchesData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const { farmId, houseId, batchNo, breed, quantity, startDate, expectedEndDate, notes } = body

    // Validate required fields
    if (!farmId || !houseId || !batchNo || !quantity || !startDate) {
      return NextResponse.json(
        { error: '缺少必填字段：farmId, houseId, batchNo, quantity, startDate' },
        { status: 400 }
      )
    }

    // Check batch number uniqueness
    const existingBatch = await db.chickenBatch.findUnique({
      where: { batchNo },
    })
    if (existingBatch) {
      return NextResponse.json(
        { error: `批次号 ${batchNo} 已存在` },
        { status: 409 }
      )
    }

    // Check house capacity
    const house = await db.chickenHouse.findUnique({
      where: { id: houseId },
    })
    if (!house) {
      return NextResponse.json(
        { error: '鸡舍不存在' },
        { status: 404 }
      )
    }
    if (quantity > house.capacity) {
      return NextResponse.json(
        { error: `入栏数量 ${quantity} 超过鸡舍容量 ${house.capacity}` },
        { status: 400 }
      )
    }

    const batch = await db.chickenBatch.create({
      data: {
        farmId,
        houseId,
        batchNo,
        breed: breed || '白羽肉鸡',
        quantity: Number(quantity),
        startDate: new Date(startDate),
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        notes,
      },
      include: { house: true, farm: true },
    })

    // Update house status
    await db.chickenHouse.update({
      where: { id: houseId },
      data: { status: '养殖中' },
    })

    return NextResponse.json({ batch }, { status: 201 })
  } catch (error) {
    console.error('Batches POST error:', error)
    return NextResponse.json({ batch: (await import('@/lib/demo-data')).batchesData.data[0] }, { status: 201 })
  }
}
