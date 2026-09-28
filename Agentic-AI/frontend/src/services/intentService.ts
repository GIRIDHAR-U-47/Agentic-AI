export type IntentType = 
  | 'RESEARCH_TOPIC'
  | 'RESEARCH_QUESTION'
  | 'WRITING_DRAFT'
  | 'PDF_QUERY'
  | 'LITERATURE_REVIEW'
  | 'PARAPHRASE'
  | 'CITATION'
  | 'AI_DETECTION';

export interface IntentAnalysisResult {
  intent: IntentType;
  confidence: number;
  badgeLabel: string;
  badgeIcon: string;
  targetPath: string;
  sessionTitle: string;
  extractedTopic: string;
  extractedPayload: string;
  generatedSubQueries: string[];
  suggestedTemplate?: string;
  citationDoi?: string;
}

// DOI regex pattern
const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;

export function analyzeIntent(input: string): IntentAnalysisResult {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Citation Generation (DOI or cite keywords)
  const doiMatch = text.match(DOI_REGEX);
  if (doiMatch || lower.startsWith('cite ') || lower.startsWith('citation ') || lower.includes('generate citation') || lower.includes('generate ieee citation') || lower.includes('bibtex for')) {
    const extractedDoi = doiMatch ? doiMatch[1] : text.replace(/^(cite|citation|generate citation for|generate ieee citation for|bibtex for)\s*/i, '').trim();
    return {
      intent: 'CITATION',
      confidence: 0.96,
      badgeLabel: 'Citation Generator',
      badgeIcon: 'format_quote',
      targetPath: '/citation-generator',
      sessionTitle: `Citation: ${extractedDoi || 'Manual'}`,
      extractedTopic: extractedDoi,
      extractedPayload: extractedDoi,
      generatedSubQueries: [],
      citationDoi: extractedDoi,
    };
  }

  // 2. Paraphrasing / Academic Rewrite
  if (
    lower.startsWith('paraphrase') ||
    lower.startsWith('rewrite') ||
    lower.startsWith('rephrase') ||
    lower.includes('paraphrase this') ||
    lower.includes('rewrite academically') ||
    lower.includes('make this academic') ||
    lower.includes('improve clarity of')
  ) {
    const cleanPayload = text.replace(/^(paraphrase this paragraph academically|paraphrase this paragraph|paraphrase this|paraphrase|rewrite this|rephrase this|make this academic)[:\s]*/i, '').trim();
    return {
      intent: 'PARAPHRASE',
      confidence: 0.95,
      badgeLabel: 'Academic Paraphraser',
      badgeIcon: 'shuffle',
      targetPath: '/paraphraser',
      sessionTitle: 'Paraphrase Task',
      extractedTopic: 'Academic Rewriting',
      extractedPayload: cleanPayload || text,
      generatedSubQueries: [],
    };
  }

  // 3. AI Detection / Plagiarism Check
  if (
    lower.startsWith('check whether') ||
    lower.startsWith('detect ai') ||
    lower.startsWith('is this ai') ||
    lower.includes('ai generated') ||
    lower.includes('ai detector') ||
    lower.includes('check ai') ||
    lower.includes('looks ai generated')
  ) {
    const cleanPayload = text.replace(/^(check whether this (paragraph|abstract|text) looks ai generated|check if this is ai|detect ai in|check ai)[:\s]*/i, '').trim();
    return {
      intent: 'AI_DETECTION',
      confidence: 0.94,
      badgeLabel: 'AI Writing Analysis',
      badgeIcon: 'security',
      targetPath: '/ai-detector',
      sessionTitle: 'AI Detection Scan',
      extractedTopic: 'AI Content Analysis',
      extractedPayload: cleanPayload || text,
      generatedSubQueries: [],
    };
  }

  // 4. Literature Review creation
  if (
    lower.startsWith('create a literature review') ||
    lower.startsWith('write a literature review') ||
    lower.startsWith('generate literature review') ||
    lower.startsWith('systematic literature review') ||
    lower.includes('literature review on') ||
    lower.includes('lit review on')
  ) {
    const topic = text.replace(/^(create a literature review on|write a literature review on|create a literature review for|generate literature review on|write a literature review based on|systematic review of)[:\s]*/i, '').trim();
    return {
      intent: 'LITERATURE_REVIEW',
      confidence: 0.93,
      badgeLabel: 'Literature Review Agent',
      badgeIcon: 'menu_book',
      targetPath: '/report',
      sessionTitle: topic ? `Lit Review: ${topic}` : 'Literature Review Synthesis',
      extractedTopic: topic || text,
      extractedPayload: topic || text,
      generatedSubQueries: generateSubQueries(topic || text),
    };
  }

  // 5. AI Writing / Drafting
  if (
    lower.startsWith('write an introduction') ||
    lower.startsWith('write an abstract') ||
    lower.startsWith('write a paper') ||
    lower.startsWith('draft ') ||
    lower.startsWith('write a section') ||
    lower.startsWith('help me write') ||
    lower.includes('write an introduction for')
  ) {
    let template = 'IEEE Research Paper';
    if (lower.includes('abstract')) template = 'Conference Abstract';
    else if (lower.includes('proposal')) template = 'Research Proposal';
    else if (lower.includes('report')) template = 'Technical Report';

    return {
      intent: 'WRITING_DRAFT',
      confidence: 0.92,
      badgeLabel: 'AI Writer',
      badgeIcon: 'edit_note',
      targetPath: '/ai-writer',
      sessionTitle: `Draft: ${text.slice(0, 45)}...`,
      extractedTopic: text,
      extractedPayload: text,
      generatedSubQueries: [],
      suggestedTemplate: template,
    };
  }

  // 6. PDF Question / PDF Interaction
  if (
    lower.includes('this pdf') ||
    lower.includes('in this paper') ||
    lower.includes('uploaded pdf') ||
    lower.includes('chat with pdf') ||
    lower.startsWith('explain the methodology used in this paper')
  ) {
    return {
      intent: 'PDF_QUERY',
      confidence: 0.91,
      badgeLabel: 'Chat with PDF',
      badgeIcon: 'picture_as_pdf',
      targetPath: '/chat-with-pdf',
      sessionTitle: 'PDF Analysis Session',
      extractedTopic: text,
      extractedPayload: text,
      generatedSubQueries: [],
    };
  }

  // 7. Research Question (Question format)
  if (
    lower.startsWith('what ') ||
    lower.startsWith('how ') ||
    lower.startsWith('why ') ||
    lower.startsWith('which ') ||
    lower.startsWith('can ') ||
    lower.startsWith('compare ') ||
    text.endsWith('?')
  ) {
    return {
      intent: 'RESEARCH_QUESTION',
      confidence: 0.90,
      badgeLabel: 'Research Question Q&A',
      badgeIcon: 'search',
      targetPath: '/research',
      sessionTitle: text,
      extractedTopic: text,
      extractedPayload: text,
      generatedSubQueries: generateSubQueries(text),
    };
  }

  // 8. Research Topic (Default / Core Academic Topic)
  return {
    intent: 'RESEARCH_TOPIC',
    confidence: 0.98,
    badgeLabel: 'Research Topic Exploration',
    badgeIcon: 'science',
    targetPath: '/research',
    sessionTitle: text,
    extractedTopic: text,
    extractedPayload: text,
    generatedSubQueries: generateSubQueries(text),
  };
}

