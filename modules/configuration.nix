{
  hostName ? "nixos",
  userName ? "damathryxx64",
  ...
}: {
  imports = [
    ./ai
    ./development
    ./fonts
    ./mcp
    ./nixos-maintenance
    ./packages
    ./shells
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
}
