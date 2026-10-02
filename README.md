# Retranca OS

Sistema operacional editorial desktop, local-first e accessibility-first para jornalistas, editores e equipes de conteúdo.

## 1. Project overview

Retranca OS é uma plataforma desktop voltada para a produção, organização e revisão de conteúdo editorial. Focado em jornalismo e criação de conteúdo profissional, o projeto consolida segurança de dados, acessibilidade nativa e ferramentas de Inteligência Artificial Editorial em uma experiência unificada e veloz.

## 2. Current project state

Rodada de importação local (02/10/2026): [ADR-015](docs/decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md) registra o padrão conservador: adicionar pautas novas e preservar integralmente as já existentes, com gravação atômica no SQLite desktop. Pautas reais, banco, backups e anexos ficam locais; o GitHub recebe código, documentação e testes fictícios. Consulte os [resultados e três testes no AntiGravity](docs/testing/PHASE-6.4-LOCAL-IMPORT-VALIDATION.md). A fase 6.5 tem um [plano preliminar](docs/architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md); aceite desktop da importação, revisão completa e instalador/motor real continuam pendentes.

A branch `feat/phase-6.4-pro-workflow-customization` está na fase 6.4: fluxos dinâmicos, categorias e templates, com edição única aberta aprovada em 30/09/2026. Todas as funcionalidades implementadas ficam disponíveis sem conta, assinatura ou ativação; IA local depende de runtime/modelo configurado e evidências válidas. O nome histórico da branch foi mantido. Consulte o [ADR-013](docs/decisions/ADR-013-OPEN-SINGLE-EDITION.md) e o [checkpoint do Slice 8](docs/testing/PHASE-6.4-SLICE-8-HARDENING-VALIDATION.md). Os testes automatizados locais passaram; fechamento de acessibilidade/runtime, Gate B e autorização de merge/release continuam pendentes.

Em 01/10/2026, o checkpoint foi salvo em `ac453e8` e a rodada de cancelamento nativo Ollama/foco em `8e22c18`. O responsável pelo produto confirmou os três testes desktop daquela rodada (`1 ok; 2 ok; 3 ok`), autorizou os pushes e o CI manual; Windows/Linux/frontend passaram no código de `8e22c18`. A documentação foi publicada em `543d033`. Consulte o [relatório de cancelamento/foco](docs/testing/PHASE-6.4-SLICE-8-CANCELLATION-FOCUS-VALIDATION.md). Os testes de transporte não garantem interrupção do processamento no servidor Ollama.

