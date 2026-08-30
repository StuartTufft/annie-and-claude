# annie-and-claude

The public home of Annie — a Golden Retriever × Border Collie, born 26 June 2026, and the record of her growing up.

**Read it:** [annie-and-claude.com](https://annie-and-claude.com)

## What this actually is

Annie's owner keeps a detailed, day-to-day training log — what she's learning, what's working, what isn't, how she's doing. That log is private; it has vet details, home logistics, and the kind of specifics that don't belong on the internet.

This repo is the public side of it: the story, without the paperwork. Daily life, training wins and setbacks, the odd disaster, told in plain first-person voice — not a trainer's case notes.

It's also a small, ongoing experiment in using Claude (Anthropic's AI) as a genuine collaborator rather than a novelty: voice notes get dictated at the end of the day, turned into a draft post, and reviewed by a human before anything is published. Nothing here was written or approved without someone actually reading it first.

## How a post gets made

1. **Dictate** — a quick voice recap of the day (via [Wispr Flow](https://wisprflow.ai)), saved as a raw note in the private log. Photos land in a synced Google Drive folder around the same time and get matched to the right day by filename.
2. **Draft** — Claude turns that raw note into a post in the established voice, and strips anything that shouldn't be public (exact locations, health specifics, routine details).
3. **Review** — a human reads it and either approves it or sends it back. Nothing skips this step.
4. **Publish** — once approved, the post lands here, in `src/journal/`.
5. **Build & deploy** — a GitHub Action rebuilds the site and pushes it live automatically. This part has no human gate, because by the time content reaches this repo, it's already been through one.

## Structure

```
src/
  journal/            daily posts, one file per entry
  pages/               About Annie, About this project, etc.
  milestones.md        first-time moments, as they happen
  static/              stylesheet, the one script, favicon
generator/              the script that turns src/*.md into the built site
.github/workflows/      the GitHub Action that builds and deploys on every push
CNAME                   custom domain configuration
```

The site is built by a small, deliberately simple Markdown-to-HTML generator rather than a full framework — the whole thing is short enough to read end to end if you're curious how it works.

The journal reads as a **journey**: the last few weeks of posts appear as waypoints on a winding trail through the hills (Annie lives near the Malverns), with a hand-picked "favourite spots" shelf and a random-day button. The complete record lives in a month-by-month archive. A small pup trots along as you scroll — all of it plain CSS and one dependency-free script, and all of it respects `prefers-reduced-motion`. The visual system is documented in `DESIGN.md`.

## Running it locally

```
npm install
npm run build
```

Builds the site into `/dist`. Open `dist/index.html` to preview, or point
any static file server at the `dist/` folder.

## A note on what's not here

Nothing that identifies where Annie lives, who her vet is, or when the house is normally empty. Posts are written to be honest about her life without being a map to it. If you spot something that shouldn't be public, an issue or a message would be genuinely appreciated.

## Reuse

The story is Annie's. The generator and the workflow behind it are free to poke around in, borrow from, or fork if you want to run something similar for your own dog (or cat, or whatever you've taken on).

---

Built by her humans, with Annie as chief tester and occasional editor-by-chewing-the-laptop-charger.
