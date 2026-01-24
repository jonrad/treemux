#!/bin/bash
# Session state tracker for TreeMux
# Writes session state to ~/.claude/treemux/<session_id>.json

set -e

STATE="$1"
STATE_DIR="$HOME/.claude/treemux"

# Read hook input from stdin
INPUT=$(cat)

# Extract session_id and cwd from hook input
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Get tmux pane ID from environment (e.g., %0, %1, etc.)
PANE_ID="${TMUX_PANE:-}"

# Fallback if no session_id
if [ -z "$SESSION_ID" ]; then
  exit 0
fi

# Ensure state directory exists
mkdir -p "$STATE_DIR"

STATE_FILE="$STATE_DIR/$SESSION_ID.json"

case "$STATE" in
  start|working|waiting)
    # Write current state
    jq -n \
      --arg session_id "$SESSION_ID" \
      --arg cwd "$CWD" \
      --arg state "$STATE" \
      --arg pane_id "$PANE_ID" \
      --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{
        session_id: $session_id,
        cwd: $cwd,
        state: $state,
        pane_id: $pane_id,
        timestamp: $timestamp
      }' > "$STATE_FILE"
    ;;
  end)
    # Remove state file when session ends
    rm -f "$STATE_FILE"
    ;;
esac

exit 0
