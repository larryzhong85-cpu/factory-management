'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Tabs, Table, Tag, Typography, Space, Button, Modal, Form, Input, Select, Switch, message, InputNumber, Divider, Row, Col,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

const { Title } = Typography
const { TextArea } = Input

// ==================== 产品型号 Tab ====================
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    setLoading(true)
    try { setProducts(await api.getProducts()) }
    catch (err: any) { message.error(err.message) }
    setLoading(false)
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    form.setFieldsValue({
      ...product,
      aliasNames: (product.aliasNames || []).join(', '),
      commonSizes: (product.commonSizes || []).join(', '),
    })
    setModalVisible(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const data = {
      ...values,
      aliasNames: values.aliasNames ? values.aliasNames.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean) : [],
      commonSizes: values.commonSizes ? values.commonSizes.split(/[,，]/).filter(Boolean).map(Number) : [10, 12, 14, 16, 18, 20],
    }
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data)
        message.success('更新成功')
      } else {
        await api.createProduct(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadProducts()
    } catch (err: any) { message.error(err.message) }
  }

  const columns = [
    { title: '主型号', dataIndex: 'modelName', key: 'modelName', width: 150, render: (n: string) => <strong>{n}</strong> },
    { title: '类型', dataIndex: 'category', key: 'category', width: 80, render: (c: string) => <Tag color={c === '普通款' ? 'blue' : 'purple'}>{c}</Tag> },
    { title: '简写', dataIndex: 'shortCode', key: 'shortCode', width: 80, render: (s: string) => s ? <Tag>{s}</Tag> : '-' },
    {
      title: '别名', dataIndex: 'aliasNames', key: 'aliasNames',
      render: (aliases: string[]) => (
        <Space wrap size={4}>
          {(aliases || []).map((a, i) => <Tag key={i} color="default">{a}</Tag>)}
        </Space>
      ),
    },
    { title: '功能类型', dataIndex: 'functionType', key: 'functionType', width: 100, render: (f: string) => f ? <Tag color="orange">{f}</Tag> : '-' },
    { title: '附加件', dataIndex: 'extraPart', key: 'extraPart', width: 80, render: (e: string) => e || '-' },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, record: any) => <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>,
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={5}>产品型号列表</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增产品型号</Button>
      </div>
      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} size="middle" />

      <Modal title={editingProduct ? '编辑产品型号' : '新增产品型号'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={640}>
        <Form form={form} layout="vertical">
          <Form.Item name="modelName" label="主型号" rules={[{ required: true }]}><Input placeholder="如: 4512 双弹缓冲" /></Form.Item>
          <Form.Item name="category" label="产品类型" rules={[{ required: true }]}>
            <Select options={[{ value: '普通款', label: '普通款' }, { value: '功能款', label: '功能款' }]} />
          </Form.Item>
          <Form.Item name="functionType" label="功能类型">
            <Select allowClear options={[
              { value: '单弹缓冲', label: '单弹缓冲' }, { value: '双弹缓冲', label: '双弹缓冲' }, { value: '反弹', label: '反弹' },
            ]} />
          </Form.Item>
          <Form.Item name="shortCode" label="简写"><Input placeholder="如: 4512B" /></Form.Item>
          <Form.Item name="aliasNames" label="别名"><Input placeholder="多个别名用逗号隔开" /></Form.Item>
          <Space>
            <Form.Item name="hasExtra" label="附加件" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="extraPart" label="附加件名称"><Input placeholder="如: 缓冲器" /></Form.Item>
          </Space>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="commonSizes" label="常用尺寸"><Input placeholder="多个尺寸用逗号隔开，如: 10,12,14,16,18,20" /></Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// ==================== Material CRUD Tab ====================
function MaterialTab({ category, codePrefix, subCategory }: { category: string; codePrefix: string; subCategory?: string }) {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => { loadMaterials(); loadSuppliers() }, [search, subCategory])

  const loadSuppliers = async () => {
    try { setSuppliers(await api.getSuppliers()) } catch (_) {}
  }

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const params: any = { category }
      if (subCategory) params.subCategory = subCategory
      if (search) params.search = search
      setMaterials(await api.getMaterials(params))
    } catch (_) {}
    setLoading(false)
  }

  const handleCreate = () => {
    setEditing(null)
    form.resetFields()
    // 自动生成物料编码
    const existing = materials.filter(m => m.materialCode.startsWith(codePrefix))
    const maxNum = existing.reduce((max, m) => {
      const num = parseInt(m.materialCode.replace(`${codePrefix}-`, ''), 10)
      return num > max ? num : max
    }, 0)
    form.setFieldsValue({ materialCode: `${codePrefix}-${String(maxNum + 1).padStart(3, '0')}` })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditing(record)
    const formData = { ...record }
    try { formData.attributes = JSON.parse(record.attributes || '{}') } catch { formData.attributes = {} }
    form.setFieldsValue(formData)
    setModalVisible(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    // 将 attributes 对象转为 JSON 字符串
    if (values.attributes && typeof values.attributes === 'object') {
      const clean = Object.fromEntries(Object.entries(values.attributes).filter(([_, v]) => v !== undefined && v !== '' && v !== false))
      values.attributes = JSON.stringify(clean)
    } else if (!values.attributes) {
      values.attributes = '{}'
    }
    try {
      if (editing) {
        await api.updateMaterial(editing.id, values)
        message.success('更新成功')
      } else {
        await api.createMaterial(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadMaterials()
    } catch (err: any) { message.error(err.message) }
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: `确认删除物料「${record.name}」？`,
      content: '删除后该物料将不再显示',
      onOk: async () => {
        await api.deleteMaterial(record.id)
        message.success('已删除')
        loadMaterials()
      },
    })
  }

  // ===== 分类专属属性定义 =====
  interface AttrField { label: string; key: string; type: 'input' | 'number' | 'select' | 'switch'; options?: string[]; suffix?: string }
  const attrSchemas: Record<string, Record<string, AttrField[]>> = {
    '原材料': { '带钢': [
      { label: '材质等级', key: 'grade', type: 'input' },
      { label: '厚度(mm)', key: 'thickness', type: 'number' }, { label: '宽度(mm)', key: 'width', type: 'number' },
    ]},
    '钢珠': {
      '普通': [{ label: '直径(mm)', key: 'diameter', type: 'number' }],
      '精研': [{ label: '直径(mm)', key: 'diameter', type: 'number' }],
      '高硬精研': [{ label: '直径(mm)', key: 'diameter', type: 'number' }],
    },
    '塑料配件': { 'M形': [{ label: '材质', key: 'material', type: 'input' }, { label: '颜色', key: 'color', type: 'input' }],
      '8形': [{ label: '材质', key: 'material', type: 'input' }, { label: '颜色', key: 'color', type: 'input' }],
      '小鱼': [{ label: '材质', key: 'material', type: 'input' }, { label: '颜色', key: 'color', type: 'input' }],
      '珠条': [{ label: '材质', key: 'material', type: 'input' }, { label: '长度(寸)', key: 'length', type: 'number' }],
    },
    '半成品': {
      '外条': [{ label: '适配产品型号', key: 'fitModel', type: 'input' }],
      '中条': [{ label: '适配产品型号', key: 'fitModel', type: 'input' }],
      '小条': [{ label: '适配产品型号', key: 'fitModel', type: 'input' }],
    },
    '成品': {
      '未包装': [],
      '已包装': [],
    },
    '阻尼器': {
      '单弹': [{ label: '颜色', key: 'color', type: 'input' }, { label: '每箱数量(个)', key: 'quantityPerBox', type: 'number' }, { label: '适配型号', key: 'compatibleModels', type: 'input' }],
      '双弹': [{ label: '颜色', key: 'color', type: 'input' }, { label: '每箱数量(个)', key: 'quantityPerBox', type: 'number' }, { label: '适配型号', key: 'compatibleModels', type: 'input' }],
      '反弹器': [{ label: '颜色', key: 'color', type: 'input' }, { label: '每箱数量(个)', key: 'quantityPerBox', type: 'number' }, { label: '适配型号', key: 'compatibleModels', type: 'input' }],
      '弹簧配件': [{ label: '规格', key: 'specField', type: 'input' }],
    },
    '包装材料': {
      '纸箱': [{ label: '装箱规格', key: 'piecesPerBox', type: 'number', suffix: '副/箱' }],
      '纸卡': [{ label: '尺寸', key: 'size', type: 'input' }],
      '吸塑袋': [{ label: '尺寸', key: 'size', type: 'input' }],
      '彩袋': [{ label: '类型', key: 'bagType', type: 'select', options: ['平放', '叠放/非平放'] }, { label: '颜色', key: 'color', type: 'input' }],
      '透明袋/膜': [{ label: '厚度', key: 'thickness', type: 'input' }, { label: '尺寸', key: 'size', type: 'input' }],
      '不干胶': [{ label: '尺寸', key: 'size', type: 'input' }, { label: '需网上订购', key: 'needsOrder', type: 'switch' }],
    },
    '配件': { '螺丝': [
      { label: '颜色', key: 'color', type: 'select', options: ['白色', '黑色'] }, { label: '粒数/包', key: 'piecesPerPack', type: 'number' },
    ]},
  }

  /** 获取当前子分类对应的属性字段 */
  const curSub = subCategory || (materials[0]?.subCategory) || ''
  const curFields: AttrField[] = (attrSchemas[category]?.[curSub]) || []

  /** 解析 attributes JSON */
  const parseAttrs = (record: any) => {
    try { return JSON.parse(record.attributes || '{}') } catch { return {} }
  }

  /** 动态列：从 attributes 中取值 */
  const attrColumns = curFields.filter(f => f.key !== 'supplier').map(f => ({
    title: f.label, key: f.key, width: 100,
    render: (_: any, record: any) => {
      const attrs = parseAttrs(record)
      const val = attrs[f.key]
      if (val === undefined || val === null || val === '') return '-'
      if (f.type === 'switch') return val ? '是' : '否'
      return String(val) + (f.suffix || '')
    },
  }))

  const showBrand = category === '包装材料'

  const columns: any[] = [
    { title: '编码', dataIndex: 'materialCode', key: 'code', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150, render: (n: string) => <strong>{n}</strong> },
    { title: '子分类', dataIndex: 'subCategory', key: 'sub', width: 80, render: (s: string) => s ? <Tag>{s}</Tag> : '-' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 50 },
    { title: '规格', dataIndex: 'spec', key: 'spec', width: 100, render: (s: string) => s || '-' },
    ...(showBrand ? [{ title: '品牌', dataIndex: 'brand', key: 'brand', width: 100, render: (b: string) => b || '-' }] : []),
    { title: '供应商', key: 'supplier', width: 100, render: (_: any, record: any) => record.supplier?.name || '-' },
    { title: '单价', dataIndex: 'price', key: 'price', width: 70, render: (p: number) => p ? `¥${p}` : '-' },
    ...attrColumns,
    {
      title: '操作', key: 'action', width: 120, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  const subCategoryOptions = (() => {
    switch (category) {
      case '原材料': return [{ value: '带钢', label: '带钢' }]
      case '半成品': return [{ value: '外条', label: '外条（上轨）' }, { value: '中条', label: '中条（中轨）' }, { value: '小条', label: '小条（内轨）' }]
      case '成品': return [{ value: '未包装', label: '未包装' }, { value: '已包装', label: '已包装' }]
      case '钢珠': return [{ value: '普通', label: '普通' }, { value: '精研', label: '精研' }, { value: '高硬精研', label: '高硬精研' }]
      case '塑料配件': return [
        { value: 'M形', label: 'M形' }, { value: '8形', label: '8形' },
        { value: '小鱼', label: '小鱼' }, { value: '珠条', label: '珠条' },
      ]
      case '阻尼器': return [
        { value: '单弹', label: '单弹' }, { value: '双弹', label: '双弹' },
        { value: '反弹器', label: '反弹器' },
      ]
      case '包装材料': return [
        { value: '纸箱', label: '纸箱' }, { value: '纸卡', label: '纸卡' },
        { value: '吸塑袋', label: '吸塑袋' }, { value: '彩袋', label: '彩袋' },
        { value: '透明袋/膜', label: '透明袋/膜' }, { value: '不干胶', label: '不干胶' },
      ]
      case '配件': return [{ value: '螺丝', label: '螺丝' }]
      default: return []
    }
  })()

  /** 渲染属性字段对应的表单控件 */
  const renderAttrField = (f: AttrField) => {
    const name = ['attributes', f.key]
    switch (f.type) {
      case 'input': return <Input placeholder={`输入${f.label}`} />
      case 'number': return <InputNumber min={0} style={{ width: '100%' }} placeholder={`输入${f.label}`} />
      case 'select': return <Select options={(f.options || []).map(o => ({ value: o, label: o }))} placeholder={`选择${f.label}`} allowClear />
      case 'switch': return <Switch />
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Input.Search
            placeholder="搜索物料名称/编码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={loadMaterials}
            style={{ width: 250 }}
            allowClear
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增物料</Button>
      </div>
      <Table dataSource={materials} columns={columns} rowKey="id" loading={loading} size="middle" scroll={{ x: 'max-content' }} />

      <Modal
        title={editing ? '编辑物料' : '新增物料'} open={modalVisible} onOk={handleSave}
        onCancel={() => setModalVisible(false)} width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="materialCode" label="物料编码" rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="物料名称" rules={[{ required: true }]}>
            <Input placeholder="输入物料名称" />
          </Form.Item>
          <Form.Item name="subCategory" label="子分类">
            <Select options={subCategoryOptions} allowClear placeholder="选择子分类" />
          </Form.Item>
          <Space>
            <Form.Item name="unit" label="单位" initialValue="个">
              <Select style={{ width: 100 }} options={[
                { value: '个', label: '个' }, { value: '件', label: '件' }, { value: '副', label: '副' },
                { value: '张', label: '张' }, { value: '卷', label: '卷' }, { value: '包', label: '包' },
                { value: '斤', label: '斤' }, { value: '桶', label: '桶' }, { value: '箱', label: '箱' },
              ]} />
            </Form.Item>
            <Form.Item name="price" label="单价（元）">
              <InputNumber min={0} step={0.01} style={{ width: 140 }} />
            </Form.Item>
          </Space>
          <Form.Item name="spec" label="规格描述"><Input placeholder="如: 300*200*150mm·20副/箱" /></Form.Item>
          {showBrand && (
            <Form.Item name="brand" label="品牌"><Input placeholder="如为空则通用" /></Form.Item>
          )}
          <Form.Item name="supplierId" label="供应商">
            <Select
              showSearch
              placeholder="选择供应商"
              allowClear
              optionFilterProp="label"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <Button type="link" icon={<PlusOutlined />} onClick={() => setSupplierModalOpen(true)} size="small" style={{ padding: '0 8px 4px' }}>
                    管理供应商
                  </Button>
                </>
              )}
              options={suppliers.map((s: any) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>

          {/* 分类专属属性 */}
          {curFields.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0', fontSize: 13 }} plain>
                📋 {category}（{curSub}）专属属性
              </Divider>
              <Row gutter={16}>
                {curFields.map(f => (
                  <Col span={f.type === 'switch' ? 8 : 12} key={f.key}>
                    <Form.Item
                      name={['attributes', f.key]}
                      label={f.label + (f.suffix ? `（${f.suffix}）` : '')}
                      valuePropName={f.type === 'switch' ? 'checked' : undefined}
                    >
                      {renderAttrField(f)}
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Form>
      </Modal>

      {/* 供应商管理弹窗 */}
      <SupplierManagementModal
        open={supplierModalOpen}
        onClose={() => { setSupplierModalOpen(false); loadSuppliers() }}
      />
    </>
  )
}

// ==================== 包装材料 Tab（含子分类） ====================
function PackagingMaterialsTab() {
  const subTabs = [
    { key: '', label: '全部' },
    { key: '纸箱', label: '纸箱' },
    { key: '纸卡', label: '纸卡/插卡' },
    { key: '吸塑袋', label: '吸塑袋' },
    { key: '彩袋', label: '彩袋/薄膜袋' },
    { key: '透明袋/膜', label: '透明袋/膜' },
    { key: '不干胶', label: '不干胶' },
  ]
  const [activeSub, setActiveSub] = useState('')

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Tabs size="small" activeKey={activeSub} onChange={setActiveSub} items={subTabs.map(t => ({
          key: t.key,
          label: t.label,
          children: null as any,
        }))} />
      </div>
      <MaterialTab category="包装材料" codePrefix="PACK" subCategory={activeSub || undefined} />
    </>
  )
}

// ==================== 供应商管理弹窗 ====================
function SupplierManagementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => { if (open) loadSuppliers() }, [open])

  const loadSuppliers = async () => {
    try { setSuppliers(await api.getSuppliers()) } catch (_) {}
  }

  const resetForm = () => {
    setEditingSupplier(null)
    setName('')
    setContact('')
    setPhone('')
  }

  const handleSave = async () => {
    if (!name.trim()) { message.warning('请输入供应商名称'); return }
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, { name: name.trim(), contact, phone })
        message.success('已更新')
      } else {
        await api.createSupplier({ name: name.trim(), contact, phone })
        message.success('已创建')
      }
      resetForm()
      loadSuppliers()
    } catch (err: any) { message.error(err.message) }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除此供应商？',
      content: '删除后相关物料将失去供应商关联',
      onOk: async () => {
        await api.deleteSupplier(id)
        message.success('已删除')
        loadSuppliers()
      },
    })
  }

  const handleEdit = (s: any) => {
    setEditingSupplier(s)
    setName(s.name)
    setContact(s.contact || '')
    setPhone(s.phone || '')
  }

  return (
    <Modal title="供应商管理" open={open} onCancel={() => { resetForm(); onClose() }} footer={null} width={520}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Input placeholder="供应商名称" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 160 }} />
        <Input placeholder="联系人" value={contact} onChange={(e) => setContact(e.target.value)} style={{ width: 100 }} />
        <Input placeholder="电话" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: 120 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleSave}>
          {editingSupplier ? '更新' : '添加'}
        </Button>
        {editingSupplier && <Button onClick={resetForm}>取消编辑</Button>}
      </div>
      <Table
        dataSource={suppliers}
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          { title: '名称', dataIndex: 'name', key: 'name' },
          { title: '联系人', dataIndex: 'contact', key: 'contact', render: (v: string) => v || '-' },
          { title: '电话', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
          {
            title: '操作', key: 'action', width: 120,
            render: (_: any, record: any) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
                <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  )
}

