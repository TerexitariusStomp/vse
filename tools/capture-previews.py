#!/usr/bin/env python3
"""Render each place's diorama canvas to site/public/previews/{id}.webp.

Usage: serve the built site (cd site && npm run build && npx vite preview --port 4173),
then: python3 tools/capture-previews.py [base_url]
"""
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173').rstrip('/')
OUT = Path(__file__).resolve().parent.parent / 'site' / 'public' / 'previews'
IDS = [
    'thorntree', 'kenya-coast', 'mida-creek', 'hebden-bridge', 'dar-es-salaam',
    'puerto-la-cruz', 'minneapolis', 'nairobi', 'detroit', 'utopia',
]
W, H = 800, 600

OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=swiftshader', '--ignore-gpu-blocklist'])
    ctx = browser.new_context(
        viewport={'width': 1440, 'height': 900},
        color_scheme='light',
        reduced_motion='reduce',
        service_workers='block',
    )
    for pid in IDS:
        page = ctx.new_page()
        page.goto(f'{BASE}/{pid}', wait_until='networkidle')
        page.evaluate("document.documentElement.classList.remove('dark')")
        canvas = page.locator('canvas').nth(1)
        canvas.scroll_into_view_if_needed()
        page.wait_for_timeout(2500)
        png = canvas.screenshot()
        img = Image.open(io.BytesIO(png)).convert('RGB')
        scale = max(W / img.width, H / img.height)
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        left, top = (img.width - W) // 2, (img.height - H) // 2
        img.crop((left, top, left + W, top + H)).save(OUT / f'{pid}.webp', quality=80)
        print('wrote', OUT / f'{pid}.webp')
        page.close()
    browser.close()
