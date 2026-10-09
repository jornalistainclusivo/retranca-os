# Fase 6.5 — Incremento 8: backup do espaço editorial

Data: 2026-10-09 (America/Sao_Paulo). **Status: proposta de produto para revisão, com protótipo local do núcleo 8A validado. IPC, interface e restauração do banco ativo não implementados; nenhuma decisão de produto é marcada como aceita.**

Base examinada: `9768a87ab3cd2d46f1b5ffa2fbc1886cc7ee33a7`, publicado em `codex/phase-6.5-release-readiness`, com os quatro jobs do [CI de branch](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37988393320) aprovados. O [PR #14](https://github.com/jornalistainclusivo/retranca-os/pull/14) está em Draft; a proposta deste documento é trabalho local separado e não pertence aos dois commits desse PR. A `main` examinada permanece em `96a309384ccb7b337dcce65b39a7519eb1ac02d7`.

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

As fontes foram inspecionadas. Nenhum banco, backup, exportação ou conteúdo editorial real foi lido ou modificado nesta preparação. Foram executados somente os cenários sintéticos de criação/verificação descritos abaixo; nenhuma restauração ou operação sobre os dados do responsável foi realizada.

## Estado do protótipo 8A e validação local

O [núcleo Rust](../../../src-tauri/src/workspace_backup.rs) implementa `create_workspace_backup_pool` e `verify_workspace_backup`, exportados pelo módulo da biblioteca. Nenhum deles está registrado em `generate_handler!`; não há botão, IPC ou substituição do banco ativo. O chamador do protótipo é código nativo de teste, com pool e diretório temporários. A resolução do destino a partir da identidade real da aplicação ainda não foi implementada.

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

O compilador emitiu o aviso herdado de `unused_mut` em `src-tauri/src/provisioning/download.rs:93`; esse arquivo permanece preservado. Falta validar interrupção real de processo, falta de espaço, tempo/tamanho em amostras maiores, bloqueios, corridas de filesystem, Windows instalado e Linux. O protótipo rejeita links/reparse points na inspeção de caminho, mas isso não comprova eliminação de corridas entre inspeção e abertura. Não há sincronização comprovada do diretório após publicação do recibo nem protocolo de restauração.

### Pendência de SQLite antes da exposição em produção

A árvore do app conserva `sqlx 0.8.6 → sqlx-sqlite 0.8.6 → libsqlite3-sys 0.30.1`, também utilizada por `tauri-plugin-sql 2.4.0`. A primeira inspeção usou `cargo tree --manifest-path src-tauri/Cargo.toml --locked --offline --invert libsqlite3-sys`, antes das mudanças de build descritas abaixo.

A [documentação oficial do WAL-reset bug](https://www.sqlite.org/wal.html), consultada em 2026-10-09, inclui SQLite 3.46.0 na faixa potencialmente afetada. Descreve corrupção rara com múltiplas conexões e escrita/checkpoint concorrentes em WAL; informa correção em 3.51.3 ou posterior e backports 3.44.6/3.50.7. Isso exige revisar a dependência antes de expor o novo fluxo. Não houve reprodução dessa corrida, inspeção do journaling do banco real ou evidência de corrupção dos dados do responsável. Os nove testes aprovados não descartam a condição rara.

A [investigação de compatibilidade na ADR-018](../../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#investigação-de-compatibilidade-sqlite--2026-10-09) encontrou um caminho local: compilar SQLite 3.51.3 separadamente e vinculá-lo estaticamente à cadeia atual. O código C/checksum/source ID foram conferidos contra a release oficial. Mantendo os manifests e locks do app, os nove testes do núcleo 8A e 28 de persistência/conteúdo/importação passaram em Windows x64 debug; o processo reportou SQLite 3.51.3. São 37 resultados adicionais no ambiente experimental, sem reproduzir a corrida exata ou atualizar qualquer aplicativo instalado.

Após autorização específica, a [integração local do build](../../decisions/ADR-018-DEPENDENCY-SECURITY-MAINTENANCE.md#integração-local-do-build-sqlite--2026-10-09) passou a exigir SQLite 3.51.3 estático, com verificação de origem, opções, alvo e hashes. O app conserva a família SQLx/plugin e seu lock; `libsqlite3-sys 0.37.0` fica em uma ferramenta de compilação separada. A suíte nativa completa passou em Windows debug e release, com 155 testes aprovados e um piloto real ignorado em cada perfil; inclui os nove cenários 8A e três testes novos do contrato/identidade SQLite. O build Tauri release sem instalador também passou. As alterações são locais, com commit autorizado e publicação pendente; CI remoto, Linux, novo pacote instalado, recuperação e IPC continuam pendentes. Não há interface de backup.

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

A estrutura sugerida `<app_config_dir>/backups/workspace-<uuid>/` **ainda não existe como funcionalidade**. Nela, manter a cópia SQLite e um recibo de formato versionado com:

- Identificador da aplicação de origem, versão do aplicativo e schema do banco.
- ID da operação, horário de geração e tamanho/hash SHA-256 da cópia final.
- Contagens das oito tabelas e resultado da verificação estrutural, obtidos da cópia.
- Estado completo/incompleto verificável; ausência ou falha do recibo impede anunciar conclusão.

O recibo não deve incluir conteúdo das pautas, credenciais ou caminhos pessoais em logs publicados. SHA-256 identifica bytes e permite detectar divergências; não autentica a pessoa que forneceu um arquivo.

Publicar o estado completo somente após finalizar, fechar e verificar os arquivos. Não sobrescrever backups anteriores, truncar destinos existentes ou remover saídas parciais automaticamente. Uma pasta incompleta deve continuar identificada como incompleta. Contenção de caminho, links/reparse points e colisões exigem teste antes de qualquer comando de produção.

Uma cópia no mesmo disco protege contra parte dos erros de edição, mas não contra a perda do dispositivo. O fluxo de cópia para um destino escolhido pela pessoa, seus limites e eventual diálogo/permissão adicional precisam de decisão própria. Não adicionar dependência ou ampliar permissões apenas para antecipar essa escolha.

### Privacidade e interface

O backup contém material editorial privado e, nesta proposta inicial, não tem criptografia acrescentada pela aplicação. Tornar isso claro antes de copiar/compartilhar. Não enviar arquivo, recibo ou conteúdo para GitHub ou serviço remoto.

A futura interface deverá distinguir “Exportar pautas” de “Criar backup do espaço editorial”. Informar qual aplicação originou a cópia, destino e conclusão/erro, com controles nomeados, operação por teclado e anúncio acessível. Bloquear duplicação acidental de uma operação; não anunciar sucesso somente porque o comando foi iniciado. Falhas não devem apagar um formulário aberto ou o texto ainda não salvo.

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

As etapas mantêm critérios ainda planejados. Foram executados os nove cenários sintéticos do protótipo e, após a integração de build, a suíte nativa completa em debug/release e o build Tauri com exportação do frontend, conforme o registro vinculado acima. Não há IPC, interface, restauração ativa, aceite instalado ou conformidade de acessibilidade demonstrados. As verificações anteriores de frontend e os CIs citados conservam seus próprios escopos; nenhum CI da nova revisão foi executado.

## Decisões pendentes e limite desta preparação

Antes de habilitar a operação para uso:

- Confirmar o escopo de dados e a divisão 8A/8B/8C.
- Fechar acesso ao destino externo e a experiência de localização/cópia, sem ampliar permissões implicitamente.
- Definir limites de recursos e o tratamento de inconsistências editoriais preexistentes, preservando a informação.
- Revisar e validar o protocolo de exclusividade, substituição e recuperação após falha em cada plataforma.
- Manter separados autorização de implementação, operação sobre dados reais, commit/publicação, integração e distribuição.

A preparação inicial entregou o contrato, o núcleo e seus testes sintéticos em seis arquivos locais. A rodada autorizada posterior acrescenta a preparação/verificação do SQLite, dependências de build, comandos, documentação e configuração de CI, com commit local autorizado e publicação pendente. Não altera schema, dados reais ou runtime de IA, não atualiza instalador, não disponibiliza backup no aplicativo e não encerra a fase 6.5. O [plano da fase](../../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md) conserva as demais pendências de segurança, plataformas, acessibilidade e distribuição.
