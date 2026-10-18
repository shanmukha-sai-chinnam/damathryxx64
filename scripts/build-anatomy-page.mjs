#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(HERE, "..", "docs");
mkdirSync(DOCS_DIR, { recursive: true });

// Discover Anatomy kit path (env override -> ~/.gemini/config/skills/anatomy -> workspace fallback)
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
const { kitScript } = await import(`${ANATOMY_DIR}/scripts/inline-kit.mjs`);

const WIDTH = 920;
const HEIGHT = 520;

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

// 5 Stations along X
const STATIONS = [
  {
    id: "damathryxx64",
    name: "damathryxx64",
    role: "Central Flake Driver",
    x: -110,
    camH: 28,
    color: "#60a5fa",
    desc: "Primary NixOS flake & system orchestrator (trunk)",
    meta: "Closure: 1,264 paths · Alejandra · Statix · Deadnix zero drift",
    badge: "Driver",
  },
  {
    id: "skills",
    name: "skills",
    role: "AI Agent Skills Hub",
    x: -55,
    camH: 22,
    color: "#34d399",
    desc: "Unified skills monorepo (Google, Superpowers, Karpathy, ADHD, Anatomy)",
    meta: "31 active skills · Automated daily upstream sync & rewrite engine",
    badge: "Skills Hub",
  },
  {
    id: "antigravity2",
    name: "Antigravity 2.0",
    role: "Host Engine & LSP",
    x: 0,
    camH: 34,
    color: "#a78bfa",
    desc: "Antigravity 2.0 Language Server & WSL2 interop bridge (agy2)",
    meta: "JSON-RPC 2.0 · Nix-LD ELF execution · Windows-WSL socket",
    badge: "Core Engine",
  },
  {
    id: "antigravity-superpowers",
    name: "superpowers",
    role: "Agent Tooling & Doctor",
    x: 55,
    camH: 20,
    color: "#f472b6",
    desc: "Superpowers profile CLI, test-driven development & continuous watcher",
    meta: "Doctor diagnostics · Background watch with auto-fix enabled",
    badge: "Tooling",
  },
  {
    id: "clamav-scanner",
    name: "clamav-scanner",
    role: "Security Sentinel",
    x: 110,
    camH: 26,
    color: "#fbbf24",
    desc: "Real-time inotify file creation sentinel and Docker ClamAV daemon",
    meta: "Guards /home/damathryxx64/repositories against unsafe payloads",
    badge: "Sentinel",
  },
];

const CARRIAGE_W = 46;
const CARRIAGE_D = 66;
const CARRIAGE_H = 10;
const REACH = [STATIONS[0].x, STATIONS[STATIONS.length - 1].x];

// Camera setup: 42° Azimuth for optimal isometric depth & long side visibility
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
  { pad: 28, azimuth: 44, elevation: 32 }
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
  // Soft ambient halo
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);

  // Heavy knurled leveling feet
  for (const [x, y] of byDepth(k.corners(PLATE, 26))) {
    out.push(S(k.cylinder(x, y, 9, -PLATE_H - FOOT_H, 2.2, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7.2, -PLATE_H - FOOT_H + 2.2, FOOT_H - 2.2, P, 28), { tone: "mid" }));
    out.push(L(k.knurl(x, y, 7.2, -PLATE_H - FOOT_H + 2.2, -PLATE_H, 24, P), { tone: "lo" }));
  }

  // Precision ground steel bed slab
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 10, 2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 6), 0, P), { tone: "lo" }));

  // Corner precision screws
  const screws = k.corners(PLATE, 12);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 3, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.6 }));

  // Vernier Scale front strip with millimeter tick marks
  const strip = { x: -145, y: PLATE.y + PLATE.d - 16, w: 290, d: 8, r: 1.5 };
  out.push(S(k.slabOf(strip, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 6, strip.x + strip.w - 6, 5, 5, strip.y + 1, 0.8, [2.5, 4.5], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 3, strip.y + 4, 0.8]), at([strip.x + strip.w - 3, strip.y + 4, 0.8])], { size: 0.5 }));

  // Nameplate: NIXOS-WSL IMMUTABLE PLATFORM
  const plateMatrix = k.topMatrix([-80, strip.y + 2], 0.8, P);
  const plateText = k.faceTextSvg(plateMatrix, "NIXOS-WSL x86_64 PURE SYSTEM FOUNDATION", { size: 3.4, tone: "lo" });
  if (plateText) out.push(plateText);

  return out.join("");
}

