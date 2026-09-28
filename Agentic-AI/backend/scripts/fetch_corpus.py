"""Download and ingest the pinned evaluation/demo corpus from arXiv.

The mini project needs a *real* paper collection: fabricated DOIs and invented
metrics would make both the citations and the evaluation meaningless. This
script fetches a coherent, genuinely open-access sub-literature (transformer
architectures for time-series forecasting), records a manifest with SHA-256
checksums, and ingests each PDF through the same code path used for user
uploads.

Usage
-----
    python scripts/fetch_corpus.py            # download + ingest
    python scripts/fetch_corpus.py --verify   # check checksums only
    python scripts/fetch_corpus.py --force    # re-download even if present

PDFs are cached in `backend/data/corpus/` (git-ignored) because they total
~17 MB; the manifest is committed so the collection is auditable.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

BACKEND = Path(__file__).resolve().parent.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import config  # noqa: E402
import db  # noqa: E402
from services import arxiv, ingest  # noqa: E402

MANIFEST_PATH = config.CORPUS_DIR / "manifest.json"

# Version-pinned so re-running is stable. Titles below are for human readers;
# the authoritative metadata is always re-fetched from the arXiv API and is
# what actually gets stored.
CORPUS: List[Dict[str, str]] = [
    {"arxiv_id": "1706.03762", "note": "Foundational transformer (NeurIPS 2017)"},
    {"arxiv_id": "2012.07436", "note": "Informer: ProbSparse attention (AAAI 2021)"},
    {"arxiv_id": "2106.13008", "note": "Autoformer: series decomposition"},
    {"arxiv_id": "2205.13504", "note": "DLinear: challenges transformer necessity (AAAI 2023)"},
    {"arxiv_id": "2210.02186", "note": "TimesNet: 2D variation modelling (ICLR 2023)"},
    {"arxiv_id": "2211.14730", "note": "PatchTST: patching (ICLR 2023)"},
    {"arxiv_id": "2310.06625", "note": "iTransformer: inverted attention (ICLR 2024)"},
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_manifest() -> Dict[str, Any]:
    if MANIFEST_PATH.exists():
        try:
            return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except ValueError:
            pass
    return {"papers": {}}


def save_manifest(m: Dict[str, Any]) -> None:
    config.ensure_dirs()
    MANIFEST_PATH.write_text(json.dumps(m, indent=2, sort_keys=True), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="only verify cached checksums")
    ap.add_argument("--force", action="store_true", help="re-download even if cached")
    ap.add_argument("--no-ingest", action="store_true", help="download but do not ingest")
    args = ap.parse_args()

    config.ensure_dirs()
    db.init_db()
    manifest = load_manifest()
    papers: Dict[str, Any] = manifest.get("papers", {})

    print("=" * 74)
    print("R-Lens corpus fetch — pinned open-access papers from arXiv")
    print("=" * 74)
    print(f"Cache dir : {config.CORPUS_DIR}")
    print(f"Database  : {config.DB_PATH}")
    print(f"Mode      : {'verify only' if args.verify else 'download + ingest'}")
    print()

    failures: List[str] = []
    for entry in CORPUS:
        aid = entry["arxiv_id"]
        pdf_path = config.CORPUS_DIR / f"{aid}.pdf"
        rec = papers.get(aid, {})

        # 1. bytes
        if pdf_path.exists() and not args.force:
            data = pdf_path.read_bytes()
            status = "cached"
        elif args.verify:
            data = b""
            status = "MISSING"
        else:
            try:
                data = arxiv.download_pdf(aid, pdf_path)
                pdf_path.write_bytes(data)
                status = "downloaded"
            except Exception as exc:
                print(f"  [FAIL] {aid}: download failed: {exc}")
                failures.append(aid)
                continue
            time.sleep(1.0)  # be polite to arXiv

        digest = sha256(data) if data else None
        mismatch = bool(digest and rec.get("sha256") and digest != rec["sha256"])

        # 2. authoritative metadata
        meta: Dict[str, Any] = dict(rec.get("metadata") or {})
        if status != "MISSING":
            try:
                fresh = arxiv.lookup(aid)
                if fresh:
                    meta = fresh
            except Exception as exc:
                print(f"  [warn] {aid}: metadata lookup failed ({exc}); using manifest cache")

        if args.verify:
            ok = "OK " if (digest and not mismatch) else "BAD"
            print(f"  [{ok}] {aid}  {status:<10} sha256={str(digest)[:16]}...  {entry['note']}")
            if mismatch:
                failures.append(aid)
            continue

        # 3. ingest
        ingested = False
        if data and not args.no_ingest:
            try:
                doc = ingest.ingest_pdf(
                    data,
                    filename=pdf_path.name,
                    source="arxiv",
                    metadata={
                        "id": f"arxiv_{aid.replace('.', '_')}",
                        "arxiv_id": aid,
                        **meta,
                    },
                )
                ingested = True
                print(
                    f"  [ OK ] {aid}  {status:<10} "
                    f"pages={doc['page_count']:<3} chunks={doc['chunk_count']:<5} "
                    f"| {doc['title'][:52]}"
                )
            except Exception as exc:
                print(f"  [FAIL] {aid}: ingest failed: {exc}")
                failures.append(aid)
                continue
        else:
            print(f"  [ OK ] {aid}  {status:<10} (not ingested)")

        if digest:
            papers[aid] = {
                "sha256": digest,
                "bytes": len(data),
                "note": entry["note"],
                "title": meta.get("title", ""),
                "authors": meta.get("authors", ""),
                "year": meta.get("year", ""),
                "venue": meta.get("venue", ""),
                "abs_url": meta.get("abs_url", f"https://arxiv.org/abs/{aid}"),
                "ingested": ingested,
                "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        if mismatch:
            print(f"         [warn] checksum changed vs manifest (upstream re-release?)")

    if not args.verify:
        manifest["papers"] = papers
        manifest["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        manifest["source"] = "https://arxiv.org"
        save_manifest(manifest)

    stats = db.corpus_stats()
    print()
    print("-" * 74)
    print(f"Corpus now holds {stats['documents']} documents / {stats['chunks']} chunks "
          f"({stats['chunk_chars']:,} chars)")
    print(f"Manifest: {MANIFEST_PATH}")
    if failures:
        print(f"FAILED: {len(failures)} paper(s): {', '.join(failures)}")
        return 1
    print("All pinned papers fetched successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
