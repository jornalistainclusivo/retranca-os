# Retranca OS

**Organizando o jornalismo antes que ele vire notícia.**

Aplicativo desktop para planejar pautas, organizar a produção e revisar conteúdo editorial no seu computador. Reúne um CMS local, checklists e assistência opcional de IA. Jornalismo ético, inclusão, acessibilidade e revisão humana orientam o projeto.

Uma única edição funcional, sem conta ou assinatura: todas as pessoas podem personalizar etapas, categorias e checklists. A [decisão da edição aberta](docs/decisions/ADR-013-OPEN-SINGLE-EDITION.md) registra essa direção; o código está disponível sob a [licença MIT](LICENSE).

[Guia de primeiros passos](docs/user-guide/GETTING-STARTED.md) · [Documentação](docs/README.md) · [Desenvolvimento local](docs/development/LOCAL-DEVELOPMENT.md)

## Estado atual e disponibilidade

Base de código conferida em **09/10/2026**: [`main` em `96a3093`](https://github.com/jornalistainclusivo/retranca-os/tree/96a309384ccb7b337dcce65b39a7519eb1ac02d7). A fase 6.4 está integrada; a fase 6.5 permanece em desenvolvimento.

Este checkout contém o candidato local em `codex/phase-6.5-workspace-backup`, sobre `9768a87`: preparação do SQLite estático e protótipo interno de backup. Os comandos novos abaixo descrevem esse checkout; eles ainda não estão na main, no PR #14 ou no aplicativo instalado. Consulte o [registro do build SQLite](docs/decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#integração-local-do-build-sqlite--2026-10-09) para a evidência e os limites.

### Download

**Ainda não há um instalador público para baixar com um clique.** Nessa data, a [página de releases](https://github.com/jornalistainclusivo/retranca-os/releases) não possui releases publicadas. Os manifestos [npm](package.json), [Cargo](src-tauri/Cargo.toml) e [Tauri](src-tauri/tauri.conf.json) declaram `0.1.0`; esse metadado e as tags históricas não comprovam uma versão distribuível.

Existe um **Retranca OS Pilot para Windows**, compilado e testado localmente, com identidade e dados separados do aplicativo normal. O [registro de integração e do piloto](docs/testing/PHASE-6.5-INCREMENT-7-INTEGRATION.md) identifica o código, os artefatos e os testes delimitados aceitos. Esses resultados não equivalem a estabilidade, avaliação completa de acessibilidade ou aprovação de distribuição.

| Plataforma | Evidência disponível |
| --- | --- |
| Windows | Desenvolvimento e piloto local instalado, com testes delimitados aceitos pelo responsável. |
| Linux | Compilação e testes Rust no CI Ubuntu; instalação e uso com IA real ainda precisam de validação própria. |

O **Download ZIP** do GitHub fornece o código-fonte, que precisa ser preparado e compilado. Para executá-lo, siga as instruções abaixo. O [plano da fase 6.5](docs/architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) reúne os critérios restantes para distribuição.

## Funcionalidades

- Criar pautas e acompanhar prazos no **Quadro Kanban** e no **Calendário**.
- Editar resumo, objetivo, conteúdo completo, metadados e checklist de cada pauta no **CMS Editorial**.
- Personalizar etapas, categorias e templates nas **Configurações Editoriais**.
- Usar **Início** para encontrar orientações, atalhos, trabalho recente e conquistas.
- Consultar **Estatísticas e conquistas** e escrever no **Bloco de notas**.
- Importar e exportar pautas em JSON, preservando pautas com IDs já existentes na importação.
- Pedir sugestões a um modelo local instalado no Ollama e cancelar a geração.

“CMS” é o ambiente local de edição e organização. Marcar uma pauta como publicada registra seu estado no fluxo; não publica o conteúdo em um site.

## Requisitos

- **Frontend:** Node.js/npm compatíveis com o [lockfile](package-lock.json). As ferramentas exigem Node 20.19+ na linha 20, 22.13+ na linha 22 ou 24+ em ambientes de 64 bits. São requisitos declarados pelas dependências, não uma matriz de versões testada nesta revisão documental.
- **Desktop:** Rust/Cargo e os pré-requisitos nativos do sistema. O [manifesto Rust](src-tauri/Cargo.toml) declara `rust-version = "1.77.2"`; o mínimo efetivo de toda a árvore não foi validado nesta revisão.
- **Windows:** Microsoft C++ Build Tools com desenvolvimento desktop em C++, toolchain Rust MSVC e WebView2. O piloto exige WebView2 já instalado e não o instala.
- **Linux:** bibliotecas nativas indicadas no [guia de desenvolvimento](docs/development/LOCAL-DEVELOPMENT.md) e no [workflow de CI](.github/workflows/ci.yml). Não há uma matriz de instalação validada para distribuições Linux.
- **IA opcional:** Ollama em execução neste computador e um modelo local compatível já instalado. Nenhuma chave de API de nuvem é exigida pelo fluxo normal.

## Configuração e execução

Execute os comandos na raiz do checkout. Para criar uma **nova cópia**:

```sh
git clone https://github.com/jornalistainclusivo/retranca-os.git
cd retranca-os
npm ci
```

Em um checkout existente, entre na própria pasta e execute `npm ci`, preservando alterações locais. Use os lockfiles do projeto. Um clone novo obtém a main publicada, sem as alterações locais descritas em “Estado atual”.

### Desktop normal

Antes de iniciar sobre dados de uma versão anterior, preserve uma cópia dos dados com o aplicativo fechado. A [inicialização do banco](db/client.ts) executa as migrações necessárias automaticamente; não há um diálogo de autorização dessas migrações na abertura.

```sh
npm run desktop:dev
```

O comando prepara e verifica o SQLite 3.51.3 estático antes de iniciar o [Tauri](src-tauri/tauri.conf.json). O Tauri inicia `npm run dev` automaticamente e abre o frontend em `http://localhost:3000`. Esse modo usa o banco e a identidade do aplicativo normal. A primeira preparação exige compilador C nativo e acesso aos crates não armazenados em cache; não exige instalar uma DLL de SQLite. O [guia de build nativo](docs/development/LOCAL-DEVELOPMENT.md#pinned-native-sqlite-build) também mostra a preparação para comandos Cargo/Tauri diretos.

1. Abra **Início** e confira as etapas e categorias sugeridas.
2. Personalize o fluxo em **Configurações Editoriais**, se necessário.
3. Selecione **Nova Pauta**, preencha os campos e escolha **Salvar Pauta no CMS**.
4. Acompanhe a pauta no Kanban e revise o conteúdo no CMS. Fechar o editor sem salvar pode descartar alterações.
5. Para assistência opcional, configure a IA local conforme a seção seguinte.

O [guia de primeiros passos](docs/user-guide/GETTING-STARTED.md) explica as páginas, o salvamento e o tratamento de falhas.

### Somente o frontend

```sh
npm run dev
```

Abra `http://localhost:3000`. O navegador usa a persistência de compatibilidade em `localStorage`, separada do SQLite desktop; não fornece IPC Tauri ou inferência nativa.

`npm run build` gera os arquivos estáticos em `out/`, conforme a [configuração Next.js](next.config.ts). O script `npm start` chama `next start`, incompatível com `output: 'export'`; ele não é o caminho de execução deste projeto. O pacote desktop consome a exportação estática.

### Componentes auxiliares

| Comando ou componente | Função e pré-requisitos |
| --- | --- |
| `npm run dev:desktop` | Fixtures sintéticas em ambiente isolado; exige `DEV_PRIVATE_KEY_HEX` no ambiente ou em `.env.local` e o binário sidecar do target utilizado. Não compartilhe a chave. O [iniciador de fixtures](scripts/dev/start-desktop.mjs) usa a feature `dev-fixtures`; esse caminho é bloqueado em release. |
| `node scripts/packaging/build-local-pilot.mjs --check` | Confere a configuração do piloto e a versão auditada da CLI, sem compilar ou iniciar o aplicativo. |
| `node scripts/packaging/build-local-pilot.mjs --build` | Compila o piloto Windows NSIS sem assinatura e salva recibo, log e artefatos em `.retranca-local/phase65-packaged-pilot/<id>/`. Não instala nem abre o aplicativo. |

O [mock-sidecar](mock-sidecar/Cargo.toml) emite respostas fixas, sem inferência real. O pacote normal exclui esse artefato. O piloto usa `com.jornalistainclusivo.retranca.pilot`, separado do aplicativo normal, e não inclui Ollama ou modelos. O [guia de desenvolvimento](docs/development/LOCAL-DEVELOPMENT.md#private-windows-pilot-build) explica o empacotamento e a diferença entre o executável bruto e o arquivo instalado pelo NSIS.

## IA local

O caminho atual usa **Ollama instalado pela própria pessoa**, em `http://127.0.0.1:11434`. O [contrato nativo de prontidão](src-tauri/src/local_ai_readiness.rs) aceita exatamente os servidores `0.35.1` e `0.40.1`; outras versões são bloqueadas até sua compatibilidade ser validada. Consulte a [decisão do provedor](docs/decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md#compatibility-amendment--2026-10-08).

1. Mantenha o Ollama em execução e o modelo desejado já instalado.
2. Abra **IA local** e use **Atualizar modelos**.
3. Escolha um modelo e selecione **Verificar modelo**; leia o diagnóstico.
4. Preencha os dados exigidos pela ação no editor e solicite a geração. Ao reabrir o aplicativo, selecione o modelo novamente: a escolha vale durante a sessão.

| Ação no editor | Dados mínimos exigidos |
| --- | --- |
| Pesquisar Lacunas | Título ou objetivo. |
| Simplificar Linguagem | Texto completo ou resumo. |
| Validar Inclusividade | Texto completo ou resumo. |
| Alt Text WCAG | Descrição visual escrita. |
| Otimizar Meta Tags SEO | Palavra-chave e texto completo ou resumo. |
| Revisão Editorial | Texto completo e objetivo. |

Esses requisitos são avaliados na [interface](lib/utils/aiActionEvaluator.ts) e na [orquestração Rust](src-tauri/src/orchestrator.rs). A recomendação de uma etapa não substitui os campos exigidos.

Antes de cada geração, o runtime verifica servidor, presença do modelo, metadados locais e capacidade de conclusão textual. O aplicativo não instala, inicia ou atualiza o Ollama nem baixa modelos no fluxo normal. Não há fallback automático para outro modelo ou para uma resposta sintética.

O Alt Text usa uma descrição textual, não os pixels de uma imagem. As respostas aparecem separadas do conteúdo da pauta e não são aplicadas automaticamente. Para guardar uma sugestão, copie a parte desejada, revise-a, incorpore-a ao texto e salve no CMS. Confira fatos, fontes, linguagem e possíveis danos antes de usar o resultado.

## Arquitetura e dados

O frontend usa Next.js 16, React 19 e TypeScript, com exportação estática consumida pelo Tauri 2. Rust fornece comandos IPC e transporte de IA; não há servidor Next.js no pacote desktop. O [cliente de dados](db/client.ts) usa Drizzle no frontend por meio do plugin SQL, e os comandos Rust acessam SQLite pelo mesmo plugin.

No desktop, pautas e catálogos ficam em `<app_config_dir>/retranca.db`, no diretório de configuração resolvido pelo Tauri. O identificador normal é `com.jornalistainclusivo.retranca`; piloto e fixtures usam identidades próprias. Não apague o banco para atualizar o aplicativo.

A descrição visual e as respostas de IA são temporárias. A exportação JSON contém pautas, não o banco completo, catálogos e templates. A importação preserva IDs existentes e exige referências válidas de etapas e categorias no destino. Consulte o [guia de dados e importação](docs/user-guide/GETTING-STARTED.md#seus-dados).

## Verificações disponíveis

Os scripts e o [workflow existente](.github/workflows/ci.yml) permitem executar, na raiz:

```sh
npx --no-install tsc --noEmit --incremental false
npm run lint
npm test
npm run build
npm run lint:rs
npm run test:rs
npm run test:rs:release
```

`lint:rs` executa preparação do SQLite, formatação em modo de conferência e `cargo check --locked`; os scripts de teste Rust também preparam o motor e usam o lockfile. O [guia de desenvolvimento](docs/development/LOCAL-DEVELOPMENT.md#validation-commands) contém também os comandos Cargo individuais para debug e release.

O [Vitest](vitest.config.ts) usa ambiente Node. O CI verifica frontend e Rust em Windows/Ubuntu; não compila nem instala o piloto. A configuração candidata adiciona preparação e checagem de identidade do SQLite nas duas plataformas, mas essa revisão ainda não rodou no GitHub. Esses checks não comprovam acessibilidade completa, qualidade editorial da IA ou prontidão de distribuição. Os [registros de validação](docs/testing/) se aplicam aos commits, ambientes e casos identificados em cada relatório.

## Limitações e trabalho planejado

- **Acessibilidade:** é uma diretriz do projeto, com WCAG 2.2 AA como meta. Há verificações delimitadas de teclado, foco e zoom, mas não uma avaliação completa que comprove conformidade. Checklists, conquistas e sugestões de IA não certificam acessibilidade.
- **Motor embutido real:** permanece uma preferência futura no ADR-016. A implementação atual depende do Ollama externo.
- **Anexos e visão multimodal:** estão em [descoberta de produto](docs/specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md); não integram o fluxo implementado de descrição visual textual.
- **Recuperação e distribuição:** backup/restauração integral, aceite de instalação Linux, assinatura e distribuição pública continuam com critérios pendentes no plano da fase 6.5.
- **Dependências:** o [ADR-018](docs/decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md) registra a rodada de manutenção e suas pendências. Esse documento histórico não é uma confirmação atualizada de todos os alertas de segurança.

<a id="15-licensing-status"></a>

## Documentação e licença

Comece pelo [índice da documentação](docs/README.md), pelo [manual de uso](docs/user-guide/GETTING-STARTED.md) e pelo [guia de desenvolvimento](docs/development/LOCAL-DEVELOPMENT.md). Especificações e decisões registram contratos e intenções; relatórios registram verificações delimitadas. Documentos históricos podem descrever estados já superados.

O código e a documentação próprios do Retranca OS são disponibilizados sob a [licença MIT](LICENSE), com copyright de JINC Apps - Jornalista Inclusivo (2026), em acordo com os manifestos npm e Cargo.

Dependências, runtimes e modelos de IA continuam sujeitos às suas próprias licenças. A revisão desses termos e os demais critérios de distribuição permanecem pendentes; a adoção da MIT não equivale à publicação de uma release.
