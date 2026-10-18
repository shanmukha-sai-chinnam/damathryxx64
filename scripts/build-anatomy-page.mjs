#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(HERE, "..", "docs");
mkdirSync(DOCS_DIR, { recursive: true });

// Discover Anatomy kit path
function resolveAnatomyDir() {
  const candidates = [
    process.env.ANATOMY_DIR,
    join(homedir(), ".gemini/config/skills/anatomy"),
    join(HERE, "../../skills/skills/anatomy/anatomy"),
  ];
  for (const c of candidates) {
    if (c && existsSync(join(c, "kit/iso-kit.mjs"))) return c;
  }
  return join(homedir(), ".gemini/config/skills/anatomy");
}

const ANATOMY_DIR = resolveAnatomyDir();
const k = await import(`${ANATOMY_DIR}/kit/iso-kit.mjs`);

const WIDTH = 1000;
const HEIGHT = 560;

// World Dimensions
const SUB_BED = { x: -182, y: -96, w: 364, d: 192, r: 14 };
const MAIN_BED = { x: -172, y: -88, w: 344, d: 176, r: 10 };
const BED_H = 14;
const SUB_H = 6;
const FOOT_H = 6;

// Rail & Gantry bounds
const RAIL_FROM = -132;
const RAIL_TO = 132;
const RAIL_Y1 = -26;
const RAIL_Y2 = 26;
const SHAFT_Z = 16;
const SHAFT_R = 3.6;

// Central Tower: Antigravity 2.0 Spindle Column
const TOWER = [0, -54];
const TOWER_R = 24;
const TOWER_H = 126;
const CRT_Z = 64;
const CRT_H = 44;
const CRT_W = 64;

// 5 Stations along X (mapping to the 5 managed repositories)
const STATIONS = [
  {
    id: "damathryxx64",
    name: "damathryxx64",
    role: "Central Flake Driver",
    x: -108,
    camH: 30,
    color: "#60a5fa",
    repoUrl: "https://github.com/shanmukha-sai-chinnam/damathryxx64",
    branch: "trunk",
    flakeInput: "Primary Flake",
    desc: "Single source of truth for NixOS-WSL modules, devShells, and declarative skills synchronizer.",
    meta: "1,264 closure paths · Zero mutable state · Alejandra / Statix / Deadnix gates",
    badge: "System Core",
    files: ["flake.nix", "modules/configuration.nix", "modules/ai/skills.nix", "modules/packages/default.nix"],
    cmd: "dots-validate && dots-build",
    stats: "18 Modules · 4 devShells · Pure NixOS-WSL",
  },
  {
    id: "skills",
    name: "skills",
    role: "AI Agent Skills Hub",
    x: -54,
    camH: 22,
    color: "#34d399",
    repoUrl: "https://github.com/shanmukha-sai-chinnam/skills",
    branch: "main",
    flakeInput: "gemini-skills",
    desc: "Unified monorepo tracking 5 upstreams (Google, Superpowers, Karpathy, ADHD, Anatomy).",
    meta: "31 active skills · Automated daily upstream fetch, merge, rewrite & audit pipeline",
    badge: "Skills Hub",
    files: ["scripts/sync-upstreams.py", "skills/anatomy/anatomy/", "skills/karpathy-guidelines/"],
    cmd: "dots-sync-skills status && refresh-skills",
    stats: "31 Skills · 5 Tracked Upstreams · Daily Sync",
  },
  {
    id: "nixos-wsl",
    name: "NixOS-WSL",
    role: "Distro Builder & Modules",
    x: 0,
    camH: 26,
    color: "#a78bfa",
    repoUrl: "https://github.com/shanmukha-sai-chinnam/NixOS-WSL",
    branch: "main",
    flakeInput: "nixos-wsl",
    desc: "Fork of nix-community/NixOS-WSL providing guest systemd, kernel modules & Windows interop.",
    meta: "WSL2 virtualization · systemd guest activation · Mirrored networking",
    badge: "Guest Distro",
    files: ["modules/wsl-distro.nix", "flake.nix", "modules/docker-desktop.nix"],
    cmd: "nix build .#nixosConfigurations.default.config.system.build.tarball",
    stats: "Linux 6.6+ · systemd Native · Host Bridge",
  },
  {
    id: "antigravity-superpowers",
    name: "superpowers",
    role: "Agent Tooling & Watcher",
    x: 54,
    camH: 20,
    color: "#f472b6",
    repoUrl: "https://github.com/shanmukha-sai-chinnam/antigravity-superpowers",
    branch: "main",
    flakeInput: "antigravity-superpowers",
    desc: "Superpowers profile CLI for Antigravity with continuous watcher, diagnostics & auto-fix.",
    meta: "Doctor diagnostics · Background file watcher · ShellCheck & Alejandra integration",
    badge: "Tooling",
    files: ["bin/antigravity-superpowers", "templates/.agents/AGENTS.md", "flake.nix"],
    cmd: "antigravity-superpowers doctor",
    stats: "Background Watcher · Auto-Fix · Doctor Diagnostic",
  },
  {
    id: "clamav-scanner",
    name: "clamav-scanner",
    role: "Security Sentinel",
    x: 108,
    camH: 28,
    color: "#fbbf24",
    repoUrl: "https://github.com/shanmukha-sai-chinnam/clamav-scanner",
    branch: "trunk",
    flakeInput: "clamav-scanner",
    desc: "Real-time inotify file creation sentinel and Docker ClamAV daemon guarding workspace files.",
    meta: "Guards /home/damathryxx64/repositories against unsafe payloads in real-time",
    badge: "Sentinel",
    files: ["docker-compose.yml", "scripts/sentinel.sh", "flake.nix"],
    cmd: "docker compose up -d",
    stats: "inotify Kernel Hook · Real-Time Sentinel · Zero Lag",
  },
];

const CARRIAGE_W = 50;
const CARRIAGE_D = 70;
const CARRIAGE_H = 12;
const REACH = [STATIONS[0].x, STATIONS[STATIONS.length - 1].x];

// Camera setup: 44° Azimuth for optimal isometric depth & long side visibility
const P = k.fitProjection(
  [
    ...k.boxCorners(SUB_BED, -BED_H - SUB_H - FOOT_H, 0),
    [TOWER[0] - TOWER_R, TOWER[1] - TOWER_R, TOWER_H + 8],
    [TOWER[0] + TOWER_R, TOWER[1] + TOWER_R, TOWER_H + 8],
    [RAIL_FROM - 14, RAIL_Y1, SHAFT_Z + 14],
    [RAIL_TO + 14, RAIL_Y2, SHAFT_Z + 14],
  ],
  WIDTH,
  HEIGHT,
  { pad: 34, azimuth: 44, elevation: 32 }
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) =>
  [...points].sort(
    (a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)
  );

