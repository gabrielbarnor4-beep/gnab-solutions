import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COMPANY, CONTACT, cn } from '@/lib/utils'
import { inputClass } from '@/components/ui'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Set New Password | GNAB Admin'
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(`Could not update the password: ${err.message}`)
      return
    }
    void navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url(${CONTACT.logo})`, backgroundSize: '420px', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
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
          <h1 className="mt-6 font-display text-2xl font-bold text-white">Set a New Password</h1>
          <p className="mt-2 text-sm text-navy-100/70">Choose a strong password for your administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] bg-white p-8 shadow-lift md:p-9">
          {checking ? (
            <p className="py-4 text-center text-sm text-ink-light">Verifying your secure link…</p>
          ) : !session ? (
            <div className="space-y-5 text-center">
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium leading-relaxed text-red-600 ring-1 ring-red-100">
                This reset link is invalid or has expired. Please request a new one from the sign-in page.
              </p>
              <Link to="/admin/login" className="text-sm font-semibold text-navy hover:text-brand-green-600 hover:underline">
                &larr; Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="new-password" className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="new-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={cn(inputClass, 'pl-11')}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirm-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className={cn(inputClass, 'pl-11 pr-12')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium leading-relaxed text-red-600 ring-1 ring-red-100">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-navy py-3.5 font-semibold text-white transition-all duration-200 hover:bg-navy-500 disabled:opacity-60"
              >
                {loading ? 'Updating…' : 'Update Password & Sign In'}
              </button>
            </>
          )}
        </form>
      </motion.div>
    </div>
  )
}
