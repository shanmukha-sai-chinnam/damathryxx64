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
    "pi-extension",
    ".openclaw",
    ".claude",
    ".copilot",
    ".zed",
    "explicit-skill-requests",
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
    "test_opencode_plugin.py",
    "opencode_plugin_driver.mjs",
    "check_pi_extension.py",
    "package-codex-plugin.sh",
    "sync-to-codex-plugin.sh",
    "README.opencode.md",
    "README.kimi.md",
    "2025-11-22-opencode-support-design.md",
    "2025-11-22-opencode-support-implementation.md",
    "hermes-tools.md",
    "codex-tools.md",
    "anthropic-best-practices.md",
    "CLAUDE_MD_TESTING.md",
    "claude-suggested-it.txt",
    "cursor.md",
    "claude_code.md",
    "github_copilot.md",
    "other_agents.md",
    "copilot-instructions.md",
    "claude-codex-hooks.json",
    "copilot-hooks.json",
    "qoder-hooks.json",
    "devin.json",
    "hermes.json",
    "2026-07-30-codex-efficiency-fixes-design.md",
    "2026-08-05-hermes-version-bump-wiring-design.md",
    "2026-03-23-codex-app-compatibility-design.md",
    "2026-07-30-codex-efficiency-fixes.md",
    "2026-08-06-hermes-version-bump-wiring.md",
    "2026-03-23-codex-app-compatibility.md",
}

FOREIGN_REL_PATHS = [
    "tests/devin",
    "tests/claude-code",
    "tests/hermes",
    "tests/kimi",
    "tests/opencode",
    "tests/codex",
    "tests/codex-plugin-sync",
    "tests/explicit-skill-requests",
    "hooks/hooks-cursor.json",
    "skills/cloud/firebase-basics/references/refresh/claude.md",
    "docs/superpowers/specs/2026-07-30-codex-efficiency-fixes-design.md",
    "docs/superpowers/specs/2026-08-05-hermes-version-bump-wiring-design.md",
    "docs/superpowers/specs/2026-03-23-codex-app-compatibility-design.md",
    "docs/superpowers/plans/2026-07-30-codex-efficiency-fixes.md",
    "docs/superpowers/plans/2026-08-06-hermes-version-bump-wiring.md",
    "docs/superpowers/plans/2026-03-23-codex-app-compatibility.md",
]

# Skills in superpowers that are already maintained natively in antigravity-superpowers
SUPERPOWERS_SUPERSEDED_SKILLS = {
    "brainstorming",
    "executing-plans",
    "finishing-a-development-branch",
    "receiving-code-review",
    "requesting-code-review",
    "systematic-debugging",
    "test-driven-development",
    "using-git-worktrees",
    "using-superpowers",
    "verification-before-completion",
    "writing-plans",
    "writing-skills",
}

# Skills in superpowers that rely on phantom subagents (incompatible with Antigravity single-flow)
SUPERPOWERS_INCOMPATIBLE_SKILLS = {
    "dispatching-parallel-agents",
    "subagent-driven-development",
}


def classify_upstream_file(repo_name, rel_path, status):
    """
    Classify an incoming file from upstream into triage categories:
      - PURGE: Foreign provider baggage (delete immediately)
      - INCOMPATIBLE: Incompatible subagent skills (purge/exclude from Antigravity)
      - SUPERSEDED: Skills maintained natively in antigravity-superpowers
      - ADAPT: Skill markdown requiring native Antigravity/Gemini tools
      - VALIDATE: Scripts/manifests requiring validation tests
    """
    p = Path(rel_path)
    parts = p.parts
    filename = p.name

    # 1. Exact foreign directories or exact files
    if any(part in FOREIGN_DIR_NAMES for part in parts) or filename in FOREIGN_EXACT_FILES:
        return "PURGE", f"{RED}DELETE{RESET}", "Foreign provider platform baggage"

    # 2. Foreign keyword patterns in path
    lower_path = rel_path.lower()
    for kw in ["claude", "codex", "hermes", "cursor", "kimi", "opencode", "devin", "qoder", "kiro", "windsurf"]:
        if kw in lower_path:
            return "PURGE", f"{RED}DELETE{RESET}", f"Foreign provider '{kw}' artifact"

    # 3. Superpowers-specific skill triage
    if repo_name == "superpowers" and len(parts) >= 2 and parts[0] == "skills":
        skill_name = parts[1]
        if skill_name in SUPERPOWERS_INCOMPATIBLE_SKILLS:
            return "INCOMPATIBLE", f"{RED}PURGE{RESET}", "Phantom subagent skill (Antigravity uses single-flow-task-execution)"
        if skill_name in SUPERPOWERS_SUPERSEDED_SKILLS:
            return "SUPERSEDED", f"{YELLOW}SUPERSEDED{RESET}", "Maintained natively in antigravity-superpowers (authoritative)"

    # 4. Skill markdown files
    if p.suffix == ".md":
        return "ADAPT", f"{CYAN}ADAPT{RESET}", "Prompt update (enforce native Antigravity/Gemini tools)"

    # 5. Executable code / manifests / nix
    return "VALIDATE", f"{GREEN}VALIDATE{RESET}", "Script/manifest (run syntax & test checks)"


