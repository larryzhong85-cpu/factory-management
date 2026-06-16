import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    const where: any = {}
    if (orderId) where.orderId = parseInt(orderId)

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { shipDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: shipments })
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 })
  }
}