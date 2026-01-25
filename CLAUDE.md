# TreeMux

Terminal UI for git worktrees. TypeScript + React + Ink.

## Commands

```bash
pnpm build              # Compile TypeScript
pnpm start              # Run app (requires tmux)
pnpm watch              # Dev mode with tsx
```

## Validate Changes

Use snapshot mode to verify UI without tmux:
```bash
node dist/index.js --snapshot --root /path/to/repo
```

## Architecture

- `src/index.tsx` - Main React/Ink UI, all components, input handling
- `src/theme.ts` - Theme types and loading (6 built-in + custom JSON)
- `src/git.ts` - Git worktree operations via `git worktree list --porcelain`
- `src/tmux.ts` - Tmux pane management, Claude session detection via process tree walking
- `themes/` - Custom theme JSON files (partial overrides merge with defaults)
- `plugin/` - Claude Code plugin for session status indicators
- `.claude-plugin/marketplace.json` - Plugin marketplace manifest for distribution

## Plugin Installation

```bash
npx treemux --install-plugin   # Automatic
```

Or manually in Claude Code:
```
/plugin marketplace add jonrad/treemux
/plugin install session-tracker@treemux-plugins
```

## Key Patterns

- Config precedence: CLI args > config file > defaults
- Polling intervals: worktrees 500ms, git details 2s min, sessions 1s min
- Theme merging: custom themes inherit missing values from cyberpunk
- Process detection: cross-platform (Linux/macOS) via `ps -eo pid,ppid,args`

## Hooks

Run custom scripts before/after worktree add/remove. Hooks receive env vars:
- `TREEMUX_ACTION` - "add" or "remove"
- `TREEMUX_WORKTREE_NAME`, `TREEMUX_WORKTREE_PATH`, `TREEMUX_WORKTREE_BRANCH`
- `TREEMUX_ROOT`, `TREEMUX_COMMIT` (remove only)

Configure via CLI (`--hook-before-add`, etc.) or config file `hooks` object.

Add hooks run synchronously with a "WORKING" indicator - UI blocks until hooks complete.

## Gotchas

- Must run inside tmux (except with `--snapshot`)
- `.worktrees/` scripts must be sourced, not executed directly
- Plugin state files in `~/.claude/treemux/` expire after 2 minutes
