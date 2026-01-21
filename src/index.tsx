#!/usr/bin/env node
import { render, Box, Text, useApp, useInput } from "ink";
import { useState, useEffect } from "react";
import { program } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { getWorktrees, Worktree } from "./git.js";

program
  .option("-r, --root <path>", "root directory for worktrees")
  .option("-p, --poll <ms>", "polling interval in milliseconds (0 to disable)", "500")
  .parse();

const options = program.opts<{ root?: string; poll: string }>();

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

function App({ root, pollInterval }: { root: string; pollInterval: number }) {
  const { exit } = useApp();
  const [worktrees, setWorktrees] = useState<Worktree[]>(() =>
    getWorktrees(root)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
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
    <Box flexDirection="column" padding={1}>
      <Text bold color="green">
        worktrees-tui
      </Text>
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
      <Box marginTop={1}>
        <Text dimColor>↑/k up • ↓/j down • q quit</Text>
      </Box>
    </Box>
  );
}

render(<App root={root} pollInterval={pollInterval} />);
