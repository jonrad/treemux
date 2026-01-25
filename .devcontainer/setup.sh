#!/bin/bash
# DevContainer setup script
# Runs as postCreateCommand to configure the environment

set -e

# ============================================
# Host Path Compatibility
# ============================================
# Create symlink so host paths in plugin configs resolve correctly
# e.g., /Users/jonrad/.claude -> /home/node/.claude
if [ -n "$HOST_HOME" ] && [ "$HOST_HOME" != "/home/node" ]; then
    HOST_PARENT=$(dirname "$HOST_HOME")
    if [ ! -d "$HOST_PARENT" ]; then
        sudo mkdir -p "$HOST_PARENT"
    fi
    if [ ! -e "$HOST_HOME" ]; then
        sudo ln -s /home/node "$HOST_HOME"
    fi
fi

# ============================================
# Claude Code Configuration
# ============================================
# Settings, commands, and credentials are shared via volume at /home/node/.claude-shared

CLAUDE_HOME="/home/node/.claude"
CLAUDE_SHARED="/home/node/.claude-shared"

mkdir -p "$CLAUDE_HOME"

# Ensure shared dir is writable (volume may be created as root)
if [ -d "$CLAUDE_SHARED" ] && [ ! -w "$CLAUDE_SHARED" ]; then
    sudo chown node:node "$CLAUDE_SHARED"
fi
mkdir -p "$CLAUDE_SHARED"

# Helper: ensure a file is symlinked to shared volume
# If local file exists (not a symlink), move it to shared first
# Always creates symlink so Claude writes directly to shared volume
link_to_shared() {
    local filename="$1"
    local local_path="$CLAUDE_HOME/$filename"
    local shared_path="$CLAUDE_SHARED/$filename"

    # If local file exists and is NOT a symlink, migrate it to shared
    if [ -f "$local_path" ] && [ ! -L "$local_path" ]; then
        if [ ! -f "$shared_path" ]; then
            cp "$local_path" "$shared_path"
        fi
        rm "$local_path"
    fi

    # Always create symlink (even if target doesn't exist yet)
    # Claude will write through the symlink to the shared volume
    ln -sf "$shared_path" "$local_path"
}

# Link Claude config files to shared volume
link_to_shared "settings.json"
link_to_shared ".credentials.json"
link_to_shared ".claude.json"

# Create local hooks directory for per-container customization
mkdir -p "$CLAUDE_HOME/hooks"

# ============================================
# Project Dependencies
# ============================================
pnpm install

echo "DevContainer setup complete!"
