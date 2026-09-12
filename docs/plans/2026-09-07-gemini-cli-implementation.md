# Declare Gemini CLI in NixOS AI Module Implementation Plan

> **For Antigravity:** When in Planning Mode, save as `<appDataDir>/brain/<conversation-id>/implementation_plan.md` (with `request_feedback: true`). For persistent repository plans, save to `docs/plans/YYYY-MM-DD-<feature-name>.md` and execute using `.agents/workflows/execute-plan.md` in single-flow mode.

**Goal:** Declare `pkgs.gemini-cli` in `modules/ai/default.nix` so the `gemini` command is available system-wide in NixOS-WSL.

**Architecture:** Add `gemini-cli` to `environment.systemPackages` in `modules/ai/default.nix`. Ensure code formatting complies with Alejandra (`nix fmt`), pass flake evaluation (`nix flake check --impure`), and build the system derivation (`nixos-rebuild build`).

**Tech Stack:** NixOS 25.05 / Unstable, Nix Flakes, Alejandra, `gemini-cli`.

---

## User Review Required

> [!NOTE]
> System Activation Policy: Per repository rules, running `nixos-rebuild switch` will NOT be performed automatically. We will build and validate the system derivation (`nixos-rebuild build`), leaving system switching for your explicit execution.

---

## Proposed Changes

### AI System Module

#### [MODIFY] [modules/ai/default.nix](file:///home/damathryxx64/repositories/damathryxx64/modules/ai/default.nix)
- Add `gemini-cli` to `environment.systemPackages`.

---

## Task Structure

### Task 1: Declare `gemini-cli` in AI Module

**Files:**
- Modify: `modules/ai/default.nix`

**Step 1: Edit `modules/ai/default.nix`**
Add `gemini-cli` to `environment.systemPackages`:
```nix
  environment.systemPackages = with pkgs; [
    antigravity-cli
    gemini-cli
    # Note: herdr, opencode, claude-code, codex, github-copilot-cli, and ollama
    # have been purged from the system configuration.
  ];
```

**Step 2: Format Nix files**
Run:
```bash
nix fmt -- .
```

**Step 3: Validate flake integrity**
Run:
```bash
nix flake check --impure
```

**Step 4: Build NixOS system derivation**
Run:
```bash
nixos-rebuild build --flake .#nixos --impure
```
Expected: Derivation builds successfully with symlink `result` pointing to the new NixOS system toplevel.

**Step 5: Verify binary in build output**
Run:
```bash
./result/sw/bin/gemini --version
```
Expected: Outputs version (e.g. `0.47.0`).

**Step 6: Commit changes**
Run:
```bash
git add modules/ai/default.nix
git commit -m "feat(ai): declare gemini-cli in systemPackages"
```

---

## Verification Plan

### Automated Tests & Checks
- `nix fmt -- .`
- `nix flake check --impure`
- `nixos-rebuild build --flake .#nixos --impure`
- Check `./result/sw/bin/gemini --version`
