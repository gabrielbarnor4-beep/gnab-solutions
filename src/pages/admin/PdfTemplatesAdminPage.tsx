import { useCallback, useEffect, useState } from 'react'
import { Eye, ClipboardList, Code2, FileText, Mail, Plus, Receipt, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageIntro } from '@/components/admin/AdminLayout'
import { ErrorBanner, Skeletons } from '@/components/admin/bits'
import { inputClass } from '@/components/ui'
import { fetchAllPdfTemplates, type PdfTemplate } from '@/lib/pdf'

const TYPE_LABEL: Record<PdfTemplate['type'], { label: string; icon: typeof FileText; desc: string }> = {
  quotation: { label: 'Quotation', icon: FileText, desc: 'Sent from Quotes → New Quotation → Save & Email PDF. Header, table, totals and terms are editable.' },
  website_package: { label: 'Website Package', icon: Code2, desc: 'Standard website package (pages / CMS / care plan). Offered in the Quotes builder for IT Solutions RFQs; standard line items load in one click. Fully editable.' },
  erp_discovery: { label: 'ERP Discovery', icon: ClipboardList, desc: 'Fixed-fee ERP discovery (requirements, vendor selection, coordination). Offered in the Quotes builder for ERP RFQs; implementation is quoted separately.' },
  message_reply: { label: 'Message Reply', icon: Mail, desc: 'Sent from Messages → Reply → Send as PDF Email. Body is the admin reply.' },
  receipt: { label: 'Receipt', icon: Receipt, desc: 'Sent from Receipts → Issue Receipt → Save & Email PDF. Shows payment and balance.' },
}

const isPackageType = (t: PdfTemplate['type']) => t === 'website_package' || t === 'erp_discovery'

