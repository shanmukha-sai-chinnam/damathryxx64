{
  pkgs,
  userName ? "damathryxx64",
  hostName ? "nixos",
  ...
}: {
  wsl = {
    enable = true;
    docker-desktop.enable = true;
    interop.includePath = true;
    ssh-agent.enable = true;
    extraBin = with pkgs; [
      {src = "${coreutils}/bin/id";}
      {src = "${coreutils}/bin/mkdir";}
      {src = "${coreutils}/bin/uname";}
      {src = "${coreutils}/bin/dirname";}
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
            cp -f ${./.wslconfig} "$user_profile/.wslconfig"
            chmod 644 "$user_profile/.wslconfig" 2>/dev/null || true
          fi
        fi
      done
    '';
  };

  system.stateVersion = "25.05";
}
