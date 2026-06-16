import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// GET /api/customers/[id]/packaging
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const packaging = await prisma.customerPackaging.findMany({
      where: { customerId: parseInt(id) },
      include: { product: true },
    })
    return NextResponse.json({ success: true, data: packaging })
  } catch (error) {
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 })
  }
}

// POST /api/customers/[id]/packaging
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

  const { id } = await params
  try {
    const body = await request.json()
    const pkg = await prisma.customerPackaging.upsert({
      where: {
        customerId_productId: {
          customerId: parseInt(id),
          productId: body.productId,
        },
      },
      update: {
        outerBox: body.outerBox,
        innerBag: body.innerBag,
        piecesPerBox: body.piecesPerBox || 20,
        labelRequirement: body.labelRequirement,
        packingRequirement: body.packingRequirement,
        hasScrews: body.hasScrews || false,
        notes: body.notes,
      },
      create: {
        customerId: parseInt(id),
        productId: body.productId,
        outerBox: body.outerBox,
        innerBag: body.innerBag,
        piecesPerBox: body.piecesPerBox || 20,
        labelRequirement: body.labelRequirement,
        packingRequirement: body.packingRequirement,
        hasScrews: body.hasScrews || false,
        notes: body.notes,
      },
    })
    return NextResponse.json({ success: true, data: pkg })
  } catch (error) {
    return NextResponse.json({ success: false, error: '保存包装偏好失败' }, { status: 500 })
  }
}