{
  pkgs,
  userName ? "damathryxx64",
  hostName ? "nixos",
  ...
}: let
  # Declarative Windows Host .wslconfig
  # Eliminates loose INI files and optimizes CPU/RAM constraints for 8-core / 32GB host
  wslConfigFile = pkgs.writeText "wslconfig" ''
    # Global WSL 2 Configuration (Generated declaratively via NixOS)
    # Target: Intel Core Ultra 7 258V (8 Cores) / 32GB Host RAM

    [wsl2]
    # Allocate 16GB RAM (~50% of 32GB physical host memory, leaves 16GB for Windows)
    memory=16GB

    # Utilize all 8 cores on Intel Core Ultra 7 258V (eliminates 4-core bottleneck)
    processors=8

    # Swap storage
    swap=4GB

    # Mirrored networking for zero-overhead local port sharing and fast DNS tunneling
    networkingMode=mirrored
    dnsTunneling=true
    localhostforwarding=true

    [experimental]
    # Automatically reclaim cached memory back to Windows host dynamically
    autoMemoryReclaim=gradual

    # Automatically shrink disk image space when files are deleted
    sparseVhd=true

    # Mirror host proxy settings automatically into WSL
    autoProxy=true

    # Resolve split-DNS and VPN hostnames gracefully
    bestEffortDnsParsing=true
  '';
in {
  wsl = {
    enable = true;
    docker-desktop.enable = true;
    interop.includePath = true;
    ssh-agent.enable = true;
    usbip.enable = true;
    extraBin = with pkgs; [
      {src = "${coreutils}/bin/id";}
      {src = "${coreutils}/bin/mkdir";}
      {src = "${coreutils}/bin/uname";}
      {src = "${coreutils}/bin/dirname";}
      {src = "${coreutils}/bin/test";}
      {src = "${coreutils}/bin/sleep";}
    ];
    wslConf = {
      automount.root = "/mnt";
      boot = {
        systemd = true;
        initTimeout = 20000;
      };
      interop = {
        enabled = true;
        appendWindowsPath = true;
      };
      network = {
        generateHosts = true;
        generateResolvConf = true;
        hostname = hostName;
      };
      user.default = userName;
    };
    defaultUser = userName;
    startMenuLaunchers = true;
  };

  # Declaratively synchronize host .wslconfig to the active Windows user profile
  system.userActivationScripts.wslHostConfigSync = {
    text = ''
      for user_profile in /mnt/c/Users/*; do
        if [ -d "$user_profile" ] && [ -d "$user_profile/AppData" ]; then
          if [ -w "$user_profile" ]; then
            cp -f ${wslConfigFile} "$user_profile/.wslconfig"
            chmod 644 "$user_profile/.wslconfig" 2>/dev/null || true
          fi
        fi
      done
    '';
  };

  system.stateVersion = "25.05";
}
