# worktrees-tui

A terminal user interface for managing Git worktrees, built with TypeScript, React, and Ink.

## Features

- Interactive list of all Git worktrees with branch and commit info
- Keyboard navigation with arrow keys or vim-style (j/k) bindings
- Custom root directory support for remote worktree management
- Shell scripts for creating and merging worktrees

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### TUI Application

```bash
# Run in current directory
pnpm start

# Run with custom root directory
pnpm start -- --root /path/to/repo
```

**Keyboard Controls:**
- `↑` / `k` - Move up
- `↓` / `j` - Move down
- `a` - Add new worktree
- `r` - Remove selected worktree
- `q` / `Ctrl+C` - Quit

### CLI Options

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to config file (overrides default search locations) |
| `-r, --root <path>` | Root directory for worktrees (must exist) |
| `-p, --poll <ms>` | Polling interval in milliseconds (default: 500, 0 to disable) |
| `-w, --worktrees-dir <path>` | Directory name for new worktrees (default: .worktrees) |
| `-s, --sort <order>` | Sort order: recent or branch (default: recent) |
| `-d, --details` / `--no-details` | Show/hide git details (default: true) |
| `-t, --theme <name\|path>` | Theme name or path to JSON file (default: cyberpunk) |

### Shell Scripts

The `.worktrees/` directory contains helper scripts that must be **sourced** (not executed):

```bash
# Create a new worktree and cd into it
source .worktrees/worktree-add.sh my-feature

# Merge current worktree back to main and clean up
source .worktrees/worktree-merge.sh

# Merge a specific worktree
source .worktrees/worktree-merge.sh my-feature
```

## Development

```bash
pnpm dev      # Watch mode (tsc)
pnpm watch    # Watch mode with tsx (runs directly)
pnpm build    # Compile TypeScript
pnpm start    # Run the app
```

## Project Structure

```
├── src/
│   ├── index.tsx         # Main React/Ink application
│   └── git.ts            # Git backend (worktree listing)
├── dist/                 # Compiled output
├── .worktrees/
│   ├── worktree-add.sh   # Create new worktrees
│   └── worktree-merge.sh # Merge and remove worktrees
└── package.json
```

## Requirements

- Node.js >= 18
- pnpm
- Git
- tmux (must be run inside a tmux session)

## License

MIT
