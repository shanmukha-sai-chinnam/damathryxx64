{
  config,
  lib,
  pkgs,
  values ? (import ../../lib/values.nix),
  ...
}:
with lib; let
  cfg = config.services.clamav-sentinel;
  monorepoPkgs = import ../../pkgs {inherit pkgs;};
  pkg = monorepoPkgs.clamav-sentinel;
in {
  options.services.clamav-sentinel = {
    enable = mkEnableOption "ClamAV real-time file creation sentinel";

    watchDir = mkOption {
      type = types.str;
      default = values.paths.workspace_root;
      description = "Directory to watch for newly created files";
    };

    quarantineDir = mkOption {
      type = types.str;
      default = "${values.paths.workspace_root}/${values.security.clamav.quarantine_dir}";
      description = "Directory to store quarantined threats";
    };

    auditLog = mkOption {
      type = types.str;
      default = "${values.paths.workspace_root}/${values.security.clamav.audit_log}";
      description = "Path to JSONL audit log file";
    };

    autoQuarantine = mkOption {
      type = types.bool;
      default = values.security.clamav.auto_quarantine;
      description = "Automatically move infected files to quarantine and strip permissions";
    };
  };

  config = mkIf cfg.enable {
    environment.systemPackages = [pkg];

    systemd.user.services.clamav-sentinel = {
      description = "ClamAV Real-time File Creation Sentinel";
      after = ["default.target"];
      wantedBy = ["default.target"];
      serviceConfig = {
        ExecStart =
          "${pkg}/bin/clamav-sentinel watch ${cfg.watchDir} --quarantine-dir ${cfg.quarantineDir} --audit-log ${cfg.auditLog}"
          + (optionalString (!cfg.autoQuarantine) " --no-quarantine");
        Restart = "always";
        RestartSec = 5;
        Environment = [
          "PYTHONUNBUFFERED=1"
        ];
      };
    };
  };
}
