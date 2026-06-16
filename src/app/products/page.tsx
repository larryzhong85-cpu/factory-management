'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Select, Input, InputNumber, message, Space, Tabs,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

const { Title } = Typography

const statusColors: Record<string, string> = {
  '充足': 'green', '预警': 'orange', '不足': 'red',
}

export default function ProductInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [adjustModalVisible, setAdjustModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [adjForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadData()
    api.getProducts().then(setProducts).catch(() => {})
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getInventory({ itemType: '成品' })
      setInventory(data)
    } catch (_) {}
    setLoading(false)
  }

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await api.updateInventory({
        itemType: '成品',
        productId: values.productId,
        sizeInch: values.sizeInch,
        brand: values.brand || null,
        quantity: values.quantity || 0,
        unit: values.unit || '件',
        safeStock: values.safeStock || 0,
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadData()
    } catch (err: any) { message.error(err.message) }
  }

  const handleAdjust = async () => {
    const values = await adjForm.validateFields()
    try {
      await api.updateInventory({
        id: selectedItem.id,
        quantityChange: values.quantityChange,
        notes: values.notes,
      })
      message.success('库存更新成功')
      setAdjustModalVisible(false)
      loadData()
    } catch (err: any) { message.error(err.message) }
  }

  const filteredInventory = activeTab === 'all' ? inventory
    : inventory.filter((i) => i.status === activeTab)

  const columns = [
    {
      title: '产品型号', key: 'product', width: 150,
      render: (_: any, record: any) => <strong>{record.product?.modelName || record.itemName}</strong>,
    },
    { title: '尺寸', dataIndex: 'sizeInch', key: 'size', width: 80, render: (s: number) => s ? `${s}寸` : '通用' },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100, render: (b: string) => b || '-' },
    { title: '当前库存', dataIndex: 'quantity', key: 'qty', width: 100, render: (v: number) => <strong>{v}</strong> },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '安全库存', dataIndex: 'safeStock', key: 'safe', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    { title: '最后入库', dataIndex: 'lastInDate', key: 'lastIn', width: 110, render: (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '-' },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => {
          setSelectedItem(record)
          setAdjustModalVisible(true)
          adjForm.setFieldsValue({ quantityChange: 0 })
        }}>出入库</Button>
      ),
    },
  ]

  const tabItems = [
    { key: 'all', label: `全部 (${inventory.length})` },
    { key: '充足', label: `充足 (${inventory.filter(i => i.status === '充足').length})` },
    { key: '预警', label: `预警 (${inventory.filter(i => i.status === '预警').length})` },
    { key: '不足', label: `不足 (${inventory.filter(i => i.status === '不足').length})` },
  ]

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>📦 成品/半成品库存</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateModalVisible(true); form.resetFields() }}>
          新增成品库存
        </Button>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          dataSource={filteredInventory}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
        />
      </Card>

      {/* 新增成品库存 Modal */}
      <Modal title="新增成品库存" open={createModalVisible} onOk={handleCreate} onCancel={() => setCreateModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label="产品型号" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="选择产品型号"
              filterOption={(input, option) => (option?.label as string || '').includes(input)}
              options={products.map((p) => ({ value: p.id, label: p.modelName }))}
            />
          </Form.Item>
          <Form.Item name="sizeInch" label="尺寸" rules={[{ required: true }]}>
            <Select placeholder="选择尺寸" options={[6,8,10,12,14,16,18,20,22,24].map(s => ({ value: s, label: `${s}寸` }))} />
          </Form.Item>
          <Form.Item name="brand" label="品牌"><Input placeholder="可选" /></Form.Item>
          <Space>
            <Form.Item name="quantity" label="初始数量" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="unit" label="单位" initialValue="件">
              <Select style={{ width: 80 }} options={[{ value: '件', label: '件' }, { value: '副', label: '副' }]} />
            </Form.Item>
          </Space>
          <Form.Item name="safeStock" label="安全库存">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 出入库 Modal */}
      <Modal title={`出入库 - ${selectedItem?.product?.modelName || selectedItem?.itemName || ''}`}
        open={adjustModalVisible} onOk={handleAdjust} onCancel={() => setAdjustModalVisible(false)}
      >
        <Form form={adjForm} layout="vertical">
          <Form.Item label="当前库存"><strong>{selectedItem?.quantity}</strong></Form.Item>
          <Form.Item name="quantityChange" label="变动数量（正数=入库，负数=出库）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  )
}
