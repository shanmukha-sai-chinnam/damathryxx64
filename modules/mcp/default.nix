{pkgs, ...}: let
  mcpServerTypesafe = pkgs.writers.writePython3Bin "mcp-server-typesafe" {
    flakeIgnore = ["E501"];
  } (builtins.readFile ./typesafe.py);

  githubMcpServerWrapped = pkgs.writeShellScriptBin "github-mcp-server-wrapped" ''
    export GITHUB_PERSONAL_ACCESS_TOKEN="''${GITHUB_PERSONAL_ACCESS_TOKEN:-$(${pkgs.gh}/bin/gh auth token 2>/dev/null || true)}"
    exec ${pkgs.github-mcp-server}/bin/github-mcp-server stdio "$@"
  '';

  mcpServerGit = pkgs.mcp-server-git.overridePythonAttrs (_: {
    dontCheckRuntimeDeps = true;
  });

  mcpServerTime = pkgs.mcp-server-time.overridePythonAttrs (_: {
    dontCheckRuntimeDeps = true;
  });
in {
  nixpkgs.config.problems.handlers.fastmcp-slim.broken = "warn";

  environment.systemPackages = with pkgs; [
    github-mcp-server
    githubMcpServerWrapped
    markitdown-mcp
    mcp-language-server
    mcp-nixos
    mcp-server-fetch
    mcp-server-filesystem
    mcpServerGit
    mcp-server-memory
    mcp-server-sequential-thinking
    mcpServerTime
    mcpServerTypesafe
  ];
}
