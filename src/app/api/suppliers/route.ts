import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// GET /api/suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeMaterials = searchParams.get('includeMaterials') === 'true'

    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: includeMaterials ? {
        materials: { select: { id: true, name: true, materialCode: true, category: true, subCategory: true, unit: true, brand: true } },
      } : { _count: { select: { materials: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: suppliers })
  } catch (error) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json({ success: false, error: '获取供应商列表失败' }, { status: 500 })
  }
}

// POST /api/suppliers
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        contact: body.contact || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json({ success: true, data: supplier }, { status: 201 })
  } catch (error) {
    console.error('Suppliers POST error:', error)
    return NextResponse.json({ success: false, error: '创建供应商失败' }, { status: 500 })
  }
}
