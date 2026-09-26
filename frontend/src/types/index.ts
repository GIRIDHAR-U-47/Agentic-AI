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

