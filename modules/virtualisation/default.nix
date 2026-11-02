{
  pkgs,
  userName ? "damathryxx64",
  ...
}: {
  # Docker Desktop integration is active (via wsl.docker-desktop.enable in modules/wsl).
  # Native dockerd is disabled to eliminate duplicate engines and save RAM.
  virtualisation.docker.enable = false;

  users.users.${userName}.extraGroups = ["docker"];

  environment.systemPackages = with pkgs; [
    docker
    docker-compose
    inotify-tools
  ];

  # ── Docker Desktop Proxy Socket Permissions ──────────────────────────────
  # Docker Desktop mounts a tmpfs at /mnt/wsl/docker-desktop/shared-sockets/guest-services
  # and creates docker.proxy.sock with 0755 owned by root:root.
  # This path watcher automatically ensures the socket has mode 0666 so non-root
  # users in the docker group can execute docker CLI commands without sudo.
  systemd.paths.docker-desktop-proxy-socket = {
    description = "Watch Docker Desktop proxy socket creation";
    wantedBy = ["multi-user.target"];
    pathConfig = {
      PathModified = "/mnt/wsl/docker-desktop/shared-sockets/guest-services/docker.proxy.sock";
      MakeDirectory = false;
    };
  };

  systemd.services.docker-desktop-proxy-socket = {
    description = "Ensure Docker Desktop proxy socket is accessible to docker group";
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "${pkgs.bash}/bin/bash -c '[ -S /mnt/wsl/docker-desktop/shared-sockets/guest-services/docker.proxy.sock ] && ${pkgs.coreutils}/bin/chmod 666 /mnt/wsl/docker-desktop/shared-sockets/guest-services/docker.proxy.sock || true'";
    };
  };

  system.activationScripts.dockerDesktopProxySocket = {
    text = ''
      if [ -S /mnt/wsl/docker-desktop/shared-sockets/guest-services/docker.proxy.sock ]; then
        ${pkgs.coreutils}/bin/chmod 666 /mnt/wsl/docker-desktop/shared-sockets/guest-services/docker.proxy.sock || true
      fi
    '';
  };
}
