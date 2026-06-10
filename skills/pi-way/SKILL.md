---
name: pi-way
description: The pi philosophy — less is more, Unix-way, files over built-in features. Use subagents, tmux, TODO.md, PLAN.md, and file-based artifacts. Use when the user asks about sub-agents, task tracking, planning, background processes, or wants to understand how to work the pi way.
---

# The Pi Way

Pi is a minimal, opinionated coding agent harness by Mario Zechner. Philosophy: **less is more**, **context engineering is paramount**, **bash is the universal interface**.

This skill teaches you — the model — how to work *with* pi, not against it.

Inspiration: [Mario Zechner's blog](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/).

---

## Core Principles

1. **Context is precious** — Progressive disclosure: load details only on demand. Don't dump.
2. **Observability** — Write plans, todos, tracking to files. User sees everything. Nothing hidden.
3. **Bash is the universal tool** — CLI tools, scripts. README-driven discovery: read the README before using a tool.
4. **YOLO by default** — No permission prompts. Full filesystem access.

---

## Explore Your Tools

You have more than just read/write/edit/bash. Before you start working, understand what's available:

- **`mcporter`** — MCP servers behind progressive disclosure. ALWAYS search → describe → call. Never call without describing the schema first. Explore all available servers.
- **`Agent`** — Spawn specialized sub-agents (@tintinweb/pi-subagents). Explore available agent types.
- **Extension tools** — mcporter bridge, powershell utilities, and others. They're in your tool list — read their descriptions.

**Rule**: before using any mcporter tool for the first time, call `describe` to get its schema.

---

## Sub-Agents

Pi has no built-in sub-agents — extensions fill this gap. Use the **`Agent` tool** (@tintinweb/pi-subagents).

### Basic usage

```json
Agent({ subagent_type: "rust-coder", description: "Fix auth bug", prompt: "..." })
Agent({ subagent_type: "Explore", description: "Find auth files", prompt: "...", run_in_background: true })
Agent({ subagent_type: "researcher", prompt: "...", inherit_context: true })
Agent({ subagent_type: "researcher", prompt: "...", schedule: "0 0 9 * * 1" })
```

**Modes**: `spawn` (clean context, default) or `fork` (inherit parent). **Background**: `run_in_background: true`. **Steering**: `steer_subagent` mid-run.

### Creating agents

Write a `.md` file in `~/.pi/agent/agents/`:

```markdown
---
name: my-agent
description: What this agent does
model: deepseek/deepseek-v4-flash
tools: read, write, edit, bash
---
You are a [role]. Your job is to [specific task].
```

**Models**: `deepseek-v4-flash` for routine, `deepseek-v4-pro` for complex. Reserve expensive models for your main session.

### When to delegate

- **Code generation** → rust-coder, script-kiddie
- **Research** → researcher (MCP, web, API docs)
- **Exploration** → Explore (fast codebase search)
- **Wiki work** → wiki-maintainer
- **Parallel** → multiple agents on independent tasks
- **Review loop** → worker implements → reviewer checks with fresh context → fix → repeat (max 3)

---

## Make — the orchestrator

Make is your telescope. **Data flows through it — recipes are lenses that focus and transform.**

```makefile
# Data pipeline: raw → processed → analyzed
data/raw/%.csv:
	curl -o $@ https://...

data/processed/%.json: data/raw/%.csv
	cargo xtask convert $< $@

data/results/report.md: data/processed/%.json
	# Agent reads data, writes findings
```

**Why Make**:
- Dependencies track what changed — only stale tasks re-run
- The Makefile IS the documentation — no separate README needed
- `make target` is a one-word command
- Files are the interface between agents

### Sub-agent workflow with Make

```
subs/
├── tasks/     # Task descriptions (commit to git)
├── data/      # Extracted data for agents (.gitignore)
└── results/   # Agent outputs (.gitignore)
```

```makefile
subs/results/research.md: subs/tasks/research.md subs/data/api-docs.txt
	# Agent: read task + data → write result
```

**Pre-extract data** for sub-agents. Don't make agents dig through external sources — write a script, save to `subs/data/`, feed to agent.

---

## PLAN.md & TODO.md

No built-in plan mode or task tracker. Use files:

```markdown
# PLAN.md
## Goal
Refactor auth to support OAuth 2.0
## Approach
1. Research OAuth flows
2. Design token storage
3. Implement endpoints
4. Add tests
## Current Step
Step 3 — authorization endpoints
```

```markdown
# TODO.md
- [x] User authentication
- [ ] API documentation
- [ ] Rate limiting
```

- Persist across sessions, version-controlled
- User and agent co-edit
- Agent reads on start — knows what's pending

---

## No Background Bash? Use tmux.

For dev servers, watch mode, REPLs:

```bash
tmux new-session -d -s dev "npm run dev"
tmux capture-pane -t dev -p          # peek at output
tmux send-keys -t dev "rs" Enter     # send command
tmux attach -t dev                   # user can watch live
```

Full observability — no hidden processes.

---

## git worktree — isolation

```bash
git worktree add ../feature feature-branch
cd ../feature && [work]
git worktree remove ../feature
```

Experiments, parallel explorations, review→fix — all isolated via filesystem.

---

## Summary

| Need | Pi Way |
|------|--------|
| Sub-agent | `Agent` tool + agent `.md` files |
| Orchestration | Make — data flows through recipes (lenses) |
| External tool | mcporter (describe first!), CLI + README |
| Planning | `PLAN.md` |
| Task tracking | `TODO.md` |
| Background process | `tmux` |
| Context gathering | Separate session → artifact → fresh session |

---

## See Also

- [Mario Zechner's blog](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)
- [Armin Ronacher: Pi within OpenClaw](https://lucumr.pocoo.org/2026/1/31/pi/)
- [tintinweb/pi-subagents](https://github.com/tintinweb/pi-subagents)
- [nicobailon/pi-subagents](https://github.com/nicobailon/pi-subagents)