// ── 1. Heavy Multi-Tier Machine Bed & Leveling Feet ─────────────────────────
function buildPlate() {
  const out = [];

  out.push(`<path class="iso-halo" d="${k.haloOf(SUB_BED, -BED_H - SUB_H - FOOT_H, BED_H + SUB_H, P)}"/>`);

  const footPositions = [
    [-150, -75], [0, -78], [150, -75],
    [-150, 75], [0, 78], [150, 75]
  ];
  for (const [fx, fy] of byDepth(footPositions)) {
    out.push(S(k.cylinder(fx, fy, 10, -BED_H - SUB_H - FOOT_H, 2.5, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(fx, fy, 7.5, -BED_H - SUB_H - FOOT_H + 2.5, FOOT_H - 2.5, P, 28), { tone: "mid" }));
    out.push(L(k.knurl(fx, fy, 7.5, -BED_H - SUB_H - FOOT_H + 2.5, -BED_H - SUB_H, 24, P), { tone: "lo" }));
  }

  out.push(S(k.slabOf(SUB_BED, -BED_H - SUB_H, SUB_H, P, 10, 1.5), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(SUB_BED, 5), -BED_H, P), { tone: "faint" }));

  out.push(S(k.slabOf(MAIN_BED, -BED_H, BED_H, P, 10, 1.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MAIN_BED, 5), 0, P), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(MAIN_BED, 8), 0, P), { tone: "faint" }));

  for (const gy of [-38, 38]) {
    out.push(L(k.lineOnTop([-150, gy], [150, gy], 0, P), { tone: "faint" }));
  }

  const bedScrews = k.corners(MAIN_BED, 12);
  out.push(L(bedScrews.map(([x, y]) => k.ring(x, y, 3, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(bedScrews.map(([x, y]) => at([x, y, 0])), { size: 0.6, tone: "mid" }));

  const nameplate = { x: -68, y: 72, w: 136, d: 11, r: 2 };
  out.push(S(k.slabOf(nameplate, 0, 1.2, P, 2, 0.4), { tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(nameplate, 1.2), 1.2, P), { tone: "lo" }));
  out.push(D([[nameplate.x + 3, nameplate.y + 5.5], [nameplate.x + nameplate.w - 3, nameplate.y + 5.5]].map(([x, y]) => at([x, y, 1.2])), { size: 0.45, tone: "lo" }));
  const npMatrix = k.topMatrix([-60, nameplate.y + 2.5], 1.2, P);
  const npText = k.faceTextSvg(npMatrix, "NIXOS 26.11 x86_64 PURE RIG · ANTIGRAVITY 2.0 LSP", { size: 2.8, tone: "lo" });
  if (npText) out.push(npText);

  const strip = { x: -148, y: 55, w: 296, d: 8, r: 1.5 };
  out.push(S(k.slabOf(strip, 0, 1.2, P, 2, 0.4), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 8, strip.x + strip.w - 8, 4, 5, strip.y + strip.d, 1.2, [-2, -4.2], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));

  for (const st of STATIONS) {
    const sx = st.x;
    const pStart = at([0, -32, 0.6]);
    const pEnd = at([sx, -15, 0.6]);
    out.push(k.wireSvg(pStart, pEnd, { via: [at([sx * 0.42, -24, 0.6]), at([sx, -20, 0.6])], tone: "mid", flow: true, ends: "both", size: 1.2 }));
    out.push(D([at([sx, -21, 0])], { size: 0.45, tone: "lo" }));
  }

  return out.join("");
}

// ── 2. Twin Hardened Steel Guide Rails, Pillow Blocks & Springs ─────────────
function buildRails() {
  const out = [];

  for (const ry of [RAIL_Y1, RAIL_Y2]) {
    const leftPad = { x: -144, y: ry - 10, w: 18, d: 20, r: 3 };
    out.push(S(k.slabOf(leftPad, 0, 12, P, 3, 0.8), { tone: "lo" }));
    const leftCap = { x: -142, y: ry - 8, w: 14, d: 16, r: 2 };
    out.push(S(k.slabOf(leftCap, 12, 10, P, 2, 0.6), { tone: "mid" }));
    out.push(D([
      at([-140, ry - 6, 22]), at([-134, ry - 6, 22]),
      at([-140, ry + 6, 22]), at([-134, ry + 6, 22])
    ], { size: 0.5, tone: "mid" }));
    out.push(S(k.cylinder(-137, ry, 2.2, 22, 3, P, 16), { tone: "hi" }));
    out.push(S(k.cylinder(-137, ry, 1.2, 25, 2, P, 12), { tone: "lo" }));

    const rightPad = { x: 126, y: ry - 10, w: 18, d: 20, r: 3 };
    out.push(S(k.slabOf(rightPad, 0, 12, P, 3, 0.8), { tone: "lo" }));
    const rightCap = { x: 128, y: ry - 8, w: 14, d: 16, r: 2 };
    out.push(S(k.slabOf(rightCap, 12, 10, P, 2, 0.6), { tone: "mid" }));
    out.push(D([
      at([130, ry - 6, 22]), at([136, ry - 6, 22]),
      at([130, ry + 6, 22]), at([136, ry + 6, 22])
    ], { size: 0.5, tone: "mid" }));
    out.push(S(k.cylinder(133, ry, 2.2, 22, 3, P, 16), { tone: "hi" }));
    out.push(S(k.cylinder(133, ry, 1.2, 25, 2, P, 12), { tone: "lo" }));

    out.push(S(k.cylinder(-122, ry, 5.2, SHAFT_Z - SHAFT_R, SHAFT_R * 2, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(122, ry, 5.2, SHAFT_Z - SHAFT_R, SHAFT_R * 2, P, 24), { tone: "lo" }));

    out.push(L(k.sideRing([-120, ry, SHAFT_Z], 4.4, "x", P, 20), { tone: "faint" }));
    out.push(L(k.sideRing([120, ry, SHAFT_Z], 4.4, "x", P, 20), { tone: "faint" }));

    const leftSpring = k.coil(-118, -60, [ry, SHAFT_Z], 5.2, 6, "x", P);
    const rightSpring = k.coil(60, 118, [ry, SHAFT_Z], 5.2, 6, "x", P);
    out.push(L(leftSpring.back, { tone: "lo" }));
    out.push(L(rightSpring.back, { tone: "lo" }));

    const shaftPlan = { x: -128, y: ry - SHAFT_R, w: 256, d: SHAFT_R * 2, r: SHAFT_R };
    out.push(S(k.slabOf(shaftPlan, SHAFT_Z - SHAFT_R, SHAFT_R * 2, P, 1, 0.4), { tone: "hi" }));
    out.push(L(k.lineOnTop([-122, ry], [122, ry], SHAFT_Z + SHAFT_R, P), { tone: "lit" }));

    out.push(L(leftSpring.front, { tone: "mid" }));
    out.push(L(rightSpring.front, { tone: "mid" }));
  }

  return out.join("");
}

// ── 3. Central Telemetry Spindle Tower (Antigravity 2.0 Engine) ─────────────
function buildCentralTower() {
  const out = [];
  const [tx, ty] = TOWER;

  const towerPad = { x: tx - 36, y: ty - 32, w: 72, d: 52, r: 8 };
  out.push(S(k.slabOf(towerPad, 0, 8, P, 6, 1.2), { tone: "lo" }));
  const anchorPts = [
    [tx - 28, ty - 24], [tx, ty - 26], [tx + 28, ty - 24],
    [tx - 28, ty + 14], [tx, ty + 16], [tx + 28, ty + 14]
  ];
  out.push(D(anchorPts.map(([x, y]) => at([x, y, 8])), { size: 0.55, tone: "mid" }));

  out.push(S(k.cylinder(tx, ty, 26, 8, 4, P, 36, 0.8), { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, 23, 12, 42, P, 36), { tone: "mid" }));

  out.push(L(k.knurl(tx, ty, 23, 16, 26, 44, P), { tone: "lo" }));
  out.push(L(k.sideArc(tx, ty, 23, 16, P, 24), { tone: "faint" }));
  out.push(L(k.sideArc(tx, ty, 23, 26, P, 24), { tone: "faint" }));

  out.push(L(k.knurl(tx, ty, 23, 34, 44, 44, P), { tone: "lo" }));
  out.push(L(k.sideArc(tx, ty, 23, 34, P, 24), { tone: "faint" }));
  out.push(L(k.sideArc(tx, ty, 23, 44, P, 24), { tone: "faint" }));

  out.push(S(k.cylinder(tx, ty, 27, 54, 7, P, 36, 0.8), { tone: "hi" }));
  out.push(S(k.cylinder(tx + 22, ty, 2.5, 55, 5, P, 16), { tone: "lo" }));

  out.push(S(k.cylinder(tx, ty, 21, 61, 30, P, 36), { tone: "mid" }));
  out.push(L(k.sideArc(tx, ty, 21, 75, P, 24), { tone: "faint" }));
  out.push(D(k.dotGrid(tx - 9, ty + 18, 5, 4, 3.6, 68, P), { size: 0.5, tone: "lo" }));

  const arm = { x: tx - 12, y: ty + 4, w: 24, d: 18, r: 3 };
  out.push(S(k.slabOf(arm, 66, 14, P, 3, 0.8), { tone: "lo" }));

  const monBox = { x: tx - CRT_W / 2, y: ty + 16, w: CRT_W, d: 16, r: 4 };
  out.push(S(k.slabOf(monBox, CRT_Z, CRT_H, P, 4, 1.2), { tone: "hi" }));

  const monBezel = { x: monBox.x + 4, y: monBox.y + monBox.d - 1, w: monBox.w - 8, d: 2, r: 2.5 };
  out.push(S(k.slabOf(monBezel, CRT_Z + 4, CRT_H - 8, P, 2, 0.6), { tone: "mid" }));

  const monScreen = { x: monBezel.x + 3, y: monBezel.y + monBezel.d - 0.5, w: monBezel.w - 6, d: 0.8, r: 2 };
  out.push(S(k.slabOf(monScreen, CRT_Z + 7, CRT_H - 14, P, 1, 0.3), { tone: "lo", crease: "none" }));

  out.push(L(k.lineOnTop([monScreen.x + 2, monScreen.y + 0.4], [monScreen.x + monScreen.w - 2, monScreen.y + 0.4], CRT_Z + 7 + (CRT_H - 14) / 2, P), { tone: "faint" }));
  out.push(L(k.segment([tx, monScreen.y + 0.4, CRT_Z + 9], [tx, monScreen.y + 0.4, CRT_Z + CRT_H - 9], P), { tone: "faint" }));

  const waveX1 = monScreen.x + 3, waveX2 = monScreen.x + monScreen.w - 3;
  const waveZ = CRT_Z + 7 + (CRT_H - 14) / 2;
  const wavePts = [];
  for (let wx = waveX1; wx <= waveX2; wx += 1.8) {
    const norm = (wx - waveX1) / (waveX2 - waveX1);
    const waveH = Math.sin(norm * Math.PI * 4) * 4.5 + Math.sin(norm * Math.PI * 8) * 1.8;
    wavePts.push(at([wx, monScreen.y + 0.8, waveZ + waveH]));
  }
  const waveD = wavePts.map((p, idx) => `${idx ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  out.push(`<path class="crt-wave-line" d="${waveD}" />`);

  out.push(`<circle cx="${at([tx - 16, monBezel.y + 1.2, CRT_Z + 2])[0]}" cy="${at([tx - 16, monBezel.y + 1.2, CRT_Z + 2])[1]}" r="1.2" fill="#34d399" />`);
  out.push(`<circle cx="${at([tx, monBezel.y + 1.2, CRT_Z + 2])[0]}" cy="${at([tx, monBezel.y + 1.2, CRT_Z + 2])[1]}" r="1.2" fill="#fbbf24" />`);
  out.push(`<circle cx="${at([tx + 16, monBezel.y + 1.2, CRT_Z + 2])[0]}" cy="${at([tx + 16, monBezel.y + 1.2, CRT_Z + 2])[1]}" r="1.2" fill="#60a5fa" />`);

  out.push(S(k.cylinder(tx, ty, 18, 91, 16, P, 32, 1), { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, 20, 107, 6, P, 36), { tone: "hi" }));
  const bearingTicks = k.radialTicks(tx, ty, 19, 36, 6, 113, [1.5, 3], P);
  out.push(L(bearingTicks.minor, { tone: "lo" }));
  out.push(L(bearingTicks.major, { tone: "hi" }));

  out.push(S(k.cylinder(tx, ty, 8, 113, 11, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(tx, ty, 4.5, 124, 4, P, 20), { tone: "lit" }));

  const beaconPt = at([tx, ty, 128]);
  out.push(`<circle cx="${beaconPt[0].toFixed(1)}" cy="${beaconPt[1].toFixed(1)}" r="3.2" class="tower-beacon-core" />`);
  out.push(`<circle cx="${beaconPt[0].toFixed(1)}" cy="${beaconPt[1].toFixed(1)}" r="7" class="tower-beacon-glow" />`);

  out.push(S(k.cylinder(tx - 18, ty - 18, 4, 8, 8, P, 20), { tone: "hi" }));
  out.push(S(k.cylinder(tx + 18, ty - 18, 4, 8, 8, P, 20), { tone: "hi" }));

  return out.join("");
}

// ── 4. The 5 Machined Repository Stations (S1..S5) ───────────────────────────
function buildStations() {
  const out = [];

  STATIONS.forEach((st, idx) => {
    const sx = st.x;
    const sy = 0;

    const pad = { x: sx - 17, y: -17, w: 34, d: 34, r: 4 };
    out.push(S(k.slabOf(pad, 0, 4, P, 3, 0.8), { tone: "lo" }));
    out.push(D([
      at([sx - 11, -11, 4]), at([sx + 11, -11, 4]),
      at([sx - 11, 11, 4]), at([sx + 11, 11, 4])
    ], { size: 0.5, tone: "mid" }));

    out.push(S(k.cylinder(sx, sy, 14, 4, 3, P, 32, 0.6), { tone: "mid" }));

    out.push(S(k.cylinder(sx, sy, 12.5, 7, 5, P, 32), { tone: "hi" }));
    out.push(L(k.knurl(sx, sy, 12.5, 7, 12, 32, P), { tone: "lo" }));
    out.push(L(k.sideArc(sx, sy, 12.5, 7, P, 24), { tone: "faint" }));

    out.push(S(k.cylinder(sx, sy, 10.5, 12, st.camH, P, 32, 0.6), { tone: "mid" }));
    const vTicks = k.sideTicks(12, 12 + st.camH, 4, 2, sx + 10.5, 12 + st.camH, [1.5, 2.8], P);
    out.push(L(vTicks.minor, { tone: "lo" }));
    out.push(L(vTicks.major, { tone: "mid" }));

    const topZ = 12 + st.camH;
    out.push(L(k.ring(sx, sy, 9.5, topZ, P, 28), { tone: "hi" }));
    out.push(L(k.ring(sx, sy, 6.5, topZ, P, 24), { tone: "lo" }));

    out.push(S(k.cylinder(sx, sy, 2.8, topZ, 2.2, P, 20, 1.2), { tone: "lit" }));

    const tagPlate = { x: sx - 16, y: -26, w: 32, d: 7, r: 1.5 };
    out.push(S(k.slabOf(tagPlate, 0, 1, P, 2, 0.4), { tone: "lo" }));
    out.push(D([[tagPlate.x + 2.5, tagPlate.y + 3.5], [tagPlate.x + tagPlate.w - 2.5, tagPlate.y + 3.5]].map(([x, y]) => at([x, y, 1])), { size: 0.45 }));
    const tagMatrix = k.topMatrix([sx - 12, tagPlate.y + 1], 1, P);
    const tagText = k.faceTextSvg(tagMatrix, `S${idx + 1}: ${st.badge}`, { size: 2.4, tone: "mid" });
    if (tagText) out.push(tagText);
  });

  out.push(`<g id="active-halo-group">
    <ellipse id="active-halo-ellipse" cx="0" cy="0" rx="22" ry="11" class="active-station-halo" />
  </g>`);

  return out.join("");
}

// ── 5. Heavy Gliding Carriage & Precision Dial Gauge Indicator ───────────────
function buildMovingCarriage() {
  const out = [];

  out.push(`<g id="carriage">`);

  const carriagePlate = { x: -CARRIAGE_W / 2, y: -CARRIAGE_D / 2, w: CARRIAGE_W, d: CARRIAGE_D, r: 4 };
  out.push(S(k.slabOf(carriagePlate, 4, CARRIAGE_H, P, 4, 1.2), { tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(carriagePlate, 3.5), 4 + CARRIAGE_H, P), { tone: "lo" }));

  for (const by of [RAIL_Y1, RAIL_Y2]) {
    for (const bx of [-CARRIAGE_W / 2 + 1, CARRIAGE_W / 2 - 17]) {
      const bushBlock = { x: bx, y: by - 7, w: 16, d: 14, r: 2.5 };
      out.push(S(k.slabOf(bushBlock, 8, 16, P, 2, 0.6), { tone: "mid" }));
      out.push(S(k.cylinder(bx + 8, by, 2.2, 24, 3, P, 16), { tone: "hi" }));
      out.push(D([at([bx + 8, by, 27])], { size: 0.45, tone: "lo" }));
    }
  }

  const clampBlock = { x: -9, y: -21, w: 18, d: 14, r: 3 };
  out.push(S(k.slabOf(clampBlock, 16, 14, P, 3, 0.8), { tone: "lo" }));
  out.push(S(k.cylinder(11, -14, 3.5, 20, 6, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(11, -14, 3.5, 20, 26, 20, P), { tone: "lo" }));
  out.push(S(k.cylinder(0, -14, 4.2, 30, 18, P, 24), { tone: "mid" }));
  out.push(L(k.sideArc(0, -14, 4.2, 38, P, 20), { tone: "faint" }));

  const dialZ = 48;
  const dialTop = 60;
  out.push(S(k.cylinder(0, -14, 20, dialZ, 12, P, 48, 1), { tone: "hi" }));
  out.push(L(k.knurl(0, -14, 20, 56, dialTop, 64, P, 0.4), { tone: "lo" }));
  out.push(L(k.sideArc(0, -14, 20, 56, P, 32), { tone: "faint" }));
  out.push(L(k.ring(0, -14, 18, dialTop, P, 48), { tone: "hi" }));

  const dialTicks = k.radialTicks(0, -14, 17, 60, 5, dialTop, [1.5, 3.2], P);
  out.push(L(dialTicks.minor, { tone: "lo" }));
  out.push(L(dialTicks.major, { tone: "hi" }));

  out.push(L(k.ring(0, -9, 3.6, dialTop, P, 24), { tone: "faint" }));
  const subTicks = k.radialTicks(0, -9, 3.2, 12, 3, dialTop, [0.8, 1.4], P);
  out.push(L(subTicks.major, { tone: "lo" }));

  const dfMatrix = k.topMatrix([-6, -17], dialTop, P);
  const dfText = k.faceTextSvg(dfMatrix, "AGY 2.0", { size: 2.2, tone: "lo", anchor: "middle" });
  if (dfText) out.push(dfText);

  out.push(S(k.cylinder(0, -14, 2.4, dialTop, 1.5, P, 20), { tone: "mid" }));
  out.push(L(k.ring(0, -14, 1.2, dialTop + 1.5, P, 16), { tone: "hi" }));

  out.push(`<path id="needle" class="iso-line" data-tone="lit" style="stroke-width:1.2px;" d="${k.lineOnTop([0, -14], [0, -28], dialTop + 0.3, P)}"/>`);

  out.push(S(k.cylinder(0, -34, 3.5, 51, 7, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(0, -34, 2.2, 58, 3, P, 16), { tone: "hi" }));

  out.push(`<g id="plunger">`);
  out.push(S(k.cylinder(0, 0, 5.5, 0, 8, P, 24, 0.8), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 2.4, -6, 26, P, 20), { tone: "hi" }));
  const plungerSpring = k.coil(-2, 12, [0, 0], 3.4, 4, "z", P);
  out.push(L(plungerSpring.back, { tone: "lo" }));
  out.push(L(plungerSpring.front, { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 3.4, -8, 2.8, P, 16, 1.4), { tone: "lit" }));
  out.push(`</g>`);

  out.push(`</g>`);

  return out.join("");
}

// ── 6. Assemble Interactive SVG Model ────────────────────────────────────────
const svgBody = `
<svg class="iso-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <g class="iso-scene">
    ${buildPlate()}
    ${buildCentralTower()}
    ${buildStations()}
    ${buildRails()}
    ${buildMovingCarriage()}
  </g>
</svg>
`;

// ── 7. Client-side Interactive Animation Engine & Telemetry ──────────────────
const clientScript = `
const STATIONS = ${JSON.stringify(STATIONS)};
const REACH = [${REACH[0]}, ${REACH[1]}];
const BASE_H = 4 + ${CARRIAGE_H};

const carriage = document.getElementById("carriage");
const plunger = document.getElementById("plunger");
const needle = document.getElementById("needle");
const readout = document.getElementById("live-readout");
const subReadout = document.getElementById("sub-readout");
const stage = document.querySelector(".iso-stage");
const svg = document.querySelector(".iso-svg");
const still = window.matchMedia("(prefers-reduced-motion: reduce)");
const haloEllipse = document.getElementById("active-halo-ellipse");

// Client-side isometric math (zero external dependencies, zero script parse bugs)
const P = ${JSON.stringify(P)};
const RADIANS = Math.PI / 180;
const a = (P.azimuth || 44) * RADIANS;
const e = (P.elevation || 32) * RADIANS;
const sinA = Math.sin(a), cosA = Math.cos(a), sinE = Math.sin(e), cosE = Math.cos(e);
const kScale = P.scale;

function iso([x, y, z]) {
  return [
    P.origin[0] + (x * sinA - y * cosA) * kScale,
    P.origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * kScale
  ];
}

function translateAlong([dx, dy, dz]) {
  const o = iso([0, 0, 0]);
  const m = iso([dx, dy, dz]);
  return "translate(" + (m[0] - o[0]).toFixed(2) + " " + (m[1] - o[1]).toFixed(2) + ")";
}

function lineOnTop(from, to, z) {
  const p1 = iso([from[0], from[1], z]);
  const p2 = iso([to[0], to[1], z]);
  return "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + "L" + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

const needleAt = (turns) => {
  const [dx, dy] = [0, -14];
  const dz = 60.3;
  const angle = turns * Math.PI * 2 - Math.PI / 2;
  const len = 13.5;
  const tailLen = 4.5;
  const nx = dx + Math.cos(angle) * len;
  const ny = dy + Math.sin(angle) * len;
  const tx = dx - Math.cos(angle) * tailLen;
  const ty = dy - Math.sin(angle) * tailLen;
  return lineOnTop([tx, ty], [nx, ny], dz);
};

let currentX = STATIONS[0].x;
let targetX = currentX;
let stationIndex = 0;
let tip = { at: STATIONS[0].camH, rate: 0 };
let frame = 0, last = 0, clock = 0, touring = true, visible = false, idleTimer = 0;

function heightAt(x) {
  let closestH = STATIONS[0].camH;
  let minD = 9999;
  for (const st of STATIONS) {
    const d = Math.abs(x - st.x);
    if (d < minD) {
      minD = d;
      closestH = st.camH;
    }
  }
  return closestH;
}

function updateStationTelemetry(st, idx) {
  document.querySelectorAll(".station-pill").forEach((btn, i) => {
    btn.classList.toggle("active", i === idx);
  });

  const title = "[" + st.name + "] " + st.role;
  const detail = st.desc + " · " + st.meta;
  if (readout.textContent !== title) {
    readout.textContent = title;
    subReadout.textContent = detail;
  }

  if (haloEllipse) {
    const center = iso([st.x, 0, 4]);
    haloEllipse.setAttribute("cx", center[0].toFixed(1));
    haloEllipse.setAttribute("cy", center[1].toFixed(1));
    haloEllipse.style.stroke = st.color;
    haloEllipse.style.filter = "drop-shadow(0 0 12px " + st.color + ")";
  }

  const badgeEl = document.getElementById("telemetry-badge");
  const nameEl = document.getElementById("telemetry-name");
  const roleEl = document.getElementById("telemetry-role");
  const branchEl = document.getElementById("telemetry-branch");
  const inputEl = document.getElementById("telemetry-input");
  const statsEl = document.getElementById("telemetry-stats");
  const descEl = document.getElementById("telemetry-desc");
  const metaEl = document.getElementById("telemetry-meta");
  const repoLinkEl = document.getElementById("telemetry-repo-link");
  const cmdCodeEl = document.getElementById("telemetry-cmd-code");
  const filesEl = document.getElementById("telemetry-files");

  if (badgeEl) badgeEl.textContent = st.badge;
  if (nameEl) nameEl.textContent = st.name;
  if (roleEl) roleEl.textContent = st.role;
  if (branchEl) branchEl.textContent = st.branch;
  if (inputEl) inputEl.textContent = st.flakeInput;
  if (statsEl) statsEl.textContent = st.stats;
  if (descEl) descEl.textContent = st.desc;
  if (metaEl) metaEl.textContent = st.meta;
  if (repoLinkEl) repoLinkEl.href = st.repoUrl;
  if (cmdCodeEl) cmdCodeEl.textContent = st.cmd;
  if (filesEl && st.files) {
    filesEl.innerHTML = st.files.map(f => '<code>' + f + '</code>').join(' ');
  }

  document.querySelectorAll(".repo-card").forEach((card, i) => {
    card.classList.toggle("active-station-card", i === idx);
  });
}

function draw() {
  carriage.setAttribute("transform", translateAlong([currentX, 0, 0]));
  plunger.setAttribute("transform", translateAlong([0, 0, BASE_H + tip.at]));
  needle.setAttribute("d", needleAt(currentX / 27));

  let closestIdx = 0;
  let minD = 9999;
  STATIONS.forEach((st, idx) => {
    const d = Math.abs(currentX - st.x);
    if (d < minD) { minD = d; closestIdx = idx; }
  });

  if (closestIdx !== stationIndex) {
    stationIndex = closestIdx;
    updateStationTelemetry(STATIONS[stationIndex], stationIndex);
  }

  stage.setAttribute("aria-valuenow", String(stationIndex + 1));
  stage.setAttribute("aria-valuetext", STATIONS[stationIndex].name + ": " + STATIONS[stationIndex].role);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;

  if (touring) {
    clock += dt;
    const tourIdx = Math.floor(clock / 3.4) % STATIONS.length;
    targetX = STATIONS[tourIdx].x;
  }

  currentX = calm ? targetX : currentX + (targetX - currentX) * (1 - Math.exp(-dt / 0.22));
  if (Math.abs(targetX - currentX) < 0.02) currentX = targetX;

  const wantH = heightAt(currentX);
  const stiff = 460, drag = calm ? 2 * Math.sqrt(460) : 28;
  for (let i = 0; i < 4; i++) {
    tip.rate += ((wantH - tip.at) * stiff - tip.rate * drag) * dt / 4;
    tip.at += tip.rate * dt / 4;
  }
  if (Math.abs(wantH - tip.at) < 0.005 && Math.abs(tip.rate) < 0.005) {
    tip.at = wantH;
    tip.rate = 0;
  }

  draw();

  const settled = !touring && Math.abs(currentX - targetX) < 0.01 && Math.abs(tip.at - wantH) < 0.01;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}

const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};

const steer = (nextX) => {
  touring = false;
  targetX = clamp(nextX, REACH[0], REACH[1]);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    touring = !still.matches;
    clock = 0;
    run();
  }, 5000);
  run();
};

window.jumpToStation = function(idx) {
  if (STATIONS[idx]) {
    steer(STATIONS[idx].x);
    updateStationTelemetry(STATIONS[idx], idx);
  }
};

let toastTimeout = 0;
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2400);
}

window.copyCommand = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerText;
    btn.innerText = "✓ Copied!";
    btn.classList.add("copied");
    showToast("✓ Copied: " + text);
    setTimeout(() => {
      btn.innerText = orig;
      btn.classList.remove("copied");
    }, 1800);
  });
};

