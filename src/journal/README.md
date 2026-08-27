# Journal entries go here

Two accepted shapes:

**Text only** — `src/journal/2026-08-27.md`
```md
---
title: A short title for the post
date: 2026-08-27
---

The post body, in Markdown.
```

**With photos** — `src/journal/2026-08-27/index.md`, with any images sitting
in the same folder (already resized and stripped of EXIF/GPS data — see
`PLANNING.md`). Reference them in the post as normal Markdown images:
`![Annie mid-zoomies](zoomies.jpg)`.

This file itself isn't built into a page — the generator only looks for
`.md` files that aren't named `README.md`.
