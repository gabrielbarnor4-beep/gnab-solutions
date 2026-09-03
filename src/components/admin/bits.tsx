import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tone = 'gold' | 'green' | 'navy' | 'red' | 'gray' | 'blue'

const TONES: Record<Tone, string> = {
  gold: 'bg-gold-50 text-gold-600 ring-gold-200',
  green: 'bg-brand-green-50 text-brand-green-700 ring-brand-green-200',
  navy: 'bg-navy-50 text-navy ring-navy-100',
  red: 'bg-red-50 text-red-600 ring-red-200',
  gray: 'bg-mist text-ink-light ring-gray-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1', TONES[tone])}>
      {children}
    </span>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-navy-900/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
            role="dialog"
            aria-label={title}
          >
            <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-ink-light">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close panel" className="rounded-xl p-2 text-ink-light transition-colors hover:bg-mist hover:text-navy">
                <X size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-gray-200 bg-white p-16 text-center">
      <p className="font-display font-bold text-navy">{title}</p>
      {hint && <p className="mt-2 text-sm text-ink-light">{hint}</p>}
    </div>
  )
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  if (!message) return null
  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-800">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="font-semibold hover:text-amber-950" aria-label="Dismiss">
          Dismiss
        </button>
      )}
    </div>
  )
}

export function Skeletons({ count = 4, height = 'h-20' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={cn('animate-pulse rounded-[20px] border border-gray-100 bg-white', height)} />
      ))}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-5 flex items-center justify-between gap-4">
      <p className="text-xs text-ink-light">
        Page {page} of {totalPages} · {totalItems} item{totalItems === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy disabled:opacity-40 hover:border-navy"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy disabled:opacity-40 hover:border-navy"
        >
          Next
        </button>
      </div>
    </div>
  )
}
