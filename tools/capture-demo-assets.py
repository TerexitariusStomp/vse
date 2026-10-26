#!/usr/bin/env python3
"""Capture the numbered demo-leg screenshots against the LIVE site.

Usage: python3 tools/capture-demo-assets.py [base_url]
Default base: https://vse-demonstrator.pages.dev
Writes docs/hackathon/demo-assets/NN-name.png in DEMO-SCRIPT leg order,
plus 10-mobile.png (390x844).
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://vse-demonstrator.pages.dev").rstrip("/")
OUT = Path(__file__).resolve().parent.parent / "docs" / "hackathon" / "demo-assets"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
SETTLE = 2200  # ms after navigation — lets results.json load + hash scroll fire


def wait_page(page, path):
    page.goto(f"{BASE}{path}", wait_until="networkidle")
    page.wait_for_timeout(SETTLE)


def shoot(page, name):
    page.screenshot(path=str(OUT / name))
    print("wrote", OUT / name)


JS_FIRST_STORY = """
() => { const b = document.querySelector('#stories ol li button');
  if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
  return !!b; }
"""
JS_FIRST_SIGNAL = """
() => { const b = document.querySelector('#signals ol li > button');
  if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
  return !!b; }
"""
JS_ENDORSE = """
() => { const g = document.querySelector('#check [role="group"][aria-label="Your response"]');
  if (!g) return false;
  const b = [...g.querySelectorAll('button')].find(x => x.textContent.trim() === 'endorse');
  if (b) b.click(); return !!b; }
"""
JS_TELLER = """
() => { const g = document.querySelector('[aria-label="Storytellers"]');
  if (!g) return false;
  const b = [...g.querySelectorAll('button')][0];
  if (b) b.click(); return !!b; }
"""


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=swiftshader", "--ignore-gpu-blocklist"])
        ctx = browser.new_context(
            viewport={"width": W, "height": H},
            device_scale_factor=1,
            color_scheme="light",
            service_workers="block",
        )
        page = ctx.new_page()

        # 01 landing — hero + globe + step strip
        wait_page(page, "/")
        shoot(page, "01-landing.png")

        # 02 thorntree — readings strip + globe + diorama
        wait_page(page, "/thorntree")
        page.wait_for_timeout(1500)  # three.js chunk + canvases
        page.evaluate(
            "document.querySelectorAll('#place canvas')[1]"
            "?.scrollIntoView({block:'center',behavior:'instant'})"
        )
        page.wait_for_timeout(1200)
        shoot(page, "02-thorntree.png")

        # 03 stories — expanded story with verbatim excerpts + provenance chips
        wait_page(page, "/thorntree#stories")
        page.evaluate(JS_FIRST_STORY)
        page.wait_for_timeout(900)
        page.evaluate("document.getElementById('stories')?.scrollIntoView({behavior:'instant'})")
        page.wait_for_timeout(400)
        shoot(page, "03-stories.png")

        # 04 signals — expanded signal, exact words behind it
        wait_page(page, "/thorntree#signals")
        page.evaluate(JS_FIRST_SIGNAL)
        page.wait_for_timeout(900)
        shoot(page, "04-signals.png")

        # 05 check — verification bars + visitor vote cast
        wait_page(page, "/thorntree#check")
        page.evaluate(JS_ENDORSE)
        page.wait_for_timeout(700)
        page.evaluate("document.getElementById('check')?.scrollIntoView({behavior:'instant'})")
        page.wait_for_timeout(400)
        shoot(page, "05-check.png")

        # 06 capital — bipartite graph, default from_place view
        wait_page(page, "/thorntree#capital")
        page.wait_for_timeout(800)
        shoot(page, "06-capital.png")

        # 07 utopia — diorama + storyteller card (Listen button)
        wait_page(page, "/utopia")
        page.wait_for_timeout(1800)
        page.evaluate(
            "[...document.querySelectorAll('canvas')].pop()"
            "?.scrollIntoView({block:'center',behavior:'instant'})"
        )
        page.wait_for_timeout(1200)
        page.evaluate(JS_TELLER)  # opens the story card w/ Listen button
        page.wait_for_timeout(900)
        shoot(page, "07-utopia.png")

        # 08 nairobi — social-founded place, globe + diorama
        wait_page(page, "/nairobi")
        page.wait_for_timeout(1500)
        page.evaluate(
            "document.querySelectorAll('#place canvas')[1]"
            "?.scrollIntoView({block:'center',behavior:'instant'})"
        )
        page.wait_for_timeout(1200)
        shoot(page, "08-scale.png")

        # 09 thread — follow one sentence end to end (landing has no hash
        # scroll handler — scroll explicitly, then let the beats animate)
        wait_page(page, "/")
        page.evaluate("document.getElementById('thread')?.scrollIntoView({behavior:'instant'})")
        page.wait_for_timeout(3600)  # thread chips animate over ~2.2s once in view
        shoot(page, "09-repo.png")

        page.close()

        # 10 mobile — landing at phone width
        mctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            color_scheme="light",
            service_workers="block",
        )
        mp = mctx.new_page()
        mp.goto(f"{BASE}/", wait_until="networkidle")
        mp.wait_for_timeout(SETTLE)
        mp.screenshot(path=str(OUT / "10-mobile.png"))
        print("wrote", OUT / "10-mobile.png")
        mp.close()

        browser.close()


if __name__ == "__main__":
    main()