A correção seguinte separa **Conteúdo para análise (Texto completo)** por pauta e inclui seu salvamento após reiniciar, conforme o [ADR-014](docs/decisions/ADR-014-ARTICLE-CMS-CONTENT-PERSISTENCE.md). A implementação foi validada localmente e o responsável informou os três testes como aprovados (`1 OK; 2 OK; 3 OK`, 01/10/2026), autorizando continuar o desenvolvimento. A revisão acrescentou proteção contra dados JSON inválidos e salvamentos de sessões antigas; 236 testes de frontend, lint, tipos e build passaram. O agente não executou a migração nem inspecionou o banco/backup editorial. O responsável autorizou separadamente commit, push e CI manual de `c03c928`; os quatro jobs passaram no [run 36940623994](https://github.com/jornalistainclusivo/retranca-os/actions/runs/36940623994), reconfirmado em 02/10/2026. Gate B completo continua pendente. Consulte o [relatório e roteiro no AntiGravity](docs/testing/PHASE-6.4-ARTICLE-CONTENT-VALIDATION.md) e o [resultado da revisão, correções e limites](docs/testing/PHASE-6.4-ARTICLE-CONTENT-REVIEW.md). Naquele checkpoint, a importação JSON era restrita ao estado visual/navegador; o ADR-015 documenta a implementação posterior no SQLite, preservando pautas existentes, sem restauração integral do banco. Anexos de imagens/textos/documentos estão em [levantamento de escopo](docs/specifications/ARTICLE-ATTACHMENTS-DISCOVERY.md), sem implementação nesta rodada.

Retomada de 02/10/2026: `gemma4:latest` foi confirmado no inventário local. A rodada corrige o rótulo antigo no rodapé e os indicadores de carregamento/movimento reduzido. O responsável informou que as seis ações de IA funcionam e relatou uma falha ao salvar no CMS. Foi reproduzida uma colisão de IDs de checklist entre pautas; a correção usa IDs únicos e resolve conflitos antigos antes de gravar, preservando registros de outras pautas e históricos existentes. “Recomendado” foi removido de **Pesquisar Lacunas**, conforme solicitado. Os 247 testes de frontend, lint, tipos, build e verificação com SQLite descartável passaram; o responsável confirmou os três checks de salvar/reabrir, separar outra pauta e manter os textos após reiniciar (`1 OK, 2 OK, 3 OK`). O [registro da rodada](docs/testing/PHASE-6.4-SLICE-8-RESUMPTION-VALIDATION.md) separa CI anterior, verificações locais e aceite informado pelo responsável. A rodada foi salva/publicada em `0891740` com autorizações explícitas; os quatro jobs passaram no [CI 37064072955](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37064072955), reconfirmado no SHA completo em 02/10/2026. Gate B permanece pendente. Não é necessário repetir os testes já aceitos.

Baseline já integrado na `main`:

A versão atual reflete a estabilização da Fase 6.3 no baseline principal (`main`).
**Phase 6.3 integrated into main**
**tag:** `v0.1.0-phase-6.3-editorial-ai-orchestration`

Nesta fase, a orquestração segura de ferramentas de IA Editorial foi finalizada, isolando a interface de usuário da execução e validação da IA através de uma fronteira confiável em Rust. (Nota: Implementações legadas utilizando a API do Gemini como backend padrão de IA ou Cloud Run foram totalmente descontinuadas e substituídas por esta arquitetura local/desktop; qualquer menção a eles na base documental é puramente de caráter histórico).

## 3. Editorial workflow

O fluxo de trabalho foi desenhado para maximizar a ergonomia cognitiva e a atenção aos detalhes. Ele suporta a criação de rascunhos, revisões estruturais e aplicação de metadados focados na distribuição (como alt-text, linguagem simples e checagens anti-viés).

## 4. Local-first persistence

O projeto opera sob o princípio local-first. O armazenamento de artigos, rascunhos e configurações ocorre primariamente no dispositivo do jornalista. A camada de persistência utiliza um banco de dados SQLite local, orquestrado e gerenciado por Drizzle ORM integrado nativamente através do Tauri SQL Plugin.

Na implementação do ADR-014, **Salvar Pauta no CMS** inclui o texto completo daquela pauta. A atualização do SQLite para schema 2 cria um backup junto ao banco antes de acrescentar o campo; dados antigos começam com texto completo vazio. A aplicação dessa migração ao banco editorial exige confirmação separada antes de iniciar a nova versão. Fechar sem salvar descarta a edição do texto; a descrição visual continua temporária e vinculada à sua pauta.

## 5. Editorial AI

A Inteligência Artificial atua como um supervisor assíncrono durante a produção. Estão ativas as seguintes **six Phase 6.3 actions**:
- Research Gaps
- Plain Language
- Inclusive Validator
- Alt Text WCAG (suporta exclusivamente evidências de alt text textuais `visual_description`, sem visão multimodal local)
- SEO
- Editorial Review

## 6. Local AI architecture

A arquitetura de IA local implementa mitigação estrutural contra injeções de prompt e limites de uso: a separação entre contexto e prompt trata os dados editoriais do CMS como não-confiáveis, mantendo a política de ação do sistema isolada do conteúdo. O uso de escapes protege os delimitadores estruturais, porém isso NÃO garante imunidade semântica contra interpretação adversarial pelo LLM:
- **Rust-authoritative editorial orchestration:** O frontend atua estritamente coletando UX e conteúdo; o backend em Rust (`src-tauri/`) cria a política de contexto, valida a matriz de pré-requisitos, impõe limites (context budgeting) e engloba o payload com as instruções estáticas e o output esperado de maneira segura.
- **Ollama / local runtime capability & Sidecar architecture:** A arquitetura provê compatibilidade com modelos hospedados via Ollama ou executáveis sidecar locais. O frontend **não** chama o Ollama diretamente (porta 11434 não é acessada via frontend); todo o IPC transita de forma controlada via Tauri.

**Invariantes de infraestrutura e provedores:**
- Ollama capability != provider selection
- provider selection != Retranca provisioning
- Retranca provisioning != ModelStatus.READY

(Nota: Detectar que o Ollama está presente na máquina não significa que ele está selecionado, provisionado ou pronto para uso. O modelo não é selecionado de forma automática, nem possui fallback automático de download ou pull hardcoded).

## 7. Accessibility

A acessibilidade não é um complemento, mas uma diretriz nativa. O projeto tem **WCAG 2.2** como architectural/product requirement (não se trata de uma certificação formal de conformidade, mas de um guia metodológico estrito no ciclo de desenvolvimento, focando em usabilidade motora e cognitiva).

## 8. Architecture / tech stack

O stack moderno do Retranca OS baseia-se em tecnologias focadas em performance e baixo consumo de recursos na ponta:
- **Tauri v2** (Desktop App Foundation)
- **Rust trusted boundary** (IPC, segurança, orquestração e orçamentação)
- **Next.js 16** (App Router com `static export` obrigatório)
- **React 19**
- **TypeScript** (Tipagem estrita full-stack)
- **SQLite** com **Tauri SQL Plugin** e **Drizzle ORM** (Persistência)

## 9. Development prerequisites

- Node.js e NPM
- Rust / Cargo
- Variáveis de ambiente secretas **não** são necessárias (`GEMINI_API_KEY` etc., não são requisitos para rodar localmente na arquitetura atual).

**System dependencies (Linux / Debian & Ubuntu):**

O Tauri v2 exige as bibliotecas nativas do WebKitGTK, que não acompanham uma instalação padrão:

```bash
sudo apt install -y pkg-config build-essential curl wget file \
  libwebkit2gtk-4.1-dev libsoup-3.0-dev librsvg2-dev \
  libayatana-appindicator3-dev libssl-dev
```

(Nota: Ubuntu 22.04 LTS e posteriores já trazem `libwebkit2gtk-4.1-dev` nos repositórios oficiais; não é necessário adicionar PPA. Verificação rápida: `pkg-config --modversion webkit2gtk-4.1`).

## 10. Development commands

```bash
# Inicializar o desktop com os arquivos locais atuais:
npx tauri dev
```

O Tauri inicia o frontend automaticamente. Para IA real, mantenha o Ollama em execução, confira os modelos instalados com `ollama list` e selecione um deles no controle **IA local**. A seleção é válida durante a sessão; ao reiniciar o aplicativo, selecione novamente. Não é necessário fazer commit para visualizar alterações locais.

`npm run dev:desktop` também inicia `scripts/dev/model-fixture-server.mjs`, um servidor de fixtures de provisionamento para desenvolvimento. Para verificar um modelo real já instalado no Ollama, use `npx tauri dev`. `npm run dev` isoladamente abre apenas o frontend web, sem o runtime nativo de inferência.

**Sidecar binary (required by the build):**

O `tauri.conf.json` declara `externalBin: ["bin/llama-sidecar"]`, e o Tauri resolve essa entrada acrescentando o *target triple* da máquina. Se o artefato correspondente não existir, o build script aborta antes de a janela ser criada:

```
resource path `bin/llama-sidecar-<target-triple>` doesn't exist
```

O repositório versiona apenas o artefato de Windows. Em outras plataformas, compile o `mock-sidecar/` incluído no projeto:

```bash
cargo build --release --manifest-path mock-sidecar/Cargo.toml
cp mock-sidecar/target/release/mock-sidecar \
   "src-tauri/bin/llama-sidecar-$(rustc -vV | grep '^host: ' | cut -d' ' -f2)"
```

(Nota: o mock emite tokens fixos via stdout e serve apenas para satisfazer o build e exercitar o streaming. Ele não executa inferência real — para isso, utilize o provider Ollama conforme a seção 6).

**Local state:**

O banco SQLite reside em `<app_config_dir>/retranca.db` — em Linux, `~/.config/com.jornalistainclusivo.retranca/`. Remover esse arquivo reinicializa o estado local e força uma nova semeadura.

## 11. Validation commands

Para verificar a integridade antes de cometer código (sempre exigida para pull requests):

**Frontend Validation:**
```bash
npm run lint
npm test
npm run build
```

**Rust Validation (Locked Dependencies):**
```bash
cd src-tauri
cargo fmt --check
cargo check --locked
cargo test --locked
cargo check --release --locked
cargo test --release --locked
```

## 12. Documentation

O diretório `/docs` é a espinha dorsal de conhecimento arquitetural do projeto.
- `/docs` contains product, architecture, governance, decisions and phase specifications;
- newer approved phase-specific specifications and ADRs may supersede older root-level descriptions;
- historical documents should not automatically be interpreted as current implementation truth.

## 13. Immediate roadmap

- **Phase 6.4:** Dynamic workflow, categories, checklist templates and AI recommendation semantics in one open edition (ADR-013); remaining integration/security review in Slice 8.
- **Phase 6.5:** Production Provider & Model Experience

## 14. Governance

Qualquer evolução do core e componentes está sujeita às restrições do protocolo de desenvolvimento, não devendo assumir que pastas como `components/` são absolutamente imutáveis, porém submetidas a revisão profunda sob os princípios da Arquitetura Limpa.

## 15. Licensing status

No LICENSE file is currently published and licensing terms are not yet formally declared. (O projeto não possui uma licença MIT formal neste momento).
