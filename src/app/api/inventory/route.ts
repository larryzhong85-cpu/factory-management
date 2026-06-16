import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get('itemType')

    const where: any = {}
    if (itemType) where.itemType = itemType

    const items = await prisma.inventory.findMany({
      where,
      include: {
        product: { select: { modelName: true } },
        material: { select: { materialCode: true, name: true, category: true, subCategory: true } },
      },
      orderBy: [{ itemType: 'asc' }, { itemName: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    return NextResponse.json({ success: false, error: '获取库存失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })

  try {
    const body = await request.json()

    let inventory
    if (body.id) {
      // 更新库存（出库/入库）
      inventory = await prisma.inventory.update({
        where: { id: body.id },
        data: { quantity: { increment: body.quantityChange } },
      })

      // 记录日志
      await prisma.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          changeType: body.quantityChange > 0 ? '入库' : '出库',
          quantityChange: body.quantityChange,
          beforeQty: inventory.quantity - body.quantityChange,
          afterQty: inventory.quantity,
          relatedOrderNo: body.relatedOrderNo || null,
          operator: user!.username,
          notes: body.notes || null,
        },
      })
    } else {
      // 创建新库存项，支持 materialId
      let itemName = body.itemName
      let itemType = body.itemType
      if (body.materialId) {
        const material = await prisma.material.findUnique({ where: { id: body.materialId } })
        if (material) {
          itemName = material.name
          if (!itemType) {
            // 物料分类 -> 库存分类映射
            const typeMap: Record<string, string> = {
              '包装材料': '包装', '五金配件': '五金', '不干胶': '贴纸',
            }
            itemType = typeMap[material.category] || '包装'
          }
        }
      }
      inventory = await prisma.inventory.create({
        data: {
          itemType,
          materialId: body.materialId || null,
          productId: body.productId || null,
          itemName,
          sizeInch: body.sizeInch || null,
          brand: body.brand || null,
          quantity: body.quantity || 0,
          unit: body.unit || '件',
          safeStock: body.safeStock || 0,
          warnThreshold: body.warnThreshold || null,
        },
      })
    }

    return NextResponse.json({ success: true, data: inventory })
  } catch (error) {
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 })
  }
}