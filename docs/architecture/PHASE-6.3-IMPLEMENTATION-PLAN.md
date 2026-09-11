# Phase 6.3B - Context-Aware Editorial AI Orchestration Implementation Plan

Este documento detalha o plano de execução da fronteira de orquestração híbrida da IA Editorial, em conformidade com o ADR-008, SDD da Phase 6.3, PRD V3 e Context Contract V2. 

## 1. Comandos Tauri e Fechamento do Trusted Boundary

* **Novo Entry Point Confiável:** Será criado o comando Tauri `start_orchestrated_inference`. Este será a **única** porta de entrada pública para ações editoriais da IA em produção, orquestrando a requisição.
* **Fechamento de Bypass (Security Enforcement):** 
  * Os comandos atuais (`start_ollama_inference` e `start_inference`) que aceitam *prompts brutos* serão removidos do `invoke_handler` em _release builds_ (produção).
  * A implementação atual será extraída para funções internas reutilizáveis pelo orquestrador Rust.
  * O acesso aos comandos brutos será encapsulado com `#[cfg(debug_assertions)]` caso sejam essenciais estritamente para ferramentas de desenvolvimento internas, garantindo a integridade do _Trusted Boundary_ em produção.
* **Provider-Selection Policy:** A orquestração não assume o papel de selecionar o provedor; ela recebe a indicação e age como despachante. A política de seleção atual permanece isolada em seu módulo.

## 2. Contratos IPC e Tipos TypeScript

Não haverá substituição destrutiva de `InferenceRequest`.

* **AiOrchestrationRequest:**
  ```typescript
  interface AiOrchestrationRequest {
    job_id: string;
    action: AiAction;
    context: EditorialContext; // DTO V2 Strict
    provider: ProviderType;
    model?: string;
  }
  ```

* **AiAction (Atualizado):**
  Preservação dos existentes e adição dos novos requisitos.
  ```typescript
  type AiAction =
    | 'generate_outline'
    | 'generate_alt_text'
    | 'generate_seo'
    | 'check_accessibility'
    | 'validate_inclusivity'
    // Novos escopos Phase 6.3:
    | 'research_gaps'       // Lacunas de Pesquisa
    | 'plain_language'      // Linguagem Simples
    | 'editorial_review';   // Revisão Editorial
  ```

* **Eventos de Aviso (UX/Budget):**
  ```typescript
  interface AiContextNoticeEvent {
    job_id: string;
    notice_code: string;
    omitted_fields: string[];
    message: string; // Para notificação na UI
  }
  ```

* **Tratamento de Erros:**
  A UI tratará os seguintes códigos emitidos pelo backend, preservando mensagens humanas e graciosas:
  * `MISSING_PREREQUISITES`
  * `CONTEXT_EXCEEDED`
  * `UNSUPPORTED_CAPABILITY`
  * `VALIDATION_ERROR`

## 3. Context Budget e Media Assets

* **Estratégia Capability-Aware:** 
  O sistema tentará dimensionar o orçamento com base na capacidade reportada pelo modelo.
* **Fallback Conservador (8K):**
  Caso o budget exato não possa ser determinado, a heurística de contingência adotará um teto estrito de **8.000 caracteres de entrada**, reservando margem operacional (instruções e token de output).
* **Mutilação Proibida:** 
  Itens opcionais serão omitidos *integralmente* e itens essenciais nunca serão truncados. Estourar os essenciais causa a falha `CONTEXT_EXCEEDED`. Nenhuma biblioteca pesada de tokenizer nativo será embutida no binário.
* **MediaAsset (Multimodal):**
  A feature usará estritamente `visual_description`. O uso de `image_asset` acionará checagem de *capability multimodal* no backend. Falhar essa validação joga `UNSUPPORTED_CAPABILITY`. Sob nenhum pretexto o Base64 bruto será vazado num prompt texto puro.

## 4. Ordem de Tarefas de Implementação

1. **Camada Rust de Orquestração (`src-tauri/src/orchestrator/`)**
   * Migrar lógica interna (`start_ollama_inference`, `start_inference`).
   * Adicionar validação cruzada do `EditorialContext` x `AiAction`.
   * Montagem do Budget e injeção do XML mitigation tags `<article_data>`.
2. **Camada Tauri IPC (`src-tauri/src/commands/`)**
   * Expor `start_orchestrated_inference`.
   * Suprimir comandos antigos para _release_.
3. **Frontend Types e Adapters (`types/`, `lib/adapters/`)**
   * Adicionar novo contrato e eventos.
   * Ajustar o chamador de _Provider_.
4. **UI React (`components/ArticleModal.tsx`)**
   * Ouvir evento de aviso (`AiContextNoticeEvent`).
   * Mapear disponibilidade de botões com base no State real e chamar o novo `start_orchestrated_inference`.

## 5. Plano de Testes Obrigatório

*   **Security Enforcement Test:** Adicionar script / teste integracional comprovando que uma chamada IPC maliciosa direcionada aos comandos brutos (`start_ollama_inference` ou `start_inference`) em build *release* falhará de forma limpa, uma vez que tais comandos não estarão registrados nem disponíveis no `invoke_handler` de produção. Nenhum crash da aplicação é esperado, confirmando que apenas o validador (`start_orchestrated_inference`) transaciona requisições ao LLM local.
