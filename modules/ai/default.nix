{
  pkgs,
  antigravity-superpowers ? null,
  ...
}: let
  # ── Ponytail Plugin & Rules Installer ──────────────────────────────────
  # Installs the ponytail plugin (https://github.com/DietrichGebert/ponytail)
  # for Antigravity CLI and symlinks its ruleset into ~/.gemini/config/rules.
  # Idempotent: skips if ~/.gemini/config/plugins/ponytail already exists.
  ponytailInstaller = pkgs.writeShellScript "ponytail-install" ''
    set -eu
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [antigravity-cli git coreutils bash])}:$PATH"

    # Clean up legacy Gemini CLI extensions if present
    if [ -d "$HOME/.gemini/extensions" ]; then
      echo "ponytail: removing deprecated Gemini CLI extensions..."
      rm -rf "$HOME/.gemini/extensions" "$HOME/.gemini/extension_integrity.json" 2>/dev/null || true
    fi

    if [ ! -d "$HOME/.gemini/config/plugins/ponytail" ]; then
      echo "ponytail: installing Antigravity plugin from upstream repository..."
      agy plugin install https://github.com/DietrichGebert/ponytail || true
    fi

    if [ -d "$HOME/.gemini/config/plugins/ponytail" ]; then
      # Purge foreign provider files and directories from ponytail plugin
      rm -rf "$HOME/.gemini/config/plugins/ponytail"/{.claude*,.codex*,.cursor*,.devin*,.grok*,.kiro*,.opencode*,.pi*,.qoder*,.windsurf*,.openclaw,pi-extension} 2>/dev/null || true
      rm -f "$HOME/.gemini/config/plugins/ponytail/hooks"/{claude*,copilot*,qoder*} 2>/dev/null || true
      rm -f "$HOME/.gemini/config/plugins/ponytail"/{opencode.json,.github/copilot-instructions.md} 2>/dev/null || true
    fi

    if [ -f "$HOME/.gemini/config/plugins/ponytail/.agents/rules/ponytail.md" ]; then
      mkdir -p "$HOME/.gemini/config/rules"
      ln -sf "$HOME/.gemini/config/plugins/ponytail/.agents/rules/ponytail.md" "$HOME/.gemini/config/rules/ponytail.md"
    fi
  '';

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
in {
  imports = [
    ./skills.nix
  ];

  nixpkgs.config.problems.handlers.gemini-cli.removal = "ignore";

  # Exclusively Antigravity & Gemini AI toolkit
  environment.systemPackages = with pkgs; [
    antigravity-cli
    gemini-cli
    agy2Launcher
    antigravity2Launcher
  ];

  programs.antigravity-superpowers =
    {
      enable = true;
      installGlobally = true;
    }
    // (pkgs.lib.optionalAttrs (antigravity-superpowers != null) {
      package = antigravity-superpowers.packages.${pkgs.stdenv.hostPlatform.system}.default;
    });

  # ── Ponytail User Activation Script ────────────────────────────────────
  system.userActivationScripts.ponytail = {
    text = "${ponytailInstaller}";
  };

  # ── Spec Kit CLI Activation Script ─────────────────────────────────────
  system.userActivationScripts.specifyCli = {
    text = "${specifyCliInstaller}";
  };
}
