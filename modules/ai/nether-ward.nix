{
  config,
  lib,
  pkgs,
  nether-ward ? null,
  ...
}:
with lib; let
  system = pkgs.stdenv.hostPlatform.system;
  netherWardPkg =
    if nether-ward != null && nether-ward ? packages.${system}.default
    then nether-ward.packages.${system}.default
    else null;
  cfg = config.services.nether-ward;
in {
  options.services.nether-ward = {
    enable = mkEnableOption "Nether Ward AI security sentinel and gateway";

    port = mkOption {
      type = types.port;
      default = 4000;
      description = "TCP port on which the Nether Ward gateway listens";
    };

    sanitize = mkOption {
      type = types.bool;
      default = true;
      description = "Enable in-flight secret sanitization and redaction";
    };

    semanticFirewall = mkOption {
      type = types.bool;
      default = true;
      description = "Enable bicameral Jev System One semantic safety inspection";
    };

    upstreamUrl = mkOption {
      type = types.nullOr types.str;
      default = null;
      description = "Upstream OpenAI-compatible inference endpoint";
    };

    upstreamModel = mkOption {
      type = types.str;
      default = "gemini-flash-lite-latest";
      description = "Default upstream model identifier";
    };

    package = mkOption {
      type = types.nullOr types.package;
      default = netherWardPkg;
      description = "Nether Ward package derivation";
    };
  };

  config = mkIf (cfg.enable && cfg.package != null) {
    environment.systemPackages = [cfg.package];

    systemd.user.services.nether-ward-gateway = {
      description = "Nether Ward AI Security Gateway Daemon";
      after = ["network.target"];
      wantedBy = ["default.target"];
      serviceConfig = {
        ExecStart =
          "${cfg.package}/bin/nether-ward gateway"
          + " --port ${toString cfg.port}"
          + " --model ${cfg.upstreamModel}"
          + (optionalString (cfg.upstreamUrl != null) " --upstream ${cfg.upstreamUrl}")
          + (optionalString cfg.sanitize " --sanitize")
          + (optionalString cfg.semanticFirewall " --semantic-firewall");
        Restart = "on-failure";
        RestartSec = "5s";
      };
    };
  };
}
