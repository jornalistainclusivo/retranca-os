import { describe, it, expect } from 'vitest';
import { evaluateAiAction, EvaluationContext } from '../aiActionEvaluator';
import { AiAction } from '@/types/ai';

describe('aiActionEvaluator', () => {
  const dummyContext: EvaluationContext = { status: 'ideia' };

  describe('research_gaps', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('research_gaps', { ...dummyContext, status: 'ideia' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and status is ideia/pesquisa', () => {
      const res1 = evaluateAiAction('research_gaps', { status: 'ideia', title: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('research_gaps', { status: 'pesquisa', objective: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and status is not recommended', () => {
      const res = evaluateAiAction('research_gaps', { status: 'escrita', title: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('plain_language', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('plain_language', { status: 'escrita' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and status is escrita/revisao', () => {
      const res1 = evaluateAiAction('plain_language', { status: 'escrita', content: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('plain_language', { status: 'revisao', summary: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and status is not recommended', () => {
      const res = evaluateAiAction('plain_language', { status: 'ideia', content: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('validate_inclusivity', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('validate_inclusivity', { status: 'escrita' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and status is escrita/revisao', () => {
      const res1 = evaluateAiAction('validate_inclusivity', { status: 'escrita', content: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('validate_inclusivity', { status: 'revisao', summary: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and status is not recommended', () => {
      const res = evaluateAiAction('validate_inclusivity', { status: 'ideia', content: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('generate_alt_text', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('generate_alt_text', { status: 'escrita' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and status is escrita/revisao', () => {
      const res1 = evaluateAiAction('generate_alt_text', { status: 'escrita', visualDescription: 'Test' });
      expect(res1.state).toBe('RECOMMENDED');
      const res2 = evaluateAiAction('generate_alt_text', { status: 'revisao', visualDescription: 'Test' });
      expect(res2.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and status is not recommended', () => {
      const res = evaluateAiAction('generate_alt_text', { status: 'ideia', visualDescription: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('generate_seo', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('generate_seo', { status: 'revisao' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and status is revisao', () => {
      const res = evaluateAiAction('generate_seo', { status: 'revisao', keyword: 'Key', content: 'Test' });
      expect(res.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and status is not recommended', () => {
      const res = evaluateAiAction('generate_seo', { status: 'escrita', keyword: 'Key', summary: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });

  describe('editorial_review', () => {
    it('is UNAVAILABLE without evidence', () => {
      const res = evaluateAiAction('editorial_review', { status: 'revisao', content: 'Test' });
      expect(res.state).toBe('UNAVAILABLE');
    });
    it('is RECOMMENDED when evidence present and status is revisao', () => {
      const res = evaluateAiAction('editorial_review', { status: 'revisao', objective: 'Obj', content: 'Test' });
      expect(res.state).toBe('RECOMMENDED');
    });
    it('is AVAILABLE when evidence present and status is not recommended', () => {
      const res = evaluateAiAction('editorial_review', { status: 'escrita', objective: 'Obj', content: 'Test' });
      expect(res.state).toBe('AVAILABLE');
    });
  });
});
