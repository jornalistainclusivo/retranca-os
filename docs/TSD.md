# Technical Specification Document (TSD)
## Especificação de Código e Acessibilidade

### 1. Garantia WCAG 2.2 AAA no UI (Frozen State)
Como estabelecido na regra de "UI Freeze", o design, a semântica e a acessibilidade da interface estão bloqueados contra alterações, mantendo as conquistas do protótipo inicial:
- Ratios de contraste superiores a 7:1 para todo texto legível.
- Suporte a navegação integral por teclado (focus ring visível `focus-visible:ring-2`).
- Atributos `aria-label`, `aria-expanded` e `role="region"` em modais e gavetas.

### 2. Stack Técnica Estrita e Integração Desktop
A aplicação abandonou componentes Node.js server-side tradicionais em favor de uma integração Desktop nativa:
- **Frontend App:** Next.js configurado para compilação estática (`output: 'export'` no `next.config.ts`).
- **Runtime:** Tauri v2 orquestrando uma janela Webview e um sidecar de backend em Rust.
- **Persistência Local:** SQLite integrado via ponte IPC.
- **ORM e Plugins:** Uso estrito das bibliotecas `drizzle-orm` e `@tauri-apps/plugin-sql` + `drizzle-orm/tauri-sqlite`.

### 3. Modelagem de Dados Drizzle (SQLite)
Normalização do estado JSON do protótipo para schema relacional leve no SQLite:

- **`articles`**: `id` (TEXT, PK), `title` (TEXT), `status` (TEXT), `categoryTag` (TEXT), `tags` (TEXT json), `publishDate` (TEXT), `summary` (TEXT), `objective` (TEXT), `keyword` (TEXT), `persona` (TEXT), `cta` (TEXT), `internalLinks` (TEXT), `externalLinks` (TEXT), `estimatedTime` (TEXT), `spentTime` (TEXT), `notes` (TEXT), `createdAt` (TEXT), `updatedAt` (TEXT), `completedAt` (TEXT).
- **`checklist_items`**: `id` (TEXT, PK), `articleId` (TEXT, FK references articles.id), `label` (TEXT), `completed` (INTEGER 0|1), `category` (TEXT).
- **`history_entries`**: `id` (TEXT, PK), `articleId` (TEXT, FK references articles.id), `date` (TEXT), `action` (TEXT).

### 4. Tauri IPC Database Setup
Substituindo endpoints tradicionais, a conexão inicial ocorre no client (Webview) encapsulada, conectando ao Rust de forma assíncrona:
```typescript
import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/tauri-sqlite';
import * as schema from '@/db/schema';

// Chamada lazy ou injetada no provider global da aplicação
export const initializeDb = async () => {
  const sqlite = await Database.load('sqlite:retranca.db');
  return drizzle(sqlite, { schema });
};
```

### 5. Rust Core Security (lib.rs)
Inicialização minimalista e estrita, exclusiva para o plugin SQL, garantindo a política de Zero-Trust e ausência de logs desnecessários.
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
