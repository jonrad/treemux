# Git Worktree Reference

Git worktree allows a single repository to support multiple working trees, enabling you to check out multiple branches simultaneously in separate directories.

## Commands

### `git worktree add`

Create a new linked worktree.

```bash
git worktree add [-f] [--detach] [--checkout] [--lock [--reason <string>]]
                 [--orphan] [(-b | -B) <new-branch>] <path> [<commit-ish>]
```

**Examples:**

```bash
# Create worktree with new branch (branch name derived from path)
git worktree add ../hotfix

# Create worktree with explicit new branch
git worktree add -b feature-x ../feature-x

# Create worktree for existing branch
git worktree add ../review-pr feature/some-pr

# Create worktree from specific commit/tag
git worktree add ../v2 v2.0.0

# Create detached HEAD worktree (throwaway/experimental)
git worktree add -d ../experimental

# Create worktree without checking out files (for sparse checkout)
git worktree add --no-checkout ../sparse

# Create and lock immediately (portable device)
git worktree add --lock --reason "on USB drive" ../portable

# Create orphan worktree (empty, unborn branch)
git worktree add --orphan ../fresh-start

# Use @{-1} shorthand
git worktree add ../previous -
```

**Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Allow checking out branch already checked out elsewhere, or reusing missing path |
| `-b <branch>` | Create new branch starting at `<commit-ish>` (default: HEAD) |
| `-B <branch>` | Create or reset branch (force if exists) |
| `-d, --detach` | Create with detached HEAD |
| `--no-checkout` | Skip checkout (for sparse-checkout setup) |
| `--lock` | Lock worktree after creation |
| `--reason <string>` | Reason for lock (with `--lock`) |
| `--orphan` | Create empty worktree with unborn branch |
| `--guess-remote` | Base new branch on matching remote-tracking branch |
| `--no-guess-remote` | Disable remote guessing |
| `--track` | Set upstream tracking |
| `--no-track` | Don't set upstream |
| `-q, --quiet` | Suppress feedback messages |

### `git worktree list`

List all worktrees.

```bash
git worktree list [-v | --porcelain [-z]]
```

**Default output:**

```
/path/to/main-worktree        abcd1234 [main]
/path/to/linked-worktree      efgh5678 [feature-x]
/path/to/detached-worktree    ijkl9012 (detached HEAD)
/path/to/locked-worktree      mnop3456 [hotfix] locked
/path/to/prunable-worktree    qrst7890 (detached HEAD) prunable
```

**Verbose output (`-v`):**

```
/path/to/locked-worktree  1234abcd (brancha)
        locked: worktree path is mounted on a portable device
```

**Porcelain output (`--porcelain`):**

```
worktree /path/to/linked-worktree
HEAD abcd1234abcd1234abcd1234abcd1234abcd1234
branch refs/heads/master

worktree /path/to/detached-worktree
HEAD 1234abc1234abc1234abc1234abc1234abc1234a
detached

worktree /path/to/locked-worktree
HEAD 3456def3456def3456def3456def3456def3456b
branch refs/heads/locked-branch
locked reason why is locked
```

**Options:**

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show additional worktree info (lock reasons, prune reasons) |
| `--porcelain` | Machine-readable output |
| `-z` | NUL-terminate lines (with `--porcelain`) |
| `--expire <time>` | Annotate missing worktrees as prunable if older than time |

### `git worktree remove`

Remove a linked worktree.

```bash
git worktree remove [-f] <worktree>
```

**Examples:**

```bash
# Remove clean worktree
git worktree remove ../hotfix

# Force remove unclean worktree
git worktree remove -f ../dirty-worktree

# Force remove locked worktree (requires -f twice)
git worktree remove -f -f ../locked-worktree
```

**Notes:**

- Only removes clean worktrees by default (no untracked files, no modifications)
- Use `-f` once for unclean worktrees or those with submodules
- Use `-f -f` for locked worktrees
- Cannot remove the main worktree

### `git worktree move`

Move a worktree to a new location.

```bash
git worktree move <worktree> <new-path>
```

**Examples:**

```bash
git worktree move ../old-location ../new-location
```

**Limitations:**

- Cannot move the main worktree
- Cannot move worktrees containing submodules
- Use `-f` for missing destination paths
- Use `-f -f` for locked worktrees

### `git worktree lock`

Lock a worktree to prevent pruning.

```bash
git worktree lock [--reason <string>] <worktree>
```

