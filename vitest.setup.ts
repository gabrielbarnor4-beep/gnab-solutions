import '@testing-library/jest-dom/vitest'

// jsdom localStorage polyfill for canSubmit/recordSubmit
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>()
  ;(window as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    length: 0,
  } as unknown as Storage
}
if (typeof globalThis !== 'undefined' && !(globalThis as unknown as { localStorage: unknown }).localStorage) {
  ;(globalThis as unknown as { localStorage: unknown }).localStorage = (window as unknown as { localStorage: unknown }).localStorage
}
