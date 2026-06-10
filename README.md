# pi-way

The pi philosophy as a skill + system prompt injector. **Less is more, Unix-way.**

## What's inside

- **Skill** (`/skill:pi-way`) — loaded on demand. Full guide: sub-agents, Make orchestration, PLAN.md/TODO.md patterns.
- **APPEND_SYSTEM.md** — injects core pi-way principles into every session's system prompt.

## Install

```bash
pi install git:github.com/e4779/pi-way-skill.git
```

## Auto-injection

`postinstall` automatically symlinks `APPEND_SYSTEM.md` → `~/.pi/agent/`. No manual steps needed. Pi-way principles land in every session's system prompt — works alongside pi-qwen and other extensions.

## Update

```bash
pi update git:github.com/e4779/pi-way-skill.git
```

## Philosophy

Inspired by [Mario Zechner's blog](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) and [Armin Ronacher's analysis](https://lucumr.pocoo.org/2026/1/31/pi/).

- Context is precious — progressive disclosure
- Observability — files over hidden state
- Bash is universal — CLI tools + README-driven discovery
- Sub-agents via extensions, not built-in
- Make orchestrates data flows
