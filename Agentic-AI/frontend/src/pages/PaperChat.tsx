import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { pdfService } from '../services/pdfService';
import {
  PDFDocumentModel,
  PaperChatMessage,
  PaperChatSourceChunk,
  PaperChatTurn,
} from '../types';

// ─── Suggested starter questions ─────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  { label: 'Summarize this paper', icon: 'auto_stories' },
  { label: 'Explain the methodology', icon: 'psychology' },
  { label: 'What datasets did they use?', icon: 'database' },
  { label: 'What are the main results?', icon: 'table_chart' },
  { label: 'What are the limitations?', icon: 'rule' },
  { label: 'What are the key contributions?', icon: 'emoji_objects' },
];

// ─── Agent status display labels ─────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  'Loading paper from index...': 'Loading paper...',
  'Retrieving evidence from paper...': 'Retrieving evidence...',
  'Validating sources...': 'Validating sources...',
  'Rewriting query for better retrieval...': 'Refining query...',
  'Generating answer with Gemini...': 'Generating answer...',
  'Verifying citations...': 'Verifying citations...',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ts(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function uid(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Convert PaperChatMessage history to the wire format the backend expects. */
function toHistory(messages: PaperChatMessage[]): PaperChatTurn[] {
  return messages
    .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.isStreaming))
    .map(m => ({ role: m.role, content: m.content }));
}

// ─── Source citation card ─────────────────────────────────────────────────────
interface SourceCardProps {
  src: PaperChatSourceChunk;
  onOpenPage: (page: number) => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ src, onOpenPage }) => (
  <div className="flex flex-col gap-1.5 p-3 bg-white border border-[#EAE0F0] rounded-xl shadow-xs text-[12px] group">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-bold text-[#5F2781] shrink-0">{src.marker}</span>
        <span className="text-[#3F1A57] font-semibold truncate">{src.section}</span>
      </div>
      <button
        type="button"
        onClick={() => onOpenPage(src.page)}
        title={`Open page ${src.page}`}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5ECF9] hover:bg-[#ECD9F3] text-[#5F2781] text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
        <span>p.{src.page}</span>
      </button>
    </div>
    <p className="text-[#4D4450] leading-relaxed italic line-clamp-4">
      &quot;{src.quote}&quot;
    </p>
  </div>
);

// ─── Inline markdown renderer for chat messages ───────────────────────────────
const MarkdownMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="prose prose-sm max-w-none text-inherit">
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-[15px] font-bold mt-2 mb-1">{children as React.ReactNode}</h1>,
        h2: ({ children }) => <h2 className="text-[14px] font-bold mt-2 mb-1">{children as React.ReactNode}</h2>,
        h3: ({ children }) => <h3 className="text-[13px] font-semibold mt-2 mb-0.5">{children as React.ReactNode}</h3>,
        p: ({ children }) => <p className="mb-1.5 leading-relaxed">{children as React.ReactNode}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children as React.ReactNode}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children as React.ReactNode}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children as React.ReactNode}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children as React.ReactNode}</strong>,
        code: ({ children }) => (
          <code className="bg-black/10 rounded px-1 py-0.5 text-[11px] font-mono">{children as React.ReactNode}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#5F2781]/40 pl-3 my-1.5 italic opacity-80">
            {children as React.ReactNode}
          </blockquote>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  </div>
);

// ─── Streaming text hook ──────────────────────────────────────────────────────
function useStreamText(target: string, enabled: boolean): string {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(target);
      return;
    }
    setDisplayed('');
    idx.current = 0;
    const interval = setInterval(() => {
      idx.current += 4; // chars per tick
      if (idx.current >= target.length) {
        setDisplayed(target);
        clearInterval(interval);
      } else {
        setDisplayed(target.slice(0, idx.current));
      }
    }, 12);
    return () => clearInterval(interval);
  }, [target, enabled]);

  return displayed;
}

// ─── Single assistant message bubble ─────────────────────────────────────────
interface AssistantBubbleProps {
  msg: PaperChatMessage;
  onOpenPage: (page: number) => void;
  showSources: boolean;
  onToggleSources: () => void;
  isNewest: boolean;
}

