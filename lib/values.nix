# Unified values loader for damathryxx64 monorepo.
# Reads values.json as the single source of truth for all configurations.
let
  valuesFile = ../values.json;
  raw = builtins.fromJSON (builtins.readFile valuesFile);

  # Assert top-level schema integrity for critical sections
  requiredSections = [
    "identity"
    "system"
    "wsl"
    "windows"
    "paths"
    "github"
    "security"
  ];
  missingSections = builtins.filter (k: !builtins.hasAttr k raw) requiredSections;
in
  if missingSections != []
  then
    throw
    "CRITICAL [values.nix]: values.json is missing required section(s): ${builtins.concatStringsSep ", " missingSections}"
  else raw
