# CLAUDE.md

Public site for Annie's journey — puppy to adult, in her owner's voice. This
is the **public** half of a two-repo setup: the private day-to-day training
log lives elsewhere and never gets cloned or referenced from here. Nothing
in this repo should assume access to it.

There is no training advice work done in this repo. This repo is the site:
content, the generator, and deploy. If a request is actually about how to
train Annie, say so and point back to the private repo.

## Hard rules — never do these

- **Never commit a video file.** Video lives on YouTube, unlisted, and gets
  embedded. If asked to add a video, embed it — don't download and commit it.
- **Never commit an unoptimised photo.** Resize to roughly 1600–2000px on
  the long edge and strip EXIF/GPS metadata before it's committed. If a
  photo arrives raw, optimise it first; don't commit it as-is "for now."
- **Never invent journal content.** Every post's substance — what happened,
  what was said, how it went — comes from the owner. Draft the prose, never
  the events. If a detail is missing, leave it out or ask; don't fill the
  gap with something plausible.
- **Never let identifying detail through**: exact address or postcode, the
  vet's name or location, or anything that maps out when the house is
  reliably empty. If a draft post contains any of this, flag it and hold
  the post rather than publish around it.
- **No framework.** The site is a small, hand-rolled Markdown → HTML
  generator that lives in `generator/` and should stay short enough to read
  end to end. Don't reach for Astro, Next, Hugo, Jekyll, or similar without
  being explicitly asked to make that switch — it's a deliberate decision,
  not a default.
- **No analytics, view counters, or growth tooling** unless explicitly
  asked. This is a personal project first. Don't add anything that turns
  "did anyone see this" into a thing to check.

## Structure (target)

```
src/
  journal/YYYY-MM-DD.md      one file per published post
  pages/                      home, about-annie, about-this-project
  milestones.md
generator/
  build.js                    reads src/**/*.md, writes /dist
  template.html                the one shared page template
.github/workflows/deploy.yml  build + deploy to GitHub Pages on push to main
CNAME                          added once the domain is ready — not required yet
```

## Sprint 0 — what "set up Sprint 0" means

When asked to set up Sprint 0, do all of the following in one pass:

1. Scaffold the folder structure above.
2. Write `generator/build.js`: reads every `src/**/*.md` file (frontmatter:
   `title`, `date`), renders it into `generator/template.html`, writes the
   result to `/dist`. Keep it plain — no build tooling beyond what Node's
   standard library plus one small Markdown-parsing dependency needs.
3. One placeholder page at `src/pages/home.md` — a short "hello, I'm Annie"
   holding page, not real content yet.
4. `.github/workflows/deploy.yml` — on push to `main`: run the generator,
   deploy `/dist` to GitHub Pages.
5. Commit and push. Confirm the Action runs green and the placeholder is
   live at the `*.github.io` URL.

Stop there. Don't write real journal content or the other pages yet — that's
a separate, later step, done deliberately rather than as a side effect of
scaffolding.

## Content model (reference — not built yet)

| Page / type | Source | Cadence |
|---|---|---|
| Home / About Annie | Rewritten from the private profile, for a stranger reading it | Set once |
| About This Project | Written by hand | Set once |
| Journal posts | Arrive pre-drafted and pre-approved from the private repo's pipeline | As often as they're given |
| Weekly rollups | Same — arrive pre-drafted | Weekly, once the private repo's review cadence starts producing them |
| Milestones | Flagged from journal posts as "first time" moments | Grows on its own |

## Writing

- British English.
- First person, as the owner — not a trainer's case notes. Plain, warm,
  specific. Cut anything that reads like it's performing for an audience.
- A journal post reaching this repo has already been through human review.
  Don't re-interpret, embellish, or "improve" its factual content — layout,
  typos, and formatting are fair game; what happened is not.

## Deploy

GitHub Pages, custom domain via a `CNAME` file once the domain's DNS is
live. Until then, the `*.github.io` URL is the real, working site — treat
it as live, not as a draft.
