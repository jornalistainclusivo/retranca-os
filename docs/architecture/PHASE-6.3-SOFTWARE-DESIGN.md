# Software Design Document: Phase 6.3 - Context-Aware Editorial AI Orchestration

## 1. Introdução e Propósito
Este SDD detalha a arquitetura de software para a implementação da Phase 6.3. Baseado no ADR-008 e no Contrato de Contexto V2, este documento orienta a equipe de engenharia na construção da orquestração contextual de IA, utilizando um modelo híbrido entre TypeScript (Frontend) e Rust (Backend/Tauri), sem a adição de frameworks pesados ou microsserviços.

## 2. Componentes e Responsabilidades (Hybrid Architecture)

A arquitetura mantém a pilha tecnológica atual (React/TypeScript + Tauri/Rust + Ollama/Sidecar), delimitando rigorosamente as fronteiras de confiança.

### 2.1. TypeScript (Frontend - Webview)
*   **Coleta de Contexto:** Extrai os dados editoriais do CMS (estado React) e monta o DTO `EditorialContext`.
*   **Avaliação de UX (Não Confiável):** Determina se uma `AiAction` está `Recommended`, `Available` ou `Unavailable` para fins puramente visuais, de acordo com o PRD.
*   **Disparo (IPC):** Envia o comando Tauri com a intenção da ação e o contexto bruto. Nunca constrói o *System Prompt* ou formata o payload para o LLM.

### 2.2. Tauri / Rust (Backend - Trusted Boundary)
*   **Fronteira Confiável:** Atua como o maestro de segurança e orquestração.
*   **Revalidação de Pré-requisitos:** Confirma se o JSON recebido possui as evidências obrigatórias para a `AiAction` solicitada.
*   **Context Budget:** Executa a política autoritativa de tamanho de contexto (admitindo ou suprimindo campos).
*   **Prompt Assembly:** Carrega as *System Instructions* confiáveis estáticas e envelopa os dados editoriais não confiáveis (Untrusted Data) com segurança contra injeção.
*   **Integração com Provider:** Repassa o payload montado e validado para a abstração de provedor (Ollama Gateway / Sidecar) e faz o streaming da resposta de volta ao Frontend.

## 3. Contratos de Dados e IPC (TypeScript ↔ Rust)

### 3.1. DTO de Requisição de IA
A assinatura de requisição IPC será estendida para suportar orquestração de contexto:

**TypeScript Payload:**
```typescript
interface AiOrchestrationRequest {
  job_id: string;
  action: AiAction;       // A intenção (ex: 'generate_seo')
  context: EditorialContext; // Os dados brutos extraídos do CMS
}
```

### 3.2. Estrutura do EditorialContext (Contrato V2)
Este modelo será espelhado em Rust (via `serde::Deserialize`).

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

interface EditorialContent {
  source: 'persisted' | 'pasted' | 'selection';
  text: string;
}

