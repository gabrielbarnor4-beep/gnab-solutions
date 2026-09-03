import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CONTACT, COMPANY, cn } from '@/lib/utils'
import { inputClass } from '@/components/ui'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [forgotMode, setForgotMode] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    if (forgotMode) {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })
      setLoading(false)
      if (err) {
        setError('Could not send the reset email. Please check the address and try again.')
        return
      }
      setNotice(`Password reset link sent to ${email}. Check your inbox — it may take a minute to arrive.`)
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : err.message
      )
      return
    }
    void navigate(from, { replace: true })
  }

  if (session) return <Navigate to={from} replace />

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url(${CONTACT.logo})`,
          backgroundSize: '420px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-3xl bg-white p-3 shadow-lift">
            <img src={CONTACT.logo} alt={COMPANY.name} className="h-12 w-auto" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-bold text-white">Administrator Portal</h1>
          <p className="mt-2 text-sm text-navy-100/70">
            {forgotMode ? 'Reset your password' : 'Sign in to manage website content'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] bg-white p-8 shadow-lift md:p-9">
          {forgotMode && (
            <p className="rounded-xl bg-navy-50 px-4 py-3 text-sm leading-relaxed text-navy">
              Enter your administrator email and we'll send you a secure link to set a new password.
            </p>
          )}

          <div>
            <label htmlFor="admin-email" className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
              Email
            </label>
            <div className="relative">
              <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gnabsolutions.com"
                className={cn(inputClass, 'pl-11')}
              />
            </div>
          </div>

          {!forgotMode && (
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(inputClass, 'pl-11 pr-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">{error}</p>
          )}
          {notice && (
            <p className="rounded-xl bg-brand-green-50 px-4 py-3 text-sm font-medium leading-relaxed text-brand-green-700 ring-1 ring-brand-green-200">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-navy py-3.5 font-semibold text-white transition-all duration-200 hover:bg-navy-500 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : forgotMode ? 'Send Reset Link' : 'Sign In Securely'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setForgotMode(!forgotMode)
                setError('')
                setNotice('')
              }}
              className="text-sm font-semibold text-navy hover:text-brand-green-600 hover:underline"
            >
              {forgotMode ? '\u2190 Back to sign in' : 'Forgot password?'}
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
            <Lock size={11} /> Secured by Supabase Authentication
          </p>
        </form>

        <a href="/" className="mt-6 block text-center text-sm text-navy-100/60 transition-colors hover:text-gold-400">
          &larr; Back to website
        </a>
      </motion.div>
    </div>
  )
}
