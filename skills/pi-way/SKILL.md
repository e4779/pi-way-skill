---
name: pi-way
description: The pi philosophy — less is more, Unix-way, no sub-agents, no built-in tasks/plan mode. Use bash, tmux, TODO.md, PLAN.md, and file-based artifacts instead. Use when the user asks about sub-agents, task tracking, planning, background processes, or wants to understand how to work the pi way.
---

# The Pi Way

Pi is a minimal, opinionated coding agent harness built by Mario Zechner. Its philosophy: **less is more**, **context engineering is paramount**, and **bash is the universal interface**.

This skill implements patterns for working _with_ pi's constraints. See README.md for context, sources, and philosophy references.

This skill teaches you — the model — how to work *with* pi's constraints rather than against them.

---

## Core Principles

1. **Minimal tools** — You have 4 tools: `read`, `write`, `edit`, `bash`. That's all you need.
2. **YOLO by default** — No permission prompts. Full filesystem access. Assume the user knows what they're doing.
3. **Context is precious** — Be mindful of every token. Read full files when needed, not just fragments. Progressive disclosure: only load details on demand.
4. **Observability** — The user sees everything. No black boxes. Write plans and todos to files where the user can inspect, edit, and version them.
5. **Bash is the universal tool** — There is no web search, no fetch, no MCP. Use `curl`, CLI tools, and scripts. If a tool has a README, read it first, then use it.

---

## No Sub-Agents? No Problem.

Pi has no built-in sub-agent tool. Here's how to achieve the same thing, better:

### Spawn another pi instance via bash

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

### Custom system prompt for the sub-agent

The sub-agent is a full pi instance. You can completely change its persona and capabilities:

```bash
# Replace the default coding agent system prompt entirely
pi -p "Analyze this codebase" \
  --system-prompt "You are a senior security auditor. Focus on OWASP Top 10 vulnerabilities, injection attacks, and auth bypasses. Be thorough and skeptical."

# Append instructions to the default system prompt (repeatable)
pi -p "Review PR" \
  --append-system-prompt "Focus on performance and memory leaks" \
  --append-system-prompt "Also check for i18n issues"

# Strip everything — pure model, no AGENTS.md, no skills, no extensions
pi -p "Summarize this text" \
  --system-prompt "You are a helpful assistant. Be concise." \
  -nc -ns -ne
```

### Restrict the sub-agent's tools

```bash
# Read-only sub-agent (analyze without modifying)
pi -p "Audit the authentication flow" --tools read,grep,find,ls

# Pure chat — no tools at all
pi -p "Brainstorm architecture ideas" --no-tools

# Only bash — for script automation
pi -p "Run the test suite and report" --tools bash

# Custom toolset — read + bash, no write/edit
pi -p "Investigate the bug" --tools read,bash
```

### Real-world sub-agent recipes

Mario's own use case: code review via a slash command that spawns a sub-agent. From the blog post:

```markdown
# ~/.pi/agent/prompts/review.md
---
description: Run a code review sub-agent
---
Spawn yourself as a sub-agent via bash to do a code review: $@
Use `pi --print` with appropriate arguments.
Pass a prompt to the sub-agent asking it to review the code for:
- Bugs and logic errors
- Security issues
- Error handling gaps
Do not read the code yourself. Let the sub-agent do that.
Report the sub-agent's findings.
```

Then use via `/review src/auth.ts` — the main agent spawns a sub-agent, gets the review, reports findings. Full observability of the output.

More recipes:

```bash
# SECURITY AUDITOR: custom persona, read-only, no context files
pi -p "Find vulnerabilities in $(ls src/**/*.ts)" \
  --system-prompt "You are a senior security auditor. Check for: SQL injection, XSS, CSRF, auth bypass, path traversal, hardcoded secrets. Report each finding with file:line and severity." \
  --tools read,grep,find \
  -nc -ns

# CODE REVIEWER: reviews a git diff
pi -p "Review this diff for bugs, style issues, and missing tests" \
  --system-prompt "You are a thorough code reviewer. Look for: logic errors, edge cases, error handling gaps, test coverage, and code style. Be constructive." \
  --tools read,grep \
  @<(git diff main...HEAD)

# TEST GENERATOR: writes tests for a module
pi -p "Write comprehensive tests for src/auth.ts" \
  --system-prompt "You are a test engineer. Write tests using vitest. Cover: happy paths, edge cases, error handling, and auth bypass attempts. Mock external dependencies." \
  --tools read,write,edit,bash \
  -nc

# PLANNER: explores codebase and produces PLAN.md
pi -p "Explore this project and create a PLAN.md for adding OAuth support" \
  --system-prompt "You are a technical architect. First explore the codebase, then produce a detailed implementation plan in PLAN.md with steps, files to modify, and potential pitfalls." \
  --tools read,grep,find,ls,write,bash \
  -nc -ns
```

