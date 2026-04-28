import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const sizeParam = searchParams.get('size')
    const size = sizeParam ? parseInt(sizeParam, 10) : 200

    if (!data) {
      return NextResponse.json(
        { error: '缺少 data 参数' },
        { status: 400 }
      )
    }

    if (size < 50 || size > 1000) {
      return NextResponse.json(
        { error: 'size 参数需在 50-1000 之间' },
        { status: 400 }
      )
    }

    const pngBuffer = await QRCode.toBuffer(data, {
      type: 'image/png',
      width: size,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('QR code generation failed:', error)
    return NextResponse.json(
      { error: '二维码生成失败' },
      { status: 500 }
    )
  }
}