window.toggleTheme = function() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  document.body.setAttribute("data-theme", next);
  localStorage.setItem("anatomy-theme", next);
  const btn = document.getElementById("theme-btn-text");
  if (btn) btn.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
  showToast("Theme switched to " + next + " mode");
};

window.switchTab = function(tabId) {
  document.querySelectorAll(".arch-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
  document.querySelectorAll(".arch-tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === "pane-" + tabId);
  });
};

// Terminal TUI Simulator state and scripts
const TUI_SCRIPTS = {
  validate: [
    "$ dots-validate",
    "==> [1/4] Checking Nix code formatting (Alejandra)...",
    "  ↳ 18 files scanned ... OK",
    "==> [2/4] Checking Nix anti-patterns (Statix)...",
    "  ↳ No anti-patterns detected ... OK",
    "==> [3/4] Checking dead code (Deadnix)...",
    "  ↳ 0 unused bindings ... OK",
    "==> [4/4] Verifying Nix flake evaluations & checks...",
    "  ↳ nixosConfigurations.nixos ... OK",
    "  ↳ devShells.x86_64-linux (default, python, devops, resume) ... OK",
    "✓ All 4 Nix dots quality gates passed! (Zero drift guaranteed)"
  ],
  status: [
    "$ dots-sync-skills status",
    "Repository: skills (/home/damathryxx64/repositories/skills)",
    "  Branch: main [Clean]  Origin: +0 / -0 vs origin/main",
    "  Flake Input: gemini-skills → Synced (2b3a30e)",
    "Repository: antigravity-superpowers",
    "  Branch: main [Clean]  Origin: +0 / -0 vs origin/main",
    "  Flake Input: antigravity-superpowers → Synced (0909250)",
    "Repository: NixOS-WSL",
    "  Branch: main [Clean]  Origin: +0 / -0 vs origin/main",
    "  Flake Input: nixos-wsl → Synced (805c735)",
    "Repository: clamav-scanner",
    "  Branch: trunk [Clean]  Origin: +0 / -0 vs origin/trunk",
    "  Flake Input: clamav-scanner → Synced (e4b4f06)",
    "✓ All 4 repositories clean & 100% flake locked"
  ],
  agy2: [
    "$ agy2",
    "[agy2] Launching Antigravity 2.0 on Windows host...",
    "[agy2] Target WSL Distro: NixOS",
    "[agy2] Dynamic Link Resolver: Nix-LD ELF (glibc 2.39)",
    "[agy2] Listening on language server socket: /home/damathryxx64/.antigravity-server",
    "[agy2] 31 Agent Skills active in ~/.gemini/config/skills/",
    "✓ Antigravity 2.0 connected to NixOS-WSL successfully!"
  ]
};

