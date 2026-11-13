# Repository Agent Guidelines: NixOS-WSL

Repository-wide guidance and operating constraints for Antigravity agents in this NixOS-WSL repository.

## Execution Environment: Strict NixOS-WSL

- **Strict WSL Target**: All commands, edits, git operations, builds, formatters, and tests MUST be executed strictly inside NixOS-WSL (`/home/damathryxx64/`).
- **No Direct Windows Work**: Do NOT work on Windows directly unless explicitly and definitively required for Windows-WSL host interoperability, network bridging, or host display integration.

## Repository Overview

- **Flake Entrypoint**: `flake.nix` defines the NixOS-WSL system (`nixosConfigurations.nixos`), monorepo packages (`packages.x86_64-linux`), and the code formatter (`formatter.alejandra`).
- **Unified Key-Value Configuration Hub**: `values.json` defines all identity, system, WSL, path, GitHub, security, and upstream remote values. Pure Nix loader `lib/values.nix` passes structured values into `flake.nix` `specialArgs` and system modules. Query values dynamically via `dots-val <key>`. Zero hardcoded machine paths exist in modules.
- **Core Configuration**: `modules/configuration.nix` orchestrates imported system modules.
- **Monorepo Architecture**:
  - `modules/system/`: WSL2 boot timeout (`initTimeout = 60000;`), kernel shims, Windows host `.wslconfig` sync, fonts (Cascadia Code, Fira Code), Docker Desktop socket integration, zram compressed swap, Nix store settings, and `nh` maintenance.
  - `modules/environment/`: Interactive Zsh shell, Starship prompt, direnv, task runners (`dots-val`, `dots-validate`, `dots-fmt`, `dots-lint`, `dots-build`, `dots-switch`, `dots-upgrade`, `dots-clean`, `dots-test-vm`, `help-nix`), custom completions, system CLI utilities, and language compilers (Python, Node, GCC, Clang, CMake, uv, nixd).
  - `modules/ai/`: Antigravity CLI, Gemini CLI, in-tree Superpowers, declarative agent skills synchronizer (`skills.nix`), `refresh-skills`, and native MCP servers (`modules/ai/mcp.nix`).
  - `modules/security/`: Security policies, sudo rules, firewall, and ClamAV real-time inotify sentinel (`clamav.nix`).
  - `modules/nixos-wsl/`: In-tree NixOS-WSL modules and systemd-native shell wrappers.
  - `pkgs/`: Custom in-tree packages (`clamav-sentinel`, `antigravity-superpowers`).
  - `skills/`: Unified in-tree agent skills hub and declarative rules.
  - `docs/`: Minimalist Gruvbox architecture documentation hub, system topology, and component specs.

## Skill Discovery & Execution

Skills are loaded on-demand via progressive disclosure:
1. **Repository Skills** (`.agents/skills/`): Workspace-specific workflows (e.g., `nixos-wsl`, `typesafe-ai`).
2. **Global Skills** (`~/.gemini/config/skills/`): System-wide agent skills synchronized declaratively from in-tree `skills/`.

Load the relevant `SKILL.md` before executing multi-step workflows.

## MCP Servers

These MCP servers are configured in `.agents/mcp_config.json` and available for agent use:

| Server | Command | Purpose |
|---|---|---|
| **nixos** | `mcp-nixos` | Query NixOS/Home Manager options, packages, Nix store, flake inputs, wiki, nix.dev docs. |
| **github** | `github-mcp-server-wrapped` | GitHub API operations (issues, PRs, repos, workflows) with auto-token resolution. |
| **git** | `mcp-server-git` | Git operations (status, diff, commit, branch, log) on this repository. |
| **filesystem** | `mcp-server-filesystem` | File/directory operations within this repository. |
| **fetch** | `mcp-server-fetch` | HTTP content fetching and URL reading. |
| **sequential-thinking** | `mcp-server-sequential-thinking` | Structured multi-step reasoning and problem decomposition. |
| **typesafe** | `mcp-server-typesafe` | TypeSafe AI (Jev) System One evaluation (choice, score, noul true/false judgments). |

## Jev (TypeSafe AI) Pre-Edit Advisory Protocol

1. **Pre-Edit Semantic Consultation**:
   - **Approach Selection**: When multiple valid implementation approaches exist, consult Jev (`typesafe_choice`) to evaluate the cleanest and most surgical path before editing.
   - **Policy & Regression Checks**: For structural or high-impact edits, query Jev (`typesafe_noul` / `typesafe_score`) to verify constraints (e.g., no hardcoded machine paths, no unmanaged mutable state, surgical diffs).
2. **Fail-Open Usage Fallback**:
   - If TypeSafe API usage is exhausted, rate-limited (HTTP 429), or unreachable, fall back immediately to standard internal reasoning without halting or blocking the task.
   - Jev consultation is an advisory enhancement; execution must never stall on external API unavailability.

## Confirmation & Autonomy Discipline

1. **Confirm only for destructive/irreversible/outward-facing actions**: System switches, data deletion, publishing, sending messages to external services.
2. **Authorization persists across turns**: If the user authorized an action earlier in the session, do not re-ask.
3. **Reversible actions proceed without asking**: For actions that follow from the original request and can be undone (file edits, branch creation, test runs), proceed.
4. **Complete work before asking**: Make the proposed action concrete and reviewable before requesting permission — the user should approve a result, not a plan.
5. **Explain why when you must ask**: If confirmation is required, explicitly state the reason and the source of the constraint (e.g., "System Activation Policy in AGENTS.md requires explicit approval for `dots-switch`").
6. **Finish the whole task**: Do not stop at "good enough." If part of the scope is blocked, finish every other part and explicitly name what was left out and why.

## Mandatory Change Guidelines

1. **Always Dots-Driven & Declarative**: Declare all tools, packages, agent runtimes, services, and environments directly in the appropriate module of this repository (`modules/`). Avoid imperative installations, ad-hoc binaries, or unmanaged state. Reuse existing module patterns and variable boundaries.
2. **Reproducibility**: Avoid hardcoded machine-specific paths or volatile state. WSL host settings (CPU, memory, swap) belong in Windows `%UserProfile%\.wslconfig`, not in this repository.
3. **Format Requirement**: Always verify and format Nix expressions using `nix fmt -- .`. All code must comply with Alejandra style.
4. **Pre-commit Validation**:
   - Automated full suite: `dots-validate` (runs values schema check, Alejandra format check, Statix/Deadnix linter, Flake check, and SAST security check).
   - Ephemeral test runner: `dots-test-vm` (dry build, nvd package version diff, systemd unit verification).
   - Or run manually:
     - Alejandra format check: `nix fmt -- .`
     - Linter / anti-patterns: `statix check . && deadnix .`
     - Flake evaluation: `nix flake check --impure`
     - Build verification: `dots-build` (or `nix build .#nixosConfigurations.nixos.config.system.build.toplevel --impure`)
5. **System Activation Policy**:
   - **NEVER** run `nixos-rebuild switch` or `dots-switch` unless the user explicitly and directly requests applying/switching the live system configuration.
   - Building and validating derivations (`dots-validate`, `dots-build`) does not require system activation.
6. **Workflow Isolation**: Keep GitHub Actions workflows (`.github/workflows/`) separate from system flake configuration unless the task specifically targets CI/CD automation.
