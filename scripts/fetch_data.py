"""
Build-time snapshot of the public ENECS WordPress REST API.

Pulls posts (flipbook posts), the `portfolio` custom post type (projects),
the `portfolio_entries` taxonomy (regions), and the legal pages, in German
(WPML default) and English (?lang=en). Normalises the Enfold/Avia builder
markup into clean, typographic HTML and writes:

  data/posts.json        full normalised dataset (cards + bodies, both languages)
  data/archive.js        cards + meta, loaded eagerly by the page
  data/content-de.js     article bodies (DE), loaded lazily
  data/content-en.js     article bodies (EN), loaded lazily

Usage:  python scripts/fetch_data.py [--cache DIR]
Only the Python standard library + BeautifulSoup (bs4) are needed.
"""
import argparse
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

from bs4 import BeautifulSoup, NavigableString, Tag

API = "https://enecs.com/wp-json/wp/v2"
SITE = "https://enecs.com"
UA = {"User-Agent": "Mozilla/5.0 (enecs-preview build; vasylian.com)"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data")


# ---------------------------------------------------------------- fetching
def get(url, cache_dir=None, want_headers=False, retries=2):
    key = re.sub(r"[^a-zA-Z0-9]+", "_", url.replace(API, ""))[:150]
    cpath = os.path.join(cache_dir, key + ".json") if cache_dir else None
    if cpath and os.path.exists(cpath):
        with open(cpath, encoding="utf-8") as f:
            data = json.load(f)
        return (data["body"], data["headers"]) if want_headers else data["body"]
    last = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=45) as r:
                raw = r.read().decode("utf-8")
                headers = {k.lower(): v for k, v in r.headers.items()}
            ctype = headers.get("content-type", "")
            body = json.loads(raw) if "json" in ctype else raw
            if cpath:
                with open(cpath, "w", encoding="utf-8") as f:
                    json.dump({"body": body, "headers": headers}, f, ensure_ascii=False)
            return (body, headers) if want_headers else body
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"GET failed {url}: {last}")


def log(*a):
    print(*a, flush=True)


# ------------------------------------------------------------- normalising
OPTIMOLE = re.compile(r"^https?://[^/]+\.i\.optimole\.com/(?:[a-z]+:[^/]*/)*(https?://.+)$")


def origin_url(u):
    """Strip the Optimole CDN prefix and normalise percent-encoding."""
    if not u or u.startswith("data:"):
        return None
    u = html.unescape(u.strip())
    if u.startswith("//"):
        u = "https:" + u
    m = OPTIMOLE.match(u)
    if m:
        u = m.group(1)
    u = urllib.parse.unquote(u)
    return urllib.parse.quote(u, safe=":/?&=#~+,;@-_.!*'()")


def img_src(tag):
    for attr in ("data-opt-src", "data-src", "data-lazy-src", "src"):
        v = tag.get(attr)
        if v and not v.startswith("data:"):
            return origin_url(v)
    return None


INLINE_OK = {"b", "strong", "em", "i", "a", "br", "sup", "sub"}


def clean_inline(node):
    """Return safe inline HTML for a block element."""
    out = []
    for child in node.children:
        if isinstance(child, NavigableString):
            out.append(html.escape(str(child), quote=False))
        elif isinstance(child, Tag):
            name = child.name.lower()
            if name in ("img", "style", "script", "svg", "iframe", "noscript"):
                continue
            inner = clean_inline(child)
            if name == "br":
                out.append("<br>")
            elif name in ("b", "strong"):
                out.append(f"<strong>{inner}</strong>" if inner.strip() else inner)
            elif name in ("em", "i"):
                out.append(f"<em>{inner}</em>" if inner.strip() else inner)
            elif name == "a":
                href = (child.get("href") or "").strip()
                if href.startswith("http") and inner.strip():
                    out.append(
                        f'<a href="{html.escape(href)}" target="_blank" rel="noopener">{inner}</a>'
                    )
                else:
                    out.append(inner)
            elif name in ("sup", "sub"):
                out.append(f"<{name}>{inner}</{name}>")
            else:
                out.append(inner)
    s = "".join(out)
    s = re.sub(r"\s+", " ", s).replace("&nbsp;", " ").strip()
    return s


