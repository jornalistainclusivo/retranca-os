import { describe, it, expect } from 'vitest';
import { validateStageA11y, validateCategoryA11y, canExecuteProAction } from '../workflowValidation';
import { WorkflowStage, CategoryEntity } from '@/types/editorial';

describe('Phase 6.4 - PRO Customization UX Validation', () => {
  describe('Authorization States', () => {
    it('blocks PRO actions for FREE users', () => {
      expect(canExecuteProAction(false)).toBe(false);
    });

    it('allows PRO actions for PREMIUM users', () => {
      expect(canExecuteProAction(true)).toBe(true);
    });
  });

  describe('Workflow / Category Operations & A11y', () => {
    const mockStages: WorkflowStage[] = [
      { id: '1', displayName: 'Pauta', orderIndex: 0, semanticClassification: 'IDEA', lifecycleRole: null, isActive: true },
      { id: '2', displayName: 'Publicado', orderIndex: 1, semanticClassification: 'PUBLISHED', lifecycleRole: 'PUBLICATION', isActive: true },
    ];

    it('rejects empty or whitespace-only stage names (A11y Cognitive constraint)', () => {
      const result1 = validateStageA11y('', mockStages);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('O nome do estágio não pode estar vazio');

      const result2 = validateStageA11y('   ', mockStages);
      expect(result2.isValid).toBe(false);
    });

    it('rejects duplicate stage names to prevent cognitive overload (A11y constraint)', () => {
      const result = validateStageA11y(' PAUTA ', mockStages);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Estágio duplicado pode causar confusão cognitiva (A11y)');
    });

    it('accepts valid stage names', () => {
      const result = validateStageA11y('Revisão Final', mockStages);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Category A11y Validations', () => {
    const mockCategories: CategoryEntity[] = [
      { id: 'c1', name: 'Esportes', origin: 'standard', isActive: true },
    ];

    it('rejects invalid category names (too short)', () => {
      const result = validateCategoryA11y('Oi', mockCategories);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('O nome da categoria deve ter no mínimo 3 caracteres');
    });

    it('rejects duplicate categories to maintain clear navigation structure', () => {
      const result = validateCategoryA11y('ESPORTES', mockCategories);
      expect(result.isValid).toBe(false);
    });

    it('accepts valid category names', () => {
      const result = validateCategoryA11y('Política', mockCategories);
      expect(result.isValid).toBe(true);
    });
  });
});
