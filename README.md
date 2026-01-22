```
████████╗██████╗ ███████╗███████╗███╗   ███╗██╗   ██╗██╗  ██╗
╚══██╔══╝██╔══██╗██╔════╝██╔════╝████╗ ████║██║   ██║╚██╗██╔╝
   ██║   ██████╔╝█████╗  █████╗  ██╔████╔██║██║   ██║ ╚███╔╝
   ██║   ██╔══██╗██╔══╝  ██╔══╝  ██║╚██╔╝██║██║   ██║ ██╔██╗
   ██║   ██║  ██║███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██╔╝ ██╗
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝
```

<div align="center">

> [!CAUTION]
> 🛑 **STOP** — This entire document is basically hallucinated. Don't trust anything you read.

**A themeable terminal UI for git worktrees**

*Navigate branches like directories. Teleport between contexts. Stay in flow.*

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Ink](https://img.shields.io/badge/Ink-000000?style=flat&logo=npm&logoColor=white)](https://github.com/vadimdemedes/ink)

</div>

---

## ✦ What is this?

Git worktrees let you check out multiple branches simultaneously in separate directories. **TreeMux** gives you a slick TUI to manage them - with tmux integration that remembers which pane goes with which worktree.

```
┌─────────────────────────────────────────────────────────────┐
│  TREEMUX                                    cyberpunk theme │
├─────────────────────────────────────────────────────────────┤
│  ▸ main            a1b2c3d  feat: add dark mode      2h ago │
│    feature/auth    e4f5g6h  wip: oauth flow          1d ago │
│    bugfix/crash    i7j8k9l  fix: null check          3d ago │
│    experiment      m0n1o2p  trying things            1w ago │
└─────────────────────────────────────────────────────────────┘
     [j/k] navigate   [0-9] cd to pane   [g] go to pane
```

## ⚡ Quick Start

```bash
pnpm install
pnpm build
pnpm start
```

Or with options:

```bash
pnpm start -- --root /path/to/repo --theme ocean
```

## ⌨ Keybindings

```
 Navigation                    Actions                      Tmux
╭────────────────────────────╮╭────────────────────────────╮╭────────────────────────────╮
│  ↑ k    move up            ││  a       add worktree      ││  0-9   cd to pane N        │
│  ↓ j    move down          ││  r       remove worktree   ││  g     go to worktree pane │
│                            ││  s       toggle sort       ││  q     show pane numbers   │
│                            ││  t       theme picker      ││  < >   move pane left/right│
╰────────────────────────────╯╰────────────────────────────╯╰────────────────────────────╯
                                    Ctrl+C to quit
```

## 🎨 Themes

Six built-in themes to match your vibe:

| Theme | Description |
|-------|-------------|
| `cyberpunk` | Neon pink & cyan on dark *(default)* |
| `ocean` | Deep blues and teals |
| `forest` | Earthy greens |
| `sunset` | Warm oranges and purples |
| `monochrome` | Classic terminal aesthetic |
| `minimal` | Clean and understated |

Press `t` to open the theme picker, or set via CLI:

```bash
pnpm start -- --theme forest
```

Custom themes go in `themes/` as JSON files.

## ⚙ Configuration

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `-c, --config <path>` | Custom config file path | *auto-detected* |
| `-r, --root <path>` | Repository root directory | *current dir* |
| `-p, --poll <ms>` | Refresh interval (0 to disable) | `500` |
| `-w, --worktrees-dir <path>` | Directory for new worktrees | `.worktrees` |
| `-s, --sort <order>` | Sort by `recent` or `branch` | `recent` |
| `-d, --details` | Show git details | `true` |
| `-t, --theme <name>` | Theme name or JSON path | `cyberpunk` |

### Config File

Uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig). Create any of:

- `.treemuxrc.json`
- `.treemuxrc`
- `treemux.config.js`
- `package.json` → `"treemux": { ... }`

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

CLI args override config file values.

## 📁 Project Structure

```
src/
├── index.tsx    ─── React/Ink UI components
├── git.ts       ─── Git worktree operations
├── theme.ts     ─── Theme system & built-ins
└── tmux.ts      ─── Tmux pane integration

themes/          ─── Custom theme JSON files
.worktrees/      ─── Shell helper scripts (source these!)
```

## 🐚 Shell Scripts

Helper scripts in `.worktrees/` must be **sourced**, not executed:

```bash
# Create worktree and cd into it
source .worktrees/worktree-add.sh my-feature

# Merge current worktree back to main
source .worktrees/worktree-merge.sh

# Merge specific worktree
source .worktrees/worktree-merge.sh my-feature
```

## 📋 Requirements

- Node.js ≥ 18
- pnpm
- Git
- tmux *(must run inside a tmux session)*

## 🛠 Development

```bash
pnpm dev      # tsc watch mode
pnpm watch    # tsx watch mode (runs directly)
pnpm build    # compile
pnpm start    # run
```

---

<div align="center">

**MIT License**

*Built with [Ink](https://github.com/vadimdemedes/ink) · Powered by caffeine and terminal nostalgia*

</div>
