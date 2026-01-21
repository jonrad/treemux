#!/usr/bin/env node
import { render, Box, Text, useApp, useInput } from "ink";
import { program } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";

program
  .option("-r, --root <path>", "root directory for worktrees")
  .parse();

const options = program.opts<{ root?: string }>();

if (options.root) {
  const resolvedPath = resolve(options.root);
  if (!existsSync(resolvedPath)) {
    console.error(`Error: Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }
  options.root = resolvedPath;
}

function App({ root }: { root?: string }) {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="green">
        worktrees-tui
      </Text>
      {root && <Text>Root: {root}</Text>}
      <Text>Welcome to your Ink app!</Text>
      <Text dimColor>Press q to quit</Text>
    </Box>
  );
}

render(<App root={options.root} />);
