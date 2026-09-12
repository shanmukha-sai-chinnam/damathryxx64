{pkgs, ...}: let
  dotsValidate = pkgs.writeShellScriptBin "dots-validate" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"

    echo -e "\033[1;34m==>\033[0m \033[1m[1/4] Checking Nix code formatting (Alejandra)...\033[0m"
    ${pkgs.alejandra}/bin/alejandra -c .

    echo -e "\033[1;34m==>\033[0m \033[1m[2/4] Checking Nix anti-patterns (Statix)...\033[0m"
    ${pkgs.statix}/bin/statix check .

    echo -e "\033[1;34m==>\033[0m \033[1m[3/4] Checking dead code (Deadnix)...\033[0m"
    ${pkgs.deadnix}/bin/deadnix .

    echo -e "\033[1;34m==>\033[0m \033[1m[4/4] Verifying Nix flake evaluations & checks...\033[0m"
    ${pkgs.nix}/bin/nix flake check --impure

    echo -e "\033[1;32m✓ All Nix dots quality gates passed!\033[0m"
  '';

  dotsFmt = pkgs.writeShellScriptBin "dots-fmt" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    TARGET="''${1:-$REPO_DIR}"
    exec ${pkgs.alejandra}/bin/alejandra "$TARGET"
  '';

  dotsLint = pkgs.writeShellScriptBin "dots-lint" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"
    echo -e "\033[1;34m==> Checking Statix...\033[0m"
    ${pkgs.statix}/bin/statix check .
    echo -e "\033[1;34m==> Checking Deadnix...\033[0m"
    ${pkgs.deadnix}/bin/deadnix .
    echo -e "\033[1;32m✓ Lint clean (0 warnings).\033[0m"
  '';

  dotsBuild = pkgs.writeShellScriptBin "dots-build" ''
    set -euo pipefail
    exec ${pkgs.nh}/bin/nh os build "$@"
  '';

  dotsSwitch = pkgs.writeShellScriptBin "dots-switch" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"
    exec ${pkgs.nh}/bin/nh os switch "$@"
  '';

  dotsUpgrade = pkgs.writeShellScriptBin "dots-upgrade" ''
    set -euo pipefail
    REPO_DIR="/home/damathryxx64/repositories/damathryxx64"
    cd "$REPO_DIR"
    echo -e "\033[1;34m==>\033[0m \033[1m[1/2] Checking quality gates...\033[0m"
    ${dotsValidate}/bin/dots-validate
    echo -e "\033[1;34m==>\033[0m \033[1m[2/2] Updating flake inputs and switching system...\033[0m"
    exec ${pkgs.nh}/bin/nh os switch --update "$@"
  '';

  dotsClean = pkgs.writeShellScriptBin "dots-clean" ''
    set -euo pipefail
    exec ${pkgs.nh}/bin/nh clean all "$@"
  '';
in {
  environment.systemPackages = [
    dotsValidate
    dotsFmt
    dotsLint
    dotsBuild
    dotsSwitch
    dotsUpgrade
    dotsClean
  ];
}
