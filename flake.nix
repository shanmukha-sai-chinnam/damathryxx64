{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixos-wsl.url = "github:shanmukha-sai-chinnam/NixOS-WSL/main";
    nix-index-database = {
      url = "github:nix-community/nix-index-database";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    antigravity-superpowers = {
      url = "github:shanmukha-sai-chinnam/antigravity-superpowers";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    gemini-skills = {
      url = "github:shanmukha-sai-chinnam/skills";
      flake = false;
    };
    nix-alien = {
      url = "github:thiagokokada/nix-alien";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.nix-index-database.follows = "nix-index-database";
    };
    clamav-scanner = {
      url = "github:shanmukha-sai-chinnam/clamav-scanner";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    nixos-wsl,
    nix-index-database,
    antigravity-superpowers,
    gemini-skills,
    nix-alien,
    clamav-scanner,
    sops-nix,
    git-hooks,
    ...
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config = {
        allowUnfree = true;
        problems.handlers.gemini-cli.removal = "ignore";
      };
    };
    dotsEnv = import ./modules/shells/dots.nix {inherit pkgs;};
    pythonEnv = import ./modules/shells/python.nix {inherit pkgs;};
    devopsEnv = import ./modules/shells/devops.nix {inherit pkgs;};
    cvEnv = import ./modules/shells/cv.nix {inherit pkgs;};
    hostName = "nixos";
    userName = "damathryxx64";

    preCommitCheck = git-hooks.lib.${system}.run {
      src = ./.;
      hooks = {
        alejandra.enable = true;
        statix.enable = true;
        deadnix.enable = true;
      };
    };
  in {
    nixosConfigurations = {
      nixos = nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = {
          inherit
            antigravity-superpowers
            gemini-skills
            nix-alien
            hostName
            userName
            ;
        };
        modules = [
          nixos-wsl.nixosModules.default
          nix-index-database.nixosModules.nix-index
          antigravity-superpowers.nixosModules.default
          clamav-scanner.nixosModules.default
          sops-nix.nixosModules.sops
          ./modules/configuration.nix
        ];
      };
    };

    checks.${system} = {
      pre-commit-check = preCommitCheck;
    };

    devShells.${system} = {
      default = dotsEnv.devShell.overrideAttrs (old: {
        shellHook = ''
          ${old.shellHook or ""}
          ${preCommitCheck.shellHook}
        '';
      });
      python = pythonEnv.devShell;
      devops = devopsEnv.devShell;
      cv = cvEnv.devShell;
      resume = cvEnv.devShell;
    };

    formatter.${system} = pkgs.alejandra;
  };
}
