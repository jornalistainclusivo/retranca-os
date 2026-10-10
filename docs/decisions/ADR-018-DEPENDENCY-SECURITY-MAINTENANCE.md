# ADR 018: Dependency Security Maintenance

## Status

Manutenção parcial integrada, após autorizações explícitas, pelo [PR #7](https://github.com/jornalistainclusivo/retranca-os/pull/7) na `main`, em `5f7ba349acafe2dc45b9bbadd3271bac4440d86a`. Os quatro jobs do [CI #31](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37695557140) passaram nesse merge. O responsável também autorizou incorporar essa base à branch `codex/phase-6.5-runtime-pilot`, preservando os Incrementos 4–5, com um commit local de merge; push e CI da revisão combinada conservam seus próprios gates. Esta decisão não encerra a fase 6.5, as pendências glib/braces ou a distribuição.

Checkpoint de revisão: o mesmo revisor independente, antes interrompido pelo limite de uso, concluiu seu ciclo sobre `ad6d84ca22f09553e47b4a9c9d66bbcb1835f444`, sem identificar regressão concreta nos contratos/famílias de plataformas examinados. Todos os quatro jobs dos CIs [#29](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37688342468) e [#30](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37692477632) passaram nessa revisão. O relato local original abaixo é histórico; a interrupção e o CI pendente foram superados por esses recibos, sem repetir a inferência, inspecionar dados editoriais ou ampliar a revisão para uma auditoria de todo o repositório. Build/testes Linux não equivalem a aceite do aplicativo instalado.

## Manutenção local — 2026-10-09

Esta rodada parte da `main` `96a309384ccb7b337dcce65b39a7519eb1ac02d7` e do commit de README `963bbd456a120a0593e18cec22edcb112b1f6802`, na branch `codex/phase-6.5-release-readiness`. Após autorizações específicas, a manutenção foi commitada em `9768a87ab3cd2d46f1b5ffa2fbc1886cc7ee33a7`, publicada e verificada: os quatro jobs do [CI de branch](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37988393320) passaram nesse SHA. O responsável relatou inspeção do aplicativo com funcionamento aparentemente bom; o relato não identifica uma atualização do Pilot instalado nem aceita backup/restauração.

O responsável autorizou abrir o [PR #14](https://github.com/jornalistainclusivo/retranca-os/pull/14) como Draft, contendo os dois commits e seis arquivos. A abertura acionou o [CI de PR](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37992013867), cujos quatro jobs também passaram em `9768a87`. O PR permanece aberto em Draft, sem merge, com `mergeable_state=clean` observado. A integração à main permanece pendente; publicação de um PR não autoriza merge, tag ou release. Os resultados locais abaixo e os históricos das seções seguintes conservam seus próprios commits e escopos. A preparação local do Incremento 8 permanece separada desta manutenção.

A API do GitHub confirmou sete alertas abertos na branch padrão: seis de Next.js e um de glib. A [release oficial do Next.js 16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8) contém as correções dos seis advisories observados: GHSA-cjq9-62q9-8jv4, GHSA-f87g-xv8r-7p7x, GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p, GHSA-3w37-wq28-93x7 e GHSA-39w2-rjm5-chcv. A API dos alertas informa 16.3.8 como primeira versão corrigida. Isso sustenta a atualização de dependência, sem afirmar que todos os caminhos vulneráveis existem neste aplicativo.

Next.js e `eslint-config-next` ficam fixados exatamente em **16.3.8**, incluindo `@next/env`, o plugin ESLint e as oito variantes opcionais SWC. A restrição exata mantém esta manutenção no patch examinado, em vez de permitir a resolução de uma versão minor posterior. O lock preserva os demais pacotes, todos os overrides e as condições de plataforma. SHA-256 do lock validado: `a7d80503398f068dc805f62c2f352d6fbdecbec3a7757bc1b7dbf6ec41656a99`.

O frontend continua com `output: "export"` e imagens sem otimização. O aplicativo empacotado consome arquivos estáticos; o [alerta do endpoint MCP](https://github.com/vercel/next.js/security/advisories/GHSA-39w2-rjm5-chcv) refere-se ao servidor de desenvolvimento. A distinção não dispensa a correção do ambiente de desenvolvimento/build.

| Verificação desta rodada, Windows x64 | Resultado |
| --- | --- |
| Ambiente | Node.js 24.19.0; npm 10.9.0 |
| `npm ci --no-audit --no-fund` | Passou; 540 pacotes instalados |
| Engines dos pacotes instalados | Compatíveis com o Node utilizado; variantes opcionais não instaladas foram distinguidas |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passou |
| `npm run lint` | Passou; aviso herdado de `.eslintignore` |
| `npm test` | 406 testes passaram em 31 arquivos |
| `npm run build` | Passou; exportação estática com Next.js 16.3.8 |
| Comparação do lock com HEAD | Somente metadados raiz e 12 pacotes da família Next alterados; oito variantes SWC preservadas |
| `npm audit --package-lock-only --omit=dev --json` | Saída 0; nenhum advisory reportado nessa consulta |
| `npm audit --package-lock-only --json` | Saída 1; cinco entradas high da cadeia braces |
| Árvore Cargo Linux, `--locked --offline --invert glib@0.18.5` | Inspecionada; glib 0.18.5 permanece na cadeia GTK/WebKit/Wry/Tauri |
| `node scripts/packaging/build-local-pilot.mjs --check` | Configuração válida; CLI 2.11.4; sem build ou execução do instalador |
| Links, âncoras, escopo e diff | 55 links locais e três âncoras conferidos; cinco arquivos alterados; `git diff --check` passou; ambos os READMEs preservados |

As auditorias acima examinam o lockfile candidato. Não comprovam ausência de vulnerabilidades nem fechamento dos alertas na branch padrão. A consulta npm ainda informa `braces` 3.0.3 como versão publicada mais recente; o [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) permanece pendente. A sugestão de downgrade da configuração Next para 14.2.35 não é adotada.

O [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html) continua indicando glib corrigido a partir de 0.20.0. A árvore nativa examinada ainda utiliza 0.18.5. Esta rodada não aplica fork, override ou atualização incompatível das bindings; a pendência Linux permanece aberta.

A instalação também emitiu avisos de depreciação das ferramentas herdadas `@esbuild-kit/esm-loader` e `@esbuild-kit/core-utils`. Vitest avisou sobre o futuro carregamento nativo da configuração Vite em CommonJS. Nenhum aviso foi suprimido nesta rodada. Não houve alteração de Rust/Cargo.lock, schema, migração, permissões, CI, runtime de IA ou dados editoriais. Testes nativos, inferência, aceites instalados e acessibilidade já registrados não foram repetidos; não validam automaticamente este novo frontend. No encerramento da validação local, CI da nova revisão, pacote identificado e aceite instalado ainda aguardavam evidência própria. O checkpoint acima registra o CI de branch posteriormente concluído; um novo pacote identificado e seu aceite instalado continuam pendentes.

## Pendência identificada no protótipo de backup — 2026-10-09

O [Incremento 8](../specifications/phase-6.5/PHASE-6.5-INCREMENT-8-WORKSPACE-BACKUP.md) permanece em preparação local separada de PR #14. Seus nove testes sintéticos passaram em Windows e reportaram SQLite 3.46.0. A árvore locked/offline confirma `sqlx-sqlite 0.8.6 → libsqlite3-sys 0.30.1`, utilizada pelo app e pelo plugin SQL. Nenhum manifesto, lock ou binário instalado foi alterado.

A [documentação oficial do SQLite](https://www.sqlite.org/wal.html) descreve o WAL-reset bug, uma corrida rara de escrita/checkpoint com múltiplas conexões em WAL, potencialmente presente nessa versão. A correção upstream é indicada em 3.51.3 ou posterior, com backports 3.44.6 e 3.50.7. Verificar um caminho compatível de manutenção antes de expor backup/restauração; não presumir que o cenário passou a estar seguro porque os testes comuns passaram. Nenhuma corrida de corrupção foi reproduzida e o banco real não foi inspecionado. Essa pendência não integra a manutenção de Next.js do PR #14 e não foi contabilizada como novo alerta Dependabot.

## Investigação de compatibilidade SQLite — 2026-10-09

**Checkpoint histórico: investigação autorizada e experimento local aprovado pelos testes, antes da adoção da estratégia de build.** Nesse checkpoint, manifests, locks, CI e aplicativos instalados permaneciam intactos. A [integração local autorizada posteriormente](#integração-local-do-build-sqlite--2026-10-09) registra o estado candidato atual; a interface de backup continua ausente.

### Restrições verificadas

| Alternativa examinada | Evidência e conclusão |
| --- | --- |
| Patch publicado na série atual | O [registro de libsqlite3-sys](https://crates.io/api/v1/crates/libsqlite3-sys) contém somente 0.30.0 e 0.30.1 nessa série. O [manifesto SQLx 0.8.6](https://github.com/transact-rs/sqlx/blob/v0.8.6/sqlx-sqlite/Cargo.toml) exige `0.30.1`, equivalente à faixa `^0.30.1`; uma atualização normal do lock não alcança o motor corrigido. |
| Atualizar somente o plugin SQL | O plugin publicado [2.4.1](https://crates.io/api/v1/crates/tauri-plugin-sql/2.4.1/dependencies) e o [2.5.0](https://crates.io/api/v1/crates/tauri-plugin-sql/2.5.0/dependencies) continuam exigindo SQLx `^0.8`. O 2.5.0 também exige Tauri `^2.12`; trocar só o plugin não resolve SQLite. |
| Migrar somente o app para SQLx 0.9.0 | O [registro publicado](https://crates.io/api/v1/crates/sqlx/0.9.0) exige Rust 1.94.0, acima do 1.93.0 disponível neste experimento. O plugin conserva SQLx 0.8 e expõe seu pool ao app; substituir uma família isoladamente não é uma migração compatível já demonstrada. Não foi instalado outro toolchain. |
| SQLite corrigido externo, com vínculo estático | O [build.rs publicado de libsqlite3-sys 0.30.1](https://docs.rs/crate/libsqlite3-sys/0.30.1/source/build.rs) permite selecionar a biblioteca externa mesmo com `bundled` habilitado, usando `LIBSQLITE3_SYS_USE_PKG_CONFIG=1`, `SQLITE3_LIB_DIR`, `SQLITE3_INCLUDE_DIR` e `SQLITE3_STATIC=1`. Esta foi a alternativa testada abaixo, mantendo SQLx/plugin/lock do app. |

O Context7 ajudou a localizar as opções de SQLx; suas respostas apontam também para a branch atual upstream. As conclusões de versão/compatibilidade acima usam o código publicado de 0.8.6, o build script efetivamente instalado e os registros exatos consultados em 2026-10-09.

### Experimento executado

Um projeto Rust privado, ignorado pelo Git, compilou `libsqlite3-sys =0.37.0` com `bundled` e `unlock_notify`. Ele forneceu somente a biblioteca estática `sqlite3.lib` ao teste do aplicativo, sem abrir um banco. Esse pacote pertence ao experimento, não à árvore de dependências do Retranca. A árvore do app continua com as bindings 0.30.1, SQLx 0.8.6 e plugin SQL 2.4.0; o motor C vinculado no processo de teste passou a ser **SQLite 3.51.3**.

O arquivo do crate tem SHA-256 `b1f111c8c41e7c61a49cd34e44c7619462967221a6443b0ec299e0ac30cfb9b1`, igual ao [registro oficial de 0.37.0](https://crates.io/api/v1/crates/libsqlite3-sys/0.37.0). O SHA3-256 de `sqlite3.c` foi conferido e corresponde a `32d5424f97e0a7fc5ed2f6335afbb58be4e0298bd7117a34e39d345ff13d859e`, publicado na [release SQLite 3.51.3](https://sqlite.org/releaselog/3_51_3.html). O probe também reportou seu source ID oficial `737ae4a34738ffa0c3ff7f9bb18df914dd1cad163f28fd6b6e114a344fe6d618`. Essa release declara a correção do WAL-reset bug; não é uma afirmação de remediação de todos os problemas de SQLite.

Com as quatro variáveis acima restritas ao processo de teste e caminhos apontando para a biblioteca compilada no experimento:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml --locked --offline --test workspace_backup --test article_content --test article_import --test phase64_persistence -- --nocapture
```

| Verificação local — Windows x64 MSVC, Rust/Cargo 1.93.0, perfil test/debug | Resultado |
| --- | --- |
| Conteúdo e migração de texto (`article_content`) | 4 passaram |
| Importação conservadora (`article_import`) | 7 passaram |
| Persistência e migração 6.4 (`phase64_persistence`) | 17 passaram |
| Criação/verificação do protótipo (`workspace_backup`) | 9 passaram; `sqlite_version()` reportou 3.51.3 |
| Total | 37 passaram; nenhuma falha ou teste ignorado nesses quatro executáveis |

Os testes usaram bancos descartáveis e o núcleo 8A local sobre `9768a87`. Os hashes do manifesto/lock Rust e do README atual permaneceram iguais aos de antes da investigação. Nenhum banco editorial, configuração persistida, instalação normal ou Pilot foi acessado ou atualizado. O aviso herdado de `unused_mut` permanece. Não foi executado o reproducer exato da corrida WAL-reset, build release/instalador, avaliação instalada, Linux ou novo CI deste candidato.

### Proposta apresentada após o experimento

Preparar um processo reproduzível que compile e vincule estaticamente uma versão corretiva fixada de SQLite, preserve uma única cadeia SQLx 0.8/plugin e confira a versão efetivamente vinculada. Não depender de uma DLL que a pessoa usuária precise instalar ou de variáveis configuradas manualmente no IDE. Definir origem/checksums, flags, tratamento de falha e teste que impeça retorno silencioso ao motor antigo; validar compilação limpa, release/empacotamento e as plataformas-alvo. SQLite 3.51.3 é o candidato mínimo testado nesta investigação, não uma escolha definitiva para distribuição.

Naquele checkpoint, a integração nas dependências de build e no CI aguardava autorização específica conforme AGENTS.md. O experimento provava compatibilidade local dos caminhos cobertos, sem corrigir o build padrão. A autorização e a implementação posteriores estão registradas abaixo; a distribuição, o backup em interface e a restauração do banco ativo continuam separados.

## Integração local do build SQLite — 2026-10-09

**Status: build SQLite publicado em `8bb422f`, corrigido em `b9d1464a341f6606cd04d7dea74a69b66da0a8c4` e aprovado nos quatro jobs do [CI dessa correção](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38006207453). Sem integração à main ou atualização instalada.** O trabalho permanece em `codex/phase-6.5-workspace-backup`, baseado em `9768a87` e separado do PR #14. Os testes locais da implementação inicial abaixo conservam seu escopo; o [recibo de CI e da correção](#ci-e-correção-de-seleção-sqlite--2026-10-10) registra a falha Ubuntu e sua resolução. A continuação 8B foi depois publicada em `d7be11c` e aprovada em [CI própria](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38065205746); o início 8C atual é local e ainda não tem CI própria.

### Estratégia aplicada

- A [ferramenta de build separada](../../tools/sqlite-runtime/Cargo.toml) fixa `libsqlite3-sys =0.37.0` e tem lock próprio. Compila o SQLite C 3.51.3 e informa versão, source ID, opções e caminhos sem abrir banco. O código-fonte e seu SHA3-256 são confrontados com a [release oficial SQLite 3.51.3](https://sqlite.org/releaselog/3_51_3.html).
- O [preparador Node](../../scripts/build/prepare-sqlite-runtime.mjs) publica biblioteca estática, header e recibo em `.retranca-local/sqlite-runtime/3.51.3/`, ignorado pelo Git. Confere alvo nativo, opções necessárias, hashes dos artefatos e dos cinco arquivos da receita. Um cache íntegro é reutilizado; um cache incompatível precisa ser preparado novamente.
- A [configuração Cargo](../../.cargo/config.toml) seleciona essa biblioteca por caminhos relativos ao checkout e força vínculo estático. O [build script do app](../../src-tauri/build.rs) recusa preparação ausente, identidade/alvo/opções incompatíveis ou artefatos/receita alterados. A seleção inicial ainda permitiu SQLite do sistema no Ubuntu, detectado pelo teste de identidade. A correção publicada força `SQLITE3_NO_PKG_CONFIG=1` e exige essa flag no build script, selecionando o diretório estático preparado; não é necessária configuração manual de variáveis no IDE.
- O app mantém SQLx 0.8.6, plugin SQL 2.4.0 e as bindings `libsqlite3-sys 0.30.1`. O `libsqlite3-sys 0.37.0` pertence apenas à ferramenta independente, não à árvore do app. Os dois locks principais permanecem byte a byte: Cargo `fbcd24edd9c15a5cecad5aac02a9e43142402af8a5d74603342b8677e0f4c81a` e npm `a7d80503398f068dc805f62c2f352d6fbdecbec3a7757bc1b7dbf6ec41656a99`. As dependências de build adicionadas `serde_json` e `sha2` reutilizam versões já presentes no lock Rust.
- `npm run desktop:dev`, `desktop:build`, `dev:desktop`, `lint:rs` e os dois `test:rs` preparam o motor antes de invocar Tauri/Cargo. O hook Tauri `beforeBuildCommand` também prepara o motor antes do frontend. Cargo direto e `npx --no-install tauri dev` exigem `npm run sqlite:prepare` antes; o [guia local](../development/LOCAL-DEVELOPMENT.md#pinned-native-sqlite-build) mostra a sequência.
- O [CI do build corrigido](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38006207453) prepara o motor e verifica sua identidade real em Windows e Ubuntu. Seus quatro jobs passaram em `b9d1464`. Eventos, permissões, matriz, nomes de jobs e agregador Rust permanecem preservados; Node 24 atende ao processo nativo. Esse run cobre a correção e o núcleo 8A, não as alterações 8B posteriores, cobertas pelo run próprio registrado abaixo.

### Verificações desta implementação

Checkpoint local da implementação depois publicada em `8bb422f`: Windows x64 MSVC, Rust/Cargo 1.93.0, Node.js 24.19.0 e npm 10.9.0. Estes comandos não são resultados do CI de `9768a87` nem da continuação 8B.

| Verificação executada | Resultado |
| --- | --- |
| `node scripts/build/prepare-sqlite-runtime.mjs`, primeira execução | Compilou a ferramenta/motor; versão, source ID, SHA3-256 e opções conferidos. |
| Nova execução do preparador | Reutilizou o cache após conferir receita e hashes; sem recompilar. |
| `node --test scripts/build/__tests__/sqlite-runtime.test.mjs` | 3 passaram: origem/opções/alvo, nome da biblioteca e rejeições de cache ausente, antigo, excessivo ou alterado. |
| `cargo check --manifest-path src-tauri/Cargo.toml --locked --offline` e equivalente `--release` | Ambos passaram. |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked --offline` e equivalente `--release` | Em cada perfil: 155 passaram, nenhuma falha e 1 teste de piloto real ignorado. Incluem 9 testes de backup e 3 do contrato/identidade SQLite. |
| Identidade consultada pelo SQLx nos testes nativos | SQLite 3.51.3 e source ID oficial; opções exigidas presentes. |
| `node node_modules/@tauri-apps/cli/tauri.js build --no-bundle -- --locked` | Build Tauri release passou, incluindo o novo hook, preparação e exportação Next. Gerou executável local, sem instalador. |
| `npm test -- __tests__/packaged-pilot.test.ts` | 19 passaram; contrato do helper Pilot preservado. |
| `node scripts/packaging/build-local-pilot.mjs --check` | Configuração/CLI válidas; sem compilar ou executar instalador. |
| ESLint dos dois novos arquivos Node | Passou; aviso herdado de `.eslintignore` permanece. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passou. |
| `cargo fmt --check`, app e ferramenta separada | Ambos passaram. |
| Revisão documental e de preservação | 129 links locais e 15 âncoras conferidos; scripts existentes; sete arquivos do snapshot íntegros, README original e três fontes Rust anteriores preservados; locks principais e contratos de CI/Tauri conferidos. `git diff --check` passou. |

O compilador conserva o aviso herdado `unused_mut` em `src-tauri/src/provisioning/download.rs:93`. O Vitest conserva seu aviso de carregamento CommonJS. Nenhum deles foi ocultado ou corrigido lateralmente.

### Limites e continuação

A preparação admite builds nativos Windows MSVC e Linux GNU; cross-compilation e outras plataformas são recusadas. A correção publicada passou em Windows e Ubuntu na CI vinculada acima, incluindo check e testes debug/release. Um novo instalador identificado e seu aceite instalado permanecem pendentes. Não foi reproduzida a corrida WAL-reset exata; os testes comprovam a identidade do motor e os cenários cobertos em seus próprios ambientes.

O aplicativo instalado normal/Pilot, os bancos editoriais e o checkout original do AntiGravity permanecem preservados. O núcleo 8A não ganhou IPC, interface ou restauração ativa. A mudança de build resolve o pré-requisito local do motor; não aceita automaticamente backup/restauração, elimina todas as vulnerabilidades nem encerra a fase 6.5. Commit/publicação, integração, distribuição e operação sobre dados reais conservam seus gates específicos.

## CI e correção de seleção SQLite — 2026-10-10

O [CI inicial](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38003416891), em `8bb422feb8f74477426fbf63cb8bdfc3244213ce`, aprovou frontend e Rust Windows. O Ubuntu preparou o SQLite 3.51.3 e passou formatação/check debug, mas o teste de identidade encontrou SQLite **3.45.1** do sistema. Dois testes do contrato passaram e o teste de identidade falhou; a suíte completa debug e as verificações release foram omitidas. O agregador Rust falhou corretamente.

O [build script de libsqlite3-sys 0.30.1](https://docs.rs/crate/libsqlite3-sys/0.30.1/source/build.rs), também inspecionado localmente, consulta `pkg-config` mesmo com `SQLITE3_LIB_DIR` definido. Um `sqlite3.pc` do sistema pode fornecer os metadados e impedir a emissão do diretório estático explícito. Preparar e conferir os artefatos não garantiu qual biblioteca o app vinculou.

O commit `b9d1464a341f6606cd04d7dea74a69b66da0a8c4` força `SQLITE3_NO_PKG_CONFIG=1`, mecanismo específico da biblioteca em [pkg-config 0.3.34](https://docs.rs/pkg-config/0.3.34/pkg_config/), e exige a flag no build script do app. `LIBSQLITE3_SYS_USE_PKG_CONFIG=1` permanece: seleciona o ramo de biblioteca externa nas bindings, enquanto a nova flag evita a descoberta de SQLite do sistema nesse ramo. Não se desativa `pkg-config` de GTK/WebKit. Dependências, locks, CI e protótipo foram preservados nessa correção de dois arquivos.

Um experimento privado no Windows reproduziu a escolha de um diretório de sistema simulado nos dois build scripts instalados; com a flag, ambos emitiram o vínculo estático preparado sem chamar o programa de `pkg-config`. Os 12 testes locais de identidade/backup passaram em cada perfil Windows debug/release, assim como três guardas Node e formatação. Esse experimento não executou um runtime GNU.

Após autorização específica de commit/push/disparo, os quatro jobs do [novo CI](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38006207453) passaram no SHA `b9d1464`: frontend, Rust Windows, Rust Ubuntu e agregador Rust. O [log Ubuntu](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38006207453/job/114075479912) reporta **SQLite 3.51.3**, source ID oficial `2026-03-13 10:38:09 737ae4a34738ffa0c3ff7f9bb18df914dd1cad163f28fd6b6e114a344fe6d618`; suas suítes debug/release também passaram. Isso supera a pendência de vínculo GNU da revisão anterior. Não aceita Linux instalado, um novo Pilot, restauração ativa ou a fase completa.

O responsável autorizou continuar em 2026-10-10. O [protótipo 8B](../specifications/phase-6.5/PHASE-6.5-INCREMENT-8-WORKSPACE-BACKUP.md#protótipo-8b-recuperação-descartável--2026-10-10) recupera uma cópia em destino descartável. Após autorização específica, commit/push e os quatro jobs de [CI própria](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38065205746) passaram no SHA `d7be11c155927d8c58d488aa04d18626d8b6162e`. As etapas de identidade SQLite, formatação, check e testes debug/release passaram em Windows/Ubuntu; frontend passou lint, testes e build. Esse run não compila nem instala um candidato desktop.

O responsável escolheu criação/verificação interna como início do 8C. A [integração 8C](../specifications/phase-6.5/PHASE-6.5-INCREMENT-8-WORKSPACE-BACKUP.md#integração-8c-inicial-criação-e-verificação-internas--2026-10-10) acrescenta controlador, IPC e painel, reutilizando dependências, locks, pool SQL e identidade existentes. O 8C tem resultados locais próprios e, após autorização específica, foi publicado em `5efa88d` e aprovado nos quatro jobs de [CI própria](https://github.com/jornalistainclusivo/retranca-os/actions/runs/38069861194), conforme o [registro do incremento](../specifications/phase-6.5/PHASE-6.5-INCREMENT-8-WORKSPACE-BACKUP.md#publicação-e-ci-do-início-8c--2026-10-10). O aceite com IPC real no aplicativo instalado continua pendente; nenhum banco real, executável instalado, migração, permissão, configuração de CI ou runtime de IA foi alterado.

## Contexto

O GitHub apresentou oito registros Dependabot na branch padrão. Os manifests e locks correspondentes também estavam na revisão `71d25c088887231001329ae3d9fc659dcc6ad5a5` da fase 6.5. A manutenção foi isolada em `codex/security-dependencies`, baseada na `main` `1b7de720ff8f87060cd2f945b8c65ec598679471`, preservando a branch, os dados e o executável piloto do responsável.

| Dependência | Versão anterior | Candidato | Referência primária |
| --- | --- | --- | --- |
| Next.js | 16.3.4 | 16.3.6 | [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) |
| sharp | 0.35.4 | 0.35.5 | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) |
| source-map-js | 1.2.1 | 1.2.2 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| postcss-selector-parser | 6.0.10 | 7.1.6 | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) |
| brace-expansion, família 1 | 1.1.18 | 1.1.21 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) |
| brace-expansion, família 5 | 5.0.9 | 5.0.12 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) |
| rustls | 0.23.44 | 0.23.45 | [RUSTSEC-2026-0285](https://rustsec.org/advisories/RUSTSEC-2026-0285.html) |
| glib | 0.18.5 | Sem alteração; pendente | [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html) |

O frontend usa exportação estática e imagens sem otimização do Next. Não foi identificado caminho de conteúdo editorial para os parsers de CSS, sourcemaps, padrões glob ou sharp nas fontes examinadas. Isso limita a exposição observada, mas não elimina o risco de instalar e executar dependências vulneráveis durante o desenvolvimento/build. O rustls integra clientes HTTP nativos; a prontidão e a geração Ollama têm controles de loopback, mas o preflight legado usa um cliente com políticas de proxy/redirect diferentes. Portanto, o TLS não é declarado inalcançável em todo o aplicativo.

## Decisão de implementação

- Atualizar Next e `eslint-config-next` juntos para `^16.3.6`, mantendo compatibilidade entre framework e configuração de lint. Preservar todos os overrides anteriores.
- Atualizar sharp, source-map-js e as duas famílias de brace-expansion no lock, sem substituir as dependências por implementações locais. Preservar os artefatos opcionais de plataformas e suas condições `os`/`cpu`.
- Aplicar `postcss-selector-parser: 7.1.6` somente dentro de `@tailwindcss/typography`. A versão atual de typography ainda declara exatamente `6.0.10`; sua simples atualização não remove o parser afetado. Não aplicar um override global.
- Proteger o contrato efetivamente utilizado por typography: pseudoseletores finais, listas de seletores, seletores funcionais e ordenação. Comparar a saída completa de estilos e variantes antes/depois, além de testar entradas planas de classes e IDs que provocam custo excessivo no parser antigo. Retirar o override quando uma versão oficial de typography consumir um parser corrigido e essas verificações continuarem passando.
- Atualizar somente rustls e seu checksum no Cargo.lock. Preservar o vínculo original `tempfile -> getrandom 0.4.3`; os consumidores atuais aceitam rustls 0.23.45. Nenhuma dependência direta, schema ou migração é adicionada.
- Manter glib 0.18.5 explicitamente pendente. GTK/WebKit/Wry da árvore suportada ainda exige a família 0.18. Forçar glib 0.20, atualizar apenas a biblioteca de sistema ou introduzir fork sem validação coordenada não resolve esse contrato. A atualização das bindings requer release compatível ou backport oficial; não faz parte deste candidato.

## Pendência adicional da auditoria

`npm audit --json` identificou o [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) em **braces 3.0.3**, com cinco entradas npm afetadas ao contar seus dependentes: braces, micromatch, fast-glob, `@next/eslint-plugin-next` e `eslint-config-next`. É uma vulnerabilidade diferente de **brace-expansion**. A cadeia já existia antes deste candidato e não foi introduzida pelo update.

Na consulta de 07/10/2026, o advisory não oferece versão corrigida e a versão publicada mais recente de braces continua 3.0.3. A sugestão automática de voltar `eslint-config-next` para 14.2.35 não é adotada: quebraria o alinhamento com Next 16. A auditoria tem saída não zero e permanece uma pendência, mesmo com lint, testes e build aprovados. Não executar `npm audit fix --force`, ocultar o aviso ou remover o lint para obter um resultado verde.

## Verificação e limites

As execuções usam apenas arquivos de código rastreados e fixtures descartáveis em cópias temporárias. A branch de segurança é verificada no baseline da main; a aplicação do mesmo conjunto de dependências sobre `71d25c0` verifica separadamente a continuidade da fase 6.5. SQLite/AppData, pautas reais, exportações privadas e o executável instalado não são lidos, alterados ou publicados.

O teste versionado [dependency-typography-compatibility.test.ts](../../__tests__/dependency-typography-compatibility.test.ts) verifica seis controles legítimos e duas entradas planas em processos isolados, com limites de tempo e memória. A investigação e os recibos locais completos são mantidos em artefatos gerenciados de Codex Security; não integram os dados editoriais do repositório.

A validação local não prova execução de exploits de Next, sharp ou rustls, correção do glib, operação real de IA, compatibilidade Linux ou conformidade WCAG. Os checks Windows e frontend, a revisão do diff, o resultado não zero da auditoria e as pendências de revisão/CI são registrados separadamente. O estado global de remediação continua **blocked**, com sete registros originais atualizados no candidato e pendências upstream e de plataforma explícitas.

| Check local | Branch de segurança sobre `1b7de72` | Integração sobre `71d25c0` |
| --- | --- | --- |
| npm ci, Node 24.19.0 | Passou, 540 pacotes | Passou, 540 pacotes |
| Tipos, lint, build estático Next 16.3.6 | Passaram | Passaram |
| Testes frontend | 358 testes / 28 arquivos | 372 testes / 30 arquivos |
| Rust Windows debug | 128 passaram | 141 passaram; 1 ignorado |
| Rust Windows release | 128 passaram | 141 passaram; 1 ignorado |
| cargo fmt, check debug/release com lock | Passaram | Passaram |
| Auditoria npm do lock compartilhado | Cinco entradas high; saída 1 na integração | Não passou; braces pendente |
| Linux / CI da nova revisão | Pendente | Pendente |

O parser antigo excedeu o limite de oito segundos no processo isolado de classe com 400 KB. O corrigido processou o mesmo caso e a variante de ID em aproximadamente 141 ms e 128 ms, preservando os 200 mil nós e a reconstrução exata. São medições locais, sem promessa de desempenho geral. A saída completa de typography permaneceu idêntica em oito combinações e dez controles de pseudoseletores. Source-map, as duas famílias de brace-expansion e um SVG legítimo convertido por sharp também preservaram o comportamento observado.

Dois investigadores independentes concluíram a análise de fronteiras e compatibilidade. A revisão fresca do candidato confirmou parcialmente a árvore e os artefatos de plataforma, mas foi interrompida por limite de uso antes do relatório final. A revisão restante foi realizada pelo implementador em uma passagem separada; não equivale a aceite independente completo. Nenhuma mudança em configuração de CI, permissões, runtime de IA, interface, banco ou dados editoriais foi feita.

Os alertas do GitHub só podem ser reavaliados após a integração autorizada na branch padrão. Não alegar fechamento remoto com base no lock local nem reutilizar o CI anterior da fase 6.5 como evidência desta manutenção.
