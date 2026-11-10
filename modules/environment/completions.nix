{pkgs, ...}: let
  # Pure Nix declarations for custom shell completions
  agyCompletion = pkgs.writeTextDir "share/zsh/site-functions/_agy" ''
    #compdef agy antigravity-cli gemini

    _agy() {
      local curcontext="$curcontext" state line
      typeset -A opt_args

      local -a commands
      commands=(
        'agent:List available agents'
        'agents:List available agents'
        'changelog:Show changelog and release notes'
        'help:Show help for subcommands'
        'install:Configure environment paths and shell settings'
        'mcp:Manage MCP servers (add, remove, list, enable, disable)'
        'models:List available models'
        'plugin:Manage plugins (install, uninstall, list, enable, disable)'
        'plugins:Manage plugins'
        'update:Update CLI'
      )

      _arguments -C \
        '--add-dir[Add directory to workspace]:directory:_directories' \
        '--agent[Agent for current CLI session]:agent:' \
        '-c[Continue most recent conversation]' \
        '--continue[Continue most recent conversation]' \
        '--conversation[Resume previous conversation by ID]:conversation ID:' \
        '--dangerously-skip-permissions[Auto-approve all tool permission requests without prompting]' \
        '--disable-slash-commands[Disable slash command and skill expansion]' \
        '--effort[Reasoning effort]:effort:(low medium high)' \
        '-i[Run initial prompt interactively and continue]:prompt:' \
        '--prompt-interactive[Run initial prompt interactively and continue]:prompt:' \
        '--input-format[Input format for print mode]:format:(text stream-json)' \
        '--json-schema[Optional JSON schema string or path]:file:_files' \
        '--log-file[Override CLI log file path]:file:_files' \
        '--mode[Set agent execution mode]:mode:(accept-edits plan)' \
        '--model[Model for current CLI session]:model:' \
        '--new-project[Create a new project for this session]' \
        '--output-format[Output format for print mode]:format:(text json stream-json)' \
        '-p[Run single prompt non-interactively]:prompt:' \
        '--print[Run single prompt non-interactively]:prompt:' \
        '--prompt[Alias for --print]:prompt:' \
        '--print-timeout[Timeout for print mode wait]:timeout:' \
        '--project[Project ID or project name]:project:' \
        '--sandbox[Run in a sandbox with terminal restrictions enabled]' \
        '-h[Show help]' \
        '--help[Show help]' \
        '1:command:->command' \
        '*::args:->args'

      case "$state" in
        command)
          _describe -t commands 'agy command' commands
          ;;
        args)
          case "$words[1]" in
            plugin|plugins)
              local -a plugin_commands
              plugin_commands=(
                'list:List imported plugins'
                'import:Import plugins from gemini'
                'install:Install a plugin'
                'uninstall:Uninstall a plugin'
                'enable:Enable a plugin'
                'disable:Disable a plugin'
                'validate:Validate a plugin'
                'link:Generate link to a marketplace'
                'help:Show help'
              )
              _arguments -C '1:subcmd:->subcmd' '*::subargs:->subargs'
              case "$state" in
                subcmd)
                  _describe -t plugin_commands 'plugin command' plugin_commands
                  ;;
                subargs)
                  case "$words[1]" in
                    install)
                      _arguments '*:target: '
                      ;;
                    uninstall|enable|disable)
                      _arguments '*:plugin: '
                      ;;
                    import)
                      _arguments '1:source:(gemini)'
                      ;;
                    validate)
                      _arguments '*:path:_directories'
                      ;;
                  esac
                  ;;
              esac
              ;;
            mcp)
              local -a mcp_commands
              mcp_commands=(
                'add:Add an MCP server'
                'remove:Remove an MCP server'
                'list:List configured MCP servers'
                'enable:Enable an MCP server'
                'disable:Disable an MCP server'
              )
              _describe -t mcp_commands 'mcp command' mcp_commands
              ;;
            models)
              ;;
            install)
              _arguments \
                '--dir[Custom directory target to configure PATH for]:directory:_directories' \
                '--skip-aliases[Bypass shell profile alias purging]' \
                '--skip-path[Bypass shell profile PATH appending]' \
                '-h[Show help]' \
                '--help[Show help]'
              ;;
          esac
          ;;
      esac
    }

    _agy "$@"
  '';

  superpowersCompletion = pkgs.writeTextDir "share/zsh/site-functions/_antigravity_superpowers" ''
    #compdef antigravity-superpowers agsp agspd agspc agsps agspsw agspw agspq agspm

    _antigravity_superpowers() {
      local curcontext="$curcontext" state line
      typeset -A opt_args

      local -a commands
      commands=(
        'init:Initialize .agents profile in a project or globally'
        'check:Validate installed Antigravity Superpowers profile integrity'
        'doctor:Run diagnostic healthcheck on Nix, Node, Git, and AGY'
        'sync:Synchronize latest skills and rules without overwriting custom files'
        'mcp:Model Context Protocol server (NixOS, Quotas, Skills)'
        'watch:Continuous filesystem watcher with automated linters'
        'quota:Inspect Antigravity token quotas and reset countdowns'
        'preset:Scaffold full language/stack profile (nixos, web, rust, python)'
      )

      _arguments -C \
        '-h[Show help]' \
        '--help[Show help]' \
        '1:command:->command' \
        '*::args:->args'

      case "$state" in
        command)
          _describe -t commands 'antigravity-superpowers command' commands
          ;;
        args)
          case "$words[1]" in
            init)
              _arguments \
                '-f[Overwrite existing profile]' \
                '--force[Overwrite existing profile]' \
                '-g[Target global configuration (~/.gemini/config)]' \
                '--global[Target global configuration (~/.gemini/config)]' \
                '-n[Include template flake.nix and .envrc for Nix developer shell]' \
                '--nix[Include template flake.nix and .envrc for Nix developer shell]' \
                '-m[Provision declarative MCP server configuration]' \
                '--mcp[Provision declarative MCP server configuration]' \
                '--hooks[Provision lifecycle automation hooks]' \
                '-h[Show help]' \
                '--help[Show help]' \
                '1:target:_directories'
              ;;
            check|doctor)
              _arguments \
                '-h[Show help]' \
                '--help[Show help]' \
                '1:target:_directories'
              ;;
            sync)
              _arguments \
                '-g[Target global configuration (~/.gemini/config)]' \
                '--global[Target global configuration (~/.gemini/config)]' \
                '-h[Show help]' \
                '--help[Show help]' \
                '1:target:_directories'
              ;;
            mcp)
              local -a mcp_actions
              mcp_actions=(
                'serve:Start STDIO MCP server daemon'
                'tools:List all available MCP tools'
                'config:Show declarative MCP configuration'
              )
              _describe -t mcp_actions 'mcp action' mcp_actions
              ;;
            watch)
              _arguments \
                '--fix[Automatically apply linter fixes]' \
                '--test[Run test suite on change]' \
                '--once[Run single check pass and exit]' \
                '-h[Show help]' \
                '--help[Show help]' \
                '1:target:_directories'
              ;;
            quota)
              _arguments \
                '--json[Output quotas formatted as JSON]' \
                '--all[Display all model quotas]' \
                '--refresh[Bypass cache and query quota backend]' \
                '-h[Show help]' \
                '--help[Show help]'
              ;;
            preset)
              local -a presets
              presets=(
                'nixos:NixOS system dotfiles configuration preset'
                'web:Modern web development stack preset'
                'rust:Rust development stack preset'
                'python:Python development stack preset'
              )
              _arguments \
                '1:preset:((nixos\:"NixOS stack" web\:"Web stack" rust\:"Rust stack" python\:"Python stack"))' \
                '2:target:_directories'
              ;;
          esac
          ;;
      esac
    }

    _antigravity_superpowers "$@"
  '';

  generatedCompletions =
    pkgs.runCommand "generated-zsh-completions" {
      nativeBuildInputs = [pkgs.gh pkgs.uv];
    } ''
      mkdir -p $out/share/zsh/site-functions
      gh completion -s zsh > $out/share/zsh/site-functions/_gh
      uv generate-shell-completion zsh > $out/share/zsh/site-functions/_uv
    '';
in {
  environment.systemPackages = [
    agyCompletion
    superpowersCompletion
    generatedCompletions
  ];
}
