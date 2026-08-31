// Reads src/pages/*.md, src/journal/**/*.md and src/milestones.md, wraps
// each in generator/template.html, writes the result to /dist. Copies
// src/static/ verbatim, plus any images sitting next to a journal entry.
//
// The journal renders as a "journey trail": the last TRAIL_WEEKS weeks of
// entries as waypoints on a path (oldest of the window first), plus a
// "favourite spots" shelf of entries the owner flagged `featured: true`.
// Everything older lives in the monthly archive at /journal/archive/.
// A small /static/entries.json manifest powers the random-day button.
//
// Run with: npm run build

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

// The day Annie came home — Week 1 starts here. Public on About Annie.
const HOME_DATE_UTC = Date.UTC(2026, 7, 21);
const TRAIL_WEEKS = 4; // how many recent weeks the trail shows
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// The journal IS the home page (owner decision, Aug 2026): visitors land
// on the trail, so there's no separate Journal nav item. /journal/ still
// exists as a redirect for old links; posts and the archive keep their
// /journal/... URLs.
const NAV = [
  ['Home', '/'],
  ['Milestones', '/milestones.html'],
  ['About Annie', '/about-annie.html'],
  ['About This Project', '/about-this-project.html'],
];

const SITE_NAME = 'Annie & Claude';

// Used to build absolute URLs for the canonical link and the Open Graph
// tags — both need them, relative paths don't work in a share preview.
// Matches the CNAME file at the repo root.
const SITE_URL = 'https://annie-and-claude.com';
const SITE_DESCRIPTION =
  "A Golden Retriever × Border Collie growing up, written down as it happens. "
  + "The honest version: what worked, what didn't, and what she taught us that week.";
const SITE_IMAGE = '/static/photos/home-locket.jpg';

// The newsletter sign-up: "a letter from Annie", fortnightly, run on
// Beehiiv. Beehiiv counting its own opens and clicks is the single
// exception to the no-analytics rule (owner decision, Aug 2026) and it
// is scoped to Beehiiv's dashboard. Nothing on the site counts anything,
// and no tracker belongs anywhere else in dist/.
//
// Two ways to wire it, deliberately:
//   href  — links out to the Beehiiv form. Keeps dist/ free of
//           third-party code entirely, and keeps the button ours.
//   embed — the same form inline in the card, as an iframe.
// embed wins if both are set. Both null means no card renders at all.
//
// href is the one in use (owner's call, Aug 2026: "do not lose the cute
// style by embedding this button"). The pill on the card is the site's
// own, in the site's own type and palette. Beehiiv only owns the page
// it lands on.
//
// Beehiiv hands out a <script> loader (subscribe-forms.beehiiv.com/v3/
// loader.js, with a data-beehiiv-form id) as its embed snippet. Don't
// use it. All it does is read the form config from their API and inject
// an iframe pointing at the URL below, so the script is a lookup step
// that can be skipped: setting embed gets the same form with no
// third-party JS running on the page at all.
const NEWSLETTER = {
  name: 'A letter from Annie',
  href: 'https://subscribe-forms.beehiiv.com/v3/forms/e2effc80-83cf-4d79-a043-df4029ef564a',
  embed: null, // 'https://subscribe-forms.beehiiv.com/v3/forms/e2effc80-83cf-4d79-a043-df4029ef564a'
};

function renderNav(activePath) {
  return NAV.map(([label, href]) => {
    const active = href === activePath ? ' class="active"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }).join('\n      ');
}

// hideTitle: the page's <h1> lives inside {{content}} (the home cover
// prints its own, under the medallion), so the template's slot renders
// empty and CSS hides it.
function renderPage({
  title, date, content, activePath, bodyClass = 'page-quiet', hideTitle = false,
  description, image, canonical, type = 'website',
}) {
  const h1 = title || SITE_NAME;
  const pageTitle = h1 === SITE_NAME ? SITE_NAME : `${h1} · ${SITE_NAME}`;
  // No description given? Take the page's own first paragraph. That keeps
  // every page described without needing frontmatter added to any of them.
  const desc = trimTo(description || firstParagraphText(content) || SITE_DESCRIPTION, 160);
  return TEMPLATE
    .replaceAll('{{pageTitle}}', escapeHtml(pageTitle))
    .replaceAll('{{head}}', headTags({ pageTitle, headline: h1, desc, image, canonical, type, date, content }))
    .replaceAll('{{bodyClass}}', bodyClass)
    .replaceAll('{{title}}', hideTitle ? '' : escapeHtml(h1))
    .replaceAll('{{date}}', date ? formatDate(date) : '')
    .replaceAll('{{nav}}', renderNav(activePath))
    .replace('{{content}}', content);
}

// Description, canonical and share-card tags. Plain metadata: no scripts, no
// third-party requests, nothing that counts anything. The analytics guardrail
// in CLAUDE.md is about tracking, and none of this tracks.
function headTags({ pageTitle, headline, desc, image, canonical, type, date, content }) {
  const url = SITE_URL + (canonical || '/');
  const img = SITE_URL + (image || SITE_IMAGE);
  const tag = (attr, name, value) => `  <meta ${attr}="${name}" content="${escapeHtml(value)}">`;
  return [
    tag('name', 'description', desc),
    `  <link rel="canonical" href="${escapeHtml(url)}">`,
    tag('property', 'og:type', type),
    tag('property', 'og:site_name', SITE_NAME),
    tag('property', 'og:title', pageTitle),
    tag('property', 'og:description', desc),
    tag('property', 'og:url', url),
    tag('property', 'og:image', img),
    tag('name', 'twitter:card', 'summary_large_image'),
    tag('name', 'twitter:title', pageTitle),
    tag('name', 'twitter:description', desc),
    tag('name', 'twitter:image', img),
    jsonLd({ headline, desc, img, url, type, date, content }),
  ].join('\n');
}

// Stuart, as named on About This Project. First name only, which is all the
// site publishes anywhere else.
const AUTHOR = {
  '@type': 'Person',
  name: 'Stuart',
  url: `${SITE_URL}/about-this-project.html`,
  image: `${SITE_URL}/static/photos/author.jpg`,
};

// Structured data, so a machine reading the page can tell what it is, who
// wrote it and when, rather than inferring it from the prose. A dated,
// first-hand, attributed record is exactly the shape search engines and
// answer engines are looking for, and this page already is one; the markup
// just says so out loud.
//
// Nothing here asserts anything the visible page doesn't already say.
function jsonLd({ headline, desc, img, url, type, date, content }) {
  const graph = [];

  const article = {
    '@type': type === 'article' && date ? 'BlogPosting' : 'WebPage',
    headline,
    description: desc,
    image: img,
    url,
    inLanguage: 'en-GB',
    author: AUTHOR,
    publisher: { '@type': 'Person', name: 'Stuart', url: SITE_URL },
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  if (date) {
    article.datePublished = date;
    article.dateModified = date;
  }
  graph.push(article);

  // A page whose section headings are questions is genuinely an FAQ, so mark
  // it as one. Derived from the rendered HTML rather than declared in
  // frontmatter, so it can never drift out of step with what's on the page.
  const faq = faqFromHtml(content);
  if (faq.length >= 2) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((qa) => ({
        '@type': 'Question',
        name: qa.q,
        acceptedAnswer: { '@type': 'Answer', text: qa.a },
      })),
    });
  }

  const payload = { '@context': 'https://schema.org', '@graph': graph };
  // Only </script> can break out of a script block; escaping the slash is the
  // standard fix and stays valid JSON.
  return `  <script type="application/ld+json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;
}

// Pulls question-and-answer pairs out of rendered HTML: any <h2> ending in a
// question mark, plus the prose up to the next heading.
function faqFromHtml(html) {
  if (!html) return [];
  const out = [];
  const sections = String(html).split(/<h2[^>]*>/i).slice(1);
  for (const section of sections) {
    const close = section.indexOf('</h2>');
    if (close === -1) continue;
    const q = stripTags(section.slice(0, close));
    if (!q.endsWith('?')) continue;
    const rest = section.slice(close + 5).split(/<h[23][^>]*>/i)[0];
    const paras = [...rest.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripTags(m[1]))
      .filter((t) => t.length > 20);
    if (paras.length) out.push({ q, a: paras.join(' ') });
  }
  return out;
}

function stripTags(s) {
  return decodeEntities(String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

// First real paragraph of rendered HTML, as plain text. Used as the fallback
// page description, so it skips anything that isn't prose.
function firstParagraphText(html) {
  for (const m of String(html).matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 40) return decodeEntities(text);
  }
  return '';
}

function decodeEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) =>
    ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' }[e]));
}

function trimTo(s, n) {
  const t = String(s).trim();
  if (t.length <= n) return t;
  return `${t.slice(0, t.lastIndexOf(' ', n - 1) > 0 ? t.lastIndexOf(' ', n - 1) : n - 1)}…`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// --- date helpers (all UTC, dates are plain YYYY-MM-DD strings) ---

function toIsoDate(raw) {
  // gray-matter hands YAML dates over as Date objects; normalise so
  // grouping and sorting can treat every date as a YYYY-MM-DD string.
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw);
}

function utcOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(String(d));
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function weekIndex(iso) {
  return Math.max(1, Math.floor((utcOf(iso) - HOME_DATE_UTC) / WEEK_MS) + 1);
}

function weekRangeLabel(n) {
  const start = new Date(HOME_DATE_UTC + (n - 1) * WEEK_MS);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const opts = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const year = end.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'UTC' });
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}–${end.toLocaleDateString('en-GB', opts)} ${year}`;
  }
  return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)} ${year}`;
}

function monthLabel(key) {
  const date = new Date(`${key}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// --- little SVG pieces ---

