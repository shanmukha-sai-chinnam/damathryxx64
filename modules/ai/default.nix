{
  pkgs,
  antigravity-superpowers ? null,
  ...
}: let
  # ── Hermes Agent Installer ─────────────────────────────────────────────
  # Uses the upstream curl installer (https://hermes-agent.nousresearch.com)
  # which is the recommended path for WSL2/Linux. The Nix flake build
  # (github:NousResearch/hermes-agent) requires 1240+ derivations with no
  # binary cache — the installer is instant and auto-updates.
  #
  # Installs to ~/.hermes/bin/hermes; idempotent (skips if already present).
  hermesInstaller = pkgs.writeShellScript "hermes-agent-install" ''
    set -eu
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [curl git coreutils bash gnused gawk findutils])}:$PATH"

    HERMES_HOME="''${HERMES_HOME:-$HOME/.hermes}"
    HERMES_BIN="$HERMES_HOME/hermes-agent/hermes"

    if [ -x "$HERMES_BIN" ]; then
      echo "hermes-agent: already installed at $HERMES_BIN"
      exit 0
    fi

    echo "hermes-agent: installing via upstream installer..."
    mkdir -p "$HERMES_HOME"
    curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --skip-setup
    echo "hermes-agent: installation complete"
  '';

  # ── Herdr Integration Setup ────────────────────────────────────────────
  # Installs Herdr agent-state hooks for all managed coding agents,
  # including hermes. Creates required config directories first.
  herdrIntegrationSetup = pkgs.writeShellScript "herdr-integration-setup" ''
    set -eu

    mkdir -p "$HOME/.claude" "$HOME/.codex" "$HOME/.copilot" \
             "$HOME/.config/opencode" "$HOME/.gemini/config/hooks" \
             "$HOME/.hermes/plugins"

    for integration in claude codex copilot opencode antigravity-cli hermes; do
      ${pkgs.herdr}/bin/herdr integration install "$integration" || true
    done
  '';

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

    if [ -f "$HOME/.gemini/config/plugins/ponytail/.agents/rules/ponytail.md" ]; then
      mkdir -p "$HOME/.gemini/config/rules"
      ln -sf "$HOME/.gemini/config/plugins/ponytail/.agents/rules/ponytail.md" "$HOME/.gemini/config/rules/ponytail.md"
    fi
  '';
in {
  imports = [
    ./skills.nix
  ];

  nixpkgs.config.problems.handlers.gemini-cli.removal = "ignore";

  environment.systemPackages = with pkgs; [
    antigravity-cli
    gemini-cli
    herdr
    opencode
    claude-code
    codex
    github-copilot-cli
    ollama
  ];

  # ── Hermes Agent (managed installer) ───────────────────────────────────
  # Runs once on login; idempotent — skips if ~/.hermes/bin/hermes exists.
  # Depends on herdr-integrations to wire up the hermes hook after install.
  systemd.user.services.hermes-agent-install = {
    description = "Install Hermes Agent (Nous Research) via upstream installer";
    wantedBy = ["default.target"];
    before = ["herdr-integrations.service"];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = hermesInstaller;
      RemainAfterExit = true;
      Environment = [
        "HOME=%h"
        "PATH=${pkgs.lib.makeBinPath (with pkgs; [curl git coreutils bash gnused gawk findutils])}:/run/current-system/sw/bin"
      ];
    };
  };

  # ── Herdr Integrations ─────────────────────────────────────────────────
  systemd.user.services.herdr-integrations = {
    description = "Install Herdr integrations for coding agents";
    wantedBy = ["default.target"];
    after = ["hermes-agent-install.service"];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = herdrIntegrationSetup;
      RemainAfterExit = true;
    };
  };

  programs.antigravity-superpowers =
    {
      enable = true;
      installGlobally = true;
    }
    // (pkgs.lib.optionalAttrs (antigravity-superpowers != null) {
      package = antigravity-superpowers.packages.${pkgs.stdenv.hostPlatform.system}.default;
    });

  # ── Ponytail User Activation Script ────────────────────────────────────
  # Runs on system activation/login to ensure the ponytail plugin is installed
  # and its ruleset is linked into ~/.gemini/config/rules.
  system.userActivationScripts.ponytail = {
    text = "${ponytailInstaller}";
  };
}
