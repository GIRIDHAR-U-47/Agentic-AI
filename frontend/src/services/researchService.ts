import { MOCK_EVIDENCE_ROWS } from '../data/mockResearchData';
import { EvidenceMatrixRow } from '../types';

class ResearchService {
  private evidenceRows: EvidenceMatrixRow[] = [...MOCK_EVIDENCE_ROWS];

  getEvidenceMatrix(): EvidenceMatrixRow[] {
    return [...this.evidenceRows];
  }

  updateEvidenceStatus(rowId: string, status: EvidenceMatrixRow['status']): void {
    const row = this.evidenceRows.find(r => r.id === rowId);
    if (row) {
      row.status = status;
    }
  }

  generateBibTeX(): string {
    return `@article{nie2024patchtst,
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
}`;
  }

  exportMatrixCsv(): string {
    const headers = ['Paper & Year', 'Primary Method', 'Dataset', 'Horizons', 'Result', 'Supported Claim', 'Status', 'Limitation', 'Research Gap'];
    const rows = this.evidenceRows.map(r => [
      `"${r.authors} (${r.year})"`,
      `"${r.primaryMethod}"`,
      `"${r.datasetTested}"`,
      `"${r.forecastHorizons.join(', ')}"`,
      `"${r.empiricalResult.primaryMetric}; ${r.empiricalResult.secondaryMetric}"`,
      `"${r.supportedClaim.replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.identifiedLimitation.replace(/"/g, '""')}"`,
      `"${r.researchGap.replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  }
}

export const researchService = new ResearchService();
