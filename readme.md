# [Damathryxx64](https://github.com/arcanumx64/damathryxx64)

A comprehensive NixOS-WSL configuration flake that defines my personal computing environment using the Nix ecosystem. The configuration encompasses system-level settings, development shells, and dotfiles, all managed through a declarative approach that ensures reproducibility and consistency across multiple machines.

## Daily workflow

Keep repositories, source trees, virtual environments, and build caches under `/home/damathryxx64`. Use `/mnt/c` only for files that must be shared with Windows; Linux filesystem I/O is substantially better for normal development.

```sh
# Validate without activating
nixos-rebuild build --flake .#nixos --impure

# Format and check the flake
nix fmt
nix flake check --impure
```

The flake explicitly manages WSL systemd, Windows interop, automounts, DNS/hosts generation, the default user, SSH-agent passthrough, Nix store optimization, weekly garbage collection, and `direnv`/`nix-direnv` support.

## Antigravity & Gemini AI Coding Agents

The system standardizes exclusively on Antigravity CLI (`agy`) and the Google Gemini AI toolkit, alongside declarative agent skill synchronization via Nix flakes. Inspect and manage agent skills with:

```sh
dots-sync-skills status
refresh-skills
agy -p "prompt"
```

CPU, memory, swap, networking mode, and WSL VM behavior are Windows-level settings. Configure those in `%UserProfile%\\.wslconfig`, then run `wsl --shutdown` from PowerShell for changes to take effect. Do not commit that file here because its resource limits are host-specific.

## [NixOS-WSL](https://nix-community.github.io/NixOS-WSL/)

```sh
nix-shell -p git vim curl pciutils gh
cd /tmp; export REPO="damathryxx64"; gh repo clone arcanumx64/$REPO; cd $REPO
sudo nixos-rebuild switch --flake ".#nixos"
```

## Nix development shells

```sh
# install nix - before developing python/devops developer environments
sh <(curl -L https://nixos.org/nix/install) --no-daemon
```

### [Python developer environments](https://github.com/arcanumx64/damathryxx64/blob/trunk/modules/shells/python.nix)

```sh
export NIXPKGS_ALLOW_UNFREE=1; nix develop "github:arcanumx64/damathryxx64#python" \
        --impure --extra-experimental-features nix-command --extra-experimental-features flakes
```

### [DevOps developer environments](https://github.com/arcanumx64/damathryxx64/blob/trunk/modules/shells/devops.nix)

```sh
export NIXPKGS_ALLOW_UNFREE=1; nix develop "github:arcanumx64/damathryxx64#devops" \
        --impure --extra-experimental-features nix-command --extra-experimental-features flakes
```
