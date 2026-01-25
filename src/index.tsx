#!/usr/bin/env node
import { render, Box, Text, useApp, useInput, useStdout } from "ink";
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { program } from "commander";
import { cosmiconfigSync } from "cosmiconfig";
import { existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import { getWorktrees, sortWorktrees, Worktree, SortOrder, GitDetails, getAllWorktreeDetails } from "./git.js";
import { sendCdToPane, selectPane, findPanesWithPath, movePaneToLeft, movePaneToRight, togglePaneWidth, getClaudeSessions, ClaudeSession } from "./tmux.js";

const execAsync = promisify(exec);
import { Theme, loadTheme, DEFAULT_THEME, BUILT_IN_THEMES, getAvailableThemes, loadThemeByOption, ThemeOption, DEFAULT_SESSION_ICONS } from "./theme.js";

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

interface Hooks {
  beforeAdd?: string;
  afterAdd?: string;
  beforeRemove?: string;
  afterRemove?: string;
}

interface HookEnv {
  TREEMUX_ACTION: "add" | "remove";
  TREEMUX_WORKTREE_NAME: string;
  TREEMUX_WORKTREE_PATH: string;
  TREEMUX_WORKTREE_BRANCH: string;
  TREEMUX_ROOT: string;
  TREEMUX_COMMIT?: string;
}

function executeHook(hookScript: string | undefined, env: HookEnv): { success: boolean; error?: string } {
  if (!hookScript) return { success: true };

  try {
    execSync(hookScript, {
      encoding: "utf-8",
      stdio: "pipe",
      env: {
        ...process.env,
        ...env,
      },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hook failed";
    return { success: false, error: message };
  }
}

async function executeHookAsync(hookScript: string | undefined, env: HookEnv): Promise<{ success: boolean; error?: string }> {
  if (!hookScript) return { success: true };

  try {
    await execAsync(hookScript, {
      encoding: "utf-8",
      env: {
        ...process.env,
        ...env,
      },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hook failed";
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const ThemeContext = createContext<Theme>(DEFAULT_THEME);
const useTheme = () => useContext(ThemeContext);

const FlashDurationContext = createContext<number>(5000);
const useFlashDuration = () => useContext(FlashDurationContext);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Header({ width }: { width: number }) {
  const theme = useTheme();

  // Choose header based on terminal width
  if (width >= 70 && theme.header.large) {
    return (
      <Box flexDirection="column" alignItems="center" marginTop={1}>
        {theme.header.large.split("\n").map((line, i) => (
          <Text key={i} color={i % 2 === 0 ? theme.colors.primary : theme.colors.secondary}>{line}</Text>
        ))}
      </Box>
    );
  } else if (width >= 45 && theme.header.compact) {
    return (
      <Box flexDirection="column" alignItems="center" marginTop={1}>
        {theme.header.compact.split("\n").map((line, i) => (
          <Text key={i} color={theme.colors.primary}>{line}</Text>
        ))}
      </Box>
    );
  } else {
    return (
      <Box justifyContent="center" marginTop={1}>
        <Text bold color={theme.colors.secondary}>{theme.icons.dividerLeft ? `${theme.icons.dividerLeft} ` : ""}</Text>
        <Text bold color={theme.colors.primary}>{theme.header.minimal}</Text>
        <Text bold color={theme.colors.secondary}>{theme.icons.dividerRight ? ` ${theme.icons.dividerRight}` : ""}</Text>
      </Box>
    );
  }
}

function Divider({ width }: { width: number }) {
  const theme = useTheme();
  return <Text color={theme.colors.border}>{"─".repeat(Math.max(1, width - 2))}</Text>;
}

function WorktreeItem({ worktree, isSelected, details }: { worktree: Worktree; isSelected: boolean; details?: GitDetails }) {
  const theme = useTheme();
  const indicator = isSelected ? theme.icons.selected : " ";

  if (isSelected) {
    return (
      <Box>
        <Text color={theme.colors.selection} bold>{indicator} </Text>
        <Text color={theme.colors.selectionText} bold inverse>{` ${worktree.branch} `}</Text>
        {details && (
          <Text>
            {" "}
            {details.ahead > 0 && <Text color={theme.colors.success}>↑{details.ahead}</Text>}
            {details.behind > 0 && <Text color={theme.colors.error}>↓{details.behind}</Text>}
            {details.staged > 0 && <Text color={theme.colors.warning}>+{details.staged}</Text>}
            {details.modified > 0 && <Text color={theme.colors.accent}>~{details.modified}</Text>}
            {details.untracked > 0 && <Text color={theme.colors.textMuted}>?{details.untracked}</Text>}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Text color={theme.colors.textMuted}>{indicator} </Text>
      <Text color={theme.colors.textHighlight}> {worktree.branch}</Text>
      {details && (
        <Text>
          {" "}
          {details.ahead > 0 && <Text color={theme.colors.success}>↑{details.ahead}</Text>}
          {details.behind > 0 && <Text color={theme.colors.error}>↓{details.behind}</Text>}
          {details.staged > 0 && <Text color={theme.colors.warning}>+{details.staged}</Text>}
          {details.modified > 0 && <Text color={theme.colors.accent}>~{details.modified}</Text>}
          {details.untracked > 0 && <Text color={theme.colors.textMuted}>?{details.untracked}</Text>}
        </Text>
      )}
    </Box>
  );
}

function InputPrompt({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Box>
      <Text color={theme.colors.secondary}>{"▸ "}</Text>
      <Text color={theme.colors.textMuted}>{label}: </Text>
      <Text color={theme.colors.primary} bold>{value}</Text>
      <Text color={theme.colors.secondary}>{"█"}</Text>
    </Box>
  );
}

type Status = { type: "success" | "error" | "working"; message: string } | null;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function StatusMessage({ status }: { status: Status }) {
  const theme = useTheme();
  const [spinnerFrame, setSpinnerFrame] = useState(0);

  useEffect(() => {
    if (status?.type !== "working") return;
    const interval = setInterval(() => {
      setSpinnerFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(interval);
  }, [status?.type]);

  if (!status) return null;

  if (status.type === "working") {
    return (
      <Box>
        <Text color={theme.colors.primary}>{SPINNER_FRAMES[spinnerFrame]} </Text>
        <Text color={theme.colors.primary}>{status.message}</Text>
      </Box>
    );
  }

  const isSuccess = status.type === "success";
  const icon = isSuccess ? theme.icons.check : theme.icons.cross;
  const color = isSuccess ? theme.colors.success : theme.colors.error;

  return (
    <Box>
      <Text color={color}>{icon} </Text>
      <Text color={color}>{status.message}</Text>
    </Box>
  );
}

function KeyHint({ keys, action }: { keys: string; action: string }) {
  const theme = useTheme();
  return (
    <Box marginRight={1}>
      <Text color={theme.colors.primary}>[</Text>
      <Text color={theme.colors.secondary} bold>{keys}</Text>
      <Text color={theme.colors.primary}>]</Text>
      <Text color={theme.colors.textMuted}>{action} </Text>
    </Box>
  );
}

type Mode = "list" | "add" | "theme";
type FocusSection = "branches" | "sessions";

function HelpBar({ mode, sortOrder, focusSection, hasSessions }: { mode: Mode; sortOrder?: SortOrder; focusSection?: FocusSection; hasSessions?: boolean }) {
  if (mode === "add") {
    return (
      <Box>
        <KeyHint keys="↵" action="create" />
        <KeyHint keys="esc" action="cancel" />
      </Box>
    );
  }

  if (mode === "theme") {
    return (
      <Box>
        <KeyHint keys="↑k" action="up" />
        <KeyHint keys="↓j" action="dn" />
        <KeyHint keys="↵" action="select" />
        <KeyHint keys="esc" action="cancel" />
      </Box>
    );
  }

  // Sessions mode
  if (focusSection === "sessions") {
    return (
      <Box flexWrap="wrap">
        <KeyHint keys="↑k" action="up" />
        <KeyHint keys="↓j" action="dn" />
        <KeyHint keys="g/↵" action="go" />
        <KeyHint keys="⇥" action="branches" />
        <KeyHint keys="t" action="theme" />
        <KeyHint keys="q" action="show" />
        <KeyHint keys="␣" action="min" />
        <KeyHint keys="^C" action="quit" />
      </Box>
    );
  }

  // Branches mode (default)
  return (
    <Box flexWrap="wrap">
      <KeyHint keys="↑k" action="up" />
      <KeyHint keys="↓j" action="dn" />
      <KeyHint keys="a" action="add" />
      <KeyHint keys="r" action="rm" />
      <KeyHint keys="s" action="sort" />
      <KeyHint keys="t" action="theme" />
      <KeyHint keys="0-9" action="pane" />
      <KeyHint keys="g" action="go" />
      {hasSessions && <KeyHint keys="⇥" action="sessions" />}
      <KeyHint keys="q" action="show" />
      <KeyHint keys="␣" action="min" />
      <KeyHint keys="^C" action="quit" />
    </Box>
  );
}

function ThemeItem({ themeOption, isSelected }: { themeOption: ThemeOption; isSelected: boolean }) {
  const theme = useTheme();
  const indicator = isSelected ? theme.icons.selected : " ";

  if (isSelected) {
    return (
      <Box>
        <Text color={theme.colors.selection} bold>{indicator} </Text>
        <Text color={theme.colors.selectionText} bold inverse>{` ${themeOption.name} `}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color={theme.colors.textMuted}>{indicator} </Text>
      <Text color={theme.colors.textHighlight}> {themeOption.name}</Text>
    </Box>
  );
}

function PaneIndicator({ pane }: { pane: number | null }) {
  const theme = useTheme();
  if (pane === null) return null;
  return (
    <Box>
      <Text color={theme.colors.textMuted}>{theme.icons.arrow} pane </Text>
      <Text color={theme.colors.accent} bold>{pane}</Text>
    </Box>
  );
}

function SortIndicator({ sortOrder }: { sortOrder: SortOrder }) {
  const theme = useTheme();
  const icon = sortOrder === "recent" ? theme.icons.sortRecent : theme.icons.sortBranch;
  return (
    <Box marginLeft={1}>
      <Text color={theme.colors.textMuted}>│ </Text>
      <Text color={theme.colors.accent}>{icon} </Text>
      <Text color={theme.colors.textHighlight}>{sortOrder}</Text>
    </Box>
  );
}

function ClaudeSessionItem({ session, isSelected, debugMode, worktrees }: { session: ClaudeSession; isSelected: boolean; debugMode?: boolean; worktrees: Worktree[] }) {
  const theme = useTheme();
  const flashDurationMs = useFlashDuration();

  // For devcontainer sessions, try to resolve branch from hostCwd
  let displayName: string;
  if (session.isDevcontainer && session.hostCwd) {
    const worktree = worktrees.find(w => w.path === session.hostCwd);
    displayName = worktree?.branch || session.cwd.split("/").slice(-2).join("/");
  } else {
    // Shorten the cwd for display (last 2 path components)
    displayName = session.cwd.split("/").slice(-2).join("/");
  }
  const indicator = isSelected ? theme.icons.selected : " ";

  // Flash state for waiting indicator (flashes for flashDuration, then stays solid)
  const [flashOn, setFlashOn] = useState(true);
  const [flashExpired, setFlashExpired] = useState(false);
  useEffect(() => {
    if (session.waitingForInput) {
      // Reset flash state when entering waiting
      setFlashExpired(false);
      setFlashOn(true);

      // Flash interval (toggle every 500ms)
      const interval = setInterval(() => setFlashOn(f => !f), 500);

      // Stop flashing after duration (0 = flash forever)
      let timeout: ReturnType<typeof setTimeout> | undefined;
      if (flashDurationMs > 0) {
        timeout = setTimeout(() => {
          setFlashExpired(true);
          setFlashOn(true);
        }, flashDurationMs);
      }

      return () => {
        clearInterval(interval);
        if (timeout) clearTimeout(timeout);
      };
    }
    setFlashOn(true);
    setFlashExpired(false);
  }, [session.waitingForInput, flashDurationMs]);

  // Status indicator: waiting = paused (needs your input), working = active (Claude responding)
  const hasStatus = session.waitingForInput !== undefined;
  const waitingIcon = theme.icons.sessionWaiting ?? DEFAULT_SESSION_ICONS.sessionWaiting;
  const workingIcon = theme.icons.sessionWorking ?? DEFAULT_SESSION_ICONS.sessionWorking;
  const statusIcon = session.waitingForInput ? waitingIcon : workingIcon;
  const statusColor = session.waitingForInput ? theme.colors.warning : theme.colors.success;
  const statusPadding = "     ";
  const isFlashing = session.waitingForInput && !flashExpired;
  const showWaitingIndicator = !isFlashing || flashOn;

  // Devcontainer indicator
  const devcontainerIcon = theme.icons.devcontainer ?? DEFAULT_SESSION_ICONS.devcontainer;
  const devcontainerBadge = session.isDevcontainer ? (
    <Text color={theme.colors.accent}> {devcontainerIcon}</Text>
  ) : null;

  if (isSelected) {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color={theme.colors.selection} bold>{indicator} </Text>
          <Text color={hasStatus && showWaitingIndicator ? statusColor : undefined}>{hasStatus && showWaitingIndicator ? statusIcon : " "} </Text>
          <Text color={theme.colors.selectionText} bold inverse>{`${displayName} `}</Text>
          <Text color={theme.colors.textMuted}> (</Text>
          <Text color={theme.colors.textMuted}>{session.windowName}:</Text>
          <Text color={theme.colors.primary} bold>{session.paneIndex}</Text>
          <Text color={theme.colors.textMuted}>)</Text>
          {devcontainerBadge}
          {debugMode && (
            <Text color={theme.colors.textMuted}> pid:{session.pid}{session.hostname ? ` @${session.hostname}` : ""}</Text>
          )}
        </Box>
        {session.summary && (
          <Box>
            <Text color={theme.colors.textMuted}>{statusPadding}</Text>
            <Text color={theme.colors.accent}>{session.summary}</Text>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.colors.textMuted}>{indicator} </Text>
        <Text color={hasStatus && showWaitingIndicator ? statusColor : undefined}>{hasStatus && showWaitingIndicator ? statusIcon : " "} </Text>
        <Text color={theme.colors.textHighlight}>{displayName}</Text>
        <Text color={theme.colors.textMuted}> (</Text>
        <Text color={theme.colors.textMuted}>{session.windowName}:</Text>
        <Text color={theme.colors.primary}>{session.paneIndex}</Text>
        <Text color={theme.colors.textMuted}>)</Text>
        {devcontainerBadge}
        {debugMode && (
          <Text color={theme.colors.textMuted}> pid:{session.pid}{session.hostname ? ` @${session.hostname}` : ""}</Text>
        )}
      </Box>
      {session.summary && (
        <Box>
          <Text color={theme.colors.textMuted}>{statusPadding}</Text>
          <Text color={theme.colors.textMuted} dimColor>{session.summary}</Text>
        </Box>
      )}
    </Box>
  );
}

function ClaudeSessionsSection({ sessions, selectedIndex, isFocused, debugMode, worktrees }: { sessions: ClaudeSession[]; selectedIndex: number; isFocused: boolean; debugMode?: boolean; worktrees: Worktree[] }) {
  const theme = useTheme();

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box marginBottom={1}>
        <Text color={theme.colors.secondary}>{theme.icons.sectionMarker} </Text>
        <Text color={isFocused ? theme.colors.primary : theme.colors.textMuted}>CLAUDE SESSIONS </Text>
        <Text color={theme.colors.textHighlight}>({sessions.length})</Text>
      </Box>
      {sessions.length === 0 ? (
        <Box paddingX={2}>
          <Text color={theme.colors.textMuted}>{"░░░ "}</Text>
          <Text color={theme.colors.textMuted} dimColor>No active sessions</Text>
          <Text color={theme.colors.textMuted}>{" ░░░"}</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {sessions.map((session, index) => (
            <ClaudeSessionItem
              key={session.paneId}
              session={session}
              isSelected={isFocused && index === selectedIndex}
              debugMode={debugMode}
              worktrees={worktrees}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function MinimizedView({ height }: { height: number }) {
  const theme = useTheme();
  const text = "TREEMUX";
  const textHeight = text.length;
  const paddingTop = Math.max(0, Math.floor((height - textHeight) / 2));

  return (
    <Box flexDirection="column" alignItems="center" height={height}>
      <Box flexDirection="column" marginTop={paddingTop}>
        {text.split("").map((char, i) => (
          <Text key={i} color={i % 2 === 0 ? theme.colors.primary : theme.colors.secondary} bold>
            {char}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function SnapshotView({ root, defaultSort, showDetails, theme }: {
  root: string;
  defaultSort: SortOrder;
  showDetails: boolean;
  theme: Theme;
}) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const worktrees = getWorktrees(root);
  const sortedWorktrees = sortWorktrees(worktrees, defaultSort);
  const [gitDetails, setGitDetails] = useState<Map<string, GitDetails>>(new Map());
  const claudeSessions = getClaudeSessions();

  const termWidth = stdout.columns || 80;
  const termHeight = stdout.rows || 24;

  // Fetch git details once
  useEffect(() => {
    if (showDetails && worktrees.length > 0) {
      getAllWorktreeDetails(worktrees).then((details) => {
        setGitDetails(details);
        // Exit after rendering with details
        setTimeout(() => exit(), 50);
      });
    } else {
      // Exit immediately if no details needed
      setTimeout(() => exit(), 50);
    }
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <Box
        flexDirection="column"
        width={termWidth}
        height={termHeight}
        paddingX={1}
      >
        {/* HEADER */}
        <Header width={termWidth} />

        {/* Decorative divider after header */}
        <Box marginY={1} justifyContent="center">
          <Text color={theme.colors.secondary}>{theme.icons.dividerLeft}</Text>
          <Divider width={Math.min(50, termWidth - 4)} />
          <Text color={theme.colors.secondary}>{theme.icons.dividerRight}</Text>
        </Box>

        {/* CONTENT AREA */}
        <Box flexDirection="column" paddingX={1}>
          {/* Section header */}
          <Box marginBottom={1}>
            <Text color={theme.colors.secondary}>{theme.icons.sectionMarker} </Text>
            <Text color={theme.colors.textMuted}>BRANCHES </Text>
            <Text color={theme.colors.textHighlight}>({sortedWorktrees.length})</Text>
            <SortIndicator sortOrder={defaultSort} />
          </Box>

          {/* Worktree list */}
          {sortedWorktrees.length === 0 ? (
            <Box paddingX={2}>
              <Text color={theme.colors.textMuted}>{"░░░ "}</Text>
              <Text color={theme.colors.warning} dimColor>No worktrees found</Text>
              <Text color={theme.colors.textMuted}>{" ░░░"}</Text>
            </Box>
          ) : (
            <Box flexDirection="column">
              {sortedWorktrees.map((wt, index) => (
                <WorktreeItem
                  key={wt.path}
                  worktree={wt}
                  isSelected={index === 0}
                  details={showDetails ? gitDetails.get(wt.path) : undefined}
                />
              ))}
            </Box>
          )}

          {/* Claude Sessions section */}
          <ClaudeSessionsSection sessions={claudeSessions} selectedIndex={0} isFocused={false} worktrees={worktrees} />
        </Box>

        {/* SPACER */}
        <Box flexGrow={1} />

        {/* STATUS BAR */}
        <Box flexDirection="column">
          {/* Status message */}
          <Box height={1} paddingX={1}>
            <Text color={theme.colors.textMuted}>snapshot mode</Text>
          </Box>

          {/* Bottom divider */}
          <Box justifyContent="center">
            <Text color={theme.colors.border}>{"─".repeat(Math.min(60, termWidth - 4))}</Text>
          </Box>

          {/* Help bar */}
          <Box paddingX={1} paddingY={0}>
            <HelpBar mode="list" sortOrder={defaultSort} />
          </Box>
        </Box>
      </Box>
    </ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI SETUP
// ═══════════════════════════════════════════════════════════════════════════════

program
  .option("-c, --config <path>", "path to config file")
  .option("-r, --root <path>", "root directory for worktrees")
  .option("-p, --poll <ms>", "polling interval in milliseconds (0 to disable)")
  .option("-w, --worktrees-dir <path>", "directory name for new worktrees")
  .option("-s, --sort <order>", "sort order: recent or branch (default: recent)")
  .option("-d, --details", "show git details (commits ahead/behind, modified files)")
  .option("--no-details", "hide git details")
  .option("-t, --theme <name|path>", `theme name or path to JSON (built-in: ${Object.keys(BUILT_IN_THEMES).join(", ")})`)
  .option("--flash-duration <ms>", "how long waiting indicator flashes in ms (0 = forever, default: 5000)")
  .option("--snapshot", "render once and exit (non-interactive mode, bypasses tmux check)")
  .option("--install-plugin", "install the TreeMux session tracker plugin for Claude Code")
  .option("--hook-before-add <script>", "script to run before adding a worktree")
  .option("--hook-after-add <script>", "script to run after adding a worktree")
  .option("--hook-before-remove <script>", "script to run before removing a worktree")
  .option("--hook-after-remove <script>", "script to run after removing a worktree")
  .parse();

const cliOptions = program.opts<{
  config?: string;
  root?: string;
  poll?: string;
  worktreesDir?: string;
  sort?: string;
  details?: boolean;
  theme?: string;
  flashDuration?: string;
  snapshot?: boolean;
  installPlugin?: boolean;
  hookBeforeAdd?: string;
  hookAfterAdd?: string;
  hookBeforeRemove?: string;
  hookAfterRemove?: string;
}>();

// Handle --install-plugin flag
if (cliOptions.installPlugin) {
  console.log("Installing TreeMux session tracker plugin for Claude Code...\n");

  try {
    // Add the marketplace from GitHub
    console.log("Adding TreeMux marketplace...");
    execSync("claude plugin marketplace add jonrad/treemux", {
      stdio: "inherit",
    });

    // Then install the plugin
    console.log("\nInstalling session-tracker plugin...");
    execSync("claude plugin install session-tracker@treemux-plugins", {
      stdio: "inherit",
    });

    console.log("\nPlugin installed successfully!");
    console.log("The session tracker will now show status indicators in TreeMux.");
  } catch (err) {
    console.error("\nAutomatic installation failed.");
    console.error("Please install manually by running these commands in Claude Code:\n");
    console.error("  /plugin marketplace add jonrad/treemux");
    console.error("  /plugin install session-tracker@treemux-plugins");
    process.exit(1);
  }
  process.exit(0);
}

// Load config file (from --config path or searches package.json, .treemuxrc, treemux.config.js, etc.)
const explorer = cosmiconfigSync("treemux");
let configResult;
if (cliOptions.config) {
  const configPath = resolve(cliOptions.config);
  if (!existsSync(configPath)) {
    console.error(`Error: Config file does not exist: ${configPath}`);
    process.exit(1);
  }
  configResult = explorer.load(configPath);
} else {
  configResult = explorer.search();
}
const fileConfig = configResult?.config ?? {};

// Merge: defaults < config file < CLI args
// For details: default is true, config can override, CLI can override config
const detailsDefault = fileConfig.details !== undefined ? fileConfig.details : true;
const fileHooks = fileConfig.hooks ?? {};
const options = {
  root: cliOptions.root ?? fileConfig.root,
  poll: cliOptions.poll ?? fileConfig.poll ?? "500",
  worktreesDir: cliOptions.worktreesDir ?? fileConfig.worktreesDir ?? ".worktrees",
  sort: (cliOptions.sort ?? fileConfig.sort ?? "recent") as SortOrder,
  details: cliOptions.details !== undefined ? cliOptions.details : detailsDefault,
  theme: cliOptions.theme ?? fileConfig.theme ?? "forest",
  flashDuration: cliOptions.flashDuration ?? fileConfig.flashDuration ?? "5000",
  hooks: {
    beforeAdd: cliOptions.hookBeforeAdd ?? fileHooks.beforeAdd,
    afterAdd: cliOptions.hookAfterAdd ?? fileHooks.afterAdd,
    beforeRemove: cliOptions.hookBeforeRemove ?? fileHooks.beforeRemove,
    afterRemove: cliOptions.hookAfterRemove ?? fileHooks.afterRemove,
  } as Hooks,
};

const snapshotMode = cliOptions.snapshot ?? false;

if (!snapshotMode && !process.env.TMUX) {
  console.error("Error: TreeMux must be run inside a tmux session.");
  console.error("Start tmux first with: tmux");
  process.exit(1);
}

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
const theme = loadTheme(options.theme);
const flashDuration = parseInt(options.flashDuration, 10);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

function App({ root, pollInterval, worktreesDir, defaultSort, showDetails, initialTheme, onThemeChange, hooks }: {
  root: string;
  pollInterval: number;
  worktreesDir: string;
  defaultSort: SortOrder;
  showDetails: boolean;
  initialTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  hooks: Hooks;
}) {
  const theme = useTheme();
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [worktrees, setWorktrees] = useState<Worktree[]>(() =>
    getWorktrees(root)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("list");
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [paneHistory, setPaneHistory] = useState<Record<string, number>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSort);
  const [gitDetails, setGitDetails] = useState<Map<string, GitDetails>>(new Map());
  const [storedPaneWidth, setStoredPaneWidth] = useState<number | null>(null);

  // Theme picker state
  const [availableThemes] = useState<ThemeOption[]>(() => getAvailableThemes());
  const [themeIndex, setThemeIndex] = useState(0);

  // Claude sessions state
  const [claudeSessions, setClaudeSessions] = useState<ClaudeSession[]>(() => getClaudeSessions());
  const [focusSection, setFocusSection] = useState<FocusSection>("branches");
  const [sessionIndex, setSessionIndex] = useState(0);

  // Debug mode
  const [debugMode, setDebugMode] = useState(false);

  const sortedWorktrees = sortWorktrees(worktrees, sortOrder);

  const termWidth = stdout.columns || 80;
  const termHeight = stdout.rows || 24;

  // Get the current pane for selected worktree
  const selectedWorktree = sortedWorktrees[selectedIndex];
  const currentPane = selectedWorktree ? paneHistory[selectedWorktree.path] ?? null : null;

  const refreshWorktrees = useCallback(() => {
    setWorktrees(getWorktrees(root));
  }, [root]);

  const createWorktree = useCallback(async (name: string) => {
    const worktreePath = join(root, worktreesDir, name);

    // Check if worktree already exists
    const existingWorktree = worktrees.find(
      (wt) => wt.name === name || wt.path === worktreePath
    );
    if (existingWorktree) {
      setStatus({ type: "error", message: `Worktree '${name}' already exists` });
      return;
    }

    const hookEnv: HookEnv = {
      TREEMUX_ACTION: "add",
      TREEMUX_WORKTREE_NAME: name,
      TREEMUX_WORKTREE_PATH: worktreePath,
      TREEMUX_WORKTREE_BRANCH: name,
      TREEMUX_ROOT: root,
    };

    // Run before hook
    const beforeResult = executeHook(hooks.beforeAdd, hookEnv);
    if (!beforeResult.success) {
      setStatus({ type: "error", message: `Before-add hook failed: ${beforeResult.error}` });
      return;
    }

    try {
      setStatus({ type: "working", message: `Creating worktree '${name}'...` });

      await execAsync(`git worktree add "${worktreePath}"`, {
        cwd: root,
        encoding: "utf-8",
      });

      // Run after hook (async since it may take time, e.g., devcontainer setup)
      if (hooks.afterAdd) {
        setStatus({ type: "working", message: `Running post-create hooks for '${name}'...` });
      }
      const afterResult = await executeHookAsync(hooks.afterAdd, hookEnv);
      if (!afterResult.success) {
        setStatus({ type: "error", message: `Created worktree but after-add hook failed: ${afterResult.error}` });
      } else {
        setStatus({ type: "success", message: `Created worktree '${name}'` });
      }
      refreshWorktrees();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create worktree";
      setStatus({ type: "error", message });
    }
  }, [root, worktreesDir, worktrees, refreshWorktrees, hooks]);

  const removeWorktree = useCallback((worktree: Worktree) => {
    const hookEnv: HookEnv = {
      TREEMUX_ACTION: "remove",
      TREEMUX_WORKTREE_NAME: worktree.name,
      TREEMUX_WORKTREE_PATH: worktree.path,
      TREEMUX_WORKTREE_BRANCH: worktree.branch,
      TREEMUX_ROOT: root,
      TREEMUX_COMMIT: worktree.commit,
    };

    // Run before hook
    const beforeResult = executeHook(hooks.beforeRemove, hookEnv);
    if (!beforeResult.success) {
      setStatus({ type: "error", message: `Before-remove hook failed: ${beforeResult.error}` });
      return;
    }

    try {
      execSync(`git worktree remove "${worktree.path}"`, {
        cwd: root,
        encoding: "utf-8",
        stdio: "pipe",
      });

      // Run after hook
      const afterResult = executeHook(hooks.afterRemove, hookEnv);
      if (!afterResult.success) {
        setStatus({ type: "error", message: `Removed worktree but after-remove hook failed: ${afterResult.error}` });
      } else {
        setStatus({ type: "success", message: `Removed worktree '${worktree.name}'` });
      }
      refreshWorktrees();
    } catch (err) {
      let message = "Failed to remove worktree";
      if (err instanceof Error && err.message) {
        // Extract the actual git error message from stderr
        const match = err.message.match(/fatal: (.+)/);
        message = match ? match[1] : err.message;
      }
      setStatus({ type: "error", message });
    }
  }, [root, refreshWorktrees, hooks]);

  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(() => {
      const updated = getWorktrees(root);
      setWorktrees(updated);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [root, pollInterval]);

  useEffect(() => {
    if (selectedIndex >= sortedWorktrees.length && sortedWorktrees.length > 0) {
      setSelectedIndex(sortedWorktrees.length - 1);
    }
  }, [sortedWorktrees.length, selectedIndex]);

  // Fetch git details asynchronously
  useEffect(() => {
    if (!showDetails || worktrees.length === 0) return;

    // Fetch immediately
    getAllWorktreeDetails(worktrees).then(setGitDetails);

    // Then fetch on interval (use same poll interval, minimum 2s for details)
    const detailsInterval = Math.max(pollInterval, 2000);
    if (detailsInterval <= 0) return;

    const interval = setInterval(() => {
      getAllWorktreeDetails(worktrees).then(setGitDetails);
    }, detailsInterval);

    return () => clearInterval(interval);
  }, [showDetails, worktrees, pollInterval]);

  // Poll for Claude sessions
  useEffect(() => {
    if (pollInterval <= 0) return;

    // Use a slightly longer interval for session detection (minimum 1s)
    const sessionInterval = Math.max(pollInterval, 1000);

    const interval = setInterval(() => {
      setClaudeSessions(getClaudeSessions());
    }, sessionInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

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

    if (mode === "theme") {
      if (key.escape) {
        setMode("list");
        return;
      }

      if (key.return) {
        const selectedTheme = availableThemes[themeIndex];
        if (selectedTheme) {
          const newTheme = loadThemeByOption(selectedTheme);
          onThemeChange(newTheme);
          setStatus({ type: "success", message: `Theme changed to '${selectedTheme.name}'` });
        }
        setMode("list");
        return;
      }

      if (key.upArrow || input === "k") {
        setThemeIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (key.downArrow || input === "j") {
        setThemeIndex((prev) =>
          prev < availableThemes.length - 1 ? prev + 1 : prev
        );
      }
      return;
    }

    // List mode
    if (key.ctrl && input === "c") {
      exit();
    }

    // Tab to switch between sections
    if (key.tab) {
      if (claudeSessions.length > 0) {
        setFocusSection((prev) => prev === "branches" ? "sessions" : "branches");
      }
      return;
    }

    if (input === "q") {
      execSync("tmux display-panes -N ''", { stdio: "ignore" });
      return;
    }

    if (input === "<") {
      const result = movePaneToLeft();
      if (result.success) {
        setStatus({ type: "success", message: "Moved pane to left" });
      } else {
        setStatus({ type: "error", message: result.error || "Failed to move pane" });
      }
      return;
    }

    if (input === ">") {
      const result = movePaneToRight();
      if (result.success) {
        setStatus({ type: "success", message: "Moved pane to right" });
      } else {
        setStatus({ type: "error", message: result.error || "Failed to move pane" });
      }
      return;
    }

    if (input === " ") {
      const result = togglePaneWidth(storedPaneWidth);
      if (result.success) {
        if (result.wasMinimized) {
          setStoredPaneWidth(result.newWidth!);
          setStatus({ type: "success", message: "Minimized pane" });
        } else {
          setStoredPaneWidth(null);
          setStatus({ type: "success", message: "Restored pane width" });
        }
      } else {
        setStatus({ type: "error", message: result.error || "Failed to toggle pane width" });
      }
      return;
    }

    if (input === "s") {
      setSortOrder((prev) => (prev === "recent" ? "branch" : "recent"));
      return;
    }

    if (input === "t") {
      setMode("theme");
      // Find current theme index
      const currentIndex = availableThemes.findIndex(t => t.name === theme.name);
      setThemeIndex(currentIndex >= 0 ? currentIndex : 0);
      return;
    }

    if (input === "d") {
      setDebugMode((prev) => !prev);
      return;
    }

    // Branch-only commands
    if (focusSection === "branches") {
      if (input === "a") {
        setMode("add");
        setInputValue("");
        return;
      }

      if (input === "r") {
        const selected = sortedWorktrees[selectedIndex];
        if (selected) {
          removeWorktree(selected);
        }
        return;
      }

      if (key.upArrow || input === "k") {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (key.downArrow || input === "j") {
        if (selectedIndex >= sortedWorktrees.length - 1 && claudeSessions.length > 0) {
          // Move to sessions when going past last branch
          setFocusSection("sessions");
          setSessionIndex(0);
        } else {
          setSelectedIndex((prev) =>
            prev < sortedWorktrees.length - 1 ? prev + 1 : prev
          );
        }
      }

      // Number keys 0-9 send cd to that pane
      if (/^[0-9]$/.test(input)) {
        const paneIndex = parseInt(input, 10);
        const selected = sortedWorktrees[selectedIndex];
        if (selected) {
          const result = sendCdToPane(paneIndex, selected.path);
          if (result.success) {
            setPaneHistory((prev) => ({ ...prev, [selected.path]: paneIndex }));
            setStatus({ type: "success", message: `Sent cd to pane ${paneIndex}` });
          } else {
            setStatus({ type: "error", message: result.error || "Failed to send to pane" });
          }
        }
      }

      // Go to pane (uses history or detects by cwd)
      if (input === "g") {
        const selected = sortedWorktrees[selectedIndex];
        if (!selected) {
          return;
        }

        let targetPane: number | undefined = paneHistory[selected.path];

        // If no history for this worktree, try to find a pane by matching cwd
        if (targetPane === undefined) {
          const matchingPanes = findPanesWithPath(selected.path);
          if (matchingPanes.length === 1) {
            targetPane = matchingPanes[0].index;
            setPaneHistory((prev) => ({ ...prev, [selected.path]: targetPane! }));
          } else if (matchingPanes.length === 0) {
            setStatus({ type: "error", message: "No pane found. Use 0-9 to send cd first." });
            return;
          } else {
            setStatus({ type: "error", message: `Multiple panes found (${matchingPanes.map(p => p.index).join(", ")})` });
            return;
          }
        }

        const result = selectPane(targetPane);
        if (!result.success) {
          setStatus({ type: "error", message: result.error || "Failed to go to pane" });
        }
      }
    }

    // Session commands
    if (focusSection === "sessions") {
      if (claudeSessions.length === 0) return;

      if (key.upArrow || input === "k") {
        if (sessionIndex <= 0 && sortedWorktrees.length > 0) {
          // Move to branches when going past first session
          setFocusSection("branches");
          setSelectedIndex(sortedWorktrees.length - 1);
        } else {
          setSessionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }

      if (key.downArrow || input === "j") {
        setSessionIndex((prev) =>
          prev < claudeSessions.length - 1 ? prev + 1 : prev
        );
      }

      // Go to session pane
      if (input === "g" || key.return) {
        const session = claudeSessions[sessionIndex];
        if (session) {
          const result = selectPane(session.paneIndex);
          if (!result.success) {
            setStatus({ type: "error", message: result.error || "Failed to go to pane" });
          }
        }
      }
    }
  });

  // Keep session index in bounds
  useEffect(() => {
    if (sessionIndex >= claudeSessions.length && claudeSessions.length > 0) {
      setSessionIndex(claudeSessions.length - 1);
    }
    // Switch to branches if no sessions left
    if (claudeSessions.length === 0 && focusSection === "sessions") {
      setFocusSection("branches");
    }
  }, [claudeSessions.length, sessionIndex, focusSection]);


  // Show minimized view when pane is shrunk
  if (storedPaneWidth !== null) {
    return <MinimizedView height={termHeight} />;
  }

  return (
    <Box
      flexDirection="column"
      width={termWidth}
      height={termHeight}
      paddingX={1}
    >
      {/* HEADER */}
      <Header width={termWidth} />

      {/* Decorative divider after header */}
      <Box marginY={1} justifyContent="center">
        <Text color={theme.colors.secondary}>{theme.icons.dividerLeft}</Text>
        <Divider width={Math.min(50, termWidth - 4)} />
        <Text color={theme.colors.secondary}>{theme.icons.dividerRight}</Text>
      </Box>

      {/* CONTENT AREA */}
      {mode === "add" ? (
        <Box flexDirection="column" paddingX={2}>
          <Box marginBottom={1}>
            <Text color={theme.colors.secondary} bold>{"┌─ "}</Text>
            <Text color={theme.colors.primary} bold>NEW WORKTREE</Text>
            <Text color={theme.colors.secondary} bold>{" ─┐"}</Text>
          </Box>
          <InputPrompt label="Name" value={inputValue} />
        </Box>
      ) : mode === "theme" ? (
        <Box flexDirection="column" paddingX={2}>
          <Box marginBottom={1}>
            <Text color={theme.colors.secondary} bold>{"┌─ "}</Text>
            <Text color={theme.colors.primary} bold>SELECT THEME</Text>
            <Text color={theme.colors.secondary} bold>{" ─┐"}</Text>
          </Box>
          <Box flexDirection="column">
            {availableThemes.map((themeOption, index) => (
              <ThemeItem
                key={themeOption.name}
                themeOption={themeOption}
                isSelected={index === themeIndex}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" paddingX={1}>
          {/* Section header */}
          <Box marginBottom={1}>
            <Text color={theme.colors.secondary}>{theme.icons.sectionMarker} </Text>
            <Text color={focusSection === "branches" ? theme.colors.primary : theme.colors.textMuted}>BRANCHES </Text>
            <Text color={theme.colors.textHighlight}>({sortedWorktrees.length})</Text>
            <SortIndicator sortOrder={sortOrder} />
            <PaneIndicator pane={currentPane} />
          </Box>

          {/* Worktree list */}
          {sortedWorktrees.length === 0 ? (
            <Box paddingX={2}>
              <Text color={theme.colors.textMuted}>{"░░░ "}</Text>
              <Text color={theme.colors.warning} dimColor>No worktrees found</Text>
              <Text color={theme.colors.textMuted}>{" ░░░"}</Text>
            </Box>
          ) : (
            <Box flexDirection="column">
              {sortedWorktrees.map((wt, index) => (
                <WorktreeItem
                  key={wt.path}
                  worktree={wt}
                  isSelected={focusSection === "branches" && index === selectedIndex}
                  details={showDetails ? gitDetails.get(wt.path) : undefined}
                />
              ))}
            </Box>
          )}

          {/* Claude Sessions section */}
          <ClaudeSessionsSection
            sessions={claudeSessions}
            selectedIndex={sessionIndex}
            isFocused={focusSection === "sessions"}
            debugMode={debugMode}
            worktrees={worktrees}
          />
        </Box>
      )}

      {/* SPACER */}
      <Box flexGrow={1} />

      {/* STATUS BAR */}
      <Box flexDirection="column">
        {/* Status message */}
        <Box height={1} paddingX={1}>
          <StatusMessage status={status} />
        </Box>

        {/* Bottom divider */}
        <Box justifyContent="center">
          <Text color={theme.colors.border}>{"─".repeat(Math.min(60, termWidth - 4))}</Text>
        </Box>

        {/* Help bar */}
        <Box paddingX={1} paddingY={0}>
          <HelpBar mode={mode} sortOrder={sortOrder} focusSection={focusSection} hasSessions={claudeSessions.length > 0} />
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT WITH THEME STATE
// ═══════════════════════════════════════════════════════════════════════════════

function Root({ initialTheme, showDetails, hooks }: { initialTheme: Theme; showDetails: boolean; hooks: Hooks }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialTheme);

  return (
    <ThemeContext.Provider value={currentTheme}>
      <FlashDurationContext.Provider value={flashDuration}>
        <App
          root={root}
          pollInterval={pollInterval}
          worktreesDir={worktreesDir}
          defaultSort={options.sort}
          showDetails={showDetails}
          initialTheme={initialTheme}
          onThemeChange={setCurrentTheme}
          hooks={hooks}
        />
      </FlashDurationContext.Provider>
    </ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

if (snapshotMode) {
  const instance = render(
    <SnapshotView
      root={root}
      defaultSort={options.sort}
      showDetails={options.details}
      theme={theme}
    />
  );
  instance.waitUntilExit();
} else {
  render(<Root initialTheme={theme} showDetails={options.details} hooks={options.hooks} />);
}
