{
  values ? (import ../lib/values.nix),
  hostName ? values.system.hostname,
  userName ? values.identity.username,
  ...
}: {
  imports = [
    ./system
    ./environment
    ./ai
    ./security
  ];

  # Enable needed services for VS Code Remote Development
  services.openssh.enable = true;
  networking.hostName = hostName;
  networking = {
    firewall.enable = true;
  };

  users.users.${userName} = {
    isNormalUser = true;
    description = userName;
    extraGroups = ["wheel" "input"];
  };

  security.sudo = {
    enable = true;
    wheelNeedsPassword = false;
    extraConfig = ''
      ${userName} ALL=(ALL) NOPASSWD: /usr/bin/nix, /usr/bin/nix-*
    '';
  };

  programs = {
    nix-ld.enable = true;
    mtr.enable = true;
    gnupg.agent = {
      enable = true;
      enableSSHSupport = true;
    };
  };

  # Real-time ClamAV antivirus sentinel for repositories
  services.clamav-sentinel = {
    enable = true;
    watchDir = values.paths.workspace_root;
    quarantineDir = "${values.paths.workspace_root}/${values.security.clamav.quarantine_dir}";
    auditLog = "${values.paths.workspace_root}/${values.security.clamav.audit_log}";
    autoQuarantine = values.security.clamav.auto_quarantine;
  };
}
