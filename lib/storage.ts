import { Article, WorkflowStage, CategoryEntity } from "@/types/editorial";
import {
  ALL_INITIAL_ARTICLES,
  DEFAULT_WORKFLOW_STAGES,
  DEFAULT_CATEGORIES,
} from "./initialData";
import {
  STANDARD_WORKFLOW_IDS,
  STANDARD_CATEGORY_IDS,
} from "@/db/migrations/phase64StandardIds";

const STORAGE_KEY = "jinc_editorial_os_articles_v1";
const WORKFLOWS_STORAGE_KEY = "jinc_editorial_os_workflows_v1";
const CATEGORIES_STORAGE_KEY = "jinc_editorial_os_categories_v1";

const STATUS_TO_WORKFLOW_ID: Record<string, string> = {
  ideia: STANDARD_WORKFLOW_IDS.IDEIA,
  pesquisa: STANDARD_WORKFLOW_IDS.PESQUISA,
  escrita: STANDARD_WORKFLOW_IDS.PRODUCAO,
  revisao: STANDARD_WORKFLOW_IDS.REVISAO,
  publicado: STANDARD_WORKFLOW_IDS.PUBLICADO,
};

const CATEGORY_TO_CATEGORY_ID: Record<string, string> = {
  IA: STANDARD_CATEGORY_IDS.IA,
  Acessibilidade: STANDARD_CATEGORY_IDS.ACESSIBILIDADE,
  Inclusão: STANDARD_CATEGORY_IDS.INCLUSAO,
  SEO: STANDARD_CATEGORY_IDS.SEO,
  Docs: STANDARD_CATEGORY_IDS.DOCS,
  Blog: STANDARD_CATEGORY_IDS.BLOG,
  Social: STANDARD_CATEGORY_IDS.SOCIAL,
  "Linguagem Simples": STANDARD_CATEGORY_IDS.LINGUAGEM_SIMPLES,
};

const migrateArticles = (articles: Article[]): Article[] => {
  return articles.map((art) => {
    const updatedArt = { ...art };
    if (
      !updatedArt.workflowStageId &&
      STATUS_TO_WORKFLOW_ID[art.status as string]
    ) {
      updatedArt.workflowStageId = STATUS_TO_WORKFLOW_ID[art.status as string];
    }
    if (
      !updatedArt.categoryId &&
      CATEGORY_TO_CATEGORY_ID[art.categoryTag as string]
    ) {
      updatedArt.categoryId =
        CATEGORY_TO_CATEGORY_ID[art.categoryTag as string];
    }
    return updatedArt;
  });
};

export const getStoredWorkflowStages = (): WorkflowStage[] => {
  if (typeof window === "undefined") return DEFAULT_WORKFLOW_STAGES;
  try {
    const raw = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        WORKFLOWS_STORAGE_KEY,
        JSON.stringify(DEFAULT_WORKFLOW_STAGES),
      );
      return DEFAULT_WORKFLOW_STAGES;
    }
    const parsed = JSON.parse(raw);
    const pubStages = parsed.filter(
      (s: WorkflowStage) => s.lifecycleRole === "PUBLICATION" && s.isActive,
    );
    if (pubStages.length !== 1) {
      localStorage.setItem(
        WORKFLOWS_STORAGE_KEY,
        JSON.stringify(DEFAULT_WORKFLOW_STAGES),
      );
      return DEFAULT_WORKFLOW_STAGES;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_WORKFLOW_STAGES;
  }
};

export const getStoredCategories = (): CategoryEntity[] => {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        CATEGORIES_STORAGE_KEY,
        JSON.stringify(DEFAULT_CATEGORIES),
      );
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CATEGORIES;
  }
};

export const getStoredArticles = (): Article[] => {
  if (typeof window === "undefined") {
    return migrateArticles(ALL_INITIAL_ARTICLES);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migrated = migrateArticles(ALL_INITIAL_ARTICLES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const parsed = JSON.parse(raw);
    const articles =
      Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : ALL_INITIAL_ARTICLES;

    let hasChanges = false;
    const migratedArticles = articles.map((art) => {
      let changed = false;
      const updatedArt = { ...art };

      if (!updatedArt.workflowStageId) {
        const standardId = STATUS_TO_WORKFLOW_ID[updatedArt.status as string];
        if (standardId) {
          updatedArt.workflowStageId = standardId;
          changed = true;
        }
      }

      if (!updatedArt.categoryId) {
        const standardId =
          CATEGORY_TO_CATEGORY_ID[updatedArt.categoryTag as string];
        if (standardId) {
          updatedArt.categoryId = standardId;
          changed = true;
        }
      }

      if (changed) hasChanges = true;
      return updatedArt;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedArticles));
    }

    return migratedArticles;
  } catch (e) {
    console.error("Error loading articles from localStorage", e);
    return migrateArticles(ALL_INITIAL_ARTICLES);
  }
};

export const saveArticles = (articles: Article[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new Event("jinc_storage_updated"));
  } catch (e) {
    console.error("Error saving articles to localStorage", e);
  }
};

export const browserAssignArticleStage = (
  articleId: string,
  workflowStageId: string,
): void => {
  const articles = getStoredArticles();
  const stages = getStoredWorkflowStages();

  const articleIndex = articles.findIndex((a) => a.id === articleId);
  if (articleIndex === -1) return;

  const article = articles[articleIndex];
  if (article.workflowStageId === workflowStageId) return; // strict no-op

  const targetStage = stages.find((s) => s.id === workflowStageId);
  if (!targetStage || !targetStage.isActive) return;

  const currentStage = stages.find((s) => s.id === article.workflowStageId);
  const wasPublication = currentStage?.lifecycleRole === "PUBLICATION";
  const isPublication = targetStage.lifecycleRole === "PUBLICATION";

  article.workflowStageId = workflowStageId;
  article.updatedAt = new Date().toISOString();

  if (isPublication && !wasPublication) {
    article.completedAt = article.updatedAt;
  } else if (isPublication && wasPublication) {
    article.completedAt = article.updatedAt;
  }

  article.history.push({
    id: `h_${Date.now()}`,
    date: article.updatedAt,
    action: `Movido para a etapa: ${targetStage.displayName}`,
  });

  articles[articleIndex] = article;
  saveArticles(articles);
};

export const browserAssignArticleCategory = (
  articleId: string,
  categoryId: string,
): void => {
  const articles = getStoredArticles();
  const categories = getStoredCategories();

  const articleIndex = articles.findIndex((a) => a.id === articleId);
  if (articleIndex === -1) return;

  const targetCategory = categories.find((c) => c.id === categoryId);
  if (!targetCategory || !targetCategory.isActive) return;

  articles[articleIndex].categoryId = categoryId;
  articles[articleIndex].updatedAt = new Date().toISOString();
  saveArticles(articles);
};

export const resetToSeedData = (): Article[] => {
  if (typeof window === "undefined")
    return migrateArticles(ALL_INITIAL_ARTICLES);
  const migrated = migrateArticles(ALL_INITIAL_ARTICLES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  window.dispatchEvent(new Event("jinc_storage_updated"));
  return migrated;
};

export const exportArticlesJSON = (articles: Article[]): void => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(articles, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `agenda-jinc-editorial-os-${new Date().toISOString().slice(0, 10)}.json`,
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importArticlesJSON = (file: File): Promise<Article[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const migrated = migrateArticles(parsed);
          saveArticles(migrated);
          resolve(migrated);
        } else {
          reject(
            new Error(
              "Formato do arquivo JSON inválido. Deve ser um array de pautas.",
            ),
          );
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsText(file);
  });
};
