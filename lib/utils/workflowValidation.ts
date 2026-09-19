import { CategoryEntity, WorkflowStage } from "@/types/editorial";
import { EntitlementState } from "../contexts/EntitlementContext";

export interface A11yValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Ensures workflow stages have meaningful and accessible names
 */
export const validateStageA11y = (name: string, currentStages: WorkflowStage[]): A11yValidationResult => {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push('O nome do estágio não pode estar vazio');
  } else if (name.trim().length < 3) {
    errors.push('O nome do estágio deve ter no mínimo 3 caracteres para clareza');
  }

  const isDuplicate = currentStages.some(s => s.displayName.toLowerCase() === name.trim().toLowerCase());
  if (isDuplicate) {
    errors.push('Estágio duplicado pode causar confusão cognitiva (A11y)');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Ensures category names are accessible and unique
 */
export const validateCategoryA11y = (name: string, currentCategories: CategoryEntity[]): A11yValidationResult => {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push('O nome da categoria não pode estar vazio');
  } else if (name.trim().length < 3) {
    errors.push('O nome da categoria deve ter no mínimo 3 caracteres');
  }

  const isDuplicate = currentCategories.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
  if (isDuplicate) {
    errors.push('Categoria duplicada detectada');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Guard for PRO entitlement using 5-state model
 */
export const canExecuteProAction = (state: EntitlementState): boolean => {
  return state === 'ProActive' || state === 'ProTemporarilyUnverifiable';
};