// "21 AUG" — the date as a legible label. This replaced the old circular
// MALVERN postmark, whose text was set at 8/6 units in a 60-unit viewBox:
// rendered at 48px that came out ~6px tall and, worse, wider than the
// r=14 inner ring it sat inside, so it crossed the ring and read as a
// smudge rather than a date.
function shortDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(iso);
  const day = date.getUTCDate();
  const mon = date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${day} ${mon}`;
}

function favBowSvg() {
  return `<svg class="fav-bow" viewBox="0 0 44 30" aria-hidden="true"><path d="M22 12 C 7 -2 0 15 19 18 C 13 9 18 7 22 12 Z"/><path d="M22 12 C 37 -2 44 15 25 18 C 31 9 26 7 22 12 Z"/><circle cx="22" cy="14" r="4"/></svg>`;
}

// A photo in a scalloped medallion, over a soft periwinkle-and-blush
// halo, with a few pastel dots for company. Used on the home cover and
// on any page with `hero:` frontmatter (e.g. About Annie). The scallop
// shape itself is a CSS mask (--scallop-mask in style.css).
function coverHeroHtml(src = '/static/photos/home-locket.jpg', alt = 'Annie') {
  const file = src.startsWith('/static/') ? path.join(SRC, 'static', src.slice(8)) : null;
  const size = file && jpegSize(file);
  const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
  return `<div class="cover-hero">
    <span class="cover-glow" aria-hidden="true"></span>
    <span class="cover-dot cover-dot--a" aria-hidden="true"></span>
    <span class="cover-dot cover-dot--b" aria-hidden="true"></span>
    <span class="cover-dot cover-dot--c" aria-hidden="true"></span>
    <div class="cover-medallion">
      <span class="medallion-rim" aria-hidden="true"></span>
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${dims}>
    </div>
  </div>`;
}

// The pup mascot, sitting (same shapes as the scroll-companion in
// template.html, minus the legs — no legs visible reads as "sitting").
// Static, on purpose: the motion budget in DESIGN.md is spoken for.
// Appears twice on home: at the launch path's start (Beat 2) and dozing
// in the sign-off (Beat 4) — same companion, start and end of the walk.
function pupSittingSvg(cls = 'launch-pup') {
  return `<svg class="${cls}" viewBox="5 22 105 55" aria-hidden="true">${pupShapes()}</svg>`;
}

// Just the shapes, so the pup can also be dropped straight into another
// drawing's coordinate space (the launch path embeds it in a <g>, which
// is what keeps pup and path glued together at every screen width).
function pupShapes() {
  return `
    <path d="M26 60 Q10 50 13 36 Q22 44 30 52 Z" fill="#e2b97e"/>
    <ellipse cx="54" cy="62" rx="30" ry="20" fill="#f0dfc0"/>
    <ellipse cx="46" cy="55" rx="16" ry="10" fill="#e2b97e" opacity="0.75"/>
    <circle cx="88" cy="42" r="17" fill="#f0dfc0"/>
    <ellipse cx="96" cy="48" rx="8" ry="6" fill="#f7ecd6"/>
    <circle cx="101" cy="46" r="2.6" fill="#4a3a30"/>
    <circle cx="88" cy="39" r="2.2" fill="#4a3a30"/>
    <path d="M78 28 Q70 42 79 50 Q83 38 88 29 Z" fill="#d9b98a"/>
    <path d="M72 52 Q81 59 91 57 L90 62 Q80 64 70 57 Z" fill="#4c7a50"/>
    <g transform="translate(73,59) rotate(-12) scale(0.55)">
      <path d="M0 8 C -15 -6 -22 11 -3 14 C -9 5 -4 3 0 8 Z" fill="#d98fa0"/>
      <path d="M0 8 C 15 -6 22 11 3 14 C 9 5 4 3 0 8 Z" fill="#d98fa0"/>
      <circle cx="0" cy="9" r="4.5" fill="#c17a8e"/>
    </g>`;
}

// The ribbon banner behind the hero title — the one place collar pink
// runs at hero scale (it's her bow, writ large; see DESIGN.md's palette
// rule before adding pink anywhere else). Tails and folds are drawn
// first so the arched band paints over them.
function ribbonSvg() {
  return `<svg class="ribbon" viewBox="0 0 300 74" preserveAspectRatio="none" aria-hidden="true">
    <path d="M28 20 L4 27 L15 37 L4 47 L28 54 Z" fill="#c17a8e"/>
    <path d="M272 20 L296 27 L285 37 L296 47 L272 54 Z" fill="#c17a8e"/>
    <path d="M28 50 L28 62 L42 52 Z" fill="#b06e81"/>
    <path d="M272 50 L272 62 L258 52 Z" fill="#b06e81"/>
    <path d="M28 12 Q150 2 272 12 L272 52 Q150 62 28 52 Z" fill="var(--bow, #d98fa0)"/>
  </svg>`;
}

function pawSvg(x, y, rot) {
  return `<g class="paw" transform="translate(${x},${y}) rotate(${rot})"><ellipse cx="0" cy="2" rx="4.5" ry="3.6"/><circle cx="-4" cy="-3.5" r="1.8"/><circle cx="0" cy="-5" r="1.8"/><circle cx="4" cy="-3.5" r="1.8"/></g>`;
}

// The dashed path between week stops, with paw prints along it.
// Alternates direction so the trail winds down the page.
function connectorSvg(side) {
  const d = side === 'right'
    ? 'M110 8 C 260 92, 480 -8, 600 76'
    : 'M600 8 C 450 92, 230 -8, 110 76';
  const paws = side === 'right'
    ? pawSvg(230, 46, 20) + pawSvg(360, 40, 8) + pawSvg(500, 42, -18)
    : pawSvg(480, 46, -20) + pawSvg(350, 40, -8) + pawSvg(210, 42, 18);
  return `<svg class="trail-connector" viewBox="0 0 700 84" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/>${paws}</svg>`;
}

// --- Patches ---------------------------------------------------------
//
// Journal entries render as patches on a scrapbook page: each one gets a
// paper tint, an edge treatment, a tilt, a size and (sometimes) a strip of
// washi tape. The variation is deliberately mismatched but NOT random —
// it is derived from a hash of the slug, so a given post looks the same
// on every build and the page doesn't reshuffle itself on each deploy.

const PATCH_TINTS = ['cream', 'sage', 'blush', 'sky', 'gold'];
const PATCH_EDGES = ['stamp', 'print', 'cut'];

function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function patchStyle(slug) {
  const h = hashOf(slug);
  const pick = (shift, n) => Math.floor(h / Math.pow(2, shift)) % n;
  return {
    tint: PATCH_TINTS[pick(0, PATCH_TINTS.length)],
    edge: PATCH_EDGES[pick(4, PATCH_EDGES.length)],
    big: pick(8, 3) === 0,
    tape: pick(11, 5) < 2,
    rot: (pick(14, 121) / 10 - 6).toFixed(1),   // -6.0deg … +6.0deg
    dateRot: (pick(21, 15) - 7).toFixed(1),     // -7deg … +7deg
  };
}

function patchHtml(e, { fav = false } = {}) {
  const s = patchStyle(e.slug);
  const cls = [
    'patch',
    `patch--${s.tint}`,
    `patch--edge-${s.edge}`,
    s.big ? 'patch--big' : '',
    fav ? 'patch--fav' : '',
    e.thumb ? '' : 'patch--nophoto',
  ].filter(Boolean).join(' ');
  const tape = s.tape ? '<span class="patch-tape" aria-hidden="true"></span>' : '';
  // A text-only post gets a written-note patch rather than an empty frame.
  const photo = e.thumb
    ? `<span class="patch-photo"><img src="${escapeHtml(e.thumb)}" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="patch-note" aria-hidden="true"><svg viewBox="-9 -9 18 18">${pawSvg(0, 0, -12)}</svg></span>`;
  const mark = fav ? favBowSvg() : '';
  return `<a class="${cls}" href="/journal/${e.slug}/" style="--rot:${s.rot}deg;--date-rot:${s.dateRot}deg">`
    + `${tape}${photo}${mark}`
    + `<span class="patch-date">${shortDate(e.date)}</span>`
    + `<span class="patch-title">${escapeHtml(e.title)}</span></a>`;
}

// --- Photos ----------------------------------------------------------
//
// Images render as "snaps" — printed photos with a caption, taped into
// the page. Two or more sitting next to each other in the markdown
// become a picture-book spread (a grid, each one tilted slightly, like
// an album). The caption goes in markdown's title slot; the alt text
// stays a plain description for screen readers:
//
//     ![Annie asleep on the step](nap.jpg "She picked the best spot.")
//
// Keep an image on its own line — an image sitting inside a sentence
// can't become a <figure> without producing invalid HTML.

marked.use({
  renderer: {
    image({ href, title, text }) {
      const caption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : '';
      return `<figure class="snap"><img src="${escapeHtml(href)}" alt="${escapeHtml(text || '')}" loading="lazy" decoding="async">${caption}</figure>`;
    },
  },
});

// Reads a JPEG's pixel size straight out of its SOF marker, so every
// <img> can carry width/height and photos don't shove the page around
// as they load. JPEG only — that's all this site commits.
function jpegSize(file) {
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch {
    return null;
  }
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0–SOF15 carry the dimensions; DHT/JPGA/DAC share the range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

// Adds real pixel dimensions, lifts each figure out of the <p> marked
// wraps a lone image in, then groups neighbouring photos into a spread.
function layOutPhotos(html, assetDir) {
  let out = html.replace(/<img src="([^"]+)"/g, (tag, src) => {
    // Journal photos sit beside their post; page photos are referenced
    // absolutely out of src/static. Remote images we leave alone.
    let file = null;
    if (/^https?:/.test(src)) file = null;
    else if (src.startsWith('/static/')) file = path.join(SRC, 'static', src.slice(8));
    else if (assetDir) file = path.join(assetDir, src);
    const size = file && jpegSize(file);
    return size ? `${tag} width="${size.width}" height="${size.height}"` : tag;
  });
  // One figure, and strictly one: the tempered `(?!</figure>)` stops the
  // quantifier backtracking across a closing tag and swallowing the prose
  // between two far-apart photos into a single spread.
  const ONE_FIGURE = '<figure class="snap">(?:(?!<\\/figure>)[\\s\\S])*<\\/figure>';
  out = out.replace(new RegExp(`<p>\\s*(${ONE_FIGURE})\\s*<\\/p>`, 'g'), '$1');
  out = out.replace(new RegExp(`(?:${ONE_FIGURE}\\s*){2,}`, 'g'), (run) => {
    const count = (run.match(/<figure class="snap">/g) || []).length;
    return `<div class="photo-book" data-photos="${count}">${run.trim()}</div>`;
  });
  return out;
}

function clean(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else results.push(full);
  }
  return results;
}

// --- Standalone pages: src/pages/*.md -> /<name>.html ---
// home.md is NOT built here: the home page is the journal trail plus the
// cover, assembled in buildHome() once the journal entries are known.
// A page with `hero:` frontmatter (a /static/... photo path, with
// `heroAlt:` as its description) opens with the same scalloped medallion
// as the home cover.
function buildPages() {
  const dir = path.join(SRC, 'pages');
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') || file === 'home.md') continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    const outName = file.replace(/\.md$/, '.html');
    const hero = data.hero ? coverHeroHtml(data.hero, data.heroAlt || 'Annie') : '';
    const html = renderPage({
      title: data.title,
      content: hero + layOutPhotos(marked.parse(content), null),
      activePath: `/${outName}`,
      bodyClass: 'page-quiet',
      description: data.description,
      image: data.hero,
      canonical: `/${outName}`,
      type: 'article',
      date: data.date ? toIsoDate(data.date) : undefined,
    });
    fs.writeFileSync(path.join(DIST, outName), html);
    console.log(`  page  -> ${outName}`);
  }
}

// --- Home: four beats (owner brief, 29 Aug 2026 — "the visitor goes on
// a trip"). Beat 1: the wow — Annie's medallion, her name on a ribbon,
// one line of intro, real snaps from recent entries fanned around her.
// Beat 2: the launch — a paw-print path enters from the page's left
// edge with the pup sitting at its head, towing the eye into the trail.
// Beats 3 and 4 (the you-are-here pin and the sign-off) live in
// buildTrail. No card any more; the hills are the stage.
function buildHome(trailContent, entries) {
  const file = path.join(SRC, 'pages', 'home.md');
  const { data, content } = fs.existsSync(file)
    ? matter(fs.readFileSync(file, 'utf8'))
    : { data: {}, content: '' };
  // The fan: newest 4 entries that have a photo — already-published
  // images only, so the fan refreshes itself as the journal grows.
  const snaps = entries
    .filter((e) => e.thumb)
    .slice(-4)
    .reverse()
    .map((e, i) => {
      let imgFile = null;
      if (e.thumb.startsWith('/static/')) imgFile = path.join(SRC, 'static', e.thumb.slice(8));
      else if (e.thumb.startsWith('/journal/')) imgFile = path.join(SRC, 'journal', e.thumb.slice(9));
      const size = imgFile && jpegSize(imgFile);
      const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
      return `<a class="hero-snap hero-snap--${i + 1}" href="/journal/${e.slug}/" aria-label="${escapeHtml(e.title)}"><img src="${escapeHtml(e.thumb)}" alt=""${dims} decoding="async"></a>`;
    })
    .join('\n  ');
  const hero = `<section class="home-hero">
  <svg class="hero-streamer hero-streamer--a" viewBox="0 0 40 150" aria-hidden="true"><path d="M20 4 C 40 30 0 52 20 78 C 40 104 0 126 18 146"/></svg>
  <svg class="hero-streamer hero-streamer--b" viewBox="0 0 40 150" aria-hidden="true"><path d="M20 4 C 40 30 0 52 20 78 C 40 104 0 126 18 146"/></svg>
  <svg class="hero-streamer hero-streamer--c" viewBox="0 0 40 150" aria-hidden="true"><path d="M20 4 C 40 30 0 52 20 78 C 40 104 0 126 18 146"/></svg>
  ${snaps}
  ${coverHeroHtml()}
  <div class="hero-ribbon">${ribbonSvg()}<h1>Annie</h1></div>
  ${marked.parse(content).replace('<p>', '<p class="hero-intro">')}
  <p class="cover-subtitle">Home since ${formatDate(isoOfUtc(HOME_DATE_UTC))} · The Malvern Hills</p>
