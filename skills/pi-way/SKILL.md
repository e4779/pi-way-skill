---
name: pi-way
description: The pi philosophy — less is more, Unix-way, no sub-agents, no built-in tasks/plan mode. Use bash, tmux, TODO.md, PLAN.md, and file-based artifacts instead. Use when the user asks about sub-agents, task tracking, planning, background processes, or wants to understand how to work the pi way.
---

# The Pi Way

Pi is a minimal, opinionated coding agent harness built by Mario Zechner. Its philosophy: **less is more**, **context engineering is paramount**, and **bash is the universal interface**.

This skill teaches you — the model — how to work *with* pi's constraints rather than against them.

---

## Core Principles

1. **Minimal tools** — You have 4 tools: `read`, `write`, `edit`, `bash`. That's all you need.
2. **YOLO by default** — No permission prompts. Full filesystem access. Assume the user knows what they're doing.
3. **Context is precious** — Be mindful of every token. Read full files when needed, not just fragments. Progressive disclosure: only load details on demand.
4. **Observability** — The user sees everything. No black boxes. Write plans and todos to files where the user can inspect, edit, and version them.
5. **Bash is the universal tool** — There is no web search, no fetch, no MCP. Use `curl`, CLI tools, and scripts. If a tool has a README, read it first, then use it.

---

## Sub-Agents

Pi has no built-in sub-agent tool. There are two approaches, in order of preference:

### ⚠️ First: check what's available

**If the `subagent` tool is in your tool list**, the `@mjakl/pi-subagent` extension is installed. Use it for all routine delegation — it's cleaner, shows streaming progress in TUI, and saves tokens.

**If the `subagent` tool is NOT in your tool list**, the extension is not installed. Tell the user:
> «Для делегирования задач помощникам рекомендую установить расширение: `pi install npm:@mjakl/pi-subagent`. Это даст streaming-прогресс в TUI и сэкономит токены. А пока — обойдёмся raw bash.»

Then fall back to the raw bash patterns below.

### The subagent tool (recommended for routine delegation)

The `@mjakl/pi-subagent` extension provides a first-class `subagent` tool:

```json
{ "agent": "explorer", "task": "Find all usages of the Auth class" }
```

Parallel tasks:
```json
{ "tasks": [
  { "agent": "reviewer", "task": "Review for bugs" },
  { "agent": "reviewer", "task": "Review for style" }
] }
```

Context modes:
- `"spawn"` (default) — child receives only the task. Best for isolated work.
- `"fork"` — child receives parent session context + task. Best for follow-up work.

Agents are Markdown files in `~/.pi/agent/agents/` or `.pi/agents/` with YAML frontmatter. The model can create agents on the fly with the `write` tool.

See the extension README for full details.

### Spawn another pi instance via bash

> **Note:** For routine delegation, prefer the `subagent` tool above. The raw bash approach below is for advanced isolation (git worktree), interactive steering (tmux send-keys), and scenarios where the extension is not available.

```bash
# One-shot sub-agent (print mode)
pi -p "Review the code in src/auth.ts for security issues"

# With a specific model and thinking level
pi --model sonnet:high -p "Analyze this architecture"

# Ephemeral (no session file)
pi --no-session -p "Quick analysis of foo.py"

# Include files in the sub-agent's context
pi -p "Review this" @src/auth.ts @README.md

# Pipe data in
cat build.log | pi -p "Find all errors in this build log"
```

### Real-world sub-agent recipes

Instead of long bash commands, define agents as Markdown files and call them with the `subagent` tool:

Create `~/.pi/agent/agents/security-auditor.md`:
```markdown
---
name: security-auditor
description: Finds security vulnerabilities: SQL injection, XSS, CSRF, auth bypass
model: anthropic/claude-sonnet-4:high
tools: read, grep, find
---
You are a senior security auditor. Check for: SQL injection, XSS, CSRF, auth bypass, path traversal, hardcoded secrets. Report each finding with file:line and severity.
```

Then call: `{ "agent": "security-auditor", "task": "Audit src/auth.ts" }`

Create `~/.pi/agent/agents/code-reviewer.md`:
```markdown
---
name: code-reviewer
description: Reviews code for bugs, style issues, and missing tests
model: anthropic/claude-sonnet-4:high
tools: read, grep
---
You are a thorough code reviewer. Look for: logic errors, edge cases, error handling gaps, test coverage, and code style. Be constructive.
```

