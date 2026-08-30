# Annie & Claude — Blog Build Plan

Living plan for turning Annie's private training journal into a public,
voice-dictated blog on GitHub Pages. Originally designed as an interactive
artifact; this is the portable, git-friendly version, meant to sit in the
repo so it travels with the project instead of living only in a chat
history. **Once this file is in the repo, it is the source of truth** —
update it as decisions firm up, same rule as everywhere else in this
project: don't let the same fact live in two places.

Day 6 of the project · 8 weeks 6 days old · home since 21 Aug 2026 ·
source: `annie-meets-claude` (private) · target: this repo, public, custom
domain.

## The shape of this

Two goals, one project: raising Annie well, and learning something real
about working with Claude while doing it. The private repo is where the
day-to-day training actually happens. This repo is the public record —
the story, without the paperwork — built from voice-dictated notes that
Claude turns into posts, always reviewed by a human before anything goes
live.

## Two questions, answered up front

**How does the private → public sync actually work?**
Not via an automatic cross-repo GitHub Action. Since publishing is
human-in-the-loop by design, "sync" means: a person, in a Claude Code
session with both repos available, saying "turn this entry into a post."
Claude reads the private journal, drafts the public post, redacts anything
sensitive, and writes it into this repo. A human reviews the diff. A human
says publish. Nothing crosses from private to public without that step.

**What actually builds the site?**
Not a framework. A small, hand-rolled Markdown → HTML generator
(`generator/`) that reads `src/**/*.md`, wraps each file in one shared
template, and writes the result to `/dist`. Short enough to read end to
end. Eleventy is the fallback if this ever hits a real ceiling — graduate
to it deliberately, don't reach for it by default.

## Architecture

The pipeline, in order:

1. **Wispr Flow** — dictate, it types.
2. **Raw note** — saved in the private repo.
3. **Claude** — drafts the post and runs the redaction pass.
4. **You — review & approve** — the only judgment call in the whole
   pipeline. Nothing reaches this repo without it.
5. **Commit** — the approved post lands in this repo.
6. **GitHub Action** — builds and deploys automatically. Safe to leave
   fully automatic, because by this point the words are already yours.

### What lives in each repo

`annie-meets-claude` (stays private):
```
01-profile.md
skills/, health/, management/
socialisation/, decisions.md
journal/2026/*.md   ← raw truth
documents/            ← never edited
CLAUDE.md, AI-CONTEXT.md
```

`annie-and-claude` (this repo, public — the site):
```
src/journal/YYYY-MM-DD.md   ← redacted, in your voice
src/pages/about-annie.md
src/pages/about-this-project.md
src/milestones.md
generator/   (the small script)
.github/workflows/deploy.yml
CNAME
```

### Redaction pass — never let through

- **Never publish** the exact address, postcode, or street.
- **Never publish** the vet clinic's name or location.
- **Never publish** the specific WFH/gym pattern — it's a "when is nobody
  home" schedule.
- Soften "Malvern" to something like "the Malvern Hills" or "the West
  Midlands" if geography belongs in the story at all — specific enough to
  be charming, not specific enough to find the house.

### Redaction pass — keep, this is the whole point

- Everything emotional: the funny bits, the hard bits, what surprised you.
- Training wins and setbacks, in plain language, not clinical trainer-speak.
- Skill levels moving up *and* down — that's the honest, useful story.
- Photos, once location metadata is stripped (see Media, below).

## Decisions log

In the spirit of the private repo's own `decisions.md` — what's proposed,
what's confirmed, and why. Flip anything that no longer holds.

