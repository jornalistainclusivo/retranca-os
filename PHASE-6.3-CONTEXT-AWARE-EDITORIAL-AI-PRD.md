# PHASE-6.3-CONTEXT-AWARE-EDITORIAL-AI-PRD

## 1. Problema e Oportunidade
**Problema:** Atualmente, a assistência de IA (via Ollama local/Sidecar) executa ações de forma genérica (ex: gerar Alt Text, Otimizar SEO), sem consciência do estado atual da pauta no CMS. Isso gera resultados subotimizados, além do risco do modelo agir como um "chatbot" verboso, entregando respostas não acionáveis ou inventando dados não presentes no contexto da matéria.
**Oportunidade:** Injetar o contexto integral da pauta (status editorial, metadados, checklists, campos descritivos) no pipeline da IA. A IA se transformará de uma ferramenta de geração cega em um assistente editorial inteligente que entende a fase do trabalho (ex: "pesquisa" exige sugestões de lacunas, enquanto "revisão" exige correção gramatical e auditoria final).

## 2. Objetivos e Non-Goals
**Objetivos:**
*   Habilitar que ações da IA sejam "context-aware" (cientes de `status`, `resumo`, `notas`, `checklists`, etc).
*   Padronizar o formato de saída da IA para ser 100% acionável e objetivo (zero chatbot-talk).
*   Fornecer um catálogo de ações (Prompts de Sistema) que variam de acordo com o `status` editorial.
*   Garantir a privacidade, mantendo toda a orquestração amarrada ao gateway Ollama/Sidecar.

**Non-Goals:**
*   Alterar a base do IPC em Rust, arquitetura do Tauri ou o processo de _provisioning_ de chaves.
*   Automatizar mudanças de status no CMS pela IA (a IA sugere/ajuda, mas o usuário atua).
*   Criação de novos modais de chat; a interface continua sendo `ArticleModal`.

## 3. Usuários e Jobs-to-be-Done (JTBD)
**Usuário Principal:** Jornalistas, repórteres e editores focados em conteúdo acessível e otimizado.
**Jobs-to-be-Done:**
*   *Como repórter na fase de pesquisa*, quero que a IA aponte lacunas de dados para que a matéria fique completa.
*   *Como editor em revisão*, quero que a IA valide a acessibilidade (Alt Text, Linguagem Simples) para garantir que a publicação cumpra os critérios WCAG/AAA.
*   *Como redator web*, preciso de metadados SEO baseados estritamente na Persona e CTA definidos, para otimizar distribuição orgânica.

## 4. Modelo Atual do Workflow Editorial
O CMS divide o ciclo de vida do artigo nos seguintes status sequenciais (conforme `ArticleStatus`):
1.  **Ideia:** Concepção, títulos provisórios, definição de Persona e CTA.
2.  **Pesquisa:** Coleta de links internos/externos, anotações, preenchimento do resumo.
3.  **Escrita:** Redação do corpo principal, estimativa de tempo.
4.  **Revisão:** Verificação de SEO, checklists editoriais/WCAG, auditoria de inclusividade.
5.  **Publicado:** Fechamento e distribuição.

## 5. Comportamento Esperado por Status Editorial
A IA deve alterar sua abordagem de acordo com o status atual:
*   **Ideia:** Foco em brainstorm estrutural, validação de viabilidade e adequação de persona.
*   **Pesquisa:** Análise crítica dos apontamentos (notas, links), identificação de viés ou "pontos cegos" de pesquisa.
*   **Escrita:** Auxílio com fluidez, adequação da linguagem simples e inclusão do CTA.
*   **Revisão:** Auditoria dura (compliance WCAG, auditoria estrutural, verificação de checklist pendente, extração rigorosa de metadados SEO).
*   **Publicado:** Foco em fragmentação de conteúdo (micro-conteúdos para distribuição).

## 6. Requisitos de Contexto para IA
Sempre que uma ação for disparada no `ArticleModal`, o payload `InferenceRequest.context` deve incluir programaticamente:
*   `title` e `categoryTag`
*   `status` atual
*   Campos editoriais preenchidos: `summary`, `objective`, `keyword`, `persona`, `cta`
*   Status dos `checklists` (O que já foi feito e o que está pendente)
*   `notes` e referências de links.

## 7. Catálogo Inicial de Ações (AiAction)
*   **Alt Text WCAG:** Gera texto alternativo focado no contexto do artigo (não apenas descreve a imagem friamente).
*   **Otimização SEO:** Sugere _Title Tags_ e _Meta Descriptions_ que incluam a `keyword` e convidem a `persona` para o `cta`.
*   **Auditoria de Linguagem Simples:** Avalia o nível de leitura, sugere troca de jargões complexos e adequa sentenças longas (Foco Cognitivo).
*   **Validador Inclusivo:** Analisa presença de vieses de gênero, capacitismo, etarismo ou linguagem excludente.
*   **Lacunas de Pesquisa (Novo):** Analisa o que já está na pauta e o objetivo da matéria para sugerir 3 a 5 perguntas ainda não respondidas.
*   **Revisão Editorial (Novo):** Revisa gramática e aderência geral ao "Objetivo da Matéria".