Then call: `{ "agent": "code-reviewer", "task": "Review the diff in $(git diff main...HEAD)" }`

Create `~/.pi/agent/agents/test-engineer.md`:
```markdown
---
name: test-engineer
description: Writes comprehensive tests with vitest
model: deepseek/deepseek-v4-flash
tools: read, write, edit, bash
---
You are a test engineer. Write tests using vitest. Cover: happy paths, edge cases, error handling, and auth bypass attempts. Mock external dependencies.
```

Then call: `{ "agent": "test-engineer", "task": "Write comprehensive tests for src/auth.ts" }`

Create `~/.pi/agent/agents/architect.md`:
```markdown
---
name: architect
description: Explores codebase and produces implementation plans
model: deepseek/deepseek-v4-pro
tools: read, grep, find, ls, write, bash
---
You are a technical architect. First explore the codebase, then produce a detailed implementation plan in PLAN.md with steps, files to modify, and potential pitfalls.
```

Then call: `{ "agent": "architect", "task": "Explore this project and create a PLAN.md for adding OAuth support" }`

### Spawn pi inside tmux for full observability

Use the **keeper session pattern** — one persistent tmux session, each sub-agent in its own window.

```bash
# Step 1 (once): Create a keeper session that stays alive
tmux new-session -d -s keeper "while true; do sleep 60; done"

# Step 2: Launch sub-agents as windows inside keeper
# CRITICAL: always add '; sleep N' after pi to keep the window alive for capture
tmux new-window -t keeper -n code-review \
  "pi -p 'Review src/' --system-prompt 'You are a code reviewer...' 2>&1; sleep 60"

tmux new-window -t keeper -n security-audit \
  "pi -p 'Audit the codebase' --system-prompt 'You are a security auditor...' --tools read,grep,find -nc 2>&1; sleep 60"
```

The user can:
- `tmux attach -t keeper` — watch all sub-agents in real-time
- `tmux capture-pane -t keeper:code-review -p` — read output from main session
- `tmux send-keys -t keeper:code-review "steering message" Enter` — steer mid-flight
- `tmux kill-window -t keeper:code-review` — stop a sub-agent

See "Real-time monitoring via tmux" below for full monitoring patterns.

### When to use sub-agents

> **Prefer the `subagent` tool** for most delegation. The raw bash/tmux patterns below are for advanced isolation and interactive steering.

- **Code review** — Call the `code-reviewer` agent with the `subagent` tool
- **Security audit** — Call the `security-auditor` agent, read-only tools via agent frontmatter
- **Context gathering** — Do it in a *separate session first*, create an artifact (file), then use that artifact in the main session. Or use the `subagent` tool with `"mode": "spawn"`.
- **Test generation** — Call the `test-engineer` agent
- **Parallel work** — Avoid. Spawning multiple agents to implement features in parallel is an anti-pattern that leads to garbage code. Do one thing at a time.

### Practical sub-agent patterns (battle-tested)

These patterns are for advanced scenarios where raw bash/tmux is needed. For routine delegation, use the `subagent` tool instead.

#### Real-time monitoring via tmux (interactive steering)

When you need to watch or steer a sub-agent interactively, use tmux. The `subagent` tool handles routine output capture; tmux is for live interaction.

```bash
# Step 1 (once): Create a keeper session that stays alive
tmux new-session -d -s keeper "while true; do sleep 60; done"

# Step 2: Launch sub-agent in a new window
tmux new-window -t keeper -n my-task \
  "cd ~/project && pi -p 'Task' --no-session 2>&1; sleep 60"

# Monitor
tmux capture-pane -t keeper:my-task -p | tail -30

# Steer mid-flight
tmux send-keys -t keeper:my-task "Try a different approach" Enter

# Kill if needed
tmux kill-window -t keeper:my-task
```

The user can `tmux attach -t keeper` to watch live.

#### Safety net: tests as gate

After the sub-agent commits, run your test suite to catch regressions:

```bash
make test           # unit/E2E tests
# For CSS refactoring:
npx playwright test tests/e2e/visual.spec.ts  # visual regression
```

If tests fail, fix the issues manually or re-spawn with corrected instructions. The sub-agent + test cycle is the TDD loop for agent-driven work.

#### Review and fix before committing

Sub-agents produce working code but may miss project-specific details (API differences, framework conventions, path formats). Always review with git before committing:

```bash
git diff | head -100          # review changes
git checkout -- file.md        # revert individual files if needed
git add -p                     # stage selectively
```

Fix small issues yourself rather than re-spawning the sub-agent — it's faster and saves tokens.

#### Use cheaper models for routine tasks

For code generation, file creation, and straightforward editing tasks, use cheaper models. Set the model in the agent's YAML frontmatter:

```markdown
---
name: my-agent
model: deepseek/deepseek-v4-flash
tools: read, write, edit, bash
---
```

Reserve expensive models (claude-sonnet, gpt-4) for complex reasoning, architecture decisions, and code review.

### git worktree — isolated workspaces for sub-agents

Git worktrees let you check out multiple branches from the same repo into separate directories. Combine with pi sub-agents for clean isolation:

```bash
# Create a worktree for the sub-agent
git worktree add ../project-review feature/review-branch

# Run pi in that worktree — completely isolated from your main working copy
cd ../project-review && pi -p "Review the authentication module for security issues" \
  --system-prompt "You are a security auditor..." \
  --tools read,grep,find

# Sub-agent can create branches, commit, even push — all in the worktree
git worktree add ../project-fix feature/fix-auth
cd ../project-fix && pi -p "Fix the issues found in REVIEW.md"

# Clean up when done
git worktree remove ../project-review
git worktree remove ../project-fix
```

**Worktree patterns for pi**:

```bash
# PATTERN 1: Review → Fix in separate worktrees
git worktree add ../review main
cd ../review && pi -p "Audit the auth flow, write findings to REVIEW.md" --tools read,grep,find,write

# Read review, create fix worktree
git worktree add ../fix main
cd ../fix && pi -p "Fix issues from ../review/REVIEW.md" @../review/REVIEW.md

# Merge back when happy
cd ../fix && git push origin HEAD:fix/auth
git worktree remove ../review

# PATTERN 2: Experiment without fear
git worktree add ../experiment main
cd ../experiment && pi -p "Try rewriting the cache layer with a different approach"
# If it works → merge/push. If not → just remove the worktree, nothing lost.

# PATTERN 3: Multiple parallel explorations (when you really need them)
git worktree add ../approach-a main
git worktree add ../approach-b main
# Run pi in each, compare results, keep the better one
```

**Why worktrees fit pi's philosophy**:
- Isolation via the filesystem — no hidden state, no virtual envs
- Each worktree is a plain directory — inspect with `ls`, `cat`, any tool
- The main session can `read` files from worktree directories to review progress
- Clean teardown: `git worktree remove` — gone, no lingering processes
- Sub-agents can't step on each other's toes — separate working directories

**Important**: Spawning sub-agents mid-session for context gathering is a sign you didn't plan ahead. Gather context first in its own session, produce an artifact, then feed that to a fresh session. The artifact persists across sessions and features.

### Makefile — the missing orchestrator

The patterns above work but require remembering long command lines. **Make is the natural orchestrator for pi sub-agents** — it tracks dependencies between task files, data files, and result files. Change a task or source file, re-run `make`, and only stale tasks get re-executed. The Makefile itself becomes machine-readable documentation of your workflow.

```makefile
# Makefile for sub-agent workflows
SUB_MODEL := deepseek/deepseek-v4-flash   # cheap model for routine work
SUB_FLAGS := --tools read,write,edit,bash --no-session -nc -ns -ne

# Task file → Result file dependency
# $< = first prerequisite (task file), $@ = target (result file)
subs/results/review-auth.md: subs/tasks/review-auth.md src/auth.ts
	pi -p "Execute task from @$<. Write result to $@" \
		--model $(SUB_MODEL) $(SUB_FLAGS)

subs/results/analyze-eval.md: subs/tasks/analyze-eval.md subs/data/eval-calls.txt
	pi -p "Execute task from @$<. Write result to $@" \
		--model $(SUB_MODEL) $(SUB_FLAGS)

# Run everything
all-subs: subs/results/review-auth.md subs/results/analyze-eval.md

# Clean generated results
clean-subs:
	rm -f subs/results/*.md
```

**Why Make:**
- The Makefile **is** the documentation — no separate README needed
- Dependencies are explicit — if you change a task or source file, Make rebuilds
- No magic — just files, commands, and timestamps
- `make task-name` is a one-word launch command
- Works perfectly with git: commit the Makefile, ignore generated results (`subs/results/`, `subs/data/`)
- Combine with tmux for background monitoring:
  ```bash
  tmux new-window -t keeper -n sub-review "make subs/results/review-auth.md 2>&1; sleep 30"
  # Monitor:
  tmux capture-pane -t keeper:sub-review -p | tail -20
  ```

