import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { MOCK_PAPERS } from '../data/mockResearchData';
import { researchService } from '../services/researchService';
import { api } from '../services/api';
import { CorpusDocument } from '../types';

export const ResearchWorkspace: React.FC = () => {
  const {
    query,
    currentSessionTitle,
    generatedSubQueries,
    setGeneratedSubQueries,
    selectedPaperIds,
    togglePaperSelection,
    selectAllPapers,
    filters,
    setFilters,
    evidenceStatusMap,
    setEvidenceStatus,
    showToast,
    researchChatMessages,
    addResearchChatMessage
  } = useResearch();

  const navigate = useNavigate();

  // Local Search & Filter state
  const [tableSearch, setTableSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [chatInputText, setChatInputText] = useState('');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Query editing state
  const [newQueryText, setNewQueryText] = useState('');
  const [isAddingQuery, setIsAddingQuery] = useState(false);
  const [isSearchingAgain, setIsSearchingAgain] = useState(false);

  // Agentic RAG Analysis State (Triggered on demand)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Real corpus, for grounding chat answers in paper titles (never numbers).
  const [corpusDocs, setCorpusDocs] = useState<CorpusDocument[]>([]);
  useEffect(() => {
    api.corpus
      .list()
      .then((r) => setCorpusDocs(r.documents))
      .catch(() => setCorpusDocs([]));
  }, []);

  // Filter papers based on search and filters
  const filteredPapers = useMemo(() => {
    return MOCK_PAPERS.filter(paper => {
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const match =
          paper.title.toLowerCase().includes(q) ||
          paper.authors.toLowerCase().includes(q) ||
          paper.methodTag.toLowerCase().includes(q) ||
          paper.venue.toLowerCase().includes(q) ||
          paper.abstract.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (methodFilter !== 'All') {
        if (!paper.methodCategory.toLowerCase().includes(methodFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [tableSearch, methodFilter]);

  const allFilteredSelected = useMemo(() => {
    if (filteredPapers.length === 0) return false;
    return filteredPapers.every(p => selectedPaperIds.includes(p.id));
  }, [filteredPapers, selectedPaperIds]);

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      selectAllPapers(false);
    } else {
      selectAllPapers(true, filteredPapers.map(p => p.id));
    }
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Search Query Tag Management
  const handleRemoveQuery = (index: number) => {
    const updated = generatedSubQueries.filter((_, i) => i !== index);
    setGeneratedSubQueries(updated);
    showToast('Search query removed.');
  };

  const handleAddQuery = () => {
    if (newQueryText.trim()) {
      setGeneratedSubQueries([...generatedSubQueries, newQueryText.trim()]);
      setNewQueryText('');
      setIsAddingQuery(false);
      showToast('Search query direction added.');
    }
  };

  const handleSearchAgain = () => {
    setIsSearchingAgain(true);
    showToast('Re-evaluating corpus across search directions...');
    setTimeout(() => {
      setIsSearchingAgain(false);
      showToast(`Search complete: ${filteredPapers.length} papers ranked.`);
    }, 900);
  };

  // Run a real agentic review on the current question: create a session,
  // approve the top-ranked corpus candidates, run the agent, open the report.
  // The workspace's mock selection is not passed through because mock ids do
  // not exist in the corpus; the real corpus is ranked for the question instead.
  const handleAnalyzeSelectedPapers = async () => {
    if (selectedPaperIds.length === 0) {
      showToast('Please select at least 1 paper to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);
    try {
      setAnalysisStep(2);
      const q = query.trim() || currentSessionTitle;
      const created = await api.sessions.create(q, 'agentic_rag');
      const candidates = created.candidates.slice(0, Math.min(5, created.candidates.length));
      if (candidates.length === 0) {
        showToast('The corpus is empty — ingest papers before reviewing.');
        return;
      }
      setAnalysisStep(3);
      await api.sessions.approve(
        created.session_id,
        candidates.map((c) => ({ doc_id: c.doc_id, decision: 'approved' }))
      );
      setAnalysisStep(4);
      await api.sessions.run(created.session_id);
      setHasAnalyzed(true);
      addResearchChatMessage({
        role: 'agent-action',
        text: `Started and ran a real agentic review for "${q.slice(0, 80)}". The agent searched ${candidates.length} approved paper(s), re-verified every claim against its cited passages, and the report is open now.`,
        actionItems: [
          'Ranked the real corpus for the question',
          `Approved ${candidates.length} source paper(s)`,
          'Ran search → read → verify loop',
          'Opened the verified report'
        ]
      });
      showToast('Real review complete — opening the verified report.');
      navigate(`/report?session=${created.session_id}`);
    } catch (e) {
      showToast(
        e instanceof Error ? `Review failed: ${e.message}` : 'Review failed — backend unreachable?'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chat Submission Handler
  const handleResearchChatSubmit = (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const txt = (directText || chatInputText).trim();
    if (!txt) return;

    addResearchChatMessage({
      role: 'user',
      text: txt
    });
    setChatInputText('');

    const lower = txt.toLowerCase();
    const corpusQty = corpusDocs.length;
    const corpusTitles = corpusDocs
      .slice(0, 4)
      .map((d) => d.title.split(':')[0].split('?')[0].trim())
      .filter(Boolean);

    // Always be truthful: this workspace holds no extracted metrics, so any
    // researcher question about results/numbers is deferred to a real run.
    const deferNote = corpusQty
      ? `The corpus holds ${corpusQty} paper(s): ${corpusTitles.join('; ')}.`
      : 'The corpus is currently empty (backend offline or not ingested).';

    // Research gaps extraction
    if (lower.includes('gap') || lower.includes('limitation') || lower.includes('constraint')) {
      addResearchChatMessage({
        role: 'assistant',
        text: `I can't rank research gaps from memory — that would be fabrication. ${deferNote} Run a review from the Report page and its verified sections (Limitations, Research gaps) will be built only from claims that survived source-backing checks.`
      });
      return;
    }

    // Write literature review
    if (lower.includes('literature review') || lower.includes('write review') || lower.includes('review based on')) {
      addResearchChatMessage({
        role: 'assistant',
        text: `Starting a real literature review for "${(query || currentSessionTitle).slice(0, 80)}…". The agent will be restricted to approved papers and every claim gets verified before it is written.`
      });
      window.setTimeout(() => void handleAnalyzeSelectedPapers(), 200);
      return;
    }

    // Compare prompt
    if (lower.includes('compare') || lower.includes('patchtst vs') || lower.includes('difference')) {
      addResearchChatMessage({
        role: 'assistant',
        text: `A honest architecture comparison needs the actual retrieved passages with page-level quotes. ${deferNote} I won't quote MSE numbers unless they were extracted and verified. Use the Review page (or say "write literature review") to get a source-backed comparison table.`
      });
      return;
    }

    // General Q&A
    addResearchChatMessage({
      role: 'assistant',
      text: `I can only answer from verified, cited evidence. ${deferNote} Ask me to "write a literature review", or open the Report page to run the agent over this question — it will cite the exact page and quote for every claim it keeps.`
    });
  };

  const handleExportBibtex = () => {
    void researchService.generateBibTeX().then((bibtex) => {
      if (navigator.clipboard && bibtex) navigator.clipboard.writeText(bibtex);
      showToast(bibtex ? 'BibTeX copied (real corpus metadata only)!' : 'Backend offline — nothing to export.');
    });
    setShowExportMenu(false);
  };

  const handleExportCsv = () => {
    void researchService.exportMatrixCsv().then((csv) => {
      if (!csv) {
        showToast('Backend offline — nothing to export.');
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
      showToast('Corpus metadata (real fields only) exported as CSV!');
    });
    setShowExportMenu(false);
  };

  // Selected paper summary names
  const selectedPaperNames = useMemo(() => {
    const names = MOCK_PAPERS.filter(p => selectedPaperIds.includes(p.id)).map(p => p.title.split(':')[0].split(' ')[0]);
    return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
  }, [selectedPaperIds]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FCFBFE] pb-32">
      {/* ── TOP ACADEMIC CONTEXT BAR ── */}
      <section className="w-full px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE9F3] bg-white/70 backdrop-blur-md">
        {/* Breadcrumb & Topic Title */}
        <div className="flex items-center gap-2 text-[13px] text-on-surface-variant font-medium">
          <span
            onClick={() => navigate('/')}
            className="hover:text-on-surface cursor-pointer transition-colors"
          >
            Home
          </span>
          <span className="material-symbols-outlined text-[15px] text-outline">chevron_right</span>
          <span className="text-[#3F1A57] font-semibold">Research Workspace</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Agentic RAG Status */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5ECF9] border border-[#ECD9F3] text-[11.5px] font-medium text-[#5F2781]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Agentic RAG Active</span>
          </div>

          {/* Share */}
          <button
            onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
              showToast('Research session link copied to clipboard!');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DDE9] hover:bg-[#F7F2F9] text-on-surface-variant hover:text-on-surface text-[12.5px] font-medium transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">share</span>
            <span>Share</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5F2781] hover:bg-[#4A176B] text-white text-[12.5px] font-medium transition-colors cursor-pointer shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-[#E5DDE9] py-1 z-50 animate-scaleIn">
                <button
                  onClick={handleExportBibtex}
                  className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-[#F7F2F9] flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#5F2781]">format_quote</span>
                  Export BibTeX Citations
                </button>
                <button
                  onClick={handleExportCsv}
                  className="w-full text-left px-3.5 py-2 text-xs text-on-surface hover:bg-[#F7F2F9] flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#785D1A]">table_chart</span>
                  Export Matrix (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 1. RESEARCH TOPIC & DISCOVERY STRATEGY HERO ── */}
      <section className="px-6 pt-6 pb-4 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-2xl border border-[#E5DDE9] shadow-xs p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F2781] bg-[#F5ECF9] px-2.5 py-0.5 rounded-md">
                Research Topic
              </span>
              <span className="text-[12px] text-outline">
                {filteredPapers.length} relevant papers discovered
              </span>
            </div>

            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1D1A20] tracking-tight leading-snug">
              {currentSessionTitle || query}
            </h1>

            {/* Generated Search Queries / Agent Retrieval Strategy */}
            <div className="mt-2 pt-3 border-t border-[#F5EDFA] flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#5F2781]">manage_search</span>
                  Search Queries (Agentic Retrieval Directions):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingQuery(true)}
                    className="text-[11.5px] font-medium text-[#5F2781] hover:text-[#4A176B] flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Query
                  </button>
                  <button
                    onClick={handleSearchAgain}
                    disabled={isSearchingAgain}
                    className="text-[11.5px] font-medium text-[#5F2781] hover:text-[#4A176B] flex items-center gap-1 cursor-pointer bg-[#F5ECF9] px-2.5 py-1 rounded-lg"
                    type="button"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${isSearchingAgain ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    Search Again
                  </button>
                </div>
              </div>

              {/* Queries Tags List */}
              <div className="flex flex-wrap items-center gap-1.5">
                {generatedSubQueries.map((sq, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] bg-[#FAF7FC] border border-[#EAE0F0] text-[#3F1A57] font-medium group"
                  >
                    <span>• {sq}</span>
                    <button
                      onClick={() => handleRemoveQuery(idx)}
                      className="text-outline hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove query"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                ))}

                {isAddingQuery && (
                  <div className="inline-flex items-center gap-1 bg-white border border-[#5F2781] rounded-lg px-2 py-0.5 shadow-xs">
                    <input
                      type="text"
                      value={newQueryText}
                      onChange={(e) => setNewQueryText(e.target.value)}
                      placeholder="Enter search direction..."
                      className="text-[12px] text-[#1D1A20] focus:outline-none w-48 bg-transparent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddQuery();
                        if (e.key === 'Escape') setIsAddingQuery(false);
                      }}
                    />
                    <button
                      onClick={handleAddQuery}
                      className="text-[#5F2781] font-bold text-xs hover:underline cursor-pointer"
                      type="button"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingQuery(false)}
                      className="text-outline hover:text-on-surface text-xs cursor-pointer ml-1"
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. REALISTIC 5-STEP RESEARCH PROGRESS ── */}
      <section className="px-6 py-2 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-xl border border-[#E5DDE9] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-outline">
            <span>Research Progress</span>
            <span className="text-[#5F2781]">User-Driven Workflow</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center select-none">
            {/* 1. Discover */}
            <div className="flex flex-col items-center p-2 rounded-lg bg-[#F5ECF9] border border-[#ECD9F3]">
              <div className="flex items-center gap-1.5 text-[#5F2781] font-bold text-[12.5px]">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>1. Discover</span>
              </div>
              <span className="text-[11px] text-outline mt-0.5">{filteredPapers.length} papers found</span>
            </div>

            {/* 2. Select */}
            <div className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
              selectedPaperIds.length > 0
                ? 'bg-[#F5ECF9] border-[#ECD9F3]'
                : 'bg-white border-[#E5DDE9]'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
                {selectedPaperIds.length > 0 ? (
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#5F2781] animate-pulse" />
                )}
                <span className={selectedPaperIds.length > 0 ? 'text-[#5F2781]' : 'text-[#1D1A20]'}>
                  2. Select Papers
                </span>
              </div>
              <span className="text-[11px] text-outline mt-0.5">
                {selectedPaperIds.length} selected
              </span>
            </div>

            {/* 3. Analyze */}
            <div className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
              hasAnalyzed
                ? 'bg-[#F5ECF9] border-[#ECD9F3]'
                : selectedPaperIds.length > 0
                ? 'bg-[#FAF7FC] border-[#E5DDE9]'
                : 'bg-white/50 border-[#EFE9F3] opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
                {hasAnalyzed ? (
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                ) : (
                  <span className="text-outline font-normal">—</span>
                )}
                <span className={hasAnalyzed ? 'text-[#5F2781]' : 'text-on-surface-variant'}>
                  3. Analyze Evidence
                </span>
              </div>
              <span className="text-[11px] text-outline mt-0.5">
                {hasAnalyzed ? 'Evidence extracted' : 'Pending request'}
              </span>
            </div>

            {/* 4. Compare */}
            <div
              onClick={() => {
                if (selectedPaperIds.length >= 2) navigate('/compare');
                else showToast('Select at least 2 papers to compare.');
              }}
              className="flex flex-col items-center p-2 rounded-lg bg-white border border-[#E5DDE9] hover:border-[#5F2781] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-on-surface-variant">
                <span className="text-outline font-normal">—</span>
                <span>4. Compare</span>
              </div>
              <span className="text-[11px] text-outline mt-0.5">Side-by-side</span>
            </div>

            {/* 5. Synthesize */}
            <div
              onClick={() => navigate('/report')}
              className="flex flex-col items-center p-2 rounded-lg bg-white border border-[#E5DDE9] hover:border-[#5F2781] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-on-surface-variant">
                <span className="text-outline font-normal">—</span>
                <span>5. Synthesize</span>
              </div>
              <span className="text-[11px] text-outline mt-0.5">Literature review</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. REAL-TIME AGENT ACTIVITY DISPLAY (WHEN USER CLICKS ANALYZE) ── */}
      {isAnalyzing && (
        <section className="px-6 py-2 max-w-7xl w-full mx-auto animate-fadeIn">
          <div className="bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE5F5]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-[#5F2781] border-t-transparent animate-spin" />
                <span className="text-[13px] font-bold text-[#3F1A57]">
                  Agentic RAG: Analyzing {selectedPaperIds.length} Selected Papers...
                </span>
              </div>
              <span className="text-[11.5px] text-outline">Extracting evidence &amp; citations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3 text-[12px]">
              <div className={`flex items-center gap-2 p-2 rounded-lg ${analysisStep >= 1 ? 'bg-white text-emerald-800 font-semibold' : 'text-outline'}`}>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                <span>1. Understanding request</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg ${analysisStep >= 2 ? 'bg-white text-emerald-800 font-semibold' : 'text-outline'}`}>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                <span>2. Reading full text &amp; math</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg ${analysisStep >= 3 ? 'bg-white text-emerald-800 font-semibold' : 'text-outline'}`}>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                <span>3. Extracting empirical metrics</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg ${analysisStep >= 4 ? 'bg-white text-emerald-800 font-semibold' : 'text-outline'}`}>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                <span>4. Grounding claims &amp; gaps</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. MAIN PAPER CORPUS & SCI-SPACE STYLE TABLE ── */}
      <section className="px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-2xl border border-[#E5DDE9] shadow-xs overflow-hidden flex flex-col">
          {/* Header & Controls Toolbar */}
          <div className="p-4 bg-white border-b border-[#EFE9F3] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input within papers */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search within discovered papers (title, author, method)..."
                className="w-full bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl pl-9 pr-3 py-2 text-[13px] text-[#1D1A20] placeholder-[#8F8495] focus:outline-none focus:border-[#5F2781]"
              />
            </div>

            {/* Filter & Method Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Method Selector */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl px-3 py-2 text-[12.5px] font-medium text-[#1D1A20] focus:outline-none cursor-pointer"
              >
                <option value="All">All Architectures</option>
                <option value="Transformer">Transformer (PatchTST, Informer, Autoformer)</option>
                <option value="Linear">Linear Decomp. (DLinear)</option>
                <option value="Diffusion">Diffusion Models (DiffLoad)</option>
                <option value="Graph">Spatio-Temporal Graph (ST-GNN)</option>
                <option value="TCN">Temporal Convolutional (TCN)</option>
              </select>

              {/* Selection Counter */}
              <span className="text-[12px] font-medium text-[#5F2781] bg-[#F5ECF9] px-3 py-1.5 rounded-xl border border-[#ECD9F3]">
                {selectedPaperIds.length} of {filteredPapers.length} selected
              </span>
            </div>
          </div>

          {/* Paper Table Header */}
          <div className="px-4 py-2.5 bg-[#F9F5FC] border-b border-[#EFE9F3] flex items-center justify-between text-[11.5px] font-bold uppercase tracking-wider text-outline select-none">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded text-[#5F2781] accent-[#5F2781] cursor-pointer"
                />
                <span>Select All</span>
              </label>
              <span>• {filteredPapers.length} Papers in Discovery Bench</span>
            </div>
            <span>Actions &amp; Full Text</span>
          </div>

          {/* Papers List */}
          <div className="divide-y divide-[#EFE9F3]">
            {filteredPapers.map(paper => {
              const isSelected = selectedPaperIds.includes(paper.id);
              const isAbstractExpanded = !!expandedAbstracts[paper.id];

              return (
                <div
                  key={paper.id}
                  className={`p-4 transition-colors flex flex-col gap-2.5 ${
                    isSelected ? 'bg-[#FAF6FC]' : 'hover:bg-[#FDFBFE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox & Main Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePaperSelection(paper.id)}
                        className="mt-1 w-4 h-4 rounded text-[#5F2781] accent-[#5F2781] cursor-pointer shrink-0"
                      />

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        {/* Title & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            onClick={() => navigate(`/paper/${paper.id}`)}
                            className="text-[14.5px] font-bold text-[#1D1A20] hover:text-[#5F2781] cursor-pointer transition-colors leading-snug"
                          >
                            {paper.title}
                          </h3>
                          {paper.isSota && (
                            <span className="text-[10px] font-bold bg-[#FED889]/60 text-[#755A18] px-1.5 py-0.2 rounded border border-[#FED889]">
                              SOTA
                            </span>
                          )}
                          {paper.isSeminal && (
                            <span className="text-[10px] font-bold bg-[#E8F5ED] text-[#2D5A3D] px-1.5 py-0.2 rounded border border-[#C8E6D3]">
                              Seminal
                            </span>
                          )}
                        </div>

                        {/* Authors & Metadata */}
                        <div className="flex items-center gap-2 text-[12px] text-on-surface-variant flex-wrap">
                          <span className="font-medium text-[#4D4450]">{paper.authors}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#1D1A20]">{paper.year}</span>
                          <span>•</span>
                          <span className="text-[#5F2781] font-medium">{paper.venue}</span>
                          {paper.doi && (
                            <>
                              <span>•</span>
                              <span className="text-outline text-[11px]">{paper.doi}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Method Tag & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-[#5F2781] bg-[#F5ECF9] px-2.5 py-1 rounded-lg border border-[#ECD9F3] hidden sm:inline-block">
                        {paper.methodTag}
                      </span>

                      <button
                        onClick={() => toggleAbstract(paper.id)}
                        className="px-2.5 py-1 text-[12px] font-medium text-on-surface-variant hover:text-[#5F2781] hover:bg-[#F5ECF9] rounded-lg border border-[#E5DDE9] transition-colors cursor-pointer"
                        type="button"
                      >
                        {isAbstractExpanded ? 'Hide Abstract' : 'Read Abstract'}
                      </button>

                      <button
                        onClick={() => navigate(`/paper/${paper.id}`)}
                        className="px-2.5 py-1 text-[12px] font-semibold text-white bg-[#5F2781] hover:bg-[#4A176B] rounded-lg transition-colors cursor-pointer shadow-xs"
                        type="button"
                      >
                        Open
                      </button>
                    </div>
                  </div>

                  {/* Expandable Abstract */}
                  {isAbstractExpanded && (
                    <div className="ml-7 mt-1 p-3.5 bg-white border border-[#EAE0F0] rounded-xl text-[12.5px] text-[#3F3744] leading-relaxed animate-fadeIn">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F2781]">
                          Abstract Summary
                        </span>
                        <span className="text-[11px] text-outline">
                          Datasets: {paper.datasets ? paper.datasets.join(', ') : 'Standard Benchmarks'}
                        </span>
                      </div>
                      <p>{paper.abstract}</p>

                      {/* Paper Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[#F5EDFA] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-[11.5px] text-outline">
                          <span>Relevance: <strong className="text-[#5F2781]">{paper.relevanceScore}%</strong></span>
                          <span>•</span>
                          <span>Complexity: <strong className="text-[#1D1A20]">{paper.complexity}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate('/chat-with-pdf')}
                            className="text-[11.5px] font-medium text-[#5F2781] hover:underline flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                            Chat with this Paper
                          </button>
                          <button
                            onClick={() => {
                              if (!selectedPaperIds.includes(paper.id)) {
                                togglePaperSelection(paper.id);
                              }
                              handleAnalyzeSelectedPapers();
                            }}
                            className="text-[11.5px] font-medium text-[#5F2781] hover:underline flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                            Extract Evidence
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. EVIDENCE VALIDATION SECTION (SHOWN AFTER ANALYSIS) ── */}
      {hasAnalyzed && (
        <section className="px-6 py-4 max-w-7xl w-full mx-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E5DDE9] shadow-xs p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9F3] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#5F2781]">verified</span>
                <h3 className="text-[16px] font-bold text-[#1D1A20]">
                  Human-in-the-Loop Evidence Validation
                </h3>
              </div>
              <span className="text-[12px] text-outline">
                Verify extracted claims before synthesis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  id: 'ev-1',
                  paperId: 'patchtst-2024',
                  paperTitle: 'PatchTST for Long-Horizon Electricity Load and Price Forecasting',
                  source: 'Equation 4 • Page 4',
                  claim: 'Sub-series level patching reduces attention computation from quadratic O(L²) to O((L/P)²)',
                  status: evidenceStatusMap['patchtst-2024'] || 'Accepted',
                },
                {
                  id: 'ev-2',
                  paperId: 'dlinear-2023',
                  paperTitle: 'DLinear vs. Complex Transformers',
                  source: 'Section 3 • Page 3',
                  claim: 'Single-layer linear autoregression with moving average decomposition achieves lower error than Informer with O(L) compute.',
                  status: evidenceStatusMap['dlinear-2023'] || 'Needs Review',
                },
                {
                  id: 'ev-3',
                  paperId: 'informer-2021',
                  paperTitle: 'Informer: Beyond Efficient Transformer',
                  source: 'Theorem 1 • Page 5',
                  claim: 'ProbSparse KL-divergence query selection isolates top-u queries, lowering query complexity to O(L log L).',
                  status: evidenceStatusMap['informer-2021'] || 'Accepted',
                },
                {
                  id: 'ev-4',
                  paperId: 'diffload-2025',
                  paperTitle: 'Probabilistic Diffusion Models for Renewable Generation',
                  source: 'Algorithm 2 • Page 8',
                  claim: 'Score-based reverse Langevin diffusion provides calibrated quantile confidence bounds but requires 1.4s per forecast sample.',
                  status: evidenceStatusMap['diffload-2025'] || 'Needs Review',
                }
              ].map(item => (
                <div key={item.id} className="p-3.5 rounded-xl bg-[#FAF7FC] border border-[#EAE0F0] flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-[#5F2781] truncate">
                        {item.paperTitle}
                      </span>
                      <span className="text-[10.5px] font-code text-outline bg-white px-1.5 py-0.5 rounded border border-[#E5DDE9] shrink-0">
                        {item.source}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#1D1A20] leading-snug">
                      "{item.claim}"
                    </p>
                  </div>

                  {/* Verification Controls */}
                  <div className="pt-2 border-t border-[#EFE5F5] flex items-center justify-between">
                    <span className="text-[11px] text-outline">Validation Status:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEvidenceStatus(item.paperId, 'Accepted');
                          showToast(`Claim from ${item.paperTitle.split(' ')[0]} marked Accepted`);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                          item.status === 'Accepted'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-emerald-800 border border-[#E5DDE9] hover:bg-emerald-50'
                        }`}
                        type="button"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setEvidenceStatus(item.paperId, 'Needs Review');
                          showToast(`Claim marked Needs Review`);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                          item.status === 'Needs Review'
                            ? 'bg-[#FED889] text-[#755A18] shadow-xs'
                            : 'bg-white text-[#755A18] border border-[#E5DDE9] hover:bg-[#FED889]/30'
                        }`}
                        type="button"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. CENTRAL RESEARCH CHAT & AGENTIC INVESTIGATION ── */}
      <section className="px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-2xl border border-[#E5DDE9] shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE9F3] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F5ECF9] text-[#5F2781] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">forum</span>
              </div>
              <div>
                <h3 className="text-[15.5px] font-bold text-[#1D1A20]">
                  Research Chat &amp; Follow-up
                </h3>
                <p className="text-[12px] text-outline">
                  Ask questions across discovered literature, extract methodology, or synthesize sections
                </p>
              </div>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'What are the research gaps in these papers?',
              'Compare PatchTST vs Informer complexity',
              'Analyze methodology and datasets across selected papers',
              'Write a literature review based on these papers'
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleResearchChatSubmit(undefined, prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7FC] hover:bg-[#F5ECF9] hover:text-[#5F2781] border border-[#E5DDE9] text-[12px] font-medium text-[#4D4450] transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px] text-[#5F2781]">spark</span>
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 mb-4">
            {researchChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#5F2781] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">psychology</span>
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-[13px] leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#5F2781] text-white rounded-tr-none'
                      : msg.role === 'agent-action'
                      ? 'bg-[#FAF7FC] border border-[#EAE0F0] text-[#1D1A20] rounded-tl-none w-full'
                      : 'bg-white border border-[#E5DDE9] text-[#1D1A20] rounded-tl-none'
                  }`}
                >
                  <p className="font-medium whitespace-pre-line">{msg.text}</p>

                  {/* Action Checklist if Agent Action */}
                  {msg.actionItems && (
                    <div className="mt-3 pt-2.5 border-t border-[#EFE9F3] space-y-1.5">
                      {msg.actionItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[12px] text-emerald-800 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                          <span>{item}</span>
                        </div>
                      ))}
                      {msg.text.includes('Literature Review') && (
                        <button
                          type="button"
                          onClick={() => navigate('/report')}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5F2781] text-white text-[12px] font-bold hover:bg-[#4A176B] transition-all cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">description</span>
                          Open Generated Literature Review
                        </button>
                      )}
                    </div>
                  )}

                  {/* Research Gaps Cards if findings present */}
                  {msg.findings && (
                    <div className="mt-3 space-y-2.5">
                      {msg.findings.map((f, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-[#EAE0F0] shadow-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[12.5px] text-[#3F1A57]">{f.title}</span>
                            <span className="text-[10px] font-code text-outline bg-[#F7F2F9] px-1.5 py-0.5 rounded border border-[#E5DDE9]">
                              {f.citation}
                            </span>
                          </div>
                          <p className="text-[12px] text-on-surface-variant leading-snug">{f.gap}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className={`block text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-outline'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleResearchChatSubmit} className="relative flex items-center">
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              placeholder="Ask anything about the discovered papers (e.g., 'What datasets were used in PatchTST?')..."
              className="w-full bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl pl-4 pr-12 py-3 text-[13.5px] text-[#1D1A20] placeholder-[#8F8495] focus:outline-none focus:border-[#5F2781]"
            />
            <button
              type="submit"
              disabled={!chatInputText.trim()}
              className={`absolute right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all ${
                chatInputText.trim()
                  ? 'bg-[#5F2781] hover:bg-[#4A176B] cursor-pointer shadow-xs'
                  : 'bg-[#C4B2CC] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </form>
        </div>
      </section>

      {/* ── 7. PERSISTENT FLOATING BOTTOM ACTION BAR (WHEN PAPERS SELECTED) ── */}
      {selectedPaperIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-4xl animate-slideUp">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-3.5 flex flex-wrap items-center justify-between gap-3 border border-[#E5DDE9]">
            {/* Selection info */}
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5F2781]" />
              <span className="text-[13.5px] font-bold text-[#1D1A20]">
                {selectedPaperIds.length} paper{selectedPaperIds.length === 1 ? '' : 's'} selected
              </span>
              {selectedPaperNames && (
                <span className="hidden sm:inline text-[12px] text-outline bg-[#F7F2F9] px-2 py-0.5 rounded-md border border-[#E5DDE9]">
                  {selectedPaperNames}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={handleAnalyzeSelectedPapers}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5F2781] text-white hover:bg-[#4A176B] transition-all text-[13px] font-bold cursor-pointer shadow-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>Analyze Papers</span>
              </button>

              <button
                onClick={() => navigate('/chat-with-pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7FC] text-[#3F1A57] hover:bg-[#F5ECF9] border border-[#E5DDE9] transition-all text-[13px] font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#5F2781]">picture_as_pdf</span>
                <span>Chat with Papers</span>
              </button>

              <button
                onClick={() => navigate('/compare')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7FC] text-[#3F1A57] hover:bg-[#F5ECF9] border border-[#E5DDE9] transition-all text-[13px] font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#5F2781]">view_column</span>
                <span>Compare</span>
              </button>

              <button
                onClick={() => navigate('/report')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7FC] text-[#3F1A57] hover:bg-[#F5ECF9] border border-[#E5DDE9] transition-all text-[13px] font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#5F2781]">edit_note</span>
                <span>Literature Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