const AssistantBubble: React.FC<AssistantBubbleProps> = ({
  msg, onOpenPage, showSources, onToggleSources, isNewest,
}) => {
  const streamed = useStreamText(msg.content, !!msg.isStreaming && isNewest);
  const displayText = isNewest && msg.isStreaming ? streamed : msg.content;

  return (
    <div className="flex gap-3 justify-start animate-fadeIn">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5F2781] to-[#8B45B5] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <span className="material-symbols-outlined text-[16px]">psychology</span>
      </div>

      <div className="flex flex-col gap-2 max-w-[85%] min-w-0">
        {/* Main bubble */}
        <div className="bg-[#FAF7FC] border border-[#EAE0F0] rounded-2xl rounded-tl-none p-4 text-[13.5px] leading-relaxed text-[#1D1A20] shadow-xs">
          {msg.isStreaming && isNewest && !displayText ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5F2781] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#5F2781] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#5F2781] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <MarkdownMessage text={displayText} />
          )}

          {/* Metadata footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EFE5F5]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-outline">{msg.timestamp}</span>
              {msg.verified && (
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified
                </span>
              )}
              {msg.insufficient_evidence && (
                <span className="text-[10px] text-amber-600 font-semibold">No evidence found</span>
              )}
            </div>

            {/* Toggle sources button */}
            {msg.sources && msg.sources.length > 0 && (
              <button
                type="button"
                onClick={onToggleSources}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#5F2781] hover:underline cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showSources ? 'expand_less' : 'expand_more'}
                </span>
                {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''} from this paper
              </button>
            )}
          </div>
        </div>

        {/* Inline citation chips */}
        {msg.sources && msg.sources.length > 0 && !showSources && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {msg.sources.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onOpenPage(src.page)}
                title={`${src.filename} — Page ${src.page}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E5DDE9] hover:bg-[#F5ECF9] hover:border-[#5F2781] text-[#5F2781] text-[11px] font-semibold transition-colors cursor-pointer shadow-xs group"
              >
                <span className="material-symbols-outlined text-[12px]">auto_stories</span>
                <span>{src.filename} — Page {src.page}</span>
              </button>
            ))}
          </div>
        )}

        {/* Expanded source cards */}
        {showSources && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-col gap-2 px-1 animate-fadeIn">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#5F2781] px-1">
              Sources from this paper
            </span>
            {msg.sources.map((src, i) => (
              <SourceCard key={i} src={src} onOpenPage={onOpenPage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page viewer panel ────────────────────────────────────────────────────────
interface PageViewerProps {
  doc: PDFDocumentModel;
  activePage: number;
  onPageChange: (p: number) => void;
}

const PageViewer: React.FC<PageViewerProps> = ({ doc, activePage, onPageChange }) => {
  const pageText = doc.full_text_by_page?.[activePage];

  return (
    <aside className="w-full xl:w-96 bg-[#FAFAFE] border-l border-[#EFE9F3] flex flex-col shrink-0 overflow-hidden">
      {/* Panel header */}
      <div className="p-4 border-b border-[#EFE9F3] bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-[#5F2781]">menu_book</span>
          <span className="text-[13px] font-bold text-[#1D1A20] truncate">Paper Viewer</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-outline">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, activePage - 1))}
            disabled={activePage <= 1}
            className="p-1 rounded hover:bg-[#F5ECF9] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span className="font-medium">p.{activePage} / {doc.page_count}</span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(doc.page_count, activePage + 1))}
            disabled={activePage >= doc.page_count}
            className="p-1 rounded hover:bg-[#F5ECF9] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-4">
        {pageText ? (
          <div className="text-[12.5px] text-[#2C2432] leading-relaxed whitespace-pre-wrap bg-white border border-[#E5DDE9] rounded-xl p-4 shadow-xs font-mono">
            {pageText}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-outline">
            <span className="material-symbols-outlined text-[32px]">image</span>
            <p className="text-[12px]">
              Page {activePage} — text not available<br />
              (may contain only images or figures)
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

// ─── Main PaperChat page ───────────────────────────────────────────────────────
export const PaperChat: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();

  // State
  const [doc, setDoc] = useState<PDFDocumentModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<PaperChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [agentStatusText, setAgentStatusText] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [showPageViewer, setShowPageViewer] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load document on mount
  useEffect(() => {
    if (!docId) {
      setError('No paper ID provided.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // Try backend first, then fall back to local cache via getDocuments()
        const docs = await pdfService.getDocuments();
        const found = docs.find(d => d.id === docId);
        if (!found) {
          setError('Paper not found. Make sure it is saved and indexed.');
        } else {
          setDoc(found);
        }
      } catch (e) {
        setError('Could not load paper details. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  // Build conversation history for the API
  const conversationHistory = useMemo((): PaperChatTurn[] => toHistory(messages), [messages]);

  // ── Send a question ───────────────────────────────────────────────────────
  const handleSend = useCallback(async (customQuery?: string) => {
    const query = (customQuery ?? input).trim();
    if (!query || !docId || isAsking) return;

    // Add user message
    const userMsg: PaperChatMessage = {
      id: uid(),
      role: 'user',
      content: query,
      timestamp: ts(),
    };
    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setInput('');
    setIsAsking(true);

    // Add a streaming placeholder for the assistant
    const assistantId = uid();
    const streamingPlaceholder: PaperChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: ts(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, streamingPlaceholder]);

    // Animate agent status
    const statusSequence = [
      'Retrieving evidence...',
      'Validating sources...',
      'Generating answer...',
      'Verifying citations...',
    ];
    let statusIdx = 0;
    setAgentStatusText(statusSequence[0]);
    const statusTimer = setInterval(() => {
      statusIdx = Math.min(statusIdx + 1, statusSequence.length - 1);
      setAgentStatusText(statusSequence[statusIdx]);
    }, 1200);

    try {
      const result = await pdfService.paperChat(docId, query, conversationHistory);
      clearInterval(statusTimer);

      // Replace streaming placeholder with the real answer
      const assistantMsg: PaperChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: result.answer,
        timestamp: ts(),
        sources: result.sources,
        agentStatus: result.agent_status,
        verified: result.verified,
        insufficient_evidence: result.insufficient_evidence,
        isStreaming: true, // trigger word-by-word animation
      };
      setMessages(prev => prev.map(m => (m.id === assistantId ? assistantMsg : m)));

      // Navigate page viewer to first cited page
      if (result.sources.length > 0) {
        setActivePage(result.sources[0].page);
      }

      // Stop streaming flag after animation completes (~2s)
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
      }, Math.min(result.answer.length * 12 / 4 + 500, 8000));
    } catch (err) {
      clearInterval(statusTimer);
      const errText = err instanceof Error ? err.message : 'Something went wrong.';
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `❌ ${errText}`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsAsking(false);
      setAgentStatusText('');
    }
  }, [input, docId, isAsking, conversationHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#FCFBFE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#5F2781] border-t-transparent animate-spin" />
          <p className="text-[13px] text-outline font-medium">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#FCFBFE]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 bg-white border border-[#EAE0F0] rounded-2xl shadow-md">
          <span className="material-symbols-outlined text-[40px] text-red-400">error</span>
          <h2 className="text-[16px] font-bold text-[#1D1A20]">Paper not found</h2>
          <p className="text-[13px] text-outline">{error ?? 'Could not load the requested paper.'}</p>
          <button
            type="button"
            onClick={() => navigate('/chat-with-pdf')}
            className="px-4 py-2 bg-[#5F2781] text-white rounded-xl text-[13px] font-semibold hover:bg-[#4A176B] transition-colors cursor-pointer"
          >
            Back to PDF Library
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#FCFBFE] overflow-hidden">
      {/* ── Top bar with paper info ─────────────────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-[#EFE9F3] px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/chat-with-pdf')}
            className="p-1.5 rounded-lg hover:bg-[#F5ECF9] text-[#5F2781] transition-colors shrink-0 cursor-pointer"
            title="Back to PDF Library"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          {/* Paper title */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-[14px] font-bold text-[#1D1A20] truncate leading-tight">
              {doc.title || doc.filename}
            </h1>
            <p className="text-[11px] text-outline truncate">
              {doc.authors && <span>{doc.authors}</span>}
              {doc.year && <span> · {doc.year}</span>}
              <span> · {doc.page_count} pages</span>
              {doc.chunks?.length > 0 && <span> · {doc.chunks.length} chunks indexed</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Verified badge if LLM backend connected */}
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-[#5F2781] bg-[#F5ECF9] px-2.5 py-1 rounded-full border border-[#ECD9F3]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Agentic RAG · Scoped to this paper
          </span>

          {/* Toggle page viewer */}
          <button
            type="button"
            onClick={() => setShowPageViewer(v => !v)}
            title={showPageViewer ? 'Hide page viewer' : 'Show page viewer'}
            className="p-1.5 rounded-lg hover:bg-[#F5ECF9] text-[#5F2781] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPageViewer ? 'chrome_reader_mode' : 'menu_book'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Body: chat + (optional) page viewer ────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── CHAT PANEL ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scroll-smooth">

            {/* ── Empty state with suggestions ──────────────────────────── */}
            {isEmpty && (
              <div className="flex flex-col items-center justify-center min-h-[60%] text-center gap-6 animate-fadeIn">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5F2781] to-[#8B45B5] flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-[30px]">chat</span>
                </div>

                <div>
                  <h2 className="text-[20px] font-bold text-[#1D1A20] mb-1">
                    Chat with this paper
                  </h2>
                  <p className="text-[13px] text-outline max-w-sm">
                    Ask anything about <strong className="text-[#5F2781]">{doc.title || doc.filename}</strong>.
                    Every answer is grounded in the paper's actual content.
                  </p>
                </div>

                {/* Suggested question chips */}
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {SUGGESTED_QUESTIONS.map(q => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => handleSend(q.label)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E5DDE9] hover:border-[#5F2781] hover:bg-[#F5ECF9] text-[#3F1A57] text-[12.5px] font-semibold transition-all cursor-pointer shadow-xs hover:shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#5F2781]">{q.icon}</span>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Message list ───────────────────────────────────────────── */}
            {messages.map((msg, idx) => {
              const isNewest = idx === messages.length - 1;

              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end animate-fadeIn">
                    <div className="max-w-[75%]">
                      <div className="bg-[#5F2781] text-white rounded-2xl rounded-tr-none px-4 py-3 text-[13.5px] leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                      <span className="block text-[10px] text-outline text-right mt-1">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              return (
                <AssistantBubble
                  key={msg.id}
                  msg={msg}
                  onOpenPage={p => { setActivePage(p); setShowPageViewer(true); }}
                  showSources={expandedSources.has(msg.id)}
                  onToggleSources={() => toggleSources(msg.id)}
                  isNewest={isNewest}
                />
              );
            })}

            {/* ── Loading indicator ──────────────────────────────────────── */}
            {isAsking && (
              <div className="flex items-center gap-3 p-3 bg-[#FAF7FC] border border-[#E5DDE9] rounded-xl w-fit max-w-xs animate-fadeIn">
                <div className="w-5 h-5 rounded-full border-2 border-[#5F2781] border-t-transparent animate-spin shrink-0" />
                <div>
                  <p className="text-[11.5px] font-bold text-[#3F1A57]">R-Lens</p>
                  <p className="text-[11px] text-[#5F2781] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    {agentStatusText}
                  </p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Suggested chips (when chat has messages) ──────────────────── */}
          {!isEmpty && (
            <div className="shrink-0 px-4 sm:px-8 py-2 border-t border-[#F0EAF5] bg-[#FCFBFE] flex gap-2 flex-wrap overflow-x-auto no-scrollbar">
              {SUGGESTED_QUESTIONS.slice(0, 5).map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleSend(q.label)}
                  disabled={isAsking}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#E5DDE9] bg-white hover:bg-[#F5ECF9] hover:border-[#5F2781] text-[#4D4450] hover:text-[#5F2781] text-[11.5px] font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span className="material-symbols-outlined text-[13px]">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ─────────────────────────────────────────────────── */}
          <div className="shrink-0 p-4 bg-white border-t border-[#EFE9F3]">
            <div className={`flex gap-3 items-end bg-[#FAF7FC] border rounded-2xl px-4 py-3 transition-all shadow-inner ${
              isAsking ? 'border-[#EAE0F0]' : 'border-[#E5DDE9] focus-within:border-[#5F2781] focus-within:shadow-sm'
            }`}>
              <textarea
                ref={inputRef}
                id="paper-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about this paper... (e.g. "What is the main contribution?")`}
                rows={1}
                disabled={isAsking}
                className="flex-1 bg-transparent resize-none border-0 focus:outline-none text-[13.5px] text-[#1D1A20] placeholder-[#8F8495] max-h-36 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
              />
              <button
                id="paper-chat-send-btn"
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isAsking}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 transition-all ${
                  input.trim() && !isAsking
                    ? 'bg-[#5F2781] hover:bg-[#4A176B] cursor-pointer shadow-sm hover:shadow'
                    : 'bg-[#C4B2CC] cursor-not-allowed'
                }`}
              >
                {isAsking ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                )}
              </button>
            </div>
            <p className="text-[10.5px] text-outline text-center mt-2">
              Answers are grounded in <strong>{doc.filename}</strong> only · Powered by Gemini + LangGraph
            </p>
          </div>
        </main>

        {/* ── PAGE VIEWER (right panel) ─────────────────────────────────── */}
        {showPageViewer && (
          <PageViewer
            doc={doc}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        )}
      </div>
    </div>
  );
};

export default PaperChat;
