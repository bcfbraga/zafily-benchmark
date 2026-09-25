// Copy centralizada da landing page pública. Mantém texto e configuração
// repetida (CTAs, links de navegação) num único lugar — ver seção 16/20 do
// briefing de redesign.

export const PRIMARY_CTA = "Solicitar acesso";
export const SECONDARY_CTA = "Ver como funciona";

export const nav = {
  links: [
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#para-quem", label: "Para quem é" },
    { href: "#especializacao", label: "Por que Zafily" },
  ],
  login: "Entrar",
  cta: PRIMARY_CTA,
};

export const hero = {
  eyebrow: "Criada para afiliados profissionais",
  headline: ["Todos os produtos do seu conteúdo.", "Um único link."],
  subheadline:
    "Crie uma vitrine para cada Reels, live, campanha ou seleção de produtos. Em vez de enviar dezenas de URLs pelo Direct, compartilhe uma página organizada, bonita e pronta para o cliente escolher.",
  ctaPrimary: PRIMARY_CTA,
  ctaSecondary: SECONDARY_CTA,
  microcopy: "Acesso acompanhado para creators e afiliados profissionais.",
  demoMessage: "Separei todos os produtos da live aqui 👇",
  demoUrl: "zafily.com.br/sua-vitrine/favoritos-da-live",
};

export const positioningBand = {
  headline: "Seu conteúdo gera interesse. A Zafily organiza o caminho até o produto.",
  complement: "Uma camada profissional entre o conteúdo publicado e o link afiliado.",
};

export const problem = {
  eyebrow: "A venda não deveria se perder na entrega",
  headline: "O conteúdo funcionou. As pessoas pediram os links. E então começou a bagunça.",
  copy:
    "Um vídeo pode reunir um look inteiro, uma lista de achadinhos ou dezenas de produtos apresentados em uma live. Quando chega a hora de entregar esses itens, o creator acaba montando mensagens enormes, procurando links em diferentes lugares e obrigando o cliente a descobrir qual URL corresponde ao que ele viu.",
  before: {
    title: "Uma mensagem. Links demais.",
    items: [
      { label: "Produto 1", url: "loja.exemplo.com/p/8x2ka91mz..." },
      { label: "Produto 2", url: "loja.exemplo.com/p/9f3lp02qw..." },
      { label: "Produto 3", url: "afiliado.exemplo.com/r/mz881..." },
      { label: "Produto 4", url: "loja.exemplo.com/p/71bpz45x..." },
    ],
    moreLabel: "Ver mais",
    caption: "Difícil de enviar, manter e navegar.",
  },
  after: {
    title: "Uma mensagem. Uma vitrine completa.",
    message: "Todos os produtos estão aqui 👇",
    url: "zafily.com.br/sua-vitrine",
    caption: "O cliente abre, encontra e escolhe.",
  },
  metaNote: "Reduza mensagens carregadas de URLs e entregue uma experiência mais clara.",
};

export const howItWorks = {
  eyebrow: "Do conteúdo à vitrine",
  headline: "Publique como sempre. Entregue os produtos de um jeito melhor.",
  steps: [
    {
      title: "Reúna os produtos",
      text: "Adicione os links afiliados relacionados ao seu Reels, live, Story, look ou campanha.",
    },
    {
      title: "Monte a vitrine",
      text: "Organize os produtos em uma página visual, com nome, imagem e acesso direto para compra.",
    },
    {
      title: "Compartilhe um link",
      text: "Envie a URL pelo Direct, WhatsApp, automação ou qualquer outro canal que você já utiliza.",
    },
  ],
  note: "A Zafily não muda seu canal de distribuição. Ela melhora o destino do clique.",
};

export const productDemo = {
  headline: "Quem clicou não quer procurar. Quer encontrar.",
  copy:
    "Cada vitrine organiza os produtos de um conteúdo em uma experiência simples de navegar. O cliente reconhece o item, abre o produto e segue para o site da marca usando o link afiliado do creator.",
};

