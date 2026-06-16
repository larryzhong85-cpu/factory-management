// ==========================================
// 前端 API 调用工具
// ==========================================

const BASE_URL = ''

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || `请求失败 (${res.status})`)
  }

  return data.data
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  getMe: () => request<any>('/api/auth/me'),

  // Products
  getProducts: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<any[]>(`/api/products${qs ? `?${qs}` : ''}`)
  },

  getProduct: (id: number) => request<any>(`/api/products/${id}`),

  createProduct: (data: any) =>
    request<any>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: any) =>
    request<any>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    request<any>(`/api/products/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params?: { search?: string; level?: string; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<any[]>(`/api/customers${qs ? `?${qs}` : ''}`)
  },

  getCustomer: (id: number) => request<any>(`/api/customers/${id}`),

  createCustomer: (data: any) =>
    request<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: number, data: any) =>
    request<any>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Customer packaging & prices
  getCustomerPackaging: (customerId: number) =>
    request<any[]>(`/api/customers/${customerId}/packaging`),

  saveCustomerPackaging: (customerId: number, data: any) =>
    request<any>(`/api/customers/${customerId}/packaging`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCustomerPrices: (customerId: number) =>
    request<any[]>(`/api/customers/${customerId}/prices`),

  saveCustomerPrice: (customerId: number, data: any) =>
    request<any>(`/api/customers/${customerId}/prices`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Orders
  getOrders: (params?: { status?: string; customerId?: number; search?: string }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<any[]>(`/api/orders${qs ? `?${qs}` : ''}`)
  },

  getOrder: (id: number) => request<any>(`/api/orders/${id}`),

  createOrder: (data: any) =>
    request<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrder: (id: number, data: any) =>
    request<any>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  shipOrder: (id: number, data: any) =>
    request<any>(`/api/orders/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'ship', ...data }),
    }),

  archiveOrder: (id: number) =>
    request<any>(`/api/orders/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'archive' }),
    }),

  // Inventory
  getInventory: (params?: { itemType?: string }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<any[]>(`/api/inventory${qs ? `?${qs}` : ''}`)
  },

  updateInventory: (data: any) =>
    request<any>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInventoryLogs: (inventoryId?: number) => {
    const qs = inventoryId ? `?inventoryId=${inventoryId}` : ''
    return request<any[]>(`/api/inventory/logs${qs}`)
  },

  // Drums
  getDrums: () => request<any[]>('/api/drums'),
  updateDrum: (data: any) =>
    request<any>('/api/drums', { method: 'POST', body: JSON.stringify(data) }),

  // Labels
  getLabels: () => request<any[]>('/api/labels'),
  updateLabel: (data: any) =>
    request<any>('/api/labels', { method: 'POST', body: JSON.stringify(data) }),

  // Shipments
  getShipments: (params?: { orderId?: number }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<any[]>(`/api/shipments${qs ? `?${qs}` : ''}`)
  },

  // Agent
  agentAction: (action: string, params?: any) =>
    request<any>('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ action, params }),
    }),

  // System Logs
  getSystemLogs: (params?: { actionType?: string; page?: number }) => {
    const qs = new URLSearchParams(params as any).toString()
    return request<{ logs: any[]; total: number }>(`/api/system-logs${qs ? `?${qs}` : ''}`)
  },

  // Materials (物料基础信息)
  getMaterials: (params?: { category?: string; subCategory?: string; search?: string }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '')
    )
    const qs = new URLSearchParams(cleanParams).toString()
    return request<any[]>(`/api/materials${qs ? `?${qs}` : ''}`)
  },
  createMaterial: (data: any) =>
    request<any>('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: number, data: any) =>
    request<any>(`/api/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id: number) =>
    request<any>(`/api/materials/${id}`, { method: 'DELETE' }),

  // Drum Capacity Rules
  getDrumCapacityRules: () => request<any[]>('/api/drum-capacity-rules'),
  saveDrumCapacityRule: (data: any) =>
    request<any>('/api/drum-capacity-rules', { method: 'POST', body: JSON.stringify(data) }),
  deleteDrumCapacityRule: (id: number) =>
    request<any>(`/api/drum-capacity-rules/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request<any[]>('/api/suppliers'),
  createSupplier: (data: any) =>
    request<any>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: any) =>
    request<any>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number) =>
    request<any>(`/api/suppliers/${id}`, { method: 'DELETE' }),
}