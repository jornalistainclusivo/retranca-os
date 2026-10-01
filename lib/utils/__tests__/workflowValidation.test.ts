import { describe, it, expect } from 'vitest';
import { validateStageA11y, validateCategoryA11y } from '../workflowValidation';
import { WorkflowStage, CategoryEntity } from '@/types/editorial';

describe('Phase 6.4 - Open Customization UX Validation', () => {
  describe('Workflow Operations & A11y', () => {
    const mockStages: WorkflowStage[] = [
      { id: '1', displayName: 'Pauta', orderIndex: 0, semanticClassification: 'IDEA', lifecycleRole: null, isActive: true },
      { id: '2', displayName: 'Publicado', orderIndex: 1, semanticClassification: 'PUBLISHED', lifecycleRole: 'PUBLICATION', isActive: true },
    ];

    it('rejects empty or whitespace-only stage names (A11y Cognitive constraint)', () => {
      const result1 = validateStageA11y('', mockStages);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('O nome do estágio não pode estar vazio');
    });

    it('rejects duplicate stage names to prevent cognitive overload (A11y constraint)', () => {
      const result = validateStageA11y(' PAUTA ', mockStages);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Estágio duplicado pode causar confusão cognitiva (A11y)');
    });

    it('accepts valid stage names including rename', () => {
      const result = validateStageA11y('Revisão Final', mockStages);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('accepts short non-empty stage names allowed by the domain contract', () => {
      expect(validateStageA11y(' IA ', mockStages).isValid).toBe(true);
      expect(validateStageA11y('X', mockStages).isValid).toBe(true);
    });

    it('allows reuse of inactive stage names without allowing active duplicates', () => {
      expect(validateStageA11y(' PAUTA ', [{ ...mockStages[0], isActive: false }]).isValid).toBe(true);
      expect(validateStageA11y(' PAUTA ', mockStages).isValid).toBe(false);
    });
  });

  describe('Category A11y Validations', () => {
    const mockCategories: CategoryEntity[] = [
      { id: 'c1', name: 'Esportes', origin: 'standard', isActive: true },
    ];

    it('accepts short non-empty category names allowed by the domain contract', () => {
      const result = validateCategoryA11y('Oi', mockCategories);
      expect(result.isValid).toBe(true);
    });

    it('rejects duplicate categories to maintain clear navigation structure', () => {
      const result = validateCategoryA11y('ESPORTES', mockCategories);
      expect(result.isValid).toBe(false);
    });

    it('accepts valid category rename', () => {
      const result = validateCategoryA11y('Política', mockCategories);
      expect(result.isValid).toBe(true);
    });

    it('rejects whitespace-only category names', () => {
      expect(validateCategoryA11y('   ', mockCategories).isValid).toBe(false);
    });

    it('allows reuse of inactive category names without allowing active duplicates', () => {
      expect(validateCategoryA11y(' ESPORTES ', [{ ...mockCategories[0], isActive: false }]).isValid).toBe(true);
      expect(validateCategoryA11y(' ESPORTES ', mockCategories).isValid).toBe(false);
    });
  });
});
