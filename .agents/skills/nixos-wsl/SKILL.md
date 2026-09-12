---
name: nixos-wsl
description: >-
  Work on NixOS, WSL configuration, Nix flakes, development shells (python, devops, resume),
  modular system configurations, package definitions, and declarative dots management.
  Use this skill when modifying system modules, devShells, updating flakes, or building NixOS.
---

# NixOS-WSL & DevOps Skill

This skill guides the agent through modifying, validating, building, and maintaining this declarative NixOS-WSL repository.

## Module Map

When adding packages or changing configuration, target the owning module:

| Domain | File Path | Notes |
| :--- | :--- | :--- |
| **System Orchestration** | `flake.nix`, `modules/configuration.nix` | Imports and host settings (`nixos-wsl`) |
| **AI & Agent Integration** | `modules/ai/default.nix` | Antigravity CLI, Gemini CLI, `antigravity-superpowers`, `skills.nix`, `dots-sync-skills`, `refresh-skills` |
| **Development Toolchain** | `modules/development/default.nix` | Compilers, runtimes, build tools, nixd |
| **MCP Servers** | `modules/mcp/default.nix` | Model Context Protocol servers |
| **Fonts & Typography** | `modules/fonts/default.nix` | Cascadia Code, Fira Code nerd font, fontconfig |
| **Maintenance & Tools** | `modules/nixos-maintenance/default.nix` | `nh`, formatters, linters, packaging tools, and caches |
| **General Utilities** | `modules/packages/default.nix` | CLI tools (vim, gh, eza, fzf, ripgrep, bat) |
| **Shell & DevShells** | `modules/shells/default.nix` | Zsh, Starship, direnv, comma, nix-your-shell |
| **Python DevShell** | `modules/shells/python.nix` | Python 3.12 environment |
| **DevOps DevShell** | `modules/shells/devops.nix` | AWS, Terraform, Docker, K8s, Grafana tools |

---

## Standard Workflows & Runbooks

### 1. Code Quality & Linting Pipeline

Run the static linter, dead code cleaner, and formatter:

```sh
# Format all Nix expressions
nix fmt -- .

# Static analysis linter
statix check .

# Automatically fix statix suggestions
statix fix .

# Scan for dead/unused code
deadnix .
```

### 2. Flake Validation

Verify the entire flake structure and devShell definitions:

```sh
nix flake check --impure
```

> [!NOTE]
> `--impure` is required because `nixpkgs` is imported with `config.allowUnfree = true` (to accommodate packages like Terraform, Antigravity, and unfree utilities).

### 3. Fast Interactive Build & Switch (`nh`)

`nh` is pre-configured with this repository as the default flake:

```sh
# Build without activating (with colored NOM progress and diff)
nh os build

# Test configuration for current session only
nh os test

# Apply and switch configuration (only when explicitly requested)
nh os switch

# Clean older generations
nh clean all
```

> [!CAUTION]
> **NEVER** run `nixos-rebuild switch` or `nh os switch` automatically. Only perform a system switch if the user explicitly instructs you to apply the live configuration.

### 4. Discovery & Documentation Search

```sh
# Search NixOS options, Home Manager options, and nixpkgs lib functions
manix <query>

# Search packages with pretty terminal formatting
nh search <query>

# Ephemeral execution of any package without installing
, <binary>
# e.g., , cowsay hello
```

### 5. Packaging & Derivation Development

```sh
# Generate a fetcher expression with precalculated hash
nurl https://github.com/owner/repo

# Automatically update a package version and hashes in nixpkgs
nix-update <pkg>

# Inspect closures and see differences between two derivations
nix-diff <drv1> <drv2>

# Interactive TUI data explorer
nix-inspect
```

### 6. Developer Shells & Direnv

The repository includes a dedicated `default` devShell with the entire authoring, linting, and inspection toolchain:

```sh
# Enter default developer environment (automatically triggered via direnv)
nix develop

# Inside the devShell, print tool shortcuts at any time:
help-nix

# Other specialized devShells:
nix develop .#python --command python --version
nix develop .#devops --command which terraform kubectl aws
nix develop .#resume --command typst --version
```

### 7. Universal Shell Shortcuts (Aliases)

Available system-wide in Zsh and Bash:

| Alias | Command | Purpose |
| :--- | :--- | :--- |
| `nhb` | `nh os build` | Build system derivation with NOM progress & visual diff |
| `nht` | `nh os test` | Test configuration for current session only |
| `nhs` | `nh os switch` | Apply configuration live (user prompted only) |
| `nhc` | `nh clean all` | Garbage collect old generations & optimize store |
| `nhsearch` | `nh search` | Fast, colorful package search |
| `nfmt` | `nix fmt -- .` | Format all Nix expressions with Alejandra |
| `nlint` | `statix check . && deadnix .` | Check for anti-patterns and dead code |
| `nfix` | `statix fix . && nix fmt -- .` | Automatically fix anti-patterns and format |
| `nval` | `dots-validate` | Run the full validation pipeline (Alejandra, Statix, Deadnix, Flake check) |
| `comma` | `,` | Run any nixpkgs binary on-the-fly |
| `nman` | `manix` | Search NixOS options & nixpkgs functions |
| `ndiff` | `nix-diff` | Compare two derivations |
| `ntree` | `nix-tree` | TUI store closure tree explorer |
| `ninspect` | `nix-inspect` | TUI data explorer |

### 8. Declarative Task Runners

Available system-wide via `modules/packages/task-runners.nix`:

| Command | Purpose |
| :--- | :--- |
| `dots-validate` | Full validation pipeline: format check, Statix/Deadnix linter, Flake check |
| `dots-fmt` | Format code with Alejandra |
| `dots-lint` | Lint anti-patterns and dead code |
| `dots-build` | Dry-build system toplevel derivation without switching |
| `dots-switch` | Safely validate and switch live NixOS configuration |
| `dots-upgrade` | Update flake inputs, validate, and switch |
| `dots-clean` | Clean old generations and optimize Nix store |
