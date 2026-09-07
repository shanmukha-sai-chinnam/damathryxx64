{pkgs, ...}: let
  herdrIntegrationSetup = pkgs.writeShellScript "herdr-integration-setup" ''
    set -eu

    mkdir -p "$HOME/.claude" "$HOME/.codex" "$HOME/.copilot" "$HOME/.config/opencode" "$HOME/.gemini/config/hooks"

    for integration in claude codex copilot opencode antigravity-cli; do
      ${pkgs.herdr}/bin/herdr integration install "$integration"
    done
  '';
in {
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

  systemd.user.services.herdr-integrations = {
    description = "Install Herdr integrations for coding agents";
    wantedBy = ["default.target"];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = herdrIntegrationSetup;
      RemainAfterExit = true;
    };
  };
}
