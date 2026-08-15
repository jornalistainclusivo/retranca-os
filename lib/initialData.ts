import { Article, ChecklistItem, GovernanceDoc } from '@/types/editorial';

const createDefaultChecklist = (): ChecklistItem[] => [
  { id: 'chk_1', label: 'Pesquisa pronta e checagem de fatos', completed: true, category: 'pesquisa' },
  { id: 'chk_2', label: 'Fontes e entrevistas revisadas com consentimento', completed: true, category: 'pesquisa' },
  { id: 'chk_3', label: 'Escrita em Linguagem Simples (fácil leitura)', completed: false, category: 'editorial' },
  { id: 'chk_4', label: 'Pesquisa de Palavra-Chave e SEO On-Page', completed: false, category: 'seo' },
  { id: 'chk_5', label: 'Inclusão de 2+ Links Internos da Plataforma', completed: false, category: 'seo' },
  { id: 'chk_6', label: 'Criação de Imagem com Alto Contraste', completed: false, category: 'acessibilidade' },
  { id: 'chk_7', label: 'Descrição Alt Text detalhada no WCAG 2.2 AA', completed: false, category: 'wcag' },
  { id: 'chk_8', label: 'Marcação de Schema.org NewsArticle', completed: false, category: 'seo' },
  { id: 'chk_9', label: 'Auditoria Ética de IA (sem vieses capacitistas)', completed: false, category: 'ia' },
  { id: 'chk_10', label: 'Divulgação no LinkedIn com Card Acessível', completed: false, category: 'distribuicao' },
  { id: 'chk_11', label: 'Edição especial para Newsletter RETRANCA', completed: false, category: 'distribuicao' },
  { id: 'chk_12', label: 'Arquivado na Central de Documentos', completed: false, category: 'editorial' },
  { id: 'chk_13', label: 'Publicado no Portal Retranca', completed: false, category: 'distribuicao' },
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art_1',
    title: 'IA para Acessibilidade: Ferramentas Reais para Redações Inclusivas',
    status: 'escrita',
    categoryTag: 'IA',
    tags: ['IA', 'Acessibilidade', 'Inovação'],
    publishDate: '2026-08-08',
    summary: 'Como jornalistas podem usar inteligência artificial generativa para gerar descrições de imagem, transcrições em tempo real e verificação de linguagem capacitista.',
    objective: 'Demonstrar casos práticos de IA ética aumentando a acessibilidade no jornalismo digital.',
    keyword: 'IA para acessibilidade',
    persona: 'Editores de conteúdo, jornalistas e analistas de comunicação.',
    cta: 'Acesse nosso guia gratuito de Prompts de Acessibilidade.',
    internalLinks: 'https://retranca.com/manual-linguagem-simples',
    externalLinks: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    estimatedTime: '3h 30m',
    spentTime: '2h 10m',
    notes: 'Priorizar exemplos com ferramentas open source e gratuitas.',
    checklists: [
      { id: 'chk_1_1', label: 'Pesquisa de mercado de ferramentas IA', completed: true, category: 'pesquisa' },
      { id: 'chk_1_2', label: 'Entrevista com especialista de acessibilidade digital', completed: true, category: 'pesquisa' },
      { id: 'chk_1_3', label: 'Redação da introdução e casos práticos', completed: true, category: 'editorial' },
      { id: 'chk_1_4', label: 'Revisão SEO e meta-descriptions', completed: false, category: 'seo' },
      { id: 'chk_1_5', label: 'Criar imagem com alt text informativo', completed: false, category: 'acessibilidade' },
      { id: 'chk_1_6', label: 'Publicação e distribuição no LinkedIn', completed: false, category: 'distribuicao' },
    ],
    history: [
      { id: 'h1', date: '2026-08-01T10:00:00Z', action: 'Pauta criada no sistema' },
      { id: 'h2', date: '2026-08-02T14:30:00Z', action: 'Status alterado de Pesquisa para Escrita' },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-02T14:30:00Z',
  },
  {
    id: 'art_2',
    title: 'Carrossel Acessível: Design de Redes sem Barreiras Visuais',
    status: 'escrita',
    categoryTag: 'Acessibilidade',
    tags: ['Acessibilidade', 'Social', 'Design'],
    publishDate: '2026-08-08',
    summary: 'Boas práticas para fontes legíveis, contraste de cores, ordem de leitura e legendas nas redes sociais.',
    objective: 'Ensinar comunicadores a criarem carrosséis no Instagram e LinkedIn totalmente acessíveis.',
    keyword: 'Carrossel acessivel redes sociais',
    persona: 'Social Media Managers e Designers de Conteúdo.',
    cta: 'Baixe o gabarito Figma para carrossel acessível.',
    internalLinks: 'https://retranca.com/guia-cores-contraste',
    externalLinks: 'https://webaim.org/resources/contrastchecker/',
    estimatedTime: '2h',
    spentTime: '1h 15m',
    notes: 'Incluir checklist de fontes com serifa x sem serifa.',
    checklists: [
      { id: 'chk_2_1', label: 'Pesquisa pronta e dados de legibilidade', completed: true, category: 'pesquisa' },
      { id: 'chk_2_2', label: 'Fontes e contraste testados no WebAIM', completed: true, category: 'acessibilidade' },
      { id: 'chk_2_3', label: 'Rascunho do texto para os slides', completed: true, category: 'editorial' },
      { id: 'chk_2_4', label: 'Validação WCAG do contraste das imagens', completed: false, category: 'wcag' },
      { id: 'chk_2_5', label: 'Alt text formatado para leitor de tela', completed: false, category: 'acessibilidade' },
    ],
    history: [
      { id: 'h1', date: '2026-08-01T11:00:00Z', action: 'Pauta cadastrada' },
    ],
    createdAt: '2026-08-01T11:00:00Z',
    updatedAt: '2026-08-02T09:15:00Z',
  },
  {
    id: 'art_3',
    title: 'Autismo sem Estereótipos: 5 Erros Comuns na Imprensa',
    status: 'revisao',
    categoryTag: 'Inclusão',
    tags: ['Autismo', 'Inclusão', 'Linguagem'],
    publishDate: '2026-08-05',
    summary: 'Análise de terminologias defasadas e como abordar o Transtorno do Espectro Autista com respeito e veracidade.',
    objective: 'Eliminar termos preconceituosos em matérias jornalísticas sobre autismo.',
    keyword: 'Autismo sem estereotipos imprensa',
    persona: 'Repórteres, redatores e estagiários de jornalismo.',
    cta: 'Consulte nosso glossário de termos neurodivergentes.',
    internalLinks: 'https://retranca.com/glossario-neurodiversidade',
    externalLinks: 'https://autismo.org.br',
    estimatedTime: '4h',
    spentTime: '3h 45m',
    notes: 'Revisado por 2 consultores neurodivergentes.',
    checklists: [
      { id: 'chk_3_1', label: 'Pesquisa pronta e entrevistas realizadas', completed: true, category: 'pesquisa' },
      { id: 'chk_3_2', label: 'Fontes neurodivergentes ouvidas', completed: true, category: 'pesquisa' },
      { id: 'chk_3_3', label: 'Escrita e adequação gramatical', completed: true, category: 'editorial' },
      { id: 'chk_3_4', label: 'Revisão SEO e palavra-chave no H1', completed: true, category: 'seo' },
      { id: 'chk_3_5', label: 'Links internos e externos adicionados', completed: true, category: 'seo' },
      { id: 'chk_3_6', label: 'Aprovado na revisão editorial final', completed: false, category: 'editorial' },
    ],
    history: [
      { id: 'h1', date: '2026-07-28T09:00:00Z', action: 'Pauta iniciada' },
      { id: 'h2', date: '2026-08-02T11:00:00Z', action: 'Enviado para revisão' },
    ],
    createdAt: '2026-07-28T09:00:00Z',
    updatedAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'art_4',
    title: 'Diretrizes WCAG 2.2 na Prática para Comunicadores e Editores',
    status: 'publicado',
    categoryTag: 'Acessibilidade',
    tags: ['Acessibilidade', 'WCAG', 'Docs'],
    publishDate: '2026-08-01',
    summary: 'Resumo das novidades do WCAG 2.2 aplicadas ao conteúdo editorial, incluindo alvos de toque, foco e contraste.',
    objective: 'Traduzir a norma técnica do W3C para o vocabulário cotidiano de uma redação.',
    keyword: 'WCAG 2.2 para comunicadores',
    persona: 'Líderes de conteúdo e desenvolvedores editorial.',
    cta: 'Inscreva-se na Masterclass de Acessibilidade WCAG.',
    internalLinks: 'https://retranca.com/wcag-comunicacao',
    externalLinks: 'https://www.w3.org/TR/WCAG22/',
    estimatedTime: '5h',
    spentTime: '4h 50m',
    notes: 'Artigo com excelente repercussão no LinkedIn.',
    checklists: [
      { id: 'chk_4_1', label: 'Pesquisa técnica detalhada', completed: true, category: 'pesquisa' },
      { id: 'chk_4_2', label: 'Exemplos práticos de HTML acessível', completed: true, category: 'editorial' },
      { id: 'chk_4_3', label: 'Imagens com Alt Text detalhado', completed: true, category: 'acessibilidade' },
      { id: 'chk_4_4', label: 'Aprovado pelo conselho editorial', completed: true, category: 'editorial' },
      { id: 'chk_4_5', label: 'Disparado na Newsletter semanal', completed: true, category: 'distribuicao' },
      { id: 'chk_4_6', label: 'Publicado e indexado', completed: true, category: 'distribuicao' },
    ],
    history: [
      { id: 'h1', date: '2026-07-20T08:00:00Z', action: 'Pauta cadastrada' },
      { id: 'h2', date: '2026-08-01T15:00:00Z', action: 'Artigo publicado com sucesso!' },
    ],
    createdAt: '2026-07-20T08:00:00Z',
    updatedAt: '2026-08-01T15:00:00Z',
  },
  {
    id: 'art_5',
    title: 'Linguagem Simples: Como Reduzir o Jargão e Democratizar a Notícia',
    status: 'pesquisa',
    categoryTag: 'Linguagem Simples',
    tags: ['Linguagem Simples', 'Inclusão', 'Blog'],
    publishDate: '2026-08-10',
    summary: 'Metodologia para aplicar frases curtas, ordem direta e palavras de uso comum na cobertura de temas complexos.',
    objective: 'Explicar a técnica de Plain Language para jornalistas de política e economia.',
    keyword: 'Linguagem simples no jornalismo',
    persona: 'Repórteres investigativos e redatores de portais.',
    cta: 'Baixe o checklist de revisão em Linguagem Simples.',
    internalLinks: 'https://retranca.com/linguagem-simples-guia',
    externalLinks: 'https://plainlanguagenetwork.org',
    estimatedTime: '3h',
    spentTime: '1h',
    notes: 'Agendada entrevista com pesquisadora da USP.',
    checklists: [
      { id: 'chk_5_1', label: 'Levantamento de diretrizes nacionais e internacionais', completed: true, category: 'pesquisa' },
      { id: 'chk_5_2', label: 'Seleção de notícias antes e depois da simplificação', completed: false, category: 'pesquisa' },
      { id: 'chk_5_3', label: 'Redação e testes de legibilidade Flesch', completed: false, category: 'editorial' },
    ],
    history: [
      { id: 'h1', date: '2026-08-02T10:00:00Z', action: 'Pauta criada' },
    ],
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'art_6',
    title: 'Prompt Engineering para Jornalistas: Ética e Produtividade',
    status: 'ideia',
    categoryTag: 'IA',
    tags: ['IA', 'Prompt Engineering', 'Tecnologia'],
    publishDate: '2026-08-12',
    summary: 'Como construir prompts eficientes para sintetizar documentos públicos sem alucinações e mantendo o rigor jornalístico.',
    objective: 'Capacitar a redação a utilizar LLMs como assistentes de pesquisa.',
    keyword: 'Prompt engineering jornalismo',
    persona: 'Jornalistas investigativos e editores de inovação.',
    cta: 'Acesse nossa biblioteca de Prompts Jornalísticos.',
    internalLinks: 'https://retranca.com/prompts-jornalismo',
    externalLinks: 'https://ai.google.dev',
    estimatedTime: '3h',
    spentTime: '0m',
    notes: 'Aguardando validação do editor-chefe.',
    checklists: [
      { id: 'chk_6_1', label: 'Elaboração da estrutura da pauta', completed: false, category: 'editorial' },
      { id: 'chk_6_2', label: 'Testes de prompts com Gemini 3.6 Flash', completed: false, category: 'ia' },
    ],
    history: [
      { id: 'h1', date: '2026-08-02T12:00:00Z', action: 'Ideia adicionada à fila' },
    ],
    createdAt: '2026-08-02T12:00:00Z',
    updatedAt: '2026-08-02T12:00:00Z',
  },
  {
    id: 'art_7',
    title: 'Como Entrevistar Pessoas com Deficiência com Respeito e Empatia',
    status: 'publicado',
    categoryTag: 'Inclusão',
    tags: ['Inclusão', 'Acessibilidade', 'Entrevistas'],
    publishDate: '2026-07-25',
    summary: 'Guia prático com perguntas adequadas, acessibilidade em estúdio e preparação prévia para entrevistas inclusivas.',
    objective: 'Orientar repórteres sobre postura ética e capacitismo estrutural.',
    keyword: 'Como entrevistar pessoas com deficiencia',
    persona: 'Apresentadores, repórteres de campo e produtores.',
    cta: 'Confira a gravação do Webinar de Boas Práticas.',
    internalLinks: 'https://retranca.com/webinar-entrevistas',
    externalLinks: 'https://www.gov.br/mdh/pt-br/assuntos/pessoa-com-deficiencia',
    estimatedTime: '4h',
    spentTime: '4h',
    notes: 'Conteúdo mais lido do mês anterior.',
    checklists: [
      { id: 'chk_7_1', label: 'Pesquisa e entrevistas completadas', completed: true, category: 'pesquisa' },
      { id: 'chk_7_2', label: 'Revisão gramatical e de tom', completed: true, category: 'editorial' },
      { id: 'chk_7_3', label: 'Checklist de Acessibilidade atendeu WCAG AA', completed: true, category: 'wcag' },
      { id: 'chk_7_4', label: 'Publicado e compartilhado', completed: true, category: 'distribuicao' },
    ],
    history: [
      { id: 'h1', date: '2026-07-15T10:00:00Z', action: 'Pauta cadastrada' },
      { id: 'h2', date: '2026-07-25T16:00:00Z', action: 'Artigo publicado' },
    ],
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-25T16:00:00Z',
  },
  {
    id: 'art_8',
    title: 'Política Editorial do Retranca: Diretrizes Internas',
    status: 'revisao',
    categoryTag: 'Docs',
    tags: ['Docs', 'Política', 'Inclusão'],
    publishDate: '2026-08-04',
    summary: 'Manual de conduta, verificação de dados, diversidade nas fontes e padrões de acessibilidade mandatários.',
    objective: 'Documentar a governança oficial do portal para novos colaboradores.',
    keyword: 'Politica editorial jornalista inclusivo',
    persona: 'Toda a equipe jornalística e estagiários.',
    cta: 'Leia nosso Código de Ética completo.',
    internalLinks: 'https://retranca.com/codigo-etica',
    externalLinks: 'https://fenaj.org.br',
    estimatedTime: '6h',
    spentTime: '5h 30m',
    notes: 'Falta apenas homologação final do conselho.',
    checklists: [
      { id: 'chk_8_1', label: 'Consenso das normas éticas', completed: true, category: 'editorial' },
      { id: 'chk_8_2', label: 'Revisão de acessibilidade e WCAG', completed: true, category: 'wcag' },
      { id: 'chk_8_3', label: 'Aprovação jurídica e editorial', completed: false, category: 'editorial' },
    ],
    history: [
      { id: 'h1', date: '2026-07-29T14:00:00Z', action: 'Documento em redação' },
    ],
    createdAt: '2026-07-29T14:00:00Z',
    updatedAt: '2026-08-02T13:00:00Z',
  },
  {
    id: 'art_9',
    title: 'Audiodescrição em Portais de Notícias: Padrões e Exemplo Prático',
    status: 'escrita',
    categoryTag: 'Acessibilidade',
    tags: ['Acessibilidade', 'Audiodescrição', 'SEO'],
    publishDate: '2026-08-09',
    summary: 'Como gravar ou gerar audiodescrições concisas para infográficos, charge e fotos jornalísticas.',
    objective: 'Demonstrar a implementação de players de audiodescrição em HTML5 puro.',
    keyword: 'Audiodescricao portais noticias',
    persona: 'Produtores multimídia e editores web.',
    cta: 'Ouça o exemplo em áudio no artigo.',
    internalLinks: 'https://retranca.com/player-acessivel',
    externalLinks: 'https://www.w3.org/WAI/media/av/',
    estimatedTime: '3h',
    spentTime: '2h',
    notes: 'Gravação da faixa de áudio agendada.',
    checklists: [
      { id: 'chk_9_1', label: 'Roteiro de audiodescrição elaborado', completed: true, category: 'editorial' },
      { id: 'chk_9_2', label: 'Gravação da voz humana com clareza', completed: false, category: 'acessibilidade' },
      { id: 'chk_9_3', label: 'Testes de reprodução em leitores NVDA e TalkBack', completed: false, category: 'wcag' },
    ],
    history: [
      { id: 'h1', date: '2026-08-01T16:00:00Z', action: 'Pauta iniciada' },
    ],
    createdAt: '2026-08-01T16:00:00Z',
    updatedAt: '2026-08-02T15:00:00Z',
  },
  {
    id: 'art_10',
    title: 'Checklist SEO para Matérias Jornalísticas Acessíveis',
    status: 'publicado',
    categoryTag: 'SEO',
    tags: ['SEO', 'Acessibilidade', 'Checklist'],
    publishDate: '2026-07-30',
    summary: 'Estrutura correta de H1, H2, H3, alt text e dados estruturados Schema.org para ranquear no Google News e SERP.',
    objective: 'Unir otimização para buscadores com acessibilidade digital sem comprometer a leitura.',
    keyword: 'Checklist SEO jornalismo acessivel',
    persona: 'Analistas de SEO Editorial e Redatores.',
    cta: 'Copie o checklist interativo.',
    internalLinks: 'https://retranca.com/seo-acessivel',
    externalLinks: 'https://schema.org/NewsArticle',
    estimatedTime: '2h 30m',
    spentTime: '2h 30m',
    notes: 'Publicado e com bom desempenho de indexação.',
    checklists: [
      { id: 'chk_10_1', label: 'Pesquisa SEO e volume de buscas', completed: true, category: 'seo' },
      { id: 'chk_10_2', label: 'Validação da hierarquia de cabeçalhos', completed: true, category: 'wcag' },
      { id: 'chk_10_3', label: 'Publicado e compartilhado', completed: true, category: 'distribuicao' },
    ],
    history: [
      { id: 'h1', date: '2026-07-22T11:00:00Z', action: 'Pauta cadastrada' },
      { id: 'h2', date: '2026-07-30T10:00:00Z', action: 'Publicado' },
    ],
    createdAt: '2026-07-22T11:00:00Z',
    updatedAt: '2026-07-30T10:00:00Z',
  },
  {
    id: 'art_11',
    title: 'Tecnologias Assistivas no Jornalismo: Leitores de Tela e Braille',
    status: 'pesquisa',
    categoryTag: 'Acessibilidade',
    tags: ['Acessibilidade', 'Tecnologia', 'Inclusão'],
    publishDate: '2026-08-11',
    summary: 'Como usuários cego ou com baixa visão navegam em portais de notícias utilizando leitores de tela como NVDA, JAWS e VoiceOver.',
    objective: 'Conscientizar desenvolvedores e designers de portais de notícias sobre atalhos e estrutura semântica.',
    keyword: 'Tecnologias assistivas jornalismo',
    persona: 'Desenvolvedores web, UX designers e editores.',
    cta: 'Assista à demonstração de uso do NVDA.',
    internalLinks: 'https://retranca.com/leitores-tela',
    externalLinks: 'https://www.nvaccess.org/',
    estimatedTime: '4h',
    spentTime: '1h 30m',
    notes: 'Entrevista agendada com especialista cego em acessibilidade.',
    checklists: [
      { id: 'chk_11_1', label: 'Mapeamento de leitores de tela populares', completed: true, category: 'pesquisa' },
      { id: 'chk_11_2', label: 'Gravação de testes práticos de navegação por teclado', completed: false, category: 'wcag' },
    ],
    history: [{ id: 'h1', date: '2026-08-02T08:00:00Z', action: 'Pauta cadastrada' }],
    createdAt: '2026-08-02T08:00:00Z',
    updatedAt: '2026-08-02T08:00:00Z',
  },
  {
    id: 'art_12',
    title: 'Como Criar Newsletters Acessíveis sem Quebrar o Layout no Email',
    status: 'ideia',
    categoryTag: 'Social',
    tags: ['Social', 'Acessibilidade', 'Newsletter'],
    publishDate: '2026-08-15',
    summary: 'Técnicas de HTML para e-mail acessível: tabelas semânticas, atributos role="presentation", tamanho de fonte e contraste.',
    objective: 'Garantir que 100% dos assinantes da newsletter consigam ler o boletim sem barreiras.',
    keyword: 'Newsletter acessivel email marketing',
    persona: 'Editores de newsletter e gestores de CRM.',
    cta: 'Copie nosso modelo HTML de newsletter acessível.',
    internalLinks: 'https://retranca.com/template-newsletter',
    externalLinks: 'https://www.litmus.com/blog/email-accessibility/',
    estimatedTime: '3h',
    spentTime: '0m',
    notes: 'Pauta sob avaliação.',
    checklists: [
      { id: 'chk_12_1', label: 'Testes em provedores Gmail, Outlook e Apple Mail', completed: false, category: 'pesquisa' },
    ],
    history: [{ id: 'h1', date: '2026-08-02T13:00:00Z', action: 'Ideia sugerida' }],
    createdAt: '2026-08-02T13:00:00Z',
    updatedAt: '2026-08-02T13:00:00Z',
  },
  {
    id: 'art_13',
    title: 'Comunicação Inclusiva de Gênero e Diversidade em Redações',
    status: 'revisao',
    categoryTag: 'Inclusão',
    tags: ['Inclusão', 'Diversidade', 'Linguagem'],
    publishDate: '2026-08-03',
    summary: 'Uso de neutro estratégico, evitação de masculino genérico e respeito a pronomes sem ferir normas gramaticais.',
    objective: 'Apresentar soluções linguísticas elegantes e inclusivas para grandes reportagens.',
    keyword: 'Comunicacao inclusiva genero diversidade',
    persona: 'Copydesk, revisores e repórteres.',
    cta: 'Baixe o Guia Prático de Neutralidade Estratégica.',
    internalLinks: 'https://retranca.com/guia-genero-linguagem',
    externalLinks: 'https://www.manualdecorrespondecia.gov.br',
    estimatedTime: '4h',
    spentTime: '3h 50m',
    notes: 'Atrasado no cronograma devido a revisões adicionais de estilo.',
    checklists: [
      { id: 'chk_13_1', label: 'Pesquisa linguística e jurídica', completed: true, category: 'pesquisa' },
      { id: 'chk_13_2', label: 'Redação das sugestões de frases alternativas', completed: true, category: 'editorial' },
      { id: 'chk_13_3', label: 'Revisão final do copydesk', completed: false, category: 'editorial' },
    ],
    history: [{ id: 'h1', date: '2026-07-25T09:00:00Z', action: 'Criada pauta' }],
    createdAt: '2026-07-25T09:00:00Z',
    updatedAt: '2026-08-02T14:00:00Z',
  },
  {
    id: 'art_14',
    title: 'Legendas Abertas e Fechadas (CC) em Vídeos Jornalísticos',
    status: 'pesquisa',
    categoryTag: 'Acessibilidade',
    tags: ['Acessibilidade', 'Vídeo', 'Closed Captions'],
    publishDate: '2026-08-14',
    summary: 'Diferenças entre legendas ocultas (CC) e abertas, sincronização e inclusão de efeitos sonoros descritos entre colchetes.',
    objective: 'Padronizar a publicação de vídeos em canais de notícias.',
    keyword: 'Legendas abertas e fechadas video jornalismo',
    persona: 'Editores de vídeo, videomakers e repórteres de TV.',
    cta: 'Baixe o modelo VTT para legendas.',
    internalLinks: 'https://retranca.com/legendagem-guias',
    externalLinks: 'https://www.w3.org/TR/webvtt1/',
    estimatedTime: '3h 30m',
    spentTime: '1h 20m',
    notes: 'Sincronizar com equipe de audiovisual.',
    checklists: [
      { id: 'chk_14_1', label: 'Pesquisa sobre padrões VTT e SRT', completed: true, category: 'pesquisa' },
    ],
    history: [{ id: 'h1', date: '2026-08-02T09:00:00Z', action: 'Pauta cadastrada' }],
    createdAt: '2026-08-02T09:00:00Z',
    updatedAt: '2026-08-02T09:00:00Z',
  },
  {
    id: 'art_15',
    title: 'LIBRAS na Comunicação Pública: Quando Usar Janela ou Tradução',
    status: 'ideia',
    categoryTag: 'Acessibilidade',
    tags: ['Acessibilidade', 'LIBRAS', 'Vídeo'],
    publishDate: '2026-08-18',
    summary: 'Normas técnicas para dimensionamento da janela de LIBRAS em transmissões ao vivo e reportagens gravadas.',
    objective: 'Garantir a presença adequada de tradutores intérpretes de LIBRAS.',
    keyword: 'LIBRAS comunicacao publica janela',
    persona: 'Coordenadores de comunicação e produtores ao vivo.',
    cta: 'Confira as dimensões recomendadas pela ABNT.',
    internalLinks: 'https://retranca.com/libras-normas',
    externalLinks: 'https://www.abnt.org.br',
    estimatedTime: '4h',
    spentTime: '0m',
    notes: 'Ideia em análise.',
    checklists: [],
    history: [{ id: 'h1', date: '2026-08-02T14:00:00Z', action: 'Adicionado' }],
    createdAt: '2026-08-02T14:00:00Z',
    updatedAt: '2026-08-02T14:00:00Z',
  }
];

