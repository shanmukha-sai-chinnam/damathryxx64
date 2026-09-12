#!/usr/bin/env python3
"""
sync-forks.py (dots-sync-skills)

Central CLI orchestrator for AI agent skills and managed repositories in damathryxx64:
- skills (Unified Gemini & Antigravity skills hub)
- antigravity-superpowers (CLI package derivation provider)
- NixOS-WSL (NixOS WSL distro builder)

Maintains zero drift across Git remotes, Nix flakes, and ~/.gemini/config/.
"""

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

# Terminal Colors
BOLD = "\033[1m"
RESET = "\033[0m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
CYAN = "\033[36m"
RED = "\033[31m"
GRAY = "\033[90m"

WORKSPACE_ROOT = Path("/home/damathryxx64/repositories")
DOTS_REPO = WORKSPACE_ROOT / "damathryxx64"
CONFIG_DIR = Path.home() / ".gemini" / "config"

MANAGED_REPOS = [
    {
        "name": "skills",
        "path": WORKSPACE_ROOT / "skills",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/skills.git",
        "upstream_url": None,  # Multi-upstream hub managed via scripts/sync-upstreams.py
        "flake_input": "gemini-skills",
        "main_branch": "main",
    },
    {
        "name": "antigravity-superpowers",
        "path": WORKSPACE_ROOT / "antigravity-superpowers",
        "fork_url": "https://github.com/shanmukha-sai-chinnam/antigravity-superpowers.git",
        "upstream_url": "https://github.com/skainguyen1412/antigravity-superpowers.git",
        "flake_input": "antigravity-superpowers",
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
]

FOREIGN_DIR_NAMES = {
    ".claude-plugin",
    ".codex-plugin",
    ".cursor-plugin",
    ".cursor",
    ".devin-plugin",
    ".hermes-plugin",
    ".kimi-plugin",
    ".opencode",
    ".pi",
    ".grok-plugin",
    ".qoder",
    ".kiro",
    ".windsurf",
    "__pycache__",
}

FOREIGN_EXACT_FILES = {
    "CLAUDE.md",
    "CURSOR.md",
    "kimi.plugin.json",
    "qwen-extension.json",
    "opencode.json",
    "openai.yaml",
    "cursor-skill-sync.yml",
    "claude.yml",
    "pi-load-check.yml",
}


def run_cmd(cmd, cwd=None, check=True, capture=True):
    """Run shell command with robust error and output handling."""
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd,
            check=check,
            text=True,
            stdout=subprocess.PIPE if capture else None,
            stderr=subprocess.PIPE if capture else None,
        )
        return res
    except subprocess.CalledProcessError as e:
        if capture and e.stderr:
            print(f"{RED}Command failed: {' '.join(cmd)}{RESET}\n{e.stderr.strip()}", file=sys.stderr)
        raise


