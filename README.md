# TreeMux

A themeable terminal UI for git worktrees built with TypeScript, React, and Ink.

Navigate branches like directories. Teleport between contexts. Stay in flow.

## What is this?

Git worktrees let you check out multiple branches simultaneously in separate directories. TreeMux gives you a TUI to manage them with tmux integration that remembers which pane goes with which worktree.

It also detects Claude Code sessions running in other tmux panes, letting you see what each session is working on and jump to them instantly.

## Quick Start

```bash
pnpm install
pnpm build
pnpm start -- --root /path/to/repo
```

**Requirements:** Node.js >= 18, Git, tmux (must run inside a tmux session)

## Keybindings

### Navigation
- `↑` / `k` - Move up (seamlessly moves between branches and sessions)
- `↓` / `j` - Move down
- `Tab` - Switch focus between branches and sessions sections

### Branch Commands (when branches focused)
- `a` - Add new worktree (prompts for branch name)
- `r` - Remove selected worktree
- `s` - Toggle sort order (recent/branch)
- `0-9` - Send cd command to tmux pane N (remembered per worktree)
- `g` - Go to worktree's pane (uses history or detects by cwd)

### Session Commands (when sessions focused)
- `g` / `Enter` - Jump to selected session's pane

### Global
- `t` - Open theme picker
- `q` - Show tmux pane numbers
- `<` - Move current pane to leftmost (full height)
- `>` - Move current pane to rightmost (full height)
- `Space` - Toggle pane width (minimize/restore)
- `Ctrl+C` - Quit

## Claude Code Integration

TreeMux automatically detects Claude Code sessions running in other tmux panes:

- Shows pane number, working directory, and session summary
- Summary extracted from first user message in transcript
- Navigate seamlessly with `j`/`k` between branches and sessions
- Press `g` or `Enter` to jump to a session's pane

### Session Status Plugin (Optional)

Install the TreeMux plugin to show live session status indicators:

**Option 1: Automatic installation (if you have npx/treemux installed)**
```bash
npx treemux --install-plugin
```

**Option 2: Manual installation via Claude Code**
```
/plugin marketplace add jonrad/treemux
/plugin install session-tracker@treemux-plugins
```

With the plugin installed:
- **Paused indicator (yellow, flashing)** - Waiting for your input
- **Active indicator (green)** - Claude is responding

See `plugin/README.md` for details.

## Themes

Six built-in themes:

| Theme | Description |
|-------|-------------|
| `cyberpunk` | Neon pink & cyan on dark |
| `ocean` | Deep blues and teals |
| `forest` | Earthy greens (default) |
| `sunset` | Warm oranges and purples |
| `monochrome` | Classic terminal aesthetic |
| `minimal` | Clean and understated |

Press `t` to open the theme picker, or set via CLI:

```bash
pnpm start -- --theme ocean
```

Custom themes can be added as JSON files in the `themes/` directory.

## CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `-c, --config <path>` | Custom config file path | auto-detected |
| `-r, --root <path>` | Repository root directory | current dir |
| `-p, --poll <ms>` | Refresh interval (0 to disable) | `500` |
| `-w, --worktrees-dir <path>` | Directory for new worktrees | `.worktrees` |
| `-s, --sort <order>` | Sort by `recent` or `branch` | `recent` |
| `-d, --details` / `--no-details` | Show/hide git details | `true` |
| `-t, --theme <name\|path>` | Theme name or JSON path | `forest` |
| `--flash-duration <ms>` | Session waiting indicator flash (0 = forever) | `5000` |
| `--snapshot` | Render once and exit (non-interactive) | off |
| `--install-plugin` | Install the Claude Code session tracker plugin | - |
| `--hook-before-add <script>` | Script to run before adding a worktree | - |
| `--hook-after-add <script>` | Script to run after adding a worktree | - |
| `--hook-before-remove <script>` | Script to run before removing a worktree | - |
| `--hook-after-remove <script>` | Script to run after removing a worktree | - |

## Config File

Uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig). Create any of:

- `.treemuxrc.json`
- `.treemuxrc`
- `treemux.config.js`
- `package.json` with `"treemux": { ... }`

```json
{
  "root": "/path/to/repo",
  "poll": "1000",
  "worktreesDir": ".worktrees",
  "sort": "recent",
  "details": true,
  "theme": "forest",
  "flashDuration": "5000",
  "hooks": {
    "afterAdd": "/path/to/setup-worktree.sh"
  }
}
```

CLI arguments override config file values.

## Hooks

Run custom scripts before/after worktree add and remove operations. Useful for setting up dependencies, running migrations, or cleaning up resources.

**Available hooks:**
- `beforeAdd` / `afterAdd` - Run before/after creating a worktree
- `beforeRemove` / `afterRemove` - Run before/after removing a worktree

**Environment variables passed to hooks:**
| Variable | Description |
|----------|-------------|
| `TREEMUX_ACTION` | `"add"` or `"remove"` |
| `TREEMUX_WORKTREE_NAME` | Name of the worktree |
| `TREEMUX_WORKTREE_PATH` | Full filesystem path |
| `TREEMUX_WORKTREE_BRANCH` | Branch name |
| `TREEMUX_ROOT` | Repository root directory |
| `TREEMUX_COMMIT` | Commit hash (remove only) |

**Example hook** (`setup-worktree.sh`):
```bash
#!/bin/bash
cd "$TREEMUX_WORKTREE_PATH"
npm install
cp .env.example .env
```

**Behavior:**
- If a "before" hook fails (non-zero exit), the action is aborted
- If an "after" hook fails, the action completes but an error is shown

## Snapshot Mode

For automation, testing, or AI-assisted development:

```bash
pnpm start -- --snapshot --root /path/to/repo
```

Renders the UI once and exits. Bypasses the tmux requirement.

## Project Structure

```
src/
├── index.tsx    # React/Ink UI components and CLI
├── git.ts       # Git worktree operations
├── theme.ts     # Theme system and built-in themes
└── tmux.ts      # Tmux integration and Claude session detection

themes/          # Custom theme JSON files
plugin/          # Claude Code session status plugin
.worktrees/      # Shell helper scripts (source these, don't execute)
```

## Development

```bash
pnpm dev      # tsc watch mode
pnpm watch    # tsx watch mode (runs directly)
pnpm build    # compile TypeScript
pnpm start    # run the app
```

## License

MIT
