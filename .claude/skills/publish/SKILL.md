---
name: publish
description: Turn a dictated or drafted day into a reviewable journal post in src/journal/. Handles the Google Drive photo intake, the redaction checklist, and the voice checklist, then stops and shows the diff. Use whenever a new journal entry or weekly rollup is being added, or when photos need pulling in for an existing entry.
---

# Publishing a journal entry

Goal: get from "here's what happened today" to a reviewable draft in under two
minutes of the owner's typing. You draft the prose and do the mechanical work.
The owner approves. Nothing goes out without that.

**Never invent what happened.** Every fact in a post comes from the owner. If a
detail is missing, leave it out or ask. Do not fill a gap with something
plausible, and do not fabricate a demo entry to show what something would look
like. Draft the prose, never the events.

## 1. Work out the shape

Ask for the date if it is not obvious. Then:

- No photos: `src/journal/YYYY-MM-DD.md`
- With photos: `src/journal/YYYY-MM-DD/index.md`, images alongside it

Frontmatter is `title` and `date`. Leave `featured:` alone. That flag is
owner-set, always, and decides what lands on the home page's "favourite spots"
shelf. Never set it yourself, and never suggest a post is one of the good ones.

See `src/journal/README.md` for the markdown conventions: caption in the image
title slot, one image per line, adjacent images become a spread.

## 2. Photo intake

New photos land in a Google Drive folder synced locally by Google Drive for
Desktop. It is a real folder on disk, not something reachable through an MCP
tool. Checked directly: no callable Drive tool exists in this environment,
whatever `claude mcp list` reports as connected at the account level.

On the owner's machine the path is:

```
F:\My Drive\PUBLIC FACING FILES\ANNIE\PHOTOS
```

The drive letter is whatever Google Drive for Desktop mounted this session, so
it may not be `F:` after a reboot or on another machine. If that exact path is
missing, search for a `My Drive` folder and the same subpath under it before
asking the owner.

Then, in order:

1. **List the top-level PHOTOS folder.** Not `z_Archive` inside it. That holds
   source files already used by past entries.
2. **Match files to the entry by the date in the filename.**
   `PXL_YYYYMMDD_HHMMSS....jpg` is a Pixel photo. `IMG-YYYYMMDD-WA####.jpg` is
   a WhatsApp share. A `.MP.jpg` file is a Pixel Motion Photo: a still frame
   with a video track inside the same file. Use the still as a normal photo. The
   motion part is video, so it falls under the video rule (Drive-embed it
   separately if the owner wants it, never extract and commit it).
3. **Resize and strip metadata before committing.** Roughly 1600 to 2000px on
   the long edge, all EXIF and GPS gone. Use the out-of-repo tool:

   ```
   node ~/.claude/tools/photo-tool/process.js <input> <output> 1800
   node ~/.claude/tools/photo-tool/batch.js <srcDir> <destRoot> <src>:<subdir>:<name> ...
   node ~/.claude/tools/photo-tool/checkmeta.js <file>     # confirms zero EXIF
   ```

   It lives outside this repo on purpose, so the site's dependency list stays
   at two. Never commit a photo that has not been through it.
4. **Look at every photo before writing its alt text.** Read the image. Do not
   infer the description from the filename or from the caption the owner gave.
   Getting this wrong once published a description of a photo that was not
   there (Aug 2026). The caption is the owner's words. The alt text is a plain
   description of what is actually in the frame.
5. **Order matters.** The generator takes the first image in the post as that
   entry's `thumb`, which becomes the patch on the home trail and the stamp in
   the archive. Put the strongest photo first, because it is the preview the
   whole site leads with. An entry with no images falls back to a paw-print
   placeholder, so if photos exist for that day, use one.
6. **Archive the source.** Once a photo is used and committed, move its source
   file from the top-level folder into `z_Archive` so it is not picked up
   again. That is the existing convention there.

## 3. Redaction checklist

Run this on every draft before writing it into `src/`. If any of it is present,
flag it and hold the post. Do not quietly publish around it.

- [ ] No exact address, postcode or street name
- [ ] No vet clinic name or location
- [ ] Nothing that maps out when the house is reliably empty (work-from-home
      days, gym schedule, regular absences)
- [ ] Location softened to "the Malvern Hills" or "the West Midlands", never
      narrower
- [ ] Photos carry zero EXIF (`checkmeta.js` says so, you did not assume it)

Keep everything else. The emotional content, the training wins, the setbacks,
skill levels moving down as well as up. Those are the point.

## 4. Voice checklist

Run this on the drafted prose. These are the rules that get followed loosely
when they are prose and reliably when they are a list.

- [ ] British English
- [ ] First person, as the owner. Not a trainer's case notes. Plain, warm,
      specific.
- [ ] **No em dashes anywhere a visitor reads.** Not in page copy, journal
      prose, photo captions, alt text, or any UI string. Use a comma, a full
      stop, a colon, or brackets. En dashes inside ranges (21–27 Aug, 20–28kg)
      are fine.
- [ ] No "X. Not Y, but Z." constructions stacked up
- [ ] No glossy summary sentences, no bold-label list items ("**Draft** ...")
- [ ] No AI framing. Claude is mentioned on About This Project and nowhere
      else. No "Anthropic's AI", no model talk, nothing in the footer. The site
      name "Annie & Claude" itself stays.
- [ ] Nothing performing for an audience. Read it back as if a person typed it
      on their phone.

If the post arrived pre-drafted and pre-approved from the private repo, do not
re-interpret, embellish or improve its factual content. Layout, typos and
formatting are fair game. What happened is not.

## 5. Stop and show the diff

Build with `npm run build` to confirm nothing broke, then show the diff and
stop. The owner approves before anything is committed or pushed.

Worth checking after the build: grep `dist/index.html` for the entry's slug to
confirm it made the home trail with the right thumbnail. The live site is a
deploy behind until the Action finishes.

## 6. Afterwards

If the day's photos or video are also going to Instagram, that is the `social`
skill, not this one. This skill stops at the site.
