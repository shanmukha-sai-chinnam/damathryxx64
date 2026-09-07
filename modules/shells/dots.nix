{pkgs, ...}: let
  helpNix = pkgs.writeShellScriptBin "help-nix" ''
    echo -e "\033[1;36m❄️  NixOS Developer Tools Quick Reference:\033[0m"
    echo ""
    echo -e "\033[1;33mBuild & Switch (nh):\033[0m"
    echo "  nh os build                    → Fast dry build with NOM progress"
    echo "  nh os test                     → Activate configuration for current session"
    echo "  nh os switch                   → Apply live (user prompted only)"
    echo "  nh clean all                   → Garbage collect older generations"
    echo "  nh search <query>              → Fast package search"
    echo ""
    echo -e "\033[1;33mLint & Quality Gates:\033[0m"
    echo "  nix fmt -- .                   → Format all Nix expressions with Alejandra"
    echo "  statix check . && deadnix .    → Check for anti-patterns & dead declarations"
    echo "  statix fix . && nix fmt -- .   → Auto-remediate lints and reformat"
    echo "  validate.sh                    → Run complete 5-step validation pipeline"
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
    echo -e "\033[1;33mHerdr Multi-Agent Orchestration:\033[0m"
    echo "  herdr agent list               → List active AI agents"
    echo "  herdr integration status       → Check agent hook health"
    echo "  herdr workspace list           → List workspaces"
    echo "  herdr pane list                → List active panes"
    echo ""
    echo -e "\033[1;33mAntigravity Superpowers & AI Agents:\033[0m"
    echo "  antigravity-superpowers init   → Scaffold .agents directory"
    echo "  antigravity-superpowers doctor → Diagnose agent environment"
    echo "  antigravity-superpowers check  → Verify profile integrity"
    echo "  antigravity-superpowers sync   → Synchronize skills and rules"
    echo "  agy -p <prompt>                → Execute non-interactive AGY prompt"
    echo "  agy -i <prompt>                → Interactive AGY prompt session"
    echo "  agy -c                         → Continue most recent AGY conversation"
    echo "  claude / codex / opencode      → Claude Code / Codex / OpenCode CLI"
    echo "  ollama run / ps / list         → Ollama CLI"
    echo ""
    echo -e "\033[1;33mWSL Interop & Productivity:\033[0m"
    echo "  cb                             → WSL bidirectional clipboard bridge (pipe to copy, bare to paste)"
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

      echo -e "\033[1;32m✓ NixOS developer environment activated.\033[0m Type \033[1;36mhelp-nix\033[0m for tool shortcuts."
    '';
  };
}
