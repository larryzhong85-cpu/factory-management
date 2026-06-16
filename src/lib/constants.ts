// ==========================================
// 工厂管理系统 - 全局常量定义
// ==========================================

/** 产品分类 */
export const PRODUCT_CATEGORIES = {
  NORMAL: '普通款',
  FUNCTIONAL: '功能款',
} as const

/** 功能款类型 */
export const FUNCTION_TYPES = {
  SINGLE_BUFFER: '单弹缓冲',
  DUAL_BUFFER: '双弹缓冲',
  REBOUND: '反弹',
} as const

/** 订单状态 */
export const ORDER_STATUSES = {
  NEW: '新订单',
  PRODUCING: '生产中',
  PARTIAL_SHIPPED: '部分发货',
  SHIPPED: '已发货',
  ARCHIVED: '已归档',
} as const

export const ORDER_STATUS_FLOW = [
  ORDER_STATUSES.NEW,
  ORDER_STATUSES.PRODUCING,
  ORDER_STATUSES.PARTIAL_SHIPPED,
  ORDER_STATUSES.SHIPPED,
  ORDER_STATUSES.ARCHIVED,
] as const

/** 客户等级 */
export const CUSTOMER_LEVELS = {
  VIP: 'VIP',
  IMPORTANT: '重要',
  NORMAL: '普通',
} as const

/** 客户状态 */
export const CUSTOMER_STATUSES = {
  ACTIVE: '活跃',
  DORMANT: '休眠',
  NEW: '新客户',
} as const

/** 库存状态 */
export const INVENTORY_STATUSES = {
  SUFFICIENT: '充足',
  WARNING: '预警',
  INSUFFICIENT: '不足',
  SHORTAGE: '短缺',
} as const

/** 库存类型 */
export const INVENTORY_TYPES = {
  FINISHED: '成品',
  PACKAGING: '包装',
  HARDWARE: '五金',
  LABEL: '贴纸',
} as const

/** 用户角色 */
export const USER_ROLES = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
  AGENT: 'agent',
} as const

/** 系统日志类型 */
export const LOG_TYPES = {
  ORDER_ENTRY: '订单录入',
  SHIPMENT: '发货',
  ARCHIVE: '归档',
  INVENTORY_CHANGE: '库存变更',
  LOGIN: '登录',
  OTHER: '其他',
} as const

/** 包装规则 */
export const PACKAGING_RULES: {
  DEFAULT_PIECES_PER_BOX: number
  SPECIAL_15_BRANDS: string[]
  SIZE_8: { BOX_SIZE: number; DEFAULT_PIECES: number; BRAND_30: string[]; EXCEPTION_BRAND: string }
  LABEL_BRANDS: string[]
  LABEL_SAFE_STOCK: number
  LABELS_PER_BOX: number
} = {
  DEFAULT_PIECES_PER_BOX: 20,
  SPECIAL_15_BRANDS: ['collcoll', '杰迦', 'JEGA'],
  SIZE_8: {
    BOX_SIZE: 16,
    DEFAULT_PIECES: 40,
    BRAND_30: ['collcoll', '杰迦', 'JEGA'],
    EXCEPTION_BRAND: '布鲁格',
  },
  LABEL_BRANDS: ['老船木', '卡陌琦', 'collcoll', '图欧诺'],
  LABEL_SAFE_STOCK: 100,
  LABELS_PER_BOX: 2,
}

/** 可用尺寸列表（仅双数） */
export const AVAILABLE_SIZES: number[] = [
  6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
]

/** 常用尺寸 */
export const COMMON_SIZES: number[] = [10, 12, 14, 16, 18, 20]

/** @deprecated 请使用 DrumCapacityRule 表（可在电镀桶页面在线配置） */
export const DRUM_CAPACITY: Record<number, number> = {
  6: 50, 8: 50, 10: 38, 12: 35, 14: 33, 16: 30, 18: 25, 20: 25, 22: 18, 24: 18,
}

/** JWT 密钥 */
export const JWT_SECRET = process.env.JWT_SECRET || 'factory-management-secret-key-change-in-production'

/** JWT 过期时间 */
export const JWT_EXPIRES_IN = '7d'