// ── 2. Guide Rails & Mounting Blocks ─────────────────────────────────────────
function buildRails() {
  const out = [];
  // Twin precision hardened linear rails
  for (const y of [RAIL_Y1, RAIL_Y2]) {
    // Cylindrical rail body
    out.push(S(k.slabOf({ x: RAIL_FROM, y: y - 2, w: RAIL_TO - RAIL_FROM, d: 4, r: 1.2 }, 3, 5, P, 2, 0.6), { tone: "mid" }));
    out.push(L(k.planOutline({ x: RAIL_FROM, y: y - 2, w: RAIL_TO - RAIL_FROM, d: 4, r: 1.2 }, 8, P), { tone: "hi" }));
  }

  // End stops / Pillowed mounting blocks
  for (const x of [RAIL_FROM - 7, RAIL_TO + 1]) {
    out.push(S(k.slabOf({ x, y: RAIL_Y1 - 7, w: 6, d: RAIL_Y2 - RAIL_Y1 + 14, r: 2 }, 0, 12, P, 4, 1), { tone: "hi" }));
    out.push(D([at([x + 3, RAIL_Y1, 12]), at([x + 3, RAIL_Y2, 12])], { size: 0.6 }));
  }

  return out.join("");
}

// ── 3. Central Antigravity 2.0 Spindle Tower ─────────────────────────────────
function buildCentralTower() {
  const out = [];
  const [tx, ty] = TOWER;

  // Base plinth
  out.push(S(k.slabOf({ x: tx - 32, y: ty - 32, w: 64, d: 48, r: 6 }, 0, 6, P, 4, 1), { tone: "lo" }));
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
  // Screen Bezel & Screen Face
  const screenFace = { x: displayBox.x + 4, y: displayBox.y + displayBox.d - 0.5, w: displayBox.w - 8, d: 1, r: 2 };
  out.push(S(k.slabOf(screenFace, CRT_Z + 4, CRT_H - 8, P, 2, 0.4), { tone: "lo", crease: "none" }));

  // Cap with Optical Beacon Ring
  out.push(S(k.cylinder(tx, ty, TOWER_R - 4, 84, 18, P, 32), { tone: "hi" }));
  out.push(S(k.cylinder(tx, ty, 6, 102, 16, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(tx, ty, 4, 118, 4, P, 20), { tone: "hi" }));

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

  return out.join("");
}

// ── 5. Moving Carriage & Sensor Plunger ───────────────────────────────────────
function buildMovingCarriage() {
  const out = [];

  // Carriage block sitting on linear guide rails
  const carriageBox = { x: -CARRIAGE_W / 2, y: -CARRIAGE_D / 2, w: CARRIAGE_W, d: CARRIAGE_D, r: 4 };
  out.push(S(k.slabOf(carriageBox, 4, CARRIAGE_H, P, 4, 1), { tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(carriageBox, 3), 4 + CARRIAGE_H, P), { tone: "lo" }));

  // Corner mounting fasteners
  const cbScrews = k.corners(carriageBox, 5);
  out.push(D(cbScrews.map(([x, y]) => at([x, y, 4 + CARRIAGE_H])), { size: 0.5 }));

  // Dual linear bushings gripping the rails
  for (const y of [RAIL_Y1, RAIL_Y2]) {
    out.push(S(k.slabOf({ x: -CARRIAGE_W / 2 - 2, y: y - 4, w: CARRIAGE_W + 4, d: 8, r: 2 }, 2, 7, P, 2, 0.5), { tone: "mid" }));
  }

  // Dial Indicator Gauge on the Carriage
  const dialX = 0;
  const dialY = -12;
  const dialZ = 4 + CARRIAGE_H;
  out.push(S(k.cylinder(dialX, dialY, 15, dialZ, 8, P, 32), { tone: "mid" }));
  // Dial face inset
  out.push(S(k.cylinder(dialX, dialY, 13.5, dialZ + 7.5, 0.5, P, 32), { tone: "lo", crease: "none" }));
  // Radial graduation ticks
  const dialTicks = k.radialTicks(dialX, dialY, 12, 24, 4, dialZ + 8, [1.5, 3], P);
  out.push(L(dialTicks.minor, { tone: "lo" }), L(dialTicks.major, { tone: "hi" }));

  // Knurled Carriage thumb knob
  out.push(S(k.cylinder(0, 18, 7, dialZ, 12, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(0, 18, 7, dialZ + 2, dialZ + 12, 24, P), { tone: "lo" }));

  return out.join("");
}

// ── 6. Assemble the Static & Dynamic SVG Geometry ───────────────────────────
const staticParts = [
  buildPlate(),
  buildRails(),
  buildCentralTower(),
  buildStations(),
].join("");

const carriageGeometry = buildMovingCarriage();

// Needle path generator (rotates with travel)
function needlePath(turns) {
  const [dx, dy] = [0, -12];
  const dz = 4 + CARRIAGE_H + 8;
  const angle = turns * Math.PI * 2 - Math.PI / 2;
  const len = 11;
  const nx = dx + Math.cos(angle) * len;
  const ny = dy + Math.sin(angle) * len;
  return k.lineOnTop([dx, dy], [nx, ny], dz, P);
}

// Vertical sensor probe / plunger
function plungerGeometry() {
  return [
    S(k.cylinder(0, 0, 3.2, 0, 16, P, 20), { tone: "hi" }),
    S(k.cylinder(0, 0, 2, -6, 6, P, 20), { tone: "mid" }),
    D([at([0, 0, -6])], { size: 0.7, tone: "hi" }),
  ].join("");
}

const svgBody = `
<svg class="iso-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <g class="iso-static">
    ${staticParts}
  </g>
  <!-- Moving Carriage Group -->
  <g id="carriage" class="iso-moving" transform="${k.translateAlong(P, [STATIONS[0].x, 0, 0])}">
    ${carriageGeometry}
    <g id="plunger" transform="${k.translateAlong(P, [0, 0, 4 + CARRIAGE_H + STATIONS[0].camH])}">
      ${plungerGeometry()}
    </g>
    <path id="needle" class="iso-line" data-tone="hi" d="${needlePath(0)}"/>
  </g>
</svg>
`;

// ── 7. Client-side Interactive Animation Engine ──────────────────────────────
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

const needleAt = (turns) => {
  const [dx, dy] = [0, -12];
  const dz = BASE_H + 8;
  const angle = turns * Math.PI * 2 - Math.PI / 2;
  const len = 11;
  const nx = dx + Math.cos(angle) * len;
  const ny = dy + Math.sin(angle) * len;
  return lineOnTop([dx, dy], [nx, ny], dz, P);
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

function updateActiveTab(idx) {
  document.querySelectorAll(".station-pill").forEach((btn, i) => {
    btn.classList.toggle("active", i === idx);
  });
}

function draw() {
  carriage.setAttribute("transform", translateAlong(P, [currentX, 0, 0]));
  plunger.setAttribute("transform", translateAlong(P, [0, 0, BASE_H + tip.at]));
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
    updateActiveTab(stationIndex);
  }

  const st = STATIONS[stationIndex];
  const title = "[" + st.name + "] " + st.role;
  const detail = st.desc + " · " + st.meta;

  if (readout.textContent !== title) {
    readout.textContent = title;
    subReadout.textContent = detail;
  }
  stage.setAttribute("aria-valuenow", String(stationIndex + 1));
  stage.setAttribute("aria-valuetext", title + ": " + detail);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;

  if (touring) {
    clock += dt;
    const tourIdx = Math.floor(clock / 3.0) % STATIONS.length;
    targetX = STATIONS[tourIdx].x;
  }

  currentX = calm ? targetX : currentX + (targetX - currentX) * (1 - Math.exp(-dt / 0.24));
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

const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (nextX) => {
  touring = false;
  targetX = clamp(nextX, REACH[0], REACH[1]);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    touring = !still.matches;
    clock = 0;
    run();
  }, 4500);
  run();
};

window.jumpToStation = (idx) => {
  if (STATIONS[idx]) steer(STATIONS[idx].x);
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
    steer(STATIONS[Math.min(STATIONS.length - 1, stationIndex + 1)].x);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
    e.preventDefault();
    steer(STATIONS[Math.max(0, stationIndex - 1)].x);
  } else if (e.key === "Home") {
    e.preventDefault();
    steer(STATIONS[0].x);
  } else if (e.key === "End") {
    e.preventDefault();
    steer(STATIONS[STATIONS.length - 1].x);
  }
});

