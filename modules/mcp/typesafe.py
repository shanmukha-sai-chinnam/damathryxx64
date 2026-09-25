"""
Antigravity MCP Server for TypeSafe AI (Jev).
Exposes System One primitives (Choice, Score, Noul) over stdio JSON-RPC 2.0.
"""

import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request

TYPESAFE_API_URL = "https://api.typesafe.ai/v1/systemone"


def log(msg):
    sys.stderr.write(f"[typesafe-mcp] {msg}\n")
    sys.stderr.flush()


def get_api_key():
    # 1. Environment variables
    for env_var in (
        "TYPESAFE_API_KEY",
        "TYPESAFE_AI",
        "typesafe_ai",
        "typesafe_api_key",
    ):
        val = os.environ.get(env_var, "").strip()
        if val:
            return val.strip("\"'")

    # 2. Check .env files
    env_candidates = [
        Path("/home/damathryxx64/repositories/.env"),
        Path.cwd() / ".env",
        Path.home() / ".config" / "typesafe" / ".env",
    ]
    for p in env_candidates:
        if p.exists():
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, _, v = line.partition("=")
                    if k.strip().lower() in (
                        "typesafe_ai",
                        "typesafe_api_key",
                    ):
                        val = v.strip().strip("\"'")
                        if val:
                            return val
            except Exception:
                pass

    # 3. Plaintext key file fallbacks
    plain_candidates = [
        Path.home() / ".config" / "typesafe" / "api_key",
        Path.home() / ".gemini" / "typesafe_api_key",
        Path.home() / ".typesafe_api_key",
    ]
    for p in plain_candidates:
        if p.exists():
            try:
                k = p.read_text(encoding="utf-8").strip().strip("\"'")
                if k:
                    return k
            except Exception:
                pass
    return None


def call_typesafe_api(payload):
    api_key = get_api_key()
    if not api_key:
        raise ValueError(
            "TYPESAFE_API_KEY is not configured.\n"
            "Please export TYPESAFE_API_KEY or save your key in ~/.config/typesafe/api_key.\n"
            "You can generate a key at https://console.typesafe.ai/keys"
        )

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        TYPESAFE_API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Antigravity-MCP-TypeSafe/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"TypeSafe API HTTP {e.code}: {err_msg}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Failed to connect to TypeSafe API: {e.reason}")


TOOLS = [
    {
        "name": "typesafe_evaluate",
        "description": "Evaluate state against multiple typed System One questions (choice, score, noul) in parallel via Jev. Returns calibrated probabilities, scores, and confidence.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "state": {
                    "description": "Content to evaluate (string, JSON object, or array).",
                    "type": ["string", "object", "array"],
                },
                "questions": {
                    "description": "Map of question IDs to typed questions. Each question must specify 'type' ('noul', 'choice', 'score') and 'instructions', with optional 'criteria'.",
                    "type": "object",
                },
                "model": {
                    "description": "Model alias or ID (default: 'jev-latest').",
                    "type": "string",
                    "default": "jev-latest",
                },
            },
            "required": ["state", "questions"],
        },
    },
    {
        "name": "typesafe_noul",
        "description": "Evaluate a single yes/no condition using Jev. Returns the probability (0.0 to 1.0) that the condition holds.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "state": {
                    "description": "Content or data to evaluate.",
                    "type": ["string", "object", "array"],
                },
                "instructions": {
                    "description": "The yes/no question to evaluate.",
                    "type": ["string", "object", "array"],
                },
                "criteria_true": {
                    "description": "Optional description of what a yes (true) outcome means.",
                    "type": "string",
                },
                "criteria_false": {
                    "description": "Optional description of what a no (false) outcome means.",
                    "type": "string",
                },
                "model": {
                    "description": "Model alias (default: 'jev-latest').",
                    "type": "string",
                    "default": "jev-latest",
                },
            },
            "required": ["state", "instructions"],
        },
    },
    {
        "name": "typesafe_choice",
        "description": "Pick the best matching option from a defined set using Jev. Returns the selected choice, option probability distribution, and confidence.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "state": {
                    "description": "Content or context to evaluate.",
                    "type": ["string", "object", "array"],
                },
                "instructions": {
                    "description": "The question or instruction defining what choice to make.",
                    "type": ["string", "object", "array"],
                },
                "options": {
                    "description": "List of options to choose from (strings or objects with descriptions).",
                    "type": "array",
                },
                "model": {
                    "description": "Model alias (default: 'jev-latest').",
                    "type": "string",
                    "default": "jev-latest",
                },
            },
            "required": ["state", "instructions", "options"],
        },
    },
    {
        "name": "typesafe_score",
        "description": "Rate content against ordered, descriptive levels using Jev. Returns a calibrated score, level probabilities, and confidence.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "state": {
                    "description": "Content or context to evaluate.",
                    "type": ["string", "object", "array"],
                },
                "instructions": {
                    "description": "The dimension or rubric question to evaluate.",
                    "type": ["string", "object", "array"],
                },
                "levels": {
                    "description": "Ordered descriptive levels from lowest to highest.",
                    "type": "array",
                },
                "model": {
                    "description": "Model alias (default: 'jev-latest').",
                    "type": "string",
                    "default": "jev-latest",
                },
            },
            "required": ["state", "instructions", "levels"],
        },
    },
]


