"""Functional smoke test: filters, search, load more, language switch, legal drawer, exclusive mock."""
import pathlib, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = ROOT.joinpath("index.html").as_uri()
OUT = ROOT / "shots"
res, errs = {}, []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL + "#/archiv", wait_until="domcontentloaded"); pg.evaluate("localStorage.clear()")
    pg.reload(wait_until="domcontentloaded"); pg.wait_for_timeout(800)
    res["cards_initial"] = pg.locator("#grid .card").count()
    pg.click("#more"); pg.wait_for_timeout(300)
    res["cards_after_more"] = pg.locator("#grid .card").count()
    pg.click('.chip[data-filter="schweiz"]'); pg.wait_for_timeout(300)
    res["schweiz_count_line"] = pg.inner_text("#count")
    pg.click('.chip[data-filter="flipbook"]'); pg.wait_for_timeout(300)
    res["flipbook_cards"] = pg.locator("#grid .card.is-flip").count()
    pg.click('.chip[data-filter="all"]'); pg.wait_for_timeout(300)
    pg.fill("#q", "hotel"); pg.wait_for_timeout(500)
    res["search_hotel"] = pg.inner_text("#count")
    pg.fill("#q", "zzzzqqq"); pg.wait_for_timeout(500)
    res["search_empty"] = pg.locator(".empty").count()
    pg.fill("#q", ""); pg.wait_for_timeout(400)
    # article with translation: Area Architetti DE 804 <-> EN 1416
    pg.goto(URL + "#/p/de/804", wait_until="domcontentloaded"); pg.wait_for_timeout(900)
    res["de_title"] = pg.inner_text(".article-head h1")
    res["de_blocks"] = pg.locator("#prose > *").count()
    pg.click('[data-lang="en"]'); pg.wait_for_timeout(900)
    res["after_en_hash"] = pg.evaluate("location.hash")
    res["en_title"] = pg.inner_text(".article-head h1")
    res["en_first_p"] = pg.locator("#prose p").first.inner_text()[:80]
    # german-only article while EN is active -> notice
    pg.goto(URL + "#/p/de/5049", wait_until="domcontentloaded"); pg.wait_for_timeout(700)
    res["notice_de_only"] = pg.locator(".notice").count()
    pg.click('[data-lang="de"]'); pg.wait_for_timeout(500)
    # legal drawer
    pg.click('[data-legal="imprint"]'); pg.wait_for_timeout(500)
    res["legal_title"] = pg.inner_text("#legal-title")
    pg.screenshot(path=str(OUT / "d-legal.png"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    res["legal_closed"] = pg.evaluate("document.getElementById('legal').hidden")
    # exclusive mock gate: nothing sent
    reqs = []
    pg.on("request", lambda r: reqs.append(r.url) if r.method != "GET" else None)
    pg.goto(URL + "#/exklusiv", wait_until="domcontentloaded"); pg.wait_for_timeout(400)
    pg.fill("#pw", "test"); pg.click(".vault-form button"); pg.wait_for_timeout(300)
    res["vault_msg_visible"] = pg.is_visible("#vault-msg")
    res["vault_non_get_requests"] = len(reqs)
    # back navigation restores archive
    pg.goto(URL + "#/archiv", wait_until="domcontentloaded"); pg.wait_for_timeout(500)
    pg.click("#grid .card >> nth=3"); pg.wait_for_timeout(600)
    pg.go_back(wait_until="commit"); pg.wait_for_timeout(800)
    res["back_to_archive_cards"] = pg.locator("#grid .card").count()
    b.close()
print(json.dumps(res, ensure_ascii=False, indent=1))
print("ERRORS", errs[:10])
