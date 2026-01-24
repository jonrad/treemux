# Pane Detection

## Overview

TreeMux detects Claude Code sessions running in other tmux panes using a polling-based approach. No hooks or persistent configuration are used - it queries tmux and process state on each poll interval.

## Why Not Use `pane_current_command`?

Two issues with relying on tmux's `#{pane_current_command}`:

1. **Claude sets its process title to the version number** (e.g., "2.1.19") instead of "claude"
2. **`pane_pid` is the first process in the pane** - often a shell, not Claude itself

## How It Works

### 1. Query Tmux for Pane Info

Every 1+ seconds, we run:

```bash
tmux list-panes -F '#{pane_index} #{pane_id} #{pane_pid} #{pane_current_path}'
```

### 2. Identify Current Pane

We use the `TMUX_PANE` environment variable to get the pane ID where TreeMux is running. This is more reliable than `tmux display-message` which returns the *active* pane.

### 3. Walk the Process Tree

For each pane (excluding current), we:

1. Get all processes: `ps -eo pid,ppid,args`
2. Check the pane's root PID and all its descendants
3. Look for Claude signatures in the command line args

### 4. Claude Detection Patterns

A process is identified as Claude if its args match:

```typescript
// Package paths
argsLower.includes("@anthropic/claude-code")
argsLower.includes("claude-code")

// Standalone "claude" command (not part of another word)
/(?:^|\/|\s)claude(?:\s|$)/.test(argsLower)
```

This matches:
- `claude`
- `/usr/bin/claude`
- `claude --flag`
- `node /path/to/@anthropic/claude-code/...`

But NOT:
- `claudette`
- `my-claude-thing`

## Cross-Platform

Uses `ps -eo pid,ppid,args` which works on both Linux and macOS (unlike `/proc` filesystem which is Linux-only).

## Example

```
Process tree in pane 0:
  986 (claude)           ← pane_pid, detected as Claude
    └── 1234 (zsh)       ← child shell for commands
        └── 5678 (node)  ← grandchild

Process tree in pane 1:
  2000 (zsh)             ← pane_pid, shell
    └── 2001 (claude)    ← child, detected as Claude
```

Both panes would be detected as Claude sessions.

## Session Summaries

For each detected Claude session, we also extract a summary from the transcript file:

1. Find transcript files in `~/.claude/projects/*/` modified in last 5 minutes
2. Match transcript to session by `cwd` field
3. Extract first meaningful user message (skipping system-generated ones)
4. Truncate to ~50 characters for display

The summary helps identify what each Claude session is working on.

## Limitations

- Only detects sessions in the **current tmux window**
- Polling-based (1+ second delay)
- Relies on "claude" appearing in the process args
- Cannot detect Claude in other tmux sessions/windows
- Summaries require transcript files to be accessible
