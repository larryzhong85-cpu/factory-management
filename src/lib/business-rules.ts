// ==========================================
// 业务规则引擎
// 包含所有 If-Then 业务规则的实现
// ==========================================

import {
  PACKAGING_RULES,
  AVAILABLE_SIZES,
} from './constants'
import prisma from './prisma'
import type { AliasResolveResult, BoxSpecResult, PairsCalculation } from '@/types'

// ==========================================
// 规则 P-001: 型号别名映射
// ==========================================

/**
 * 别名 -> 标准型号解析
 * 输入: 用户输入的型号名称（可能含别名）
 * 输出: 匹配的标准产品信息
 */
export async function resolveProductAlias(input: string): Promise<AliasResolveResult | null> {
  const trimmed = input.trim()
  if (!trimmed) return null

  const products = await prisma.product.findMany({
    where: { isActive: true },
  })

  // 1. 精确匹配主型号
  const exactMatch = products.find(
    (p) => p.modelName === trimmed
  )
  if (exactMatch) {
    return {
      product: formatProduct(exactMatch),
      matchedAlias: exactMatch.modelName,
      confidence: 1,
    }
  }

  // 2. 匹配别名（JSON 数组）
  for (const product of products) {
    const aliases: string[] = JSON.parse(product.aliasNames || '[]')
    const aliasMatch = aliases.find(
      (a) => a === trimmed || a.replace(/\s/g, '') === trimmed.replace(/\s/g, '')
    )
    if (aliasMatch) {
      return {
        product: formatProduct(product),
        matchedAlias: aliasMatch,
        confidence: 2,
      }
    }
  }

  // 3. 模糊匹配（包含关键词）
  for (const product of products) {
    const aliases: string[] = JSON.parse(product.aliasNames || '[]')
    const allNames = [product.modelName, ...aliases]
    const fuzzyMatch = allNames.find(
      (name) => name.includes(trimmed) || trimmed.includes(name)
    )
    if (fuzzyMatch) {
      return {
        product: formatProduct(product),
        matchedAlias: fuzzyMatch,
        confidence: 3,
      }
    }
  }

  return null
}

function formatProduct(p: any) {
  return {
    id: p.id,
    modelName: p.modelName,
    category: p.category,
    functionType: p.functionType,
    aliasNames: JSON.parse(p.aliasNames || '[]'),
    shortCode: p.shortCode,
    commonSizes: JSON.parse(p.commonSizes || '[]'),
  }
}

/**
 * 批量解析订单中的型号
 */
export async function parseProductInput(input: string): Promise<{
  resolved: AliasResolveResult | null
  raw: string
}> {
  const resolved = await resolveProductAlias(input)
  return { resolved, raw: input }
}

/**
 * 检查字符串是否包含功能款关键词
 */
export function detectFunctionType(input: string): string | null {
  const lower = input.toLowerCase()
  if (lower.includes('双弹') || lower.includes('双弹簧')) return '双弹缓冲'
  if (lower.includes('单弹') || lower.includes('单弹簧')) return '单弹缓冲'
  if (lower.includes('反弹')) return '反弹'
  return null
}

// ==========================================
// 规则 PK-001: 装箱规格确定
// ==========================================

/**
 * 根据产品尺寸和品牌计算装箱规格
 * 规则:
 * 1. 8寸: 用16寸箱, 40副/箱（布鲁格除外）
 * 2. 布鲁格8寸: 20副/箱
 * 3. collcoll/杰迦: 15副/箱
 * 4. 其他: 对应尺寸箱, 20副/箱
 */
