# Declarative Agent Skills Hub

First-party agent skills and rules managed declaratively within the `damathryxx64` monorepo.

## Architecture

- **In-Tree Source**: All skills reside directly in `skills/skills/` and rules in `skills/rules/`.
- **Activation**: `modules/ai/skills.nix` stages active skills and syncs them directly into `~/.gemini/config/skills/` on system activation or via `refresh-skills`.
- **Zero Drift**: Zero external upstream remotes or runtime AST rewriting. All skills are versioned directly in this repository.

## Core Skills

| Category | Skills |
|---|---|
| **System & Environment** | `nixos-system-rebuild`, `nixos-wsl-interop`, `nix-flake-management`, `nix-code-audit`, `windows-wsl-host-bridge` |
| **Engineering Discipline** | `karpathy-guidelines`, `systematic-debugging`, `autonomous-execution`, `outcome-driven-reporting`, `persistent-memory-protocol` |
| **Output Style** | `anti-slop-writing`, `i-have-adhd` |
| **Workspace Specific** | `nixos-wsl`, `typesafe-ai` (in `.agents/skills/`) |

## Commands

```sh
# Synchronize in-tree declarative skills to ~/.gemini/config/
refresh-skills
```
