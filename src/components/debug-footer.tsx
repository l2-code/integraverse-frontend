'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function DebugFooter() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-2 text-xs">
        <div className="max-w-7xl mx-auto">
          Debug: Loading session...
        </div>
      </footer>
    )
  }

  const token = session?.access_token || 'No token'
  const truncatedToken = token.length > 50 ? `${token.substring(0, 50)}...` : token

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-2 text-xs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <span>Debug: Session Token</span>
          <code className="bg-gray-800 px-2 py-1 rounded text-green-400 font-mono">
            {truncatedToken}
          </code>
        </div>
        {session && (
          <div className="mt-1 text-gray-400">
            User: {session.user?.email || 'Unknown'} | 
            Expires: {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown'}
          </div>
        )}
      </div>
    </footer>
  )
} 