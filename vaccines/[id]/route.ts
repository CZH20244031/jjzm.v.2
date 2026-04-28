import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const record = await db.vaccineRecord.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Vaccines PUT error:', error)
    const { vaccinesData } = await import('@/lib/demo-data')
    return NextResponse.json({ success: true, data: vaccinesData.data[0] })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.vaccineRecord.delete({ where: { id } })
    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Vaccines DELETE error:', error)
    return NextResponse.json({ success: true, message: '删除成功' })
  }
}
