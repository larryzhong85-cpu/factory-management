import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'
import {
  resolveProductAlias,
  calculateBoxSpec,
  calculatePairs,
  generateOrderNo,
  determineCustomerType,
  checkStockSufficiency,
  getUpgradeLabelTarget,
  needsLabelCheck,
  calculateLabelNeeded,
  getInventoryStatus,
} from '@/lib/business-rules'
import type { OrderEntryRequest } from '@/types'

// 智能体专用 API
// AI agent 通过学习业务规则后，通过此 API 自动执行管理操作

// GET /api/agent - 健康检查
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI 智能体接口已就绪',
    version: '1.0',
    capabilities: [
      'order-entry',      // 自动录入订单
      'check-inventory',  // 检查库存
      'resolve-product',  // 解析产品型号
      'query-orders',     // 查询订单
      'query-customers',  // 查询客户
      'dashboard-stats',  // 获取仪表盘统计数据
    ],
  })
}

// POST /api/agent - AI 智能体操作入口
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params } = body

    switch (action) {
      case 'resolve-product':
        return handleResolveProduct(params)
      case 'check-inventory':
        return handleCheckInventory(params)
      case 'query-orders':
        return handleQueryOrders(params)
      case 'query-customers':
        return handleQueryCustomers(params)
      case 'dashboard-stats':
        return handleDashboardStats()
      case 'order-entry':
        return handleOrderEntry(params)
      default:
        return NextResponse.json(
          { success: false, error: `未知操作: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 })
  }
}

// --- 型号解析 ---
async function handleResolveProduct(params: { input: string }) {
  const result = await resolveProductAlias(params.input)
  if (!result) {
    return NextResponse.json({
      success: false,
      error: `未找到匹配产品: "${params.input}"`,
    })
  }
  return NextResponse.json({ success: true, data: result })
}

// --- 库存检查 ---
async function handleCheckInventory(params: { productId?: number; itemType?: string }) {
  const where: any = {}
  if (params.productId) where.productId = params.productId
  if (params.itemType) where.itemType = params.itemType

  const inventory = await prisma.inventory.findMany({ where })
  const alerts = inventory
    .filter((i) => i.status !== '充足')
    .map((i) => ({
      id: i.id,
      itemName: i.itemName,
      currentStock: i.quantity,
      safeStock: i.safeStock,
      status: i.status,
    }))

  return NextResponse.json({
    success: true,
    data: { inventory, alerts },
  })
}

// --- 查询订单 ---
async function handleQueryOrders(params: { status?: string; customerId?: number; search?: string; limit?: number }) {
  const where: any = {}
  if (params.status) where.status = params.status
  if (params.customerId) where.customerId = params.customerId
  if (params.search) {
    where.OR = [
      { orderNo: { contains: params.search } },
      { customer: { name: { contains: params.search } } },
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { name: true } },
      items: {
        include: {
          product: { select: { modelName: true } },
          sizeDetails: true,
        },
      },
    },
    orderBy: { orderDate: 'desc' },
    take: params.limit || 50,
  })

  return NextResponse.json({ success: true, data: orders })
}

// --- 查询客户 ---
async function handleQueryCustomers(params: { search?: string }) {
  const where: any = {}
  if (params.search) where.name = { contains: params.search }

  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { orders: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: customers })
}

// --- 仪表盘统计 ---
async function handleDashboardStats() {
  const [
    totalOrders,
    newOrders,
    shippedOrders,
    archivedOrders,
    totalCustomers,
    inventoryAlerts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: '新订单' } }),
    prisma.order.count({ where: { status: '已发货' } }),
    prisma.order.count({ where: { status: '已归档' } }),
    prisma.customer.count(),
    prisma.inventory.findMany({
      where: { status: { not: '充足' } },
      select: { itemName: true, quantity: true, safeStock: true, status: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { name: true } },
        items: { include: { product: { select: { modelName: true } } } },
      },
    }),
  ])

  // 常用尺寸统计（从订单尺寸明细中统计）
  const sizeStats = await prisma.orderSizeDetail.groupBy({
    by: ['sizeInch'],
    _sum: { pieces: true },
    orderBy: { _sum: { pieces: 'desc' } },
    take: 10,
  })

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalOrders,
        newOrders,
        shippedOrders,
        archivedOrders,
        totalCustomers,
        pendingShipment: totalOrders - shippedOrders - archivedOrders,
      },
      inventoryAlerts,
      recentOrders,
      topSizes: sizeStats.map((s) => ({ size: s.sizeInch, totalPieces: s._sum.pieces || 0 })),
    },
  })
}

// --- 智能体自动订单录入 ---
async function handleOrderEntry(params: OrderEntryRequest) {
  // 权限验证
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    // 1. 确定客户
    let customer = await prisma.customer.findUnique({
      where: { name: params.customerName },
    })

    const customerType = params.customerType || await determineCustomerType(params.customerName)

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: params.customerName,
          status: '新客户',
        },
      })
    }

    // 2. 解析产品
    const resolvedItems = []
    for (const item of params.items) {
      const resolved = await resolveProductAlias(item.productName)
      if (!resolved) {
        return NextResponse.json({
          success: false,
          error: `无法解析产品型号: "${item.productName}"`,
        }, { status: 400 })
      }

      // 如果有升级贴标，解析实际产品
      let actualProduct = null
      if (item.actualProductName) {
        actualProduct = await resolveProductAlias(item.actualProductName)
      }

      let labelProduct = null
      if (item.labelProductName) {
        labelProduct = await resolveProductAlias(item.labelProductName)
      }

      resolvedItems.push({
        product: resolved.product,
        actualProduct: actualProduct?.product || null,
        labelProduct: labelProduct?.product || null,
        ...item,
      })
    }

    // 3. 生成订单编号
    const orderDate = params.orderDate ? new Date(params.orderDate) : new Date()
    const orderNo = await generateOrderNo(params.customerName, orderDate)

    // 4. 计算包装规格
    const items = resolvedItems.map((item) => {
      const spec = calculateBoxSpec(
        item.sizeDetails[0]?.sizeInch || 10,
        null // 品牌信息
      )
      return {
        productId: item.product.id,
        actualProductId: item.actualProduct?.id || item.product.id,
        labelProductId: item.labelProduct?.id || null,
        piecesPerBox: item.piecesPerBox || spec.piecesPerBox,
        outerBox: item.outerBox || null,
        innerBag: item.innerBag || null,
        labelRequirement: item.labelRequirement || null,
        packingRequirement: item.packingRequirement || null,
        notes: null,
        sizeDetails: {
          create: item.sizeDetails.map((d) => ({
            sizeInch: d.sizeInch,
            pieces: d.pieces,
            pairs: d.pieces * (item.piecesPerBox || spec.piecesPerBox),
          })),
        },
      }
    })

    // 5. 创建订单
    const totalPieces = resolvedItems.reduce(
      (sum, item) => sum + item.sizeDetails.reduce((s, d) => s + d.pieces, 0),
      0
    )

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId: customer!.id,
        customerType,
        orderDate,
        totalPieces,
        totalPairs: totalPieces * 20, // 默认 20 付/箱
        notes: params.notes || null,
        status: '新订单',
        items: { create: items },
      },
      include: {
        customer: true,
        items: { include: { product: true, sizeDetails: true } },
      },
    })

    // 更新客户信息
    await prisma.customer.update({
      where: { id: customer!.id },
      data: {
        totalOrders: { increment: 1 },
        lastOrderDate: orderDate,
        status: customerType === '新客户' ? '活跃' : undefined,
        firstOrderDate: customerType === '新客户' ? orderDate : undefined,
      },
    })

    // 记录日志
    await prisma.systemLog.create({
      data: {
        actionType: '订单录入',
        actionDetail: `[智能体] 录入订单: ${orderNo}, ${totalPieces}件`,
        operator: 'AI_Agent',
        relatedOrderNo: orderNo,
        result: '成功',
      },
    })

    return NextResponse.json({
      success: true,
      data: order,
      message: `订单 ${orderNo} 已自动创建（${totalPieces}件）`,
    })
  } catch (error) {
    console.error('Agent order entry error:', error)
    return NextResponse.json({ success: false, error: '智能体订单录入失败' }, { status: 500 })
  }
}