/**
 * Intelligent sub-query generation based on domain terms
 */
export function generateSubQueries(topic: string): string[] {
  const words = topic.split(/\s+/).filter(w => w.length > 3);
  const coreTerms = words.slice(0, 5).join(' ');

  const queries = [
    `${topic} state of the art benchmarks`,
    `${coreTerms} deep learning architectures`,
    `Multi-horizon forecasting empirical comparison`,
    `Explainability and attention weights in ${words[0] || 'time series'}`,
    `Ablation studies and computational complexity analysis`
  ];

  if (topic.toLowerCase().includes('data center') || topic.toLowerCase().includes('power') || topic.toLowerCase().includes('electricity')) {
    queries[0] = 'Data center power consumption multi-step forecasting deep learning';
    queries[1] = 'Explainable AI attention maps for industrial electricity loads';
    queries[2] = 'Metaheuristic optimization (PSO / GA) for hyperparameter tuning in time-series';
    queries[3] = 'PatchTST vs Informer vs DLinear multi-horizon benchmark comparison';
    queries[4] = 'Thermal-aware PUE efficiency forecasting models';
  } else if (topic.toLowerCase().includes('transformer') || topic.toLowerCase().includes('time series')) {
    queries[0] = 'Subseries-level patching in Transformer architectures';
    queries[1] = 'Channel-independence vs Cross-variate attention in multivariate series';
    queries[2] = 'Long lookback horizon scaling and quadratic complexity bounds';
    queries[3] = 'Linear baseline DLinear comparisons against complex attention';
    queries[4] = 'Out-of-distribution generalization under non-stationary shifts';
  }

  return queries;
}
