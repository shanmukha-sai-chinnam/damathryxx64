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

  # ── Claude Code Launcher with Gemini Base URL & Dynamic Token ─────────
  claudeLauncher = pkgs.writeShellScriptBin "claude" ''
    set -euo pipefail
    export ANTHROPIC_BASE_URL="''${ANTHROPIC_BASE_URL:-https://generativelanguage.googleapis.com/v1beta/openai/}"
    if [ -z "''${GEMINI_API_KEY:-}" ]; then
      if [ -f "$HOME/repositories/nether-ward/.env" ]; then
        K="$(grep -E '^GEMINI_API_KEY=' "$HOME/repositories/nether-ward/.env" | cut -d '=' -f2- | tr -d '"' | tr -d ' ' || true)"
        if [ -n "$K" ]; then
          export GEMINI_API_KEY="$K"
        fi
      fi
      if [ -z "''${GEMINI_API_KEY:-}" ] && [ -f "$HOME/.gemini/api_key" ]; then
        export GEMINI_API_KEY="$(tr -d '\r\n ' < "$HOME/.gemini/api_key" 2>/dev/null || true)"
      fi
      if [ -z "''${GEMINI_API_KEY:-}" ] && [ -f "$HOME/.config/gemini/api_key" ]; then
        export GEMINI_API_KEY="$(tr -d '\r\n ' < "$HOME/.config/gemini/api_key" 2>/dev/null || true)"
      fi
    fi

    if [ -n "''${GEMINI_API_KEY:-}" ]; then
      export ANTHROPIC_AUTH_TOKEN="''${ANTHROPIC_AUTH_TOKEN:-$GEMINI_API_KEY}"
      export ANTHROPIC_API_KEY="''${ANTHROPIC_API_KEY:-$GEMINI_API_KEY}"
    fi

    exec ${pkgs.claude-code}/bin/claude "$@"
  '';

  claudeCodeCompat = pkgs.writeShellScriptBin "claude-code" ''
    exec ${claudeLauncher}/bin/claude "$@"
  '';

  claudeSettingsInstaller = pkgs.writeShellScript "claude-settings-install" ''
        set -eu
        CLAUDE_DIR="$HOME/.claude"
        mkdir -p "$CLAUDE_DIR"
        SETTINGS_FILE="$CLAUDE_DIR/settings.json"

        GEMINI_KEY=""
        if [ -f "$HOME/repositories/nether-ward/.env" ]; then
          GEMINI_KEY="$(grep -E '^GEMINI_API_KEY=' "$HOME/repositories/nether-ward/.env" | cut -d '=' -f2- | tr -d '"' | tr -d ' ' || true)"
        fi
        if [ -z "$GEMINI_KEY" ] && [ -f "$HOME/.gemini/api_key" ]; then
          GEMINI_KEY="$(tr -d '\r\n ' < "$HOME/.gemini/api_key" 2>/dev/null || true)"
        fi
        if [ -z "$GEMINI_KEY" ] && [ -f "$HOME/.config/gemini/api_key" ]; then
          GEMINI_KEY="$(tr -d '\r\n ' < "$HOME/.config/gemini/api_key" 2>/dev/null || true)"
        fi

        if [ ! -f "$SETTINGS_FILE" ]; then
          if [ -n "$GEMINI_KEY" ]; then
            cat <<EOF > "$SETTINGS_FILE"
    {
      "env": {
        "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "ANTHROPIC_AUTH_TOKEN": "$GEMINI_KEY",
        "ANTHROPIC_API_KEY": "$GEMINI_KEY"
      }
    }
    EOF
          else
            cat <<EOF > "$SETTINGS_FILE"
    {
      "env": {
        "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com/v1beta/openai/"
      }
    }
    EOF
          fi
          chmod 600 "$SETTINGS_FILE"
        else
          if [ -n "$GEMINI_KEY" ]; then
            ${pkgs.jq}/bin/jq \
              --arg url "https://generativelanguage.googleapis.com/v1beta/openai/" \
              --arg token "$GEMINI_KEY" \
              '.env.ANTHROPIC_BASE_URL = $url | .env.ANTHROPIC_AUTH_TOKEN = $token | .env.ANTHROPIC_API_KEY = $token' \
              "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
          else
            ${pkgs.jq}/bin/jq \
              --arg url "https://generativelanguage.googleapis.com/v1beta/openai/" \
              '.env.ANTHROPIC_BASE_URL = $url' \
              "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
          fi
          chmod 600 "$SETTINGS_FILE"
        fi
  '';
in {
  imports = [
    ./skills.nix
    ./superpowers.nix
    ./mcp.nix
    ./nether-ward.nix
  ];

  nixpkgs.config.problems.handlers.gemini-cli.removal = "ignore";

  environment.sessionVariables = {
    ANTHROPIC_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
  };

  # Antigravity, Gemini & Claude Code AI toolkits
  environment.systemPackages = [
    pkgs.antigravity-cli
    pkgs.gemini-cli
    antigravityCliCompat
    geminiCliCompat
    agy2Launcher
    antigravity2Launcher
    claudeLauncher
    claudeCodeCompat
  ];

  programs.antigravity-superpowers = {
    enable = true;
    installGlobally = false; # Managed declaratively by agent-skills-sync in skills.nix (eliminates boot-time race condition)
  };

  # ── Spec Kit CLI Activation Script ─────────────────────────────────────
  system.userActivationScripts.specifyCli = {
    text = "${specifyCliInstaller}";
  };

  # ── Claude Code Settings Activation Script ─────────────────────────────
  system.userActivationScripts.claudeSettings = {
    text = "${claudeSettingsInstaller}";
  };
}
