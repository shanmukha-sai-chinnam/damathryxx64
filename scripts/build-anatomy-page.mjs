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

const WIDTH = 980;
const HEIGHT = 550;

// World Dimensions
const PLATE = { x: -175, y: -90, w: 350, d: 180, r: 12 };
const PLATE_H = 14;
const FOOT_H = 6;

// Rail & Gantry bounds
const RAIL_FROM = -135;
const RAIL_TO = 135;
const RAIL_Y1 = -26;
const RAIL_Y2 = 26;

// Central Tower: Antigravity 2.0 Spindle Column
const TOWER = [0, -52];
const TOWER_R = 24;
const TOWER_H = 120;
const CRT_Z = 64;
const CRT_H = 42;
const CRT_W = 60;

// 5 Stations along X (mapping to the 5 managed repositories)
const STATIONS = [
  {
    id: "damathryxx64",
    name: "damathryxx64",
    role: "Central Flake Driver",
    x: -110,
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
    x: -55,
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
    x: 55,
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
    x: 110,
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

const CARRIAGE_W = 46;
const CARRIAGE_D = 66;
const CARRIAGE_H = 10;
const REACH = [STATIONS[0].x, STATIONS[STATIONS.length - 1].x];

// Camera setup: 44° Azimuth for optimal isometric depth & long side visibility
const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [TOWER[0] - TOWER_R, TOWER[1] - TOWER_R, TOWER_H + 10],
    [TOWER[0] + TOWER_R, TOWER[1] + TOWER_R, TOWER_H + 10],
    [RAIL_FROM, RAIL_Y1, 40],
    [RAIL_TO, RAIL_Y2, 40],
  ],
  WIDTH,
  HEIGHT,
  { pad: 32, azimuth: 44, elevation: 32 }
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) =>
  [...points].sort(
    (a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)
  );

// ── 1. Base Plate & Feet (NixOS Foundation) ─────────────────────────────────
function buildPlate() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);

  // Leveling feet
  for (const [x, y] of byDepth(k.corners(PLATE, 26))) {
    out.push(S(k.cylinder(x, y, 9, -PLATE_H - FOOT_H, 2.2, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7.2, -PLATE_H - FOOT_H + 2.2, FOOT_H - 2.2, P, 28), { tone: "mid" }));
    out.push(L(k.knurl(x, y, 7.2, -PLATE_H - FOOT_H + 2.2, -PLATE_H, 24, P), { tone: "lo" }));
  }

  // Steel bed slab
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 10, 2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 6), 0, P), { tone: "lo" }));

  // Corner precision screws
  const screws = k.corners(PLATE, 12);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 3, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.6 }));

  // Vernier Scale front strip with millimeter tick marks
  const strip = { x: -145, y: PLATE.y + PLATE.d - 16, w: 290, d: 8, r: 1.5 };
  out.push(S(k.slabOf(strip, 0, 1.2, P, 1.5, 0.4), { tone: "hi" }));
  const ticks = k.topTicks(strip.x + 10, strip.x + strip.w - 10, 5, 5, strip.y + strip.d, 1.2, [-2, -4], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "hi" }));

  // Engraved front plate title
  const titleMatrix = k.topMatrix([-90, strip.y - 12], 0, P);
  const engraved = k.faceTextSvg(titleMatrix, "NIXOS-WSL x86_64 PURE SYSTEM FOUNDATION", { size: 3.2, tone: "lo" });
  if (engraved) out.push(engraved);

  // Animated Telemetry Circuit Traces running from Tower to each Station
  for (const st of STATIONS) {
    const sx = st.x;
    const p0 = at([0, -28, 0.4]);
    const p1 = at([sx * 0.45, -22, 0.4]);
    const p2 = at([sx, -18, 0.4]);
    const p3 = at([sx, -15, 0.4]);
    const traceD = `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L${p3[0].toFixed(1)} ${p3[1].toFixed(1)}`;
    out.push(`<path class="telemetry-circuit-line" d="${traceD}" style="stroke:${st.color};" />`);
  }

  return out.join("");
}

