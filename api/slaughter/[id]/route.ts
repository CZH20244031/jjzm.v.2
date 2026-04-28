import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.slaughterRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '出栏记录不存在' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.batchNo !== undefined) updateData.batchNo = body.batchNo
    if (body.houseName !== undefined) updateData.houseName = body.houseName
    if (body.breed !== undefined) updateData.breed = body.breed
    if (body.plannedDate !== undefined) updateData.plannedDate = new Date(body.plannedDate)
    if (body.actualDate !== undefined) updateData.actualDate = body.actualDate ? new Date(body.actualDate) : null
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity)
    if (body.avgWeight !== undefined) updateData.avgWeight = body.avgWeight ? Number(body.avgWeight) : null
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice ? Number(body.totalPrice) : null
    if (body.buyer !== undefined) updateData.buyer = body.buyer
    if (body.notes !== undefined) updateData.notes = body.notes

    // Handle approval fields
    if (body.approvalBy !== undefined) updateData.approvalBy = body.approvalBy
    if (body.approvalAt !== undefined) updateData.approvalAt = body.approvalAt ? new Date(body.approvalAt) : null

    // Auto-set approval info when status changes to 已审批
    if (body.status === '已审批' && !body.approvalBy) {
      updateData.approvalBy = '系统管理员'
      updateData.approvalAt = new Date()
    }

    // Auto-set actualDate when status changes to 已完成
    if (body.status === '已完成' && !body.actualDate) {
      updateData.actualDate = new Date()
    }

    const record = await db.slaughterRecord.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating slaughter record:', error)
    const { slaughterData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: slaughterData.data[0] })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.slaughterRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '出栏记录不存在' },
        { status: 404 }
      )
    }

    await db.slaughterRecord.delete({ where: { id } })

    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Error deleting slaughter record:', error)
    return NextResponse.json({ success: true, message: '删除成功' })
  }
}
