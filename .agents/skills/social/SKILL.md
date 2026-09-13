---
name: social
description: Turn existing journal entries into ready-to-post Instagram packages. Four modes - plan (propose ranked post ideas from the week's entries), shots (plan the week's hero reel before filming it), draft (build the media, caption, hashtags and alt text into social/queue/), and log (record what went live). Use when preparing Instagram content, planning a filming session, doing the weekly batch, or recording a permalink to embed back into a post.
---

# Instagram, from what already exists

The site is the source. Ten-plus dated entries, the owner's own prose, captioned
photos, and a milestone detector are already sitting in `src/journal/`. This
skill packages that into posts. It never writes to `src/`, and it never invents
anything that did not happen.

Three files carry the detail:

- `references/voice.md` — how a caption sounds, and what must never be in one
- `references/formats.md` — the five content pillars and the platform mechanics
- `references/reels.md` — the video constraints, for `shots`

Read the first two before drafting, the third before a shot list. They are
short.

## The rhythm this supports

Two tracks, deliberately.

**The floor.** Four light posts a week out of what already exists. Batch on
Sunday, roughly 30 minutes: `plan`, the owner picks, then `draft`. Then about
10 minutes a day: post one package (a minute), and spend the rest replying to
comments in the first half hour and commenting on peer accounts. The human 9
minutes matter more than anything automated here, because early engagement
velocity is what the ranking actually keys off.

**The ceiling.** One crafted reel a week, shot and cut by the owner in
Premiere. `shots` writes the plan for it *before* the filming session.

The floor exists so the ceiling never has to be rushed. A busy week should cost
the hero reel, not the run.

## Mode: plan

Propose 6 to 8 ranked ideas. For each: the pillar, the source entry, the format
(reel, carousel, single photo), a one-line reason it will land, and which
photos or clips it needs.

Read, in this order:

1. `social/ledger.md` — what has already gone out. Never propose the same angle
   on the same entry twice.
2. The journal entries in range: `src/journal/*/index.md` and any loose
   `src/journal/*.md`. Read the actual prose, not just the titles.
3. `src/lessons/*.md` for carousel material.
4. `dist/milestones.html` after a build, or run the detector's logic in your
   head from the entries: any sentence containing "first" is a candidate, and
   weekly anniversaries fall out of the calendar from homecoming, 2026-08-21.

Rank by what the pillar table in `references/formats.md` says earns saves and
shares, not by what is cutest. Say plainly when an idea needs something that
does not exist yet (a clip that was never filmed, a photo of a moment only
described in words). Do not quietly substitute.

Present the list and stop. The owner picks.

## Mode: shots

The week's hero reel, planned **before** the filming session. This is where the
leverage is: the constraint on good puppy footage is not editing skill, it is
having the right frames, and week three cannot be reshot.

Read `references/reels.md` first, then the same sources as `plan` plus the
coming week's calendar milestones (weekly anniversaries fall out of the
calendar from homecoming, 2026-08-21, the same rule `calendarMilestones()` in
`generator/build.js` uses).

Write `social/queue/YYYY-MM-DD-hero/shotlist.md`:

```markdown
# <the one idea, in a sentence>

Pillar: <which of the five>
Why this week: <what makes it timely, from the journal or the calendar>

## Hook (first 1.5s)
<what is on screen immediately, and the question it raises>

## Shots
1. <framing> — <rough seconds> — <why it is in here>
...6 to 8 of them

## On-screen text
<beat by beat, with rough timings>

## Audio
<original sound or a track, and what the reel says when muted>

## If you only get one shot, get this one
<the single frame that makes or breaks it>
```

Rules:

- **One idea per reel.** Two ideas in a shot list means two reels.
- **Only real, upcoming things.** Plan around what is actually happening this
  week: a vet trip that is booked, a milestone the calendar produces, a
  behaviour the journal says is changing right now. Never invent an event to
  film, and never plan a shot that would require staging something that has not
  happened.
- **Say what is not possible.** If the best idea needs a location, a person or
  a behaviour that is not available this week, say so and offer the next one.
