{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    python3
    nodejs
    uv
    gcc
    clang
    cmake
    gnumake
    pkg-config
    nixd
  ];
}
