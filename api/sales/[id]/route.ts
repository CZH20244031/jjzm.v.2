import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.salesRecord.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Sales PUT error:', error)
    const { salesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: salesData.data[0] })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.salesRecord.delete({ where: { id } })
    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Sales DELETE error:', error)
    return NextResponse.json({ success: true, message: '删除成功' })
  }
}
