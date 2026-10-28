{pkgs, ...}: let
  mcpServerTypesafe = pkgs.writers.writePython3Bin "mcp-server-typesafe" {
    flakeIgnore = ["E501"];
  } (builtins.readFile ./typesafe.py);

  githubMcpServerWrapped = pkgs.writeShellScriptBin "github-mcp-server-wrapped" ''
    export GITHUB_PERSONAL_ACCESS_TOKEN="''${GITHUB_PERSONAL_ACCESS_TOKEN:-$(${pkgs.gh}/bin/gh auth token 2>/dev/null || true)}"
    exec ${pkgs.github-mcp-server}/bin/github-mcp-server stdio "$@"
  '';
in {
  environment.systemPackages = with pkgs; [
    github-mcp-server
    githubMcpServerWrapped
    markitdown-mcp
    mcp-language-server
    mcp-nixos
    mcp-server-fetch
    mcp-server-filesystem
    mcp-server-git
    mcp-server-memory
    mcp-server-sequential-thinking
    mcp-server-time
    mcpServerTypesafe
  ];
}
