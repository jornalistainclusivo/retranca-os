# Fase 6.5 — Incremento 8: backup do espaço editorial

Data inicial: 2026-10-09; checkpoint: 2026-10-11 (America/Sao_Paulo). **Status: núcleos 8A/8B publicados e aprovados em CI; início 8C de criação/verificação interna, com controlador, IPC e painel publicados em `5efa88d`, validados localmente e aprovados em CI própria. A amostra instalada Windows de criação/verificação passou em 2026-10-11; validação representativa, restauração ativa e cópia externa continuam pendentes.**

Base da implementação 8B: `b9d1464a341f6606cd04d7dea74a69b66da0a8c4`, publicado em `codex/phase-6.5-workspace-backup`, com os quatro jobs do [CI](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38006207453) aprovados. A preparação inicial partiu de `9768a87`. O [PR #14](https://github.com/jornalistainclusivo/retranca-os/pull/14) continua aberto em Draft com README/manutenção Next; os commits de backup/build permanecem separados dele. A main verificada permanece em `96a309384ccb7b337dcce65b39a7519eb1ac02d7`. A revisão 8B foi depois publicada como `d7be11c155927d8c58d488aa04d18626d8b6162e` e passou os quatro jobs de [CI própria](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38065205746). O responsável escolheu começar o 8C pela criação/verificação de backups internos; as mudanças 8C foram depois publicadas em `5efa88d` e aprovadas em [CI própria](#publicação-e-ci-do-início-8c--2026-10-10), separada da CI 8B.

## Objetivo e alcance

Permitir preservar e recuperar o espaço editorial persistido no desktop, incluindo configurações e relações além das pautas. Primeiro preparar o núcleo de backup e sua verificação em bancos descartáveis; depois validar recuperação em outro diretório descartável. Uma operação que substitua o banco em uso exige desenho final revisado e confirmação específica da pessoa responsável.

Esta proposta não amplia a importação de pautas nem altera a [ADR-015](../../decisions/ADR-015-LOCAL-ARTICLE-IMPORT-PRESERVATION.md). A regra aceita continua sendo incorporar IDs novos e preservar os registros existentes. A ADR-015 estabelece: “A database restore/reset requires a separately reviewed design and owner authorization.”

## Evidência da implementação atual

| Fonte inspecionada | O que demonstra | Consequência para o incremento |
| --- | --- | --- |
| [Esquema Drizzle](../../../db/schema.ts) e [inicialização do banco](../../../db/client.ts) | Oito tabelas editoriais; o conteúdo de análise pertence à pauta. | Não usar somente a coleção mostrada no Header como backup integral. |
| [Carga do espaço editorial](../../../lib/api/editorialWorkspace.ts) | A projeção de etapas e categorias para a interface filtra entidades inativas. | Ler o banco completo; preservar também entidades inativas e registros com referências não resolvidas. |
| [Armazenamento e exportação](../../../lib/storage.ts), [Header](../../../components/Header.tsx) e ADR-015 | O JSON existente exporta pautas; a importação é conservadora. | Manter essa função e seu formato separados do backup. |
| [Migração 6.4](../../../db/migrations/phase64Migrate.ts) e [migração do conteúdo](../../../src-tauri/src/article_content.rs) | Já usam `VACUUM INTO` antes de suas alterações de schema. | Reaproveitar a abordagem de cópia consistente; os backups de migração não são um fluxo geral de recuperação. |
| [Pool nativo](../../../src-tauri/src/phase64.rs), [API de pautas](../../../lib/api/articles.ts) e [API de governança](../../../lib/api/governance.ts) | Há escritas nativas e escritas pelo plugin SQL/Drizzle. | Um bloqueio apenas nos novos comandos Rust não impede todas as escritas durante uma restauração. |
| [Configuração normal](../../../src-tauri/tauri.conf.json), [Pilot](../../../src-tauri/tauri.pilot.conf.json) e [fixtures](../../../src-tauri/tauri.fixture.conf.json) | Os identificadores das aplicações são diferentes. | Identificar a origem de cada backup e impedir troca silenciosa de dados entre aplicações. |
| [Testes de conteúdo](../../../src-tauri/tests/article_content.rs) e [importação](../../../src-tauri/tests/article_import.rs) | Existem cenários sintéticos em arquivos SQLite temporários, com escopos próprios. | Aproveitar o padrão de isolamento; criar cobertura específica das oito tabelas, sem atribuir estes cenários ao futuro backup. |

As fontes foram inspecionadas. Nenhum banco, backup, exportação ou conteúdo editorial real foi lido ou modificado nesta preparação. Os cenários 8A/8B executados usam bancos e diretórios descartáveis; nenhuma substituição do banco ativo ou operação sobre os dados do responsável foi realizada.

## Estado do protótipo 8A e validação local

O [núcleo Rust](../../../src-tauri/src/workspace_backup.rs) implementa `create_workspace_backup_pool` e `verify_workspace_backup`, exportados pelo módulo da biblioteca. No checkpoint inicial 8A, nenhum deles estava registrado em `generate_handler!` e o chamador era código nativo de teste, com pool/diretório temporários. O início 8C descrito abaixo acrescenta um controlador e comandos próprios para criação/verificação interna com destino resolvido pelo nativo; a substituição do banco ativo continua ausente.

O núcleo cria diretórios exclusivos por UUID, usa `VACUUM INTO ?`, verifica a cópia e escreve recibo com origem informada pelo chamador, versão do aplicativo/SQLite, schema, contagens, tamanho e hashes. A verificação exige schema 2, as oito tabelas esperadas e `quick_check` válido; confere bytes, metadados e origem do recibo. Isso não valida integralmente colunas, constraints, triggers ou compatibilidade para restaurar um arquivo não confiável. A origem no recibo também não é autenticação.

Os [testes específicos](../../../src-tauri/tests/workspace_backup.rs) extraem apenas o SQL literal de inicialização/migração dos arquivos rastreados e o executam em arquivos SQLite descartáveis. Não inicializam Tauri nem acessam o diretório de dados da aplicação.

| Primeira verificação — Windows x64, build padrão | Resultado e limite |
| --- | --- |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --offline --test workspace_backup -- --nocapture` | Nove testes passaram; build de teste/debug, sem instalador ou execução do aplicativo. |
| Preservação e reabertura | Conteúdo de todas as colunas das oito tabelas e objetos de schema comparados; Unicode, multiline, nulos, IDs/datas e referências a entidades inativas preservados. |
| WAL e independência | Snapshot inclui a alteração confirmada enquanto um leitor mantém snapshot anterior; alterações posteriores e novos backups não reescrevem a cópia antiga. Não é reprodução do WAL-reset bug abaixo. |
| Banco sem pautas | Mantém coleções vazias e configurações existentes, sem inserir exemplos. |
| Rejeições | Schema futuro, tabela ausente/adicional, destino ocupado/relativo, origem incompatível, bytes/contagens/formato divergentes e recibo ausente/excessivo. |
| Sincronização | `synchronous=OFF` recusado antes de criar diretório/arquivo de backup. |
| SQLite efetivamente vinculado ao teste | `sqlite_version()` reportou **3.46.0**; o recibo registra essa versão. |

O compilador emitiu o aviso herdado de `unused_mut` em `src-tauri/src/provisioning/download.rs:93`; esse arquivo permanece preservado. Falta validar interrupção real de processo, falta de espaço, tempo/tamanho em amostras maiores, bloqueios, corridas de filesystem, Windows/Linux instalados; a validação GNU do núcleo 8A foi posteriormente aprovada no CI de `b9d1464`. O protótipo rejeita links/reparse points na inspeção de caminho, mas isso não comprova eliminação de corridas entre inspeção e abertura. Não há sincronização comprovada do diretório após publicação do recibo nem protocolo de restauração do banco ativo.

### Pendência de SQLite antes da exposição em produção

A árvore do app conserva `sqlx 0.8.6 → sqlx-sqlite 0.8.6 → libsqlite3-sys 0.30.1`, também utilizada por `tauri-plugin-sql 2.4.0`. A primeira inspeção usou `cargo tree --manifest-path src-tauri/Cargo.toml --locked --offline --invert libsqlite3-sys`, antes das mudanças de build descritas abaixo.

A [documentação oficial do WAL-reset bug](https://www.sqlite.org/wal.html), consultada em 2026-10-09, inclui SQLite 3.46.0 na faixa potencialmente afetada. Descreve corrupção rara com múltiplas conexões e escrita/checkpoint concorrentes em WAL; informa correção em 3.51.3 ou posterior e backports 3.44.6/3.50.7. Isso exige revisar a dependência antes de expor o novo fluxo. Não houve reprodução dessa corrida, inspeção do journaling do banco real ou evidência de corrupção dos dados do responsável. Os nove testes aprovados não descartam a condição rara.

A [investigação de compatibilidade na ADR-018](../../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#investigação-de-compatibilidade-sqlite--2026-10-09) encontrou um caminho local: compilar SQLite 3.51.3 separadamente e vinculá-lo estaticamente à cadeia atual. O código C/checksum/source ID foram conferidos contra a release oficial. Mantendo os manifests e locks do app, os nove testes do núcleo 8A e 28 de persistência/conteúdo/importação passaram em Windows x64 debug; o processo reportou SQLite 3.51.3. São 37 resultados adicionais no ambiente experimental, sem reproduzir a corrida exata ou atualizar qualquer aplicativo instalado.

Após autorização específica, a [integração do build](../../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#integração-local-do-build-sqlite--2026-10-09) passou a exigir SQLite 3.51.3 estático, com origem, opções, alvo e hashes conferidos. O app conserva SQLx/plugin e seu lock; `libsqlite3-sys 0.37.0` pertence à ferramenta separada. O CI de `8bb422f` aprovou frontend/Windows, mas detectou SQLite 3.45.1 do sistema no Ubuntu. A [correção de seleção](../../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#ci-e-correção-de-seleção-sqlite--2026-10-10), em `b9d1464`, passou nos quatro jobs de [nova CI](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38006207453), incluindo identidade 3.51.3 e suítes nativas debug/release em Windows/Ubuntu. As primeiras 155 verificações locais por perfil e o build Tauri sem instalador conservam seu escopo histórico. A recuperação 8B posterior passou sua CI própria em `d7be11c`. O início 8C abaixo acrescenta controlador, IPC e interface publicados na branch. O pacote e a amostra instalada Windows posteriores têm registro próprio abaixo; restauração ativa continua pendente.

## Protótipo 8B: recuperação descartável — 2026-10-10

O [núcleo Rust](../../../src-tauri/src/workspace_backup.rs) acrescenta `recover_workspace_backup_to_disposable` e `verify_disposable_workspace_recovery`, sem registro em Tauri. O chamador nativo fornece uma raiz existente, a identidade esperada, um pool de referência confiável e um orçamento máximo de bytes. Nos testes, todos são sintéticos e temporários; nenhum diretório da aplicação é resolvido. O orçamento de **16 MiB é somente do teste**, não um limite de produto aprovado.

A operação verifica o backup/recibo 8A, recusa WAL/SHM/journal adjacentes não cobertos pelo recibo e compara o hash de todo o schema com o pool de referência. A comparação inclui colunas, constraints, índices e triggers por meio de `sqlite_schema`; schemas com SQL textual diferente também podem ser recusados, mesmo se logicamente equivalentes. A referência de produção ainda precisa ser vinculada a um controlador confiável, não a uma afirmação do arquivo selecionado.

O núcleo cria `recovery-<uuid>/workspace.sqlite3` sem sobrescrever destinos, copia bytes em blocos com tamanho/hash verificados e sincroniza o arquivo. Reabre a cópia em leitura, com `trusted_schema=OFF` e `query_only=ON`, confere schema/contagens/`quick_check`, fecha e reconfere o hash. As opções estão disponíveis no SQLx 0.8.6 inspecionado; [SQLite recomenda desabilitar confiança implícita no schema](https://www.sqlite.org/pragma.html#pragma_trusted_schema). Não se usa `immutable=1` para dispensar locks ou detecção de mudanças.

Somente após verificar a cópia publica `recovery.json`, inicialmente gravado/sincronizado como `recovery.pending`. O recibo de formato 1 relaciona o UUID/horário da recuperação ao recibo de origem; o verificador exige marcador válido, origem, formato, schema, bytes e metadados. Recibo/hash não são autenticação nem autorização para restaurar. Arquivos parciais ficam preservados; uma nova tentativa usa outro UUID.

| Verificação local — Windows x64 MSVC, Rust/Cargo 1.93.0 | Resultado e alcance |
| --- | --- |
| `cargo check --manifest-path src-tauri/Cargo.toml --locked --offline`, também com `--release` | Ambos passaram. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --offline`, também com `--release` | Em cada perfil: 165 passaram, zero falhas e um piloto real ignorado. |
| [Testes de backup/recuperação](../../../src-tauri/tests/workspace_backup.rs) | 17 passaram por perfil: nove 8A preservados e oito 8B novos. |
| Falhas de cópia, testes unitários do núcleo | Dois passaram: bytes divergentes/truncados/excedentes e erro simulado de escrita no segundo bloco. |
| Preservação | Igualdade lógica das oito tabelas, schema, IDs/datas, Unicode/multilinha/nulos, configuração, entidades inativas e referência preexistente não resolvida; cópia editável independente e origem/backup preservados. |
| Rejeições e reexecução | Coluna ausente/adicional, índice removido, trigger extra, origem normal/Pilot/fixtures incompatível, bytes corrompidos inclusive com hash atualizado, formato/schema futuro, recibos ausentes/alterados/excessivos, destino ocupado/relativo/sobreposto, orçamento insuficiente e sidecars; tentativas independentes preservam uma saída incompleta simulada. |

Os avisos herdados `unused_mut` em `provisioning/download.rs:93` e `unused_variables` para `signing_key` em `provisioning/security.rs:217` permanecem; esses arquivos não foram alterados. A interrupção acima é simulação de falha de escrita/estado incompleto, não encerramento real de processo ou perda de energia. Falta validar falta de espaço/permissão real, bloqueios e corridas de filesystem, durabilidade do diretório após rename, amostras representativas/limites de tempo e aplicativos instalados. A inspeção de caminhos não elimina corridas entre inspeção e abertura. Não há validação de ativação, troca de arquivo/WAL, exclusividade entre processos ou recuperação do banco ativo.

### Revisão da futura substituição

O resultado 8B oferece um arquivo independente para validar a preparação; não autoriza anexá-lo ao pool ativo. A direção proposta para revisão é executar uma futura substituição antes da abertura dos pools, com identidade da aplicação, confirmação vinculada ao backup/destino e retenção verificável do estado anterior. Esse controlador ainda não existe.

Um mutex somente nos comandos Rust não abrange escritas via plugin SQL/Drizzle nem outra instância. Fechar um pool deste processo não comprova que outro processo perdeu acesso; renomear um banco aberto não é um protocolo de restauração, especialmente com WAL. É necessário definir/validar exclusividade entre instâncias, fechamento dos acessos, publicação/rollback e os recibos de cada estado em Windows e Linux antes de implementar a troca. Não se escolhe nova dependência/permissão ou migração para antecipar essa decisão.

## Integração 8C inicial: criação e verificação internas — 2026-10-10

O responsável escolheu este recorte antes da substituição do banco ativo. A implementação 8C partiu de `d7be11c155927d8c58d488aa04d18626d8b6162e`, aprovado na [CI 8B](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38065205746), e foi depois publicada como `5efa88d`. O [registro de publicação e CI](#publicação-e-ci-do-início-8c--2026-10-10) confirma os quatro jobs dessa revisão; o [aceite instalado posterior](#aceite-executado--amostra-windows-com-ipc-real--2026-10-11) tem evidência local própria.

O [controlador Rust](../../../src-tauri/src/workspace_backup_commands.rs) registra `list_workspace_backups`, `create_workspace_backup` e `verify_internal_workspace_backup` no [handler](../../../src-tauri/src/lib.rs). Obtém identidade e `app_config_dir` do aplicativo nativo e usa o pool já mantido pelo plugin SQL. O destino é `<app_config_dir>/backups/workspace-<uuid>/`; não recebe SQL, URI, identidade ou caminho escolhido pelo frontend. Verificação recebe somente UUID v4 canônico. A enumeração não lê recibos nem anuncia integridade; inclui diretórios de tentativas incompletas e não cria a raiz. Não há exportação, remoção, restauração ou migração nesses comandos.

O [núcleo](../../../src-tauri/src/workspace_backup.rs) oferece variantes limitadas de criação/verificação. Este protótipo admite até **256 MiB** na estimativa de páginas do banco e no arquivo concluído, **128 pastas** de operações e **4096 entradas** inspecionadas no diretório. Criação e a verificação posterior têm, cada uma, orçamento cooperativo de **120 segundos**, conferido nas fases/hashes e em progress handler do SQLite. O [SQLx 0.8.6 documenta esse callback](https://docs.rs/sqlx/0.8.6/sqlx/sqlite/struct.LockedSqliteHandle.html#method.set_progress_handler); a conexão da criação é destacada do pool e fechada, evitando devolver o callback ao plugin. A cópia é novamente verificada antes de responder com sucesso; seus bytes são reconferidos depois da leitura do schema/contagens.

Esses limites são guardas deste protótipo, não limites de um produto estável nem quotas rígidas do sistema operacional. Escritas concorrentes podem fazer o snapshot ultrapassar a estimativa inicial; nesse caso o arquivo final é recusado antes do recibo de criação. Espera pelo pool, operações de filesystem/bloqueios de I/O e intervalos entre callbacks não têm deadline rígido demonstrado. Os testes usam bases pequenas, sem benchmark de 256 MiB. O mutex recusa sobreposição de comandos de backup neste processo; não bloqueia as demais escritas do aplicativo nem outra instância, e não fornece exclusividade para restauração.

O [painel no Header](../../../components/WorkspaceBackupPanel.tsx) separa backup da exportação de pautas. Informa escopo salvo, namespace, pasta interna, limites e ausência de criptografia/cópia externa/restauração. O [bridge](../../../lib/api/workspaceBackup.ts) só usa desktop IPC e valida recibos/inventário antes de apresentar resultados. Abrir o painel apenas enumera; criar exige ação explícita. Controles impedem duplicação durante a operação, e fechamento/Escape preservam a operação iniciada e retornam foco. Nova abertura pode consultar o resultado. Erros não exibem detalhes privados; uma pasta ou resultado antigo não são anunciados como nova verificação bem-sucedida.

| Validação local — Windows x64, fonte 8C posteriormente publicada em 5efa88d | Resultado e limite |
| --- | --- |
| `cargo fmt --check`, `cargo check --locked --offline`, também `--release`; todos em `src-tauri` ou com `--manifest-path src-tauri/Cargo.toml` | Passaram; locks preservados. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --offline`, também `--release` | Em cada perfil: **171 passaram, zero falhas, um piloto real ignorado**. |
| [Integração backup/controlador](../../../src-tauri/tests/workspace_backup.rs) | 21 testes por perfil; 17 anteriores preservados e quatro novos cobrindo namespaces, IDs/caminhos, origem/sidecars, limites, estado incompleto e fonte/pool preservados. |
| Testes unitários novos | Sobreposição recusada e liberação do guard; consulta SQLite realmente interrompida pelo progress handler. Não é encerramento de processo ou perda de energia. |
| `npm test` | **427 passaram, 32 arquivos**; inclui 21 cenários do [bridge/entrada desktop](../../../__tests__/workspace-backup.test.ts). |
| `npm run lint`, lint final do componente, `tsc --noEmit --incremental false`, `npm run build` | Passaram; Next 16.3.8 com exportação estática. Avisos herdados de ESLint/Vite e dos dois arquivos Rust anteriores permanecem. |
| Header/painel/bridge compilados e CSS do build, Chrome 154.0.8037.99, localhost com IPC sintético | **14 verificações passaram**: startup/navegador, teclado/foco/Escape/modal em primeiro plano, duplicação, fechamento/retomada, conclusão nativa simulada, rejeições/reexecução e ausência de erros de runtime. |
| Amostra visual automática e inspeção das capturas | Reflow a 320 pixels CSS, fonte raiz a 200%, controles de pelo menos 24 pixels e contraste de texto medido em 15 elementos por tema, mínimo aproximado de **6,83:1**. Não é zoom do WebView nem avaliação com leitor de tela. |

No checkpoint local de 2026-10-10, nenhum processo Tauri ou aplicativo instalado foi aberto; nenhum dado editorial real foi lido, copiado ou alterado. A amostra de navegador testa consumo de IPC simulado; testes Rust exercitam controlador/núcleo em diretórios temporários, e a compilação verifica os comandos/registro. **Nesse checkpoint, IPC real e operação instalada, NVDA, zoom do WebView, Linux instalado, recursos representativos, falta de espaço/permissão real, interrupção de processo, durabilidade de diretório e corridas de filesystem ainda não haviam sido avaliados.** A [amostra Windows posterior](#aceite-executado--amostra-windows-com-ipc-real--2026-10-11) registra separadamente o IPC instalado e os limites restantes; não há declaração de conformidade WCAG, prontidão de produção ou fechamento da fase. O registro seguinte conserva a CI como evidência separada dos dois checkpoints locais.

### Publicação e CI do início 8C — 2026-10-10

Após autorização explícita de commit, push e disparo da CI, a implementação deste recorte foi publicada em `codex/phase-6.5-workspace-backup`, no commit [`5efa88d2777fa07a53b9196ee3ea05d50d1300aa`](https://github.com/jornalistainclusivo/retranca-os/commit/5efa88d2777fa07a53b9196ee3ea05d50d1300aa). A [execução 38069861194](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38069861194) concluiu com `success` nesse mesmo SHA. A consulta ao GitHub confirmou os quatro jobs e suas etapas em 2026-10-10:

| Job | Evidência executada | Resultado |
| --- | --- | --- |
| [frontend](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38069861194/job/114264898426) | Instalação de dependências; `npm run lint`, `npm test` e `npm run build`. | Aprovado |
| [rust (windows-latest)](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38069861194/job/114264898610) | Guardas/preparação do SQLite estático, formatação, identidade do motor e checks/testes debug/release com lockfile. | Aprovado |
| [rust (ubuntu-latest)](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38069861194/job/114264898634) | Dependências nativas e sidecar sintético de build; guardas/preparação do SQLite, formatação, identidade do motor e checks/testes debug/release com lockfile. | Aprovado |
| [rust — agregador](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38069861194/job/114268466055) | Exige sucesso de ambos os jobs da matriz Rust. | Aprovado |

Essa evidência pertence ao código de `5efa88d`; as contagens e a amostra de navegador da tabela anterior são resultados locais preservados, sem atribuição automática à CI. O workflow não compila nem instala o Pilot, não exercita IPC real do aplicativo instalado e não aceita Linux instalado, restauração ativa ou conformidade WCAG. Na atualização documental de 2026-10-10, build, testes e CI não foram repetidos. O empacotamento posterior tem registro próprio abaixo.

O código candidato permanece separado da `main` `96a309384ccb7b337dcce65b39a7519eb1ac02d7` e do PR #14, ainda aberto em Draft sobre `9768a87`. O executável instalado foi posteriormente atualizado para o candidato identificado abaixo e passou a amostra Windows de criação/verificação com dados de teste e IPC real. Ponto de retomada: ampliar os casos representativos de falha, recursos, plataformas e acessibilidade antes de considerar encerrado o incremento 8C. Operação sobre dados reais, cópia externa, substituição do banco ativo, integração e distribuição conservam seus próprios critérios e autorizações.

### Candidato privado Windows para o aceite — 2026-10-11

O candidato `e99ca761-83b6-4f34-bc3b-666a2401d539` foi compilado a partir do checkout limpo [`166d914d22095ede168ded9cd87362e04389e7e6`](https://github.com/jornalistainclusivo/retranca-os/commit/166d914d22095ede168ded9cd87362e04389e7e6). Esse commit acrescenta somente documentação a `5efa88d`, cuja CI aprovada permanece vinculada à implementação. Node 24.19.0, CLI Tauri 2.11.4, Windows x64 MSVC e versão declarada 0.1.0; identidade `com.jornalistainclusivo.retranca.pilot`. O empacotador validou a configuração, conferiu o cache estático SQLite 3.51.3 e executou o build/typecheck/exportação Next 16.3.8, a compilação Rust release e a geração do instalador NSIS. Build concluído em 118904 ms, sem alegação de desempenho geral. O aviso herdado de `unused_mut` permanece.

O recibo `build.json`, o log e os arquivos estão somente em `.retranca-local/phase65-packaged-pilot/e99ca761-83b6-4f34-bc3b-666a2401d539/`, ignorados pelo Git. Os dois artefatos gerados foram reconferidos por tamanho e SHA-256; Authenticode reportou `NotSigned`, como previsto para esse piloto local. Ao concluir a preparação do pacote, nenhuma instalação ou execução desse novo candidato havia sido realizada; o aceite autorizado posterior está registrado abaixo.

| Artefato | Bytes | SHA-256 | Estado da identidade |
| --- | --- | --- | --- |
| Executável bruto `retranca-pilot.exe` | 19792896 | `c4c5bfd8bd12d28245ac259afe886016014e1479c9eacda42e9871a646cdc593` | `pass`: arquivo reconferido |
| Instalador `Retranca OS Pilot_0.1.0_x64-setup.exe` | 5438194 | `0faae60a863f09a7e6d4e70c938ea2955d8ebd938376df949e46d53d79412a12` | `pass`: arquivo reconferido |
| Payload NSIS esperado `retranca-pilot.exe` | 19792896 | `68753a7893b6eb58d6a8c644446607e687456aa823822c932ed867733ad16bc4` | Derivado do marcador `NSS` da CLI auditada e confirmado no arquivo instalado no aceite posterior: `pass` |

Os hashes dos seis inputs registrados no recibo permanecem iguais; a identidade derivada foi reconferida com o empacotador existente. O payload do instalador não foi extraído independentemente. Antes da atualização autorizada, o Pilot anterior tinha o hash observado `723522ea94b6dd95eb0c6c9744a49089f0f29bc16067779c8e55a80cbe19c36d`; o aplicativo normal e os bancos não foram abertos, lidos ou modificados durante a preparação do pacote. A preservação e as leituras de aceite posteriores têm registro próprio abaixo. O responsável confirmou neste chat que o Pilot contém apenas dados de teste. As duas aplicações mantêm seus diretórios próprios, mas atualizar o Pilot conserva o namespace do Pilot anterior e requer preservar também seus testes salvos.

#### Roteiro de aceite instalado

Após autorização para atualizar somente o Pilot, salve os editores abertos em **Salvar Pauta no CMS** e feche o Pilot antes de executar o instalador deste candidato. A conferência do executável instalado deve corresponder ao hash de payload NSIS esperado acima. O roteiro abaixo começa apenas depois dessa identificação e usa exclusivamente dados de teste; não inicia o aplicativo normal nem o modo de desenvolvimento.

1. **Identidade, abertura e teclado:** abra o Pilot instalado e **Backup do espaço editorial**. Confira **Aplicação: Retranca OS Pilot** e o diretório interno do Pilot. Abrir/listar não deve criar uma cópia. Percorra os controles com Tab/Shift+Tab, feche com Escape e confira o retorno do foco ao botão. Amplie a página com Ctrl+mais, confira que os controles continuam alcançáveis e retorne com Ctrl+0; essa amostra não comprova um percentual específico ou conformidade WCAG.
2. **Criação e verificação interna:** salve uma pauta `TESTE — Backup 8C` com `Conteúdo sintético A`. Abra o painel, selecione **Criar backup dos dados salvos** e aguarde **Backup criado e verificado**. Anote o UUID exibido, confira origem Pilot e resultado de tamanho/contagem; as pautas salvas devem continuar disponíveis. A confirmação deve vir da conclusão nativa, não apenas da presença de uma pasta.
3. **Reverificação e fonte preservada:** altere e salve a mesma pauta como `Conteúdo sintético B`. Selecione o UUID anterior e use **Verificar backup selecionado**; aguarde **Backup verificado nesta operação** e confirme que o conteúdo atual continua B. Feche/reabra o Pilot e reverifique a mesma cópia; a lista sozinha não comprova integridade. Isso exercita a cópia anterior sem restaurar ou substituir o banco ativo.

Registrar cada resultado com a identidade do executável e, se houver falha, a mensagem e o passo correspondente. O painel não exibe nem restaura o conteúdo editorial da cópia. A execução desta amostra e sua corroboração SQLite estão registradas abaixo; leitor de tela, situações de falta de espaço/permissão, interrupção, Linux instalado e os demais limites anteriores continuam pendentes até receberem evidência própria. Esta amostra não encerra o incremento 8C nem a fase 6.5.

#### Aceite executado — amostra Windows com IPC real — 2026-10-11

Após autorização explícita neste chat, somente o Pilot foi atualizado com o instalador identificado acima, em modo NSIS `/S /UPDATE`, sem iniciar o aplicativo pelo instalador. O processo terminou com código 0; o executável instalado tem 19792896 bytes e SHA-256 `68753a7893b6eb58d6a8c644446607e687456aa823822c932ed867733ad16bc4`, igual à identidade NSIS esperada. A versão declarada continua 0.1.0; a identificação desta amostra usa candidato, commit e hash, sem criar tag ou release.

Antes da instalação, com as aplicações fechadas, os três arquivos existentes do espaço de teste e os dois executáveis anteriores do Pilot foram copiados para uma pasta privada de preservação. Os hashes dos arquivos de dados permaneceram iguais após a instalação. O banco do aplicativo normal foi conferido por hash, sem abrir o aplicativo, e permaneceu igual ao fim do aceite. As três pautas anteriores do Pilot também permaneceram iguais, coluna por coluna, à cópia de preservação nas três leituras do aceite.

| Verificação executada | Resultado observado | Limite da evidência |
| --- | --- | --- |
| Identidade, listagem e teclado | `pass`: painel mostra origem Pilot e seu diretório próprio; listagem inicial vazia, sem cópia criada pela abertura. Tab/Shift+Tab mostraram foco visível e retorno entre primeiro/último controle; Escape fechou e devolveu foco visível ao botão. Ctrl+Shift+igual ampliou o conteúdo, com controles alcançáveis; Ctrl+0 restaurou a apresentação. A rolagem expôs o resultado em janela configurada 800 × 600. | Amostra visual/teclado via `computer-use`; a leitura de foco da automação identificava o contêiner WebView em alguns passos. Sem percentual de zoom certificado, NVDA ou declaração de conformidade WCAG. |
| Criação pelo painel e igualdade da cópia | `pass`: pauta `TESTE — Backup 8C` salva no CMS com `Conteúdo sintético A`; comando nativo concluiu com **Backup criado e verificado**. UUID `9d745b78-3ae7-4262-8449-b8c36f7f4109`, 90112 bytes e quatro pautas. As oito tabelas da cópia eram logicamente iguais às oito tabelas do banco ativo no momento da comparação. | IPC do executável instalado, corroborado por conexões SQLite em modo somente leitura e `quick_check`. `checklist_templates` e `gamification_badges` estavam vazias; não houve amostra instalada de seus conteúdos não vazios. |
| Reverificação após alteração e reabertura | `pass`: o conteúdo B foi salvo no banco ativo; a mesma cópia foi verificada antes e depois de fechar/reabrir o Pilot, com **Backup verificado nesta operação**. B persistiu no banco ativo; A e os oito conjuntos de linhas da cópia permaneceram iguais. | Sem restauração ou substituição do banco ativo. A corroboração do conteúdo da cópia veio da leitura SQLite, pois o painel não oferece visualização editorial da cópia. |

O backup gerado tem SHA-256 `3e48b3b14625baebecc3d4d457e314d2016bd6bc86a95a611ebc3e8ab7b74ce9`. Recibo da instalação e cópias de preservação: `.retranca-local/workspace-backup-8c-installed/installation-e224f6b7-dbb8-4b05-865a-27f0fe041d50/` no checkout original. Observações de interface e resultados de leitura: `installed-ui-evidence.json`, `before-change.json`, `after-change.json` e `after-reopen.json`, no mesmo diretório privado de trabalho. Esses artefatos e dados permanecem ignorados pelo Git; nenhum conteúdo editorial da amostra é necessário nos documentos públicos além dos textos sintéticos acima.

O Pilot ficou aberto para inspeção, com a pauta sintética B e o backup A preservados. Esta rodada não alterou código, dependências, esquema, permissões ou CI, nem repetiu as suítes de frontend/Rust ou iniciou CI nova. A instalação e a amostra com IPC real são evidências locais posteriores à CI de `5efa88d`. Permanecem pendentes os casos representativos de falta de espaço/permissão, interrupção, limites/concorrência, leitor de tela, Linux instalado, conteúdos não vazios das duas tabelas mencionadas, cópia externa, restauração ativa e integração/distribuição.

## Dados a preservar

A definição proposta de “integral” abrange o estado persistido nas seguintes tabelas e o schema correspondente, incluindo índices e `PRAGMA user_version`:

| Tabela | Conteúdo abrangido |
| --- | --- |
| `articles` | Campos da pauta, `analysisContent`, IDs de etapa/categoria e datas existentes. |
| `checklist_items` | Itens vinculados às pautas, IDs e estado de conclusão. |
| `history_entries` | Histórico persistido, sem fabricar eventos ou datas. |
| `workflow_stages` | Etapas ativas/inativas, ordem, classificação semântica e papel de publicação. |
| `categories` | Categorias padrão/personalizadas, nomes atuais e estado ativo/inativo. |
| `checklist_templates` | Nomes, IDs e `items_json` dos modelos. |
| `governance_docs` | Documentos persistidos de governança e seus metadados. |
| `gamification_badges` | Registros presentes na tabela, quando houver; sua existência não comprova que todo progresso mostrado na interface é persistido nela. |

Não normalizar, reatribuir, ocultar ou descartar registros durante a cópia. Diferenciar inconsistência estrutural do banco de referências editoriais não resolvidas já existentes.

Ficam fora deste recorte: rascunhos ainda não salvos, resultados transitórios de IA, seleção de modelo da sessão, executáveis/modelos/configurações do Ollama e futuros anexos binários. Esses itens não fazem parte das oito tabelas examinadas. O fallback de navegador usa outro armazenamento e exige contrato próprio; este incremento não promete recuperá-lo como SQLite.

## Opção técnica recomendada, ainda sujeita à revisão

### Cópia SQLite consistente

Preferir um arquivo SQLite gerado pelo núcleo Rust com `VACUUM INTO`, reutilizando SQLx e as dependências existentes. A alternativa de um novo JSON com oito coleções exigiria outro formato, validação e reconstrução de schema; não reutilizar o JSON de pautas como se fosse esse formato.

A [documentação oficial de VACUUM INTO](https://www.sqlite.org/lang_vacuum.html#vacuum_with_an_into_clause), consultada em 2026-10-09, descreve uma cópia com o mesmo conteúdo lógico sem reescrever o arquivo de origem. A cópia tem de ser validada: interrupção durante a operação pode deixar uma saída incompleta. Compactação também significa que igualdade lógica não deve ser testada exigindo hashes idênticos entre origem e cópia.

Não copiar apenas o arquivo principal de um banco aberto. Em modo WAL, transações confirmadas podem estar no arquivo auxiliar, conforme a [documentação do SQLite sobre WAL](https://www.sqlite.org/wal.html#the_wal_file). A [API de backup do SQLite](https://www.sqlite.org/backup.html) é alternativa a reavaliar se custo/latência do mecanismo escolhido não atenderem ao piloto. A versão efetivamente vinculada ao binário e suas condições de journaling/sincronização deverão ser registradas nos testes do núcleo.

### Destino e recibo

Proposta inicial: criar uma pasta privada por operação, com UUID, sob o diretório de configuração da aplicação corrente; nunca dentro do repositório. O nome de arquivo e o destino interno são produzidos pelo nativo, sem aceitar SQL, URI SQLite ou caminho arbitrário enviado pelo frontend.

A estrutura `<app_config_dir>/backups/workspace-<uuid>/` é usada pelo início 8C publicado acima, ainda sem aceite instalado. A cópia SQLite e seu recibo versionado incluem:

- Identificador da aplicação de origem, versão do aplicativo e schema do banco.
- ID da operação, horário de geração e tamanho/hash SHA-256 da cópia final.
- Contagens das oito tabelas e resultado da verificação estrutural, obtidos da cópia.
- Estado completo/incompleto verificável; ausência ou falha do recibo impede anunciar conclusão.

O recibo não deve incluir conteúdo das pautas, credenciais ou caminhos pessoais em logs publicados. SHA-256 identifica bytes e permite detectar divergências; não autentica a pessoa que forneceu um arquivo.

Publicar o estado completo somente após finalizar, fechar e verificar os arquivos. Não sobrescrever backups anteriores, truncar destinos existentes ou remover saídas parciais automaticamente. Uma pasta incompleta deve continuar identificada como incompleta. Contenção de caminho, links/reparse points e colisões exigem teste antes de qualquer comando de produção.

Uma cópia no mesmo disco protege contra parte dos erros de edição, mas não contra a perda do dispositivo. O fluxo de cópia para um destino escolhido pela pessoa, seus limites e eventual diálogo/permissão adicional precisam de decisão própria. Não adicionar dependência ou ampliar permissões apenas para antecipar essa escolha.

### Privacidade e interface

O backup contém material editorial privado e, nesta proposta inicial, não tem criptografia acrescentada pela aplicação. Tornar isso claro antes de copiar/compartilhar. Não enviar arquivo, recibo ou conteúdo para GitHub ou serviço remoto.

O painel 8C da branch distingue exportação de pautas e criação de backup interno; sua verificação instalada permanece pendente. Para concluir os recortes de interface: Informar qual aplicação originou a cópia, destino e conclusão/erro, com controles nomeados, operação por teclado e anúncio acessível. Bloquear duplicação acidental de uma operação; não anunciar sucesso somente porque o comando foi iniciado. Falhas não devem apagar um formulário aberto ou o texto ainda não salvo.

## Recuperação: desenho a fechar antes de habilitar substituição

Primeiro validar a cópia em outro diretório descartável, sem alterar o banco ativo. Só depois apresentar uma proposta operável de substituição, incluindo estes requisitos:

1. Seleção explícita da cópia e do recibo; inspeção estrutural em modo de leitura, hash/tamanho, versão do formato, schema e identidade de origem. Rejeitar formatos desconhecidos, arquivos corrompidos e schemas não suportados, sem tentar migrá-los.
2. Mostrar a diferença entre restaurar um snapshot e acrescentar pautas. Uma restauração remove da visão ativa alterações feitas depois do snapshot; a importação conservadora existente continua sendo a opção para acrescentar IDs.
3. Salvar ou preservar os rascunhos e criar uma nova cópia de segurança do estado atual antes de qualquer substituição. Se essa preservação falhar, impedir a substituição.
4. Obter confirmação vinculada à cópia e ao destino concretos. Não restaurar automaticamente na abertura, após erro ou por expiração de uma confirmação anterior.
5. Garantir exclusividade sobre o banco, abrangendo o plugin SQL, os comandos nativos e outras instâncias da mesma aplicação. Definir fechamento do pool, tratamento de WAL e reinício controlado. A proposta ainda não comprova esse mecanismo.
6. Preparar e validar o novo arquivo em área privada do mesmo destino antes da troca. Definir a operação de troca, o recibo de recuperação e a retenção do estado anterior, com comportamento em cada ponto de falha e interrupção.
7. Reabrir e verificar a aplicação somente após a troca bem-sucedida. Diferenciar falha anterior à troca, troca concluída com falha de reabertura e recuperação do estado anterior; não manter a interface com uma coleção antiga enquanto outro banco já está ativo.

Não executar manualmente troca, exclusão de arquivos WAL ou restauração do banco do responsável para investigar a implementação. O procedimento final de recuperação em Windows e Linux precisa ser testado nas respectivas plataformas; não generalizar atomicidade de troca ou exclusividade de um sistema para o outro.

## Sequência e critérios de aceite propostos

| Etapa | Entrega | Verificação necessária |
| --- | --- | --- |
| 8A | Núcleo de criação e validação da cópia, ainda sem restauração do banco ativo. | Schema completo em banco temporário; igualdade lógica das oito tabelas e schema; Unicode/multilinha/valores nulos; entidades inativas; banco vazio inicializado; reabertura; origem preservada. |
| 8A — falhas | Resultados e recibos honestos. | Destino ocupado/sem permissão, interrupção/saída incompleta, banco bloqueado, falta de espaço simulada quando possível, journaling/WAL e escritas concorrentes; limites de tamanho/tempo definidos e testados. |
| 8B | Recuperação em destino descartável e revisão da substituição. | Hash divergente, schema parcial/futuro, origem normal/Pilot/fixtures, restauração exata de IDs/datas/configurações, isolamento do banco de origem, falhas de abertura e recuperação após interrupção. |
| 8C | Integração de interface e operação instalada, após decisões anteriores. | IPC real, erros/status/foco, teclado/leitor/zoom pertinentes, cópia externa e restauração sintética no aplicativo identificado; Linux instalado continua exigindo evidência própria. |

Os núcleos 8A/8B estão publicados e aprovados na [CI de `d7be11c`](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38065205746). O início 8C acrescenta criação/verificação interna, IPC e interface publicados em `5efa88d`, com resultados locais preservados e [CI própria aprovada](#publicação-e-ci-do-início-8c--2026-10-10). A substituição ativa, cópia externa, conclusão dos critérios 8C e aceite instalado permanecem pendentes; não há conformidade de acessibilidade demonstrada.

## Decisões pendentes e limite desta preparação

Antes de habilitar a operação para uso:

- O responsável escolheu criação/verificação interna como início 8C; fechar os recortes posteriores de cópia externa e restauração.
- Fechar acesso ao destino externo e a experiência de localização/cópia, sem ampliar permissões implicitamente.
- Definir limites de recursos e o tratamento de inconsistências editoriais preexistentes, preservando a informação.
- Revisar e validar o protocolo de exclusividade, substituição e recuperação após falha em cada plataforma.
- Manter separados autorização de implementação, operação sobre dados reais, commit/publicação, integração e distribuição.

A preparação inicial entregou o contrato, o núcleo e seus testes sintéticos. O build e a correção de seleção SQLite foram publicados em `8bb422f`/`b9d1464` após autorização e passaram na nova CI. A continuação 8B foi publicada e aprovada em CI após autorização própria. Este início 8C acrescenta controlador, IPC, painel, guardas e testes sintéticos; após autorização específica, foi publicado em `5efa88d` e aprovado em [CI própria](#publicação-e-ci-do-início-8c--2026-10-10). Não altera dependências, CI, schema, dados reais ou runtime de IA, não atualiza instalador e não encerra a fase 6.5. O [plano da fase](../../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) conserva as demais pendências.
