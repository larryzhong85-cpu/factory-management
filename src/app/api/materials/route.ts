import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// GET /api/materials?category=包装材料&search=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const subCategory = searchParams.get('subCategory')
    const search = searchParams.get('search')

    const where: any = { isActive: true }
    if (category) where.category = category
    if (subCategory) where.subCategory = subCategory
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { materialCode: { contains: search } },
      ]
    }

    const materials = await prisma.material.findMany({
      where,
      include: { supplier: true },
      orderBy: [{ category: 'asc' }, { materialCode: 'asc' }],
    })

    return NextResponse.json({ success: true, data: materials })
  } catch (error) {
    console.error('Materials GET error:', error)
    return NextResponse.json({ success: false, error: '获取物料列表失败' }, { status: 500 })
  }
}

// POST /api/materials
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const material = await prisma.material.create({
      data: {
        materialCode: body.materialCode,
        name: body.name,
        category: body.category,
        subCategory: body.subCategory || null,
        unit: body.unit || '件',
        spec: body.spec || null,
        brand: body.brand || null,
        price: body.price || null,
        supplierId: body.supplierId || null,
        attributes: body.attributes || '{}',
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '物料管理',
        actionDetail: `新增物料: ${material.name} (${material.materialCode})`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: material }, { status: 201 })
  } catch (error) {
    console.error('Materials POST error:', error)
    return NextResponse.json({ success: false, error: '创建物料失败' }, { status: 500 })
  }
}