def handle_tool_call(name, args):
    model = args.get("model", "jev-latest")
    state = args.get("state")

    if name == "typesafe_evaluate":
        payload = {
            "model": model,
            "state": state,
            "questions": args.get("questions", {}),
        }
        res = call_typesafe_api(payload)
        return json.dumps(res, indent=2)

    elif name == "typesafe_noul":
        question = {"type": "noul", "instructions": args.get("instructions")}
        crit = {}
        if args.get("criteria_true"):
            crit["true"] = args["criteria_true"]
        if args.get("criteria_false"):
            crit["false"] = args["criteria_false"]
        if crit:
            question["criteria"] = crit

        payload = {
            "model": model,
            "state": state,
            "questions": {"judgment": question},
        }
        res = call_typesafe_api(payload)
        ans = res.get("answers", {}).get("judgment", {})
        return json.dumps(
            {
                "model": res.get("model"),
                "noul": ans.get("noul"),
                "verdict": (ans.get("noul", 0.0) >= 0.5),
                "usage": res.get("usage"),
            },
            indent=2,
        )

    elif name == "typesafe_choice":
        options = args.get("options", [])
        if isinstance(options, list):
            criteria = {str(opt): None for opt in options}
        elif isinstance(options, dict):
            criteria = options
        else:
            criteria = {}

        question = {
            "type": "choice",
            "instructions": args.get("instructions"),
            "criteria": criteria,
        }
        payload = {
            "model": model,
            "state": state,
            "questions": {"selection": question},
        }
        res = call_typesafe_api(payload)
        ans = res.get("answers", {}).get("selection", {})
        return json.dumps(
            {
                "model": res.get("model"),
                "choice": ans.get("choice"),
                "confidence": ans.get("confidence"),
                "probabilities": ans.get("probabilities"),
                "usage": res.get("usage"),
            },
            indent=2,
        )

    elif name == "typesafe_score":
        levels = args.get("levels", [])
        question = {
            "type": "score",
            "instructions": args.get("instructions"),
            "criteria": levels,
        }
        payload = {
            "model": model,
            "state": state,
            "questions": {"rating": question},
        }
        res = call_typesafe_api(payload)
        ans = res.get("answers", {}).get("rating", {})
        return json.dumps(
            {
                "model": res.get("model"),
                "score": ans.get("score"),
                "confidence": ans.get("confidence"),
                "legend": ans.get("legend"),
                "probabilities": ans.get("probabilities"),
                "usage": res.get("usage"),
            },
            indent=2,
        )

    else:
        raise ValueError(f"Unknown tool: {name}")


def main():
    log("Server starting...")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception as e:
            log(f"Invalid JSON: {e}")
            continue

        req_id = req.get("id")
        method = req.get("method")

        if method == "initialize":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {
                        "name": "mcp-server-typesafe",
                        "version": "1.0.0",
                    },
                    "capabilities": {"tools": {}},
                },
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "notifications/initialized":
            pass

        elif method == "ping":
            resp = {"jsonrpc": "2.0", "id": req_id, "result": {}}
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "tools/list":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"tools": TOOLS},
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "tools/call":
            params = req.get("params", {})
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            try:
                result_text = handle_tool_call(tool_name, tool_args)
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": result_text}],
                        "isError": False,
                    },
                }
            except Exception as e:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {"type": "text", "text": f"Error: {str(e)}"}
                        ],
                        "isError": True,
                    },
                }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        else:
            if req_id is not None:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: {method}",
                    },
                }
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()


if __name__ == "__main__":
    main()
