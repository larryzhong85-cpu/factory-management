'use client'

import React, { useEffect, useState } from 'react'
import {
  Card, Form, Select, Input, InputNumber, Button, Table, Typography, message, Space, Tag, Divider, Alert, Row, Col,
} from 'antd'
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppLayout from '@/components/AppLayout'
import type { AliasResolveResult, BoxSpecResult } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

interface OrderLine {
  key: string
  productName: string
  resolved: AliasResolveResult | null
  boxSpec: BoxSpecResult | null
  sizeDetails: { sizeInch: number; pieces: number; pairs: number }[]
  outerBox: string
  innerBag: string
  labelReq: string
  packingReq: string
  piecesPerBox: number
}

const SIZE_OPTIONS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24]

export default function NewOrderPage() {
  const [form] = Form.useForm()
  const [orderLines, setOrderLines] = useState<OrderLine[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [inventoryCheck, setInventoryCheck] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    api.getCustomers().then(setCustomers).catch(() => {})
    api.getProducts().then(setProducts).catch(() => {})
  }, [])

  const addOrderLine = () => {
    const newLine: OrderLine = {
      key: Date.now().toString(),
      productName: '',
      resolved: null,
      boxSpec: null,
      sizeDetails: [],
      outerBox: '',
      innerBag: '',
      labelReq: '',
      packingReq: '',
      piecesPerBox: 20,
    }
    setOrderLines([...orderLines, newLine])
  }

  const removeOrderLine = (key: string) => {
    setOrderLines(orderLines.filter((l) => l.key !== key))
  }

  const resolveProduct = async (key: string, input: string) => {
    try {
      const result = await api.agentAction('resolve-product', { input })
      setOrderLines(orderLines.map((line) => {
        if (line.key !== key) return line
        const product = result.product
        const firstSize = line.sizeDetails?.[0]?.sizeInch || 10
        const boxSpec = { boxSize: firstSize, piecesPerBox: 20, isSpecial: false, rule: '标准包装' }
        return { ...line, productName: input, resolved: result, boxSpec }
      }))
      message.success(`匹配到: ${result.product.modelName}`)
    } catch (err: any) {
      message.warning(err.message)
      setOrderLines(orderLines.map((line) =>
        line.key === key ? { ...line, productName: input, resolved: null, boxSpec: null } : line
      ))
    }
  }

  const updateSizeDetail = (lineKey: string, sizeInch: number, pieces: number | null) => {
    setOrderLines(orderLines.map((line) => {
      if (line.key !== lineKey) return line
      const existing = line.sizeDetails.filter((d) => d.sizeInch !== sizeInch)
      if (pieces && pieces > 0) {
        existing.push({
          sizeInch,
          pieces,
          pairs: pieces * line.piecesPerBox,
        })
      }
      existing.sort((a, b) => a.sizeInch - b.sizeInch)
      return { ...line, sizeDetails: existing }
    }))
  }

  const getLineTotal = (line: OrderLine) => line.sizeDetails.reduce((s, d) => s + d.pieces, 0)

  const getGrandTotal = () => orderLines.reduce((s, line) => s + getLineTotal(line), 0)

  const handleSubmit = async () => {
    const orderValues = await form.validateFields()
    const validLines = orderLines.filter((l) => l.resolved && l.sizeDetails.length > 0)
    if (validLines.length === 0) {
      message.error('请至少添加一个产品明细')
      return
    }

    setSubmitting(true)
    try {
      const customerId = parseInt(orderValues.customerId)
      const customer = customers.find((c) => c.id === customerId)

      const items = validLines.map((line) => ({
        productId: line.resolved!.product.id,
        piecesPerBox: line.piecesPerBox || 20,
        outerBox: line.outerBox || null,
        innerBag: line.innerBag || null,
        labelRequirement: line.labelReq || null,
        packingRequirement: line.packingReq || null,
        sizeDetails: line.sizeDetails.map((d) => ({
          sizeInch: d.sizeInch,
          pieces: d.pieces,
        })),
      }))

      const orderData = {
        orderNo: '', // will be auto-generated
        customerId,
        customerType: orderValues.customerType || '老客户',
        orderDate: orderValues.orderDate || dayjs().format('YYYY-MM-DD'),
        notes: orderValues.notes || null,
        items,
      }

      const result = await api.createOrder(orderData)
      message.success(`订单 ${result.orderNo} 创建成功！`)
      router.push(`/orders/${result.id}`)
    } catch (err: any) {
      message.error(err.message)
    }
    setSubmitting(false)
  }

  const lineColumns = [
    {
      title: '产品型号', dataIndex: 'productName', key: 'product', width: 200,
      render: (val: string, record: OrderLine) => (
        <Select
          showSearch
          value={val || undefined}
          onChange={(v) => resolveProduct(record.key, v)}
          style={{ width: 180 }}
          placeholder="输入型号或别名..."
          filterOption={false}
          onSearch={(v) => v.length > 1 ? resolveProduct(record.key, v) : null}
          options={products.map((p) => ({
            value: p.modelName,
            label: `${p.modelName} ${p.shortCode ? `(${p.shortCode})` : ''}`,
          }))}
        />
      ),
    },
    {
      title: '匹配结果', key: 'match', width: 100,
      render: (_: any, record: OrderLine) => record.resolved ? (
        <Tag color="green">{record.resolved.product.modelName}</Tag>
      ) : record.productName ? (
        <Tag color="red">未匹配</Tag>
      ) : null,
    },
    {
      title: '尺寸×件数', key: 'sizes', width: 400,
      render: (_: any, record: OrderLine) => (
        <Space size={4} wrap>
          {SIZE_OPTIONS.map((size) => (
            <Space key={size} size={2}>
              <Text type="secondary" style={{ fontSize: 12 }}>{size}寸</Text>
              <InputNumber
                size="small"
                min={0}
                value={record.sizeDetails.find((d) => d.sizeInch === size)?.pieces || undefined}
                onChange={(v) => updateSizeDetail(record.key, size, v)}
                style={{ width: 55 }}
                placeholder="件"
              />
            </Space>
          ))}
        </Space>
      ),
    },
    {
      title: '小计', key: 'subtotal', width: 60,
      render: (_: any, record: OrderLine) => <Text strong>{getLineTotal(record)}</Text>,
    },
    {
      title: '操作', key: 'action', width: 50,
      render: (_: any, record: OrderLine) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeOrderLine(record.key)} />
      ),
    },
  ]

  return (
    <AppLayout>
      <Title level={4}>📝 新订单录入</Title>

      <Card title="订单信息" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]} style={{ minWidth: 200 }}>
            <Select
              showSearch
              placeholder="选择客户"
              filterOption={(input, option) => (option?.label as string || '').includes(input)}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="customerType" label="客户类型" initialValue="老客户">
            <Select options={[
              { value: '老客户', label: '老客户' },
              { value: '新客户', label: '新客户' },
              { value: '加单', label: '加单' },
            ]} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="orderDate" label="下单日期" initialValue={dayjs().format('YYYY-MM-DD')}>
            <Input type="date" style={{ width: 140 }} />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="订单明细"
        extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addOrderLine}>添加产品</Button>}
        style={{ marginBottom: 16 }}
      >
        {orderLines.length === 0 && (
          <Alert message={'请点击"添加产品"按钮输入订单明细'} type="info" showIcon />
        )}

        <Table
          dataSource={orderLines}
          columns={lineColumns}
          rowKey="key"
          pagination={false}
          size="small"
        />

        {orderLines.length > 0 && (
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Text strong>总计: {getGrandTotal()} 件</Text>
          </div>
        )}

        {orderLines.some((l) => l.resolved) && (
          <Form.Item name="notes" label="备注" style={{ marginTop: 16 }}>
            <TextArea rows={2} placeholder="订单备注信息（可选）" />
          </Form.Item>
        )}
      </Card>

      {/* 包装信息补充 */}
      {orderLines.filter((l) => l.resolved).length > 0 && (
        <Card title="包装信息（可选填写）" style={{ marginBottom: 16 }}>
          {orderLines.filter((l) => l.resolved).map((line) => (
            <Row key={line.key} gutter={16} style={{ marginBottom: 8 }}>
              <Col span={6}>
                <Text strong style={{ fontSize: 12 }}>{line.resolved?.product.modelName}</Text>
              </Col>
              <Col span={6}>
                <Input size="small" placeholder="外箱" value={line.outerBox}
                  onChange={(e) => setOrderLines(orderLines.map(l => l.key === line.key ? { ...l, outerBox: e.target.value } : l))} />
              </Col>
              <Col span={6}>
                <Input size="small" placeholder="内袋" value={line.innerBag}
                  onChange={(e) => setOrderLines(orderLines.map(l => l.key === line.key ? { ...l, innerBag: e.target.value } : l))} />
              </Col>
              <Col span={3}>
                <Input size="small" placeholder="贴标" value={line.labelReq}
                  onChange={(e) => setOrderLines(orderLines.map(l => l.key === line.key ? { ...l, labelReq: e.target.value } : l))} />
              </Col>
              <Col span={3}>
                <Input size="small" placeholder="打包要求" value={line.packingReq}
                  onChange={(e) => setOrderLines(orderLines.map(l => l.key === line.key ? { ...l, packingReq: e.target.value } : l))} />
              </Col>
            </Row>
          ))}
        </Card>
      )}

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => router.push('/orders')}>取消</Button>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSubmit} loading={submitting} size="large">
            提交订单
          </Button>
        </Space>
      </div>
    </AppLayout>
  )
}