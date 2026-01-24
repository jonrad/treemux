import { execSync } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface TmuxPane {
  index: number;
  id: string;
}

export interface TmuxPaneWithCwd extends TmuxPane {
  cwd: string;
}

export interface TmuxPaneWithProcess extends TmuxPane {
  cwd: string;
  command: string;
  pid: number;
  windowName: string;
}

export interface ClaudeSession {
  paneIndex: number;
  paneId: string;
  cwd: string;
  windowName: string;
  pid: number;
  summary?: string;
  waitingForInput?: boolean;
  hostname?: string;
  isDevcontainer?: boolean;
}

/**
 * Check if we're running inside tmux
 */
export function isInTmux(): boolean {
  return !!process.env.TMUX;
}

/**
 * Get the current pane ID from TMUX_PANE environment variable
 * This is more reliable than using tmux display-message which shows the active pane
 */
export function getCurrentPaneId(): string | null {
  return process.env.TMUX_PANE || null;
}

/**
 * Get the current pane index
 * Note: This returns the *active* pane index, not necessarily the pane where this code is running.
 * Use getCurrentPaneId() for the pane where this process started.
 */
export function getCurrentPaneIndex(): number {
  const output = execSync("tmux display-message -p '#{pane_index}'", {
    encoding: "utf-8",
  });
  return parseInt(output.trim(), 10);
}

/**
 * Get all panes in the current window
 */
export function getPanesInCurrentWindow(): TmuxPane[] {
  const output = execSync("tmux list-panes -F '#{pane_index} #{pane_id}'", {
    encoding: "utf-8",
  });

  return output
    .trim()
    .split("\n")
    .filter((line) => line)
    .map((line) => {
      const [indexStr, id] = line.split(" ");
      return { index: parseInt(indexStr, 10), id };
    });
}

/**
 * Get all panes in the current window with their current working directories
 */
export function getPanesWithCwd(): TmuxPaneWithCwd[] {
  const output = execSync(
    "tmux list-panes -F '#{pane_index} #{pane_id} #{pane_current_path}'",
    { encoding: "utf-8" }
  );

  return output
    .trim()
    .split("\n")
    .filter((line) => line)
    .map((line) => {
      const parts = line.split(" ");
      const index = parseInt(parts[0], 10);
      const id = parts[1];
      const cwd = parts.slice(2).join(" "); // Handle paths with spaces
      return { index, id, cwd };
    });
}

/**
 * Find panes whose cwd matches a given path, excluding the current pane
 */
export function findPanesWithPath(path: string): TmuxPaneWithCwd[] {
  const panes = getPanesWithCwd();
  const currentPaneId = getCurrentPaneId();

  return panes.filter(
    (pane) => pane.cwd === path && (!currentPaneId || pane.id !== currentPaneId)
  );
}

/**
 * Send keys to a specific pane by index
 */
