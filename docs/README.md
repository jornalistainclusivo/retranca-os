# Documentação do Retranca OS

Atualização: 08/10/2026. O Retranca é um aplicativo desktop em desenvolvimento; o piloto Windows é local e ainda não há release pública com instalador.

## Para usar o aplicativo

- [Visão geral e disponibilidade de download](../README.md#download).
- [Primeiros passos, salvamento, IA local e solução de problemas](user-guide/GETTING-STARTED.md).
- [Preparar e executar o código-fonte](development/LOCAL-DEVELOPMENT.md).

## Estado atual e próximas entregas

- [Plano ativo da fase 6.5](architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md): entregas, critérios restantes e preferência futura pelo motor embutido.
- [Integração do Incremento 7 e aceite do piloto instalado](testing/PHASE-6.5-INCREMENT-7-INTEGRATION.md): PR #10, CI #40, identidade dos arquivos e zoom aceito.
- [Contrato do Incremento 7](specifications/phase-6.5/PHASE-6.5-INCREMENT-7-ACCESSIBILITY.md) e [validação](testing/PHASE-6.5-INCREMENT-7-ACCESSIBILITY-VALIDATION.md).
- [Histórico de alterações](../CHANGELOG.md) e [tarefas de continuidade](../task.md).

O checkpoint mais recente dos documentos ativos prevalece sobre pendências descritas em seus registros anteriores. Passar CI, aceitar um teste local, integrar código e publicar um instalador são resultados distintos.

## Decisões que orientam o produto atual

| Decisão | Assunto |
| --- | --- |
| [ADR-008](decisions/ADR-008-EDITORIAL-AI-ORCHESTRATION-BOUNDARY.md) | Fronteira nativa da assistência editorial de IA. |
| [ADR-013](decisions/ADR-013-OPEN-SINGLE-EDITION.md) | Edição única e personalização aberta, substituindo o modelo comercial Free/PRO. |
| [ADR-014](decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md) | Texto completo salvo com cada pauta. |
| [ADR-015](decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md) | Importação local preservadora e limites da exportação JSON. |
| [ADR-016](decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md) | Ollama externo na primeira entrega; motor embutido como preferência futura. |
| [ADR-017](decisions/ADR-017-OPEN-EDITORIAL-STARTUP-AND-CATEGORY-CUSTOMIZATION.md) | Inicialização, categorias editáveis e página Início. |
| [ADR-018](decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md) | Manutenção de dependências e riscos ainda documentados. |

## Como ler o histórico técnico

As pastas `architecture`, `decisions`, `specifications` e `testing` preservam planos, contratos e resultados por fase. Os [documentos da fase 6.4](architecture/PHASE-6.4-IMPLEMENTATION-PLAN.md) descrevem a evolução já integrada; não constituem um roteiro de instalação para a pessoa usuária.

Documentos antigos podem mencionar Free/PRO, IA em nuvem ou motores sintéticos. Consulte os ADRs e checkpoints atuais antes de interpretar essas referências como comportamento presente. Relatórios de segurança e testes de revisões anteriores mantêm seus próprios escopos; esta consolidação não reescreve esses resultados.

A primeira distribuição pública depende dos critérios ainda abertos no plano da fase 6.5, inclusive licença formal, riscos aplicáveis, empacotamento e validações de instalação.
