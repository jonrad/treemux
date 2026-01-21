import { execSync } from "child_process";

export interface Worktree {
  path: string;
  name: string;
  branch: string;
  commit: string;
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
