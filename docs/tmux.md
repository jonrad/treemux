# tmux Integration Reference

Comprehensive documentation for tmux features relevant to worktrees-tui development.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Programmatic Control](#programmatic-control)
- [Target Specification](#target-specification)
- [Format Variables](#format-variables)
- [Window and Pane Commands](#window-and-pane-commands)
- [Control Mode](#control-mode)
- [Hooks](#hooks)
- [Environment Variables](#environment-variables)
- [Capture and History](#capture-and-history)
- [Layouts](#layouts)
- [Useful Command Reference](#useful-command-reference)

---

## Core Concepts

### Architecture

tmux uses a client-server model:
- **Server**: Single process managing all sessions, windows, and panes
- **Client**: Terminal attached to the server to interact with sessions
- **Session**: Collection of windows managed by tmux
- **Window**: Full-screen view that can be split into panes
- **Pane**: Individual terminal within a window

### ID System

Every object has a unique, persistent ID:
- **Session IDs**: Prefixed with `$` (e.g., `$0`, `$3`)
- **Window IDs**: Prefixed with `@` (e.g., `@1`, `@99`)
- **Pane IDs**: Prefixed with `%` (e.g., `%0`, `%5`)

IDs remain constant even if objects are renamed, moved, or other objects are killed. This is critical for reliable programmatic control.

---

## Programmatic Control

### send-keys

Send keystrokes to a pane programmatically.

```bash
# Basic syntax
tmux send-keys -t <target-pane> <keys>...

# Send command with Enter
tmux send-keys -t :.1 "cd /path/to/dir" Enter

# Send literal string (no key lookup)
tmux send-keys -l -t :.1 "text with special chars"

# Reset terminal state
tmux send-keys -R -t :.1

# Send to specific session:window.pane
tmux send-keys -t mysession:0.2 "echo hello" Enter
```

**Options:**
- `-t target-pane`: Target specification
- `-l`: Send keys literally (no key name lookup)
- `-R`: Reset terminal state before sending
- `-N count`: Repeat count
- `-H`: Keys are hexadecimal (for Unicode)

**Key Names:**
- `Enter`, `Tab`, `Escape`, `Space`
- `Up`, `Down`, `Left`, `Right`
- `BSpace` (Backspace), `DC` (Delete)
- `C-a` (Ctrl+a), `M-a` (Alt+a)
- `F1`-`F12`

### display-message

Query tmux state and format information.

```bash
# Print to stdout instead of status line
tmux display-message -p "#{pane_current_path}"

# Target specific pane
tmux display-message -t :.1 -p "#{pane_id}"

# List all format variables
tmux display-message -a

# Verbose format debugging
tmux display-message -v -p "#{pane_current_path}"
```

### list-panes

List panes with custom formatting.

```bash
# List panes in current window
tmux list-panes

# Custom format
tmux list-panes -F "#{pane_index} #{pane_id} #{pane_current_path}"

# All panes in session
tmux list-panes -s

# All panes on server
tmux list-panes -a
```

### list-windows

```bash
# List windows in current session
tmux list-windows

# Custom format
tmux list-windows -F "#{window_index} #{window_name} #{window_panes}"

# All windows on server
tmux list-windows -a
```

### list-sessions

```bash
tmux list-sessions
tmux list-sessions -F "#{session_id} #{session_name} #{session_windows}"
```

---

## Target Specification

### Syntax

Targets follow the pattern: `session:window.pane`

```
session         - Session only (uses current window/pane)
session:window  - Session and window (uses active pane)
session:window.pane - Full specification
:window         - Current session, specified window
:.pane          - Current session/window, specified pane
```

### Special Tokens

**Sessions:**
| Token | Meaning |
|-------|---------|
| `$id` | Session by ID |
| `=name` | Exact session name match |

**Windows:**
| Token | Alias | Meaning |
|-------|-------|---------|
| `{start}` | `^` | Lowest-numbered window |
| `{end}` | `$` | Highest-numbered window |
| `{last}` | `!` | Previously current window |
| `{next}` | `+` | Next window by number |
| `{previous}` | `-` | Previous window by number |

**Panes:**
| Token | Alias | Meaning |
|-------|-------|---------|
| `{last}` | `!` | Previously active pane |
| `{next}` | `+` | Next pane by number |
| `{previous}` | `-` | Previous pane by number |
| `{top}` | | Top pane |
| `{bottom}` | | Bottom pane |
| `{left}` | | Leftmost pane |
| `{right}` | | Rightmost pane |
| `{up-of}` | | Pane above active |
| `{down-of}` | | Pane below active |
| `{left-of}` | | Pane to left of active |
| `{right-of}` | | Pane to right of active |

**Special:**
| Token | Alias | Meaning |
|-------|-------|---------|
| `{mouse}` | `=` | Where mouse event occurred |
| `{marked}` | `~` | The marked pane |

### Examples

```bash
tmux send-keys -t mysession:mywindow.0 "command" Enter
tmux send-keys -t :0.1 "command" Enter   # Current session, window 0, pane 1
tmux send-keys -t :.{top} "command" Enter # Topmost pane
tmux select-pane -t :+2                   # Window index +2 from current
```

---

## Format Variables

Formats use `#{variable}` syntax. Commonly used variables:

### Session Variables

| Variable | Alias | Description |
|----------|-------|-------------|
| `session_id` | | Unique session ID (`$N`) |
| `session_name` | `#S` | Session name |
| `session_path` | | Working directory |
| `session_windows` | | Number of windows |
| `session_attached` | | Number of attached clients |
| `session_created` | | Creation timestamp |
| `session_activity` | | Last activity timestamp |

### Window Variables

| Variable | Description |
|----------|-------------|
| `window_id` | Unique window ID (`@N`) |
| `window_index` | Window index |
| `window_name` | Window name |
| `window_active` | 1 if active window |
| `window_panes` | Number of panes |
| `window_activity` | Last activity timestamp |

### Pane Variables

| Variable | Alias | Description |
|----------|-------|-------------|
| `pane_id` | `#D` | Unique pane ID (`%N`) |
| `pane_index` | `#P` | Pane index in window |
| `pane_active` | | 1 if active pane |
| `pane_current_path` | | Current working directory |
| `pane_current_command` | | Current running command |
| `pane_pid` | | PID of first process |
| `pane_tty` | | Pseudo terminal path |
| `pane_title` | `#T` | Pane title (application-set) |
| `pane_width` | | Width in characters |
| `pane_height` | | Height in characters |
| `pane_top` | | Top coordinate |
| `pane_left` | | Left coordinate |
| `pane_dead` | | 1 if pane process has exited |
| `pane_in_mode` | | 1 if in copy mode |

### Format Modifiers

| Modifier | Syntax | Description |
|----------|--------|-------------|
| Conditional | `#{?cond,true,false}` | Ternary operator |
| Comparison | `#{==:a,b}` | String equality (also `!=`, `<`, `>`) |
| Boolean | `#{&&:a,b}`, `#{||:a,b}` | AND/OR |
| Basename | `#{b:path}` | Extract filename |
| Dirname | `#{d:path}` | Extract directory |
| Length | `#{n:var}` | String length |
| Width | `#{w:var}` | Display width |
| Truncate | `#{=N:var}` | First N chars (negative = last) |
| Pad | `#{pN:var}` | Pad to N width |
| Time | `#{t:timestamp}` | Convert to readable time |
| Escape | `#{q:var}` | Shell escape |
| Substitute | `#{s/pat/repl/:var}` | Regex substitution |
| Match | `#{m:pattern,string}` | fnmatch pattern match |
| Loop | `#{P:format}` | Loop over all panes |

### Examples

```bash
# Conditional formatting
tmux list-panes -F '#{pane_index}: #{?pane_active,*,-} #{pane_current_path}'

# Comparison
tmux display -p '#{?#{==:#{host},myhost},local,remote}'

# Path manipulation
tmux display -p '#{b:pane_current_path}'  # basename
tmux display -p '#{d:pane_current_path}'  # dirname
```

---

## Window and Pane Commands

### Creating

```bash
# New window
tmux new-window                         # New window
tmux new-window -n name                 # With name
tmux new-window -c /path                # With working directory
tmux new-window "command"               # Running command
tmux new-window -d                      # Don't switch to it

# Split pane
tmux split-window                       # Vertical split (top/bottom)
tmux split-window -h                    # Horizontal split (left/right)
tmux split-window -v -l 20              # Vertical, 20 lines high
tmux split-window -h -p 30              # Horizontal, 30% width
tmux split-window -c "#{pane_current_path}"  # Same directory
tmux split-window -b                    # Before (above/left of) current
```

### Selecting

```bash
# Select pane
tmux select-pane -t :.0                 # By index
tmux select-pane -t %5                  # By ID
tmux select-pane -L/-R/-U/-D            # By direction
tmux select-pane -l                     # Last active pane
tmux select-pane -m                     # Mark current pane
tmux select-pane -M                     # Clear marked pane

# Select window
tmux select-window -t :0                # By index
tmux select-window -t @3                # By ID
tmux select-window -n/-p                # Next/previous
tmux select-window -l                   # Last active
```

### Resizing

```bash
tmux resize-pane -D 10                  # Down 10 lines
tmux resize-pane -U 10                  # Up 10 lines
tmux resize-pane -L 10                  # Left 10 columns
tmux resize-pane -R 10                  # Right 10 columns
tmux resize-pane -Z                     # Toggle zoom (fullscreen)
tmux resize-pane -x 80                  # Set width to 80
tmux resize-pane -y 24                  # Set height to 24
```

### Arranging

```bash
# Swap panes
tmux swap-pane -s :.1 -t :.2           # Swap panes 1 and 2
tmux swap-pane -U/-D                    # Swap with pane above/below

# Move pane to window
tmux break-pane                         # Make pane its own window
tmux join-pane -s :1 -t :2              # Move pane from window 1 to 2
tmux join-pane -h -s :1.0 -t :2.0       # Join horizontally

# Rotate panes
tmux rotate-window                      # Rotate pane positions
```

### Killing

```bash
tmux kill-pane                          # Kill current pane
tmux kill-pane -t :.1                   # Kill pane 1
tmux kill-pane -a                       # Kill all but current
tmux kill-window                        # Kill current window
tmux kill-window -t :2                  # Kill window 2
```

### Display Pane Numbers

```bash
# Show pane indices (press number to select)
tmux display-panes
tmux display-panes -d 0                 # Stay until keypress
tmux display-panes "select-pane -t '%%'"  # Custom action
```

---

## Control Mode

Control mode provides a machine-readable protocol for programmatic tmux control.

### Starting Control Mode

```bash
# Basic control mode
tmux -C attach -t session

# Control mode with canonical mode disabled (for applications)
tmux -CC attach -t session
```

### Protocol Format

**Command execution:**
```
%begin <timestamp> <command-number> <flags>
<output>
%end <timestamp> <command-number> <flags>
```

**Errors:**
```
%begin <timestamp> <command-number> <flags>
<error message>
%error <timestamp> <command-number> <flags>
```

### Notifications

Control mode clients receive these notifications:

| Notification | Description |
|--------------|-------------|
| `%output %pane data` | Pane output (escaped) |
| `%pane-mode-changed %pane` | Pane entered/exited mode |
| `%window-add @window` | Window created |
| `%window-close @window` | Window destroyed |
| `%window-pane-changed @window %pane` | Active pane changed |
| `%session-changed $session name` | Attached session changed |
| `%sessions-changed` | Session created/destroyed |
| `%layout-change @window layout` | Window layout changed |
| `%pause %pane` | Pane output paused |
| `%continue %pane` | Pane output resumed |
| `%exit` | Control mode ended |

### Control Client Management

```bash
# Set control mode client size
tmux refresh-client -C 80x24

# Subscribe to format changes
tmux refresh-client -B "name:what:format"

# Pause/continue pane output
tmux refresh-client -A "%0:pause"
tmux refresh-client -A "%0:continue"
```

### Machine-Readable Output

Use `-F` with escaped formats:
```bash
tmux list-panes -F '#{session_id} #{window_id} #{pane_id} #{q:pane_current_path}'
```

The `q:` modifier escapes special characters for reliable parsing.

---

## Hooks

Hooks allow running commands when events occur.

### Setting Hooks

```bash
# Global hook
tmux set-hook -g hook-name "command"

# Session hook
tmux set-hook hook-name "command"

# Pane-local hook (limited support)
tmux set-hook -p hook-name "command"
```

### Available Hooks

**Session hooks:**
- `session-created` - Session created
- `session-closed` - Session destroyed
- `session-renamed` - Session renamed
- `client-session-changed` - Client attached to different session
- `client-attached` - Client attached
- `client-detached` - Client detached

**Window hooks:**
- `window-linked` - Window linked to session
- `window-unlinked` - Window unlinked
- `window-renamed` - Window renamed
- `window-layout-changed` - Layout changed

**Pane hooks:**
- `pane-died` - Pane process exited (remain-on-exit on)
- `pane-exited` - Pane process exited (remain-on-exit off)
- `pane-focus-in` - Pane gained focus
- `pane-focus-out` - Pane lost focus
- `pane-mode-changed` - Entered/exited copy mode
- `pane-set-clipboard` - Application set clipboard
- `pane-title-changed` - Pane title changed

**Command hooks:**
Most commands have `after-` hooks, e.g.:
- `after-select-pane`
- `after-select-window`
- `after-split-window`
- `after-new-window`
- `after-kill-pane`

### Hook Context Variables

Within hooks, these format variables are available:
- `hook` - Hook name
- `hook_client` - Client where hook ran
- `hook_session` - Session ID
- `hook_session_name` - Session name
- `hook_window` - Window ID
- `hook_window_name` - Window name
- `hook_pane` - Pane ID

### Example

```bash
# Log when panes exit
tmux set-hook -g pane-exited 'run-shell "echo Pane #{hook_pane} exited >> /tmp/tmux.log"'

# Auto-rename window to current command
tmux set-hook -g pane-focus-in 'rename-window "#{pane_current_command}"'
```

---

## Environment Variables

### tmux-Set Variables

tmux sets these in each pane:

| Variable | Description |
|----------|-------------|
| `TMUX` | Socket path and internal data |
| `TMUX_PANE` | Pane ID (e.g., `%0`) |

### Checking if Inside tmux

```typescript
function isInTmux(): boolean {
  return !!process.env.TMUX;
}

function getCurrentPaneId(): string | undefined {
  return process.env.TMUX_PANE;
}
```

### Global Environment

```bash
# Set global environment variable
tmux set-environment -g MYVAR value

# Get environment variable
tmux show-environment -g MYVAR

# Update session environment
tmux set-environment MYVAR value
```

### Passing Environment to New Panes

```bash
# -e flag for new windows/panes
tmux new-window -e "MYVAR=value"
tmux split-window -e "MYVAR=value"
```

---

## Capture and History

### capture-pane

Capture pane contents programmatically.

```bash
# Capture visible pane to stdout
tmux capture-pane -p

# Capture entire history
tmux capture-pane -p -S -

# Capture specific range (negative = history)
tmux capture-pane -p -S -100 -E -1

# Include escape sequences (colors)
tmux capture-pane -p -e

# Target specific pane
tmux capture-pane -p -t :.1

# Save to buffer instead
tmux capture-pane -b mybuffer
```

**Options:**
- `-p`: Print to stdout
- `-S start`: Starting line (- = beginning of history)
- `-E end`: Ending line (- = end of visible)
- `-e`: Include escape sequences
- `-C`: Escape non-printables as octal
- `-J`: Join wrapped lines
- `-a`: Capture alternate screen
- `-b buffer`: Save to named buffer

### History Settings

```bash
# Set history limit (in .tmux.conf)
set -g history-limit 50000

# Clear pane history
tmux clear-history

# Clear with hyperlinks
tmux clear-history -H
```

### Scrollback Access

```bash
# Enter copy mode to scroll
tmux copy-mode

# Scroll programmatically
tmux copy-mode -u  # Scroll up one page
tmux copy-mode -d  # Scroll down one page
```

---

## Layouts

### Preset Layouts

| Layout | Description |
|--------|-------------|
| `even-horizontal` | Panes spread evenly left-to-right |
| `even-vertical` | Panes spread evenly top-to-bottom |
| `main-horizontal` | Large pane on top, rest below |
| `main-horizontal-mirrored` | Large pane on bottom |
| `main-vertical` | Large pane on left, rest right |
| `main-vertical-mirrored` | Large pane on right |
| `tiled` | Panes in grid pattern |

### Applying Layouts

```bash
# Apply preset
tmux select-layout even-horizontal

# Cycle through layouts
tmux next-layout

# Apply custom layout string
tmux select-layout "bb62,159x48,0,0{79x48,0,0,79x48,80,0}"
```

### Layout Options

```bash
# Main pane size for main-* layouts
tmux set -w main-pane-width 50%
tmux set -w main-pane-height 60%
```

---

## Useful Command Reference

### Information Commands

```bash
# Server info
tmux info
tmux server-info

# List all commands
tmux list-commands

# Show current options
tmux show-options -g
tmux show-options -w
tmux show-options -p

# Show key bindings
tmux list-keys
```

### Session Management

```bash
# Create session
tmux new-session -s name -d  # Detached

# Attach to session
tmux attach -t name

# Switch sessions
tmux switch-client -t name

# Rename session
tmux rename-session newname

# Kill session
tmux kill-session -t name
```

### Conditional Execution

```bash
# Run if condition true
tmux if-shell "test -f ~/.myrc" "source ~/.myrc"

# Check format condition (no shell)
tmux if-shell -F "#{==:#{pane_current_command},vim}" "..."
```

### Run Shell Commands

```bash
# Run in background
tmux run-shell "notify-send 'Done'"

# Run tmux command
tmux run-shell -C "display-message 'Hello'"
```

### Synchronization

```bash
# Wait for signal
tmux wait-for channel

# Send signal
tmux wait-for -S channel

# Lock/unlock channel
tmux wait-for -L channel
tmux wait-for -U channel
```

---

## Feature Ideas for worktrees-tui

Based on this research, potential features include:

### Current Capabilities (already implemented)
- Detect if running inside tmux (`TMUX` env var)
- Get current pane index (`display-message -p '#{pane_index}'`)
- List panes in window (`list-panes -F`)
- Send cd commands to other panes (`send-keys -t`)

### Potential Enhancements

1. **Enhanced Pane Selection**
   - Show pane numbers overlay (`display-panes`)
   - Support pane selection by ID or direction

2. **Worktree-Pane Association**
   - Track which worktree is active in which pane via `pane_current_path`
   - Color-code or mark panes by worktree

3. **Layout Management**
   - Create preferred layouts for worktree development
   - Split windows for new worktrees automatically

4. **Control Mode Integration**
   - Real-time updates when panes change
   - Subscribe to path changes

5. **History/Context Features**
   - Capture pane output for debugging
   - Search for errors across panes

6. **Hook Integration**
   - React to pane focus changes
   - Auto-update display when windows change

---

## References

- [tmux man page](https://www.man7.org/linux/man-pages/man1/tmux.1.html)
- [tmux GitHub Wiki - Formats](https://github.com/tmux/tmux/wiki/Formats)
- [tmux GitHub Wiki - Control Mode](https://github.com/tmux/tmux/wiki/Control-Mode)
- [tmux GitHub Wiki - Advanced Use](https://github.com/tmux/tmux/wiki/Advanced-Use)
- [libtmux Python API](https://github.com/tmux-python/libtmux)
- [tmux Cheat Sheet](https://tmuxcheatsheet.com/)
