'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Typography, Button, Modal, Form, Input, InputNumber, Select, message, Space, Row, Col, Divider, Alert,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import { AVAILABLE_SIZES, PACKAGING_RULES } from '@/lib/constants'

const { Title, Text } = Typography

// ==================== 容量规则Tab ====================
function CapacityRulesSection({ onChanged }: { onChanged: () => void }) {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()

  const loadRules = async () => {
    setLoading(true)
    try { setRules(await api.getDrumCapacityRules()) }
    catch (_) {}
    setLoading(false)
  }

  useEffect(() => { loadRules() }, [])

  const handleCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      await api.saveDrumCapacityRule(values)
      message.success(editing ? '更新成功' : '创建成功')
      setModalVisible(false)
      loadRules()
      onChanged()
    } catch (err: any) { message.error(err.message) }
  }

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: `确认删除 ${record.sizeInch}寸 容量规则？`,
      onOk: async () => {
        await api.deleteDrumCapacityRule(record.id)
        message.success('已删除')
        loadRules()
        onChanged()
      },
    })
  }

  const columns = [
    { title: '尺寸', dataIndex: 'sizeInch', key: 'size', width: 100, render: (s: number) => <strong>{s}寸</strong> },
    { title: '容量(件/桶)', dataIndex: 'capacityPerBarrel', key: 'capacity', width: 140, render: (c: number) => <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>{c}</span> },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <Card title="📏 容量规则（可配置）" size="small" style={{ marginBottom: 16 }} extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreate}>新增规则</Button>}
    >
      <Table dataSource={rules} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />

      <Modal title={editing ? '编辑容量规则' : '新增容量规则'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="sizeInch" label="尺寸(寸)" rules={[{ required: true }]}>
            <Select
              disabled={!!editing}
              options={AVAILABLE_SIZES.map(s => ({ value: s, label: `${s}寸` }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="capacityPerBarrel" label="每桶容量(件)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

// ==================== 计算器 ====================
function CalculatorModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible) {
      api.getProducts().then(setProducts).catch(() => {})
      setResult(null)
    }
  }, [visible])

  const handleCalculate = async () => {
    const values = await form.validateFields()
    try {
      const rules = await api.getDrumCapacityRules()
      const rule = rules.find((r: any) => r.sizeInch === values.sizeInch)
      const capacity = rule?.capacityPerBarrel || 25
      const totalPieces = values.barrels * capacity

      // 计算箱数：根据品牌/尺寸确定每箱件数
      const product = products.find((p: any) => p.id === values.productId)
      let piecesPerBox = PACKAGING_RULES.DEFAULT_PIECES_PER_BOX
      if (values.sizeInch === 8) piecesPerBox = PACKAGING_RULES.SIZE_8.DEFAULT_PIECES
      if (product && PACKAGING_RULES.SPECIAL_15_BRANDS.includes(product.shortCode || '')) piecesPerBox = 15

      const boxes = Math.ceil(totalPieces / piecesPerBox)

      setResult({
        productName: product?.modelName || '未知',
        sizeInch: values.sizeInch,
        barrels: values.barrels,
        capacity,
        totalPieces,
        piecesPerBox,
        boxes,
      })
    } catch (err: any) {
      message.error(err.message)
    }
  }

  return (
    <Modal title="🧮 未包装成品计算器" open={visible} onCancel={onClose} footer={null} width={520}>
      <Form form={form} layout="vertical">
        <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
          <Select showSearch placeholder="选择产品型号" filterOption={(input, option) => (option?.label as string || '').includes(input)}
            options={products.map(p => ({ value: p.id, label: p.modelName }))} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sizeInch" label="尺寸" rules={[{ required: true }]}>
              <Select options={AVAILABLE_SIZES.map(s => ({ value: s, label: `${s}寸` }))} placeholder="选择尺寸" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="barrels" label="桶数" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="输入桶数" />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" onClick={handleCalculate} block size="large">计算</Button>
      </Form>

      {result && (
        <>
          <Divider />
          <Alert
            type="success"
            message="计算结果"
            description={
              <Space direction="vertical" size={4}>
                <Text><strong>{result.productName}</strong> - {result.sizeInch}寸</Text>
                <Text>{result.barrels} 桶 × {result.capacity} 件/桶 = <Text strong style={{ fontSize: 18, color: '#1677ff' }}>{result.totalPieces}</Text> 件</Text>
                <Text>每箱 {result.piecesPerBox} 件 → 约 <Text strong style={{ fontSize: 18, color: '#52c41a' }}>{result.boxes}</Text> 箱</Text>
              </Space>
            }
          />
        </>
      )}
    </Modal>
  )
}

