'use client'

import React, { useState } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Typography, theme } from 'antd'
import {
  DashboardOutlined,
  InboxOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  StockOutlined,
  TruckOutlined,
  SettingOutlined,
  LogoutOutlined,
  TagsOutlined,
  ExperimentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'

const { Header, Sider, Content } = Layout
const { Text } = Typography

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = React.useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { token: themeToken } = theme.useToken()

  React.useEffect(() => {
    api.getMe()
      .then((u) => setUser(u))
      .catch(() => router.push('/login'))
  }, [router])

  const handleLogout = async () => {
    await api.logout()
    router.push('/login')
  }

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link href="/">仪表盘</Link> },
    {
      key: 'materials',
      icon: <UnorderedListOutlined />,
      label: '物料基础信息',
      children: [
        { key: '/materials', icon: <UnorderedListOutlined />, label: <Link href="/materials">物料管理</Link> },
      ],
    },
    {
      key: 'products',
      icon: <InboxOutlined />,
      label: '成品管理',
      children: [
        { key: '/products', icon: <InboxOutlined />, label: <Link href="/products">成品/半成品库存</Link> },
      ],
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: '客户管理',
      children: [
        { key: '/customers', icon: <UserOutlined />, label: <Link href="/customers">客户列表</Link> },
      ],
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      children: [
        { key: '/orders', icon: <ShoppingCartOutlined />, label: <Link href="/orders">订单列表</Link> },
        { key: '/orders/new', icon: <ShoppingCartOutlined />, label: <Link href="/orders/new">录入订单</Link> },
      ],
    },
    {
      key: 'inventory',
      icon: <StockOutlined />,
      label: '库存管理',
      children: [
        { key: '/inventory', icon: <StockOutlined />, label: <Link href="/inventory">库存总览</Link> },
        { key: '/drums', icon: <ExperimentOutlined />, label: <Link href="/drums">未包装成品</Link> },
      ],
    },
    {
      key: 'shipments',
      icon: <TruckOutlined />,
      label: '发货管理',
      children: [
        { key: '/shipments', icon: <TruckOutlined />, label: <Link href="/shipments">发货记录</Link> },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        { key: '/settings/users', icon: <UserOutlined />, label: <Link href="/settings/users">用户管理</Link> },
        { key: '/settings/logs', icon: <SettingOutlined />, label: <Link href="/settings/logs">操作日志</Link> },
      ],
    },
  ]

  // 计算当前展开的子菜单
  const getOpenKeys = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) return [segments[0]]
    return []
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Text strong style={{ fontSize: collapsed ? 14 : 18, whiteSpace: 'nowrap' }}>
            {collapsed ? '🏭' : '🏭 工厂管理'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'user',
                  label: `${user?.displayName || '用户'} (${user?.role === 'admin' ? '管理员' : user?.role || '未知'})`,
                  disabled: true,
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Avatar
              icon={<UserOutlined />}
              style={{ cursor: 'pointer', backgroundColor: themeToken.colorPrimary }}
            />
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}