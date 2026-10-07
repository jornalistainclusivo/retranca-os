# Retranca OS

Sistema operacional editorial desktop, local-first e accessibility-first para jornalistas, editores e equipes de conteúdo.

## 1. Project overview

Retranca OS é uma plataforma desktop voltada para a produção, organização e revisão de conteúdo editorial. Focado em jornalismo e criação de conteúdo profissional, o projeto consolida segurança de dados, acessibilidade nativa e ferramentas de Inteligência Artificial Editorial em uma experiência unificada e veloz.

## 2. Current project state

Retomada após o CI da manutenção, em 07/10/2026: a `main` está em `5f7ba349acafe2dc45b9bbadd3271bac4440d86a`, e os quatro jobs do CI #31 foram confirmados pela API do GitHub. A branch `codex/phase-6.5-runtime-pilot` permanece em `71d25c088887231001329ae3d9fc659dcc6ad5a5`, com correções/Início e pacote fonte publicados e os quatro jobs do CI #28 aprovados. Esta revisão incorpora a `main` nessa branch, com autorização explícita para o merge e commit local, preservando os três commits publicados dos Incrementos 4–5. Push e CI da revisão combinada continuam pendentes de autorização e verificação próprias. Os registros abaixo mantêm o histórico das rodadas; a evidência de instalação não é automaticamente transferida para um binário ainda não recompilado.

Retomada de 07/10/2026: as correções locais do review A–D e a página **Início** estão implementadas, preservando a rodada pendente do pacote. A abertura carrega os catálogos antes da criação, sem inserir pautas de exemplo; registros antigos sem vínculos ficam visíveis para conferência. Categorias sugeridas passam a ser editáveis, com identidade estável e destino obrigatório quando há pautas associadas. Início aparece primeiro na navegação, seguido do Kanban, e reúne orientações, atalhos e conquistas derivadas de pautas salvas. O [ADR-017](docs/decisions/ADR-017-OPEN-EDITORIAL-STARTUP-AND-CATEGORY-CUSTOMIZATION.md), a [especificação](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME.md) e a [validação com roteiro do instalador atualizado](docs/testing/PHASE-6.5-INCREMENT-5-STARTUP-AND-HOME-VALIDATION.md) registram decisões, resultados e limites. O responsável confirmou `1 OK; 2 OK; 3 OK` para os três checks do piloto Windows corrigido em 07/10/2026 e autorizou separadamente seu commit local. As correções estão no código compartilhado pelo desenvolvimento local e pelo piloto; um executável previamente instalado precisa ser recompilado/atualizado para incorporá-las. A publicação dessa rodada ocorreu em `71d25c0`, com CI #28 aprovado; integração na `main`, distribuição pública e validações mais amplas continuam separadas.

