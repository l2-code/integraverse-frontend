'use client'

import { useEffect } from 'react'
import { setupAuthFetch } from '@/lib/auth-fetch'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('🔐 AuthProvider: Setting up auth fetch')
    setupAuthFetch()
  }, [])

  return <>{children}</>
} 