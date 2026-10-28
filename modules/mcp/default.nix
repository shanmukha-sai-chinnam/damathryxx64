{pkgs, ...}: let
  mcpServerTypesafe = pkgs.writers.writePython3Bin "mcp-server-typesafe" {
    flakeIgnore = ["E501"];
  } (builtins.readFile ./typesafe.py);

  githubMcpServerWrapped = pkgs.writeShellScriptBin "github-mcp-server-wrapped" ''
    export GITHUB_PERSONAL_ACCESS_TOKEN="''${GITHUB_PERSONAL_ACCESS_TOKEN:-$(${pkgs.gh}/bin/gh auth token 2>/dev/null || true)}"
    exec ${pkgs.github-mcp-server}/bin/github-mcp-server stdio "$@"
  '';

  # Adapt reference Python MCP servers for nixpkgs mcp 2.2.0 compatibility
  patchMcp = pkg:
    pkg.overridePythonAttrs (old: {
      dontCheckRuntimeDeps = true;
      postPatch =
        (old.postPatch or "")
        + ''
          find . -name "*.py" -exec sed -i "s/\bMcpError\b/MCPError/g" {} + 2>/dev/null || true
        '';
    });

  mcpServerFetch = patchMcp pkgs.mcp-server-fetch;
  mcpServerGit = patchMcp pkgs.mcp-server-git;
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
    mcpServerTypesafe
  ];
}