window.runTuiCommand = function(cmdKey) {
  document.querySelectorAll(".tui-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-cmd") === cmdKey);
  });
  const lines = TUI_SCRIPTS[cmdKey] || [];
  const screen = document.getElementById("tui-screen");
  if (!screen) return;
  screen.innerHTML = "";
  let i = 0;
  function printNext() {
    if (i < lines.length) {
      const lineDiv = document.createElement("div");
      lineDiv.className = "tui-line";
      const l = lines[i];
      if (l.startsWith("$")) lineDiv.innerHTML = '<span class="tui-prompt">$</span> ' + l.slice(2);
      else if (l.startsWith("✓")) lineDiv.innerHTML = '<span class="tui-success">' + l + '</span>';
      else if (l.includes("OK")) lineDiv.innerHTML = l.replace("OK", '<span class="tui-ok">OK</span>');
      else if (l.includes("Synced")) lineDiv.innerHTML = l.replace("Synced", '<span class="tui-synced">Synced</span>');
      else lineDiv.textContent = l;
      screen.appendChild(lineDiv);
      screen.scrollTop = screen.scrollHeight;
      i++;
      setTimeout(printNext, 60);
    }
  }
  printNext();
};

new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

if (still.matches) touring = false;

stage.addEventListener("pointermove", (e) => {
  const box = svg.getBoundingClientRect();
  const share = clamp(((e.clientX - box.left) / box.width - 0.15) / 0.70, 0, 1);
  steer(REACH[0] + share * (REACH[1] - REACH[0]));
});
stage.addEventListener("pointerleave", () => steer(targetX));

stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") {
    e.preventDefault();
    jumpToStation(Math.min(STATIONS.length - 1, stationIndex + 1));
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    jumpToStation(Math.max(0, stationIndex - 1));
  } else if (e.key === "Home") {
    e.preventDefault();
    jumpToStation(0);
  } else if (e.key === "End") {
    e.preventDefault();
    jumpToStation(STATIONS.length - 1);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= 5) {
    e.preventDefault();
    jumpToStation(num - 1);
    showToast("Probing Station " + num + ": " + STATIONS[num - 1].name);
  } else if (e.key === "t" || e.key === "T") {
    toggleTheme();
  } else if (e.key === " ") {
    e.preventDefault();
    touring = !touring;
    showToast(touring ? "Auto-tour resumed" : "Auto-tour paused");
    if (touring) run();
  }
});

// Initial draw & TUI start
draw();
updateStationTelemetry(STATIONS[0], 0);
runTuiCommand("validate");

const savedTheme = localStorage.getItem("anatomy-theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
document.body.setAttribute("data-theme", savedTheme);
const tBtn = document.getElementById("theme-btn-text");
if (tBtn) tBtn.textContent = savedTheme === "dark" ? "Light Mode" : "Dark Mode";
`;

// ── 8. Assemble Full Landing Page with Architecture Docs ────────────────────
const cardHtml = `
<section id="rig" class="rig-section">
  <div class="rig-header">
    <div class="rig-badge">Visual Form 1 · Hero Isometric Machine (110+ Precision Parts)</div>
    <h2>Antigravity 2.0 NixOS Orchestration Rig</h2>
    <p class="rig-sub">
      A physical isometric test rig modeling our workspace topology. Click stations, press <kbd>1</kbd>–<kbd>5</kbd>, or use <kbd>←</kbd> <kbd>→</kbd> keys to probe repositories in real-time.
    </p>
  </div>

  <div class="station-nav">
    ${STATIONS.map((st, i) => `
      <button type="button" class="station-pill ${i === 0 ? "active" : ""}" onclick="jumpToStation(${i})">
        <span class="pill-key">${i + 1}</span>
        <span class="pill-dot" style="background:${st.color}"></span>
        <span class="pill-name">${st.name}</span>
        <span class="pill-badge">${st.badge}</span>
      </button>
    `).join("")}
  </div>

  <div class="iso-card">
    <div class="iso-card-glow-bar"></div>
    <div class="iso-head">
      <span class="iso-fig">Fig 1</span>
      <h3 class="iso-title">Antigravity 2.0 NixOS Orchestration Engine</h3>
      <span class="iso-keys-hint">Shortcuts: <kbd>1-5</kbd> Jump · <kbd>Space</kbd> Tour · <kbd>T</kbd> Theme</span>
    </div>
    
    <div class="iso-stage" tabindex="0" role="slider" aria-label="Interactive NixOS Workspace Machine" aria-valuemin="1" aria-valuemax="5" aria-valuenow="1">
      ${svgBody}
    </div>

    <div class="iso-foot">
      <span class="iso-hint">Hover, drag across rails, or use ← → keys to inspect stations</span>
      <div class="readout-box">
        <span id="live-readout" class="iso-readout">[${STATIONS[0].name}] ${STATIONS[0].role}</span>
        <span id="sub-readout" class="iso-subreadout">${STATIONS[0].desc}</span>
      </div>
    </div>
  </div>

  <div class="iso-keys">
    <div class="iso-key"><span class="iso-swatch" data-swatch="lit"></span><span>Antigravity 2.0 Spindle Column · Real-time JSON-RPC 2.0 language server running in NixOS</span></div>
    <div class="iso-key"><span class="iso-swatch" data-swatch="raised"></span><span>Hardened Steel Shafts & Helical Coil Springs · Dual pillow blocks with moving carriage</span></div>
    <div class="iso-key"><span class="iso-swatch" data-swatch="shaded"></span><span>Graduated Turrets & Cable Looms · damathryxx64, skills, NixOS-WSL, superpowers, clamav-scanner</span></div>
  </div>

  <!-- Live Station Telemetry Dashboard Card -->
  <div class="telemetry-dashboard">
    <div class="telemetry-card">
      <div class="telemetry-card-accent"></div>
      <div class="telemetry-header">
        <div class="telemetry-title-group">
          <span id="telemetry-badge" class="telemetry-badge">${STATIONS[0].badge}</span>
          <h4 id="telemetry-name">${STATIONS[0].name}</h4>
          <span id="telemetry-role" class="telemetry-role">${STATIONS[0].role}</span>
        </div>
        <a id="telemetry-repo-link" href="${STATIONS[0].repoUrl}" target="_blank" rel="noopener noreferrer" class="repo-direct-btn">
          View Repository ↗
        </a>
      </div>
      <p id="telemetry-desc" class="telemetry-desc">${STATIONS[0].desc}</p>
      <div class="telemetry-specs">
        <div class="spec-item">
          <span class="spec-label">Flake Input</span>
          <span id="telemetry-input" class="spec-val">${STATIONS[0].flakeInput}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Branch</span>
          <span id="telemetry-branch" class="spec-val">${STATIONS[0].branch}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">System Meta</span>
          <span id="telemetry-meta" class="spec-val">${STATIONS[0].meta}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">Runtime Specs</span>
          <span id="telemetry-stats" class="spec-val">${STATIONS[0].stats}</span>
        </div>
      </div>
      <div class="telemetry-footer">
        <div class="telemetry-files-group">
          <span class="files-label">Key Declarations:</span>
          <span id="telemetry-files" class="files-list">
            ${STATIONS[0].files.map(f => `<code>${f}</code>`).join(" ")}
          </span>
        </div>
        <div class="telemetry-cmd-group">
          <button type="button" class="cmd-copy-btn" onclick="copyCommand(document.getElementById('telemetry-cmd-code').innerText, this)">
            <code id="telemetry-cmd-code">${STATIONS[0].cmd}</code>
            <span class="copy-icon">📋</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const extraDocsHtml = `
<!-- ── Visual Form 2: 2.5D Exploded Architecture Stack ────────────────── -->
<section id="stack" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Visual Form 2 · 2.5D Exploded Architecture Stack</div>
    <h2>Multi-Tier Operating Foundation</h2>
    <p class="section-sub">
      Exploded perspective view of the NixOS-WSL guest container, Windows host bridge, and autonomous agent skill layers:
    </p>
  </div>

  <div class="stack-3d-wrap">
    <div class="stack-plane tier-ai">
      <div class="plane-tag">Tier 4 · AI Orchestration</div>
      <div class="plane-content">
        <h4>Google Antigravity 2.0 & Autonomous Coding Agents</h4>
        <p>Windows host launcher (<code>agy2</code>) attached to guest JSON-RPC 2.0 language server via Nix-LD dynamic ELF resolution.</p>
      </div>
      <span class="plane-badge">Headless Bridge</span>
    </div>

    <div class="stack-connector">▼ Declarative Skills Synchronization (agent-skills-sync.service)</div>

    <div class="stack-plane tier-skills">
      <div class="plane-tag">Tier 3 · Skills Monorepo</div>
      <div class="plane-content">
        <h4>AI Agent Skills Hub (~/.gemini/config/skills)</h4>
        <p>31 active skills tracking 5 upstreams (Google, Superpowers, Karpathy, ADHD, Anatomy) with daily automated rewriting.</p>
      </div>
      <span class="plane-badge">31 Skills Active</span>
    </div>

    <div class="stack-connector">▼ Flake Pinning & System Derivation (flake.lock)</div>

    <div class="stack-plane tier-dots">
      <div class="plane-tag">Tier 2 · System Core</div>
      <div class="plane-content">
        <h4>damathryxx64 Primary Flake Driver</h4>
        <p>18 modular system expressions, 4 devShells, and pre-commit validation suite (Alejandra, Statix, Deadnix, dots-build).</p>
      </div>
      <span class="plane-badge">Zero Drift</span>
    </div>

    <div class="stack-connector">▼ WSL2 Linux Virtualization (systemd-module loading)</div>

    <div class="stack-plane tier-os">
      <div class="plane-tag">Tier 1 · Guest Distro</div>
      <div class="plane-content">
        <h4>NixOS-WSL (Linux 6.6 Kernel & systemd Native)</h4>
        <p>Mirrored networking, Docker desktop daemon, ClamAV inotify sentinel, and complete Linux toolchains.</p>
      </div>
      <span class="plane-badge">NixOS 26.11</span>
    </div>

    <div class="stack-connector">▼ Hyper-V & Windows Subsystem for Linux Bridge</div>

    <div class="stack-plane tier-host">
      <div class="plane-tag">Tier 0 · Host Hardware</div>
      <div class="plane-content">
        <h4>Windows 11 Host Hardware & WSL2 Hypervisor</h4>
        <p>No host pollution: all builds, compiler toolchains, package management, and agents execute strictly inside NixOS.</p>
      </div>
      <span class="plane-badge">Windows Host</span>
    </div>
  </div>
</section>

<!-- ── Visual Form 3: Network Topology DAG ────────────────────────────── -->
<section id="topology" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Visual Form 3 · Network Topology DAG</div>
    <h2>Repository Dependency & Dataflow Mesh</h2>
    <p class="section-sub">
      Declarative dependency graph connecting the central flake driver to satellite repositories, remotes, and sentinels:
    </p>
  </div>

  <div class="dag-container">
    <svg class="dag-svg" viewBox="0 0 860 380" preserveAspectRatio="xMidYMid meet">
      <!-- Animated bezier connection lines with running light pulses -->
      <path class="dag-edge" d="M430 190 Q 240 100 160 80" />
      <path class="dag-edge" d="M430 190 Q 240 280 160 300" />
      <path class="dag-edge" d="M430 190 Q 620 100 700 80" />
      <path class="dag-edge" d="M430 190 Q 620 280 700 300" />
      <path class="dag-edge" d="M430 190 L 430 60" />

      <!-- Nodes -->
      <!-- Center: damathryxx64 -->
      <g class="dag-node" transform="translate(430, 190)">
        <circle r="46" class="node-halo-pulse" />
        <circle r="38" fill="var(--bg-card)" stroke="var(--accent-blue)" stroke-width="2.5" />
        <text text-anchor="middle" y="-4" class="dag-node-title">damathryxx64</text>
        <text text-anchor="middle" y="14" class="dag-node-sub">Primary Flake</text>
      </g>

      <!-- Top: Antigravity 2.0 -->
      <g class="dag-node" transform="translate(430, 60)">
        <circle r="30" fill="var(--bg-card)" stroke="var(--accent-purple)" stroke-width="2" />
        <text text-anchor="middle" y="-2" class="dag-node-title">Antigravity 2.0</text>
        <text text-anchor="middle" y="12" class="dag-node-sub">Host Bridge</text>
      </g>

      <!-- Top-Left: skills -->
      <g class="dag-node" transform="translate(160, 80)">
        <circle r="32" fill="var(--bg-card)" stroke="var(--accent-emerald)" stroke-width="2" />
        <text text-anchor="middle" y="-2" class="dag-node-title">skills</text>
        <text text-anchor="middle" y="12" class="dag-node-sub">31 Agent Skills</text>
      </g>

      <!-- Bottom-Left: NixOS-WSL -->
      <g class="dag-node" transform="translate(160, 300)">
        <circle r="32" fill="var(--bg-card)" stroke="var(--accent-blue)" stroke-width="2" />
        <text text-anchor="middle" y="-2" class="dag-node-title">NixOS-WSL</text>
        <text text-anchor="middle" y="12" class="dag-node-sub">Distro Builder</text>
      </g>

      <!-- Top-Right: superpowers -->
      <g class="dag-node" transform="translate(700, 80)">
        <circle r="32" fill="var(--bg-card)" stroke="var(--accent-pink)" stroke-width="2" />
        <text text-anchor="middle" y="-2" class="dag-node-title">superpowers</text>
        <text text-anchor="middle" y="12" class="dag-node-sub">Watcher / Doctor</text>
      </g>

      <!-- Bottom-Right: clamav-scanner -->
      <g class="dag-node" transform="translate(700, 300)">
        <circle r="32" fill="var(--bg-card)" stroke="var(--accent-amber)" stroke-width="2" />
        <text text-anchor="middle" y="-2" class="dag-node-title">clamav-scanner</text>
        <text text-anchor="middle" y="12" class="dag-node-sub">inotify Sentinel</text>
      </g>
    </svg>
  </div>
</section>

<!-- ── Visual Form 4: Interactive TUI Terminal Simulator ──────────────── -->
<section id="terminal" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Visual Form 4 · Interactive TUI Console</div>
    <h2>Simulated NixOS Command Terminal</h2>
    <p class="section-sub">
      Click a command tab below to run real-time simulated diagnostics, formatting gates, and upstream skills verification:
    </p>
  </div>

  <div class="tui-window">
    <div class="tui-chrome">
      <div class="tui-dots">
        <span class="tui-dot-red"></span>
        <span class="tui-dot-yellow"></span>
        <span class="tui-dot-green"></span>
      </div>
      <div class="tui-tabs">
        <button type="button" class="tui-tab active" data-cmd="validate" onclick="runTuiCommand('validate')">dots-validate</button>
        <button type="button" class="tui-tab" data-cmd="status" onclick="runTuiCommand('status')">dots-sync-skills status</button>
        <button type="button" class="tui-tab" data-cmd="agy2" onclick="runTuiCommand('agy2')">agy2</button>
      </div>
    </div>
    <div id="tui-screen" class="tui-screen">
      <!-- Dynamic lines streamed here -->
    </div>
  </div>
</section>

<!-- ── Visual Form 5: Modern Bento Grid Showcase ──────────────────────── -->
<section id="bento" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Visual Form 5 · Modern Bento Grid</div>
    <h2>System Capabilities & Telemetry Bento</h2>
    <p class="section-sub">
      Modular breakdown of key workspace primitives and real-time operational guarantees:
    </p>
  </div>

  <div class="bento-grid">
    <div class="bento-card bento-wide">
      <div class="bento-icon">🛡️</div>
      <h4>Zero-Drift Inotify Sentinel</h4>
      <p>Continuous real-time kernel file creation sentinel powered by Docker ClamAV daemon, safeguarding <code>/home/damathryxx64/repositories</code> against malicious payloads.</p>
      <div class="bento-tags">
        <span>inotifywait</span>
        <span>Docker Compose</span>
        <span>Daemon Sentinel</span>
      </div>
    </div>

    <div class="bento-card">
      <div class="bento-icon">📦</div>
      <h4>1,264 Store Paths</h4>
      <p>Pure Nix derivation closure evaluated with zero impurity, guaranteed bit-for-bit across sessions.</p>
    </div>

    <div class="bento-card">
      <div class="bento-icon">⚡</div>
      <h4>Nix-LD Dynamic Linker</h4>
      <p>Seamless execution of unpatched Linux x86_64 ELF binaries, enabling standard language servers inside NixOS.</p>
    </div>

    <div class="bento-card">
      <div class="bento-icon">🔄</div>
      <h4>5 Tracked Upstreams</h4>
      <p>Automated daily sync merging Superpowers, Karpathy Guidelines, ADHD, Anatomy, and Google.</p>
    </div>

    <div class="bento-card bento-wide">
      <div class="bento-icon">🚀</div>
      <h4>Headless Antigravity 2.0 Host Bridge</h4>
      <p>Windows host process communicates over a low-latency socket with the NixOS language server daemon, completely bypassing heavy Electron IDE host bloat.</p>
      <div class="bento-tags">
        <span>agy2</span>
        <span>JSON-RPC 2.0</span>
        <span>Mirrored Sockets</span>
      </div>
    </div>
  </div>
</section>

<!-- ── Repositories Grid ─────────────────────────────────────────────── -->
<section id="repos" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Modular Repositories</div>
    <h2>Workspace Topology & GitHub Repositories</h2>
    <p class="section-sub">
      The workspace is decoupled into 5 modular repositories orchestrated centrally by the <code>damathryxx64</code> flake:
    </p>
  </div>

  <div class="repos-grid">
    ${STATIONS.map((st, idx) => `
      <div class="repo-card ${idx === 0 ? "active-station-card" : ""}" id="card-${st.id}">
        <div class="repo-card-head">
          <div class="repo-indicator" style="background:${st.color}; box-shadow: 0 0 10px ${st.color}"></div>
          <span class="repo-badge">${st.badge}</span>
          <span class="repo-flake">${st.flakeInput}</span>
        </div>
        <h3 class="repo-title">${st.name}</h3>
        <p class="repo-role">${st.role}</p>
        <p class="repo-desc">${st.desc}</p>
        <div class="repo-meta-box">
          <span class="repo-branch">Branch: <code>${st.branch}</code></span>
          <span class="repo-meta-text">${st.meta}</span>
        </div>
        <div class="repo-files">
          ${st.files.map(f => `<code>${f}</code>`).join(" ")}
        </div>
        <div class="repo-card-foot">
          <button type="button" class="btn-inspect" onclick="jumpToStation(${idx}); window.location.hash = 'rig';">Inspect Rig</button>
          <a href="${st.repoUrl}" target="_blank" rel="noopener noreferrer" class="btn-github">GitHub ↗</a>
        </div>
      </div>
    `).join("")}
  </div>
</section>

<!-- ── Workspace Command Reference ────────────────────────────────────── -->
<section id="commands" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Command Reference</div>
    <h2>Workspace & Agent Task Runners</h2>
    <p class="section-sub">
      Declarative shell commands pre-configured in <code>damathryxx64/modules/packages/default.nix</code>:
    </p>
  </div>

  <div class="table-card">
    <table class="cmd-table">
      <thead>
        <tr>
          <th>Command</th>
          <th>Type</th>
          <th>Action</th>
          <th>Quick Copy</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>dots-validate</code></td>
          <td><span class="badge-type quality">Quality Gate</span></td>
          <td>Full 4-stage pipeline: Alejandra + Statix + Deadnix + flake check</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('dots-validate', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>dots-build</code></td>
          <td><span class="badge-type dryrun">Dry-Run</span></td>
          <td>Dry-builds system derivation with visual closure diff (safe, no switch)</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('dots-build', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>dots-upgrade</code></td>
          <td><span class="badge-type system">System</span></td>
          <td>Validates quality gates, updates all flake inputs, and applies system switch</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('dots-upgrade', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>dots-sync-skills status</code></td>
          <td><span class="badge-type skills">Anti-Drift</span></td>
          <td>Inspects git divergence and flake lock synchronization across all 5 repos</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('dots-sync-skills status', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>refresh-skills</code></td>
          <td><span class="badge-type skills">Skills Sync</span></td>
          <td>Pulls upstreams, purges foreign providers, audits frontmatter, syncs to ~/.gemini/config</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('refresh-skills', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>dots-workspace-pull</code></td>
          <td><span class="badge-type system">Git Pull</span></td>
          <td>Pulls all 5 workspace repos from origin (runs automatically on login via systemd)</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('dots-workspace-pull', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>agy2</code></td>
          <td><span class="badge-type launcher">AI Bridge</span></td>
          <td>Launches Antigravity 2.0 on Windows host connected to NixOS WSL</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('agy2', this)">Copy</button></td>
        </tr>
        <tr>
          <td><code>help-nix</code></td>
          <td><span class="badge-type docs">Quick Docs</span></td>
          <td>Interactive quick reference card for all NixOS dots & AI agent commands</td>
          <td><button type="button" class="tbl-copy-btn" onclick="copyCommand('help-nix', this)">Copy</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
`;

// Additional modern CSS for layout, glassmorphism, responsive cards & typography
const extraCss = `
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --bg-page: #050811;
  --bg-card: rgba(11, 18, 34, 0.75);
  --bg-card-hover: rgba(19, 30, 54, 0.9);
  --bg-subtle: rgba(0, 0, 0, 0.25);
  --bg-code: rgba(0, 0, 0, 0.4);
  --card-border: rgba(255, 255, 255, 0.08);
  --card-border-highlight: rgba(96, 165, 250, 0.5);
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --accent-blue: #60a5fa;
  --accent-emerald: #34d399;
  --accent-purple: #a78bfa;
  --accent-pink: #f472b6;
  --accent-amber: #fbbf24;
  --hero-title-grad: linear-gradient(135deg, #ffffff 30%, #93c5fd 65%, #c084fc 100%);
  --glow-ambient: radial-gradient(ellipse at 50% 0%, rgba(96, 165, 250, 0.18), rgba(167, 139, 250, 0.1) 45%, transparent 75%);
  --mesh-dot: rgba(255, 255, 255, 0.08);
}

[data-theme="light"],
body[data-theme="light"] {
  --bg-page: #f8fafc;
  --bg-card: rgba(255, 255, 255, 0.94);
  --bg-card-hover: rgba(241, 245, 249, 0.98);
  --bg-subtle: rgba(0, 0, 0, 0.04);
  --bg-code: rgba(15, 23, 42, 0.06);
  --card-border: rgba(0, 0, 0, 0.09);
  --card-border-highlight: rgba(37, 99, 235, 0.45);
  --text-primary: #0f172a;
  --text-muted: #334155;
  --text-dim: #64748b;
  --accent-blue: #2563eb;
  --accent-emerald: #059669;
  --accent-purple: #7c3aed;
  --accent-pink: #db2777;
  --accent-amber: #d97706;
  --hero-title-grad: linear-gradient(135deg, #0f172a 30%, #2563eb 65%, #7c3aed 100%);
  --glow-ambient: radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.07) 45%, transparent 75%);
  --mesh-dot: rgba(0, 0, 0, 0.06);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow-x: hidden;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* ── Ambient Background Glow & Fine Mesh ────────────────────────── */
.ambient-glow {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1100px;
  height: 550px;
  background: var(--glow-ambient);
  pointer-events: none;
  z-index: 0;
}

.mesh-grid {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(var(--mesh-dot) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, transparent 85%);
  pointer-events: none;
  z-index: 0;
}

/* ── Top Navigation Bar ─────────────────────────────────────────── */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  background: var(--bg-card);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--card-border);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-size: 15px;
}

.brand-dots {
  color: var(--accent-blue);
  font-family: var(--font-mono);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.nav-links a:hover {
  color: var(--text-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--card-border);
  background: var(--bg-card);
  color: var(--text-primary);
}

.nav-btn:hover {
  border-color: var(--card-border-highlight);
  background: var(--bg-card-hover);
}

.nav-btn.primary {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border: none;
  color: #fff;
}

.nav-btn.primary:hover {
  filter: brightness(1.1);
}

/* ── Container & Hero ───────────────────────────────────────────── */
.main-layout {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 100px;
}

.hero-banner {
  text-align: center;
  padding: 44px 0 36px;
}

.hero-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
  border-radius: 9999px;
  background: rgba(96, 165, 250, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.28);
  color: var(--accent-blue);
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  margin-bottom: 22px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
  animation: live-blink 2s ease-in-out infinite;
}

@keyframes live-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.hero-banner h1 {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.035em;
  margin: 0 0 16px;
  line-height: 1.15;
  background: var(--hero-title-grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-lead {
  font-size: 17.5px;
  color: var(--text-muted);
  max-width: 760px;
  margin: 0 auto 30px;
  line-height: 1.6;
}

.hero-stat-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
}

.hero-stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  font-size: 12.5px;
  color: var(--text-muted);
  backdrop-filter: blur(8px);
}

.hero-stat-tag strong {
  color: var(--text-primary);
}

/* ── Anatomy Interactive Rig Card ──────────────────────────────── */
.rig-section {
  margin-bottom: 72px;
}

.rig-header {
  text-align: center;
  margin-bottom: 24px;
}

.rig-badge {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--accent-emerald);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.rig-header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.rig-sub {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0 auto;
  max-width: 660px;
}

.station-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.station-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
  backdrop-filter: blur(8px);
}

.station-pill:hover {
  background: var(--bg-card-hover);
  border-color: var(--card-border-highlight);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.station-pill.active {
  background: rgba(96, 165, 250, 0.14);
  border-color: var(--accent-blue);
  color: var(--text-primary);
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.25);
}

.pill-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--bg-subtle);
  font-size: 10px;
  color: var(--text-dim);
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pill-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--text-dim);
}

.station-pill.active .pill-badge {
  background: rgba(96, 165, 250, 0.2);
  color: var(--accent-blue);
}

.iso-card {
  position: relative;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  box-shadow: 0 24px 48px -18px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.iso-card-glow-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-blue) 40%, var(--accent-purple) 60%, transparent);
}

.iso-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--card-border);
}

.iso-fig {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
}

.iso-title {
  margin: 0;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.iso-keys-hint {
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.iso-stage {
  padding: 24px 16px;
  cursor: grab;
  outline: none;
}

.iso-stage:active {
  cursor: grabbing;
}

/* ── Mechanical SVG Specific Animations ─────────────────────────── */
.tower-beacon-core {
  fill: #60a5fa;
  filter: drop-shadow(0 0 6px #60a5fa);
}

.tower-beacon-glow {
  fill: none;
  stroke: #93c5fd;
  stroke-width: 1px;
  animation: beacon-pulse 2s ease-out infinite;
}

@keyframes beacon-pulse {
  0% { r: 3px; opacity: 1; stroke-width: 1.5px; }
  100% { r: 16px; opacity: 0; stroke-width: 0.2px; }
}

.crt-wave-line {
  fill: none;
  stroke: #34d399;
  stroke-width: 0.8px;
  opacity: 0.9;
  filter: drop-shadow(0 0 4px #34d399);
  animation: crt-flicker 4s linear infinite;
}

@keyframes crt-flicker {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.75; }
  52% { opacity: 1; }
  54% { opacity: 0.7; }
}

.active-station-halo {
  fill: none;
  stroke-width: 1.5px;
  animation: halo-radiate 1.8s ease-out infinite;
}

@keyframes halo-radiate {
  0% { rx: 14px; ry: 7px; opacity: 1; }
  100% { rx: 28px; ry: 14px; opacity: 0; }
}

.iso-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--card-border);
  background: var(--bg-subtle);
}

.iso-hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.readout-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.iso-readout {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-blue);
}

.iso-subreadout {
  font-size: 11.5px;
  color: var(--text-dim);
}

.iso-keys {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin: 16px 0 24px;
}

.iso-key {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.iso-swatch {
  width: 14px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.iso-swatch[data-swatch="lit"] { background: #fff; box-shadow: 0 0 6px #fff; }
.iso-swatch[data-swatch="raised"] { background: #94a3b8; }
.iso-swatch[data-swatch="shaded"] { background: #475569; }

/* ── Live Telemetry Dashboard ───────────────────────────────────── */
.telemetry-dashboard {
  margin-top: 24px;
}

.telemetry-card {
  position: relative;
  padding: 24px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.telemetry-card-accent {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--accent-blue), var(--accent-purple));
}

.telemetry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.telemetry-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.telemetry-badge {
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(96, 165, 250, 0.15);
  color: var(--accent-blue);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
}

.telemetry-card h4 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.telemetry-role {
  color: var(--text-muted);
  font-size: 13px;
}

.repo-direct-btn {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  border-radius: 6px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.repo-direct-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.telemetry-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

.telemetry-specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 8px;
  background: var(--bg-subtle);
  border: 1px solid var(--card-border);
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.spec-label {
  font-size: 10.5px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.spec-val {
  font-size: 12.5px;
  font-family: var(--font-mono);
  color: var(--text-primary);
}

.telemetry-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--card-border);
}

.telemetry-files-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.files-label {
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.files-list code {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--accent-emerald);
}

.cmd-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cmd-copy-btn:hover {
  border-color: var(--accent-blue);
  background: rgba(96, 165, 250, 0.1);
}

.cmd-copy-btn.copied {
  background: rgba(52, 211, 153, 0.15);
  border-color: var(--accent-emerald);
  color: var(--accent-emerald);
}

/* ── Section Titles ─────────────────────────────────────────────── */
.docs-section {
  margin-top: 80px;
}

.section-title-wrap {
  text-align: center;
  margin-bottom: 36px;
}

.section-badge {
  display: inline-block;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-blue);
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.section-title-wrap h2 {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}

.section-sub {
  font-size: 15px;
  color: var(--text-muted);
  max-width: 680px;
  margin: 0 auto;
}

/* ── Visual Form 2: 2.5D Exploded Architecture Stack ─────────────── */
.stack-3d-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  perspective: 900px;
  max-width: 860px;
  margin: 0 auto;
}

.stack-plane {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
  backdrop-filter: blur(12px);
}

.stack-plane:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.3);
  border-color: var(--card-border-highlight);
}

.plane-tag {
  font-size: 10.5px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-blue);
  min-width: 140px;
}

.plane-content {
  flex: 1;
  padding: 0 20px;
}

.plane-content h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
}

.plane-content p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.plane-badge {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg-subtle);
  color: var(--accent-purple);
}

.stack-connector {
  text-align: center;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  padding: 2px 0;
}

/* ── Visual Form 3: Network Topology DAG ────────────────────────── */
.dag-container {
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  padding: 24px;
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.dag-svg {
  display: block;
  width: 100%;
  height: auto;
}

.dag-edge {
  fill: none;
  stroke: var(--card-border-highlight);
  stroke-width: 1.6px;
  stroke-dasharray: 6 6;
  opacity: 0.75;
  animation: dag-flow 2s linear infinite;
}

@keyframes dag-flow {
  to { stroke-dashoffset: -36; }
}

.dag-node {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.dag-node:hover {
  transform: scale(1.05);
}

.dag-node-title {
  fill: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
}

.dag-node-sub {
  fill: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.node-halo-pulse {
  fill: none;
  stroke: var(--accent-blue);
  stroke-width: 1px;
  animation: node-pulse 2.2s ease-out infinite;
}

@keyframes node-pulse {
  0% { r: 38px; opacity: 1; }
  100% { r: 56px; opacity: 0; }
}

/* ── Visual Form 4: Interactive TUI Terminal Simulator ──────────── */
.tui-window {
  border-radius: 12px;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  max-width: 860px;
  margin: 0 auto;
}

.tui-chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #111827;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tui-dots {
  display: flex;
  gap: 6px;
}

.tui-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tui-dot-red { background: #ef4444; }
.tui-dot-yellow { background: #f59e0b; }
.tui-dot-green { background: #10b981; }

.tui-tabs {
  display: flex;
  gap: 8px;
}

.tui-tab {
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid transparent;
  color: #94a3b8;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tui-tab:hover {
  color: #fff;
}

.tui-tab.active {
  background: rgba(96, 165, 250, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.tui-screen {
  padding: 20px;
  min-height: 240px;
  max-height: 320px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  color: #cbd5e1;
}

.tui-line {
  margin-bottom: 3px;
}

.tui-prompt { color: #60a5fa; font-weight: 700; }
.tui-success { color: #34d399; font-weight: 700; }
.tui-ok { color: #34d399; font-weight: 600; }
.tui-synced { color: #a78bfa; font-weight: 600; }

/* ── Visual Form 5: Modern Bento Grid Showcase ──────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.bento-card {
  padding: 22px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, border-color 0.2s ease;
  backdrop-filter: blur(12px);
}

.bento-card:hover {
  transform: translateY(-2px);
  border-color: var(--card-border-highlight);
}

.bento-wide {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .bento-wide { grid-column: span 1; }
}

.bento-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.bento-card h4 {
  margin: 0 0 6px;
  font-size: 16.5px;
  font-weight: 700;
}

.bento-card p {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.bento-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bento-tags span {
  font-size: 10.5px;
  font-family: var(--font-mono);
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--accent-blue);
}

/* ── Repositories Grid ──────────────────────────────────────────── */
.repos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 20px;
}

.repo-card {
  padding: 24px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  transition: all 0.22s ease;
  backdrop-filter: blur(12px);
}

.repo-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--card-border-highlight);
  transform: translateY(-3px);
  box-shadow: 0 16px 32px -12px rgba(0, 0, 0, 0.25);
}

.repo-card.active-station-card {
  border-color: var(--accent-blue);
  box-shadow: 0 0 25px rgba(96, 165, 250, 0.2);
}

.repo-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.repo-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.repo-badge {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--bg-subtle);
  font-family: var(--font-mono);
  color: var(--text-dim);
}

.repo-flake {
  font-size: 10.5px;
  margin-left: auto;
  font-family: var(--font-mono);
  color: var(--accent-purple);
}

.repo-title {
  margin: 0 0 4px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.repo-role {
  margin: 0 0 10px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--accent-blue);
}

.repo-desc {
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0 0 14px;
  flex-grow: 1;
}

.repo-meta-box {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--bg-subtle);
  margin-bottom: 14px;
  font-size: 11.5px;
}

.repo-branch code {
  color: var(--accent-emerald);
  font-family: var(--font-mono);
}

.repo-meta-text {
  display: block;
  color: var(--text-dim);
  margin-top: 4px;
  font-size: 11px;
}

.repo-files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
}

.repo-files code {
  font-size: 10.5px;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--text-muted);
}

.repo-card-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
}

.btn-inspect {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-inspect:hover {
  background: rgba(96, 165, 250, 0.15);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.btn-github {
  padding: 8px 16px;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-github:hover {
  border-color: var(--text-muted);
  background: var(--bg-card-hover);
}

/* ── Commands Table ─────────────────────────────────────────────── */
.table-card {
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  overflow-x: auto;
  backdrop-filter: blur(14px);
}

.cmd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.cmd-table th {
  padding: 14px 20px;
  text-align: left;
  font-size: 11px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  color: var(--text-dim);
  border-bottom: 1px solid var(--card-border);
  background: var(--bg-subtle);
}

.cmd-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-muted);
}

.cmd-table tr:last-child td {
  border-bottom: none;
}

.cmd-table tr:hover td {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.cmd-table code {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-primary);
  font-weight: 600;
}

.badge-type {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--font-mono);
}

.badge-type.quality { background: rgba(96, 165, 250, 0.15); color: var(--accent-blue); }
.badge-type.dryrun { background: rgba(244, 114, 182, 0.15); color: var(--accent-pink); }
.badge-type.system { background: rgba(251, 191, 36, 0.15); color: var(--accent-amber); }
.badge-type.skills { background: rgba(52, 211, 153, 0.15); color: var(--accent-emerald); }
.badge-type.launcher { background: rgba(167, 139, 250, 0.15); color: var(--accent-purple); }
.badge-type.docs { background: var(--bg-subtle); color: var(--text-muted); }

.tbl-copy-btn {
  padding: 4px 12px;
  border-radius: 5px;
  background: var(--bg-subtle);
  border: 1px solid var(--card-border);
  color: var(--text-dim);
  font-size: 11px;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.15s ease;
}

.tbl-copy-btn:hover {
  background: rgba(96, 165, 250, 0.15);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.tbl-copy-btn.copied {
  background: rgba(52, 211, 153, 0.15);
  border-color: var(--accent-emerald);
  color: var(--accent-emerald);
}

/* ── Toast Notification ─────────────────────────────────────────── */
.toast-notification {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  padding: 10px 20px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid var(--accent-blue);
  color: #fff;
  font-size: 13px;
  font-family: var(--font-mono);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(96, 165, 250, 0.4);
  backdrop-filter: blur(12px);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  opacity: 0;
  pointer-events: none;
  z-index: 1000;
}

.toast-notification.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* ── Footer ─────────────────────────────────────────────────────── */
.docs-footer {
  text-align: center;
  margin-top: 80px;
  padding-top: 36px;
  border-top: 1px solid var(--card-border);
  color: var(--text-dim);
  font-size: 13px;
}

.docs-footer p {
  margin: 6px 0;
}

.docs-footer a {
  color: var(--accent-blue);
  text-decoration: none;
}

.docs-footer a:hover {
  text-decoration: underline;
}

/* ── Responsive Mobile Media Queries ────────────────────────────── */
@media (max-width: 768px) {
  .hero-banner h1 { font-size: 32px; }
  .hero-lead { font-size: 15px; }
  .nav-links { display: none; }
  .iso-foot { flex-direction: column; align-items: flex-start; }
  .readout-box { align-items: flex-start; }
  .stack-plane { flex-direction: column; align-items: flex-start; gap: 8px; }
  .plane-content { padding: 0; }
}
`;

// Generate the standalone HTML page
const htmlPage = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Antigravity 2.0 & NixOS Workspace Architecture</title>
  <style>
    ${k.ISO_CSS}
    ${extraCss}
  </style>
</head>
<body class="iso" data-theme="dark">
  <div class="ambient-glow"></div>
  <div class="mesh-grid"></div>

  <!-- Top Glass Navigation Bar -->
  <header class="top-nav">
    <div class="nav-brand">
      <span class="brand-icon">❄️</span>
      <span>damathryxx64 <span class="brand-dots">/</span> nixos-workspace</span>
    </div>
    <nav class="nav-links">
      <a href="#rig">Anatomy Rig</a>
      <a href="#stack">2.5D Stack</a>
      <a href="#topology">Topology DAG</a>
      <a href="#terminal">Terminal Console</a>
      <a href="#bento">Bento</a>
      <a href="#repos">Repositories</a>
    </nav>
    <div class="nav-actions">
      <a href="https://github.com/shanmukha-sai-chinnam/damathryxx64" target="_blank" rel="noopener noreferrer" class="nav-btn primary">
        <span>GitHub</span> ↗
      </a>
      <button type="button" class="nav-btn" onclick="toggleTheme()" aria-label="Toggle Theme">
        <span>🌓</span>
        <span id="theme-btn-text">Light Mode</span>
      </button>
    </div>
  </header>

  <main class="main-layout">
    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="hero-badge-pill">
        <span class="live-dot"></span>
        <span>Pure NixOS-WSL · Zero Drift · Antigravity 2.0</span>
      </div>
      <h1>NixOS + Autonomous Agents + Antigravity 2.0</h1>
      <p class="hero-lead">
        A pure, declarative NixOS-WSL development container orchestrated by the <code>damathryxx64</code> flake, powering Google Antigravity 2.0 and a multi-upstream AI skills ecosystem.
      </p>
      <div class="hero-stat-row">
        <div class="hero-stat-tag">📦 <strong>5</strong> Repositories Synced</div>
        <div class="hero-stat-tag">🧠 <strong>31</strong> Active Agent Skills</div>
        <div class="hero-stat-tag">🛡️ <strong>5-Stage</strong> Zero-Drift Gates</div>
        <div class="hero-stat-tag">🚀 <strong>Headless</strong> WSL2 Bridge</div>
      </div>
    </section>

    <!-- Visual Form 1: Interactive Anatomy Rig -->
    ${cardHtml}

    <!-- Visual Forms 2, 3, 4, 5 & Architecture Breakdown -->
    ${extraDocsHtml}

    <footer class="docs-footer">
      <p>Crafted with the <strong>Anatomy</strong> isometric skill on <strong>NixOS-WSL</strong> · Deployed to GitHub Pages</p>
      <p>Orchestrated by <a href="https://github.com/shanmukha-sai-chinnam/damathryxx64" target="_blank">shanmukha-sai-chinnam/damathryxx64</a> · Single Source of Truth</p>
    </footer>
  </main>

  <!-- Interactive Floating Toast -->
  <div id="toast" class="toast-notification"></div>

  <script>
    ${clientScript}
  </script>
</body>
</html>
`;

const OUT_FILE = join(DOCS_DIR, "index.html");
writeFileSync(OUT_FILE, htmlPage, "utf8");
console.log(`✓ Successfully generated multi-shape page: ${OUT_FILE} (${Math.round(htmlPage.length / 1024)} KB)`);
