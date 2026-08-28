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
`PLANNING.md`). Reference them as normal Markdown images, with the
**caption in the title slot**:

```md
![Plain description, for screen readers](zoomies.jpg "The caption people read.")
```

Three things the generator does with these, automatically:

- Each photo becomes a **snap** — a printed photo with its caption,
  tilted very slightly, like something taped into an album.
- **Two or more photos with nothing between them become a picture-book
  spread** — a grid, each tilted a different way. Separate photos with a
  paragraph of prose and they stay full-width instead. That's the lever:
  adjacency decides the layout.
- Width and height are read from the file and written into the `<img>`,
  so the page doesn't jump about as photos load.

Keep each image on its own line. An image sitting mid-sentence can't
become a `<figure>` without producing invalid HTML, so it won't get the
snap treatment.

**Video** never gets committed — it lives on Google Drive (shared
"Anyone with the link" → Viewer, so the embed actually renders for
visitors) and gets embedded via Drive's preview iframe:
```html
<iframe src="https://drive.google.com/file/d/FILE_ID/preview" title="A short description" allow="autoplay" allowfullscreen></iframe>
```
`FILE_ID` is the long ID in the file's Drive share link.

This file itself isn't built into a page — the generator only looks for
`.md` files that aren't named `README.md`.
