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

const NAV = [
  ['Home', '/'],
  ['Journal', '/journal/'],
  ['Milestones', '/milestones.html'],
  ['About Annie', '/about-annie.html'],
  ['About This Project', '/about-this-project.html'],
];

const SITE_NAME = 'Annie & Claude';

function renderNav(activePath) {
  return NAV.map(([label, href]) => {
    const active = href === activePath ? ' class="active"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }).join('\n      ');
}

function renderPage({ title, date, content, activePath, bodyClass = 'page-quiet' }) {
  const h1 = title || SITE_NAME;
  const pageTitle = h1 === SITE_NAME ? SITE_NAME : `${h1} · ${SITE_NAME}`;
  return TEMPLATE
    .replaceAll('{{pageTitle}}', escapeHtml(pageTitle))
    .replaceAll('{{bodyClass}}', bodyClass)
    .replaceAll('{{title}}', escapeHtml(h1))
    .replaceAll('{{date}}', date ? formatDate(date) : '')
    .replaceAll('{{nav}}', renderNav(activePath))
    .replace('{{content}}', content);
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

// A circular date stamp, like a postmark on an envelope.
function postmarkSvg(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  const bad = Number.isNaN(date.getTime());
  const day = bad ? '' : date.getUTCDate();
  const mon = bad ? '' : date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `<svg class="postmark" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="20"/><circle cx="30" cy="30" r="14"/><text x="30" y="27" font-size="8" text-anchor="middle">${day} ${mon}</text><text x="30" y="37" font-size="6" text-anchor="middle">MALVERN</text><line x1="4" y1="14" x2="12" y2="10"/><line x1="4" y1="46" x2="12" y2="50"/><line x1="56" y1="14" x2="48" y2="10"/><line x1="56" y1="46" x2="48" y2="50"/></svg>`;
}

function favBowSvg() {
  return `<svg class="fav-bow" viewBox="0 0 44 30" aria-hidden="true"><path d="M22 12 C 7 -2 0 15 19 18 C 13 9 18 7 22 12 Z"/><path d="M22 12 C 37 -2 44 15 25 18 C 31 9 26 7 22 12 Z"/><circle cx="22" cy="14" r="4"/></svg>`;
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

function stampHtml(e, { fav = false } = {}) {
  const mark = fav ? favBowSvg() : '';
  return `<a class="stamp" href="/journal/${e.slug}/">${postmarkSvg(e.date)}${mark}<span class="stamp-title">${escapeHtml(e.title)}</span></a>`;
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

// --- Standalone pages: src/pages/*.md -> /*.html (home.md -> index.html) ---
function buildPages() {
  const dir = path.join(SRC, 'pages');
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    const outName = file === 'home.md' ? 'index.html' : file.replace(/\.md$/, '.html');
    const activePath = outName === 'index.html' ? '/' : `/${outName}`;
    const html = renderPage({
      title: data.title,
      content: marked.parse(content),
      activePath,
      bodyClass: outName === 'index.html' ? 'page-home' : 'page-quiet',
    });
    fs.writeFileSync(path.join(DIST, outName), html);
    console.log(`  page  -> ${outName}`);
  }
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

function readMilestones() {
  const file = path.join(SRC, 'milestones.md');
  if (!fs.existsSync(file)) return { items: [], markdown: '' };
  const { content } = matter(fs.readFileSync(file, 'utf8'));
  const items = [];
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^-\s*(\d{4}-\d{2}-\d{2})\s*[—–-]+\s*(.+)$/);
    if (m) items.push({ date: m[1], label: m[2].trim(), auto: false });
  }
  return { items, markdown: content };
}

// Rule (b): pull out any sentence containing "first" from a post's own
// markdown, skipping the "at first..." transition phrase. Returns the
// sentence itself — a quote of already-approved text, not a summary.
function detectFirstMentions(markdown, iso, slug) {
  const flat = markdown.replace(/\r/g, '').replace(/\n+/g, ' ');
  const sentences = flat.split(/(?<=[.!?])\s+/);
  const found = [];
  for (const raw of sentences) {
    const s = raw.replace(/[*_`]/g, '').trim();
    if (!s || /^at first\b/i.test(s)) continue;
    if (/\bfirst\b/i.test(s) && !/\bfirst\s+(of all|off)\b/i.test(s)) {
      found.push({ date: iso, label: s.length > 160 ? s.slice(0, 157) + '…' : s, auto: true, slug });
    }
  }
  return found;
}

// Rule (a): homecoming plus every completed week since, purely from the
// calendar — no text-reading, so nothing to misread.
function weekAnniversaryMilestones(latestIso) {
  const items = [{ date: isoOfUtc(HOME_DATE_UTC), label: 'Came home for the first time', auto: true }];
  if (!latestIso) return items;
  const weeksElapsed = Math.floor((utcOf(latestIso) - HOME_DATE_UTC) / WEEK_MS);
  for (let n = 1; n <= weeksElapsed; n++) {
    items.push({ date: isoOfUtc(HOME_DATE_UTC + n * WEEK_MS), label: `${n} week${n > 1 ? 's' : ''} home`, auto: true });
  }
  return items;
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

function buildMilestonesPage(milestones, manualMarkdown) {
  const prose = manualMarkdown ? marked.parse(manualMarkdown) : '';
  const list = milestones.length
    ? `<ul class="milestone-list">${milestones
        .map((m) => {
          const label = m.auto && m.slug
            ? `<a href="/journal/${m.slug}/">${escapeHtml(m.label)}</a>`
            : escapeHtml(m.label);
          return `<li><span class="milestone-date">${formatDate(m.date)}</span>${label}</li>`;
        })
        .join('')}</ul>`
    : '<p>No milestones yet — the first "first time she…" moments will be collected here as they happen. She\'s only just getting started.</p>';
  const html = renderPage({
    title: 'Milestones',
    content: prose + list,
    activePath: '/milestones.html',
    bodyClass: 'page-quiet',
  });
  fs.writeFileSync(path.join(DIST, 'milestones.html'), html);
  console.log(`  page  -> milestones.html (${milestones.length} milestones)`);
}

// --- Journal: posts, the journey trail, the archive, entries.json ---
function buildJournal(manual) {
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
      const html = renderPage({
        title,
        date: isoDate,
        content: marked.parse(content),
        activePath: '/journal/',
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
      entries.push({ title, date: isoDate, slug, featured: data.featured === true });
      autoMilestones.push(...detectFirstMentions(content, isoDate, slug));
      console.log(`  post  -> journal/${slug}/`);
    }
  }

  entries.sort((a, b) => (a.date < b.date ? -1 : 1));
  fs.mkdirSync(path.join(DIST, 'journal'), { recursive: true });

  const latestIso = entries.length ? entries[entries.length - 1].date : null;
  const milestones = mergeMilestones(manual.items, autoMilestones, weekAnniversaryMilestones(latestIso));
  buildMilestonesPage(milestones, manual.markdown);

  // Manifest for the random-day button.
  fs.mkdirSync(path.join(DIST, 'static'), { recursive: true });
  fs.writeFileSync(
    path.join(DIST, 'static', 'entries.json'),
    JSON.stringify(entries.map(({ slug, title, date }) => ({ slug, title, date })))
  );

  buildTrail(entries, milestones);
  buildArchive(entries);
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
    <p class="quiet-week">Nothing posted yet — check back soon. Annie is six days into a very long story.</p>
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

    const sections = [];
    for (let w = firstWeek, i = 0; w <= lastWeek; w++, i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      const weekEntries = byWeek.get(w) || [];
      // The trail is a highlight reel, not the full record — every
      // detected milestone still shows on /milestones.html; here, cap
      // per week and favour the shortest (usually punchiest) labels so
      // one wordy week can't stack up a wall of signposts.
      const weekMilestones = milestones
        .filter((m) => inWeek(w, m.date))
        .sort((a, b) => a.label.length - b.label.length)
        .slice(0, 2);
      const signposts = weekMilestones.map((m) => `<span class="signpost">🪧 ${escapeHtml(m.label)}</span>`).join(' ');
      const body = weekEntries.length
        ? `<div class="week-entries">${weekEntries.map((e) => stampHtml(e, { fav: e.featured })).join('')}</div>`
        : '<p class="quiet-week">A quiet week on the trail — no posts.</p>';
      const connector = i === 0 ? '' : connectorSvg(side);
      sections.push(`${connector}<section class="week-stop side-${side}">
    <div class="waypoint">
      <span class="waypoint-badge">${w}</span>
      <div><h2 class="waypoint-title">Week ${w}<span class="waypoint-dates">${weekRangeLabel(w)}</span></h2>${signposts}</div>
    </div>
    ${body}
  </section>`);
    }

    const featured = entries.filter((e) => e.featured).reverse();
    const shelf = featured.length
      ? `<div class="fav-shelf">
    <h2>${favBowSvg()} Favourite spots</h2>
    <p class="fav-note">Hand-picked by Annie's owner.</p>
    <ul class="stamp-grid">${featured.map((e) => `<li>${stampHtml(e, { fav: true })}</li>`).join('')}</ul>
  </div>`
      : '';

    content = `<div class="trail">
  <p class="trail-intro">The last few weeks of the journey, oldest first. Older weeks live in the archive.</p>
  <div class="random-day" data-random hidden>
    <select aria-label="Filter by month" data-random-month><option value="">Any month</option></select>
    <button type="button" data-random-go>Take me to a random day 🎲</button>
  </div>
  ${sections.join('\n  ')}
  <a class="archive-link" href="/journal/archive/">Wander further back →</a>
  ${shelf}
</div>`;
  }

  const html = renderPage({
    title: 'The Journey',
    content,
    activePath: '/journal/',
    bodyClass: 'page-journey',
  });
  fs.writeFileSync(path.join(DIST, 'journal', 'index.html'), html);
  console.log(`  trail -> journal/ (${entries.length} entries)`);
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
    const stamps = months.get(key).map((e) => `<li>${stampHtml(e, { fav: e.featured })}</li>`).join('\n      ');
    const content = `<p><a href="/journal/">← Back to the trail</a></p>
  <nav class="month-tabs" aria-label="Archive months">
    ${tabs}
  </nav>
  <div class="album-page">
    <ul class="stamp-grid">
      ${stamps}
    </ul>
  </div>`;
    const html = renderPage({
      title: 'Archive',
      content,
      activePath: '/journal/',
      bodyClass: 'page-album',
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
buildPages();
buildJournal(manualMilestones); // also builds milestones.html (needs entries first)
copyStatic();
console.log('Done -> /dist');