### Spawn pi inside tmux for full observability

```bash
# Start a sub-agent in a tmux window (user can attach and watch)
tmux new-window -n "code-review" "pi -p 'Review src/ for bugs' --system-prompt 'You are a code reviewer...'"

# Detached tmux session — runs in background, user can attach later
tmux new-session -d -s security-audit \
  "pi -p 'Audit the codebase' --system-prompt 'You are a security auditor...' --tools read,grep,find -nc"
```

The user can:
- `tmux attach -t security-audit` — watch in real-time
- `tmux capture-pane -t security-audit -p` — read the output
- `tmux kill-session -t security-audit` — stop it

### When to use sub-agents

- **Code review** — Spawn pi with a reviewer persona, read-only tools
- **Security audit** — Custom system prompt, strict toolset
- **Context gathering** — Do it in a *separate session first*, create an artifact (file), then use that artifact in the main session
- **Test generation** — Write tests for a module with a test-engineer persona
- **Parallel work** — **Anti-pattern.** Mario: *"Spawning multiple sub-agents to implement various features in parallel is an anti-pattern in my book and doesn't work, unless you don't care if your codebase devolves into a pile of garbage."* Do one thing at a time.

### Practical sub-agent patterns (battle-tested)

These patterns come from real-world use of pi sub-agents for project work — launching, monitoring, and cleaning up.

#### Background execution with log capture

Pi in print mode (`-p`) outputs to stdout. When backgrounding, use `tee` — direct file redirection fails because pi detects non-TTY stdout. **However, even `tee` output is often buffered/empty.** The log is an auxiliary tool — git monitoring (below) is the primary method.

```bash
# CORRECT syntax, but log may be empty — use git monitoring instead
cd ~/project && pi -p "Implement feature X" \
  --model deepseek/deepseek-v4-flash --no-session -nc -ns -ne \
  2>&1 | tee /tmp/pi-task.log &

# WRONG: log stays empty
pi -p "Task" > /tmp/log 2>&1 &

# When to check the log (if it has content):
tail -f /tmp/pi-task.log 2>/dev/null || echo "log empty — use 'git status --short'"
```

#### Real-time monitoring via tmux (RECOMMENDED)

Start the sub-agent in a detached tmux session — full terminal output with NO buffering. The main session can peek via `capture-pane`, and the user can attach to watch live:

```bash
# Start sub-agent in detached tmux window
tmux new-session -d -s sub-css "cd ~/project && pi --model deepseek/deepseek-v4-flash --no-session -nc -ns -ne -p 'Refactor CSS'"

# Monitor from main session — see the last 30 lines of output
tmux capture-pane -t sub-css -p | tail -30

# Continuous watch (updates every 5s)
watch -n 5 "tmux capture-pane -t sub-css -p | tail -20"

# Check if session is still running
tmux has-session -t sub-css 2>/dev/null && echo "Running" || echo "Finished"

# User can attach to watch live or interact
tmux attach -t sub-css
# (Ctrl+B D to detach, Ctrl+C to stop the agent)
```

**Why tmux beats file logging:**
- Zero buffering — every line of output is immediately visible
- User can attach/detach anytime for live control
- Survives terminal disconnects (the session keeps running)
- `capture-pane` lets the main agent read the sub-agent's output
- No need to parse log files — it's just the terminal

#### Git polling loop (file-based fallback)

When tmux isn't available, use file-based git polling. **Log capture via `tee` is unreliable** — output buffers, TTY detection varies, the log is often empty. Git monitoring is the ground truth for file changes, even if you can't see the agent's output:

```bash
# Check every 30s
git status --short        # what files changed?
git diff --stat           # how many lines?
git diff | head -50       # peek at the changes
```

#### Git polling loop (automated)

```bash
# Launch sub-agent
cd ~/project && pi --model deepseek/deepseek-v4-flash --no-session -nc -ns -ne \
  -p "Task description" 2>&1 | tee /tmp/pi-task.log &
SUBPID=$!

# Poll every 30s, auto-kill after 5 min of no changes
last_change=$(date +%s)
while kill -0 $SUBPID 2>/dev/null; do
  sleep 30
  if [ -n "$(git status --short)" ]; then
    echo "[$(date +%H:%M)] Files changed:"
    git diff --stat
    last_change=$(date +%s)
  fi
  if [ $(($(date +%s) - last_change)) -gt 300 ]; then
    echo "[$(date +%H:%M)] No changes for 5 min — killing"
    kill $SUBPID 2>/dev/null
    break
  fi
done
git diff
```

#### Safety net: tests as gate

After the sub-agent commits, run your test suite to catch regressions:

```bash
make test           # unit/E2E tests
# For CSS refactoring:
npx playwright test tests/e2e/visual.spec.ts  # visual regression
```

