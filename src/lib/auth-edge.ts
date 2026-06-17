// Edge Runtime 兼容的 JWT 验证工具
// middleware 运行在 Edge Runtime，jsonwebtoken 不兼容
import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'factory-management-secret-key-change-in-production'
)

export async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}
