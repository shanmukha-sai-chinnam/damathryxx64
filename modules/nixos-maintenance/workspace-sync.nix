{pkgs, ...}: let
  # ── Workspace Pull Script ───────────────────────────────────────────────
  # Git-pulls all managed repositories from origin without switching the
  # live system. Safe to run automatically on login. For the full pipeline
  # (pull + validate + nh os switch), use dots-workspace-sync manually.
  dotsWorkspacePull = pkgs.writeShellScriptBin "dots-workspace-pull" ''
    set -euo pipefail
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [git coreutils])}:$PATH"

    WORKSPACE_ROOT="/home/damathryxx64/repositories"
    REPOS=("damathryxx64" "clamav-scanner" "antigravity-superpowers" "skills" "NixOS-WSL")

    echo -e "\033[1;36m══════════════════════════════════════════════════════════════════════\033[0m"
    echo -e "\033[1;36m 🔄 Workspace Repository Pull\033[0m"
    echo -e "\033[1;36m══════════════════════════════════════════════════════════════════════\033[0m"

    for repo in "''${REPOS[@]}"; do
      repo_path="$WORKSPACE_ROOT/$repo"
      if [ -d "$repo_path/.git" ]; then
        branch="$(${pkgs.git}/bin/git -C "$repo_path" branch --show-current 2>/dev/null || echo "")"
        if [ -n "$branch" ]; then
          echo -e "  ↳ Pulling \033[36m$repo\033[0m ($branch)..."
          if ${pkgs.git}/bin/git -C "$repo_path" fetch --no-write-fetch-head origin "$branch" 2>/dev/null && \
             ${pkgs.git}/bin/git -C "$repo_path" rebase --autostash "origin/$branch" 2>/dev/null; then
            echo -e "    \033[32m✓ $repo up to date\033[0m"
          else
            ${pkgs.git}/bin/git -C "$repo_path" rebase --abort 2>/dev/null || true
            echo -e "    \033[33m⚠ $repo could not be cleanly pulled. Continuing...\033[0m"
          fi
        fi
      fi
    done

    echo -e "\n\033[1;32m✓ Workspace pull complete.\033[0m"
    echo -e "  Run \033[1mdots-workspace-sync\033[0m to also validate \u0026 switch the live system."
  '';
in {
  environment.systemPackages = [dotsWorkspacePull];

  # ── Workspace Pull Service (login-time) ─────────────────────────────────
  # Pulls all managed repositories from origin on every user session start.
  # Runs after the network is available. Does NOT switch the live system
  # (use dots-workspace-sync manually for the full pull + validate + switch
  # pipeline when you are ready to apply configuration changes).
  systemd.user.services.dots-workspace-pull = {
    description = "Pull all workspace repositories from origin on session start";
    wantedBy = ["default.target"];
    after = ["network.target"];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "${dotsWorkspacePull}/bin/dots-workspace-pull";
      RemainAfterExit = true;
      StandardOutput = "journal";
      StandardError = "journal";
    };
  };
}
