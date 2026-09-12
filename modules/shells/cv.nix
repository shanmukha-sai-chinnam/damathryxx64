# cv.nix - Reproducible environment for Awesome-CV and LaTeX documents
{
  pkgs ? import <nixpkgs> {},
  nixpkgs ? null,
}: let
  usedPkgs =
    if nixpkgs != null
    then nixpkgs
    else pkgs;

  fontsConf = usedPkgs.makeFontsConf {
    fontDirectories = with usedPkgs; [
      source-sans
      roboto
    ];
  };
in {
  devShell = usedPkgs.mkShell {
    buildInputs = with usedPkgs; [
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
      echo "Awesome-CV / LaTeX devShell active. Run 'make' or 'xelatex <file>.tex' to compile."
    '';
  };
}
