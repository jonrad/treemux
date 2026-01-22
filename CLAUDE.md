# TreeMux

Terminal UI for git worktrees built with TypeScript, React, and Ink. Features a themeable interface with multiple built-in themes.

## Commands

- `pnpm build` - Compile TypeScript
- `pnpm dev` - Watch mode (tsc)
- `pnpm watch` - Watch mode with tsx (runs directly)
- `pnpm start` - Run the app
- `pnpm start -- --root <path>` - Run with custom root directory

## CLI Options

- `-c, --config <path>` - Path to config file (overrides default search locations)
- `-r, --root <path>` - Root directory for worktrees (validates path exists)
- `-p, --poll <ms>` - Polling interval in milliseconds (default: 500, 0 to disable)
- `-w, --worktrees-dir <path>` - Directory for new worktrees (default: .worktrees)
- `-s, --sort <order>` - Sort order: recent or branch (default: recent)
- `-d, --details` / `--no-details` - Show/hide git details (default: true)
- `-t, --theme <name|path>` - Theme name or path to JSON file (default: cyberpunk)

All CLI options (except `--config`) can also be specified in a config file. CLI args override config file values.

## Config File

Uses cosmiconfig - searches for config in these locations:
- `package.json` (`"treemux"` key)
- `.treemuxrc` / `.treemuxrc.json`
- `treemux.config.js`

Example `.treemuxrc.json`:
```json
{
  "root": "/path/to/repo",
  "poll": "1000",
  "worktreesDir": ".worktrees",
  "sort": "recent",
  "details": true,
  "theme": "cyberpunk"
}
```

## Keybindings

- `↑/k` - Move up
- `↓/j` - Move down
- `a` - Add new worktree (prompts for name)
- `r` - Remove selected worktree
- `s` - Toggle sort order (recent/branch)
- `t` - Open theme picker
- `0-9` - Send cd to tmux pane (remembered per worktree)
- `g` - Go to pane for selected worktree (uses history or detects by cwd)
- `q` - Show tmux pane numbers
- `<` - Move current pane to leftmost (full height, preserves width)
- `>` - Move current pane to rightmost (full height, preserves width)
- `Ctrl+C` - Quit

## Themes

Built-in themes: cyberpunk, monochrome, ocean, forest, sunset, minimal

Custom themes can be added as JSON files in the `themes/` directory. See existing themes for format.

## Structure

- `src/index.tsx` - React/Ink UI components
- `src/theme.ts` - Theme system (types, built-in themes, loading)
- `src/git.ts` - Git backend (worktree listing)
- `src/tmux.ts` - Tmux integration (pane detection, send-keys)
- `themes/` - Custom theme JSON files
- `dist/` - Compiled output
- `.worktrees/` - Worktree management scripts (source these, don't execute directly)

## References

- `docs/worktree.md` - Git worktree command reference
- `docs/tmux.md` - Tmux integration reference
