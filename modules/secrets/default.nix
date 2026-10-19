{
  pkgs,
  userName ? "damathryxx64",
  ...
}: {
  # Declarative secret operations via sops-nix
  # Secrets are safely encrypted at rest with Age and decrypted directly to RAM (/run/secrets/)
  sops = {
    age = {
      keyFile = "/home/${userName}/.config/sops/age/keys.txt";
      generateKey = false;
    };
    validateSopsFiles = false;
  };

  # CLI tools for Age key generation, SSH key translation, and secret encryption
  environment.systemPackages = with pkgs; [
    sops
    age
    ssh-to-age
  ];
}
