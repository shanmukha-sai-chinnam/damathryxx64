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
    andrej-karpathy-skills = {
      url = "github:shanmukha-sai-chinnam/andrej-karpathy-skills";
      flake = false;
    };
    google-skills = {
      url = "github:shanmukha-sai-chinnam/skills";
      flake = false;
    };
    superpowers = {
      url = "github:shanmukha-sai-chinnam/superpowers";
      flake = false;
    };
    i-have-adhd = {
      url = "github:shanmukha-sai-chinnam/i-have-adhd";
      flake = false;
    };
    nix-alien = {
      url = "github:thiagokokada/nix-alien";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.nix-index-database.follows = "nix-index-database";
    };
  };

  outputs = {
    nixpkgs,
    nixos-wsl,
    nix-index-database,
    antigravity-superpowers,
    andrej-karpathy-skills,
    google-skills,
    superpowers,
    i-have-adhd,
    nix-alien,
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
  in {
    nixosConfigurations = {
      nixos = nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = {
          inherit
            antigravity-superpowers
            andrej-karpathy-skills
            google-skills
            superpowers
            i-have-adhd
            nix-alien
            hostName
            userName
            ;
        };
        modules = [
          nixos-wsl.nixosModules.default
          nix-index-database.nixosModules.nix-index
          antigravity-superpowers.nixosModules.default
          ./modules/configuration.nix
        ];
      };
    };

    devShells.${system} = {
      default = dotsEnv.devShell;
      python = pythonEnv.devShell;
      devops = devopsEnv.devShell;
      cv = cvEnv.devShell;
      resume = cvEnv.devShell;
    };

    formatter.${system} = pkgs.alejandra;
  };
}
