# CLAUDE.md

Public site for Annie's journey — puppy to adult, in her owner's voice. This
is the **public** half of a two-repo setup: the private day-to-day training
log lives elsewhere and never gets cloned or referenced from here. Nothing
in this repo should assume access to it.

There is no training advice work done in this repo. This repo is the site:
content, the generator, and deploy. If a request is actually about how to
train Annie, say so and point back to the private repo.

For the full build plan — architecture, decisions log, the sprint-by-sprint
roadmap, the AI ideas backlog — see `PLANNING.md`. It's not `@`-imported
here on purpose, to keep this file cheap to read every session; open it
directly when starting a new sprint or when a "why" question comes up that
this file doesn't answer.

## Hard rules — never do these

- **Video and social embeds are fully supported — use them freely.**
  This isn't a blocker, just a mechanism: embed, don't commit the raw
  file. Video lives on Google Drive (owner decision, Aug 2026, reversing
  the earlier YouTube-only rule — sharing is configured for durable
  "anyone with the link" access) and gets embedded via Drive's `/preview`
  iframe (see `src/journal/README.md` for the pattern). A Drive file must
  be shared "Anyone with the link" (Viewer) for the embed to actually
  render for site visitors. Instagram posts/reels embed the same way, via
  Instagram's own oEmbed markup (a `<blockquote>` plus their `embed.js`),
  **wrapped in `<div class="ig-embed">...</div>`** and dropped straight
  into the post's Markdown — the wrapper matters: `style.css`'s generic
  `article iframe` rule forces a 16:9 video ratio, which crops a reel's
  vertical frame if the embed isn't inside `.ig-embed` (see `style.css`
  for the reset). This is an owner decision, Aug 2026, made deliberately
  for reach even though it brings Instagram's own script and tracking
  along with it, which is otherwise against the spirit of the analytics
  rule below.
  Never commit an actual video file to the repo either way.
- **Never commit an unoptimised photo.** Resize to roughly 1600–2000px on
  the long edge and strip EXIF/GPS metadata before it's committed. If a
  photo arrives raw, optimise it first; don't commit it as-is "for now."
- **Never invent journal content.** Every post's substance — what happened,
  what was said, how it went — comes from the owner. Draft the prose, never
  the events. If a detail is missing, leave it out or ask; don't fill the
  gap with something plausible. This applies to placeholder/demo content
  too: don't fabricate a fake journal entry to "show what it'd look like" —
  build and test with throwaway fixtures, then remove them before committing.
- **Never let identifying detail through**: exact address or postcode, the
  vet's name or location, or anything that maps out when the house is
  reliably empty. If a draft post contains any of this, flag it and hold
  the post rather than publish around it.
- **No framework.** The site is a small, hand-rolled Markdown → HTML
  generator in `generator/build.js` (Node, `marked` + `gray-matter`, no
  other dependencies). Keep it short enough to read end to end. Don't reach
  for Astro, Next, Hugo, Jekyll, or similar without being explicitly asked
  to make that switch — it's a deliberate decision, not a default.
- **No analytics, view counters, or growth tooling** unless explicitly
  asked. This is a personal project first. Don't add anything that turns
  "did anyone see this" into a thing to check.

## How the site actually works

```
src/
  pages/*.md            standalone pages -> /<name>.html. home.md is the short
                        intro on / (the cover above the trail). A page with
                        hero:/heroAlt: frontmatter opens with the scalloped
                        photo medallion (About Annie uses this).
  journal/
    YYYY-MM-DD.md          text-only entry
    YYYY-MM-DD/index.md    entry with photos — images sit in the same folder
  lessons/<slug>.md        tiny owner-dictated "what I learned" notes ->
                           bars on /lessons.html; a lesson's related: list
                           makes those journal posts signpost back to it
                           (see src/lessons/README.md)
  milestones.md            dated list ("- YYYY-MM-DD - label"); renders
                           /milestones.html AND becomes signposts on the trail
  static/                 copied into dist/static/ (style.css, journey.js, favicon.svg)
generator/
  build.js                the whole generator — reads src/, writes dist/.
                          THE HOME PAGE IS THE JOURNAL (owner decision, Aug
                          2026): / is the cover (medallion + a few lines from
                          home.md) with the "journey trail" straight under it —
                          the last 4 weeks of entries as waypoints on a winding
                          path (weeks count from homecoming, 2026-08-21), plus
                          the "favourite spots" shelf of posts flagged
                          featured: true. /journal/ is just a redirect to /;
                          posts keep their /journal/<slug>/ URLs and the
                          complete record is the monthly archive at
                          /journal/archive/. Also emits /static/entries.json,
                          the manifest behind the random-day button.
  template.html           the one shared page template ({{title}}, {{pageTitle}}, {{date}}, {{nav}}, {{content}}, {{bodyClass}})
.github/workflows/deploy.yml   builds and deploys dist/ to GitHub Pages on every push to main
```

### Where photos come from (owner decision, Aug 2026)

New photos land in a Google Drive folder synced locally via Google Drive
for Desktop — a real folder on disk, not something reachable through an
MCP tool (checked directly: no callable Drive tool exists in this
environment, whatever `claude mcp list` reports as "connected" at the
account level). On the owner's machine that's
`F:\My Drive\PUBLIC FACING FILES\ANNIE\PHOTOS`, but the drive letter is
just whatever Google Drive for Desktop mounted this session, and may not
be F: on a different machine or after a reboot — if that exact path is
missing, search for a `My Drive` folder and the same subpath under it
before asking the owner.

