import { readdir, readFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function checkCommand(args, { cwd, stdout, stderr }) {
  const targetDir = resolve(cwd, args[0] || ".");

  stdout.write("========================================\n");
  stdout.write(" Antigravity Profile & Monorepo Checks\n");
  stdout.write("========================================\n\n");

  let passes = 0;
  let failures = 0;

  function pass(msg) {
    stdout.write(`  [PASS] ${msg}\n`);
    passes++;
  }

  function fail(msg) {
    stderr.write(`  [FAIL] ${msg}\n`);
    failures++;
  }

  // 1. Agent Instruction Mapping
  const agentsMdCandidates = [
    join(targetDir, "AGENTS.md"),
    join(targetDir, ".agents", "AGENTS.md"),
    join(targetDir, ".agent", "AGENTS.md"),
    join(targetDir, "GEMINI.md"),
    join(targetDir, ".agents", "GEMINI.md"),
  ];

  let agentsFile = null;
  for (const candidate of agentsMdCandidates) {
    if (await exists(candidate)) {
      agentsFile = candidate;
      break;
    }
  }

  if (agentsFile) {
    pass(`Agent guidance document exists: ${agentsFile}`);
    try {
      const content = await readFile(agentsFile, "utf8");
      if (content.length > 50) {
        pass("Guidance document contains substantive agent guidelines");
      } else {
        fail("Guidance document is empty or insufficient");
      }

      // Check for environment / execution rules
      if (/NixOS|WSL|WSL2|environment/i.test(content)) {
        pass("Guidance defines execution environment constraints");
      }
    } catch (err) {
      fail(`Could not read ${agentsFile}: ${err.message}`);
    }
  } else {
    fail(`No AGENTS.md or GEMINI.md found in ${targetDir}`);
  }

  // 2. MCP Configuration Architecture
  const mcpCandidates = [
    join(targetDir, ".agents", "mcp_config.json"),
    join(targetDir, ".agents", "mcp", "mcp_config.json"),
    join(targetDir, "modules", "mcp", "default.nix"),
    join(homedir(), ".gemini", "antigravity", "mcp"),
  ];

  let mcpFound = false;
  for (const candidate of mcpCandidates) {
    if (await exists(candidate)) {
      pass(`MCP configuration available: ${candidate}`);
      mcpFound = true;
      break;
    }
  }
  if (!mcpFound) {
    fail("No MCP configuration located in repository or user environment");
  }

  // 3. Skills Discovery & Frontmatter Verification
  // Check monorepo in-tree skills hub, local .agents/skills, or global skills
  const skillsRoots = [];
  const inTreeSkills = join(targetDir, "skills", "skills");
  const inTreeFlat = join(targetDir, "skills");
  const localAgentsSkills = join(targetDir, ".agents", "skills");
  const globalSkills = join(homedir(), ".gemini", "config", "skills");

  if (await exists(inTreeSkills)) {
    skillsRoots.push(inTreeSkills);
  } else if (await exists(inTreeFlat)) {
    skillsRoots.push(inTreeFlat);
  }
  if (await exists(localAgentsSkills)) {
    skillsRoots.push(localAgentsSkills);
  }
  if (skillsRoots.length === 0 && (await exists(globalSkills))) {
    skillsRoots.push(globalSkills);
  }

  let skillsChecked = 0;
  for (const root of skillsRoots) {
    try {
      const entries = await readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Check if entry itself is a skill or category directory
          const skillMdDirect = join(root, entry.name, "SKILL.md");
          if (await exists(skillMdDirect)) {
            await checkSkill(entry.name, skillMdDirect);
            skillsChecked++;
          } else {
            // Check subdirectories (category hub)
            const subEntries = await readdir(join(root, entry.name), { withFileTypes: true });
            for (const sub of subEntries) {
              if (sub.isDirectory()) {
                const subSkillMd = join(root, entry.name, sub.name, "SKILL.md");
                if (await exists(subSkillMd)) {
                  await checkSkill(sub.name, subSkillMd);
                  skillsChecked++;
                }
              }
            }
          }
        }
      }
    } catch {
      // Continue searching next root
    }
  }

  async function checkSkill(name, filePath) {
    try {
      const content = await readFile(filePath, "utf8");
      const hasDelimiters = /^---\s*[\r\n]+[\s\S]*?[\r\n]+---/.test(content);
      const hasName = /^name:\s*([^\r\n]+)/m.test(content);
      const hasDescription = /^description:\s*([^\r\n]+)/m.test(content);

      if (hasDelimiters && hasName && hasDescription) {
        pass(`Skill valid: ${name}`);
      } else {
        const issues = [];
        if (!hasDelimiters) issues.push("missing frontmatter delimiters");
        if (!hasName) issues.push("missing name field");
        if (!hasDescription) issues.push("missing description field");
        fail(`Skill ${name} (${issues.join(", ")})`);
      }
    } catch (err) {
      fail(`Failed reading ${filePath}: ${err.message}`);
    }
  }

  if (skillsChecked > 0) {
    pass(`Verified ${skillsChecked} skills across discovered hubs`);
  } else {
    fail("No skill definitions located in repository or profile roots");
  }

  // 4. Legacy Pattern Audit
  const legacyPatterns = [
    "Dispatch implementer subagent",
    "Dispatch code-reviewer subagent",
    "Create TodoWrite",
    "Mark task complete in TodoWrite",
    "Use TodoWrite",
  ];

  if (agentsFile) {
    try {
      const content = await readFile(agentsFile, "utf8");
      for (const pattern of legacyPatterns) {
        if (content.includes(pattern)) {
          fail(`Legacy instruction found in guidance: ${pattern}`);
        }
      }
      pass("Zero legacy foreign provider instructions in guidance");
    } catch {
      // Handled above
    }
  }

  stdout.write("\n========================================\n");
  stdout.write(` Summary: ${passes} Passed, ${failures} Failed\n`);
  stdout.write("========================================\n\n");

  if (failures > 0) {
    stdout.write("STATUS: FAILED\n");
    return 1;
  }

  stdout.write("STATUS: PASSED\n");
  return 0;
}
