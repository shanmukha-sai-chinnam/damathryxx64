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

## Herdr-managed coding agents

The system installs Herdr together with OpenCode, Claude Code, Codex, and GitHub Copilot CLI. The `herdr-integrations` user service creates the agent configuration directories and installs Herdr's official integrations for all four agents. After activating the system, inspect it with:

```sh
systemctl --user status herdr-integrations.service
herdr integration status
herdr agent list
```

Start agents from Herdr so their terminals, lifecycle state, and resumable sessions stay under one runtime:

```sh
herdr
herdr agent start claude --kind claude --pane <pane-id>
herdr agent start codex --kind codex --pane <pane-id>
herdr agent start opencode --kind opencode --pane <pane-id>
herdr agent start copilot --kind copilot --pane <pane-id>
```

The integration installer is intentionally run at user-session startup because each upstream agent stores its Herdr hook or plugin in the user's home directory. This keeps package installation declarative while preserving the agents' own configuration and credentials.

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
