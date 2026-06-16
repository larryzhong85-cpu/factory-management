'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Descriptions, Tag, Typography, Spin, Table, Button, Modal, Form, Input, InputNumber, message, Space, Divider,
} from 'antd'
import { ArrowLeftOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  '新订单': 'blue', '生产中': 'orange', '部分发货': 'gold',
  '已发货': 'green', '已归档': 'default',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [shipModalVisible, setShipModalVisible] = useState(false)
  const [shipForm] = Form.useForm()

  useEffect(() => { loadOrder() }, [id])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const data = await api.getOrder(parseInt(id))
      setOrder(data)
    } catch (err: any) {
      message.error(err.message)
      router.push('/orders')
    }
    setLoading(false)
  }

  const handleShip = async () => {
    const values = await shipForm.validateFields()
    try {
      const result = await api.shipOrder(parseInt(id), {
        shipDate: values.shipDate || dayjs().format('YYYY-MM-DD'),
        piecesShipped: values.piecesShipped,
        shipType: values.piecesShipped >= (order?.totalPieces || 0) ? '全部' : '部分',
        deliveryNoteNo: values.deliveryNoteNo,
        notes: values.notes,
      })
      message.success('发货记录已创建')
      setShipModalVisible(false)
      loadOrder()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  const handleArchive = async () => {
    try {
      await api.archiveOrder(parseInt(id))
      message.success('订单已归档')
      loadOrder()
    } catch (err: any) {
      message.error(err.message)
    }
  }

  if (loading || !order) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    )
  }

  const canShip = ['新订单', '生产中', '部分发货'].includes(order.status)
  const canArchive = order.status === '已发货'

  // 尺寸明细合展开
  const sizeDetailColumns = [
    { title: '产品', dataIndex: ['product', 'modelName'], key: 'product' },
    { title: '尺寸', dataIndex: 'sizeInch', key: 'size', width: 80 },
    { title: '件数', dataIndex: 'pieces', key: 'pieces', width: 80 },
    { title: '付数', dataIndex: 'pairs', key: 'pairs', width: 80 },
    { title: '每箱', dataIndex: ['orderItem', 'piecesPerBox'], key: 'box', width: 80 },
  ]

  const allSizeDetails = order.items?.flatMap((item: any) =>
    (item.sizeDetails || []).map((sd: any) => ({
      ...sd,
      product: item.product,
      orderItem: item,
    }))
  ) || []

  const shipmentColumns = [
    { title: '发货日期', dataIndex: 'shipDate', key: 'date', render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    { title: '发货件数', dataIndex: 'piecesShipped', key: 'pieces' },
    {
      title: '类型', dataIndex: 'shipType', key: 'type',
      render: (t: string) => <Tag color={t === '全部' ? 'green' : 'gold'}>{t}</Tag>,
    },
    { title: '送货单号', dataIndex: 'deliveryNoteNo', key: 'note', render: (n: string) => n || '-' },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
  ]

  return (
    <AppLayout>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/orders')}>返回</Button>
      </Space>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Descriptions title={`📋 ${order.orderNo}`} bordered column={2} style={{ flex: 1 }}>
            <Descriptions.Item label="客户">
              <a onClick={() => router.push(`/customers/${order.customer?.id}`)}>
                <strong>{order.customer?.name}</strong>
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[order.status]} style={{ fontSize: 14, padding: '2px 12px' }}>
                {order.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户类型">{order.customerType}</Descriptions.Item>
            <Descriptions.Item label="下单日期">{dayjs(order.orderDate).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="总件数"><Text strong>{order.totalPieces}</Text></Descriptions.Item>
            <Descriptions.Item label="总付数"><Text strong>{order.totalPairs}</Text></Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{order.notes || '-'}</Descriptions.Item>
            {order.archivedAt && (
              <Descriptions.Item label="归档日期">{dayjs(order.archivedAt).format('YYYY-MM-DD')}</Descriptions.Item>
            )}
          </Descriptions>

          <Space direction="vertical" style={{ marginLeft: 24, minWidth: 120 }}>
            {canShip && (
              <Button type="primary" icon={<SendOutlined />} block onClick={() => { setShipModalVisible(true); shipForm.resetFields() }}>
                发货
              </Button>
            )}
            {canArchive && (
              <Button icon={<CheckCircleOutlined />} block onClick={handleArchive}>
                归档
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <Divider />

      <Card title="📦 尺寸明细" style={{ marginBottom: 16 }}>
        <Table dataSource={allSizeDetails} columns={sizeDetailColumns} rowKey={(r: any) => `${r.id || r.sizeInch}-${r.product?.id}`} pagination={false} size="small" />
      </Card>

      <Card title="🚚 发货记录" style={{ marginBottom: 16 }}>
        {order.shipments?.length > 0 ? (
          <Table dataSource={order.shipments} columns={shipmentColumns} rowKey="id" pagination={false} size="small" />
        ) : (
          <Text type="secondary">暂无发货记录</Text>
        )}
      </Card>

      <Modal title="创建发货记录" open={shipModalVisible}
        onOk={handleShip}
        onCancel={() => setShipModalVisible(false)}
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item name="shipDate" label="发货日期" initialValue={dayjs().format('YYYY-MM-DD')}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="piecesShipped" label="发货件数" rules={[{ required: true }]}
            initialValue={order.totalPieces - (order.shipments || []).reduce((s: number, sh: any) => s + sh.piecesShipped, 0)}
          >
            <InputNumber min={1} max={order.totalPieces} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deliveryNoteNo" label="送货单号">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  )
}