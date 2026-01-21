#!/bin/bash

# This script must be sourced to change directories in the calling shell
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error: This script must be sourced, not executed directly." >&2
    echo "Usage: source ${BASH_SOURCE[0]} <worktree-name>" >&2
    exit 1
fi

# Note: Don't use "set -e" in sourced scripts - it affects the parent shell
# and will exit the terminal if any command fails. Handle errors explicitly instead.

if [ -z "$1" ]; then
    echo "Usage: source ${BASH_SOURCE[0]} <worktree-name>" >&2
    return 1
fi

# Determine main repo from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(dirname "$SCRIPT_DIR")"

WORKTREE_NAME="$1"
WORKTREE_DIR="$MAIN_REPO/.worktrees/$WORKTREE_NAME"

if git -C "$MAIN_REPO" worktree list | grep -q "\.worktrees/$WORKTREE_NAME"; then
    echo "Error: Worktree '$WORKTREE_NAME' already exists" >&2
    return 1
fi

if ! git -C "$MAIN_REPO" worktree add "$WORKTREE_DIR"; then
    echo "Error: Failed to create worktree '$WORKTREE_NAME'" >&2
    return 1
fi

if ! cd "$WORKTREE_DIR"; then
    echo "Error: Failed to change to worktree directory" >&2
    return 1
fi

echo "Created worktree '$WORKTREE_NAME' at $WORKTREE_DIR"
