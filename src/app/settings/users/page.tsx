'use client'

import React from 'react'
import { Card, Typography, Alert } from 'antd'
import AppLayout from '@/components/AppLayout'

const { Title, Text } = Typography

export default function UsersSettingsPage() {
  return (
    <AppLayout>
      <Title level={4} style={{ marginBottom: 16 }}>👤 用户管理</Title>
      <Card>
        <Alert
          type="info"
          message="用户管理功能"
          description="默认账号：admin / admin123（管理员），agent / agent123（智能体）。后续可在此扩展用户注册、密码修改等功能。"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ padding: 16 }}>
          <Text>当前系统用户：</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li><strong>admin</strong> - 管理员（全部权限）</li>
            <li><strong>agent</strong> - AI 智能体（自动操作账号）</li>
          </ul>
        </div>
      </Card>
    </AppLayout>
  )
}