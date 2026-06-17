import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'

const publicPaths = ['/login', '/api/auth/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 允许公开路径
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // API 路径需要认证
  if (pathname.startsWith('/api/')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token || !(await verifyTokenEdge(token))) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/login/:path*'],
}