def text_of(node):
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip()


def normalise_body(raw_html, title):
    """Avia/Enfold builder HTML -> list of clean blocks + image list."""
    soup = BeautifulSoup(raw_html or "", "lxml")
    for t in soup(["style", "script", "noscript", "svg", "form", "nav", "button"]):
        t.decompose()
    for t in soup.select(".avia-slideshow-arrows, .avia-slideshow-dots, .av-share-box"):
        t.decompose()

    blocks, images, seen_img, seen_txt = [], [], set(), set()
    links = []
    title_key = re.sub(r"\W+", "", title.lower())

    for el in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "blockquote", "img", "iframe"]):
        # skip elements nested inside a block we already emit as a whole
        if el.name != "img" and el.find_parent(["ul", "ol", "blockquote"]):
            continue
        if el.name == "p" and el.find_parent(["h1", "h2", "h3", "h4", "h5", "h6"]):
            continue
        if el.name == "img":
            src = img_src(el)
            if not src or src in seen_img or "/avia_fonts/" in src:
                continue
            if re.search(r"logo|icon|placeholder", src, re.I) and not re.search(r"uploads/20", src):
                continue
            seen_img.add(src)
            w = el.get("width")
            h = el.get("height")
            images.append(src)
            blocks.append({"t": "img", "src": src, "alt": el.get("alt") or "",
                           "w": int(w) if str(w).isdigit() else None,
                           "h": int(h) if str(h).isdigit() else None})
            continue
        if el.name == "iframe":
            src = el.get("src") or ""
            m = re.search(r"flipbook/(\d+)/", src)
            if m:
                blocks.append({"t": "flipbook", "id": int(m.group(1))})
            continue
        if el.name in ("ul", "ol"):
            items = [clean_inline(li) for li in el.find_all("li")]
            items = [i for i in items if i]
            if items:
                blocks.append({"t": el.name, "items": items})
            continue
        if el.name == "blockquote":
            txt = clean_inline(el)
            if txt:
                blocks.append({"t": "quote", "html": txt})
            continue
        txt = text_of(el)
        if not txt:
            continue
        key = re.sub(r"\W+", "", txt.lower())
        if el.name.startswith("h"):
            if key == title_key or key in seen_txt:
                continue
            seen_txt.add(key)
            blocks.append({"t": "h", "html": clean_inline(el)})
        else:
            if key in seen_txt or (len(key) > 30 and any(key in k for k in seen_txt if len(k) > len(key))):
                continue
            seen_txt.add(key)
            inner = clean_inline(el)
            for a in el.find_all("a"):
                href = (a.get("href") or "").strip()
                if href.startswith("http") and "enecs.com" not in href and href not in links:
                    links.append(href)
            if inner:
                blocks.append({"t": "p", "html": inner})
    return blocks, images, links


CREDIT = re.compile(r"^\s*(fotos?|photos?|bilder|bildnachweis|credits?|©)", re.I)
NOT_KICKER = re.compile(r"^\s*(philosoph\w*|über uns|about( us)?|team|kontakt|contact|projekte?|projects?)\s*:?\s*$", re.I)


def excerpt_and_kicker(blocks):
    kicker, excerpt, fallback = None, "", ""
    for b in blocks:
        if b["t"] != "p":
            continue
        plain = re.sub(r"<[^>]+>", "", b["html"]).strip()
        bold = b["html"].startswith("<strong>")
        if CREDIT.match(plain):
            continue
        if not kicker and bold:
            k = html.unescape(re.sub(r"<[^>]+>", "", b["html"].split("<br>")[0])).strip(" :–-")
            if len(k) < 90 and not NOT_KICKER.match(k) and not re.search(r"@|https?:|\+\d|\d{4,}", k):
                kicker = k
                continue
        if len(plain) > 70 and not excerpt and not bold:
            excerpt = html.unescape(plain)
        if len(plain) > 70 and not fallback:
            fallback = html.unescape(plain)
    if not excerpt:
        excerpt = fallback
    if len(excerpt) > 240:
        cut = excerpt[:240]
        excerpt = cut[: cut.rfind(" ")] + " …"
    return kicker, excerpt


