import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const level = searchParams.get('level')
    const status = searchParams.get('status')

    const where: any = {}
    if (search) where.name = { contains: search }
    if (level) where.level = level
    if (status) where.status = status

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
      },
    })

    return NextResponse.json({ success: true, data: customers })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取客户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        level: body.level || '普通',
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '客户管理',
        actionDetail: `新增客户: ${customer.name}`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: customer }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: '创建客户失败' }, { status: 500 })
  }
}