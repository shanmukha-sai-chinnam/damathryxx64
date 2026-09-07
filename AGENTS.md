# Repository Agent Guidelines: NixOS-WSL

Repository-wide guidance and operating constraints for Antigravity agents in this NixOS-WSL repository.

## Execution Environment: Strict NixOS-WSL

- **Strict WSL Target**: All commands, edits, git operations, builds, formatters, and tests MUST be executed strictly inside NixOS-WSL (`/home/damathryxx64/`).
- **No Direct Windows Work**: Do NOT work on Windows directly unless explicitly and definitively required for Windows-WSL host interoperability, network bridging, or host display integration.

## Repository Overview

- **Flake Entrypoint**: `flake.nix` defines the NixOS-WSL system (`nixosConfigurations.nixos`), development shells (`devShells.python`, `devShells.devops`), and the code formatter (`formatter.alejandra`).
- **Core Configuration**: `modules/configuration.nix` orchestrates imported system modules.
- **Module Architecture**:
  - `modules/ai/`: Herdr, coding agent runtimes (Claude Code, Codex, Copilot CLI, OpenCode), Ollama, and `herdr-integrations.service`.
  - `modules/development/`: Compilers, language runtimes (Python, Node, GCC, Clang, CMake, GnuMake), and Nix language servers (`nixd`).
  - `modules/fonts/`: System and monospace font packages (Cascadia Code, Fira Code nerd font).
  - `modules/mcp/`: Native Model Context Protocol servers (`mcp-nixos`, `github-mcp-server`, `mcp-server-git`, etc.).
  - `modules/nixos-maintenance/`: Nix store optimization, automatic weekly garbage collection, and diagnostic utilities (`nix-tree`, `nix-du`, `nom`).
  - `modules/packages/`: General system CLI utilities and packages.
  - `modules/shells/`: Shell configuration (Zsh, Starship, direnv, bat, fzf) and standalone devShell definitions (`python.nix`, `devops.nix`).

## Available Skills

Agents MUST load the relevant skill via `view_file` on its `SKILL.md` before performing the associated workflow. Skills are discovered automatically from two roots.

### Repository Skills (`.agents/skills/`)

| Skill | Path | Use When |
|---|---|---|
| **herdr** | `.agents/skills/herdr/SKILL.md` | User explicitly mentions Herdr or asks to control panes, tabs, workspaces, or other agents. Requires `HERDR_ENV=1`. |
| **nixos-wsl** | `.agents/skills/nixos-wsl/SKILL.md` | Modifying system modules, devShells, updating flakes, building NixOS, or managing Herdr-managed agent integrations. |

### Global Skills (`~/.gemini/config/skills/`)

| Skill | Use When |
|---|---|
| **antigravity-mcp-integration** | Configuring, developing, debugging, or invoking MCP servers in Antigravity or Herdr. |
| **brainstorming** | Before any creative work — creating features, building components, adding functionality, or modifying behavior. |
| **continuous-codebase-watching** | Setting up background verification, auto-formatting, and static analysis watchers during implementation. |
| **executing-plans** | Executing a written implementation plan in Antigravity single-flow mode. |
| **finishing-a-development-branch** | Implementation is complete, all tests pass, and you need to decide how to integrate the work. |
| **nix-code-audit** | Before committing Nix code or when auditing NixOS modules for code quality, formatting, dead declarations, and antipatterns. |
| **nix-derivation-debugging** | Diagnosing failing Nix builds, compilation errors, missing shared libraries, or packaging issues. |
| **nix-flake-management** | Creating, updating, auditing, or refactoring Nix flakes, inputs, overlays, devShells, or package outputs. |
| **nixos-system-rebuild** | Modifying NixOS configurations, testing system modules, or executing system switches. Enforces 5-stage validation. |
| **nixos-wsl-interop** | Managing, diagnosing, and optimizing NixOS inside WSL 2 (filesystem, systemd, memory, networking). |
| **receiving-code-review** | Receiving code review feedback, before implementing suggestions — requires technical rigor over blind implementation. |
| **requesting-code-review** | Completing tasks, implementing major features, or before merging to verify work meets requirements. |
| **single-flow-task-execution** | Executing implementation plans or doing structured task-by-task development with review gates. |
| **systematic-debugging** | Encountering any bug, test failure, or unexpected behavior — before proposing fixes. |
| **test-driven-development** | Implementing any feature or bugfix — before writing implementation code. |
| **using-git-worktrees** | Starting feature work that needs isolation from the current workspace. |
| **using-superpowers** | Starting any conversation — establishes how to find and use skills. |
| **verification-before-completion** | About to claim work is complete, fixed, or passing — evidence before assertions always. |
| **windows-wsl-host-bridge** | Safe interoperability between NixOS-WSL and the Windows host. |
| **writing-plans** | Have a spec or requirements for a multi-step task — before touching code. |
| **writing-skills** | Creating new skills, editing existing skills, or verifying skills work before deployment. |

## MCP Servers

These MCP servers are configured in `.agents/mcp_config.json` and available for agent use:

| Server | Command | Purpose |
|---|---|---|
| **nixos** | `mcp-nixos` | Query NixOS/Home Manager options, packages, Nix store, flake inputs, wiki, nix.dev docs. |
| **github** | `github-mcp-server` | GitHub API operations (issues, PRs, repos, workflows). |
| **git** | `mcp-server-git` | Git operations (status, diff, commit, branch, log) on this repository. |
| **filesystem** | `mcp-server-filesystem` | File/directory operations within this repository. |
| **fetch** | `mcp-server-fetch` | HTTP content fetching and URL reading. |
| **sequential-thinking** | `mcp-server-sequential-thinking` | Structured multi-step reasoning and problem decomposition. |

## Mandatory Change Guidelines

1. **Always Dots-Driven & Declarative**: Declare all tools, packages, agent runtimes, services, and environments directly in the appropriate module of this repository (`modules/`). Avoid imperative installations, ad-hoc binaries, or unmanaged state. Reuse existing module patterns and variable boundaries.
2. **Reproducibility**: Avoid hardcoded machine-specific paths or volatile state. WSL host settings (CPU, memory, swap) belong in Windows `%UserProfile%\.wslconfig`, not in this repository.
3. **Format Requirement**: Always verify and format Nix expressions using `nix fmt -- .`. All code must comply with Alejandra style.
4. **Pre-commit Validation**:
   - Check flake integrity: `nix flake check --impure`
   - Validate system build: `nixos-rebuild build --flake .#nixos --impure` (or `nix build .#nixosConfigurations.nixos.config.system.build.toplevel --impure`)
5. **System Activation Policy**:
   - **NEVER** run `nixos-rebuild switch` unless the user explicitly and directly requests applying/switching the live system configuration.
   - Building and validating derivations does not require system activation.
6. **Workflow Isolation**: Keep GitHub Actions workflows (`.github/workflows/`) separate from system flake configuration unless the task specifically targets CI/CD automation.
