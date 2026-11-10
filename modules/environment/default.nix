{
  pkgs,
  lib,
  nix-alien ? null,
  values ? (import ../../lib/values.nix),
  ...
}: {
  imports = [
    ./completions.nix
    ./task-runners.nix
  ];

  # ── Interactive Shell Configuration ──────────────────────────────────────
  programs = {
    zsh = {
      enable = true;
      enableCompletion = true;
      enableBashCompletion = true;
      autosuggestions = {
        enable = true;
        strategy = ["history" "completion"];
      };
      syntaxHighlighting.enable = true;
      vteIntegration = true;

      shellAliases = {
        cat = "bat";
        find = "fd";
        grep = "rg";
        top = "btop";
        df = "duf";
        ls = "eza --icons";
        ll = "eza -l --icons --git";
        la = "eza -la --icons --git";
        tree = "eza --tree --icons";

        validate = "dots-validate";
        build = "dots-build";
        switch = "dots-switch";
        upgrade = "dots-upgrade";
        clean = "dots-clean";
        test-vm = "dots-test-vm";
        dots-sync = "dots-workspace-sync";
        dots-status = "git status -sb";

        doctor = "antigravity-superpowers doctor";
        sync-skills = "refresh-skills";
      };

      setOptions = [
        "AUTO_CD"
        "AUTO_PUSHD"
        "PUSHD_IGNORE_DUPS"
        "PUSHD_SILENT"
        "EXTENDED_HISTORY"
        "HIST_EXPIRE_DUPS_FIRST"
        "HIST_IGNORE_DUPS"
        "HIST_IGNORE_ALL_DUPS"
        "HIST_FIND_NO_DUPS"
        "HIST_IGNORE_SPACE"
        "HIST_SAVE_NO_DUPS"
        "SHARE_HISTORY"
        "INTERACTIVE_COMMENTS"
        "MAGIC_EQUAL_SUBST"
      ];

      shellInit = ''
        export ZSH_DISABLE_COMPFIX="true"
      '';

      ohMyZsh = {
        enable = true;
        theme = "";
        preLoaded = ''
          export ZSH_DISABLE_COMPFIX="true"
        '';
        plugins = [
          "git"
          "history-substring-search"
          "zoxide"
          "eza"
          "sudo"
          "colored-man-pages"
        ];
      };

      interactiveShellInit = ''
        fpath=("$HOME/.zsh/completions" $fpath)

        zstyle ':completion:*' menu select
        zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}' 'r:|[._-]=* r:|=*' 'l:|=* r:|=*'
        zstyle ':completion:*' list-colors "''${(s.:.)LS_COLORS}"
        zstyle ':completion:*:descriptions' format '[%d]'
        zstyle ':completion:*:messages' format '%d'
        zstyle ':completion:*:warnings' format 'No matches for: %d'
        zstyle ':completion:*' group-name ""
        zstyle ':completion:*' use-cache on
        zstyle ':completion:*' cache-path "$HOME/.cache/zsh/.zcompcache"

        # History substring search
        bindkey '^[[A' history-substring-search-up
        bindkey '^[OA' history-substring-search-up
        bindkey '^[[B' history-substring-search-down
        bindkey '^[OB' history-substring-search-down
        bindkey '^P' history-substring-search-up
        bindkey '^N' history-substring-search-down
        bindkey -M vicmd 'k' history-substring-search-up
        bindkey -M vicmd 'j' history-substring-search-down

        # Word & line navigation
        bindkey '^[[1;5D' backward-word
        bindkey '^[[1;5C' forward-word
        bindkey '^[^[[D' backward-word
        bindkey '^[^[[C' forward-word
        bindkey '^[[H' beginning-of-line
        bindkey '^[[F' end-of-line
        bindkey '^[[1~' beginning-of-line
        bindkey '^[[4~' end-of-line
        bindkey '^[[3~' delete-char

        bindkey '^ ' autosuggest-accept
        bindkey '^f' autosuggest-accept

        autoload -Uz edit-command-line
        zle -N edit-command-line
        bindkey '^X^E' edit-command-line

        source ${pkgs.zsh-fzf-tab}/share/fzf-tab/fzf-tab.plugin.zsh
        zstyle ':completion:complete:*:options' sort false
        zstyle ':fzf-tab:*' switch-group ',' '.'
        zstyle ':fzf-tab:complete:_zlua:*' query-string input
        zstyle ':fzf-tab:complete:kill:argument-rest' fzf-preview 'ps --pid=$word -o cmd --no-headers -w -w'
        zstyle ':fzf-tab:complete:kill:*' popup-pad 0 3
        zstyle ':fzf-tab:complete:cd:*' fzf-preview 'eza -1 --color=always $realpath'
        zstyle ':fzf-tab:complete:systemctl-*:*' fzf-preview 'SYSTEMD_COLORS=1 systemctl status $word'

        source ${pkgs.zsh-autopair}/share/zsh/zsh-autopair/autopair.zsh

        autoload -Uz _agy _nh _antigravity_superpowers _gh _uv
        compdef _agy agy antigravity-cli agy2 antigravity2
        compdef _nh nh
        compdef _antigravity_superpowers antigravity-superpowers
        compdef _gh gh
        compdef _uv uv

        eval "$(${pkgs.nix-your-shell}/bin/nix-your-shell zsh)"

        export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git'
        export FZF_DEFAULT_OPTS='--height 45% --layout=reverse --border=rounded --inline-info --color=16'
        export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
        export FZF_CTRL_T_OPTS="--preview 'bat --color=always --line-range :300 {}'"
        export FZF_ALT_C_COMMAND='fd --type d --hidden --exclude .git'
        export FZF_ALT_C_OPTS="--preview 'eza --tree --level=2 --icons {}'"

        # WSL clipboard bridge
        cb() {
          if [ -t 0 ]; then
            powershell.exe -NoProfile -Command Get-Clipboard 2>/dev/null | tr -d '\r'
          else
            clip.exe
          fi
        }
      '';
    };

    fzf = {
      fuzzyCompletion = true;
      keybindings = true;
    };

    starship = {
      enable = true;
      settings = {
        add_newline = true;
        scan_timeout = 50;
        directory = {
          truncation_length = 4;
          truncate_to_repo = true;
        };
        nix_shell = {
          format = "via [nix:$state]($style) ";
        };
        git_branch = {
          format = "on [$branch]($style) ";
        };
        git_status = {
          format = "([$all_status$ahead_behind]($style) )";
        };
      };
    };

    zoxide.enable = true;

    git = {
      enable = true;
      config = {
        user = {
          name = values.identity.name;
          email = values.identity.email;
        };
      };
    };

    bat.enable = true;

    direnv = {
      enable = true;
      nix-direnv.enable = true;
    };

    bash.completion.enable = true;

    nix-index-database.comma.enable = true;
    command-not-found.enable = false;
  };

  # ── System CLI & Development Packages ────────────────────────────────────
  environment = {
    localBinInPath = true;

    systemPackages = with pkgs;
      [
        # Core CLI utilities
        gh
        unzip
        fd
        ripgrep
        eza
        less
        killall
        jq
        curl
        inxi
        pciutils
        openssl
        libnotify
        btop
        duf
        hyperfine
        tealdeer

        # Compilers and development language runtimes
        python3
        nodejs
        uv
        gcc
        clang
        cmake
        gnumake
        pkg-config
        nixd

        # Shell enhancers and completions
        nix-your-shell
        zsh-completions
        nix-zsh-completions
        zsh-fzf-tab
        zsh-autopair
      ]
      ++ lib.optional (nix-alien != null)
      nix-alien.packages.${pkgs.stdenv.hostPlatform.system}.nix-alien;

    pathsToLink = [
      "/share/zsh"
      "/share/bash-completion"
    ];
    shells = [pkgs.zsh];
  };

  users.defaultUserShell = pkgs.zsh;
}
