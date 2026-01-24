# Lessons Learned

## DevContainer Improvements Needed

### 1. Claude commands in devcontainer
- Git worktree references point to host paths that don't exist in container
- Can't run git commands from inside the container
- Need to either mount full git directory or fix worktree paths

### 2. Claude skills in devcontainer
- Skills like `/commit` aren't available in this environment
- Need to ensure Claude Code skills are accessible within the container

### 3. Better tmux control in devcontainer
- Tmux is available but session management could be improved
- Creating panes for testing works but cleanup is manual
- Could benefit from predefined layouts or helper scripts

### 4. Better git integration
- main .git is readonly
- But copying and pasting git commands is annoying
