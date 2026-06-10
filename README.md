# pi-way

The pi philosophy as a skill + system prompt injector. **Less is more, Unix-way.**

## What's inside

- **Skill** (`/skill:pi-way`) — loaded on demand. Full guide: sub-agents, Make orchestration, PLAN.md/TODO.md patterns.
- **APPEND_SYSTEM.md** — injects core pi-way principles into every session's system prompt.

## Install

```bash
pi install git:github.com/e4779/pi-way-skill.git
```

## Enable system prompt injection

After install, symlink or copy APPEND_SYSTEM.md to your pi config:

```bash
# Find where pi-way-skill is installed
PKG=$(pi list | grep pi-way-skill | awk '{print $NF}')
# Symlink to global config
ln -sf "$PKG/APPEND_SYSTEM.md" ~/.pi/agent/APPEND_SYSTEM.md
```

Or copy to a specific project:
```bash
cp "$PKG/APPEND_SYSTEM.md" .pi/APPEND_SYSTEM.md
```

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
