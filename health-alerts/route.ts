import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { healthAlertsData } = await import('@/lib/demo-data')
    return { alerts: healthAlertsData.data, total: healthAlertsData.total }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')

    const whereClause: Record<string, unknown> = {}
    if (batchId) whereClause.batchId = batchId
    if (severity) whereClause.severity = severity
    if (status) whereClause.status = status

    const alerts = await db.healthAlert.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { house: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        description: a.description,
        aiConfidence: a.aiConfidence,
        status: a.status,
        resolvedAt: a.resolvedAt,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        batch: {
          id: a.batch.id,
          batchNo: a.batch.batchNo,
          breed: a.batch.breed,
          houseName: a.batch.house.name,
        },
      })),
      total: alerts.length,
    })
  } catch (error) {
    console.error('Health alerts error:', error)
    const { healthAlertsData } = await import('@/lib/demo-data')
    return NextResponse.json({ alerts: healthAlertsData.data, total: healthAlertsData.total })
  }
}
