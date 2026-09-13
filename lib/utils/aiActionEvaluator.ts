import { AiAction } from '@/types/ai';

export type ActionState = 'RECOMMENDED' | 'AVAILABLE' | 'UNAVAILABLE';

export interface ActionEvaluation {
  state: ActionState;
  missing: string;
}

export interface EvaluationContext {
  status: string;
  title?: string;
  objective?: string;
  summary?: string;
  content?: string;
  keyword?: string;
  visualDescription?: string;
}

export function evaluateAiAction(action: AiAction, context: EvaluationContext): ActionEvaluation {
  let available = false;
  let recommended = false;
  let missing = '';
  
  const hasObjective = !!context.objective?.trim();
  const hasSummary = !!context.summary?.trim();
  const hasContent = !!context.content?.trim();
  const hasKeyword = !!context.keyword?.trim();
  const hasVisual = !!context.visualDescription?.trim();

  switch (action) {
    case 'research_gaps':
      available = !!context.title?.trim() || hasObjective;
      recommended = context.status === 'ideia' || context.status === 'pesquisa';
      missing = 'Título/Objetivo';
      break;
    case 'plain_language':
      available = hasContent || hasSummary;
      recommended = context.status === 'escrita' || context.status === 'revisao';
      missing = 'Resumo/Conteúdo';
      break;
    case 'validate_inclusivity':
      available = hasContent || hasSummary;
      recommended = context.status === 'escrita' || context.status === 'revisao';
      missing = 'Resumo/Conteúdo';
      break;
    case 'generate_alt_text':
      available = hasVisual;
      recommended = context.status === 'escrita' || context.status === 'revisao';
      missing = 'Descrição Visual';
      break;
    case 'generate_seo':
      available = hasKeyword && (hasContent || hasSummary);
      recommended = context.status === 'revisao';
      missing = !hasKeyword ? 'Keyword SEO' : 'Resumo/Conteúdo';
      break;
    case 'editorial_review':
      available = hasContent && hasObjective;
      recommended = context.status === 'revisao';
      missing = !hasContent ? 'Conteúdo' : 'Objetivo';
      break;
    default:
      available = true;
  }
  
  const state: ActionState = available ? (recommended ? 'RECOMMENDED' : 'AVAILABLE') : 'UNAVAILABLE';
  return { state, missing };
}
