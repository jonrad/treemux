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

## Keybindings

- `↑/k` - Move up
- `↓/j` - Move down
- `a` - Add new worktree (prompts for name)
- `r` - Remove selected worktree
- `q` - Quit

## Structure

- `src/index.tsx` - React/Ink UI components
- `src/git.ts` - Git backend (worktree listing)
- `dist/` - Compiled output
- `.worktrees/` - Worktree management scripts (source these, don't execute directly)
