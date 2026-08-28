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
| `--moss-deep` | `#3a3b28` | badge, postmarks — earthy, browned green (owner asked for "more brown and earthy" than pure forest green) |
| `--gold` | `#e8c07d` | waypoint badges — Annie's coat |
| `--bow` | `#d98fa0` | **rare by rule**: the badge bow, the home ribbon CTA, favourite-spot marks, the pup's bow. Never body text, never a second link colour. It's her collar bow — it stays special |

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
   only while scrolling. That's the whole budget — resist adding more.

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

- Home = "box lid": deep-moss cover with stamp-perforation edges
  (radial-gradient dot trick — holes are `--paper` coloured), pink ribbon
  CTA (`clip-path` pennant).
- Trail (`/journal/`) = last 4 weeks (`TRAIL_WEEKS` in build.js), weeks
  counted from homecoming `2026-08-21` (`HOME_DATE_UTC`). Waypoints
  alternate sides; dashed connector SVGs with paw prints between them.
  Quiet weeks say so honestly. Milestone signposts (🪧 pills) attach to
  their week.
- Archive = monthly stamp-album pages with folder tabs.
- Stamps: 5:6 perforated cards, circular MALVERN postmark (rotated -9°),
  hover lift `translateY(-4px) rotate(-1.2deg)`.

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

## Where things stood when this file was written (28 Aug 2026)

- Full storybook redesign implemented, uncommitted, on `main`'s working
  tree. No real journal entries exist yet (she's ~1 week home). Fixtures
  used for testing are deleted before commit — never commit fixture posts.
- Author section of `about-this-project.md` is a TODO awaiting the
  owner's own words. `src/milestones.md` is an empty scaffold.
- Not done yet: Sprint 2 (first real post, voice-defining), Sprint 3
  (`/publish` pipeline skill), Sprint 4 (domain/DNS). See `PLANNING.md`.
- Deploy reminder: repo Settings → Pages → Source must be "GitHub
  Actions" before the first push matters.
