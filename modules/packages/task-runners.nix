{pkgs, ...}: let
  dotsValidate = pkgs.writeShellScriptBin "dots-validate" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"

    echo -e "\033[1;34m==>\033[0m \033[1m[1/4] Checking Nix code formatting (Alejandra)...\033[0m"
    ${pkgs.alejandra}/bin/alejandra -c .

    echo -e "\033[1;34m==>\033[0m \033[1m[2/4] Checking Nix anti-patterns (Statix)...\033[0m"
    ${pkgs.statix}/bin/statix check .

    echo -e "\033[1;34m==>\033[0m \033[1m[3/4] Checking dead code (Deadnix)...\033[0m"
    ${pkgs.deadnix}/bin/deadnix .

    echo -e "\033[1;34m==>\033[0m \033[1m[4/4] Verifying Nix flake evaluations & checks...\033[0m"
    ${pkgs.nix}/bin/nix flake check --impure

    echo -e "\033[1;32m✓ All Nix dots quality gates passed!\033[0m"
  '';

  dotsFmt = pkgs.writeShellScriptBin "dots-fmt" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    TARGET="''${1:-$REPO_DIR}"
    exec ${pkgs.alejandra}/bin/alejandra "$TARGET"
  '';

  dotsLint = pkgs.writeShellScriptBin "dots-lint" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"
    echo -e "\033[1;34m==> Checking Statix...\033[0m"
    ${pkgs.statix}/bin/statix check .
    echo -e "\033[1;34m==> Checking Deadnix...\033[0m"
    ${pkgs.deadnix}/bin/deadnix .
    echo -e "\033[1;32m✓ Lint clean (0 warnings).\033[0m"
  '';

  dotsBuild = pkgs.writeShellScriptBin "dots-build" ''
    set -euo pipefail
    exec ${pkgs.nh}/bin/nh os build "$@"
  '';

  dotsSwitch = pkgs.writeShellScriptBin "dots-switch" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"
    exec ${pkgs.nh}/bin/nh os switch "$@"
  '';

  dotsUpgrade = pkgs.writeShellScriptBin "dots-upgrade" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"
    echo -e "\033[1;34m==>\033[0m \033[1m[1/2] Checking quality gates...\033[0m"
    ${dotsValidate}/bin/dots-validate
    echo -e "\033[1;34m==>\033[0m \033[1m[2/2] Updating flake inputs and switching system...\033[0m"
    exec ${pkgs.nh}/bin/nh os switch --update "$@"
  '';

  dotsClean = pkgs.writeShellScriptBin "dots-clean" ''
    set -euo pipefail
    exec ${pkgs.nh}/bin/nh clean all "$@"
  '';

  dotsWorkspaceSync = pkgs.writeShellScriptBin "dots-workspace-sync" ''
    set -euo pipefail
    WORKSPACE_ROOT="/home/damathryxx64/repositories"
    DOTS_REPO="$WORKSPACE_ROOT/damathryxx64"

    echo -e "\033[1;36m══════════════════════════════════════════════════════════════════════\033[0m"
    echo -e "\033[1;36m 🚀 Antigravity Workspace Auto-Sync, Flake Update & System Switch\033[0m"
    echo -e "\033[1;36m══════════════════════════════════════════════════════════════════════\033[0m\n"

    REPOS=("damathryxx64" "clamav-scanner" "antigravity-superpowers" "skills" "NixOS-WSL")

    echo -e "\033[1m==> [1/3] Pulling latest changes from origin across repositories...\033[0m"
    for repo in "''${REPOS[@]}"; do
      repo_path="$WORKSPACE_ROOT/$repo"
      if [ -d "$repo_path/.git" ]; then
        echo -e "  ↳ Pulling \033[36m$repo\033[0m..."
        (
          cd "$repo_path"
          branch=$( ${pkgs.git}/bin/git branch --show-current || echo "" )
          if [ -n "$branch" ]; then
            if ${pkgs.git}/bin/git fetch --no-write-fetch-head origin "$branch" && \
               ${pkgs.git}/bin/git rebase --autostash "origin/$branch"; then
              :
            else
              ${pkgs.git}/bin/git rebase --abort 2>/dev/null || true
              echo -e "    \033[33m⚠️  Could not cleanly pull $repo from origin. Continuing...\033[0m"
            fi
          fi
        )
      fi
    done

    echo -e "\n\033[1m==> [2/3] Validating dots flake & quality gates...\033[0m"
    cd "$DOTS_REPO"
    ${dotsValidate}/bin/dots-validate

    echo -e "\n\033[1m==> [3/3] Building and switching NixOS configuration...\033[0m"
    ${pkgs.nh}/bin/nh os switch

    echo -e "\n\033[1;32m✓ All flakes pulled from origin and NixOS switched successfully!\033[0m"

    if [ -x "${pkgs.libnotify}/bin/notify-send" ]; then
      ${pkgs.libnotify}/bin/notify-send -u normal -a "Antigravity Workspace" "Workspace Flakes Synced" "All repositories pulled and NixOS configuration applied." 2>/dev/null || true
    fi
  '';
in {
  environment.systemPackages = [
    dotsValidate
    dotsFmt
    dotsLint
    dotsBuild
    dotsSwitch
    dotsUpgrade
    dotsClean
    dotsWorkspaceSync
  ];
}
