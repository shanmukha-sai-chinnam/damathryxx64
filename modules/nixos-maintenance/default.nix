{pkgs, ...}: {
  imports = [
    ./workspace-sync.nix
  ];

  nixpkgs.config.allowUnfree = true;

  nix = {
    settings = {
      experimental-features = ["nix-command" "flakes"];
      auto-optimise-store = true;
      builders-use-substitutes = true;
      max-jobs = "auto";
      cores = 0;
      connect-timeout = 5;
      fallback = true;

      substituters = [
        "https://cache.nixos.org"
        "https://nix-community.cachix.org"
        "https://nix-alien.cachix.org"
        "https://numtide.cachix.org"
      ];
      trusted-public-keys = [
        "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
        "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
        "nix-alien.cachix.org-1:LMYLmRPrnZEHTSWO7KwRy+ZF0qfn05AC/uJZW2noLE0="
        "numtide.cachix.org-1:2ps1kLBUWjxIneOy1Ik6cQjb41X0iXVXeHigGmycPPE="
      ];
      extra-substituters = [
        "https://cache.garnix.io"
      ];
      extra-trusted-public-keys = [
        "cache.garnix.io:CTFbtTaGLecdtAuY_nHHhBKq5gTjYLQ1PdeNYcxpktU="
      ];
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
      nvd
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
