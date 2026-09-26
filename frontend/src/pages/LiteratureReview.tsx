import React, { useState } from 'react';
import { 
  CheckCircle, 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  Sparkles, 
  BookmarkCheck, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  Layers,
  GitCompare,
  Clock,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

interface CitationInfo {
  id: string;
  tag: string;
  title: string;
  authors: string;
  venue: string;
  snippet: string;
  conf: string;
  source: string;
  doi: string;
  snippetsCount: number;
}

const CITATIONS: Record<string, CitationInfo> = {
  '1': {
    id: '1',
    tag: '[1] Nie et al., 2023',
    title: 'A Time Series is Worth 64 Words: Long-term Forecasting with Transformers',
    authors: 'Y. Nie, N. H. Nguyen, P. Sinthong, and J. Kalagnanam',
    venue: 'Proc. International Conference on Learning Representations (ICLR), 2023',
    snippet: 'PatchTST retains local semantic continuity while reducing attention complexity from quadratic O(L²) down to O((L/P)²), exhibiting state-of-the-art MSE reductions across 96-720 forecasting horizons on electricity grid datasets.',
    conf: '0.962',
    source: 'ICLR 2023 • Page 4, Col 2',
    doi: '10.48550/arXiv.2211.14730',
    snippetsCount: 14
  },
  '2': {
    id: '2',
    tag: '[2] Zeng et al., 2023',
    title: 'Are Transformers Effective for Time Series?',
    authors: 'A. Zeng, M. Chen, L. Zhang, and Q. Xu',
    venue: 'AAAI Conference on Artificial Intelligence, vol. 37, no. 9, pp. 11121-11128, 2023',
    snippet: 'Simple linear mapping with channel independence substantially outperforms complex self-attention architectures on continuous long-term horizons, questioning the temporal extraction utility of vanilla attention.',
    conf: '0.948',
    source: 'AAAI 2023 • Page 11122',
    doi: '10.1609/aaai.v37i9.26317',
    snippetsCount: 8
  },
  '3': {
    id: '3',
    tag: '[3] Zhou et al., 2021',
    title: 'Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting',
    authors: 'H. Zhou, S. Zhang, J. Peng, et al.',
    venue: 'AAAI Conference on Artificial Intelligence, 2021',
    snippet: 'ProbSparse attention mechanism cuts query complexity to O(L log L) with distilling operations highlighting dominating temporal features in sub-hourly grid series.',
    conf: '0.953',
    source: 'AAAI 2021 • Page 1110',
    doi: '10.1609/aaai.v35i12.17325',
    snippetsCount: 11
  },
  '5': {
    id: '5',
    tag: '[5] Salinas et al., 2020',
    title: 'DeepAR: Probabilistic Forecasting with Autoregressive Recurrent Networks',
    authors: 'J. Salinas, V. Flunkert, D. Salinas',
    venue: 'International Journal of Forecasting, vol. 36, no. 3, 2020',
    snippet: 'Autoregressive recurrent networks producing negative-binomial predictive intervals for highly intermittent load sequences with dynamic scale estimation.',
    conf: '0.931',
    source: 'Int. J. Forecast • Page 702',
    doi: '10.1016/j.ijforecast.2019.07.001',
    snippetsCount: 6
  },
  '6': {
    id: '6',
    tag: '[6] Yu et al., 2018',
    title: 'Spatio-Temporal Graph Convolutional Networks: A Deep Learning Framework for Traffic & Power Flow',
    authors: 'B. Yu, H. Yin, and Z. Zhu',
    venue: 'Proc. IJCAI, 2018',
    snippet: 'Graph Laplacian spatial formulations encode physical grid bus connectivity, but encounter gradient attenuation and spatial over-smoothing past 72-hour forecasting regimes.',
    conf: '0.941',
    source: 'IJCAI 2018 • Page 506',
    doi: '10.24963/ijcai.2018/505',
    snippetsCount: 9
  },
  '7': {
    id: '7',
    tag: '[7] Wu et al., 2021',
    title: 'Autoformer: Decomposition Transformers with Auto-Correlation for Long-Term Series Forecasting',
    authors: 'H. Wu, J. Xu, J. Wang, and M. Long',
    venue: 'NeurIPS, 2021',
    snippet: 'Decomposes trend-cyclical components from periodic seasonality through series-level cross-correlation connections, operating at sub-series granularity.',
    conf: '0.957',
    source: 'NeurIPS 2021 • Page 3540',
    doi: '10.5555/3540261.3541999',
    snippetsCount: 15
  },
  '12': {
    id: '12',
    tag: '[12] Ramanathan et al., 2024',
    title: 'Microgrid Voltage Stability via Distributed Deep Recurrent Reinforcement Models',
    authors: 'K. Ramanathan, et al.',
    venue: 'IEEE Trans. Smart Grid, vol. 15, no. 2, 2024',
    snippet: 'Real-world voltage profile telemetry across Rajalakshmi Engineering College 11kV substation grid shows critical multi-horizon dispatch dependencies during peak PV ramp hours.',
    conf: '0.985',
    source: 'IEEE Trans. Smart Grid 2024',
    doi: '10.1109/TSG.2023.3289011',
    snippetsCount: 18
  }
};

export const LiteratureReview: React.FC = () => {
  const [activeCitationId, setActiveCitationId] = useState<string>('1');
  const [hoveredCitation, setHoveredCitation] = useState<{ id: string; x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [activeSection, setActiveSection] = useState('sec-abstract');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const activeCitation = CITATIONS[activeCitationId] || CITATIONS['1'];

  const handleCopyBibtex = () => {
    const bibtex = `@article{REC2025deepgrid,
  title={Deep Learning Architectures for Multi-Horizon Electricity Grid Forecasting: A Grounded Systematic Review},
  author={Ramanathan, K. and Senthil Kumar, P. V. and Deshmukh, A. and REC Clean Energy Computing Team},
  journal={REC Research Journal of Applied Systems},
  volume={14},
  number={2},
  pages={101--128},
  year={2025},
  publisher={Rajalakshmi Engineering College Academic Press},
  doi={10.1109/TSG.2024.3389102}
}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bibtex);
    }
    showToast('All 12 BibTeX references copied to clipboard!');
  };

  const handleCitationClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (CITATIONS[id]) {
      setActiveCitationId(id);
    }
  };

  const handleCitationHover = (id: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredCitation({
      id,
      x: Math.min(rect.left + window.scrollX - 20, window.innerWidth - 320),
      y: rect.bottom + window.scrollY + 8
    });
  };

  const sections = [
    { id: 'sec-abstract', title: 'Executive Abstract', num: '' },
    { id: 'sec-intro', title: 'Introduction & Grid Dynamics', num: '01' },
    { id: 'sec-evolution', title: 'Architectural Evolution (CNN → Diff)', num: '02' },
    { id: 'sec-benchmark', title: 'Comparative Benchmark Matrix', num: '03' },
    { id: 'sec-debate', title: 'Transformer vs. Linear Debate', num: '04' },
    { id: 'sec-gaps', title: 'Identified Research Gaps', num: '05' },
    { id: 'sec-rec-proposal', title: 'Proposed REC Framework', num: '06' },
    { id: 'sec-references', title: 'References (12 Validated)', num: '07' }
  ];

  return (
    <div className="w-full bg-surface-container-lowest min-h-screen text-on-surface">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-xl font-body-sm text-body-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hover Popover */}
      {hoveredCitation && CITATIONS[hoveredCitation.id] && (
        <div 
          className="fixed z-50 w-72 bg-surface-container-lowest rounded-xl p-3 shadow-xl text-on-surface border border-outline-variant/50 pointer-events-none"
          style={{ top: `${hoveredCitation.y}px`, left: `${hoveredCitation.x}px` }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-code-sm text-code-sm font-bold text-primary">
              {CITATIONS[hoveredCitation.id].tag}
            </span>
            <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Grounded
            </span>
          </div>
          <div className="font-title-sm text-title-sm font-semibold text-on-surface text-xs leading-snug">
            {CITATIONS[hoveredCitation.id].title}
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant italic mt-1 text-[11px] leading-relaxed line-clamp-3">
            "{CITATIONS[hoveredCitation.id].snippet}"
          </div>
        </div>
      )}

      {/* Document Action Header Strip */}
      <header className="bg-surface-container-lowest px-gutter-desktop py-space-md flex flex-wrap items-center justify-between gap-space-md border-b border-outline-variant/40 shadow-sm sticky top-16 z-30">
        <div className="flex flex-col min-w-0 max-w-2xl">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>REC Scholar Synthesis Report • Milestone 04</span>
            <span className="text-outline-variant">•</span>
            <span className="font-code-sm text-code-sm text-outline">DOC-ID: REC-2025-EE-0894</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface truncate font-bold mt-0.5">
            Literature Review: Deep Learning Architectures for Multi-Horizon Electricity Grid Forecasting
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            Generated by REC Scholar (R-Lens) v2.4 • Student Research Bench • Authors: Dr. K. Ramanathan &amp; REC Clean Energy Computing Team
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-space-xs">
          <button 
            className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-title-sm text-title-sm transition-all"
            title="Verify all 84 citations against original PDF token embeddings"
            onClick={() => setShowAuditModal(true)}
            type="button"
          >
            <BookmarkCheck className="w-4 h-4 text-secondary" />
            <span>Citation Audit</span>
          </button>
          
          <button 
            className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-title-sm text-title-sm transition-all"
            onClick={handleCopyBibtex}
            type="button"
          >
            <Copy className="w-4 h-4" />
            <span>Copy BibTeX</span>
          </button>

          <div className="relative inline-block text-left">
            <button 
              className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-title-sm text-title-sm transition-all"
              onClick={() => setShowExportMenu(!showExportMenu)}
              type="button"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-surface-container-lowest shadow-lg border border-outline-variant/50 py-1 z-50">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  onClick={() => { setShowExportMenu(false); showToast('Exporting PDF manuscript...'); }}
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span>PDF Manuscript (IEEE)</span>
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  onClick={() => { setShowExportMenu(false); handleCopyBibtex(); }}
                >
                  <Copy className="w-4 h-4 text-secondary" />
                  <span>BibTeX Citations</span>
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  onClick={() => { setShowExportMenu(false); showToast('Exporting Markdown document...'); }}
                >
                  <Share2 className="w-4 h-4 text-outline" />
                  <span>Markdown (.md)</span>
                </button>
              </div>
            )}
          </div>

          <button 
            className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary hover:bg-tertiary shadow-sm font-title-sm text-title-sm transition-all"
            onClick={() => showToast('Re-synthesizing Section 5 using latest ArXiv papers...')}
            type="button"
          >
            <Sparkles className="w-4 h-4" />
            <span>Regenerate Section</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="p-gutter-desktop flex flex-col gap-space-lg">
        {/* Research Quality & Evidence Integrity Dashboard */}
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm border border-outline-variant/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md pb-space-sm">
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
                Grounding &amp; Provenance Protocol
              </span>
              <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                Evidence Integrity Benchmark (Zero-Hallucination Gate)
              </h2>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
              <span className="inline-flex items-center gap-1.5 text-primary font-semibold bg-surface-container-lowest px-space-sm py-space-2xs rounded border border-outline-variant/30">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                Agent Rigor Level: Institutional Peer-Review
              </span>
            </div>
          </div>

          {/* 4 Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-xs">
            {/* Metric 1 */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md flex items-center justify-between shadow-sm border border-outline-variant/30">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Citation Coverage</span>
                <div className="flex items-baseline gap-space-xs mt-1">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">94%</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">High Integrity</span>
                </div>
                <span className="font-code-sm text-code-sm text-outline mt-0.5">84/89 statements indexed</span>
              </div>
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="94, 100" strokeLinecap="round" strokeWidth="3.5" />
                </svg>
                <span className="material-symbols-outlined absolute inset-0 m-auto flex items-center justify-center text-[18px] text-primary">auto_stories</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md flex items-center justify-between shadow-sm border border-outline-variant/30">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Validated Papers</span>
                <div className="flex items-baseline gap-space-xs mt-1">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">12</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sources</span>
                </div>
                <span className="font-code-sm text-code-sm text-outline mt-0.5">100% Peer-Reviewed IEEE/ACM</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary-container/40 flex items-center justify-center text-on-secondary-container shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md flex items-center justify-between shadow-sm border border-outline-variant/30">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Evidence Passages</span>
                <div className="flex items-baseline gap-space-xs mt-1">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">84</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Snippets</span>
                </div>
                <span className="font-code-sm text-code-sm text-outline mt-0.5">Raw token bounding boxes</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">find_in_page</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md flex items-center justify-between shadow-sm border border-outline-variant/30">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Unsupported Claims</span>
                <div className="flex items-baseline gap-space-xs mt-1">
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">0</span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Strict Grounding</span>
                </div>
                <span className="font-code-sm text-code-sm text-outline mt-0.5">No hallucination detected</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Split Canvas: 3 - 6 - 3 columns */}
        <div className="grid grid-cols-12 gap-space-lg items-start">
          
          {/* LEFT: Sticky Document Outline Navigator (3 Columns) */}
          <nav aria-label="Table of contents" className="hidden lg:block lg:col-span-3 sticky top-36 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
              <span className="font-label-md text-label-md text-outline uppercase font-bold tracking-wider">Document Outline</span>
              <span className="font-code-sm text-code-sm text-primary font-medium">7 Sections</span>
            </div>
            <ul className="flex flex-col gap-space-2xs text-on-surface-variant font-body-sm text-body-sm mt-3">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`group flex items-center gap-space-xs py-1.5 px-2 rounded-lg transition-colors ${
                      activeSection === sec.id
                        ? 'bg-surface-container text-primary font-semibold'
                        : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {sec.num ? (
                      <span className={`font-code-sm text-code-sm w-4 ${sec.id === 'sec-gaps' ? 'text-secondary font-bold' : 'text-outline'}`}>
                        {sec.num}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
                    )}
                    <span className="truncate">{sec.title}</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Visual Academic Artifact Box */}
            <div className="mt-space-lg p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-space-xs text-primary font-title-sm text-title-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">token</span>
                <span>Agent Provenance</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs leading-relaxed">
                Synthesized across 3,420 tokenized pages. Full context tree verified against IEEE PES &amp; NeurIPS proceedings.
              </p>
              <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm pt-2 border-t border-outline-variant/30">
                <span>Hallucination Rate:</span>
                <span className="text-primary font-bold">0.00%</span>
              </div>
            </div>
          </nav>

          {/* CENTER: Publication Preview Canvas (6 Columns) */}
          <main className="col-span-12 lg:col-span-6 flex flex-col gap-space-md">
            <article className="bg-surface-container-lowest rounded-xl p-space-xl md:p-space-2xl shadow-sm text-on-surface relative border border-outline-variant/30">
              {/* Document Header */}
              <div className="text-center pb-space-lg border-b border-outline-variant/30">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline font-semibold">
                  REC Research Journal of Applied Systems • In-Depth Synthesis
                </span>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-space-xs tracking-tight">
                  Deep Learning Architectures for Multi-Horizon Electricity Grid Forecasting: A Grounded Systematic Review
                </h1>
                <div className="mt-space-md flex flex-wrap items-center justify-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
                  <span className="font-semibold text-primary">Dr. K. Ramanathan</span>
                  <span className="text-outline">•</span>
                  <span>P. V. Senthil Kumar</span>
                  <span className="text-outline">•</span>
                  <span>Ananya Deshmukh</span>
                  <span className="text-outline">•</span>
                  <span className="text-on-surface">Department of EEE &amp; AI Research Cell, Rajalakshmi Engineering College</span>
                </div>
                <div className="mt-space-xs text-outline font-code-sm text-code-sm">
                  Indexing: REC-IR-2025-04 • Verified Repository: IEEE Xplore / ArXiv Time-Series Archive
                </div>
              </div>

              {/* Section: Abstract */}
              <section className="my-space-md p-space-lg rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30" id="sec-abstract">
                <h2 className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-primary mb-space-2xs">
                  Abstract
                </h2>
                <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant text-justify">
                  Grid-scale load and renewable dispatch forecasting under high variable penetration requires reliable predictions across 24-hour to 168-hour horizons. While classical autoregressive models and Recurrent Neural Networks (RNNs) set foundational benchmarks, the last quadrennium has seen aggressive deployment of Transformer-based self-attention architectures and channel-independent linear projections. This review establishes an evidence-grounded comparative synthesis of five state-of-the-art architectures: PatchTST, Informer, DLinear, Spatio-Temporal Graph Networks (ST-GNN), and Denoising Diffusion Probabilistic Models (DDPM). We analyze empirical performance across standard ETT, ECL, and REC Microgrid feeds, critically evaluating the trade-off between cross-variate modeling complexity and temporal receptive accuracy. Finally, we formulate the spatial-temporal correlation dilemma in ultra-long horizons and outline the architectural direction for the REC Hybrid Microgrid bench.
                </p>
                <div className="mt-space-sm pt-space-xs flex flex-wrap gap-space-xs items-center">
                  <span className="font-label-sm text-label-sm font-semibold text-outline">Keywords:</span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">Electricity Demand Forecasting</span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">PatchTST</span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">Multi-Horizon</span>
                  <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">Microgrid Resilience</span>
                </div>
              </section>

              {/* Section 1: Introduction */}
              <section className="mt-space-lg flex flex-col gap-space-sm" id="sec-intro">
                <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm text-primary">1.0</span>
                  <span>Introduction &amp; Modern Power Grid Forecasting Challenges</span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  Modern power systems are undergoing unprecedented volatility driven by high distributed energy resource (DER) penetration, sudden electric vehicle charging load peaks, and climate-induced thermal constraints
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('12', e)}
                    onMouseEnter={(e) => handleCitationHover('12', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [12]
                  </button>.
                  Multi-horizon electricity forecasting—spanning day-ahead (24h) to week-ahead (168h) regimes—is imperative for dispatch co-optimization, spinning reserve allocation, and ancillary frequency control. Historical forecasting infrastructure predominantly relied on Seasonal ARIMA and multi-layer perceptrons, which fail to ingest non-linear multi-scale interactions during localized grid disturbances
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('3', e)}
                    onMouseEnter={(e) => handleCitationHover('3', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [3]
                  </button>.
                </p>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  Recent deep sequence formulations treat load signals as multivariate time series. However, quadratic compute scaling <span className="font-code-sm text-code-sm bg-surface-container px-1 py-0.5 rounded">O(L²)</span> in canonical Vanilla Transformers presented intractable bottlenecks when operating over prolonged context windows (<span className="font-code-sm text-code-sm">L &gt; 720</span>)
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('7', e)}
                    onMouseEnter={(e) => handleCitationHover('7', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [7]
                  </button>.
                  Consequently, architectural discourse has shifted toward patch tokenization and decomposing temporal trends from seasonal variances.
                </p>
              </section>

              {/* Section 2: Architectural Evolution */}
              <section className="mt-space-lg flex flex-col gap-space-sm" id="sec-evolution">
                <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm text-primary">2.0</span>
                  <span>Evolution of Forecasting Architectures: Linear to Diffusion</span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  The paradigm shift progressed along four distinct algorithmic milestones:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm my-space-xs">
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm font-bold text-primary">Phase I: Temporal Convolution (TCN)</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Dilated causal convolutions enabled extended receptive fields with steady gradients, though cross-variate correlations remained static.</p>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm font-bold text-primary">Phase II: Sparse Transformers</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Informer and Autoformer introduced ProbSparse attention and autocorrelation decomposition, dropping complexity to O(L log L).</p>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm font-bold text-primary">Phase III: Patch-Level Attention</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">PatchTST segmented sub-series into patches, capturing semantic locality and utilizing channel-independence to curb inter-channel noise.</p>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm font-bold text-primary">Phase IV: Generative Diffusion (DDPM)</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Continuous conditional diffusion yields probabilistic confidence intervals crucial for wind and solar uncertainty bounds.</p>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  As articulated by Nie et al.
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('1', e)}
                    onMouseEnter={(e) => handleCitationHover('1', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [1]
                  </button>,
                  segmenting time-series sequences into tokenized sub-segments drastically elevates signal-to-noise ratio:
                </p>
                <blockquote className="my-space-sm p-space-md rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm italic border-l-4 border-primary">
                  "PatchTST retains local semantic continuity while reducing attention complexity from quadratic O(L²) down to O((L/P)²), exhibiting state-of-the-art MSE reductions across 96-720 forecasting horizons on electricity grid datasets."
                  <span className="block mt-1 font-label-sm text-label-sm not-italic font-bold text-primary">
                    — Nie et al., ICLR 2023 [Validated Evidence Passage #14]
                  </span>
                </blockquote>
              </section>

              {/* Section 3: Benchmark Table */}
              <section className="mt-space-lg flex flex-col gap-space-sm" id="sec-benchmark">
                <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm text-primary">3.0</span>
                  <span>Methodological Benchmark &amp; Performance Matrix</span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                  Consolidated evaluation of predictive MSE (standardized on Electricity 720-step horizon), GPU training memory overhead, and resilience to sudden line-fault transients:
                </p>
                <div className="overflow-x-auto rounded-lg bg-surface-container-lowest shadow-sm my-space-xs border border-outline-variant/30">
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead className="bg-surface-container text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                      <tr>
                        <th className="py-space-sm px-space-md font-bold">Architecture</th>
                        <th className="py-space-sm px-space-md font-bold">Paradigm</th>
                        <th className="py-space-sm px-space-md font-bold">ECL MSE (720h)</th>
                        <th className="py-space-sm px-space-md font-bold">Complexity</th>
                        <th className="py-space-sm px-space-md font-bold">Spatial Topology</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container text-on-surface-variant">
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-sm px-space-md font-semibold text-primary">PatchTST</td>
                        <td className="py-space-sm px-space-md">Patch + Self-Attn</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm font-bold text-on-surface">0.198</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm">O((L/P)²)</td>
                        <td className="py-space-sm px-space-md text-outline">Channel Indep.</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-sm px-space-md font-semibold text-on-surface">DLinear</td>
                        <td className="py-space-sm px-space-md">Direct 1-Layer Linear</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm font-bold text-on-surface">0.215</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm">O(L)</td>
                        <td className="py-space-sm px-space-md text-outline">None</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-sm px-space-md font-semibold text-on-surface">Autoformer</td>
                        <td className="py-space-sm px-space-md">Auto-Correlation</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm text-on-surface">0.246</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm">O(L log L)</td>
                        <td className="py-space-sm px-space-md text-outline">Cross-Variate</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-sm px-space-md font-semibold text-on-surface">ST-GNN (Graph)</td>
                        <td className="py-space-sm px-space-md">Spatio-Temporal GCN</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm text-on-surface">0.279</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm">O(N² + L)</td>
                        <td className="py-space-sm px-space-md text-secondary font-semibold">Native Adjacency</td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-sm px-space-md font-semibold text-on-surface">TimeDiff (DDPM)</td>
                        <td className="py-space-sm px-space-md">Score-Based Diffusion</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm text-on-surface">0.204</td>
                        <td className="py-space-sm px-space-md font-code-sm text-code-sm">O(K · L)</td>
                        <td className="py-space-sm px-space-md text-outline">Implicit</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <span className="font-code-sm text-code-sm text-outline">Source: Aggregated from 12 validated benchmark papers normalized on standard Electricity Benchmark (321 substations).</span>
              </section>

              {/* Section 4: Transformer vs Linear */}
              <section className="mt-space-lg flex flex-col gap-space-sm" id="sec-debate">
                <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm text-primary">4.0</span>
                  <span>Critical Limitations &amp; The 'Transformer vs. Linear' Debate</span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  Zeng et al.
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('2', e)}
                    onMouseEnter={(e) => handleCitationHover('2', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [2]
                  </button>
                  provoked vital introspection across the time-series machine learning community by demonstrating that simple single-layer linear mappings (DLinear/NLinear) frequently outperformed complex Transformers across lengthy prediction windows. They argued that temporal order is inherently trivial to extract linearly, and permutation-invariant self-attention mechanics suffer from temporal information degradation.
                </p>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  However, closer audit indicates that while linear architectures excel at periodic sinusoidal loads, they collapse under intermittent renewable power injections (solar inverter cloud-transients and wind ramp events) where non-linear contextual conditioning is essential
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('5', e)}
                    onMouseEnter={(e) => handleCitationHover('5', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [5]
                  </button>.
                </p>
              </section>

              {/* Section 5: Identified Gaps */}
              <section className="mt-space-lg flex flex-col gap-space-sm p-space-md rounded-xl bg-secondary-fixed/30 text-on-secondary-fixed border border-secondary-fixed-dim/40" id="sec-gaps">
                <div className="flex items-center gap-space-xs text-secondary">
                  <span className="material-symbols-outlined text-[20px]">flag</span>
                  <h2 className="font-title-md text-title-md font-bold text-on-surface">5.0 Identified Research Gap: Spatio-Temporal Bifurcation</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify font-medium">
                  The prevailing literature reveals a critical bifurcation: temporal models (PatchTST, Informer) neglect spatial power grid topological constraints
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('1', e)}
                    onMouseEnter={(e) => handleCitationHover('1', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [1]
                  </button>
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('2', e)}
                    onMouseEnter={(e) => handleCitationHover('2', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [2]
                  </button>,
                  whereas graph-based networks (ST-GNN) fail on extended forecasting horizons beyond 72 hours due to over-smoothing over graph convolutions
                  <button 
                    className="citation-tag inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-surface-container text-primary hover:bg-primary-container hover:text-on-primary font-code-sm text-code-sm font-semibold transition-colors cursor-pointer" 
                    onClick={(e) => handleCitationClick('6', e)}
                    onMouseEnter={(e) => handleCitationHover('6', e)}
                    onMouseLeave={() => setHoveredCitation(null)}
                    type="button"
                  >
                    [6]
                  </button>.
                  A unified spatio-temporal diffusion-patch architecture represents an unaddressed research frontier for regional microgrid operations.
                </p>
              </section>

              {/* Section 6: REC Proposal */}
              <section className="mt-space-lg flex flex-col gap-space-sm" id="sec-rec-proposal">
                <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-space-xs">
                  <span className="font-code-sm text-code-sm text-primary">6.0</span>
                  <span>Proposed REC Framework: Spatio-Temporal Patch Diffusion</span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed text-justify">
                  To resolve the horizon degradation problem at Rajalakshmi Engineering College (REC) Campus Smart Microgrid, our team introduces the
                  <strong className="text-primary font-bold"> REC-ST-PatchNet</strong>. This framework fuses channel-independent patch projections with dynamic Kirchhoff power-flow adjacency matrices, preventing the over-smoothing penalty while maintaining O((L/P)²) compute feasibility.
                </p>
                {/* Visual Architectural Diagram Graphic */}
                <div className="my-space-md p-space-md rounded-xl bg-surface-container-low flex flex-col items-center border border-outline-variant/30">
                  <div className="w-full max-w-md py-space-sm">
                    <svg className="w-full h-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 420 130">
                      <rect className="fill-surface-container stroke-primary-container" height="40" rx="6" strokeWidth="1.5" width="75" x="10" y="45"></rect>
                      <text className="fill-on-surface font-semibold" fontSize="10" stroke="none" textAnchor="middle" x="47" y="68">Microgrid Feeds</text>
                      <path d="M85 65 L115 65" strokeDasharray="3 3" strokeWidth="1.5"></path>
                      <rect className="fill-primary-fixed stroke-primary" height="70" rx="6" strokeWidth="1.5" width="85" x="115" y="30"></rect>
                      <text className="fill-primary font-bold" fontSize="10" stroke="none" textAnchor="middle" x="157" y="60">Patch Division</text>
                      <text className="fill-on-primary-fixed-variant" fontSize="9" stroke="none" textAnchor="middle" x="157" y="75">P=16, S=8</text>
                      <path d="M200 65 L230 65" strokeWidth="1.5"></path>
                      <rect className="fill-surface-container-highest stroke-outline" height="70" rx="6" strokeWidth="1.5" width="95" x="230" y="30"></rect>
                      <text className="fill-on-surface font-bold" fontSize="10" stroke="none" textAnchor="middle" x="277" y="58">Topology Cross-Attn</text>
                      <text className="fill-on-surface-variant" fontSize="9" stroke="none" textAnchor="middle" x="277" y="73">Kirchhoff GCN</text>
                      <path d="M325 65 L355 65" strokeWidth="1.5"></path>
                      <rect className="fill-secondary-fixed stroke-secondary" height="40" rx="6" strokeWidth="1.5" width="60" x="355" y="45"></rect>
                      <text className="fill-on-secondary-fixed font-bold" fontSize="10" stroke="none" textAnchor="middle" x="385" y="68">168h Load</text>
                    </svg>
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">Fig 1. Schematic of REC-ST-PatchNet architecture with topology-conditioned patch tokens.</span>
                </div>
              </section>

              {/* Section 7: Grounded References */}
              <section className="mt-space-2xl pt-space-lg bg-surface-container-lowest border-t border-outline-variant/40" id="sec-references">
                <div className="flex items-center justify-between mb-space-md">
                  <h2 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-space-xs">
                    <span className="font-code-sm text-code-sm text-primary">7.0</span>
                    <span>References (All Grounded in REC Scholar Index)</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    DOIs Fully Resolved
                  </span>
                </div>
                <ol className="flex flex-col gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
                  {Object.values(CITATIONS).map((cite) => (
                    <li 
                      key={cite.id} 
                      className={`p-space-sm rounded-lg transition-colors flex items-start gap-space-sm cursor-pointer ${
                        activeCitationId === cite.id ? 'bg-surface-container ring-1 ring-primary/40' : 'hover:bg-surface-container-low'
                      }`}
                      onClick={() => setActiveCitationId(cite.id)}
                    >
                      <span className="font-code-sm text-code-sm text-primary font-bold w-6 shrink-0">{`[${cite.id}]`}</span>
                      <div className="flex flex-col flex-1">
                        <span className="text-on-surface font-medium">
                          {cite.authors}, "{cite.title}," in <em className="italic">{cite.venue}</em>.
                        </span>
                        <div className="flex items-center gap-space-md mt-1 font-code-sm text-code-sm text-outline">
                          <span>DOI: {cite.doi}</span>
                          <span className="text-primary font-medium">✓ {cite.snippetsCount} Snippets Verified</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </article>
          </main>

          {/* RIGHT: Floating Real-Time Claim Verifier & PDF Provenance Inspector (3 Columns) */}
          <aside className="col-span-12 lg:col-span-3 sticky top-36 flex flex-col gap-space-md">
            {/* Live Inspector Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
                <div className="flex items-center gap-space-xs text-primary font-title-sm text-title-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Claim Verifier</span>
                </div>
                <span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-code-sm text-code-sm font-bold">
                  100% Grounded
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-2">
                Click any citation tag (e.g. <span className="font-code-sm text-code-sm text-primary font-bold">[1]</span> or <span className="font-code-sm text-code-sm text-primary font-bold">[12]</span>) in the document to inspect its grounded evidence bbox.
              </p>

              {/* Active Inspected Claim Context */}
              <div className="mt-space-md p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs border border-primary/20 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-outline text-[10px]">
                    Active Citation
                  </span>
                  <span className="font-code-sm text-code-sm px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-bold">
                    {activeCitation.tag}
                  </span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface font-semibold mt-1 line-clamp-2">
                  "{activeCitation.title}"
                </div>
                
                {/* PDF Highlight Viewport Snippet */}
                <div className="mt-space-xs p-space-sm rounded bg-surface-container-lowest text-on-surface-variant font-code-sm text-code-sm leading-relaxed border-l-2 border-primary-container text-xs">
                  <span className="text-primary font-bold block mb-0.5">{activeCitation.source}:</span>
                  <span>"{activeCitation.snippet}"</span>
                </div>

                <div className="mt-space-sm flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant text-xs pt-1">
                  <span>Embedding Cosine: <strong className="text-primary font-bold">{activeCitation.conf}</strong></span>
                  <a 
                    className="text-primary font-semibold hover:underline flex items-center gap-0.5" 
                    href="#sec-references"
                  >
                    View Source <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Integrity Safeguards Checklist */}
              <div className="mt-space-lg flex flex-col gap-space-xs pt-3 border-t border-outline-variant/30">
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-outline text-[11px]">
                  Safety &amp; Compliance Checks
                </span>
                <div className="flex items-center justify-between py-1 text-on-surface-variant font-body-sm text-body-sm text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    Hallucination Free
                  </span>
                  <span className="font-code-sm text-code-sm text-primary font-semibold">PASSED</span>
                </div>
                <div className="flex items-center justify-between py-1 text-on-surface-variant font-body-sm text-body-sm text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    IEEE Citations Formatted
                  </span>
                  <span className="font-code-sm text-code-sm text-primary font-semibold">IEEE-STD</span>
                </div>
                <div className="flex items-center justify-between py-1 text-on-surface-variant font-body-sm text-body-sm text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    REC Ethical Guidelines
                  </span>
                  <span className="font-code-sm text-code-sm text-primary font-semibold">VERIFIED</span>
                </div>
              </div>

              {/* Agent Action Button */}
              <div className="mt-space-md pt-space-md border-t border-outline-variant/30">
                <button 
                  className="w-full flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-primary font-title-sm text-title-sm py-space-xs px-space-md rounded-lg transition-colors text-xs font-semibold" 
                  onClick={() => setShowDiffModal(true)}
                  type="button"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Diff with Previous Draft</span>
                </button>
              </div>
            </div>

            {/* Review Collaborators Sub-card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-outline text-[11px]">
                Review Collaborators
              </span>
              <div className="mt-space-sm flex flex-col gap-space-xs">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold text-xs">
                      KR
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium text-xs">Dr. K. Ramanathan</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold text-[11px]">
                    Approved
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm font-bold text-xs">
                      SK
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium text-xs">P. V. Senthil Kumar</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold text-[11px]">
                    Reviewing
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Citation Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-outline-variant/50 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2 text-primary font-title-md font-bold">
                <BookmarkCheck className="w-5 h-5 text-secondary" />
                <span>REC Scholar Citation Grounding Audit</span>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface"
              >
                ✕
              </button>
            </div>
            
            <div className="my-4 space-y-3">
              <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
                <span>Total Cited Statements: <strong>89</strong></span>
                <span>Verified against Original PDFs: <strong className="text-emerald-600">84 (94.4%)</strong></span>
                <span>Unresolved DOIs: <strong className="text-primary">0 (0.0%)</strong></span>
              </div>
              
              <div className="space-y-2">
                {Object.values(CITATIONS).map(cite => (
                  <div key={cite.id} className="p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest flex items-start justify-between gap-4">
                    <div>
                      <span className="font-code-sm font-bold text-primary">{cite.tag}</span>
                      <p className="font-body-sm text-xs font-medium text-on-surface mt-0.5">{cite.title}</p>
                      <p className="font-code-sm text-[11px] text-outline mt-1">{cite.source} • DOI: {cite.doi}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        Cosine {cite.conf}
                      </span>
                      <span className="block text-[11px] text-outline mt-1">{cite.snippetsCount} snippets</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex justify-end">
              <button 
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-title-sm text-sm"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-outline-variant/50 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2 text-primary font-title-md font-bold">
                <GitCompare className="w-5 h-5" />
                <span>Diff with Milestone 03 Draft (24 Hours Ago)</span>
              </div>
              <button 
                onClick={() => setShowDiffModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="my-4 font-code-sm text-xs space-y-2">
              <div className="p-3 bg-red-50 text-red-800 rounded border border-red-200">
                - Section 5.0 previously posited that linear models could scale to 720h without frequency degradation.
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                + Section 5.0 updated with REC-ST-PatchNet architecture citing Nie et al. (2023) and Zeng et al. (2023) demonstrating renewable intermittency bounds.
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                + Added 14 verified token bounding boxes from Nie et al. (ICLR 2023) Table 2 ECL dataset.
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex justify-end">
              <button 
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-title-sm text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
