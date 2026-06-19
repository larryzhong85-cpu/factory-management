'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Typography, Space, Button, Modal, Form, Input, message, Tabs,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, LinkOutlined } from '@ant-design/icons'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'

const { Title } = Typography

/** 按分类显示颜色 */
const categoryColors: Record<string, string> = {
  '原材料': 'blue', '半成品': 'cyan', '成品': 'green', '钢珠': 'gold',
  '塑料配件': 'purple', '阻尼器': 'orange', '包装材料': 'magenta', '配件': 'default',
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [supplierMaterials, setSupplierMaterials] = useState<any>(null)
  const [materialsModal, setMaterialsModal] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => { loadSuppliers() }, [])

  const loadSuppliers = async () => {
    setLoading(true)
    try { setSuppliers(await api.getSuppliers()) } catch (_) {}
    setLoading(false)
  }

  const loadSupplierMaterials = async (supplier: any) => {
    try {
      const all = await api.getMaterials()
      const filtered = all.filter((m: any) => m.supplierId === supplier.id)
      setSupplierMaterials({ supplier, materials: filtered })
      setMaterialsModal(true)
    } catch (_) {}
  }

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
      if (editing) {
        await api.updateSupplier(editing.id, values)
        message.success('已更新')
      } else {
        await api.createSupplier(values)
        message.success('已创建')
      }
      setModalVisible(false)
      loadSuppliers()
    } catch (err: any) { message.error(err.message) }
  }

  const handleDelete = (id: number, name: string) => {
    Modal.confirm({
      title: `确认删除供应商「${name}」？`,
      content: '删除后相关物料的供应商关联将清空',
      onOk: async () => {
        await api.deleteSupplier(id)
        message.success('已删除')
        loadSuppliers()
      },
    })
  }

  const columns: any[] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 160, render: (n: string) => <strong>{n}</strong> },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 120, render: (v: string) => v || '-' },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 140, render: (v: string) => v || '-' },
    {
      title: '关联物料', key: 'materials', width: 280,
      render: (_: any, record: any) => {
        const count = record._count?.materials || 0
        if (!count) return <span style={{ color: '#999' }}>暂未关联物料</span>
        return (
          <Button type="link" icon={<LinkOutlined />} onClick={() => loadSupplierMaterials(record)}>
            {count} 个物料
          </Button>
        )
      },
    },
    {
      title: '操作', key: 'action', width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id, record.name)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}><TeamOutlined /> 供应商管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增供应商</Button>
      </div>

      <Card>
        <Table
          dataSource={suppliers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* 新增/编辑供应商 */}
      <Modal title={editing ? '编辑供应商' : '新增供应商'} open={modalVisible}
        onOk={handleSave} onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="供应商名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="输入供应商名称" />
          </Form.Item>
          <Form.Item name="contact" label="联系人"><Input placeholder="联系人姓名" /></Form.Item>
          <Form.Item name="phone" label="电话"><Input placeholder="联系电话" /></Form.Item>
          <Form.Item name="address" label="地址"><Input placeholder="供应商地址" /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>

      {/* 查看供应商的物料 */}
      <Modal title={supplierMaterials ? `「${supplierMaterials.supplier.name}」供应的物料` : '关联物料'}
        open={materialsModal} onCancel={() => setMaterialsModal(false)} footer={null} width={700}
      >
        {supplierMaterials && (
          <>
            <div style={{ marginBottom: 12, color: '#666' }}>
              共 <strong>{supplierMaterials.materials.length}</strong> 个物料
            </div>
            <Table
              dataSource={supplierMaterials.materials}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '编码', dataIndex: 'materialCode', key: 'code', width: 90 },
                { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
                {
                  title: '分类', key: 'category', width: 100,
                  render: (_: any, r: any) => <Tag color={categoryColors[r.category] || 'default'}>{r.category}</Tag>,
                },
                { title: '子分类', dataIndex: 'subCategory', key: 'sub', width: 80, render: (v: string) => v || '-' },
                { title: '品牌', dataIndex: 'brand', key: 'brand', width: 80, render: (v: string) => v || '-' },
                { title: '单位', dataIndex: 'unit', key: 'unit', width: 50 },
              ]}
            />
          </>
        )}
      </Modal>
    </AppLayout>
  )
}
