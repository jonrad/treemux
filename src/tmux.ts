import { execSync } from "child_process";

export interface TmuxPane {
  index: number;
  id: string;
}

export interface TmuxPaneWithCwd extends TmuxPane {
  cwd: string;
}

/**
 * Check if we're running inside tmux
 */
export function isInTmux(): boolean {
  return !!process.env.TMUX;
}

/**
 * Get the current pane index
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
  const currentPaneIndex = getCurrentPaneIndex();

  return panes.filter(
    (pane) => pane.cwd === path && pane.index !== currentPaneIndex
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
