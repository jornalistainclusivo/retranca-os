# PHASE 6.3 - EDITORIAL AI CONTEXT CONTRACT V2

Este documento estabelece o contrato de especificação do Domínio de Contexto de IA para a Phase 6.3. Ele serve como referência para os futuros projetos arquiteturais (ADR/SDD), ditando o formato lógico dos dados, níveis de confiança, regras de montagem e as invariantes que não podem ser violadas em código de produção.

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
  type: 'image_asset' | 'visual_description';
  data: string; // Asset/imagem real ou string de descrição textual
}
```
*Nota:* Não se assume obrigatoriamente suporte a multimodalidade nativa no provedor até a decisão do ADR/SDD. A separação estrita entre descrição textual e ativo de imagem assegura que o sistema possa validar a disponibilidade de evidência antes de repassar a carga, independentemente da engine LLM.

## 2. Proveniência e Trust Level (Segurança de Payload)

**Regra fundamental:** Deve haver separação rigorosa entre proveniência e confiança. Qualquer dado oriundo de modificação, seja do usuário, da interface ou derivado de ações sobre a pauta, se incorporado ao prompt, é estritamente **Não Confiável** (Untrusted Data).

*   **Instruções de Sistema / System Prompt / Políticas:** Origem Estática (Trust Level: **Trusted**)
*   **Nome e Instruções da Ação Solicitada:** Origem Estática (Trust Level: **Trusted**)
*   **Qualquer dado do CMS (`articleId`, `editorialStatus`, `categoryTag`, `title`, `summary`, `objective`, `keyword`, `persona`, `cta`, `notes`, `links`, `content`, `media`, `checklistsState`):** Derivado de input humano ou manipulação da pauta (Trust Level: **Untrusted / Não Confiável**). 

*Atenção:* O sistema deverá envelopar os *Untrusted Data* aplicando uma **delimitação segura de dados** contra *Prompt Injection* antes de submetê-los à Engine LLM. O formato final exato do parser/wrapping será definido em ADR/SDD, mas o contrato prevê que o motor isolará esses campos das instruções centrais.

## 3. Estados de Ação de IA

*   **Recommended (Recomendada):** A ação está logicamente alinhada ao status editorial atual. As evidências obrigatórias estão presentes. **UI:** Destaque visual e ênfase total.
*   **Available (Disponível Técnicamente):** A ação não é o fluxo recomendado/principal para o status atual, porém todas as evidências mínimas obrigatórias estão presentes. **UI:** Operante, mas com redução de proeminência visual (fundo neutro).
*   **Unavailable (Indisponível):** Evidências vitais (pré-requisitos) estão ausentes no Contexto. A ação será barrada independentemente do status editorial. **UI:** Desabilitada, com mensagem acessível detalhando a falta exata.

## 4. Projeção de Contexto por `AiAction` e Pré-requisitos

Cada ação consome unicamente a fatia do `EditorialContext` que lhe é útil.

| AiAction | Campos Obrigatórios (Pré-requisitos) | Projeção Mínima Opcional Projetada | Escopo Analisado Padrão |
| :--- | :--- | :--- | :--- |
| **Lacunas de Pesquisa** | `title` ou `objective` | `notes`, `links`, `keyword` | `metadata_only` |
| **Linguagem Simples** | `content` ou `summary` | `persona` | `full_content` ou `summary_only` |
| **Validador Inclusivo** | `content` ou `summary` | (nenhum extra essencial) | `full_content` ou `summary_only` |
| **Alt Text WCAG** | `media` | `title` | Mídia (`image_asset` / `visual_description`) |
| **Otimização SEO** | `keyword` AND (`content` ou `summary`) | `title`, `objective`, `persona`, `cta` | `full_content` ou `summary_only` |
| **Revisão Editorial** | `content` AND `objective` | `notes`, `links`, `checklistsState` | `full_content` (obrigatório) |

## 5. Escopos Analisados e Confiança do Retorno

A inferência reage dinamicamente ao escopo da projeção de texto submetida:
*   **`full_content`:** Análise abarca o corpo de texto na íntegra. Retorno reflete a matéria global.
*   **`selection`:** Análise se restringe rigidamente ao bloco selecionado provido.
*   **`summary_only`:** Executada sob o resumo na ausência do corpo textual completo. O LLM aplicará aviso estruturado iniciando com: *"Atenção: Análise baseada estritamente no Resumo"*.
*   **`metadata_only`:** Executada usando as definições semânticas primárias sem `summary` ou `content`. Escopo aplicado, por exemplo, na detecção de *Lacunas de Pesquisa* ao planejar a pauta, priorizando `title`, `objective` e `keyword`.

## 6. Políticas de Negócio

### 6.1 Política de Checklist Pendente
*   Os checklists do CMS nunca gerarão _hard-block_ para barrar uma Revisão de Inteligência se o texto-base (evidências) estiver presente.
*   Ao terminar a execução, se enviados os pendentes no *untrusted payload*, a Engine anexará aviso ressaltando o estado pendente, com a responsabilidade de fechamento e verificação cabendo unicamente ao fluxo editorial humano.

### 6.2 Política de Context Budget
Frente às janelas limitadas de processamento contextual (tokens):
*   **Jamais cortar parcialmente campos essenciais:** Não haverá truncamento de pedaços de strings *core* para acomodar o limite de janela.
*   **Omissão Integral de Opcionais:** Campos classificados como secundários/opcionais (`notes`, `links`) na Projeção da respectiva *AiAction* podem ser excluídos completamente para garantir o envio das partes vitais.
*   **Sinalização Obrigatória de Omissão:** A supressão de qualquer campo opcional do orçamento deverá obrigatoriamente acionar uma notificação visual à UI sinalizando a restrição da massa de informações.
*   **Bloqueio de Submissão:** Caso somente os campos classificados como **obrigatórios** extrapolem sozinhos o limite disponível, a operação não ocorrerá e retornará erro de sobrecarga de dados solicitando refinamento da massa inicial.

## 7. Invariantes de Arquitetura (Para Futuro ADR/SDD)
As seguintes regras DEVEM ser mantidas independentemente da topologia escolhida para orquestrar as requisições:
1.  **Validação Confiável Antecipada:** Pré-requisitos e disponibilidade técnica devem ser validados **antes** da chamada ao provider de inteligência artificial, em uma camada confiável definida pela arquitetura (ex: Controller, Commander IPC). 
2.  **Abstração e Blindagem Contra Prompt Injection:** Todo conteúdo classificado sob a regra de Trust Zero, seja input autoral do repórter ou _flags_ do repositório, deverá gozar de **delimitação segura de dados** para imunizar o sistema de fugas interpretativas.
3.  **Indução Estrutural Visual:** Alt Text não inferirá objetos baseado puramente nos descritivos de uma história caso não haja _MediaAsset_ formal e instanciado. O motor lógico não repassará a ordem se houver falta desta dependência estrutural.
