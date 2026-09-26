import { Paper, FilterState } from '../types';
import { MOCK_PAPERS } from '../data/mockResearchData';

class PaperService {
  private papers: Paper[] = [...MOCK_PAPERS];

  async getPapers(filters?: Partial<FilterState>): Promise<Paper[]> {
    let result = [...this.papers];

    if (filters) {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(
          p =>
            p.title.toLowerCase().includes(q) ||
            p.authors.toLowerCase().includes(q) ||
            p.abstract.toLowerCase().includes(q) ||
            p.methodTag.toLowerCase().includes(q) ||
            p.venue.toLowerCase().includes(q)
        );
      }

      if (filters.methods && filters.methods.length > 0) {
        result = result.filter(p =>
          filters.methods!.some(m => p.methodCategory.toLowerCase().includes(m.toLowerCase()) || p.methodTag.toLowerCase().includes(m.toLowerCase()))
        );
      }

      if (filters.minRelevance !== undefined) {
        result = result.filter(p => p.relevanceScore >= filters.minRelevance!);
      }

      if (filters.yearRange) {
        result = result.filter(
          p => p.year >= filters.yearRange![0] && p.year <= filters.yearRange![1]
        );
      }

      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'relevance':
            result.sort((a, b) => b.relevanceScore - a.relevanceScore);
            break;
          case 'citations':
            result.sort((a, b) => b.citationsCount - a.citationsCount);
            break;
          case 'year':
            result.sort((a, b) => b.year - a.year);
            break;
          case 'evidenceDensity':
            result.sort((a, b) => b.evidenceQuotesCount - a.evidenceQuotesCount);
            break;
        }
      }
    }

    return result;
  }

  async getPaperById(id: string): Promise<Paper | undefined> {
    return this.papers.find(p => p.id === id);
  }

  async updatePaperValidation(id: string, status: Paper['validationStatus']): Promise<Paper | undefined> {
    const paper = this.papers.find(p => p.id === id);
    if (paper) {
      paper.validationStatus = status;
    }
    return paper;
  }
}

export const paperService = new PaperService();
