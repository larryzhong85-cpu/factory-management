import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        packagingPreferences: {
          include: { product: true },
        },
        prices: {
          include: { product: true },
          orderBy: { sizeInch: 'asc' },
        },
        orders: {
          orderBy: { orderDate: 'desc' },
          take: 20,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: '客户不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取客户失败' }, { status: 500 })
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
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        level: body.level,
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新客户失败' }, { status: 500 })
  }
}