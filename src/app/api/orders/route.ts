import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = parseInt(customerId)
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { customer: { name: { contains: search } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, level: true } },
        items: {
          include: {
            product: { select: { modelName: true, shortCode: true } },
            sizeDetails: true,
          },
        },
        shipments: true,
        _count: { select: { shipments: true } },
      },
      orderBy: { orderDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ success: false, error: '获取订单列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { items, ...orderData } = body

    // 计算总件数和总付数
    let totalPieces = 0
    let totalPairs = 0

    const orderItems = items.map((item: any) => {
      const itemPieces = item.sizeDetails.reduce((sum: number, d: any) => sum + d.pieces, 0)
      const itemPairs = itemPieces * (item.piecesPerBox || 20)
      totalPieces += itemPieces
      totalPairs += itemPairs

      return {
        productId: item.productId,
        actualProductId: item.actualProductId || item.productId,
        labelProductId: item.labelProductId || null,
        piecesPerBox: item.piecesPerBox || 20,
        outerBox: item.outerBox || null,
        innerBag: item.innerBag || null,
        labelRequirement: item.labelRequirement || null,
        packingRequirement: item.packingRequirement || null,
        notes: item.notes || null,
        sizeDetails: {
          create: item.sizeDetails.map((d: any) => ({
            sizeInch: d.sizeInch,
            pieces: d.pieces,
            pairs: d.pieces * (item.piecesPerBox || 20),
          })),
        },
      }
    })

    const order = await prisma.order.create({
      data: {
        orderNo: orderData.orderNo,
        customerId: orderData.customerId,
        customerType: orderData.customerType || '老客户',
        orderDate: new Date(orderData.orderDate),
        totalPieces,
        totalPairs,
        notes: orderData.notes || null,
        status: '新订单',
        items: { create: orderItems },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            sizeDetails: true,
          },
        },
      },
    })

    // 更新客户信息
    await prisma.customer.update({
      where: { id: orderData.customerId },
      data: {
        totalOrders: { increment: 1 },
        lastOrderDate: new Date(),
        status: orderData.customerType === '新客户' ? '活跃' : undefined,
        firstOrderDate: orderData.customerType === '新客户' ? new Date() : undefined,
      },
    })

    // 记录日志
    await prisma.systemLog.create({
      data: {
        actionType: '订单录入',
        actionDetail: `录入订单: ${order.orderNo}, ${totalPieces}件`,
        operator: user!.username,
        relatedOrderNo: order.orderNo,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    console.error('Order create error:', error)
    return NextResponse.json({ success: false, error: '创建订单失败' }, { status: 500 })
  }
}