- **Text lives in the safe box.** See the safe-zone table in
  `references/reels.md`.

Present it and stop. The owner films.

## Mode: draft

For each approved idea, create `social/queue/YYYY-MM-DD-<slug>/` containing the
media and a `caption.md`.

`caption.md` has exactly these sections:

```markdown
# <format> — from <source journal slug>

## Caption
<the caption, in the owner's voice>

## Hashtags
#<two fixed identity tags> #<three chosen for this post>

## Alt text
<one line per image, plain description of what is in the frame>

## First comment
<a question that invites a reply, or the link mention>
```

Rules that are not optional:

- **Five hashtags, no more.** The platform caps it. Two fixed identity tags on
  every post, three chosen for this one. Precision, not volume.
- **Look at every image before writing its alt text.** Read the file. Do not
  infer the description from the caption or the filename. Alt text is indexed
  for discovery as well as read by screen readers, so a lazy one costs twice.
- **The caption's facts come from the entry.** You are re-voicing something the
  owner already wrote and approved. Compress and re-angle it freely. Do not add
  an event, a quote, a reaction or a number that is not in the source.
- **Run the voice checklist in `references/voice.md`** before you call a caption
  done. No em dashes. No AI framing at all, which is stricter than the site.

### Media

Photos are cropped from files already committed under `src/journal/`, using the
out-of-repo tool:

```
node ~/.claude/tools/photo-tool/social.js <input> <4x5|1x1|9x16> <out.jpg> [--centre]
node ~/.claude/tools/photo-tool/card.js day       '{"day":12,"date":"2026-09-01","photo":"a.jpg"}' <out.png>
node ~/.claude/tools/photo-tool/card.js thenvsnow '{"title":"...","left":{...},"right":{...}}'     <out.png>
node ~/.claude/tools/photo-tool/card.js lesson    '{"title":"...","body":"...","index":2,"total":5}' <out.png>
```

`card.js` renders 1080x1350 in the site's own visual language: the pup, the
bow, the hills, the Hedgerow palette, Bitter and Nunito. That is what makes
the grid recognisable at thumbnail size, which is what turns a profile visit
into a follow. See `~/.claude/tools/photo-tool/README.md` for the spec shapes
and the two font traps that fail silently.

**Look at every card after rendering it.** A wrong font or a bad crop does not
raise an error, it just quietly produces something off-brand.

Never re-crop from the Google Drive originals. The committed versions are
already resized and EXIF-stripped, and cropping those keeps one provenance
chain rather than two.

**Video is edited by the owner, in Premiere.** Do not process it here, do not
transcribe it, do not generate a rough cut. Premiere 2025 has speech-to-text,
auto-captions and text-based editing built in and does all of that better than
anything this skill would produce, and the craft is the part the owner enjoys.
Claude's contribution to a reel is the shot list before it (`shots`) and the
caption, hashtags, alt text and any branded still frames after it.

## Mode: log

After a post goes live, append one line to `social/ledger.md`:

```
| 2026-09-01 | reel | 2026-08-25 | firsts | https://www.instagram.com/reel/XXXX/ | first look at traffic |
```

The ledger is committed and does three jobs: it stops `plan` repeating itself,
it records which entries have been mined and which are still fresh, and it
holds the permalinks needed to embed a reel back into its journal entry.

### Closing the loop

A reel can go back into its journal entry with the wrapper pattern proven in
`src/journal/2026-08-30/index.md`. The `<div class="ig-embed">` wrapper is
load-bearing: without it, `style.css`'s 16:9 rule crops the vertical frame.
That edit is a change to `src/`, so it goes through the `publish` skill and the
owner's review, not this one.

## Insights

Read Instagram's own insights in the app, weekly at most, never per post.
PLANNING.md's warning is the reason: the risk here was never the domain name,
it is turning "I feel like posting" into "the numbers need feeding." Report
what changed and what to try next. Do not build a dashboard, do not scrape, and
do not put any counter or tracker on the site.
