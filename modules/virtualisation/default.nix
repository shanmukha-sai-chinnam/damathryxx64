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
}