export function calculateBoxSpec(
  sizeInch: number,
  brand?: string | null
): BoxSpecResult {
  const brandName = brand?.trim() || ''

  // 规则 1+2: 8 寸特殊处理
  if (sizeInch === 8) {
    // 布鲁格例外
    if (brandName === PACKAGING_RULES.SIZE_8.EXCEPTION_BRAND) {
      return {
        boxSize: 8,
        piecesPerBox: 20,
        isSpecial: true,
        rule: '布鲁格8寸专用箱，20副/箱',
      }
    }
    // collcoll/杰迦用30副/箱
    if ((PACKAGING_RULES.SIZE_8.BRAND_30 as string[]).includes(brandName)) {
      return {
        boxSize: PACKAGING_RULES.SIZE_8.BOX_SIZE,
        piecesPerBox: 30,
        isSpecial: true,
        rule: '8寸特殊规格，用16寸箱，30副/箱',
      }
    }
    // 默认40副/箱
    return {
      boxSize: PACKAGING_RULES.SIZE_8.BOX_SIZE,
      piecesPerBox: PACKAGING_RULES.SIZE_8.DEFAULT_PIECES,
      isSpecial: true,
      rule: '8寸特殊规格，用16寸箱，40副/箱',
    }
  }

  // 规则 3: collcoll/杰迦 15副/箱
  if (PACKAGING_RULES.SPECIAL_15_BRANDS.includes(brandName)) {
    return {
      boxSize: sizeInch,
      piecesPerBox: 15,
      isSpecial: true,
      rule: `${brandName}专用规格，${sizeInch}寸箱，15副/箱`,
    }
  }

  // 规则 4: 默认 20副/箱
  return {
    boxSize: sizeInch,
    piecesPerBox: PACKAGING_RULES.DEFAULT_PIECES_PER_BOX,
    isSpecial: false,
    rule: `标准规格，${sizeInch}寸箱，20副/箱`,
  }
}

// ==========================================
// 规则 U-001/U-002: 件/副换算
// ==========================================

/**
 * 计算总付数
 * 件数 × 每箱副数 = 总付数
 */
export function calculatePairs(
  pieces: number,
  piecesPerBox: number = PACKAGING_RULES.DEFAULT_PIECES_PER_BOX
): PairsCalculation {
  return {
    totalPairs: pieces * piecesPerBox,
    piecesPerBox,
    rule: `${pieces}件 × ${piecesPerBox}副/件 = ${pieces * piecesPerBox}副`,
  }
}

// ==========================================
// 规则 U-003: 电镀桶容量换算
// ==========================================

/** @deprecated Use DrumCapacityRule table via business-rules.ts instead */
export const DRUM_CAPACITY_FALLBACK: Record<number, number> = {
  6: 50, 8: 50, 10: 38, 12: 35, 14: 33, 16: 30, 18: 25, 20: 25, 22: 18, 24: 18,
}

/**
 * 计算需要从电镀桶取多少桶
 * 公式: ceil(件数 / 每桶容量)
 * 容量从 DrumCapacityRule 表查询，可在线配置
 */
export async function calculateBarrelsNeeded(
  pieces: number,
  sizeInch: number
): Promise<{ barrels: number; capacityPerBarrel: number; totalPairs: number }> {
  const rule = await prisma.drumCapacityRule.findUnique({
    where: { sizeInch },
  })
  const capacity = rule?.capacityPerBarrel || DRUM_CAPACITY_FALLBACK[sizeInch] || 25
  const barrels = Math.ceil(pieces / capacity)
  return {
    barrels,
    capacityPerBarrel: capacity,
    totalPairs: pieces * (sizeInch === 8 ? 40 : 20),
  }
}

// ==========================================
// 规则 INV-001/INV-002: 库存状态判断
// ==========================================

/**
 * 判断库存状态
 */
export function getInventoryStatus(
  currentQuantity: number,
  safeStock: number,
  warnThreshold?: number | null
): '充足' | '预警' | '不足' {
  const threshold = warnThreshold ?? Math.floor(safeStock * 2 / 3)

  if (currentQuantity >= safeStock) return '充足'
  if (currentQuantity >= threshold) return '预警'
  return '不足'
}

/**
 * 检查物料库存是否满足需求
 */
export function checkStockSufficiency(
  currentStock: number,
  required: number,
  safeStock?: number
): { sufficient: boolean; shortage: number; status: string } {
  if (currentStock >= required) {
    return { sufficient: true, shortage: 0, status: getInventoryStatus(currentStock, safeStock || required * 3) }
  }
  return {
    sufficient: false,
    shortage: required - currentStock,
    status: '不足',
  }
}

/**
 * 计算安全库存
 */
export function calculateSafeStock(
  monthlyUsage: number,
  itemType: '包装' | '五金' | '定制'
): number {
  switch (itemType) {
    case '包装': return monthlyUsage * 3
    case '五金': return monthlyUsage * 5
    case '定制': return Math.ceil(monthlyUsage * 1.1)
  }
}

// ==========================================
// 规则 O-001: 订单编号生成
// ==========================================

/**
 * 生成订单编号
 * 格式: YYYYMMDD-客户名-序号
 */
