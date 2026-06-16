'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    api.getMe()
      .then((u) => {
        setUser(u)
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  return { user, loading }
}