function TemplateForm({ tpl, onSaved }: { tpl: PdfTemplate; onSaved: () => void }) {
  const [draft, setDraft] = useState<PdfTemplate>(tpl)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => { setDraft(tpl) }, [tpl.id])

  const save = async () => {
    setSaving(true); setErr(''); setOk(false)
    const payload: any = {
      name: draft.name,
      subject_template: draft.subject_template,
      title_template: draft.title_template,
      subtitle_template: draft.subtitle_template,
      header_company_name: draft.header_company_name,
      header_tagline: draft.header_tagline,
      header_contact: draft.header_contact,
      header_logo_url: draft.header_logo_url,
      primary_color: draft.primary_color,
      accent_color: draft.accent_color,
      body_template: draft.body_template,
      table_head: draft.table_head,
      totals_template: draft.totals_template,
      terms_template: draft.terms_template,
      default_items: draft.default_items ?? [],
      footer_text: draft.footer_text,
      footer_note: draft.footer_note,
      is_active: true,
      // default_items only exists after 036 — never send it for the original
      // three types so saving still works on databases where 036 hasn't run
      ...(isPackageType(draft.type) ? { default_items: draft.default_items ?? [] } : {}),
    }
    const { error } = await supabase.from('pdf_templates').update(payload).eq('id', draft.id)
    setSaving(false)
    if (error) setErr(error.message)
    else { setOk(true); setTimeout(() => setOk(false), 2500); onSaved() }
  }

  const set = (key: keyof PdfTemplate, value: any) => setDraft({ ...draft, [key]: value } as PdfTemplate)

  return (
    <div className="space-y-6">
      <ErrorBanner message={err} onDismiss={() => setErr('')} />
      {ok && <p className="rounded-xl bg-brand-green-50 px-4 py-3 text-sm font-medium text-brand-green-700 ring-1 ring-brand-green-200">Saved — next PDF will use this template.</p>}

      {/* Well mirrored preview */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-mist p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-navy">Live PDF preview — header as it will appear</p>
        <div className="mt-3 overflow-hidden rounded-xl border bg-white shadow-soft">
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: draft.primary_color }}>
            <img src={draft.header_logo_url} alt="" className="h-8 w-8 rounded bg-white p-1" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <div>
              <p className="text-sm font-bold text-white">{draft.header_company_name}</p>
              <p className="text-[10px] tracking-wide text-white/80" style={{ color: draft.accent_color }}>{draft.header_tagline}</p>
            </div>
          </div>
          <div className="h-1" style={{ background: draft.accent_color }} />
          <div className="p-4">
            <p className="font-display text-sm font-bold" style={{ color: draft.primary_color }}>{draft.title_template || 'Title {{variable}}'}</p>
            <p className="mt-1 text-xs text-ink-light">{draft.subtitle_template || 'Subtitle'}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <span className="rounded bg-mist px-2 py-1">{(draft.table_head as string[]).join(' · ') || 'Table head'}</span>
              <span className="rounded bg-mist px-2 py-1">{(draft.totals_template as string[]).join(' · ') || 'Totals'}</span>
              <span className="rounded bg-mist px-2 py-1 truncate">{draft.terms_template || 'Terms'}</span>
            </div>
            <p className="mt-3 border-t pt-2 text-[10px] text-gray-400">{draft.footer_text}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-light">Variables: <span className="font-mono">{'{{receipt_number}}, {{quotation_number}}, {{rfq_number}}, {{customer_name}}, {{company_name}}, {{email}}, {{date}}, {{products_preview}}'}</span> — also <span className="font-mono">{'{{subject}}, {{admin_reply}}'}</span> for message reply.</p>
      </div>

      <div className="grid gap-5">
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Template Name</span><input value={draft.name} onChange={(e) => set(draft.name as any, e.target.value)} className={inputClass} /></label>

        <div className="rounded-2xl border border-navy-100 bg-navy-50 p-4">
          <p className="text-sm font-bold text-navy">Email subject — decides email subject line</p>
          <label className="mt-3 block"><span className="mb-1 block text-xs font-semibold text-ink-light">Subject template *</span><input value={draft.subject_template} onChange={(e) => set('subject_template', e.target.value)} className={inputClass} placeholder="Your GNAB {{type}} {{number}} — {{rfq_number}}" /></label>
          <p className="mt-1 text-xs text-ink-light">Used as default subject when admin does not type a custom subject. Supports variables above.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
          <p className="text-sm font-bold text-navy">PDF header — mirrored on every PDF</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Company Name</span><input value={draft.header_company_name} onChange={(e) => set('header_company_name', e.target.value)} className={inputClass} /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Tagline</span><input value={draft.header_tagline} onChange={(e) => set('header_tagline', e.target.value)} className={inputClass} /></label>
            <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-ink-light">Contact line (under header)</span><input value={draft.header_contact} onChange={(e) => set('header_contact', e.target.value)} className={inputClass} /></label>
            <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-ink-light">Logo URL</span><input value={draft.header_logo_url} onChange={(e) => set('header_logo_url', e.target.value)} className={inputClass} placeholder="https://..." /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Primary color</span><div className="flex gap-2"><input type="color" value={draft.primary_color} onChange={(e) => set('primary_color', e.target.value)} className="h-10 w-14 rounded border" /><input value={draft.primary_color} onChange={(e) => set('primary_color', e.target.value)} className={inputClass} /></div></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-light">Accent color</span><div className="flex gap-2"><input type="color" value={draft.accent_color} onChange={(e) => set('accent_color', e.target.value)} className="h-10 w-14 rounded border" /><input value={draft.accent_color} onChange={(e) => set('accent_color', e.target.value)} className={inputClass} /></div></label>
          </div>
        </div>

        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">PDF Title template *</span><input value={draft.title_template} onChange={(e) => set('title_template', e.target.value)} className={inputClass} placeholder="Quotation {{quotation_number}}" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Subtitle template</span><input value={draft.subtitle_template ?? ''} onChange={(e) => set('subtitle_template', e.target.value)} className={inputClass} placeholder="In response to {{rfq_number}} — {{products_preview}}" /></label>

        {draft.type !== 'message_reply' && (
          <>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Table head — comma separated (decides columns)</span><input value={(draft.table_head as string[]).join(', ')} onChange={(e) => set('table_head', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className={inputClass} placeholder="Description, Qty, Unit Price (GHS), Total (GHS)" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Totals labels — comma separated</span><input value={(draft.totals_template as string[]).join(', ')} onChange={(e) => set('totals_template', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className={inputClass} placeholder="Subtotal, Total Amount, ..." /></label>
          </>
        )}

        {isPackageType(draft.type) && (
          <div className="rounded-2xl border border-gold-200 bg-gold-50/60 p-4">
            <p className="text-sm font-bold text-navy">Standard line items — load into the Quotes builder in one click</p>
            <p className="mt-1 text-xs text-ink-light">Prices here are starting points; the admin sets final prices per RFQ. Keep quantities and unit prices editable below.</p>
            <div className="mt-3 space-y-2">
              {(draft.default_items ?? []).map((it, idx) => (
                <div key={idx} className="grid gap-2 rounded-xl border border-gray-100 bg-white p-3 sm:grid-cols-[1fr_80px_110px_40px]">
                  <input value={it.description} onChange={(e) => { const c = [...(draft.default_items ?? [])]; c[idx] = { ...c[idx]!, description: e.target.value }; set('default_items', c) }} placeholder="Description" className={inputClass} />
                  <input type="number" value={it.quantity} onChange={(e) => { const c = [...(draft.default_items ?? [])]; c[idx] = { ...c[idx]!, quantity: Number(e.target.value) }; set('default_items', c) }} placeholder="Qty" className={inputClass} />
                  <input type="number" value={it.unit_price} onChange={(e) => { const c = [...(draft.default_items ?? [])]; c[idx] = { ...c[idx]!, unit_price: Number(e.target.value) }; set('default_items', c) }} placeholder="Unit Price" className={inputClass} />
                  <button onClick={() => set('default_items', (draft.default_items ?? []).filter((_, i) => i !== idx))} disabled={(draft.default_items ?? []).length <= 1} aria-label="Remove item" className="rounded-lg p-2 text-red-400 hover:bg-red-50 disabled:opacity-30"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => set('default_items', [...(draft.default_items ?? []), { description: '', quantity: 1, unit_price: 0 }])} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-green-600 hover:underline"><Plus size={12} /> Add standard item</button>
          </div>
        )}

        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Body template (optional — if set, appears as body in PDF)</span><textarea rows={3} value={draft.body_template ?? ''} onChange={(e) => set('body_template', e.target.value)} className={`${inputClass} resize-none`} placeholder="Leave blank to use admin's per-PDF notes/reply. Use {{variables}}." /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Terms template</span><textarea rows={3} value={draft.terms_template ?? ''} onChange={(e) => set('terms_template', e.target.value)} className={`${inputClass} resize-none`} placeholder="Prices valid for 14 days..." /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Footer text</span><input value={draft.footer_text} onChange={(e) => set('footer_text', e.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-light">Footer note (small)</span><input value={draft.footer_note} onChange={(e) => set('footer_note', e.target.value)} className={inputClass} /></label>
      </div>

      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand-green-500 px-6 py-3 font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"><Save size={16} /> {saving ? 'Saving…' : ok ? 'Saved!' : 'Save Template'}</button>
      <p className="text-xs text-ink-light">Next PDF of type <span className="font-semibold">{draft.type}</span> will use this — well mirrored in Quotes, Messages, Receipts.</p>
    </div>
  )
}

export default function PdfTemplatesAdminPage() {
  const [rows, setRows] = useState<PdfTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [active, setActive] = useState<PdfTemplate['type']>('quotation')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const data = await fetchAllPdfTemplates()
    if (data.length === 0) setErr('No templates found — run supabase/migrations/022_receipts_and_pdf_templates.sql (then 036_quote_package_templates.sql for package types) first. Defaults will be used until then.')
    setRows(data)
    setLoading(false)
  }, [])

  useEffect(() => { document.title = 'PDF Templates | GNAB Admin'; void load() }, [load])

  const tpl = rows.find((r) => r.type === active) ?? null

  return (
    <div>
      <PageIntro
        title="PDF Templates"
        description="Edit what appears in every PDF — quotation, website package, ERP discovery, message reply and receipt. Header, colors, title, table, totals, terms and footer are all editable and well mirrored: the preview below is exactly what the PDF will look like."
        action={<a href="/admin/quotes" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy"><Eye size={14} /> Preview in Quotes</a>}
      />
      {err && <ErrorBanner message={err} onDismiss={() => setErr('')} />}

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-soft">
        {(Object.keys(TYPE_LABEL) as PdfTemplate['type'][]).map((t) => {
          const cfg = TYPE_LABEL[t]
          const Icon = cfg.icon
          return (
            <button key={t} onClick={() => setActive(t)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${active === t ? 'bg-navy text-white shadow' : 'bg-mist text-ink-light hover:bg-navy-50 hover:text-navy'}`}>
              <Icon size={16} /> {cfg.label}
            </button>
          )
        })}
      </div>

      {loading ? <Skeletons count={3} /> : !tpl ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <FileText size={32} className="mx-auto text-gray-300" />
          <p className="mt-3 font-semibold text-navy">No template for {TYPE_LABEL[active].label}</p>
          <p className="mt-1 text-sm text-ink-light">{TYPE_LABEL[active].desc}</p>
        </div>
      ) : (
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft md:p-8">
          <div className="mb-6 rounded-2xl bg-navy-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-navy">{(() => { const Icon = TYPE_LABEL[tpl.type].icon; return <Icon size={16} /> })()} {TYPE_LABEL[tpl.type].label} — {tpl.name}</p>
            <p className="mt-1 text-xs text-ink-light">{TYPE_LABEL[tpl.type].desc}</p>
          </div>
          <TemplateForm tpl={tpl} onSaved={load} />
        </div>
      )}
    </div>
  )
}


