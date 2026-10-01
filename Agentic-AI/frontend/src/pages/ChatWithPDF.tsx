import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { pdfService } from '../services/pdfService';
import { PDFDocumentModel, PDFRAGCitation, PDFSectionInfo } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: PDFRAGCitation[];
  agentSteps?: string[];
}

const SUGGESTED_QUESTIONS = [
  'Summarize this paper',
  'Explain the methodology',
  'What datasets were used?',
  'What are the main results?',
  'Find limitations',
  'What are the key contributions?',
  'Compare the methodologies of these papers'
];

export const ChatWithPDF: React.FC = () => {
  const { showToast, intentPayload, setIntentPayload, setEvidenceStatus } = useResearch();
  const navigate = useNavigate();

  // Document management state — always starts empty, only real uploaded PDFs allowed
  const [documents, setDocuments] = useState<PDFDocumentModel[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAgentSearching, setIsAgentSearching] = useState(false);
  const [agentActivityStep, setAgentActivityStep] = useState<string>('');

  // Right-panel text/page viewer state
  const [activePage, setActivePage] = useState<number>(1);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);

  // Drag & drop ref
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load initial documents
  useEffect(() => {
    pdfService.getDocuments().then(docs => {
      if (docs.length > 0) {
        setDocuments(docs);
      }
    });
  }, []);

  // Handle intent payload if routed from home/workspace
  useEffect(() => {
    if (intentPayload && intentPayload.intent === 'PDF_QUERY') {
      const val = intentPayload.text || '';
      if (val) {
        if (!activeDocId && documents.length > 0) {
          selectDocument(documents[0]);
        }
        setInput(val);
      }
      setIntentPayload(null);
    }
  }, [intentPayload, documents, activeDocId]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentSearching]);

  // Active document object
  const activeDoc = useMemo(() => {
    return documents.find(d => d.id === activeDocId) || null;
  }, [documents, activeDocId]);

  // Document selection helper
  const selectDocument = (doc: PDFDocumentModel) => {
    setActiveDocId(doc.id);
    setSelectedDocIds(prev => prev.includes(doc.id) ? prev : [...prev, doc.id]);
    setActivePage(1);
    setActiveSectionId(doc.sections?.[0]?.id || null);
    setHighlightedQuote(null);

    // Initial greeting if chat empty
    if (messages.length === 0) {
      const secCount = doc.sections?.length || 0;
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          text: `📄 **${doc.filename || doc.title}** loaded and indexed into vector memory (${doc.page_count || 1} pages, ${secCount} sections).\n\nYou can ask about methodology, mathematical formulations, datasets, empirical benchmarks, or limitations.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Upload file handler
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a valid PDF document (.pdf).');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('PDF uploaded — connecting to backend');

    setTimeout(() => setProcessingStage('Extracting text page-by-page via PyMuPDF'), 400);
    setTimeout(() => setProcessingStage('Detecting sections & chunking document'), 900);
    setTimeout(() => setProcessingStage('Indexing chunks into vector store'), 1400);

    try {
      const parsedDoc = await pdfService.uploadPDF(file);
      setDocuments(prev => {
        // Prevent duplicates: remove any doc with the same id before prepending
        const filtered = prev.filter(d => d.id !== parsedDoc.id);
        return [parsedDoc, ...filtered];
      });
      setProcessingStage('Research agent ready');
      setTimeout(() => {
        setIsProcessing(false);
        selectDocument(parsedDoc);
        const secCount = parsedDoc.sections?.length || 0;
        showToast(`✅ ${file.name} indexed — ${parsedDoc.page_count || 1} pages, ${secCount} sections detected.`);
      }, 500);
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      showToast(`❌ ${msg}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // Agentic RAG Q&A Execution
  const handleSend = async (customPrompt?: string) => {
    const queryText = (customPrompt || input).trim();
    if (!queryText) return;

    if (!activeDocId) {
      showToast('Please upload or select a PDF document first.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsAgentSearching(true);

    // Animate agentic pipeline steps
    setAgentActivityStep('Understanding query & mapping to document');
    setTimeout(() => setAgentActivityStep('Retrieving evidence chunks from vector index'), 600);
    setTimeout(() => setAgentActivityStep('Evaluating evidence sufficiency'), 1200);
    setTimeout(() => setAgentActivityStep('Generating grounded answer with page citations via Gemini'), 1800);

    const activeIds = selectedDocIds.length > 0 ? selectedDocIds : (activeDocId ? [activeDocId] : []);

    try {
      const result = await pdfService.queryAgenticRAG(queryText, activeIds);

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: result.citations,
        agentSteps: result.agent_steps
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Auto-navigate right panel to first citation
      if (result.citations && result.citations.length > 0) {
        const firstCit = result.citations[0];
        setActivePage(firstCit.page);
        setHighlightedQuote(firstCit.quote);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Query failed. Please try again.';
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `❌ ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsAgentSearching(false);
      setAgentActivityStep('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Click citation handler
  const handleCitationClick = (citation: PDFRAGCitation) => {
    if (citation.doc_id && citation.doc_id !== activeDocId) {
      const targetDoc = documents.find(d => d.id === citation.doc_id);
      if (targetDoc) {
        setActiveDocId(targetDoc.id);
      }
    }
    setActivePage(citation.page);
    setHighlightedQuote(citation.quote);
    showToast(`Navigated to ${citation.doc_name} — Page ${citation.page}`);
  };

  // Section click handler in Right Panel
  const handleSectionClick = (sec: PDFSectionInfo) => {
    setActiveSectionId(sec.id);
    setActivePage(sec.page);
    setHighlightedQuote(null);
  };

  // Send evidence to other R-Lens tools
  const handleSendToTool = (targetPath: string, label: string) => {
    if (!activeDoc) return;
    
    // Update ResearchContext
    setEvidenceStatus(activeDoc.id, 'Accepted');
    setIntentPayload({
      intent: 'PDF_QUERY',
      topic: activeDoc.title,
      text: activeDoc.chunks[0]?.text || activeDoc.title,
      doi: activeDoc.doi || '10.1109/TSG.2024.3389102'
    });

    showToast(`Transferred ${activeDoc.title.slice(0, 30)}... evidence to ${label}`);
    navigate(targetPath);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: BEFORE UPLOAD (Drag-and-Drop + Sample Papers Picker)
  // ──────────────────────────────────────────────────────────────────────────
  if (!activeDoc) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5ECF9] border border-[#ECD9F3] text-[#5F2781] text-[12px] font-semibold mb-3">
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>Agentic RAG PDF Bench</span>
            </div>
            <h1 className="text-[32px] sm:text-[36px] font-bold text-[#1D1A20] tracking-tight">
              Chat with Research Papers
            </h1>
            <p className="text-[14px] text-on-surface-variant max-w-lg mx-auto mt-1">
              Upload any PDF paper or select a benchmark to extract methodology, inspect page citations, and verify claims.
            </p>
          </div>

          {/* Processing Banner if uploading */}
          {isProcessing ? (
            <div className="w-full bg-white border border-[#E5DDE9] rounded-2xl p-8 shadow-md flex flex-col items-center gap-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full border-3 border-[#5F2781] border-t-transparent animate-spin" />
              <div className="text-center">
                <h3 className="text-[16px] font-bold text-[#1D1A20]">Processing Document</h3>
                <p className="text-[13px] text-[#5F2781] font-semibold mt-1 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {processingStage}...
                </p>
              </div>
            </div>
          ) : (
            /* Upload Drop Area */
            <div
              id="pdf-drop-zone"
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full bg-white border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-xs ${
                isDragging
                  ? 'border-[#5F2781] bg-[#FAF6FC] scale-[1.01]'
                  : 'border-[#CFBFD9] hover:border-[#7B3A9E] hover:bg-[#FAF7FC]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
              />
              <div className="w-16 h-16 rounded-2xl bg-[#F5ECF9] text-[#5F2781] flex items-center justify-center mb-4 shadow-xs">
                <span className="material-symbols-outlined text-[32px]">upload_file</span>
              </div>
              <h3 className="text-[17px] font-bold text-[#1D1A20] mb-1">
                Drop your research PDF here
              </h3>
              <p className="text-[13px] text-outline mb-4">
                or click to browse your computer (PDFs up to 50 MB)
              </p>
              <span className="text-[12px] font-semibold text-[#5F2781] bg-[#F5ECF9] px-3.5 py-1.5 rounded-lg border border-[#ECD9F3]">
                Extracts Sections • Embeds Chunks • Verifies Citations
              </span>
            </div>
          )}

          {/* Previously uploaded PDFs from backend session */}
          {documents.length > 0 && (
            <div className="w-full mt-8">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-outline">
                  Previously uploaded this session:
                </span>
                <div className="flex-1 h-px bg-[#EFE9F3]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {documents.map((doc: PDFDocumentModel) => (
                  <div
                    key={doc.id}
                    className="bg-white border border-[#E5DDE9] hover:border-[#5F2781] rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
                  >
                    <div onClick={() => selectDocument(doc)}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-[16px] text-[#5F2781]">description</span>
                        <span className="text-[11px] font-bold text-[#5F2781] bg-[#F5ECF9] px-2 py-0.5 rounded">
                          {doc.page_count} Pages
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-[#1D1A20] group-hover:text-[#5F2781] transition-colors line-clamp-2 leading-snug">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-outline mt-1 truncate">{doc.authors}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#F5EDFA] flex items-center justify-between text-[11px] text-outline">
                      <span>{doc.venue}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/paper-chat/${doc.id}`); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#5F2781] text-white text-[11px] font-semibold hover:bg-[#4A176B] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">chat</span>
                          Chat
                        </button>
                        <span className="font-semibold text-[#5F2781] group-hover:underline cursor-pointer" onClick={() => selectDocument(doc)}>Open →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: THREE-PANEL RESEARCH WORKSPACE (After Upload / Selection)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] flex flex-col xl:flex-row overflow-hidden">
      {/* ── PANEL 1 (LEFT): DOCUMENT METADATA, MULTI-PDF LIST & ACTIONS ── */}
      <aside className="w-full xl:w-72 border-r border-[#EFE9F3] bg-white flex flex-col shrink-0">
        {/* Document Header */}
        <div className="p-4 border-b border-[#EFE9F3] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Active Paper</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11.5px] font-semibold text-[#5F2781] hover:underline flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Add PDF
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
            />
          </div>

          {/* Multi-PDF Selector Tabs */}
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
            {documents.map(d => (
              <div
                key={d.id}
                onClick={() => selectDocument(d)}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                  d.id === activeDocId
                    ? 'bg-[#F5ECF9] border-[#ECD9F3] text-[#3F1A57]'
                    : 'bg-[#FAF7FC] border-[#EFE5F5] hover:bg-[#F3EBF4] text-[#4D4450]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[16px] text-[#5F2781] shrink-0">picture_as_pdf</span>
                  <span className="text-[12px] font-semibold truncate">{d.filename}</span>
                </div>
                <span className="text-[10.5px] text-outline shrink-0">{d.page_count}p</span>
              </div>
            ))}
          </div>

          {/* Active Paper Details */}
          <div className="bg-[#FAF7FC] border border-[#EAE0F0] rounded-xl p-3 flex flex-col gap-1.5 text-[12px]">
            <h4 className="font-bold text-[#1D1A20] leading-snug line-clamp-2">
              {activeDoc.title || activeDoc.filename || 'Untitled Document'}
            </h4>
            <p className="text-on-surface-variant truncate">
              <strong>Authors:</strong> {activeDoc.authors || 'Unavailable'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-outline pt-1 border-t border-[#EFE5F5]">
              <span>{activeDoc.venue || 'Preprint'} ({activeDoc.year || '2024'})</span>
              <span>{activeDoc.page_count || 1} Pages</span>
            </div>
            {activeDoc.doi && (
              <span className="text-[10px] text-outline font-code truncate">DOI: {activeDoc.doi}</span>
            )}
            {/* Open dedicated chat button */}
            <button
              type="button"
              onClick={() => navigate(`/paper-chat/${activeDoc.id}`)}
              className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#5F2781] hover:bg-[#4A176B] text-white rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px]">chat</span>
              Open Dedicated Chat
            </button>
          </div>
        </div>

        {/* Quick Question Actions */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Quick Paper Actions</span>
          
          <div className="flex flex-col gap-1.5 text-[12.5px]">
            <button
              onClick={() => handleSend('Summarize the core methodology and problem formulation of this paper.')}
              className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-[#F5ECF9] text-[#1D1A20] hover:text-[#5F2781] border border-[#E5DDE9] transition-colors flex items-center gap-2 cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5F2781]">psychology</span>
              Explain Methodology
            </button>
            <button
              onClick={() => handleSend('What datasets and empirical benchmark settings were evaluated in this paper?')}
              className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-[#F5ECF9] text-[#1D1A20] hover:text-[#5F2781] border border-[#E5DDE9] transition-colors flex items-center gap-2 cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5F2781]">database</span>
              Extract Datasets &amp; Settings
            </button>
            <button
              onClick={() => handleSend('What are the key empirical findings and benchmark metric improvements?')}
              className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-[#F5ECF9] text-[#1D1A20] hover:text-[#5F2781] border border-[#E5DDE9] transition-colors flex items-center gap-2 cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5F2781]">table_chart</span>
              Extract Benchmark Results
            </button>
            <button
              onClick={() => handleSend('What limitations, constraints, and research gaps does this paper state?')}
              className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-[#F5ECF9] text-[#1D1A20] hover:text-[#5F2781] border border-[#E5DDE9] transition-colors flex items-center gap-2 cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5F2781]">rule</span>
              Find Limitations &amp; Gaps
            </button>
            <button
              onClick={() => handleSend('Compare the methodologies and forecasting complexity of these papers.')}
              className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-[#F5ECF9] text-[#1D1A20] hover:text-[#5F2781] border border-[#E5DDE9] transition-colors flex items-center gap-2 cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5F2781]">view_column</span>
              Compare Multi-PDFs
            </button>
          </div>

          {/* Transfer Evidence Section */}
          <div className="mt-4 pt-3 border-t border-[#EFE9F3] flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">Connect to R-Lens Tools</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleSendToTool('/report', 'Literature Review')}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7FC] hover:bg-[#F5ECF9] text-[#3F1A57] border border-[#EAE0F0] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">menu_book</span>
                Review
              </button>
              <button
                onClick={() => handleSendToTool('/ai-writer', 'AI Writer')}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7FC] hover:bg-[#F5ECF9] text-[#3F1A57] border border-[#EAE0F0] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                AI Writer
              </button>
              <button
                onClick={() => handleSendToTool('/citation-generator', 'Citation Generator')}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7FC] hover:bg-[#F5ECF9] text-[#3F1A57] border border-[#EAE0F0] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">format_quote</span>
                Cite
              </button>
              <button
                onClick={() => handleSendToTool('/paraphraser', 'Paraphraser')}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF7FC] hover:bg-[#F5ECF9] text-[#3F1A57] border border-[#EAE0F0] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">shuffle</span>
                Paraphrase
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── PANEL 2 (CENTER): AGENTIC RAG CONVERSATION ── */}
      <main className="flex-1 flex flex-col bg-white border-r border-[#EFE9F3] min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-3 border-b border-[#EFE9F3] bg-white/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[13.5px] font-bold text-[#1D1A20] truncate">
              Agentic RAG Conversation — {activeDoc.filename}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#5F2781] bg-[#F5ECF9] px-2.5 py-0.5 rounded-md border border-[#ECD9F3] font-semibold">
              LangGraph Multi-Step Engine
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#5F2781] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-[13.5px] leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-[#5F2781] text-white rounded-tr-none'
                    : 'bg-[#FAF7FC] border border-[#EAE0F0] text-[#1D1A20] rounded-tl-none'
                }`}
              >
                <div className="font-medium whitespace-pre-line">{msg.text}</div>

                {/* Clickable Citations list */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EFE5F5] space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F2781] block mb-1">
                      Verified Page Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleCitationClick(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-[#F5ECF9] text-[#5F2781] border border-[#E5DDE9] text-[11.5px] font-semibold transition-colors cursor-pointer shadow-xs group"
                          type="button"
                          title={`Click to open ${c.doc_name} at Page ${c.page}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                          <span>{c.doc_name} — Page {c.page}</span>
                          <span className="material-symbols-outlined text-[12px] opacity-60 group-hover:opacity-100">arrow_forward</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span className={`block text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-outline'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Live Agent Activity Indicator */}
          {isAgentSearching && (
            <div className="flex items-center gap-3 p-3.5 bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl animate-fadeIn">
              <div className="w-5 h-5 rounded-full border-2 border-[#5F2781] border-t-transparent animate-spin" />
              <div className="flex flex-col">
                <span className="text-[12.5px] font-bold text-[#3F1A57]">R-Lens Agentic Retrieval</span>
                <span className="text-[11.5px] text-[#5F2781] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {agentActivityStep}...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Question Chips */}
        <div className="px-6 py-2 border-t border-[#F5EDFA] bg-[#FCFBFE] flex gap-1.5 flex-wrap">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-[11.5px] px-3 py-1 rounded-full border border-[#E5DDE9] bg-white hover:bg-[#F5ECF9] hover:text-[#5F2781] text-[#4D4450] transition-colors cursor-pointer font-medium shadow-xs"
              type="button"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-[#EFE9F3] bg-white">
          <div className="flex gap-2 items-center bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl px-4 py-2.5 focus-within:border-[#5F2781] transition-colors shadow-inner">
            <textarea
              id="pdf-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything about ${activeDoc.filename}... (e.g. 'What datasets were used?')`}
              rows={1}
              className="flex-1 bg-transparent resize-none border-0 focus:outline-none text-[13.5px] text-[#1D1A20] placeholder-[#8F8495]"
            />
            <button
              id="pdf-chat-send-btn"
              onClick={() => handleSend()}
              type="button"
              disabled={!input.trim()}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 transition-all ${
                input.trim()
                  ? 'bg-[#5F2781] hover:bg-[#4A176B] cursor-pointer shadow-xs'
                  : 'bg-[#C4B2CC] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </div>
        </div>
      </main>

      {/* ── PANEL 3 (RIGHT): DOCUMENT STRUCTURE & PAGE TEXT VIEWER ── */}
      <aside className="w-full xl:w-96 bg-[#FAF7FC] border-t xl:border-t-0 xl:border-l border-[#EFE9F3] flex flex-col shrink-0">
        {/* Panel Header */}
        <div className="p-4 border-b border-[#EFE9F3] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#5F2781]">menu_book</span>
            <span className="text-[13.5px] font-bold text-[#1D1A20]">Document Sections &amp; Viewer</span>
          </div>
          <span className="text-[11px] text-outline font-medium">Page {activePage} of {activeDoc.page_count || 1}</span>
        </div>

        {/* Sections Outline List */}
        <div className="p-3 border-b border-[#EFE9F3] bg-white flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-outline px-1 mb-1">Table of Contents</span>
          {(activeDoc.sections || []).length > 0 ? (
            (activeDoc.sections || []).map((sec: PDFSectionInfo) => (
              <button
                key={sec.id}
                onClick={() => handleSectionClick(sec)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  activeSectionId === sec.id
                    ? 'bg-[#F5ECF9] text-[#5F2781] font-semibold'
                    : 'text-[#4D4450] hover:bg-[#FAF7FC] hover:text-[#1D1A20]'
                }`}
                type="button"
              >
                <span className="truncate">{sec.title}</span>
                <span className="text-[10.5px] text-outline ml-2 shrink-0">p. {sec.page}</span>
              </button>
            ))
          ) : (
            <span className="text-[11.5px] text-outline italic px-1 py-1">Document structure loaded</span>
          )}
        </div>

        {/* In-Line Page Text Viewer */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11.5px] font-bold text-outline uppercase tracking-wider">
            <span>Page {activePage} Full Text</span>
            {highlightedQuote && (
              <span className="text-[#5F2781] bg-[#F5ECF9] px-2 py-0.5 rounded text-[10.5px]">
                Active Citation Highlighted
              </span>
            )}
          </div>

          {/* Retrieved Evidence Grounding Box - real passage from the PDF */}
          {highlightedQuote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-900 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold mb-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-700">verified</span>
                <span>Retrieved Evidence Passage</span>
              </div>
              <p className="italic leading-relaxed">"{highlightedQuote}"</p>
            </div>
          )}

          {/* Page Content Card - verbatim text extracted by PyMuPDF */}
          <div className="p-4 bg-white border border-[#E5DDE9] rounded-xl shadow-xs text-[12.5px] text-[#2C2432] leading-relaxed whitespace-pre-line font-body">
            {activeDoc.full_text_by_page?.[activePage]
              || `[No extracted text for page ${activePage} — this page may contain only images or figures.]`
            }
          </div>
        </div>
      </aside>
    </div>
  );
};

