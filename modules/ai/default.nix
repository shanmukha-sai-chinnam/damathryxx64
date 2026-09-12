{
  pkgs,
  antigravity-superpowers ? null,
  ...
}: let
  # ── Herdr Integration Setup ────────────────────────────────────────────
  # Installs Herdr agent-state hooks for Antigravity coding agents.
  herdrIntegrationSetup = pkgs.writeShellScript "herdr-integration-setup" ''
    set -eu
    mkdir -p "$HOME/.gemini/config/hooks"
    ${pkgs.herdr}/bin/herdr integration install antigravity-cli || true
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
in {
  imports = [
    ./skills.nix
  ];

  nixpkgs.config.problems.handlers.gemini-cli.removal = "ignore";

  # Exclusively Antigravity & Gemini AI toolkit
  environment.systemPackages = with pkgs; [
    antigravity-cli
    gemini-cli
    herdr
    ollama
  ];

  # ── Herdr Integrations ─────────────────────────────────────────────────
  systemd.user.services.herdr-integrations = {
    description = "Install Herdr integrations for coding agents";
    wantedBy = ["default.target"];
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
  system.userActivationScripts.ponytail = {
    text = "${ponytailInstaller}";
  };

  # ── Spec Kit CLI Activation Script ─────────────────────────────────────
  system.userActivationScripts.specifyCli = {
    text = "${specifyCliInstaller}";
  };
}
