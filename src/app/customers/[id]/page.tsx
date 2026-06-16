'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Descriptions, Tag, Typography, Spin, Table, Tabs, Button, Modal, Form, Input, InputNumber, Select, message, Space,
} from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

const { Title, Text } = Typography

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pkgModalVisible, setPkgModalVisible] = useState(false)
  const [priceModalVisible, setPriceModalVisible] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [pkgForm] = Form.useForm()
  const [priceForm] = Form.useForm()

  useEffect(() => {
    loadData()
    api.getProducts().then(setProducts).catch(() => {})
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getCustomer(parseInt(id))
      setCustomer(data)
    } catch (err: any) {
      message.error(err.message)
      router.push('/customers')
    }
    setLoading(false)
  }

  if (loading || !customer) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    )
  }

  const statusColors: Record<string, string> = {
    '新订单': 'blue', '生产中': 'orange', '部分发货': 'gold',
    '已发货': 'green', '已归档': 'default',
  }

  const orderColumns = [
    { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', render: (no: string, r: any) => <a onClick={() => router.push(`/orders/${r.id}`)}>{no}</a> },
    { title: '件数', dataIndex: 'totalPieces', key: 'pieces', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: '日期', dataIndex: 'orderDate', key: 'date', width: 120,
      render: (d: string) => new Date(d).toLocaleDateString('zh-CN'),
    },
  ]

  const packagingColumns = [
    { title: '产品', dataIndex: ['product', 'modelName'], key: 'product' },
    { title: '外箱', dataIndex: 'outerBox', key: 'outerBox', render: (v: string) => v || '-' },
    { title: '内袋', dataIndex: 'innerBag', key: 'innerBag', render: (v: string) => v || '-' },
    { title: '每箱副数', dataIndex: 'piecesPerBox', key: 'piecesPerBox', width: 100 },
    { title: '贴标要求', dataIndex: 'labelRequirement', key: 'label', render: (v: string) => v || '-' },
    { title: '打包要求', dataIndex: 'packingRequirement', key: 'packing', render: (v: string) => v || '-' },
  ]

  const priceColumns = [
    { title: '产品', dataIndex: ['product', 'modelName'], key: 'product' },
    { title: '尺寸', dataIndex: 'sizeInch', key: 'size', width: 80 },
    { title: '单价', dataIndex: 'unitPrice', key: 'price', width: 100, render: (p: number) => `¥${p.toFixed(2)}` },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
  ]

  return (
    <AppLayout>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/customers')}>返回</Button>
      </Space>

      <Card>
        <Descriptions title={`👤 ${customer.name}`} bordered column={2}>
          <Descriptions.Item label="等级">
            <Tag color={customer.level === 'VIP' ? 'gold' : customer.level === '重要' ? 'orange' : 'default'}>
              {customer.level || '普通'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={customer.status === '活跃' ? 'green' : 'default'}>{customer.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="联系人">{customer.contactPerson || '-'}</Descriptions.Item>
          <Descriptions.Item label="电话">{customer.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>{customer.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="总订单数">{customer.orders?.length || 0}</Descriptions.Item>
          <Descriptions.Item label="最近下单">
            {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{customer.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="orders" style={{ marginTop: 16 }}
        tabBarExtraContent={
          <span>
            <Button type="primary" size="small" style={{ marginRight: 8 }}
              onClick={() => { setPkgModalVisible(true); pkgForm.resetFields() }}>
              + 包装偏好
            </Button>
            <Button type="primary" size="small"
              onClick={() => { setPriceModalVisible(true); priceForm.resetFields() }}>
              + 报价
            </Button>
          </span>
        }
        items={[
          {
            key: 'orders',
            label: `📋 订单记录 (${customer.orders?.length || 0})`,
            children: <Table dataSource={customer.orders || []} columns={orderColumns} rowKey="id" size="small" pagination={false} />,
          },
          {
            key: 'packaging',
            label: '📦 包装偏好',
            children: <Table dataSource={customer.packagingPreferences || []} columns={packagingColumns} rowKey="id" size="small" />,
          },
          {
            key: 'prices',
            label: '💰 报价记录',
            children: <Table dataSource={customer.prices || []} columns={priceColumns} rowKey="id" size="small" />,
          },
        ]}
      />

      {/* 包装偏好 Modal */}
      <Modal title="添加包装偏好" open={pkgModalVisible}
        onOk={async () => {
          const values = await pkgForm.validateFields()
          await api.saveCustomerPackaging(parseInt(id), values)
          message.success('保存成功')
          setPkgModalVisible(false)
          loadData()
        }}
        onCancel={() => setPkgModalVisible(false)}
      >
        <Form form={pkgForm} layout="vertical">
          <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
            <Select options={products.map((p) => ({ value: p.id, label: p.modelName }))} />
          </Form.Item>
          <Form.Item name="outerBox" label="外箱"><Input /></Form.Item>
          <Form.Item name="innerBag" label="内袋"><Input /></Form.Item>
          <Form.Item name="piecesPerBox" label="每箱副数"><InputNumber min={1} /></Form.Item>
          <Form.Item name="labelRequirement" label="贴标要求"><Input /></Form.Item>
          <Form.Item name="packingRequirement" label="打包要求"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* 报价 Modal */}
      <Modal title="添加报价" open={priceModalVisible}
        onOk={async () => {
          const values = await priceForm.validateFields()
          await api.saveCustomerPrice(parseInt(id), values)
          message.success('保存成功')
          setPriceModalVisible(false)
          loadData()
        }}
        onCancel={() => setPriceModalVisible(false)}
      >
        <Form form={priceForm} layout="vertical">
          <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
            <Select options={products.map((p) => ({ value: p.id, label: p.modelName }))} />
          </Form.Item>
          <Form.Item name="sizeInch" label="尺寸" rules={[{ required: true }]}>
            <Select options={[10, 12, 14, 16, 18, 20].map((s) => ({ value: s, label: `${s}寸` }))} />
          </Form.Item>
          <Form.Item name="unitPrice" label="单价" rules={[{ required: true }]}>
            <InputNumber prefix="¥" min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input /></Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  )
}