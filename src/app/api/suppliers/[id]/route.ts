import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// PUT /api/suppliers/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        contact: body.contact || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Supplier PUT error:', error)
    return NextResponse.json({ success: false, error: '更新供应商失败' }, { status: 500 })
  }
}

// DELETE /api/suppliers/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Supplier DELETE error:', error)
    return NextResponse.json({ success: false, error: '删除供应商失败' }, { status: 500 })
  }
}
