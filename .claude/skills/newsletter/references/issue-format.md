# The shape of an issue

One file per issue: `newsletter/queue/YYYY-MM-DD.md`, dated the Sunday it
goes out. It holds everything the owner needs to build the issue in
Beehiiv and nothing else.

## The file

```markdown
# Issue N — <working title, for us, never sent>

Covers: 2026-08-30 to 2026-09-12
Sources: 2026-08-30, 2026-09-02, 2026-09-07, 2026-09-11
Cards: 2026-08-30, 2026-09-07

## Subject lines
1. <under 45 characters, in her voice>
2. <a different angle, not a rephrase>
3. <the safe one>

## Preview text
<about 90 characters. Continues the subject line, never repeats it.>

## The letter

<Annie's part. See below.>

## Cards
<the output of `node newsletter/cards.js <slugs>`, verbatim>

## PS, from the owner
<two or three lines, the owner's own voice. Left as a prompt for them to
fill or edit, never invented.>

## Check before sending
- [ ] every event traces to a listed source entry
- [ ] redaction pass clean (see references/voice.md)
- [ ] no em dashes
- [ ] card links open the right posts
- [ ] the PS is actually the owner's words
```

## The letter itself

Four beats, in this order. No headings inside it beyond the two below:
it reads as a letter, not a document.

**The opening line.** Straight in, no greeting throat-clearing. Her most
strongly held opinion about the fortnight, stated as fact.

**What I did.** Three or four short beats, each from a different entry.
Chronological is fine and usually funniest, because it lets a
preoccupation build. This is where the milestone goes if the fortnight
had one, told sideways: she does not know it is a milestone, she knows
the humans got strange about something.

**What I did not like.** One or two. Small, real and disproportionate.
See the engine note in `references/voice.md` for what disqualifies a
complaint.

**The sign-off.** She stops when she gets bored. No summary, no "until
next time", no promise about what is coming. A last line that is just
another opinion is the right ending.

Roughly 350 to 500 words, all in. If it is running long, cut a "what I
did" beat rather than trimming everywhere: three good beats beat five
compressed ones.

## Cards

Generated, never hand-written:

```
node newsletter/cards.js 2026-08-30 2026-09-07
```

Two or three per issue. Each renders the post's first photo, its title,
its date and its opening line, linking to
`https://annie-and-claude.com/journal/<slug>/`.

Pick posts that the letter has already made someone curious about, and
put them in the same order the letter mentions them. A card for a day
the letter never mentions is a link nobody has a reason to click.

## Pasting into Beehiiv

1. New post, paste the letter as normal paragraphs. Do not paste the
   Markdown source; Beehiiv's editor will not render it.
2. Add a **custom HTML block** where the cards go, and paste the `cards.js`
   output into it whole. It is one self-contained table per card.
3. Subject line and preview text into the send settings.
4. Send a test to yourself first. Every issue, no exceptions: the cards
   are the part that can silently break, and they break differently in
   Gmail and Outlook.
5. Read the whole thing once more in the test email, then send.
6. Run `log` with the issue's public URL.

## Two things Beehiiv will fight you on

**Its editor rewrites pasted HTML** outside a custom HTML block. The
cards must go in a custom HTML block or the inline styles get stripped
and the layout collapses.

**Images must be absolute URLs.** `cards.js` emits
`https://annie-and-claude.com/...` for exactly this reason. If a card's
photo is missing in the test email, the post it points at probably has
not been deployed yet. Build and push first, then draft the issue.
