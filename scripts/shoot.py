"""QA screenshots with Playwright (python). Usage: python scripts/shoot.py [names...]"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = ROOT.joinpath("index.html").as_uri()
OUT = ROOT / "shots"; OUT.mkdir(exist_ok=True)
only = set(sys.argv[1:])

def settle(pg, full=False):
    pg.wait_for_timeout(600)
    if full:
        h = pg.evaluate("document.documentElement.scrollHeight")
        y = 0
        while y < h:
            pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(220); y += 600
            h = pg.evaluate("document.documentElement.scrollHeight")
        pg.evaluate("window.scrollTo(0,0)")
    try:
        pg.wait_for_load_state("networkidle", timeout=8000)
    except Exception:
        pass
    pg.wait_for_timeout(700)

def check(pg, tag):
    ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    return {"shot": tag, "overflowX": ov}

report, errors = [], []
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh, dev in ((1440, 900, "d"), (390, 844, "m")):
        ctx = b.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=1)
        pg = ctx.new_page()
        pg.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        def go(hash_, name, full=False, lang="de", before=None):
            if only and name not in only: return
            pg.goto(URL + ("?lang=" + lang) + hash_, wait_until="domcontentloaded")
            pg.evaluate("localStorage.clear()")
            pg.goto(URL + ("?lang=" + lang) + hash_, wait_until="domcontentloaded")
            pg.reload(wait_until="domcontentloaded")
            if before: before(pg)
            settle(pg, full)
            pg.screenshot(path=str(OUT / f"{dev}-{name}.png"), full_page=full)
            report.append(check(pg, f"{dev}-{name}"))
        go("#/archiv", "archive-top")
        go("#/archiv", "archive-full", full=True)
        go("#/archiv", "archive-en", lang="en")
        go("#/p/de/5049", "article-full", full=True)
        def flipready(pg):
            try:
                pg.wait_for_function("window.__pf", timeout=15000)
            except Exception:
                errors.append("flipbook library did not initialise within 15 s")
            pg.wait_for_timeout(800)
        go("#/p/de/3238", "flipbook", before=flipready)
        def flip2(pg):
            flipready(pg); pg.click("#fn"); pg.wait_for_timeout(1200); pg.click("#fn"); pg.wait_for_timeout(1400)
        go("#/p/de/3238", "flipbook-spread", before=flip2)
        go("#/p/en/1416", "article-en", full=True, lang="en")
        go("#/editionen", "editions", full=(dev == "d"))
        go("#/exklusiv", "exclusive")
        def more(pg):
            pg.click("#more"); pg.wait_for_timeout(500)
        go("#/archiv", "archive-more", full=True, before=more)
        if dev == "m":
            def menu(pg):
                pg.click(".menu-btn"); pg.wait_for_timeout(400)
            go("#/archiv", "menu", before=menu)
        def legal(pg):
            pg.click('[data-legal="privacy"]'); pg.wait_for_timeout(700)
        go("#/archiv", "legal", before=legal)
        ctx.close()
    b.close()
print(json.dumps(report, indent=0))
print("ERRORS:", len(errors)); print("\n".join(errors[:30]))
