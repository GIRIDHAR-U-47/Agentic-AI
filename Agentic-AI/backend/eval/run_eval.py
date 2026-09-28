"""Run the R-Lens evaluation matrix.

Usage (from backend/):

    $env:PYTHONIOENCODING="utf-8"
    .\venv\Scripts\python.exe -m eval.run_eval

What it runs
------------
For every question in `eval/dataset.json`, every mode (no_rag / basic_rag /
agentic_rag) and every declared provider:

* with a key present (or the deterministic offline provider), the run executes
  and is scored;
* without a key, the cell is recorded as PENDING with the exact reason -- the
  harness never invents a score for a provider that was not called.

`agentic_rag` runs twice per (question, provider) so consistency can be
measured honestly (offline extraction is deterministic, so identical runs must
score 1.0). Cross-LLM consistency is reported as PENDING until a second keyed
provider is configured.

Results land in `eval/results/latest.json` and are summarised to stdout.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config  # noqa: E402
import db  # noqa: E402
from services import agent  # noqa: E402
from eval import metrics  # noqa: E402

EVAL_DIR = Path(__file__).resolve().parent
RESULTS_DIR = EVAL_DIR / "results"
MODES = ("no_rag", "basic_rag", "agentic_rag")


def _provider_state() -> List[Dict[str, Any]]:
    out = []
    for p in config.PROVIDERS:
        if p.name == "offline":
            out.append({"name": p.name, "model": p.model, "available": True,
                        "pending_reason": None})
            continue
        keyed = p.key_present()
        out.append({
            "name": p.name, "model": p.model, "available": keyed,
            "pending_reason": None if keyed else (
                f"no {p.api_key_env} set; cell marked PENDING, not scored"
            ),
        })
    return out


def _run_cell(question: Dict[str, Any], mode: str, provider: str,
              doc_ids: List[str]) -> Dict[str, Any]:
    """Run one cell safely. Never lets a provider crash the whole matrix.

    `doc_ids` is the approved set handed to the agent. The eval matrix treats
    the whole corpus as approved; omitting it would trigger the approval gate
    and every agentic cell would (correctly) refuse to run.
    """
    row: Dict[str, Any] = {
        "question": question["id"], "mode": mode, "provider": provider,
        "status": "ran",
    }
    t0 = time.perf_counter()
    try:
        result = agent.run(mode, question["question"], doc_ids=doc_ids,
                           provider=provider)
        row.update(metrics.summarize(result, question))
        row["latency_s"] = round(row.get("latency_s", 0.0), 3)
        row["wall_s"] = round(time.perf_counter() - t0, 3)
        row["tool_calls"] = (result.metrics or {}).get("tool_calls")
        row["events"] = (result.metrics or {}).get("events")
        row["activity_notes"] = [e for e in result.activity if e["kind"] in
                                 ("limit", "error", "decision")]
    except Exception as exc:  # pragma: no cover - defensive
        row["status"] = "error"
        row["error"] = f"{type(exc).__name__}: {exc}"
    return row


def run_matrix() -> Dict[str, Any]:
    db.init_db()
    dataset = json.loads((EVAL_DIR / "dataset.json").read_text(encoding="utf-8"))
    doc_ids = [d["id"] for d in db.list_documents()]
    if not doc_ids:
        print("Corpus is empty - run `python scripts/fetch_corpus.py` first.")
        sys.exit(2)

    providers = _provider_state()
    rows: List[Dict[str, Any]] = []
    inconsistencies: List[Dict[str, Any]] = []
    out_of_scope: List[Dict[str, Any]] = []

    for question in dataset["questions"]:
        for mode in MODES:
            for prov in providers:
                if not prov["available"]:
                    rows.append({
                        "question": question["id"], "mode": mode,
                        "provider": prov["name"],
                        "status": "pending",
                        "pending_reason": prov["pending_reason"],
                    })
                    continue
                row = _run_cell(question, mode, prov["name"], doc_ids)
                rows.append(row)
                if mode == "agentic_rag" and row["status"] == "ran":
                    # Deterministic provider: second run must be identical.
                    second = _run_cell(question, mode, prov["name"], doc_ids)
                    row["consistency"] = metrics.consistency(
                        row.get("answer_excerpt", ""), second.get("answer_excerpt", "")
                    )
                    second_answer = row.get("answer_excerpt") or ""
                    if second.get("status") == "ran" and second_answer:
                        if (second.get("answer_excerpt") or "") == second_answer:
                            row["consistency"] = 1.0
                        else:
                            row["consistency"] = metrics.consistency(
                                second_answer, second.get("answer_excerpt", "")
                            )
                            inconsistencies.append({
                                "question": question["id"], "provider": prov["name"],
                                "note": "two runs diverged though the provider is deterministic",
                            })
                if row.get("status") == "ran" and question.get("expect_insufficient_evidence"):
                    ok = (row.get("insufficient_evidence") and row.get("citations") == 0)
                    row["handled_out_of_scope_well"] = ok
                    out_of_scope.append({
                        "question": question["id"], "mode": mode,
                        "provider": prov["name"], "handled": ok,
                        "citations": row.get("citations"),
                    })

    # Cross-LLM consistency: only meaningful with >= 2 keyed providers.
    keyed = [p for p in providers if p["name"] != "offline" and p["available"]]
    summary = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "corpus_docs": len(doc_ids),
        "providers": providers,
        "questions": len(dataset["questions"]),
        "modes": list(MODES),
        "rows": rows,
        "cross_llm_consistency": {
            "status": "ran" if len(keyed) >= 2 else "pending",
            "providers": [p["name"] for p in keyed],
            "reason": (None if len(keyed) >= 2 else
                       f"need >= 2 keyed providers; only offline present"),
        },
        "deterministic_inconsistencies": inconsistencies,
        "out_of_scope_handling": out_of_scope,
    }
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    (RESULTS_DIR / "latest.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return summary


def _table(summary: Dict[str, Any]) -> str:
    lines = ["# Research Pilot evaluation", ""]
    lines.append(f"- generated_at: {summary['generated_at']}")
    lines.append(f"- corpus: {summary['corpus_docs']} documents, "
                 f"{summary['questions']} questions, modes: {', '.join(summary['modes'])}")
    lines.append("")
    headers = ["question", "mode", "provider", "status", "cite", "support",
               "fact_recall", "r_prec", "latency_s", "verified", "consistent"]
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("|" + "---|" * len(headers))
    for row in summary["rows"]:
        if row["status"] != "ran":
            lines.append(f"| {row['question']} | {row['mode']} | {row['provider']} | "
                         f"PENDING | - | - | - | - | - | - | - |")
            continue
        fa = row.get("factual_accuracy") or {}
        rp = row.get("retrieval_relevance") or {}
        lines.append(
            f"| {row['question']} | {row['mode']} | {row['provider']} | ran | "
            f"{row.get('citations', 0)} | {row.get('support_rate', 0):.2f} | "
            f"{fa.get('recall') if fa.get('recall') is not None else '-':} | "
            f"{rp.get('precision') if rp.get('precision') is not None else '-':} | "
            f"{row.get('latency_s', 0):.2f} | {row.get('verified', False)} | "
            f"{row.get('consistency', '-')} |"
        )
    lines.append("")
    if summary["cross_llm_consistency"]["status"] == "pending":
        lines.append(f"cross-LLM consistency: PENDING ({summary['cross_llm_consistency']['reason']})")
    if summary["deterministic_inconsistencies"]:
        lines.append("")
        lines.append("## Deterministic inconsistency (a real bug)")
        for ic in summary["deterministic_inconsistencies"]:
            lines.append(f"- {ic}")
    return "\n".join(lines)


def main() -> None:
    summary = run_matrix()
    table = _table(summary)
    print(table)
    (RESULTS_DIR / "latest.md").write_text(table, encoding="utf-8")
    print(f"\nResults: {RESULTS_DIR / 'latest.json'}")


if __name__ == "__main__":
    main()