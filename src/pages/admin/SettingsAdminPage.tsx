import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { ErrorBanner } from '@/components/admin/bits'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { inputClass } from '@/components/ui'
import { useSiteSettings, type SiteSettings } from '@/lib/siteData.tsx'

type Draft = Record<keyof SiteSettings, string>

const SECTIONS: { title: string; fields: { key: keyof SiteSettings; label: string; type?: 'text' | 'textarea'; placeholder?: string }[] }[] = [
  {
    title: 'Company Information',
    fields: [
      { key: 'company_name', label: 'Company Name' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'company_description', label: 'Company Description', type: 'textarea' },
      { key: 'address', label: 'Business Address' },
    ],
  },
  {
    title: 'Contact Information',
    fields: [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'whatsapp', label: 'WhatsApp Number' },
    ],
  },
  {
    title: 'Social Media',
    fields: [
      { key: 'social_linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/…' },
      { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/…' },
      { key: 'social_twitter', label: 'X / Twitter URL', placeholder: 'https://x.com/…' },
      { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/…' },
    ],
  },
  {
    title: 'Website & SEO',
    fields: [
      { key: 'seo_title', label: 'Homepage SEO Title' },
      { key: 'seo_description', label: 'Homepage SEO Description', type: 'textarea' },
      { key: 'footer_text', label: 'Footer Text' },
    ],
  },
  {
    title: 'Business Hours',
    fields: [
      { key: 'hours_weekday', label: 'Monday – Friday', placeholder: 'e.g. 8:00 – 17:00' },
      { key: 'hours_saturday', label: 'Saturday', placeholder: 'e.g. 9:00 – 13:00 or Closed' },
      { key: 'hours_sunday', label: 'Sunday', placeholder: 'e.g. Closed' },
    ],
  },
]

export default function SettingsAdminPage() {
  const settings = useSiteSettings()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>({ ...DEFAULTS(settings) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  function DEFAULTS(s: SiteSettings): Draft {
    return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v])) as Draft
  }

  useEffect(() => {
    document.title = 'Settings | GNAB Admin'
  }, [])

  useEffect(() => {
    setDraft(DEFAULTS(settings))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    const settingsRecord: Record<string, string> = { ...settings }
    const updates = Object.entries(draft).filter(([key, value]) => value !== settingsRecord[key])
    if (updates.length === 0) {
      setSaving(false)
      return
    }
    for (const [key, value] of updates) {
      const { error: err } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
      if (err) {
        setError(`Could not save "${key}": ${err.message}. Run migration 005 first.`)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
    window.location.reload() // re-fetch settings into the provider site-wide
  }

  const changePassword = async () => {
    setPwMsg('')
    setError('')
    if (pw.length < 8) {
      setPwMsg('Password must be at least 8 characters.')
      return
    }
    setPwBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password: pw })
    setPwBusy(false)
    if (err) {
      setPwMsg(`Could not change password: ${err.message}`)
      return
    }
    setPwMsg('Password updated successfully.')
    setPw('')
    setPwOpen(false)
  }

  return (
    <div>
      <PageIntro
        title="Settings"
        description="Single source of truth for company information across the website. Changes apply everywhere after saving."
        action={
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-60">
            {saved ? <Check size={15} /> : saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Branding */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Branding</h3>
        <div className="mt-5">
          <ImageUploader value={draft.logo_url} onChange={(url) => setDraft({ ...draft, logo_url: url })} label="Company Logo" folder="branding" />
          <p className="mt-2 text-xs text-ink-light">Logo appears in header, footer and — by default — as the browser tab favicon and social share image. Override below if you want a different favicon or OG image.</p>
        </div>
      </section>

      {/* Favicon & Open Graph — truly mirrored, brand logo by default */}
      <section className="mb-6 rounded-[24px] border border-amber-100 bg-amber-50/30 p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Favicon & Social Sharing (Open Graph)</h3>
        <p className="mt-1 text-sm text-ink-light">Decide what image appears in the browser tab (favicon) and when you share the site on WhatsApp/Facebook/Twitter. By default the brand logo is used for both so the tab shows your logo, not the purple thunderbolt.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <ImageUploader value={draft.favicon_url} onChange={(url) => setDraft({ ...draft, favicon_url: url })} label="Browser Tab Favicon" folder="branding" />
            <p className="mt-2 text-xs text-ink-light">Shown in the browser tab. Upload a square PNG/SVG (512×512) or paste a URL. Leave empty to use the Company Logo above. Saved as <span className="font-mono">favicon_url</span> — instantly updates the tab.</p>
            {draft.favicon_url && draft.favicon_url !== draft.logo_url && (
              <button onClick={() => setDraft({ ...draft, favicon_url: draft.logo_url })} className="mt-2 text-xs font-semibold text-brand-green-600 hover:underline">Use logo as favicon</button>
            )}
          </div>
          <div>
            <ImageUploader value={draft.og_image_url} onChange={(url) => setDraft({ ...draft, og_image_url: url })} label="Open Graph Image (social share)" folder="branding" />
            <p className="mt-2 text-xs text-ink-light">Shown when you share the site on WhatsApp/Facebook. Recommended 1200×630. Leave empty to use the favicon/logo. Saved as <span className="font-mono">og_image_url</span>.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setDraft({ ...draft, og_image_url: draft.favicon_url || draft.logo_url })} className="text-xs font-semibold text-brand-green-600 hover:underline">Use favicon</button>
              <span className="text-gray-300">·</span>
              <button onClick={() => setDraft({ ...draft, og_image_url: draft.logo_url })} className="text-xs font-semibold text-brand-green-600 hover:underline">Use logo</button>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-amber-200">
          <p className="text-xs font-semibold text-navy">Live preview — current tab icon vs old purple thunderbolt</p>
          <div className="mt-2 flex items-center gap-3">
            <img src={draft.favicon_url || draft.logo_url} alt="Current favicon preview" className="h-8 w-8 rounded bg-white p-1 ring-1 ring-gray-200" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <span className="text-xs text-ink-light">This is what appears in the browser tab after you save. The old purple thunderbolt was <span className="font-mono">/favicon.svg</span> — now it mirrors your brand logo.</span>
          </div>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">{section.title}</h3>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {section.fields.map((f) => (
              <label key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <span className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">{f.label}</span>
                {f.type === 'textarea' ? (
                  <textarea rows={3} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={`${inputClass} resize-none`} />
                ) : (
                  <input type={f.key === 'email' ? 'email' : 'text'} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} className={inputClass} />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      {/* Header top bar — editable content + visibility, mirrored to public header */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Header Top Bar (contact strip)</h3>
        <p className="mt-1 text-sm text-ink-light">This is the dark strip with <span className="font-mono text-xs">phone · email · tagline</span> above the navigation. Hide the whole strip, or toggle each item, and edit what it shows — edits apply instantly.</p>

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-navy-100 bg-navy-50 p-4">
          <span className="text-sm font-bold text-navy">Show top bar on site</span>
          <input type="checkbox" checked={(draft.header_show_top_bar ?? 'true') !== 'false'} onChange={(e) => setDraft({ ...draft, header_show_top_bar: e.target.checked ? 'true' : 'false' })} className="h-4 w-4 accent-brand-green-500" />
        </label>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-light"><input type="checkbox" checked={(draft.header_show_phone ?? 'true') !== 'false'} onChange={(e) => setDraft({ ...draft, header_show_phone: e.target.checked ? 'true' : 'false' })} className="h-4 w-4 accent-brand-green-500" /> Show phone</label>
            <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+233 55 427 3445" className={`${inputClass} mt-3`} />
            <p className="mt-1 text-[11px] text-gray-400">Opens <span className="font-mono">tel:</span> link</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-light"><input type="checkbox" checked={(draft.header_show_email ?? 'true') !== 'false'} onChange={(e) => setDraft({ ...draft, header_show_email: e.target.checked ? 'true' : 'false' })} className="h-4 w-4 accent-brand-green-500" /> Show email</label>
            <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="gnabsolutions@gmail.com" className={`${inputClass} mt-3`} />
            <p className="mt-1 text-[11px] text-gray-400">Opens <span className="font-mono">mailto:</span> link</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-light"><input type="checkbox" checked={(draft.header_show_tagline ?? 'true') !== 'false'} onChange={(e) => setDraft({ ...draft, header_show_tagline: e.target.checked ? 'true' : 'false' })} className="h-4 w-4 accent-brand-green-500" /> Show tagline</label>
            <input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} placeholder="One Partner. Endless Solutions." className={`${inputClass} mt-3`} />
            <p className="mt-1 text-[11px] text-gray-400">Right side of strip</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-light">When “Show top bar” is off, the header starts at the navigation bar on all public pages — header_show_phone/email/tagline are ignored.</p>
      </section>

      {/* Administrator account */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Administrator Account</h3>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-ink-light">
            Signed in as <span className="font-semibold text-navy"><AdminEmail /></span>
          </p>

          {!pwOpen ? (
            <button onClick={() => setPwOpen(true)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy">
              Change Password
            </button>
          ) : (
            <div className="max-w-md space-y-3">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="New password (min. 8 characters)"
                  aria-label="New password"
                  className={`${inputClass} pr-12`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-navy">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={changePassword} disabled={pwBusy} className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-500 disabled:opacity-60">
                  {pwBusy ? 'Updating…' : 'Update Password'}
                </button>
                <button onClick={() => { setPwOpen(false); setPwMsg('') }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-ink-light hover:border-navy hover:text-navy">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {pwMsg && <p className={`text-sm font-medium ${pwMsg.startsWith('Password updated') ? 'text-brand-green-600' : 'text-red-600'}`}>{pwMsg}</p>}

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              void navigate('/admin/login', { replace: true })
            }}
            className="block text-sm font-semibold text-red-500 hover:underline"
          >
            Sign out of this device
          </button>
        </div>
      </section>

      {/* Advanced — truly mirrored: every site_settings key, including those from Pages admin */}
      <section className="mb-6 rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-navy">Advanced — All Settings (mirrored)</h3>
        <p className="mt-1 text-sm text-ink-light">Every <span className="font-mono">site_settings</span> key is shown here so nothing is hidden. Edit any value directly — same keys used by <span className="font-semibold">Admin → Pages</span> and public site. Changes here and in Pages stay in sync (same DB row).</p>
        <div className="mt-5 grid gap-3 max-h-[420px] overflow-auto rounded-2xl border border-gray-100 bg-mist/30 p-3">
          {Object.entries(draft).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>(
            <label key={k} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-gray-100">
              <span className="min-w-[180px] truncate font-mono text-xs font-semibold text-navy" title={k}>{k}</span>
              <input value={v} onChange={(e)=>setDraft({...draft, [k]: e.target.value})} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-mist/50 px-3 py-1.5 text-xs" placeholder={k.includes('url') ? 'https://...' : k.includes('show_') ? 'true / false' : ''} />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-light">Tip: <span className="font-mono">favicon_url</span> and <span className="font-mono">og_image_url</span> above control the browser tab icon and social share image. Upload via the Favicon section or paste a URL here.</p>
      </section>

      <button onClick={save} disabled={saving} className="mb-10 w-full rounded-full bg-brand-green-500 py-4 font-semibold text-white transition-colors hover:bg-brand-green-600 disabled:opacity-60">
        {saving ? 'Saving…' : saved ? 'Saved successfully!' : 'Save All Changes'}
      </button>
    </div>
  )
}

function AdminEmail() {
  const [email, setEmail] = useState('')
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])
  return <>{email || '…'}</>
}
