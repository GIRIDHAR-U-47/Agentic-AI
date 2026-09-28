import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { MOCK_EVIDENCE_ROWS } from '../data/mockResearchData';
import { EvidenceMatrixRow } from '../types';
import { researchService } from '../services/researchService';

export const EvidenceValidation: React.FC = () => {
  const { showToast } = useResearch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'matrix' | 'compare'>('matrix');
  const [selectedInspectorRow, setSelectedInspectorRow] = useState<EvidenceMatrixRow | null>(null);
  const [methodFilterOpen, setMethodFilterOpen] = useState(false);
  const [selectedArchitectures, setSelectedArchitectures] = useState<string[]>([
    'Transformers',
    'Linear',
    'Convolutional',
    'Diffusion',
    'Graph'
  ]);
  const [sortMode, setSortMode] = useState<'recency' | 'mse' | 'status'>('recency');

  const rows = MOCK_EVIDENCE_ROWS;

  const sortedRows = [...rows].sort((a, b) => {
    if (sortMode === 'recency') return b.year - a.year;
    if (sortMode === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  const handleExportCsv = () => {
    void researchService.exportMatrixCsv().then((csv) => {
      if (!csv) {
        showToast('Backend offline — no corpus metadata to export.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'R_Lens_Corpus_Metadata.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Corpus metadata (real fields only) exported as CSV.');
    });
  };

  const handleCitationClick = (row: EvidenceMatrixRow) => {
    setSelectedInspectorRow(row);
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Interactive View Switcher & Global Context Strip */}
      <div className="px-gutter-desktop py-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center md:justify-between gap-space-md border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="inline-flex p-space-2xs rounded-lg bg-surface-container-highest border border-outline-variant/30">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-lg font-title-sm text-title-sm transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              <span>Evidence Matrix</span>
              <span className="px-space-xs py-space-2xs rounded-full bg-primary/10 text-primary font-code-sm text-code-sm font-medium ml-space-2xs">
                6 Papers
              </span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-lg font-title-sm text-title-sm transition-all cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">compare</span>
              <span>Side-by-Side Comparison</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-space-2xs px-space-sm py-space-2xs rounded bg-surface-container text-on-surface-variant font-code-sm text-code-sm">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Deterministic vs Probabilistic Models</span>
          </div>
        </div>

        {/* Live Quick Utilities */}
        <div className="flex items-center gap-space-sm">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Last Agent Pass: <strong className="text-on-surface">3 mins ago</strong> (REC-Core v2.4)
          </span>
          <button
            onClick={() => showToast('Citations re-indexed against Semantic Scholar & CrossRef cache.')}
            className="p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            title="Reload citations"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
          <button
            onClick={() => showToast('Matrix configuration: 9 columns active, strict grounding mode.')}
            className="p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            title="Settings"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      {/* Header & Research Question Banner */}
      <div className="px-gutter-desktop pt-space-xl pb-space-lg bg-surface-container-lowest border-b border-outline-variant/30">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-space-lg">
          <div className="flex flex-col max-w-4xl min-w-0">
            <div className="flex items-center gap-space-xs mb-space-2xs">
              <span className="px-space-xs py-space-2xs rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold uppercase tracking-wider">
                REC Discovery Matrix
              </span>
              <span className="text-outline font-label-sm text-label-sm">•</span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">PID: EXP-2025-ELEC-409</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
              Evidence Matrix &amp; Cross-Paper Synthesis
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
              Citation-grounded multi-paper matrix mapping claims, empirical metrics, datasets, limitations, and identified research gaps.
            </p>

            {/* Active Research Inquiry Card */}
            <div className="mt-space-md p-space-sm bg-surface-container-low rounded-xl flex items-start gap-space-sm border border-outline-variant/30">
              <div className="p-space-2xs bg-primary-container text-on-primary rounded-lg shrink-0 mt-space-2xs">
                <span className="material-symbols-outlined text-[18px]">psychology_alt</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Grounded Research Target
                </span>
                <span className="font-title-md text-title-md text-on-surface font-semibold truncate">
                  Deep Learning Approaches for Multi-Horizon Electricity Forecasting
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                  Evaluating long-sequence transformer architectures vs linear trend decomposition on transmission-level load profiles under intermittent renewable penetration.
                </span>
              </div>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-space-sm xl:flex-col xl:items-end justify-start">
            <div className="flex items-center gap-space-sm flex-wrap">
              <button
                onClick={() => showToast('Custom analysis dimension added: "Inference Latency on 11kV Grid".')}
                className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm transition-all border border-outline-variant/30 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">add_box</span>
                <span>Add Dimension</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setMethodFilterOpen(!methodFilterOpen)}
                  className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm transition-all border border-outline-variant/30 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">filter_list</span>
                  <span>Filter by Method</span>
                  <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
                </button>

                {methodFilterOpen && (
                  <div className="absolute right-0 mt-space-xs w-60 bg-surface-container-lowest rounded-xl shadow-xl p-space-sm z-30 flex flex-col gap-space-xs border border-outline-variant/40">
                    <span className="font-label-sm text-label-sm text-outline px-space-xs uppercase font-semibold">
                      Architectures
                    </span>
                    {['Transformers', 'Linear', 'Convolutional', 'Diffusion', 'Graph'].map(arch => (
                      <label
                        key={arch}
                        className="flex items-center gap-space-sm px-space-xs py-space-2xs hover:bg-surface-container rounded cursor-pointer font-body-sm text-body-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedArchitectures.includes(arch)}
                          onChange={() => {
                            setSelectedArchitectures(prev =>
                              prev.includes(arch) ? prev.filter(a => a !== arch) : [...prev, arch]
                            );
                          }}
                          className="accent-primary"
                        />
                        <span>{arch}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm transition-all border border-outline-variant/30 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span>Export (CSV/BibTeX)</span>
              </button>
            </div>

            <button
              onClick={() => navigate('/report')}
              className="w-full xl:w-auto inline-flex items-center justify-center gap-space-sm px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-tertiary text-on-primary font-title-sm text-title-sm shadow-md transition-all cursor-pointer"
              type="button"
            >
              <span>Proceed to Literature Synthesis</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Quantitative Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mt-space-lg pt-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Corpus Filtered
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold mt-space-2xs">
                12 Papers
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">Peer-reviewed 2021–2025</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">menu_book</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Evidence Grounded
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold mt-space-2xs">
                84 Snippets
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">Direct excerpt anchors</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Citation Coverage
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-2xs">
                <span className="font-headline-md text-headline-md text-primary font-bold">94%</span>
                <span className="font-label-sm text-label-sm text-secondary-fixed-dim font-medium">High Confidence</span>
              </div>
              <div className="w-28 bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-space-xs">
                <div className="bg-primary-container h-full rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Claims Integrity
              </span>
              <div className="flex items-baseline gap-space-2xs mt-space-2xs">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">47</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ 50 Fully Supported</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-error-container bg-error-container/40 px-space-xs py-space-2xs rounded w-fit mt-space-2xs">
                3 Under REC Review
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">flaky</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: EVIDENCE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="px-gutter-desktop py-space-lg flex flex-col gap-space-md" id="view-matrix">
          {/* Matrix Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-label-sm text-label-sm uppercase font-semibold text-outline px-space-xs">
                Active Sort:
              </span>
              <button
                onClick={() => setSortMode('recency')}
                className={`px-space-sm py-space-2xs rounded font-label-md text-label-md transition-colors cursor-pointer ${
                  sortMode === 'recency'
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm border border-outline-variant/30'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
                type="button"
              >
                Recency (Desc)
              </button>
              <button
                onClick={() => setSortMode('mse')}
                className={`px-space-sm py-space-2xs rounded font-label-md text-label-md transition-colors cursor-pointer ${
                  sortMode === 'mse'
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm border border-outline-variant/30'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
                type="button"
              >
                Error Metric (Lowest MSE)
              </button>
              <button
                onClick={() => setSortMode('status')}
                className={`px-space-sm py-space-2xs rounded font-label-md text-label-md transition-colors cursor-pointer ${
                  sortMode === 'status'
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm border border-outline-variant/30'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
                type="button"
              >
                Verification State
              </button>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-code-sm text-code-sm">
              <span className="material-symbols-outlined text-[16px] text-outline">swap_horiz</span>
              <span>Scroll horizontally to inspect all matrix dimensions</span>
            </div>
          </div>

          {/* Dense Matrix Table */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden border border-outline-variant/30">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-body-sm font-body-sm border-collapse min-w-[1520px]">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase border-b border-outline-variant/30">
                    <th className="sticky left-0 bg-surface-container z-20 py-space-md px-space-md w-60 shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                      Paper &amp; Year
                    </th>
                    <th className="py-space-md px-space-md w-44">Primary Method</th>
                    <th className="py-space-md px-space-md w-48">Dataset Tested</th>
                    <th className="py-space-md px-space-md w-36">Forecast Horizon</th>
                    <th className="py-space-md px-space-md w-48">Empirical Result</th>
                    <th className="py-space-md px-space-md w-72">Supported Claim</th>
                    <th className="py-space-md px-space-md w-44 text-center">Status</th>
                    <th className="py-space-md px-space-md w-64">Identified Limitation</th>
                    <th className="py-space-md px-space-md w-64">Research Gap</th>
                    <th className="py-space-md px-space-md w-40">Grounded Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/60 text-on-surface">
                  {sortedRows.map(row => (
                    <tr key={row.id} className="hover:bg-surface-container-low/70 transition-colors group">
                      <td className="sticky left-0 bg-surface-container-lowest group-hover:bg-surface-container-low/90 z-10 py-space-md px-space-md shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-col">
                          <span
                            onClick={() => navigate(`/paper/${row.paperId}`)}
                            className="font-title-sm text-title-sm font-semibold text-primary cursor-pointer hover:underline"
                          >
                            {row.authors} ({row.year})
                          </span>
                          <span className="font-code-sm text-code-sm text-on-surface-variant">
                            {row.primaryMethod}
                          </span>
                          <div className="mt-space-2xs flex items-center gap-space-2xs">
                            <span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">
                              {row.venue}
                            </span>
                            <span className="text-outline font-label-sm text-label-sm">
                              {row.citationsCount} Cites
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="px-space-sm py-space-2xs rounded-md bg-surface-container font-title-sm text-title-sm text-tertiary font-semibold">
                          {row.primaryMethod}
                        </span>
                        <span className="block font-code-sm text-code-sm text-on-surface-variant mt-space-2xs">
                          {row.methodCategory}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="font-body-md text-body-md text-on-surface font-medium">
                          {row.datasetTested}
                        </span>
                        <span className="block font-label-sm text-label-sm text-on-surface-variant">
                          {row.datasetDetail}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md font-code-sm text-code-sm text-on-surface font-medium">
                        <div className="flex flex-wrap gap-space-2xs">
                          {row.forecastHorizons.map(h => (
                            <span key={h} className="px-space-xs py-space-2xs bg-surface-container-low rounded">
                              {h}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <div className="flex flex-col gap-space-2xs font-code-sm text-code-sm">
                          <span className="font-semibold text-primary">{row.empiricalResult.primaryMetric}</span>
                          <span className="text-on-surface-variant">{row.empiricalResult.secondaryMetric}</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                          {row.supportedClaim}
                        </p>
                      </td>
                      <td className="py-space-md px-space-md text-center">
                        {row.status === 'Supported' && (
                          <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>Supported</span>
                          </span>
                        )}
                        {row.status === 'Partially Supported' && (
                          <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            <span>Partially Supported</span>
                          </span>
                        )}
                        {row.status === 'Needs Review' && (
                          <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-tertiary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[14px]">flag</span>
                            <span>Needs Review</span>
                          </span>
                        )}
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">
                        <span className="text-error font-medium">{row.identifiedLimitation}</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface">
                        <span className="font-medium text-primary">{row.researchGap}</span>
                      </td>
                      <td className="py-space-md px-space-md">
                        <button
                          onClick={() => handleCitationClick(row)}
                          className="inline-flex items-center gap-space-2xs text-primary font-code-sm text-code-sm hover:underline cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          <span>{row.citationTag}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SIDE-BY-SIDE COMPARISON */}
      {activeTab === 'compare' && (
        <div className="px-gutter-desktop py-space-lg flex flex-col gap-space-lg" id="view-compare">
          {/* Comparison Selector & Setup Strip */}
          <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border border-outline-variant/30">
            <div className="flex items-center gap-space-md">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                Comparing 3 Selected Approaches:
              </span>
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-primary font-title-sm text-title-sm font-medium shadow-sm flex items-center gap-space-xs border border-outline-variant/30">
                  <span>PatchTST (Nie et al.)</span>
                </span>
                <span className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-primary font-title-sm text-title-sm font-medium shadow-sm flex items-center gap-space-xs border border-outline-variant/30">
                  <span>DLinear (Zeng et al.)</span>
                </span>
                <span className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-primary font-title-sm text-title-sm font-medium shadow-sm flex items-center gap-space-xs border border-outline-variant/30">
                  <span>DiffLoad (Chen &amp; Kumar)</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => showToast('Discrepancies highlighted: Channel-independence vs Admittance matrix.')}
                className="px-space-md py-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-title-sm text-title-sm shadow-sm hover:bg-surface-container border border-outline-variant/30 cursor-pointer"
                type="button"
              >
                Highlight Discrepancies
              </button>
              <button
                onClick={() => navigate('/report')}
                className="px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm shadow-sm hover:bg-tertiary cursor-pointer"
                type="button"
              >
                Synthesize Triangulation
              </button>
            </div>
          </div>

          {/* 3-Column Comparative Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Col 1: PatchTST */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col justify-between relative overflow-hidden border border-outline-variant/30">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary-container"></div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">IEEE TSG 2024</span>
                  <span className="px-space-xs py-space-2xs rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                    State of Art (MSE)
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">PatchTST</h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                  Nie, Nguyen, Sinthong, Kalagnanam
                </span>

                <div className="p-space-sm rounded-lg bg-surface-container-low mb-space-md border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-space-2xs">
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Compute Complexity
                    </span>
                    <span className="font-code-sm text-code-sm font-bold text-primary">O((L/P)²)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-2/5 rounded-full"></div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mt-space-2xs">
                    Patch size P=16, stride=8. 21x faster than vanilla Transformer.
                  </span>
                </div>

                <div className="space-y-space-md">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Empirical Horizon 720h MSE
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-primary">0.129</p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Core Hypothesis
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface mt-space-2xs">
                      Channel-independence treats each load sensor as an isolated univariate series, avoiding cross-channel noise fitting.
                    </p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      REC Scholar Audit
                    </span>
                    <p className="font-body-sm text-body-sm text-error mt-space-2xs">
                      Violates electrical bus reality where substation transformers share synchronous physical load transfers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-space-md mt-space-lg bg-surface-container-low/50 -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-outline-variant/30">
                <span className="font-code-sm text-code-sm text-on-surface-variant">Evidence Snippets: 18</span>
                <button
                  onClick={() => navigate('/paper/patchtst-2024')}
                  className="text-primary font-title-sm text-title-sm hover:underline flex items-center gap-space-2xs cursor-pointer"
                  type="button"
                >
                  <span>Inspect PDF Extracted Data</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
              </div>
            </div>

            {/* Col 2: DLinear */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col justify-between relative overflow-hidden border border-outline-variant/30">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary"></div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">AAAI 2023</span>
                  <span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm font-semibold">
                    Parsimony Benchmark
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">DLinear</h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                  Zeng, Chen, Zhang, Xu
                </span>

                <div className="p-space-sm rounded-lg bg-surface-container-low mb-space-md border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-space-2xs">
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Compute Complexity
                    </span>
                    <span className="font-code-sm text-code-sm font-bold text-secondary">O(L)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full w-1/12 rounded-full"></div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mt-space-2xs">
                    Single linear weight per horizon. Negligible GPU training footprint.
                  </span>
                </div>

                <div className="space-y-space-md">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Empirical Horizon 720h MSE
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-on-surface">0.141</p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Core Hypothesis
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface mt-space-2xs">
                      Temporal order and linear autoregression contain sufficient inductive bias for electricity, rendering attention superfluous.
                    </p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      REC Scholar Audit
                    </span>
                    <p className="font-body-sm text-body-sm text-error mt-space-2xs">
                      Catastrophic error during unexpected meteorological swings (solar cloud coverage drops).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-space-md mt-space-lg bg-surface-container-low/50 -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-outline-variant/30">
                <span className="font-code-sm text-code-sm text-on-surface-variant">Evidence Snippets: 14</span>
                <button
                  onClick={() => navigate('/paper/dlinear-2023')}
                  className="text-primary font-title-sm text-title-sm hover:underline flex items-center gap-space-2xs cursor-pointer"
                  type="button"
                >
                  <span>Inspect PDF Extracted Data</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
              </div>
            </div>

            {/* Col 3: DiffLoad */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col justify-between relative overflow-hidden border border-outline-variant/30">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">IEEE TPWRS 2025</span>
                  <span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    Probabilistic Bound
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">DiffLoad</h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                  Chen &amp; Kumar (REC Lab Affiliated)
                </span>

                <div className="p-space-sm rounded-lg bg-surface-container-low mb-space-md border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-space-2xs">
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Compute Complexity
                    </span>
                    <span className="font-code-sm text-code-sm font-bold text-error">O(N × T × d)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full w-4/5 rounded-full"></div>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mt-space-2xs">
                    Iterative reverse Langevin dynamics. High sampling latency.
                  </span>
                </div>

                <div className="space-y-space-md">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Continuous Ranked Probability Score (CRPS)
                    </span>
                    <p className="font-headline-md text-headline-md font-bold text-secondary">0.084</p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      Core Hypothesis
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface mt-space-2xs">
                      Stochastic diffusion paths quantify extreme tails of rooftop PV generation uncertainty much better than point forecasts.
                    </p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                      REC Scholar Audit
                    </span>
                    <p className="font-body-sm text-body-sm text-secondary font-medium mt-space-2xs">
                      Verified empirical accuracy, but 1.4s inference requires distillation for 5-min dispatch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-space-md mt-space-lg bg-surface-container-low/50 -mx-space-lg -mb-space-lg p-space-md rounded-b-xl flex items-center justify-between border-t border-outline-variant/30">
                <span className="font-code-sm text-code-sm text-on-surface-variant">Evidence Snippets: 22</span>
                <button
                  onClick={() => navigate('/paper/diffload-2025')}
                  className="text-primary font-title-sm text-title-sm hover:underline flex items-center gap-space-2xs cursor-pointer"
                  type="button"
                >
                  <span>Inspect PDF Extracted Data</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grounded Evidence Inspector Flyout Drawer */}
      {selectedInspectorRow && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-surface-container-lowest shadow-2xl z-50 p-space-xl overflow-y-auto flex flex-col justify-between border-l border-outline-variant/40">
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/30">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  Grounded Evidence Inspector
                </span>
              </div>
              <button
                className="p-space-xs rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
                onClick={() => setSelectedInspectorRow(null)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-space-md p-space-md bg-surface-container-low rounded-xl border border-outline-variant/30">
              <span className="font-label-sm text-label-sm uppercase font-semibold text-outline">
                Extracted Claim Source
              </span>
              <h4 className="font-title-sm text-title-sm text-primary font-bold mt-space-2xs">
                {selectedInspectorRow.authors} ({selectedInspectorRow.year}) [{selectedInspectorRow.primaryMethod}]
              </h4>
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                {selectedInspectorRow.ocrLocation}
              </span>
            </div>

            <div className="mt-space-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Exact PDF OCR Excerpt
              </span>
              <blockquote className="mt-space-xs p-space-md rounded-lg bg-surface-container-lowest shadow-sm italic text-on-surface font-body-sm text-body-sm leading-relaxed border border-outline-variant/30">
                "{selectedInspectorRow.exactOcrExcerpt}"
              </blockquote>
            </div>

            <div className="mt-space-lg space-y-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Agent Provenance &amp; Verification
              </span>
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface">Statistical Metric Cross-Check</span>
                <span className="text-primary font-semibold font-code-sm text-code-sm">Validated ✓</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface">Dataset Splitting Integrity</span>
                <span className="text-primary font-semibold font-code-sm text-code-sm">Compliant ✓</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface">Code Repository Reproducibility</span>
                <span className="text-secondary font-semibold font-code-sm text-code-sm">
                  {selectedInspectorRow.complianceChecks.codeAvailable}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-space-lg mt-space-xl flex items-center gap-space-sm">
            <button
              onClick={() => {
                showToast(`Flagged ${selectedInspectorRow.authors} (${selectedInspectorRow.year}) for manual re-audit.`);
                setSelectedInspectorRow(null);
              }}
              className="w-full py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm font-semibold border border-outline-variant/30 cursor-pointer"
              type="button"
            >
              Flag for Manual Audit
            </button>
            <button
              className="w-full py-space-sm rounded-lg bg-primary-container hover:bg-tertiary text-on-primary font-title-sm text-title-sm font-semibold shadow-sm cursor-pointer"
              onClick={() => setSelectedInspectorRow(null)}
              type="button"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Synthesis Readiness Dock */}
      <div className="sticky bottom-0 left-0 right-0 p-gutter-desktop bg-surface-container-lowest/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-30 border-t border-outline-variant/30 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">auto_stories</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Agentic Synthesis Check: 5 Core Research Themes Detected
                </span>
                <span className="inline-flex items-center px-space-xs py-space-2xs rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Ready to Draft
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                Ready to compile comprehensive literature review draft with{' '}
                <strong className="text-primary font-semibold">94% citation grounding</strong>, cross-paradigm matrix comparison, and identified REC campus gaps.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm w-full md:w-auto shrink-0">
            <button
              onClick={() => navigate('/report')}
              className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm transition-all border border-outline-variant/30 cursor-pointer"
              type="button"
            >
              Preview Thesis Structure
            </button>
            <button
              onClick={() => navigate('/report')}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-tertiary text-on-primary font-title-sm text-title-sm shadow-md transition-all cursor-pointer"
              type="button"
            >
              <span>Compile Literature Review Draft</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
