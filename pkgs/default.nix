{pkgs}: rec {
  clamav-sentinel = pkgs.stdenv.mkDerivation {
    pname = "clamav-sentinel";
    version = "1.0.0";
    src = ./clamav-scanner;

    nativeBuildInputs = [pkgs.makeWrapper];
    buildInputs = [pkgs.python3];

    installPhase = ''
      mkdir -p $out/bin $out/share/clamav-scanner
      cp -r src $out/share/clamav-scanner/
      cp -r tests $out/share/clamav-scanner/
      cp docker-compose.yml $out/share/clamav-scanner/
      cp bin/clamav-sentinel $out/bin/clamav-sentinel
      chmod +x $out/bin/clamav-sentinel $out/share/clamav-scanner/src/sentinel.py

      wrapProgram $out/bin/clamav-sentinel \
        --prefix PATH : ${pkgs.lib.makeBinPath [
        pkgs.python3
        pkgs.docker
        pkgs.docker-compose
        pkgs.inotify-tools
        pkgs.libnotify
        pkgs.coreutils
        pkgs.curl
        pkgs.netcat
      ]} \
        --set CLAMAV_SCANNER_DIR "$out/share/clamav-scanner" \
        --set PYTHON "${pkgs.python3}/bin/python3"
    '';

    meta = with pkgs.lib; {
      description = "Real-time inotify file creation scanner with ClamAV daemon";
      license = licenses.mit;
      platforms = platforms.linux;
    };
  };

  antigravity-superpowers = pkgs.stdenv.mkDerivation {
    pname = "antigravity-superpowers";
    version = "0.4.0";
    src = ./antigravity-superpowers;

    nativeBuildInputs = [pkgs.makeWrapper];
    buildInputs = [pkgs.nodejs_22];

    installPhase = ''
      runHook preInstall

      mkdir -p $out/lib/antigravity-superpowers
      cp -r bin src templates package.json README.md $out/lib/antigravity-superpowers/
      rm -rf $out/lib/antigravity-superpowers/templates/.agents/skills
      mkdir -p $out/lib/antigravity-superpowers/templates/.agents/skills
      cp -r -L ${../skills/skills/superpowers}/* $out/lib/antigravity-superpowers/templates/.agents/skills/

      mkdir -p $out/bin
      makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/antigravity-superpowers \
        --add-flags "$out/lib/antigravity-superpowers/bin/antigravity-superpowers.js"

      runHook postInstall
    '';

    meta = with pkgs.lib; {
      description = "CLI to initialize the Antigravity Superpowers profile for modern Antigravity 2.0";
      homepage = "https://github.com/shanmukha-sai-chinnam/damathryxx64";
      license = licenses.mit;
      maintainers = ["damathryxx64"];
      mainProgram = "antigravity-superpowers";
    };
  };
}
