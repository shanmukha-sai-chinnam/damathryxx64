#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
cmd="$(echo "$payload" | jq -r '.toolCall.args.CommandLine // empty')"

if echo "$cmd" | grep -qE "(nixos-rebuild[[:space:]]+switch|nh[[:space:]]+os[[:space:]]+switch|dots-switch)"; then
  echo '{"decision": "ask", "reason": "Caution: System switch commands modify the active operating system environment and require explicit user confirmation."}'
else
  echo '{"decision": "allow"}'
fi
