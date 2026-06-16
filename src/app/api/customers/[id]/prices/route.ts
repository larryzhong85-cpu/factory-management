import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// GET /api/customers/[id]/prices
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const prices = await prisma.customerPrice.findMany({
      where: { customerId: parseInt(id) },
      include: { product: true },
      orderBy: [{ productId: 'asc' }, { sizeInch: 'asc' }],
    })
    return NextResponse.json({ success: true, data: prices })
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 })
  }
}

// POST /api/customers/[id]/prices
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

  const { id } = await params
  try {
    const body = await request.json()
    const price = await prisma.customerPrice.upsert({
      where: {
        customerId_productId_sizeInch: {
          customerId: parseInt(id),
          productId: body.productId,
          sizeInch: body.sizeInch,
        },
      },
      update: { unitPrice: body.unitPrice, notes: body.notes },
      create: {
        customerId: parseInt(id),
        productId: body.productId,
        sizeInch: body.sizeInch,
        unitPrice: body.unitPrice,
        notes: body.notes,
      },
    })
    return NextResponse.json({ success: true, data: price })
  } catch (error) {
    return NextResponse.json({ success: false, error: '保存报价失败' }, { status: 500 })
  }
}