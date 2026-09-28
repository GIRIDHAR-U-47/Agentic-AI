export type ValidationStatus = 'Accepted' | 'Needs Review' | 'Pending' | 'Rejected';

export interface PaperMetric {
  name: string;
  value: string | number;
  comparison?: string;
  isPositive?: boolean;
}

export interface PaperSection {
  id: string;
  title: string;
  page: number;
  content: string;
}

export interface EvidenceAnchor {
  id: string;
  type: 'core_claim' | 'benchmark_result' | 'limitation_gap';
  title: string;
  location: string;
  quote: string;
  note: string;
  mappingCard: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  publisher?: string;
  doi: string;
  arxiv?: string;
  abstract: string;
  methodTag: string;
  methodCategory: 'Transformer' | 'Linear' | 'TCN' | 'Diffusion' | 'Graph' | 'Hybrid';
  relevanceScore: number;
  evidenceQuotesCount: number;
  validationStatus: ValidationStatus;
  isSota?: boolean;
  isSeminal?: boolean;
  citationsCount: number;
  altmetricScore: number;
  forecastHorizons: string[];
  metrics: {
    mse96h?: number;
    mae96h?: number;
    mse336h?: number;
    mae336h?: number;
    mse720h?: number;
    mae720h?: number;
    rmse?: number;
    mape?: string;
    crps?: number;
  };
  datasets: string[];
  complexity: string;
  coreHypothesis: string;
  identifiedLimitations: string;
  researchGap: string;
  scholarAudit: string;
  evidenceAnchors: EvidenceAnchor[];
  sections: PaperSection[];
}

export interface EvidenceMatrixRow {
  id: string;
  paperKey: string;
  paperId: string;
  paperTitle: string;
  authors: string;
  year: number;
  venue: string;
  citationsCount: number;
  primaryMethod: string;
  methodCategory: string;
  datasetTested: string;
  datasetDetail: string;
  forecastHorizons: string[];
  empiricalResult: {
    primaryMetric: string;
    secondaryMetric: string;
  };
  supportedClaim: string;
  status: 'Supported' | 'Partially Supported' | 'Needs Review';
  identifiedLimitation: string;
  researchGap: string;
  citationTag: string;
  exactOcrExcerpt: string;
  ocrLocation: string;
  embeddingCosine: number;
  complianceChecks: {
    statisticalCrossCheck: boolean;
    datasetSplitCompliant: boolean;
    codeAvailable: string;
  };
}

export interface AgentProvenanceStep {
  id: string;
  stepNumber: number;
  title: string;
  detail: string;
  duration: string;
  agentModule: string;
  status: 'done' | 'active' | 'waiting' | 'pending';
  progress?: number;
}

export interface FilterState {
  searchQuery: string;
  yearRange: [number, number];
  methods: string[];
  venues: string[];
  minRelevance: number;
  openAccessOnly: boolean;
  sortBy: 'relevance' | 'citations' | 'year' | 'evidenceDensity';
}

export interface PDFSectionInfo {
  id: string;
  title: string;
  page: number;
  content_preview: string;
}

export interface PDFChunk {
  id: string;
  doc_id: string;
  doc_name: string;
  page: number;
  section: string;
  text: string;
}

export interface PDFDocumentModel {
  id: string;
  filename: string;
  title: string;
  authors: string;
  year: string | number;
  venue: string;
  doi: string;
  page_count: number;
  sections: PDFSectionInfo[];
  chunks: PDFChunk[];
  full_text_by_page?: Record<number, string>;
}

export interface PDFRAGCitation {
  doc_name: string;
  doc_id: string;
  page: number;
  section: string;
  quote: string;
  relevance_score?: number;
}

export interface PDFRAGResult {
  answer: string;
  agent_steps: string[];
  citations: PDFRAGCitation[];
  verified: boolean;
  target_docs: string[];
}

// ---------------------------------------------------------------------------
// Research-Pilot review workflow (backend `routers/sessions.py` + `corpus.py`)
// ---------------------------------------------------------------------------

export type ReviewMode = 'no_rag' | 'basic_rag' | 'agentic_rag';
export type SessionState =
  | 'created'
  | 'planning'
  | 'awaiting_approval'
  | 'awaiting_user'
  | 'complete';

export interface CorpusDocument {
  id: string;
  title: string;
  authors: string;
  year?: string | null;
  venue: string;
  doi: string;
  arxiv_id?: string | null;
  page_count: number;
  source: string;
  abstract: string;
  text_chars: number;
  chunk_count: number;
  /** Canonical page for this paper (arXiv abs link, uploaded-file marker, or ''). */
  source_url?: string | null;
  /** 1 = full-text PDF ingested and citable; 0 = abstract-only record. */
  full_text_available?: number;
}

export interface CorpusStats {
  documents: number;
  chunks: number;
  chunk_chars?: number;
  text_chars?: number;
  arxiv?: number;
  upload?: number;
}

