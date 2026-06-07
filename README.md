# pi-way-skill

The pi philosophy as a skill for [pi coding agent](https://pi.dev).

**Less is more. Bash is the universal interface. Context engineering is paramount.**

## What this skill teaches

- **No sub-agents?** → `subagent` tool (`@mjakl/pi-subagent`) for routine delegation, raw bash/tmux for advanced isolation
- **No plan mode?** → PLAN.md file
- **No built-in to-dos?** → TODO.md file
- **No background bash?** → tmux
- **No MCP?** → CLI tools + READMEs + mcporter (progressive disclosure)
- **YOLO by default** → assuming you know what you're doing

## Philosophy

Based on [pi's philosophy](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md#philosophy):

> **No MCP.** Build CLI tools with READMEs, or build an extension that adds MCP support.
> **No sub-agents.** Spawn pi instances via tmux, or build your own with extensions, or install a package.
> **No plan mode.** Write plans to files.
> **No built-in to-dos.** They confuse models. Use a TODO.md file.
> **No background bash.** Use tmux. Full observability, direct interaction.

And from Mario Zechner's [blog post on building pi](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/):

> *"If you absolutely must use MCP servers, look into Peter Steinberger's mcporter tool that wraps MCP servers as CLI tools."*
>
> *"Spawning multiple sub-agents to implement various features in parallel is an anti-pattern in my book and doesn't work, unless you don't care if your codebase devolves into a pile of garbage."*
>
> *"If you need to gather context, do that first in its own session. Create an artifact that you can later use in a fresh session."*

## Install

```bash
pi install git:github.com/e4779/pi-way-skill.git
```

## Skill writing guidelines

Follows the [Agent Skills standard](https://agentskills.io/specification) and pi's [skills documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md):
- SKILL.md — instructions for the model (concise, actionable)
- README.md — context for humans (sources, philosophy, install)

## License

ISC

## Companion extension

For first-class sub-agent support with streaming TUI progress, install:

```bash
pi install npm:@mjakl/pi-subagent
```

The skill gracefully degrades: if the `subagent` tool is not available, it falls back to raw `pi -p` bash patterns and tells the user about the extension.
