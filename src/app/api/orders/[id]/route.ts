import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'
import { canArchiveOrder } from '@/lib/business-rules'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            sizeDetails: true,
          },
        },
        shipments: {
          orderBy: { shipDate: 'desc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取订单失败' }, { status: 500 })
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
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: body.status,
        notes: body.notes,
        customerType: body.customerType,
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '订单管理',
        actionDetail: `更新订单 ${order.orderNo} 状态为 ${order.status}`,
        operator: user!.username,
        relatedOrderNo: order.orderNo,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新订单失败' }, { status: 500 })
  }
}

// POST: 归档操作
export async function POST(
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
    const action = body.action // 'ship' | 'archive'

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { shipments: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 })
    }

    if (action === 'ship') {
      // 创建发货记录
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          shipDate: new Date(body.shipDate),
          piecesShipped: body.piecesShipped,
          shipType: body.shipType || '全部',
          deliveryNoteNo: body.deliveryNoteNo || null,
          notes: body.notes || null,
        },
      })

      // 更新订单状态
      const newStatus = body.shipType === '全部' ? '已发货' : '部分发货'
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      })

      await prisma.systemLog.create({
        data: {
          actionType: '发货',
          actionDetail: `订单 ${order.orderNo} 发货 ${body.piecesShipped}件`,
          operator: user!.username,
          relatedOrderNo: order.orderNo,
          result: '成功',
        },
      })

      return NextResponse.json({ success: true, data: shipment })
    }

    if (action === 'archive') {
      const check = canArchiveOrder(order.status, order.shipments)
      if (!check.canArchive) {
        return NextResponse.json({ success: false, error: check.reason }, { status: 400 })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: '已归档', archivedAt: new Date() },
      })

      await prisma.systemLog.create({
        data: {
          actionType: '归档',
          actionDetail: `归档订单: ${order.orderNo}`,
          operator: user!.username,
          relatedOrderNo: order.orderNo,
          result: '成功',
        },
      })

      return NextResponse.json({ success: true, message: '已归档' })
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 })
  }
}