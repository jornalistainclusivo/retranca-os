# Retranca OS

Sistema operacional editorial desktop, local-first e accessibility-first para jornalistas, editores e equipes de conteúdo.

## 1. Project overview

Retranca OS é uma plataforma desktop voltada para a produção, organização e revisão de conteúdo editorial. Focado em jornalismo e criação de conteúdo profissional, o projeto consolida segurança de dados, acessibilidade nativa e ferramentas de Inteligência Artificial Editorial em uma experiência unificada e veloz.

## 2. Current project state

A base desta entrega integra a fase 6.4 e o Incremento 1 da 6.5 pelo [PR #5](https://github.com/jornalistainclusivo/retranca-os/pull/5), commit `37b272c`, com os quatro jobs do [CI daquela main](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37248233721) aprovados. Os Incrementos 2 e 3 seguem em `codex/phase-6.5-production-provider-contract`, com integração e marco técnico explicitamente autorizados pelo responsável em 05/10/2026. O [checkpoint de integração](docs/testing/PHASE-6.5-INCREMENTS-2-3-INTEGRATION.md) delimita a entrega e os critérios de revisão/CI/merge/tag; cada conclusão exige o registro correspondente no GitHub.

O Incremento 2 nativo foi publicado em `d944a11` e a interface em `34bf047781e63e2f55f82600b99cff9686204b82`; todos os quatro jobs da revisão da interface passaram no [CI #23 / run 37389383428](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37389383428), conferido pela API do GitHub em 05/10/2026. Seus aceites desktop delimitados estão registrados na [validação da interface](docs/testing/PHASE-6.5-INCREMENT-2-UI-VALIDATION.md). Esse CI antecede a política do Incremento 3 e não valida suas alterações.

O [Incremento 3](docs/specifications/phase-6.5/PHASE-6.5-INCREMENT-3-PRODUCTION-PROVIDER-POLICY.md) aplica o caminho de produção aceito: Ollama instalado pela pessoa, modelo escolhido por ela, sem fallback para o motor de testes. O uso normal não oferece seu download e a configuração padrão não inclui o executável sintético. A **preferência futura por motor embutido** permanece no [ADR-016](docs/decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md). O [relatório desta rodada](docs/testing/PHASE-6.5-INCREMENT-3-PRODUCTION-POLICY-VALIDATION.md) registra verificações locais e os três checks desktop aceitos pelo responsável. A tag planejada `milestone-phase-6.5-increments-2-3` identifica apenas esse marco de código, após merge e CI; não muda a versão `0.1.0` dos manifests. Identidade do servidor/modelo, piloto amplo, licenças e distribuição Windows/Linux permanecem pendentes; nenhuma release com instaladores é incluída.

| Entrega / verificação | Estado atual |
| --- | --- |
| Fluxos dinâmicos, categorias e templates | Implementados na edição aberta, sem conta, assinatura ou ativação comercial ([ADR-013](docs/decisions/ADR-013-OPEN-SINGLE-EDITION.md)). |
| Texto completo por pauta, salvamento e importação preservadora | Implementados; checks desktop informados pelo responsável estão registrados e não precisam ser repetidos apenas para confirmação. |
| Seis ações de IA local, cancelamento, fechamento e inventário de modelos | Implementados; aceites funcionais anteriores preservados. Não equivalem a avaliação completa da qualidade de IA. |
| Prontidão nativa da 6.5 | Publicada em `d944a11` na branch de desenvolvimento, com CI aprovado. Cada geração Ollama verifica servidor `0.35.1`, modelo/capacidade e exige `:local`; versões não auditadas e dados não verificáveis bloqueiam o envio. O responsável informou sucesso nos três checks funcionais: simplificação completa, cancelamento e preservação do texto original. Depende de um daemon confiável; não comprova hardware, qualidade nem identidade atômica do modelo. |
| Diagnóstico e recuperação na IA local | Implementado e validado localmente: comunica verificação, resultado, falha e nova tentativa, preserva a seleção e descarta respostas antigas. Passaram 338 testes, tipos, lint, build estático e 11 checks do componente compilado no Chrome isolado com IPC sintético. Os três checks desktop foram aprovados pelo responsável em 05/10/2026; CI #23 aprovado na revisão publicada `34bf047`; NVDA amplo pendente; não integrado na `main`. |
| Dependências | Firebase de desenvolvimento não utilizado removido; Vitest/UI 4.1.11 e js-yaml 4.3.2. A auditoria npm registrada em 04/10/2026 apontou sete entradas afetadas; a pendência Linux `glib` permanece separada. Nenhuma nova auditoria é alegada nesta rodada. |
| CI integrado | Os quatro jobs passaram em [`37b272c`, run 37248233721](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37248233721): frontend, Rust Windows/Linux e agregador `rust`. Esse merge inclui o corretivo de fechamento e o Incremento 1. |
| CI nativo do Incremento 2 | Os quatro jobs passaram em [`d944a11`, run 37356369629](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37356369629), conferido pela API do GitHub. A execução se aplica ao commit publicado; não valida alterações posteriores nem um instalador. |
| Rodada de fechamento | Rótulos do CMS/template e abertura do calendário por teclado corrigidos. Passaram 289 testes, tipos, lint, build e amostra de teclado/reflow no Chrome isolado. O responsável também aprovou os três checks delimitados no desktop com NVDA 2026.2 e teclado. |
| PR, aceitação e merge | PR #5 integrado; Gate B aprovado para aquela integração limitada de código e Gate C concluído. Os Incrementos 2 e 3 têm aceite delimitado e autorização explícita de consolidação/CI/PR/merge/tag, sujeitos à revisão e aos checks da nova revisão. Validação ampla e release distribuível permanecem pendentes. |

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

O banco SQLite reside em `<app_config_dir>/retranca.db` — em Linux, `~/.config/com.jornalistainclusivo.retranca/`. Remover esse arquivo reinicializa o estado local e força uma nova semeadura.

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
