import { execSync, exec } from "child_process";
import { statSync } from "fs";

export type SortOrder = "recent" | "branch";

export interface GitDetails {
  ahead: number;
  behind: number;
  modified: number;
  staged: number;
  untracked: number;
}

export function getWorktreeDetails(worktreePath: string): Promise<GitDetails> {
  return new Promise((resolve) => {
    const details: GitDetails = {
      ahead: 0,
      behind: 0,
      modified: 0,
      staged: 0,
      untracked: 0,
    };

    // Get ahead/behind count
    exec(
      'git rev-list --left-right --count @{upstream}...HEAD 2>/dev/null',
      { cwd: worktreePath, encoding: "utf-8" },
      (err, stdout) => {
        if (!err && stdout.trim()) {
          const [behind, ahead] = stdout.trim().split(/\s+/).map(Number);
          details.behind = behind || 0;
          details.ahead = ahead || 0;
        }

        // Get status counts
        exec(
          'git status --porcelain 2>/dev/null',
          { cwd: worktreePath, encoding: "utf-8" },
          (err2, stdout2) => {
            if (!err2 && stdout2) {
              for (const line of stdout2.split('\n')) {
                if (!line) continue;
                const index = line[0];
                const working = line[1];

                if (index === '?' && working === '?') {
                  details.untracked++;
                } else {
                  if (index && index !== ' ' && index !== '?') {
                    details.staged++;
                  }
                  if (working && working !== ' ' && working !== '?') {
                    details.modified++;
                  }
                }
              }
            }
            resolve(details);
          }
        );
      }
    );
  });
}

export async function getAllWorktreeDetails(
  worktrees: Worktree[]
): Promise<Map<string, GitDetails>> {
  const results = new Map<string, GitDetails>();
  const promises = worktrees.map(async (wt) => {
    const details = await getWorktreeDetails(wt.path);
    results.set(wt.path, details);
  });
  await Promise.all(promises);
  return results;
}

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
