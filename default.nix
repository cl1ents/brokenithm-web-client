# save this as shell.nix
{ pkgs ? import <nixpkgs> {}}:

let
  fhs = pkgs.buildFHSEnv {
    name = "fhs";
    stdenv = pkgs.stdenvAdapters.useMoldLinker pkgs.stdenv;
    targetPkgs = pkgs: (with pkgs; [
      bun
    ] ++ (with pkgs.xorg; [
      libX11
      libXcursor
      libXfont
      libXext
      libXfixes
      libXi
      libXinerama
      libXrandr
      libXrender
      #libXscrnsaver
      libXtst
      libXv
      libXvMC
      xrandr
    ]));
    extraOutputsToInstall = ["dev"];
    profile = '' '';
  };

in

pkgs.mkShell {
  buildInputs = [fhs];

  packages = with pkgs; [ 
    bun 
    wtype
  ];

  shellHook = ''
    ${fhs}/bin/fhs || true
  '';
}