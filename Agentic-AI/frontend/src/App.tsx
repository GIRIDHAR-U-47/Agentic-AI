import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResearchProvider } from './context/ResearchContext';
import { AppLayout } from './components/layout/AppLayout';

// Existing pages
import { ResearchHome } from './pages/ResearchHome';
import { ResearchWorkspace } from './pages/ResearchWorkspace';
import { PaperAnalysis } from './pages/PaperAnalysis';
import { EvidenceValidation } from './pages/EvidenceValidation';
import { Comparison } from './pages/Comparison';
import { LiteratureReview } from './pages/LiteratureReview';

// New SciSpace-style pages
import { AgentGallery } from './pages/AgentGallery';
import { Templates } from './pages/Templates';
import { ChatWithPDF } from './pages/ChatWithPDF';
import { AIWriter } from './pages/AIWriter';
import { FindTopics } from './pages/FindTopics';
import { Paraphraser } from './pages/Paraphraser';
import { CitationGenerator } from './pages/CitationGenerator';
import { ExtractData } from './pages/ExtractData';
import { AIDetector } from './pages/AIDetector';
import { PaperChat } from './pages/PaperChat';

export const App: React.FC = () => {
  return (
    <ResearchProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Home */}
            <Route path="/" element={<ResearchHome />} />

            {/* Persistent Conversation & Research pages */}
            <Route path="/chat/:conversationId" element={<ResearchWorkspace />} />
            <Route path="/research" element={<ResearchWorkspace />} />
            <Route path="/research/:conversationId" element={<ResearchWorkspace />} />
            <Route path="/research/session/:sessionId" element={<ResearchWorkspace />} />
            <Route path="/paper/:id" element={<PaperAnalysis />} />
            <Route path="/paper/:id/chat" element={<PaperChat />} />
            <Route path="/evidence" element={<EvidenceValidation />} />
            <Route path="/compare" element={<Comparison />} />
            <Route path="/report" element={<LiteratureReview />} />
            <Route path="/report/:conversationId" element={<LiteratureReview />} />

            {/* SciSpace-style pages */}
            <Route path="/agent-gallery" element={<AgentGallery />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/chat-with-pdf" element={<ChatWithPDF />} />
            <Route path="/chat-with-pdf/:conversationId" element={<ChatWithPDF />} />
            <Route path="/ai-writer" element={<AIWriter />} />
            <Route path="/find-topics" element={<FindTopics />} />
            <Route path="/paraphraser" element={<Paraphraser />} />
            <Route path="/citation-generator" element={<CitationGenerator />} />
            <Route path="/extract-data" element={<ExtractData />} />
            <Route path="/ai-detector" element={<AIDetector />} />

            {/* Dedicated chat screen for a single indexed paper */}
            <Route path="/paper-chat/:docId" element={<PaperChat />} />
            <Route path="/paper-chat/:docId/:conversationId" element={<PaperChat />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ResearchProvider>
  );
};

export default App;
