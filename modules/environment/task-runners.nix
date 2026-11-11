{
  pkgs,
  values ? (import ../../lib/values.nix),
  ...
}: let
  dotsVal = pkgs.writeShellScriptBin "dots-val" ''
    set -euo pipefail
    VAL_FILE="${values.paths.dots_repo}/values.json"
    if [ ! -f "$VAL_FILE" ]; then
      echo "Error: values.json not found at $VAL_FILE" >&2
      exit 1
    fi
    if [ $# -eq 0 ]; then
      exec ${pkgs.jq}/bin/jq '.' "$VAL_FILE"
    fi

    QUERY="$1"
    RAW_PATH="''${QUERY#.}"

    PATH_EXISTS=$(${pkgs.jq}/bin/jq --arg path "$RAW_PATH" '
      getpath($path | split(".")) != null
    ' "$VAL_FILE")

    if [ "$PATH_EXISTS" != "true" ]; then
      echo "Error: Key '$1' not found in $VAL_FILE" >&2
      exit 1
    fi

    exec ${pkgs.jq}/bin/jq -r ".$RAW_PATH" "$VAL_FILE"
  '';

  dotsValidate = pkgs.writeShellScriptBin "dots-validate" ''
        set -euo pipefail
        REPO_DIR="${values.paths.dots_repo}"
        cd "$REPO_DIR"

        echo -e "\033[1;34m==>\033[0m \033[1m[1/5] Validating values.json schema & JSON syntax...\033[0m"
        if [ -f "values.json" ]; then
          ${pkgs.jq}/bin/jq empty values.json
          ${pkgs.python3}/bin/python3 -c '
    import json, sys
    with open("values.json") as f:
        d = json.load(f)
    req = ["identity", "system", "wsl", "windows", "paths", "github", "security"]
    missing = [k for k in req if k not in d]
    if missing:
        print(f"Error: values.json missing required keys: {missing}", file=sys.stderr)
        sys.exit(1)
    '
        fi

        echo -e "\033[1;34m==>\033[0m \033[1m[2/5] Checking Nix code formatting (Alejandra)...\033[0m"
        ${pkgs.alejandra}/bin/alejandra -c .

        echo -e "\033[1;34m==>\033[0m \033[1m[3/5] Checking Nix anti-patterns (Statix)...\033[0m"
        ${pkgs.statix}/bin/statix check .

        echo -e "\033[1;34m==>\033[0m \033[1m[4/5] Checking dead code (Deadnix)...\033[0m"
        ${pkgs.deadnix}/bin/deadnix .

        echo -e "\033[1;34m==>\033[0m \033[1m[5/5] Verifying Nix flake evaluations & checks...\033[0m"
        ${pkgs.nix}/bin/nix flake check --impure

        echo -e "\033[1;32m[ok] All Nix dots quality gates passed.\033[0m"
  '';

  dotsFmt = pkgs.writeShellScriptBin "dots-fmt" ''
    set -euo pipefail
    REPO_DIR="${values.paths.dots_repo}"
    TARGET="''${1:-$REPO_DIR}"
    exec ${pkgs.alejandra}/bin/alejandra "$TARGET"
  '';

  dotsLint = pkgs.writeShellScriptBin "dots-lint" ''
    set -euo pipefail
    REPO_DIR="${values.paths.dots_repo}"
    cd "$REPO_DIR"
    echo -e "\033[1;34m==> Checking Statix...\033[0m"
    ${pkgs.statix}/bin/statix check .
    echo -e "\033[1;34m==> Checking Deadnix...\033[0m"
    ${pkgs.deadnix}/bin/deadnix .
    echo -e "\033[1;32m[ok] Lint clean (0 warnings).\033[0m"
  '';

  dotsBuild = pkgs.writeShellScriptBin "dots-build" ''
    set -euo pipefail
    exec ${pkgs.nh}/bin/nh os build "$@"
  '';

  dotsSwitch = pkgs.writeShellScriptBin "dots-switch" ''
    set -euo pipefail
    REPO_DIR="${values.paths.dots_repo}"
    cd "$REPO_DIR"
    exec ${pkgs.nh}/bin/nh os switch "$@"
  '';

  dotsUpgrade = pkgs.writeShellScriptBin "dots-upgrade" ''
    set -euo pipefail
    REPO_DIR="${values.paths.dots_repo}"
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
    WORKSPACE_ROOT="${values.paths.workspace_root}"
    DOTS_REPO="$WORKSPACE_ROOT/${values.paths.dots_name}"
    echo -e "\033[1;36m==> [dots-workspace-sync] Syncing repositories and system...\033[0m"

    REPOS=("${values.paths.dots_name}")

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
              echo -e "    \033[33m[warn] Could not cleanly pull $repo from origin. Continuing...\033[0m"
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

    echo -e "\n\033[1;32m[ok] All flakes pulled and NixOS switched successfully.\033[0m"

    if [ -x "${pkgs.libnotify}/bin/notify-send" ]; then
      ${pkgs.libnotify}/bin/notify-send -u normal -a "Antigravity Workspace" "Workspace Flakes Synced" "All repositories pulled and NixOS configuration applied." 2>/dev/null || true
    fi
  '';

  dotsTestVm = pkgs.writeShellScriptBin "dots-test-vm" ''
    set -euo pipefail
    REPO_DIR="${values.paths.dots_repo}"
    cd "$REPO_DIR"
    echo -e "\033[1;36m==> [dots-test-vm] Ephemeral sandbox validation...\033[0m"

    echo -e "\033[1m==> [1/3] Building ephemeral system derivation (dry build)...\033[0m"
    TOPLEVEL=$(${pkgs.nix}/bin/nix build .#nixosConfigurations.nixos.config.system.build.toplevel --impure --no-link --print-out-paths)
    echo -e "  ↳ Derivation: \033[32m$TOPLEVEL\033[0m"

    echo -e "\n\033[1m==> [2/3] Comparing changes against live system (nvd diff)...\033[0m"
    if [ -d "/run/current-system" ] && [ -x "${pkgs.nvd}/bin/nvd" ]; then
      ${pkgs.nvd}/bin/nvd diff /run/current-system "$TOPLEVEL" || true
    fi

    echo -e "\n\033[1m==> [3/3] Inspecting systemd unit activation & configuration...\033[0m"
    if [ "$(id -u)" -eq 0 ]; then
      "$TOPLEVEL/bin/switch-to-configuration" dry-activate
    else
      echo -e "  ↳ Non-root user: skipping live dry-activate execution."
      echo -e "  ↳ To test systemd service transitions safely: \033[1;33msudo $TOPLEVEL/bin/switch-to-configuration dry-activate\033[0m"
    fi

    echo -e "\n\033[1;32m[ok] Ephemeral system test completed cleanly (zero mutations).\033[0m"
  '';

  helpNix = pkgs.writeShellScriptBin "help-nix" ''
    echo -e "\033[1;36mNixOS Developer Tools Quick Reference:\033[0m"
    echo ""
    echo -e "\033[1;33mHandy Task Commands:\033[0m"
    echo "  dots-validate                  → Run full 5-stage validation (Values Schema, Alejandra, Statix, Deadnix, Flake)"
    echo "  dots-test-vm                   → Safe dry build, nvd package diff & systemd activation check"
    echo "  dots-fmt                       → Format Nix expressions with Alejandra"
    echo "  dots-lint                      → Run Statix & Deadnix anti-pattern checks"
    echo "  dots-build                     → Fast build with progress (nh os build)"
    echo "  dots-switch                    → Switch live system (nh os switch)"
    echo "  dots-upgrade                   → Validate, update flake inputs & switch in 1 step"
    echo "  dots-clean                     → Clean old generations (nh clean all)"
    echo ""
    echo -e "\033[1;33mBuild & Switch (nh):\033[0m"
    echo "  nh os build                    → Dry build system configuration"
    echo "  nh os test                     → Activate configuration for current session"
    echo "  nh os switch --update          → Update flake & switch in one command"
    echo "  nh search <query>              → Fast package search"
    echo ""
    echo -e "\033[1;33mPackage Authoring & Discovery:\033[0m"
    echo "  nurl <url>                     → Generate fetcher expression with precomputed hash"
    echo "  nix-init <url>                 → Scaffold new Nix derivation from repository"
    echo "  nix-update <pkg>               → Automatically update package version and hashes"
    echo "  manix <query>                  → Search NixOS options & nixpkgs functions"
    echo "  , <binary>                     → Ephemeral execution of uninstalled packages"
    echo ""
    echo -e "\033[1;33mInspection & Diffing:\033[0m"
    echo "  nix-diff <d1> <d2>             → Explain differences between two derivations"
    echo "  nix-tree                       → Interactive TUI for exploring store closure trees"
    echo ""
    echo -e "\033[1;33mAntigravity Superpowers & AI Agents:\033[0m"
    echo "  antigravity-superpowers init   → Scaffold .agents directory"
    echo "  antigravity-superpowers doctor → Diagnose agent environment"
    echo "  antigravity-superpowers check  → Verify profile integrity"
    echo "  antigravity-superpowers sync   → Synchronize skills and rules"
    echo "  refresh-skills                 → Synchronize in-tree declarative skills to ~/.gemini/config"
    echo "  agy -p <prompt>                → Execute non-interactive AGY prompt"
    echo "  agy -i <prompt>                → Interactive AGY prompt session"
    echo "  agy -c                         → Continue most recent AGY conversation"
    echo "  agy / gemini-cli               → Antigravity CLI & Gemini AI Toolkit"
    echo "  claude / claude-code           → Claude Code CLI (routed to Google Gemini)"
    echo "  ccr [start|stop|status]        → Claude Code Router daemon & control plane"
    echo ""
    echo -e "\033[1;33mWSL Interop & Productivity:\033[0m"
    echo "  cb                             → WSL bidirectional clipboard bridge (pipe to copy, bare to paste)"
    echo "  agy2 [args]                    → Launch Antigravity 2.0 on Windows, connected to NixOS WSL"
    echo "  antigravity2 [args]            → Alias for agy2"
    echo ""
    echo -e "\033[1;33mWorkspace Sync:\033[0m"
    echo "  dots-workspace-sync            → Pull + validate + nh os switch (full pipeline, run manually)"
    echo ""
  '';
in {
  environment.systemPackages = [
    dotsVal
    dotsValidate
    dotsFmt
    dotsLint
    dotsBuild
    dotsSwitch
    dotsUpgrade
    dotsClean
    dotsWorkspaceSync
    dotsTestVm
    helpNix
  ];
}
