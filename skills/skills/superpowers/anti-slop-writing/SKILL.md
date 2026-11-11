---
name: anti-slop-writing
description: >-
  Enforce clean, precise, slop-free writing in all agent output. Use when writing
  any response, documentation, commit message, PR description, or report — eliminates
  filler words, contrastive framing, and AI-typical verbal patterns.
---

# Anti-Slop Writing

Adapted from production coding agent writing standards. This skill eliminates the verbal patterns, adjective bloat, sloganeering, and decorative filler that make AI output feel generic, noisy, and untrustworthy.

Readers expect pure technical content with high information density, concrete data, exact code symbols, and verifiable evidence.

## Banned Words and Patterns

These words and patterns are **never** acceptable in agent output, code comments, commit messages, or documentation:

### Sloganeering and Negative Enumerations
- **No Negative Slogans**: Do not define software by chanting what it is not (e.g. "Zero Python. Zero Node. Zero Shell Scripts."). State the actual implementation stack directly: "Written in Rust and packaged with Nix."
- **No Product Hype**: Avoid marketing label soup such as "Autonomous AI security sentinel and adversarial verification platform". Use direct, concrete nouns: "Static security scanner and adversarial evaluation harness".

### Emojis and Visual Decoration
- **Zero Emojis Everywhere**: Strictly zero emojis in code, comments, commit messages, PR descriptions, terminal output, documentation, or chat responses.
- Never use emojis as bullet points, status indicators, or section headers. Use plain text, numbers, or standard markdown punctuation (`-`, `*`, `1.`).

### Adverb and Adjective Bloat (Empty Fluff)
- "blazingly fast" (state the latency: "11.93 seconds", "sub-millisecond")
- "truly seamless" / "seamless"
- "deeply comprehensive" / "comprehensive"
- "incredibly robust" / "robust" (unless specifying exact fault tolerance)
- "meticulously crafted"
- "highly scalable"
- "pivotal" / "game-changing" / "revolutionary"
- "crucial" / "vital" / "essential" / "paramount"
- "effortless" / "simple" / "easy"
- "cutting-edge" / "state-of-the-art"
- "unprecedented"

### Filler Verbs and Nouns
- "delve" / "delving"
- "foster" / "fostering"
- "leverage" / "leveraging" (use "use")
- "utilize" (use "use")
- "facilitate"
- "streamline"
- "holistic"
- "synergy"
- "paradigm"
- "genuinely"
- "tapestry"

### Filler Phrases
- "it's worth noting"
- "importantly"
- "it should be noted that"
- "needless to say"
- "at the end of the day"
- "moving forward"
- "in terms of"
- "when it comes to"
- "dive deep into"
- "in today's fast-paced world"

### Structural Slop
- "Bottom Line:" (in conclusions)
- "Question? Answer." (rhetorical Q&A format)
- "This isn't about X. It's about Y."
- "Let's dive in"
- "Without further ado"
- "Here's the thing"
- "In conclusion" / "Summary" labeled closing paragraphs that repeat earlier points

## Writing Rules

### 1. Main Point First
State the conclusion or change immediately in the first sentence. Then provide the technical detail and evidence. Each sentence builds on the previous one.

### 2. High Information Density (Verbose Technical Content, Zero Filler)
Verbose does not mean filler or repetition. Verbose means technically thorough:
- Cite exact file paths, line numbers, function signatures, and struct definitions.
- Provide concrete numbers, benchmarks, throughput measurements, and error codes.
- Explain the underlying mechanics (memory layout, system calls, network protocols, trait bounds).
- Include complete, runnable code examples rather than hand-wavy snippets.

### 3. Plain Language and Concrete Nouns
Use specific technical nouns and active verbs:
```
[BAD]  "We leverage the Nix flake ecosystem to facilitate reproducible builds."
[GOOD] "Nix flakes pin every input revision in flake.lock, ensuring identical store paths across machines."
```

### 4. No Contrastive Framing
Do not introduce unprompted alternatives using "X, not Y" or "X rather than Y":
```
[BAD]  "This is a security measure, not a convenience feature."
[GOOD] "This is a security measure."
```
State what things are directly. Do not define items by contrast against things nobody asked about.

### 5. Concrete Implementation Stack
State the language and toolchain directly without slogans:
```
[BAD]  "Zero Python. Zero Node. Zero Shell Scripts. Pure Compiled Rust & Declarative Nix."
[GOOD] "Written in Rust with Nix flake packaging."
```
Do not introduce unmanaged helper scripts or ad-hoc wrappers when the task specifies a native language stack.

### 6. No Invented Compound Labels
Avoid fabricated hyphenated descriptors:
```
[BAD]  "exact-head checks", "editorial-row layouts", "drift-proof syncing"
[GOOD] Use plain verbs and prepositions to state the relationship directly
```

### 7. Outcome First, Then Reasoning
Lead with what changed or what the outcome is. Do not recount historical thought processes chronologically:
```
[BAD]  "First I inspected the code, then I noticed the XML parser failed, so I wrote an escaper..."
[GOOD] "The XML parser failed because ampersands were unescaped in testcase names. Implementing escape_xml sanitizes all attribute characters."
```

### 8. No Self-Commentary
Do not narrate your actions, comment on how easy or complex a task is, or state that tools were not needed:
```
[BAD]  "I'll now walk you through the implementation I designed for you..."
[GOOD] [State the implementation details and evidence directly]
```

### 9. Slop-Free Commits and Documentation
- Commit messages must follow Conventional Commits format (`type(scope): imperative summary`).
- Never put emojis, exclamation marks, slogans, or adjectives in commit titles.
- Commit bodies must enumerate concrete changes, rule IDs, and technical mechanics.
- Code comments must explain invariants and non-obvious hardware/OS interactions, not restate the syntax.
