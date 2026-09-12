#!/usr/bin/env python3
"""
sync-forks.py (dots-sync-skills)

Comprehensive management & synchronization workflow for AI agent skill fork repositories:
- antigravity-superpowers (upstream: skainguyen1412/antigravity-superpowers)
- andrej-karpathy-skills (upstream: forrestchang/andrej-karpathy-skills)
- skills (upstream: google/skills)

Integrated with damathryxx64 Nix flake pins and Antigravity specifications.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
CYAN = "\033[36m"
RED = "\033[31m"
GRAY = "\033[90m"

WORKSPACE_ROOT = Path("/home/damathryxx64/repositories")
DOTS_REPO = WORKSPACE_ROOT / "damathryxx64"

MANAGED_REPOS = [
    {
        "name": "antigravity-superpowers",
        "path": WORKSPACE_ROOT / "antigravity-superpowers",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/antigravity-superpowers.git",
        "upstream_url": "https://github.com/skainguyen1412/antigravity-superpowers.git",
        "flake_input": "antigravity-superpowers",
        "main_branch": "main",
    },
    {
        "name": "andrej-karpathy-skills",
        "path": WORKSPACE_ROOT / "andrej-karpathy-skills",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/andrej-karpathy-skills.git",
        "upstream_url": "https://github.com/forrestchang/andrej-karpathy-skills.git",
        "flake_input": "andrej-karpathy-skills",
        "main_branch": "main",
    },
    {
        "name": "skills",
        "path": WORKSPACE_ROOT / "skills",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/skills.git",
        "upstream_url": "https://github.com/google/skills.git",
        "flake_input": "google-skills",
        "main_branch": "main",
    },
    {
        "name": "superpowers",
        "path": WORKSPACE_ROOT / "superpowers",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/superpowers.git",
        "upstream_url": "https://github.com/obra/superpowers.git",
        "flake_input": "superpowers",
        "main_branch": "main",
    },
    {
        "name": "NixOS-WSL",
        "path": WORKSPACE_ROOT / "NixOS-WSL",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/NixOS-WSL.git",
        "upstream_url": "https://github.com/nix-community/NixOS-WSL.git",
        "flake_input": "nixos-wsl",
        "main_branch": "main",
    },
    {
        "name": "i-have-adhd",
        "path": WORKSPACE_ROOT / "i-have-adhd",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/i-have-adhd.git",
        "upstream_url": "https://github.com/ayghri/i-have-adhd.git",
        "flake_input": "i-have-adhd",
        "main_branch": "main",
    },
]


def run_cmd(cmd, cwd=None, check=True, capture=True):
    """Run a shell command and return CompletedProcess."""
    res = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        shell=isinstance(cmd, str),
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )
    if check and res.returncode != 0:
        err = res.stderr.strip() if res.stderr else "Unknown error"
        print(f"{RED}Error executing command:{RESET} {cmd}\n{RED}{err}{RESET}")
        raise subprocess.CalledProcessError(res.returncode, cmd, res.stdout, res.stderr)
    return res


def get_flake_lock_revisions():
    """Read pinned revisions from damathryxx64/flake.lock."""
    lock_path = DOTS_REPO / "flake.lock"
    if not lock_path.exists():
        return {}
    try:
        with open(lock_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        nodes = data.get("nodes", {})
        revs = {}
        for node_name, node_info in nodes.items():
            locked = node_info.get("locked", {})
            if "rev" in locked:
                revs[node_name] = locked["rev"]
        return revs
    except Exception as e:
        print(f"{YELLOW}Warning reading flake.lock:{RESET} {e}")
        return {}


def ensure_remotes(repo):
    """Ensure origin and upstream remotes exist."""
    path = repo["path"]
    if not path.exists():
        print(f"{YELLOW}Cloning {repo['name']} from {repo['fork_url']}...{RESET}")
        run_cmd(["git", "clone", repo["fork_url"], str(path)], cwd=WORKSPACE_ROOT)

    remotes = run_cmd(["git", "remote"], cwd=path).stdout.split()
    if "origin" not in remotes:
        run_cmd(["git", "remote", "add", "origin", repo["fork_url"]], cwd=path)
    if "upstream" not in remotes:
        run_cmd(["git", "remote", "add", "upstream", repo["upstream_url"]], cwd=path)


def cmd_status():
    """Display the sync and lock status across all managed fork repositories."""
    print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN} AI Agent Skills Fork & Flake Status Report{RESET}")
    print(f"{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}\n")

    flake_revs = get_flake_lock_revisions()

    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        print(f"{BOLD}Repository:{RESET} {CYAN}{name}{RESET} ({path})")

        if not path.exists():
            print(f"  {RED}Directory does not exist locally.{RESET}\n")
            continue

        ensure_remotes(repo)

        # Working tree status
        dirty = run_cmd(["git", "status", "--porcelain"], cwd=path).stdout.strip()
        tree_status = f"{RED}Dirty (uncommitted changes){RESET}" if dirty else f"{GREEN}Clean{RESET}"

        # Current branch
        branch = run_cmd(["git", "branch", "--show-current"], cwd=path).stdout.strip()

        # Head commit
        head_commit = run_cmd(["git", "rev-parse", "--short", "HEAD"], cwd=path).stdout.strip()
        head_msg = run_cmd(["git", "log", "-1", "--format=%s"], cwd=path).stdout.strip()

        # Upstream status
        try:
            ahead_behind = run_cmd(
                ["git", "rev-list", "--left-right", "--count", f"HEAD...upstream/{repo['main_branch']}"],
                cwd=path,
            ).stdout.strip().split()
            ahead_up = ahead_behind[0]
            behind_up = ahead_behind[1]
            upstream_diff = f"{GREEN}+{ahead_up}{RESET} / {RED}-{behind_up}{RESET} vs upstream/{repo['main_branch']}"
        except Exception:
            upstream_diff = f"{YELLOW}upstream not fetched yet{RESET}"

        # Origin status
        try:
            ahead_behind_orig = run_cmd(
                ["git", "rev-list", "--left-right", "--count", f"HEAD...origin/{repo['main_branch']}"],
                cwd=path,
            ).stdout.strip().split()
            ahead_orig = ahead_behind_orig[0]
            behind_orig = ahead_behind_orig[1]
            origin_diff = f"{GREEN}+{ahead_orig}{RESET} / {RED}-{behind_orig}{RESET} vs origin/{repo['main_branch']}"
        except Exception:
            origin_diff = f"{YELLOW}origin not fetched yet{RESET}"

        # Flake lock status
        input_name = repo["flake_input"]
        pinned_rev = flake_revs.get(input_name, "Not in lockfile")
        if pinned_rev and len(pinned_rev) > 7:
            pinned_short = pinned_rev[:7]
            lock_sync = f"{GREEN}Synced ({pinned_short}){RESET}" if pinned_rev.startswith(head_commit) else f"{YELLOW}Out of sync (lock: {pinned_short}, local: {head_commit}){RESET}"
        else:
            lock_sync = f"{GRAY}{pinned_rev}{RESET}"

        print(f"  Branch:       {branch} [{tree_status}]")
        print(f"  HEAD:         {head_commit} - {head_msg[:60]}")
        print(f"  Upstream:     {upstream_diff}")
        print(f"  Origin:       {origin_diff}")
        print(f"  Flake Input:  {input_name} → {lock_sync}\n")


def cmd_fetch():
    """Fetch updates from both upstream and origin for all repositories."""
    print(f"\n{BOLD}{BLUE}Fetching all remotes (origin and upstream)...{RESET}")
    for repo in MANAGED_REPOS:
        path = repo["path"]
        print(f"  Fetching {CYAN}{repo['name']}{RESET}...")
        ensure_remotes(repo)
        run_cmd(["git", "fetch", "origin", "--quiet"], cwd=path)
        run_cmd(["git", "fetch", "upstream", "--quiet"], cwd=path)
    print(f"{GREEN}✓ All remotes fetched successfully.{RESET}\n")


def cmd_sync():
    """Sync and merge upstream commits into our fork branches."""
    cmd_fetch()
    print(f"{BOLD}{BLUE}Synchronizing with upstream...{RESET}")
    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        branch = repo["main_branch"]
        print(f"  Checking {CYAN}{name}{RESET}...")

        # Check if behind upstream
        behind_count = int(
            run_cmd(["git", "rev-list", "--count", f"HEAD..upstream/{branch}"], cwd=path).stdout.strip()
        )

        if behind_count == 0:
            print(f"    {GREEN}✓ Already up-to-date with upstream/{branch}.{RESET}")
            continue

        print(f"    {YELLOW}Found {behind_count} upstream commit(s). Merging...{RESET}")
        try:
            run_cmd(
                ["git", "merge", f"upstream/{branch}", "-m", f"sync: merge upstream/{branch} into {branch}"],
                cwd=path,
            )
            print(f"    {GREEN}✓ Upstream merged successfully.{RESET}")
        except subprocess.CalledProcessError:
            print(f"    {RED}Merge conflict detected in {name}! Manual resolution required.{RESET}")
            sys.exit(1)

    print(f"\n{GREEN}✓ Upstream synchronization complete.{RESET}\n")


def cmd_audit():
    """Audit skill frontmatter and metadata for Antigravity standards."""
    print(f"\n{BOLD}{BLUE}Auditing Skills for Antigravity Guidelines...{RESET}")
    total_skills = 0
    passed_skills = 0
    warnings = []

    for repo in MANAGED_REPOS:
        path = repo["path"]
        if not path.exists():
            continue

        skill_files = list(path.rglob("SKILL.md"))
        for sf in skill_files:
            total_skills += 1
            rel = sf.relative_to(WORKSPACE_ROOT)
            content = sf.read_text(encoding="utf-8", errors="replace")

            # Validate Frontmatter
            fm_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
            if not fm_match:
                warnings.append(f"{RED}[MISSING FRONTMATTER]{RESET} {rel}")
                continue

            fm_text = fm_match.group(1)
            name_match = re.search(r"^name:\s*([^\s]+)", fm_text, re.MULTILINE)
            desc_match = re.search(r"^description:\s*(.*)", fm_text, re.MULTILINE)

            if not name_match:
                warnings.append(f"{RED}[MISSING NAME]{RESET} {rel}")
            elif not re.match(r"^[a-zA-Z0-9_-]+$", name_match.group(1).strip()):
                warnings.append(f"{YELLOW}[INVALID NAME FORMAT]{RESET} {rel}: {name_match.group(1)}")

            if not desc_match:
                warnings.append(f"{RED}[MISSING DESCRIPTION]{RESET} {rel}")
            else:
                desc_text = desc_match.group(1).strip()
                if not desc_text:
                    warnings.append(f"{RED}[EMPTY DESCRIPTION]{RESET} {rel}")
                elif not desc_text.startswith("Use when") and not desc_text.startswith(">-"):
                    # Informational suggestion
                    pass

            passed_skills += 1

    print(f"  Scanned {total_skills} skills across repositories.")
    if warnings:
        print(f"  {YELLOW}Found {len(warnings)} issue(s):{RESET}")
        for w in warnings[:15]:
            print(f"    {w}")
        if len(warnings) > 15:
            print(f"    ... and {len(warnings) - 15} more.")
    else:
        print(f"  {GREEN}✓ All {total_skills} skills passed frontmatter integrity checks.{RESET}\n")


def cmd_push():
    """Push local branches to origin/main on GitHub."""
    print(f"\n{BOLD}{BLUE}Pushing fork repositories to GitHub...{RESET}")
    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        branch = repo["main_branch"]

        ahead_count = int(
            run_cmd(["git", "rev-list", "--count", f"origin/{branch}..HEAD"], cwd=path).stdout.strip()
        )

        if ahead_count == 0:
            print(f"  {GREEN}✓ {name} is already in sync with origin/{branch}.{RESET}")
            continue

        print(f"  Pushing {CYAN}{name}{RESET} ({ahead_count} commit(s) ahead)...")
        run_cmd(["git", "push", "origin", branch], cwd=path)
        print(f"  {GREEN}✓ {name} successfully pushed.{RESET}")

    print(f"\n{GREEN}✓ All forks are pushed and up to date on GitHub.{RESET}\n")


def cmd_bump_flake():
    """Update flake inputs in damathryxx64 for all agent skill repositories."""
    print(f"\n{BOLD}{BLUE}Updating flake inputs in damathryxx64...{RESET}")
    inputs = [repo["flake_input"] for repo in MANAGED_REPOS]
    cmd = ["nix", "flake", "update"] + inputs + ["--commit-lock-file"]
    print(f"  Running: {GRAY}{' '.join(cmd)}{RESET}")
    try:
        run_cmd(cmd, cwd=DOTS_REPO, capture=False)
        print(f"{GREEN}✓ Flake lockfile successfully updated.{RESET}\n")
    except Exception as e:
        print(f"{RED}Failed to update flake inputs:{RESET} {e}")
        # Try without --commit-lock-file if working tree had changes
        run_cmd(["nix", "flake", "update"] + inputs, cwd=DOTS_REPO, capture=False)
        print(f"{GREEN}✓ Flake lockfile updated (uncommitted).{RESET}\n")


def cmd_validate():
    """Format and validate damathryxx64 flake."""
    print(f"\n{BOLD}{BLUE}Validating damathryxx64 flake...{RESET}")
    print("  Formatting Nix expressions...")
    run_cmd(["nix", "fmt", "--", "."], cwd=DOTS_REPO, capture=False)
    print("  Running statix analysis...")
    run_cmd(["statix", "check", "."], cwd=DOTS_REPO, capture=False)
    print("  Running nix flake check --impure...")
    run_cmd(["nix", "flake", "check", "--impure"], cwd=DOTS_REPO, capture=False)
    print(f"{GREEN}✓ Flake validation completed successfully.{RESET}\n")


def cmd_rewrite():
    """Purge foreign provider configurations and enforce Antigravity / Gemini formats."""
    import shutil

    print(f"\n{BOLD}{BLUE}Purging non-Antigravity/non-Gemini providers & rewriting forks...{RESET}")

    foreign_dirs = [
        ".claude-plugin",
        ".codex-plugin",
        ".cursor-plugin",
        ".cursor",
        ".devin-plugin",
        ".hermes-plugin",
        ".kimi-plugin",
        ".opencode",
        ".pi",
    ]

    foreign_files = [
        "CLAUDE.md",
        "CURSOR.md",
        "kimi.plugin.json",
        "qwen-extension.json",
        "opencode.json",
        "hooks/hooks-cursor.json",
    ]

    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        if not path.exists() or name == "NixOS-WSL":
            continue

        print(f"  Processing {CYAN}{name}{RESET}...")
        removed_count = 0

        # Remove foreign directories
        for fdir in foreign_dirs:
            target = path / fdir
            if target.exists() and target.is_dir():
                shutil.rmtree(target)
                removed_count += 1

        # Remove foreign files
        for ffile in foreign_files:
            target = path / ffile
            if target.exists() and target.is_file():
                target.unlink()
                removed_count += 1

        # Enforce Antigravity / Gemini native structure in SKILL.md files
        for sf in path.rglob("SKILL.md"):
            content = sf.read_text(encoding="utf-8", errors="replace")
            orig = content
            # Strip disable-model-invocation: true
            content = re.sub(r"^disable-model-invocation:\s*true\s*$\n?", "", content, flags=re.MULTILINE)
            # Normalize provider mentions
            content = content.replace("Claude Code", "Antigravity CLI")
            content = content.replace("claude-code", "antigravity-cli")
            content = content.replace("OpenCode", "Antigravity CLI")
            content = content.replace("opencode", "antigravity-cli")
            if content != orig:
                sf.write_text(content, encoding="utf-8")

        # Check git status
        dirty = run_cmd(["git", "status", "--porcelain"], cwd=path).stdout.strip()
        if dirty:
            run_cmd(["git", "add", "-A"], cwd=path)
            run_cmd(
                ["git", "commit", "-m", "chore(provider-cleanup): purge foreign providers, adapt to Antigravity & Gemini format"],
                cwd=path,
            )
            print(f"    {GREEN}✓ Cleaned and committed Antigravity/Gemini adaptations in {name}.{RESET}")
        else:
            print(f"    {GREEN}✓ Already compliant with Antigravity/Gemini specifications.{RESET}")

    print(f"\n{GREEN}✓ Provider clean & rewrite completed.{RESET}\n")


def cmd_refresh():
    """Fetch/sync upstream commits, purge non-Antigravity/non-Gemini providers, and rewrite."""
    print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN} Refresh Skills: Sync Upstream & Rewrite to Antigravity/Gemini{RESET}")
    print(f"{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}\n")

    cmd_fetch()
    cmd_sync()
    cmd_rewrite()
    cmd_audit()

    # Declarative sync to ~/.gemini/config
    print(f"{BOLD}{BLUE}Synchronizing active skills to ~/.gemini/config...{RESET}")
    run_cmd(["systemctl", "--user", "start", "agent-skills-sync.service"], check=False)
    print(f"{GREEN}✓ Skills successfully refreshed in ~/.gemini/config!{RESET}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Manage and synchronize AI agent skill fork repositories with Nix flake and Antigravity."
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    subparsers.add_parser("status", help="Show status of all fork repositories and flake lock pins")
    subparsers.add_parser("fetch", help="Fetch origin and upstream for all repositories")
    subparsers.add_parser("sync", help="Merge upstream changes into fork branches")
    subparsers.add_parser("rewrite", help="Purge foreign providers and rewrite to Antigravity & Gemini")
    subparsers.add_parser("refresh", help="Full refresh: fetch, sync, rewrite to Antigravity/Gemini, audit & sync")
    subparsers.add_parser("audit", help="Audit skill frontmatter and Antigravity compliance")
    subparsers.add_parser("push", help="Push updated forks to origin/main")
    subparsers.add_parser("bump-flake", help="Update flake inputs in damathryxx64")
    subparsers.add_parser("validate", help="Validate damathryxx64 flake and formatting")
    subparsers.add_parser("all", help="Run full pipeline: fetch, sync, rewrite, audit, push, bump-flake, validate")

    args = parser.parse_args()
    cmd = args.command or "status"

    if cmd == "status":
        cmd_status()
    elif cmd == "fetch":
        cmd_fetch()
    elif cmd == "sync":
        cmd_sync()
    elif cmd == "rewrite":
        cmd_rewrite()
    elif cmd == "refresh":
        cmd_refresh()
    elif cmd == "audit":
        cmd_audit()
    elif cmd == "push":
        cmd_push()
    elif cmd == "bump-flake":
        cmd_bump_flake()
    elif cmd == "validate":
        cmd_validate()
    elif cmd == "all":
        cmd_fetch()
        cmd_sync()
        cmd_rewrite()
        cmd_audit()
        cmd_push()
        cmd_bump_flake()
        cmd_validate()


if __name__ == "__main__":
    main()
