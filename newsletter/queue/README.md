# Queue

One file per drafted issue, named for the Sunday it is meant to go out:
`YYYY-MM-DD.md`. The `newsletter` skill writes them here.

A file in this folder is a draft waiting on the owner. Nothing here has
been sent, and nothing here sends itself. Once an issue has gone out,
record it in `../ledger.md`; the draft file can stay as the record of
what was written.

Unlike `social/queue/`, this folder **is** committed. That one is
gitignored because it fills up with crops of photos already committed
under `src/journal/`, and there is no reason to version those twice.
These are small text files and they are the record of what was actually
written, which the ledger's source list is checked against.

The shape of the file is in
`.claude/skills/newsletter/references/issue-format.md`.
