{pkgs, ...}: let
  helpNix = pkgs.writeShellScriptBin "help-nix" ''
    echo -e "\033[1;36m❄️  NixOS Developer Tools Quick Reference:\033[0m"
    echo ""
    echo -e "\033[1;33mHandy Task Commands:\033[0m"
    echo "  dots-validate                  → Run full 4-stage validation (Alejandra, Statix, Deadnix, Flake)"
    echo "  dots-fmt                       → Format Nix expressions with Alejandra"
    echo "  dots-lint                      → Run Statix & Deadnix anti-pattern checks"
    echo "  dots-build                     → Fast build with progress (nh os build)"
    echo "  dots-clean                     → Clean old generations (nh clean all)"
    echo ""
    echo -e "\033[1;33mBuild & Switch:\033[0m"
    echo "  nh os build                    → Dry build system configuration"
    echo "  nh os test                     → Activate configuration for current session"
    echo "  nh os switch                   → Apply live (user prompted only)"
    echo "  nh search <query>              → Fast package search"
    echo ""
    echo -e "\033[1;33mPackage Authoring & Discovery:\033[0m"
    echo "  nurl <url>                     → Generate fetcher expression with precomputed hash"
    echo "  nix-init <url>                 → Scaffold new Nix derivation from repository"
    echo "  nix-update <pkg>               → Automatically update package version and hashes"
    echo "  manix <query>                  → Search NixOS options & nixpkgs functions"
    echo "  , <binary>                     → Ephemeral execution of uninstalled packages"
    echo ""
    echo -e "\033[1;33mInspection & Diffing:\033[0m"
    echo "  nix-diff <d1> <d2>             → Explain differences between two derivations"
    echo "  nix-tree                       → Interactive TUI for exploring store closure trees"
    echo "  nix-inspect                    → Interactive TUI data explorer"
    echo ""
    echo -e "\033[1;33mAntigravity Superpowers & AI Agents:\033[0m"
    echo "  antigravity-superpowers init   → Scaffold .agents directory"
    echo "  antigravity-superpowers doctor → Diagnose agent environment"
    echo "  antigravity-superpowers check  → Verify profile integrity"
    echo "  antigravity-superpowers sync   → Synchronize skills and rules"
    echo "  dots-sync-skills status        → Check fork sync & flake lock status"
    echo "  dots-sync-skills all           → Full sync: fetch, merge, audit, push & bump flake"
    echo "  refresh-skills                 → Sync, rewrite, and audit skills"
    echo "  agy -p <prompt>                → Execute non-interactive AGY prompt"
    echo "  agy -i <prompt>                → Interactive AGY prompt session"
    echo "  agy -c                         → Continue most recent AGY conversation"
    echo "  agy / gemini-cli               → Antigravity CLI & Gemini AI Toolkit"
    echo ""
    echo -e "\033[1;33mWSL Interop & Productivity:\033[0m"
    echo "  cb                             → WSL bidirectional clipboard bridge (pipe to copy, bare to paste)"
    echo ""
  '';

  dotsSyncSkills = pkgs.writeShellScriptBin "dots-sync-skills" ''
    exec ${pkgs.python3}/bin/python3 /home/damathryxx64/repositories/damathryxx64/scripts/sync-forks.py "$@"
  '';

  refreshSkills = pkgs.writeShellScriptBin "refresh-skills" ''
    exec ${pkgs.python3}/bin/python3 /home/damathryxx64/repositories/damathryxx64/scripts/sync-forks.py refresh "$@"
  '';
in {
  devShell = pkgs.mkShell {
    name = "damathryxx64-dots-devshell";

    packages = with pkgs; [
      helpNix
      dotsSyncSkills
      refreshSkills

      # Formatters & Linters
      alejandra
      statix
      deadnix

      # High-performance build & maintenance
      nh
      nix-output-monitor
      nix-fast-build

      # Packaging, authoring & discovery
      nurl
      nix-init
      nix-update
      nixpkgs-review
      manix

      # Derivation & store inspection
      nix-diff
      nix-inspect
      nix-tree
      nix-du
      nix-melt

      # Language server & cache
      cachix
    ];

    shellHook = ''
      export NH_FLAKE="$PWD"
      export FLAKE="$PWD"

      # Ensure repository git hooks are respected
      git config core.hooksPath .githooks 2>/dev/null || true

      echo -e "\033[1;32m✓ NixOS developer environment activated.\033[0m Type \033[1;36mhelp-nix\033[0m for tool shortcuts."
    '';
  };
}
