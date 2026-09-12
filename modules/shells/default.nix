{pkgs, ...}: let
  customZshCompletions = pkgs.runCommand "custom-zsh-completions" {} ''
    mkdir -p $out/share/zsh/site-functions
    cp ${./completions}/* $out/share/zsh/site-functions/
  '';
in {
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
          "terraform"
          "history-substring-search"
          "zoxide"
          "jira"
          "systemd"
          "aws"
          "eza"
          "gh"
          "sudo"
          "colored-man-pages"
          "extract"
          "docker"
          "kubectl"
        ];
      };

      interactiveShellInit = ''
        # ── Setup Dynamic & Custom Completions fpath ───────────────────────────
        fpath=(
          "$HOME/.zsh/completions"
          $fpath
        )

        # ── Fast & Fuzzy Zsh Completion Styling ────────────────────────────────
        zstyle ':completion:*' menu select
        zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}' 'r:|[._-]=* r:|=*' 'l:|=* r:|=*'
        zstyle ':completion:*' list-colors "''${(s.:.)LS_COLORS}"
        zstyle ':completion:*:descriptions' format '[%d]'
        zstyle ':completion:*:messages' format '%d'
        zstyle ':completion:*:warnings' format 'No matches for: %d'
        zstyle ':completion:*' group-name ""
        zstyle ':completion:*' use-cache on
        zstyle ':completion:*' cache-path "$HOME/.cache/zsh/.zcompcache"

        # ── Power-User Keybindings ─────────────────────────────────────────────
        # History substring search (compatible across Windows Terminal, VS Code, tmux & vi)
        bindkey '^[[A' history-substring-search-up
        bindkey '^[OA' history-substring-search-up
        bindkey '^[[B' history-substring-search-down
        bindkey '^[OB' history-substring-search-down
        bindkey '^P' history-substring-search-up
        bindkey '^N' history-substring-search-down
        bindkey -M vicmd 'k' history-substring-search-up
        bindkey -M vicmd 'j' history-substring-search-down

        # Word navigation (Ctrl+Left, Ctrl+Right)
        bindkey '^[[1;5D' backward-word
        bindkey '^[[1;5C' forward-word
        bindkey '^[^[[D' backward-word
        bindkey '^[^[[C' forward-word

        # Line navigation & deletion
        bindkey '^[[H' beginning-of-line
        bindkey '^[[F' end-of-line
        bindkey '^[[1~' beginning-of-line
        bindkey '^[[4~' end-of-line
        bindkey '^[[3~' delete-char

        # Autosuggestions acceptance (Ctrl-Space, Ctrl-F)
        bindkey '^ ' autosuggest-accept
        bindkey '^f' autosuggest-accept

        # Edit current command line in $EDITOR
        autoload -Uz edit-command-line
        zle -N edit-command-line
        bindkey '^X^E' edit-command-line

        # ── Power-User Zsh Plugins ─────────────────────────────────────────────
        # 1. fzf-tab: Interactive fuzzy tab completion with rich preview
        source ${pkgs.zsh-fzf-tab}/share/fzf-tab/fzf-tab.plugin.zsh

        # Disable sort when completing options to preserve original order
        zstyle ':completion:complete:*:options' sort false

        # Switch fzf-tab groups using ',' and '.'
        zstyle ':fzf-tab:*' switch-group ',' '.'

        # Styled fzf-tab previews for files, processes, and systemd units
        zstyle ':fzf-tab:complete:_zlua:*' query-string input
        zstyle ':fzf-tab:complete:kill:argument-rest' fzf-preview 'ps --pid=$word -o cmd --no-headers -w -w'
        zstyle ':fzf-tab:complete:kill:*' popup-pad 0 3
        zstyle ':fzf-tab:complete:cd:*' fzf-preview 'eza -1 --color=always $realpath'
        zstyle ':fzf-tab:complete:systemctl-*:*' fzf-preview 'SYSTEMD_COLORS=1 systemctl status $word'

        # 2. autopair: Auto-pair brackets and quotes
        source ${pkgs.zsh-autopair}/share/zsh/zsh-autopair/autopair.zsh

        # ── Autoload & Wire Custom Completions ─────────────────────────────────
        autoload -Uz _agy _nh _antigravity_superpowers
        compdef _agy agy antigravity-cli
        compdef _nh nh
        compdef _antigravity_superpowers antigravity-superpowers

        # ── Dynamic Tool Completions ───────────────────────────────────────────
        eval "$(${pkgs.nix-your-shell}/bin/nix-your-shell zsh)"
        which gh >/dev/null 2>&1 && eval "$(gh completion -s zsh 2>/dev/null)"
        which uv >/dev/null 2>&1 && eval "$(uv generate-shell-completion zsh 2>/dev/null)"

        # ── FZF Environment & Dracula/Nord Ergonomics ──────────────────────────
        export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git'
        export FZF_DEFAULT_OPTS='--height 45% --layout=reverse --border=rounded --inline-info --color=16'
        export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
        export FZF_CTRL_T_OPTS="--preview 'bat --color=always --line-range :300 {}'"
        export FZF_ALT_C_COMMAND='fd --type d --hidden --exclude .git'
        export FZF_ALT_C_OPTS="--preview 'eza --tree --level=2 --icons {}'"

        # ── WSL Productivity Utilities ─────────────────────────────────────────
        # WSL bidirectional clipboard bridge (pipe in to copy, run bare to paste)
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
          format = "via [❄️ $state]($style) ";
        };
        git_branch = {
          format = "on [$branch]($style) ";
        };
        git_status = {
          format = "([$all_status$ahead_behind]($style) )";
        };
      };
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

  environment = {
    localBinInPath = true;

    systemPackages = with pkgs; [
      nix-your-shell
      zsh-completions
      nix-zsh-completions
      customZshCompletions
      zsh-fzf-tab
      zsh-autopair
    ];

    pathsToLink = ["/share/zsh"];
    shells = [pkgs.zsh];
  };

  users.defaultUserShell = pkgs.zsh;
}
