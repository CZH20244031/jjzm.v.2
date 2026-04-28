import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(req: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { staffData } = await import('@/lib/demo-data')
    return { staff: staffData.data }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const houseName = searchParams.get('houseName')

    const where: Record<string, string> = {}
    if (role && role !== 'all') where.role = role
    if (status && status !== 'all') where.status = status
    if (department && department !== 'all') where.department = department
    if (houseName && houseName !== 'all') where.houseName = houseName

    const staff = await db.staff.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Staff GET error:', error)
    const { staffData } = await import('@/lib/demo-data')
    return NextResponse.json({ staff: staffData.data })
  }
}

export async function POST(req: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { staffData } = await import('@/lib/demo-data')
    return { success: true, staff: staffData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await req.json()
    const { name, role, phone, department, houseName, status, joinDate, skills } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: '姓名不能为空' }, { status: 400 })
    }
    if (!role || !role.trim()) {
      return NextResponse.json({ success: false, message: '岗位不能为空' }, { status: 400 })
    }

    const avatar = name.trim().charAt(0)

    const staff = await db.staff.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        houseName: houseName?.trim() || null,
        status: status?.trim() || '在岗',
        joinDate: joinDate ? new Date(joinDate) : null,
        avatar,
        skills: skills?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Staff POST error:', error)
    const { staffData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, staff: staffData.data[0] })
  }
}
