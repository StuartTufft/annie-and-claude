# Journal entries go here

Two accepted shapes:

**Text only** — `src/journal/2026-08-27.md`
```md
---
title: A short title for the post
date: 2026-08-27
featured: true   # optional — puts the post on the trail's "favourite
                 # spots" shelf. Only the owner sets this.
---

The post body, in Markdown.
```

**With photos** — `src/journal/2026-08-27/index.md`, with any images sitting
in the same folder (already resized and stripped of EXIF/GPS data — see
`PLANNING.md`). Reference them in the post as normal Markdown images:
`![Annie mid-zoomies](zoomies.jpg)`.

**Video** never gets committed — upload to YouTube as unlisted and embed
the standard iframe in the post body:
```html
<iframe src="https://www.youtube.com/embed/VIDEO_ID" title="A short description" allowfullscreen></iframe>
```

This file itself isn't built into a page — the generator only looks for
`.md` files that aren't named `README.md`.