| Decision | Choice | Why | Status |
|---|---|---|---|
| Repo split | Two repos, private brain + public site | Vet, address, and schedule details can't leak if they're never in the public repo at all | confirmed |
| Publish trigger | Human-in-the-loop, always | One extra "yes" beats one accidental overshare | confirmed |
| Site builder | Hand-rolled Markdown→HTML script, Eleventy as fallback | Matches how the project is already thinking about it; fully readable; no framework tax | proposed |
| Build/deploy trigger | Fully automatic on push to this repo | Nothing sensitive left to gate by the time content reaches here | confirmed |
| Hosting | GitHub Pages, custom domain via CNAME + DNS | Free, matches "domain points at the repo," zero server to maintain | confirmed |
| Domain | Brand new dedicated domain (apex, e.g. `example.com`), not a subdomain | Fully independent from anything else run elsewhere; costs a small yearly fee | confirmed |
| Public repo name | `annie-and-claude` | — | confirmed |
| Site builder (revisited Aug 2026) | Hand-rolled generator reaffirmed after consult; Eleventy stays the fallback | Everything the storybook design needs is achievable without a framework | confirmed |
| Theme | Light theme only — dark mode removed entirely | Two dark-mode attempts both read "too dark"; one soft daytime look is easier to keep on-brand | confirmed |
| Journal shape | "Journey trail": last 4 weeks as waypoints on a winding path + owner-picked "favourite spots" (`featured: true`) + monthly archive at `/journal/archive/` | Storybook feel without an endlessly growing page; owner curates, Claude never judges which posts are best | confirmed |
| Random day | Button on the trail, filterable by month, powered by a build-time `entries.json` manifest | Fun rediscovery of old posts with zero server-side anything | confirmed |
| Milestones | Built: `/milestones.html` from `src/milestones.md` + signpost markers on trail weeks | Was "build later"; pulled forward as part of the storybook redesign | confirmed |
| Interactivity | One dependency-free script (`src/static/journey.js`): scroll reveal, pup sprite, parallax, random day. All reduced-motion safe, site fully works with JS off | "Fun and interactive" without breaking the no-framework rule | confirmed |
| Domain live | `annie-and-claude.com` resolves over HTTPS to the Pages site (verified 28 Aug 2026) | Sprint 4's DNS work is done; `www`/TXT-verification per Sprint 4 notes still worth checking | confirmed |
| Instagram growth work | Explicitly authorised, Aug 2026, and scoped to Instagram only. Lives in the `social` skill; the site itself gains no analytics, counters or trackers | The guardrail below says "unless explicitly asked". This is that ask. Scoping it keeps reading the site free of numbers | confirmed |
| Instagram voice | Grid is 100% dog. No AI framing on Instagram at all, which is stricter than the site's "About This Project only" rule | The audience there is new puppy owners, who do not care and may trust it less for knowing. That trust is the asset any future training product would rest on | confirmed |
| Instagram publishing | Draft and queue. Claude prepares the package, the owner taps post. No Graph API, no browser automation, no third-party scheduler | Meta App Review is 2 to 4 weeks and rejectable, to save about a minute a day on one account | confirmed |

## Build plan, in sprints

Each sprint has a single finish line. Don't start the next until the last
one's "done when" is true.

**Sprint 0 — Prove the pipe works** (~90 min, one sitting)
Create the public repo. Write the tiny generator: reads `src/*.md`, wraps
each in one shared HTML template, writes to a build folder. Add the GitHub
Action that builds on every push. One placeholder page is enough.
*Done when* a page is live at the `*.github.io` URL and pushing a change
updates it within a minute.

