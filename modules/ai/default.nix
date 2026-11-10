{pkgs, ...}: let
  # ── Specify CLI Installer (GitHub Spec-Kit) ───────────────────────────
  # Installs specify-cli via uv tool if not already present.
  specifyCliInstaller = pkgs.writeShellScript "specify-cli-install" ''
    set -eu
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [uv coreutils bash])}:$PATH"

    if [ ! -x "$HOME/.local/bin/specify" ]; then
      echo "specify-cli: installing via uv tool..."
      ${pkgs.uv}/bin/uv tool install specify-cli || true
    fi
  '';

  # ── Antigravity 2.0 Host Launcher ──────────────────────────────────────
  # Launches the Antigravity 2.0 desktop application on the Windows host,
  # attached to this NixOS WSL distribution.
  agy2Launcher = pkgs.writeShellScriptBin "agy2" ''
    set -euo pipefail

    WIN_BIN=""
    if command -v cmd.exe >/dev/null 2>&1; then
      LOCAL_APP_DATA="$(cmd.exe /c 'echo %LOCALAPPDATA%' 2>/dev/null | tr -d '\r')"
      if [ -n "$LOCAL_APP_DATA" ]; then
        CANDIDATE="$(wslpath -u "$LOCAL_APP_DATA/Programs/antigravity/Antigravity.exe" 2>/dev/null || true)"
        if [ -f "$CANDIDATE" ]; then
          WIN_BIN="$CANDIDATE"
        fi
      fi
    fi

    if [ -z "$WIN_BIN" ]; then
      for candidate in /mnt/c/Users/*/AppData/Local/Programs/antigravity/Antigravity.exe; do
        if [ -f "$candidate" ]; then
          WIN_BIN="$candidate"
          break
        fi
      done
    fi

    if [ -z "$WIN_BIN" ] || [ ! -f "$WIN_BIN" ]; then
      echo "Error: Antigravity 2.0 executable not found on Windows host." >&2
      exit 1
    fi

    if [ $# -eq 0 ]; then
      nohup "$WIN_BIN" --wsl-distro=NixOS >/dev/null 2>&1 &
    else
      ARGS=()
      for arg in "$@"; do
        if [[ "$arg" == -* ]]; then
          ARGS+=("$arg")
        elif [[ -e "$arg" ]]; then
          ARGS+=("$(wslpath -w "$arg")")
        else
          ARGS+=("$arg")
        fi
      done
      nohup "$WIN_BIN" --wsl-distro=NixOS "''${ARGS[@]}" >/dev/null 2>&1 &
    fi
  '';

  antigravity2Launcher = pkgs.writeShellScriptBin "antigravity2" ''
    exec ${agy2Launcher}/bin/agy2 "$@"
  '';

  antigravityCliCompat = pkgs.writeShellScriptBin "antigravity-cli" ''
    if [ "$#" -eq 1 ] && [ "$1" = "--version" ]; then
      echo "antigravity-cli 1.4.1"
      exit 0
    fi
    exec ${pkgs.antigravity-cli}/bin/agy "$@"
  '';

  geminiCliCompat = pkgs.writeShellScriptBin "gemini-cli" ''
    exec ${pkgs.gemini-cli}/bin/gemini "$@"
  '';
in {
  imports = [
    ./skills.nix
    ./superpowers.nix
    ./mcp.nix
  ];

  nixpkgs.config.problems.handlers.gemini-cli.removal = "ignore";

  # Exclusively Antigravity & Gemini AI toolkit
  environment.systemPackages = with pkgs; [
    antigravity-cli
    gemini-cli
    antigravityCliCompat
    geminiCliCompat
    agy2Launcher
    antigravity2Launcher
  ];

  programs.antigravity-superpowers = {
    enable = true;
    installGlobally = false; # Managed declaratively by agent-skills-sync in skills.nix (eliminates boot-time race condition)
  };

  # ── Spec Kit CLI Activation Script ─────────────────────────────────────
  system.userActivationScripts.specifyCli = {
    text = "${specifyCliInstaller}";
  };
}
