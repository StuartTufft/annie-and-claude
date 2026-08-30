# TODO

Where things stand as of Sunday 30 August 2026. This is the operational list.
The strategy and the sprint roadmap live in `PLANNING.md`; the post backlog
lives in `social/ideas.md`.

Everything built so far is committed and pushed.

---

## Do first

**Rotate the HikerAPI key.** It came through a chat message, so treat it as
exposed. New key goes in `~/.claude/tools/niche-research/.env`, which is
outside this repo. Two minutes, and the research pull is finished either way.

**Add `#coltriever` to the Instagram bio.** The bio was written before the data
came back and the identity tag changed. `#coltriever` has 34,419 posts against
`#gollie`'s 25,684 and is a much cleaner tag. Reasoning is in
`.claude/skills/social/references/formats.md`.

**Set up Google Search Console.** Verify `annie-and-claude.com` and submit
`https://annie-and-claude.com/sitemap.xml`. The sitemap exists and is correct;
nothing is indexed until Google is told it's there. Worth doing Bing Webmaster
Tools at the same time, since Bing's index feeds some AI answers.

---

## The one that matters most

**Dictate some lessons.** `src/lessons/` still contains only its README, so
`/lessons.html` renders an empty state.

This is the biggest single gap in the whole project, for three separate
reasons. It's the most saveable format on Instagram, saves being the strongest
ranking signal there is. It's the only content that makes the site plausibly
about dog training rather than only about one dog. And it's the evidence base
for anything ever sold off the back of this.

The material already exists in the journal. Obvious first three:

- Telling her off for sofa-biting was teaching the opposite of what we wanted
  (26 Aug)
- Making the crate door *reopening* the reliable part, not the closing (26 Aug)
- Controlling the environment, and what happens when you can't (30 Aug)

Ten minutes of dictation each. Claude tidies the prose, never supplies the
insight, per `src/lessons/README.md`.

---

## This week's content

**Film the hero reel.** Shot list is written and waiting at
`social/queue/2026-08-31-hero/shotlist.md`. Chill Annie, then Baby Shark Annie:
the exact moment she tips.

Eight shots, roughly 15 seconds cut, original sound, loops back on itself. If
you only get one shot, get shot 4, the frame where her eyes change. Have the
camera already rolling while she's asleep, because it's over in about a second.

Worth knowing: this format is proven. Somebody else's version, "from being the
calmest pup in his litter to becoming a tiny menace", took 158k plays.

**Pick which post ideas to draft.** Eight are queued in `social/ideas.md` with
the media each one needs. Suggested opening three: the sofa-biting carousel
(highest save potential), homecoming (pin it), paw pads (costs nothing).

Then say the word and Claude runs `/social draft` to build the packages.

**Friday 4 September is two weeks home.** Idea #2 is a then-vs-now card pairing
`2026-08-21/nap.jpg` with a new photo. Take one that echoes it: asleep on the
back step. That's the first outing for the format that compounds, so it's worth
getting right.

**Two small media gaps**, both flagged in `social/ideas.md`:

- Idea #4, the mats she weed on, has no photo. Either take one of the mats, or
  decide it runs as a text-led card. Don't substitute an unrelated photo.
- The reel already embedded in the 30 Aug entry
  (`instagram.com/reel/DcqTl8VMmit/`) isn't in `social/ledger.md`. Add it so
  `plan` stops treating that angle as unused.

---

## When you feel like it

- **Add to the crossbreed page.** It's live at
  `/golden-retriever-border-collie.html` and built entirely from one dictation.
  Another ten minutes of material makes it materially better, and it's the page
  most likely to bring strangers to the site from search.
- **Tell the build story somewhere dev-facing.** LLM citation tracks with
  being linked from elsewhere far more than with anything on your own domain.
  This is also where the Claude association gets made properly, since the
  Instagram grid deliberately never mentions it.
- **`src/milestones.md` has no hand-written landmarks.** Everything on
  `/milestones.html` is currently machine-derived from the calendar and from
  "first" sentences in posts. Any landmark that never made it into a post has
  to be added by hand.
- **Second research pass**, only if a specific question comes up that the peer
  reels data would answer. Probably not worth it: the niche tops out around
  8,000 followers. The script resumes and won't re-buy anything already in
  `out/`.

---

## Not doing, on purpose

Recorded so they don't get re-proposed. Fuller reasoning in the skill files.

- Auto-publishing to Instagram via Meta's API. App Review is 2 to 4 weeks and
  rejectable, to save about a minute a day.
- Any transcription or rough-cut tooling. Premiere 2025 already does it better.
- Ongoing scraping or a metrics dashboard. Insights get read in the app,
  weekly at most.
- Analytics of any kind on the site.
- After Effects overlay templates. Revisit after four hero reels, once it's
  clear which overlays actually repeat.
