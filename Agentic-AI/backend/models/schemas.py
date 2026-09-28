from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field

ValidationStatus = Literal['Accepted', 'Needs Review', 'Pending', 'Rejected']
MethodCategory = Literal['Transformer', 'Linear', 'TCN', 'Diffusion', 'Graph', 'Hybrid']
EvidenceAnchorType = Literal['core_claim', 'benchmark_result', 'limitation_gap']
RowStatus = Literal['Supported', 'Partially Supported', 'Needs Review']
StepStatus = Literal['done', 'active', 'waiting', 'pending']
SortBy = Literal['relevance', 'citations', 'year', 'evidenceDensity']

class PaperMetric(BaseModel):
    name: str
    value: Union[str, float, int]
    comparison: Optional[str] = None
    isPositive: Optional[bool] = None

class PaperSection(BaseModel):
    id: str
    title: str
    page: int
    content: str

class EvidenceAnchor(BaseModel):
    id: str
    type: EvidenceAnchorType
    title: str
    location: str
    quote: str
    note: str
    mappingCard: str

class PaperMetrics(BaseModel):
    mse96h: Optional[float] = None
    mae96h: Optional[float] = None
    mse336h: Optional[float] = None
    mae336h: Optional[float] = None
    mse720h: Optional[float] = None
    mae720h: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[str] = None
    crps: Optional[float] = None

class Paper(BaseModel):
    id: str
    title: str
    authors: str
    year: int
    venue: str
    publisher: Optional[str] = None
    doi: str
    arxiv: Optional[str] = None
    abstract: str
    methodTag: str
    methodCategory: MethodCategory
    relevanceScore: int
    evidenceQuotesCount: int
    validationStatus: ValidationStatus
    isSota: Optional[bool] = None
    isSeminal: Optional[bool] = None
    citationsCount: int
    altmetricScore: int
    forecastHorizons: List[str] = []
    metrics: PaperMetrics = Field(default_factory=PaperMetrics)
    datasets: List[str] = []
    complexity: str
    coreHypothesis: str
    identifiedLimitations: str
    researchGap: str
    scholarAudit: str
    evidenceAnchors: List[EvidenceAnchor] = []
    sections: List[PaperSection] = []

class EmpiricalResult(BaseModel):
    primaryMetric: str
    secondaryMetric: str

class ComplianceChecks(BaseModel):
    statisticalCrossCheck: bool
    datasetSplitCompliant: bool
    codeAvailable: str

class EvidenceMatrixRow(BaseModel):
    id: str
    paperKey: str
    paperId: str
    paperTitle: str
    authors: str
    year: int
    venue: str
    citationsCount: int
    primaryMethod: str
    methodCategory: str
    datasetTested: str
    datasetDetail: str
    forecastHorizons: List[str] = []
    empiricalResult: EmpiricalResult
    supportedClaim: str
    status: RowStatus
    identifiedLimitation: str
    researchGap: str
    citationTag: str
    exactOcrExcerpt: str
    ocrLocation: str
    embeddingCosine: float
    complianceChecks: ComplianceChecks

class AgentProvenanceStep(BaseModel):
    id: str
    stepNumber: int
    title: str
    detail: str
    duration: str
    agentModule: str
    status: StepStatus
    progress: Optional[int] = None

class UpdateValidationRequest(BaseModel):
    status: ValidationStatus

class UpdateEvidenceStatusRequest(BaseModel):
    status: RowStatus

class AgentInstructionRequest(BaseModel):
    prompt: str

class AutoPilotRequest(BaseModel):
    enabled: bool

class ReportCitation(BaseModel):
    tag: str
    title: str
    snippet: str
    conf: str
    source: str
