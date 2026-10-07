import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Link2, User } from 'lucide-react'
import { fetchPostBySlug, fetchPublishedPosts, setPageMeta, type BlogPost } from '@/lib/siteData.tsx'
import { IMAGES } from '@/lib/utils'
import { ButtonLink, PageHero, Reveal } from '@/components/ui'

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPost | null | 'missing'>(null)
  const [related, setRelated] = useState<BlogPost[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setPost(null)
    if (!slug) return
    void fetchPostBySlug(slug).then((p) => {
      setPost(p ?? 'missing')
      if (p) {
        setPageMeta(
          p.meta_title || `${p.title} | GNAB Business Solutions`,
          p.meta_description || p.excerpt || undefined,
          p.featured_image_url || undefined
        )
        void fetchPublishedPosts(p.category).then((all) => setRelated(all.filter((r) => r.id !== p.id).slice(0, 3)))
      }
    })
  }, [slug])

  const shareUrl = window.location.href

  const share = (network: 'copy' | 'x' | 'whatsapp' | 'linkedin') => {
    const text = post && typeof post === 'object' ? post.title : ''
    const map = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} — ${shareUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    }
    if (network === 'copy') {
      void navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    window.open(map[network], '_blank', 'noopener,noreferrer')
  }

  /* Not found / draft */
  if (post === 'missing') {
    return (
      <div>
        <PageHero
          eyebrow="Blog & Insights"
          title={<>Article <span className="text-gradient-gold">Not Available</span></>}
          subtitle="This article does not exist or is no longer published."
        />
        <div className="bg-mist py-20 text-center">
          <ButtonLink to="/blog" variant="primary">Back to all articles</ButtonLink>
        </div>
      </div>
    )
  }

  /* Loading */
  if (!post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-100 border-t-navy" />
      </div>
    )
  }

  const paragraphs = (post.content ?? '').split(/\n{2,}/).filter(Boolean)

  return (
    <div>
      {/* Hero — premium CTA style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-800 to-navy-900">
        <img src={post.featured_image_url ?? IMAGES.hero1} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.07]" aria-hidden />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-green-500/10 blur-3xl" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-28">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/10 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-400 backdrop-blur-sm">
              {post.category}
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-3xl font-extrabold leading-tight text-white md:text-5xl">
              {post.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-navy-100/80">
              {post.author && <span className="inline-flex items-center gap-1.5"><User size={14} /> {post.author}</span>}
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {fmtDate(post.published_at)}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <article className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            {post.excerpt && (
              <p className="border-l-4 border-gold-400 pl-6 font-display text-lg font-medium leading-relaxed text-navy md:text-xl">
                {post.excerpt}
              </p>
            )}
            <div className="mt-8 space-y-6 text-[17px] leading-relaxed text-ink">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              {paragraphs.length === 0 && <p className="text-ink-light">This article has no content yet.</p>}
            </div>
          </Reveal>

          {post.tags?.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-gray-100 pt-8">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-mist px-4 py-1.5 text-xs font-semibold text-ink-light">#{t}</span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-8">
            <span className="text-sm font-bold uppercase tracking-wide text-ink-light">Share</span>
            {(['x', 'linkedin', 'whatsapp'] as const).map((n) => (
              <button key={n} onClick={() => share(n)} aria-label={`Share on ${n}`} className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-light transition-all hover:border-navy hover:text-navy">
                {n === 'x' ? 'X / Twitter' : n}
              </button>
            ))}
            <button onClick={() => share('copy')} aria-label="Copy article link" className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-light transition-all hover:border-navy hover:text-navy">
              {copied ? <Check size={12} /> : <Link2 size={12} />} {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <Link to="/blog" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-brand-green-600 hover:underline">
            <ArrowLeft size={15} /> Back to all articles
          </Link>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-mist py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">Related Articles</h2>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className="mt-8 grid gap-6 md:grid-cols-3"
            >
              {related.map((r) => (
                <motion.div key={r.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                  <Link to={`/blog/${r.slug}`} className="card-hover group flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-soft">
                    <div className="relative h-40 overflow-hidden">
                      <img src={r.featured_image_url ?? IMAGES.about} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-gold-600">{r.category}</span>
                      <h3 className="mt-2 line-clamp-2 font-display font-bold text-navy transition-colors group-hover:text-brand-green-600">{r.title}</h3>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-green-600 transition-all group-hover:gap-3">
                        Read <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}