export const useCases = {
  headline: "Uma vitrine para cada momento do seu conteúdo.",
  cards: [
    { title: "Produtos da live", text: "Reúna tudo o que foi apresentado e compartilhe a seleção enquanto o interesse ainda está alto." },
    { title: "Look completo", text: "Roupa, calçado, bolsa e acessórios em uma única página." },
    { title: "Achadinhos do dia", text: "Transforme uma sequência de recomendações em uma seleção fácil de consultar." },
    { title: "Campanha de marca", text: "Organize os produtos da ação sem misturá-los com o restante do seu conteúdo." },
    { title: "Favoritos da semana", text: "Mantenha uma curadoria acessível para quem perdeu um Story ou quer rever uma indicação." },
    { title: "Conteúdo antigo que ainda vende", text: "Dê a cada conteúdo um endereço que continua funcionando depois da publicação." },
  ],
};

export const specialization = {
  eyebrow: "Não adaptada para afiliados. Criada para eles.",
  headline: "Ferramentas genéricas organizam links. A Zafily entende o que existe por trás deles.",
  copy:
    "Para um afiliado, um link não é apenas um destino. Ele pertence a um produto, a um conteúdo, a uma campanha e a uma fonte de receita. A Zafily nasce entendendo essa operação.",
  pillars: [
    { title: "Produto antes do link", text: "O cliente procura o item que viu, não uma URL. Por isso a experiência começa pelo produto." },
    { title: "Conteúdo como contexto", text: "Cada vitrine pode representar uma live, um Reels, uma campanha ou uma curadoria." },
    { title: "Operação profissional", text: "A plataforma é desenvolvida para quem publica, vende e precisa manter várias seleções ativas." },
    { title: "Evolução guiada pelo nicho", text: "Novos recursos serão criados a partir de dores recorrentes dos afiliados — não para preencher uma lista genérica de funcionalidades." },
  ],
};

export const originStory = {
  eyebrow: "Por que criamos a Zafily",
  headline: "Ela não nasceu de uma ideia genérica de SaaS. Nasceu dentro da operação de uma afiliada.",
  paragraphs: [
    "Uma creator apresentava dezenas de produtos em seus conteúdos e utilizava automações para atender quem pedia os links. O interesse existia. A venda existia. Mas a entrega dependia de mensagens extensas, cheias de URLs e difíceis de manter.",
    "O problema não era criar mais uma automação.",
    "Era dar a essa automação um destino melhor.",
    "A primeira versão da Zafily nasceu para agrupar esses produtos em uma única página. Uma mudança simples no fluxo, mas criada a partir de uma dor que as ferramentas genéricas não enxergavam.",
    "Essa continua sendo a lógica da empresa: observar de perto como afiliados trabalham e construir soluções específicas para os atritos que realmente afetam sua operação.",
  ],
};

export const socialProof = {
  headline: "Criada dentro de uma operação real de afiliação.",
  fallbackNote: "A primeira versão da Zafily já é usada na rotina de creators que trabalham diariamente com afiliação.",
};

export const vision = {
  eyebrow: "A vitrine é o começo",
  headline: "Estamos construindo a empresa que entende as dores dos afiliados antes de criar a solução.",
  copy:
    "A Zafily começa resolvendo a entrega de múltiplos produtos em um único link. A partir daí, a plataforma poderá evoluir com novas ferramentas para organização, análise e operação de afiliados. Não queremos concentrar funcionalidades por concentrar. Queremos resolver, uma a uma, as dores que ainda obrigam creators a improvisar sua operação usando planilhas, mensagens salvas e ferramentas que nunca foram pensadas para afiliação.",
  highlight: "Menos funcionalidades genéricas. Mais soluções que fazem sentido para quem vive de indicar produtos.",
};

