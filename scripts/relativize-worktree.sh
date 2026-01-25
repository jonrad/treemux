#!/bin/bash
# Convert worktree's .git file from absolute to relative path
# Called as afterAdd hook with env vars:
#   TREEMUX_WORKTREE_PATH - full path to new worktree
#   TREEMUX_WORKTREE_NAME - name of the worktree
#   TREEMUX_ROOT - repository root directory
#
# Note: Only the worktree's .git file is made relative. The main repo's
# .git/worktrees/<name>/gitdir stays absolute so `git worktree list` works.
# (Git 2.48+ has native support via worktree.useRelativePaths)

set -e

WORKTREE_GIT_FILE="$TREEMUX_WORKTREE_PATH/.git"

# Get relative path from worktree to main repo
REL_TO_MAIN=$(python3 -c "import os.path; print(os.path.relpath('$TREEMUX_ROOT', '$TREEMUX_WORKTREE_PATH'))")

# Update worktree's .git file to use relative path
echo "gitdir: $REL_TO_MAIN/.git/worktrees/$TREEMUX_WORKTREE_NAME" > "$WORKTREE_GIT_FILE"

# Start devcontainer for the new worktree
devcontainer up --workspace-folder "$TREEMUX_WORKTREE_PATH" --remove-existing-container
