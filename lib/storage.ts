import { Article } from '@/types/editorial';
import { ALL_INITIAL_ARTICLES } from './initialData';

const STORAGE_KEY = 'jinc_editorial_os_articles_v1';

export const getStoredArticles = (): Article[] => {
  if (typeof window === 'undefined') {
    return ALL_INITIAL_ARTICLES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ALL_INITIAL_ARTICLES));
      return ALL_INITIAL_ARTICLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ALL_INITIAL_ARTICLES;
  } catch (e) {
    console.error('Error loading articles from localStorage', e);
    return ALL_INITIAL_ARTICLES;
  }
};

export const saveArticles = (articles: Article[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    // Dispatch custom event for cross-component reactivity
    window.dispatchEvent(new Event('jinc_storage_updated'));
  } catch (e) {
    console.error('Error saving articles to localStorage', e);
  }
};

export const resetToSeedData = (): Article[] => {
  if (typeof window === 'undefined') return ALL_INITIAL_ARTICLES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ALL_INITIAL_ARTICLES));
  window.dispatchEvent(new Event('jinc_storage_updated'));
  return ALL_INITIAL_ARTICLES;
};

export const exportArticlesJSON = (articles: Article[]): void => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(articles, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `agenda-jinc-editorial-os-${new Date().toISOString().slice(0, 10)}.json`);
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
          saveArticles(parsed);
          resolve(parsed);
        } else {
          reject(new Error('Formato do arquivo JSON inválido. Deve ser um array de pautas.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsText(file);
  });
};
