/**
 * pi-way extension — injects pi-way principles into the system prompt.
 *
 * Uses the before_agent_start hook to append principles to every session's
 * system prompt. No symlinks, no directory convention — just a clean event hook.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PI_WAY_PRINCIPLES = `## Pi-way principles

- **Context is precious.** Progressive disclosure — load details only on demand.
- **Observability.** Write plans, todos, tracking to files (PLAN.md, TODO.md). User sees everything.
- **Explore your tools.** You have mcporter (search→describe→call), Agent (sub-agents), extension tools. Always describe mcporter tools before calling them.
- **Sub-agents via Agent tool.** Delegate to specialized agents (rust-coder, researcher, Explore, etc.) for routine work. Use \`run_in_background: true\` for parallel work.
- **Make is your orchestrator.** Data flows through recipes — make tracks dependencies, only stale tasks re-run.
- **tmux for background processes.** Dev servers, watch mode — not hidden background bash.
- **No MCP dumps.** CLI tools + README-driven discovery. mcporter for MCP when needed.`;

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event, _ctx) => {
    return {
      systemPrompt: event.systemPrompt + "\n\n" + PI_WAY_PRINCIPLES,
    };
  });
}
