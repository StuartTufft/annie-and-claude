// Renders email-safe "post card" HTML for the newsletter.
//
//   node newsletter/cards.js 2026-08-30 2026-09-07
//
// Prints one self-contained table per slug to stdout. Paste the whole
// output into a Beehiiv custom HTML block.
//
// Email is not the web: no <style> blocks (Gmail strips them), no
// flexbox or grid, no CSS classes, tables for layout, and every URL
// absolute. That is why this is generated rather than hand-written.
//
// The post's first image is its card photo, which is the same rule the
// site uses for the trail patch and the archive stamp, so the card and
// the site agree without a second decision being made anywhere.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SITE_URL = 'https://annie-and-claude.com';
const SRC_JOURNAL = path.join(__dirname, '..', 'src', 'journal');

// The Hedgerow palette, inlined. Kept in step with src/static/style.css
// by hand: there is no way to share a token with an email client.
const C = {
  card: '#fbfaf1',
  ink: '#3d4032',
  muted: '#767a68',
  line: '#e3e2d2',
  moss: '#4c7a50',
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// gray-matter hands YAML dates over as Date objects, so a frontmatter
// date needs normalising before it can be sliced or formatted. Same
// trick as toIsoDate() in generator/build.js.
function toIsoDate(raw) {
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Where a post lives: a folder with photos, or a loose text-only file.
function resolvePost(slug) {
  const dirPath = path.join(SRC_JOURNAL, slug, 'index.md');
  if (fs.existsSync(dirPath)) return { mdPath: dirPath, hasAssets: true };
  const filePath = path.join(SRC_JOURNAL, `${slug}.md`);
  if (fs.existsSync(filePath)) return { mdPath: filePath, hasAssets: false };
  return null;
}

// Same regex as build.js: a sibling filename gets the post's directory
// prefixed, an absolute path is already a site URL and is left alone.
function firstImage(content, slug, hasAssets) {
  for (const m of content.matchAll(/!\[[^\]]*\]\(\s*([^)\s"']+)/g)) {
    const src = m[1];
    if (/^https?:/.test(src)) return src;
    if (src.startsWith('/')) return SITE_URL + src;
    if (hasAssets) return `${SITE_URL}/journal/${slug}/${src}`;
  }
  return null;
}

// The opening line, as plain text. Skips headings, images, embeds and
// blockquotes to find the first real sentence of prose.
function openingLine(content, limit = 150) {
  const blocks = content.split(/\n\s*\n/);
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    if (block.startsWith('#') || block.startsWith('>') || block.startsWith('<')) continue;
    if (/^!\[/.test(block) || /^[-*]\s/.test(block)) continue;
    const text = block
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    if (text.length <= limit) return text;
    const cut = text.slice(0, limit);
    return `${cut.slice(0, cut.lastIndexOf(' '))}...`;
  }
  return null;
}

function card({ slug, title, date, image, snippet }) {
  const url = `${SITE_URL}/journal/${slug}/`;
  const photo = image
    ? `      <tr>
        <td style="padding:0;">
          <a href="${escapeHtml(url)}" style="display:block;"><img src="${escapeHtml(image)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:12px 12px 0 0;" /></a>
        </td>
      </tr>
`
    : '';
  const line = snippet
    ? `          <p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:${C.ink};">${escapeHtml(snippet)}</p>\n`
    : '';

  return `<!-- card: ${escapeHtml(slug)} -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto 24px;border-collapse:separate;background:${C.card};border:1px solid ${C.line};border-radius:12px;">
  <tr>
    <td style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
${photo}      <tr>
        <td style="padding:18px 22px 22px;font-family:'Nunito',Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${C.muted};">${escapeHtml(formatDate(date))}</p>
          <h2 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.25;color:${C.ink};font-weight:700;">${escapeHtml(title)}</h2>
${line}          <a href="${escapeHtml(url)}" style="display:inline-block;font-size:15px;font-weight:700;color:${C.moss};text-decoration:none;">Read the day &rarr;</a>
        </td>
      </tr>
      </table>
    </td>
  </tr>
</table>`;
}

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('Usage: node newsletter/cards.js <slug> [<slug> ...]');
  console.error('Slugs are journal folder or file names, e.g. 2026-08-30');
  process.exit(1);
}

const out = [];
let missing = 0;
for (const slug of slugs) {
  const found = resolvePost(slug);
  if (!found) {
    console.error(`  ! no journal entry for "${slug}" — skipped`);
    missing++;
    continue;
  }
  const { data, content } = matter(fs.readFileSync(found.mdPath, 'utf8'));
  const image = firstImage(content, slug, found.hasAssets);
  if (!image) console.error(`  · "${slug}" has no photo, rendering a text-only card`);
  out.push(card({
    slug,
    title: data.title || slug,
    date: toIsoDate(data.date || slug),
    image,
    snippet: openingLine(content),
  }));
}

if (out.length) console.log(out.join('\n\n'));
process.exit(missing && !out.length ? 1 : 0);
