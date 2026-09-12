# Design Document: Declare Gemini CLI in NixOS AI Module

**Date:** 2026-09-07  
**Status:** Approved  
**Target Repository:** `damathryxx64` (NixOS-WSL dotfiles)

## 1. Context & Motivation
The system configuration manages AI coding agent runtimes in `modules/ai/default.nix`.
Previously, `gemini-cli` was declared alongside `antigravity-cli` and other AI CLI tools. In recent updates, `gemini-cli` was omitted from `environment.systemPackages`, leaving the `gemini` command absent from system `$PATH`. (Note: foreign AI CLI tools like `herdr`, `opencode`, `claude-code`, `codex`, `github-copilot-cli`, and `ollama` have since been purged from the system configuration.)

The user confirmed they want the standalone `pkgs.gemini-cli` package installed system-wide.

## 2. Architecture & Changes
- **Module**: `modules/ai/default.nix`
- **Configuration**: Add `gemini-cli` to `environment.systemPackages`.
- **Derivation**: `pkgs.gemini-cli` (v0.47.0) provides the official `gemini` command with MCP, skills, hooks, and extensions support.

## 3. Verification & Compliance
- **Formatting**: Format using `nix fmt -- .` with Alejandra.
- **Flake Integrity**: Run `nix flake check --impure`.
- **System Derivation Build**: Build toplevel with `nixos-rebuild build --flake .#nixos --impure` (or `nix build .#nixosConfigurations.nixos.config.system.build.toplevel --impure`) to verify evaluation and build without runtime failure.
- **System Activation**: Defer `nixos-rebuild switch` to explicit user activation per repository guidelines.
