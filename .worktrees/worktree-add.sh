#!/bin/bash

# This script must be sourced to change directories in the calling shell
# Works with both bash and zsh
if [[ -n "$BASH_SOURCE" ]]; then
    _this_script="${BASH_SOURCE[0]}"
else
    _this_script="${(%):-%x}"
fi

if [[ "$_this_script" == "$0" && -z "$ZSH_VERSION" ]]; then
    echo "Error: This script must be sourced, not executed directly." >&2
    echo "Usage: source $_this_script <worktree-name>" >&2
    exit 1
fi

# Note: Don't use "set -e" in sourced scripts - it affects the parent shell
# and will exit the terminal if any command fails. Handle errors explicitly instead.

if [ -z "$1" ]; then
    echo "Usage: source $_this_script <worktree-name>" >&2
    unset _this_script
    return 1
fi

# Determine main repo from script location
# Get absolute path of the script, handling both relative and absolute paths
if [[ "$_this_script" != /* ]]; then
    _this_script="$(pwd)/$_this_script"
fi
SCRIPT_DIR="$(cd "$(dirname "$_this_script")" && pwd)"
MAIN_REPO="$(dirname "$SCRIPT_DIR")"
unset _this_script

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
