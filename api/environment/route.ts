import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { environmentData } = await import('@/lib/demo-data')
    return environmentData
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const houseId = searchParams.get('houseId')
    const range = searchParams.get('range') || '24h'

    // Determine time range
    const now = new Date()
    let startTime: Date
    switch (range) {
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default: // 24h
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    // Get records
    const whereClause: Record<string, unknown> = {
      createdAt: { gte: startTime },
    }
    if (houseId) {
      whereClause.houseId = houseId
    }

    let records = await db.environmentRecord.findMany({
      where: whereClause,
      include: { house: true },
      orderBy: { createdAt: 'asc' },
    })

    // Fallback: if no records in the requested range, get the most recent records
    if (records.length === 0) {
      const fallbackWhere: Record<string, unknown> = {}
      if (houseId) {
        fallbackWhere.houseId = houseId
      }
      records = await db.environmentRecord.findMany({
        where: fallbackWhere,
        include: { house: true },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
      // Reverse to get chronological order
      records = records.reverse()
    }

    // Get latest record per house for current values
    const houses = houseId
      ? await db.chickenHouse.findMany({ where: { id: houseId } })
      : await db.chickenHouse.findMany()

    const currentValues = await Promise.all(
      houses.map(async (house) => {
        const latest = await db.environmentRecord.findFirst({
          where: { houseId: house.id },
          orderBy: { createdAt: 'desc' },
        })
        return {
          houseId: house.id,
          houseName: house.name,
          temperature: latest?.temperature ?? null,
          humidity: latest?.humidity ?? null,
          ammonia: latest?.ammonia ?? null,
          co2: latest?.co2 ?? null,
          windSpeed: latest?.windSpeed ?? null,
          updatedAt: latest?.createdAt ?? null,
        }
      })
    )

    // Aggregate stats
    const avgTemperature = records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.temperature, 0) / records.length * 10) / 10
      : null
    const avgHumidity = records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.humidity, 0) / records.length * 10) / 10
      : null
    const maxAmmonia = records.length > 0
      ? Math.max(...records.map((r) => r.ammonia))
      : null
    const maxCO2 = records.length > 0
      ? Math.max(...records.map((r) => r.co2))
      : null

    // Format records for charting
    const chartData = records.map((r) => ({
      id: r.id,
      houseId: r.houseId,
      houseName: r.house.name,
      temperature: r.temperature,
      humidity: r.humidity,
      ammonia: r.ammonia,
      co2: r.co2,
      windSpeed: r.windSpeed,
      timestamp: r.createdAt,
    }))

    return NextResponse.json({
      range,
      startTime,
      endTime: now,
      currentValues,
      stats: {
        avgTemperature,
        avgHumidity,
        maxAmmonia,
        maxCO2,
        recordCount: records.length,
      },
      records: chartData,
    })
  } catch (error) {
    console.error('Environment API error:', error)
    const { environmentData } = await import('@/lib/demo-data')
    return NextResponse.json(environmentData)
  }
}
