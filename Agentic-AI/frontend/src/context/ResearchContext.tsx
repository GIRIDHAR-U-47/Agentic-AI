import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FilterState, AgentProvenanceStep } from '../types';
import { MOCK_AGENT_STEPS } from '../data/mockResearchData';

export interface ResearchChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent-action';
  text: string;
  timestamp: string;
  stepBadge?: string;
  actionItems?: string[];
  findings?: { title: string; gap: string; citation: string }[];
}

interface IntentPayload {
  intent?: string;
  text?: string;
  prompt?: string;
  doi?: string;
  template?: string;
  topic?: string;
}

interface ResearchContextType {
  query: string;
  setQuery: (q: string) => void;
  currentSessionTitle: string;
  setCurrentSessionTitle: (title: string) => void;
  generatedSubQueries: string[];
  setGeneratedSubQueries: (queries: string[]) => void;
  intentPayload: IntentPayload | null;
  setIntentPayload: (payload: IntentPayload | null) => void;
  selectedPaperIds: string[];
  togglePaperSelection: (id: string) => void;
  selectAllPapers: (all: boolean, ids?: string[]) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isAutoPilot: boolean;
  setIsAutoPilot: (val: boolean) => void;
  evidenceStatusMap: Record<string, string>;
  setEvidenceStatus: (id: string, status: string) => void;
  agentSteps: AgentProvenanceStep[];
  addAgentInstruction: (text: string) => void;
  isAgentDrawerOpen: boolean;
  setIsAgentDrawerOpen: (open: boolean) => void;
  savedPaperIds: string[];
  toggleSavePaper: (id: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  researchChatMessages: ResearchChatMessage[];
  addResearchChatMessage: (msg: Omit<ResearchChatMessage, 'id' | 'timestamp'>) => void;
  clearResearchChat: () => void;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  yearRange: [2020, 2025],
  methods: [],
  venues: [],
  minRelevance: 85,
  openAccessOnly: true,
  sortBy: 'relevance'
};

const DEFAULT_CHAT_MESSAGES: ResearchChatMessage[] = [
  {
    id: 'msg-init-1',
    role: 'assistant',
    text: 'Welcome to your R-Lens Research Workspace. I have retrieved candidate papers for your research topic. Select the papers you want to investigate, or ask me to analyze methodology, extract empirical benchmarks, and identify research gaps.',
    timestamp: 'Just now',
    actionItems: [
      'Decomposed topic into targeted search directions',
      'Indexed relevant papers from academic sources',
      'Ready for paper selection and Agentic RAG analysis'
    ]
  }
];

const ResearchContext = createContext<ResearchContextType | undefined>(undefined);

export const ResearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQueryState] = useState<string>(() => {
    return localStorage.getItem('r_lens_query') || 'Explainable Metaheuristic Optimized Deep Temporal Learning for Multi-Horizon Data Center Power Forecasting';
  });

  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>(() => {
    return localStorage.getItem('r_lens_session_title') || 'Explainable Metaheuristic Optimized Deep Temporal Learning for Multi-Horizon Data Center Power Forecasting';
  });

  const [generatedSubQueries, setGeneratedSubQueries] = useState<string[]>([
    'Data center power consumption multi-step forecasting deep learning',
    'Explainable AI attention maps for industrial electricity loads',
    'Metaheuristic optimization (PSO / GA) for hyperparameter tuning in time-series',
    'PatchTST vs Informer vs DLinear multi-horizon benchmark comparison',
    'Thermal-aware PUE efficiency forecasting models'
  ]);

  const [intentPayload, setIntentPayload] = useState<IntentPayload | null>(null);

  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('r_lens_selected_papers');
    return saved ? JSON.parse(saved) : ['patchtst-2024', 'informer-2021', 'dlinear-2023'];
  });

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState<boolean>(false);

  const [evidenceStatusMap, setEvidenceStatusMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('r_lens_evidence_status');
    return saved ? JSON.parse(saved) : {
      'patchtst-2024': 'Accepted',
      'informer-2021': 'Accepted',
      'dlinear-2023': 'Needs Review',
      'diffload-2025': 'Partially Supported',
      'st-gnn-2024': 'Needs Review'
    };
  });

  const [savedPaperIds, setSavedPaperIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('r_lens_saved_papers');
    return saved ? JSON.parse(saved) : ['patchtst-2024', 'informer-2021'];
  });

  const [agentSteps, setAgentSteps] = useState<AgentProvenanceStep[]>(MOCK_AGENT_STEPS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [researchChatMessages, setResearchChatMessages] = useState<ResearchChatMessage[]>(DEFAULT_CHAT_MESSAGES);

  useEffect(() => {
    localStorage.setItem('r_lens_query', query);
  }, [query]);

  useEffect(() => {
    localStorage.setItem('r_lens_session_title', currentSessionTitle);
  }, [currentSessionTitle]);

  useEffect(() => {
    localStorage.setItem('r_lens_selected_papers', JSON.stringify(selectedPaperIds));
  }, [selectedPaperIds]);

  useEffect(() => {
    localStorage.setItem('r_lens_evidence_status', JSON.stringify(evidenceStatusMap));
  }, [evidenceStatusMap]);

  useEffect(() => {
    localStorage.setItem('r_lens_saved_papers', JSON.stringify(savedPaperIds));
  }, [savedPaperIds]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  const togglePaperSelection = useCallback((id: string) => {
    setSelectedPaperIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  const selectAllPapers = useCallback((all: boolean, ids: string[] = []) => {
    if (all) {
      setSelectedPaperIds(ids);
    } else {
      setSelectedPaperIds([]);
    }
  }, []);

  const setEvidenceStatus = useCallback((id: string, status: string) => {
    setEvidenceStatusMap(prev => ({
      ...prev,
      [id]: status
    }));
  }, []);

  const toggleSavePaper = useCallback((id: string) => {
    setSelectedPaperIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  const addAgentInstruction = useCallback((instruction: string) => {
    const newStep: AgentProvenanceStep = {
      id: `step-${Date.now()}`,
      stepNumber: Date.now(),
      title: 'Dynamic Agent Directive Injected',
      detail: instruction,
      duration: '0.12s',
      agentModule: 'Human-in-the-Loop Override',
      status: 'done'
    };
    setAgentSteps(prev => [...prev, newStep]);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const addResearchChatMessage = useCallback((msg: Omit<ResearchChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ResearchChatMessage = {
      ...msg,
      id: `chat-msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setResearchChatMessages(prev => [...prev, newMsg]);
  }, []);

  const clearResearchChat = useCallback(() => {
    setResearchChatMessages(DEFAULT_CHAT_MESSAGES);
  }, []);

  return (
    <ResearchContext.Provider
      value={{
        query,
        setQuery,
        currentSessionTitle,
        setCurrentSessionTitle,
        generatedSubQueries,
        setGeneratedSubQueries,
        intentPayload,
        setIntentPayload,
        selectedPaperIds,
        togglePaperSelection,
        selectAllPapers,
        filters,
        setFilters,
        isAutoPilot,
        setIsAutoPilot,
        evidenceStatusMap,
        setEvidenceStatus,
        agentSteps,
        addAgentInstruction,
        isAgentDrawerOpen,
        setIsAgentDrawerOpen,
        savedPaperIds,
        toggleSavePaper,
        toastMessage,
        showToast,
        researchChatMessages,
        addResearchChatMessage,
        clearResearchChat
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearch = (): ResearchContextType => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
};
