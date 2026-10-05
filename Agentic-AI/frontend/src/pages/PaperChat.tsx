import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { pdfService } from '../services/pdfService';
import {
  Conversation,
  ConversationMessage,
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
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.isStreaming))
    .map((m) => ({ role: m.role, content: m.content }));
}

interface SourceCardProps {
  src: PaperChatSourceChunk;
  onOpenPage: (page: number) => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ src, onOpenPage }) => (
  <div className="flex flex-col gap-1.5 p-3.5 bg-white border border-gray-200/80 rounded-xl shadow-2xs text-[12px] group">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-bold text-primary shrink-0">{src.marker}</span>
        <span className="text-gray-900 font-medium truncate">{src.section || 'Passage'}</span>
      </div>
      <button
        type="button"
        onClick={() => onOpenPage(src.page)}
        title={`Open page ${src.page}`}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-primary text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
        <span>p.{src.page}</span>
      </button>
    </div>
    <p className="text-gray-600 leading-relaxed italic line-clamp-4">
      &quot;{src.quote}&quot;
    </p>
  </div>
);

// ─── Inline markdown renderer for chat messages ───────────────────────────────
const MarkdownMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-[15px] font-bold mt-2 mb-1 text-gray-900">{children as React.ReactNode}</h1>,
        h2: ({ children }) => <h2 className="text-[14px] font-bold mt-2 mb-1 text-gray-900">{children as React.ReactNode}</h2>,
        h3: ({ children }) => <h3 className="text-[13px] font-semibold mt-2 mb-0.5 text-gray-800">{children as React.ReactNode}</h3>,
        p: ({ children }) => <p className="mb-1.5 leading-relaxed">{children as React.ReactNode}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children as React.ReactNode}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children as React.ReactNode}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children as React.ReactNode}</li>,
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children as React.ReactNode}</strong>,
        code: ({ children }) => (
          <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[11.5px] font-mono">{children as React.ReactNode}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/40 pl-3 my-1.5 italic text-gray-600">
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
      idx.current += 4;
      if (idx.current >= target.length) {
        setDisplayed(target);
        clearInterval(interval);
      } else {
        setDisplayed(target.slice(0, idx.current));
      }
    }, 15);
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
      <div className="w-8 h-8 rounded-xl bg-purple-50 text-primary border border-purple-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
        <span className="material-symbols-outlined text-[17px]">psychology</span>
      </div>

      <div className="flex flex-col gap-2 max-w-[85%] min-w-0">
        {/* Main bubble */}
        <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-none p-4 text-[13.5px] leading-relaxed text-gray-900 shadow-2xs">
          {msg.isStreaming && isNewest && !displayText ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <MarkdownMessage text={displayText} />
          )}

          {/* Metadata footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] text-gray-400">{msg.timestamp}</span>
              {msg.verified && (
                <span className="flex items-center gap-0.5 text-[10.5px] text-emerald-600 font-medium">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified
                </span>
              )}
              {msg.insufficient_evidence && (
                <span className="text-[10.5px] text-amber-600 font-medium">No direct evidence</span>
              )}
            </div>

            {/* Toggle sources button */}
            {msg.sources && msg.sources.length > 0 && (
              <button
                type="button"
                onClick={onToggleSources}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showSources ? 'expand_less' : 'expand_more'}
                </span>
                {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''} from paper
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
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200 text-primary text-[11px] font-medium transition-colors cursor-pointer shadow-2xs group"
              >
                <span className="material-symbols-outlined text-[12px]">auto_stories</span>
                <span>{src.filename || 'Paper'} — Page {src.page}</span>
              </button>
            ))}
          </div>
        )}

        {/* Expanded source cards */}
        {showSources && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-col gap-2 px-1 animate-fadeIn">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-500 px-1">
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
    <aside className="w-full xl:w-96 bg-white border-l border-gray-200/80 flex flex-col shrink-0 overflow-hidden shadow-sm animate-fadeIn">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-gray-200/80 bg-gray-50/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[17px] text-primary">menu_book</span>
          <span className="text-[13px] font-semibold text-gray-900 truncate">Document Pages</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, activePage - 1))}
            disabled={activePage <= 1}
            className="p-1 rounded-lg hover:bg-gray-200/70 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span className="font-medium text-gray-700">p.{activePage} / {doc.page_count}</span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(doc.page_count, activePage + 1))}
            disabled={activePage >= doc.page_count}
            className="p-1 rounded-lg hover:bg-gray-200/70 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-4">
        {pageText ? (
          <div className="text-[12.5px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 shadow-2xs font-mono">
            {pageText}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-gray-400 py-12">
            <span className="material-symbols-outlined text-[32px]">image</span>
            <p className="text-[12px]">
              Page {activePage} text not available<br />
              (may contain figures or scans)
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export const PaperChat: React.FC = () => {
  const { docId, conversationId: paramConvId } = useParams<{ docId: string; conversationId?: string }>();
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
  const [activeConvId, setActiveConvId] = useState<string | null>(paramConvId || null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load document and persistent conversation on mount
  useEffect(() => {
    if (!docId) {
      setError('No paper ID provided.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const docs = await pdfService.getDocuments();
        const found = docs.find(d => d.id === docId);
        if (!found) {
          setError('Paper not found. Make sure it is saved and indexed.');
        } else {
          setDoc(found);

          // Find or create persistent conversation
          let convId = paramConvId;
          if (convId) {
            try {
              const conv = await api.conversations.get(convId);
              if (conv && conv.messages) {
                const restored: PaperChatMessage[] = conv.messages.map((m: ConversationMessage) => ({
                  id: m.id,
                  role: m.role as any,
                  content: m.content,
                  timestamp: m.created_at ? new Date(m.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ts(),
                  sources: m.metadata?.sources as any,
                  verified: m.metadata?.verified as any,
                  insufficient_evidence: m.metadata?.insufficient_evidence as any,
                }));
                setMessages(restored);
              }
            } catch {
              // Create new
            }
          } else {
            // Find existing conversation for this paper
            try {
              const res = await api.conversations.list('chat_with_paper', 20);
              const existing = res.conversations.find((c: Conversation) => c.metadata?.doc_id === docId);
              if (existing) {
                convId = existing.id;
                setActiveConvId(existing.id);
                const fullConv = await api.conversations.get(existing.id);
                if (fullConv.messages && fullConv.messages.length > 0) {
                  const restored: PaperChatMessage[] = fullConv.messages.map((m: ConversationMessage) => ({
                    id: m.id,
                    role: m.role as any,
                    content: m.content,
                    timestamp: m.created_at ? new Date(m.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ts(),
                    sources: m.metadata?.sources as any,
                    verified: m.metadata?.verified as any,
                    insufficient_evidence: m.metadata?.insufficient_evidence as any,
                  }));
                  setMessages(restored);
                }
              } else {
                const created = await api.conversations.create({
                  title: `Chat: ${found.title.slice(0, 45)}`,
                  mode: 'chat_with_paper',
                  selected_paper_ids: [docId],
                  metadata: { doc_id: docId, doc_title: found.title },
                });
                convId = created.id;
                setActiveConvId(created.id);
              }
            } catch {
              // fallback
            }
          }
        }
      } catch (e) {
        setError('Could not load paper details. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    })();
  }, [docId, paramConvId]);

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

    if (activeConvId) {
      api.conversations.addMessage(activeConvId, {
        id: userMsg.id,
        role: 'user',
        content: query,
      }).catch(() => undefined);
    }

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

      if (activeConvId) {
        api.conversations.addMessage(activeConvId, {
          id: assistantId,
          role: 'assistant',
          content: result.answer,
          metadata: {
            sources: result.sources,
            verified: result.verified,
            insufficient_evidence: result.insufficient_evidence,
          },
        }).catch(() => undefined);
      }

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
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#FAFAFC]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
          <span className="material-symbols-outlined text-[36px] text-red-500">error</span>
          <h2 className="text-[16px] font-bold text-gray-900">Paper not found</h2>
          <p className="text-[13px] text-gray-500">{error ?? 'Could not load the requested paper.'}</p>
          <button
            type="button"
            onClick={() => navigate('/chat-with-pdf')}
            className="px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-medium hover:bg-primary-hover transition-colors cursor-pointer"
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
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#FAFAFC] overflow-hidden">
      {/* ── Top bar with paper info ─────────────────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-gray-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/chat-with-pdf')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0 cursor-pointer"
            title="Back to PDF Library"
          >
            <span className="material-symbols-outlined text-[19px]">arrow_back</span>
          </button>

          {/* Paper title */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-[13.5px] font-bold text-gray-900 truncate leading-tight">
              {doc.title || doc.filename}
            </h1>
            <p className="text-[11.5px] text-gray-500 truncate">
              {doc.authors && <span>{doc.authors}</span>}
              {doc.year && <span> · {doc.year}</span>}
              <span> · {doc.page_count} pages</span>
              {doc.chunks?.length > 0 && <span> · {doc.chunks.length} chunks indexed</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Agentic RAG Active
          </span>

          {/* Toggle page viewer */}
          <button
            type="button"
            onClick={() => setShowPageViewer((v) => !v)}
            title={showPageViewer ? 'Hide page viewer' : 'Show page viewer'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showPageViewer
                ? 'bg-purple-50 border-purple-200 text-primary'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {showPageViewer ? 'chrome_reader_mode' : 'menu_book'}
            </span>
            <span className="hidden sm:inline">{showPageViewer ? 'Hide PDF' : 'View PDF'}</span>
          </button>
        </div>
      </header>

      {/* ── Body: chat + (optional) page viewer ────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── CHAT PANEL ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#FAFAFC]">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* ── Empty state with suggestions ──────────────────────────── */}
              {isEmpty && (
                <div className="flex flex-col items-center justify-center min-h-[50%] text-center gap-5 my-auto animate-fadeIn select-none">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B21B6] to-[#7C3AED] flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-[24px]">chat</span>
                  </div>

                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900 mb-1">
                      Chat with this paper
                    </h2>
                    <p className="text-[13px] text-gray-500 max-w-sm leading-relaxed">
                      Ask anything about <strong className="text-primary">{doc.title || doc.filename}</strong>.
                      Every answer is grounded in the paper's actual content.
                    </p>
                  </div>

                  {/* Suggested question chips */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => handleSend(q.label)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[12px] font-medium transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          {q.icon}
                        </span>
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
                      <div className="max-w-[80%]">
                        <div className="bg-gray-100 text-gray-900 border border-gray-200/60 rounded-2xl rounded-tr-xs px-4 py-2.5 text-[14px] leading-relaxed">
                          {msg.content}
                        </div>
                        <span className="block text-[10.5px] text-gray-400 text-right mt-1 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <AssistantBubble
                    key={msg.id}
                    msg={msg}
                    onOpenPage={(p) => {
                      setActivePage(p);
                      setShowPageViewer(true);
                    }}
                    showSources={expandedSources.has(msg.id)}
                    onToggleSources={() => toggleSources(msg.id)}
                    isNewest={isNewest}
                  />
                );
              })}

              {/* ── Loading indicator ──────────────────────────────────────── */}
              {isAsking && (
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200/80 rounded-2xl w-fit max-w-xs shadow-2xs animate-fadeIn">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">R-Lens</p>
                    <p className="text-[11px] text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      {agentStatusText}
                    </p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ── Suggested chips (when chat has messages) ──────────────────── */}
          {!isEmpty && (
            <div className="shrink-0 px-4 sm:px-6 py-1.5 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-gray-400 uppercase shrink-0 py-1">Prompts:</span>
              {SUGGESTED_QUESTIONS.slice(0, 5).map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleSend(q.label)}
                  disabled={isAsking}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200/80 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-primary text-[11.5px] font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span className="material-symbols-outlined text-[13px]">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar (Fixed Bottom) ─────────────────────────────────── */}
          <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-gray-200/80">
            <div className="max-w-3xl mx-auto">
              <div
                className={`flex gap-2 items-center bg-white border rounded-2xl px-4 py-2 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${
                  isAsking
                    ? 'border-gray-200'
                    : 'border-gray-200/90 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10'
                }`}
              >
                <textarea
                  ref={inputRef}
                  id="paper-chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this paper... (e.g. 'What is the main contribution?')"
                  rows={1}
                  disabled={isAsking}
                  className="flex-1 bg-transparent resize-none border-0 focus:outline-none text-[14px] text-gray-900 placeholder-gray-400 max-h-36 overflow-y-auto leading-relaxed"
                />
                <button
                  id="paper-chat-send-btn"
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isAsking}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 transition-all cursor-pointer ${
                    input.trim() && !isAsking
                      ? 'bg-primary hover:bg-primary-hover shadow-2xs'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isAsking ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[17px]">arrow_upward</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ── PAGE VIEWER (right panel, collapsible) ─────────────────────── */}
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