interface MediaAsset {
  type: 'image_asset' | 'visual_description';
  data: string; // Base64 (futuro/multimodal) ou texto puramente descritivo (atual)
}
```

### 3.3. Escopos de Ação (`Action Scope`)
Rust aplicará diferentes lógicas de montagem de dependências de acordo com o escopo:
*   `full_content`: Exige todo o texto do artigo.
*   `selection`: Limita a análise ao trecho destacado.
*   `summary_only`: Fallback utilizado quando não há `full_content` ou `selection`.
*   `metadata_only`: Focado exclusivamente na estruturação semântica (título, objetivo, palavras-chave).

## 4. Fluxo Completo de uma Ação de IA

1.  **Usuário interage:** O jornalista clica na ação "Lacunas de Pesquisa" (botão Recomendado devido ao status "Ideia").
2.  **TypeScript Coleta:** O React extrai os dados dos formulários do CMS e preenche o `EditorialContext` estrito, baseando-se no que está visível.
3.  **Invocação IPC:** O frontend envia a intenção e o contexto.
4.  **Rust Revalida (Segurança):** O handler Tauri desserializa o DTO e verifica: "Lacunas de Pesquisa exige `title` ou `objective`". Validação passa.
5.  **Context Budget (Rust):** O sistema calcula conservadoramente (heurística de caracteres) se os opcionais (`notes`, `links`) cabem no orçamento. Opcionais que estouram o limite são removidos.
6.  **Prompt Assembly (Rust):** O sistema injeta as instruções estáticas blindadas e isola os metadados brutos do usuário usando blocos demarcadores (`<data>`).
7.  **Invocação LLM:** Rust aciona o provedor Ollama/Sidecar.
8.  **Streaming:** Rust consome a resposta em chunks e emite os eventos de stream do IPC (`AiStreamTokenEvent`).
9.  **Renderização:** React exibe a formatação markdown com semântica utilitária e `aria-live="polite"`.

## 5. Validação Autoritativa e Action Policy (Rust)

A política de ações será avaliada de forma determinística no Rust.
Se a validação falhar, o Rust aborta imediatamente retornando erro IPC (`Error_MissingPrerequisites`), independentemente da UX da tela permitir o clique.

**Exemplo Lógico:**
```rust
match action {
    AiAction::SeoOptimization => {
        if context.metadata.keyword.is_none() || (context.content.is_none() && context.metadata.summary.is_none()) {
            return Err(AiError::MissingPrerequisites("Exige keyword AND (content OR summary)".to_string()));
        }
    }
    // ... implementar demais regras do PRD/Contrato V2
}
```

## 6. Prompt Assembly e Delimitação Segura

A estratégia de isolamento (*Prompt Injection Mitigation*) será a demarcação estrutural de tags, separando claramente o que é comando (Trusted) e o que é dado do usuário (Untrusted).

1.  **System Instructions (Trusted):** Injetadas baseadas na Ação. Exigem neutralidade (anti-chatbot).
2.  **Task Instructions (Trusted):** O comando principal e escopo da projeção.
3.  **Untrusted Editorial Data:** Dados escapados.

**Template Lógico de Montagem:**
```xml
[SYSTEM]
Você é um assistente editorial rigoroso. Forneça análises puramente técnicas sem jargões coloquiais ou saudações. Seu output deve ser em Markdown limpo.

[TASK]
Verifique a densidade e oportunidade da palavra-chave especificada nos metadados.

[CONTEXT DATA]
<article_data>
  <keyword>{escaped_keyword}</keyword>
  <summary>{escaped_summary}</summary>
  <!-- Campos adicionais projetados dependem do orçamento disponível -->