A fase 6.4 e os Incrementos 1–3 da 6.5 estão integrados na `main`. O [PR #6](https://github.com/jornalistainclusivo/retranca-os/pull/6) acrescentou prontidão nativa, diagnóstico/recuperação e política do provedor no commit `1b7de720ff8f87060cd2f945b8c65ec598679471`, preservando a base do PR #5. Os quatro jobs passaram no [CI #25 da main](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37523157693). A tag anotada [milestone-phase-6.5-increments-2-3](https://github.com/jornalistainclusivo/retranca-os/tree/milestone-phase-6.5-increments-2-3) foi publicada no mesmo merge. O [registro de integração](docs/testing/PHASE-6.5-INCREMENTS-2-3-INTEGRATION.md) reúne identidades, aceites e limites; esse marco não é uma release com instaladores nem a conclusão de toda a 6.5.

O Incremento 2 nativo foi publicado em `d944a11` e a interface em `34bf047781e63e2f55f82600b99cff9686204b82`; todos os quatro jobs da revisão da interface passaram no [CI #23 / run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428), conferido pela API do GitHub em 05/10/2026. Seus aceites desktop delimitados estão registrados na [validação da interface](docs/testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md). Esse CI antecede a política do Incremento 3 e não valida suas alterações.

O [Incremento 3](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-3-PRODUCTION-PROVIDER-POLICY.md) aplica o caminho de produção aceito: Ollama instalado pela pessoa, modelo escolhido por ela, sem fallback para o motor de testes. O uso normal não oferece seu download e a configuração padrão não inclui o executável sintético. A **preferência futura por motor embutido** permanece no [ADR-016](docs/decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md). Seu [relatório](docs/testing/PHASE-6.5-INCREMENT-3-PRODUCTION-POLICY-VALIDATION.md) registra verificações locais e os três checks desktop aceitos. A tag publicada identifica esse marco de código e preserva `0.1.0` nos manifests.

A próxima entrega, [Incremento 4](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE.md), está em `codex/phase-6.5-runtime-pilot`: um coletor Rust de metadados reutiliza a autoridade nativa para observar inventário e prontidão do modelo escolhido. Ele não recebe textos, gera respostas, baixa modelos ou abre o banco editorial. Sua [validação](docs/testing/PHASE-6.5-INCREMENT-4-RUNTIME-EVIDENCE-VALIDATION.md) separa compilação, consulta local e evidência ainda necessária de inferência/qualidade/instalação. Identidade operacional completa, piloto representativo, licenças e distribuição Windows/Linux continuam pendentes.

O coletor foi publicado em `82d1a00`, com os quatro jobs do [CI #26](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37530233063) aprovados após autorizações separadas. A rodada seguinte executou um [piloto nativo delimitado](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-4-NATIVE-PILOT.md) com `gemma4:latest`, três casos sintéticos e limites de geração/cancelamento/recuperação. O [registro do piloto](docs/testing/PHASE-6.5-INCREMENT-4-NATIVE-PILOT-VALIDATION.md) distingue os três resultados operacionais aprovados e o aceite informado pelo responsável das duas respostas completas em 2026-10-06; o trecho cancelado permanece sem revisão editorial. O teste fica desativado por padrão; respostas geradas permanecem locais. O CI do coletor não valida essa rodada posterior.

O piloto nativo foi publicado em `6d0a4f3`, com os quatro jobs do [CI #27](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37537545421) aprovados. O [Incremento 5](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-5-PACKAGED-PILOT.md) prepara **Retranca OS Pilot**, um pacote Windows local com identificador e dados separados, para testar a aplicação instalada com textos sintéticos. O comando `node scripts/packaging/build-local-pilot.mjs --check` verifica a configuração; `--build` solicita a compilação local e não instala o programa. A [validação do pacote](docs/testing/PHASE-6.5-INCREMENT-5-PACKAGED-PILOT-VALIDATION.md) registra compilação e aceite humano separadamente. O piloto requer WebView2 já instalado; distribuição pública e Linux continuam pendentes.

| Entrega / verificação | Estado atual |
| --- | --- |
| Fluxos dinâmicos, categorias e templates | Implementados na edição aberta, sem conta, assinatura ou ativação comercial ([ADR-013](docs/decisions/ADR-013-OPEN-SINGLE-EDITION.md)). |
| Texto completo por pauta, salvamento e importação preservadora | Implementados; checks desktop informados pelo responsável estão registrados e não precisam ser repetidos apenas para confirmação. |
| Seis ações de IA local, cancelamento, fechamento e inventário de modelos | Implementados; aceites funcionais anteriores preservados. Não equivalem a avaliação completa da qualidade de IA. |
| Prontidão nativa da 6.5 | Integrada na `main` pelo PR #6, com CI #25 aprovado. Cada geração Ollama verifica servidor `0.35.1`, modelo/capacidade e exige `:local`; versões não auditadas e dados não verificáveis bloqueiam o envio. O responsável informou sucesso nos três checks funcionais: simplificação completa, cancelamento e preservação do texto original. Depende de um daemon confiável; não comprova hardware, qualidade nem identidade atômica do modelo. |
| Diagnóstico e recuperação na IA local | Integrado na `main`: comunica verificação, resultado, falha e nova tentativa, preserva a seleção e descarta respostas antigas. A rodada da interface passou 338 testes, tipos, lint, build estático e 11 checks do componente compilado no Chrome isolado com IPC sintético. Os três checks desktop foram aprovados pelo responsável em 05/10/2026; CI #23 validou `34bf047` e CI #25 validou o merge; NVDA amplo pendente. |
| Dependências | A manutenção do [PR #7](https://github.com/jornalistainclusivo/retranca-os/pull/7) está integrada na `main` em `5f7ba34`, com [CI #31](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37695557140) aprovado. Sete registros originais receberam versões corrigidas; `glib` 0.18.5 e a cadeia adicional `braces` permanecem pendências documentadas no [ADR-018](docs/decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md). O resultado do CI não prova fechamento de todos os alertas nem atualização do piloto instalado. |
| CI integrado | Os quatro jobs passaram em [`5f7ba34`, CI #31](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37695557140): frontend, Rust Windows/Linux e agregador `rust`. A `main` preserva a fase 6.4 e os Incrementos 1–3; os Incrementos 4–5 permanecem publicados na branch `codex/phase-6.5-runtime-pilot`, aprovados no [CI #28](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37657094508) em `71d25c0`. O CI da futura revisão combinada exige verificação própria. |
| CI nativo do Incremento 2 | Os quatro jobs passaram em [`d944a11`, run 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629), conferido pela API do GitHub. A execução se aplica ao commit publicado; não valida alterações posteriores nem um instalador. |
| Rodada de fechamento | Rótulos do CMS/template e abertura do calendário por teclado corrigidos. Passaram 289 testes, tipos, lint, build e amostra de teclado/reflow no Chrome isolado. O responsável também aprovou os três checks delimitados no desktop com NVDA 2026.2 e teclado. |
| PR, aceitação e merge | PRs #5 e #6 integrados; aceites delimitados e revisão/CI da entrega registrados. O marco técnico dos Incrementos 2 e 3 foi publicado. Validação ampla e release distribuível permanecem pendentes; a próxima rodada exige sua própria verificação/publicação. |

O [candidato de fechamento](docs/testing/PHASE-6.4-CLOSURE-2026-10-04.md) é o ponto de entrada para resultados, limites, decisões propostas e o novo roteiro desktop. A [revisão de segurança](docs/security/PHASE-6.4-GATE-B-REVIEW-2026-10-03.md) mantém seu intervalo imutável; a [correção de dependências](docs/testing/PHASE-6.4-RESUMPTION-2026-10-04.md) registra o lock e as verificações anteriores. Os registros de IA/CMS/importação/inventário permanecem em `docs/testing`; seus aceites se aplicam às revisões e ambientes identificados.

O baseline anterior desta entrega é a fase 6.3. A assistência atual usa uma fronteira confiável em Rust; APIs legadas de Gemini/Cloud Run foram removidas do fluxo. Menções históricas não representam a arquitetura implementada.

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
- **Ollama como caminho normal:** Rust verifica cada geração usando o servidor/modelo local suportado; o frontend acessa a IA por IPC Tauri. O sidecar atual emite respostas sintéticas e fica restrito ao modo explícito de testes, sem ser incluído no pacote padrão. O motor embutido real permanece previsto para uma entrega futura.

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

## 9. Platforms and development prerequisites

| Sistema | Evidência disponível | Limite |
| --- | --- | --- |
| Windows | Operação desktop em desenvolvimento informada pelo responsável; Rust debug/release e frontend passam no CI identificado acima. | Instalador, instalação limpa, atualização e recuperação não validados nesta rodada. |
| Linux | Rust debug/release passam no CI Ubuntu, com bibliotecas nativas e mock sidecar. A revisão estática das 442 fontes resolvidas não encontrou chamadas externas ao iterador afetado do `glib`. | Execução desktop humana, instalador e motor real não demonstrados por esse CI; `glib` 0.18.5 permanece afetado e exige manutenção compatível. |

O CI verifica código e testes; não executa `tauri build`, instalação de bundles nem publicação de binários. Essas evidências não justificam prometer instaladores Windows/Linux prontos para distribuição. Uma tag de marco pode ser considerada depois do merge autorizado; não é necessária para integrar código. Release com binários depende de validação própria, decisão de licença e resolução dos riscos aplicáveis.

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

`npm run dev:desktop` inicia apenas o ambiente explícito de fixtures sintéticas: servidor de provisionamento, feature `dev-fixtures` e configuração `src-tauri/tauri.fixture.conf.json`, com identidade e diretório de dados separados. Ele não abre suas pautas do ambiente normal. Para usar seu Ollama e suas pautas, use `npx tauri dev`. `npm run dev` isoladamente abre apenas o frontend web, sem o runtime nativo de inferência.

**Sidecar binary (explicit developer fixtures only):**

O `tauri.conf.json` padrão declara `externalBin: []`: o desktop normal e seu build não exigem nem incluem o mock. A configuração explícita de fixtures declara `externalBin: ["bin/llama-sidecar"]`; só nesse modo o Tauri precisa do artefato com o *target triple* da máquina. Se ele estiver ausente, o build de fixtures falha com:

```
resource path `bin/llama-sidecar-<target-triple>` doesn't exist
```

O repositório preserva o artefato de teste de Windows. Para exercitar fixtures em outras plataformas, compile o `mock-sidecar/` incluído no projeto:

```bash
cargo build --release --manifest-path mock-sidecar/Cargo.toml
cp mock-sidecar/target/release/mock-sidecar \
   "src-tauri/bin/llama-sidecar-$(rustc -vV | grep '^host: ' | cut -d' ' -f2)"
```

(Nota: o mock emite tokens fixos via stdout e serve apenas para exercitar testes de streaming/provisionamento. Não executa inferência real. Rust rejeita esse caminho em release mesmo com a feature solicitada; o uso normal de IA permanece no Ollama, com verificação a cada geração).

**Local state:**

O banco SQLite reside em `<app_config_dir>/retranca.db` — em Linux, `~/.config/com.jornalistainclusivo.retranca/`. O aplicativo inicializa os catálogos quando necessário e preserva um workspace sem pautas; não insere exemplos automaticamente. Não remova esse arquivo para atualizar o aplicativo: ele contém os dados editoriais locais.

## 11. Validation commands

Para verificar a integridade antes de cometer código (sempre exigida para pull requests):

**Frontend Validation:**
```bash
npx tsc --noEmit --incremental false
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

- **Phase 6.4:** Integrada na main pelo PR #5, com aceitação limitada ao código. Manutenção de dependências, acessibilidade ampla e distribuição seguem explicitamente pendentes.
- **Phase 6.5:** Production Provider & Model Experience. Preservar o Incremento 1; primeiro caminho com Ollama instalado pela pessoa, mantendo motor embutido como preferência futura. Detalhar prontidão/proveniência/capacidade antes de alterar comportamento; instalação e distribuição exigem evidência própria.

## 14. Governance

Qualquer evolução do core e componentes está sujeita às restrições do protocolo de desenvolvimento, não devendo assumir que pastas como `components/` são absolutamente imutáveis, porém submetidas a revisão profunda sob os princípios da Arquitetura Limpa.

## 15. Licensing status

No LICENSE file is currently published and licensing terms are not yet formally declared. (O projeto não possui uma licença MIT formal neste momento).