export function sendKeysToPane(paneIndex: number, keys: string): void {
  // Escape any special characters for tmux
  const escapedKeys = keys.replace(/"/g, '\\"');
  execSync(`tmux send-keys -t :.${paneIndex} "${escapedKeys}"`, {
    encoding: "utf-8",
  });
}

export interface SendToPaneResult {
  success: boolean;
  error?: string;
}

/**
 * Send a cd command to change directory in a specific pane
 * Returns an error message if the operation fails
 */
export function sendCdToPane(paneIndex: number, path: string): SendToPaneResult {
  if (!isInTmux()) {
    return { success: false, error: "Not running inside tmux" };
  }

  const panes = getPanesInCurrentWindow();
  const targetPane = panes.find((p) => p.index === paneIndex);

  if (!targetPane) {
    const validPanes = panes.map((p) => p.index).join(", ");
    return {
      success: false,
      error: `Pane ${paneIndex} not found. Valid panes: ${validPanes}`,
    };
  }

  const currentPaneIndex = getCurrentPaneIndex();
  if (currentPaneIndex === paneIndex) {
    return { success: false, error: "Cannot send to current pane" };
  }

  sendKeysToPane(paneIndex, `cd "${path}"\n`);
  return { success: true };
}

/**
 * Get the current window ID
 */
export function getCurrentWindow(): string {
  return execSync("tmux display-message -p '#{window_id}'", {
    encoding: "utf-8",
  }).trim();
}

/**
 * Move current pane to the leftmost position (full height, preserving width)
 */
export function movePaneToLeft(): SendToPaneResult {
  if (!isInTmux()) {
    return { success: false, error: "Not in tmux" };
  }

  try {
    const windowId = getCurrentWindow();
    // Get current pane ID and width before breaking
    const paneId = execSync("tmux display-message -p '#{pane_id}'", {
      encoding: "utf-8",
    }).trim();
    const paneWidth = execSync("tmux display-message -p '#{pane_width}'", {
      encoding: "utf-8",
    }).trim();
    // Break pane to temp window (-d keeps focus)
    execSync("tmux break-pane -d", { stdio: "ignore" });
    // Join back at left using the pane ID (-f for full height)
    execSync(`tmux join-pane -fbh -s ${paneId} -t ${windowId}`, { stdio: "ignore" });
    // Restore original width
    execSync(`tmux resize-pane -t ${paneId} -x ${paneWidth}`, { stdio: "ignore" });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to move pane left" };
  }
}

/**
 * Move current pane to the rightmost position (full height, preserving width)
 */
export function movePaneToRight(): SendToPaneResult {
  if (!isInTmux()) {
    return { success: false, error: "Not in tmux" };
  }

  try {
    const windowId = getCurrentWindow();
    // Get current pane ID and width before breaking
    const paneId = execSync("tmux display-message -p '#{pane_id}'", {
      encoding: "utf-8",
    }).trim();
    const paneWidth = execSync("tmux display-message -p '#{pane_width}'", {
      encoding: "utf-8",
    }).trim();
    // Break pane to temp window (-d keeps focus)
    execSync("tmux break-pane -d", { stdio: "ignore" });
    // Join back at right using the pane ID (-f for full height)
    execSync(`tmux join-pane -fh -s ${paneId} -t ${windowId}`, { stdio: "ignore" });
    // Restore original width
    execSync(`tmux resize-pane -t ${paneId} -x ${paneWidth}`, { stdio: "ignore" });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to move pane right" };
  }
}

/**
 * Select (focus) a specific pane by index
 */
export function selectPane(paneIndex: number): SendToPaneResult {
  if (!isInTmux()) {
    return { success: false, error: "Not running inside tmux" };
  }

  const panes = getPanesInCurrentWindow();
  const targetPane = panes.find((p) => p.index === paneIndex);

  if (!targetPane) {
    const validPanes = panes.map((p) => p.index).join(", ");
    return {
      success: false,
      error: `Pane ${paneIndex} not found. Valid panes: ${validPanes}`,
    };
  }

  try {
    execSync(`tmux select-pane -t :.${paneIndex}`, {
      encoding: "utf-8",
    });
    return { success: true };
  } catch {
    return { success: false, error: `Failed to select pane ${paneIndex}` };
  }
}

/**
 * Get the current pane's width
 */
export function getCurrentPaneWidth(): number {
  const output = execSync("tmux display-message -p '#{pane_width}'", {
    encoding: "utf-8",
  });
  return parseInt(output.trim(), 10);
}

/**
 * Resize the current pane to a specific width
 */
export function resizeCurrentPane(width: number): SendToPaneResult {
  if (!isInTmux()) {
    return { success: false, error: "Not in tmux" };
  }

  try {
    execSync(`tmux resize-pane -x ${width}`, { stdio: "ignore" });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to resize pane" };
  }
}

// Minimum pane width that keeps content visible
const MIN_PANE_WIDTH = 5;

export interface TogglePaneWidthResult {
  success: boolean;
  error?: string;
  wasMinimized?: boolean;
  newWidth?: number;
}

/**
 * Toggle pane width between minimum and a stored previous width.
 * If at minimum (or close to it), restores to previousWidth.
 * Otherwise, minimizes and returns the width to store.
 */
export function togglePaneWidth(previousWidth: number | null): TogglePaneWidthResult {
  if (!isInTmux()) {
    return { success: false, error: "Not in tmux" };
  }

  try {
    const currentWidth = getCurrentPaneWidth();

    // If we're at or near minimum and have a previous width, restore it
    if (currentWidth <= MIN_PANE_WIDTH + 2 && previousWidth !== null) {
      const result = resizeCurrentPane(previousWidth);
      if (!result.success) {
        return result;
      }
      return { success: true, wasMinimized: false, newWidth: previousWidth };
    }

    // Otherwise, minimize and return the current width to store
    const widthToStore = currentWidth;
    const result = resizeCurrentPane(MIN_PANE_WIDTH);
    if (!result.success) {
      return result;
    }
    return { success: true, wasMinimized: true, newWidth: widthToStore };
  } catch {
    return { success: false, error: "Failed to toggle pane width" };
  }
}

/**
 * Get all panes in the current window with process info
 */
export function getPanesWithProcessInfo(): TmuxPaneWithProcess[] {
  if (!isInTmux()) {
    return [];
  }

  try {
    const output = execSync(
      "tmux list-panes -F '#{pane_index} #{pane_id} #{pane_current_command} #{pane_pid} #{window_name} #{pane_current_path}'",
      { encoding: "utf-8" }
    );

    return output
      .trim()
      .split("\n")
      .filter((line) => line)
      .map((line) => {
        const parts = line.split(" ");
        const index = parseInt(parts[0], 10);
        const id = parts[1];
        const command = parts[2];
        const pid = parseInt(parts[3], 10);
        const windowName = parts[4];
        const cwd = parts.slice(5).join(" "); // Handle paths with spaces
        return { index, id, command, pid, windowName, cwd };
      });
  } catch {
    return [];
  }
}

interface TranscriptEntry {
  type: string;
  cwd?: string;
  message?: {
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  };
}

interface PluginSessionState {
  session_id: string;
  cwd: string;
  state: "start" | "working" | "waiting";
  pane_id: string;
  timestamp: string;
  hostname?: string;
  is_devcontainer?: boolean;
}

/**
 * Read session states from the TreeMux plugin state files.
 * Returns a map of pane_id -> state ("working" | "waiting").
 */
function getPluginSessionStates(): Map<string, string> {
  const states = new Map<string, string>();

  try {
    const stateDir = join(homedir(), ".claude", "treemux");
    const files = readdirSync(stateDir).filter(f => f.endsWith(".json"));

    for (const file of files) {
      try {
        const content = readFileSync(join(stateDir, file), "utf-8");
        const state: PluginSessionState = JSON.parse(content);
        if (state.pane_id && state.state) {
          states.set(state.pane_id, state.state);
        }
      } catch {
        // Skip malformed files
      }
    }
  } catch {
    // State directory doesn't exist (plugin not installed)
  }

  return states;
}

/**
 * Convert a tmux pane ID (e.g., "%3") to a pane index by looking up current panes.
 * Returns undefined if pane not found.
 */
function paneIdToIndex(paneId: string): number | undefined {
  if (!isInTmux()) return undefined;

  try {
    const panes = getPanesInCurrentWindow();
    const pane = panes.find(p => p.id === paneId);
    return pane?.index;
  } catch {
    return undefined;
  }
}

/**
 * Get devcontainer sessions from plugin state files.
 * These are sessions running inside devcontainers that have HOST_TMUX_PANE set.
 */
function getDevcontainerSessions(): ClaudeSession[] {
  const sessions: ClaudeSession[] = [];
  const currentPaneId = getCurrentPaneId();
  const summaries = getClaudeTranscriptSummaries();

  // Stale threshold: 2 minutes
  const staleThreshold = Date.now() - 2 * 60 * 1000;

  try {
    const stateDir = join(homedir(), ".claude", "treemux");
    const files = readdirSync(stateDir).filter(f => f.endsWith(".json"));

    for (const file of files) {
      try {
        const content = readFileSync(join(stateDir, file), "utf-8");
        const state: PluginSessionState = JSON.parse(content);

        // Only process devcontainer sessions
        if (!state.is_devcontainer) continue;

        // Skip if no valid pane_id
        if (!state.pane_id) continue;

        // Skip stale sessions (timestamp > 2 min old)
        const timestamp = new Date(state.timestamp).getTime();
        if (isNaN(timestamp) || timestamp < staleThreshold) continue;

        // Skip current pane
        if (currentPaneId && state.pane_id === currentPaneId) continue;

        // Convert pane_id to pane index
        const paneIndex = paneIdToIndex(state.pane_id);
        if (paneIndex === undefined) continue;

        // Get pane info for window name
        const panes = getPanesWithProcessInfo();
        const paneInfo = panes.find(p => p.id === state.pane_id);

        sessions.push({
          paneIndex,
          paneId: state.pane_id,
          cwd: state.cwd,
          windowName: paneInfo?.windowName || "devcontainer",
          pid: paneInfo?.pid || 0,
          summary: summaries.get(state.cwd),
          waitingForInput: state.state === "waiting" ? true : state.state === "working" ? false : undefined,
          hostname: state.hostname,
          isDevcontainer: true,
        });
      } catch {
        // Skip malformed files
      }
    }
  } catch {
    // State directory doesn't exist
  }

  return sessions;
}

/**
 * Find Claude transcript files and extract summaries for sessions by cwd.
 * Returns a map of cwd -> summary (first user message).
 */
function getClaudeTranscriptSummaries(): Map<string, string> {
  const summaries = new Map<string, string>();

  try {
    const claudeDir = join(homedir(), ".claude", "projects");
    const projectDirs = readdirSync(claudeDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => join(claudeDir, d.name));

    // Find recently modified transcript files (within last 5 minutes)
    const recentThreshold = Date.now() - 5 * 60 * 1000;

    for (const projectDir of projectDirs) {
      try {
        const files = readdirSync(projectDir)
          .filter(f => f.endsWith(".jsonl") && !f.startsWith("agent-"));

        for (const file of files) {
          const filePath = join(projectDir, file);
          try {
            const stat = statSync(filePath);
            if (stat.mtimeMs < recentThreshold) continue;

            const content = readFileSync(filePath, "utf-8");
            const lines = content.split("\n").filter(l => l.trim());

            let cwd: string | undefined;
            let summary: string | undefined;

            for (const line of lines) {
              try {
                const entry: TranscriptEntry = JSON.parse(line);

                if (entry.cwd && !cwd) {
                  cwd = entry.cwd;
                }

                if (entry.type === "user" && entry.message && !summary) {
                  const msgContent = entry.message.content;
                  let text = "";

                  if (typeof msgContent === "string") {
                    text = msgContent;
                  } else if (Array.isArray(msgContent)) {
                    text = msgContent
                      .filter(c => c.type === "text")
                      .map(c => c.text || "")
                      .join(" ");
                  }

                  if (!text || text === "null") continue;
                  if (text.includes("<local-command-caveat>")) continue;
                  if (text.includes("<local-command-stdout>")) continue;
                  if (text.match(/^<command-name>.*<\/command-name>\s*$/)) continue;

                  const argsMatch = text.match(/<command-args>\s*([\s\S]*?)<\/command-args>/);
                  if (argsMatch) {
                    text = argsMatch[1].trim();
                    if (!text) continue;
                  } else if (text.includes("<command-")) {
                    continue;
                  }

                  text = text.replace(/^#.*\n/gm, "").trim();
                  text = text.replace(/^\* /gm, "").trim();
                  const firstLine = text.split("\n")[0].trim();
                  if (!firstLine) continue;

                  text = firstLine;
                  if (text.length > 50) {
                    text = text.substring(0, 47) + "...";
                  }

                  if (text) {
                    summary = text;
                  }
                }

                if (cwd && summary) break;
              } catch {
                // Skip malformed lines
              }
            }

            if (cwd && summary) {
              summaries.set(cwd, summary);
            }
          } catch {
            // Skip files we can't read
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }
  } catch {
    // Claude directory doesn't exist or isn't readable
  }

  return summaries;
}

/**
 * Check if a command line args string looks like Claude Code
 */
function isClaudeCommand(args: string): boolean {
  const argsLower = args.toLowerCase();

  // Check for common Claude Code signatures in the command line
  if (
    argsLower.includes("@anthropic/claude-code") ||
    argsLower.includes("claude-code")
  ) {
    return true;
  }

  // Match standalone "claude" command (not part of another word like "claudette")
  // Matches: "claude", "/usr/bin/claude", "claude --flag", etc.
  if (/(?:^|\/|\s)claude(?:\s|$)/.test(argsLower)) {
    return true;
  }

  return false;
}

/**
 * Check if a process (or any of its descendants) is a Claude Code session.
 * Works on both Linux and macOS by using ps commands.
 */
function isClaudeProcessTree(rootPid: number): boolean {
  try {
    // Get all processes with their ppid and args
    // This works on both Linux and macOS
    const psOutput = execSync("ps -eo pid,ppid,args 2>/dev/null", {
      encoding: "utf-8",
    });

    const lines = psOutput.trim().split("\n").slice(1); // Skip header
    const processes = new Map<number, { ppid: number; args: string }>();

    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
      if (match) {
        const pid = parseInt(match[1], 10);
        const ppid = parseInt(match[2], 10);
        const args = match[3];
        processes.set(pid, { ppid, args });
      }
    }

    // First check the root process itself
    const rootProc = processes.get(rootPid);
    if (rootProc && isClaudeCommand(rootProc.args)) {
      return true;
    }

    // Find all descendants of rootPid using BFS
    const descendants: number[] = [];
    const queue = [rootPid];

    while (queue.length > 0) {
      const parentPid = queue.shift()!;
      for (const [pid, info] of processes) {
        if (info.ppid === parentPid && !descendants.includes(pid)) {
          descendants.push(pid);
          queue.push(pid);
        }
      }
    }

    // Check if any descendant is running Claude
    for (const pid of descendants) {
      const proc = processes.get(pid);
      if (proc && isClaudeCommand(proc.args)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Find panes running Claude Code by walking the process tree from each pane's shell.
 * Works cross-platform (Linux and macOS).
 * Also includes devcontainer sessions detected via plugin state files.
 */
export function getClaudeSessions(): ClaudeSession[] {
  if (!isInTmux()) {
    return [];
  }

  const panes = getPanesWithProcessInfo();
  const currentPaneId = getCurrentPaneId();
  const summaries = getClaudeTranscriptSummaries();
  const pluginStates = getPluginSessionStates();
  const sessions: ClaudeSession[] = [];
  const seenPaneIds = new Set<string>();

  // First, get local sessions via process tree (existing logic)
  for (const pane of panes) {
    // Skip current pane (where TreeMux is running)
    if (currentPaneId && pane.id === currentPaneId) {
      continue;
    }

    // Walk the process tree from the shell to find Claude
    if (pane.pid > 0 && isClaudeProcessTree(pane.pid)) {
      const state = pluginStates.get(pane.id);
      sessions.push({
        paneIndex: pane.index,
        paneId: pane.id,
        cwd: pane.cwd,
        windowName: pane.windowName,
        pid: pane.pid,
        summary: summaries.get(pane.cwd),
        // Only set waitingForInput if plugin is providing state
        waitingForInput: state === "waiting" ? true : state === "working" ? false : undefined,
      });
      seenPaneIds.add(pane.id);
    }
  }

  // Then, get devcontainer sessions from plugin state files
  const devcontainerSessions = getDevcontainerSessions();
  for (const session of devcontainerSessions) {
    // Avoid duplicates (if somehow detected both ways)
    if (!seenPaneIds.has(session.paneId)) {
      sessions.push(session);
      seenPaneIds.add(session.paneId);
    }
  }

  return sessions;
}
