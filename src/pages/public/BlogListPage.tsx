import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Newspaper, User } from 'lucide-react'
import { BLOG_CATEGORIES, fetchPublishedPosts, setPageMeta, type BlogPost, useSiteSettings } from '@/lib/siteData.tsx'
import { IMAGES, cn } from '@/lib/utils'
import { PageHero, Reveal } from '@/components/ui'

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function BlogListPage() {
  const s = useSiteSettings()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')

  useEffect(() => {
    setPageMeta('Blog & Insights | GNAB Business Solutions', 'Procurement guides, industry trends and company news from GNAB Business Solutions.', IMAGES.hero2)
    void fetchPublishedPosts().then((p) => {
      setPosts(p)
      setLoading(false)
    })
  }, [])

  const shown = useMemo(() => (cat === 'All' ? posts : posts.filter((p) => p.category === cat)), [posts, cat])
  const featured = shown[0]
  const rest = shown.slice(1)

  return (
    <div>
      <PageHero
        eyebrow="Blog & Insights"
        title={<>{(s.blog_hero_title || 'Insights That Move Procurement Forward').replace(s.blog_hero_title_highlight || 'Procurement Forward', '').trim()} <span className="text-gradient-gold">{s.blog_hero_title_highlight || 'Procurement Forward'}</span></>}
        subtitle={s.blog_hero_subtitle || 'Guides, trends and company news for organisations that buy smarter.'}
        image={IMAGES.hero2}
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category filter */}
          <div className="mb-12 flex flex-wrap gap-2" role="tablist" aria-label="Filter articles by category">
            {['All', ...BLOG_CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-selected={cat === c}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold transition-all',
                  cat === c ? 'bg-navy text-white shadow-md' : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-[28px] bg-white" />)}
            </div>
          ) : shown.length === 0 ? (
            <Reveal>
              <div className="rounded-[32px] border border-dashed border-gray-200 bg-white p-20 text-center">
                <Newspaper size={44} strokeWidth={1.3} className="mx-auto text-navy-200" />
                <h2 className="mt-6 font-display text-xl font-bold text-navy">No articles here yet</h2>
                <p className="mx-auto mt-3 max-w-md text-ink-light">
                  We're preparing fresh insights for this section — check back soon.
                </p>
              </div>
            </Reveal>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <Reveal>
                  <Link
                    to={`/blog/${featured.slug}`}
                    className="group mb-10 grid overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-lift transition-all hover:-translate-y-1 lg:grid-cols-2"
                  >
                    <div className="relative min-h-[280px] overflow-hidden">
                      <img
                        src={featured.featured_image_url ?? IMAGES.hero1}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-12">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-600">{featured.category}</span>
                      <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-navy transition-colors group-hover:text-brand-green-600 md:text-3xl">
                        {featured.title}
                      </h2>
                      {featured.excerpt && <p className="mt-4 leading-relaxed text-ink-light">{featured.excerpt}</p>}
                      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
                        {featured.author && <span className="inline-flex items-center gap-1.5"><User size={13} /> {featured.author}</span>}
                        <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {fmtDate(featured.published_at)}</span>
                      </div>
                      <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-green-600 transition-all group-hover:gap-3.5">
                        Read Article <ArrowRight size={15} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              )}

              {/* Grid */}
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {rest.map((post) => (
                  <motion.article
                    key={post.id}
                    variants={{
                      hidden: { opacity: 0, y: 26 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    <Link to={`/blog/${post.slug}`} className="card-hover group flex h-full flex-col overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-soft">
                      <div className="relative h-44 overflow-hidden">
                        <img src={post.featured_image_url ?? IMAGES.about} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-navy shadow">
                          {post.category}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-brand-green-600">
                          {post.title}
                        </h3>
                        {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-light">{post.excerpt}</p>}
                        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-gray-400">
                          <span>{fmtDate(post.published_at)}</span>
                          <span className="inline-flex items-center gap-1 font-bold text-brand-green-600 transition-all group-hover:gap-2.5">
                            Read More <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
