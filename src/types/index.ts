// ==========================================
// 工厂管理系统 - TypeScript 类型定义
// ==========================================

import type { ORDER_STATUSES } from '@/lib/constants'

/** 订单状态类型 */
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]

/** 产品型号信息 */
export interface ProductInfo {
  id: number
  modelName: string
  category: string
  functionType: string | null
  aliasNames: string[]
  shortCode: string | null
  commonSizes: number[]
}

/** 别名解析结果 */
export interface AliasResolveResult {
  product: ProductInfo
  matchedAlias: string
  confidence: number // 1=精确匹配主型号, 2=匹配别名, 3=模糊匹配
}

/** 装箱规格计算结果 */
export interface BoxSpecResult {
  boxSize: number
  piecesPerBox: number
  isSpecial: boolean
  rule: string
}

/** 件数换算结果 */
export interface PairsCalculation {
  totalPairs: number
  piecesPerBox: number
  rule: string
}

/** 库存检查结果 */
export interface InventoryCheck {
  sufficient: boolean
  itemName: string
  currentStock: number
  required: number
  shortage: number
  status: string
}

/** 订单录入请求 */
export interface OrderEntryRequest {
  customerName: string
  customerType?: string
  orderDate: string
  items: OrderEntryItem[]
  notes?: string
}

export interface OrderEntryItem {
  productName: string
  sizeDetails: { sizeInch: number; pieces: number }[]
  piecesPerBox?: number
  outerBox?: string
  innerBag?: string
  labelRequirement?: string
  packingRequirement?: string
  actualProductName?: string  // 升级贴标用
  labelProductName?: string   // 升级贴标用
}

/** API 响应格式 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/** 登录请求 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    displayName: string
    role: string
  }
}

/** JWT Payload */
export interface JwtPayload {
  userId: number
  username: string
  role: string
}

/** 物料主数据 */
export interface MaterialInfo {
  id: number
  materialCode: string
  name: string
  category: string
  subCategory: string | null
  unit: string
  spec: string | null
  brand: string | null
  price: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** 电镀桶容量规则 */
export interface DrumCapacityRuleInfo {
  id: number
  sizeInch: number
  capacityPerBarrel: number
  notes: string | null
}