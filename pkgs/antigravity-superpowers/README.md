# antigravity-superpowers

CLI toolkit to initialize, validate, and synchronize the Antigravity Superpowers profile for Antigravity 2.0.

Full documentation and architecture specifications reside at the **[Documentation Hub](https://shanmukha-sai-chinnam.github.io/damathryxx64/)**.

## Quick Start

```bash
# Initialize current workspace with .agents profile
npx antigravity-superpowers init

# Initialize with Nix developer shell and MCP configurations
npx antigravity-superpowers init --nix --mcp --hooks

# Install profile globally to ~/.gemini/config
npx antigravity-superpowers init --global --mcp --hooks
```

## CLI Commands

| Command | Description |
|---|---|
| `antigravity-superpowers init` | Scaffold `.agents/` profile, rules, and configuration |
| `antigravity-superpowers check` | Verify workspace configuration and skill manifest integrity |
| `antigravity-superpowers doctor` | Diagnose environment dependencies, tools, and linters |
| `antigravity-superpowers sync` | Synchronize skills and rules from bundled templates |
| `antigravity-superpowers mcp serve` | Launch stdio JSON-RPC MCP server for file/process operations |
| `antigravity-superpowers watch` | Continuous watcher running formatters and linters on save |
| `antigravity-superpowers quota` | Inspect model usage and quota allocations |
| `antigravity-superpowers preset` | Apply project presets (`nixos`, `web`, `rust`, `python`) |
