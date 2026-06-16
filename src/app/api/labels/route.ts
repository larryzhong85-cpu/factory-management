import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET() {
  try {
    const labels = await prisma.labelInventory.findMany({
      orderBy: { brand: 'asc' },
    })
    return NextResponse.json({ success: true, data: labels })
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

  try {
    const body = await request.json()
    const label = await prisma.labelInventory.upsert({
      where: { brand: body.brand },
      update: {
        currentStock: { increment: body.quantityChange || 0 },
        onOrder: body.onOrder ?? undefined,
      },
      create: {
        brand: body.brand,
        currentStock: body.currentStock || 0,
        safeStock: body.safeStock || 100,
        onOrder: body.onOrder || 0,
      },
    })

    return NextResponse.json({ success: true, data: label })
  } catch (error) {
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 })
  }
}