def get_flake_lock_revisions():
    """Extract pinned git revisions from damathryxx64/flake.lock."""
    lock_file = DOTS_REPO / "flake.lock"
    if not lock_file.exists():
        return {}
    try:
        with open(lock_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        nodes = data.get("nodes", {})
        revisions = {}
        for input_name, node_data in nodes.items():
            locked = node_data.get("locked", {})
            if "rev" in locked:
                revisions[input_name] = locked["rev"]
        return revisions
    except Exception as e:
        print(f"{YELLOW}Warning parsing flake.lock:{RESET} {e}")
        return {}


def ensure_remotes(repo):
    """Ensure origin and upstream remotes exist for a managed repository."""
    path = repo["path"]
    if not path.exists():
        print(f"{YELLOW}Cloning {repo['name']} from {repo['fork_url']}...{RESET}")
        run_cmd(["git", "clone", repo["fork_url"], str(path)], cwd=WORKSPACE_ROOT)

    remotes = run_cmd(["git", "remote"], cwd=path).stdout.split()
    if "origin" not in remotes:
        run_cmd(["git", "remote", "add", "origin", repo["fork_url"]], cwd=path)
    if "upstream" not in remotes and repo.get("upstream_url"):
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
        if repo.get("upstream_url"):
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
        else:
            upstream_diff = f"{GREEN}Multi-Upstream Hub (Superpowers, Karpathy, ADHD){RESET}"

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
        if repo.get("upstream_url"):
            run_cmd(["git", "fetch", "upstream", "--quiet"], cwd=path)
        elif (path / "scripts" / "sync-upstreams.py").exists():
            run_cmd(["python3", "scripts/sync-upstreams.py", "fetch"], cwd=path, capture=True)
    print(f"{GREEN}✓ All remotes fetched successfully.{RESET}\n")


def cmd_sync():
    """Sync and merge upstream commits into managed repositories."""
    cmd_fetch()
    print(f"{BOLD}{BLUE}Synchronizing with upstream...{RESET}")
    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        branch = repo["main_branch"]
        print(f"  Checking {CYAN}{name}{RESET}...")

        if not repo.get("upstream_url"):
            if (path / "scripts" / "sync-upstreams.py").exists():
                print(f"    Running multi-upstream sync engine for {name}...")
                run_cmd(["python3", "scripts/sync-upstreams.py", "sync"], cwd=path, capture=False)
            continue

        # Check if behind upstream
        behind_count = int(
            run_cmd(["git", "rev-list", "--count", f"HEAD..upstream/{branch}"], cwd=path).stdout.strip()
        )

        if behind_count == 0:
            print(f"    {GREEN}✓ Already up-to-date with upstream/{branch}.{RESET}")
            continue

        print(f"    {YELLOW}Found {behind_count} upstream commit(s). Merging upstream/{branch}...{RESET}")
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
    cmd_rewrite()


def cmd_rewrite():
    """Purge foreign provider configurations and enforce Antigravity / Gemini formats."""
    print(f"\n{BOLD}{BLUE}Purging non-Antigravity/non-Gemini providers & rewriting forks...{RESET}")

    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        if not path.exists() or name == "NixOS-WSL":
            continue

        print(f"  Processing {CYAN}{name}{RESET}...")

        # Walk repository and purge foreign dirs and files (excluding .git)
        for root, dirs, files in os.walk(path, topdown=True):
            if ".git" in dirs:
                dirs.remove(".git")
            if "node_modules" in dirs:
                dirs.remove("node_modules")

            for d in list(dirs):
                if d in FOREIGN_DIR_NAMES:
                    shutil.rmtree(Path(root) / d, ignore_errors=True)
                    dirs.remove(d)

            for f in files:
                if f in FOREIGN_EXACT_FILES:
                    try:
                        (Path(root) / f).unlink()
                    except OSError:
                        pass

        # Text normalizations for Antigravity & Gemini
        scan_extensions = [".md", ".json", ".sh", ".yaml", ".yml"]
        for ext in scan_extensions:
            for mf in path.rglob(f"*{ext}"):
                if ".git" in mf.parts or "node_modules" in mf.parts:
                    continue
                try:
                    content = mf.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue

                orig = content
                content = re.sub(r"^disable-model-invocation:\s*true\s*$\n?", "", content, flags=re.MULTILINE)
                content = content.replace("Claude Code", "Antigravity CLI")
                content = content.replace("claude-code", "antigravity-cli")
                content = content.replace("Claude Desktop", "Antigravity IDE")
                content = content.replace("OpenCode", "Antigravity CLI")
                content = content.replace("opencode", "antigravity-cli")
                content = content.replace("Hermes Agent", "Antigravity Agent")
                content = content.replace("Devin CLI", "Antigravity CLI")
                content = content.replace("Kimi Code CLI", "Antigravity CLI")
                content = content.replace("Qwen Code", "Antigravity CLI")
                content = content.replace("claude plugin install", "agy plugin install")
                content = content.replace("CLAUDE.md", "AGENTS.md")
                content = content.replace("CURSOR.md", "AGENTS.md")

                if content != orig:
                    mf.write_text(content, encoding="utf-8")

        # Check git status and auto-commit changes
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


def cmd_audit():
    """Audit all skills for YAML frontmatter and Antigravity compliance."""
    print(f"\n{BOLD}{BLUE}Auditing Skills for Antigravity Guidelines...{RESET}")
    total_skills = 0
    passed_skills = 0
    warnings = []

    for repo in MANAGED_REPOS:
        path = repo["path"]
        if not path.exists() or repo["name"] == "NixOS-WSL":
            continue

        for sf in path.rglob("SKILL.md"):
            total_skills += 1
            rel = sf.relative_to(WORKSPACE_ROOT)
            content = sf.read_text(encoding="utf-8", errors="replace")

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

            if not desc_match or not desc_match.group(1).strip():
                warnings.append(f"{RED}[MISSING DESCRIPTION]{RESET} {rel}")
            else:
                passed_skills += 1

    print(f"  Scanned {total_skills} skills across repositories.")
    if warnings:
        print(f"  {YELLOW}Found {len(warnings)} issue(s):{RESET}")
        for w in warnings[:15]:
            print(f"    {w}")
    else:
        print(f"  {GREEN}✓ All {passed_skills} skills passed frontmatter integrity checks.{RESET}\n")


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
        print(f"\n{GREEN}✓ Flake inputs updated and committed successfully.{RESET}\n")
    except Exception as e:
        print(f"\n{RED}Failed to bump flake inputs:{RESET} {e}\n")


def cmd_validate():
    """Run full validation checks on damathryxx64."""
    print(f"\n{BOLD}{BLUE}Running dots-validate on damathryxx64...{RESET}")
    try:
        run_cmd(["dots-validate"], cwd=DOTS_REPO, capture=False)
    except Exception as e:
        print(f"\n{RED}Validation failed:{RESET} {e}\n")
        sys.exit(1)


def sync_active_skills_to_config():
    """
    Synchronize active declared skills, rules, and plugins directly into ~/.gemini/config/
    with strict declarative pruning of orphan skills.
    """
    skills_dir = CONFIG_DIR / "skills"
    rules_dir = CONFIG_DIR / "rules"
    plugins_dir = CONFIG_DIR / "plugins"

    skills_dir.mkdir(parents=True, exist_ok=True)
    rules_dir.mkdir(parents=True, exist_ok=True)
    plugins_dir.mkdir(parents=True, exist_ok=True)

    declared_skills = {}
    declared_rules = {}
    declared_plugins = {}

    # Stage from unified skills repository
    s_path = WORKSPACE_ROOT / "skills"
    if (s_path / "skills").exists():
        for cat in (s_path / "skills").iterdir():
            if cat.is_dir():
                for sk in cat.iterdir():
                    if sk.is_dir() and (sk / "SKILL.md").exists():
                        declared_skills[sk.name] = sk

    if (s_path / "rules").exists():
        for rf in (s_path / "rules").iterdir():
            if rf.is_file() and rf.suffix == ".md":
                declared_rules[rf.name] = rf

    if (s_path / "plugins").exists():
        for pl in (s_path / "plugins").iterdir():
            if pl.is_dir() and (pl / "plugin.json").exists():
                declared_plugins[pl.name] = pl

    # Prune orphan skills from skills_dir
    pruned_skills = 0
    for existing in list(skills_dir.iterdir()):
        if existing.is_dir() and existing.name not in declared_skills:
            shutil.rmtree(existing, ignore_errors=True)
            pruned_skills += 1

    # Copy declared skills
    for sname, src in declared_skills.items():
        dst = skills_dir / sname
        if dst.exists():
            shutil.rmtree(dst, ignore_errors=True)
        shutil.copytree(src, dst)

    # Prune and copy rules (preserve system rules like declarative-dots.md, environment.md)
    for rname, src in declared_rules.items():
        dst = rules_dir / rname
        shutil.copy2(src, dst)

    # Copy declared plugins
    for pname, src in declared_plugins.items():
        dst = plugins_dir / pname
        if dst.exists():
            shutil.rmtree(dst, ignore_errors=True)
        shutil.copytree(src, dst)

    # Clean foreign artifacts from config_dir
    for root, dirs, files in os.walk(CONFIG_DIR, topdown=True):
        for d in list(dirs):
            if d in FOREIGN_DIR_NAMES:
                shutil.rmtree(Path(root) / d, ignore_errors=True)
                dirs.remove(d)

    print(f"  {GREEN}✓ Synchronized {len(declared_skills)} declared skills to ~/.gemini/config/skills/ (pruned {pruned_skills} orphan/incompatible skills).{RESET}")


def cmd_refresh():
    """Full refresh: sync upstreams, rewrite to Antigravity/Gemini, audit, and sync to ~/.gemini/config."""
    print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN} Refresh Skills: Sync Upstream & Rewrite to Antigravity/Gemini{RESET}")
    print(f"{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}\n")

    cmd_sync()
    cmd_audit()

    print(f"{BOLD}{BLUE}Synchronizing active skills to ~/.gemini/config...{RESET}")
    sync_active_skills_to_config()
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
        cmd_sync()
        cmd_audit()
        cmd_push()
        cmd_bump_flake()
        cmd_validate()


if __name__ == "__main__":
    main()
