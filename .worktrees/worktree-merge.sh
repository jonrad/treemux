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
    echo "Usage: source $_this_script [worktree-name]" >&2
    exit 1
fi

# Note: Don't use "set -e" in sourced scripts - it affects the parent shell
# and will exit the terminal if any command fails. Handle errors explicitly instead.

# Detect if we're inside a worktree by checking current directory
CURRENT_DIR="$(pwd)"
IN_WORKTREE=false
DETECTED_WORKTREE=""

# Determine main repo from script location
# Get absolute path of the script, handling both relative and absolute paths
if [[ "$_this_script" != /* ]]; then
    _this_script="$(pwd)/$_this_script"
fi
SCRIPT_DIR="$(cd "$(dirname "$_this_script")" && pwd)"
unset _this_script

# If running from within a worktree, SCRIPT_DIR will be like:
# /main/repo/.worktrees/worktree-name/.worktrees
# We need to extract /main/repo as MAIN_REPO
if [[ "$SCRIPT_DIR" =~ /.worktrees/[^/]+/.worktrees$ ]]; then
    MAIN_REPO="${SCRIPT_DIR%%/.worktrees/*}"
else
    MAIN_REPO="$(dirname "$SCRIPT_DIR")"
fi

# Check if current directory is inside .worktrees/<name>
if [[ "$CURRENT_DIR" == */.worktrees/* ]]; then
    IN_WORKTREE=true
    # Extract worktree name: remove prefix up to .worktrees/, then take first path component
    _tmp="${CURRENT_DIR#*/.worktrees/}"
    DETECTED_WORKTREE="${_tmp%%/*}"
    unset _tmp
fi

if [ -z "$1" ]; then
    if [ "$IN_WORKTREE" = true ]; then
        WORKTREE_NAME="$DETECTED_WORKTREE"
        echo "Detected worktree: $WORKTREE_NAME"
    else
        echo "Usage: source .worktrees/worktree-merge.sh <worktree-name>" >&2
        return 1
    fi
else
    WORKTREE_NAME="$1"
fi

WORKTREE_DIR="$MAIN_REPO/.worktrees/$WORKTREE_NAME"

if ! git -C "$MAIN_REPO" worktree list | grep -q "\.worktrees/$WORKTREE_NAME"; then
    echo "Error: Worktree '$WORKTREE_NAME' does not exist" >&2
    return 1
fi

BRANCH=$(git -C "$WORKTREE_DIR" rev-parse --abbrev-ref HEAD)
if [ -z "$BRANCH" ] || [ "$BRANCH" = "HEAD" ]; then
    echo "Error: Could not determine branch name for worktree" >&2
    return 1
fi

if ! git -C "$WORKTREE_DIR" rebase main; then
    echo "Error: Rebase failed, aborting" >&2
    git -C "$WORKTREE_DIR" rebase --abort
    return 1
fi

if ! git -C "$MAIN_REPO" merge "$BRANCH"; then
    echo "Error: Merge failed" >&2
    return 1
fi

if ! git -C "$MAIN_REPO" worktree remove "$WORKTREE_DIR"; then
    echo "Error: Failed to remove worktree" >&2
    return 1
fi

if ! git -C "$MAIN_REPO" branch -D "$WORKTREE_NAME"; then
    echo "Warning: Failed to delete branch '$WORKTREE_NAME' (may already be deleted)" >&2
fi

echo "Merged and removed worktree '$WORKTREE_NAME'"

# If we're in the (now removed) worktree directory, go back to main repo
if [[ "$(pwd)" == "$WORKTREE_DIR"* ]]; then
    cd "$MAIN_REPO"
    echo "Changed directory to main repo: $MAIN_REPO"
fi
