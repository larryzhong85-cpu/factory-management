import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inventoryId = searchParams.get('inventoryId')

    const where: any = {}
    if (inventoryId) where.inventoryId = parseInt(inventoryId)

    const logs = await prisma.inventoryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 })
  }
}