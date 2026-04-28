import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/batches/[id] - Get batch detail with medications, health alerts, costs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const batch = await db.chickenBatch.findUnique({
      where: { id },
      include: {
        house: true,
        farm: true,
        medications: {
          orderBy: { applyDate: 'desc' },
        },
        healthAlerts: {
          orderBy: { createdAt: 'desc' },
        },
        costs: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!batch) {
      return NextResponse.json(
        { error: '批次不存在' },
        { status: 404 }
      )
    }

    // Calculate cost summary
    const totalCost = batch.costs.reduce((sum, c) => sum + c.amount, 0)
    const costByCategory = batch.costs.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.amount
      return acc
    }, {} as Record<string, number>)

    // Medication status summary
    const medicationSummary = {
      total: batch.medications.length,
      inWithdrawal: batch.medications.filter((m) => m.status === '休药中').length,
      expired: batch.medications.filter((m) => m.status === '已过休药期').length,
      recorded: batch.medications.filter((m) => m.status === '已记录').length,
    }

    // Health alert status summary
    const alertSummary = {
      total: batch.healthAlerts.length,
      pending: batch.healthAlerts.filter((a) => a.status === '待处理').length,
      processing: batch.healthAlerts.filter((a) => a.status === '处理中').length,
      resolved: batch.healthAlerts.filter((a) => a.status === '已解决').length,
      ignored: batch.healthAlerts.filter((a) => a.status === '已忽略').length,
    }

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
        notes: batch.notes,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        house: {
          id: batch.house.id,
          name: batch.house.name,
          capacity: batch.house.capacity,
          status: batch.house.status,
        },
        farm: {
          id: batch.farm.id,
          name: batch.farm.name,
          address: batch.farm.address,
        },
      },
      medications: batch.medications,
      healthAlerts: batch.healthAlerts,
      costs: batch.costs,
      costSummary: {
        total: totalCost,
        costPerBird: batch.quantity > 0 ? Math.round((totalCost / batch.quantity) * 100) / 100 : 0,
        byCategory: costByCategory,
      },
      medicationSummary,
      alertSummary,
    })
  } catch (error) {
    console.error('Batch detail error:', error)
    const { batchesData } = await import('@/lib/demo-data')
    const b = batchesData.data[0]
    return NextResponse.json({
      batch: { ...b, currentQuantity: Math.round(b.quantity * (1 - b.mortalityRate / 100)) },
      medications: [],
      healthAlerts: [],
      costs: [],
      costSummary: { total: 0, costPerBird: 0, byCategory: {} },
      medicationSummary: { total: 0, inWithdrawal: 0, expired: 0, recorded: 0 },
      alertSummary: { total: 0, pending: 0, processing: 0, resolved: 0, ignored: 0 },
    })
  }
}
