#!/usr/bin/env python3
"""SessionEnd hook: рахує вартість сесії Claude Code за транскриптом і дописує рядок у CSV.

Вартість — еквівалент за цінами Claude API (на підписці Pro/Max це не реальний рахунок).
Ціни: $ за 1M токенів, перевірено 2026-10-06. Оновлюй PRICES, коли змінюються ціни.
"""
import csv
import glob
import json
import os
import sys
from datetime import datetime

# model: (input, output, cache_read). Запис у кеш: 5m = 1.25x input, 1h = 2x input.
PRICES = {
    "claude-fable-5-1": (10.00, 50.00, 0.25),
    "claude-fable-5": (10.00, 50.00, 1.00),
    "claude-opus-5-5": (4.00, 20.00, 0.20),
    "claude-opus-5": (5.00, 25.00, 0.50),
    "claude-opus-4-8": (5.00, 25.00, 0.50),
    "claude-opus-4-7": (5.00, 25.00, 0.50),
    "claude-opus-4-6": (5.00, 25.00, 0.50),
    "claude-sonnet-5-5": (2.00, 10.00, 0.20),
    "claude-sonnet-5": (2.00, 10.00, 0.20),
    "claude-sonnet-4-6": (3.00, 15.00, 0.30),
    "claude-haiku-5-5": (0.10, 0.50, 0.01),
    "claude-haiku-4-5": (1.00, 5.00, 0.10),
}
HAIKU_5_5_LONG = (0.50, 2.50, 0.05)  # промпт > 100K токенів
FAST_MULTIPLIER = 2.0

LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "usage-log.csv")
FIELDS = ["ended_at", "project", "session_name", "session_id", "reason", "model", "requests",
          "input", "output", "cache_write", "cache_read", "cost_usd"]


def price_for(model, prompt_tokens):
    for key in sorted(PRICES, key=len, reverse=True):  # довший ключ першим: opus-5-5 раніше за opus-5
        if model.startswith(key):
            if key == "claude-haiku-5-5" and prompt_tokens > 100_000:
                return HAIKU_5_5_LONG
            return PRICES[key]
    return None


def message_cost(model, u):
    write_5m = (u.get("cache_creation") or {}).get("ephemeral_5m_input_tokens")
    write_1h = (u.get("cache_creation") or {}).get("ephemeral_1h_input_tokens")
    total_write = u.get("cache_creation_input_tokens", 0)
    if write_5m is None and write_1h is None:
        write_5m, write_1h = total_write, 0
    inp, out, read = u.get("input_tokens", 0), u.get("output_tokens", 0), u.get("cache_read_input_tokens", 0)
    p = price_for(model, inp + read + total_write)
    if p is None:
        return None
    p_in, p_out, p_read = p
    cost = (inp * p_in + out * p_out + read * p_read
            + (write_5m or 0) * p_in * 1.25 + (write_1h or 0) * p_in * 2.0) / 1_000_000
    if u.get("speed") == "fast":
        cost *= FAST_MULTIPLIER
    return cost


def collect(paths):
    seen = {}  # message.id -> (model, usage); останній запис перемагає (стрімінг дублює рядки)
    for path in paths:
        try:
            with open(path, encoding="utf-8") as f:
                for line in f:
                    try:
                        msg = json.loads(line).get("message") or {}
                    except json.JSONDecodeError:
                        continue
                    if msg.get("usage") and msg.get("model") and msg.get("id"):
                        seen[msg["id"]] = (msg["model"], msg["usage"])
        except OSError:
            pass
    return seen.values()


def session_name(transcript):
    """Назва сесії: власна (/rename) > назва агента > автоназва від Claude."""
    names = {}
    try:
        with open(transcript, encoding="utf-8") as f:
            for line in f:
                if '-title"' not in line and '"agent-name"' not in line:
                    continue
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                for typ, key in (("custom-title", "customTitle"), ("agent-name", "agentName"), ("ai-title", "aiTitle")):
                    if e.get("type") == typ and e.get(key):
                        names[typ] = e[key]
    except OSError:
        pass
    return names.get("custom-title") or names.get("agent-name") or names.get("ai-title") or ""


def main():
    data = json.load(sys.stdin)
    transcript = data.get("transcript_path", "")
    session_id = data.get("session_id", "")
    paths = [transcript] + glob.glob(os.path.join(os.path.dirname(transcript), session_id, "**", "*.jsonl"), recursive=True)

    per_model = {}
    for model, u in collect(paths):
        if model == "<synthetic>":
            continue
        s = per_model.setdefault(model, {"requests": 0, "input": 0, "output": 0, "cache_write": 0, "cache_read": 0, "cost": 0.0, "unknown": False})
        s["requests"] += 1
        s["input"] += u.get("input_tokens", 0)
        s["output"] += u.get("output_tokens", 0)
        s["cache_write"] += u.get("cache_creation_input_tokens", 0)
        s["cache_read"] += u.get("cache_read_input_tokens", 0)
        c = message_cost(model, u)
        if c is None:
            s["unknown"] = True
        else:
            s["cost"] += c

    if not per_model:
        return

    name = session_name(transcript)
    new_file = not os.path.exists(LOG_PATH)
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            w.writeheader()
        now = datetime.now().isoformat(timespec="seconds")
        for model, s in per_model.items():
            w.writerow({
                "ended_at": now, "project": data.get("cwd", ""), "session_name": name, "session_id": session_id,
                "reason": data.get("reason", ""), "model": model, "requests": s["requests"],
                "input": s["input"], "output": s["output"], "cache_write": s["cache_write"],
                "cache_read": s["cache_read"],
                "cost_usd": "unknown-model" if s["unknown"] else f"{s['cost']:.4f}",
            })


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # хук ніколи не повинен ламати вихід із сесії
        print(f"session-cost hook error: {e}", file=sys.stderr)
