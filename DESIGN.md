# DESIGN.md — the visual system, and how to pick this up

Written by Claude, for Claude (and for the owner to correct). This is the
"why it looks the way it looks" file. If you're a future session about to
touch `style.css`, `journey.js`, or `template.html`, read this first —
then you can change things *on purpose* instead of by accident.
Companion files: `CLAUDE.md`/`AGENTS.md` (rules), `PLANNING.md`
(decisions log + roadmap).

## The concept, in one line

A storybook journey through the Malvern Hills: journal posts are stamps,
weeks are waypoints on a winding trail, and a small pup walks it with you.

## Palette — "Hedgerow"

Light theme **only**. Dark mode was built twice and removed on the
owner's decision (Aug 2026) — both attempts read "too dark." Do not
reintroduce it without being asked. All tokens live at the top of
`src/static/style.css`:

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f4f3e7` | page background (soft cream) |
| `--card` / `--stamp-face` | `#fbfaf1` / `#fffef6` | cards / stamp faces |
| `--ink` / `--ink-muted` | `#3d4032` / `#767a68` | text (soft, not black) |
| `--moss` | `#4c7a50` | links, buttons, trail path, active tabs |
| `--moss-deep` | `#3a3b28` | badge, patch date labels — earthy, browned green (owner asked for "more brown and earthy" than pure forest green) |
| `--gold` | `#e8c07d` | waypoint badges — Annie's coat |
| `--bow` | `#d98fa0` | **rare by rule**: the badge bow, the home CTA pill, favourite-spot marks, the pup's bow. Never body text, never a second link colour. It's her collar bow — it stays special |
| `--sky` | `#a8bfe0` | **third pastel**, added Aug 2026 on the owner's call, for the "cuter, more modern" home cover. Read it as the sky above the hills. Same restriction as `--bow`: atmosphere and small accents only, never body text or a link colour |

The dark cover tokens (`--cover`, `--cover-ink`, `--cover-muted`) were
**removed** with the box lid — see "Home" below. The lightbox caption, the
only light-on-dark text left on the site, uses `--paper` at 0.82 opacity.

Hills are inline-SVG data URIs in CSS custom properties
(`--hills-back-img` / `--hills-front-img`).

## Type

- **Bitter** (serif) — headings, brand, badge lettering. The "storybook" voice.
- **Nunito** (rounded sans) — body and UI. The "soft and cute" voice.
- One Google Fonts `@import` at the top of style.css. Real fallback stacks on both.

## The mark