draw();
`;

// ── 8. Assemble Full Landing Page with Architecture Docs ────────────────────
const cardHtml = `
<div class="anatomy-container">
  <div class="station-nav">
    ${STATIONS.map((st, i) => `
      <button type="button" class="station-pill ${i === 0 ? "active" : ""}" onclick="jumpToStation(${i})">
        <span class="pill-dot" style="background:${st.color}"></span>
        <span class="pill-name">${st.name}</span>
      </button>
    `).join("")}
  </div>

  <div class="iso-card">
    <div class="iso-head">
      <span class="iso-fig">Fig 1</span>
      <h2 class="iso-title">Antigravity 2.0 NixOS Orchestration Engine</h2>
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
    <div class="iso-key"><span class="iso-swatch" data-swatch="shaded"></span><span>Station Cams · damathryxx64, skills, superpowers, NixOS-WSL, clamav-scanner</span></div>
  </div>

  <p class="iso-caption">
    <strong>The Machine as Explanation:</strong> An isometric mechanical test rig built with the <code>anatomy</code> skill.
    The ground steel surface bed represents the immutable <strong>NixOS-WSL</strong> foundation. The central telemetry tower runs the <strong>Antigravity 2.0</strong> language server bridge connecting the Windows host to the Linux environment. The gliding carriage probes each of the 5 declarative repositories in real-time, verifying closure integrity and zero drift across sessions.
  </p>
