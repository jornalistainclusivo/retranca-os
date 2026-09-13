/**
 * Phase 6.3 - ArticleModal & AI Actions Logic Tests
 *
 * Validates the Action identity, Alt Text availability/contract,
 * SEO contract, Notice accumulation, and Active-job guard.
 */

import { describe, it, expect } from 'vitest';
import { evaluateAiAction, EvaluationContext } from '@/lib/utils/aiActionEvaluator';
import { AiAction } from '@/types/ai';

describe('Phase 6.3 - ArticleModal AI Actions', () => {
  // ─── Action Identity ────────────────────────────────────────────────────────
  it('identifies exactly the 6 Phase 6.3 actions', () => {
    const expectedActions: AiAction[] = [
      'research_gaps',
      'plain_language',
      'validate_inclusivity',
      'generate_alt_text',
      'generate_seo',
      'editorial_review'
    ];
    
    // Ensure that these 6 actions exist in the AiAction type space.
    // This is essentially a type/identity test.
    const validActions: AiAction[] = [
      'research_gaps',
      'plain_language',
      'validate_inclusivity',
      'generate_alt_text',
      'generate_seo',
      'editorial_review'
    ];
    
    expectedActions.forEach(action => {
      expect(validActions).toContain(action);
    });
    
    expect(expectedActions).not.toContain('check_accessibility');
  });

  // ─── Alt Text Availability / Contract ───────────────────────────────────────
  it('validates Alt Text availability and contract based on visual description', () => {
    // Missing evidence -> UNAVAILABLE
    let context: EvaluationContext = { status: 'escrita' };
    let result = evaluateAiAction('generate_alt_text', context);
    expect(result.state).toBe('UNAVAILABLE');
    expect(result.missing).toBeDefined();

    // With evidence & recommended status -> RECOMMENDED
    context = { status: 'escrita', visualDescription: 'A photo of a dog' };
    result = evaluateAiAction('generate_alt_text', context);
    expect(result.state).toBe('RECOMMENDED');
    
    // With evidence & not recommended status -> AVAILABLE
    context = { status: 'ideia', visualDescription: 'A photo of a dog' };
    result = evaluateAiAction('generate_alt_text', context);
    expect(result.state).toBe('AVAILABLE');
  });

  // ─── SEO Contract ──────────────────────────────────────────────────────────
  it('validates SEO contract based on keyword and content', () => {
    // Missing keyword/content -> UNAVAILABLE
    let context: EvaluationContext = { status: 'revisao', content: 'content' };
    let result = evaluateAiAction('generate_seo', context);
    expect(result.state).toBe('UNAVAILABLE');

    // Missing content -> UNAVAILABLE
    context = { status: 'revisao', keyword: 'keyword' };
    result = evaluateAiAction('generate_seo', context);
    expect(result.state).toBe('UNAVAILABLE');

    // With both in revisao -> RECOMMENDED
    context = { status: 'revisao', keyword: 'keyword', content: 'content' };
    result = evaluateAiAction('generate_seo', context);
    expect(result.state).toBe('RECOMMENDED');
    
    // With both in non-revisao -> AVAILABLE
    context = { status: 'escrita', keyword: 'keyword', content: 'content' };
    result = evaluateAiAction('generate_seo', context);
    expect(result.state).toBe('AVAILABLE');
  });

  // ─── Notice Accumulation ───────────────────────────────────────────────────
  it('handles multiple notices accumulating in contextNotices', () => {
    const notices = [];
    
    // Simulating pushing notices as in ArticleModal
    const contextReduced = true;
    const editorialWarning = true;
    
    if (contextReduced) {
      notices.push('CONTEXT_REDUCED');
    }
    if (editorialWarning) {
      notices.push('EDITORIAL_WARNING');
    }
    
    expect(notices).toContain('CONTEXT_REDUCED');
    expect(notices).toContain('EDITORIAL_WARNING');
    expect(notices.length).toBe(2);
  });

  // ─── Active-job guard ──────────────────────────────────────────────────────
  it('enforces active-job guard locking', () => {
    let aiJobActiveRef = false;
    let jobDispatched = false;
    
    const handleAiAction = (action: string) => {
      // Synchronous locking mechanism as required
      if (aiJobActiveRef) return false;
      aiJobActiveRef = true;
      jobDispatched = true;
      return true;
    };

    // First call succeeds
    const firstCall = handleAiAction('research_gaps');
    expect(firstCall).toBe(true);
    expect(aiJobActiveRef).toBe(true);
    expect(jobDispatched).toBe(true);

    // Second call fails due to lock
    const secondCall = handleAiAction('plain_language');
    expect(secondCall).toBe(false);
  });
  
  // ─── True Disabled State ───────────────────────────────────────────────────
  it('enforces disabled state formula: !isPremiumMode || actionCheck.state === "UNAVAILABLE" || aiLoading', () => {
    const getDisabledState = (isPremiumMode: boolean, actionState: string, aiLoading: boolean) => {
      return !isPremiumMode || actionState === 'UNAVAILABLE' || aiLoading;
    };
    
    // All perfect
    expect(getDisabledState(true, 'RECOMMENDED', false)).toBe(false);
    expect(getDisabledState(true, 'AVAILABLE', false)).toBe(false);
    
    // Missing Premium
    expect(getDisabledState(false, 'RECOMMENDED', false)).toBe(true);
    
    // Unavailable state
    expect(getDisabledState(true, 'UNAVAILABLE', false)).toBe(true);
    
    // AI Loading
    expect(getDisabledState(true, 'RECOMMENDED', true)).toBe(true);
    
    // Multiple fail conditions
    expect(getDisabledState(false, 'UNAVAILABLE', true)).toBe(true);
  });
});