export async function generateOrderNo(
  customerName: string,
  orderDate: Date = new Date()
): Promise<string> {
  const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `${dateStr}-${customerName}`

  // 查找同一天该客户的最大序号
  const existingOrders = await prisma.order.findMany({
    where: {
      orderNo: {
        startsWith: prefix,
      },
    },
    select: { orderNo: true },
  })

  let maxSeq = 0
  for (const order of existingOrders) {
    const parts = order.orderNo.split('-')
    const seqStr = parts[parts.length - 1]
    const seq = parseInt(seqStr, 10)
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0')
  return `${prefix}-${nextSeq}`
}

// ==========================================
// 规则 O-002/O-003: 订单状态判定
// ==========================================

/**
 * 判断订单是否可以归档
 */
export function canArchiveOrder(
  status: string,
  shipments: { shipType: string }[]
): { canArchive: boolean; reason: string } {
  if (status === '已归档') {
    return { canArchive: false, reason: '订单已经归档' }
  }

  const allShipped = shipments.every((s) => s.shipType === '全部')
  const hasShipments = shipments.length > 0

  if (!hasShipments) {
    return { canArchive: false, reason: '订单尚未发货，不能归档' }
  }

  if (!allShipped) {
    return { canArchive: false, reason: '存在部分发货，不能归档（需全部发货后才可归档）' }
  }

  return { canArchive: true, reason: '全部已发货，可以归档' }
}

// ==========================================
// 规则 PK-002: 包装方式物料清单
// ==========================================

interface BOMItem {
  name: string
  quantity: number
  unit: string
}

/**
 * 根据包装类型返回物料清单
 */
export function getPackagingBOM(
  packingType: '薄膜袋装' | '吸塑盒热缩装' | 'PVC盒装',
  quantity: number
): BOMItem[] {
  switch (packingType) {
    case '薄膜袋装':
      return [{ name: '薄膜袋', quantity, unit: '个' }]

    case '吸塑盒热缩装':
      return [
        { name: '吸塑盒', quantity: quantity * 2, unit: '个' },
        { name: '吸塑袋', quantity, unit: '个' },
        { name: '插卡', quantity: quantity * 2, unit: '个' },
      ]

    case 'PVC盒装':
      return [
        { name: '吸塑盒', quantity: quantity * 2, unit: '个' },
        { name: 'PVC盒', quantity, unit: '个' },
        { name: '插卡', quantity: quantity * 2, unit: '个' },
      ]
  }
}

// ==========================================
// 规则 LB-001/LB-002: 贴标规则
// ==========================================

/**
 * 获取可升级贴标的目标
 */
export function getUpgradeLabelTarget(actualModel: string): string | null {
  const upgradeMap: Record<string, string> = {
    '4508': '4510',
    '4507': '4510',
    '4510': '4512',
    '4509': '4512',
    '4512': '4515',
  }
  return upgradeMap[actualModel] || null
}

/**
 * 判断是否需要检查不干胶库存
 */
export function needsLabelCheck(brand: string): boolean {
  return PACKAGING_RULES.LABEL_BRANDS.includes(brand)
}

/**
 * 计算不干胶需求量
 */
export function calculateLabelNeeded(pieces: number): number {
  return pieces * PACKAGING_RULES.LABELS_PER_BOX
}

// ==========================================
// 工具函数
// ==========================================

/**
 * 验证尺寸是否有效（仅双数）
 */
export function isValidSize(size: number): boolean {
  return AVAILABLE_SIZES.includes(size)
}

/**
 * 获取可用尺寸列表
 */
export function getAvailableSizes(
  min?: number,
  max?: number
): number[] {
  return AVAILABLE_SIZES.filter(
    (s) => (!min || s >= min) && (!max || s <= max)
  )
}

/**
 * 判断客户类型
 */
export async function determineCustomerType(
  customerName: string
): Promise<'新客户' | '老客户' | '加单'> {
  const customer = await prisma.customer.findUnique({
    where: { name: customerName },
  })

  if (!customer) return '新客户'

  // 检查是否有未发货订单（加单）
  const pendingOrders = await prisma.order.findFirst({
    where: {
      customerId: customer.id,
      status: { in: ['新订单', '生产中', '部分发货'] },
    },
  })

  if (pendingOrders) return '加单'
  return '老客户'
}