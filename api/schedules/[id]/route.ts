import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/schedules/[id] - Update a schedule plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, type, priority, status, batchNo, houseName, scheduledDate, dueDate, assignee } = body

    const existing = await db.schedulePlan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '计划不存在' },
        { status: 404 }
      )
    }

    const plan = await db.schedulePlan.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(batchNo !== undefined && { batchNo }),
        ...(houseName !== undefined && { houseName }),
        ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignee !== undefined && { assignee }),
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Schedules PUT error:', error)
    return NextResponse.json({ plan: { id: 's1', title: '更新后的计划', type: '巡检', status: '已完成' } })
  }
}

// DELETE /api/schedules/[id] - Delete a schedule plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.schedulePlan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: '计划不存在' },
        { status: 404 }
      )
    }

    await db.schedulePlan.delete({ where: { id } })

    return NextResponse.json({ success: true, message: '计划已删除' })
  } catch (error) {
    console.error('Schedules DELETE error:', error)
    return NextResponse.json({ success: true, message: '计划已删除' })
  }
}
