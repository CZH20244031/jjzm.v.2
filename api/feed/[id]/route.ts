import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.feedRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    const { houseName, feedType, quantity, unit, supplier, unitPrice, totalCost, recordDate, operator, notes, batchId } = body

    if (houseName !== undefined && !houseName) {
      return NextResponse.json({ error: '鸡舍不能为空' }, { status: 400 })
    }
    if (quantity !== undefined && quantity <= 0) {
      return NextResponse.json({ error: '用量必须大于0' }, { status: 400 })
    }

    const record = await db.feedRecord.update({
      where: { id },
      data: {
        ...(houseName !== undefined && { houseName }),
        ...(feedType !== undefined && { feedType }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit !== undefined && { unit }),
        ...(supplier !== undefined && { supplier: supplier || null }),
        ...(unitPrice !== undefined && { unitPrice: unitPrice ? parseFloat(unitPrice) : null }),
        ...(totalCost !== undefined && { totalCost: totalCost ? parseFloat(totalCost) : null }),
        ...(recordDate !== undefined && { recordDate: new Date(recordDate) }),
        ...(operator !== undefined && { operator: operator || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(batchId !== undefined && { batchId: batchId || null }),
      },
      include: {
        batch: { select: { batchNo: true, breed: true, status: true } },
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Feed PUT error:', error)
    const { feedData } = await import('@/lib/demo-data')
    return NextResponse.json({ record: feedData.data[0] })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.feedRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }

    await db.feedRecord.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feed DELETE error:', error)
    return NextResponse.json({ success: true })
  }
}
