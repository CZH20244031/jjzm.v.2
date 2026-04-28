import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { withDemoFallback } from '@/lib/vercel-adapter'

// GET /api/devices - List all devices with optional filters
export async function GET(request: NextRequest) {
  const demo = await withDemoFallback(async () => {
    const { devicesData } = await import('@/lib/demo-data')
    return { success: true, data: devicesData.data, stats: { total: devicesData.total, online: 4, offline: 0, maintenance: 0, fault: 1 } }
  })
  if (demo) return demo

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const houseId = searchParams.get('houseId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (type && type !== '全部') {
      where.type = type
    }
    if (status && status !== '全部') {
      where.status = status
    }
    if (houseId && houseId !== '全部') {
      where.houseId = houseId
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { model: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const devices = await db.device.findMany({
      where,
      include: {
        house: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const allDevices = await db.device.findMany()
    const stats = {
      total: allDevices.length,
      online: allDevices.filter((d) => d.status === '在线').length,
      offline: allDevices.filter((d) => d.status === '离线').length,
      maintenance: allDevices.filter((d) => d.status === '维护').length,
      fault: allDevices.filter((d) => d.status === '故障').length,
    }

    return NextResponse.json({ success: true, data: devices, stats })
  } catch (error) {
    console.error('Devices GET error:', error)
    const { devicesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: devicesData.data, stats: { total: devicesData.total, online: 4, offline: 0, maintenance: 0, fault: 1 } })
  }
}

// POST /api/devices - Create a new device
export async function POST(request: NextRequest) {
  const demoCheck = await withDemoFallback(async () => {
    const { devicesData } = await import('@/lib/demo-data')
    return { success: true, data: devicesData.data[0] }
  })
  if (demoCheck) return demoCheck

  try {
    const body = await request.json()
    const { name, type, farmId, houseId, model, location, status } = body

    if (!name || !type || !farmId) {
      return NextResponse.json(
        { success: false, message: '设备名称、类型和养殖场ID为必填项' },
        { status: 400 }
      )
    }

    const device = await db.device.create({
      data: {
        name,
        type,
        farmId,
        houseId: houseId || null,
        model: model || null,
        location: location || null,
        status: status || '在线',
        lastOnlineAt: status === '在线' ? new Date() : null,
        lastPing: status === '在线' ? new Date() : null,
      },
      include: {
        house: { select: { id: true, name: true, status: true } },
      },
    })

    return NextResponse.json({ success: true, data: device })
  } catch (error) {
    console.error('Devices POST error:', error)
    const { devicesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: devicesData.data[0] })
  }
}
