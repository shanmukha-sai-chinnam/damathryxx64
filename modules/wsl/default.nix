{
  userName ? "damathryxx64",
  hostName ? "nixos",
  ...
}: {
  wsl = {
    enable = true;
    interop.includePath = true;
    ssh-agent.enable = true;
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

  system.stateVersion = "25.05";
}
