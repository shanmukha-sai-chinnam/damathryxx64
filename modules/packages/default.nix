{
  pkgs,
  nix-alien,
  ...
}: {
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
    yt-dlp # Video downloader
    nix-alien.packages.${pkgs.system}.nix-alien
  ];
}
