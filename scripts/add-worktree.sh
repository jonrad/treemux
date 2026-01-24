#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <worktree-name>" >&2
    echo "Example: $0 my-feature" >&2
    exit 1
fi

WORKTREE_NAME="$1"

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_DIR="$(dirname "$REPO_DIR")/$WORKTREE_NAME"

# Check if worktree already exists
if [[ -d "$WORKTREE_DIR" ]]; then
    echo "Error: Directory already exists: $WORKTREE_DIR" >&2
    exit 1
fi

# Check if we're in a git repo
if ! git -C "$REPO_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    echo "Error: Not a git repository: $REPO_DIR" >&2
    exit 1
fi

echo "Creating worktree: $WORKTREE_DIR"
if ! git -C "$REPO_DIR" worktree add "$WORKTREE_DIR"; then
    echo "Error: Failed to create worktree" >&2
    exit 1
fi

echo "Starting devcontainer..."
if ! devcontainer up --workspace-folder "$WORKTREE_DIR"; then
    echo "Error: Failed to start devcontainer" >&2
    echo "Worktree created but devcontainer failed. Clean up with:" >&2
    echo "  git worktree remove \"$WORKTREE_DIR\"" >&2
    exit 1
fi

echo "Starting Claude..."
exec "$SCRIPT_DIR/start-claude.sh" "$WORKTREE_DIR"
