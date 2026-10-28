{pkgs, ...}: let
  mcpServerTypesafe = pkgs.writers.writePython3Bin "mcp-server-typesafe" {
    flakeIgnore = ["E501"];
  } (builtins.readFile ./typesafe.py);

  githubMcpServerWrapped = pkgs.writeShellScriptBin "github-mcp-server-wrapped" ''
    export GITHUB_PERSONAL_ACCESS_TOKEN="''${GITHUB_PERSONAL_ACCESS_TOKEN:-$(${pkgs.gh}/bin/gh auth token 2>/dev/null || true)}"
    exec ${pkgs.github-mcp-server}/bin/github-mcp-server stdio "$@"
  '';

  relaxMcpDeps = pkg:
    if builtins.hasAttr "overridePythonAttrs" pkg
    then pkg.overridePythonAttrs (_: {dontCheckRuntimeDeps = true;})
    else pkg;

  mcpServerFetch = relaxMcpDeps pkgs.mcp-server-fetch;
  mcpServerGit = relaxMcpDeps pkgs.mcp-server-git;
  mcpServerTime = relaxMcpDeps pkgs.mcp-server-time;
in {
  nixpkgs.config.problems.handlers.fastmcp-slim.broken = "warn";

  environment.systemPackages = with pkgs; [
    github-mcp-server
    githubMcpServerWrapped
    markitdown-mcp
    mcp-language-server
    mcp-nixos
    mcpServerFetch
    mcp-server-filesystem
    mcpServerGit
    mcp-server-memory
    mcp-server-sequential-thinking
    mcpServerTime
    mcpServerTypesafe
  ];
}
