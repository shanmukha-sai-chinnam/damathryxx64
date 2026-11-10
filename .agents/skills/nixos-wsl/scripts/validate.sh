#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
cd "$REPO_DIR"

echo "==> Working directory: $REPO_DIR"

echo "==> [1/5] Formatting Nix files with Alejandra..."
nix fmt -- .

echo "==> [2/5] Linting Nix code with Statix..."
statix check .

echo "==> [3/5] Checking dead code with Deadnix..."
deadnix .

echo "==> [4/5] Verifying flake outputs and integrity..."
nix flake check --impure

echo "==> [5/5] Building NixOS system derivation..."
nixos-rebuild build --flake .#nixos --impure

echo "==> All end-to-end validations, lints, and builds passed successfully!"