REGION_ALIAS = {"partner-en": "partner", "liechtenstein": "fuerstentum-liechtenstein",
                "germany": "deutschland", "switzerland": "schweiz", "italy-south-tyrol": "italien-suedtirol"}


def unesc(s):
    return html.unescape(s or "").replace(" ", " ").strip()


# ------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=None, help="optional cache dir for raw responses")
    args = ap.parse_args()
    if args.cache:
        os.makedirs(args.cache, exist_ok=True)
    c = args.cache
    t0 = time.time()

    # --- taxonomy (regions) per language
    regions = {}
    for lang, q in (("de", ""), ("en", "&lang=en")):
        terms = get(f"{API}/portfolio_entries?per_page=100{q}", c)
        regions[lang] = {t["id"]: {"name": unesc(t["name"]), "slug": t["slug"], "parent": t["parent"],
                                   "count": t["count"]} for t in terms}
        log("regions", lang, len(terms))

    # --- categories (posts)
    cats = get(f"{API}/categories?per_page=100", c)
    log("categories", [(x["name"], x["count"]) for x in cats])

    # --- posts: the brief's "/posts" endpoint (flipbook posts)
    posts = {}
    totals = {}
    for lang, q in (("de", ""), ("en", "&lang=en")):
        body, hdr = get(f"{API}/posts?per_page=30&_embed{q}", c, want_headers=True)
        posts[lang] = body
        totals[f"posts_{lang}"] = int(hdr.get("x-wp-total", len(body)))
        log("posts", lang, len(body), "total", totals[f"posts_{lang}"])

    # --- portfolio CPT (the real editorial body of the site)
    portfolio = {"de": [], "en": []}
    for lang, q in (("de", ""), ("en", "&lang=en")):
        page = 1
        while True:
            body, hdr = get(f"{API}/portfolio?per_page=100&page={page}{q}", c, want_headers=True)
            portfolio[lang] += body
            pages = int(hdr.get("x-wp-totalpages", 1))
            totals[f"portfolio_{lang}"] = int(hdr.get("x-wp-total", len(body)))
            if page >= pages:
                break
            page += 1
        log("portfolio", lang, len(portfolio[lang]))

    # --- legal pages
    legal = {}
    for lang, slugs in (("de", ("impressum", "datenschutzerklaerung")), ("en", ("imprint", "privacy-policy"))):
        q = "" if lang == "de" else "&lang=en"
        legal[lang] = {}
        for key, slug in zip(("imprint", "privacy"), slugs):
            res = get(f"{API}/pages?slug={slug}{q}", c)
            if res:
                blocks, _, _ = normalise_body(res[0]["content"]["rendered"], unesc(res[0]["title"]["rendered"]))
                legal[lang][key] = {"title": unesc(res[0]["title"]["rendered"]), "blocks": blocks,
                                    "link": res[0]["link"]}
        log("legal", lang, list(legal[lang].keys()))

    # --- editions: "Umwelt & Energie" issues from the Magazine page (cover, flipbook, pdf)
    editions = []
    mag = get(f"{API}/pages?slug=magazine", c)
    if mag:
        soup = BeautifulSoup(mag[0]["content"]["rendered"], "lxml")
        group, cur = None, None
        for el in soup.find_all(["h2", "h3", "img", "a"]):
            if el.name == "h2":
                group = text_of(el)
            elif el.name == "h3":
                cur = {"group": group, "title": text_of(el), "cover": None, "flipbook": None, "pdf": None}
                editions.append(cur)
            elif cur and el.name == "img" and not cur["cover"]:
                cur["cover"] = img_src(el)
            elif cur and el.name == "a":
                href = urllib.parse.urljoin(SITE + "/", (el.get("href") or "").replace("//wp-content", "/wp-content"))
                if ".pdf" in href:
                    cur["pdf"] = href
                elif "flipbook" in href:
                    cur["flipbook"] = href
        editions = [e for e in editions if e["cover"]]
        # the Magazine page links a PDF for several issues, but most of those files are gone (404) →
        # keep only PDFs that actually answer, remember the dead link for the report
        for e in editions:
            if not e["pdf"]:
                continue
            try:
                req = urllib.request.Request(e["pdf"], headers=UA, method="HEAD")
                with urllib.request.urlopen(req, timeout=20) as r:
                    ok = r.status == 200
            except Exception:  # noqa: BLE001
                ok = False
            if not ok:
                e["pdfDead"], e["pdf"] = e["pdf"], None
    log("editions", len(editions), sum(1 for e in editions if e["pdf"]), "with public PDF,",
        sum(1 for e in editions if e.get("pdfDead")), "dead PDF links")

    # --- flipbook configs (page count + dimensions), public FlipHTML5 exports
    flip_ids = set()
    for p in posts["de"] + posts["en"]:
        for m in re.finditer(r"flipbook/(\d+)/", p["content"]["rendered"]):
            flip_ids.add(int(m.group(1)))
    flipbooks = {}
    for fid in sorted(flip_ids):
        try:
            js = get(f"{SITE}/wp-content/uploads/flipbook/{fid}/javascript/config.js", c)
            if isinstance(js, dict):
                js = json.dumps(js)
            pc = re.search(r'"?totalPageCount"?\s*:\s*"?(\d+)', js)
            pw = re.search(r'"?PageWidth"?\s*:\s*"?(\d+)', js)
            ph = re.search(r'"?PageHeight"?\s*:\s*"?(\d+)', js)
            dl = re.search(r'"DownloadButtonVisible"\s*:\s*"(\w+)', js)
            pr = re.search(r'"PrintButtonVisible"\s*:\s*"(\w+)', js)
            flipbooks[fid] = {
                "pages": int(pc.group(1)) if pc else 0,
                "w": int(pw.group(1)) if pw else 906,
                "h": int(ph.group(1)) if ph else 1280,
                "download": dl.group(1) if dl else None,
                "print": pr.group(1) if pr else None,
                "base": f"{SITE}/wp-content/uploads/flipbook/{fid}/files/",
                "thumb": f"{SITE}/wp-content/uploads/flipbook/{fid}/files/thumb/1.jpg",
            }
        except Exception as e:  # noqa: BLE001
            log("flipbook config failed", fid, e)
    log("flipbooks", len(flipbooks))

    # ------------------------------------------------ normalise items
    items = {"de": [], "en": []}
    bodies = {"de": {}, "en": {}}
    for lang in ("de", "en"):
        for p in portfolio[lang]:
            title = unesc(p["title"]["rendered"])
            blocks, imgs, links = normalise_body(p["content"]["rendered"], title)
            kicker, excerpt = excerpt_and_kicker(blocks)
            og = (p.get("yoast_head_json") or {}).get("og_image") or []
            hero = origin_url(og[0]["url"]) if og else (imgs[0] if imgs else None)
            hw, hh = (og[0].get("width"), og[0].get("height")) if og else (None, None)
            reg_ids = p.get("portfolio_entries") or []
            reg = [regions[lang].get(r, regions["de"].get(r)) for r in reg_ids]
            reg = [r for r in reg if r and r["name"].lower() not in ("architekten", "architects")]
            reg = [{**r, "slug": REGION_ALIAS.get(r["slug"], r["slug"])} for r in reg]
            # a translated term may come back under the DE id; normalise slug for filtering
            items[lang].append({
                "id": p["id"], "type": "project", "lang": lang,
                "slug": p["slug"], "title": title, "kicker": kicker,
                "date": p["date"], "modified": p["modified"],
                "regions": [r["slug"] for r in reg], "regionNames": [r["name"] for r in reg],
                "image": hero, "iw": hw, "ih": hh, "imageCount": len(imgs),
                "excerpt": excerpt, "link": p["link"], "external": links[:1],
            })
            bodies[lang][str(p["id"])] = blocks
        for p in posts[lang]:
            title = unesc(p["title"]["rendered"])
            m = re.search(r"flipbook/(\d+)/", p["content"]["rendered"])
            fid = int(m.group(1)) if m else None
            fb = flipbooks.get(fid, {})
            cover = f"{fb['base']}page/1.jpg" if fb else None
            cat_names = [x["name"] for x in cats if x["id"] in p["categories"]]
            items[lang].append({
                "id": p["id"], "type": "flipbook", "lang": lang,
                "slug": p["slug"], "title": title, "kicker": None,
                "date": p["date"], "modified": p["modified"],
                "regions": ["flipbook"], "regionNames": ["Flipbook"],
                "image": cover, "iw": fb.get("w"), "ih": fb.get("h"), "imageCount": fb.get("pages", 0),
                "excerpt": "", "link": p["link"], "external": [], "flipbook": fid,
                "wpCategories": cat_names,
            })
            bodies[lang][str(p["id"])] = [{"t": "flipbook", "id": fid}] if fid else []

    # ---- pair translations DE <-> EN by shared hero image file
    def key(u):
        return re.sub(r"-(scaled|\d+x\d+)(?=\.\w+$)", "", (u or "").split("/")[-1].lower())

    de_by_img = {}
    for it in items["de"]:
        if it["type"] == "project" and it["image"]:
            de_by_img.setdefault(key(it["image"]), it)
    paired = 0
    for it in items["en"]:
        d = de_by_img.get(key(it["image"])) if it["image"] else None
        if d:
            it["translation"] = d["id"]
            d["translation"] = it["id"]
            paired += 1
    # fallback: title similarity for the rest (words minus generic terms)
    GENERIC = {"architekten", "architects", "architekt", "architect", "architektur", "architecture",
               "architekturbüro", "office", "and", "und", "interior", "design", "gmbh", "ag", "the", "s"}

    def words(t):
        return {w for w in re.findall(r"[a-zäöüß0-9]+", t.lower()) if w not in GENERIC}

    free_de = [d for d in items["de"] if d["type"] == "project" and not d.get("translation")]
    for it in items["en"]:
        if it.get("translation") or it["type"] != "project":
            continue
        we = words(it["title"])
        best, score = None, 0.0
        for d in free_de:
            wd = words(d["title"])
            if we and wd:
                j = len(we & wd) / len(we | wd)
                if j > score:
                    best, score = d, j
        if best and score >= 0.5:
            it["translation"], best["translation"] = best["id"], it["id"]
            free_de.remove(best)
            paired += 1
    log("paired translations", paired)

    for lang in items:
        items[lang].sort(key=lambda x: x["date"], reverse=True)

    # ---- region filter list (DE labels + EN labels)
    region_list = []
    counts = {}
    for it in items["de"]:
        for r in it["regions"]:
            counts[r] = counts.get(r, 0) + 1
    labels_en = {"italien-suedtirol": "Italy / South Tyrol", "schweiz": "Switzerland",
                 "fuerstentum-liechtenstein": "Liechtenstein", "deutschland": "Germany",
                 "partner": "Partners", "flipbook": "Flipbooks"}
    labels_de = {"italien-suedtirol": "Südtirol", "schweiz": "Schweiz",
                 "fuerstentum-liechtenstein": "Liechtenstein", "deutschland": "Deutschland",
                 "partner": "Partner", "flipbook": "Flipbooks"}
    for slug, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        region_list.append({"slug": slug, "de": labels_de.get(slug, slug), "en": labels_en.get(slug, slug), "count": n})


    meta = {
        "source": API,
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totals": totals,
        "counts": {l: {"projects": sum(1 for i in items[l] if i["type"] == "project"),
                       "flipbooks": sum(1 for i in items[l] if i["type"] == "flipbook")} for l in items},
        "paired": paired,
        "cdn": "https://mlhh79yvxbcd.i.optimole.com",
        "wpml": True,
    }
    archive = {"meta": meta, "regions": region_list, "items": items, "flipbooks": flipbooks, "editions": editions,
               "legal": legal, "categories": [{"id": x["id"], "name": x["name"], "count": x["count"]} for x in cats]}

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "posts.json"), "w", encoding="utf-8") as f:
        json.dump({**archive, "bodies": bodies}, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT, "archive.js"), "w", encoding="utf-8") as f:
        f.write("window.ENECS_ARCHIVE=")
        json.dump(archive, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    for lang in ("de", "en"):
        with open(os.path.join(OUT, f"content-{lang}.js"), "w", encoding="utf-8") as f:
            f.write(f"window.ENECS_CONTENT=window.ENECS_CONTENT||{{}};window.ENECS_CONTENT.{lang}=")
            json.dump(bodies[lang], f, ensure_ascii=False, separators=(",", ":"))
            f.write(";\n")
    log("done in %.1fs" % (time.time() - t0), json.dumps(meta["counts"]))


if __name__ == "__main__":
    sys.exit(main())