// ==================== 主页面 ====================
export default function MaterialsPage() {
  return (
    <AppLayout>
      <Title level={4}>📋 物料基础信息</Title>
      <Card>
        <Tabs defaultActiveKey="products" items={[
          {
            key: 'products',
            label: '📦 产品型号',
            children: <ProductsTab />,
          },
          {
            key: 'raw',
            label: '🏗️ 原材料',
            children: <MaterialTab category="原材料" codePrefix="RAW" />,
          },
          {
            key: 'semi',
            label: '🏗️ 半成品',
            children: <MaterialTab category="半成品" codePrefix="SEMI" />,
          },
          {
            key: 'finished',
            label: '📦 成品',
            children: <MaterialTab category="成品" codePrefix="FIN" />,
          },
          {
            key: 'balls',
            label: '🔮 钢珠',
            children: <MaterialTab category="钢珠" codePrefix="BALL" />,
          },
          {
            key: 'plastic',
            label: '🔩 塑料配件',
            children: <MaterialTab category="塑料配件" codePrefix="PLAS" />,
          },
          {
            key: 'dampers',
            label: '🔄 阻尼器',
            children: <MaterialTab category="阻尼器" codePrefix="DAMP" />,
          },
          {
            key: 'packaging',
            label: '📦 包装材料',
            children: <PackagingMaterialsTab />,
          },
          {
            key: 'acc',
            label: '🔧 配件',
            children: <MaterialTab category="配件" codePrefix="ACC" />,
          },
        ]} />
      </Card>
    </AppLayout>
  )
}
