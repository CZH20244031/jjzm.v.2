import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/health-alerts/[id] - Update health alert status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['已解决', '已忽略', '处理中'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值，支持：已解决、已忽略、处理中' },
        { status: 400 }
      )
    }

    const existingAlert = await db.healthAlert.findUnique({
      where: { id },
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: '预警记录不存在' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    if (status === '已解决') {
      updateData.resolvedAt = new Date()
    }

    const updated = await db.healthAlert.update({
      where: { id },
      data: updateData,
      include: {
        batch: {
          include: { house: true },
        },
      },
    })

    return NextResponse.json({
      id: updated.id,
      type: updated.type,
      severity: updated.severity,
      description: updated.description,
      aiConfidence: updated.aiConfidence,
      status: updated.status,
      resolvedAt: updated.resolvedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      batch: {
        id: updated.batch.id,
        batchNo: updated.batch.batchNo,
        breed: updated.batch.breed,
        houseName: updated.batch.house.name,
      },
    })
  } catch (error) {
    console.error('Health alert update error:', error)
    const { healthAlertsData } = await import('@/lib/demo-data')
    return NextResponse.json(healthAlertsData.data[0])
  }
}