// ── 2. Guide Rails & Bushings ───────────────────────────────────────────────
function buildRails() {
  const out = [];
  const railR = 3.6;
  const railZ = 14;

  for (const ry of [RAIL_Y1, RAIL_Y2]) {
    // Left & Right Mount Pillows
    out.push(S(k.slabOf({ x: RAIL_FROM - 12, y: ry - 9, w: 16, d: 18, r: 2 }, 0, 20, P, 2, 0.8), { tone: "lo" }));
    out.push(S(k.slabOf({ x: RAIL_TO - 4, y: ry - 9, w: 16, d: 18, r: 2 }, 0, 20, P, 2, 0.8), { tone: "lo" }));

    // Mount bolts
    out.push(D([at([RAIL_FROM - 4, ry - 5, 20]), at([RAIL_FROM - 4, ry + 5, 20])], { size: 0.6 }));
    out.push(D([at([RAIL_TO + 4, ry - 5, 20]), at([RAIL_TO + 4, ry + 5, 20])], { size: 0.6 }));

    // Rail shaft
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const rx = RAIL_FROM + (i / segments) * (RAIL_TO - RAIL_FROM);
      out.push(L(k.lineOnTop([rx, ry - railR], [rx, ry + railR], railZ, P), { tone: "lo" }));
    }
    out.push(S(k.slabOf({ x: RAIL_FROM, y: ry - railR, w: RAIL_TO - RAIL_FROM, d: railR * 2, r: railR }, railZ - railR, railR * 2, P, 1, 0.4), { tone: "hi" }));
  }

  return out.join("");
}

