# Primeiros passos no Retranca OS

O Retranca organiza pautas e conteúdo editorial no seu computador. Você pode usar o planejamento, os checklists e o CMS sem IA. Todas as personalizações da edição única estão disponíveis sem conta ou assinatura.

## Como obter e abrir

**Ainda não existe instalador público para baixar com um clique.** Confira a [página de releases](https://github.com/jornalistainclusivo/retranca-os/releases) para acompanhar a disponibilidade. O código-fonte está no repositório; seu ZIP precisa ser preparado e compilado conforme o [guia de desenvolvimento](../development/LOCAL-DEVELOPMENT.md).

Se você recebeu um piloto local para teste, use o instalador e as instruções identificadas daquela rodada. O piloto atual usa Windows x64, requer WebView2 já instalado e mantém seus dados separados do aplicativo normal. Ele ainda não é uma release assinada de distribuição. O [checkpoint do piloto](../testing/PHASE-6.5-INCREMENT-7-INTEGRATION.md) registra a identidade e o alcance dos testes.

Após instalar, abra **Retranca OS Pilot** pelo atalho criado. Para a cópia executada pelo código-fonte, use o comando de desktop do guia de desenvolvimento.

## Crie sua primeira pauta

1. Abra **Início**, a primeira página da barra lateral. Ela reúne orientações, atalhos, pautas recentes e conquistas.
2. Confira as etapas e categorias sugeridas. Você pode usá-las ou abrir **Configurações Editoriais** para adaptá-las.
3. Selecione **Nova Pauta** ou **Criar minha primeira pauta**. Defina título, prazo, categoria e etapa.
4. Preencha **Resumo**, **Objetivo da Matéria** e **Conteúdo para análise (Texto completo)** conforme seu trabalho. O texto completo pertence apenas a essa pauta.
5. Selecione **Salvar Pauta no CMS** e aguarde o salvamento terminar. A pauta salva aparecerá nas páginas de produção.

O ambiente começa sem pautas de exemplo. Se não houver etapa ou categoria ativa, aguarde o carregamento ou abra as configurações para conferir o que falta. Em caso de falha no carregamento, use a tentativa novamente oferecida pela interface.

## Encontre seu trabalho

| Página | Para que serve |
| --- | --- |
| Início | Orientações, atalhos, pautas salvas recentemente e conquistas. |
| Quadro Kanban | Pautas distribuídas pelas etapas do seu fluxo. |
| CMS Editorial (Lista) | Lista de pautas e abertura do editor com conteúdo e checklist. |
| Calendário | Organização das pautas pelos prazos. |
| Estatísticas e conquistas | Indicadores e conquistas baseados nas pautas salvas. |
| Bloco de notas | Anotações de trabalho. |
| Configurações Editoriais | Etapas, categorias e templates de checklist. |

A pesquisa, os filtros de prazo e os filtros de categoria ajudam a localizar pautas. Se uma pauta antiga estiver sem etapa ou categoria válida, o aplicativo a apresenta para conferência: abra o CMS e escolha os vínculos adequados. Os totais incluem esses registros preservados.

## Personalize o fluxo

Em **Configurações Editoriais**, escolha **Etapas do Fluxo**, **Categorias** ou **Templates de Checklist**.

O nome de uma etapa é livre. Sua classificação informa a função editorial, como ideia, pesquisa, redação, revisão ou publicado; ela pode ser diferente do nome. A função de publicação identifica uma pauta concluída no Retranca. Mover uma pauta para essa etapa não publica a matéria em um site.

As categorias sugeridas também podem ser renomeadas. Para remover uma etapa ou categoria com pautas associadas, escolha o destino dessas pautas quando o aplicativo solicitar. As proteções de integridade do fluxo e dos templates continuam valendo; uma edição aberta não elimina esses requisitos.

## Salve o conteúdo

Use **Salvar Pauta no CMS** para guardar o texto completo e os demais campos daquela pauta. Fechar ou cancelar o editor sem salvar pode descartar as alterações.

Se o salvamento falhar, o editor mantém o texto e mostra uma mensagem. Preserve uma cópia do rascunho antes de reiniciar; tente salvar novamente após resolver o problema.

As sugestões da IA são temporárias. Para guardar uma sugestão, selecione **Copiar**, revise o conteúdo, incorpore a parte desejada ao campo da pauta e salve no CMS. Cancelar uma geração interrompe o trabalho; o trecho parcial não é salvo automaticamente como texto da pauta. O original já salvo permanece preservado.

## Configure a IA local

O Ollama e um modelo já instalado são necessários apenas para usar a assistência. Consulte a [documentação oficial do Ollama](https://docs.ollama.com/quickstart) para preparar esse serviço.

A versão atual do Retranca aceita exatamente os servidores Ollama `0.35.1` e `0.40.1`, registrados no [ADR-016](../decisions/ADR-016-PRODUCTION-LOCAL-AI-PROVIDER.md#compatibility-amendment--2026-10-08). Instalar uma versão diferente do Ollama pode fazer o Retranca bloquear a geração até sua compatibilidade ser validada.

1. Mantenha o Ollama em execução neste computador.
2. Abra o botão **IA local**, no canto inferior direito.
3. Selecione **Atualizar modelos** se precisar renovar a lista.
4. Escolha um modelo instalado e selecione **Verificar modelo**.
5. Confira a mensagem de disponibilidade antes de pedir a geração.

A seleção vale durante a sessão; ao reabrir o Retranca, escolha o modelo novamente. O aplicativo não baixa modelos automaticamente. Modelos remotos e modelos sem a capacidade necessária são bloqueados. O motor embutido permanece previsto para uma etapa futura.

No CMS, escolha a ação desejada. As seis ações são **Pesquisar Lacunas**, **Simplificar Linguagem**, **Validar Inclusividade**, **Alt Text WCAG**, **Otimizar Meta Tags SEO** e **Revisão Editorial**. Cada ação pode exigir resumo, objetivo, texto completo ou descrição visual; a interface informa os itens que faltam.

O Alt Text usa uma descrição visual escrita. Upload de imagens/arquivos e visão multimodal ainda não estão implementados. Confira fatos, fontes, linguagem e acessibilidade antes de incorporar uma sugestão.

## Teclado e zoom

Use **Tab** e **Shift + Tab** para navegar pelos controles. A navegação lateral indica a página atual e os filtros indicam sua seleção.

Os diálogos e o painel de IA local oferecem fechamento; no painel de IA, use o **X** ou **Escape** para fechar e devolver o foco ao botão **IA local**. Um diálogo em primeiro plano recebe a prioridade de Escape.

No Windows, use **Ctrl + +** para ampliar, **Ctrl + -** para reduzir e **Ctrl + 0** para restaurar o zoom. Use a rolagem para alcançar o conteúdo ampliado. Os testes relatados do piloto cobrem esse comportamento; a avaliação ampla de acessibilidade e o zoom em outras plataformas ainda têm critérios pendentes.

## Seus dados

No desktop, o conteúdo fica em um banco SQLite local. O ambiente normal e o piloto usam identificadores distintos e não compartilham automaticamente suas pautas.

No cabeçalho, use **Exportar pautas para arquivo JSON local** para obter um arquivo de pautas e **Importar pautas de arquivo JSON local** para adicionar pautas ao ambiente.

A importação preserva pautas com IDs já existentes; ela não substitui seu conteúdo por uma cópia do arquivo. Pautas novas precisam referenciar etapas e categorias válidas no ambiente de destino. Se o arquivo usar categorias personalizadas ausentes, a importação poderá ser rejeitada; confira a configuração antes de tentar novamente.

A exportação JSON não inclui os catálogos personalizados, o banco completo nem anexos. Portanto, ela não comprova uma restauração integral do aplicativo. O fluxo completo de backup/restauração continua no [plano da fase 6.5](../architecture/PHASE-6.5-PRODUCTION-EXPERIENCE-PLAN.md).

Arquivos exportados podem conter informações editoriais privadas. Mantenha-os no destino local escolhido e não os envie ao repositório público. Não apague o banco de dados para atualizar o aplicativo.

## Quando algo não funcionar

| Situação | O que conferir |
| --- | --- |
| Não consigo criar uma pauta | Aguarde o carregamento e confira uma etapa e categoria ativas nas configurações. |
| Não consigo salvar | Preserve o rascunho, observe a mensagem do editor e tente novamente; não feche antes de copiar o texto ainda não salvo. |
| A lista de modelos está vazia | Confira o Ollama em execução e os modelos instalados; depois use Atualizar modelos. |
| O servidor não é compatível | Confira a versão indicada pelo painel e as duas versões aceitas acima. Não troque seu modelo ou apague pautas para tentar resolver isso. |
| A IA informa que faltam dados | Preencha os campos que a ação solicita e verifique o modelo. |
| Uma pauta entrou no total mas não está na etapa esperada | Confira pesquisa/filtros e os registros que precisam de etapa ou categoria válida. |
| O trecho da IA desapareceu após cancelar/reabrir | A resposta é temporária; incorpore uma sugestão revisada ao conteúdo e salve para mantê-la. |

Para relatar um problema de interface, inclua página, ação, mensagem e versão testada. Não envie textos privados, fontes ou exportações editoriais como exemplo público.
