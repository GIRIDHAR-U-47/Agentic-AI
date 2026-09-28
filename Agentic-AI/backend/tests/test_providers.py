"""OpenRouter provider registration, honest-key handling, and mislabel guards.

No network is touched: OpenRouter needs `OPENROUTER_API_KEY` and that key lives
only in the backend environment, so everything here is either configuration
assertions or fake-client checks. Live OpenRouter cells are auto-added to the
eval matrix as PENDING rows (report marks them untested without a key).
"""
from __future__ import annotations

import os

import pytest

import config
import db
from services import workflow
from services.llm import build_llm
from services.llm.openrouter import OpenRouterLLM

Q = "How does channel independence work in PatchTST?"


def test_two_openrouter_slots_are_registered():
    a = config.get_provider("openrouter")
    b = config.get_provider("openrouter-strong")
    assert a is not None and b is not None
    assert a.api_key_env == "OPENROUTER_API_KEY"
    assert b.api_key_env == "OPENROUTER_API_KEY"
    assert "openrouter.ai/api/v1" in (a.base_url or "")
    assert "openrouter.ai/api/v1" in (b.base_url or "")
    # Two distinct model slots, so the eval harness can compare >= 2 models.
    assert a.model and b.model


def test_keyed_providers_are_not_available_without_key():
    # Never advertise a provider that cannot actually run.
    names = {p.name for p in config.available_providers()}
    assert "offline" in names
    if not os.getenv("OPENROUTER_API_KEY"):
        assert "openrouter" not in names


def test_build_llm_falls_back_to_offline_without_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    llm = build_llm("openrouter")
    assert getattr(llm, "offline", False) is True, (
        "without a key the LLM must be the offline engine, never a mislabelled "
        "openrouter object"
    )
    assert llm.name == "offline"


def test_build_llm_returns_openrouter_with_key(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key-not-a-secret")
    llm = build_llm("openrouter")
    assert isinstance(llm, OpenRouterLLM)
    assert llm.offline is False
    assert "openrouter.ai/api/v1" in (llm.base_url or "")
    # The optional model slot resolves to its own configured model.
    strong = build_llm("openrouter-strong")
    assert isinstance(strong, OpenRouterLLM)
    assert strong.model != llm.model or config.get_provider("openrouter-strong").model != config.get_provider("openrouter").model


def test_start_session_refuses_mislabeled_offline_run(monkeypatch, clean_db):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(workflow.WorkflowError) as exc:
        workflow.start_session(Q, provider="openrouter")
    assert "OPENROUTER_API_KEY" in str(exc.value)


def test_run_review_refuses_mislabeled_offline_run(monkeypatch, seeded_corpus):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    s = workflow.start_session(Q)
    sid = s["session_id"]
    workflow.set_approvals(sid, [
        {"doc_id": d["id"], "decision": "approved"} for d in seeded_corpus[:2]
    ])
    with pytest.raises(workflow.WorkflowError) as exc:
        workflow.run_review(sid, provider="openrouter")
    assert "OPENROUTER_API_KEY" in str(exc.value)


def test_unknown_provider_is_rejected(clean_db):
    with pytest.raises(workflow.WorkflowError):
        workflow.start_session(Q, provider="deep-thought")


def test_eval_matrix_includes_openrouter_slots():
    """The evaluation harness iterates config.PROVIDERS, so the two OpenRouter
    slots appear in the matrix as PENDING whenever the key is absent -- the
    harness never invents scores for providers it did not call."""
    import json

    import config as cfg

    names = [p.name for p in cfg.PROVIDERS]
    assert "openrouter" in names and "openrouter-strong" in names
    try:
        import sys
        from pathlib import Path

        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from eval.run_eval import _provider_state
    except Exception:  # pragma: no cover - eval dir structure drift
        pytest.skip("eval harness could not be imported")
    state = {p["name"]: p for p in _provider_state()}
    for slot in ("openrouter", "openrouter-strong"):
        row = state[slot]
        assert row["available"] is bool(os.getenv("OPENROUTER_API_KEY"))
        if row["pending_reason"]:
            assert "PENDING" in row["pending_reason"] or "pending" in row["pending_reason"]