// ── 3. Central Telemetry Spindle Tower (Antigravity 2.0 Engine) ─────────────
function buildCentralTower() {
  const out = [];
  const [tx, ty] = TOWER;

  // Base flange plate
  out.push(S(k.slabOf({ x: tx - 32, y: ty - 32, w: 64, d: 48, r: 6 }, 0, 6, P, 6, 1), { tone: "lo" }));
  out.push(D([[tx - 26, ty - 26], [tx + 26, ty - 26], [tx - 26, ty + 12], [tx + 26, ty + 12]].map(([x, y]) => at([x, y, 6])), { size: 0.5 }));

  // Main cylindrical turned column
  out.push(S(k.cylinder(tx, ty, TOWER_R, 6, 42, P, 36), { tone: "mid" }));
  out.push(L(k.knurl(tx, ty, TOWER_R, 20, 32, 48, P), { tone: "lo" }));

  // Flanged Collar
  out.push(S(k.cylinder(tx, ty, TOWER_R + 3, 48, 6, P, 36), { tone: "hi" }));

  // Intermediate Column
  out.push(S(k.cylinder(tx, ty, TOWER_R - 2, 54, 30, P, 36), { tone: "mid" }));

  // Telemetry Display Housing (facing viewer)
  const displayBox = { x: tx - CRT_W / 2, y: ty + 10, w: CRT_W, d: 14, r: 3 };
  out.push(S(k.slabOf(displayBox, CRT_Z, CRT_H, P, 3, 0.8), { tone: "hi" }));
  const screenFace = { x: displayBox.x + 4, y: displayBox.y + displayBox.d - 0.5, w: displayBox.w - 8, d: 1, r: 2 };
  out.push(S(k.slabOf(screenFace, CRT_Z + 4, CRT_H - 8, P, 2, 0.4), { tone: "lo", crease: "none" }));

  // CRT Screen Oscilloscope Waveform Trace
  const screenX1 = -22, screenX2 = 22, screenY = ty + 24, screenZ = CRT_Z + 20;
  const wavePts = [];
  for (let wx = screenX1; wx <= screenX2; wx += 2) {
    const norm = (wx - screenX1) / (screenX2 - screenX1);
    const waveZ = screenZ + Math.sin(norm * Math.PI * 4) * 4.5;
    wavePts.push(at([wx, screenY, waveZ]));
  }
  const waveD = wavePts.map((p, idx) => `${idx ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");
  out.push(`<path class="crt-wave-line" d="${waveD}" />`);

  // Cap with Optical Beacon Ring
  out.push(S(k.cylinder(tx, ty, TOWER_R - 4, 84, 18, P, 32), { tone: "hi" }));
  out.push(S(k.cylinder(tx, ty, 6, 102, 16, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(tx, ty, 4, 118, 4, P, 20), { tone: "hi" }));

  // Pulsing Optical Beacon Summit
  const beaconPt = at([tx, ty, 122]);
  out.push(`<circle cx="${beaconPt[0].toFixed(1)}" cy="${beaconPt[1].toFixed(1)}" r="3" class="tower-beacon-core" />`);
  out.push(`<circle cx="${beaconPt[0].toFixed(1)}" cy="${beaconPt[1].toFixed(1)}" r="6" class="tower-beacon-glow" />`);

  return out.join("");
}

// ── 4. The 5 Workspace Stations ──────────────────────────────────────────────
function buildStations() {
  const out = [];

  STATIONS.forEach((st, idx) => {
    const sx = st.x;
    const sy = 0;

    // Station base pad
    const pad = { x: sx - 16, y: -16, w: 32, d: 32, r: 3 };
    out.push(S(k.slabOf(pad, 0, 4, P, 3, 0.6), { tone: "lo" }));

    // Station Cam / Turret / Cylinder with true height
    out.push(S(k.cylinder(sx, sy, 11, 4, st.camH, P, 28), { tone: "mid" }));
    out.push(L(k.knurl(sx, sy, 11, 4 + st.camH - 6, 4 + st.camH, 28, P), { tone: "lo" }));

    // Top ring & central contact bead
    out.push(L(k.ring(sx, sy, 8, 4 + st.camH, P, 20), { tone: "hi" }));
    out.push(D([at([sx, sy, 4 + st.camH])], { size: 0.8, tone: "hi" }));

    // Station engraved badge label
    const label = `S${idx + 1}`;
    const stationMatrix = k.topMatrix([sx - 4, -18], 4, P);
    const txt = k.faceTextSvg(stationMatrix, label, { size: 2.8, tone: "mid" });
    if (txt) out.push(txt);
  });

  // Dynamic Halo Ellipse indicating active probed station
  out.push(`<g id="active-halo-group">
    <ellipse id="active-halo-ellipse" cx="0" cy="0" rx="20" ry="10" class="active-station-halo" />
  </g>`);

  return out.join("");
}

// ── 5. Moving Carriage & Sensor Plunger ───────────────────────────────────────
function buildMovingCarriage() {
  const out = [];

  out.push(`<g id="carriage">`);
  // Main carriage block
  const block = { x: -CARRIAGE_W / 2, y: -CARRIAGE_D / 2, w: CARRIAGE_W, d: CARRIAGE_D, r: 4 };
  out.push(S(k.slabOf(block, 4, CARRIAGE_H, P, 4, 1), { tone: "hi" }));

  // Twin linear ball bushings
  for (const by of [RAIL_Y1, RAIL_Y2]) {
    out.push(S(k.slabOf({ x: -CARRIAGE_W / 2 - 2, y: by - 6, w: CARRIAGE_W + 4, d: 12, r: 2 }, 8, 12, P, 2, 0.6), { tone: "mid" }));
    out.push(L(k.knurl(-CARRIAGE_W / 2 + 6, by, 5, 9, 19, 16, P), { tone: "lo" }));
  }

  // Dial Gauge Housing
  const gaugeD = 18;
  const gaugeZ = 4 + CARRIAGE_H + 4;
  out.push(S(k.cylinder(0, -12, gaugeD, gaugeZ, 8, P, 32), { tone: "mid" }));
  out.push(L(k.ring(0, -12, gaugeD, gaugeZ + 8, P, 32), { tone: "hi" }));
  out.push(L(k.ring(0, -12, gaugeD - 2.5, gaugeZ + 8, P, 32), { tone: "lo" }));

  // Dial face radial tick marks
  const dialTicks = k.radialTicks(0, -12, gaugeD - 3, 24, 6, gaugeZ + 8, [1.5, 3], P);
  out.push(L(dialTicks.minor, { tone: "lo" }));
  out.push(L(dialTicks.major, { tone: "hi" }));

  // Moving needle element
  out.push(`<path id="needle" class="iso-line" data-tone="lit" d="${k.lineOnTop([0, -12], [0, -22], gaugeZ + 8, P)}"/>`);

  // Sensor Plunger Stem
  out.push(`<g id="plunger">`);
  out.push(S(k.cylinder(0, 0, 4.5, 0, 24, P, 20), { tone: "hi" }));
  out.push(S(k.cylinder(0, 0, 2.2, -6, 6, P, 16), { tone: "lo" }));
  // Ruby stylus ball tip
  out.push(S(k.cylinder(0, 0, 3.2, -8, 2.5, P, 16), { tone: "lit" }));
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
  const [dx, dy] = [0, -12];
  const dz = BASE_H + 8;
  const angle = turns * Math.PI * 2 - Math.PI / 2;
  const len = 11;
  const nx = dx + Math.cos(angle) * len;
  const ny = dy + Math.sin(angle) * len;
  return lineOnTop([dx, dy], [nx, ny], dz);
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
  // Update nav pills
  document.querySelectorAll(".station-pill").forEach((btn, i) => {
    btn.classList.toggle("active", i === idx);
  });

  // Update readouts
  const title = "[" + st.name + "] " + st.role;
  const detail = st.desc + " · " + st.meta;
  if (readout.textContent !== title) {
    readout.textContent = title;
    subReadout.textContent = detail;
  }

  // Update active SVG halo
  if (haloEllipse) {
    const center = iso([st.x, 0, 4]);
    haloEllipse.setAttribute("cx", center[0].toFixed(1));
    haloEllipse.setAttribute("cy", center[1].toFixed(1));
    haloEllipse.style.stroke = st.color;
    haloEllipse.style.filter = "drop-shadow(0 0 10px " + st.color + ")";
  }

  // Update telemetry dashboard card
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

  // Highlight repo card in grid
  document.querySelectorAll(".repo-card").forEach((card, i) => {
    card.classList.toggle("active-station-card", i === idx);
  });
}

function draw() {
  carriage.setAttribute("transform", translateAlong([currentX, 0, 0]));
  plunger.setAttribute("transform", translateAlong([0, 0, BASE_H + tip.at]));
  needle.setAttribute("d", needleAt(currentX / 28));

  // Determine active station
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

// Intersection observer for animation pause/play
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

// Keyboard number shortcuts (1-5 to switch stations, T for theme, Space for pause/tour)
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

// Initial draw
draw();
updateStationTelemetry(STATIONS[0], 0);

// Restore theme from localStorage
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
    <div class="rig-badge">Interactive Test Rig · Anatomy Isometric Engine</div>
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
    <div class="iso-key"><span class="iso-swatch" data-swatch="raised"></span><span>Precision Guide Rails · Dual hardened steel bushings with moving carriage</span></div>
    <div class="iso-key"><span class="iso-swatch" data-swatch="shaded"></span><span>Station Cams · damathryxx64, skills, NixOS-WSL, superpowers, clamav-scanner</span></div>
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

<!-- ── System Architecture Deep Dive with Interactive Tabs ────────────── -->
<section id="architecture" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">NixOS-WSL Architecture</div>
    <h2>Modular System Architecture</h2>
    <p class="section-sub">
      How declarative NixOS modules, autonomous agent runtimes, and system services integrate without host pollution:
    </p>
  </div>

  <!-- Interactive Architecture Tabs -->
  <div class="arch-tabs-container">
    <div class="arch-tab-nav">
      <button type="button" class="arch-tab-btn active" data-tab="modules" onclick="switchTab('modules')">
        <span class="tab-icon">⚙️</span>
        <span>System Modules</span>
      </button>
      <button type="button" class="arch-tab-btn" data-tab="devshells" onclick="switchTab('devshells')">
        <span class="tab-icon">💻</span>
        <span>Developer Shells</span>
      </button>
      <button type="button" class="arch-tab-btn" data-tab="skills" onclick="switchTab('skills')">
        <span class="tab-icon">🧠</span>
        <span>AI Agent Skills Hub</span>
      </button>
      <button type="button" class="arch-tab-btn" data-tab="bridge" onclick="switchTab('bridge')">
        <span class="tab-icon">🌉</span>
        <span>Antigravity 2.0 Bridge</span>
      </button>
    </div>

    <!-- Tab 1: System Modules -->
    <div class="arch-tab-pane active" id="pane-modules">
      <div class="arch-flow-diagram">
        <div class="flow-col">
          <div class="flow-card driver-card">
            <span class="flow-pill">Central Driver</span>
            <h4>flake.nix</h4>
            <p>Pins exact nixpkgs revisions, system configurations (<code>nixosConfigurations.nixos</code>), development shells, and formatter.</p>
            <code>/home/damathryxx64/repositories/damathryxx64/</code>
          </div>
        </div>
        <div class="flow-arrow">➔</div>
        <div class="flow-col wide">
          <div class="flow-card core-card">
            <span class="flow-pill">System Core</span>
            <h4>modules/configuration.nix</h4>
            <p>Modular NixOS orchestrator importing domain modules:</p>
          </div>
          <div class="flow-subgrid">
            <div class="flow-mini-card">
              <h5>modules/ai/</h5>
              <p>Antigravity CLI, declarative skills synchronizer (<code>skills.nix</code>), <code>agy2</code> Windows bridge</p>
            </div>
            <div class="flow-mini-card">
              <h5>modules/mcp/</h5>
              <p>Native Model Context Protocol servers (mcp-nixos, git, github, typesafe, sequential-thinking)</p>
            </div>
            <div class="flow-mini-card">
              <h5>modules/packages/</h5>
              <p>Declarative pipeline runners (dots-validate, dots-build, dots-sync-skills, dots-workspace-sync)</p>
            </div>
            <div class="flow-mini-card">
              <h5>modules/development/</h5>
              <p>Toolchains (Node 22, Python 3.12, GCC, Clang, nixd language server, nix-ld)</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Developer Shells -->
    <div class="arch-tab-pane" id="pane-devshells">
      <div class="devshell-grid">
        <div class="devshell-card">
          <div class="devshell-badge">Default Toolchain</div>
          <h4>nix develop .#default</h4>
          <p>Full authoring toolchain: Alejandra, Statix, Deadnix, nh, nix-tree, manix, nixd, git.</p>
          <code>nix develop .#default</code>
        </div>
        <div class="devshell-card">
          <div class="devshell-badge">Python 3.12</div>
          <h4>nix develop .#python</h4>
          <p>Isolated Python 3.12 runtime with uv, pip, virtualenv, and data analysis packages.</p>
          <code>nix develop .#python</code>
        </div>
        <div class="devshell-card">
          <div class="devshell-badge">Cloud & DevOps</div>
          <h4>nix develop .#devops</h4>
          <p>DevOps toolchain: AWS CLI, Terraform, Docker, Kubernetes, Helm, Grafana agent.</p>
          <code>nix develop .#devops</code>
        </div>
        <div class="devshell-card">
          <div class="devshell-badge">Typography & CV</div>
          <h4>nix develop .#resume</h4>
          <p>Resume authoring environment with Typst, XeLaTeX, fonttools, and PDF compilers.</p>
          <code>nix develop .#resume</code>
        </div>
      </div>
    </div>

    <!-- Tab 3: AI Agent Skills Hub -->
    <div class="arch-tab-pane" id="pane-skills">
      <div class="skills-showcase">
        <div class="skills-banner">
          <h4>Unified Multi-Upstream Skills Monorepo</h4>
          <p>
            Tracks 5 upstream remotes (Superpowers, Karpathy Guidelines, ADHD, Anatomy, Google) with an automated daily sync and rewrite engine.
          </p>
        </div>
        <div class="skills-tags-grid">
          <div class="skill-category">
            <h5>NixOS & Systems</h5>
            <div class="skill-pill-list">
              <span class="skill-tag">nixos-wsl</span>
              <span class="skill-tag">nix-flake-management</span>
              <span class="skill-tag">nix-code-audit</span>
              <span class="skill-tag">nixos-system-rebuild</span>
              <span class="skill-tag">windows-wsl-host-bridge</span>
            </div>
          </div>
          <div class="skill-category">
            <h5>Behavior & Execution</h5>
            <div class="skill-pill-list">
              <span class="skill-tag">karpathy-guidelines</span>
              <span class="skill-tag">autonomous-execution</span>
              <span class="skill-tag">anti-slop-writing</span>
              <span class="skill-tag">verification-before-completion</span>
              <span class="skill-tag">outcome-driven-reporting</span>
            </div>
          </div>
          <div class="skill-category">
            <h5>Anatomy & Graphics</h5>
            <div class="skill-pill-list">
              <span class="skill-tag">anatomy</span>
              <span class="skill-tag">iso-kit</span>
              <span class="skill-tag">generative_ui</span>
              <span class="skill-tag">typesafe-ai</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Antigravity 2.0 Bridge -->
    <div class="arch-tab-pane" id="pane-bridge">
      <div class="bridge-grid">
        <div class="bridge-card">
          <div class="bridge-header">
            <span class="bridge-tag">Legacy Approach (IDE Overhead)</span>
            <h3>Heavy Host IDE</h3>
          </div>
          <ul class="bridge-list negative">
            <li>✕ Heavy Electron memory footprint on Windows host</li>
            <li>✕ Imperative plugin and extension drift</li>
            <li>✕ Hardcoded Windows paths leaking into Linux projects</li>
            <li>✕ Inconsistent CLI environments and terminal latency</li>
          </ul>
        </div>

        <div class="bridge-card featured">
          <div class="bridge-header">
            <span class="bridge-tag">Our Architecture (agy2)</span>
            <h3>Pure NixOS-WSL Headless Bridge</h3>
          </div>
          <ul class="bridge-list positive">
            <li>✓ <strong>Windows Launcher</strong>: <code>Antigravity.exe</code> connects to NixOS guest via direct WSL socket</li>
            <li>✓ <strong>Native Shell Utility</strong>: Run <code>agy2</code> inside NixOS to launch Windows Antigravity 2.0 attached to WSL</li>
            <li>✓ <strong>Nix-LD Binary Execution</strong>: Pure dynamic link resolver runs standard Linux ELF language servers</li>
            <li>✓ <strong>Declarative Skills Sync</strong>: Skills auto-sync from Nix store paths on user login via systemd user services</li>
          </ul>
          <div class="bridge-code-wrap">
            <button type="button" class="copy-btn" onclick="copyCommand('agy2', this)">Copy: agy2</button>
            <pre><code># Inside NixOS Terminal
agy2   # Launches Antigravity 2.0 on Windows, mapped to NixOS WSL</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── Pre-Commit Validation Pipeline ─────────────────────────────────── -->
<section id="validation" class="docs-section">
  <div class="section-title-wrap">
    <div class="section-badge">Zero Drift Guarantee</div>
    <h2>5-Stage Pre-Commit Validation Pipeline</h2>
    <p class="section-sub">
      Every change to the system undergoes strict automated static checks before any build or commit:
    </p>
  </div>

  <div class="stepper-grid">
    <div class="step-card">
      <div class="step-num">01</div>
      <h4>Alejandra</h4>
      <p class="step-role">Nix Formatting</p>
      <p class="step-desc">Strict, opinionated code formatting across all 18+ system nix expressions.</p>
      <code>nix fmt -- .</code>
    </div>
    <div class="step-card">
      <div class="step-num">02</div>
      <h4>Statix</h4>
      <p class="step-role">Anti-patterns</p>
      <p class="step-desc">Detects code smell, unmanaged mutable paths, and anti-patterns.</p>
      <code>statix check .</code>
    </div>
    <div class="step-card">
      <div class="step-num">03</div>
      <h4>Deadnix</h4>
      <p class="step-role">Dead Code</p>
      <p class="step-desc">Prunes unused declarations and bindings across flake modules.</p>
      <code>deadnix .</code>
    </div>
    <div class="step-card">
      <div class="step-num">04</div>
      <h4>Flake Check</h4>
      <p class="step-role">Closure Evaluation</p>
      <p class="step-desc">Evaluates all NixOS configurations, devShells, and derivations.</p>
      <code>nix flake check --impure</code>
    </div>
    <div class="step-card highlight">
      <div class="step-num">05</div>
      <h4>dots-build</h4>
      <p class="step-role">Dry-Run Diff</p>
      <p class="step-desc">Dry-builds top-level derivation with visual closure diff without switching.</p>
      <code>dots-build</code>
    </div>
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
  --bg-page: #060913;
  --bg-card: rgba(13, 20, 36, 0.72);
  --bg-card-hover: rgba(22, 33, 58, 0.88);
  --card-border: rgba(255, 255, 255, 0.08);
  --card-border-highlight: rgba(96, 165, 250, 0.45);
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --accent-blue: #60a5fa;
  --accent-emerald: #34d399;
  --accent-purple: #a78bfa;
  --accent-pink: #f472b6;
  --accent-amber: #fbbf24;
}

[data-theme="light"] {
  --bg-page: #f8fafc;
  --bg-card: rgba(255, 255, 255, 0.88);
  --bg-card-hover: rgba(241, 245, 249, 0.98);
  --card-border: rgba(0, 0, 0, 0.08);
  --card-border-highlight: rgba(37, 99, 235, 0.4);
  --text-primary: #0f172a;
  --text-muted: #475569;
  --text-dim: #94a3b8;
  --accent-blue: #2563eb;
  --accent-emerald: #059669;
  --accent-purple: #7c3aed;
  --accent-pink: #db2777;
  --accent-amber: #d97706;
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
}

/* ── Ambient Background Glow & Fine Mesh ────────────────────────── */
.ambient-glow {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1000px;
  height: 500px;
  background: radial-gradient(ellipse at 50% 0%, rgba(96, 165, 250, 0.16), rgba(167, 139, 250, 0.08) 45%, transparent 75%);
  pointer-events: none;
  z-index: 0;
}

.mesh-grid {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
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
  gap: 22px;
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
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.25);
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
  font-size: 46px;
  font-weight: 800;
  letter-spacing: -0.035em;
  margin: 0 0 16px;
  line-height: 1.15;
  background: linear-gradient(135deg, #ffffff 30%, #93c5fd 65%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-lead {
  font-size: 17.5px;
  color: var(--text-muted);
  max-width: 740px;
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
  max-width: 640px;
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
  background: rgba(96, 165, 250, 0.12);
  border-color: var(--accent-blue);
  color: var(--text-primary);
  box-shadow: 0 0 16px rgba(96, 165, 250, 0.22);
}

.pill-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.06);
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
  box-shadow: 0 24px 48px -18px rgba(0, 0, 0, 0.6);
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
.telemetry-circuit-line {
  fill: none;
  stroke-width: 0.8px;
  stroke-dasharray: 4 6;
  opacity: 0.7;
  animation: circuit-flow 1.5s linear infinite;
}

@keyframes circuit-flow {
  to { stroke-dashoffset: -30; }
}

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
  100% { r: 14px; opacity: 0; stroke-width: 0.2px; }
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
  100% { rx: 26px; ry: 13px; opacity: 0; }
}

.iso-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--card-border);
  background: rgba(0, 0, 0, 0.15);
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
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
  background: rgba(0, 0, 0, 0.25);
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
  background: rgba(255, 255, 255, 0.06);
  color: var(--accent-emerald);
}

.cmd-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
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
  box-shadow: 0 16px 32px -12px rgba(0, 0, 0, 0.4);
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
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(0, 0, 0, 0.2);
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
  background: rgba(255, 255, 255, 0.05);
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
  background: rgba(255, 255, 255, 0.06);
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

/* ── Interactive Architecture Tabs ──────────────────────────────── */
.arch-tabs-container {
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  padding: 24px;
  backdrop-filter: blur(14px);
}

.arch-tab-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--card-border);
  margin-bottom: 24px;
}

.arch-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.arch-tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.arch-tab-btn.active {
  background: rgba(96, 165, 250, 0.15);
  border-color: var(--accent-blue);
  color: var(--text-primary);
}

.tab-icon {
  font-size: 14px;
}

.arch-tab-pane {
  display: none;
}

.arch-tab-pane.active {
  display: block;
}

/* ── Architecture Flow Diagram (Inside Tab) ─────────────────────── */
.arch-flow-diagram {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
}

.flow-col {
  flex: 1;
  min-width: 250px;
}

.flow-col.wide {
  flex: 2;
  min-width: 380px;
}

.flow-arrow {
  color: var(--accent-blue);
  font-size: 22px;
  flex-shrink: 0;
}

.flow-card {
  padding: 20px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--card-border);
}

.flow-pill {
  display: inline-block;
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-blue);
  margin-bottom: 6px;
}

.flow-card h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
}

.flow-card p {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.45;
}

.flow-card code {
  font-size: 10.5px;
  color: var(--accent-emerald);
  font-family: var(--font-mono);
}

.flow-subgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

.flow-mini-card {
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--card-border);
}

.flow-mini-card h5 {
  margin: 0 0 4px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--accent-purple);
}

.flow-mini-card p {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-dim);
  line-height: 1.4;
}

/* ── DevShells Grid ─────────────────────────────────────────────── */
.devshell-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.devshell-card {
  padding: 18px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--card-border);
}

.devshell-badge {
  font-size: 10.5px;
  font-family: var(--font-mono);
  color: var(--accent-blue);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.devshell-card h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-family: var(--font-mono);
}

.devshell-card p {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0 0 12px;
}

.devshell-card code {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  color: var(--accent-emerald);
}

/* ── Skills Showcase ────────────────────────────────────────────── */
.skills-showcase {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skills-banner h4 {
  margin: 0 0 6px;
  font-size: 17px;
  color: var(--text-primary);
}

.skills-banner p {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
}

.skills-tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.skill-category {
  padding: 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--card-border);
}

.skill-category h5 {
  margin: 0 0 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--accent-purple);
  text-transform: uppercase;
}

.skill-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  border: 1px solid var(--card-border);
}

/* ── Antigravity 2.0 Bridge Section ─────────────────────────────── */
.bridge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.bridge-card {
  padding: 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--card-border);
}

.bridge-card.featured {
  border-color: var(--accent-blue);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%);
  box-shadow: 0 0 25px rgba(37, 99, 235, 0.12);
}

.bridge-header {
  margin-bottom: 16px;
}

.bridge-tag {
  font-size: 10.5px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-dim);
}

.bridge-card.featured .bridge-tag {
  color: var(--accent-emerald);
}

.bridge-header h3 {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 700;
}

.bridge-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
}

.bridge-list li {
  padding: 8px 0;
  font-size: 13.5px;
  line-height: 1.5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.bridge-list.negative li {
  color: var(--text-dim);
}

.bridge-list.positive li {
  color: var(--text-primary);
}

.bridge-code-wrap {
  position: relative;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--card-border);
  padding: 12px 16px;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all 0.15s ease;
}

.copy-btn:hover {
  background: rgba(96, 165, 250, 0.2);
  color: var(--accent-blue);
}

.bridge-code-wrap pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent-emerald);
}

/* ── Pre-Commit Stepper ─────────────────────────────────────────── */
.stepper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.step-card {
  padding: 22px 18px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--card-border);
  text-align: center;
  transition: transform 0.18s ease;
  backdrop-filter: blur(10px);
}

.step-card:hover {
  transform: translateY(-3px);
  border-color: var(--card-border-highlight);
}

.step-card.highlight {
  border-color: var(--accent-emerald);
  background: rgba(52, 211, 153, 0.07);
  box-shadow: 0 0 20px rgba(52, 211, 153, 0.12);
}

.step-num {
  font-size: 22px;
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--accent-blue);
  margin-bottom: 6px;
}

.step-card.highlight .step-num {
  color: var(--accent-emerald);
}

.step-card h4 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 700;
}

.step-role {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.step-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.45;
}

.step-card code {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.25);
  color: var(--accent-purple);
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
  background: rgba(0, 0, 0, 0.15);
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
  background: rgba(255, 255, 255, 0.02);
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
.badge-type.docs { background: rgba(255, 255, 255, 0.1); color: var(--text-muted); }

.tbl-copy-btn {
  padding: 4px 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
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
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(96, 165, 250, 0.4);
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
  .arch-flow-diagram { flex-direction: column; align-items: stretch; }
  .flow-arrow { transform: rotate(90deg); text-align: center; }
  .iso-foot { flex-direction: column; align-items: flex-start; }
  .readout-box { align-items: flex-start; }
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
      <a href="#repos">Repositories</a>
      <a href="#architecture">Architecture</a>
      <a href="#validation">Validation</a>
      <a href="#commands">Commands</a>
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

    <!-- Interactive Anatomy Rig -->
    ${cardHtml}

    <!-- Architecture & Repository Breakdown -->
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
console.log(`✓ Successfully generated god-level page: ${OUT_FILE} (${Math.round(htmlPage.length / 1024)} KB)`);
