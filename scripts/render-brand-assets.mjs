import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

const jobs = [
  { svg: 'public/brand/barnor-logo.svg', png: 'public/brand/barnor-logo.png', width: 1254, height: 1254 },
  { svg: 'public/brand/barnor-og.svg', png: 'public/brand/barnor-og.png', width: 1200, height: 630 },
]

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

for (const job of jobs) {
  const svg = await fs.readFile(path.join(root, job.svg), 'utf8')
  await page.setViewportSize({ width: job.width, height: job.height })
  await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: 'load' })
  await page.screenshot({ path: path.join(root, job.png), clip: { x: 0, y: 0, width: job.width, height: job.height } })
  console.log(`wrote ${job.png}`)
}

const favicon = await fs.readFile(path.join(root, 'public/favicon.svg'), 'utf8')
await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(
  `<!doctype html><html><body style="margin:0">${favicon.replace('<svg ', '<svg width="180" height="180" ')}</body></html>`,
  { waitUntil: 'load' },
)
await page.screenshot({ path: path.join(root, 'public/apple-touch-icon.png'), clip: { x: 0, y: 0, width: 180, height: 180 } })
console.log('wrote public/apple-touch-icon.png')

await browser.close()
