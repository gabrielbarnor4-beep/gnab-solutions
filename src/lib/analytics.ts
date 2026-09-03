let posthog: any = null
let initDone = false

export function initAnalytics() {
  if (initDone || typeof window === 'undefined') return
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'
  if (!key) return
  initDone = true
  import('posthog-js').then(({ default: ph }) => {
    posthog = ph
    ph.init(key, {
      api_host: host,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
    })
  }).catch(() => { /* no analytics if blocked */ })
}

export function track(event: string, props?: Record<string, unknown>) {
  try {
    posthog?.capture(event, props)
  } catch { /* ignore */ }
}

// Convenience helpers — call from forms/assistant
export const trackQuoteRequested = (props?: Record<string, unknown>) => track('quote_requested', props)
export const trackContactSent = (props?: Record<string, unknown>) => track('contact_sent', props)
export const trackAssistantQuestion = (props?: Record<string, unknown>) => track('assistant_question', props)
