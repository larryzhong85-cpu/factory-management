'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Row, Col, Statistic, Table, Tag, Typography, Spin, Space, Alert,
} from 'antd'
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  '新订单': 'blue',
  '生产中': 'orange',
  '部分发货': 'gold',
  '已发货': 'green',
  '已归档': 'default',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await api.agentAction('dashboard-stats')
      setStats(data.stats)
      setRecentOrders(data.recentOrders || [])
      setAlerts(data.inventoryAlerts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    )
  }

  const orderColumns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (no: string, record: any) => (
        <a onClick={() => router.push(`/orders/${record.id}`)}>{no}</a>
      ),
    },
    {
      title: '客户',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: '件数',
      dataIndex: 'totalPieces',
      key: 'pieces',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    {
      title: '日期',
      dataIndex: 'orderDate',
      key: 'date',
      width: 120,
      render: (d: string) => dayjs(d).format('MM-DD'),
    },
  ]

  return (
    <AppLayout>
      <Title level={4} style={{ marginBottom: 24 }}>📊 仪表盘</Title>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => router.push('/orders?status=新订单')}>
            <Statistic
              title="新订单"
              value={stats?.newOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => router.push('/orders?status=已发货')}>
            <Statistic
              title="已发货"
              value={stats?.shippedOrders || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card>
            <Statistic
              title="总客户"
              value={stats?.totalCustomers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card>
            <Statistic
              title="总订单"
              value={stats?.totalOrders || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => router.push('/orders')}>
            <Statistic
              title="待发货"
              value={stats?.pendingShipment || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => router.push('/inventory')}>
            <Statistic
              title="库存预警"
              value={alerts.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: alerts.length > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {alerts.length > 0 && (
        <Card title="⚠️ 库存预警" style={{ marginTop: 16 }}>
          {alerts.map((alert: any, i: number) => (
            <Alert
              key={i}
              type={alert.status === '不足' ? 'error' : 'warning'}
              message={`${alert.itemName}: 当前 ${alert.currentStock}, 安全库存 ${alert.safeStock}`}
              style={{ marginBottom: 8 }}
              showIcon
            />
          ))}
        </Card>
      )}

      <Card title="最近订单动态" style={{ marginTop: 16 }}>
        <Table
          dataSource={recentOrders}
          columns={orderColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </AppLayout>
  )
}