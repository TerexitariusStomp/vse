#!/usr/bin/env node
// a11y.mjs — axe-core gate (mirrors the springforth a11y:check convention):
// zero serious/critical violations at desktop + mobile sizes, on the landing
// page, one real place, the dummy place, and the share form.
//
//   npm run build && node scripts/a11y.mjs
//
// Serves dist/ statically; needs `npm i` (playwright + @axe-core/playwright).
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const DIST = new URL('../dist/', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' }

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = join(DIST, p === '/' ? 'index.html' : p)
  if (!existsSync(file)) file = join(DIST, 'index.html') // SPA fallback
  try {
    const body = readFileSync(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((r) => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`

const routes = ['/', '/kenya-coast', '/utopia', '/utopia/share']
const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]
const browser = await chromium.launch()
let violations = 0
try {
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: vp })
    const page = await context.newPage()
    for (const route of routes) {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
      // Reveal-on-scroll content sits dimmed until its section enters the
      // viewport (useInView margin -20%) — scroll every candidate into view
      // so axe sees the settled state a user actually reads.
      await page.evaluate(async () => {
        for (const el of document.querySelectorAll('li, section, .reveal, ol > *')) {
          el.scrollIntoView({ block: 'center' })
          await new Promise((r) => setTimeout(r, 60))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(3000)
      const { violations: v } = await new AxeBuilder({ page }).analyze()
      const serious = v.filter((x) => x.impact === 'serious' || x.impact === 'critical')
      violations += serious.length
      for (const s of serious)
        console.log(`${route} ${vp.width}px  [${s.impact}] ${s.id}: ${s.help} (${s.nodes.length} node${s.nodes.length === 1 ? '' : 's'})`)
    }
    await context.close()
  }
} finally {
  await browser.close()
  server.close()
}
if (violations) {
  console.error(`✗ ${violations} serious/critical a11y violation(s)`)
  process.exit(1)
}
console.log(`✓ a11y clean — ${routes.length} routes × ${viewports.length} viewports`)
