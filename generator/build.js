// Reads every src/**/*.md file, renders it into template.html, writes the
// result to /dist. Deliberately plain: Node's standard library plus one
// small Markdown-parsing dependency (marked). No other build tooling.

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");
const TEMPLATE_PATH = path.join(__dirname, "template.html");

// --- helpers ---------------------------------------------------------

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

// Minimal frontmatter parser: a leading `---` block of flat `key: value`
// lines, then the Markdown body. No YAML dependency needed for this.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: match[2] };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Where a given src/**/*.md file lands under dist/.
function outputPathFor(srcFile) {
  const rel = path.relative(SRC_DIR, srcFile);
  const parts = rel.split(path.sep);

  if (parts[0] === "pages" && parts[1] === "home.md") {
    return path.join(DIST_DIR, "index.html");
  }
  if (parts[0] === "pages") {
    const name = parts[parts.length - 1].replace(/\.md$/, "");
    return path.join(DIST_DIR, `${name}.html`);
  }
  if (parts[0] === "journal") {
    const name = parts[parts.length - 1].replace(/\.md$/, "");
    return path.join(DIST_DIR, "journal", `${name}.html`);
  }
  // Anything else at the top level of src/ (e.g. milestones.md).
  const name = parts[parts.length - 1].replace(/\.md$/, "");
  return path.join(DIST_DIR, `${name}.html`);
}

// --- build -------------------------------------------------------------

function build() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const files = fs.existsSync(SRC_DIR) ? walk(SRC_DIR) : [];

  if (files.length === 0) {
    console.warn("No src/**/*.md files found — nothing to build.");
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = parseFrontmatter(raw);

    const title = data.title || path.basename(file, ".md");
    const dateBlock = data.date
      ? `<time datetime="${data.date}">${formatDate(data.date)}</time>`
      : "";

    const html = template
      .split("{{title}}")
      .join(title)
      .split("{{dateBlock}}")
      .join(dateBlock)
      .split("{{content}}")
      .join(marked.parse(content));

    const outPath = outputPathFor(file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`built ${path.relative(ROOT, outPath)}`);
  }
}

build();
