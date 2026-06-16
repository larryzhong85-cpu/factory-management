// 种子数据 - 导入工厂实际数据
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始导入种子数据...')

  // ========== 1. 创建管理员用户 ==========
  const adminPassword = await bcrypt.hash('admin123', 10)
  const agentPassword = await bcrypt.hash('agent123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      displayName: '管理员',
      role: 'admin',
    },
  })

  await prisma.user.upsert({
    where: { username: 'agent' },
    update: {},
    create: {
      username: 'agent',
      password: agentPassword,
      displayName: 'AI智能体',
      role: 'agent',
    },
  })

  console.log('✅ 用户已创建 (admin/admin123, agent/agent123)')

  // ========== 2. 导入产品型号（11 款） ==========
  const products = [
    {
      modelName: '4508',
      category: '普通款',
      functionType: null,
      aliasNames: JSON.stringify(['4507']),
      shortCode: null,
      description: '4508和4507是同一产品，基础型导轨',
      hasExtra: false,
      extraPart: null,
    },
    {
      modelName: '45079',
      category: '普通款',
      functionType: null,
      aliasNames: JSON.stringify([]),
      shortCode: null,
      description: '独立型号',
      hasExtra: false,
      extraPart: null,
    },
    {
      modelName: '4509 两珠',
      category: '普通款',
      functionType: null,
      aliasNames: JSON.stringify(['4509', '4510', '4509两珠', '4510 二珠', '4509二珠', '4510二珠黑']),
      shortCode: null,
      description: '两珠版本，也叫4509或4510',
      hasExtra: false,
      extraPart: null,
    },
    {
      modelName: '4509 四珠',
      category: '普通款',
      functionType: null,
      aliasNames: JSON.stringify(['4510 四珠', '4509四珠']),
      shortCode: null,
      description: '四珠版本',
      hasExtra: false,
      extraPart: null,
    },
    {
      modelName: '4512',
      category: '普通款',
      functionType: null,
      aliasNames: JSON.stringify(['4512 普通']),
      shortCode: null,
      description: '常用型号，工厂最常用基础产品',
      hasExtra: false,
      extraPart: null,
    },
    {
      modelName: '4515',
      category: '普通款',
      functionType: null,
      aliasNames: JSON.stringify([]),
      shortCode: null,
      description: '独立型号',
      hasExtra: false,
      extraPart: null,
    },
    {
      modelName: '4512 单弹缓冲',
      category: '功能款',
      functionType: '单弹缓冲',
      aliasNames: JSON.stringify(['4512 单弹', '单弹', '单弹缓冲', '单弹阻尼', '4512A', '单弹簧缓冲', '单弹簧阻尼']),
      shortCode: '4512A',
      description: '单弹簧缓冲/阻尼版本',
      hasExtra: true,
      extraPart: '缓冲器',
    },
    {
      modelName: '4512 双弹缓冲',
      category: '功能款',
      functionType: '双弹缓冲',
      aliasNames: JSON.stringify(['4512 双弹', '双弹', '双弹缓冲', '双弹阻尼', '4512B', '双弹簧缓冲', '双弹簧阻尼']),
      shortCode: '4512B',
      description: '双弹簧缓冲/阻尼版本',
      hasExtra: true,
      extraPart: '缓冲器',
    },
    {
      modelName: '4512 反弹',
      category: '功能款',
      functionType: '反弹',
      aliasNames: JSON.stringify(['反弹', '4512P']),
      shortCode: '4512P',
      description: '反弹功能版本',
      hasExtra: true,
      extraPart: '反弹器',
    },
    {
      modelName: '4509 单弹缓冲',
      category: '功能款',
      functionType: '单弹缓冲',
      aliasNames: JSON.stringify(['4509 单弹', '4509单弹缓冲', '4509单弹阻尼', '4510 单弹', '4510单弹', '4510A']),
      shortCode: '4510A',
      description: '4509单弹簧缓冲/阻尼版本',
      hasExtra: true,
      extraPart: '缓冲器',
    },
    {
      modelName: '4509 双弹缓冲',
      category: '功能款',
      functionType: '双弹缓冲',
      aliasNames: JSON.stringify(['4509 双弹', '4509双弹缓冲', '4509双弹阻尼', '4510 双弹', '4510双弹', '4510B']),
      shortCode: '4510B',
      description: '4509双弹簧缓冲/阻尼版本，也叫4510双弹系列',
      hasExtra: true,
      extraPart: '缓冲器',
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { modelName: p.modelName },
      update: {},
      create: p,
    })
  }
  console.log(`✅ ${products.length} 款产品型号已导入`)

  // ========== 3. 导入客户数据（约 60 家） ==========
  const customerNames = [
    '胡建军', '耿海俊', '吴波', '喻礼知', '林雄', '陈心园', '刘春明',
    '郭李超', '王栋栋', '杨博', '国成五金', '李海军', '马克军', '赵三芬',
    '刘晓光', '黄淋', '刘自博', '孙映光', '赵江', '程俊凯', '徐旭洲',
    '桂景烨', '孙登映新店', '许志强', '徐友', '伍从刚', '卢洋', '董军明',
    '张丽丽', '周科选', '水法五金', '王正茂', '路永波', '创晖', '程金成',
    '天津赵小姐', '苏东海', '林炳楼', '张晓燕', '广汇', '新起点', '木林森',
    '百盛五金', '孙登映老店', '王冰华', '王富军', '吴涛', '刘双喜', '刘奎',
    '刘杨', '蔡书鑫', '詹盛汉', '黄锴', '李祥龙', '艾美加', '冉建兵',
    'Winfred', '王磊', '陈学志', '田振岭', '何正周', '杜春霞', '朱成',
    '魏东', '李波', '志鸿家居', '丰达', '郑德生', '莫凤林', '刘杨',
  ]

  for (const name of customerNames) {
    await prisma.customer.upsert({
      where: { name },
      update: {},
      create: { name, status: '活跃', level: '普通' },
    })
  }
  console.log(`✅ ${customerNames.length} 家客户已导入`)

  // ========== 4. 导入客户包装偏好 ==========
  const packagingPreferences = [
    { customerName: '胡建军', productModel: '4512', outerBox: 'ablurn 彩箱', innerBag: 'ablurn 吸塑', labelReq: '贴 4512' },
    { customerName: '杨博', productModel: '4512 双弹缓冲', outerBox: '诺德牛皮箱', innerBag: '诺德平放袋', labelReq: '贴白色缓冲贴纸' },
    { customerName: '程俊凯', productModel: '4509 两珠', outerBox: 'BRUGBN 牛皮箱', innerBag: 'BRUGBN 袋装', labelReq: '贴绿色 G4512-54P' },
    { customerName: '天津赵小姐', productModel: '4512 双弹缓冲', outerBox: '品仕高彩箱', innerBag: '品仕高代言人彩袋', labelReq: '贴蓝色缓冲' },
    { customerName: '创晖', productModel: '4512 反弹', outerBox: '静音箱', innerBag: '空白袋装', labelReq: '出口正唛侧唛标签' },
    { customerName: '张晓燕', productModel: '4512 双弹缓冲', outerBox: '牛皮箱', innerBag: '晓燕15付彩袋装', labelReq: '贴二张晓燕牌对角不干胶' },
    { customerName: '张丽丽', productModel: '4512', outerBox: 'collcoll牛皮箱', innerBag: 'collcoll平放袋', labelReq: '贴4张不干胶(2代言人+2侧唛)' },
    { customerName: '许志强', productModel: '4512 双弹缓冲', outerBox: '德铂外箱', innerBag: '德铂代言人彩袋', labelReq: '贴代言人不干胶+蓝色缓冲不干胶' },
    { customerName: '林炳楼', productModel: '4512 双弹缓冲', outerBox: '静音牛皮箱', innerBag: '品仕高彩袋', labelReq: '贴蓝色缓冲' },
    { customerName: '水法五金', productModel: '4512', outerBox: '诺德牛皮箱', innerBag: '诺德吸塑', labelReq: null },
    { customerName: '王正茂', productModel: '4509 两珠', outerBox: '品仕高牛皮箱', innerBag: '品仕高蓝色平放彩袋装', labelReq: null },
    { customerName: '孙登映新店', productModel: '45079', outerBox: null, innerBag: null, labelReq: null },
    { customerName: '马克军', productModel: '4509 两珠', outerBox: 'ablurn彩箱', innerBag: 'ablurn吸塑', labelReq: null },
  ]

  for (const pref of packagingPreferences) {
    const customer = await prisma.customer.findUnique({ where: { name: pref.customerName } })
    const product = await prisma.product.findUnique({ where: { modelName: pref.productModel } })
    if (customer && product) {
      await prisma.customerPackaging.upsert({
        where: { customerId_productId: { customerId: customer.id, productId: product.id } },
        update: {
          outerBox: pref.outerBox,
          innerBag: pref.innerBag,
          labelRequirement: pref.labelReq,
        },
        create: {
          customerId: customer.id,
          productId: product.id,
          outerBox: pref.outerBox,
          innerBag: pref.innerBag,
          labelRequirement: pref.labelReq,
          piecesPerBox: 20,
        },
      })
    }
  }
  console.log(`✅ ${packagingPreferences.length} 条包装偏好已导入`)

  // ========== 5. 导入电镀桶容量数据 ==========
  const drumCapacities = [
    { model: '4512', size: 8, capacity: 50 },
    { model: '4512', size: 10, capacity: 38 },
    { model: '4512', size: 12, capacity: 35 },
    { model: '4512', size: 14, capacity: 33 },
    { model: '4512', size: 16, capacity: 30 },
    { model: '4512', size: 18, capacity: 25 },
    { model: '4512', size: 20, capacity: 25 },
    { model: '4512', size: 22, capacity: 18 },
    { model: '4512', size: 24, capacity: 18 },
  ]

  for (const dc of drumCapacities) {
    const product = await prisma.product.findUnique({ where: { modelName: dc.model } })
    if (product) {
      await prisma.drumInventory.upsert({
        where: { productId_sizeInch: { productId: product.id, sizeInch: dc.size } },
        update: { capacityPerBarrel: dc.capacity },
        create: {
          productId: product.id,
          sizeInch: dc.size,
          capacityPerBarrel: dc.capacity,
          currentBarrels: 0,
          totalPieces: 0,
        },
      })
    }
  }
  console.log(`✅ 电镀桶容量数据已导入`)

  // ========== 6. 导入不干胶标签品牌 ==========
  const labelBrands = ['老船木', '卡陌琦', 'collcoll', '图欧诺']
  for (const brand of labelBrands) {
    await prisma.labelInventory.upsert({
      where: { brand },
      update: {},
      create: {
        brand,
        currentStock: 0,
        safeStock: 100,
        status: '充足',
      },
    })
  }
  console.log(`✅ ${labelBrands.length} 个不干胶品牌已导入`)

  // ========== 7. 导入电镀桶容量规则（可配置规则表） ==========
  const capacityRules = [
    { sizeInch: 6, capacityPerBarrel: 50 },
    { sizeInch: 8, capacityPerBarrel: 50 },
    { sizeInch: 10, capacityPerBarrel: 38 },
    { sizeInch: 12, capacityPerBarrel: 35 },
    { sizeInch: 14, capacityPerBarrel: 33 },
    { sizeInch: 16, capacityPerBarrel: 30 },
    { sizeInch: 18, capacityPerBarrel: 25 },
    { sizeInch: 20, capacityPerBarrel: 25 },
    { sizeInch: 22, capacityPerBarrel: 18 },
    { sizeInch: 24, capacityPerBarrel: 18 },
  ]

  for (const rule of capacityRules) {
    await prisma.drumCapacityRule.upsert({
      where: { sizeInch: rule.sizeInch },
      update: { capacityPerBarrel: rule.capacityPerBarrel },
      create: rule,
    })
  }
  console.log(`✅ ${capacityRules.length} 条电镀桶容量规则已导入`)

  // ========== 8. 导入供应商 ==========
  await prisma.supplier.deleteMany({})
  const supplierNames = [
    { name: '带钢供应商', contact: '联系人A' },
    { name: '钢珠供应商', contact: '联系人B' },
    { name: '塑料配件供应商', contact: '联系人C' },
    { name: '阻尼器供应商', contact: '联系人D' },
    { name: '包装物料供应商', contact: '联系人E' },
    { name: '五金配件供应商', contact: '联系人F' },
  ]
  const createdSuppliers: any[] = []
  for (const s of supplierNames) {
    const sup = await prisma.supplier.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, contact: s.contact },
    })
    createdSuppliers.push(sup)
  }
  console.log(`✅ ${createdSuppliers.length} 个供应商已导入`)

  // 按名称建立查询表
  const supByName: Record<string, number> = {}
  createdSuppliers.forEach((s: any) => { supByName[s.name] = s.id })

  // ========== 9. 导入物料基础数据 ==========
  // 先清理旧物料数据，重新按备份资料建档
  await prisma.material.deleteMany({})
  console.log('🗑️ 旧物料数据已清理')

  const materials = [
    // ===== 原材料 =====
    { materialCode: 'RAW-001', name: '带钢（冷轧钢带）', category: '原材料', subCategory: '带钢', unit: '卷', supplierId: supByName['带钢供应商'] },

    // ===== 半成品（未组装的三节轨配件） =====
    { materialCode: 'SEMI-001', name: '外条（上轨）', category: '半成品', subCategory: '外条', unit: '桶', spec: '三节轨外轨' },
    { materialCode: 'SEMI-002', name: '中条（中轨）', category: '半成品', subCategory: '中条', unit: '桶', spec: '三节轨中轨' },
    { materialCode: 'SEMI-003', name: '小条（内轨/下轨）', category: '半成品', subCategory: '小条', unit: '桶', spec: '三节轨内轨' },

    // ===== 成品 =====
    { materialCode: 'FIN-001', name: '成品（未包装/散装）', category: '成品', subCategory: '未包装', unit: '副' },
    { materialCode: 'FIN-002', name: '成品（已包装）', category: '成品', subCategory: '已包装', unit: '副' },

    // ===== 钢珠（分为普通、精研、高硬精研三种等级，多种直径） =====
    // 普通钢珠
    { materialCode: 'BALL-001', name: '钢珠 4.72mm（普通）', category: '钢珠', subCategory: '普通', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.72 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-002', name: '钢珠 4.74mm（普通）', category: '钢珠', subCategory: '普通', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.74 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-003', name: '钢珠 4.75mm（普通）', category: '钢珠', subCategory: '普通', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.75 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-004', name: '钢珠 4.76mm（普通）', category: '钢珠', subCategory: '普通', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.76 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-005', name: '钢珠 4.78mm（普通）', category: '钢珠', subCategory: '普通', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.78 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-006', name: '钢珠 4.80mm（普通）', category: '钢珠', subCategory: '普通', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.80 }), supplierId: supByName['钢珠供应商'] },
    // 精研钢珠
    { materialCode: 'BALL-007', name: '钢珠 4.72mm（精研）', category: '钢珠', subCategory: '精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.72 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-008', name: '钢珠 4.74mm（精研）', category: '钢珠', subCategory: '精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.74 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-009', name: '钢珠 4.75mm（精研）', category: '钢珠', subCategory: '精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.75 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-010', name: '钢珠 4.76mm（精研）', category: '钢珠', subCategory: '精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.76 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-011', name: '钢珠 4.78mm（精研）', category: '钢珠', subCategory: '精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.78 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-012', name: '钢珠 4.80mm（精研）', category: '钢珠', subCategory: '精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.80 }), supplierId: supByName['钢珠供应商'] },
    // 高硬精研钢珠
    { materialCode: 'BALL-013', name: '钢珠 4.72mm（高硬精研）', category: '钢珠', subCategory: '高硬精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.72 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-014', name: '钢珠 4.74mm（高硬精研）', category: '钢珠', subCategory: '高硬精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.74 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-015', name: '钢珠 4.75mm（高硬精研）', category: '钢珠', subCategory: '高硬精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.75 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-016', name: '钢珠 4.76mm（高硬精研）', category: '钢珠', subCategory: '高硬精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.76 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-017', name: '钢珠 4.78mm（高硬精研）', category: '钢珠', subCategory: '高硬精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.78 }), supplierId: supByName['钢珠供应商'] },
    { materialCode: 'BALL-018', name: '钢珠 4.80mm（高硬精研）', category: '钢珠', subCategory: '高硬精研', unit: '包', spec: '26kg/包', attributes: JSON.stringify({ diameter: 4.80 }), supplierId: supByName['钢珠供应商'] },

    // ===== 塑料配件（以斤为单位） =====
    { materialCode: 'PLAS-001', name: 'M形塑料件', category: '塑料配件', subCategory: 'M形', unit: '斤', supplierId: supByName['塑料配件供应商'] },
    { materialCode: 'PLAS-002', name: '8形塑料件', category: '塑料配件', subCategory: '8形', unit: '斤', supplierId: supByName['塑料配件供应商'] },
    { materialCode: 'PLAS-003', name: '45鱼塑料件', category: '塑料配件', subCategory: '小鱼', unit: '斤', spec: '45鱼', supplierId: supByName['塑料配件供应商'] },
    { materialCode: 'PLAS-004', name: '40鱼塑料件', category: '塑料配件', subCategory: '小鱼', unit: '斤', spec: '40鱼', supplierId: supByName['塑料配件供应商'] },
    { materialCode: 'PLAS-005', name: '珠条', category: '塑料配件', subCategory: '珠条', unit: '斤', spec: '按寸计算长度', supplierId: supByName['塑料配件供应商'] },

    // ===== 阻尼器（缓冲器）和反弹器（以箱为单位，每箱有固定数量） =====
    { materialCode: 'DAMP-001', name: '单弹阻尼器（缓冲器）', category: '阻尼器', subCategory: '单弹', unit: '箱', spec: '单弹簧缓冲器·有不同颜色', attributes: JSON.stringify({ quantityPerBox: 400 }), supplierId: supByName['阻尼器供应商'] },
    { materialCode: 'DAMP-002', name: '双弹阻尼器（缓冲器）', category: '阻尼器', subCategory: '双弹', unit: '箱', spec: '双弹簧缓冲器·有不同颜色', attributes: JSON.stringify({ quantityPerBox: 500 }), supplierId: supByName['阻尼器供应商'] },
    { materialCode: 'DAMP-003', name: '反弹器', category: '阻尼器', subCategory: '反弹器', unit: '箱', spec: '反弹器', attributes: JSON.stringify({ quantityPerBox: 400 }), supplierId: supByName['阻尼器供应商'] },
    { materialCode: 'DAMP-004', name: '双弹簧阻尼弹簧', category: '阻尼器', subCategory: '弹簧配件', unit: '箱', supplierId: supByName['阻尼器供应商'] },

    // ===== 包装材料 - 纸箱·牛皮箱 =====
    { materialCode: 'PACK-001', name: '牛皮箱（通用·15副装）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '15副/箱' },
    { materialCode: 'PACK-002', name: '牛皮箱（通用·20副装）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-003', name: '品仕高蓝色平放牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱·双弹缓冲用' },
    { materialCode: 'PACK-004', name: '诺德平放牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-005', name: '静音箱（中性箱）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱·通用' },
    { materialCode: 'PACK-006', name: 'ablurn牛皮箱（黑色袋）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-007', name: 'ablurn牛皮箱（桔红色平放袋）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-008', name: 'ablurn牛皮箱（黑色平放袋）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-009', name: '图欧诺平放牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-010', name: 'Hatiseh平放牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-011', name: 'collcoll牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '15副/箱' },
    { materialCode: 'PACK-012', name: '杰迦JEGA牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '15副/箱' },
    { materialCode: 'PACK-013', name: '歌莱雅平放牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-014', name: 'Hettinch牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-015', name: '老船木牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-016', name: '卡陌琦平放牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-017', name: '布鲁格牛皮箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱·8寸例外' },
    // 8寸专用箱
    { materialCode: 'PACK-018', name: '8寸专用16寸箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '16寸箱装8寸产品·40副/箱或30副/箱' },

    // ===== 包装材料 - 纸箱·彩箱 =====
    { materialCode: 'PACK-019', name: '彩箱（通用·20副装）', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-020', name: '品仕高代言人彩箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-021', name: 'ablurn代言人彩箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-022', name: '刘福记彩箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },
    { materialCode: 'PACK-023', name: '芯山樱花彩箱', category: '包装材料', subCategory: '纸箱', unit: '个', spec: '20副/箱' },

    // ===== 包装材料 - 纸卡/插卡 =====
    { materialCode: 'PACK-024', name: '通用插卡（纸卡）', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-025', name: '品仕高代言人插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-026', name: '品仕高红色插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-027', name: '诺德插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-028', name: '锐耐插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-029', name: '刘福记插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-030', name: '芯山樱花插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-031', name: 'ablurn插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-032', name: '固柏雅插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },
    { materialCode: 'PACK-033', name: 'Hettinch插卡', category: '包装材料', subCategory: '纸卡', unit: '张' },

    // ===== 包装材料 - 吸塑袋 =====
    { materialCode: 'PACK-034', name: '吸塑袋（通用）', category: '包装材料', subCategory: '吸塑袋', unit: '个', spec: '各尺寸通用' },
    { materialCode: 'PACK-035', name: 'ablurn 4512吸塑', category: '包装材料', subCategory: '吸塑袋', unit: '个' },
    { materialCode: 'PACK-036', name: '诺德吸塑', category: '包装材料', subCategory: '吸塑袋', unit: '个' },
    { materialCode: 'PACK-037', name: '吸塑盒', category: '包装材料', subCategory: '吸塑袋', unit: '个', spec: '1副需2个·包装两头' },

    // ===== 包装材料 - 薄膜袋/彩袋 =====
    { materialCode: 'PACK-038', name: '薄膜袋（通用·卷）', category: '包装材料', subCategory: '彩袋', unit: '卷', spec: '按KG计算' },
    { materialCode: 'PACK-039', name: '品仕高代言人袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-040', name: '品仕高蓝色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-041', name: 'ablurn黑色袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-042', name: 'ablurn黑色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-043', name: 'ablurn桔红色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-044', name: 'ablurn代言人袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-045', name: '图欧诺代言人袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-046', name: '图欧诺无代言人袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-047', name: 'collcoll平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-048', name: '卡陌琦红色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-049', name: '卡陌琦橘红色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-050', name: '卡陌琦蓝色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-051', name: '老船木平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-052', name: '布鲁格袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-053', name: '歌莱雅平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-054', name: '诺德平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-055', name: 'Hatiseh白色平放袋', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-056', name: 'Hettinch袋', category: '包装材料', subCategory: '彩袋', unit: '卷', spec: 'iiihettch标识' },
    { materialCode: 'PACK-057', name: '晓燕15副彩袋装', category: '包装材料', subCategory: '彩袋', unit: '个', spec: '15副装' },
    { materialCode: 'PACK-058', name: '德铂代言人彩袋', category: '包装材料', subCategory: '彩袋', unit: '个' },
    { materialCode: 'PACK-059', name: 'BRUGBN袋装', category: '包装材料', subCategory: '彩袋', unit: '卷' },
    { materialCode: 'PACK-060', name: '空白袋装', category: '包装材料', subCategory: '彩袋', unit: '卷' },

    // ===== 包装材料 - 透明袋/透明膜 =====
    { materialCode: 'PACK-061', name: '透明袋', category: '包装材料', subCategory: '透明袋/膜', unit: '个' },
    { materialCode: 'PACK-062', name: '透明膜', category: '包装材料', subCategory: '透明袋/膜', unit: '卷' },

    // ===== 包装材料 - 不干胶（标签） =====
    { materialCode: 'PACK-063', name: '不干胶标签（通用）', category: '包装材料', subCategory: '不干胶', unit: '张', spec: '一箱贴两面' },
    { materialCode: 'PACK-064', name: '老船木品牌不干胶', category: '包装材料', subCategory: '不干胶', unit: '张', spec: '一箱贴2张·需网上订购' },
    { materialCode: 'PACK-065', name: '卡陌琦品牌不干胶', category: '包装材料', subCategory: '不干胶', unit: '张', spec: '一箱贴2张·需网上订购' },
    { materialCode: 'PACK-066', name: 'collcoll品牌不干胶', category: '包装材料', subCategory: '不干胶', unit: '张', spec: '一箱贴2张·需网上订购' },
    { materialCode: 'PACK-067', name: '图欧诺品牌不干胶', category: '包装材料', subCategory: '不干胶', unit: '张', spec: '一箱贴2张·需网上订购' },
    { materialCode: 'PACK-068', name: 'PVC盒', category: '包装材料', subCategory: '吸塑袋', unit: '个' },

    // ===== 配件 - 螺丝 =====
    { materialCode: 'ACC-001', name: '白螺丝（8粒/包）', category: '配件', subCategory: '螺丝', unit: '包', spec: '白色·8粒装', supplierId: supByName['五金配件供应商'] },
    { materialCode: 'ACC-002', name: '白螺丝（12粒/包）', category: '配件', subCategory: '螺丝', unit: '包', spec: '白色·12粒装', supplierId: supByName['五金配件供应商'] },
    { materialCode: 'ACC-003', name: '黑螺丝（8粒/包）', category: '配件', subCategory: '螺丝', unit: '包', spec: '黑色·8粒装', supplierId: supByName['五金配件供应商'] },
    { materialCode: 'ACC-004', name: '黑螺丝（12粒/包）', category: '配件', subCategory: '螺丝', unit: '包', spec: '黑色·12粒装', supplierId: supByName['五金配件供应商'] },
  ]

  for (const m of materials) {
    await prisma.material.upsert({
      where: { materialCode: m.materialCode },
      update: { name: m.name, category: m.category, subCategory: m.subCategory, unit: m.unit, spec: m.spec, attributes: m.attributes, supplierId: m.supplierId },
      create: m,
    })
  }
  console.log(`✅ ${materials.length} 条物料基础数据已导入`)

  // 批量设置分类的默认供应商
  await prisma.material.updateMany({
    where: { category: '包装材料', supplierId: null },
    data: { supplierId: supByName['包装物料供应商'] },
  })
  console.log('✅ 包装材料供应商已批量关联')

  console.log('\n🎉 种子数据导入完成！')
  console.log('📧 登录账号: admin / admin123')
  console.log('🤖 智能体账号: agent / agent123')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据导入失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })