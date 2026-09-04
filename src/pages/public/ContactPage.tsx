import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  LocateFixed,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import type { LineString } from 'geojson'
import type * as LeafletType from 'leaflet'
import { ALLOWED_ATTACHMENT_EXTS, canSubmit, FORMSPREE_ENDPOINT, IMAGES, isAllowedAttachment, isHoneypotFilled, recordSubmit, formStr} from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { setPageMeta, useSiteSettings } from '@/lib/siteData'
import { Button, Field, PageHero, Reveal, inputClass } from '@/components/ui'

type Loc = { name: string; address: string; latitude: number; longitude: number; google_maps_url: string | null; is_primary?: boolean }

function ContactMap({
  locations,
  userPos,
  selectedIdx,
  setSelectedIdx,
  routeGeo,
  routeInfo,
}: {
  locations: Loc[]
  userPos: { lat: number; lng: number } | null
  selectedIdx: number | null
  setSelectedIdx: (i: number | null) => void
  routeGeo: LineString | null
  routeInfo: { dist: string; dur: string } | null
}) {
  const [L, setL] = useState<typeof LeafletType | null>(null)
  useEffect(() => {
    import('leaflet').then((m) => setL((m as any).default ?? m)).catch(() => {})
  }, [])
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)

  // Init map once — 1A: leaflet is now lazy-loaded, not in initial bundle
  useEffect(() => {
    if (!L || !mapEl.current || mapRef.current || typeof window === 'undefined') return
    if (locations.length === 0) return
    const first = locations[0]!
    if (first.latitude == null || first.longitude == null) return
    const map = (L as any).map(mapEl.current, { zoomControl: true, scrollWheelZoom: false }).setView([first.latitude, first.longitude], 12)
    ;(L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 200)
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, locations.length > 0 ? 'ready' : 'empty'])

  // Update markers when locations / selection changes
  useEffect(() => {
    if (!L) return
    const map = mapRef.current
    if (!map || locations.length === 0) return
    const defaultIcon = (L as any).icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    const primaryIcon = (L as any).divIcon({
      html: '<div style="background:#D4AF37;width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#0B2E59;font-weight:900;font-size:14px;line-height:1">★</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    const selectedIcon = (L as any).divIcon({
      html: '<div style="background:#0B2E59;width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#D4AF37;font-weight:900">●</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    const bounds = (L as any).latLngBounds([])
    locations.forEach((loc, idx) => {
      const isSelected = idx === selectedIdx
      const isPrimary = (loc as unknown as { is_primary?: boolean }).is_primary
      const icon = isSelected ? selectedIcon : isPrimary ? primaryIcon : defaultIcon
      const marker = (L as any).marker([loc.latitude, loc.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px"><strong style="color:#0B2E59">${loc.name}</strong><br/><span style="color:#5b6572;font-size:13px">${loc.address}</span><br/><a href="#" data-idx="${idx}" class="leaflet-dir" style="color:#2E7D32;font-weight:700;font-size:12px;margin-top:6px;display:inline-block">Get directions →</a></div>`
        )
      marker.on('click', () => setSelectedIdx(idx))
      markersRef.current.push(marker)
      bounds.extend([loc.latitude, loc.longitude])
    })
    if (userPos) bounds.extend([userPos.lat, userPos.lng])
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.22), { maxZoom: 15 })
  }, [L, locations, selectedIdx, userPos])

  // Delegated click for popup directions link
  useEffect(() => {
    const el = mapEl.current
    if (!el) return
    const handler = (e: Event) => {
      const t = e.target as HTMLElement
      if (t && t.classList.contains('leaflet-dir')) {
        e.preventDefault()
        const idx = Number(t.getAttribute('data-idx'))
        if (!Number.isNaN(idx)) setSelectedIdx(idx)
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [setSelectedIdx])

  // User marker
  useEffect(() => {
    if (!L) return
    const map = mapRef.current
    if (!map) return
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }
    if (userPos) {
      const userIcon = (L as any).divIcon({
        html: '<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25)"></div>',
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      userMarkerRef.current = (L as any).marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map).bindPopup('Your location')
    }
  }, [L, userPos])

  // Route polyline
  useEffect(() => {
    if (!L) return
    const map = mapRef.current
    if (!map) return
    if (routeRef.current) { routeRef.current.remove(); routeRef.current = null }
    if (routeGeo) {
      routeRef.current = (L as any).geoJSON(routeGeo as unknown as GeoJSON.GeoJsonObject, { style: { color: '#0B2E59', weight: 5, opacity: 0.9 } }).addTo(map as unknown as any)
      const bounds = routeRef.current.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.2), { maxZoom: 15 })
    }
  }, [L, routeGeo])

  if (locations.length === 0) return null
  if (!L) return <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-soft leaflet-isolate relative z-0"><div className="h-[380px] w-full md:h-[520px] animate-pulse bg-mist" /></div>

  return (
    <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-soft leaflet-isolate relative z-0">
      <div className="relative z-0">
        <div ref={mapEl} className="h-[380px] w-full md:h-[520px]" style={{ background: '#F5F7FA' }} />
        {routeInfo && (
          <div className="absolute bottom-4 left-1/2 z-[10] -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-xl">
            {routeInfo.dist} · {routeInfo.dur}
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 bg-white p-4 text-[11px] text-gray-400">
        Map data © OpenStreetMap contributors · Free &amp; open — no API key required.
      </div>
    </div>
  )
}

export default function ContactPage() {
  const s = useSiteSettings()
  useEffect(() => {
    setPageMeta('Contact Us | GNAB Business Solutions', 'Questions, requests or partnerships — our team responds within hours, not days.')
  }, [])
  const [locations, setLocations] = useState<Loc[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [routeGeo, setRouteGeo] = useState<LineString | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ dist: string; dur: string } | null>(null)
  const [routeErr, setRouteErr] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)
  const [locErr, setLocErr] = useState('')

  useEffect(() => {
    supabase
      .from('locations')
      .select('name, address, latitude, longitude, google_maps_url, is_primary')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order')
      .order('created_at')
      .then(({ data }) => {
        if (data) setLocations((data as Loc[]).filter((r) => r.latitude !== null && r.longitude !== null))
      })
  }, [])

  const selectedLoc = selectedIdx !== null ? locations[selectedIdx] : null

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setLocErr('Geolocation not supported in this browser.'); return }
    setLocating(true); setLocErr('')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      (err) => { setLocErr(err.message || 'Could not get your location. Please allow location access.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const fetchRoute = async () => {
    if (!userPos || !selectedLoc) { setRouteErr('Select a location and allow your location first.'); return }
    setRouteLoading(true); setRouteErr(''); setRouteGeo(null); setRouteInfo(null)
    try {
      // OSRM free public — no key
      const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${selectedLoc.longitude},${selectedLoc.latitude}?overview=full&geometries=geojson`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Routing failed (${res.status})`)
      const data = await res.json()
      const route = data.routes?.[0]
      if (!route) throw new Error('No route found.')
      setRouteGeo(route.geometry)
      const km = (route.distance / 1000).toFixed(1)
      const mins = Math.round(route.duration / 60)
      setRouteInfo({ dist: `${km} km`, dur: `${mins} min drive` })
    } catch (e) {
      setRouteErr(e instanceof Error ? e.message : 'Could not calculate route.')
    } finally { setRouteLoading(false) }
  }

  // Auto-fetch route when both ends ready
  useEffect(() => {
    if (userPos && selectedLoc) void fetchRoute()
    else { setRouteGeo(null); setRouteInfo(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos?.lat, userPos?.lng, selectedIdx])

  const channels = [
    { icon: Mail, label: 'Email', value: s.email, href: `mailto:${s.email}` },
    { icon: Phone, label: 'Phone', value: s.phone, href: `tel:${s.phone.replace(/\s/g, '')}` },
    { icon: MessageCircle, label: 'WhatsApp', value: s.whatsapp, href: `https://wa.me/${s.whatsapp.replace(/\D/g, '')}`, external: true },
    { icon: MapPin, label: 'Address', value: s.address, href: undefined },
  ]
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    if (isHoneypotFilled(fd)) return
    if (!canSubmit('contact', 5)) { setError('Too many requests — please wait a minute before trying again.'); return }
    if (formStr(fd, 'message').length > 5000) { setError('Message too long (max 5000 characters).'); return }
    if (files.length > 5) { setError('Too many files (max 5).'); return }
    for (const f of files) {
      if (!isAllowedAttachment(f)) { setError(`File type not allowed: ${f.name}. Allowed: ${[...ALLOWED_ATTACHMENT_EXTS].join(', ')}`); return }
      if (f.size > 5 * 1024 * 1024) { setError(`File too large: ${f.name} (max 5MB)`); return }
    }
    setLoading(true)
    setError('')
    const fullName = formStr(fd, 'full_name')
    const email = formStr(fd, 'email')
    const phone = formStr(fd, 'phone')
    const subject = formStr(fd, 'subject')
    const message = formStr(fd, 'message')

    let attachmentUrls: string[] = []
    if (files.length > 0) {
      try {
        for (const file of files) {
          const path = `contact/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
          const { error: upErr } = await supabase.storage.from('attachments').upload(path, file)
          if (!upErr) {
            const { data } = supabase.storage.from('attachments').getPublicUrl(path)
            attachmentUrls.push(data.publicUrl)
          }
        }
      } catch { /* non-fatal */ }
    }

    try {
      await supabase.from('contact_messages').insert({
        full_name: fullName,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        attachment_urls: attachmentUrls,
        status: 'new',
      })
    } catch { /* non-fatal */ }

    try {
      const formFd = new FormData(form)
      if (attachmentUrls.length > 0) formFd.set('attachment_urls', attachmentUrls.join('\n'))
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formFd,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        recordSubmit('contact')
        setSubmitted(true)
        form.reset()
        setFiles([])
      } else {
        setError('Something went wrong while sending. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasLocations = locations.length > 0

  return (
    <div>
      <PageHero
        eyebrow="Contact Us"
        title={<>{(s.contact_hero_title || "Let's Start a Conversation").replace(s.contact_hero_title_highlight || 'Conversation', '').trim()} <span className="text-gradient-gold">{s.contact_hero_title_highlight || 'Conversation'}</span></>}
        subtitle={s.contact_hero_subtitle || 'Questions, requests or partnerships — our team responds within hours, not days.'}
        image={IMAGES.about2}
      />

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
            <div>
              <Reveal>
                <h2 className="font-display text-3xl font-bold text-navy">{s.contact_get_in_touch_title || 'Get in Touch'}</h2>
                <p className="mt-4 leading-relaxed text-ink-light">
                  {s.contact_get_in_touch_desc || 'Choose the channel that suits you best.'} We are available Monday – Friday, {s.hours_weekday || '8:00 – 17:00'} GMT
                  {s.hours_saturday && s.hours_saturday !== 'Closed' ? ` · Saturday ${s.hours_saturday}` : ''}.
                </p>
              </Reveal>

              <div className="mt-10 space-y-4">
                {channels.map((c, i) => (
                  <Reveal key={c.label} delay={i * 0.07}>
                    <a
                      href={c.href}
                      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={`group flex items-center gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft transition-all duration-300 ${
                        c.href ? 'hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift' : 'cursor-default'
                      }`}
                    >
                      <span className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-2xl bg-navy-50 p-3.5 text-navy transition-colors duration-300 group-hover:bg-brand-green-500 group-hover:text-white">
                        <c.icon size={22} />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-ink-light">{c.label}</span>
                        <span className="mt-1 block font-medium text-navy">{c.value}</span>
                      </span>
                    </a>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.3}>
                <div className="relative mt-8 overflow-hidden rounded-3xl bg-navy p-7 text-white">
                  <div className="relative flex items-start gap-4">
                    <Clock size={24} className="mt-0.5 flex-shrink-0 text-gold-400" />
                    <div className="flex-1">
                      <h3 className="font-display font-bold">Business Hours</h3>
                      <ul className="mt-3 space-y-1.5 text-sm text-navy-100/80">
                        <li className="flex justify-between gap-6"><span>Monday – Friday</span><span className="font-medium text-white">{s.hours_weekday || '8:00 – 17:00'}</span></li>
                        <li className="flex justify-between gap-6"><span>Saturday</span><span className="font-medium text-white">{s.hours_saturday || 'Closed'}</span></li>
                        <li className="flex justify-between gap-6"><span>Sunday</span><span className="font-medium text-white">{s.hours_sunday || 'Closed'}</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="rounded-[32px] border border-gray-100 bg-mist p-8 shadow-soft md:p-11">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex min-h-[420px] flex-col items-center justify-center text-center"
                  >
                    <CheckCircle2 size={64} strokeWidth={1.4} className="text-brand-green-500" />
                    <h3 className="mt-7 font-display text-2xl font-bold text-navy">{s.contact_form_success_title || 'Message Sent Successfully'}</h3>
                    <p className="mt-3 max-w-sm leading-relaxed text-ink-light">
                      {s.contact_form_success_desc || 'Thank you for contacting GNAB Business Solutions. We will respond as soon as possible.'}
                    </p>
                    <button onClick={() => setSubmitted(false)} className="mt-8 text-sm font-semibold text-brand-green-600 hover:underline">
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="font-display text-2xl font-bold text-navy">{s.contact_form_title || 'Send Us a Message'}</h3>
                    <p className="mt-2 text-sm text-ink-light">{s.contact_form_subtitle || 'We typically reply within a few hours.'}</p>
                    <form onSubmit={handleSubmit} className="mt-9 space-y-6">
                      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field label="Full Name" required>
                          <input type="text" name="full_name" required placeholder="Your full name" className={inputClass} autoComplete="name" />
                        </Field>
                        <Field label="Email" required>
                          <input type="email" name="email" required placeholder="you@company.com" className={inputClass} autoComplete="email" inputMode="email" />
                        </Field>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <Field label="Phone">
                          <input type="tel" name="phone" placeholder="+233 ..." className={inputClass} autoComplete="tel" inputMode="tel" />
                        </Field>
                        <Field label="Subject" required>
                          <input type="text" name="subject" required placeholder="How can we help?" className={inputClass} />
                        </Field>
                      </div>
                      <Field label="Message" required>
                        <textarea name="message" rows={6} required placeholder="Tell us more about your inquiry..." className={`${inputClass} resize-none`} />
                      </Field>
                      <Field label="Attach Documents / Images (optional)">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                          className="w-full rounded-xl border border-gray-200 bg-mist/60 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-600"
                        />
                        {files.length > 0 && <p className="mt-2 text-xs text-ink-light">{files.length} file(s) selected: {files.map((f) => f.name).join(', ')}</p>}
                      </Field>
                      {error && (
                        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">{error}</p>
                      )}
                      <Button loading={loading} type="submit">
                        <Send size={17} /> Send Message
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Interactive Map — Leaflet + OSM, all active locations as pins, free routing from user */}
      <section className="bg-mist py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            {hasLocations ? (
              <div className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-soft">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4 md:px-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white"><MapPin size={16} /></span>
                    <div>
                      <p className="font-display text-sm font-bold text-navy">Our Locations ({locations.length})</p>
                      <p className="text-xs text-ink-light">Tap a pin or card to get directions from your location — free, no API key.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={requestLocation} disabled={locating} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-navy hover:border-navy disabled:opacity-60">
                      <LocateFixed size={14} /> {locating ? 'Locating…' : userPos ? 'Update my location' : 'Use my location'}
                    </button>
                    {userPos && selectedLoc && (
                      <button onClick={fetchRoute} disabled={routeLoading} className="inline-flex items-center gap-2 rounded-full bg-brand-green-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60">
                        <Navigation size={14} /> {routeLoading ? 'Routing…' : 'Route'}
                      </button>
                    )}
                  </div>
                </div>
                {locErr && <p className="bg-amber-50 px-5 py-2 text-xs font-medium text-amber-700 md:px-8">{locErr}</p>}
                {routeErr && <p className="bg-red-50 px-5 py-2 text-xs font-medium text-red-600 md:px-8">{routeErr}</p>}
                {selectedLoc && (
                  <div className="flex flex-wrap items-center gap-2 bg-navy-50 px-5 py-3 text-xs md:px-8">
                    <span className="font-semibold text-navy">Selected:</span>
                    <span className="font-medium text-ink">{selectedLoc.name} — {selectedLoc.address}</span>
                    {userPos ? (
                      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-navy ring-1 ring-gray-200">
                        <span className="h-2 w-2 rounded-full bg-green-500" /> {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="ml-auto text-ink-light">Allow location to see route on map.</span>
                    )}
                  </div>
                )}

                <ContactMap locations={locations} userPos={userPos} selectedIdx={selectedIdx} setSelectedIdx={setSelectedIdx} routeGeo={routeGeo} routeInfo={routeInfo} />

                <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
                  {locations.map((loc, idx) => {
                    const isSel = idx === selectedIdx
                    return (
                      <div key={loc.name + idx} className={`flex gap-4 rounded-2xl border p-5 text-left transition-all ${isSel ? 'border-navy bg-navy-50 ring-1 ring-navy' : 'border-gray-100 bg-mist hover:border-navy-200'}`}>
                        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isSel ? 'bg-navy text-white' : loc.is_primary ? 'bg-gold-400 text-navy' : 'bg-navy text-white'}`}><MapPin size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-navy">{loc.name} {loc.is_primary && <span className="ml-2 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-navy">PRIMARY</span>}</p>
                          <p className="mt-1 text-sm leading-relaxed text-ink-light">{loc.address}</p>
                          <p className="mt-1 font-mono text-xs text-gray-400">{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button onClick={() => setSelectedIdx(idx)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isSel ? 'bg-navy text-white' : 'bg-white text-navy ring-1 ring-gray-200 hover:bg-navy hover:text-white'}`}>
                              {isSel ? 'Selected' : 'Select for directions'}
                            </button>
                            {userPos ? (
                              <a
                                href={`https://www.openstreetmap.org/directions?from=${userPos.lat},${userPos.lng}&to=${loc.latitude},${loc.longitude}#map=14/${loc.latitude}/${loc.longitude}`}
                                target="_blank" rel="noopener noreferrer"
                                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-gray-200 hover:bg-mist"
                              >
                                Open in OSM →
                              </a>
                            ) : (
                              loc.google_maps_url && <a href={loc.google_maps_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-gray-200 hover:bg-mist">Google Maps →</a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="relative flex h-72 flex-col items-center justify-center overflow-hidden rounded-[32px] border border-gray-100 bg-white px-6 py-10 text-center shadow-soft">
                <MapPin size={36} className="text-gold-500" />
                <p className="mt-4 font-display text-lg font-bold text-navy">{s.address}</p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-light">Our interactive Leaflet map will appear here once you add locations in <span className="font-semibold text-navy">Admin → Locations</span>.</p>
                <p className="mt-3 text-xs text-ink-light">Tip: Add multiple locations — all pins show on one Leaflet-OpenStreetMap with free routing, identical in every browser.</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  )
}
