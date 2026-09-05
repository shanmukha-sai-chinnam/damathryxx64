---
name: Repository Copilot Instructions
description: Apply repository-wide guidance for the NixOS-WSL configuration and its development environments.
applyTo: '**'
---

# Project context

- This repository is a declarative NixOS configuration for Windows Subsystem for Linux (WSL).
- The flake entry point is `flake.nix`; system modules are under `modules/`.
- Development shells are defined under `modules/shells/` and packages under `modules/packages/`.

# Change guidelines

- Prefer declarative Nix configuration and reuse existing variables and module boundaries.
- Keep configuration and rationale in version control; use meaningful names and focused changes.
- Preserve reproducibility by avoiding unnecessary mutable or machine-specific state.
- Follow NixOS package-management and system-update best practices.
- Test configuration changes with `nixos-rebuild build --flake /home/damathryxx64/repositories/damathryxx64#nixos` before applying them.
- Use `nix fmt` or the repository's configured formatter for Nix files.
- Do not run `nixos-rebuild switch` unless the user explicitly requests applying the system configuration.
- Keep GitHub Actions workflow changes separate from configuration changes unless the task explicitly includes workflows.
