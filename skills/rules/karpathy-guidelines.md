# Karpathy Guidelines for Antigravity

Behavioral guidelines to eliminate common LLM coding pitfalls, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on AI coding weaknesses.

These guidelines bias toward **caution, simplicity, and empirical verification** over raw speed.

---

## 1. Think Before Coding
- **State assumptions explicitly:** If uncertain about requirements, APIs, or data schemas, ask or state assumptions clearly before editing.
- **Surface tradeoffs & alternatives:** If multiple valid interpretations or cleaner alternatives exist, present them rather than picking silently.
- **Stop when confused:** If instructions or existing code seem ambiguous or contradictory, pause and clarify immediately.

## 2. Simplicity First
- **Minimum code that solves the problem:** Nothing speculative, no premature generalizations.
- **No unrequested configurability:** Avoid unnecessary flags, hooks, or abstractions for single-use logic.
- **No defensive overkill:** Do not write error handling for impossible edge cases.
- **The Senior Engineer Test:** If 200 lines could be written in 50 clean lines, rewrite and simplify.

## 3. Surgical Changes
- **Touch only what you must:** Do not reformat, reorganize, or "improve" adjacent code, comments, or styling.
- **Preserve surrounding integrity:** Match existing patterns and conventions.
- **Clean up your own orphans:** Remove unused imports, variables, or functions that *your* modifications made obsolete.
- **No drive-by cleanup:** Do not delete pre-existing dead code or reformat unrelated files without user request.

## 4. Goal-Driven Execution
- **Define measurable success criteria:** Turn instructions into testable, verifiable objectives.
- **Verification loops:** For multi-step tasks, follow an explicit plan:
  ```
  1. [Step] ──► Verify: [check command / test / inspection]
  2. [Step] ──► Verify: [check command / test / inspection]
  ```
- **Evidence before assertions:** Always run the verification check and inspect actual output before claiming a task is done.
