# Lessons go here

One file per lesson: `src/lessons/<short-slug>.md`. A lesson is a very
small post: something the owner found out while raising Annie, and why
it matters to them. The substance is dictated by the owner, always.
Claude tidies the prose, never supplies the insight.

```md
---
title: Overtired is not naughty
date: 2026-08-26        # when the penny dropped
icon: 🦈                # optional, defaults to 💡
related:                # optional: journal entries this came from
  - 2026-08-24
  - 2026-08-26
---

Two or three short paragraphs, in the owner's voice.
```

What the generator does with these:

- Each lesson renders as a clickable bar on `/lessons.html` (the same
  bar component as How Claude Helps), anchored at `#lesson-<slug>`.
- Every entry listed in `related:` grows a small signpost at the bottom
  of its post, linking back to the lesson. No per-post work needed.

House writing rules apply: no em dashes, human voice, British English.
This file isn't built into a page.
