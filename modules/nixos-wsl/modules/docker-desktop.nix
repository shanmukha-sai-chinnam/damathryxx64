{
  config,
  lib,
  pkgs,
  ...
}:
with builtins;
with lib; {
  imports = [
    (mkRenamedOptionModule ["wsl" "docker"] ["wsl" "docker-desktop"])
  ];

  options.wsl.docker-desktop = with types; {
    enable = mkEnableOption "Docker Desktop integration";
  };

  config = let
    cfg = config.wsl.docker-desktop;
  in
    mkIf (config.wsl.enable && cfg.enable) {
      environment.systemPackages = with pkgs; [
        # Compose links to Docker Desktop by opening 'docker-desktop://' URLs
        # through xdg-open.
        xdg-utils
      ];

      wsl.extraBin = with pkgs; [
        # Required unconditionally to check that the WSL environment is conformant.
        {src = "${coreutils}/bin/cat";}
        {src = "${coreutils}/bin/whoami";}
        # Required to create the 'docker' group and add the WSL user to it.
        # This group and its user membership are managed by NixOS below but we
        # create those symlinks anyway for robustness.
        {src = "${shadow}/bin/groupadd";}
        {src = "${shadow}/bin/usermod";}
        # Docker Desktop v4.80.0+
        {src = "${coreutils}/bin/install";}
        {src = "${coreutils}/bin/mv";}
        {src = "${coreutils}/bin/test";}
        {src = "${coreutils}/bin/sleep";}
        # Docker Desktop v4.90.0+ (requires stat for empty-binary check, core file utilities)
        {src = "${coreutils}/bin/stat";}
        {src = "${coreutils}/bin/mkdir";}
        {src = "${coreutils}/bin/touch";}
        {src = "${coreutils}/bin/rm";}
        {src = "${coreutils}/bin/ln";}
        {src = "${coreutils}/bin/cp";}
        {src = "${coreutils}/bin/chmod";}
      ];

      users.groups.docker.members = [
        config.wsl.defaultUser
      ];
    };
}
