{pkgs, ...}: let
  fontsConf = pkgs.makeFontsConf {
    fontDirectories = with pkgs; [
      source-sans
      roboto
    ];
  };
in {
  devShell = pkgs.mkShell {
    buildInputs = with pkgs; [
      (texliveSmall.withPackages (ps:
        with ps; [
          ifmtarg
          latexmk
          fontspec
          unicode-math
          xstring
          enumitem
          environ
          tcolorbox
          ragged2e
          etoolbox
          setspace
          parskip
          geometry
          fancyhdr
          xcolor
          iftex
          xifthen
          fontawesome6
          accsupp
          hyperref
          bookmark
          sourcesanspro
          roboto
          tikzfill
        ]))
      gnumake
      source-sans
      roboto
    ];

    shellHook = ''
      export FONTCONFIG_FILE="${fontsConf}"
      echo "Resume / LaTeX devShell active. Run 'make' or 'xelatex <file>.tex' to compile."
    '';
  };
}