**Task file → result file convention:**

```
project/
├── subs/
│   ├── tasks/          # task descriptions (commit to git)
│   │   └── review-auth.md
│   ├── data/           # extracted/intermediate data (.gitignore)
│   │   └── eval-calls.txt
│   └── results/        # sub-agent outputs (.gitignore)
│       └── review-auth.md
└── Makefile
```

- **tasks/** — Human-written task descriptions. Tell the sub-agent: what to do, what files to read, what format to output. Commit to git.
- **data/** — Extracted data from external sources (e.g., session logs). Generated by scripts, consumed by sub-agents. In `.gitignore`.
- **results/** — Sub-agent outputs. Read by the main session. In `.gitignore`.

**Pre-extract data for sub-agents.** Don't make the sub-agent dig through external sources (APIs, session logs, databases). Write a script that extracts the data into `subs/data/`, then feed that file to the sub-agent. This keeps sub-agents focused on analysis, not data plumbing.

**Recommended models:**

| Model | Use case |
|-------|----------|
| `deepseek/deepseek-v4-flash` | Default sub-agent — fast, cheap, handles structured tasks |
| `deepseek/deepseek-v4-pro` | Complex reasoning or when flash produces poor output |
| `claude-sonnet-4` / `gpt-4o` | Security audit, critical review, design decisions |

Start with `deepseek-v4-flash` for all sub-agents. Only upgrade if the output is consistently wrong. Reserve expensive models for the main session where deep reasoning and context matter.

### One-shot vs Makefile — when to use each

> **Note:** For one-shot tasks, prefer the `subagent` tool. The raw `pi -p` approach below is for scenarios without the extension.

| Situation | Use |
|-----------|-----|
| Ad-hoc question, one-time | `subagent` tool or `pi -p "..." --model deepseek/deepseek-v4-flash $(SUB_FLAGS)` |
| Reusable task, may rerun | Put in Makefile with task file |
| Task with data dependencies | Makefile (tracks what changed) |
| Pipeline of 2+ sub-agent tasks | Makefile chain: `task2: task1 task2_data` |
| Exploratory/investigation | `pi -p "..." $(SUB_FLAGS)` — don't over-engineer |

**Make tracks WHEN to rerun. You decide IF the result is good.**

Don't build a review sub-agent to check another sub-agent — that's infinite recursion. Use git and your eyes:

```bash
git diff --stat              # what did the sub-agent change?
cat subs/results/task-01.md  # read the output
# → you decide: commit it / rework / supplement
```

Automate what's mechanical (extracting data, counting stats, re-running stale tasks). Leave quality judgments to humans.

### The main session IS the steering agent

You don't need a custom TypeScript orchestrator with a "steering agent" role. **The main pi session (you + the model) is the supervisor.** You monitor sub-agents via tmux, review their output, and decide: continue, redirect, or kill.

```bash
# Launch sub-agent in keeper session (keeper must already exist — see "Real-time monitoring")
tmux new-window -t keeper -n sub-css "cd ~/project && make task-css 2>&1; sleep 60"

# Monitor — see last 30 lines of output
tmux capture-pane -t keeper:sub-css -p | tail -30

# Intervene — send a steering message while sub-agent is running
tmux send-keys -t keeper:sub-css "Stop this approach and try using CSS Grid instead" Enter

# Kill if it goes off track
tmux kill-window -t keeper:sub-css

# Check which sub-agents are alive
tmux list-windows -t keeper

# Review result (sub-agent writes to a file)
cat subs/results/task-css.md
```

This beats custom orchestrators: zero code to maintain, full visibility through tmux's terminal output, and the ability to steer the sub-agent mid-flight with `send-keys`. No APIs, no RPC, no TypeScript — just the terminal.

---

## No Built-in To-Dos? Use TODO.md

Instead of built-in task tracking, write a `TODO.md` file:

```markdown
# TODO.md

- [x] Implement user authentication
- [x] Add database migrations
- [ ] Write API documentation
- [ ] Add rate limiting
- [ ] Add integration tests
```

- Read it to see what's pending
- Update it as you complete tasks
- The user can see and edit it anytime
- It's version-controlled alongside the code

File-based todos are external state — the model doesn't have to track state internally, reducing confusion.

---

## No Plan Mode? Use PLAN.md

Instead of an ephemeral plan mode, write plans to a file:

```markdown
# PLAN.md

## Goal
Refactor authentication system to support OAuth 2.0

## Approach
1. Research OAuth 2.0 flows
2. Design token storage schema
3. Implement authorization server endpoints
4. Update client-side login flow
5. Add tests

## Current Step
Working on step 3 — authorization endpoints

## Key Findings
- The existing auth module uses JWT, can extend it
- Token storage needs to support refresh tokens
```

- Plans persist across sessions
- Can be versioned with the code
- Full observability — user sees everything
- User can edit the plan collaboratively with you

If the user wants read-only planning/analysis, use `pi --tools read,grep,find,ls` for a session without write/bash access.

---

## No Background Bash? Use tmux.

Pi's bash tool runs commands synchronously. For long-running processes, use **tmux**:

```bash
# Start a dev server in a tmux session
tmux new-session -d -s devserver "npm run dev"

# Run tests in background
tmux new-window -n "tests" "npm test -- --watch"

# Send input to a running REPL
tmux send-keys -t mysession "some input" Enter

# Capture output from a tmux pane
tmux capture-pane -t mysession -p

# List all sessions
tmux list-sessions

# Kill a session
tmux kill-session -t mysession
```

This gives the user full observability — they can attach to the tmux session and interact directly. No hidden background processes that get lost after compaction.

---

## No MCP? Use CLI Tools + READMEs.

Instead of MCP servers that dump 10k+ tokens of tool descriptions into context, use:

1. **CLI tools with READMEs** — Read the README when needed (progressive disclosure), invoke via bash
2. **curl** for web requests
3. **Scripts** — Bash, Python, Node — whatever gets the job done

### mcporter — MCP when you really need it

If you absolutely must use MCP servers, pi has the **mcporter** tool. It wraps MCP servers as a discoverable CLI-like interface without dumping all tool descriptions into context upfront:

- `mcporter action="search" query="..."` — find tools across MCP servers
- `mcporter action="describe" selector="server.tool"` — get a tool's schema on demand
- `mcporter action="call" selector="server.tool" args="{...}"` — invoke a tool

This is progressive disclosure in action: search → describe → call. You only pay tokens for what you actually use.

mcporter bridge is installed as a pi extension (from npm package `@marcfargas/pi-mcporter`), which adds the `chrome-devtools` MCP server for browser automation and page inspection. Use it for: navigating to URLs, taking page snapshots, clicking elements, filling forms, evaluating JavaScript, taking screenshots, and more.

---

## Workflow Patterns

### Context Gathering
1. Start a separate pi session
2. Explore the codebase, read files, understand the architecture
3. Produce an artifact: `ARCHITECTURE.md`, `CONTEXT.md`, or notes
4. Start a fresh session for the actual work, feed it the artifact

### Code Review
```bash
pi -p "Review $(git diff main...HEAD) for bugs, security issues, and style problems"
```

Or use a prompt template (`/review`) that spawns a sub-agent.

### Task Tracking
- Before starting work, read `TODO.md` (if it exists)
- As you complete items, update the checkboxes
- Suggest creating `TODO.md` if the user has multiple tasks

---

## Summary

| Need | Pi Way | Not |
|------|--------|-----|
| Sub-agent | `subagent` tool + agent `.md` files (`@mjakl/pi-subagent`) | — |
| Sub-agent (raw) | `pi -p` + `--system-prompt` + `--tools` via bash/tmux | — |
| Sub-agent isolation | `git worktree` — separate directory per agent | Virtual sub-agent sandboxes |
| Planning | `PLAN.md` file | Built-in plan mode |
| Background process | `tmux` | Built-in background bash |
| External tool | CLI + README, `curl`, mcporter | MCP server dump in context |
| Browser/page | mcporter `chrome-devtools` | — |
| Context gathering | Separate session → artifact | Mid-session sub-agent |

**The meta-principle**: If pi doesn't have a feature, solve it with files and bash. The user sees everything. Nothing is hidden. That's the point.

**mcporter is the exception that proves the rule**: it wraps MCP servers behind progressive disclosure (search → describe → call), so you never dump 10k+ tokens of tool descriptions into context. Use it for browser DevTools, and discover other MCP servers only when needed.