def audit_upstream_commits(repo, behind_count=None, max_commits=5):
    """
    Audit upstream commits and changed files for a repository.
    Returns dict of categorized files: {"purge": [...], "incompatible": [...], "superseded": [...], "adapt": [...], "validate": [...]}
    """
    path = repo["path"]
    name = repo["name"]
    branch = repo["main_branch"]

    results = {
        "purge": [],
        "incompatible": [],
        "superseded": [],
        "adapt": [],
        "validate": [],
    }

    if not path.exists():
        return results

    ensure_remotes(repo)

    if behind_count is None:
        try:
            behind_count = int(
                run_cmd(["git", "rev-list", "--count", f"HEAD..upstream/{branch}"], cwd=path).stdout.strip()
            )
        except Exception:
            behind_count = 0

    if behind_count > 0:
        rev_range = f"HEAD..upstream/{branch}"
        commit_count = behind_count
    else:
        rev_range = f"upstream/{branch}~{max_commits}..upstream/{branch}"
        commit_count = max_commits

    try:
        commits_raw = run_cmd(
            ["git", "log", "--oneline", "-n", str(commit_count), rev_range], cwd=path
        ).stdout.strip().splitlines()
    except Exception:
        commits_raw = []

    try:
        diff_raw = run_cmd(
            ["git", "diff", "--name-status", rev_range], cwd=path
        ).stdout.strip().splitlines()
    except Exception:
        diff_raw = []

    print(f"\n{BOLD}{CYAN}┌── Upstream Commit Audit:{RESET} {BOLD}{name}{RESET} ({CYAN}{len(commits_raw)} commit(s){RESET} in {rev_range})")
    if commits_raw:
        print(f"{CYAN}│{RESET} {BOLD}Incoming Commits:{RESET}")
        for c in commits_raw[:8]:
            print(f"{CYAN}│{RESET}   • {c}")
        if len(commits_raw) > 8:
            print(f"{CYAN}│{RESET}   ... and {len(commits_raw) - 8} more commits.")

    if diff_raw:
        print(f"{CYAN}│{RESET} {BOLD}File Triage & Action Analysis ({len(diff_raw)} files changed):{RESET}")
        for line in diff_raw:
            parts = line.split(maxsplit=1)
            if len(parts) != 2:
                continue
            status, rel_file = parts[0], parts[1]
            cat, action_str, reason = classify_upstream_file(name, rel_file, status)
            results[cat.lower()].append(rel_file)
            print(f"{CYAN}│{RESET}   [{action_str}] {status} {rel_file} → {GRAY}{reason}{RESET}")
    else:
        print(f"{CYAN}│{RESET}   {GREEN}No file differences detected.{RESET}")

    print(f"{BOLD}{CYAN}└── Summary:{RESET} {RED}{len(results['purge'])} to purge{RESET}, "
          f"{YELLOW}{len(results['incompatible'])} incompatible subagent skills{RESET}, "
          f"{CYAN}{len(results['superseded'])} superseded{RESET}, "
          f"{BLUE}{len(results['adapt'])} to adapt{RESET}, "
          f"{GREEN}{len(results['validate'])} to validate{RESET}\n")

    return results


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
    """Sync and merge upstream commits into our fork branches with commit auditing & triage."""
    import shutil
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
                run_cmd(["python3", "scripts/sync-upstreams.py", "sync"], cwd=path, capture=True)
            continue

        # Check if behind upstream
        behind_count = int(
            run_cmd(["git", "rev-list", "--count", f"HEAD..upstream/{branch}"], cwd=path).stdout.strip()
        )

        if behind_count == 0:
            print(f"    {GREEN}✓ Already up-to-date with upstream/{branch}.{RESET}")
            continue

        print(f"    {YELLOW}Found {behind_count} upstream commit(s). Auditing changes...{RESET}")
        audit = audit_upstream_commits(repo, behind_count=behind_count)

        print(f"    Merging upstream/{branch}...")
        try:
            run_cmd(
                ["git", "merge", f"upstream/{branch}", "-m", f"sync: merge upstream/{branch} into {branch}"],
                cwd=path,
            )
            print(f"    {GREEN}✓ Upstream merged successfully.{RESET}")
        except subprocess.CalledProcessError:
            print(f"    {RED}Merge conflict detected in {name}! Manual resolution required.{RESET}")
            sys.exit(1)

        # Immediately purge audited foreign baggage and incompatible subagent files
        for rel in audit["purge"] + audit["incompatible"]:
            target = path / rel
            if target.exists():
                if target.is_dir():
                    shutil.rmtree(target, ignore_errors=True)
                else:
                    try:
                        target.unlink()
                    except OSError:
                        pass
                print(f"    {RED}✗ Purged foreign artifact:{RESET} {rel}")

    print(f"\n{GREEN}✓ Upstream synchronization complete.{RESET}\n")

    # Always purge foreign providers & enforce Antigravity/Gemini immediately after sync
    cmd_rewrite()


