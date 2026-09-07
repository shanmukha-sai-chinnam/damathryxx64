{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    # General CLI tools
    vim
    gh
    tree
    unzip
    fd # Modern replacement for find
    ripgrep # Modern replacement for grep
    fzf
    eza
    less
    htop
    fastfetch # System information display
    killall
    jq # JSON processor
    curl
    wget
    inxi # System information
    duf # Disk usage analyzer
    pciutils
    gnumake
    openssl
    libnotify
    yt-dlp # Video downloader
  ];
}
