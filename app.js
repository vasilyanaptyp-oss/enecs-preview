/* enecs – Archive preview (vanilla JS, no build step).
 * Data: data/archive.js (cards) + data/content-{lang}.js (bodies, lazy), produced by scripts/fetch_data.py
 * from the public WordPress REST API of enecs.com.
 */
(function () {
  "use strict";

  var DATA = window.ENECS_ARCHIVE;
  var CDN = DATA.meta.cdn; // Optimole CDN already used by enecs.com
  var PAGE = 12;
  var view = document.getElementById("view");

  // ------------------------------------------------------------ i18n
  var T = {
    de: {
      "nav.editions": "Editionen", "nav.archive": "Archiv", "nav.exclusive": "Exklusiv", "nav.menu": "Menü",
      "footer.claim": "Magazin für Architektur & Ökologie – Südtirol, Schweiz, Liechtenstein, Deutschland.",
      "footer.imprint": "Impressum", "footer.privacy": "Datenschutz",
      eyebrow: "Mediathek · Projekte, Porträts, Flipbooks",
      intro: "Ein Archiv, das sich selbst füllt: Jeder neue Beitrag im WordPress-Bestand erscheint automatisch hier – Architektur, Ökologie und die Menschen dahinter.",
      stamp: "Echte Daten · WordPress REST API · Stand {d}",
      all: "Alle", search: "Im Archiv suchen", showing: "Zeige <strong>{n}</strong> von {t} Beiträgen",
      more: "Mehr laden", of: "{n} von {t}", empty: "Keine Beiträge für diese Auswahl.", reset: "Filter zurücksetzen",
      enOnly: "Nur englische Beiträge", flipPages: "{n} Seiten", read: "Weiterlesen",
      shelfTitle: "Flipbook-Ausgaben", shelfText: "Blättern wie im gedruckten Magazin – {n} Porträts als interaktive Flipbooks.",
      shelfAll: "Alle Flipbooks", prevShort: "Zurück", nextShort: "Weiter", close: "Schließen",
      partners: "Partner-Hotels", back: "Archiv", region: "Region", published: "Veröffentlicht", images: "Bilder",
      website: "Website", original: "Original", onEnecs: "auf enecs.com ansehen", langs: "Sprachen",
      onlyDe: "<b>Nur auf Deutsch verfügbar.</b> Für diesen Beitrag gibt es in WordPress (WPML) noch keine englische Übersetzung.",
      onlyDeShort: "nur DE", related: "Weiter im Archiv", prev: "Vorheriger Beitrag", next: "Nächster Beitrag",
      page: "Seite", pages: "Seiten", format: "Format", flipNote: "Vorschau-Hinweis: Die Seiten dieses Flipbooks liegen öffentlich unter /wp-content/uploads/flipbook/… – ausgeblendete Download-Buttons schützen sie nicht. Im Exklusiv-Bereich liefert der Next.js-Server die Seitenbilder erst nach geprüftem Passwort aus.",
      edTitle: "Editionen", edEyebrow: "Zwei Magazine, eine Redaktion", ueTitle: "Umwelt & Energie Fachjournal®",
      ueText: "Das etablierte Fachjournal – ein Querschnitt aktueller Projekte aus Erneuerbaren Energien und energieeffizientem Bauen. Alle Ausgaben direkt aus dem bestehenden WordPress.",
      openFlip: "Flipbook öffnen", pdf: "PDF öffentlich", vbText: "Das neue Magazin aus dem Hause enecs ist in Vorbereitung. Titelbild, Claim und Erscheinungstermin folgen, sobald die Redaktion sie freigibt.", vbNote: "Platzhalter-Teaser – Inhalte liefert die Redaktion.",
      soon: "Demnächst", vbLink: "visionbaukunst.com",
      exEyebrow: "Für Kunden & Partner", exText: "Hochwertige Portfolios und Ausstellungen – als blätterbare Flipbooks, ohne Download-, Druck- oder Export-Funktion.",
      exLabel: "Passwort", exBtn: "Zugang öffnen",
      exMsg: "Im Preview deaktiviert – hier wird kein Passwort geprüft oder übertragen. In der Produktion prüft ein Next.js Route Handler das Passwort serverseitig.",
      exSteps: ["Passwort-Prüfung serverseitig (Route Handler), Sitzung als httpOnly-Cookie – kein Passwort im JavaScript-Bundle.",
        "Flipbook-Seiten werden über eine geschützte Route gestreamt – nie als öffentliche /wp-content-URL.",
        "Zusätzlich: Rechtsklick und Text-/Bildauswahl gesperrt (user-select: none), Seiten ohne <img>-Tags – nichts zum Rechtsklick-Speichern."],
      legalLoading: "Lädt …", dataLine: "Daten: WordPress REST API von enecs.com · {p} Projekte (DE), {e} (EN), {f} Flipbook-Beiträge · Stand {d}"
    },
    en: {
      "nav.editions": "Editions", "nav.archive": "Archive", "nav.exclusive": "Exclusive", "nav.menu": "Menu",
      "footer.claim": "Magazine for architecture & ecology – South Tyrol, Switzerland, Liechtenstein, Germany.",
      "footer.imprint": "Imprint", "footer.privacy": "Privacy",
      eyebrow: "Media library · Projects, portraits, flipbooks",
      intro: "An archive that fills itself: every new entry in WordPress appears here automatically – architecture, ecology and the people behind it.",
      stamp: "Real data · WordPress REST API · as of {d}",
      all: "All", search: "Search the archive", showing: "Showing <strong>{n}</strong> of {t} entries",
      more: "Load more", of: "{n} of {t}", empty: "No entries for this selection.", reset: "Reset filters",
      enOnly: "English entries only", enOrder: "English entries first, then {n} German-only entries (marked DE only)", flipPages: "{n} pages", read: "Read more",
      shelfTitle: "Flipbook issues", shelfText: "Leaf through like a printed magazine – {n} portraits as interactive flipbooks.",
      shelfAll: "All flipbooks", prevShort: "Previous", nextShort: "Next", close: "Close",
      partners: "Partner hotels", back: "Archive", region: "Region", published: "Published", images: "Images",
      website: "Website", original: "Original", onEnecs: "view on enecs.com", langs: "Languages",
      onlyDe: "<b>Available in German only.</b> WordPress (WPML) has no English translation of this entry yet.",
      onlyDeShort: "DE only", related: "More from the archive", prev: "Previous entry", next: "Next entry",
      page: "Page", pages: "Pages", format: "Format", flipNote: "Preview note: this flipbook's pages are public under /wp-content/uploads/flipbook/… – hidden download buttons do not protect them. In the Exclusive area the Next.js server only streams page images after a verified password.",
      edTitle: "Editions", edEyebrow: "Two magazines, one editorial team", ueTitle: "Umwelt & Energie Fachjournal®",
      ueText: "The established trade journal – current projects in renewable energy and energy-efficient building. Every issue straight from the existing WordPress.",
      openFlip: "Open flipbook", pdf: "public PDF", vbText: "The new magazine from enecs is in preparation. Cover, claim and publication date will follow as soon as the editorial team releases them.", vbNote: "Placeholder teaser – copy to come from the editorial team.",
      soon: "Coming soon", vbLink: "visionbaukunst.com",
      exEyebrow: "For clients & partners", exText: "High-end portfolios and exhibitions – as page-turning flipbooks, with no download, print or export.",
      exLabel: "Password", exBtn: "Enter",
      exMsg: "Disabled in this preview – no password is checked or sent anywhere. In production a Next.js route handler verifies it on the server.",
      exSteps: ["Server-side password check (route handler), session as httpOnly cookie – no password in the JS bundle.",
        "Flipbook pages streamed through a protected route – never as a public /wp-content URL.",
        "Plus: right-click and text/image selection disabled (user-select: none), pages rendered without <img> tags – nothing to right-click-save."],
      legalLoading: "Loading …", dataLine: "Data: enecs.com WordPress REST API · {p} projects (DE), {e} (EN), {f} flipbook posts · as of {d}"
    }
  };

  var PARTNERS = [
    { name: "Amolaris Private Garden Chalets & Residence", de: "amolaris-private-garden-chalets-residence/", en: "amolaris-private-garden-chalets-residence/?lang=en", place: "Südtirol" },
    { name: "Biohotel Panorama", de: "biohotel-panorama/", en: "organic-hotel-panorama/?lang=en", place: "Südtirol" },
    { name: "Blasla Hof", de: "blasla-hof/", en: "blasla-yard/?lang=en", place: "Südtirol" },
    { name: "Hotel Gassenhof", de: "hotel-gassenhof/", en: "hotel-gassenhof/?lang=en", place: "Südtirol" },
    { name: "Presulis Lodges", de: "presulis-lodges/", en: "presulis-lodges/?lang=en", place: "Südtirol" }
  ];

  // module pattern: 12 cards = one "spread"; alternate spreads are mirrored
  var PATTERN = ["hero", "tall", "s", "drop", "s", "port", "land", "wide", "quote", "row", "row", "row"];
  var SIZES = {
    hero: "(min-width:1100px) 62vw, 100vw",
    tall: "(min-width:1100px) 30vw, (min-width:720px) 50vw, 100vw",
    s: "(min-width:1100px) 30vw, 50vw", drop: "(min-width:1100px) 30vw, 50vw",
    port: "(min-width:1100px) 38vw, (min-width:720px) 50vw, 100vw",
    land: "(min-width:1100px) 54vw, 100vw", wide: "(min-width:1100px) 54vw, 100vw",
    quote: "1px", row: "(min-width:1100px) 14vw, (min-width:720px) 20vw, 36vw"
  };

  // ------------------------------------------------------------ state
  var state = {
    lang: store("enecs-lang") || "de",
    filter: "all", q: "", enOnly: false,
    visible: PAGE, archiveScroll: 0
  };
  if (["de", "en"].indexOf(state.lang) < 0) state.lang = "de";

  function store(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      window.localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  function t(key, vars) {
    var s = (T[state.lang][key] !== undefined ? T[state.lang][key] : T.de[key]) || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(iso, long) {
    var d = new Date(iso);
    return new Intl.DateTimeFormat(state.lang === "de" ? "de-DE" : "en-GB",
      long ? { day: "numeric", month: "long", year: "numeric" } : { month: "short", year: "numeric" }).format(d);
  }
  var fetchedAt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(DATA.meta.fetchedAt));

  // ------------------------------------------------------------ images
  function isFlipAsset(src) { return /\/flipbook\//.test(src); }
  // company logos / tiny screenshots used as featured image → shown contained, not cropped to a photo frame
  function isLogoImage(it) { return !!it.image && (/logo/i.test(it.image.split("/").pop()) || (it.iw && it.iw < 500)); }
  function cdn(src, w) { return isFlipAsset(src) ? src : CDN + "/w:" + w + "/h:auto/q:mauto/f:best/" + src; }
  function srcset(src, max) {
    if (isFlipAsset(src)) return "";
    var ws = [480, 800, 1200, 1600, 2200].filter(function (w) { return !max || w <= max + 200; });
    if (!ws.length) ws = [480];
    return ws.map(function (w) { return cdn(src, w) + " " + w + "w"; }).join(", ");
  }
  function img(src, opts) {
    opts = opts || {};
    if (!src) return "";
    var ss = srcset(src, opts.max);
    return '<img src="' + esc(cdn(src, opts.w || 800)) + '"' +
      (ss ? ' srcset="' + esc(ss) + '" sizes="' + esc(opts.sizes || "100vw") + '"' : "") +
      ' alt="' + esc(opts.alt || "") + '"' +
      (opts.eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') +
      ' decoding="async" draggable="false">';
  }
  document.addEventListener("load", function (e) {
    if (e.target && e.target.tagName === "IMG") e.target.classList.add("is-loaded");
  }, true);
  document.addEventListener("error", function (e) {
    if (e.target && e.target.tagName === "IMG") e.target.classList.add("is-loaded");
  }, true);
  function markLoaded(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("img"), function (im) {
      if (im.complete && im.naturalWidth) im.classList.add("is-loaded");
    });
  }

  // ------------------------------------------------------------ data helpers
  var byId = { de: {}, en: {} };
  // light copy hygiene for page-builder leftovers: an ALL-CAPS heading glued to the front of the excerpt is dropped,
  // an ALL-CAPS kicker is kept verbatim but typeset as small caps (see .is-caps)
  var CAPS_LEAD = /^(?:[A-ZÄÖÜ0-9][A-ZÄÖÜß0-9\-–&.,\/|]*\s+){2,}(?=[A-Za-zÄÖÜäöü][a-zäöüß])/;
  ["de", "en"].forEach(function (l) {
    DATA.items[l].forEach(function (it) {
      if (it.excerpt && CAPS_LEAD.test(it.excerpt)) it.excerpt = it.excerpt.replace(CAPS_LEAD, "");
      if (it.kicker && /\b(Kontakt|Contact|Copyright)\b|©|@|\bTel\b|\bFax\b/.test(it.kicker)) it.kicker = ""; // not a subtitle
      it.kickerCaps = !!(it.kicker && /[A-Z]/.test(it.kicker) && it.kicker === it.kicker.toUpperCase());
      byId[l][it.id] = it;
    });
  });
  // WPML left a few English entries without the region term → inherit it from the German original
  DATA.items.en.forEach(function (it) {
    var de = it.translation && byId.de[it.translation];
    if (!it.regions.length && de && de.regions.length) {
      it.regions = de.regions.slice();
      it.regionNames = de.regions.map(function (slug) {
        var r = DATA.regions.find(function (x) { return x.slug === slug; });
        return r ? r.en : slug;
      });
    }
  });

  /** Items for the current language. EN = English entries first (newest first), then German-only entries as badged fallback. */
  var enPool = null, enOnlyPool = null;
  function byDate(a, b) { return a.date < b.date ? 1 : -1; }
  function pool() {
    if (state.lang === "de") return DATA.items.de;
    if (!enOnlyPool) {
      enOnlyPool = DATA.items.en.slice().sort(byDate);
      enPool = enOnlyPool.concat(DATA.items.de.filter(function (d) { return !d.translation; })
        .map(function (d) { return Object.assign({ fallback: true }, d); }).sort(byDate));
    }
    return state.enOnly ? enOnlyPool : enPool;
  }
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return pool().filter(function (it) {
      if (state.filter !== "all" && it.regions.indexOf(state.filter) < 0) return false;
      if (q && (it.title + " " + (it.kicker || "") + " " + it.regionNames.join(" ") + " " + it.excerpt).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function regionLabel(slug) {
    var r = DATA.regions.find(function (x) { return x.slug === slug; });
    return r ? r[state.lang] : slug;
  }
  function itemHref(it) { return "#/p/" + it.lang + "/" + it.id; }

  // ------------------------------------------------------------ card
  function card(it, variant, idx, mirror) {
    var flip = it.type === "flipbook";
    var fb = flip ? DATA.flipbooks[it.flipbook] : null;
    var meta = [flip ? "Flipbook" : (it.regions[0] ? regionLabel(it.regions[0]) : ""), new Date(it.date).getFullYear()];
    if (flip && fb) meta.push(t("flipPages", { n: fb.pages }));
    var cls = "card v-" + variant + (mirror ? " v-mirror" : "") + (flip ? " is-flip" : "");
    var badge = it.fallback ? '<span class="badge">' + esc(t("onlyDeShort")) + "</span>" : "";
    var body =
      '<div class="card-body">' +
      '<p class="card-meta">' + meta.filter(Boolean).map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</p>" +
      '<h3 class="card-title">' + esc(it.title) + "</h3>" +
      (it.kicker ? '<p class="card-kicker' + (it.kickerCaps ? " is-caps" : "") + '">' + esc(it.kicker) + "</p>" : "") +
      ((variant === "hero" || variant === "land" || variant === "tall" || variant === "port" || variant === "wide") && it.excerpt
        ? '<p class="card-excerpt">' + esc(it.excerpt) + "</p>" : "") +
      "</div>";
    if (variant === "quote" && it.excerpt) {
      // text-only card: the entry's own opening line (not presented as a quote), cut at a sentence end
      return '<a class="' + cls + '" href="' + itemHref(it) + '">' +
        '<p class="q">' + esc(firstSentence(it.excerpt, 150)) + "</p>" + body + "</a>";
    }
    if (variant === "quote") variant = "s";
    var cover = flip ? (fb && fb.thumb ? fb.thumb : it.image) : it.image;
    var media = '<figure class="card-media' + (!flip && isLogoImage(it) ? " is-logo" : "") + '">' + badge +
      img(flip && variant !== "row" && variant !== "s" ? it.image : cover, {
        sizes: SIZES[variant] || "50vw", max: it.iw, alt: it.title, eager: idx < 2,
        w: variant === "hero" ? 1200 : 800
      }) + "</figure>";
    return '<a class="' + cls + '" href="' + itemHref(it) + '">' + media + body + "</a>";
  }

  function firstSentence(s, max) {
    s = String(s || "").replace(/\s*…$/, "");
    var m = s.match(/^.{40,}?[.!?](?=\s|$)/);
    var out = m ? m[0] : s;
    if (out.length > max) { out = out.slice(0, max); out = out.slice(0, out.lastIndexOf(" ")) + " …"; }
    return out;
  }

  // ------------------------------------------------------------ archive
  function renderArchive(restore) {
    var list = filtered();
    var all = pool();
    var counts = {};
    all.forEach(function (it) { it.regions.forEach(function (r) { counts[r] = (counts[r] || 0) + 1; }); });
    var shown = list.slice(0, state.visible);

    var chips = '<button type="button" class="chip" data-filter="all" aria-pressed="' + (state.filter === "all") + '">' +
      esc(t("all")) + "<sup>" + all.length + "</sup></button>" +
      DATA.regions.filter(function (r) { return counts[r.slug]; }).map(function (r) {
        return '<button type="button" class="chip" data-filter="' + r.slug + '" aria-pressed="' + (state.filter === r.slug) + '">' +
          esc(r[state.lang]) + "<sup>" + counts[r.slug] + "</sup></button>";
      }).join("");

    var html =
      '<section class="arch-head wrap view-enter">' +
      '<div class="arch-head-grid">' +
      '<div class="arch-head-title"><p class="eyebrow">' + esc(t("eyebrow")) + "</p>" +
      '<h1 class="display">' + esc(t("nav.archive")) + "<sup>" + all.length + "</sup></h1></div>" +
      '<div class="arch-head-intro"><p>' + esc(t("intro")) + "</p>" +
      '<div class="data-stamp"><i></i>' + esc(t("stamp", { d: fetchedAt })) + "</div></div>" +
      "</div></section>" +
      '<div class="filters"><div class="wrap filters-inner">' +
      '<div class="chips" role="group" aria-label="Filter">' + chips + "</div>" +
      '<div class="search' + (state.q ? " has-q" : "") + '"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg>' +
      '<input type="search" id="q" placeholder="' + esc(t("search")) + '" value="' + esc(state.q) + '" aria-label="' + esc(t("search")) + '"></div>' +
      "</div></div>" +
      '<section class="wrap">' +
      '<div class="result-line"><span id="count">' + t("showing", { n: shown.length, t: list.length }) + "</span>" +
      '<span class="result-side"><span id="order-note">' + orderNote(list) + "</span>" +
      (state.lang === "en" ? '<label class="en-only"><input type="checkbox" id="en-only"' + (state.enOnly ? " checked" : "") + "> " + esc(t("enOnly")) + "</label>" : "") +
      "</span></div>" +
      '<div class="grid" id="grid">' + gridHTML(shown, 0) + "</div>" +
      '<div id="more-slot">' + moreHTML(shown.length, list.length) + "</div>" +
      partnersHTML() +
      "</section>";
    view.innerHTML = html;
    markLoaded(view);
    bindArchive();
    if (restore) window.scrollTo(0, state.archiveScroll);
  }

  function orderNote(list) {
    if (state.lang !== "en" || state.enOnly) return "";
    var n = list.filter(function (i) { return i.fallback; }).length;
    return n ? esc(t("enOrder", { n: n })) : "";
  }

  function gridHTML(items, offset) {
    if (!items.length) {
      return '<div class="empty">' + esc(t("empty")) + '<br><button type="button" class="btn btn--ghost" id="reset">' + esc(t("reset")) + "</button></div>";
    }
    var out = "";
    var showShelf = state.filter === "all" && !state.q && pool().some(function (i) { return i.type === "flipbook"; });
    for (var i = 0; i < items.length; i++) {
      var n = offset + i;
      var spread = Math.floor(n / PATTERN.length);
      var variant = PATTERN[n % PATTERN.length];
      out += card(items[i], variant, n, spread % 2 === 1).replace('class="card v-s', n % PATTERN.length === 4 ? 'class="card is-third v-s' : 'class="card v-s');
      if (showShelf && n === 4) out += shelfHTML();
    }
    return out;
  }

  function shelfHTML() {
    var flips = pool().filter(function (i) { return i.type === "flipbook"; });
    return '<section class="shelf" aria-label="' + esc(t("shelfTitle")) + '">' +
      '<div class="shelf-head"><div><p class="eyebrow">Flipbook</p><h2>' + esc(t("shelfTitle")) + "</h2></div>" +
      '<div class="shelf-side"><p class="shelf-lede">' + esc(t("shelfText", { n: flips.length })) + ' <button type="button" class="linklike" data-filter="flipbook">' + esc(t("shelfAll")) + " &rarr;</button></p>" +
      '<div class="shelf-nav"><button type="button" data-shelf="-1" aria-label="' + esc(t("prevShort")) + '">&larr;</button><button type="button" data-shelf="1" aria-label="' + esc(t("nextShort")) + '">&rarr;</button></div></div></div>' +
      '<div class="shelf-track">' + flips.map(function (f) {
        var fb = DATA.flipbooks[f.flipbook] || {};
        return '<a class="shelf-item" href="' + itemHref(f) + '"><div class="cover">' + img(fb.thumb || f.image, { alt: f.title }) + "</div>" +
          "<span>" + esc(f.title) + "</span><small>" + esc(t("flipPages", { n: fb.pages || "–" })) + "</small></a>";
      }).join("") + "</div></section>";
  }

  function moreHTML(n, total) {
    if (n >= total) return "";
    return '<div class="more"><button type="button" class="btn" id="more">' + esc(t("more")) + "</button>" +
      '<div class="more-bar" aria-hidden="true"><i style="width:' + Math.round(n / total * 100) + '%"></i></div>' +
      "<small>" + esc(t("of", { n: n, t: total })) + "</small></div>";
  }

  function partnersHTML() {
    return '<section class="partners"><h2>' + esc(t("partners")) + "</h2><ul>" + PARTNERS.map(function (p) {
      return '<li><a href="https://enecs.com/' + p[state.lang] + '" target="_blank" rel="noopener">' + esc(p.name) + "</a><small>" + esc(p.place) + "</small></li>";
    }).join("") + "</ul></section>";
  }

  function bindArchive() {
    view.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.filter = b.getAttribute("data-filter");
        state.visible = PAGE;
        renderArchive();
        var f = view.querySelector(".filters");
        if (f && window.scrollY > f.offsetTop) window.scrollTo({ top: f.offsetTop - 1, behavior: "smooth" });
      });
    });
    var q = document.getElementById("q");
    var timer;
    if (q) q.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = q.value; state.visible = PAGE;
        var list = filtered();
        var shown = list.slice(0, state.visible);
        document.getElementById("grid").innerHTML = gridHTML(shown, 0);
        document.getElementById("more-slot").innerHTML = moreHTML(shown.length, list.length);
        document.getElementById("count").innerHTML = t("showing", { n: shown.length, t: list.length });
        var on = document.getElementById("order-note"); if (on) on.innerHTML = orderNote(list);
        q.parentNode.classList.toggle("has-q", !!state.q.trim());
        markLoaded(view); bindDynamic();
      }, 160);
    });
    var eo = document.getElementById("en-only");
    if (eo) eo.addEventListener("change", function () { state.enOnly = eo.checked; state.visible = PAGE; renderArchive(); });
    bindDynamic();
  }
  function bindDynamic() {
    var more = document.getElementById("more");
    if (more) more.addEventListener("click", function () {
      var list = filtered();
      var from = state.visible;
      state.visible += PAGE;
      var add = list.slice(from, state.visible);
      var grid = document.getElementById("grid");
      grid.insertAdjacentHTML("beforeend", gridHTML(add, from));
      document.getElementById("more-slot").innerHTML = moreHTML(Math.min(state.visible, list.length), list.length);
      document.getElementById("count").innerHTML = t("showing", { n: Math.min(state.visible, list.length), t: list.length });
      markLoaded(grid); bindDynamic();
    });
    var reset = document.getElementById("reset");
    if (reset) reset.addEventListener("click", function () { state.filter = "all"; state.q = ""; state.visible = PAGE; renderArchive(); });
    view.querySelectorAll(".shelf [data-filter]").forEach(function (b) {
      b.onclick = function () { state.filter = "flipbook"; state.visible = PAGE; renderArchive(); window.scrollTo(0, view.querySelector(".filters").offsetTop - 1); };
    });
    view.querySelectorAll(".shelf").forEach(function (shelf) {
      var track = shelf.querySelector(".shelf-track");
      var btns = shelf.querySelectorAll("[data-shelf]");
      if (!track || !btns.length) return;
      function sync() {
        btns[0].disabled = track.scrollLeft < 4;
        btns[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
      }
      btns.forEach(function (b) {
        b.onclick = function () { track.scrollBy({ left: Number(b.getAttribute("data-shelf")) * track.clientWidth * 0.8 }); };
      });
      track.onscroll = sync;
      sync();
    });
  }

  // ------------------------------------------------------------ content loading
  var contentPromises = {};
  function loadContent(lang) {
    if (window.ENECS_CONTENT && window.ENECS_CONTENT[lang]) return Promise.resolve(window.ENECS_CONTENT[lang]);
    if (!contentPromises[lang]) {
      contentPromises[lang] = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = "data/content-" + lang + ".js";
        s.onload = function () { resolve(window.ENECS_CONTENT[lang]); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return contentPromises[lang];
  }
  var flipLib;
  function loadFlipLib() {
    if (window.St && window.St.PageFlip) return Promise.resolve();
    if (!flipLib) flipLib = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js";
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    return flipLib;
  }

  // ------------------------------------------------------------ article
  // loose key for de-duplicating page-builder repeats ("Stetiner Hütte" vs "Stettiner<br>Hütte")
  function looseKey(s) {
    return String(s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").toLowerCase()
      .replace(/[^a-z0-9äöüß]+/g, "").replace(/(.)\1+/g, "$1");
  }
  var CREDIT = /^(fotos?|photos?|bilder|visuali[sz]ierungen?|renderings?|©)\b/i;
  var CONTACT_LABEL = /^(kontakt|contact)\s*:?$/i;
  var CONTACT = /(tel\.?|telefon|phone|fax|e-?mail)\s*[:.]?\s*\+?\(?\d|[\w.-]+@[\w-]+\.\w/i;

  function blocksHTML(blocks, skipText, noLead) {
    var out = "", gallery = [], firstP = !noLead;
    var skipKey = (skipText || "").toLowerCase().replace(/\W+/g, "");
    var afterGallery = false, seen = {}, lastCredit = "";
    if (skipText) seen[looseKey(skipText)] = 1; // the kicker is already shown in the article head
    function para(html) {
      var plain = html.replace(/<[^>]+>/g, "").trim();
      if (!plain) return;
      // "<strong>Title</strong> body…" → sub-heading + paragraph
      var m = html.match(/^\s*<strong>([^<]{3,140})<\/strong>\s*(?:<br\s*\/?>)?\s*([^]*)$/);
      if (m && m[2].replace(/<[^>]+>/g, "").trim().length > 40) {
        if (!seen[looseKey(m[1])]) out += "<h3>" + m[1] + "</h3>";
        seen[looseKey(m[1])] = 1;
        html = m[2]; plain = html.replace(/<[^>]+>/g, "").trim();
      }
      out += "<p" + (firstP && plain.length > 90 ? ' class="lead"' : "") + ">" + html + "</p>";
      if (plain.length > 90) firstP = false;
    }
    function flush() {
      if (!gallery.length) return;
      // editorial rhythm: full → pair → trio → pair …; the remainder decides the last row
      var rows = [], i = 0, cycle = [1, 2, 3, 2], k = 0;
      while (i < gallery.length) {
        var left = gallery.length - i, take = Math.min(cycle[k % cycle.length], left);
        if (left - take === 1 && take > 1) take = take === 3 ? 2 : take; // avoid a lonely last image after a trio
        rows.push(gallery.slice(i, i + take)); i += take; k++;
      }
      out += '<div class="gallery">' + rows.map(function (row) {
        var c = row.length === 1 ? "full" : row.length === 3 ? "third" : "half";
        return row.map(function (g, j) {
          var ar = c === "full" && g.w && g.h ? ' style="aspect-ratio:' + g.w + " / " + g.h + '"' : "";
          return '<figure class="' + c + (c === "third" && j === 2 ? " t-last" : "") + '"' + ar + ' data-src="' + esc(g.src) + '" tabindex="0">' + img(g.src, {
            sizes: c === "full" ? "(min-width:1200px) 1180px, 94vw" : c === "third" ? "(min-width:720px) 30vw, 50vw" : "(min-width:720px) 45vw, 50vw",
            max: g.w, w: c === "full" ? 1600 : 800 }) + "</figure>";
        }).join("");
      }).join("") + "</div>";
      gallery = [];
      afterGallery = true; lastCredit = "";
    }
    blocks.forEach(function (b) {
      if (b.t === "img") {
        if (b.w && b.w <= 420) { flush(); afterGallery = false; out += '<img class="logo-img" src="' + esc(b.src) + '" alt="" loading="lazy">'; return; }
        gallery.push(b); return;
      }
      flush();
      var wasAfter = afterGallery;
      afterGallery = false;
      if (b.t === "p" || b.t === "h") {
        var plain = b.html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        var key = looseKey(b.html);
        if (!plain) return;
        if (skipKey && plain.toLowerCase().replace(/&amp;/g, "&").replace(/\W+/g, "") === skipKey) return;
        if (key.length > 3 && key.length < 60 && seen[key]) { afterGallery = wasAfter; return; } // page-builder duplicate
        // photo credit, possibly glued to the project text: "Fotos © X<br> <strong>Title</strong> Text…"
        if (b.t === "p" && /^(fotos?|photos?|bilder)\s*:?\s*(©|\(c\))?\s*$/i.test(plain)) return; // credit without a name
        if (b.t === "p" && CREDIT.test(plain)) {
          var parts = b.html.split(/<br\s*\/?>/);
          var credit = parts.shift();
          var rest = parts.join("<br>").trim();
          if (lastCredit !== looseKey(credit)) out += '<p class="credit">' + credit + "</p>";
          lastCredit = looseKey(credit);
          if (rest) para(rest);
          afterGallery = wasAfter && !rest;
          return;
        }
        // company contact details (partner portraits) → small address block, never the lead paragraph
        if (b.t === "p" && CONTACT_LABEL.test(plain)) { out += '<p class="contact-label">' + esc(plain.replace(/:$/, "")) + "</p>"; return; }
        if (b.t === "p" && plain.length < 260 && CONTACT.test(plain)) {
          out += '<p class="contact">' + b.html.replace(/<\/?strong>/g, "") + "</p>"; return;
        }
        // short line right after a gallery = the project's name → caption, not body text
        if (wasAfter && plain.length <= 48 && !/[.!?:]$/.test(plain)) {
          out += '<p class="caption">' + esc(plain) + "</p>";
          seen[key] = 1; afterGallery = true; return;
        }
        seen[key] = 1;
        if (b.t === "h") { out += "<h2>" + b.html.replace(/<br\s*\/?>\s*$/, "") + "</h2>"; return; }
        if (/^<strong>[^]*<\/strong>$/.test(b.html) && plain.length < 140 && b.html.indexOf("</strong>") === b.html.length - 9) {
          out += "<h3>" + esc(plain) + "</h3>"; return;
        }
        para(b.html);
      } else if (b.t === "ul" || b.t === "ol") {
        out += "<" + b.t + ">" + b.items.map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</" + b.t + ">";
      } else if (b.t === "quote") {
        out += "<blockquote>" + b.html + "</blockquote>";
      }
    });
    flush();
    return out;
  }

  function renderArticle(lang, id) {
    var it = byId[lang] && byId[lang][id];
    if (!it) { location.hash = "#/archiv"; return; }
    var list = filtered().length ? filtered() : pool();
    var i = list.findIndex(function (x) { return x.id === it.id; });
    var prev = i > 0 ? list[i - 1] : null, next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
    var flip = it.type === "flipbook";
    var fb = flip ? DATA.flipbooks[it.flipbook] : null;
    var mismatch = state.lang !== it.lang; // e.g. EN UI but only a German article exists
    var langs = it.translation ? "DE · EN" : (it.lang === "de" ? "DE" : "EN");

    var facts = [
      flip ? [t("format"), "Flipbook"] : [t("region"), it.regionNames.join(", ") || "–"],
      [t("published"), fmtDate(it.date, true)],
      [flip ? t("pages") : t("images"), flip ? String(fb ? fb.pages : "–") : String(it.imageCount || "–")],
      [t("langs"), langs],
      [it.external && it.external[0] ? t("website") : t("original"), true,
        it.external && it.external[0]
          ? '<a href="' + esc(it.external[0]) + '" target="_blank" rel="noopener">' + esc(it.external[0].replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + "</a>"
          : '<a href="' + esc(it.link) + '" target="_blank" rel="noopener">enecs.com</a>']
    ];

    var html =
      '<article class="article view-enter' + (flip ? " article--flip" : "") + '"><div class="wrap">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/archiv">&larr; ' + esc(t("back")) + "</a><span>/</span><span>" +
      esc(flip ? "Flipbook" : (it.regionNames[0] || "")) + "</span></nav>" +
      '<header class="article-head">' +
      '<p class="eyebrow">' + esc(flip ? "Flipbook · " + t("flipPages", { n: fb ? fb.pages : "–" }) : (it.regionNames[0] || "")) + " · " + esc(fmtDate(it.date)) + "</p>" +
      "<h1>" + esc(it.title) + "</h1>" +
      (it.kicker ? '<p class="kicker' + (it.kickerCaps ? " is-caps" : "") + '">' + esc(it.kicker) + "</p>" : "") +
      "</header>" +
      (mismatch ? '<p class="notice">' + t("onlyDe") + "</p>" : "") +
      (flip ? '<div class="flip-stage" id="flip-stage"><div class="flip-book" id="flip-book"></div>' +
        '<div class="flip-controls"><button type="button" id="fp" aria-label="' + esc(t("prevShort")) + '">&larr;</button><output id="fpage">1 / ' + (fb ? fb.pages : "") + '</output><button type="button" id="fn" aria-label="' + esc(t("nextShort")) + '">&rarr;</button></div></div>' +
        '<p class="sec-note">' + esc(t("flipNote")) + "</p>"
        : '<figure class="article-hero' + (isLogoImage(it) ? " is-logo" : "") + '">' + img(it.image, { eager: true, sizes: "100vw", max: it.iw, w: 1600, alt: it.title }) + "</figure>") +
      '<dl class="facts">' + facts.map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + (f[1] === true ? f[2] : esc(f[1])) + "</dd></div>"; }).join("") + "</dl>" +
      '<div class="prose" id="prose"><p style="color:var(--muted)">…</p></div>' +
      '<footer class="article-foot">' +
      (prev ? '<a href="' + itemHref(prev) + '">&larr; ' + esc(prev.title) + "</a>" : "<span></span>") +
      '<a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(t("original")) + " " + esc(t("onEnecs")) + " &nearr;</a>" +
      (next ? '<a href="' + itemHref(next) + '">' + esc(next.title) + " &rarr;</a>" : "") +
      "</footer>" +
      relatedHTML(it) +
      "</div></article>";
    view.innerHTML = html;
    window.scrollTo(0, 0);
    markLoaded(view);

    if (flip) {
      document.getElementById("prose").remove();
      mountFlipbook(fb);
    } else {
      loadContent(it.lang).then(function (c) {
        var blocks = (c[String(it.id)] || []).slice();
        // hero already shown → drop its duplicate from the body
        var heroKey = (it.image || "").split("/").pop().replace(/-scaled(?=\.)/, "");
        blocks = blocks.filter(function (b, idx) {
          return !(b.t === "img" && idx < 12 && b.src.split("/").pop().replace(/-scaled(?=\.)/, "") === heroKey);
        });
        var p = document.getElementById("prose");
        if (p) { p.innerHTML = blocksHTML(blocks, it.kicker); markLoaded(p); }
      });
    }
  }

  function relatedHTML(it) {
    var same = pool().filter(function (x) {
      return x.id !== it.id && x.type === it.type && (it.type === "flipbook" || x.regions[0] === it.regions[0]);
    }).slice(0, 3);
    if (!same.length) return "";
    return '<section class="related"><h2>' + esc(t("related")) + '</h2><div class="grid">' +
      same.map(function (x) { return card(x, "s", 99); }).join("") + "</div></section>";
  }

  function mountFlipbook(fb) {
    var stage = document.getElementById("flip-stage");
    var book = document.getElementById("flip-book");
    if (!fb || !book) return;
    stage.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });
    var pages = [];
    for (var i = 1; i <= fb.pages; i++) pages.push(fb.base + "page/" + i + ".jpg");
    var ratio = fb.w / fb.h;
    var maxH = Math.max(340, Math.min(720, Math.round(window.innerHeight * 0.6)));
    var maxW = Math.round(maxH * ratio);
    // placeholder while the page-flip library loads: cover at its final size, so nothing jumps
    book.innerHTML = '<div class="flip-wait" style="aspect-ratio:' + (window.innerWidth >= 720 ? 2 * ratio : ratio) + '">' +
      '<div class="flip-wait-cover" style="background-image:url(&quot;' + esc(pages[0]) + '&quot;)"></div></div>';
    book.style.maxWidth = (window.innerWidth >= 720 ? maxW * 2 : maxW) + "px";
    var timeout = new Promise(function (_, reject) { setTimeout(function () { reject(new Error("timeout")); }, 12000); });
    Promise.race([loadFlipLib(), timeout]).then(function () {
      if (!document.body.contains(book)) return;
      // HTML mode: pages are divs with background images (no <img> to save/drag), loaded progressively
      book.innerHTML = pages.map(function (src, i) {
        return '<div class="flip-page' + (i === 0 || i === pages.length - 1 ? " is-hard" : "") + '" data-bg="' + esc(src) + '"' +
          (i === 0 || i === pages.length - 1 ? ' data-density="hard"' : "") + '><div class="flip-img"></div></div>';
      }).join("");
      var els = Array.prototype.slice.call(book.querySelectorAll(".flip-page"));
      function warm(center) {
        for (var k = Math.max(0, center - 3); k <= Math.min(els.length - 1, center + 5); k++) {
          var el = els[k];
          if (el.dataset.bg) { el.firstChild.style.backgroundImage = "url(\"" + el.dataset.bg + "\")"; delete el.dataset.bg; }
        }
      }
      warm(0);
      var pf = new window.St.PageFlip(book, {
        width: maxW, height: maxH, size: "stretch",
        minWidth: 200, maxWidth: maxW, minHeight: Math.round(200 / ratio), maxHeight: maxH,
        showCover: true, maxShadowOpacity: 0.4, mobileScrollSupport: true, usePortrait: true, flippingTime: 800
      });
      pf.loadFromHTML(els); // HTML mode
      pf.on("flip", function (e) { warm(e.data); });
      var out = document.getElementById("fpage");
      function upd() {
        var idx = pf.getCurrentPageIndex() + 1;
        var orient = pf.getOrientation && pf.getOrientation();
        var label = idx;
        if (orient === "landscape" && idx > 1 && idx < fb.pages) label = idx + "–" + Math.min(idx + 1, fb.pages);
        out.textContent = label + " / " + fb.pages;
      }
      pf.on("flip", upd); pf.on("changeOrientation", upd);
      document.getElementById("fp").onclick = function () { pf.flipPrev(); };
      document.getElementById("fn").onclick = function () { pf.flipNext(); };
      window.__pf = pf;
    }).catch(function () {
      // library unreachable: static page strip (still background images, no <img> to save)
      if (!document.body.contains(book)) return;
      book.style.maxWidth = "";
      book.innerHTML = '<div class="flip-fallback">' + pages.slice(0, 12).map(function (p) {
        return '<div style="aspect-ratio:' + ratio + ';background-image:url(&quot;' + esc(p) + '&quot;)"></div>';
      }).join("") + "</div>";
      var ctl = stage.querySelector(".flip-controls"); if (ctl) ctl.hidden = true;
    });
  }

  // ------------------------------------------------------------ editions
  function renderEditions() {
    var groups = {};
    (DATA.editions || []).forEach(function (e) { (groups[e.group] = groups[e.group] || []).push(e); });
    var html = '<section class="wrap view-enter"><header class="page-head"><p class="eyebrow">' + esc(t("edEyebrow")) + "</p>" +
      '<h1 class="display">' + esc(t("edTitle")) + "</h1></header>" +
      '<div class="editions"><div class="ed-ue"><h2>' + esc(t("ueTitle")) + "</h2><p>" + esc(t("ueText")) + "</p>" +
      Object.keys(groups).map(function (g) {
        return '<h3 class="ed-group">' + esc(g) + '</h3><div class="ed-grid">' + groups[g].map(function (e) {
          return '<a class="ed-item" href="' + esc(e.flipbook || e.pdf || "#") + '" target="_blank" rel="noopener"><div class="cover">' +
            img(e.cover, { sizes: "(min-width:1100px) 14vw, 45vw", w: 600, alt: e.title }) + "</div><span>" +
            esc(e.title.replace(/^Fachjournal\s+/, "")) + "</span><small>" + esc(t("openFlip")) + (e.pdf ? " · " + esc(t("pdf")) : "") + "</small></a>";
        }).join("") + "</div>";
      }).join("") +
      '</div><aside class="ed-vb"><p class="eyebrow">Vision Baukunst</p><h2>Vision<br>Baukunst</h2><p>' + esc(t("vbText")) + "</p>" +
      '<p class="soon"><i></i>' + esc(t("soon")) + '</p><p class="vb-note">' + esc(t("vbNote")) + "</p></aside></div></section>";
    view.innerHTML = html;
    window.scrollTo(0, 0);
    markLoaded(view);
  }

  // ------------------------------------------------------------ exclusive (mock gate)
  function renderExclusive() {
    view.innerHTML = '<section class="wrap view-enter"><div class="vault">' +
      '<div class="vault-copy"><p class="eyebrow">' + esc(t("exEyebrow")) + '</p><h1 class="display">' + esc(t("nav.exclusive")) + "</h1><p>" + esc(t("exText")) + "</p>" +
      '<ol class="vault-steps">' + t("exSteps").map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>" +
      '<form class="vault-form" id="vault" autocomplete="off" novalidate>' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2"/></svg>' +
      '<label for="pw">' + esc(t("exLabel")) + '</label><input id="pw" type="password" autocomplete="off">' +
      '<button class="btn" type="submit">' + esc(t("exBtn")) + '</button><p class="msg" id="vault-msg" hidden></p></form>' +
      "</div></section>";
    window.scrollTo(0, 0);
    document.getElementById("vault").addEventListener("submit", function (e) {
      e.preventDefault();
      document.getElementById("pw").value = ""; // nothing is sent or stored in the preview
      var m = document.getElementById("vault-msg");
      m.textContent = t("exMsg"); m.hidden = false;
    });
  }

  // ------------------------------------------------------------ legal drawer
  var drawer = document.getElementById("legal");
  function openLegal(key) {
    var doc = (DATA.legal[state.lang] || {})[key] || (DATA.legal.de || {})[key];
    var body = document.getElementById("legal-body");
    body.innerHTML = doc ? '<h2 id="legal-title">' + esc(doc.title) + '</h2><div class="prose">' + blocksHTML(doc.blocks, null, true) + "</div>" : "";
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector(".drawer-close").focus();
  }
  function closeLegal() { drawer.hidden = true; document.body.style.overflow = ""; }
  document.querySelectorAll("[data-legal]").forEach(function (b) { b.addEventListener("click", function () { openLegal(b.getAttribute("data-legal")); }); });
  drawer.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeLegal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) closeLegal(); });

  // ------------------------------------------------------------ gallery lightbox (article images)
  var lb = null, lbList = [], lbIdx = 0, lbReturn = null;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    var im = lb.querySelector("img");
    im.classList.remove("is-loaded");
    im.src = cdn(lbList[lbIdx], 2200);
    lb.querySelector("output").textContent = (lbIdx + 1) + " / " + lbList.length;
  }
  function lbOpen(list, i, from) {
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
      lb.innerHTML = '<button type="button" class="lb-close" aria-label="Close">&times;</button>' +
        '<button type="button" class="lb-nav lb-prev" aria-label="Previous">&larr;</button><img alt="" draggable="false">' +
        '<button type="button" class="lb-nav lb-next" aria-label="Next">&rarr;</button><output></output>';
      document.body.appendChild(lb);
      lb.addEventListener("click", function (e) {
        if (e.target.classList.contains("lb-prev")) lbShow(lbIdx - 1);
        else if (e.target.classList.contains("lb-next")) lbShow(lbIdx + 1);
        else if (e.target.tagName !== "IMG") lbClose();
      });
    }
    lbList = list; lbReturn = from;
    lb.querySelector(".lb-close").setAttribute("aria-label", t("close"));
    lb.querySelector(".lb-prev").setAttribute("aria-label", t("prevShort"));
    lb.querySelector(".lb-next").setAttribute("aria-label", t("nextShort"));
    lb.classList.toggle("is-single", list.length < 2);
    lb.hidden = false; document.body.style.overflow = "hidden";
    lbShow(i);
    lb.querySelector(".lb-close").focus();
  }
  function lbClose() {
    if (!lb || lb.hidden) return;
    lb.hidden = true; document.body.style.overflow = "";
    if (lbReturn) lbReturn.focus();
  }
  view.addEventListener("click", function (e) {
    var fig = e.target.closest && e.target.closest(".gallery figure[data-src]");
    if (!fig) return;
    var figs = Array.prototype.slice.call(view.querySelectorAll(".gallery figure[data-src]"));
    lbOpen(figs.map(function (f) { return f.getAttribute("data-src"); }), figs.indexOf(fig), fig);
  });
  view.addEventListener("keydown", function (e) {
    var fig = e.target.closest && e.target.closest(".gallery figure[data-src]");
    if (fig && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fig.click(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!lb || lb.hidden) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbShow(lbIdx - 1);
    else if (e.key === "ArrowRight") lbShow(lbIdx + 1);
  });
  window.addEventListener("hashchange", lbClose);

  // ------------------------------------------------------------ chrome / router
  function applyChrome(route) {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === state.lang)); });
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      var on = a.getAttribute("data-nav") === route;
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var c = DATA.meta.counts;
    document.getElementById("footer-data").textContent = t("dataLine", { p: c.de.projects, e: c.en.projects, f: c.de.flipbooks, d: fetchedAt });
    document.title = (route === "archive" ? t("nav.archive") : route === "editions" ? t("nav.editions") : route === "exclusive" ? t("nav.exclusive") : "enecs") + " – enecs Preview";
  }

  var lastRoute = null;
  function router() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("/");
    var mob = document.getElementById("mobile-nav");
    mob.hidden = true; document.querySelector(".menu-btn").setAttribute("aria-expanded", "false");
    if (parts[0] === "p" && parts[1] && parts[2]) {
      if (lastRoute === "archive") state.archiveScroll = window.scrollY;
      applyChrome("archive");
      renderArticle(parts[1], Number(parts[2]));
      lastRoute = "article";
    } else if (parts[0] === "editionen" || parts[0] === "editions") {
      applyChrome("editions"); renderEditions(); lastRoute = "editions";
    } else if (parts[0] === "exklusiv" || parts[0] === "exclusive") {
      applyChrome("exclusive"); renderExclusive(); lastRoute = "exclusive";
    } else {
      applyChrome("archive");
      renderArchive(lastRoute === "article");
      lastRoute = "archive";
    }
  }

  document.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      var lang = b.getAttribute("data-lang");
      if (lang === state.lang) return;
      state.lang = lang; store("enecs-lang", lang);
      state.visible = PAGE;
      var m = location.hash.match(/^#\/p\/(de|en)\/(\d+)/);
      if (m) {
        var it = byId[m[1]][Number(m[2])];
        if (it && it.lang !== lang && it.translation && byId[lang][it.translation]) {
          location.hash = "#/p/" + lang + "/" + it.translation; return;
        }
      }
      router();
    });
  });
  document.querySelector(".menu-btn").addEventListener("click", function () {
    var mob = document.getElementById("mobile-nav");
    var open = mob.hidden;
    mob.hidden = !open;
    this.setAttribute("aria-expanded", String(open));
  });

  // ?lang=en deep link
  var qp = new URLSearchParams(location.search);
  if (qp.get("lang") === "en" || qp.get("lang") === "de") state.lang = qp.get("lang");

  window.addEventListener("hashchange", router);
  router();
})();
