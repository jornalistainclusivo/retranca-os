# Retranca OS

**Organizando o jornalismo antes que ele vire notícia.**

Aplicativo desktop para planejar pautas, organizar a produção e revisar conteúdo editorial no seu computador. A IA local é opcional; a decisão editorial continua com você.

Uma única edição funcional, sem conta ou assinatura: todas as pessoas podem personalizar etapas, categorias e checklists. A [decisão da edição aberta](docs/decisions/ADR-013-OPEN-SINGLE-EDITION.md) registra essa direção; o código do Retranca OS está disponível sob a [licença MIT](LICENSE).

[Guia de primeiros passos](docs/user-guide/GETTING-STARTED.md) · [Documentação](docs/README.md) · [Desenvolvimento local](docs/development/LOCAL-DEVELOPMENT.md) · [Plano da fase 6.5](docs/architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md)

## Download

**Ainda não há um instalador público para baixar com um clique.** Em 08/10/2026, a [página de releases](https://github.com/jornalistainclusivo/retranca-os/releases) não possui versões publicadas com instaladores.

Existe um **Retranca OS Pilot para Windows**, compilado e testado localmente durante o desenvolvimento. Ele usa um ambiente de dados separado e ainda não foi publicado como release. A versão nos manifests é `0.1.0`; o [registro de integração e do piloto](docs/testing/PHASE-6.5-INCREMENT-7-INTEGRATION.md) identifica o código, os arquivos e os testes aceitos.

O **Download ZIP** do GitHub fornece o código-fonte, que precisa ser preparado e compilado. Para executá-lo, siga o [guia de desenvolvimento](docs/development/LOCAL-DEVELOPMENT.md). Quando uma release com instalador for aprovada e publicada, esta seção poderá oferecer o link direto ao arquivo correspondente.

## O que você pode fazer

- Criar pautas e acompanhar prazos no **Quadro Kanban** e no **Calendário**.
- Editar resumo, objetivo, conteúdo completo e checklist de cada pauta no **CMS Editorial**.
- Personalizar etapas, categorias e templates nas **Configurações Editoriais**.
- Usar **Início** para encontrar orientações, atalhos, trabalho recente e conquistas.
- Consultar **Estatísticas e conquistas** e escrever no **Bloco de notas**.
- Importar e exportar pautas em arquivos JSON locais, preservando pautas já existentes na importação.
- Pedir sugestões a um modelo local instalado no Ollama e cancelar a geração quando precisar.

## Primeiros passos

Se você já recebeu o piloto para teste ou iniciou o desktop pelo código-fonte:

1. Abra **Início** e confira o fluxo e as categorias sugeridas.
2. Personalize essa configuração, se quiser, em **Configurações Editoriais**.
3. Selecione **Nova Pauta**, preencha os campos e escolha **Salvar Pauta no CMS**.
4. Acompanhe a pauta no Kanban e revise o conteúdo e os checklists no CMS.
5. Para assistência opcional, abra **IA local**, escolha um modelo instalado e verifique sua disponibilidade.

O [guia de primeiros passos](docs/user-guide/GETTING-STARTED.md) explica cada página, o salvamento, a configuração de IA e os erros mais comuns.

## IA local

As seis ações são **Pesquisar Lacunas**, **Simplificar Linguagem**, **Validar Inclusividade**, **Alt Text WCAG**, **Otimizar Meta Tags SEO** e **Revisão Editorial**.

O caminho atual usa o **Ollama instalado pela própria pessoa**. O Retranca lista modelos existentes e verifica sua disponibilidade antes de gerar; não instala nem baixa um modelo automaticamente. A compatibilidade deste código cobre exatamente os servidores `0.35.1` e `0.40.1`, conforme o [ADR-016](docs/decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md#compatibility-amendment--2026-10-08). Outras versões exigem validação antes de serem liberadas.

O motor embutido continua como preferência para uma entrega futura. O recurso Alt Text usa uma descrição visual escrita; anexar imagens e usar visão multimodal ainda são itens de descoberta. As sugestões precisam de revisão humana, incluindo checagem de fontes e fatos.

## Seus dados

No desktop, pautas e configurações ficam em um banco SQLite local. O aplicativo não sincroniza suas pautas com o GitHub. Salve a pauta antes de fechar: uma sugestão de IA, inclusive um trecho cancelado, permanece temporária até você incorporá-la ao conteúdo e salvar.

A exportação JSON contém pautas; ela não é um backup completo do banco, dos catálogos e dos demais dados. A importação preserva pautas com IDs já existentes. Consulte o [guia de dados e importação](docs/user-guide/GETTING-STARTED.md#seus-dados) antes de transferir arquivos.

## Estado do desenvolvimento

Checkpoint: **08/10/2026**.

- A fase **6.4 está integrada**; a **6.5 permanece em desenvolvimento**.
- Os Incrementos 1–7 estão integrados na `main`. O [PR #10](https://github.com/jornalistainclusivo/retranca-os/pull/10) foi integrado em `92a16d25e617a0345367e7843da8ab16c7fbb5fe`.
- Os quatro jobs do [CI #40](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37854563619) passaram nesse código.
- O responsável aprovou os testes delimitados do piloto Windows, incluindo o zoom do aplicativo instalado. Esses resultados não equivalem a uma avaliação completa de acessibilidade ou autorização de distribuição.

| Plataforma | Evidência disponível |
| --- | --- |
| Windows | Desenvolvimento e piloto local instalado, com testes delimitados aceitos pelo responsável. |
| Linux | Compilação e testes Rust no CI Ubuntu; instalação e uso do aplicativo com IA real ainda precisam de validação própria. |

O [plano da fase 6.5](docs/architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) reúne os critérios restantes: empacotamento, acessibilidade mais ampla, backup/restauração, segurança, licenças de terceiros, assinatura e distribuição. Ele não define uma quantidade fechada de fases futuras.

## Para desenvolver ou contribuir

Prepare Git, Node.js/npm, Rust/Cargo e os [pré-requisitos nativos do Tauri](https://v2.tauri.app/start/prerequisites/) para seu sistema. O desktop pode ser usado sem IA; Ollama e um modelo local são necessários apenas para a assistência.

Em uma pasta onde você queira criar uma nova cópia:

```sh
git clone https://github.com/jornalistainclusivo/retranca-os.git
cd retranca-os
npm ci
npx --no-install tauri dev
```

O Tauri inicia o frontend automaticamente. O [guia de desenvolvimento](docs/development/LOCAL-DEVELOPMENT.md) detalha requisitos, validações, diferenças entre preview e desktop e o build privado do piloto.

## Documentação e licença

Comece pelo [índice da documentação](docs/README.md). Ele aponta para o manual, os contratos atuais, os ADRs e as evidências de validação. Documentos históricos preservam as decisões e os resultados de suas respectivas revisões.

O código e a documentação próprios do Retranca OS são disponibilizados sob a [licença MIT](LICENSE), com copyright de JINC Apps - Jornalista Inclusivo (2026).

Dependências, runtimes e modelos de IA continuam sujeitos às suas próprias licenças. A revisão desses termos e os demais critérios de distribuição permanecem pendentes; a adoção da MIT não equivale à publicação de uma release.
