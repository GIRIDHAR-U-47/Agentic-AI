from typing import List, Optional, Dict, Any
from data.mock_data import MOCK_EVIDENCE_ROWS, MOCK_REPORT_CITATIONS
from models.schemas import EvidenceMatrixRow, RowStatus, ReportCitation

class ResearchService:
    def __init__(self):
        self.evidence_rows: List[Dict[str, Any]] = [dict(r) for r in MOCK_EVIDENCE_ROWS]

    def get_evidence_matrix(self) -> List[EvidenceMatrixRow]:
        return [EvidenceMatrixRow(**r) for r in self.evidence_rows]

    def update_evidence_status(self, row_id: str, status: RowStatus) -> Optional[EvidenceMatrixRow]:
        for r in self.evidence_rows:
            if r["id"] == row_id:
                r["status"] = status
                return EvidenceMatrixRow(**r)
        return None

    def get_report_citations(self) -> Dict[str, ReportCitation]:
        return {k: ReportCitation(**v) for k, v in MOCK_REPORT_CITATIONS.items()}

    def generate_bibtex(self) -> str:
        return """@article{nie2024patchtst,
  title={PatchTST for Long-Horizon Electricity Load and Price Forecasting},
  author={Nie, Yuqi and Nguyen, Nam H and Sinthong, Phaniteja and Kalagnanam, Jayant},
  journal={IEEE Transactions on Smart Grid},
  year={2024},
  doi={10.1109/TSG.2024.3389102}
}

@inproceedings{zhou2021informer,
  title={Informer: Beyond efficient transformer for long sequence time-series forecasting},
  author={Zhou, Haoyi and Zhang, Shanghang and Peng, Jieqi and Zhang, Shuai and Li, Jianxin and Xiong, Hui and Zhang, Wancai},
  booktitle={AAAI Conference on Artificial Intelligence},
  year={2021}
}

@inproceedings{zeng2023dlinear,
  title={Are transformers effective for time series?},
  author={Zeng, Ailing and Chen, Muxi and Zhang, Lei and Xu, Qiang},
  booktitle={AAAI Conference on Artificial Intelligence},
  year={2023}
}

@article{ramanathan2024microgrid,
  title={Microgrid Voltage Stability via Distributed Deep Recurrent Reinforcement Models},
  author={Ramanathan, K. and Senthil Kumar, P. V. and Deshmukh, Ananya},
  journal={IEEE Transactions on Smart Grid},
  year={2024},
  volume={15},
  number={2},
  pages={1104--1118}
}"""

    def export_matrix_csv(self) -> str:
        headers = ['Paper & Year', 'Primary Method', 'Dataset', 'Horizons', 'Result', 'Supported Claim', 'Status', 'Limitation', 'Research Gap']
        rows = [
            [
                f'"{r["authors"]} ({r["year"]})"',
                f'"{r["primaryMethod"]}"',
                f'"{r["datasetTested"]}"',
                f'"{", ".join(r["forecastHorizons"])}"',
                f'"{r["empiricalResult"]["primaryMetric"]}; {r["empiricalResult"]["secondaryMetric"]}"',
                f'"{r["supportedClaim"].replace(chr(34), chr(34)+chr(34))}"',
                f'"{r["status"]}"',
                f'"{r["identifiedLimitation"].replace(chr(34), chr(34)+chr(34))}"',
                f'"{r["researchGap"].replace(chr(34), chr(34)+chr(34))}"'
            ]
            for r in self.evidence_rows
        ]
        return "\n".join([",".join(headers)] + [",".join(e) for e in rows])

research_service = ResearchService()