export const audienceFit = {
  headline: "Feita para quem trata afiliação como negócio.",
  fitLabel: "Perfis prioritários",
  fit: [
    "Creators de moda, beleza, casa, lifestyle e achadinhos",
    "Afiliados que apresentam vários produtos por conteúdo",
    "Creators que usam Direct, WhatsApp ou automações para entregar links",
    "Profissionais que já monetizam sua audiência",
    "Equipes pequenas que precisam organizar campanhas e seleções",
    "Afiliados que valorizam atendimento e evolução próxima do produto",
  ],
  notFitLabel: "Não é prioridade neste momento",
  notFit: [
    "Pessoas que só precisam reunir redes sociais em uma bio",
    "Usuários que publicam um ou dois links esporadicamente",
    "Quem procura uma ferramenta de automação de mensagens",
    "Quem busca uma loja virtual completa",
    "Quem deseja substituir o programa de afiliados",
  ],
  note: "Precisa apenas reunir Instagram, WhatsApp e YouTube? Uma ferramenta genérica de link-in-bio pode ser suficiente. A Zafily foi criada para quem precisa organizar produtos e operar afiliação todos os dias.",
};

export const accessSection = {
  eyebrow: "Modelo de acesso",
  headline: "Uma plataforma próxima de quem usa.",
  copy:
    "A Zafily está crescendo ao lado de um grupo selecionado de afiliados. Isso nos permite acompanhar cada operação, entender novas dores e desenvolver o produto com profundidade.",
  benefits: [
    "Onboarding acompanhado",
    "Suporte próximo",
    "Participação ativa na evolução do produto",
    "Acesso antecipado a novos recursos",
    "Ferramenta especializada na rotina de afiliação",
  ],
  formTitle: PRIMARY_CTA,
  microcopy: "Avaliaremos seu momento, seu fluxo de trabalho e como a Zafily pode entrar na sua operação.",
  successMessage: "Recebemos sua solicitação. Vamos conhecer sua operação e entrar em contato com os próximos passos.",
};

export const faq = {
  headline: "Perguntas frequentes",
  items: [
    {
      q: "A Zafily substitui o ManyChat?",
      a: "Não. O ManyChat e outras ferramentas podem continuar automatizando o envio das mensagens. A Zafily cria a página que será enviada dentro dessa mensagem, reunindo todos os produtos em um único link.",
    },
    {
      q: "A Zafily é igual ao Linktree?",
      a: "Não. Ferramentas de link-in-bio organizam diferentes destinos de uma pessoa ou marca. A Zafily organiza produtos relacionados a conteúdos, campanhas e curadorias de afiliados.",
    },
    {
      q: "Posso criar uma vitrine para cada Reels ou live?",
      a: "Sim. Essa é uma das principais aplicações da plataforma: criar uma página específica para cada conjunto de produtos e compartilhar a URL correspondente.",
    },
    {
      q: "Preciso trocar meus links afiliados?",
      a: "Não. A Zafily organiza os links afiliados que você já utiliza. O cliente acessa o produto por meio do seu link.",
    },
    {
      q: "Funciona somente com moda?",
      a: "A plataforma nasceu próxima ao mercado de moda, mas a lógica pode ser usada por creators de beleza, casa, lifestyle, tecnologia, achadinhos e outros nichos que recomendam vários produtos.",
    },
    {
      q: "A Zafily automatiza o envio pelo Instagram?",
      a: "Não. A Zafily não é uma ferramenta de automação de mensagens. O link da vitrine pode ser compartilhado manualmente ou por meio da ferramenta de automação que você já utiliza.",
    },
    {
      q: "Como consigo acesso?",
      a: "Solicite acesso pelo formulário. Entraremos em contato para conhecer sua operação e orientar os próximos passos.",
    },
  ],
};

export const finalCta = {
  eyebrow: "Seu próximo conteúdo não precisa terminar em uma lista de links",
  headline: "Um conteúdo. Vários produtos. Uma única vitrine.",
  copy: "Organize o que você indicou e entregue tudo em uma página criada para quem compra — e para quem vive de afiliação.",
  cta: PRIMARY_CTA,
  microcopy: "Conheça a Zafily e descubra como ela pode entrar na sua operação.",
};

export const footer = {
  description: "Zafily é uma plataforma especializada em soluções para afiliados profissionais, começando por vitrines que transformam vários produtos em um único link.",
  links: [
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#para-quem", label: "Para quem é" },
    { href: "/login", label: "Entrar" },
    { href: "#acesso", label: PRIMARY_CTA },
  ],
  legal: [
    { href: "#", label: "Política de Privacidade" },
    { href: "#", label: "Termos de Uso" },
  ],
};
