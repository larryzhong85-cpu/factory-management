'use client'

import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Typography, Space, Button, Input, Modal, Form, Select, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

const { Title } = Typography

const levelColors: Record<string, string> = {
  'VIP': 'gold',
  '重要': 'orange',
  '普通': 'default',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const router = useRouter()

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await api.getCustomers({ search: search || undefined })
      setCustomers(data)
    } catch (err: any) { message.error(err.message) }
    setLoading(false)
  }

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await api.createCustomer(values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadCustomers()
    } catch (err: any) { message.error(err.message) }
  }

  const columns = [
    {
      title: '客户名称', dataIndex: 'name', key: 'name',
      render: (name: string, record: any) => (
        <a onClick={() => router.push(`/customers/${record.id}`)}><strong>{name}</strong></a>
      ),
    },
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 80,
      render: (l: string) => <Tag color={levelColors[l] || 'default'}>{l || '普通'}</Tag>,
    },
    {
      title: '联系人', dataIndex: 'contactPerson', key: 'contact', width: 100,
      render: (c: string) => c || '-',
    },
    {
      title: '电话', dataIndex: 'phone', key: 'phone', width: 130,
      render: (p: string) => p || '-',
    },
    {
      title: '订单数', key: 'orders', width: 80,
      render: (_: any, record: any) => record._count?.orders || record.orders || 0,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Tag color={s === '活跃' ? 'green' : 'default'}>{s || '活跃'}</Tag>,
    },
    {
      title: '最近下单', dataIndex: 'lastOrderDate', key: 'lastOrder', width: 110,
      render: (d: string) => d ? new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '-',
    },
  ]

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>👥 客户管理</Title>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索客户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={loadCustomers}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新增客户
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
        />
      </Card>

      <Modal title="新增客户" open={modalVisible} onOk={handleCreate} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="level" label="等级">
            <Select options={[
              { value: 'VIP', label: 'VIP' },
              { value: '重要', label: '重要' },
              { value: '普通', label: '普通' },
            ]} defaultValue="普通" />
          </Form.Item>
          <Form.Item name="contactPerson" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  )
}