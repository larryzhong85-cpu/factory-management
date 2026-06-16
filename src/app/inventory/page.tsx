'use client'

import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Typography, Tabs, Button, Modal, Form, Input, InputNumber, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

const { Title } = Typography

const statusColors: Record<string, string> = {
  '充足': 'green', '预警': 'orange', '不足': 'red',
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [adjustModalVisible, setAdjustModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [adjForm] = Form.useForm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try { setInventory(await api.getInventory()) } catch (_) {}
    setLoading(false)
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

  const columns = [
    { title: '物料名称', dataIndex: 'itemName', key: 'item', width: 180 },
    { title: '类型', dataIndex: 'itemType', key: 'type', width: 80, render: (t: string) => <Tag>{t}</Tag> },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100, render: (b: string) => b || '-' },
    { title: '尺寸', dataIndex: 'sizeInch', key: 'size', width: 60, render: (s: number) => s ? `${s}寸` : '-' },
    { title: '当前库存', dataIndex: 'quantity', key: 'qty', width: 100, render: (v: number) => <strong>{v}</strong> },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '安全库存', dataIndex: 'safeStock', key: 'safe', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => {
          setSelectedItem(record)
          setAdjustModalVisible(true)
          adjForm.setFieldsValue({ quantityChange: 0 })
        }}>
          出入库
        </Button>
      ),
    },
  ]

  const filterByType = (type: string) => inventory.filter((i) => i.itemType === type)

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>📊 库存管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setModalVisible(true); form.resetFields() }}>
          新增库存
        </Button>
      </div>

      <Card>
        <Tabs defaultActiveKey="all" items={[
          { key: 'all', label: '全部', children: <Table dataSource={inventory} columns={columns} rowKey="id" loading={loading} size="middle" /> },
          { key: '成品', label: '成品', children: <Table dataSource={filterByType('成品')} columns={columns} rowKey="id" size="small" /> },
          { key: '包装', label: '包装材料', children: <Table dataSource={filterByType('包装')} columns={columns} rowKey="id" size="small" /> },
          { key: '五金', label: '五金配件', children: <Table dataSource={filterByType('五金')} columns={columns} rowKey="id" size="small" /> },
        ]} />
      </Card>

      <Modal title="新增库存" open={modalVisible}
        onOk={async () => {
          const values = await form.validateFields()
          await api.updateInventory(values)
          message.success('创建成功')
          setModalVisible(false)
          loadData()
        }}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="itemName" label="物料名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="itemType" label="类型" rules={[{ required: true }]}>
            <Select options={[
              { value: '成品', label: '成品' },
              { value: '包装', label: '包装材料' },
              { value: '五金', label: '五金配件' },
              { value: '贴纸', label: '不干胶' },
            ]} />
          </Form.Item>
          <Form.Item name="quantity" label="初始数量"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="safeStock" label="安全库存"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="brand" label="品牌"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`出入库操作 - ${selectedItem?.itemName || ''}`} open={adjustModalVisible}
        onOk={handleAdjust}
        onCancel={() => setAdjustModalVisible(false)}
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