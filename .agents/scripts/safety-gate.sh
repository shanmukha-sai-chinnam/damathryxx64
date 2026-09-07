#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
cmd="$(echo "$payload" | jq -r '.toolCall.args.CommandLine // empty')"

if echo "$cmd" | grep -qE "nixos-rebuild[[:space:]]+switch"; then
  echo '{"decision": "ask", "reason": "Caution: nixos-rebuild switch modifies the active operating system environment and requires explicit user confirmation."}'
else
  echo '{"decision": "allow"}'
fi
