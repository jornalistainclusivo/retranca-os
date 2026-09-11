# PHASE 6.3 - EDITORIAL AI CONTEXT CONTRACT

Este documento estabelece o contrato de especificação do Domínio de Contexto de IA para a Phase 6.3. Ele serve como referência para os futuros projetos arquiteturais (ADR/SDD), ditando o formato dos dados, níveis de confiança, regras de montagem e as invariantes que não podem ser violadas em código de produção.

## 1. Definições de Modelagem

### 1.1 `EditorialContext`
O `EditorialContext` é o modelo canônico de dados enviado para qualquer Ação de IA. Ele encapsula o estado atual da matéria.

```typescript
interface EditorialContext {
  articleId: string;
  editorialStatus: ArticleStatus;
  categoryTag: CategoryTag;
  
  metadata: {
    title?: string;
    summary?: string;
    objective?: string;
    keyword?: string;
    persona?: string;
    cta?: string;
  };
  
  notes?: string;
  links: {
    internal?: string;
    external?: string;
  };
  
  checklistsState: {
    total: number;
    completed: number;
    pendingItems: string[];
  };
  
  content?: EditorialContent;
  media?: MediaAsset[];
}
```

### 1.2 `EditorialContent` e `MediaAsset`

```typescript
interface EditorialContent {
  source: 'persisted' | 'pasted' | 'selection';
  text: string;
}

interface MediaAsset {
  type: 'image_reference' | 'visual_description';
  data: string;
}
```

## 2. Origem e Trust Level (Segurança de Payload)

**Regra fundamental:** Qualquer dado vindo de input do usuário ou armazenado no CMS é **Não Confiável** (Untrusted Data). O sistema deve envelopar esses dados para protegê-los de *Prompt Injection* (ex: XML/JSON escaping apropriado) antes da submissão à Engine LLM. 

*   **Instruções de Sistema / System Prompt:** Origem Estática (Trust Level: Alta)
*   **Nome e Instruções da Ação:** Origem Estática (Trust Level: Alta)
*   `articleId`, `editorialStatus`, `categoryTag`, `checklistsState`: Origem do Sistema (Trust Level: Média/Alta)
*   `title`, `summary`, `objective`, `keyword`, `persona`, `cta`, `notes`, `links`, `content`, `media`: Origem do Usuário no CMS (Trust Level: **ZERO / Não Confiável**)

## 3. Estados de Ação de IA

*   **Recommended (Recomendada):** A ação está logicamente ligada ao status editorial (ex: Revisão na etapa "Revisão"). Requer evidências essenciais. **UI:** Destaque visual e ênfase total.
*   **Available (Disponível Técnicamente):** A ação não é o fluxo principal para o status atual, porém todas as evidências mínimas estão presentes e a ação pode ser chamada com sucesso. **UI:** Sem destaque (fundo neutro / redução de proeminência), mas operante.
*   **Unavailable (Indisponível):** Evidências vitais (pré-requisitos) estão ausentes no Contexto. A ação será barrada independentemente do status editorial. **UI:** Desabilitada, com mensagem acessível detalhando a falta exata. Comportamento base caso ativada incorretamente é falhar antes do envio de prompt.

## 4. Projeção de Contexto por `AiAction` e Pré-requisitos

Cada ação consome apenas a parte do `EditorialContext` necessária, evitando enviar todo o CMS inutilmente.

| AiAction | Campos Obrigatórios (Pré-requisitos) | Projeção Mínima Opcional Projetada | Escopo Analisado |
| :--- | :--- | :--- | :--- |
| **Lacunas de Pesquisa** | `title` ou `objective` | `notes`, `links`, `keyword` | `summary_only` (se sem content) |
| **Linguagem Simples** | `content` ou `summary` | `persona` | `full_content` ou `summary_only` |
| **Validador Inclusivo** | `content` ou `summary` | (nenhum extra essencial) | `full_content` ou `summary_only` |
| **Alt Text WCAG** | `media` | `title` | Baseado estritamente na imagem/mídia |
| **Otimização SEO** | `keyword` AND (`content` ou `summary`) | `title`, `objective`, `persona`, `cta` | `full_content` ou `summary_only` |
| **Revisão Editorial** | `content` AND `objective` | `notes`, `links`, `checklistsState` | `full_content` (obrigatório) |

*   **Ausência de Evidência Essencial:** Se um campo obrigatório estiver ausente para uma ação chamada, o sistema levantará um erro pre-prompt, negando processamento, orientando o usuário a preencher o CMS.

## 5. Escopo Analisado e Confiança do Retorno

Dependendo da presença de `EditorialContent` (`content`), a inferência adaptará sua clareza de retorno:
*   **`full_content` (Conteúdo Total):** A análise possui o corpo de texto na íntegra. Retorno reflete a matéria como um todo.
*   **`selection` (Recorte Selecionado):** A análise focará estritamente no bloco provido.
*   **`summary_only` (Apenas Resumo):** A análise é executada sem corpo de texto. A Engine de IA DEVE incluir um *disclaimer* no início de seu retorno declarando: *"Atenção: Análise baseada estritamente no Resumo"*.

## 6. Políticas de Negócio

### 6.1 Política de Checklist Pendente
*   Os checklists do CMS nunca devem paralisar (hard-block) uma Ação de IA se todos os outros pré-requisitos essenciais (texto, título, etc) estiverem preenchidos.
*   A Engine anexará ao resultado um aviso estruturado sobre as pendências do Checklist, mas não recusará a revisão.

### 6.2 Política de Context Budget
Tokens não são infinitos e seu truncamento não deve corromper a estrutura.
*   **Nunca Truncar Silenciosamente:** Todo truncamento deve ser intencional e transparente (ex: "Context Limit Exceeded").
*   **Campos Invioláveis:** Instruções de Sistema, `content`/`summary` (dependendo do escopo) e campos obrigatórios da Ação não devem sofrer omissão de carga. Se estes excederem, a ação é barrada com erro de sobrecarga de contexto.
*   **Campos Omitíveis:** `notes` e `links` poderão ser descartados se o payload encostar no teto limite de token window. Todavia, a Interface emitirá um aviso (*Warning*) de *"Payload Omitido"*.

## 7. Invariantes de Arquitetura (Para Futuro ADR/SDD)
As seguintes regras DEVEM ser mantidas independentemente da topologia escolhida para injetar o XML/JSON e acionar o Provedor:
1.  Nenhum script de UI ou camada IPC poderá modificar o `EditorialContext` bruto enviado pela interface antes de sua sanitização.
2.  A validação da **Disponibilidade Técnica (Unavailable vs Available)** é responsabilidade da camada lógica imediata (State/Frontend ou Tauri Commander), barrando o acesso à IA local ou nuvem caso não haja evidências mínimas.
3.  Nunca mesclar campos categorizados como *Untrusted Data* nas diretrizes puras de sistema sem as devidas delimitações estruturais de parser, não importando qual LLM subjacente será escolhido (Llama, GPT, Opus, etc).
4.  O Alt Text não será inferido em hipótese alguma se o array `media` não constar a instrução/asset específico no Contexto da requisição correspondente. A alucinação dedutiva será blindada estruturalmente (reforçado pelo CA2).
