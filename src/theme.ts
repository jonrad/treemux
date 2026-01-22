import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

// ═══════════════════════════════════════════════════════════════════════════════
// THEME TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ThemeColors {
  // Primary accent colors
  primary: string;
  secondary: string;
  accent: string;

  // Text colors
  text: string;
  textMuted: string;
  textHighlight: string;

  // Status colors
  success: string;
  error: string;
  warning: string;

  // UI elements
  border: string;
  selection: string;
  selectionText: string;
}

export interface ThemeIcons {
  selected: string;
  bullet: string;
  diamond: string;
  arrow: string;
  check: string;
  cross: string;
  sortRecent: string;
  sortBranch: string;
  dividerLeft: string;
  dividerRight: string;
  sectionMarker: string;
}

export interface ThemeHeader {
  large: string;
  compact: string;
  minimal: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  icons: ThemeIcons;
  header: ThemeHeader;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN THEMES
// ═══════════════════════════════════════════════════════════════════════════════

export const THEME_CYBERPUNK: Theme = {
  name: "cyberpunk",
  colors: {
    primary: "#00FFFF",
    secondary: "#FF00FF",
    accent: "#39FF14",
    text: "#FFFFFF",
    textMuted: "#666666",
    textHighlight: "#00FFFF",
    success: "#39FF14",
    error: "#FF3366",
    warning: "#FFD93D",
    border: "#444444",
    selection: "#FF00FF",
    selectionText: "#00FFFF",
  },
  icons: {
    selected: "❯",
    bullet: "●",
    diamond: "◆",
    arrow: "→",
    check: "✓",
    cross: "✗",
    sortRecent: "⏱",
    sortBranch: "⎇",
    dividerLeft: "◆",
    dividerRight: "◆",
    sectionMarker: "▐",
  },
  header: {
    large: `
╔════════════════════════════════════════════════╗
║ ████████╗██████╗ ███████╗███████╗███╗   ███╗██╗   ██╗██╗  ██╗ ║
║ ╚══██╔══╝██╔══██╗██╔════╝██╔════╝████╗ ████║██║   ██║╚██╗██╔╝ ║
║    ██║   ██████╔╝█████╗  █████╗  ██╔████╔██║██║   ██║ ╚███╔╝  ║
║    ██║   ██╔══██╗██╔══╝  ██╔══╝  ██║╚██╔╝██║██║   ██║ ██╔██╗  ║
║    ██║   ██║  ██║███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██╔╝ ██╗ ║
║    ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ║
╚════════════════════════════════════════════════╝`.trim(),
    compact: `
┌───────────────────────────┐
│ ░▀█▀░█▀▄░█▀▀░█▀▀░█▄█░█░█░█░█ │
│ ░░█░░█▀▄░█▀▀░█▀▀░█░█░█░█░▄▀▄ │
│ ░░▀░░▀░▀░▀▀▀░▀▀▀░▀░▀░▀▀▀░▀░▀ │
└───────────────────────────┘`.trim(),
    minimal: "⟨ TREEMUX ⟩",
  },
};

export const THEME_MONOCHROME: Theme = {
  name: "monochrome",
  colors: {
    primary: "#FFFFFF",
    secondary: "#AAAAAA",
    accent: "#FFFFFF",
    text: "#FFFFFF",
    textMuted: "#666666",
    textHighlight: "#FFFFFF",
    success: "#FFFFFF",
    error: "#FFFFFF",
    warning: "#AAAAAA",
    border: "#555555",
    selection: "#FFFFFF",
    selectionText: "#FFFFFF",
  },
  icons: {
    selected: ">",
    bullet: "*",
    diamond: "+",
    arrow: "->",
    check: "[x]",
    cross: "[!]",
    sortRecent: "~",
    sortBranch: "#",
    dividerLeft: "-",
    dividerRight: "-",
    sectionMarker: "|",
  },
  header: {
    large: `
+------------------------------------------+
|  _____              __  __               |
| |_   _| __ ___  ___|  \\/  |_   ___  __   |
|   | || '__/ _ \\/ _ \\ |\\/| | | | \\ \\/ /   |
|   | || | |  __/  __/ |  | | |_| |>  <    |
|   |_||_|  \\___|\\___|_|  |_|\\__,_/_/\\_\\   |
+------------------------------------------+`.trim(),
    compact: `
+------------------+
|     TREEMUX      |
+------------------+`.trim(),
    minimal: "[ TREEMUX ]",
  },
};

export const THEME_OCEAN: Theme = {
  name: "ocean",
  colors: {
    primary: "#5FAFFF",
    secondary: "#87AFAF",
    accent: "#00AFAF",
    text: "#D7D7D7",
    textMuted: "#5F5F87",
    textHighlight: "#5FAFFF",
    success: "#5FAF5F",
    error: "#D75F5F",
    warning: "#D7AF5F",
    border: "#5F5F87",
    selection: "#5FAFFF",
    selectionText: "#5FAFFF",
  },
  icons: {
    selected: "▸",
    bullet: "◦",
    diamond: "◇",
    arrow: "›",
    check: "✔",
    cross: "✘",
    sortRecent: "◷",
    sortBranch: "⌥",
    dividerLeft: "~",
    dividerRight: "~",
    sectionMarker: "│",
  },
  header: {
    large: `
    ╭─────────────────────────────╮
    │ ·▪· T R E E M U X ·▪·       │
    │     ≋≋≋≋≋≋≋≋≋≋≋≋≋           │
    ╰─────────────────────────────╯`.trim(),
    compact: `
  ~ TREEMUX ~
  ≋≋≋≋≋≋≋≋≋≋≋`.trim(),
    minimal: "~ treemux ~",
  },
};

export const THEME_FOREST: Theme = {
  name: "forest",
  colors: {
    primary: "#8FBC8F",
    secondary: "#6B8E23",
    accent: "#98FB98",
    text: "#F5F5DC",
    textMuted: "#8FBC8F",
    textHighlight: "#98FB98",
    success: "#32CD32",
    error: "#CD5C5C",
    warning: "#DAA520",
    border: "#6B8E23",
    selection: "#6B8E23",
    selectionText: "#F5F5DC",
  },
  icons: {
    selected: "→",
    bullet: "•",
    diamond: "❖",
    arrow: "→",
    check: "✓",
    cross: "✗",
    sortRecent: "⧖",
    sortBranch: "⑂",
    dividerLeft: "❧",
    dividerRight: "❧",
    sectionMarker: "┃",
  },
  header: {
    large: `
    ╭─────────────────────────────╮
    │  🌲 T R E E M U X 🌲        │
    │  ════════════════           │
    ╰─────────────────────────────╯`.trim(),
    compact: `
  🌲 TREEMUX 🌲
  ════════════`.trim(),
    minimal: "🌲 treemux",
  },
};

export const THEME_SUNSET: Theme = {
  name: "sunset",
  colors: {
    primary: "#FF6B6B",
    secondary: "#FFE66D",
    accent: "#FF8E53",
    text: "#FFF5E6",
    textMuted: "#AA6644",
    textHighlight: "#FFE66D",
    success: "#88D498",
    error: "#FF6B6B",
    warning: "#FFE66D",
    border: "#AA6644",
    selection: "#FF8E53",
    selectionText: "#FF8E53",
  },
  icons: {
    selected: "◈",
    bullet: "○",
    diamond: "◆",
    arrow: "⟶",
    check: "●",
    cross: "○",
    sortRecent: "☀",
    sortBranch: "☾",
    dividerLeft: "✦",
    dividerRight: "✦",
    sectionMarker: "║",
  },
  header: {
    large: `
  ✦═══════════════════════════════✦
  ║   ▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▄    ║
  ║   █  T R E E M U X      █    ║
  ║   ▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀    ║
  ✦═══════════════════════════════✦`.trim(),
    compact: `
✦━━━━━━━━━━━━━━✦
┃   TREEMUX    ┃
✦━━━━━━━━━━━━━━✦`.trim(),
    minimal: "✦ TREEMUX ✦",
  },
};

export const THEME_MINIMAL: Theme = {
  name: "minimal",
  colors: {
    primary: "#EEEEEE",
    secondary: "#BBBBBB",
    accent: "#EEEEEE",
    text: "#DDDDDD",
    textMuted: "#777777",
    textHighlight: "#FFFFFF",
    success: "#AADDAA",
    error: "#DDAAAA",
    warning: "#DDDDAA",
    border: "#555555",
    selection: "#EEEEEE",
    selectionText: "#EEEEEE",
  },
  icons: {
    selected: ">",
    bullet: "-",
    diamond: "-",
    arrow: ">",
    check: "+",
    cross: "x",
    sortRecent: "t",
    sortBranch: "b",
    dividerLeft: "",
    dividerRight: "",
    sectionMarker: "",
  },
  header: {
    large: `
  treemux
  -------`.trim(),
    compact: `treemux
-------`.trim(),
    minimal: "treemux",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME REGISTRY & LOADING
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILT_IN_THEMES: Record<string, Theme> = {
  cyberpunk: THEME_CYBERPUNK,
  monochrome: THEME_MONOCHROME,
  ocean: THEME_OCEAN,
  forest: THEME_FOREST,
  sunset: THEME_SUNSET,
  minimal: THEME_MINIMAL,
};

export function loadTheme(themeNameOrPath: string): Theme {
  // Check if it's a built-in theme name
  if (BUILT_IN_THEMES[themeNameOrPath]) {
    return BUILT_IN_THEMES[themeNameOrPath];
  }

  // Try to load as a file path
  const themePath = resolve(themeNameOrPath);
  if (!existsSync(themePath)) {
    console.error(`Theme not found: ${themeNameOrPath}`);
    console.error(`Available built-in themes: ${Object.keys(BUILT_IN_THEMES).join(", ")}`);
    process.exit(1);
  }

  try {
    const themeContent = readFileSync(themePath, "utf-8");
    const themeData = JSON.parse(themeContent);
    return mergeWithDefaults(themeData);
  } catch (err) {
    console.error(`Failed to load theme from ${themePath}:`, err);
    process.exit(1);
  }
}

function mergeWithDefaults(partial: Partial<Theme>): Theme {
  const base = THEME_CYBERPUNK;
  return {
    name: partial.name ?? "custom",
    colors: { ...base.colors, ...partial.colors },
    icons: { ...base.icons, ...partial.icons },
    header: { ...base.header, ...partial.header },
  };
}

export const DEFAULT_THEME = THEME_CYBERPUNK;

export interface ThemeOption {
  name: string;
  path: string | null; // null for built-in themes
  isBuiltIn: boolean;
}

export function getAvailableThemes(themesDir?: string): ThemeOption[] {
  const themes: ThemeOption[] = [];

  // Add built-in themes
  for (const name of Object.keys(BUILT_IN_THEMES)) {
    themes.push({ name, path: null, isBuiltIn: true });
  }

  // Try to find themes directory relative to the module
  const possibleDirs: string[] = [];
  if (themesDir) {
    possibleDirs.push(themesDir);
  }

  // Check relative to current working directory
  possibleDirs.push(join(process.cwd(), "themes"));

  // Check relative to the module location
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    possibleDirs.push(join(__dirname, "..", "themes"));
    possibleDirs.push(join(__dirname, "themes"));
  } catch {
    // Ignore if import.meta.url is not available
  }

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const name = file.replace(".json", "");
            // Don't add if it's already a built-in theme name
            if (!BUILT_IN_THEMES[name]) {
              const fullPath = join(dir, file);
              // Check if we already added this theme
              if (!themes.some(t => t.name === name)) {
                themes.push({ name, path: fullPath, isBuiltIn: false });
              }
            }
          }
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  return themes;
}

export function loadThemeByOption(option: ThemeOption): Theme {
  if (option.isBuiltIn && option.path === null) {
    return BUILT_IN_THEMES[option.name];
  }
  if (option.path) {
    return loadTheme(option.path);
  }
  return DEFAULT_THEME;
}
