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

- **Never commit a video file.** Video lives on YouTube, unlisted, and gets
  embedded (`<iframe>`, see `src/journal/README.md` for the pattern). If
  asked to add a video, embed it — don't download and commit it.
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
  pages/*.md            standalone pages. home.md -> / (everything else -> /<name>.html)
  journal/
    YYYY-MM-DD.md          text-only entry
    YYYY-MM-DD/index.md    entry with photos — images sit in the same folder
  static/                 copied into dist/ verbatim (style.css, favicon, etc.)
generator/
  build.js                the whole generator — reads src/, writes dist/
  template.html           the one shared page template ({{title}}, {{pageTitle}}, {{date}}, {{nav}}, {{content}})
.github/workflows/deploy.yml   builds and deploys dist/ to GitHub Pages on every push to main
```

Build locally with `npm install` then `npm run build` — output goes to
`dist/` (gitignored; the Action rebuilds it fresh every deploy, don't commit
it). Preview by opening `dist/index.html` or running any static file server
against `dist/`.

Frontmatter on every page/post:
```yaml
---
title: A short title
date: 2026-08-27   # journal entries only
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
| Home (`src/pages/home.md`) | Written by hand | Set once |
| About Annie | Rewritten from the private profile, for a stranger reading it | Set once, revisit rarely |
| About This Project | Written by hand | Set once |
| Journal posts | Arrive pre-drafted and pre-approved from the private repo's pipeline | As often as they're given |
| Weekly rollups | Same — arrive pre-drafted | Weekly, once the private repo's review cadence produces them |
| Milestones (`src/milestones.md`, not built yet) | Flagged from journal posts as "first time" moments | Grows on its own — build this page once there are 2–3 real milestones to show |

## Writing

- British English.
- First person, as the owner — not a trainer's case notes. Plain, warm,
  specific. Cut anything that reads like it's performing for an audience.
- A journal post reaching this repo has already been through human review.
  Don't re-interpret, embellish, or "improve" its factual content — layout,
  typos, and formatting are fair game; what happened is not.

## Deploy

GitHub Pages, custom domain via a `CNAME` file once the domain's DNS is
live (see `PLANNING.md`'s Sprint 4 for the exact DNS records). Until then,
the `*.github.io` URL is the real, working site — treat it as live, not as
a draft.
