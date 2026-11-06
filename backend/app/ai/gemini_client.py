"""The one place that talks to Google's Gemini API.

Network or HTTP failures propagate as `requests.RequestException`; an answer that arrives but is empty raises
`EmptyAnswer`. Callers catch both and fall back to the rule-based path, so an AI outage never breaks a feature.
"""
import time
from typing import NamedTuple

import requests
from flask import current_app

ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Gemini's free tier answers 429 (over the minute or daily limit for that model) or 503 (model overloaded) now and
# then. Those come back quickly, so they are retried: on the fallback model when one is set (it has its own quota),
# otherwise on the same model after a short pause. Every attempt shares one total time budget.
RETRY_STATUSES = (429, 500, 502, 503, 504)
RETRY_PAUSE_SECONDS = 2.0
MIN_ATTEMPT_SECONDS = 3.0


class EmptyAnswer(Exception):
    """Gemini replied, but with no usable text (blocked, or nothing generated)."""


class Reply(NamedTuple):
    text: str
    truncated: bool
    model: str = ""


def is_configured():
    return bool(current_app.config.get("GEMINI_API_KEY"))


def _models_to_try():
    primary = current_app.config.get("GEMINI_MODEL") or "gemini-2.5-flash"
    models = [primary]
    fallback = current_app.config.get("GEMINI_FALLBACK_MODEL") or ""
    if fallback and fallback != primary:
        models.append(fallback)
    return models


def _generation_config(model, max_tokens, temperature, json_mode):
    # "flash" models spend part of maxOutputTokens on hidden thinking, which cuts answers off mid-sentence, so
    # thinking is switched off for these small structured jobs.
    config = {"maxOutputTokens": max_tokens, "temperature": temperature}
    if "flash" in model:
        config["thinkingConfig"] = {"thinkingBudget": 0}
    if json_mode:
        config["responseMimeType"] = "application/json"
    return config


def generate(system_prompt, user_text, max_tokens=700, temperature=0.4, json_mode=False, timeout=20):
    """One Gemini request with a hard overall time limit. Returns a Reply; raises requests.RequestException
    (including Timeout) or EmptyAnswer."""
    api_key = current_app.config.get("GEMINI_API_KEY")
    if not api_key:
        raise requests.RequestException("Gemini is not configured")

    def send(model, seconds):
        return requests.post(
            url=ENDPOINT.format(model=model),
            headers={"x-goog-api-key": api_key},
            json={
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_text}]}],
                "generationConfig": _generation_config(model, max_tokens, temperature, json_mode),
            },
            timeout=seconds,
        )

    started = time.monotonic()
    models = _models_to_try()
    attempts = models if len(models) > 1 else [models[0], models[0]]
    resp, last_error, used = None, None, models[0]
    for i, model in enumerate(attempts):
        if i > 0 and len(models) == 1:
            time.sleep(RETRY_PAUSE_SECONDS)
        remaining = timeout - (time.monotonic() - started)
        if remaining < MIN_ATTEMPT_SECONDS:
            break
        last_attempt = i == len(attempts) - 1
        used = model
        try:
            resp = send(model, remaining if last_attempt else remaining * 0.6)
        except (requests.Timeout, requests.ConnectionError) as e:
            resp, last_error = None, e
            continue
        last_error = None
        if getattr(resp, "status_code", 200) not in RETRY_STATUSES:
            break
    if resp is None:
        raise last_error or requests.Timeout("the AI did not answer within the time limit")
    resp.raise_for_status()

    candidates = resp.json().get("candidates") or []
    if not candidates:
        raise EmptyAnswer("no candidates")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise EmptyAnswer("empty text")
    return Reply(text=text, truncated=candidates[0].get("finishReason") == "MAX_TOKENS", model=used)