</article_data>
```
*   *Sanitização:* O Rust aplicará string escape nas tags de delimitação enviadas pelo usuário, evitando a evasão do bloco `<article_data>`.

## 7. Estratégia de Context Budget

Evitamos a adição de complexidade desnecessária (como tokenizers nativos robustos em C++) implementando uma heurística simples:

*   **Estimativa Conservadora:** Utilizar aproximação de caracteres (ex: `char_count / 4 ≈ tokens`). O backend deve possuir hard-limits baseados no modelo esperado local (ex: buffer arbitrário limitando payloads para 4K tokens no caso de pequenos modelos).
*   **Omissão Integral:** Se a projeção da ação incluir campos secundários, o tamanho agregado é avaliado. O Rust omitirá categorias opcionais *por inteiro* em vez de mutilá-las, se houver perigo de estourar a janela.
*   **Sem Truncamento no Meio:** Nunca campos essenciais são cortados passivamente. Se o item essencial (ex: `EditorialContent`) exceder sozinho a viabilidade do sistema local, o backend cancela a operação e retorna um erro.
*   **Warnings de UX:** Quando dados opcionais são descartados no backend, o primeiro evento emitido na geração de texto deverá carregar uma flag informacional (`context_reduced: true`), que a UI exibirá como um banner de atenção ao usuário (ex: "Notas extras foram ignoradas por limite de tamanho").

## 8. Tratamento de Erros e Estados IPC

A interface IPC utilizará fluxos e tipos existentes com semântica estendida:
*   `Error_MissingPrerequisites`: Ação impedida na barreira confiável por ausência de dados vitais.
*   `Error_ContextExceeded`: Corpo obrigatório excedeu as tolerâncias do Context Budget local.
*   `Error_Validation`: Falha na estruturação e integridade de tipos JSON.

## 9. Tratamento Especial: Alt Text e Media Asset (Restrição)

O PRD determina uma trava estrutural severa contra inferência de Alt Text sem objeto de mídia correspondente:
*   Para evitar depender obrigatoriamente de modelos nativos locais (Llava, etc.) para multimodais neste momento da evolução do sistema, suportaremos a passagem do descritivo visual humano: `MediaAsset { type: 'visual_description', data: '...texto' }`.
*   O Rust acata e insere no Prompt os dados visuais. Se, por ventura, a ação `Alt Text WCAG` não portar nenhum item iterável dentro de `context.media`, o processo causa `hard-fail` na validação de dependência CA2.

## 10. Tratamento Especial: EditorialContent Sob-demanda

Como a persistência central do corpo de texto ainda não está presente, e para viabilizar as features de edição/Linguagem Simples:
*   **Fallback Alert:** Se a revisão for despachada aceitando a queda para o escopo `summary_only` (resumo preenchido, mas corpo textual não), o Rust incluirá na `Task Instruction` do prompt uma diretiva mandatória para a Inteligência iniciar sua resposta alertando: *"Atenção: Análise baseada estritamente no Resumo."*

## 11. Testabilidade, Segurança e Observabilidade

*   **Unit Tests de Rust (Security & Budgeting):** Cobertura obrigatória nas funções formatadoras (`escape_xml`, `calculate_budget`) garantindo que ataques de evasão não suprimam as tags XML, e que ultrapassagens de tokens resultem nos bloqueios ou omissões esperadas.
*   **Unit Tests de TS (State & UI):** Cobertura das regras visuais (`Recommended / Available / Unavailable`) aplicando a Tabela 9 do PRD mockada.
*   **Debug & Telemetria:** Logs de diagnóstico no painel de console nativo (`log::debug!`) registrando o tamanho final submetido (budget consumido estimado), quais _features_ de metadados opcionais foram preenchidas e quais foram omitidas por estrangulamento de tokens. Nunca registrando log de textos limpos dos jornalistas no console.

## 12. Ordem de Implementação Recomendada (Phase 6.3B)

1.  **Tipos Compartilhados:** Atualizar `types/ai.ts` no frontend; criar a `struct EditorialContext` espelhada com `Serialize, Deserialize` no Rust.
2.  **Validação Autoritativa:** Criar o módulo no Rust que implementa as regras de Pré-requisitos (rejeitando requisições inválidas).
3.  **Montador Seguro (Prompt Assembly):** Codificar as funcões *anti-injection*, isolamento de tags e a montagem estática de _System/Task Prompts_.
4.  **Context Budget Heuristics:** Escrever a lógica simplificada de pesagem baseada no `EditorialContext`.
5.  **Conexão IPC / Gateway:** Instanciar o novo/refatorado comando Tauri de Orquestração conectando ao fluxo de streaming já amadurecido do Ollama Gateway (Phase 6.1).
6.  **UX / TS UI Adjustments:** Acoplar o layout react (`ArticleModal`) às novas regras de matriz `Recommended / Available / Unavailable` e enviar o contexto completo nas chamadas IPC.

## 13. Decisões Posteriores (Deferred)
*   **Model Selection Mapping:** Vincular automaticamente quais modelos lidam melhor com determinadas ações (seja Sidecar ou Ollama Local), com base em profiling. 
*   **Integração Editor:** WYSIWYG Editor deep-linking / In-line AI Generation integration persistente.
*   **Automações Background:** Funcionalidades AI para o status `Publicado` que possam interagir com API de redes sociais.