## 8. Regras Comuns de Resposta da IA (Anti-Chatbot Policy)
Todas as interações orquestradas devem injetar estas "System Rules" imutáveis:
1.  Nunca inicie com saudações (Ex: "Claro!", "Aqui está...").
2.  Nunca termine com perguntas proativas (Ex: "Quer ajuda com mais algo?").
3.  Se uma informação faltar, informe objetivamente a ausência em vez de alucinar dados falsos.
4.  Retorne o conteúdo utilizando Markdown direto e puro, formatado para facilitar a leitura.

## 9. Requisitos de UX/Acessibilidade
*   O carregamento da resposta deve continuar respeitando `aria-live="polite"` e o `role="log"`.
*   Feedback tátil/visual imediato ao copiar (O botão "Copiado!" atual é o padrão).
*   Os botões de "Ação de IA" na UI devem ser ocultados, desabilitados ou reorganizados visualmente caso a ação não faça sentido para o `status` atual.

## 10. Requisitos de Segurança / Privacy / Provider-Neutrality
*   A IA (seja Ollama ou Sidecar) não tem permissão direta de escrita no CMS; ela apenas sugere na área isolada (`aiResponse`).
*   Dados confidenciais nas anotações só saem da máquina se o usuário alterar a preferência de privacidade no Provider. (Como o Ollama é local, o risco imediato é nulo, mas a arquitetura deve garantir isso futuramente).
*   O Orquestrador (Frontend router) tem o dever de construir o Prompt completo com os metadados antes de enviá-lo ao `Tauri IPC`.

## 11. Critérios de Aceite Mensuráveis
*   **CA1:** Ao disparar "SEO" com uma pauta vazia, a IA deve apontar exatamente a falta de _keyword_ e _resumo_ ao invés de inventar.
*   **CA2:** Uma matriz lógica exibe apenas ações relevantes para a fase da pauta.
*   **CA3:** A IA não gera jargões conversacionais em 100% dos testes.
*   **CA4:** Nenhuma alteração disruptiva feita em código de baixo nível (Rust), mantendo estabilidade.

## 12. Matriz Inicial: Status × Ação

| Ação / Status | Ideia | Pesquisa | Escrita | Revisão | Publicado |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lacunas de Pesquisa** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Linguagem Simples** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Validador Inclusivo** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Alt Text WCAG** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Otimização SEO** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Revisão Editorial** | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 13. Riscos e Edge Cases
*   **Limite de Context Window:** Muitos checklists ou resumos extremamente longos podem estourar a capacidade do modelo leve (ex: `gemma:2b`).
*   **Contradição de Prompts:** O usuário preenche o CMS pedindo uma coisa na "Persona" e no "Resumo", e a IA entra em colapso tentando equilibrar.
*   **Reação de Falha Falsa:** Se o `status` for atualizado mas a refatoração do componente não recarregar as permissões do botão a tempo, causando cliques inválidos.

---

## 14. Decisões Humanas Ainda Necessárias (HUMAN DECISION REQUIRED)

> [!WARNING]
> **HUMAN DECISION REQUIRED** - Por favor, valide os seguintes pontos antes do planejamento arquitetural:
>
> 1. **Visibilidade das Ações por Status:** Na UI (ArticleModal), se uma ação for inválida para o status atual (ex: SEO na etapa "Ideia"), os botões devem ser **ocultados** ou apenas **desabilitados** (com tooltip explicando o porquê)?
> 2. **Campos Enviados ao Provider:** Todos os campos do CMS (Objetivo, Persona, Checklists, etc) devem ser consolidados em um bloco `context` e enviados juntos, ou devem ser inseridos de forma modular dependendo da Ação executada?
> 3. **Limite de Token / Fallback:** Caso a "Nota do Jornalista" exceda o limite empírico de um modelo local leve (ex: >2000 tokens), devemos truncar a nota ou bloquear a ação informando sobrecarga?
> 4. **Tratamento de Pautas "Publicadas":** A IA deverá ter alguma ação proativa pós-publicação (ex: "Sugerir Thread pro Twitter") incluída neste escopo ou deixamos restrito às ações listadas na Matriz?
> 5. **Comportamento Checklists Incompletos:** Se o usuário solicitar "Revisão Editorial" mas os checklists essenciais estiverem vazios/falsos, a IA deve **bloquear** a execução ou deve apenas criar um _disclaimer_ de que a pauta está incompleta?
