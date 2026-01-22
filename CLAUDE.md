# worktrees-tui

Terminal UI for git worktrees built with TypeScript, React, and Ink.

## Commands

- `pnpm build` - Compile TypeScript
- `pnpm dev` - Watch mode (tsc)
- `pnpm watch` - Watch mode with tsx (runs directly)
- `pnpm start` - Run the app
- `pnpm start -- --root <path>` - Run with custom root directory

## CLI Options

- `-r, --root <path>` - Root directory for worktrees (validates path exists)
- `-p, --poll <ms>` - Polling interval in milliseconds (default: 500, 0 to disable)
- `-w, --worktrees-dir <path>` - Directory for new worktrees (default: .worktrees)

All CLI options can also be specified in a config file. CLI args override config file values.

## Config File

Uses cosmiconfig - searches for config in these locations:
- `package.json` (`"worktrees-tui"` key)
- `.worktrees-tuirc` / `.worktrees-tuirc.json`
- `worktrees-tui.config.js`

Example `.worktrees-tuirc.json`:
```json
{
  "root": "/path/to/repo",
  "poll": "1000",
  "worktreesDir": ".worktrees"
}
```

## Keybindings

- `↑/k` - Move up
- `↓/j` - Move down
- `a` - Add new worktree (prompts for name)
- `r` - Remove selected worktree
- `0-9` - Send cd to tmux pane (requires tmux)
- `g` - Go to last pane that received cd
- `q` - Show tmux pane numbers
- `Ctrl+C` - Quit

## Structure

- `src/index.tsx` - React/Ink UI components
- `src/git.ts` - Git backend (worktree listing)
- `src/tmux.ts` - Tmux integration (pane detection, send-keys)
- `dist/` - Compiled output
- `.worktrees/` - Worktree management scripts (source these, don't execute directly)

## References

- `docs/worktree.md` - Git worktree command reference
- `docs/tmux.md` - Tmux integration reference