export interface ProviderStatus {
  name: string;
  model: string;
  configured: boolean;
  key_env?: string | null;
  available?: boolean;
}

export interface HealthInfo {
  status: string;
  version: string;
  llm: { default: string; providers: ProviderStatus[] };
  limits: {
    max_agent_iterations: number;
    max_tool_calls: number;
    max_query_refinements: number;
    retrieval_top_k: number;
  };
  corpus: CorpusStats;
  modes: ReviewMode[];
}

export interface CandidatePaper {
  doc_id: string;
  title: string;
  authors?: string | null;
  year?: string | null;
  venue?: string | null;
  arxiv_id?: string | null;
  doi?: string | null;
  abstract?: string;
  page_count?: number;
  source?: string;
  relevance: number;
  /** Present on arXiv-discovery candidates so the researcher can open the source. */
  abs_url?: string;
  pdf_url?: string;
  source_url?: string;
  /** 0 = abstract-only label; shown as a badge so nobody mistakes it for full text. */
  full_text_available?: number;
  abstract_only?: boolean;
}

export interface DiscoverySearchEvent {
  pass?: number;
  query?: string;
  note?: string;
  error?: string;
}

export interface DiscoveryInfo {
  refined: boolean;
  search_events: DiscoverySearchEvent[];
  skipped_known?: number;
  cached?: boolean;
  error?: string;
}

export interface Revision {
  revision: number;
  feedback: string;
  exclude_doc_ids: string[];
  prior_review: Review | null;
  effective_question: string;
  completed: boolean;
  review?: Review | null;
  answer?: string;
  activity?: ActivityEvent[];
  created_at: string;
}

export interface ActivityEvent {
  seq: number;
  kind: 'plan' | 'tool' | 'decision' | 'limit' | 'error' | 'verification' | string;
  name: string;
  detail: string;
  [key: string]: unknown;
}

export interface ReviewCitation {
  marker: string;
  doc_id: string;
  doc_title?: string;
  title?: string;
  authors?: string | null;
  year?: string | null;
  venue?: string | null;
  arxiv_id?: string | null;
  doi?: string | null;
  page?: number;
  section?: string;
  locator?: string;
  quote: string;
  supported?: boolean;
  chunk_id?: string;
  /** Outbound link to the canonical source (arXiv abs page when known). */
  source_url?: string;
  /** 0 = abstract-only record; render an explicit badge, never imply full text. */
  full_text_available?: number;
}

export interface ComparisonRow {
  marker: string;
  title: string;
  authors?: string | null;
  year?: string | null;
  venue?: string | null;
  arxiv_id?: string | null;
  doi?: string | null;
  cited: boolean;
  pages_cited: number[];
  supporting_quote: string;
}

export interface Review {
  question: string;
  direct_answer: string;
  sections: {
    key_findings: string[];
    comparison: string[];
    themes: string[];
    limitations: string[];
    gaps: string[];
  };
  comparison_table: ComparisonRow[];
  sources: ReviewCitation[];
  theme_keywords: string[];
  verified: boolean;
  support_rate: number;
  claims_total: number;
  reflection_notes: string[];
  unverified: boolean;
  /** Automated citation-check note: presented as a warning for human review. */
  disclaimer?: string;
}

export interface SessionView {
  session_id: string;
  question: string;
  title: string;
  mode: ReviewMode;
  provider: string;
  model: string;
  state: SessionState;
  activity: ActivityEvent[];
  review?: Review | null;
  metrics?: SessionMetrics;
  pending?: { question: string; options: string[]; reason: string } | null;
  error?: string | null;
  approved: string[];
  rejected: string[];
  decisions: { doc_id: string; decision: string; note?: string }[];
  citations: ReviewCitation[];
  candidates?: CandidatePaper[];
  /** arXiv-discovery provenance for fresh-topic sessions (None otherwise). */
  discovery?: DiscoveryInfo;
  revisions?: Revision[];
  created_at: string;
  updated_at: string;
  can_run: boolean;
  can_resume: boolean;
  can_revise?: boolean;
}

export interface SessionMetrics {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  usage_known?: boolean;
  tool_calls?: number;
  events?: number;
  iterations?: number;
  llm_real?: boolean;
  insufficient_evidence?: boolean;
  [key: string]: unknown;
}

export interface SessionListItem {
  id: string;
  title: string;
  question: string;
  mode: ReviewMode;
  provider: string;
  model: string;
  state: SessionState;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionResponse {
  session_id: string;
  question: string;
  mode: ReviewMode;
  provider: string;
  model: string;
  state: SessionState;
  candidates: CandidatePaper[];
  activity: ActivityEvent[];
  /** Set when the session was created in arXiv-discovery mode. */
  discover?: boolean;
  discovery?: DiscoveryInfo;
}

export interface RunResponse extends SessionView {
  answer?: string;
  insufficient_evidence?: boolean;
  latency_s?: number;
  resumed_from?: string;
}

export interface ApprovalDecision {
  doc_id: string;
  decision: 'approved' | 'rejected';
  note?: string;
}

