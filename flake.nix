{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixos-wsl.url = "github:nix-community/NixOS-WSL/main";
    nix-index-database = {
      url = "github:nix-community/nix-index-database";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    antigravity-superpowers = {
      url = "github:shanmukha-sai-chinnam/antigravity-superpowers";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    nixos-wsl,
    nix-index-database,
    antigravity-superpowers,
    ...
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config.allowUnfree = true;
    };
    dotsEnv = import ./modules/shells/dots.nix {inherit pkgs;};
    pythonEnv = import ./modules/shells/python.nix {inherit pkgs;};
    devopsEnv = import ./modules/shells/devops.nix {inherit pkgs;};
    hostName = "nixos";
    userName = "damathryxx64";
  in {
    nixosConfigurations = {
      nixos = nixpkgs.lib.nixosSystem {
        inherit system;
        modules = [
          nixos-wsl.nixosModules.default
          nix-index-database.nixosModules.nix-index
          antigravity-superpowers.nixosModules.default
          ({pkgs, ...}:
            import ./modules/configuration.nix {
              inherit system nixpkgs hostName userName pkgs;
            })
          {
            wsl = {
              enable = true;
              interop.includePath = true;
              ssh-agent.enable = true;
              wslConf = {
                automount.root = "/mnt";
                boot = {
                  systemd = true;
                  initTimeout = 20000;
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
            system.stateVersion = "25.05";
          }
        ];
      };
    };

    devShells.${system} = {
      default = dotsEnv.devShell;
      python = pythonEnv.devShell;
      devops = devopsEnv.devShell;
    };

    formatter.${system} = pkgs.alejandra;
  };
}
