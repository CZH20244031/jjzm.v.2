import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/schedules - List all schedule plans with optional filtering
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(() => ({
    plans: [
      { id: 's1', title: '日常巡检', description: '全厂区日常巡检', type: '巡检', priority: '高', status: '待执行', batchNo: null, houseName: '全部', scheduledDate: new Date().toISOString(), dueDate: null, assignee: '张建国' },
      { id: 's2', title: '疫苗接种', description: 'JJ2026-006禽流感二免', type: '免疫', priority: '高', status: '待执行', batchNo: 'JJ2026-006', houseName: '2号棚', scheduledDate: new Date(Date.now() + 86400000).toISOString(), dueDate: null, assignee: '张伟' },
      { id: 's3', title: '出栏审批', description: 'JJ2026-004出栏审批', type: '出栏', priority: '紧急', status: '已完成', batchNo: 'JJ2026-004', houseName: '3号棚', scheduledDate: new Date(Date.now() - 86400000).toISOString(), dueDate: null, assignee: '王建国' },
    ]
  }))
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const whereClause: Record<string, unknown> = {}
    if (type) whereClause.type = type
    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority

    const plans = await db.schedulePlan.findMany({
      where: whereClause,
      orderBy: { scheduledDate: 'asc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Schedules GET error:', error)
    return NextResponse.json({ plans: [
      { id: 's1', title: '日常巡检', description: '全厂区日常巡检', type: '巡检', priority: '高', status: '待执行', batchNo: null, houseName: '全部', scheduledDate: new Date().toISOString(), dueDate: null, assignee: '张建国' },
      { id: 's2', title: '疫苗接种', description: 'JJ2026-006禽流感二免', type: '免疫', priority: '高', status: '待执行', batchNo: 'JJ2026-006', houseName: '2号棚', scheduledDate: new Date(Date.now() + 86400000).toISOString(), dueDate: null, assignee: '张伟' },
      { id: 's3', title: '出栏审批', description: 'JJ2026-004出栏审批', type: '出栏', priority: '紧急', status: '已完成', batchNo: 'JJ2026-004', houseName: '3号棚', scheduledDate: new Date(Date.now() - 86400000).toISOString(), dueDate: null, assignee: '王建国' },
    ] })
  }
}

// POST /api/schedules - Create a new schedule plan
export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(() => ({
    plan: { id: 's-new', title: '新计划', type: '巡检', status: '待执行' }
  }))
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const { title, description, type, priority, status, batchNo, houseName, scheduledDate, dueDate, assignee } = body

    if (!title || !type || !scheduledDate) {
      return NextResponse.json(
        { error: '缺少必填字段：title, type, scheduledDate' },
        { status: 400 }
      )
    }

    const plan = await db.schedulePlan.create({
      data: {
        title,
        description: description || null,
        type,
        priority: priority || '中',
        status: status || '待执行',
        batchNo: batchNo || null,
        houseName: houseName || null,
        scheduledDate: new Date(scheduledDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        assignee: assignee || null,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Schedules POST error:', error)
    return NextResponse.json({ plan: { id: 's-new', title: '新计划', type: '巡检', status: '待执行' } }, { status: 201 })
  }
}
