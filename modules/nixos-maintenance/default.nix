{pkgs, ...}: {
  nixpkgs.config.allowUnfree = true;

  nix = {
    settings = {
      experimental-features = ["nix-command" "flakes"];
      auto-optimise-store = true;
      builders-use-substitutes = true;
      max-jobs = "auto";
      cores = 0;
    };
  };

  programs.nh = {
    enable = true;
    flake = "/home/damathryxx64/repositories/damathryxx64";
    clean = {
      enable = true;
      extraArgs = "--keep-since 14d --keep 5";
    };
  };

  environment = {
    sessionVariables = {
      NH_FLAKE = "/home/damathryxx64/repositories/damathryxx64";
      FLAKE = "/home/damathryxx64/repositories/damathryxx64";
    };
    systemPackages = with pkgs; [
      # Formatters & Linters
      alejandra
      statix
      deadnix

      # Build & Monitoring
      nix-output-monitor
      nix-fast-build

      # Navigation, TUI & Inspection
      nix-tree
      nix-du
      nix-diff
      nix-inspect
      nix-melt

      # Package Authoring & Updating
      nurl
      nix-init
      nix-update
      nixpkgs-review

      # Documentation, Discovery & Caching
      manix
      cachix
    ];
  };
}
