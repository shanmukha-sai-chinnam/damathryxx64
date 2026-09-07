{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    github-mcp-server
    markitdown-mcp
    mcp-language-server
    mcp-nixos
    mcp-server-fetch
    mcp-server-filesystem
    mcp-server-git
    mcp-server-memory
    mcp-server-sequential-thinking
    mcp-server-time
  ];
}
