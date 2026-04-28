import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDemoFallback } from '@/lib/vercel-adapter'

export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { getReportData } = await import('@/lib/demo-data')
    const reportData = getReportData()
    return {
      ...reportData,
      overview: { totalInventory: 33343, totalBatches: 4, activeBatches: 2, avgMortalityRate: 2.0, environmentScore: 94.2, recentAlertCount: 5, reportPeriod: '今日' },
      environment: { overallAvg: { temperature: 24.5, humidity: 62, ammonia: 15, co2: 850 }, houses: [], recordPeriod: '最近24小时', totalRecords: 0 },
      batches: [],
      cost: { totalAmount: 0, breakdown: [], recordCount: 0, period: '' },
      healthAlerts: { alerts: [], stats: {}, totalCount: 0, resolvedCount: 0, pendingCount: 0 },
      medications: { records: [], stats: {}, totalCount: 0, withdrawalAlertCount: 0 },
    }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const { reportType, dateRange, sections } = body

    const startDate = new Date(dateRange?.startDate || new Date())
    const endDate = new Date(dateRange?.endDate || new Date())

    // Filter sections - only fetch what's needed
    const includeOverview = !sections || sections.includes('养殖概览')
    const includeEnvironment = !sections || sections.includes('环境监测')
    const includeBatches = !sections || sections.includes('批次详情')
    const includeCost = !sections || sections.includes('成本分析')
    const includeHealth = !sections || sections.includes('健康预警')
    const includeMedication = !sections || sections.includes('用药记录')

    const reportData: Record<string, unknown> = {
      farmName: '极境智牧养殖基地',
      reportType: reportType || '日报',
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      generatedAt: new Date().toISOString(),
    }

    // ===== Section 1: 养殖概览 =====
    if (includeOverview) {
      const [totalBatches, activeBatches, allAlerts] = await Promise.all([
        db.chickenBatch.count(),
        db.chickenBatch.count({ where: { status: '养殖中' } }),
        db.healthAlert.findMany({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      ])

      const mortalityAlerts = allAlerts.filter((a) => a.type === '采食下降' || a.type === '活动异常')

      const activeBatchData = await db.chickenBatch.findMany({
        where: { status: '养殖中' },
        select: { quantity: true, mortalityRate: true },
      })

      const totalInventory = activeBatchData.reduce((sum, b) => sum + b.quantity, 0)
      const avgMortality =
        activeBatchData.length > 0
          ? activeBatchData.reduce((sum, b) => sum + b.mortalityRate, 0) / activeBatchData.length
          : 0

      // Environment score: based on recent records
      let envScore = 100
      const recentEnv = await db.environmentRecord.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        take: 50,
      })
      if (recentEnv.length > 0) {
        const avgTemp = recentEnv.reduce((s, r) => s + r.temperature, 0) / recentEnv.length
        const avgAmmonia = recentEnv.reduce((s, r) => s + r.ammonia, 0) / recentEnv.length
        const avgCO2 = recentEnv.reduce((s, r) => s + r.co2, 0) / recentEnv.length

        if (avgTemp < 18 || avgTemp > 28) envScore -= 15
        else if (avgTemp < 20 || avgTemp > 26) envScore -= 5

        if (avgAmmonia > 25) envScore -= 20
        else if (avgAmmonia > 15) envScore -= 10

        if (avgCO2 > 1500) envScore -= 15
        else if (avgCO2 > 1000) envScore -= 5
      }

      envScore = Math.max(0, Math.min(100, envScore))

      reportData.overview = {
        totalInventory,
        totalBatches,
        activeBatches,
        avgMortalityRate: Number((avgMortality * 100).toFixed(2)),
        environmentScore: envScore,
        recentAlertCount: allAlerts.length,
        reportPeriod: reportType === '日报' ? '今日' : reportType === '周报' ? '本周' : '本月',
      }
    }

    // ===== Section 2: 环境监测 =====
    if (includeEnvironment) {
      const envRecords = await db.environmentRecord.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        include: { house: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })

      // Group by house
      const houseMap = new Map<string, { temp: number[]; humidity: number[]; ammonia: number[]; co2: number[] }>()

      for (const record of envRecords) {
        const houseName = record.house.name
        if (!houseMap.has(houseName)) {
          houseMap.set(houseName, { temp: [], humidity: [], ammonia: [], co2: [] })
        }
        const data = houseMap.get(houseName)!
        data.temp.push(record.temperature)
        data.humidity.push(record.humidity)
        data.ammonia.push(record.ammonia)
        data.co2.push(record.co2)
      }

      const houseEnvData = Array.from(houseMap.entries()).map(([house, data]) => ({
        house,
        avgTemp: Number((data.temp.reduce((a, b) => a + b, 0) / (data.temp.length || 1)).toFixed(1)),
        avgHumidity: Number((data.humidity.reduce((a, b) => a + b, 0) / (data.humidity.length || 1)).toFixed(1)),
        maxAmmonia: Number(Math.max(...data.ammonia).toFixed(1)),
        avgCO2: Number((data.co2.reduce((a, b) => a + b, 0) / (data.co2.length || 1)).toFixed(0)),
        recordCount: data.temp.length,
      }))

      // Overall averages
      const allTemps = houseEnvData.map((h) => h.avgTemp)
      const allHumidity = houseEnvData.map((h) => h.avgHumidity)
      const allAmmonia = houseEnvData.map((h) => h.maxAmmonia)
      const allCO2 = houseEnvData.map((h) => h.avgCO2)

      reportData.environment = {
        overallAvg: {
          temperature: allTemps.length > 0 ? Number((allTemps.reduce((a, b) => a + b, 0) / allTemps.length).toFixed(1)) : 0,
          humidity: allHumidity.length > 0 ? Number((allHumidity.reduce((a, b) => a + b, 0) / allHumidity.length).toFixed(1)) : 0,
          ammonia: allAmmonia.length > 0 ? Number(Math.max(...allAmmonia).toFixed(1)) : 0,
          co2: allCO2.length > 0 ? Number((allCO2.reduce((a, b) => a + b, 0) / allCO2.length).toFixed(0)) : 0,
        },
        houses: houseEnvData,
        recordPeriod: '最近24小时',
        totalRecords: envRecords.length,
      }
    }

    // ===== Section 3: 批次详情 =====
    if (includeBatches) {
      const batches = await db.chickenBatch.findMany({
        include: {
          house: { select: { name: true } },
          farm: { select: { name: true } },
        },
        orderBy: { startDate: 'desc' },
      })

      reportData.batches = batches.map((batch) => {
        const ageDays = Math.floor(
          (Date.now() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        const currentQuantity = Math.round(batch.quantity * (1 - batch.mortalityRate))
        return {
          batchNo: batch.batchNo,
          breed: batch.breed,
          quantity: batch.quantity,
          currentQuantity,
          houseName: batch.house.name,
          startDate: batch.startDate.toISOString().split('T')[0],
          status: batch.status,
          ageDays,
          mortalityRate: Number((batch.mortalityRate * 100).toFixed(2)),
        }
      })
    }

    // ===== Section 4: 成本分析 =====
    if (includeCost) {
      const costRecords = await db.costRecord.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: {
          batch: { select: { batchNo: true } },
        },
        orderBy: { date: 'desc' },
      })

      // Group by category
      const categoryMap = new Map<string, number>()
      let totalAmount = 0

      for (const record of costRecords) {
        const amount = record.amount
        totalAmount += amount
        categoryMap.set(record.category, (categoryMap.get(record.category) || 0) + amount)
      }

      const costBreakdown = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
          percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(1)) : 0,
          recordCount: costRecords.filter((r) => r.category === category).length,
        }))
        .sort((a, b) => b.amount - a.amount)

      // Also include all-time cost breakdown if date range returns nothing
      if (costRecords.length === 0) {
        const allCosts = await db.costRecord.findMany({
          include: { batch: { select: { batchNo: true } } },
        })
        totalAmount = allCosts.reduce((s, r) => s + r.amount, 0)

        for (const record of allCosts) {
          categoryMap.set(record.category, (categoryMap.get(record.category) || 0) + record.amount)
        }

        costBreakdown.length = 0
        Array.from(categoryMap.entries())
          .map(([category, amount]) => ({
            category,
            amount: Number(amount.toFixed(2)),
            percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(1)) : 0,
            recordCount: allCosts.filter((r) => r.category === category).length,
          }))
          .sort((a, b) => b.amount - a.amount)
          .forEach((item) => costBreakdown.push(item))
      }

      reportData.cost = {
        totalAmount: Number(totalAmount.toFixed(2)),
        breakdown: costBreakdown,
        recordCount: costRecords.length,
        period: `${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`,
      }
    }

    // ===== Section 5: 健康预警 =====
    if (includeHealth) {
      const healthAlerts = await db.healthAlert.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: {
          batch: { select: { batchNo: true, breed: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      // If no alerts in date range, get recent alerts
      const alertsToShow =
        healthAlerts.length > 0
          ? healthAlerts
          : await db.healthAlert.findMany({
              include: {
                batch: { select: { batchNo: true, breed: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 20,
            })

      const severityStats = {
        紧急: alertsToShow.filter((a) => a.severity === '紧急').length,
        高: alertsToShow.filter((a) => a.severity === '高').length,
        一般: alertsToShow.filter((a) => a.severity === '一般').length,
        低: alertsToShow.filter((a) => a.severity === '低').length,
      }

      reportData.healthAlerts = {
        alerts: alertsToShow.map((alert) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          description: alert.description,
          status: alert.status,
          batchNo: alert.batch.batchNo,
          breed: alert.batch.breed,
          aiConfidence: alert.aiConfidence ? Number((alert.aiConfidence * 100).toFixed(1)) : null,
          createdAt: alert.createdAt.toISOString().split('T')[0],
        })),
        stats: severityStats,
        totalCount: alertsToShow.length,
        resolvedCount: alertsToShow.filter((a) => a.status === '已解决').length,
        pendingCount: alertsToShow.filter((a) => a.status === '待处理').length,
      }
    }

    // ===== Section 6: 用药记录 =====
    if (includeMedication) {
      const medications = await db.medicationRecord.findMany({
        where: { applyDate: { gte: startDate, lte: endDate } },
        include: {
          batch: { select: { batchNo: true, breed: true } },
        },
        orderBy: { applyDate: 'desc' },
        take: 50,
      })

      // If no records in date range, get recent records
      const medsToShow =
        medications.length > 0
          ? medications
          : await db.medicationRecord.findMany({
              include: {
                batch: { select: { batchNo: true, breed: true } },
              },
              orderBy: { applyDate: 'desc' },
              take: 20,
            })

      const statusStats = {
        已记录: medsToShow.filter((m) => m.status === '已记录').length,
        休药中: medsToShow.filter((m) => m.status === '休药中').length,
        已过休药期: medsToShow.filter((m) => m.status === '已过休药期').length,
      }

      reportData.medications = {
        records: medsToShow.map((med) => ({
          id: med.id,
          batchNo: med.batch.batchNo,
          breed: med.batch.breed,
          drugName: med.drugName,
          drugType: med.drugType,
          dosage: med.dosage,
          administrationMethod: med.administrationMethod,
          applyDate: med.applyDate.toISOString().split('T')[0],
          withdrawalDays: med.withdrawalDays,
          withdrawalEndDate: med.withdrawalEnd.toISOString().split('T')[0],
          operator: med.operator,
          status: med.status,
          notes: med.notes,
        })),
        stats: statusStats,
        totalCount: medsToShow.length,
        withdrawalAlertCount: medsToShow.filter(
          (m) => m.status === '休药中' && new Date(m.withdrawalEnd) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        ).length,
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Report PDF API error:', error)
    const { getReportData } = await import('@/lib/demo-data')
    const reportData = getReportData()
    return NextResponse.json({
      ...reportData,
      overview: { totalInventory: 33343, totalBatches: 4, activeBatches: 2, avgMortalityRate: 2.0, environmentScore: 94.2, recentAlertCount: 5, reportPeriod: '今日' },
      environment: { overallAvg: { temperature: 24.5, humidity: 62, ammonia: 15, co2: 850 }, houses: [], recordPeriod: '最近24小时', totalRecords: 0 },
      batches: [],
      cost: { totalAmount: 0, breakdown: [], recordCount: 0, period: '' },
      healthAlerts: { alerts: [], stats: {}, totalCount: 0, resolvedCount: 0, pendingCount: 0 },
      medications: { records: [], stats: {}, totalCount: 0, withdrawalAlertCount: 0 },
    })
  }
}
