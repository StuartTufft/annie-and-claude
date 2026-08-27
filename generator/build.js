// Reads src/pages/*.md and src/journal/**/*.md, wraps each in
// generator/template.html, writes the result to /dist. Copies src/static/
// verbatim, and copies any images sitting next to a journal entry.
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

const NAV = [
  ['Home', '/'],
  ['Journal', '/journal/'],
  ['About Annie', '/about-annie.html'],
  ['About This Project', '/about-this-project.html'],
];

function renderNav(activePath) {
  return NAV.map(([label, href]) => {
    const active = href === activePath ? ' class="active"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }).join('\n      ');
}

const SITE_NAME = 'Annie & Claude';

function renderPage({ title, date, content, activePath }) {
  const h1 = title || SITE_NAME;
  const pageTitle = h1 === SITE_NAME ? SITE_NAME : `${h1} · ${SITE_NAME}`;
  return TEMPLATE
    .replaceAll('{{pageTitle}}', escapeHtml(pageTitle))
    .replaceAll('{{title}}', escapeHtml(h1))
    .replaceAll('{{date}}', date ? formatDate(date) : '')
    .replaceAll('{{nav}}', renderNav(activePath))
    .replace('{{content}}', content);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatDate(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
    });
    fs.writeFileSync(path.join(DIST, outName), html);
    console.log(`  page  -> ${outName}`);
  }
}

// --- Journal: src/journal/YYYY-MM-DD.md, or src/journal/YYYY-MM-DD/index.md
//     with images sitting alongside -> /journal/YYYY-MM-DD/index.html ---
function buildJournal() {
  const dir = path.join(SRC, 'journal');
  const entries = [];
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
      const html = renderPage({
        title,
        date: data.date || slug,
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
      entries.push({ title, date: data.date || slug, slug });
      console.log(`  post  -> journal/${slug}/`);
    }
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  const listHtml = entries.length
    ? `<ul class="journal-list">${entries
        .map((e) => `<li><a href="/journal/${e.slug}/"><span class="jd">${formatDate(e.date)}</span> ${escapeHtml(e.title)}</a></li>`)
        .join('')}</ul>`
    : '<p>Nothing posted yet — check back soon. Annie is six days into a very long story.</p>';

  const html = renderPage({ title: 'Journal', content: listHtml, activePath: '/journal/' });
  fs.mkdirSync(path.join(DIST, 'journal'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'journal', 'index.html'), html);
  console.log('  index -> journal/');
}

function copyStatic() {
  const staticDir = path.join(SRC, 'static');
  for (const file of walk(staticDir)) {
    const rel = path.relative(staticDir, file);
    const out = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(file, out);
  }
}

console.log('Building annie-and-claude...');
clean(DIST);
buildPages();
buildJournal();
copyStatic();
console.log('Done -> /dist');