// ==================== 电镀桶库存 ====================
function DrumInventorySection() {
  const [drums, setDrums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [form] = Form.useForm()

  const loadDrums = async () => {
    setLoading(true)
    try {
      const [drumData, productData, ruleData] = await Promise.all([
        api.getDrums(),
        api.getProducts(),
        api.getDrumCapacityRules(),
      ])
      setDrums(drumData)
      setProducts(productData)
      setRules(ruleData)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { loadDrums() }, [])

  const handleAddDrum = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSaveDrum = async () => {
    const values = await form.validateFields()
    const rule = rules.find((r: any) => r.sizeInch === values.sizeInch)
    const capacity = rule?.capacityPerBarrel || 25
    try {
      await api.updateDrum({
        productId: values.productId,
        sizeInch: values.sizeInch,
        currentBarrels: values.currentBarrels,
        capacityPerBarrel: capacity,
      })
      message.success('保存成功')
      setModalVisible(false)
      loadDrums()
    } catch (err: any) { message.error(err.message) }
  }

  const columns = [
    { title: '产品', dataIndex: ['product', 'modelName'], key: 'product', width: 160, render: (n: string) => <strong>{n}</strong> },
    { title: '尺寸', dataIndex: 'sizeInch', key: 'size', width: 80, render: (s: number) => `${s}寸` },
    { title: '当前桶数', dataIndex: 'currentBarrels', key: 'barrels', width: 100, render: (v: number) => <Text strong style={{ fontSize: 16 }}>{v}</Text> },
    { title: '每桶容量', dataIndex: 'capacityPerBarrel', key: 'cap', width: 120, render: (c: number) => `${c}件/桶` },
    { title: '总件数', dataIndex: 'totalPieces', key: 'pieces', width: 100, render: (v: number) => <Text strong style={{ fontSize: 16, color: '#1677ff' }}>{v}</Text> },
    {
      title: '化成箱数', key: 'boxes', width: 100,
      render: (_: any, record: any) => {
        const boxSize = record.sizeInch === 8 ? 40 : 20
        const boxes = record.totalPieces > 0 ? Math.ceil(record.totalPieces / boxSize) : 0
        return <Text>{boxes} 箱</Text>
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Tag color={s === '充足' ? 'green' : s === '预警' ? 'orange' : 'red'}>{s}</Tag>,
    },
  ]

  return (
    <Card title="🛢️ 未包装成品库存（电镀桶）" size="small"
      extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddDrum}>记录桶库存</Button>}
    >
      <Table dataSource={drums} columns={columns} rowKey={(r) => `${r.productId}-${r.sizeInch}`} loading={loading} size="small" />

      <Modal title="记录未包装成品库存" open={modalVisible} onOk={handleSaveDrum} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择产品" filterOption={(input, option) => (option?.label as string || '').includes(input)}
              options={products.map(p => ({ value: p.id, label: p.modelName }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sizeInch" label="尺寸" rules={[{ required: true }]}>
                <Select options={AVAILABLE_SIZES.map(s => ({ value: s, label: `${s}寸` }))} placeholder="选尺寸" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currentBarrels" label="桶数" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="自动容量">
                <Select disabled value="auto" style={{ width: '100%' }}>
                  <Select.Option value="auto">从规则表获取</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  )
}

// ==================== 主页面 ====================
export default function DrumsPage() {
  const [calculatorVisible, setCalculatorVisible] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCapacityChanged = () => setRefreshKey(k => k + 1)

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>📦 未包装成品管理</Title>
        <Button icon={<CalculatorOutlined />} onClick={() => setCalculatorVisible(true)}>计算器</Button>
      </div>

      <CapacityRulesSection onChanged={handleCapacityChanged} />
      <DrumInventorySection key={refreshKey} />

      <CalculatorModal visible={calculatorVisible} onClose={() => setCalculatorVisible(false)} />
    </AppLayout>
  )
}
