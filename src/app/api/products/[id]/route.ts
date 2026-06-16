import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    })
    if (!product) {
      return NextResponse.json({ success: false, error: '产品不存在' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        aliasNames: JSON.parse(product.aliasNames),
        commonSizes: JSON.parse(product.commonSizes),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取产品失败' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        modelName: body.modelName,
        category: body.category,
        functionType: body.functionType || null,
        aliasNames: JSON.stringify(body.aliasNames || []),
        shortCode: body.shortCode || null,
        description: body.description || null,
        hasExtra: body.hasExtra || false,
        extraPart: body.extraPart || null,
        isActive: body.isActive ?? true,
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '产品管理',
        actionDetail: `更新产品: ${product.modelName}`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新产品失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '产品管理',
        actionDetail: `删除产品 ID: ${id}`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, message: '已删除' })
  } catch (error) {
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 })
  }
}