import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';

export const Comparison: React.FC = () => {
  const { showToast } = useResearch();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Header Context Strip */}
      <div className="px-gutter-desktop py-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center md:justify-between gap-space-md border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm">
          <span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px]">view_column</span>
            <span className="font-semibold tracking-wide">Comparative Benchmark Synthesis</span>
          </span>
          <span className="text-outline-variant">•</span>
          <span className="font-code-sm text-code-sm text-on-surface-variant">WS-ID: REC-2025-ML-8842</span>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => navigate('/evidence')}
            className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-sm text-title-sm border border-outline-variant/30 cursor-pointer"
            type="button"
          >
            Switch to Matrix View
          </button>
          <button
            onClick={() => navigate('/report')}
            className="px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary font-title-sm text-title-sm shadow-sm hover:bg-tertiary cursor-pointer"
            type="button"
          >
            Synthesize into Report
          </button>
        </div>
      </div>

      <div className="px-gutter-desktop py-space-lg flex flex-col gap-space-lg">
        {/* Page Title & Context */}
        <div className="flex flex-col max-w-4xl">
          <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
            Cross-Paradigm Benchmark
          </span>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold mt-1">
            Side-by-Side Model Comparison
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
            Direct comparison across Transformer patching, linear decomposition, probabilistic diffusion, and topological graph networks for multi-horizon electricity load forecasting.
          </p>
        </div>

        {/* Action / Highlights Bar */}
        <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border border-outline-variant/30">
          <div className="flex items-center gap-space-md">
            <span className="font-title-sm text-title-sm font-semibold text-on-surface">
              Comparing 3 Key Paradigms:
            </span>
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-primary font-title-sm text-title-sm font-medium shadow-sm border border-outline-variant/30">
                PatchTST (Transformer)
              </span>
              <span className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-primary font-title-sm text-title-sm font-medium shadow-sm border border-outline-variant/30">
                DLinear (Linear)
              </span>
              <span className="px-space-sm py-space-xs rounded-lg bg-surface-container-lowest text-primary font-title-sm text-title-sm font-medium shadow-sm border border-outline-variant/30">
                DiffLoad (Diffusion)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => showToast('Discrepancy audit: PatchTST vs DLinear error margin is 8.4% on 96h.')}
              className="px-space-md py-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-title-sm text-title-sm shadow-sm hover:bg-surface-container border border-outline-variant/30 cursor-pointer"
              type="button"
            >
              Highlight Discrepancies
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

              {/* Architecture Gauge */}
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

              {/* Architecture Gauge */}
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

              {/* Architecture Gauge */}
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
    </div>
  );
};