def cmd_audit_upstream():
    """Audit recent upstream commits across all managed repositories without merging."""
    print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN} Upstream Commit & File Triage Audit (Antigravity & Gemini Matrix){RESET}")
    print(f"{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}\n")
    cmd_fetch()
    for repo in MANAGED_REPOS:
        audit_upstream_commits(repo, max_commits=5)



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

    for repo in MANAGED_REPOS:
        path = repo["path"]
        name = repo["name"]
        if not path.exists() or name == "NixOS-WSL":
            continue

        print(f"  Processing {CYAN}{name}{RESET}...")
        removed_count = 0

        # Remove explicit relative paths
        for rel in FOREIGN_REL_PATHS:
            target = path / rel
            if target.exists():
                if target.is_dir():
                    shutil.rmtree(target)
                else:
                    target.unlink()
                removed_count += 1

        # Walk entire repository and remove foreign dirs and files (excluding .git)
        for root, dirs, files in os.walk(path, topdown=True):
            if ".git" in dirs:
                dirs.remove(".git")
            
            # Remove matching directories
            for d in list(dirs):
                if d in FOREIGN_DIR_NAMES:
                    full_d = Path(root) / d
                    shutil.rmtree(full_d, ignore_errors=True)
                    dirs.remove(d)
                    removed_count += 1

            # Remove matching files
            for f in files:
                if f in FOREIGN_EXACT_FILES:
                    full_f = Path(root) / f
                    try:
                        full_f.unlink()
                        removed_count += 1
                    except OSError:
                        pass

        # Specific repository rewrites
        if name == "andrej-karpathy-skills":
            # Sanitize README.md and README.zh.md
            for readme_name in ["README.md", "README.zh.md"]:
                rf = path / readme_name
                if rf.exists():
                    text = rf.read_text(encoding="utf-8")
                    orig_text = text
                    # Remove Claude Code & Cursor from platform list
                    text = text.replace(", **Claude Code**, **Cursor**,", ",")
                    text = text.replace(" | [Cursor Guide](./CURSOR.md)", "")
                    # Remove Claude Code and Cursor setup sections
                    text = re.sub(r"### 2\. Claude Code.*?(?=## How to Know It's Working|## License|\Z)", "", text, flags=re.DOTALL)
                    text = re.sub(r"## 在 Cursor 中使用.*?(?=## 如何验证效果|## 许可证|\Z)", "", text, flags=re.DOTALL)
                    text = re.sub(r"\*\*选项 A：Claude Code 插件.*?(?=## 如何验证效果|## 许可证|\Z)", "", text, flags=re.DOTALL)
                    if text != orig_text:
                        rf.write_text(text, encoding="utf-8")

        elif name == "i-have-adhd":
            # Clean package.json
            pkg_file = path / "package.json"
            if pkg_file.exists():
                try:
                    with open(pkg_file, "r", encoding="utf-8") as f:
                        pkg_data = json.load(f)
                    pkg_data.pop("omp", None)
                    pkg_data.pop("pi", None)
                    if "keywords" in pkg_data and isinstance(pkg_data["keywords"], list):
                        pkg_data["keywords"] = [k for k in pkg_data["keywords"] if k != "pi-package"]
                    with open(pkg_file, "w", encoding="utf-8") as f:
                        json.dump(pkg_data, f, indent=2)
                        f.write("\n")
                except Exception:
                    pass

            # Clean README.md
            readme_f = path / "README.md"
            if readme_f.exists():
                rtext = readme_f.read_text(encoding="utf-8")
                orig_rtext = rtext
                rtext = re.sub(r"claude plugin uninstall.*?\n\s*Restart Claude Code, then re-invoke `/i-have-adhd`\.", "Refresh skills via `dots-sync-skills refresh` or `refresh-skills`.", rtext, flags=re.DOTALL)
                if rtext != orig_rtext:
                    readme_f.write_text(rtext, encoding="utf-8")

            # Clean INSTALL.md
            install_f = path / "INSTALL.md"
            if install_f.exists():
                itext = install_f.read_text(encoding="utf-8")
                orig_itext = itext
                # Remove sections for foreign providers in details tags
                for provider in ["Claude Code", "Codex", "GitHub Copilot", "Hermes", "Kimi Code CLI", "OpenCode", "Qwen Code", "Cursor"]:
                    pattern = rf"<details>\s*<summary><strong>{re.escape(provider)}.*?</strong></summary>.*?</details>"
                    itext = re.sub(pattern, "", itext, flags=re.DOTALL | re.IGNORECASE)
                # Remove claude plugin troubleshooting
                itext = re.sub(r"In Claude Code, Qwen Code, and Codex.*", "", itext, flags=re.DOTALL)
                if itext != orig_itext:
                    install_f.write_text(itext, encoding="utf-8")

        elif name == "superpowers":
            # Clean hooks/session-start
            h_file = path / "hooks" / "session-start"
            if h_file.exists():
                htext = h_file.read_text(encoding="utf-8")
                orig_htext = htext
                htext = re.sub(r"# Cursor hooks expect.*?(?=echo )", "", htext, flags=re.DOTALL)
                if htext != orig_htext:
                    h_file.write_text(htext, encoding="utf-8")

            # Clean .version-bump.json
            vb_file = path / ".version-bump.json"
            if vb_file.exists():
                try:
                    vb_data = {
                        "files": [
                            {"path": "package.json", "field": "version"},
                            {"path": "gemini-extension.json", "field": "version"}
                        ],
                        "audit": {
                            "exclude": [
                                "CHANGELOG.md",
                                "RELEASE-NOTES.md",
                                "node_modules",
                                ".git",
                                ".version-bump.json",
                                "scripts/bump-version.sh"
                            ]
                        }
                    }
                    with open(vb_file, "w", encoding="utf-8") as f:
                        json.dump(vb_data, f, indent=2)
                        f.write("\n")
                except Exception:
                    pass

            # Clean README.md
            readme_f = path / "README.md"
            if readme_f.exists():
                rtext = readme_f.read_text(encoding="utf-8")
                orig_rtext = rtext
                # Clean TOC
                rtext = re.sub(
                    r"- \[Getting Started\]\(#installation\)\n(  - \[.*?\]\(#.*?\)\n)+",
                    "- [Getting Started](#installation)\n  - [Antigravity](#antigravity)\n  - [Gemini CLI](#gemini-cli)\n",
                    rtext
                )
                # Clean Installation section
                clean_install = (
                    "## Installation\n\n"
                    "Installation for supported environments:\n\n"
                    "### Antigravity\n\n"
                    "Install Superpowers as a plugin from this repository:\n\n"
                    "```bash\n"
                    "agy plugin install https://github.com/shanmukha-sai-chinnam/superpowers\n"
                    "```\n\n"
                    "Antigravity runs the plugin's session-start hook, so Superpowers is active from\n"
                    "the first message. Reinstall with the same command to update.\n\n"
                    "### Gemini CLI\n\n"
                    "Install the extension:\n\n"
                    "```bash\n"
                    "gemini extensions install https://github.com/shanmukha-sai-chinnam/superpowers\n"
                    "```\n\n"
                    "Update later:\n\n"
                    "```bash\n"
                    "gemini extensions update superpowers\n"
                    "```\n"
                )
                rtext = re.sub(r"## Installation.*?(?=## The Basic Workflow)", clean_install + "\n", rtext, flags=re.DOTALL)
                rtext = rtext.replace(" and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` opt-outs.", " opt-out.")
                if rtext != orig_rtext:
                    readme_f.write_text(rtext, encoding="utf-8")

            # Clean branding.test.js
            btest_f = path / "tests" / "brainstorm-server" / "branding.test.js"
            if btest_f.exists():
                btext = btest_f.read_text(encoding="utf-8")
                orig_btext = btext
                btext = btext.replace("packaged Codex plugin reads version from .codex-plugin manifest", "packaged plugin reads version from package manifest")
                btext = btext.replace("brainstorm-branding-packaged-codex", "brainstorm-branding-packaged")
                btext = btext.replace("fs.mkdirSync(path.join(root, '.codex-plugin'), { recursive: true });\n  fs.writeFileSync(\n    path.join(root, '.codex-plugin/plugin.json'),", "fs.writeFileSync(\n    path.join(root, 'package.json'),")
                btext = btext.replace("DISABLE_TELEMETRY=true omits remote image for Claude Code telemetry opt-out", "DISABLE_TELEMETRY=true omits remote image for telemetry opt-out")
                btext = btext.replace("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 omits remote image for Claude Code traffic opt-out", "DISABLE_NONESSENTIAL_TRAFFIC=1 omits remote image for traffic opt-out")
                btext = btext.replace("brainstorm-branding-claude-disable-telemetry", "brainstorm-branding-disable-telemetry")
                btext = btext.replace("brainstorm-branding-claude-disable-nonessential", "brainstorm-branding-disable-nonessential")
                btext = btext.replace("env: { CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' }", "env: { DISABLE_NONESSENTIAL_TRAFFIC: '1' }")
                btext = btext.replace("Claude Code telemetry opt-out", "telemetry opt-out")
                btext = btext.replace("Claude Code non-essential traffic opt-out", "non-essential traffic opt-out")
                if btext != orig_btext:
                    btest_f.write_text(btext, encoding="utf-8")

            # Clean test-bump-version.sh
            tbump_f = path / "tests" / "version-bump" / "test-bump-version.sh"
            if tbump_f.exists():
                tbtext = tbump_f.read_text(encoding="utf-8")
                orig_tbtext = tbtext
                tbtext = tbtext.replace(".hermes-plugin/plugin.yaml", "gemini-extension.json")
                tbtext = tbtext.replace("$repo/.hermes-plugin", "")
                tbtext = re.sub(r'mkdir -p "\$repo/scripts" "\$repo/\.hermes-plugin"', 'mkdir -p "$repo/scripts"', tbtext)
                tbtext = re.sub(r'make_fixture "\$happy_repo" \$?\'name: superpowers\\nversion: 1\.2\.3\'', "make_fixture \"$happy_repo\" $'{\\n  \"name\": \"superpowers\",\\n  \"version\": \"1.2.3\"\\n}'", tbtext)
                tbtext = re.sub(r'make_fixture "\$invalid_repo" \$?\'name: superpowers\\nversion: 123\'', "make_fixture \"$invalid_repo\" $'{\\n  \"name\": \"superpowers\",\\n  \"version\": 123\\n}'", tbtext)
                tbtext = tbtext.replace("Hermes manifest is not registered", "Gemini extension manifest is not registered")
                tbtext = tbtext.replace("[[ \"$(yq -r '.version' \"$happy_repo/gemini-extension.json\")\" == \"2.3.4\" ]]", "[[ \"$(jq -r '.version' \"$happy_repo/gemini-extension.json\")\" == \"2.3.4\" ]]")
                tbtext = tbtext.replace("fail \"YAML manifest was not bumped\"", "fail \"gemini-extension.json was not bumped\"")
                tbtext = tbtext.replace("fail \"bump accepted a non-string YAML version\"", "fail \"bump accepted a non-string version\"")
                tbtext = tbtext.replace("fail \"JSON manifest changed before YAML validation failed\"", "fail \"JSON manifest changed before validation failed\"")
                tbtext = tbtext.replace("fail \"invalid YAML manifest changed\"", "fail \"invalid manifest changed\"")
                tbtext = tbtext.replace("JSON manifest was not bumped", "package.json was not bumped")
                tbtext = tbtext.replace("plugin.yaml", "gemini-extension.json")
                tbtext = tbtext.replace("plugin.before", "extension.before")
                if tbtext != orig_tbtext:
                    tbump_f.write_text(tbtext, encoding="utf-8")

            # Clean bump-version.sh
            bv_f = path / "scripts" / "bump-version.sh"
            if bv_f.exists():
                bvtext = bv_f.read_text(encoding="utf-8")
                orig_bvtext = bvtext
                bvtext = bvtext.replace('jq -r "$jq_path" "$file"', 'jq -er "$jq_path | select(type == \\"string\\")" "$file"')
                if bvtext != orig_bvtext:
                    bv_f.write_text(bvtext, encoding="utf-8")

            # Purge incompatible subagent skills
            for subagent_skill in SUPERPOWERS_INCOMPATIBLE_SKILLS:
                sk_dir = path / "skills" / subagent_skill
                if sk_dir.exists():
                    shutil.rmtree(sk_dir, ignore_errors=True)
                    removed_count += 1

            # Run test suites in superpowers
            try:
                run_cmd(["node", "tests/brainstorm-server/branding.test.js"], cwd=path)
                run_cmd(["bash", "tests/version-bump/test-bump-version.sh"], cwd=path)
                run_cmd(["bash", "tests/antigravity/run-tests.sh"], cwd=path)
                print(f"    {GREEN}✓ Test suites passed in superpowers.{RESET}")
            except Exception as e:
                print(f"    {YELLOW}Warning running tests in superpowers:{RESET} {e}")

        # Enforce Antigravity / Gemini native structure across all files
        scan_extensions = [".md", ".json", ".sh", ".yaml", ".yml"]
        all_files = []
        for ext in scan_extensions:
            all_files.extend(path.rglob(f"*{ext}"))

        for mf in all_files:
            if ".git" in mf.parts or "node_modules" in mf.parts:
                continue
            try:
                content = mf.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            orig = content
            # Strip disable-model-invocation: true
            content = re.sub(r"^disable-model-invocation:\s*true\s*$\n?", "", content, flags=re.MULTILINE)
            # Normalize provider mentions
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