// Dynamically generate remaining pautas up to 30 for full representation
const seedAdditionalArticles = (): Article[] => {
  const extraTitles = [
    { title: 'Jornalismo Sensorial: Experiências Auditivas e Táteis', cat: 'Inclusão' as const, status: 'publicado' as const },
    { title: 'Contraste Mínimo de Cores segundo WCAG 2.2 Nível AA', cat: 'Acessibilidade' as const, status: 'publicado' as const },
    { title: 'Sistemas de Recomendação Isentos de Vieses de Idade e Deficiência', cat: 'IA' as const, status: 'pesquisa' as const },
    { title: 'Como Estruturar PDF Acessível para Relatórios Jornalísticos', cat: 'Docs' as const, status: 'revisao' as const },
    { title: 'Mapeamento de Fontes Diversas para Cobertura de Saúde Pública', cat: 'Inclusão' as const, status: 'escrita' as const },
    { title: 'Navegação Teclado-Only: Testando Portais sem Usar o Mouse', cat: 'Acessibilidade' as const, status: 'escrita' as const },
    { title: 'Infográficos Acessíveis: SVGs com Tags de Leitura e Tabelas Ocultas', cat: 'SEO' as const, status: 'ideia' as const },
    { title: 'Entrevistas Remotas com Transcrição Automatizada e Revisão Humana', cat: 'IA' as const, status: 'publicado' as const },
    { title: 'Cartilha de Cobertura das Eleições: Foco em Acessibilidade nas Urnas', cat: 'Docs' as const, status: 'revisao' as const },
    { title: 'Linguagem Clara em Notícias Financeiras e Direitos do Consumidor', cat: 'Linguagem Simples' as const, status: 'escrita' as const },
    { title: 'Podcast Acessível: Transcrições Completas e Notas do Episódio em HTML', cat: 'Blog' as const, status: 'pesquisa' as const },
    { title: 'Glossário Anti-Capacitista para Redações Modernas', cat: 'Inclusão' as const, status: 'publicado' as const },
    { title: 'Design System Acessível para Portais de Notícias Independentes', cat: 'Acessibilidade' as const, status: 'ideia' as const },
    { title: 'Auditoria de Acessibilidade em Sites de Notícias Regionais', cat: 'Acessibilidade' as const, status: 'pesquisa' as const },
    { title: 'Manual de Boas Práticas no Uso do Gemini para Resumos Jornalísticos', cat: 'IA' as const, status: 'escrita' as const }
  ];

  return extraTitles.map((item, idx) => {
    const artId = `art_${idx + 16}`;
    return {
      id: artId,
      title: item.title,
      status: item.status,
      categoryTag: item.cat,
      tags: [item.cat, 'Jornalismo', 'Editorial'],
      publishDate: item.status === 'publicado' ? `2026-07-${10 + (idx % 20)}` : `2026-08-${(idx % 15) + 5}`,
      summary: `Análise aprofundada sobre ${item.title.toLowerCase()} aplicada ao fluxo de trabalho editorial diário.`,
      objective: `Forncer aos jornalistas um guia direto e prático sobre ${item.title}.`,
      keyword: item.title.toLowerCase(),
      persona: 'Redatores, editores e jornalistas inclusivos.',
      cta: 'Saiba mais no portal Retranca.',
      internalLinks: 'https://retranca.com/recursos',
      externalLinks: 'https://www.w3.org/WAI/',
      estimatedTime: '2h 30m',
      spentTime: item.status === 'publicado' ? '2h 30m' : '1h',
      notes: 'Pauta gerada automaticamente na inicialização da Agenda RETRANCA.',
      checklists: [
        { id: `chk_${artId}_1`, label: 'Pesquisa inicial efetuada', completed: true, category: 'pesquisa' },
        { id: `chk_${artId}_2`, label: 'Revisão de acessibilidade e WCAG', completed: item.status === 'publicado' || item.status === 'revisao', category: 'wcag' },
        { id: `chk_${artId}_3`, label: 'Publicado no portal RETRANCA', completed: item.status === 'publicado', category: 'distribuicao' },
      ],
      history: [
        { id: `h_${artId}_1`, date: '2026-08-01T08:00:00Z', action: 'Pauta criada' },
      ],
      createdAt: '2026-08-01T08:00:00Z',
      updatedAt: '2026-08-02T12:00:00Z',
    };
  });
};

