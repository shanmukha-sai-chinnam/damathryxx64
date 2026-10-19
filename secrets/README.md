# Declarative Secret Management (`sops-nix` + Age)

This repository uses **`sops-nix`** and **Age** encryption for zero-plaintext secret operations.

## Architecture & Guarantees

- **Encrypted at Rest**: All secret files committed to git (`secrets/*.yaml`) are encrypted with Age public keys.
- **Decrypted to RAM Only**: At NixOS activation/runtime, secrets are decrypted directly to `/run/secrets/` (tmpfs in RAM), never touching unencrypted disk storage.
- **Hermetic Systemd Integration**: Systemd services reference secrets via `config.sops.secrets.<name>.path`.

## Prerequisites & Key Setup

### 1. Generate an Age Keypair

Run the following commands inside NixOS:
```bash
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

To view your public key:
```bash
age-keygen -y ~/.config/sops/age/keys.txt
```

### 2. Derive Age Key from Host SSH Ed25519 Key (Alternative)

```bash
ssh-to-age < /etc/ssh/ssh_host_ed25519_key.pub
```

### 3. Configure `.sops.yaml`

Add the public key(s) to `secrets/.sops.yaml`:
```yaml
creation_rules:
  - path_regex: secrets/[^/]+\.(yaml|json|env)$
    key_groups:
      - age:
          - <YOUR_AGE_PUBLIC_KEY>
```

## Creating & Editing Secrets

```bash
# Create or edit an encrypted file:
sops secrets/secrets.yaml
```

## Consuming Secrets in NixOS Modules

Declare secrets in `modules/secrets/default.nix` or any module:
```nix
sops.secrets."github-token" = {
  owner = "damathryxx64";
  group = "users";
  mode = "0400";
};
```

Access the decrypted value at runtime in applications or scripts via:
`/run/secrets/github-token`