</div>
`;

const extraDocsHtml = `
<article class="docs-section">
  <header class="docs-hero">
    <div class="hero-badge">Zero Drift · Declarative Architecture</div>
    <h1>NixOS + Autonomous Agents + Antigravity 2.0</h1>
    <p class="hero-sub">
      A comprehensive technical guide to running Google Antigravity 2.0 inside a strictly declarative NixOS-WSL container, backed by autonomous coding agent skill trees and multi-repo synchronization.
    </p>
  </header>

  <div class="feature-grid">
    <div class="feature-card">
      <div class="card-icon">⚡</div>
      <h3>Strict NixOS-WSL Target</h3>
      <p>All development commands, builds, MCP servers, and agent tool executions run inside NixOS-WSL (<code>/home/damathryxx64/</code>). No mutable host pollution.</p>
    </div>
    <div class="feature-card">
      <div class="card-icon">🎯</div>
      <h3>Dots-Driven Truth</h3>
      <p>The <code>damathryxx64</code> flake is the single source of truth. Flake inputs pin reproducible commits for all agent runtimes, skills, rules, and system packages.</p>
    </div>
    <div class="feature-card">
      <div class="card-icon">🔄</div>
      <h3>Autonomous Upstream Sync</h3>
      <p>Multi-upstream synchronization tracks Superpowers, Karpathy Guidelines, ADHD, and Anatomy with daily automated rewrites for Gemini and Antigravity.</p>
    </div>
    <div class="feature-card">
      <div class="card-icon">🛡️</div>
      <h3>Zero-Drift Validation</h3>
      <p>Automated 4-stage validation pipeline: Alejandra formatting, Statix anti-pattern checks, Deadnix dead code pruning, and pure Nix flake evaluation.</p>
    </div>
  </div>

  <section class="docs-block">
    <h2>1. Workspace Repositories Topology</h2>
    <p>The workspace is arranged as 5 modular, declarative repositories orchestrated by <code>damathryxx64</code>:</p>
    
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Repository</th>
            <th>Flake Input</th>
            <th>Role & Purpose</th>
            <th>Upstream Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>damathryxx64</strong></td>
            <td><em>Primary Flake</em></td>
            <td>Central NixOS-WSL dots driver (system modules, devShells, skills synchronizer)</td>
            <td><code>arcanumx64/damathryxx64</code></td>
          </tr>
          <tr>
            <td><strong>skills</strong></td>
            <td><code>gemini-skills</code></td>
            <td>Unified AI agent skills hub with 31+ active skills, rules, and plugins</td>
            <td><code>google/skills</code> + Multi-Upstream</td>
          </tr>
          <tr>
            <td><strong>antigravity-superpowers</strong></td>
            <td><code>antigravity-superpowers</code></td>
            <td>Superpowers profile & toolkit CLI for Antigravity (diagnostics & watchers)</td>
            <td><code>skainguyen1412/antigravity-superpowers</code></td>
          </tr>
          <tr>
            <td><strong>NixOS-WSL</strong></td>
            <td><code>nixos-wsl</code></td>
            <td>Upstream NixOS on WSL distro builder, kernel modules & guest integration</td>
            <td><code>nix-community/NixOS-WSL</code></td>
          </tr>
          <tr>
            <td><strong>clamav-scanner</strong></td>
            <td><code>clamav-scanner</code></td>
            <td>Real-time inotify file creation sentinel and Docker ClamAV daemon</td>
            <td><code>shanmukha-sai-chinnam/clamav-scanner</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="docs-block">
    <h2>2. Antigravity 2.0 Host-Bridge Architecture</h2>
    <p>
      Antigravity 2.0 operates without requiring the legacy IDE. The Windows host executable communicates directly with the NixOS-WSL guest language server:
    </p>
    <div class="code-box">
      <div class="code-header"><span>Windows Host ↔ NixOS-WSL Bridge</span></div>
      <pre><code># Windows Host Launcher (Antigravity 2.0)
