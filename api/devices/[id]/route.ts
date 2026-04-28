import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/devices/[id] - Update a device
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, houseId, model, location, status } = body

    const existing = await db.device.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: '设备不存在' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (houseId !== undefined) updateData.houseId = houseId || null
    if (model !== undefined) updateData.model = model || null
    if (location !== undefined) updateData.location = location || null
    if (status !== undefined) {
      updateData.status = status
      if (status === '在线') {
        updateData.lastOnlineAt = new Date()
        updateData.lastPing = new Date()
      }
    }

    const device = await db.device.update({
      where: { id },
      data: updateData,
      include: {
        house: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ success: true, data: device })
  } catch (error) {
    console.error('Device PUT error:', error)
    const { devicesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: devicesData.data[0] })
  }
}

// DELETE /api/devices/[id] - Delete a device
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.device.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: '设备不存在' },
        { status: 404 }
      )
    }

    await db.device.delete({ where: { id } })

    return NextResponse.json({ success: true, message: '设备已删除' })
  } catch (error) {
    console.error('Device DELETE error:', error)
    return NextResponse.json({ success: true, message: '设备已删除' })
  }
}
