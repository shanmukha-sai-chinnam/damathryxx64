import { execFileSync } from "node:child_process";
import { rm, lstat, readlink, symlink, cp, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const skillsDir = resolve(process.cwd(), "templates/.agents/skills");
const savedSymlinks = new Map();

let filename = null;
try {
  const entries = await readdir(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    const p = join(skillsDir, entry.name);
    const s = await lstat(p);
    if (s.isSymbolicLink()) {
      const target = await readlink(p);
      savedSymlinks.set(p, target);
      const targetResolved = resolve(skillsDir, target);
      await rm(p);
      await cp(targetResolved, p, { recursive: true });
    }
  }

  const raw = execFileSync("npm", ["pack", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const packResult = JSON.parse(raw);

  if (!Array.isArray(packResult) || packResult.length === 0) {
    throw new Error("npm pack did not return package metadata");
  }

  const [firstResult] = packResult;
  filename = firstResult.filename;
  const files = firstResult.files;
  if (!filename || !Array.isArray(files)) {
    throw new Error("npm pack output is missing filename or files");
  }

  const packagedPaths = new Set(files.map((file) => file.path));
  const required = [
    "bin/antigravity-superpowers.js",
    "src/cli.js",
    "src/commands/init.js",
    "src/commands/check.js",
    "src/commands/doctor.js",
    "src/commands/sync.js",
    "templates/.agents/AGENTS.md",
    "templates/.agents/rules/workflow-discipline.md",
    "templates/.agents/INSTALL.md",
    "templates/.agents/task.md",
    "templates/.agents/tests/run-tests.sh",
    "templates/.agents/tests/check-antigravity-profile.sh",
    "templates/.agents/skills/nixos-system-rebuild/SKILL.md",
    "templates/.agents/skills/nix-flake-management/SKILL.md",
    "templates/.agents/skills/nix-code-audit/SKILL.md",
    "templates/.agents/mcp/mcp_config.json",
    "templates/.agents/hooks/hooks.json",
  ];

  const missing = required.filter((path) => !packagedPaths.has(path));
  if (missing.length > 0) {
    throw new Error(
      `Packaged tarball is missing required files: ${missing.join(", ")}`,
    );
  }
} finally {
  for (const [p, target] of savedSymlinks) {
    await rm(p, { recursive: true, force: true });
    await symlink(target, p);
  }
  if (filename) {
    await rm(resolve(process.cwd(), filename), { force: true });
  }
}

process.stdout.write("Pack smoke check passed.\n");
