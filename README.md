# damathryxx64

Unified declarative NixOS-WSL monorepo, in-tree AI agent skills hub, and real-time security sentinels.

All architecture documentation, system topology diagrams, module specifications, and agent skills are published at the **[Documentation Hub](https://shanmukha-sai-chinnam.github.io/damathryxx64/)** (source: [`docs/index.html`](docs/index.html)).

## Quick Reference Commands

All commands run inside NixOS-WSL:

| Task | Command | Purpose |
|---|---|---|
| **Validate** | `dots-validate` | 5-stage check: Schema, Alejandra format, Statix, Deadnix, and Flake check |
| **Dry Run** | `dots-test-vm` | Ephemeral dry build, nvd package version diff, systemd unit verification |
| **Build** | `dots-build` | Dry-build system derivation with closure diff (`nh os build`) |
| **Switch** | `dots-switch` | Apply live configuration (`nh os switch`) — requires explicit user approval |
| **Upgrade** | `dots-upgrade` | Update all flake inputs, validate, build, and switch in one command |
| **Format** | `dots-fmt` | Format all Nix expressions with Alejandra (`nix fmt -- .`) |
| **Lint** | `dots-lint` | Run Statix anti-pattern check and Deadnix dead code scan |
| **Query** | `dots-val <key>` | Query key from [`values.json`](values.json) (e.g. `dots-val identity.username`) |
| **AI Agent** | `agy` / `agy2` | Launch Antigravity CLI in NixOS or Antigravity 2.0 on Windows host |
| **Skills Sync** | `refresh-skills` | Synchronize in-tree declarative skills to `~/.gemini/config/skills` |
| **Clipboard** | `cb` | Bidirectional clipboard bridge: pipe to copy (`cat file \| cb`), bare to paste |

Detailed technical specifications, component guides, and configuration references reside in the [Interactive Dashboard](https://shanmukha-sai-chinnam.github.io/damathryxx64/).
