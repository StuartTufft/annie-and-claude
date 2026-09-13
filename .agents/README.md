# .agents/

A byte-for-byte mirror of `.claude/skills/`, kept so agents that read
`.agents/` rather than `.claude/` see the same instructions.

Regenerate it with `rm -rf .agents/skills && cp -r .claude/skills .agents/skills`.
Do not run a find-and-replace on it. The first version of this mirror
swapped "Claude" for another agent's name throughout, which also rewrote
the photo tool's real path (`~/.claude/tools/`), the site's actual name
("Annie & Claude"), and a shell command. Everything in the skills that
says "Claude" is a fact about this project, not about who is reading.
