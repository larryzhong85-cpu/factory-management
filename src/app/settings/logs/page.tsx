'use client'

import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Typography, Select, Space } from 'antd'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import dayjs from 'dayjs'

const { Title } = Typography

const actionColors: Record<string, string> = {
  '订单录入': 'blue', '发货': 'green', '归档': 'default',
  '库存变更': 'orange', '登录': 'purple', '产品管理': 'cyan', '客户管理': 'geekblue',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => { loadLogs() }, [typeFilter])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const result = await api.getSystemLogs({ actionType: typeFilter || undefined })
      setLogs(result.logs || [])
    } catch (_) {}
    setLoading(false)
  }

  const columns = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'time', width: 170,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作类型', dataIndex: 'actionType', key: 'type', width: 100,
      render: (t: string) => <Tag color={actionColors[t]}>{t}</Tag>,
    },
    { title: '操作详情', dataIndex: 'actionDetail', key: 'detail' },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '关联订单', dataIndex: 'relatedOrderNo', key: 'order', width: 180, render: (v: string) => v || '-' },
    {
      title: '结果', dataIndex: 'result', key: 'result', width: 80,
      render: (r: string) => <Tag color={r === '成功' ? 'green' : 'red'}>{r}</Tag>,
    },
  ]

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>📋 操作日志</Title>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: '', label: '全部类型' },
            { value: '订单录入', label: '订单录入' },
            { value: '发货', label: '发货' },
            { value: '归档', label: '归档' },
            { value: '库存变更', label: '库存变更' },
            { value: '登录', label: '登录' },
          ]}
          style={{ width: 140 }}
        />
      </div>
      <Card>
        <Table dataSource={logs} columns={columns} rowKey="id" loading={loading} size="middle" />
      </Card>
    </AppLayout>
  )
}