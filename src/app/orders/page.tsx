'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { Table, Card, Tag, Typography, Space, Button, Select, Input, Spin } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import dayjs from 'dayjs'

const { Title } = Typography

const statusColors: Record<string, string> = {
  '新订单': 'blue', '生产中': 'orange', '部分发货': 'gold',
  '已发货': 'green', '已归档': 'default',
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '新订单', label: '新订单' },
  { value: '生产中', label: '生产中' },
  { value: '部分发货', label: '部分发货' },
  { value: '已发货', label: '已发货' },
  { value: '已归档', label: '已归档' },
]

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const status = searchParams.get('status') || ''
    setStatusFilter(status)
  }, [searchParams])

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await api.getOrders({
        status: statusFilter || undefined,
        search: search || undefined,
      })
      setOrders(data)
    } catch (_) {}
    setLoading(false)
  }

  const columns = [
    {
      title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 200,
      render: (no: string, record: any) => (
        <a onClick={() => router.push(`/orders/${record.id}`)} style={{ fontFamily: 'monospace' }}>{no}</a>
      ),
    },
    {
      title: '客户', dataIndex: ['customer', 'name'], key: 'customer', width: 100,
      render: (name: string, record: any) => (
        <a onClick={() => router.push(`/customers/${record.customer?.id}`)}>{name}</a>
      ),
    },
    {
      title: '产品', key: 'products',
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          {record.items?.map((item: any) => (
            <Tag key={item.id}>{item.product?.modelName}</Tag>
          ))}
        </Space>
      ),
    },
    { title: '件数', dataIndex: 'totalPieces', key: 'pieces', width: 70 },
    { title: '付数', dataIndex: 'totalPairs', key: 'pairs', width: 70 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: '日期', dataIndex: 'orderDate', key: 'date', width: 100,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '下单方式', dataIndex: 'customerType', key: 'type', width: 80,
      render: (t: string) => t === '新客户' ? <Tag color="green">新</Tag> : t === '加单' ? <Tag color="orange">加</Tag> : <Tag>老</Tag>,
    },
  ]

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>📋 订单管理</Title>
        <Space>
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); router.push(`/orders${v ? `?status=${v}` : ''}`) }}
            options={statusOptions}
            style={{ width: 120 }}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索订单/客户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={loadOrders}
            allowClear
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/orders/new')}>
            录入订单
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
        />
      </Card>
    </AppLayout>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    }>
      <OrdersContent />
    </Suspense>
  )
}