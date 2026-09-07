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
