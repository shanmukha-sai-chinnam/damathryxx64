{pkgs, ...}: let
  skillsSyncScript = pkgs.writeShellScript "agent-skills-sync" ''
    set -eu
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [coreutils bash findutils])}:$PATH"

    CONFIG_DIR="$HOME/.gemini/config"
    SKILLS_DIR="$CONFIG_DIR/skills"
    RULES_DIR="$CONFIG_DIR/rules"

    mkdir -p "$SKILLS_DIR" "$RULES_DIR"

    STAGING_SKILLS=$(mktemp -d)
    STAGING_RULES=$(mktemp -d)

    cleanup() {
      rm -rf "$STAGING_SKILLS" "$STAGING_RULES"
    }
    trap cleanup EXIT

    # ── 1. Stage from Unified In-Tree Skills Hub ────────────────────────────
    SKILLS_SRC="${../../skills}"
    if [ -d "$SKILLS_SRC/skills" ]; then
      for cat in "$SKILLS_SRC/skills"/*; do
        if [ -d "$cat" ]; then
          for skill in "$cat"/*; do
            if [ -d "$skill" ] && [ -f "$skill/SKILL.md" ]; then
              sname=$(basename "$skill")
              mkdir -p "$STAGING_SKILLS/$sname"
              cp -r --no-preserve=mode "$skill"/* "$STAGING_SKILLS/$sname/"
            fi
          done
        fi
      done
    fi

    if [ -d "$SKILLS_SRC/rules" ]; then
      cp -r --no-preserve=mode "$SKILLS_SRC/rules"/* "$STAGING_RULES/" 2>/dev/null || true
    fi

    # ── 2. Declarative Pruning & Synchronization ───────────────────────────
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

    # Copy staged items into active config
    cp -r "$STAGING_SKILLS"/* "$SKILLS_DIR/" 2>/dev/null || true
    cp -r "$STAGING_RULES"/* "$RULES_DIR/" 2>/dev/null || true

    # Ensure all deployed configs are writable for the user
    chmod -R u+w "$CONFIG_DIR" 2>/dev/null || true
  '';

  syncSkillsScript = pkgs.writeShellScriptBin "dots-sync-skills" ''
    set -eu
    echo -e "\033[1;34m==>\033[0m \033[1mSynchronizing in-tree declarative skills to ~/.gemini/config...\033[0m"
    ${skillsSyncScript}
    echo -e "\033[1;32m[ok] Agent skills and rules synchronized.\033[0m"
  '';

  refreshSkillsScript = pkgs.writeShellScriptBin "refresh-skills" ''
    set -eu
    exec ${syncSkillsScript}/bin/dots-sync-skills "$@"
  '';
in {
  environment.systemPackages = [
    syncSkillsScript
    refreshSkillsScript
  ];

  # Systemd user services
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
  };

  # User activation script to sync on system rebuild
  system.userActivationScripts.agentSkillsSync = {
    text = "${skillsSyncScript}";
  };
}
