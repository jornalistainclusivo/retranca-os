import { describe, it, expect } from 'vitest';
import { evaluateAiAction, EvaluationContext } from '../aiActionEvaluator';
import { AiAction } from '@/types/ai';
import type { SemanticClassification } from '@/types/editorial';

describe('aiActionEvaluator', () => {
  const dummyContext: EvaluationContext = { semanticClassification: 'IDEA' };

  const actions: AiAction[] = ['research_gaps', 'plain_language', 'validate_inclusivity', 'generate_alt_text', 'generate_seo', 'editorial_review'];
  const classifications: (SemanticClassification | null)[] = ['IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED', null];
  const evidence = { title: 'Title', objective: 'Objective', summary: 'Summary', content: 'Content', keyword: 'Keyword', visualDescription: 'Visual description' };
  const recommendations: Record<string, AiAction[]> = {
    IDEA: ['research_gaps'], RESEARCH: ['research_gaps'],
    DRAFTING: ['plain_language', 'validate_inclusivity', 'generate_alt_text'],
    REVIEW: ['plain_language', 'validate_inclusivity', 'generate_alt_text', 'generate_seo', 'editorial_review'],
    PUBLISHED: [],
  };

  describe.each(classifications)('classification %s', semanticClassification => {
    it.each(actions)('%s remains evidence-based, with deterministic recommendations', action => {
      const recommended = semanticClassification !== null && recommendations[semanticClassification].includes(action);
      expect(evaluateAiAction(action, { semanticClassification, ...evidence }).state).toBe(recommended ? 'RECOMMENDED' : 'AVAILABLE');
      expect(evaluateAiAction(action, { semanticClassification }).state).toBe('UNAVAILABLE');
      expect(evaluateAiAction(action, {
        semanticClassification, title: ' \n ', objective: ' ', summary: '\t', content: ' ', keyword: ' ', visualDescription: ' ',
      }).state).toBe('UNAVAILABLE');
    });
  });

  describe('research_gaps', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('research_gaps', { ...dummyContext, semanticClassification: 'IDEA' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and classification is IDEA/RESEARCH', () => {
      const res1 = evaluateAiAction('research_gaps', { semanticClassification: 'IDEA', title: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('research_gaps', { semanticClassification: 'RESEARCH', objective: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and classification is not recommended', () => {
      const res = evaluateAiAction('research_gaps', { semanticClassification: 'DRAFTING', title: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('plain_language', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('plain_language', { semanticClassification: 'DRAFTING' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and classification is DRAFTING/REVIEW', () => {
      const res1 = evaluateAiAction('plain_language', { semanticClassification: 'DRAFTING', content: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('plain_language', { semanticClassification: 'REVIEW', summary: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and classification is not recommended', () => {
      const res = evaluateAiAction('plain_language', { semanticClassification: 'IDEA', content: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('validate_inclusivity', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('validate_inclusivity', { semanticClassification: 'DRAFTING' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and classification is DRAFTING/REVIEW', () => {
      const res1 = evaluateAiAction('validate_inclusivity', { semanticClassification: 'DRAFTING', content: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('validate_inclusivity', { semanticClassification: 'REVIEW', summary: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and classification is not recommended', () => {
      const res = evaluateAiAction('validate_inclusivity', { semanticClassification: 'IDEA', content: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('generate_alt_text', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('generate_alt_text', { semanticClassification: 'DRAFTING' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and classification is DRAFTING/REVIEW', () => {
      const res1 = evaluateAiAction('generate_alt_text', { semanticClassification: 'DRAFTING', visualDescription: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('generate_alt_text', { semanticClassification: 'REVIEW', visualDescription: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and classification is not recommended', () => {
      const res = evaluateAiAction('generate_alt_text', { semanticClassification: 'IDEA', visualDescription: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('generate_seo', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('generate_seo', { semanticClassification: 'REVIEW' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and classification is REVIEW', () => {
      const res = evaluateAiAction('generate_seo', { semanticClassification: 'REVIEW', keyword: 'Key', content: 'Test' });
      expect(res.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and classification is not recommended', () => {
      const res = evaluateAiAction('generate_seo', { semanticClassification: 'DRAFTING', keyword: 'Key', summary: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('editorial_review', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('editorial_review', { semanticClassification: 'REVIEW', content: 'Test' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and classification is REVIEW', () => {
      const res = evaluateAiAction('editorial_review', { semanticClassification: 'REVIEW', objective: 'Obj', content: 'Test' });
      expect(res.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and classification is not recommended', () => {
      const res = evaluateAiAction('editorial_review', { semanticClassification: 'DRAFTING', objective: 'Obj', content: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });
});
