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

## Structure

- `src/` - React/Ink components (TSX)
- `dist/` - Compiled output
- `.worktrees/` - Worktree management scripts (source these, don't execute directly)
