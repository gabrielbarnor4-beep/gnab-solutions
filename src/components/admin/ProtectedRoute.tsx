import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    const checkAdmin = async (s: Session | null) => {
      if (!s?.user) {
        if (!cancelled) {
          setSession(null)
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }
      if (!cancelled) setSession(s)
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', s.user.id)
          .maybeSingle()
        if (!error && data) {
          if (!cancelled) {
            setIsAdmin(true)
            setLoading(false)
          }
          return
        }
        // Not an admin yet — try first-admin bootstrap (only succeeds when table empty)
        // Requires supabase/migrations/006_bootstrap_admin.sql to be applied.
        try {
          await supabase.rpc('claim_first_admin')
        } catch {
          /* rpc missing or RLS — ignore, will re-check */
        }
        const { data: retry } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', s.user.id)
          .maybeSingle()
        if (!cancelled) {
          setIsAdmin(!!retry)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false)
          setLoading(false)
        }
      }
    }

    void supabase.auth.getSession().then(({ data }) => checkAdmin(data.session)).catch(() => {})

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setLoading(true)
      void checkAdmin(s)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (loading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-100 border-t-navy" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mist px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-navy">Access Denied</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-light">
          Your account is authenticated but not authorized as an administrator. Contact GNAB Business Solutions if you believe this is an error.
        </p>
        <button
          onClick={() => void supabase.auth.signOut()}
          className="mt-6 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return <>{children}</>
}
