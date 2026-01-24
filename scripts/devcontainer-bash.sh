#!/usr/bin/env bash
set -euo pipefail

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="${1:-$(dirname "$SCRIPT_DIR")}"
WORKTREE_NAME="$(basename "$WORKSPACE_DIR")"

# Verify we're in a directory with a devcontainer config
if [[ ! -f "$WORKSPACE_DIR/.devcontainer/devcontainer.json" ]]; then
    echo "Error: No .devcontainer/devcontainer.json found in $WORKSPACE_DIR" >&2
    exit 1
fi

# Check if devcontainer is running
if ! devcontainer exec --workspace-folder "$WORKSPACE_DIR" true 2>/dev/null; then
    echo "Error: No running devcontainer for $WORKSPACE_DIR" >&2
    echo "Run: devcontainer up --workspace-folder \"$WORKSPACE_DIR\"" >&2
    exit 1
fi

# Attach to existing session or create new one with claude
exec devcontainer exec --workspace-folder "$WORKSPACE_DIR" \
    tmux new-session -A -s "$WORKTREE_NAME" \
    "bash"
