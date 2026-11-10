{
  pkgs,
  values ? (import ../../lib/values.nix),
  userName ? values.identity.username,
  hostName ? values.system.hostname,
  ...
}: let
  wslConfigFile = pkgs.writeText "wslconfig" ''
    [wsl2]
    memory=16GB
    processors=8
    swap=4GB
    networkingMode=mirrored
    dnsTunneling=true
    localhostforwarding=true

    [experimental]
    autoMemoryReclaim=gradual
    sparseVhd=true
    autoProxy=true
    bestEffortDnsParsing=true
  '';

  fixSocketPermissions = pkgs.writeShellScript "fix-docker-proxy-sockets" ''
    set -eu
    SOCKET_DIR="${values.wsl.proxy_socket_dir}"
    TARGET_MODE="${values.wsl.proxy_socket_mode}"

    if [ -d "$SOCKET_DIR" ]; then
      for s in "$SOCKET_DIR"/*.sock; do
        [ -e "$s" ] || continue
        current_mode="$(${pkgs.coreutils}/bin/stat -c '%a' "$s" 2>/dev/null || echo "")"
        if [ "$current_mode" != "$TARGET_MODE" ]; then
          ${pkgs.coreutils}/bin/chmod "$TARGET_MODE" "$s" 2>/dev/null || true
        fi
      done
    fi
  '';
in {
  imports = [
    ./resilience.nix
  ];

  # ── WSL2 System Configuration ──────────────────────────────────────────
  wsl = {
    enable = true;
    docker-desktop.enable = true;
    interop.includePath = true;
    ssh-agent.enable = true;
    usbip.enable = true;
    extraBin = with pkgs; [
      {src = "${coreutils}/bin/id";}
      {src = "${coreutils}/bin/mkdir";}
      {src = "${coreutils}/bin/uname";}
      {src = "${coreutils}/bin/dirname";}
      {src = "${coreutils}/bin/test";}
      {src = "${coreutils}/bin/sleep";}
    ];
    wslConf = {
      automount.root = "/mnt";
      boot = {
        systemd = true;
        initTimeout = values.wsl.init_timeout;
      };
      interop = {
        enabled = true;
        appendWindowsPath = true;
      };
      network = {
        generateHosts = true;
        generateResolvConf = true;
        hostname = hostName;
      };
      user.default = userName;
    };
    defaultUser = userName;
    startMenuLaunchers = true;
  };

  # ── System Activation Scripts & State ────────────────────────────────────
  system = {
    userActivationScripts.wslHostConfigSync = {
      text = ''
        for user_profile in /mnt/c/Users/*; do
          if [ -d "$user_profile" ] && [ -d "$user_profile/AppData" ]; then
            if [ -w "$user_profile" ]; then
              cp -f ${wslConfigFile} "$user_profile/.wslconfig"
              chmod 644 "$user_profile/.wslconfig" 2>/dev/null || true
            fi
          fi
        done
      '';
    };
    activationScripts.dockerDesktopProxySocket = {
      text = "${fixSocketPermissions}";
    };
    stateVersion = values.system.state_version;
  };

  # ── Fonts & Typography ───────────────────────────────────────────────────
  fonts = {
    packages = with pkgs; [
      cascadia-code
      nerd-fonts.caskaydia-cove
      nerd-fonts.fira-code
    ];
    fontconfig.defaultFonts.monospace = ["CascadiaCode Nerd Font"];
  };

  # ── Docker Desktop Integration ───────────────────────────────────────────
  virtualisation.docker.enable = false;
  users.users.${userName}.extraGroups = ["docker"];

  # ── Nix Daemon Settings & Maintenance ────────────────────────────────────
  nixpkgs.config.allowUnfree = true;

  nix = {
    settings = {
      experimental-features = ["nix-command" "flakes" "pipe-operators"];
      warn-dirty = false;
      eval-cache = true;
      http-connections = 50;
      log-lines = 30;
      min-free = 1073741824; # 1 GiB
      max-free = 4294967296; # 4 GiB
      trusted-users = ["root" "@wheel" values.identity.username];
      auto-optimise-store = true;
      builders-use-substitutes = true;
      max-jobs = "auto";
      cores = 0;
      connect-timeout = 5;
      fallback = true;

      substituters = [
        "https://cache.nixos.org"
        "https://nix-community.cachix.org"
        "https://numtide.cachix.org"
      ];
      trusted-public-keys = [
        "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
        "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
        "numtide.cachix.org-1:2ps1kLBUWjxIneOy1Ik6cQjb41X0iXVXeHigGmycPPE="
      ];
    };
  };

  programs.nh = {
    enable = true;
    flake = values.paths.dots_repo;
    clean = {
      enable = true;
      extraArgs = "--keep-since 14d --keep 5";
    };
  };

  # ── Systemd Services & Path Watchers ─────────────────────────────────────
  systemd = {
    paths.docker-desktop-proxy-socket = {
      description = "Watch Docker Desktop proxy socket creation";
      wantedBy = ["multi-user.target"];
      pathConfig = {
        PathChanged = values.wsl.proxy_socket_dir;
        MakeDirectory = false;
      };
    };

    services = {
      docker-desktop-proxy-socket = {
        description = "Ensure Docker Desktop proxy socket is accessible to docker group";
        serviceConfig = {
          Type = "oneshot";
          ExecStart = "${fixSocketPermissions}";
        };
      };

      nh-clean.serviceConfig = {
        Nice = 19;
        IOSchedulingClass = "idle";
        IOSchedulingPriority = 7;
      };
    };
  };

  environment = {
    sessionVariables = {
      NH_FLAKE = values.paths.dots_repo;
      FLAKE = values.paths.dots_repo;
    };
    systemPackages = with pkgs; [
      alejandra
      statix
      deadnix
      nix-output-monitor
      nix-fast-build
      nix-tree
      nix-diff
      nvd
      nurl
      nix-init
      nix-update
      nixpkgs-review
      manix
      cachix
      docker
      docker-compose
      inotify-tools
    ];
  };
}
