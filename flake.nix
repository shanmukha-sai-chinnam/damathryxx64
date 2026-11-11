{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-index-database = {
      url = "github:nix-community/nix-index-database";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nix-alien = {
      url = "github:thiagokokada/nix-alien";
      inputs.nix-index-database.follows = "nix-index-database";
    };
    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nether-ward = {
      url = "github:shanmukha-sai-chinnam/nether-ward";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    nix-index-database,
    nix-alien,
    git-hooks,
    nether-ward,
    ...
  }: let
    values = import ./lib/values.nix;
    system = values.system.platform;
    pkgs = import nixpkgs {
      inherit system;
      config = {
        allowUnfree = true;
        problems.handlers.gemini-cli.removal = "ignore";
      };
    };
    monorepoPkgs = import ./pkgs {inherit pkgs;};
    hostName = values.system.hostname;
    userName = values.identity.username;

    preCommitCheck = git-hooks.lib.${system}.run {
      src = ./.;
      hooks = {
        alejandra.enable = true;
        statix.enable = true;
        deadnix.enable = true;
      };
    };
  in {
    packages.${system} =
      monorepoPkgs
      // {
        nether-ward = nether-ward.packages.${system}.default;
      };

    nixosConfigurations = {
      nixos = nixpkgs.lib.nixosSystem {
        inherit system;
        specialArgs = {
          inherit
            nix-alien
            nether-ward
            hostName
            userName
            values
            ;
        };
        modules = [
          ./modules/nixos-wsl/modules
          nix-index-database.nixosModules.nix-index
          ./modules/configuration.nix
        ];
      };
    };

    checks.${system} = {
      pre-commit-check = preCommitCheck;
    };

    formatter.${system} = pkgs.alejandra;
  };
}
