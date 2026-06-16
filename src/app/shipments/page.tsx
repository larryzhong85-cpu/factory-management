'use client'

import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Typography } from 'antd'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import dayjs from 'dayjs'

const { Title } = Typography

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getShipments().then(setShipments).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: '订单编号', dataIndex: ['order', 'orderNo'], key: 'order' },
    { title: '客户', dataIndex: ['order', 'customer', 'name'], key: 'customer' },
    {
      title: '发货日期', dataIndex: 'shipDate', key: 'date',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    { title: '发货件数', dataIndex: 'piecesShipped', key: 'pieces', render: (v: number) => <strong>{v}</strong> },
    {
      title: '类型', dataIndex: 'shipType', key: 'type',
      render: (t: string) => <Tag color={t === '全部' ? 'green' : 'gold'}>{t}</Tag>,
    },
    { title: '送货单号', dataIndex: 'deliveryNoteNo', key: 'note', render: (n: string) => n || '-' },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
  ]

  return (
    <AppLayout>
      <Title level={4} style={{ marginBottom: 16 }}>🚚 发货记录</Title>
      <Card>
        <Table dataSource={shipments} columns={columns} rowKey="id" loading={loading} size="middle" />
      </Card>
    </AppLayout>
  )
}