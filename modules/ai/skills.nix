{
  lib,
  pkgs,
  gemini-skills ? null,
  ...
}: let
  syncForksScript = pkgs.writeShellScriptBin "dots-sync-skills" ''
    set -eu
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [git nix nh alejandra statix deadnix coreutils])}:$PATH"

    DEV_SCRIPT="/home/damathryxx64/repositories/damathryxx64/scripts/sync-forks.py"
    if [ -f "$DEV_SCRIPT" ]; then
      exec ${pkgs.python3}/bin/python3 "$DEV_SCRIPT" "$@"
    else
      exec ${pkgs.python3}/bin/python3 ${../../scripts/sync-forks.py} "$@"
    fi
  '';

  skillsSyncScript = pkgs.writeShellScript "agent-skills-sync" ''
    set -eu
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [coreutils bash findutils gnused])}:$PATH"

    CONFIG_DIR="$HOME/.gemini/config"
    SKILLS_DIR="$CONFIG_DIR/skills"
    RULES_DIR="$CONFIG_DIR/rules"
    PLUGINS_DIR="$CONFIG_DIR/plugins"

    mkdir -p "$SKILLS_DIR" "$RULES_DIR" "$PLUGINS_DIR"

    STAGING_SKILLS=$(mktemp -d)
    STAGING_RULES=$(mktemp -d)
    STAGING_PLUGINS=$(mktemp -d)

    cleanup() {
      rm -rf "$STAGING_SKILLS" "$STAGING_RULES" "$STAGING_PLUGINS"
    }
    trap cleanup EXIT

    # ── 1. Stage from Unified gemini-skills Hub ────────────────────────────
    ${lib.optionalString (gemini-skills != null) ''
      SKILLS_SRC="${gemini-skills}"
      if [ -d "$SKILLS_SRC/skills" ]; then
        for cat in "$SKILLS_SRC/skills"/*; do
          if [ -d "$cat" ]; then
            for skill in "$cat"/*; do
              if [ -d "$skill" ] && [ -f "$skill/SKILL.md" ]; then
                sname=$(basename "$skill")
                mkdir -p "$STAGING_SKILLS/$sname"
                cp -r "$skill"/* "$STAGING_SKILLS/$sname/"
              fi
            done
          fi
        done
      fi

      if [ -d "$SKILLS_SRC/rules" ]; then
        cp -r "$SKILLS_SRC/rules"/* "$STAGING_RULES/" 2>/dev/null || true
      fi

      if [ -d "$SKILLS_SRC/plugins" ]; then
        for plugin in "$SKILLS_SRC/plugins"/*; do
          if [ -d "$plugin" ] && [ -f "$plugin/plugin.json" ]; then
            pname=$(basename "$plugin")
            mkdir -p "$STAGING_PLUGINS/$pname"
            cp -r "$plugin"/* "$STAGING_PLUGINS/$pname/"
          fi
        done
      fi
    ''}

    # ── 5. Declarative Pruning & Synchronization ───────────────────────────
    # Prune any skill directory not in declared sources
    for existing in "$SKILLS_DIR"/*; do
      if [ -d "$existing" ]; then
        sname=$(basename "$existing")
        if [ ! -d "$STAGING_SKILLS/$sname" ]; then
          rm -rf "$existing"
        fi
      fi
    done

    # Prune any rule file not in declared sources
    for existing in "$RULES_DIR"/*; do
      if [ -f "$existing" ]; then
        rname=$(basename "$existing")
        if [ ! -f "$STAGING_RULES/$rname" ]; then
          rm -f "$existing"
        fi
      fi
    done

    # Prune any plugin directory not in declared sources
    for existing in "$PLUGINS_DIR"/*; do
      if [ -d "$existing" ]; then
        pname=$(basename "$existing")
        if [ ! -d "$STAGING_PLUGINS/$pname" ]; then
          rm -rf "$existing"
        fi
      fi
    done

    # Copy staged items into active config
    cp -r "$STAGING_SKILLS"/* "$SKILLS_DIR/" 2>/dev/null || true
    cp -r "$STAGING_RULES"/* "$RULES_DIR/" 2>/dev/null || true
    cp -r "$STAGING_PLUGINS"/* "$PLUGINS_DIR/" 2>/dev/null || true

    # ── 6. Purge Foreign Provider Artifacts from Config ────────────────────
    find "$CONFIG_DIR" -depth \( \
      -name ".claude*" -o -name ".cursor*" -o -name ".codex*" -o \
      -name ".opencode*" -o -name ".hermes*" -o -name ".kimi*" -o \
      -name ".devin*" -o -name ".qoder*" -o -name ".kiro*" -o \
      -name ".windsurf*" -o -name ".openclaw*" -o -name "CLAUDE.md" -o \
      -name "CURSOR.md" -o -name "*claude*.md" -o -name "*cursor*.md" -o \
      -name "*codex*.md" -o -name "*opencode*.md" -o -name "*hermes*.md" \
    \) -exec rm -rf {} + 2>/dev/null || true

    # ── 7. Enforce Google Gemini / Antigravity (AGY) in Synced Skills ───────
    find "$CONFIG_DIR" -type f -name "*.md" | while read -r mf; do
      sed -i -e 's/Claude Code/Antigravity CLI/g' \
             -e 's/claude-code/antigravity-cli/g' \
             -e 's/Claude Desktop/Antigravity IDE/g' \
             -e 's/OpenCode/Antigravity CLI/g' \
             -e 's/opencode/antigravity-cli/g' \
             -e 's/CLAUDE\.md/AGENTS.md/g' \
             -e 's/CURSOR\.md/AGENTS.md/g' \
             -e '/^disable-model-invocation: true/d' \
             "$mf" 2>/dev/null || true
    done

    # Ensure all deployed configs are writable for the user
    chmod -R u+w "$CONFIG_DIR" 2>/dev/null || true
  '';
  refreshSkillsScript = pkgs.writeShellScriptBin "refresh-skills" ''
    set -eu
    exec ${syncForksScript}/bin/dots-sync-skills refresh "$@"
  '';
in {
  environment.systemPackages = [
    syncForksScript
    refreshSkillsScript
  ];

  # Systemd user services and timers
  systemd.user = {
    services.agent-skills-sync = {
      description = "Declarative synchronization of AI agent skills into ~/.gemini/config";
      wantedBy = ["default.target"];
      serviceConfig = {
        Type = "oneshot";
        ExecStart = skillsSyncScript;
        RemainAfterExit = true;
      };
    };

    services.agent-skills-daily-sync = {
      description = "Daily synchronization and verification of agent skills from upstreams";
      serviceConfig = {
        Type = "oneshot";
        ExecStart = "${pkgs.writeShellScript "daily-skills-sync" ''
          set -eu
          export PATH="${pkgs.lib.makeBinPath (with pkgs; [git python3 coreutils nix])}:$PATH"
          SKILLS_REPO="/home/damathryxx64/repositories/skills"
          if [ -d "$SKILLS_REPO" ] && [ -f "$SKILLS_REPO/scripts/sync-upstreams.py" ]; then
            ${pkgs.python3}/bin/python3 "$SKILLS_REPO/scripts/sync-upstreams.py" daily || true
          fi
        ''}";
      };
    };

    timers.agent-skills-daily-sync = {
      description = "Run agent skills upstream sync daily";
      wantedBy = ["timers.target"];
      timerConfig = {
        OnCalendar = "daily";
        Persistent = true;
      };
    };
  };

  # User activation script to sync on system rebuild
  system.userActivationScripts.agentSkillsSync = {
    text = "${skillsSyncScript}";
  };
}
