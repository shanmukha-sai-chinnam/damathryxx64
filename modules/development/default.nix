{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    python3
    nodejs
    ruby
    uv
    gcc
    clang
    cmake
    gnumake
    pkg-config
    nixd
  ];
}
