"""Tests for persistent conversation storage, message history, and chat endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client(real_corpus):
    import main
    with TestClient(main.app) as c:
        yield c


def test_create_and_list_conversations(client):
    # 1. Create a conversation
    r = client.post(
        "/api/conversations",
        json={
            "title": "Explainable Deep Learning for Load Forecasting",
            "mode": "research",
            "research_topic": "How does PatchTST compare with DLinear?",
            "selected_paper_ids": ["doc-patchtst"],
            "metadata": {"source": "test"},
        },
    )
    assert r.status_code == 200
    data = r.json()
    conv_id = data["id"]
    assert conv_id.startswith("conv-")
    assert data["title"] == "Explainable Deep Learning for Load Forecasting"
    assert data["mode"] == "research"
    assert data["selected_paper_ids"] == ["doc-patchtst"]

    # 2. List conversations
    r = client.get("/api/conversations")
    assert r.status_code == 200
    convs = r.json()["conversations"]
    assert any(c["id"] == conv_id for c in convs)

    # 3. Get single conversation
    r = client.get(f"/api/conversations/{conv_id}")
    assert r.status_code == 200
    detail = r.json()
    assert detail["id"] == conv_id
    assert "messages" in detail


def test_message_persistence_and_order(client):
    # Create conversation
    conv = client.post("/api/conversations", json={"mode": "research"}).json()
    conv_id = conv["id"]

    # Add user message
    msg1 = client.post(
        f"/api/conversations/{conv_id}/messages",
        json={
            "role": "user",
            "content": "What are the main results of PatchTST?",
        },
    ).json()
    assert msg1["role"] == "user"
    assert msg1["sequence"] == 0

    # Add assistant message
    msg2 = client.post(
        f"/api/conversations/{conv_id}/messages",
        json={
            "role": "assistant",
            "content": "PatchTST achieves superior multi-horizon MSE by using channel independence.",
            "metadata": {"verified": True},
        },
    ).json()
    assert msg2["role"] == "assistant"
    assert msg2["sequence"] == 1
    assert msg2["metadata"]["verified"] is True

    # Retrieve messages
    r = client.get(f"/api/conversations/{conv_id}/messages")
    messages = r.json()["messages"]
    assert len(messages) == 2
    assert messages[0]["content"] == "What are the main results of PatchTST?"
    assert messages[1]["content"] == "PatchTST achieves superior multi-horizon MSE by using channel independence."


def test_conversation_chat_flow_and_grounding(client):
    conv = client.post(
        "/api/conversations",
        json={
            "mode": "research",
            "research_topic": "PatchTST time series forecasting",
        },
    ).json()
    conv_id = conv["id"]

    # Chat turn
    r = client.post(
        f"/api/conversations/{conv_id}/chat",
        json={
            "query": "What is the key mechanism in PatchTST?",
        },
    )
    assert r.status_code == 200
    resp = r.json()
    assert "content" in resp
    assert len(resp["content"]) > 0
    assert "sources" in resp

    # Check that messages were saved to the conversation
    conv_detail = client.get(f"/api/conversations/{conv_id}").json()
    assert len(conv_detail["messages"]) >= 2
    assert conv_detail["messages"][0]["role"] == "user"
    assert conv_detail["messages"][1]["role"] == "assistant"


def test_local_title_generation():
    import db
    title1 = db.generate_conversation_title("How can explainable deep learning and metaheuristic optimization improve multi-horizon data center power forecasting?")
    assert 10 <= len(title1) <= 60
    assert "Explainable" in title1 or "Deep Learning" in title1

    title2 = db.generate_conversation_title("What is the difference between Informer and Autoformer?")
    assert 10 <= len(title2) <= 60
    assert "Informer" in title2
