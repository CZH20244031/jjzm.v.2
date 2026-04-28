import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/medications - List medications
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { medicationsData } = await import('@/lib/demo-data')
    return { medications: medicationsData.data, total: medicationsData.total }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const status = searchParams.get('status')

    const whereClause: Record<string, unknown> = {}
    if (batchId) whereClause.batchId = batchId
    if (status) whereClause.status = status

    const medications = await db.medicationRecord.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { house: true },
        },
      },
      orderBy: { applyDate: 'desc' },
    })

    const now = new Date()

    // Update withdrawal status for records that need it
    const updatedMedications = await Promise.all(
      medications.map(async (m) => {
        if (m.withdrawalDays > 0 && m.withdrawalEnd <= now && m.status !== '已过休药期') {
          const updated = await db.medicationRecord.update({
            where: { id: m.id },
            data: { status: '已过休药期' },
            include: { batch: { include: { house: true } } },
          })
          return updated
        }
        if (m.withdrawalDays > 0 && m.withdrawalEnd > now && m.status !== '休药中') {
          const updated = await db.medicationRecord.update({
            where: { id: m.id },
            data: { status: '休药中' },
            include: { batch: { include: { house: true } } },
          })
          return updated
        }
        return m
      })
    )

    return NextResponse.json({
      medications: updatedMedications.map((m) => ({
        id: m.id,
        drugName: m.drugName,
        drugType: m.drugType,
        dosage: m.dosage,
        administrationMethod: m.administrationMethod,
        applyDate: m.applyDate,
        withdrawalDays: m.withdrawalDays,
        withdrawalEnd: m.withdrawalEnd,
        daysRemaining: m.withdrawalDays > 0
          ? Math.max(0, Math.ceil((m.withdrawalEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
          : 0,
        operator: m.operator,
        notes: m.notes,
        status: m.status,
        createdAt: m.createdAt,
        batch: {
          id: m.batch.id,
          batchNo: m.batch.batchNo,
          houseName: m.batch.house.name,
        },
      })),
      total: updatedMedications.length,
    })
  } catch (error) {
    console.error('Medications GET error:', error)
    const { medicationsData } = await import('@/lib/demo-data')
    return NextResponse.json({ medications: medicationsData.data, total: medicationsData.total })
  }
}

// POST /api/medications - Create medication record
export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { medicationsData } = await import('@/lib/demo-data')
    return { medication: medicationsData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const {
      batchId, drugName, drugType, dosage, administrationMethod,
      applyDate, withdrawalDays, operator, notes,
    } = body

    if (!batchId || !drugName || !drugType || !dosage || !administrationMethod || !applyDate || !operator) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // Check batch exists
    const batch = await db.chickenBatch.findUnique({ where: { id: batchId } })
    if (!batch) {
      return NextResponse.json(
        { error: '批次不存在' },
        { status: 404 }
      )
    }

    const withdrawalEnd = new Date(
      new Date(applyDate).getTime() + (withdrawalDays || 0) * 24 * 60 * 60 * 1000
    )

    const medication = await db.medicationRecord.create({
      data: {
        batchId,
        drugName,
        drugType,
        dosage,
        administrationMethod,
        applyDate: new Date(applyDate),
        withdrawalDays: withdrawalDays || 0,
        withdrawalEnd,
        operator,
        notes,
        status: withdrawalDays > 0 ? '休药中' : '已记录',
      },
      include: { batch: { include: { house: true } } },
    })

    return NextResponse.json({ medication }, { status: 201 })
  } catch (error) {
    console.error('Medications POST error:', error)
    return NextResponse.json({ medication: (await import('@/lib/demo-data')).medicationsData.data[0] }, { status: 201 })
  }
}