Antigravity.exe ──► wsl.exe -d NixOS --exec ~/.antigravity-server/bin/language_server

# Native Shell Launchers (inside NixOS)
agy2          # Launches Antigravity 2.0 on Windows connected to NixOS WSL
antigravity2  # Alias for agy2
help-nix      # Quick reference card for all workspace & agent tasks</code></pre>
    </div>
  </section>

  <section class="docs-block">
    <h2>3. Pre-Commit Validation & Zero Drift Pipeline</h2>
    <p>
      Every change to the system undergoes a 4-stage static validation suite before any build or commit:
    </p>
    <div class="pipeline-row">
      <div class="step-box"><span>1</span><strong>Alejandra</strong><small>Nix Code Format</small></div>
      <div class="step-arrow">→</div>
      <div class="step-box"><span>2</span><strong>Statix</strong><small>Anti-patterns</small></div>
      <div class="step-arrow">→</div>
      <div class="step-box"><span>3</span><strong>Deadnix</strong><small>Dead Code</small></div>
      <div class="step-arrow">→</div>
      <div class="step-box"><span>4</span><strong>Flake Check</strong><small>Evaluation & Types</small></div>
      <div class="step-arrow">→</div>
      <div class="step-box highlight"><span>5</span><strong>dots-build</strong><small>Closure Dry-Run</small></div>
    </div>
  </section>

  <section class="docs-block">
    <h2>4. Workspace Command Cheat Sheet</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>dots-validate</code></td>
            <td>Quality Gate</td>
            <td>Runs Alejandra, Statix, Deadnix, and Nix flake check in one step</td>
          </tr>
          <tr>
            <td><code>dots-build</code></td>
            <td>Dry-Run</td>
            <td>Dry-builds system derivation with visual closure diff (no switch)</td>
          </tr>
          <tr>
            <td><code>dots-upgrade</code></td>
            <td>System Upgrade</td>
            <td>Validates quality gates, updates all flake inputs, and switches system</td>
          </tr>
          <tr>
            <td><code>dots-workspace-pull</code></td>
            <td>Git Pull</td>
            <td>Pulls all 5 workspace repos from origin (runs on login via systemd)</td>
          </tr>
          <tr>
            <td><code>dots-workspace-sync</code></td>
            <td>Full Pipeline</td>
            <td>Pulls all repos + runs dots-validate + switches live system</td>
          </tr>
          <tr>
            <td><code>dots-sync-skills status</code></td>
            <td>Anti-Drift</td>
            <td>Inspects divergence against origin/upstream and flake lock pins</td>
          </tr>
          <tr>
            <td><code>refresh-skills</code></td>
            <td>Skills Sync</td>
            <td>Fetches upstreams, sanitizes foreign providers, and syncs ~/.gemini/config</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer class="docs-footer">
    <p>Crafted with the <strong>Anatomy</strong> isometric skill on <strong>NixOS-WSL</strong> · Deployed to GitHub Pages</p>
  </footer>
