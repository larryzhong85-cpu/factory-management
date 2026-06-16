import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, canWrite } from '@/lib/auth'

// GET /api/drum-capacity-rules
export async function GET() {
  try {
    const rules = await prisma.drumCapacityRule.findMany({
      orderBy: { sizeInch: 'asc' },
    })
    return NextResponse.json({ success: true, data: rules })
  } catch (error) {
    console.error('DrumCapacityRules GET error:', error)
    return NextResponse.json({ success: false, error: '获取容量规则失败' }, { status: 500 })
  }
}

// POST /api/drum-capacity-rules (upsert)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!canWrite(user?.role)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const rule = await prisma.drumCapacityRule.upsert({
      where: { sizeInch: body.sizeInch },
      update: {
        capacityPerBarrel: body.capacityPerBarrel,
        notes: body.notes ?? undefined,
      },
      create: {
        sizeInch: body.sizeInch,
        capacityPerBarrel: body.capacityPerBarrel,
        notes: body.notes || null,
      },
    })

    await prisma.systemLog.create({
      data: {
        actionType: '系统设置',
        actionDetail: `${body.id ? '更新' : '新增'}未包装成品容量规则: ${rule.sizeInch}寸 -> ${rule.capacityPerBarrel}件/桶`,
        operator: user!.username,
        result: '成功',
      },
    })

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (error) {
    console.error('DrumCapacityRules POST error:', error)
    return NextResponse.json({ success: false, error: '保存容量规则失败' }, { status: 500 })
  }
}
