---
name: newsletter
description: Build a fortnightly newsletter issue in Annie's own voice from journal entries already published on the site. Three modes - draft (assemble the next issue into newsletter/queue/), cards (render email-safe post cards for pasting into Beehiiv), and log (record an issue that went out). Use when preparing the newsletter, when an issue is due, or when recording a sent issue's URL.
---

# The newsletter, in Annie's voice

A short, funny, fortnightly letter written as if Annie wrote it. What she
did, what she did not like, and two or three journal posts to click into.
It goes out through Beehiiv. This skill produces the text and the post
cards; the owner pastes them into Beehiiv, reads the whole thing, and
presses send.

It never writes to `src/`. The journal is the source, not the output.

Two files carry the detail:

- `references/voice.md` — how Annie sounds, and the one rule that keeps
  this honest. **Read it before drafting. Every time.**
- `references/issue-format.md` — the section-by-section shape of an issue,
  and the Beehiiv paste routine

## The rule that matters most

Annie's *opinions* are invented. Annie's *days* never are.

The whole conceit of the format is a dog's-eye view, so her reactions,
her preferences and her grumbles are written, not reported. That is the
carve-out (owner decision, Aug 2026) against the site's "never invent
journal content" rule, and it is deliberately narrow: every event, every
person, every place and every outcome in an issue must trace to a journal
entry that is already published on the site.

If it did not happen in a post, it does not go in the letter. Not as
colour, not as a joke, not as a one-line aside. `references/voice.md`
has the worked examples of where that line sits.

## Cadence

Fortnightly. Issues land on a Sunday, covering the two weeks up to and
including the Saturday before.

Fortnightly rather than weekly is a deliberate call (owner decision, Aug
2026): a week of entries is not enough material for an issue with an arc,
and a weekly slot starts pulling on the journal for content rather than
the other way round. Revisit once the back catalogue is deep enough that
a fortnight's material has to be cut down rather than stretched.

## Mode: draft

Assemble the next issue. This is the main mode.

Read, in this order:

1. `newsletter/ledger.md` — when the last issue went out, and which
   entries it already used. Never build an issue on entries the last one
   was built on, even from a different angle. A newsletter is read start
   to finish by the same people; Instagram is not.
2. Every `src/journal/` entry dated after the last issue's cutoff, in
   date order. Both shapes: `YYYY-MM-DD.md` and `YYYY-MM-DD/index.md`.
   Read the actual prose.
3. `src/lessons/*.md` for anything that landed in the window. A lesson
   makes a good "the humans finally worked something out" beat, told
   from the wrong end.
4. `src/milestones.md` and the calendar. Weekly anniversaries fall out
   of homecoming, 2026-08-21, the same rule `calendarMilestones()` in
   `generator/build.js` uses. A fortnight boundary that crosses one is
   the natural spine for the issue.

Then write `newsletter/queue/YYYY-MM-DD.md` in the shape
`references/issue-format.md` sets out.

Pick 2 or 3 posts to card up, no more. The letter is the thing people
read; the cards are the way back to the site. Four cards turns it into a
list of links, and the click rate on each one drops.

Run the voice checklist before calling it done. Then present the draft
and stop. The owner edits, pastes and sends.

## Mode: cards

Render the email-safe HTML for the posts an issue links to:

```
node newsletter/cards.js 2026-08-30 2026-09-02
```

Slugs are journal folder or file names. It reads `src/journal/`, resolves
each post's first image (the same "first image is the thumb" rule the
site uses), and writes table-based HTML with inline styles and absolute
URLs to stdout. That markup goes into a Beehiiv custom HTML block.

Why a script and not hand-written markup: email clients strip `<style>`
blocks, ignore flexbox and grid, and Outlook needs tables. Hand-rolling
that per issue is how a broken issue gets sent. `draft` calls this and
pastes the result into the issue file; do not write card HTML by hand.

If a post has no image the card falls back to text only, which is fine.
Do not substitute a photo from another day to fill the space.

## Mode: log

After an issue goes out, append one line to `newsletter/ledger.md`:

```
| 2026-09-13 | 1 | 2026-08-30 .. 2026-09-12 | 2026-08-30, 2026-09-02 | https://... | the crate door one |
```

The ledger is committed and does two jobs: it sets the cutoff date the
next `draft` counts from, and it stops an entry being used as the spine
of two issues running.

## What this skill never does

- **Never sends.** Beehiiv's send button is the owner's, always. There
  is no API push here and no scheduled send.
- **Never writes to `src/`.** If an issue makes it obvious a journal
  entry needs fixing, say so and stop. That edit goes through `publish`.
- **Never adds a tracking pixel, a share widget or a counter to the
  site.** Beehiiv's own open and click tracking is inside Beehiiv, which
  is the whole scope of the exception (see `AGENTS.md`). Nothing
  measuring anything goes into `dist/` beyond the sign-up card itself.
- **Never invents a subscriber count, a milestone or a "you all"
  reference.** Do not write "lots of you asked" unless the owner says
  someone actually did.
