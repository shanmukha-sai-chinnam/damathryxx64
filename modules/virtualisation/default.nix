{
  pkgs,
  userName ? "damathryxx64",
  ...
}: {
  virtualisation.docker = {
    enable = true;
    autoPrune = {
      enable = true;
      dates = "weekly";
    };
  };

  users.users.${userName}.extraGroups = ["docker"];

  environment.systemPackages = with pkgs; [
    docker
    docker-compose
    inotify-tools
  ];
}
