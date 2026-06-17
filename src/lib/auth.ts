// ==========================================
// JWT 认证工具
// ==========================================

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { JWT_SECRET, JWT_EXPIRES_IN } from './constants'
import type { JwtPayload } from '@/types'

const TOKEN_COOKIE_NAME = 'auth_token'

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/**
 * 从请求中获取当前用户信息
 */
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

/**
 * 检查用户是否有写入权限
 */
export function canWrite(role?: string): boolean {
  return role === 'admin'
}

/**
 * 检查用户是否有管理权限
 */
export function isAdmin(role?: string): boolean {
  return role === 'admin'
}

/**
 * 创建认证 Cookie 配置
 */
export function createAuthCookie(token: string) {
  return {
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  }
}

/**
 * 清除认证 Cookie 配置
 */
export function clearAuthCookie() {
  return {
    name: TOKEN_COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
  }
}