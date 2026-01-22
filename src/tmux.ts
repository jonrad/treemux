import { execSync } from "child_process";

export interface TmuxPane {
  index: number;
  id: string;
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
