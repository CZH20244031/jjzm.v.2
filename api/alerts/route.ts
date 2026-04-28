import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/alerts - List system alerts
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { alertsData } = await import('@/lib/demo-data')
    return alertsData
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const level = searchParams.get('level')
    const status = searchParams.get('status')

    const whereClause: Record<string, unknown> = {}
    if (type) whereClause.type = type
    if (level) whereClause.level = level
    if (status) whereClause.status = status

    const [alerts, total, unreadCount] = await Promise.all([
      db.alert.findMany({
        where: whereClause,
        include: { farm: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.alert.count({ where: whereClause }),
      db.alert.count({ where: { status: '未读' } }),
    ])

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        level: a.level,
        title: a.title,
        message: a.message,
        source: a.source,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        farm: {
          id: a.farm.id,
          name: a.farm.name,
        },
      })),
      total,
      unreadCount,
    })
  } catch (error) {
    console.error('Alerts GET error:', error)
    const { alertsData } = await import('@/lib/demo-data')
    return NextResponse.json(alertsData)
  }
}