Lettermark badge: `A&C` in a ring, with the collar bow perched on the
upper-right of the ring at `translate(68,15) rotate(18)` — the bow's knot
must sit ON the ring line, drawn AFTER the ring so it paints on top (this
was iterated three times with the owner; don't "fix" it). Lives inline in
`generator/template.html`; favicon (`src/static/favicon.svg`) is the ring
+ bow without lettering (fonts don't render reliably at favicon size).

## Motion rules (distilled from the owner's uploaded skills)

The owner supplied two skill documents mid-project — an Apple-design
fluid-interfaces skill and an animation-construction skill ("Emil
Kowalski bar"). The site is built to pass them:

1. **Gate first**: nothing that fires 100+×/day animates. Blog surfaces
   are occasional-tier, so standard animation is allowed.
2. `transform`/`opacity` only. Never `scale(0)`. No `transition: all`.
3. Curves: `--ease-out: cubic-bezier(0.23,1,0.32,1)` for enter/exit,
   `--ease-in-out: cubic-bezier(0.77,0,0.175,1)` for on-screen movement.
   **Never `ease-in` on UI.** UI durations stay under 300ms.
4. Press feedback = `scale(0.96–0.97)` on `:active`, ~120–160ms.
5. Hover motion is gated: `@media (hover: hover) and (pointer: fine)`.
6. **Every** effect has a `prefers-reduced-motion` variant (fade, not
   travel; mist and pup fully stilled). Motion sensitivity is unrelated
   to the light-theme decision — keep the block even though dark mode is gone.
7. Background motion (the mist) cycles at 90s/130s — deliberately far
   below the ~0.2Hz vestibular-trigger band the Apple skill warns about.
   Don't speed it up past ~30s cycles.
8. Delight budget: the badge bow ties itself once per load; the pup trots
   only while scrolling; the home medallion's halo breathes on a 7s cycle
   (background layer, `transform`/`opacity`, stilled under reduced motion).
   That's the whole budget — resist adding more.

## The interactive layer

`src/static/journey.js` — the site's ONE script, dependency-free,
`defer`red, and everything in it is an enhancement: **the site must stay
complete with JS off** (trail visible, stamps visible; only the pup and
the random-day button are JS-only, and both are decoration).

- Reveal: `IntersectionObserver` adds `.seen` to `.week-stop`s.
- Pup: `.trotting` while scrolling (2-frame leg swap), `.facing-left` on
  scroll-up. It's a *stylised generic puppy*, deliberately not a portrait
  of Annie.
- Parallax: hills translate a few px on scroll, rAF-throttled, capped.
- Random day: fetches `/static/entries.json` (emitted by build.js),
  optional month filter, navigates to a random post.

## Structure the design hangs off

- Home = **the journal**, staged as **four beats** (owner brief, 29 Aug
  2026: "the visitor goes on a trip"; hero rebuilt same day from the
  earlier cover card — there is no card any more, the hills are the
  stage):
  1. **The wow** (`.home-hero`): Annie's medallion large, her name on a
     pink **ribbon banner** (`ribbonSvg` — the one sanctioned use of
     collar pink at hero scale), ONE line of intro from `home.md`, the
     small-caps subtitle, pastel **streamers** (sky/gold/moss only), and
     a **fan of real snaps** (`.hero-snap`) — the newest 4 entries that
     have a photo, chosen automatically, linking to their posts. On
     mobile the snaps hug the medallion in two short rows; lower and
     they cover the ribbon/intro (that bug happened; don't reintroduce).
  2. **The launch** (`.hero-launch`): full-bleed (100vw) dashed paw path
     entering from the page's LEFT edge, the sitting pup at its head,
     "Come along ↓" hint. Same dash language as the trail connectors.
  3. **You are here**: the newest week's waypoint carries a gold
     `.you-are-here` pill ("You're all caught up").
  4. **The sign-off** (`.trail-end`): the pup again, asleep ("z z"),
     "Annie & Claude", links to About Annie / About This Project, with
     the random-day widget just above. The journey has an ending.
  `/journal/` is a meta-refresh redirect to `/`; posts and the archive
  keep their `/journal/...` URLs; there is no Journal nav item. build.js
  emits the hero's own `<h1>` ("Annie") inside `.hero-ribbon` and blanks
  the template's slot (`hideTitle`). Hero entrance: a one-time stagger
  (`hero-pop`, 260–280ms ease-out, delays to ~310ms, `backwards` fill so
  hover transforms survive; stilled under reduced motion) — this
  replaced the paw-trail divider and the card, and joins the delight
  budget alongside the halo breathe.
  **Screenshot gotcha:** headless Edge + `--virtual-time-budget` races
  image decode (random hero snaps render as blank cards) and freezes
  mid-entrance; verify layout with `--force-prefers-reduced-motion` and
  judge motion by hand in a real browser.
- The **scalloped medallion** (redesigned Aug 2026) replaced the
  original deep-moss "box lid" on the owner's call: it read too dark and
  too boxy. A photo of Annie in a 16-scallop medallion, floating over
  a soft periwinkle-and-blush halo, overhanging a light `--card` panel at
  34px radius. Any quiet page can open with the same medallion via
  `hero:` / `heroAlt:` frontmatter (About Annie does — owner request,
  same border and colours as home, deliberately); on quiet pages it sits
  inside the card under the title rather than overhanging.
  - The scallop is a **CSS mask**, `--scallop-mask` — a generated path
    (16 arcs, arc-radius 0.52× the chord) so the fill stays in CSS and
    the shape scales with the element. Regenerate rather than hand-edit
    the path; the geometry is a loop over `n` points on a circle.
  - Two stacked scallops: `.medallion-rim` (cream, slightly larger) sits
    behind the photo to give the pressed-sticker border.
  - The medallion is now the page's **only** contrast anchor — nothing on
    the page is dark any more. It earns that by being the one photograph.
    If you shrink it or wash it out, the whole page goes flat.
  - `template.html` prints `<h1>` before `{{content}}`, so the medallion is
    lifted above the title with flex `order: -1`, not by editing the
    template.
  - Design lineage: Headspace/Calm's *structure* (rounded everything, soft
    colour-matched shadows, slow breathing motion) with Hedgerow's palette
    — deliberately not Headspace's peach/coral.
- Trail (on `/`) = last 4 weeks (`TRAIL_WEEKS` in build.js), weeks
  counted from homecoming `2026-08-21` (`HOME_DATE_UTC`). Waypoints
  alternate sides; dashed connector SVGs with paw prints between them.
  Quiet weeks say so honestly.
  - **Newest first** (owner decision, Aug 2026): you land on today and
    scrolling down walks you back through her puppyhood, so "Wander
    further back →" at the bottom continues the direction of travel
    instead of reversing it. Weeks descend and days within a week
    descend. The Milestones page stays oldest-first on purpose — it's a
    life record read forward, not a feed.
  - **Skipping-stone rule** (learned the hard way, Aug 2026): a week's
    patches are laid ONE PER STEP down a winding path — an 8-step
    `nth-child` meander in `.week-entries`, mirrored on right-side weeks
    so the connector hands the path over. They must never wrap into
    rows or a cluster: the first patchwork pass did exactly that and the
    owner rejected it flat ("just pictures on a long page"). The zigzag
    of steps IS the journey; if the trail ever reads as a grid, this has
    regressed. Desktop steps overlap −30px vertically; mobile steps
    don't overlap at all (compressed offsets would cover the titles). Milestone signposts (🪧 pills) attach to
  their week — capped at 2 per week, shortest labels first, so one wordy
  week can't wall-of-text the trail (the full list still lives on
  `/milestones.html`).

### "How Claude helps" — the experiment's own page

Owner request (29 Aug 2026): About This Project is a declaration of the
experiment, and every Claude integration is catalogued on
`/how-claude-helps.html` as long clickable bars (`.claude-bar`): native
`<details>`, an emoji icon in a moss-soft circle, a bold label, a small
one-liner, and the longer story inside. Works with JS off. About This
Project links to it through `.claude-door`, the same bar shape as a
link. The pattern is meant to extrapolate: every new AI feature gets a
new bar. Bodies are raw HTML inside the markdown (marked doesn't parse
markdown inside block-level HTML). Writing rules from CLAUDE.md apply
hard here: no em dashes, human voice, and this is the ONLY page (plus
nowhere else) that talks about Claude/AI.

### Lessons — the owner's half of the experiment

Built 29 Aug 2026, deliberately NOT merged into How Claude Helps: the
bars there catalogue how the site works; lessons are dated owner
content about raising Annie, so they live at `/lessons.html` as a
visual sibling (the same `.claude-bar` component, 💡 default icon,
per-lesson `icon:` override, anchored `#lesson-<slug>`). Source files
in `src/lessons/` (format in its README). A lesson's `related:` entry
list makes each of those journal posts render a `.lesson-signpost`
pill linking back — cross-linking is frontmatter-driven, zero per-post
work. About This Project has two doors (🐾 Claude, 💡 Lessons) with a
connecting paragraph between the two halves. journey.js opens a
`<details>` bar when it's the URL target; with JS off the anchor still
scrolls to the closed bar. Neither page is in the nav on purpose: both
are reached through About This Project, keeping the top level lean.

### Milestones — auto-detected by rule, not by asking Claude each time

Owner decision (Aug 2026, reversing the earlier "owner confirms each one"
design): milestones are generated automatically at build time, by two
deterministic rules in `generator/build.js` — never by Claude judging a
post's content on the fly. The distinction matters because it keeps the
"never invent content" hard rule intact: both rules only ever surface
things a human has *already* approved into a journal post (or the public
homecoming date), and the text-rule quotes verbatim rather than
paraphrasing, so there's nothing new to get wrong.

1. **Decaying calendar rule** (`calendarMilestones`, redesigned 29 Aug
   2026): homecoming, then weekly anniversaries up to week 12, then
   monthly (homecoming's day-of-month) through the first year, then
   yearly — pure date arithmetic, no text involved. The decay is the
   point: weekly markers would wallpaper the page by year two.
2. **Text rule** (`detectFirstMentions`, tightened 29 Aug 2026): a
   sentence needs "first <thing>" from the `FIRST_THING` pattern
   (optionally one word between, so "first real look" counts) or to
   open with "First" — a bare "first" anywhere caught flavour text like
   "the first night". Capped at **2 per post, shortest sentences
   first** (the same trick the trail's signposts use). Still
   deterministic, still verbatim quotes linked to their posts.

If the text rule still gets noisy, adjust `FIRST_THING`'s word list
rather than reintroducing a manual-confirm step — that was a deliberate
reversal.

**Two tiers + chapters** (owner request, 29 Aug 2026). The page groups
rows under month headings — one `<details class="milestone-chapter">`
per month, newest open, older months folded, so collapsing works with
JS off. Within the page everything stays **oldest first** on purpose:
it's a life record read forward, not a feed. Owner-written lines in
`src/milestones.md` are the **landmark** tier (large display-face rows;
a label starting with ★ also renders a gold star); auto-detected firsts
and calendar anniversaries are the **compact** tier, single-line
texture under each chapter.

Milestone photos: **landmarks + the gold calendar tier** (revised
later on 29 Aug 2026: the first cut was landmarks-only, but the owner
wants the "major milestones" — the gold 1-week/1-month/1-year rows —
to carry pictures too; only the pink "first" tier stays photo-free, so
the page doesn't grow a thumbnail per detected "first"). Each date
builds a pool — that day's journal photos first (already published, so
nothing new can leak), then
`src/static/photos/milestone-YYYY-MM-DD.jpg` if the owner dropped one
in — and rows sharing a date draw from it round-robin. A date with no
photos anywhere gets no thumb; never borrow from another day. Compact
gold rows use a smaller 48px thumb.
- Archive = monthly scrapbook pages with folder tabs.

### Patches — journal entries as scrapbook cuttings

Replaced the uniform "stamps" (Aug 2026, owner's call: the trail read
flat, and the postmark's date was rendering wrong). One component,
`patchHtml`, used by the trail, the favourites shelf and the archive.

Each patch carries four mismatched properties plus two optional ones:

| Property | Values |
|---|---|
| paper tint | cream / sage / blush / sky / gold |
| edge | `stamp` (perforated) / `print` (wide photo margin) / `cut` (dashed, pinked) |
| size | normal or `--big` |
| tilt | −6° … +6°, on `--rot` |
| washi tape | on ~40% of patches |
| date label | tilted −7° … +7°, on `--date-rot` |

**The mismatch is deterministic, not random.** `patchStyle()` derives
every value from an FNV-1a hash of the slug, so a post looks identical on
every build. Never swap this for `Math.random()` — the page would
reshuffle itself on each deploy and no two visitors would see the same
scrapbook.

Patches show the post's **first image** as their thumbnail. A post may
reference that image as a sibling file (`nap.jpg`) or by absolute path
(`/static/photos/…`); only the former gets the post directory prefixed —
prefixing an absolute path produced `/journal/x//static/…` and a 404.
A text-only post gets a `--nophoto` "written note" patch (paw motif,
larger title, shorter) instead of an empty photo frame.

Hover straightens the patch (`rotate(0)`) and lifts it — the tilt itself
is layout rather than motion, so `prefers-reduced-motion` keeps the tilt
and only drops the lift.

**The circular MALVERN postmark is gone.** Its text was set at 8 and 6
units inside a 60-unit viewBox: at the 48px it rendered, the date came
out ~6px tall and — the actual fault — wider than the r=14 inner ring it
sat in, so it crossed the ring line and read as a smudge. Dates are now
a plain legible label (`shortDate()` → "21 AUG") on a paper chip.

## Photos — snaps and picture-book spreads

Journal photos are "snaps": a printed photo with its caption, on a cream
mount, tilted a degree or so like something taped into an album. **Two or
more photos with no prose between them become a picture-book spread** —
a `repeat(auto-fit, minmax(210px, 1fr))` grid, each tilted a different
way. Adjacency in the markdown is the only lever; separate two photos
with a paragraph and they stay full-width.

Implementation notes worth knowing before touching it:

- `generator/build.js`: a marked renderer turns every image into
  `<figure class="snap">`, with markdown's **title slot as the caption**
  (`![alt](file.jpg "Caption")`) — alt stays a plain description for
  screen readers. `layOutPhotos()` then injects real width/height
  (via `jpegSize()`, a small SOF-marker reader — no dependency, and it
  stops the page jumping as photos load), unwraps the `<p>` marked puts
  around a lone image, and groups adjacent figures.
- **The grouping regex is deliberately tempered** —
  `(?:(?!</figure>)[\s\S])*`. A plain lazy `[\s\S]*?` backtracks across
  a closing tag and swallows the prose between two far-apart photos into
  one spread. That bug was hit and fixed; don't "simplify" it back.
- The tilt lives in a `--tilt` custom property so the scroll reveal
  composes with it (`rotate(var(--tilt)) translateY(12px)`) instead of
  overwriting it. Hover straightens to `rotate(0deg)`.
- Clicking a snap opens a lightbox, built entirely in `journey.js` so it
  simply doesn't exist without JS — where the photos are already fine
  inline. Keyboard accessible (the images get `tabindex`/`role=button`,
  Enter/Space open, Escape closes, focus is trapped on the close button
  and returned to the photo afterwards).

Before a photo is ever committed it goes through the local tool at
`~/.claude/tools/photo-tool/` (sharp; deliberately **outside** this repo
so the site's own dependency list stays at two): `process.js` resizes to
1800px on the long edge, applies EXIF rotation, then strips all metadata;
`checkmeta.js` verifies the output has zero EXIF bytes. Always check —
originals routinely carry GPS.

## Tools/skills context for future sessions

- Built with: `artifact-design` principles (early mockups), the owner's
  uploaded **apple-design** + **animate/RECIPES** skill docs (motion bar,
  quoted above), plain hand-editing. The owner once asked about a
  "garden-skills" plugin — it was never available in-session; ask them
  if it matters.
- The owner explicitly stopped artifact previews: **verify with a real
  local build** (`npm run build`, serve `dist/`), not artifacts.
- Node.js LTS was installed on this machine via winget (Aug 2026) for
  local builds. New shells may need a PATH refresh
  (`$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`).

## Where things stood when this file was last updated (29 Aug 2026)

- Live at https://annie-and-claude.com (custom domain + HTTPS verified
  28 Aug 2026; deploys on every push to main). Eight real journal
  entries exist (21–28 Aug).
- 29 Aug 2026 restructure (this session): home = cover + trail;
  `/journal/` redirects; About Annie opens with a `hero:` medallion;
  `/how-claude-helps.html` catalogues the experiment as clickable bars;
  milestones got the decaying calendar, chapters, two tiers and
  landmark-only photos; the no-em-dash / human-written / AI-refs-in-one-
  place writing rules landed in CLAUDE.md + AGENTS.md.
- Author section of `about-this-project.md` is still a TODO awaiting the
  owner's own words. `src/milestones.md` has no real landmarks yet.
- Lessons shipped 29 Aug 2026 (own page, `.claude-bar` reuse, signpost
  cross-links — see "Lessons" above). `src/lessons/` has no real
  lessons yet, only the README scaffold; the page shows its empty
  state until the owner dictates one.
- **Flagged, not built** (owner, 29 Aug 2026, hedged as "not sure ...
  at the moment"): each bar on How Claude Helps / Lessons might be
  better as a teaser (icon + one line, no detail) that links out to its
  own themed page — the way a journal patch links to `/journal/<slug>/`
  — rather than expanding inline via `<details>`. Confirm the reading
  and appetite before building; it's a real restructure (per-bar slugs,
  routing, individual templates), not a tweak. Owner confirmed 29 Aug
  they'll come back to this one later — don't build unprompted.
- **Flagged, not built** (owner, 29 Aug 2026): a regular **"Annie
  POV"** feature — photos/videos taken from behind her head, her view
  of the world — as a recurring element on the site. Shape undecided
  (a tag? a shelf like favourites? its own page?); ask when the owner
  brings it back.
- Not done yet: Sprint 2 (first real post, voice-defining), Sprint 3
  (`/publish` pipeline skill). See `PLANNING.md`.
