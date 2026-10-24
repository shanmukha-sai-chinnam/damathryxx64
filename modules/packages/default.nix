{
  pkgs,
  nix-alien,
  ...
}: {
  imports = [
    ./task-runners.nix
  ];

  environment.systemPackages = with pkgs; [
    gh
    tree
    unzip
    fd # Modern replacement for find
    ripgrep # Modern replacement for grep
    eza
    less
    killall
    jq # JSON processor
    curl
    wget
    inxi # System information
    pciutils
    openssl
    libnotify
    btop # Modern responsive TUI monitor (top/htop replacement)
    duf # Modern colorized disk free utility (df replacement)
    dust # Visual disk usage analyzer (du replacement)
    hyperfine # Command-line benchmarking tool
    tealdeer # Fast Rust client for community tldr pages
    nix-alien.packages.${pkgs.stdenv.hostPlatform.system}.nix-alien
  ];
}