</article>
`;

// Additional CSS for the modern documentation layout & theme toggle
const extraCss = `
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --bg-page: #0b0f19;
  --text-page: #e2e8f0;
  --text-dim: #94a3b8;
  --card-border: rgba(255, 255, 255, 0.08);
  --card-bg: rgba(15, 23, 42, 0.65);
}

[data-theme="light"] {
  --bg-page: #f8fafc;
  --text-page: #0f172a;
  --text-dim: #64748b;
  --card-border: rgba(0, 0, 0, 0.08);
  --card-bg: rgba(255, 255, 255, 0.85);
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-page);
  color: var(--text-page);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.anatomy-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 0;
}

.theme-switch-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-page);
  padding: 8px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.station-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.station-pill {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-dim);
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.station-pill:hover, .station-pill.active {
  color: var(--text-page);
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.12);
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.readout-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.iso-subreadout {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
  max-width: 480px;
}

.docs-section {
  max-width: 960px;
  margin: 40px auto 80px;
  padding: 0 16px;
}

.docs-hero {
  text-align: center;
  margin-bottom: 48px;
}

.hero-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  font-size: 12px;
  font-family: var(--font-mono);
  margin-bottom: 14px;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.docs-hero h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.hero-sub {
  font-size: 16px;
  color: var(--text-dim);
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}

.feature-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 20px;
  border-radius: 12px;
}

.card-icon {
  font-size: 24px;
  margin-bottom: 12px;
}

.feature-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
}

.feature-card p {
  margin: 0;
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}

.docs-block {
  margin-bottom: 44px;
}

.docs-block h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--card-border);
}

.docs-block p {
  color: var(--text-dim);
  font-size: 14px;
  line-height: 1.6;
}

.table-wrap {
  overflow-x: auto;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

th {
  padding: 12px 16px;
  background: rgba(0,0,0,0.1);
  border-bottom: 1px solid var(--card-border);
  color: var(--text-page);
  font-weight: 600;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--card-border);
  color: var(--text-dim);
}

tr:last-child td {
  border-bottom: none;
}

code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: rgba(255,255,255,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  color: #38bdf8;
}

.code-box {
  background: #050811;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  overflow: hidden;
}

.code-header {
  padding: 8px 16px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--card-border);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
}

pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.5;
}

.pipeline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 16px 0;
}

.step-box {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  min-width: 110px;
}

.step-box span {
  display: block;
  font-size: 11px;
  color: #818cf8;
  font-family: var(--font-mono);
  margin-bottom: 4px;
}

.step-box strong {
  display: block;
  font-size: 13px;
}

.step-box small {
  display: block;
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}

.step-box.highlight {
  border-color: #34d399;
  background: rgba(52, 211, 153, 0.08);
}

.step-arrow {
  color: var(--text-dim);
  font-size: 18px;
}

.docs-footer {
  text-align: center;
  margin-top: 60px;
  padding-top: 24px;
  border-top: 1px solid var(--card-border);
  font-size: 13px;
  color: var(--text-dim);
}
`;

// Theme toggler script
const themeSwitcherScript = `
function toggleTheme() {
  const current = document.body.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  localStorage.setItem("anatomy-theme", next);
  document.getElementById("theme-btn-text").textContent = next === "dark" ? "Light Mode" : "Dark Mode";
}
const saved = localStorage.getItem("anatomy-theme");
if (saved) {
  document.body.setAttribute("data-theme", saved);
  document.getElementById("theme-btn-text").textContent = saved === "dark" ? "Light Mode" : "Dark Mode";
}
`;

// Generate the page
const htmlPage = `<!DOCTYPE html>
<html lang="en">
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
  <button type="button" class="theme-switch-btn" onclick="toggleTheme()" aria-label="Toggle Theme">
    <span>🌓</span>
    <span id="theme-btn-text">Light Mode</span>
  </button>

  ${cardHtml}
  ${extraDocsHtml}

  <script>
    ${kitScript()}
    ${themeSwitcherScript}
    ${clientScript}
  </script>
</body>
</html>
`;

writeFileSync(join(DOCS_DIR, "index.html"), htmlPage, "utf-8");
console.log("✓ Successfully generated:", join(DOCS_DIR, "index.html"));
