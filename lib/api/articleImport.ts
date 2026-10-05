import { invoke } from '@tauri-apps/api/core';
import { getDb } from '@/db/client';
import { fromArticleProps, toArticleProps } from '@/lib/adapters/articleAdapter';
import { fetchAllRawArticles } from './articles';
import { getStoredArticles, getStoredWorkflowStages, getStoredCategories, readArticleImportFile, saveArticles } from '@/lib/storage';
import { mergeArticleImport } from '@/lib/utils/articleImport';
import type { Article } from '@/types/editorial';

export interface ArticleImportResult { articles: Article[]; imported: number; skipped: number }

export async function importArticleFile(file: File): Promise<ArticleImportResult> {
  const incoming = await readArticleImportFile(file);
  if (typeof window !== 'undefined' && (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
    await getDb();
    const result = await invoke<{ imported: number; skipped: number }>('import_articles', {
      request: { articles: incoming.map(fromArticleProps) },
    });
    const stored = await fetchAllRawArticles().catch(() => {
      throw new Error('A importação foi gravada, mas a lista não pôde ser atualizada. Reabra o aplicativo. As pautas locais foram preservadas.');
    });
    return { ...result, articles: stored.map(raw => toArticleProps(raw.article, raw.checklists, raw.history)) };
  }
  const result = mergeArticleImport(getStoredArticles(), incoming, getStoredWorkflowStages(), getStoredCategories());
  if (result.imported > 0) saveArticles(result.articles);
  return result;
}

export function articleImportErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'ERR_IMPORT_REFERENCE') return 'Etapa ou categoria não encontrada neste aplicativo. Nenhuma pauta foi importada.';
  if (code === 'ERR_IMPORT_LIMIT') return 'O arquivo excede os limites de importação: 5 MiB e 1.000 pautas.';
  if (code === 'ERR_IMPORT_INVALID') return 'Arquivo de pautas inválido. Nenhuma pauta foi alterada.';
  if (code === 'ERR_IMPORT_SCHEMA') return 'O banco local precisa estar atualizado para importar. Nenhuma pauta foi importada.';
  return 'Não foi possível importar. As pautas locais foram preservadas. Tente novamente.';
}
