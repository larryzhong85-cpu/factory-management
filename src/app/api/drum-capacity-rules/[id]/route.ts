import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// PUT /api/drum-capacity-rules/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const rule = await prisma.drumCapacityRule.update({
      where: { id: parseInt(id) },
      data: {
        sizeInch: body.sizeInch,
        capacityPerBarrel: body.capacityPerBarrel,
        notes: body.notes ?? undefined,
      },
    })

    return NextResponse.json({ success: true, data: rule })
  } catch (error) {
    return NextResponse.json({ success: false, error: '更新容量规则失败' }, { status: 500 })
  }
}

// DELETE /api/drum-capacity-rules/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.drumCapacityRule.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true, message: '已删除' })
  } catch (error) {
    return NextResponse.json({ success: false, error: '删除容量规则失败' }, { status: 500 })
  }
}
