{pkgs, ...}: {
  environment.systemPackages = [
    pkgs.python3
    pkgs.nodejs
    pkgs.ruby
    pkgs.uv
    pkgs.gcc
    pkgs.clang
    pkgs.cmake
    pkgs.gnumake
    pkgs.pkg-config
    pkgs.nixd
    pkgs.zx
  ];
}
