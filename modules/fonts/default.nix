{pkgs, ...}: {
  fonts = {
    packages = with pkgs; [
      cascadia-code
      nerd-fonts.caskaydia-cove
      nerd-fonts.fira-code
    ];
    fontconfig.defaultFonts.monospace = ["CascadiaCode Nerd Font"];
  };
}
