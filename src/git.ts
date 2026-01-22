import { execSync } from "child_process";
import { statSync } from "fs";

export type SortOrder = "recent" | "branch";

export function sortWorktrees(worktrees: Worktree[], sort: SortOrder): Worktree[] {
  return [...worktrees].sort((a, b) => {
    // Main branch always on top
    const aIsMain = a.branch === "main" || a.branch === "master";
    const bIsMain = b.branch === "main" || b.branch === "master";
    if (aIsMain && !bIsMain) return -1;
    if (bIsMain && !aIsMain) return 1;

    if (sort === "recent") {
      return b.mtime - a.mtime;
    } else {
      return a.branch.localeCompare(b.branch);
    }
  });
}

export interface Worktree {
  path: string;
  name: string;
  branch: string;
  commit: string;
  mtime: number;
}

export function getWorktrees(root: string): Worktree[] {
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
          try {
            current.mtime = statSync(current.path).mtimeMs;
          } catch {
            current.mtime = 0;
          }
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
