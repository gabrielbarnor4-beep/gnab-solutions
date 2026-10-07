import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, PackageSearch, Search, X } from 'lucide-react'
import { CATALOGUE, canonicalCatalogueSlug } from '@/lib/catalogue'
import { openAssistant } from '@/lib/assistant'
import { fetchPublicProducts, setPageMeta, type PublicProduct, useSiteSettings } from '@/lib/siteData'
import { IMAGES, cn } from '@/lib/utils'
import { matchSlug } from '@/lib/design'
import { PageHero, PremiumCTA, Reveal } from '@/components/ui'

interface Group {
  slug: string
  title: string
  shortTitle: string
  intro: string
  products: { name: string; desc: string; image_url?: string | null }[]
}

const shortTitleOf = (name: string) => {
  const words = name.split(/[\s&]+/).filter(Boolean)
  return words.length <= 2 ? name : `${words[0]} ${words[1]}`
}

export default function ProductsPage() {
  const s = useSiteSettings()
  const [params, setParams] = useSearchParams()
  const activeSlug = params.get('category')
  const [query, setQuery] = useState('')
  const [dbProducts, setDbProducts] = useState<PublicProduct[] | null>(null)

  useEffect(() => {
    setPageMeta('Products | GNAB Business Solutions', 'Browse our curated product catalogue — request a quote on any item and receive pricing within 24 hours.', IMAGES.warehouse)
    void fetchPublicProducts().then(({ products, fromDb }) => setDbProducts(fromDb ? products : []))
  }, [])

  /**
   * Groups shown on the page. When admins have added products in Supabase they are
   * grouped by their category; otherwise the built-in catalogue is displayed so the
   * page is never empty.
   */
  const catalogue: Group[] = useMemo(() => {
    if (dbProducts === null || dbProducts.length === 0) {
      return CATALOGUE.map((c) => ({
        slug: c.slug,
        title: c.title,
        shortTitle: c.shortTitle,
        intro: c.intro,
        products: c.products.map((p) => ({ name: p.name, desc: p.desc })),
      }))
    }
    const groups: Group[] = []
    const staticBySlug = new Map(CATALOGUE.map((c) => [c.slug, c]))
    for (const p of dbProducts) {
      const rawTitle = (p.category ?? 'Other Products').trim() || 'Other Products'
      // Canonical slug merges DB variants ("automobile-services-spares") with
      // static slugs ("automobile-services") so automobile never falls into stationery.
      const canonSlug = canonicalCatalogueSlug(rawTitle)
      const staticCat = staticBySlug.get(canonSlug)
      const title = staticCat?.title ?? rawTitle
      let g = groups.find((x) => x.slug === canonSlug)
      if (!g) {
        g = { slug: canonSlug, title, shortTitle: staticCat?.shortTitle ?? shortTitleOf(title), intro: staticCat?.intro ?? '', products: [] }
        groups.push(g)
      } else if (staticCat && g.title !== staticCat.title) {
        g.title = staticCat.title
        g.shortTitle = staticCat.shortTitle
        if (!g.intro) g.intro = staticCat.intro
      }
      g.products.push({ name: p.name, desc: p.short_description ?? '', image_url: p.image_url })
    }
    // Stable order follows CATALOGUE, unknown groups appended at the end.
    groups.sort((a, b) => {
      const ia = CATALOGUE.findIndex((c) => c.slug === a.slug)
      const ib = CATALOGUE.findIndex((c) => c.slug === b.slug)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    return groups
  }, [dbProducts])

  const totalCount = catalogue.reduce((n, c) => n + c.products.length, 0)

  const selectCategory = (slug: string | null) => {
    setParams(slug ? { category: slug } : {}, { replace: true })
  }

  const visible = useMemo(() => {
    const cats = activeSlug ? catalogue.filter((c) => matchSlug(c.slug, activeSlug) || matchSlug(c.title, activeSlug)) : catalogue
    if (!query.trim()) return cats
    const q = query.toLowerCase()
    return cats
      .map((c) => ({
        ...c,
        products: c.products.filter(
          (p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.products.length > 0)
  }, [catalogue, activeSlug, query])

  const resultCount = visible.reduce((n, c) => n + c.products.length, 0)

  return (
    <div>
      <PageHero
        eyebrow="Product Catalogue"
        title={<>{(s.products_hero_title || 'Everything Your Business Needs').replace(s.products_hero_title_highlight || 'Your Business Needs', '').trim()} <span className="text-gradient-gold">{s.products_hero_title_highlight || 'Your Business Needs'}</span></>}
        subtitle={`${totalCount}+ curated products across ${catalogue.length} catalogues — ${s.products_hero_subtitle || 'request a quote on any item and receive pricing within 24 hours.'}`}
        image={IMAGES.warehouse}
      />

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
            {/* chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible" role="tablist" aria-label="Filter products by catalogue">
              <button
                onClick={() => selectCategory(null)}
                aria-selected={!activeSlug}
                className={cn(
                  'flex-shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200',
                  !activeSlug
                    ? 'bg-navy text-white shadow-md'
                    : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'
                )}
              >
                All Products
              </button>
              {catalogue.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => selectCategory(c.slug)}
                  aria-selected={!!activeSlug && (matchSlug(c.slug, activeSlug) || matchSlug(c.title, activeSlug))}
                  className={cn(
                    'flex-shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200',
                    activeSlug && (matchSlug(c.slug, activeSlug) || matchSlug(c.title, activeSlug))
                      ? 'bg-navy text-white shadow-md'
                      : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'
                  )}
                >
                  {c.shortTitle}
                </button>
              ))}
            </div>

            {/* search */}
            <div className="relative flex-shrink-0 lg:w-64">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={s.products_search_placeholder || 'Search products...'}
                aria-label="Search products"
                className="w-full rounded-full border border-gray-200 bg-mist/70 py-2.5 pl-10 pr-9 text-sm outline-none transition-all focus:border-navy-300 focus:bg-white focus:ring-4 focus:ring-navy-100"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-navy"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="mb-12 text-sm font-medium uppercase tracking-wide text-ink-light">
              Showing <span className="font-bold text-navy">{resultCount}</span>{' '}
              {activeSlug ? `product${resultCount !== 1 ? 's' : ''} in ${catalogue.find((c) => matchSlug(c.slug, activeSlug) || matchSlug(c.title, activeSlug))?.title}` : `of ${totalCount} products`}
            </p>
          </Reveal>

          {resultCount === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <PackageSearch size={56} strokeWidth={1.3} className="text-navy-200" />
              <h2 className="mt-6 font-display text-xl font-bold text-navy">{s.products_empty_title || 'No products match your search'}</h2>
              <p className="mt-3 max-w-md text-ink-light">
                {s.products_empty_desc || 'Try a different keyword — or ask us directly. If it exists, we can source it.'}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to="/quote" className="inline-flex items-center gap-2 rounded-full bg-brand-green-500 px-7 py-3 font-semibold text-white hover:bg-brand-green-600">
                  Request Custom Sourcing <ArrowRight size={15} />
                </Link>
                <button
                  onClick={() => openAssistant(query ? `Do you supply ${query}?` : 'What do you supply?')}
                  className="inline-flex items-center gap-2 rounded-full border border-navy-200 px-7 py-3 font-semibold text-navy transition-all hover:border-navy hover:bg-navy hover:text-white"
                >
                  Ask the Assistant
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-16">
              {visible.map((cat) => (
                <div key={cat.slug}>
                  {!activeSlug && (
                    <Reveal className="mb-8 flex items-end justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h2 className="font-display text-2xl font-bold text-navy">{cat.title}</h2>
                        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-light">{cat.intro}</p>
                      </div>
                      <button
                        onClick={() => selectCategory(cat.slug)}
                        className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-navy transition-all hover:border-navy hover:bg-navy hover:text-white md:inline-flex"
                      >
                        View only <ArrowRight size={13} />
                      </button>
                    </Reveal>
                  )}

                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {cat.products.map((p) => (
                      <motion.article
                        key={p.name}
                        variants={{
                          hidden: { opacity: 0, y: 22 },
                          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                        }}
                        className="card-hover group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-soft"
                      >
                        {p.image_url && (
                          <span className="-mx-6 -mt-6 mb-5 block h-40 overflow-hidden rounded-t-3xl bg-mist">
                            <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          </span>
                        )}
                        <span className="w-fit rounded-full bg-navy-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy-500">
                          {cat.shortTitle}
                        </span>
                        <h3 className="mt-4 font-display text-[17px] font-bold leading-snug text-navy">{p.name}</h3>
                        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-light">{p.desc}</p>
                        <Link
                          to={`/quote?product=${encodeURIComponent(p.name)}&category=${cat.slug}`}
                          className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-green-600 transition-all duration-300 group-hover:gap-2.5"
                        >
                          Request Quote <ArrowRight size={15} />
                        </Link>
                      </motion.article>
                    ))}
                  </motion.div>
                </div>
              ))}
            </div>
          )}

          <PremiumCTA
            eyebrow={s.products_cta_eyebrow || 'Custom sourcing'}
            title={s.products_cta_title || "Can't Find What You Need?"}
            titleHighlight={s.products_cta_title_highlight}
            features={[s.products_cta_feature1, s.products_cta_feature2, s.products_cta_feature3]}
            subtitle={s.products_cta_subtitle || 'Our sourcing team tracks down anything your business requires — locally or internationally.'}
            primary={{ label: s.products_cta_primary_label || 'Request Custom Sourcing', to: '/quote?product=Custom%20Sourcing%20Request&category=custom-sourcing' }}
            secondary={{ label: s.products_cta_secondary_label || 'Browse Services', to: '/services' }}
          />
        </div>
      </section>
    </div>
  )
}