</section>
<div class="hero-launch" aria-hidden="true">
  <svg class="launch-path" viewBox="0 0 700 172">
    <path class="launch-line" d="M-10 68 C 120 48, 260 70, 380 92 C 470 108, 520 130, 440 146 C 360 161, 200 152, 70 168"/>
    ${pawSvg(109, 60, -8)}${pawSvg(248, 71, 8)}${pawSvg(439, 105, 22)}${pawSvg(477, 133, 40)}${pawSvg(313, 156, -20)}${pawSvg(171, 161, -14)}
    <g transform="translate(19.2,-7.3) scale(0.952)">${pupShapes()}</g>
  </svg>
  <span class="scroll-hint">Come along ↓</span>
</div>`;
  const html = renderPage({
    title: data.title || SITE_NAME,
    content: hero + trailContent,
    activePath: '/',
    bodyClass: 'page-home',
    hideTitle: true,
    description: data.description || SITE_DESCRIPTION,
    canonical: '/',
  });
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  console.log('  home  -> index.html (hero + trail)');
}

// --- Lessons: tiny owner-written notes on what raising Annie is
// teaching the humans. A deliberate sibling of the "How Claude helps"
// bars: same component, its own page, because lessons are the owner's
// content and the bars are the experiment's catalogue. Each lesson can
// name the journal entries it came from (`related:`), and those posts
// grow a signpost back to it — the cross-link costs nothing per post.
// Files live in src/lessons/<slug>.md; see the README there for the
// format. Lesson substance is owner-dictated, always — never invented.

function readLessons() {
  const dir = path.join(SRC, 'lessons');
  const lessons = [];
  if (!fs.existsSync(dir)) return lessons;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') || file.toLowerCase() === 'readme.md') continue;
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    const slug = file.replace(/\.md$/, '');
    const related = (Array.isArray(data.related) ? data.related : data.related ? [data.related] : []).map(toIsoDate);
    lessons.push({
      slug,
      title: data.title || slug,
      date: data.date ? toIsoDate(data.date) : null,
      icon: data.icon || '💡',
      related,
      html: marked.parse(content),
    });
  }
  lessons.sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1));
  return lessons;
}

function buildLessonsPage(lessons) {
  const intro = '<p>Little things learned while raising Annie, written down as they click. Click a bar for the story; each one links back to the days it came from.</p>';
  const body = lessons.length
    ? lessons.map((l) => {
        const from = l.related
          .map((r) => `<a href="/journal/${escapeHtml(r)}/">${formatDate(r)}</a>`)
          .join(', ');
        const fromLine = from ? `<p class="lesson-from">From ${from}</p>` : '';
        return `<details class="claude-bar" id="lesson-${escapeHtml(l.slug)}">
  <summary><span class="bar-icon" aria-hidden="true">${l.icon}</span><span class="bar-label"><strong>${escapeHtml(l.title)}</strong><small>${l.date ? formatDate(l.date) : ''}</small></span></summary>
  <div class="bar-body">${l.html}${fromLine}</div>
