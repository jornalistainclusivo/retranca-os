# ADR 018: Dependency Security Maintenance

## Status

Manutenção parcial integrada, após autorizações explícitas, pelo [PR #7](https://github.com/jornalistainclusivo/retranca-os/pull/7) na `main`, em `5f7ba349acafe2dc45b9bbadd3271bac4440d86a`. Os quatro jobs do [CI #31](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37695557140) passaram nesse merge. O responsável também autorizou incorporar essa base à branch `codex/phase-6.5-runtime-pilot`, preservando os Incrementos 4–5, com um commit local de merge; push e CI da revisão combinada conservam seus próprios gates. Esta decisão não encerra a fase 6.5, as pendências glib/braces ou a distribuição.

Checkpoint de revisão: o mesmo revisor independente, antes interrompido pelo limite de uso, concluiu seu ciclo sobre `ad6d84ca22f09553e47b4a9c9d66bbcb1835f444`, sem identificar regressão concreta nos contratos/famílias de plataformas examinados. Todos os quatro jobs dos CIs [#29](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37688342468) e [#30](https://github.com/jornalistainclusivo/retranca-os/actions/runs/37692477632) passaram nessa revisão. O relato local original abaixo é histórico; a interrupção e o CI pendente foram superados por esses recibos, sem repetir a inferência, inspecionar dados editoriais ou ampliar a revisão para uma auditoria de todo o repositório. Build/testes Linux não equivalem a aceite do aplicativo instalado.

## Manutenção local — 2026-10-09

Esta rodada parte da `main` `96a309384ccb7b337dcce65b39a7519eb1ac02d7` e do commit local de README `963bbd456a120a0593e18cec22edcb112b1f6802`, na branch `codex/phase-6.5-release-readiness`. A correção abaixo foi validada localmente; publicação e integração permanecem pendentes e conservam autorizações e evidências próprias. Os resultados históricos das seções seguintes conservam seus próprios commits e escopos.

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

A instalação também emitiu avisos de depreciação das ferramentas herdadas `@esbuild-kit/esm-loader` e `@esbuild-kit/core-utils`. Vitest avisou sobre o futuro carregamento nativo da configuração Vite em CommonJS. Nenhum aviso foi suprimido nesta rodada. Não houve alteração de Rust/Cargo.lock, schema, migração, permissões, CI, runtime de IA ou dados editoriais. Testes nativos, inferência, aceites instalados e acessibilidade já registrados não foram repetidos; não validam automaticamente este novo frontend. CI da nova revisão, pacote identificado e aceite instalado ainda precisam de evidência própria.

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