def sync_active_skills_to_config():
    """
    Synchronize active declared skills, rules, and plugins directly into ~/.gemini/config/
    with strict declarative pruning of foreign, duplicate, and orphan skills.
    """
    import shutil
    config_dir = Path.home() / ".gemini" / "config"
    skills_dir = config_dir / "skills"
    rules_dir = config_dir / "rules"
    plugins_dir = config_dir / "plugins"

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

    # Prune orphan/foreign skills from skills_dir
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

    # Prune and copy rules (preserve system rules like declarative-dots.md, environment.md, workflow-discipline.md)
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
    for root, dirs, files in os.walk(config_dir, topdown=True):
        for d in list(dirs):
            if d in FOREIGN_DIR_NAMES:
                shutil.rmtree(Path(root) / d, ignore_errors=True)
                dirs.remove(d)
        for f in files:
            if f in FOREIGN_EXACT_FILES or any(kw in f.lower() for kw in ["claude", "codex", "hermes", "opencode", "kimi", "devin"]):
                try:
                    (Path(root) / f).unlink()
                except OSError:
                    pass

    # Scrub mentions in config markdown
    for mf in config_dir.rglob("*.md"):
        try:
            content = mf.read_text(encoding="utf-8", errors="replace")
            orig = content
            content = re.sub(r"^disable-model-invocation:\s*true\s*$\n?", "", content, flags=re.MULTILINE)
            content = content.replace("Claude Code", "Antigravity CLI")
            content = content.replace("claude-code", "antigravity-cli")
            content = content.replace("Claude Desktop", "Antigravity IDE")
            content = content.replace("OpenCode", "Antigravity CLI")
            content = content.replace("opencode", "antigravity-cli")
            content = content.replace("CLAUDE.md", "AGENTS.md")
            content = content.replace("CURSOR.md", "AGENTS.md")
            if content != orig:
                mf.write_text(content, encoding="utf-8")
        except Exception:
            pass

    print(f"  {GREEN}✓ Synchronized {len(declared_skills)} declared skills to ~/.gemini/config/skills/ (pruned {pruned_skills} orphan/incompatible skills).{RESET}")


def cmd_refresh():
    """Fetch/sync upstream commits, purge non-Antigravity/non-Gemini providers, and rewrite."""
    print(f"\n{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN} Refresh Skills: Sync Upstream & Rewrite to Antigravity/Gemini{RESET}")
    print(f"{BOLD}{CYAN}══════════════════════════════════════════════════════════════════════{RESET}\n")

    cmd_sync()
    cmd_audit()

    # Declarative direct sync & pruning to ~/.gemini/config
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
    subparsers.add_parser("audit-upstream", help="Audit upstream commits and file triage for Antigravity & Gemini")
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
    elif cmd == "audit-upstream":
        cmd_audit_upstream()
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
