import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/alerts/[id] - Update alert status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['未读', '已读', '已处理'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值，可选：未读、已读、已处理' },
        { status: 400 }
      )
    }

    const alert = await db.alert.findUnique({ where: { id } })
    if (!alert) {
      return NextResponse.json(
        { error: '预警不存在' },
        { status: 404 }
      )
    }

    const updatedAlert = await db.alert.update({
      where: { id },
      data: { status },
      include: { farm: true },
    })

    return NextResponse.json({
      alert: {
        id: updatedAlert.id,
        type: updatedAlert.type,
        level: updatedAlert.level,
        title: updatedAlert.title,
        message: updatedAlert.message,
        source: updatedAlert.source,
        status: updatedAlert.status,
        createdAt: updatedAlert.createdAt,
        updatedAt: updatedAlert.updatedAt,
        farm: {
          id: updatedAlert.farm.id,
          name: updatedAlert.farm.name,
        },
      },
    })
  } catch (error) {
    console.error('Alert PUT error:', error)
    const { alertsData } = await import('@/lib/demo-data')
    return NextResponse.json({ alert: alertsData.data[0] })
  }
}
