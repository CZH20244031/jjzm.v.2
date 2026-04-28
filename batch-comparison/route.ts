import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/batch-comparison - Aggregated batch comparison data
export async function GET() {
  const demo = await withDemoFallback(async () => {
    const { batchComparisonData } = await import('@/lib/demo-data')
    return batchComparisonData
  })
  if (demo) return demo

  try {
    const now = new Date()

    const batches = await db.chickenBatch.findMany({
      include: {
        house: true,
        costs: true,
        feeds: true,
        medications: true,
        _count: {
          select: {
            healthAlerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const comparisonData = batches.map((b) => {
      // Calculate days since start
      const daysSinceStart = Math.max(
        0,
        Math.floor((now.getTime() - b.startDate.getTime()) / (24 * 60 * 60 * 1000))
      )
      const totalDays = b.expectedEndDate
        ? Math.max(
            0,
            Math.floor(
              (b.expectedEndDate.getTime() - b.startDate.getTime()) / (24 * 60 * 60 * 1000)
            )
          )
        : 0

      // Current quantity based on mortality
      const currentQuantity = Math.round(b.quantity * (1 - b.mortalityRate / 100))

      // Cost aggregation
      const feedCost = b.costs
        .filter((c) => c.category === '饲料')
        .reduce((sum, c) => sum + c.amount, 0)
      const medicineCost = b.costs
        .filter((c) => c.category === '药品')
        .reduce((sum, c) => sum + c.amount, 0)
      const laborCost = b.costs
        .filter((c) => c.category === '人工')
        .reduce((sum, c) => sum + c.amount, 0)
      const energyCost = b.costs
        .filter((c) => c.category === '能耗')
        .reduce((sum, c) => sum + c.amount, 0)
      const otherCost = b.costs
        .filter((c) => !['饲料', '药品', '人工', '能耗'].includes(c.category))
        .reduce((sum, c) => sum + c.amount, 0)
      const totalCost = feedCost + medicineCost + laborCost + energyCost + otherCost

      // Feed consumption (kg)
      const feedConsumption = b.feeds.reduce(
        (sum, f) => sum + (f.unit === '吨' ? f.quantity * 1000 : f.quantity),
        0
      )

      // FCR (feed conversion ratio): feed (kg) / expected output weight (kg)
      // Estimate: avg weight ~2.5kg at 42 days, scale by day age ratio
      const estimatedWeightPerBird = b.status === '已出栏'
        ? 2.5
        : Math.min(2.8, (daysSinceStart / 42) * 2.8)
      const totalOutputWeight = currentQuantity * estimatedWeightPerBird
      const fcr = totalOutputWeight > 0 ? Math.round((feedConsumption / totalOutputWeight) * 100) / 100 : 0

      // Daily gain (g/bird)
      const dailyGain =
        daysSinceStart > 0
          ? Math.round((estimatedWeightPerBird * 1000) / daysSinceStart * 10) / 10
          : 0

      // Cost per bird
      const costPerBird =
        currentQuantity > 0 ? Math.round((totalCost / currentQuantity) * 100) / 100 : 0

      // Environment compliance score (mock based on health alerts)
      const alertCount = b._count.healthAlerts
      const envScore = Math.max(0, Math.min(100, 100 - alertCount * 5))

      return {
        id: b.id,
        batchNo: b.batchNo,
        breed: b.breed,
        quantity: b.quantity,
        currentQuantity,
        daysSinceStart,
        totalDays,
        status: b.status,
        mortalityRate: b.mortalityRate,
        houseName: b.house.name,
        startDate: b.startDate,
        expectedEndDate: b.expectedEndDate,
        totalCost: Math.round(totalCost),
        feedCost: Math.round(feedCost),
        medicineCost: Math.round(medicineCost),
        laborCost: Math.round(laborCost),
        energyCost: Math.round(energyCost),
        otherCost: Math.round(otherCost),
        costPerBird,
        fcr,
        dailyGain,
        feedConsumption: Math.round(feedConsumption),
        envScore,
      }
    })

    return NextResponse.json({
      batches: comparisonData,
    })
  } catch (error) {
    console.error('Batch comparison GET error:', error)
    const { batchComparisonData } = await import('@/lib/demo-data')
    return NextResponse.json(batchComparisonData)
  }
}
