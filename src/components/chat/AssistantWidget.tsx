import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, SendHorizonal, Sparkles, X } from 'lucide-react'
import {
  getAssistantReply,
  makeUserMessage,
  WELCOME_MESSAGE,
  type ChatMessage,
} from '@/lib/assistant'
import { CONTACT } from '@/lib/utils'

/* ---------- inline formatting: **bold**, [label](/link), bullet lines ---------- */
function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, li) => {
        if (!line.trim()) return <span key={li} className="block h-2" />
        const isBullet = /^[-•]\s+/.test(line)
        const content = isBullet ? line.replace(/^[-•]\s+/, '') : line
        return (
          <span key={li} className={isBullet ? 'flex items-start gap-1.5' : 'block'}>
            {isBullet && <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-gold-500" />}
            <span>{parseInline(content)}</span>
          </span>
        )
      })}
    </>
  )
}

function parseInline(text: string) {
  // [label](href) — internal paths use react-router Link; external open new tab
  const parts: (string | ReactNode)[] = []
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const [, label, href] = m as unknown as [string, string, string]
    if (!label || !href) continue
    parts.push(
      href.startsWith('/') ? (
        <Link key={`${label}${m.index}`} to={href} className="font-semibold text-navy underline decoration-gold-400 decoration-2 underline-offset-2 hover:text-brand-green-600">
          {label}
        </Link>
      ) : (
        <a key={`${label}${m.index}`} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline decoration-gold-400 decoration-2 underline-offset-2 hover:text-brand-green-600">
          {label}
        </a>
      )
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  // bold segments in remaining plain strings
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      <span key={i}>
        {p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
          seg.startsWith('**') && seg.endsWith('**') ? (
            <strong key={j} className="font-semibold text-navy">{seg.slice(2, -2)}</strong>
          ) : (
            seg
          )
        )}
      </span>
    ) : (
      p
    )
  )
}

function Chips({ chips, onPick }: { chips: string[]; onPick: (chip: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onPick(chip)}
          className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-navy transition-all hover:border-navy hover:bg-navy hover:text-white"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

export default function AssistantWidget() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE()])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing, open])

  if (pathname.startsWith('/admin')) return null

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || typing) return
    setInput('')
    const userMsg = makeUserMessage(text)
    setMessages((prev) => [...prev, userMsg])
    setTyping(true)
    try {
      const botMsg = await getAssistantReply(text, messages)
      // small delay for natural feel
      await new Promise((r) => setTimeout(r, 450))
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setTyping(false)
    }
  }

  const lastChips = [...messages].reverse().find((m) => m.role === 'bot')?.chips

  return (
    <>
      {/* Launcher */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 18 }}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close GNAB Assistant' : 'Open GNAB Assistant chat'}
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        className="fixed right-6 z-[60] group"
      >
        {/* pulse ring */}
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-navy/30" aria-hidden />
        )}
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-500 text-white shadow-xl shadow-navy/40 transition-transform duration-300 group-hover:scale-110">
          {open ? <X size={24} /> : <Sparkles size={24} />}
        </span>
        {!open && (
          <span className="pointer-events-none absolute right-[68px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy opacity-0 shadow-lift transition-all duration-300 group-hover:opacity-100 md:block">
            Need help? Ask me anything ✨
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[92px] right-4 z-[60] flex h-[min(600px,calc(100dvh-120px))] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-[26px] border border-gray-100 bg-white shadow-[0_24px_80px_rgba(11,46,89,0.25)] sm:right-6"
            role="dialog"
            aria-label="GNAB Assistant chat"
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 bg-gradient-to-r from-navy to-navy-500 px-5 py-4 text-white">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <img src={CONTACT.logo} alt="" className="h-6 w-auto" />
              </span>
              <div className="relative min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold">GNAB Assistant</p>
                <p className="flex items-center gap-1.5 text-[11px] text-navy-100/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online • replies instantly
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="relative rounded-xl p-1.5 transition-colors hover:bg-white/15">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-mist px-4 py-5">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[86%] space-y-3 ${m.role === 'user' ? '' : ''}`}>
                    {m.text && (
                      <div
                        className={
                          m.role === 'user'
                            ? 'rounded-3xl rounded-br-lg bg-navy px-4 py-3 text-[13.5px] leading-relaxed text-white shadow-md'
                            : 'rounded-3xl rounded-bl-lg border border-gray-100 bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink shadow-sm'
                        }
                      >
                        <RichText text={m.text} />
                      </div>
                    )}

                    {/* product / action cards */}
                    {m.cards && (
                      <div className="grid gap-2">
                        {m.cards.map((c) => {
                          const external = c.to.startsWith('http')
                          const inner = (
                            <>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-display text-[13px] font-bold text-navy">{c.name}</p>
                                {c.desc && <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-light">{c.desc}</p>}
                              </div>
                              <SendHorizonal size={14} className="mt-0.5 flex-shrink-0 text-gold-600" />
                            </>
                          )
                          const cls =
                            'flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md'
                          return external ? (
                            <a key={c.name} href={c.to} target="_blank" rel="noopener noreferrer" className={cls}>
                              {inner}
                            </a>
                          ) : (
                            <Link key={c.name} to={c.to} onClick={() => setOpen(false)} className={cls}>
                              {inner}
                            </Link>
                          )
                        })}
                      </div>
                    )}

                    {/* quick reply chips */}
                    {m.role === 'bot' && m.chips && <Chips chips={m.chips} onPick={send} />}
                  </div>
                </motion.div>
              ))}

              {/* typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy-300"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* contextual chips after latest bot msg */}
              {!typing && lastChips && messages[messages.length - 1]?.role === 'bot' && !messages[messages.length - 1]?.chips && (
                <Chips chips={lastChips} onPick={send} />
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
              className="border-t border-gray-100 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products, pricing, delivery..."
                  aria-label="Type your message"
                  className="min-w-0 flex-1 rounded-full border border-gray-200 bg-mist px-4 py-3 text-[13.5px] outline-none transition-all focus:border-navy-300 focus:bg-white focus:ring-4 focus:ring-navy-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  aria-label="Send message"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-green-500 text-white shadow-lg shadow-green-900/20 transition-all hover:bg-brand-green-600 disabled:opacity-40"
                >
                  <SendHorizonal size={17} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-gray-400">
                Powered by GNAB Assistant · For urgent matters <a href={CONTACT.whatsappLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-navy"><MessageCircle size={9} className="inline" /> WhatsApp us</a>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