**Examples:**

```bash
# Lock without reason
git worktree lock ../portable

# Lock with reason
git worktree lock --reason "on network share" ../network-worktree
```

**Use cases:**

- Worktrees on portable devices (USB drives)
- Worktrees on network shares that may be unmounted
- Preventing accidental cleanup

### `git worktree unlock`

Unlock a previously locked worktree.

```bash
git worktree unlock <worktree>
```

### `git worktree prune`

Clean up stale worktree administrative files.

```bash
git worktree prune [-n] [-v] [--expire <expire>]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-n, --dry-run` | Don't remove, just report what would be removed |
| `-v, --verbose` | Report all removals |
| `--expire <time>` | Only prune worktrees older than time |

**When to use:**

- After manually deleting a worktree directory (without `git worktree remove`)
- Cleaning up orphaned metadata in `$GIT_DIR/worktrees`

### `git worktree repair`

Repair worktree administrative files after manual moves.

```bash
git worktree repair [<path>...]
```

**Examples:**

```bash
# Repair after moving main worktree
git worktree repair

# Repair specific moved worktrees
git worktree repair /new/path/worktree1 /new/path/worktree2

# Repair all moved worktrees from main
cd /new/main/location
git worktree repair /new/path/wt1 /new/path/wt2
```

**Use cases:**

- Main worktree was moved manually
- Linked worktrees were moved manually (not via `git worktree move`)
- Reestablishing connections after directory restructuring

## Configuration

### `worktree.guessRemote`

When true, `git worktree add <path>` without a commit-ish will look for a remote-tracking branch matching the path basename and use it as the starting point and upstream.

```bash
git config worktree.guessRemote true
```

### `worktree.useRelativePaths`

Use relative paths instead of absolute paths for linking worktrees.

```bash
git config worktree.useRelativePaths true
```

### `extensions.worktreeConfig`

Enable per-worktree configuration files.

```bash
git config extensions.worktreeConfig true
```

Once enabled, use `--worktree` flag for worktree-specific settings:

```bash
git config --worktree core.sparseCheckout true
```

**Per-worktree config location:** `$GIT_DIR/worktrees/<id>/config.worktree`

**Settings that should NOT be shared:**

- `core.worktree` - never share
- `core.bare` - not if true
- `core.sparseCheckout` - unless used consistently

### `checkout.defaultRemote`

Disambiguate when branch exists in multiple remotes:

```bash
git config checkout.defaultRemote origin
```

### `gc.worktreePruneExpire`

Control automatic pruning expiration (see `git gc` documentation).

## Refs Behavior

### Shared Refs

All refs under `refs/` are shared across worktrees, **except**:

- `refs/bisect/*`
- `refs/worktree/*`
- `refs/rewritten/*`

### Per-Worktree Refs

Pseudo refs are per-worktree:

- `HEAD`
- `FETCH_HEAD`
- `ORIG_HEAD`
- `MERGE_HEAD`
- `CHERRY_PICK_HEAD`
- `REBASE_HEAD`
- `REVERT_HEAD`
- `BISECT_HEAD`

### Accessing Refs Across Worktrees

```bash
# Access main worktree's HEAD
git rev-parse main-worktree/HEAD

# Access specific worktree's HEAD
git rev-parse worktrees/feature-x/HEAD

# Access worktree-specific bisect ref
git rev-parse worktrees/debug/refs/bisect/bad
```

## Internal Structure

### Main Worktree

```
/path/to/repo/
├── .git/                    # GIT_DIR
│   ├── config               # Shared config
│   ├── HEAD                 # Main worktree HEAD
│   ├── refs/                # Shared refs
│   └── worktrees/           # Linked worktree metadata
│       ├── feature-x/
│       │   ├── HEAD
│       │   ├── index
│       │   ├── gitdir       # Points to linked worktree
│       │   ├── locked       # (if locked, contains reason)
│       │   └── config.worktree  # (if extensions.worktreeConfig)
│       └── hotfix/
│           ├── HEAD
│           ├── index
│           └── gitdir
└── [working files]
```

### Linked Worktree

```
/path/to/linked-worktree/
├── .git                     # File (not directory!) pointing to metadata
└── [working files]
```

Contents of `.git` file:

```
gitdir: /path/to/repo/.git/worktrees/feature-x
```

### Environment Variables

In a linked worktree:

- `$GIT_DIR` → `/path/to/repo/.git/worktrees/<name>`
- `$GIT_COMMON_DIR` → `/path/to/repo/.git`

