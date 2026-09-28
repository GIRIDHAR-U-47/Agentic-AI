"""Reflection / verification tests.

Verification is the project's central safety claim, so these tests focus on the
cases it must catch: fabricated numbers, citations to sources that do not exist,
papers the researcher never approved, and section headings masquerading as
claims.
"""
from __future__ import annotations

from services.agent.reflection import is_heading_free, split_claims, verify
from services.llm.offline import is_heading, is_self_contained

EVIDENCE = [
    {
        "id": "c1", "doc_id": "docA", "marker": "S1", "page": 3,
        "section": "3. Methodology", "doc_title": "Paper A", "doc_year": "2021",
        "text": (
            "The model reduces the forecasting error from 0.518 to 0.397 when the "
            "look-back window is increased. Patching keeps the token count small."
        ),
    },
    {
        "id": "c2", "doc_id": "docB", "marker": "S2", "page": 7,
        "section": "5. Results", "doc_title": "Paper B", "doc_year": "2022",
        "text": "Attention cost grows quadratically with sequence length in the baseline.",
    },
]


# --- the fabrication tripwire -------------------------------------------
def test_number_not_in_source_is_flagged():
    result = verify(
        "Patching reduces the forecasting error from 0.518 to 0.190 [S1].",
        EVIDENCE, approved_doc_ids=["docA", "docB"],
    )
    assert not result.verified
    bad = [c for c in result.checks if not c.ok]
    assert bad, "0.190 appears nowhere in the evidence and must be rejected"
    assert "0.19" in bad[0].unsupported_numbers or "0.190" in bad[0].unsupported_numbers


def test_number_in_source_passes():
    result = verify(
        "Increasing the look-back window reduces forecasting error from 0.518 "
        "to 0.397 [S1].",
        EVIDENCE, approved_doc_ids=["docA", "docB"],
    )
    assert result.verified, [c.issues for c in result.checks]
    assert result.support_rate == 1.0


def test_trailing_zero_normalisation():
    """0.397 and .397 must compare equal."""
    result = verify(
        "The error falls to .397 when the window grows [S1].",
        EVIDENCE, approved_doc_ids=["docA", "docB"],
    )
    assert result.verified, [c.to_dict() for c in result.checks]


# --- citation integrity --------------------------------------------------
def test_unresolvable_marker_is_flagged():
    result = verify(
        "Attention cost grows quadratically with sequence length [S7].",
        EVIDENCE, approved_doc_ids=["docA", "docB"],
    )
    assert not result.verified
    assert any("S7" in c.unknown_markers for c in result.checks)


def test_uncited_claim_is_flagged():
    result = verify(
        "Attention cost grows quadratically with sequence length.",
        EVIDENCE, approved_doc_ids=["docA", "docB"],
    )
    assert not result.verified
    assert any("no citation" in i.lower() for c in result.checks for i in c.issues)


def test_unapproved_source_is_a_global_failure():
    result = verify(
        "Attention cost grows quadratically with sequence length [S2].",
        EVIDENCE, approved_doc_ids=["docA"],  # docB was never approved
    )
    assert not result.verified
    assert any("never approved" in i for i in result.issues)


# --- correction ---------------------------------------------------------
def test_correction_withdraws_unsupported_claims():
    result = verify(
        "The error falls from 0.518 to 0.397 [S1].\n"
        "The approach improves accuracy by 94% [S1].",
        EVIDENCE, approved_doc_ids=["docA", "docB"], correct=True,
    )
    assert "0.397" in result.corrected_answer
    assert "94" not in result.corrected_answer
    assert "withdrawn" in result.corrected_answer.lower() \
        or "removed" in result.corrected_answer.lower()


def test_no_correction_leaves_text_untouched():
    original = "The approach improves accuracy by 94% [S1]."
    result = verify(original, EVIDENCE, approved_doc_ids=["docA", "docB"], correct=False)
    assert original in result.corrected_answer


# --- citations ----------------------------------------------------------
def test_citations_only_include_used_markers():
    result = verify(
        "The error falls from 0.518 to 0.397 [S1].",
        EVIDENCE, approved_doc_ids=["docA", "docB"],
    )
    assert [c["marker"] for c in result.citations] == ["S1"]
    assert result.citations[0]["title"] == "Paper A"
    assert result.citations[0]["page"] == 3


def test_no_citations_when_all_claims_fail():
    result = verify(
        "Accuracy improves by 94% [S1].", EVIDENCE,
        approved_doc_ids=["docA", "docB"],
    )
    assert result.citations == []


# --- claim segmentation -------------------------------------------------
def test_headings_are_not_claims():
    assert is_heading("A.4.3 PATCHING AND CHANNEL-INDEPENDENCE Implementation Details.")
    assert is_heading("3.2 REPRESENTATION LEARNING")
    assert is_heading("Models L N patch method MSE")
    assert not is_heading("We propose a patching scheme that reduces the token count.")


def test_deictic_openers_rejected():
    assert not is_self_contained("The problem can be alleviated by expanding the field.")
    assert not is_self_contained("These results indicate a strong trend.")
    assert is_self_contained("PatchTST reduces the token count for long series.")


def test_split_claims_skips_headings_and_footnotes():
    text = (
        "**Evidence-grounded answer**\n\n"
        "- PatchTST reduces the token count substantially [S1].\n"
        "- 4.3 IMPLEMENTATION DETAILS\n"
        "_Every sentence above is copied verbatim from a retrieved passage._\n"
    )
    claims = split_claims(text)
    assert len(claims) == 1, claims
    assert "PatchTST" in claims[0]


def test_is_heading_free_helper_exists():
    assert callable(is_heading_free)