If tests fail, fix the issues manually or re-spawn with corrected instructions. The sub-agent + test cycle is the TDD loop for agent-driven work.

#### Kill old sub-agents before launching new ones

A running sub-agent will keep overwriting files. Always clean up before spawning a new one:

```bash
# Kill all background pi processes matching a pattern
pkill -f "pi.*translate\|pi.*backlinks" 2>/dev/null

# Or kill by process tree
ps aux | grep " pi " | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null

# Verify they're gone
ps aux | grep " pi " | grep -v grep
```

#### Review and fix before committing

Sub-agents produce working code but may miss project-specific details (API differences, framework conventions, path formats). Always review with git before committing:

```bash
git diff | head -100          # review changes
git checkout -- file.md        # revert individual files if needed
git add -p                     # stage selectively
```

Fix small issues yourself rather than re-spawning the sub-agent — it's faster and saves tokens.

#### Use cheaper models for routine tasks

For code generation, file creation, and straightforward editing tasks, use cheaper models:

```bash
# deepseek-v4-flash is the default sub-agent model — fast and cheap
pi --model deepseek/deepseek-v4-flash -p "Create a script that..." -nc -ns -ne

# Upgrade only if the output quality is consistently poor
pi --model deepseek/deepseek-v4-pro -p "Complex refactoring..." -nc -ns -ne
```

Reserve expensive models (claude-sonnet, gpt-4) for complex reasoning, architecture decisions, and code review.

#### Full lifecycle (with git polling)

```bash
# 1. Kill old sub-agents
pkill -f "pi.*keyword" 2>/dev/null; sleep 1

# 2. Ensure clean state
cd ~/project && git stash  # save any uncommitted work

# 3. Launch sub-agent
pi --model deepseek/deepseek-v4-flash --no-session -nc -ns -ne \
  -p "Create a feature. Read existing code first. Use read/write/edit/bash." \
  2>&1 | tee /tmp/pi-task.log &
SUBPID=$!

# 4. Poll every 30s
sleep 30 && git status --short && git diff --stat
sleep 30 && git status --short
# ... repeat until sub-agent finishes or commits

# 5. Check if it committed
if git log --oneline -1 | grep -q "refactor\|feat\|fix"; then
  echo "Sub-agent committed — run tests now"
  make test
fi

# 6. If stuck, kill and review manually
kill $SUBPID 2>/dev/null
git diff | head -100
# Fix issues, then commit yourself
```

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

**Important**: Spawning sub-agents mid-session for context gathering is a sign you didn't plan ahead. Mario: *"If you need to gather context, do that first in its own session. Create an artifact that you can later use in a fresh session to give your agent all the context it needs without polluting its context window with tool outputs. That artifact can be useful for the next feature too."*

The artifact pattern:
1. Session A — explore, gather context, produce ARTIFACT.md
2. Session B — read ARTIFACT.md, do the actual work

The artifact persists across sessions and features.

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
  tmux new-session -d -s sub-review "make subs/results/review-auth.md"
  watch -n 5 "tmux capture-pane -t sub-review -p | tail -20"
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

| Situation | Use |
|-----------|-----|
| Ad-hoc question, one-time | `pi -p "..." --model deepseek/deepseek-v4-flash $(SUB_FLAGS)` |
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
# Launch sub-agent in background tmux
tmux new-session -d -s sub-css "cd ~/project && make task-css"

# Monitor — see last 30 lines of output
tmux capture-pane -t sub-css -p | tail -30

# Continuous watch (updates every 5s)
watch -n 5 "tmux capture-pane -t sub-css -p | tail -20"

# Intervene — send a steering message while sub-agent is running
tmux send-keys -t sub-css "Stop this approach and try using CSS Grid instead" Enter

# Kill if it goes off track
tmux kill-session -t sub-css

# Check if still running
tmux has-session -t sub-css 2>/dev/null && echo "Running" || echo "Finished"

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
| Sub-agent | `pi -p` + `--system-prompt` + `--tools`, via bash or tmux | Built-in sub-agent tool |
| Sub-agent isolation | `git worktree` — separate directory per agent | Virtual sub-agent sandboxes |
| Planning | `PLAN.md` file | Built-in plan mode |
| Background process | `tmux` | Built-in background bash |
| External tool | CLI + README, `curl`, mcporter | MCP server dump in context |
| Browser/page | mcporter `chrome-devtools` | — |
| Context gathering | Separate session → artifact | Mid-session sub-agent |

**The meta-principle**: If pi doesn't have a feature, solve it with files and bash. The user sees everything. Nothing is hidden. That's the point.

**mcporter is the exception that proves the rule**: it wraps MCP servers behind progressive disclosure (search → describe → call), so you never dump 10k+ tokens of tool descriptions into context. Use it for browser DevTools, and discover other MCP servers only when needed.