## Worktree Identification

Worktrees can be identified by:

1. **Full path:** `/path/to/worktree`
2. **Relative path:** `../worktree`
3. **Unique final path component:** `worktree` (if unique among all worktrees)
4. **Partial path:** `dir/worktree` (if unique)

## Common Workflows

### Emergency Hotfix

```bash
# You're deep in feature work, production is down
git worktree add -b hotfix-123 ../hotfix main
cd ../hotfix
# ... fix the issue ...
git commit -am "fix: critical production bug"
git push origin hotfix-123
cd -
git worktree remove ../hotfix
```

### Code Review

```bash
# Review a PR without disrupting current work
git fetch origin pull/456/head:pr-456
git worktree add ../pr-456 pr-456
cd ../pr-456
# ... review code, run tests ...
cd -
git worktree remove ../pr-456
git branch -D pr-456
```

### Long-Running Feature

```bash
# Dedicated worktree for multi-week feature
git worktree add -b feature/big-refactor ../.worktrees/big-refactor
# Work in that directory as needed
# Main worktree stays clean for other tasks
```

### Parallel AI Agent Development

```bash
# Create isolated worktrees for AI agents to work in parallel
git worktree add -b feature-a ../.worktrees/agent-1
git worktree add -b feature-b ../.worktrees/agent-2
git worktree add -b feature-c ../.worktrees/agent-3
# Each agent works in isolation, no conflicts
```

### Sparse Checkout Worktree

```bash
git worktree add --no-checkout ../sparse-frontend
cd ../sparse-frontend
git sparse-checkout init --cone
git sparse-checkout set src/frontend
git checkout
```

### Compare Implementations

```bash
# Compare main vs branch side-by-side
git worktree add ../main-compare main
# Now you have both versions in separate directories
```

## Best Practices

### Directory Organization

```
project/
├── main/                    # Main worktree (or just project/)
└── .worktrees/              # All linked worktrees
    ├── feature-x/
    ├── hotfix-123/
    └── pr-review/
```

Or sibling layout:

```
projects/
├── myrepo/                  # Main worktree
├── myrepo-feature-x/        # Linked worktrees as siblings
├── myrepo-hotfix/
└── myrepo-pr-456/
```

### Naming Conventions

- Use descriptive names matching branch purpose
- Include ticket/PR numbers when relevant
- Consistent prefix/suffix patterns

### Maintenance

```bash
# Regular cleanup of stale worktrees
git worktree list           # Review active worktrees
git worktree prune -v       # Clean up orphaned metadata
```

### Synchronization

All worktrees share fetch history:

```bash
# Fetching in any worktree updates all
git fetch --all
```

However, each worktree tracks its own:

- Staged changes (index)
- Current HEAD/branch
- Stash (per-worktree in recent Git versions)

## Limitations

1. **Cannot check out same branch in multiple worktrees** (without `--force`)
2. **Submodule support is incomplete** - avoid multiple checkouts of superprojects
3. **Main worktree cannot be removed**
4. **Main worktree cannot be moved with `git worktree move`** (use `repair` after manual move)
5. **Disk space:** Each worktree has full working directory copy (object store is shared)
6. **Index conflicts:** Operations affecting the index (rebase, merge) can only run in one worktree at a time for the same branch

## Version Requirements

- Git 2.5+ (2015): Basic worktree support
- Git 2.15+: `git worktree move` and `git worktree remove`
- Git 2.17+: `--reason` option for locks
- Git 2.30+: Per-worktree sparse-checkout
- Git 2.36+: `--orphan` option
- Git 2.38+: `--relative-paths` option

Check your version: `git --version`

## Sources

- [Git - git-worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Kernel.org git-worktree(1)](https://www.kernel.org/pub/software/scm/git/docs/git-worktree.html)
- [Git Worktree Tutorial - DataCamp](https://www.datacamp.com/tutorial/git-worktree-tutorial)
- [Mastering Git Worktree - Medium](https://mskadu.medium.com/mastering-git-worktree-a-developers-guide-to-multiple-working-directories-c30f834f79a5)
- [Git Worktrees for AI Agents - Nick Mitchinson](https://www.nrmitchi.com/2025/10/using-git-worktrees-for-multi-feature-development-with-ai-agents/)
- [GitKraken Learn Git - Git Worktree](https://www.gitkraken.com/learn/git/git-worktree)