Workflow, every time a journal entry needs photos:
1. List that top-level PHOTOS folder (not `z_Archive` inside it, that's
   already-used source files from past entries).
2. Match files to the entry by the date encoded in the filename:
   `PXL_YYYYMMDD_HHMMSS....jpg` (Pixel) or `IMG-YYYYMMDD-WA####.jpg`
   (WhatsApp shares). A `.MP.jpg` file is a Google Pixel Motion Photo —
   a still frame with a video track embedded in the same file. Use the
   still as a normal photo; the motion part is a video and falls under
   the video rule above (Drive-embed it separately if wanted, don't try
   to extract and commit it).
3. Resize, strip EXIF/GPS, and place into the right `src/journal/`
   location per the rule above, with the caption the owner gave.
4. Once a photo's been used and committed, move its source file from the
   top-level folder into `z_Archive` so it isn't picked up again — that's
   the existing convention already in use there.
5. **Look at every photo before writing its alt text.** Read the image,
   don't infer it from the filename or from what the owner said the
   caption should be. Getting this wrong once published a description of
   a photo that wasn't there (Aug 2026). The caption is always the
   owner's words; the alt text is a plain description of what is
   actually in the frame.

**Every entry that has a photo must show one on the home page.** This is
already automatic and needs no per-post action: the generator takes the
**first image in the post** as that entry's `thumb`, which is the patch
on the home trail and the archive stamp. Two consequences worth knowing:
order the photos so the strongest one comes first, because that is the
preview the whole site leads with; and a post with no images at all
falls back to a paw-print placeholder, so if photos exist for that day,
add one rather than leaving the card blank. Verify after a build by
grepping `dist/index.html` for the entry's slug, and remember the live
site is a deploy behind until the Action finishes.

The visual system (palette, type, motion rules, the pup sprite, what's
deliberate and why — including that the site is **light theme only**, an
owner decision) lives in `DESIGN.md`. Read it before touching style.css,
journey.js, or the template.

Build locally with `npm install` then `npm run build` — output goes to
`dist/` (gitignored; the Action rebuilds it fresh every deploy, don't commit
it). Preview by opening `dist/index.html` or running any static file server
against `dist/`.

Frontmatter on every page/post:
```yaml
---
title: A short title
date: 2026-08-27   # journal entries only
featured: true     # optional, journal only — puts the post on the trail's
                   # "favourite spots" shelf. Owner-set, always: Claude never
                   # decides which posts are the good ones.
---
```

The GitHub Action deploys via `actions/upload-pages-artifact` +
`actions/deploy-pages` — this requires the repo's **Settings → Pages →
Source** to be set to **GitHub Actions**, not "Deploy from a branch." If a
previous session set it to deploy from a branch, switch it before the first
push, or the Action will succeed but nothing will go live.

## Content model

| Page / type | Source | Cadence |
|---|---|---|
| Home (`src/pages/home.md`) | A few hand-written intro lines; the journal trail renders underneath automatically | Set once |
| About Annie | Rewritten from the private profile, for a stranger reading it | Set once, revisit rarely |
| About This Project | Written by hand | Set once |
| Journal posts | Arrive pre-drafted and pre-approved from the private repo's pipeline | As often as they're given |
| Weekly rollups | Same — arrive pre-drafted | Weekly, once the private repo's review cadence produces them |
| Lessons (`src/lessons/*.md`) | Owner-dictated insight, Claude tidies the prose only — the substance is never invented | As they're learned |
| Milestones (`src/milestones.md`) | Auto-detected by rule from already-approved journal posts (homecoming/weekly anniversaries from the calendar; any sentence containing "first", quoted verbatim, linked to its post) — see `DESIGN.md`. Owner can also add hand-written entries to `src/milestones.md` for anything that never appeared in a post | Live; runs on every build, no per-post action needed |

## Writing

- British English.
- First person, as the owner — not a trainer's case notes. Plain, warm,
  specific. Cut anything that reads like it's performing for an audience.
- **No em dashes, ever, in anything a visitor reads** (owner rule, Aug
  2026): page copy, journal prose, photo captions, UI strings the
  generator emits, the footer, all of it. Use a comma, a full stop, a
  colon, or brackets instead. En dashes inside date/number ranges
  (21–27 Aug, 20–28kg) are fine. This rule is part of the larger one:
- **It must read as human-written.** The owner's stated goal is showing
  how personal Claude can be — so nothing should pattern-match to AI
  output: no em-dash asides, no "X. Not Y, but Z." constructions
  stacked up, no glossy summary sentences, no bold-label list items
  ("**Draft** — ..."). When drafting or editing, read it back as if a
  person typed it on their phone.
- **AI references live in one place.** The site says the owner is using
  Claude to experiment, on About This Project, and nowhere else — no
  "Anthropic's AI", no model talk, no AI framing on other pages or in
  the footer. The site name "Annie & Claude" itself stays.
- A journal post reaching this repo has already been through human review.
  Don't re-interpret, embellish, or "improve" its factual content — layout,
  typos, and formatting are fair game; what happened is not.

## Deploy

GitHub Pages, custom domain via a `CNAME` file once the domain's DNS is
live (see `PLANNING.md`'s Sprint 4 for the exact DNS records). Until then,
the `*.github.io` URL is the real, working site — treat it as live, not as
a draft.
