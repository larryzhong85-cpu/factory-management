import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = { isActive: true }
    if (category) where.category = category
    if (search) {
      where.OR = [
        { modelName: { contains: search } },
        { aliasNames: { contains: search } },
        { shortCode: { contains: search } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: 'asc' },
    })

    const formatted = products.map((p) => ({
      ...p,
      aliasNames: JSON.parse(p.aliasNames),
      commonSizes: JSON.parse(p.commonSizes),
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ success: false, error: '获取产品列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const product = await prisma.product.create({
      data: {
        modelName: body.modelName,
        category: body.category,
        functionType: body.functionType || null,
        aliasNames: JSON.stringify(body.aliasNames || []),
        shortCode: body.shortCode || null,
        description: body.description || null,
        sizeMin: body.sizeMin || 6,
        sizeMax: body.sizeMax || 40,
        sizeStep: body.sizeStep || 2,
        commonSizes: JSON.stringify(body.commonSizes || [10, 12, 14, 16, 18, 20]),
        priceFormula: body.priceFormula || null,
        hasExtra: body.hasExtra || false,
        extraPart: body.extraPart || null,
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '产品管理',
        actionDetail: `新增产品: ${product.modelName}`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: '创建产品失败' }, { status: 500 })
  }
}