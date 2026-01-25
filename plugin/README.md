# TreeMux Session Tracker Plugin

A Claude Code plugin that tracks session state for TreeMux integration.

## Installation

Run Claude Code with the plugin:

```bash
claude --plugin-dir /path/to/treemux/plugin
```

Or add to your shell config:

```bash
alias claude='claude --plugin-dir /path/to/treemux/plugin'
```

## What It Does

The plugin uses Claude Code hooks to track session state changes:

- **SessionStart** - Session initialized
- **UserPromptSubmit** - User sent a message (session is "working")
- **Stop** - Claude finished responding (session is "waiting")
- **SessionEnd** - Session terminated (state file removed)

State is written to `~/.claude/treemux/<session_id>.json`:

```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "state": "waiting",
  "pane_id": "%1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

The `pane_id` field (from `$TMUX_PANE`) allows TreeMux to correctly match state to sessions even when multiple sessions run in the same directory.

## TreeMux Integration

When the plugin is installed, TreeMux displays a status indicator for each Claude session:

- **⏸ (yellow, flashing)** - Paused, waiting for your input (flashes for 5 seconds by default)
- **▶ (green)** - Active, Claude is responding

The flash duration is configurable via `--flash-duration <ms>` or `"flashDuration"` in config. Set to 0 to flash forever.

If the plugin is not installed, no status indicator is shown.
