#!/usr/bin/env node
import { render, Box, Text, useApp, useInput } from "ink";
import { useState } from "react";
import { program } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

interface Worktree {
  path: string;
  name: string;
  branch: string;
  commit: string;
}

function getWorktrees(root: string): Worktree[] {
  try {
    const output = execSync("git worktree list --porcelain", {
      cwd: root,
      encoding: "utf-8",
    });

    const worktrees: Worktree[] = [];
    let current: Partial<Worktree> = {};

    for (const line of output.split("\n")) {
      if (line.startsWith("worktree ")) {
        current.path = line.slice(9);
        current.name = current.path.split("/").pop() || current.path;
      } else if (line.startsWith("HEAD ")) {
        current.commit = line.slice(5, 12);
      } else if (line.startsWith("branch ")) {
        current.branch = line.slice(7).replace("refs/heads/", "");
      } else if (line === "") {
        if (current.path) {
          worktrees.push(current as Worktree);
        }
        current = {};
      }
    }

    return worktrees;
  } catch {
    return [];
  }
}

program
  .option("-r, --root <path>", "root directory for worktrees")
  .parse();

const options = program.opts<{ root?: string }>();

let root = process.cwd();
if (options.root) {
  const resolvedPath = resolve(options.root);
  if (!existsSync(resolvedPath)) {
    console.error(`Error: Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }
  root = resolvedPath;
}

const initialWorktrees = getWorktrees(root);

function App() {
  const { exit } = useApp();
  const [worktrees] = useState<Worktree[]>(initialWorktrees);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

render(<App />);
