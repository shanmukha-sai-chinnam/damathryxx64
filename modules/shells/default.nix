{pkgs, ...}: {
  programs = {
    zsh = {
      enable = true;
      enableCompletion = true;
      autosuggestions.enable = true;
      syntaxHighlighting.enable = true;

      ohMyZsh = {
        enable = true;
        plugins = [
          "git"
          "fzf"
          "terraform"
          "history-substring-search"
          "zoxide"
          "jira"
          "systemd"
          "aws"
          "eza"
          "gh"
        ];
        theme = "agnoster";
      };
    };
    starship = {
      enable = true;
    };
    zoxide = {
      enable = true;
    };
    git = {
      enable = true;
      config = {
        user = {
          name = "Shanmukha Sai Chinnam";
          email = "shanmukh02.ch@gmail.com";
        };
      };
    };
    bat = {
      enable = true;
    };
    direnv = {
      enable = true;
      nix-direnv.enable = true;
    };
    nix-index-database.comma.enable = true;
    command-not-found.enable = false;
  };

  programs.zsh.interactiveShellInit = ''
    eval "$(${pkgs.nix-your-shell}/bin/nix-your-shell zsh)"
  '';

  environment = {
    shellAliases = {
      # Fast NixOS rebuilds via nh
      nhb = "nh os build";
      nht = "nh os test";
      nhs = "nh os switch";
      nhc = "nh clean all";
      nhsearch = "nh search";

      # Linters & Formatters
      nfmt = "nix fmt -- .";
      nlint = "statix check . && deadnix .";
      nfix = "statix fix . && nix fmt -- .";
      nval = "/home/damathryxx64/repositories/damathryxx64/.agents/skills/nixos-wsl/scripts/validate.sh";

      # Comma & Tooling Shorthands
      comma = ",";
      antigravity-usage = "antigravity-usage";
      agy-usage = "antigravity-usage quota";

      # Inspection & Docs
      nman = "manix";
      ndiff = "nix-diff";
      ntree = "nix-tree";
      ninspect = "nix-inspect";

      # Herdr Multi-Agent Orchestration
      ha = "herdr agent list";
      hi = "herdr integration status";
      hw = "herdr workspace list";
      hp = "herdr pane list";

      # Antigravity Superpowers
      agsp = "antigravity-superpowers init";
      agspd = "antigravity-superpowers doctor";
      agspc = "antigravity-superpowers check";
      agsps = "antigravity-superpowers sync";
      agspsw = "antigravity-superpowers swarm";
      agspw = "antigravity-superpowers watch";
      agspq = "antigravity-superpowers quota";
      agspm = "antigravity-superpowers mcp";
    };
    localBinInPath = true;
    systemPackages = with pkgs; [
      nix-your-shell
    ];
    pathsToLink = ["/share/zsh"];
    shells = [pkgs.zsh];
  };
  users.defaultUserShell = pkgs.zsh;
}
