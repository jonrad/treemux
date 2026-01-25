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
# For devcontainers: read from file (updated on each attach), fall back to env var
if [ "$DEVCONTAINER" = "true" ]; then
  if [ -f /tmp/host_tmux_pane ]; then
    PANE_ID="$(cat /tmp/host_tmux_pane)"
  elif [ -n "$HOST_TMUX_PANE" ]; then
    PANE_ID="$HOST_TMUX_PANE"
  else
    PANE_ID=""
  fi
else
  PANE_ID="${TMUX_PANE:-}"
fi

# Detect if running in devcontainer and capture hostname
IS_DEVCONTAINER="${DEVCONTAINER:-false}"
HOSTNAME_VAL=$(hostname)

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
      --arg hostname "$HOSTNAME_VAL" \
      --argjson is_devcontainer "$([ "$IS_DEVCONTAINER" = "true" ] && echo true || echo false)" \
      '{
        session_id: $session_id,
        cwd: $cwd,
        state: $state,
        pane_id: $pane_id,
        timestamp: $timestamp,
        hostname: $hostname,
        is_devcontainer: $is_devcontainer
      }' > "$STATE_FILE"
    ;;
  end)
    # Remove state file when session ends
    rm -f "$STATE_FILE"
    ;;
esac

exit 0