export const ALL_INITIAL_ARTICLES: Article[] = [
  ...INITIAL_ARTICLES,
  ...seedAdditionalArticles(),
];

export const GOVERNANCE_DOCS: GovernanceDoc[] = [
  {
    type: 'BRD',
    title: 'BRD — Documento de Requisitos de Negócio',
    description: 'Objetivos estratégicos do Retranca e valor de entrega do Retranca OS.',
    lastUpdated: '2026-08-02',
    content: `# Business Requirements Document (BRD)
## Agenda RETRANCA - Retranca OS

### 1. Visão do Produto
O **Retranca** é uma plataforma dedicada a capacitar redações e comunicadores com princípios de acessibilidade digital, linguagem simples, neurodiversidade e jornalismo antirracista/anti-capacitista.

### 2. Problema de Negócio
Redações tradicionais enfrentam gargalos no cumprimento de normas WCAG 2.2 AA, faltam checklists sistemáticos durante o fechamento de pautas e dependem de ferramentas complexas e pagas de terceiros.

### 3. Objetivos Chave
- Prover um **Sistema Operacional Editorial (Retranca OS)** leve, responsivo e 100% offline-ready via localStorage.
- Reduzir o tempo de checagem de acessibilidade em 60% por pauta.
- Garantir rastreabilidade de todas as 13 etapas essenciais de produção editorial (Checklists SEO, WCAG, IA ética e Distribuição).
- Promover engajamento através do Modo Motivacional com conquistas e gamificação leve.
`,
  },
  {
    type: 'PRD',
    title: 'PRD — Documento de Requisitos do Projeto',
    description: 'Especificações funcionais do Kanban, Checklists, Painel Lateral, CMS Local e Filtros.',
    lastUpdated: '2026-08-02',
    content: `# Project Requirements Document (PRD)
## Funcionalidades e Requisitos do Sistema

### 1. Módulos Principais
1. **Dashboard & Calendário Editorial**:
   - Barra de progresso geral em % da produção.
   - Indicador dinâmico do total de pautas e concluidas.
   - Busca em tempo real por palavras-chave em títulos e notas.
2. **Quadro Kanban de 5 Colunas com Cores Padrão**:
   - Ideia (Cinza), Pesquisa (Azul), Escrita (Amarelo), Revisão (Laranja), Publicado (Verde).
3. **Filtros Laterais**:
   - Filtros de período: Hoje, Esta semana, Este mês, Atrasados.
   - Filtros por tags: IA, Acessibilidade, Inclusão, SEO, Docs, Blog, Social, Linguagem Simples.
4. **CMS Editorial Local por Card**:
   - Campos estendidos: Resumo, Objetivo, Palavra-Chave, Persona, CTA, Links Internos/Externos, Tempo Estimado x Gasto.
   - Checklists divididos em categorias (Pesquisa, SEO, Acessibilidade, WCAG, IA, Distribuição).
5. **Modo Motivacional (Gamificação Leve)**:
   - Pop-up comemorativo ao publicar artigo com mensagem inspiradora.
   - Conquistas/Badges acumulativas.
6. **Assistente IA de Redação**:
   - Integração server-side com Gemini 3.6 Flash para auxílio em Alt Text, SEO Meta tags e sugestão de escopo.
`,
  },
  {
    type: 'SDD',
    title: 'SDD — Documento de Projeto de Software',
    description: 'Arquitetura técnica do Next.js 15, persistência em localStorage e fluxo de componentes.',
    lastUpdated: '2026-08-02',
    content: `# Software Design Document (SDD)
## Arquitetura e Modelagem de Dados

### 1. Stack Tecnológica
- **Framework**: Next.js 15 (App Router) em TypeScript.
- **Estilização**: Tailwind CSS v4 e Lucide React Icons.
- **Animações**: Motion (Framer Motion).
- **Persistência**: LocalStorage no cliente com sincronização em tempo real e utilitário de Import/Export JSON.
- **Inteligência Artificial**: Next.js API Routes com SDK @google/genai (Gemini 3.6 Flash).

### 2. Estrutura do Estado
A aplicação mantém o estado no hook customizado \`useEditorialStorage\` alimentado por eventos do navegador e subscribers em re-render.
`,
  },
  {
    type: 'TSD',
    title: 'TSD — Documento de Especificação Técnica',
    description: 'Especificação das interfaces TypeScript, cálculo de progresso e conformidade WCAG.',
    lastUpdated: '2026-08-02',
    content: `# Technical Specification Document (TSD)
## Especificação de Código e Acessibilidade

### 1. Garantia WCAG 2.2 AA no UI
- Ratios de contraste superiores a 4.5:1 para todo texto legível.
- Suporte a navegação integral por teclado (focus ring visível \`focus-visible:ring-2\`).
- Atributos \`aria-label\`, \`aria-expanded\` e \`role="region"\` em modais e gavetas.
- Modo Escuro nativo com variação controlada de brilho (≤7% variação).

### 2. Cálculo de Progresso
\`\`\`ts
const calculateProgress = (articles: Article[]) => {
  if (!articles.length) return 0;
  const published = articles.filter(a => a.status === 'publicado').length;
  return Math.round((published / articles.length) * 100);
};
\`\`\`
`,
  },
];
