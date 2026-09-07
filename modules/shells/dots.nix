{pkgs, ...}: let
  helpNix = pkgs.writeShellScriptBin "help-nix" ''
    echo -e "\033[1;36m❄️  NixOS Developer Tools Quick Reference:\033[0m"
    echo ""
    echo -e "\033[1;33mBuild & Switch (nh):\033[0m"
    echo "  nhb              → nh os build (Fast dry build with NOM progress)"
    echo "  nht              → nh os test  (Activate for current session)"
    echo "  nhs              → nh os switch (Apply live - user prompted only)"
    echo "  nhc              → nh clean all (Garbage collect older generations)"
    echo "  nhsearch <query> → Fast package search"
    echo ""
    echo -e "\033[1;33mLint & Quality Gates:\033[0m"
    echo "  nfmt             → nix fmt -- . (Format using Alejandra)"
    echo "  nlint            → statix check . && deadnix . (Check anti-patterns & dead code)"
    echo "  nfix             → statix fix . && nix fmt -- . (Auto-remediate lints)"
    echo "  nval             → Run complete 5-step validation pipeline"
    echo ""
    echo -e "\033[1;33mPackage Authoring & Discovery:\033[0m"
    echo "  nurl <url>       → Generate fetcher expression with precomputed hash"
    echo "  nix-init <url>   → Scaffold new Nix derivation from repository"
    echo "  nix-update <pkg> → Automatically update package version and hashes"
    echo "  nman <query>     → Instant search for NixOS options & nixpkgs functions"
    echo "  , <binary>       → Ephemeral execution of uninstalled packages"
    echo ""
    echo -e "\033[1;33mInspection & Diffing:\033[0m"
    echo "  ndiff <d1> <d2>  → Explain differences between two derivations"
    echo "  ntree            → Interactive TUI for exploring store closure trees"
    echo "  ninspect         → Interactive TUI data explorer"
    echo ""
    echo -e "\033[1;33mHerdr Multi-Agent Orchestration:\033[0m"
    echo "  ha               → herdr agent list (List active AI agents)"
    echo "  hi               → herdr integration status (Check agent hook health)"
    echo "  hw               → herdr workspace list"
    echo "  hp               → herdr pane list"
    echo ""
    echo -e "\033[1;33mAntigravity Superpowers:\033[0m"
    echo "  agsp             → antigravity-superpowers init (Scaffold .agents)"
    echo "  agspd            → antigravity-superpowers doctor (Diagnose environment)"
    echo "  agspc            → antigravity-superpowers check (Verify profile integrity)"
    echo "  agsps            → antigravity-superpowers sync (Synchronize skills and rules)"
    echo ""
  '';
in {
  devShell = pkgs.mkShell {
    name = "damathryxx64-dots-devshell";

    packages = with pkgs; [
      helpNix

      # AI Agent Orchestration
      herdr

      # Formatters & Linters
      alejandra
      nixfmt
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
      nil
      cachix
    ];

    shellHook = ''
      export NH_FLAKE="$PWD"
      export FLAKE="$PWD"

      # Ensure repository git hooks are respected
      git config core.hooksPath .githooks 2>/dev/null || true

      alias ha="herdr agent list"
      alias hi="herdr integration status"
      alias hw="herdr workspace list"
      alias hp="herdr pane list"

      echo -e "\033[1;32m✓ NixOS developer environment activated.\033[0m Type \033[1;36mhelp-nix\033[0m for tool shortcuts."
    '';
  };
}
