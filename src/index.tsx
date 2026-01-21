#!/usr/bin/env node
import { render, Box, Text } from "ink";

function App() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="green">
        worktrees-tui
      </Text>
      <Text>Welcome to your Ink app!</Text>
    </Box>
  );
}

render(<App />);