</details>`;
      }).join('\n')
    : '<p>Nothing written down yet. Lessons land here as they get learned, and she has only just started teaching us.</p>';
  const html = renderPage({
    title: 'Lessons',
    content: intro + body,
    activePath: '/lessons.html',
    bodyClass: 'page-quiet',
    canonical: '/lessons.html',
  });
  fs.writeFileSync(path.join(DIST, 'lessons.html'), html);
  console.log(`  page  -> lessons.html (${lessons.length} lessons)`);
}

// --- Milestones ---
//
// Two sources, merged:
//
// 1. Hand-written, in src/milestones.md — lines like
//    "- 2026-09-01 — First trip to the vet for a check-up". For anything
//    that never appeared in a journal post (a weigh-in, a vet note).
//
// 2. Auto-detected, by rule, from journal posts that have ALREADY been
//    through the human review gate before reaching this repo. Two rules,
//    both deterministic and both only ever surface what's already
//    written — never invented:
//      a) Calendar rule: homecoming + every 7-day anniversary since.
//      b) Text rule: any sentence in a post containing the word "first"
//         (skipping "at first", a transition phrase, not a milestone).
//         The milestone IS that sentence, verbatim, linked to its post —
//         a quote, not a paraphrase, so there's nothing to get wrong.
//
// This is a rule the generator applies at build time, not a judgment
// call Claude makes per post — see DESIGN.md for why that distinction
// matters here.

// Owner-written lines are the "landmark" tier: they render large on the
// milestones page and are the only tier that gets photos. A label may
// start with ★ to flag an extra-big one (the star renders next to it).
function readMilestones() {
  const file = path.join(SRC, 'milestones.md');
  if (!fs.existsSync(file)) return { items: [], markdown: '' };
  const { content } = matter(fs.readFileSync(file, 'utf8'));
  const items = [];
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^-\s*(\d{4}-\d{2}-\d{2})\s*[—–-]+\s*(.+)$/);
    if (m) {
      let label = m[2].trim();
      const star = label.startsWith('★');
      if (star) label = label.replace(/^★\s*/, '');
      items.push({ date: m[1], label, auto: false, star });
    }
  }
  return { items, markdown: content };
}

// Reduce a post to plain prose before the "first" rule reads it. Without
// this, an image's markdown (and its caption, which ends `."` rather than
// `. `) fuses into the following sentence and the raw `![alt](file.jpg …)`
// ends up quoted verbatim on the Milestones page.
function prosify(markdown) {
  return markdown
    .replace(/\r/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')    // images: drop entirely
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // links: keep the link text
    .replace(/<[^>]+>/g, ' ')                 // raw HTML (video iframes)
    .replace(/[*_`]/g, '')                    // emphasis
    .replace(/^\s*#+\s*/gm, '')               // headings
    .replace(/\s+/g, ' ')
    .trim();
}

// Rule (b): quote sentences about a genuine "first" from a post's own
// prose. Tightened (owner request, Aug 2026): a bare "first" caught too
// much flavour text ("the first night"), so a sentence now needs
// "first <thing>" — optionally one word in between, so "first real look"
// still counts — or to open with "First". Capped at 2 per post, shortest
// sentences first (the same trick the trail uses for signposts). Still
// deterministic, still verbatim quotes of already-approved text.
const FIRST_THING = /\bfirst(?:\s+\w+)?\s+(time|taste|walk|trip|look|visit|vaccination|jab|bath|groom|meal|outing|swim|ride|go|try|attempt)\b/i;

function detectFirstMentions(markdown, iso, slug) {
  // Closing quotes/brackets may sit between the full stop and the space,
  // e.g. `…as good a spot as any.")` — split after those too.
  const sentences = prosify(markdown).split(/(?<=[.!?]["'’”)\]]*)\s+/);
  const found = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s || /^at first\b/i.test(s)) continue;
    if (/\bfirst\s+(of all|off)\b/i.test(s)) continue;
    if (FIRST_THING.test(s) || /^first\b/i.test(s)) {
      found.push({ date: iso, label: s.length > 160 ? s.slice(0, 157) + '…' : s, auto: true, slug });
    }
  }
  found.sort((a, b) => a.label.length - b.label.length);
  return found.slice(0, 2);
}

// Rule (a): the decaying calendar rule (owner request, Aug 2026) —
// homecoming, then weekly anniversaries up to week 12, then monthly
// (same day-of-month as homecoming) through the first year, then yearly.
// Purely from the calendar — no text-reading, so nothing to misread.
function calendarMilestones(latestIso) {
  const items = [{ date: isoOfUtc(HOME_DATE_UTC), label: 'Came home for the first time', auto: true }];
  if (!latestIso) return items;
  const latest = utcOf(latestIso);
  const home = new Date(HOME_DATE_UTC);
  for (let n = 1; n <= 12; n++) {
    const ms = HOME_DATE_UTC + n * WEEK_MS;
    if (ms > latest) return items;
    items.push({ date: isoOfUtc(ms), label: `${n} week${n > 1 ? 's' : ''} home`, auto: true });
  }
  // Months 3–11: week 12 lands just short of three months, so monthly
  // markers pick up from there and hand over to yearly at one year home.
  for (let m = 3; m <= 11; m++) {
    const ms = Date.UTC(home.getUTCFullYear(), home.getUTCMonth() + m, home.getUTCDate());
    if (ms > latest) return items;
    items.push({ date: isoOfUtc(ms), label: `${m} months home`, auto: true });
  }
  for (let y = 1; ; y++) {
    const ms = Date.UTC(home.getUTCFullYear() + y, home.getUTCMonth(), home.getUTCDate());
    if (ms > latest) return items;
    items.push({ date: isoOfUtc(ms), label: `${y} year${y > 1 ? 's' : ''} home`, auto: true });
  }
}

function isoOfUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function mergeMilestones(...lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const item of list) {
      const key = `${item.date}|${item.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Which badge a milestone gets on the timeline: a calendar/week entry
// (auto, no slug) reads as gold, a "first" mention quoted from a post
// (auto, with slug) gets the collar-pink bow, and anything hand-written
// in milestones.md (not auto) gets a plain moss marker.
function milestoneKind(m) {
  if (m.auto && m.slug) return 'first';
  if (m.auto) return 'week';
  return 'manual';
}

function milestoneMarkIcon(kind) {
  if (kind === 'first') return favBowSvg();
  return `<svg class="milestone-paw" viewBox="-9 -9 18 18" aria-hidden="true">${pawSvg(0, 0, 0)}</svg>`;
}

// Photos for the milestones page. Each date gets a pool: that day's
// journal photos first (already-published, so nothing new leaks), then
// the owner-dropped src/static/photos/milestone-YYYY-MM-DD.jpg if one
// exists. Milestones sharing a date draw from the pool round-robin, so
// four milestones on homecoming day get four different photos instead of
// the same one repeated. Dates with no photos anywhere get no thumb —
// never a substitute from another day.
function milestonePhotoPools(entries) {
  const pools = new Map();
  for (const e of entries) {
    if (!e.images || !e.images.length) continue;
    if (!pools.has(e.date)) pools.set(e.date, []);
    const pool = pools.get(e.date);
    for (const img of e.images) if (!pool.includes(img)) pool.push(img);
  }
  return pools;
}

// One row on the milestones page. Two size tiers (owner request, Aug
// 2026): owner-written lines from milestones.md render large, as
// "landmark" rows; auto-detected firsts and calendar anniversaries stay
// compact single-line texture. Photos are a separate, slightly wider
// question (owner request, 29 Aug 2026): the gold calendar-anniversary
// tier ("major milestones" in the owner's words — 1 week home, 1 month
// home, and so on) also draws from the pool, alongside landmarks; only
// the pink "first" tier stays photo-free, so the page doesn't fill up
// with a thumbnail on every single detected "first".
function milestoneRowHtml(m, pools, drawn) {
  const kind = milestoneKind(m);
  const landmark = kind === 'manual';
  const photoEligible = kind === 'manual' || kind === 'week';
  const label = m.auto && m.slug
    ? `<a href="/journal/${m.slug}/">${escapeHtml(m.label)}</a>`
    : escapeHtml(m.label);
  let thumb = '';
  if (photoEligible) {
    const pool = [...(pools.get(m.date) || [])];
    const staticFile = `photos/milestone-${m.date}.jpg`;
    if (fs.existsSync(path.join(SRC, 'static', staticFile)) && !pool.includes(`/static/${staticFile}`)) {
      pool.push(`/static/${staticFile}`);
    }
    if (pool.length) {
      const n = drawn.get(m.date) || 0;
      drawn.set(m.date, n + 1);
      thumb = `<img class="milestone-photo" src="${pool[n % pool.length]}" alt="" width="72" height="72" loading="lazy">`;
    }
  }
  const star = m.star ? '<span class="milestone-star" aria-hidden="true">★</span> ' : '';
  const cls = `milestone-item milestone-item--${kind} milestone-item--${landmark ? 'landmark' : 'compact'}`;
  return `<li class="${cls}"><span class="milestone-mark">${milestoneMarkIcon(kind)}</span><div class="milestone-body"><span class="milestone-date">${formatDate(m.date)}</span><span class="milestone-label">${star}${label}</span></div>${thumb}</li>`;
}

// Chapters (owner request, Aug 2026): rows group under month headings,
// oldest first within the page — that stays deliberate, it's a life
// record read forward. The newest month is expanded; older months sit
// in closed <details> blocks, so collapsing works with JS off.
function buildMilestonesPage(milestones, manualMarkdown, entries) {
  const pools = milestonePhotoPools(entries);
  const drawn = new Map(); // date -> how many photos already handed out
  const prose = manualMarkdown ? marked.parse(manualMarkdown) : '';
  let body;
  if (!milestones.length) {
    body = '<p>No milestones yet. The first "first time she…" moments will be collected here as they happen. She\'s only just getting started.</p>';
  } else {
    const chapters = new Map();
    for (const m of milestones) {
      const key = m.date.slice(0, 7);
      if (!chapters.has(key)) chapters.set(key, []);
      chapters.get(key).push(m);
    }
    const keys = [...chapters.keys()].sort();
    const newest = keys[keys.length - 1];
    body = '<p class="trail-intro">Her big moments, month by month. Oldest first, the way a life reads.</p>'
      + keys.map((key) => `<details class="milestone-chapter"${key === newest ? ' open' : ''}>
  <summary>${monthLabel(key)}</summary>
  <ul class="milestone-timeline">${chapters.get(key).map((m) => milestoneRowHtml(m, pools, drawn)).join('')}</ul>
</details>`).join('\n');
  }
  const html = renderPage({
    title: 'Milestones',
    content: prose + body,
    activePath: '/milestones.html',
    bodyClass: 'page-quiet',
    canonical: '/milestones.html',
  });
  fs.writeFileSync(path.join(DIST, 'milestones.html'), html);
  console.log(`  page  -> milestones.html (${milestones.length} milestones)`);
}

// --- Journal: posts, the journey trail, the archive, entries.json ---
function buildJournal(manual, lessons) {
  const dir = path.join(SRC, 'journal');
  const entries = [];
  const autoMilestones = [];
  if (fs.existsSync(dir)) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      let mdPath, assetDir, slug;
      if (item.isDirectory()) {
        slug = item.name;
        assetDir = path.join(dir, item.name);
        mdPath = path.join(assetDir, 'index.md');
      } else if (item.name.endsWith('.md') && item.name.toLowerCase() !== 'readme.md') {
        slug = item.name.replace(/\.md$/, '');
        mdPath = path.join(dir, item.name);
      } else {
        continue;
      }
      if (!fs.existsSync(mdPath)) continue;

      const raw = fs.readFileSync(mdPath, 'utf8');
      const { data, content } = matter(raw);
      const title = data.title || slug;
      const isoDate = toIsoDate(data.date || slug);
      // A post a lesson points at (via related:) signposts that lesson.
      const lessonNotes = (lessons || []).filter((l) => l.related.includes(slug) || l.related.includes(isoDate));
      const lessonHtml = lessonNotes
        .map((l) => `<p class="lesson-signpost">💡 A lesson came out of this day: <a href="/lessons.html#lesson-${escapeHtml(l.slug)}">${escapeHtml(l.title)}</a></p>`)
        .join('');
      // Every image in the post, resolved to a site URL. The first one is
      // the patch thumbnail on the trail, the archive stamp and the share
      // card; the full list feeds the milestones page so several milestones
      // on one day each get a different photo. Posts may reference a photo
      // as a sibling file (nap.jpg) or by absolute path (/static/photos/…)
      // — only the former gets the post's directory prefixed, or the
      // absolute one turns into /journal/x//static/… and 404s.
      // Worked out before the render so the thumbnail can be the og:image.
      const images = [];
      for (const m of content.matchAll(/!\[[^\]]*\]\(\s*([^)\s"']+)/g)) {
        const src = m[1];
        if (/^(https?:)?\//.test(src)) images.push(src);
        else if (assetDir) images.push(`/journal/${slug}/${src}`);
      }

      const html = renderPage({
        title,
        date: isoDate,
        content: layOutPhotos(marked.parse(content), assetDir) + lessonHtml,
        activePath: '/', // the journal lives on the home page now
        image: images[0] || undefined,
        canonical: `/journal/${slug}/`,
        type: 'article',
      });
      const outDir = path.join(DIST, 'journal', slug);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);

      if (assetDir) {
        for (const asset of fs.readdirSync(assetDir)) {
          if (asset === 'index.md') continue;
          fs.copyFileSync(path.join(assetDir, asset), path.join(outDir, asset));
        }
      }
      entries.push({ title, date: isoDate, slug, featured: data.featured === true, thumb: images[0] || null, images });
      autoMilestones.push(...detectFirstMentions(content, isoDate, slug));
      console.log(`  post  -> journal/${slug}/`);
    }
  }

  entries.sort((a, b) => (a.date < b.date ? -1 : 1));
  fs.mkdirSync(path.join(DIST, 'journal'), { recursive: true });

  const latestIso = entries.length ? entries[entries.length - 1].date : null;
  const milestones = mergeMilestones(manual.items, autoMilestones, calendarMilestones(latestIso));
  buildMilestonesPage(milestones, manual.markdown, entries);

  // Manifest for the random-day button.
  fs.mkdirSync(path.join(DIST, 'static'), { recursive: true });
  fs.writeFileSync(
    path.join(DIST, 'static', 'entries.json'),
    JSON.stringify(entries.map(({ slug, title, date }) => ({ slug, title, date })))
  );

  buildHome(buildTrail(entries, milestones), entries);
  buildJournalRedirect();
  buildArchive(entries);
  return entries;
}

// A sitemap and a robots.txt, so the record is findable. Nothing here
// measures anything; it's the same kind of metadata as a <title>.
function buildSitemap(entries) {
  const months = [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort().reverse();
  const latest = entries.length ? entries[entries.length - 1].date : todayIso();
  const urls = [
    { loc: '/', lastmod: latest },
    { loc: '/milestones.html', lastmod: latest },
    { loc: '/lessons.html', lastmod: latest },
    { loc: '/journal/archive/', lastmod: latest },
    ...fs.readdirSync(path.join(SRC, 'pages'))
      .filter((f) => f.endsWith('.md') && f !== 'home.md')
      .map((f) => ({ loc: `/${f.replace(/\.md$/, '.html')}`, lastmod: latest })),
    ...months.slice(1).map((key) => ({ loc: `/journal/archive/${key}/`, lastmod: latest })),
    ...entries.map((e) => ({ loc: `/journal/${e.slug}/`, lastmod: e.date })),
  ];

  const body = urls
    .map(({ loc, lastmod }) =>
      `  <url><loc>${escapeHtml(SITE_URL + loc)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);

  // Everything is welcome, including the AI crawlers, and they're named
  // explicitly rather than left to the wildcard so the intent is on the
  // record. Two families: training crawlers (GPTBot, ClaudeBot,
  // Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent) and
  // retrieval crawlers that fetch a page when someone actually asks a
  // question (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User,
  // PerplexityBot). A site that exists to be read has no reason to block
  // either. Flip a group to Disallow here if that ever changes.
  const crawlers = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai',
    'Google-Extended', 'PerplexityBot', 'Perplexity-User',
    'Applebot-Extended', 'Amazonbot', 'Meta-ExternalAgent', 'CCBot',
  ];
  fs.writeFileSync(path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\n`
    + crawlers.map((ua) => `User-agent: ${ua}\nAllow: /\n`).join('\n')
    + `\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  buildLlmsTxt(entries);
  console.log(`  seo   -> sitemap.xml (${urls.length} urls) + robots.txt + llms.txt`);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// llms.txt: a plain-text map of the site for a model or an agent reading it.
//
// Be realistic about what this is worth. No major AI company has committed to
// reading llms.txt, Google has said outright that it won't, and monitoring of
// AI crawler traffic finds it fetched almost never. It is not a ranking lever
// and nobody should expect it to be one. It is cheap, it is a genuine
// convenience for agent tooling that does look for it, and on this site of
// all sites it is thematically the right thing to have. That is the whole
// case for it.
function buildLlmsTxt(entries) {
  const recent = [...entries].reverse().slice(0, 15);
  const pages = fs.readdirSync(path.join(SRC, 'pages'))
    .filter((f) => f.endsWith('.md') && f !== 'home.md')
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(SRC, 'pages', f), 'utf8'));
      return `- [${data.title || f}](${SITE_URL}/${f.replace(/\.md$/, '.html')})`
        + (data.description ? `: ${data.description}` : '');
    });

  fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

A day-by-day record of raising one specific dog, written by her owner as it
happens. Annie is a Golden Retriever crossed with a Border Collie, a cross
also called a Coltriever, a Gollie or a Golden Border Retriever. She was born
26 June 2026 and came home on 21 August 2026.

Everything here is first-hand and dated. The setbacks are included, which is
the point of it: it is a record rather than a highlight reel. Nothing on this
site is generalised advice, and none of it should be read as a substitute for
a vet or a qualified trainer.

## Pages

${pages.join('\n')}

## Recent journal entries

${recent.map((e) => `- [${e.title}](${SITE_URL}/journal/${e.slug}/): ${e.date}`).join('\n')}

## Everything else

- [The complete archive, by month](${SITE_URL}/journal/archive/)
- [Milestones](${SITE_URL}/milestones.html)
- [Lessons](${SITE_URL}/lessons.html)
- [Sitemap](${SITE_URL}/sitemap.xml)
`);
}

// /journal/ used to be the trail's address; the trail moved to the front
// page, so this leaves a redirect behind for old links and bookmarks.
// Posts (/journal/<slug>/) and the archive keep their real URLs.
function buildJournalRedirect() {
  fs.mkdirSync(path.join(DIST, 'journal'), { recursive: true });
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/">
  <link rel="canonical" href="/">
  <title>${escapeHtml(SITE_NAME)}</title>
</head>
<body><p>The journal lives on the <a href="/">front page</a> now.</p></body>
</html>
`;
  fs.writeFileSync(path.join(DIST, 'journal', 'index.html'), html);
  console.log('  page  -> journal/ (redirect to /)');
}

// Builds the trail markup and returns it (buildHome puts it on the page).
// A postcard at the foot of the trail, between the favourites shelf and
// the sign-off: one card, one line, one button. Deliberately quiet — no
// interstitial, no pop-up, no second ask anywhere else on the site.
function newsletterCardHtml() {
  if (!NEWSLETTER.embed && !NEWSLETTER.href) return '';
  const action = NEWSLETTER.embed
    ? `<div class="postcard-embed">
        <iframe src="${escapeHtml(NEWSLETTER.embed)}" title="Sign up for ${escapeHtml(NEWSLETTER.name)}" scrolling="no"></iframe>
      </div>`
    // New tab: the ask comes at the foot of the trail, and someone who
    // says yes should come back to where they were reading, not to a
    // form with the whole site behind it.
    : `<a class="postcard-go" href="${escapeHtml(NEWSLETTER.href)}" target="_blank" rel="noopener">Send me Annie's letters</a>`;
  return `<aside class="postcard">
    <div class="postcard-stamp" aria-hidden="true">
      <span class="postcard-perf"></span>
      ${pupSittingSvg('postcard-pup')}
    </div>
    <div class="postcard-body">
      <h2>${escapeHtml(NEWSLETTER.name)}</h2>
      <p class="postcard-note">Every other Sunday, in her own words: what she did, and what she did not like. She stops when she gets bored, so it is short.</p>
      ${action}
      <p class="postcard-small">One email a fortnight, and you can leave whenever you like. Woof.</p>
    </div>
  </aside>`;
}

function buildTrail(entries, milestones) {
  let content;
  if (!entries.length) {
    content = `<div class="trail">
  <div class="week-stop side-left seen">
    <div class="waypoint">
      <span class="waypoint-badge">1</span>
      <div><h2 class="waypoint-title">Week 1<span class="waypoint-dates">${weekRangeLabel(1)}</span></h2></div>
    </div>
    <p class="quiet-week">Nothing posted yet, check back soon. Annie is six days into a very long story.</p>
  </div>
</div>`;
  } else {
    const lastWeek = weekIndex(entries[entries.length - 1].date);
    const firstWeek = Math.max(1, lastWeek - TRAIL_WEEKS + 1);
    const byWeek = new Map();
    for (const e of entries) {
      const w = weekIndex(e.date);
      if (!byWeek.has(w)) byWeek.set(w, []);
      byWeek.get(w).push(e);
    }
    const inWeek = (w, iso) => weekIndex(iso) === w;

    // Newest first (owner's call, Aug 2026): you land on today and
    // scrolling down walks you BACK through her puppyhood, so the
    // "Wander further back" link at the bottom continues the same
    // direction of travel instead of reversing it.
    const sections = [];
    for (let w = lastWeek, i = 0; w >= firstWeek; w--, i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      const weekEntries = (byWeek.get(w) || []).slice().reverse();
      // The trail is a highlight reel, not the full record — every
      // detected milestone still shows on /milestones.html; here, cap
      // per week and favour the shortest (usually punchiest) labels so
      // one wordy week can't stack up a wall of signposts.
      const weekMilestones = milestones
        .filter((m) => inWeek(w, m.date))
        .sort((a, b) => a.label.length - b.label.length)
        .slice(0, 2);
      const signposts = weekMilestones.map((m) => `<span class="signpost">🪧 ${escapeHtml(m.label)}</span>`).join(' ');
      // Beat 3: the newest week answers "where are we?" at a glance.
      const pin = i === 0 ? ' <span class="you-are-here">📍 You\'re all caught up</span>' : '';
      const body = weekEntries.length
        ? `<div class="week-entries">${weekEntries.map((e) => patchHtml(e, { fav: e.featured })).join('')}</div>`
        : '<p class="quiet-week">A quiet week on the trail. No posts.</p>';
      const connector = i === 0 ? '' : connectorSvg(side);
      sections.push(`${connector}<section class="week-stop side-${side}">
    <div class="waypoint">
      <span class="waypoint-badge">${w}</span>
      <div><h2 class="waypoint-title">Week ${w}<span class="waypoint-dates">${weekRangeLabel(w)}</span></h2>${signposts}${pin}</div>
    </div>
    ${body}
  </section>`);
    }

    const featured = entries.filter((e) => e.featured).reverse();
    const shelf = featured.length
      ? `<div class="fav-shelf">
    <h2>${favBowSvg()} Favourite spots</h2>
    <p class="fav-note">Hand-picked by Annie's owner.</p>
    <ul class="patch-grid">${featured.map((e) => `<li>${patchHtml(e, { fav: true })}</li>`).join('')}</ul>
  </div>`
      : '';

    content = `<div class="trail">
  <p class="trail-intro">The journey so far, newest first. Keep scrolling to wander back to day one.</p>
  ${sections.join('\n  ')}
  <a class="archive-link" href="/journal/archive/">Wander further back →</a>
  ${shelf}
  ${newsletterCardHtml()}
  <div class="random-day" data-random hidden>
    <p class="random-day-hint">Feeling lucky? Pick a month to draw from, or leave it on any.</p>
    <select aria-label="Filter by month" data-random-month><option value="">Any month</option></select>
    <button type="button" data-random-go>Click here to see a random day from Annie's journey 🎲</button>
  </div>
  <div class="trail-end">
    <div class="trail-end-pup">${pupSittingSvg('')}<span class="pup-zzz" aria-hidden="true">z z</span></div>
    <p class="trail-end-brand">Annie &amp; Claude</p>
    <p class="trail-end-links"><a href="/about-annie.html">Meet Annie →</a> · <a href="/about-this-project.html">How this site is made →</a></p>
  </div>
</div>`;
  }

  console.log(`  trail -> / (${entries.length} entries)`);
  return content;
}

// The complete record, month by month: /journal/archive/ is the most
// recent month, older months at /journal/archive/YYYY-MM/.
function buildArchive(entries) {
  if (!entries.length) return;
  const months = new Map();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(e);
  }
  const monthKeys = [...months.keys()].sort().reverse();
  const monthHref = (key) => (key === monthKeys[0] ? '/journal/archive/' : `/journal/archive/${key}/`);

  for (const key of monthKeys) {
    const tabs = monthKeys
      .map((k) => `<a class="month-tab${k === key ? ' active' : ''}" href="${monthHref(k)}">${monthLabel(k)}</a>`)
      .join('\n    ');
    const stamps = months.get(key).map((e) => `<li>${patchHtml(e, { fav: e.featured })}</li>`).join('\n      ');
    const content = `<p><a href="/">← Back to the trail</a></p>
  <nav class="month-tabs" aria-label="Archive months">
    ${tabs}
  </nav>
  <div class="album-page">
    <ul class="patch-grid">
      ${stamps}
    </ul>
  </div>`;
    const html = renderPage({
      title: 'Archive',
      content,
      activePath: '/',
      bodyClass: 'page-album',
      description: `Every day of Annie's journal, month by month. ${monthLabel(key)} and the rest of the record.`,
      canonical: key === monthKeys[0] ? '/journal/archive/' : `/journal/archive/${key}/`,
    });
    const outPath = key === monthKeys[0]
      ? path.join(DIST, 'journal', 'archive', 'index.html')
      : path.join(DIST, 'journal', 'archive', key, 'index.html');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`  album -> journal/archive/${key === monthKeys[0] ? '' : key + '/'} (${months.get(key).length} stamps)`);
  }
}

function copyStatic() {
  const staticDir = path.join(SRC, 'static');
  for (const file of walk(staticDir)) {
    const rel = path.relative(staticDir, file);
    const out = path.join(DIST, 'static', rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(file, out);
  }
}

console.log('Building annie-and-claude...');
clean(DIST);
const manualMilestones = readMilestones();
const lessons = readLessons();
buildPages();
const entries = buildJournal(manualMilestones, lessons); // also builds milestones.html (needs entries first)
buildLessonsPage(lessons);
buildSitemap(entries);
copyStatic();
console.log('Done -> /dist');
