import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/traceability - Get batch lifecycle data for traceability
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { traceabilityData } = await import('@/lib/demo-data')
    const t = traceabilityData.data[0]
    return {
      batch: { id: t.id, batchNo: t.batchNo, breed: t.breed, quantity: 14500, currentQuantity: 14094, status: '已出栏', startDate: t.intakeDate, expectedEndDate: t.slaughterDate, actualEndDate: t.slaughterDate, mortalityRate: 2.8 },
      farm: { id: 'f1', name: '极境智牧养殖基地', address: '黑龙江省哈尔滨市宾县', owner: '王建国' },
      house: { id: 'h3', name: '3号棚', capacity: 20000 },
      timeline: [],
      summary: { totalDays: 42, totalCost: 0, costPerBird: 0, costByCategory: {}, medicationCount: t.medicationRecords, medicationTypes: ['抗生素'], healthAlertCount: 0, unresolvedAlerts: 0 },
      compliance: { canSell: true, activeWithdrawals: [] },
    }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

    if (!batchId) {
      return NextResponse.json(
        { error: '请提供 batchId 参数' },
        { status: 400 }
      )
    }

    const batch = await db.chickenBatch.findUnique({
      where: { id: batchId },
      include: {
        house: true,
        farm: true,
        medications: { orderBy: { applyDate: 'asc' } },
        healthAlerts: { orderBy: { createdAt: 'asc' } },
        costs: { orderBy: { date: 'asc' } },
      },
    })

    if (!batch) {
      return NextResponse.json(
        { error: '批次不存在' },
        { status: 404 }
      )
    }

    // Build timeline events from all related records
    type TimelineEvent = {
      date: Date
      type: string
      title: string
      description: string
      severity?: string
      status?: string
    }

    const timeline: TimelineEvent[] = []

    // Batch lifecycle events
    timeline.push({
      date: batch.startDate,
      type: 'lifecycle',
      title: '入栏',
      description: `${batch.breed}，数量 ${batch.quantity} 只，入栏${batch.house.name}`,
    })

    if (batch.actualEndDate) {
      timeline.push({
        date: batch.actualEndDate,
        type: 'lifecycle',
        title: '出栏',
        description: `出栏 ${batch.house.name}，死亡率 ${batch.mortalityRate}%，${batch.notes || ''}`,
      })
    } else if (batch.expectedEndDate) {
      timeline.push({
        date: batch.expectedEndDate,
        type: 'lifecycle',
        title: '预计出栏',
        description: `预计出栏${batch.house.name}`,
      })
    }

    // Medication events
    batch.medications.forEach((m) => {
      timeline.push({
        date: m.applyDate,
        type: 'medication',
        title: `用药：${m.drugName}`,
        description: `${m.drugType}，${m.dosage}，${m.administrationMethod}给药，操作人：${m.operator}，休药期${m.withdrawalDays}天，${m.notes || ''}`,
        status: m.status,
      })

      if (m.withdrawalDays > 0) {
        timeline.push({
          date: m.withdrawalEnd,
          type: 'withdrawal',
          title: `休药期结束：${m.drugName}`,
          description: `${m.drugName} 休药期结束，可安全出栏`,
          status: '已过休药期',
        })
      }
    })

    // Health alert events
    batch.healthAlerts.forEach((a) => {
      timeline.push({
        date: a.createdAt,
        type: 'health_alert',
        title: `健康预警：${a.type}`,
        description: a.description,
        severity: a.severity,
        status: a.status,
      })

      if (a.resolvedAt) {
        timeline.push({
          date: a.resolvedAt,
          type: 'health_alert_resolved',
          title: `预警解决：${a.type}`,
          description: `${a.type} 预警已解决`,
          status: '已解决',
        })
      }
    })

    // Cost events (group significant ones)
    batch.costs.forEach((c) => {
      timeline.push({
        date: c.date,
        type: 'cost',
        title: `成本：${c.item}`,
        description: `类别：${c.category}，金额：¥${c.amount.toLocaleString()}，数量：${c.quantity}${c.unit || ''}${c.operator ? `，操作人：${c.operator}` : ''}`,
      })
    })

    // Sort timeline by date
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate summary statistics
    const totalCost = batch.costs.reduce((sum, c) => sum + c.amount, 0)
    const costByCategory = batch.costs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.amount
      return acc
    }, {} as Record<string, number>)

    const medicationTypes = new Set(batch.medications.map((m) => m.drugType))

    // Check if there are any active withdrawals blocking sale
    const now = new Date()
    const activeWithdrawals = batch.medications.filter(
      (m) => m.withdrawalDays > 0 && m.withdrawalEnd > now && batch.status === '养殖中'
    )

    return NextResponse.json({
      batch: {
        id: batch.id,
        batchNo: batch.batchNo,
        breed: batch.breed,
        quantity: batch.quantity,
        currentQuantity: Math.round(batch.quantity * (1 - batch.mortalityRate / 100)),
        status: batch.status,
        startDate: batch.startDate,
        expectedEndDate: batch.expectedEndDate,
        actualEndDate: batch.actualEndDate,
        mortalityRate: batch.mortalityRate,
      },
      farm: {
        id: batch.farm.id,
        name: batch.farm.name,
        address: batch.farm.address,
        owner: batch.farm.owner,
      },
      house: {
        id: batch.house.id,
        name: batch.house.name,
        capacity: batch.house.capacity,
      },
      timeline,
      summary: {
        totalDays: batch.actualEndDate
          ? Math.ceil((batch.actualEndDate.getTime() - batch.startDate.getTime()) / (24 * 60 * 60 * 1000))
          : Math.ceil((now.getTime() - batch.startDate.getTime()) / (24 * 60 * 60 * 1000)),
        totalCost,
        costPerBird: batch.quantity > 0 ? Math.round((totalCost / batch.quantity) * 100) / 100 : 0,
        costByCategory,
        medicationCount: batch.medications.length,
        medicationTypes: Array.from(medicationTypes),
        healthAlertCount: batch.healthAlerts.length,
        unresolvedAlerts: batch.healthAlerts.filter((a) => a.status !== '已解决' && a.status !== '已忽略').length,
      },
      compliance: {
        canSell: activeWithdrawals.length === 0 || batch.status !== '养殖中',
        activeWithdrawals: activeWithdrawals.map((m) => ({
          drugName: m.drugName,
          withdrawalEnd: m.withdrawalEnd,
          daysRemaining: Math.ceil((m.withdrawalEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        })),
      },
    })
  } catch (error) {
    console.error('Traceability error:', error)
    const { traceabilityData } = await import('@/lib/demo-data')
    const t = traceabilityData.data[0]
    return NextResponse.json({
      batch: { id: t.id, batchNo: t.batchNo, breed: t.breed, quantity: 14500, currentQuantity: 14094, status: '已出栏', startDate: t.intakeDate, expectedEndDate: t.slaughterDate, actualEndDate: t.slaughterDate, mortalityRate: 2.8 },
      farm: { id: 'f1', name: '极境智牧养殖基地', address: '黑龙江省哈尔滨市宾县', owner: '王建国' },
      house: { id: 'h3', name: '3号棚', capacity: 20000 },
      timeline: [],
      summary: { totalDays: 42, totalCost: 0, costPerBird: 0, costByCategory: {}, medicationCount: t.medicationRecords, medicationTypes: ['抗生素'], healthAlertCount: 0, unresolvedAlerts: 0 },
      compliance: { canSell: true, activeWithdrawals: [] },
    })
  }
}
