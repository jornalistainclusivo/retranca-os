# ADR 008: Editorial AI Orchestration Boundary

## Status
Accepted

## Context
A Phase 6.3 introduziu o `EditorialContext` e o Contrato de Contexto (V2) para orquestrar as Ações de IA da plataforma. Precisamos definir em qual camada arquitetural residirá a validação de pré-requisitos, a montagem do payload e a fronteira de segurança contra *Prompt Injection* antes do envio à engine local (Ollama) ou futura (Cloud).
A aplicação é construída em React/TypeScript (Frontend) e Tauri/Rust (Backend IPC Gateway). Para sustentar o fluxo de contexto sem aumentar o débito técnico, devemos selecionar a abordagem mais eficiente dentro dessa infraestrutura existente.

## Evaluated Options

### Option 1: Frontend TypeScript (Client-Side Orchestration)
O React extrai os dados, valida pré-requisitos, constrói a string final de Prompt (com System Prompt + Dados) e envia a string final para o Rust apenas repassar ao provedor via adaptador.
*   **Pros:** Simplicidade extrema de implementação; reaproveita as tipagens do domínio já existentes no React.
*   **Cons:** O Frontend não é uma fronteira de segurança confiável (*Trust Boundary*). A validação de tokens (*Context Budget*) no JS pode bloquear a main thread ou ser imprecisa frente ao tokenizer real em uso. O envelopamento (XML/JSON escaping) no frontend arrisca vazamentos de instruções caso o IPC seja interceptado ou o cliente manipulado via DevTools.

### Option 2: Tauri/Rust (Backend-Heavy Orchestration)
O Frontend envia apenas a intenção de Ação e o ID do artigo. O Rust acessa o banco de dados local para reconstruir a pauta, cruzar status, verificar checklists pendentes, formatar e compilar o prompt.
*   **Pros:** Centralização e isolamento do webview. Nenhuma lógica de negócio transita no Webview.
*   **Cons:** Elevada duplicação de regras de negócio. O Rust precisaria conhecer detalhes de exibição de UI, tipos de CMS e Checklists. Ademais, o estado local e temporário não-salvo (ex: conteúdo em digitação enviado "sob demanda" / *pasted*) precisaria ser sincronizado constantemente ou serializado de forma complexa. Baixa testabilidade e manutenção custosa para uma equipe pequena.

### Option 3: Hybrid TypeScript + Tauri/Rust (Separation of Concerns)
O Frontend (TypeScript) avalia a **Disponibilidade Técnica** puramente para fins de UI/UX (calculando Recommended, Available ou Unavailable) e monta o `EditorialContext` apenas com os dados brutos em JSON, enviando via IPC. Essa avaliação de UI NÃO é autoridade de segurança. O Tauri/Rust atua como a **Fronteira Confiável**, revalidando os pré-requisitos no JSON, injetando as *Instruções de Sistema* fixas, gerenciando autoritativamente o *Context Budget* e envelopando os dados não confiáveis com delimitação segura antes do provedor.
*   **Pros:** Usa as forças de ambas as linguagens. TypeScript gerencia o estado da tela, formulários e heurísticas interativas de botões. Rust aplica mecanismos estruturais de redução de risco contra injeção, executa orquestração e impõe a política de tokens. Nenhuma framework pesada de agentes é inserida.
*   **Cons:** O modelo de `EditorialContext` precisará de tipagem correspondente (bidirecional) entre TypeScript e Rust.

## Decision Criteria
1.  **Simplicidade e Impacto:** Solução nativa baseada na stack atual, sem introduzir frameworks genéricos de Agentes ou de grafos (ex: LangChain, LangGraph).
2.  **Segurança (Trust Boundary):** Impedir estruturalmente a manipulação não autorizada de _System Prompts_ oriunda de manipulação de formulários (Prompt Injection).
3.  **Manutenibilidade:** Evitar a duplicação no Rust de lógicas voláteis de interface.
4.  **Desempenho:** O cálculo de *Context Budget* não pode degradar a performance visual da UI.

## Decision
We will use **Option 3: Hybrid TypeScript + Tauri/Rust**.

Para satisfazer o Contrato de Contexto V2 sem onerar a manutenção, as responsabilidades serão estritamente divididas na fronteira do comando Tauri IPC:

**Responsabilidade do TypeScript (Frontend):**
* Coletar o `EditorialContext` do estado (React state / CMS).
* Executar a matriz de UI do PRD V3: decidir se um botão de ação deve ser **Recomendado**, **Disponível** ou **Indisponível** baseado nas evidências visíveis. Essa etapa é meramente visual e não possui autoridade de segurança.
* Enviar via IPC apenas a intenção (ex: `AiAction::SeoOptimization`) e o payload bruto (dados), jamais enviando instruções base ou formatações de prompt.

**Responsabilidade do Tauri/Rust (Fronteira Confiável):**
* Receber a `AiAction` e o contexto JSON na camada Rust Command.
* Revalidar obrigatoriamente todos os pré-requisitos antes de qualquer chamada ao provider, bloqueando a ação se campos obrigatórios exigidos pelo contrato faltarem.
* Atribuir as **Instruções de Sistema** estáticas do backend (Trusted Data) vinculadas à respectiva `AiAction`.
* Aplicar a **Delimitação Segura** (escaping) aos dados brutos recebidos (Untrusted Data).
* Processar autoritativamente a política de **Context Budget**. Não é obrigatório um tokenizer pesado no Rust neste nível; o método de estimativa ou contagem exata por provedor/modelo fica para o SDD. Se o payload exceder os limites previstos, o Rust omitirá campos opcionais (exigindo aviso da UI) ou barrará a execução excessiva.

## Consequences
*   **Contratos de Tipagem:** Será criado um DTO em Rust para espelhar a assinatura de `EditorialContext` necessária no recebimento do IPC.
*   **Enforcement de Risco:** A mitigação estrutural de injeção e a política autoritativa de Budget residirão em Rust, adicionando uma camada de enforcement e isolamento em relação ao LLM. O Frontend é totalmente proibido de submeter *System Prompts*.
*   **Simplicidade Atendida:** Nenhum banco de dados vetorial, microserviço, broker de mensagens, conteinerização adicional ou framework de IA complexo foi introduzido.

## Rejected Complexity / YAGNI
Rejeitamos categoricamente a introdução de frameworks como LangChain, Flowise ou equivalentes no ciclo de vida da aplicação. A orquestração editorial exigida é inerentemente determinística e limitada a um mapeamento de contexto para templates; a adoção de frameworks abstratos violaria o requisito de simplicidade e dificultaria a auditoria restrita de payload exigida pela segurança anti-injeção. Não adotaremos memória vetorial ou grafos de estado.

## Deferred Decisions
* O mecanismo algorítmico exato de *escaping* e o tipo do parser para a Delimitação Segura (seja tags XML defensivas `<user_input>` ou estruturação JSON) ficam postergados para o detalhamento no Software Design Document (SDD) da Phase 6.3B.
* A definição das políticas de _Fallback Provider_ ou de qual LLM específico orquestrará qual Ação, permanecem atreladas à gestão de Entitlements/Provisionamento fora deste ADR.
