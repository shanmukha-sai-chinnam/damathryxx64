{
  lib,
  pkgs,
  andrej-karpathy-skills ? null,
  google-skills ? null,
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
    export PATH="${pkgs.lib.makeBinPath (with pkgs; [coreutils bash findutils])}:$PATH"

    CONFIG_DIR="$HOME/.gemini/config"
    SKILLS_DIR="$CONFIG_DIR/skills"
    RULES_DIR="$CONFIG_DIR/rules"
    PLUGINS_DIR="$CONFIG_DIR/plugins"

    mkdir -p "$SKILLS_DIR" "$RULES_DIR" "$PLUGINS_DIR"

    # ── 1. Synchronize Karpathy Guidelines ─────────────────────────────────
    ${lib.optionalString (andrej-karpathy-skills != null) ''
      KARPATHY_SRC="${andrej-karpathy-skills}"
      if [ -d "$KARPATHY_SRC/skills/karpathy-guidelines" ]; then
        rm -rf "$SKILLS_DIR/karpathy-guidelines"
        mkdir -p "$SKILLS_DIR/karpathy-guidelines"
        cp -r "$KARPATHY_SRC/skills/karpathy-guidelines"/* "$SKILLS_DIR/karpathy-guidelines/"
      fi

      if [ -f "$KARPATHY_SRC/GEMINI.md" ]; then
        cp "$KARPATHY_SRC/GEMINI.md" "$RULES_DIR/karpathy-guidelines.md"
      fi

      if [ -d "$KARPATHY_SRC/plugins/karpathy-guidelines" ]; then
        rm -rf "$PLUGINS_DIR/karpathy-guidelines"
        mkdir -p "$PLUGINS_DIR/karpathy-guidelines"
        cp -r "$KARPATHY_SRC/plugins/karpathy-guidelines"/* "$PLUGINS_DIR/karpathy-guidelines/"
      fi
    ''}

    # ── 2. Synchronize Google Skills ───────────────────────────────────────
    ${lib.optionalString (google-skills != null) ''
      GOOGLE_SRC="${google-skills}"
      if [ -d "$GOOGLE_SRC/skills" ]; then
        for cat in "$GOOGLE_SRC/skills"/*; do
          if [ -d "$cat" ]; then
            for skill in "$cat"/*; do
              if [ -d "$skill" ] && [ -f "$skill/SKILL.md" ]; then
                sname=$(basename "$skill")
                rm -rf "$SKILLS_DIR/$sname"
                mkdir -p "$SKILLS_DIR/$sname"
                cp -r "$skill"/* "$SKILLS_DIR/$sname/"
              fi
            done
          fi
        done
      fi

      if [ -d "$GOOGLE_SRC/plugins" ]; then
        for plugin in "$GOOGLE_SRC/plugins"/*; do
          if [ -d "$plugin" ]; then
            pname=$(basename "$plugin")
            rm -rf "$PLUGINS_DIR/$pname"
            mkdir -p "$PLUGINS_DIR/$pname"
            cp -r "$plugin"/* "$PLUGINS_DIR/$pname/"
          fi
        done
      fi
    ''}

    # Ensure all deployed configs are writable for the user
    chmod -R u+w "$CONFIG_DIR" 2>/dev/null || true
  '';
in {
  environment.systemPackages = [
    syncForksScript
  ];

  # Systemd user service to sync skills on login
  systemd.user.services.agent-skills-sync = {
    description = "Declarative synchronization of AI agent skills into ~/.gemini/config";
    wantedBy = ["default.target"];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = skillsSyncScript;
      RemainAfterExit = true;
    };
  };

  # User activation script to sync on system rebuild
  system.userActivationScripts.agentSkillsSync = {
    text = "${skillsSyncScript}";
  };
}
