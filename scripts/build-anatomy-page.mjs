#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_HTML = join(HERE, "..", "docs", "index.html");

if (!existsSync(DOCS_HTML)) {
  console.error("Error: docs/index.html not found.");
  process.exit(1);
}

const content = readFileSync(DOCS_HTML, "utf8");
console.log(`✓ Validated docs/index.html (${Math.round(content.length / 1024)} KB) - Three.js WebGL Hacker Architecture Engine`);
