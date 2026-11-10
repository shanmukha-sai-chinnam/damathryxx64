{
  config,
  lib,
  pkgs,
  ...
}: let
  cfg = config.programs.antigravity-superpowers;
  monorepoPkgs = import ../../pkgs {inherit pkgs;};
in {
  options.programs.antigravity-superpowers = {
    enable = lib.mkEnableOption "Antigravity Superpowers CLI and workflows";

    package = lib.mkOption {
      type = lib.types.package;
      default = monorepoPkgs.antigravity-superpowers;
      description = "The antigravity-superpowers package to install.";
    };

    installGlobally = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Automatically provision Superpowers skills and rules into ~/.gemini/config";
    };
  };

  config = lib.mkIf cfg.enable {
    environment.systemPackages = [cfg.package];

    systemd.user.services.antigravity-superpowers-sync = lib.mkIf cfg.installGlobally {
      description = "Sync Antigravity Superpowers skills into ~/.gemini/config";
      wantedBy = ["default.target"];
      serviceConfig = {
        Type = "oneshot";
        ExecStart = "${cfg.package}/bin/antigravity-superpowers init --global";
        RemainAfterExit = true;
      };
    };
  };
}
