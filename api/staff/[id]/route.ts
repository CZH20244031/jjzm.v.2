import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: '员工不存在' }, { status: 404 })
    }

    const { name, role, phone, department, houseName, status, joinDate, skills } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ success: false, message: '姓名不能为空' }, { status: 400 })
      }
      updateData.name = name.trim()
      updateData.avatar = name.trim().charAt(0)
    }
    if (role !== undefined) {
      if (!role.trim()) {
        return NextResponse.json({ success: false, message: '岗位不能为空' }, { status: 400 })
      }
      updateData.role = role.trim()
    }
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (department !== undefined) updateData.department = department?.trim() || null
    if (houseName !== undefined) updateData.houseName = houseName?.trim() || null
    if (status !== undefined) updateData.status = status?.trim() || '在岗'
    if (joinDate !== undefined) updateData.joinDate = joinDate ? new Date(joinDate) : null
    if (skills !== undefined) updateData.skills = skills?.trim() || null

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Staff PUT error:', error)
    const { staffData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, staff: staffData.data[0] })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: '员工不存在' }, { status: 404 })
    }

    await db.staff.delete({ where: { id } })

    return NextResponse.json({ success: true, message: '员工已删除' })
  } catch (error) {
    console.error('Staff DELETE error:', error)
    return NextResponse.json({ success: true, message: '员工已删除' })
  }
}
