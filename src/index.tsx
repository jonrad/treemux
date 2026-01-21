#!/usr/bin/env node
import { render, Box, Text, useApp, useInput, useStdout } from "ink";
import { useState, useEffect, useCallback } from "react";
import { program } from "commander";
import { existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";
import { getWorktrees, Worktree } from "./git.js";

program
  .option("-r, --root <path>", "root directory for worktrees")
  .option("-p, --poll <ms>", "polling interval in milliseconds (0 to disable)", "500")
  .option("-w, --worktrees-dir <path>", "directory name for new worktrees", ".worktrees")
  .parse();

const options = program.opts<{ root?: string; poll: string; worktreesDir: string }>();

let root = process.cwd();
if (options.root) {
  const resolvedPath = resolve(options.root);
  if (!existsSync(resolvedPath)) {
    console.error(`Error: Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }
  root = resolvedPath;
}

const pollInterval = parseInt(options.poll, 10);
const worktreesDir = options.worktreesDir;

type Mode = "list" | "add";
type Status = { type: "success" | "error"; message: string } | null;

function App({ root, pollInterval, worktreesDir }: { root: string; pollInterval: number; worktreesDir: string }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [worktrees, setWorktrees] = useState<Worktree[]>(() =>
    getWorktrees(root)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("list");
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<Status>(null);

  const refreshWorktrees = useCallback(() => {
    setWorktrees(getWorktrees(root));
  }, [root]);

  const createWorktree = useCallback((name: string) => {
    const worktreePath = join(root, worktreesDir, name);

    // Check if worktree already exists
    const existingWorktree = worktrees.find(
      (wt) => wt.name === name || wt.path === worktreePath
    );
    if (existingWorktree) {
      setStatus({ type: "error", message: `Worktree '${name}' already exists` });
      return;
    }

    try {
      execSync(`git worktree add "${worktreePath}"`, {
        cwd: root,
        encoding: "utf-8",
        stdio: "pipe",
      });
      setStatus({ type: "success", message: `Created worktree '${name}'` });
      refreshWorktrees();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create worktree";
      setStatus({ type: "error", message });
    }
  }, [root, worktreesDir, worktrees, refreshWorktrees]);

  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(() => {
      const updated = getWorktrees(root);
      setWorktrees(updated);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [root, pollInterval]);

  useEffect(() => {
    if (selectedIndex >= worktrees.length && worktrees.length > 0) {
      setSelectedIndex(worktrees.length - 1);
    }
  }, [worktrees.length, selectedIndex]);

  useInput((input, key) => {
    // Clear status on any input
    if (status) {
      setStatus(null);
    }

    if (mode === "add") {
      if (key.escape) {
        setMode("list");
        setInputValue("");
        return;
      }

      if (key.return) {
        if (inputValue.trim()) {
          createWorktree(inputValue.trim());
        }
        setMode("list");
        setInputValue("");
        return;
      }

      if (key.backspace || key.delete) {
        setInputValue((prev) => prev.slice(0, -1));
        return;
      }

      // Add printable characters
      if (input && !key.ctrl && !key.meta) {
        setInputValue((prev) => prev + input);
      }
      return;
    }

    // List mode
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
    }

    if (input === "a") {
      setMode("add");
      setInputValue("");
      return;
    }

    if (worktrees.length === 0) return;

    if (key.upArrow || input === "k") {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }

    if (key.downArrow || input === "j") {
      setSelectedIndex((prev) =>
        prev < worktrees.length - 1 ? prev + 1 : prev
      );
    }
  });

  return (
    <Box
      flexDirection="column"
      width={stdout.columns}
      height={stdout.rows}
      padding={1}
    >
      {/* Header */}
      <Text bold color="green">
        worktrees-tui
      </Text>

      {/* Status message */}
      {status && (
        <Box marginTop={1}>
          <Text color={status.type === "success" ? "green" : "red"}>
            {status.message}
          </Text>
        </Box>
      )}

      {/* Directories / Content */}
      {mode === "add" ? (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text>Worktree name: </Text>
            <Text color="cyan">{inputValue}</Text>
            <Text color="cyan">▋</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {worktrees.length === 0 ? (
            <Text dimColor>No worktrees found</Text>
          ) : (
            worktrees.map((wt, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Box key={wt.path}>
                  <Text inverse={isSelected}>
                    {isSelected ? "❯ " : "  "}
                    {wt.name}
                  </Text>
                  <Text dimColor> [{wt.branch}]</Text>
                </Box>
              );
            })
          )}
        </Box>
      )}

      {/* Flexible spacer */}
      <Box flexGrow={1} />

      {/* Key map */}
      <Box>
        {mode === "add" ? (
          <Text dimColor>Enter to create • Esc to cancel</Text>
        ) : (
          <Text dimColor>↑/k up • ↓/j down • a add • q quit</Text>
        )}
      </Box>
    </Box>
  );
}

render(<App root={root} pollInterval={pollInterval} worktreesDir={worktreesDir} />);
