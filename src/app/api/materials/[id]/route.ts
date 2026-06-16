import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// GET /api/materials/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) },
      include: { supplier: true },
    })
    if (!material) {
      return NextResponse.json({ success: false, error: '物料不存在' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: material })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取物料失败' }, { status: 500 })
  }
}

// PUT /api/materials/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        category: body.category,
        subCategory: body.subCategory ?? undefined,
        unit: body.unit ?? undefined,
        spec: body.spec ?? undefined,
        brand: body.brand ?? undefined,
        price: body.price ?? undefined,
        supplierId: body.supplierId ?? null,
        attributes: body.attributes ?? undefined,
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '物料管理',
        actionDetail: `编辑物料: ${material.name} (${material.materialCode})`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: material })
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新物料失败' }, { status: 500 })
  }
}

// DELETE /api/materials/[id] (软删除)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '物料管理',
        actionDetail: `删除物料: ${material.name} (${material.materialCode})`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: { id: material.id }, message: '已删除' })
  } catch (error) {
    return NextResponse.json({ success: false, error: '删除物料失败' }, { status: 500 })
  }
}