**Sprint 1 — The two pages that never change often** (~1 session)
Home/About Annie (pulled from `01-profile.md`, rewritten for a stranger
reading it) and About This Project (the two goals: raising Annie well, and
what's being learned about working with Claude). Hand-write these — safe,
compiled content, no automation needed.
*Done when* someone who's never met Annie understands who she is and why
this site exists, in under a minute of reading.

**Sprint 2 — One real post, done by hand** (~30–45 min)
Take one real journal entry. Draft the "turn this into a blog post" prompt
by hand, in a session with both repos, and hand-tune the output until it
actually sounds right. This is where the voice gets defined — do it before
automating it.
*Done when* it'd be fine for a friend to read this post without knowing it
started as a voice memo.

**Sprint 3 — Make the pipeline repeatable** (~1 session)
Turn Sprint 2's manual process into a standing prompt — a `/publish`
slash command (same idea as the private repo's `/log`), or a saved Claude
skill: reads a journal entry → drafts in the now-defined voice → runs the
redaction checklist → writes it into this repo → stops and shows the diff.
*Done when* going from "here's what happened today" to a reviewable draft
post takes under two minutes of typing.

**Sprint 4 — Domain, polish, and the fun stuff** (ongoing, no deadline)
Buy the domain, then: repo **Settings → Pages → Custom domain**, enter it,
save — GitHub writes the `CNAME` file automatically. At the registrar's DNS
settings, add four **A records** at the apex pointing to
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
(AAAA/IPv6 equivalents exist too; A records are enough). Worth also adding
a `www` CNAME record to `<username>.github.io` — GitHub then redirects
whichever isn't the primary domain to the one that is. Allow up to 24
hours for DNS to propagate before ticking **Enforce HTTPS**. Verifying
domain ownership first (a TXT record) is recommended — closes off a
domain-takeover risk. Then pull from the AI ideas backlog below, in
priority order — don't do it all at once.
*Done when* the domain resolves and shows the site over HTTPS. Everything
after this is backlog, not a finish line.

## What's actually on the site

Keep the page types few — more post types than there's energy to fill is
how these projects stall.

| Page / type | Source | Cadence |
|---|---|---|
| Home / About Annie | `01-profile.md`, rewritten | Set once, revisit rarely |
| About This Project | Written by hand | Set once |
| Journal posts | Daily journal entries, via the pipeline | As often as dictated |
| Weekly rollups | `journal/reviews/`, starts after the first `/review` (none run yet — she's six days in) | Weekly — good for readers who don't want daily detail |
| Milestones | Claude flags "first time" moments from journal entries, for confirmation | Grows on its own, low effort |

## Photos, video, and links

The bit people will actually watch for. Different medium, different rules.

| Type | Where it lives | Why |
|---|---|---|
| Photos | Committed in this repo, resized + EXIF-stripped | A properly sized web photo is a few hundred KB — nowhere near GitHub's limits, and it's versioned with the post it belongs to |
| Video | Google Drive, shared "Anyone with the link", embedded via Drive's `/preview` iframe (revised Aug 2026 — YouTube was the original plan) | GitHub Pages isn't built to stream video; Drive's embed is an officially supported Google feature, and the owner has sharing configured for durable access. Trade-off, known and accepted: Drive doesn't re-compress/adapt bitrate like YouTube, and a personal account has an account-wide bandwidth quota shared across all files — a real ceiling under heavy traffic, not a concern at this site's current scale |
| Google Photos | Stays the personal archive, full-res backup only | Not built for public embedding — direct-link scraping is unofficial and breaks the moment sharing is toggled off |
| External links | Normal markdown in the post text | No plumbing needed — `[link text](https://…)` |

**Photos — curate, then commit.** Google Photos stays exactly what it is
today: full-resolution phone backup. For the site, it's the source to pick
*from*, not the thing to embed *into* the page: pick the handful of shots
worth including, export the originals, run them through a resize-and-strip
step (~1600–2000px long edge, EXIF/GPS stripped in the same pass), commit
the result next to the post. Worth wiring into the Sprint 3 `/publish`
flow later — not needed for Sprints 0–2.

**Video — don't put it in the repo.** A single phone clip can be
50–200MB — near or past GitHub's 100MB hard file limit on its own. Upload
to YouTube as unlisted, embed the standard `<iframe>`. Cloudflare Stream is
the paid, no-branding upgrade path if the site ever outgrows YouTube —
later problem, not a now problem.

## Cool-use-of-AI backlog

Ranked by payoff for the effort, not by how impressive it sounds. Pull
from the top.

| When | Idea | What it actually buys |
|---|---|---|
| now | Journal entry → Instagram post package | The content is already written and the photos already picked. This is repackaging, not creating: `social` skill, `plan`/`draft`/`log` |
| now | Branded cards from the site's own SVG | `card.js` renders day stamps, then-vs-now and lesson slides from `pupShapes()`/`ribbonSvg()` and the Hedgerow palette, so the grid is recognisable at thumbnail size |
| now | Voice → in-voice draft + redaction pass | The whole point of the project — this is Sprint 3, not a stretch goal |
| now | Weekly rollup → readable digest post | Already produced weekly via `/review`; free content |
| next | Milestone detector | Claude scans entries for "first time she…" language, proposes a milestones entry to confirm |
| next | Skill-progress chart | Small chart from `skills/levels.md`'s dated history — visual proof training is working |
| later | Photo alt-text / captions via Claude vision | Accessibility win, mildly delightful — nice-to-have |
| later | Open-source the "kit" | Strip personal data from the private repo's structure (templates, the `CLAUDE.md` loop, the generator) into a template others can clone for their own dog. Biggest career-leverage move here |
| later | "Ask about Annie" mini Q&A widget | Needs a serverless function (Cloudflare/Vercel) holding the API key — worth doing once everything else is boring and solid, not before |

## Guardrails worth keeping visible

- Don't add analytics, view counters, or growth tooling unless explicitly
  asked. This stays a personal project first — the risk isn't the name or
  the domain, it's turning "I feel like posting" into "the numbers need
  feeding."
  Instagram growth work was explicitly asked for in Aug 2026 and is the
  one exception (see the decisions log). It stays inside the `social`
  skill, insights get read weekly at most and never per post, and nothing
  measuring anything goes near `dist/`.
- No raw video or unoptimised photos committed, ever (see Media).
- Never invent journal content — draft the prose, never the events.
