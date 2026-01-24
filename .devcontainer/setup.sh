#!/bin/bash
# DevContainer setup script
# Runs as postCreateCommand to configure the environment

set -e

# ============================================
# Claude Code Configuration
# ============================================
# Settings and commands are shared via volume at /home/node/.claude-shared
# Auth (credentials) stays container-local for security

CLAUDE_HOME="/home/node/.claude"
CLAUDE_SHARED="/home/node/.claude-shared"

mkdir -p "$CLAUDE_HOME"

# Ensure shared dir is writable (volume may be created as root)
if [ -d "$CLAUDE_SHARED" ] && [ ! -w "$CLAUDE_SHARED" ]; then
    sudo chown node:node "$CLAUDE_SHARED"
fi
mkdir -p "$CLAUDE_SHARED"

# Symlink shared config into local config dir (NOT credentials)
if [ -d "$CLAUDE_SHARED" ]; then
    # Link settings (shared across containers)
    if [ -f "$CLAUDE_SHARED/settings.json" ]; then
        ln -sf "$CLAUDE_SHARED/settings.json" "$CLAUDE_HOME/settings.json"
    elif [ -f "$CLAUDE_HOME/settings.json" ]; then
        # First run - seed shared from local, then link
        cp "$CLAUDE_HOME/settings.json" "$CLAUDE_SHARED/settings.json"
        ln -sf "$CLAUDE_SHARED/settings.json" "$CLAUDE_HOME/settings.json"
    fi

    # Link shared commands directory (skills like /commit)
    if [ -d "$CLAUDE_SHARED/commands" ]; then
        ln -sfn "$CLAUDE_SHARED/commands" "$CLAUDE_HOME/commands"
    fi
fi

# Create local hooks directory for per-container customization
mkdir -p "$CLAUDE_HOME/hooks"

# ============================================
# Project Dependencies
# ============================================
pnpm install

echo "DevContainer setup complete!"
