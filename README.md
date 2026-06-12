# pi-way

The pi philosophy as a skill + system prompt injector. **Less is more, Unix-way.**

## What's inside

- **Skill** (`/skill:pi-way`) — loaded on demand. Full guide: sub-agents, Make orchestration, PLAN.md/TODO.md patterns.
- **Extension** (`extensions/pi-way.ts`) — injects core pi-way principles into every session's system prompt via the `before_agent_start` hook. No symlinks, no hacks — proper pi extension architecture.
- **APPEND_SYSTEM.md** — the raw principles text (source of truth for the extension and README).

## Install

```bash
pi install git:github.com/e4779/pi-way-skill.git
```

## How it works

On every session, the pi-way extension hooks into `before_agent_start` and appends the pi-way principles to the system prompt. This is the standard pi extension pattern — chainable across multiple extensions, no conflicts.

For other extensions that want to inject system prompt content: subscribe to `before_agent_start` and return `{ systemPrompt: event.systemPrompt + "\n\nyour content" }`. Each extension adds its own layer without overwriting others.

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
