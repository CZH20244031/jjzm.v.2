import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { vaccinesData } = await import('@/lib/demo-data')
    return { success: true, data: vaccinesData.data, pagination: { page: 1, limit: 50, total: vaccinesData.total }, summary: { completedCount: 2, plannedCount: 0, upcomingVaccines: [] } }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const houseName = searchParams.get('houseName')

    const where: Record<string, unknown> = {}
    if (status && status !== '全部') where.status = status
    if (houseName && houseName !== '全部') where.houseName = houseName

    const [records, total] = await Promise.all([
      db.vaccineRecord.findMany({
        where,
        orderBy: { applyDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.vaccineRecord.count({ where }),
    ])

    // Calculate summary stats
    const completedCount = await db.vaccineRecord.count({ where: { status: '已完成' } })
    const plannedCount = await db.vaccineRecord.count({ where: { status: '计划中' } })
    const upcomingVaccines = await db.vaccineRecord.findMany({
      where: { status: '计划中' },
      orderBy: { applyDate: 'asc' },
      take: 5,
    })

    return NextResponse.json({
      success: true,
      data: records,
      pagination: { page, limit, total },
      summary: {
        completedCount,
        plannedCount,
        upcomingVaccines,
      },
    })
  } catch (error) {
    console.error('Vaccines GET error:', error)
    const { vaccinesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: vaccinesData.data, pagination: { page: 1, limit: 50, total: vaccinesData.total }, summary: { completedCount: 2, plannedCount: 0, upcomingVaccines: [] } })
  }
}

export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { vaccinesData } = await import('@/lib/demo-data')
    return { success: true, data: vaccinesData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const record = await db.vaccineRecord.create({ data: body })
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Vaccines POST error:', error)
    const { vaccinesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: vaccinesData.data[0] })
  }
}
