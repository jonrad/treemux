#!/usr/bin/env node
import { render, Box, Text, useApp, useInput } from "ink";

function App() {
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
      <Text>Welcome to your Ink app!</Text>
      <Text dimColor>Press q to quit</Text>
    </Box>
  );
}

render(<App />);
