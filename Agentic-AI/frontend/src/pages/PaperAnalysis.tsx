import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { MOCK_PAPERS } from '../data/mockResearchData';

export const PaperAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { evidenceStatusMap, setEvidenceStatus, showToast } = useResearch();
  const navigate = useNavigate();

  const paper = MOCK_PAPERS.find(p => p.id === id) || MOCK_PAPERS[0];
  const [isSerif, setIsSerif] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [highlightedAnchor, setHighlightedAnchor] = useState<string | null>(null);
  const [decisionBanner, setDecisionBanner] = useState<string | null>(() => {
    const status = evidenceStatusMap[paper.id];
    if (status === 'Accepted') return '✓ Paper accepted & committed to Literature Synthesis Bench.';
    if (status === 'Rejected') return '✕ Paper rejected from primary review corpus.';
    if (status === 'Needs Review' || status === 'Flagged') return '⚑ Paper queued for secondary re-analysis by R-Lens Agent.';
    return null;
  });

  const jumpToEvidence = (anchorId: string) => {
    setHighlightedAnchor(anchorId);
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedAnchor(null);
    }, 2500);
  };

  const handleValidation = (decision: 'Accepted' | 'Rejected' | 'Needs Review') => {
    setEvidenceStatus(paper.id, decision);
    if (decision === 'Accepted') {
      setDecisionBanner('✓ Paper accepted & committed to Literature Synthesis Bench.');
      showToast('Paper accepted & parameters committed to Evidence Matrix.');
    } else if (decision === 'Rejected') {
      setDecisionBanner('✕ Paper rejected from primary review corpus.');
      showToast('Paper rejected from synthesis corpus.');
    } else {
      setDecisionBanner('⚑ Paper queued for secondary re-analysis by R-Lens Agent.');
      showToast('Paper flagged for secondary review.');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Top Utility Sub-Header for Active Paper Inspection */}
      <div className="w-full bg-surface-container-low px-gutter-desktop py-space-sm flex flex-wrap items-center justify-between gap-space-md border-b border-outline-variant/30">
        <div className="flex items-center gap-space-md min-w-0">
          <button
            onClick={() => navigate('/research')}
            className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-title-sm text-title-sm mr-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Workspace</span>
          </button>
          <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span className="font-semibold tracking-wide">REC-ANALYSIS #842</span>
          </span>
          <span className="hidden sm:inline text-outline text-label-sm font-label-sm">•</span>
          <span className="truncate font-body-sm text-body-sm text-on-surface-variant font-medium">
            Domain: Computational Power Systems &amp; Deep Sequence Models
          </span>
          <span className="hidden md:inline-flex items-center gap-space-2xs text-secondary font-label-sm text-label-sm bg-secondary-fixed px-space-xs py-space-2xs rounded border border-secondary/20">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Peer-Reviewed Q1</span>
          </span>
        </div>

        {/* Reader Configuration Micro-Bar */}
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center bg-surface-container-lowest rounded-lg p-space-2xs shadow-sm border border-outline-variant/30">
            <button
              onClick={() => setIsSerif(!isSerif)}
              className="px-space-sm py-space-2xs rounded font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-space-2xs cursor-pointer"
              title="Toggle Sans/Serif View"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">font_download</span>
              <span>{isSerif ? 'Sans Text' : 'Serif Text'}</span>
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
              className="p-space-2xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Zoom Out"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="font-code-sm text-code-sm text-on-surface px-space-xs">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
              className="p-space-2xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Zoom In"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-space-xs">
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noreferrer"
              className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-label-md text-label-md flex items-center gap-space-2xs border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>IEEE Xplore</span>
            </a>
            <button
              onClick={() => navigate(`/paper-chat/${paper.id}`)}
              className="px-space-sm py-space-xs rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm font-label-md text-label-md flex items-center gap-space-2xs cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
              <span>Chat with Paper</span>
            </button>
            <button
              onClick={() => showToast('Downloading verified publisher PDF (3.8MB)...')}
              className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-label-md text-label-md flex items-center gap-space-2xs border border-outline-variant/30 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>PDF (3.8MB)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Three-Column Workspace Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-surface-container-lowest flex-1">
        
        {/* COLUMN 1: Paper Metadata & Section Navigation (lg:col-span-3 xl:col-span-2) */}
        <aside className="lg:col-span-3 xl:col-span-2 bg-surface-container-low p-space-lg flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-64px-45px)] sticky top-16 border-r border-outline-variant/30">
          <div className="flex flex-col gap-space-md">
            {/* Paper Meta Header */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-space-xs mb-space-xs flex-wrap">
                <span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                  {paper.venue} {paper.year}
                </span>
                <span className="text-secondary font-label-sm text-label-sm font-medium">OA Verified</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-bold mb-space-sm">
                {paper.title}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                {paper.authors}
              </p>
              <div className="space-y-space-xs pt-space-xs text-on-surface-variant font-label-sm text-label-sm border-t border-outline-variant/30">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[14px] text-outline">calendar_today</span>
                  <span>Vol 15, Iss 2, pp. 1104–1118</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[14px] text-outline">fingerprint</span>
                  <span className="font-code-sm text-code-sm truncate">{paper.doi}</span>
                </div>
                <div className="flex items-center gap-space-xs text-primary font-medium">
                  <span className="material-symbols-outlined text-[14px]">fact_check</span>
                  <span>REC Institutional Repository sync</span>
                </div>
              </div>
            </div>

            {/* Citation & Impact Micro-Grid */}
            <div className="grid grid-cols-2 gap-space-xs">
              <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-outline-variant/30">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">Citations</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">{paper.citationsCount}</span>
                <span className="font-label-sm text-label-sm text-secondary block font-medium">+18 this mo.</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-outline-variant/30">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">Altmetric</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{paper.altmetricScore}%</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Top percentile</span>
              </div>
            </div>

            {/* Interactive Section Navigator */}
            <div className="flex flex-col gap-space-xs mt-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold px-space-xs">
                Table of Contents
              </span>
              <nav className="flex flex-col gap-space-2xs text-title-sm text-title-sm">
                {[
                  { id: 'sec-overview', label: '1. Overview & Setup', page: 'p.1' },
                  { id: 'sec-abstract', label: '2. Abstract', page: 'p.1' },
                  { id: 'sec-methodology', label: '3. Methodology (Patching)', page: 'p.3' },
                  { id: 'sec-datasets', label: '4. Dataset & Benchmarks', page: 'p.6' },
                  { id: 'sec-results', label: '5. Experimental Results', page: 'p.8' },
                  { id: 'sec-complexity', label: '6. Complexity & Memory', page: 'p.11' },
                  { id: 'sec-limitations', label: '7. Limitations & Edge Cases', page: 'p.13' },
                  { id: 'sec-gap', label: '8. Research Gap Analysis', page: 'p.14' },
                ].map(sec => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="section-nav-link flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-all"
                  >
                    <span className="truncate">{sec.label}</span>
                    <span className="font-code-sm text-code-sm opacity-60">{sec.page}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Left Bottom Provenance Indicator */}
          <div className="mt-space-lg pt-space-md bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center gap-space-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">REC Parsing Model</span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">OcrLayout-v4.1 • Clean</span>
            </div>
          </div>
        </aside>

        {/* COLUMN 2: Extracted Paper Full-Text Reading View (lg:col-span-6 xl:col-span-6) */}
        <main
          className="lg:col-span-6 xl:col-span-6 px-gutter-desktop py-space-xl bg-surface-container-lowest overflow-y-auto max-h-[calc(100vh-64px-45px)]"
          id="paperReadingPane"
        >
          {/* Reading Mode Banner */}
          <div className="mb-space-2xl bg-surface-container-low p-space-lg rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-outline-variant/30">
            <div className="space-y-space-2xs">
              <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Canonical Extraction Stream (High-Precision Markdown)</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Document parsed with mathematical LaTeX preserves and token-level ground truth markers.
              </p>
            </div>
            <div className="flex items-center gap-space-2xs bg-surface-container-lowest px-space-sm py-space-2xs rounded-lg shadow-sm border border-outline-variant/30 shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              <span className="font-label-sm text-label-sm text-on-surface font-medium">3 Grounded Highlights</span>
            </div>
          </div>

          {/* Article Scholarly Content */}
          <article
            className={`space-y-space-xl leading-loose max-w-3xl mx-auto ${
              isSerif ? 'font-serif' : 'font-body'
            }`}
            style={{ fontSize: `${(16 * zoomLevel) / 100}px` }}
          >
            {/* Section 1: Overview */}
            <section className="space-y-space-md pt-space-sm" id="sec-overview">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest block">
                Section 1
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                1. Overview &amp; Problem Formulation
              </h2>
              <p>
                Modern power system operations, real-time demand-response programs, and locational marginal pricing mechanisms depend critically on high-fidelity long-horizon forecasts. While traditional autoregressive and state-space architectures have dominated power dispatch centers, recent surges in distributed renewable sources introduce non-stationary variances that degrade classical linear models.
              </p>
              <p>
                Despite the general adoption of Transformer variants in sequence prediction, Vanilla Attention mechanisms often exhibit severe computational bottlenecks when extended to extended lookback horizons (e.g., L &gt; 512). Furthermore, pointwise attention fails to capture broader semantic patterns within individual time intervals, often resulting in overfitting to point anomalies rather than fundamental load periodicity.
              </p>
            </section>

            {/* Section 2: Abstract */}
            <section className="space-y-space-md pt-space-lg" id="sec-abstract">
              <div className="bg-surface-container-low p-space-lg rounded-2xl shadow-sm space-y-space-xs border border-outline-variant/30">
                <span className="font-label-sm text-label-sm text-outline uppercase font-bold tracking-widest block">
                  Executive Abstract
                </span>
                <p className="font-body-md text-body-md text-on-surface italic leading-relaxed">
                  “We propose an effective design of Transformer-based models for multi-variate time series forecasting by introducing two essential primitives: sub-series level patching and channel independence. By fragmenting time-series sequences into compact patch intervals, our framework extracts local spatial-temporal dynamics while mitigating attention quadratic load. We benchmark our method on real-world electricity grids across North America and Europe, establishing benchmark state-of-the-art results.”
                </p>
              </div>
            </section>

            {/* Section 3: Methodology with Evidence Highlight #1 */}
            <section className="space-y-space-md pt-space-lg" id="sec-methodology">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest block">
                Section 3
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                3. Methodology: Patching &amp; Channel-Independence
              </h2>
              <p>
                The canonical representation decomposes each univariate sequence x_i = (x_1^(i), ..., x_L^(i)) independently. Instead of feeding point scalar values into the multi-head self-attention module, we segment each channel into overlapping or non-overlapping contiguous patches of stride S and patch length P.
              </p>

              {/* Evidence Highlight #1 (Target Anchor) */}
              <div
                className={`my-space-lg p-space-lg rounded-xl bg-surface-container shadow-sm relative transition-all duration-300 border border-primary/30 ${
                  highlightedAnchor === 'evidence-1' ? 'ring-4 ring-primary scale-[1.01]' : ''
                }`}
                id="evidence-1"
              >
                <div className="flex items-center justify-between gap-space-sm mb-space-xs">
                  <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Evidence #1 — Core Claim
                  </span>
                  <span className="font-code-sm text-code-sm text-primary font-medium">Equation 4 • Page 4</span>
                </div>
                <blockquote className="font-title-md text-title-md text-on-surface font-semibold leading-relaxed my-space-xs pl-space-sm border-l-2 border-primary">
                  “By segmenting time-series into sub-series-level patches which serve as input tokens to Transformer, we retain local semantic information while drastically reducing attention computation from quadratic O(L²) to O((L/P)²).”
                </blockquote>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Verified in Model Definition Theorem 3.1</span>
                  <span className="text-primary font-medium">Mapped to AI Synthesis Card 2</span>
                </div>
              </div>

              <p>
                The channel-independent schema implies that each sensor channel shares the exact same Transformer weights across the backbone, effectively multiplying the training sample count by M where M is the number of monitoring nodes. This regularization prevents intra-channel noise from contaminating feature representations during low-amplitude hours.
              </p>
            </section>

            {/* Embedded Architecture Diagram Figure */}
            <figure className="my-space-xl bg-surface-container-low p-space-lg rounded-2xl shadow-sm flex flex-col items-center border border-outline-variant/30">
              <div className="w-full h-56 rounded-xl overflow-hidden relative flex items-center justify-center bg-surface-container">
                <div className="flex flex-col items-center gap-space-sm text-center p-space-md">
                  <div className="flex items-center gap-space-md flex-wrap justify-center">
                    <div className="p-space-sm rounded-lg bg-primary text-on-primary font-code-sm text-code-sm">
                      Raw Time Series [L]
                    </div>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest text-primary font-code-sm text-code-sm shadow-sm border border-outline-variant/30">
                      Patches [L/P, P]
                    </div>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    <div className="p-space-sm rounded-lg bg-primary text-on-primary font-code-sm text-code-sm">
                      Shared Transformer Block
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant max-w-md mt-space-sm">
                    Figure 2: Architecture schematic showing decomposition of continuous electricity load curves into tokenized patches with linear projection heads.
                  </p>
                </div>
              </div>
              <figcaption className="mt-space-sm text-center font-label-md text-label-md text-on-surface-variant">
                Fig. 2. Pipeline of PatchTST: Independent tokenization before Transformer encoder projection.
              </figcaption>
            </figure>

            {/* Section 4 & 5: Benchmarks with Evidence Highlight #2 */}
            <section className="space-y-space-md pt-space-lg" id="sec-datasets">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest block">
                Section 4 &amp; 5
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                4. Experimental Results &amp; ECL Benchmark
              </h2>
              <p>
                Experiments were rigorously conducted over extensive empirical datasets: Electricity (ECL consisting of 321 client load profiles over 2 years), Electricity Transformer Temperature (ETTh1, ETTh2), and multi-variate Weather readings. We test forecasting horizons H in {`{96, 192, 336, 720}`} steps ahead.
              </p>

              {/* Evidence Highlight #2 (Target Anchor) */}
              <div
                className={`my-space-lg p-space-lg rounded-xl bg-surface-container shadow-sm relative transition-all duration-300 border border-secondary/30 ${
                  highlightedAnchor === 'evidence-2' ? 'ring-4 ring-secondary scale-[1.01]' : ''
                }`}
                id="evidence-2"
              >
                <div className="flex items-center justify-between gap-space-sm mb-space-xs">
                  <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[14px]">insights</span>
                    Evidence #2 — Benchmark Result
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary font-medium">Table 2 • Page 9</span>
                </div>
                <blockquote className="font-title-md text-title-md text-on-surface font-semibold leading-relaxed my-space-xs pl-space-sm border-l-2 border-secondary">
                  “On the national Electricity benchmark (ECL), PatchTST achieves an MSE of 0.129 for 96-step horizon and 0.152 for 336-step horizon, outperforming DLinear by 8.4% and Informer by 21.3%.”
                </blockquote>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Metric validation on 321 smart-meter clusters</span>
                  <span className="text-secondary font-medium">Mapped to AI Synthesis Card 4</span>
                </div>
              </div>

              {/* Mini Numerical Matrix */}
              <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm border border-outline-variant/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead>
                      <tr className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-space-xs px-space-sm">Method</th>
                        <th className="py-space-xs px-space-sm">MSE (96h)</th>
                        <th className="py-space-xs px-space-sm">MAE (96h)</th>
                        <th className="py-space-xs px-space-sm">MSE (336h)</th>
                        <th className="py-space-xs px-space-sm">MAE (336h)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                      <tr className="bg-surface-container-lowest font-semibold text-primary">
                        <td className="py-space-xs px-space-sm rounded-l-lg">PatchTST (Proposed)</td>
                        <td className="py-space-xs px-space-sm">0.129</td>
                        <td className="py-space-xs px-space-sm">0.222</td>
                        <td className="py-space-xs px-space-sm">0.152</td>
                        <td className="py-space-xs px-space-sm rounded-r-lg">0.250</td>
                      </tr>
                      <tr className="text-on-surface">
                        <td className="py-space-xs px-space-sm">DLinear (Zheng et al.)</td>
                        <td className="py-space-xs px-space-sm">0.140</td>
                        <td className="py-space-xs px-space-sm">0.237</td>
                        <td className="py-space-xs px-space-sm">0.165</td>
                        <td className="py-space-xs px-space-sm">0.262</td>
                      </tr>
                      <tr className="text-on-surface">
                        <td className="py-space-xs px-space-sm">Informer (Zhou et al.)</td>
                        <td className="py-space-xs px-space-sm">0.193</td>
                        <td className="py-space-xs px-space-sm">0.312</td>
                        <td className="py-space-xs px-space-sm">0.218</td>
                        <td className="py-space-xs px-space-sm">0.341</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 6 & 7: Limitations with Evidence Highlight #3 */}
            <section className="space-y-space-md pt-space-lg" id="sec-limitations">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest block">
                Section 7
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                7. Limitations &amp; Edge Cases
              </h2>
              <p>
                While empirical forecasting performance excels on macro-benchmarks, several theoretical edge cases must be articulated when deploying to distributed utility grids with severe topology fluctuations.
              </p>

              {/* Evidence Highlight #3 (Target Anchor) */}
              <div
                className={`my-space-lg p-space-lg rounded-xl bg-error-container text-on-error-container shadow-sm relative transition-all duration-300 border border-error/20 ${
                  highlightedAnchor === 'evidence-3' ? 'ring-4 ring-error scale-[1.01]' : ''
                }`}
                id="evidence-3"
              >
                <div className="flex items-center justify-between gap-space-sm mb-space-xs">
                  <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-error text-on-error font-label-sm text-label-sm font-bold">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Evidence #3 — Limitation &amp; Gap
                  </span>
                  <span className="font-code-sm text-code-sm text-on-error-container font-medium">
                    Discussion • Page 13
                  </span>
                </div>
                <blockquote className="font-title-md text-title-md text-on-error-container font-semibold leading-relaxed my-space-xs pl-space-sm border-l-2 border-error">
                  “However, the channel-independent assumption ignores inter-variable cross-correlations when extreme grid volatility occurs (e.g. sudden substation tripping or renewable drop).”
                </blockquote>
                <div className="mt-space-sm flex items-center justify-between font-label-sm text-label-sm opacity-90">
                  <span>Identified constraint for transmission networks</span>
                  <span className="font-medium underline">Mapped to AI Synthesis Card 5 &amp; 6</span>
                </div>
              </div>

              <p>
                In synchronous microgrids or dynamic distribution feeders, localized power-flow Kirchhoff equations impose rigid cross-variable dependencies. Disregarding cross-attention over simultaneous node feeds sacrifices situational awareness during rapid transient contingencies.
              </p>
            </section>

            {/* Section 8: Gap Analysis */}
            <section className="space-y-space-md pt-space-lg pb-space-2xl" id="sec-gap">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-widest block">
                Section 8
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                8. Conclusion &amp; Outlook
              </h2>
              <p>
                The patching strategy establishes an indispensable milestone in time-series Transformer design by unifying sequence compression with token semantics. Future works are invited to bridge the channel-isolation barrier through graph-inductive priors without sacrificing computational lightness.
              </p>
            </section>
          </article>
        </main>

        {/* COLUMN 3: R-Lens AI Research Extraction Panel (lg:col-span-3 xl:col-span-4) */}
        <aside className="lg:col-span-3 xl:col-span-4 bg-surface-container-low p-space-lg flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-64px-45px)] sticky top-16 border-l border-outline-variant/30">
          <div className="flex flex-col gap-space-md">
            {/* AI Panel Header */}
            <div className="bg-primary text-on-primary p-space-md rounded-2xl shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[24px] text-primary-fixed mt-0.5">neurology</span>
                <div className="space-y-space-2xs">
                  <span className="font-headline-sm text-headline-sm font-semibold tracking-tight block">
                    R-Lens AI Extraction
                  </span>
                  <p className="font-body-sm text-body-sm text-primary-fixed leading-normal">
                    All AI interpretations are grounded in extracted paper text. Click{' '}
                    <span className="font-semibold text-surface">“Source Evidence →”</span> to jump to verified source.
                  </p>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-primary-container opacity-40 blur-xl pointer-events-none"></div>
            </div>

            {/* Extraction Cards */}
            <div className="space-y-space-md">
              {/* Card 1: Executive Summary */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-space-2xs text-primary font-title-sm text-title-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">summarize</span>
                    Executive Summary
                  </span>
                  <span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-code-sm text-code-sm">
                    Synthesis
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  PatchTST introduces temporal patching to map contiguous time chunks into Transformer tokens rather than single scalar points. It relies on a channel-independent backbone that eliminates cross-variate contamination while cutting computational load.
                </p>
                <div className="pt-space-xs flex justify-end">
                  <button
                    onClick={() => jumpToEvidence('sec-overview')}
                    className="inline-flex items-center gap-space-2xs text-primary hover:text-tertiary font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  >
                    <span>Source Evidence</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Methodology Architecture */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-space-2xs text-on-surface font-title-sm text-title-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-primary">account_tree</span>
                    Methodology Architecture
                  </span>
                  <span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">
                    Core Model
                  </span>
                </div>
                <div className="space-y-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                  <div className="flex items-start gap-space-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-on-surface">Sub-Series Patching:</strong> Contiguous length P=16, stride S=8, reducing complexity from O(L²) to O((L/P)²).
                    </span>
                  </div>
                  <div className="flex items-start gap-space-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span>
                      <strong className="text-on-surface">Channel Independence:</strong> Each channel projected independently through a shared Transformer backbone.
                    </span>
                  </div>
                </div>
                <div className="pt-space-xs flex justify-end">
                  <button
                    onClick={() => jumpToEvidence('evidence-1')}
                    className="inline-flex items-center gap-space-2xs text-primary hover:text-tertiary font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  >
                    <span>Source Evidence →</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Datasets Evaluated */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-space-2xs text-on-surface font-title-sm text-title-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-outline">dataset</span>
                    Datasets Evaluated
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">N=4 Benchmarks</span>
                </div>
                <div className="flex flex-wrap gap-space-xs mt-space-2xs">
                  <span className="px-space-sm py-space-2xs rounded-lg bg-surface-container font-label-sm text-label-sm text-primary font-medium">
                    Electricity ECL (321 clients)
                  </span>
                  <span className="px-space-sm py-space-2xs rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface font-medium">
                    ETTh1 &amp; ETTh2 (2-year hourly)
                  </span>
                  <span className="px-space-sm py-space-2xs rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface font-medium">
                    Weather (21 indicators)
                  </span>
                </div>
                <div className="pt-space-xs flex justify-end">
                  <button
                    onClick={() => jumpToEvidence('sec-datasets')}
                    className="inline-flex items-center gap-space-2xs text-primary hover:text-tertiary font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  >
                    <span>Source Evidence →</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Key Empirical Findings */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-space-2xs text-secondary font-title-sm text-title-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    Key Empirical Findings
                  </span>
                  <span className="px-space-xs py-space-2xs rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                    Statistically Sig.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                  <div className="p-space-xs rounded-lg bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">MSE (96h Horizon)</span>
                    <span className="font-title-md text-title-md text-on-surface font-bold">0.129</span>
                    <span className="font-label-sm text-label-sm text-primary block font-medium">−8.4% vs DLinear</span>
                  </div>
                  <div className="p-space-xs rounded-lg bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Memory Footprint</span>
                    <span className="font-title-md text-title-md text-on-surface font-bold">−80%</span>
                    <span className="font-label-sm text-label-sm text-secondary block font-medium">vs Informer</span>
                  </div>
                </div>
                <div className="pt-space-xs flex justify-end">
                  <button
                    onClick={() => jumpToEvidence('evidence-2')}
                    className="inline-flex items-center gap-space-2xs text-secondary hover:text-on-secondary-container font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  >
                    <span>Source Evidence →</span>
                  </button>
                </div>
              </div>

              {/* Card 5: Identified Limitations */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs transition-all hover:shadow-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-space-2xs text-error font-title-sm text-title-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">report_problem</span>
                    Identified Limitations
                  </span>
                  <span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-medium">
                    Theoretical Gap
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Channel-independence deliberately discards cross-sensor covariance. In utility scenarios undergoing transmission line trips or localized sudden renewable curtailments, inter-nodal correlation is critical.
                </p>
                <div className="pt-space-xs flex justify-end">
                  <button
                    onClick={() => jumpToEvidence('evidence-3')}
                    className="inline-flex items-center gap-space-2xs text-error hover:text-on-error-container font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                  >
                    <span>Source Evidence →</span>
                  </button>
                </div>
              </div>

              {/* Card 6: REC Research Gap Alignment */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-md flex flex-col gap-space-xs bg-gradient-to-br from-surface-container-lowest via-surface-container to-surface-container-low border border-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-space-2xs text-secondary font-title-sm text-title-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    REC Research Gap Alignment
                  </span>
                  <span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                    Actionable Focus
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed font-medium">
                  High potential for our project: Formulate a hybrid architecture integrating PatchTST temporal tokenization with a Spatial Graph Neural Network (GNN) to explicitly capture transmission topology and feeder impedance across the Tamil Nadu state grid.
                </p>
                <div className="pt-space-xs flex justify-end">
                  <button
                    onClick={() => jumpToEvidence('sec-limitations')}
                    className="inline-flex items-center gap-space-2xs text-secondary hover:text-on-secondary-container font-label-md text-label-md font-bold transition-colors cursor-pointer"
                  >
                    <span>Source Evidence →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scholar Validation Gate (Sticky at Bottom) */}
          <div className="mt-space-lg pt-space-md bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">rule</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">Scholar Validation Gate</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Step 3 of 4</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Commit extracted parameters to the Multi-Horizon Electricity Review matrix?
            </p>

            {/* Decision Buttons */}
            <div className="grid grid-cols-3 gap-space-xs pt-space-2xs">
              <button
                onClick={() => handleValidation('Accepted')}
                className="flex items-center justify-center gap-space-2xs px-space-xs py-space-sm rounded-lg bg-primary text-on-primary hover:bg-tertiary font-title-sm text-title-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Accept</span>
              </button>
              <button
                onClick={() => handleValidation('Rejected')}
                className="flex items-center justify-center gap-space-2xs px-space-xs py-space-sm rounded-lg bg-surface-container text-error hover:bg-error-container hover:text-on-error-container font-title-sm text-title-sm font-medium transition-all active:scale-95 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleValidation('Needs Review')}
                className="flex items-center justify-center gap-space-2xs px-space-xs py-space-sm rounded-lg bg-surface-container text-secondary hover:bg-secondary-container hover:text-on-secondary-container font-title-sm text-title-sm font-medium transition-all active:scale-95 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">flag</span>
                <span>Flag</span>
              </button>
            </div>

            {decisionBanner && (
              <div className="text-center py-space-2xs font-label-md text-label-md font-semibold text-primary block mt-1 bg-surface-container-low rounded p-1">
                {decisionBanner}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};
