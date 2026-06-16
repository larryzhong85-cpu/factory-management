import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET() {
  try {
    const drums = await prisma.drumInventory.findMany({
      include: { product: { select: { modelName: true, shortCode: true } } },
      orderBy: [{ productId: 'asc' }, { sizeInch: 'asc' }],
    })
    return NextResponse.json({ success: true, data: drums })
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

  try {
    const body = await request.json()
    // 如果未传 capacityPerBarrel，从 DrumCapacityRule 查默认值
    let capacity = body.capacityPerBarrel
    if (!capacity) {
      const rule = await prisma.drumCapacityRule.findUnique({
        where: { sizeInch: body.sizeInch },
      })
      capacity = rule?.capacityPerBarrel || 25
    }
    const drum = await prisma.drumInventory.upsert({
      where: {
        productId_sizeInch: {
          productId: body.productId,
          sizeInch: body.sizeInch,
        },
      },
      update: {
        currentBarrels: body.currentBarrels,
        capacityPerBarrel: capacity,
        totalPieces: body.currentBarrels * capacity,
      },
      create: {
        productId: body.productId,
        sizeInch: body.sizeInch,
        currentBarrels: body.currentBarrels || 0,
        capacityPerBarrel: capacity,
        totalPieces: (body.currentBarrels || 0) * capacity,
      },
    })

    return NextResponse.json({ success: true, data: drum })
  } catch (error) {
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 })
  }
}