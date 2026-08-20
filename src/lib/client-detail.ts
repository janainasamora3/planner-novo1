/**
 * Client Detail — rich profile, onboarding stages, planning cards and
 * per-platform content entries (Instagram, LinkedIn, YouTube).
 */

export interface StageFile {
  id: string;
  name: string;
  /** data URL (base64) */
  data: string;
  size: number;
}

export interface ClientStage {
  id: string;
  label: string;
  done: boolean;
  order: number;
  content?: string;
  files?: StageFile[];
}

export interface PlanningCard {
  id: string;
  title: string;
  content: string;
  color: string;
  /** Cover image — data URL (base64) */
  coverImage?: string;
  /**
   * Seções estruturadas — usado pelo card Briefing para dividir o conteúdo
   * em menus internos (uma aba por seção). A chave é o ID da seção
   * (ver BRIEFING_SECTIONS) e o valor é o texto daquela seção.
   * Outros cards continuam usando apenas `content`.
   */
  sections?: Record<string, string>;
  /**
   * Anexos por seção — chave é o ID da seção, valor é a lista de arquivos
   * anexados àquela seção (PDFs, documentos, planilhas, etc).
   */
  sectionAttachments?: Record<string, Attachment[]>;
  /**
   * Definições das seções customizadas pelo usuário (label, emoji, ordem).
   * Se ausente, usa as definições padrão de SECTIONED_CARDS.
   * Permite editar/criar/excluir/reordenar submenus.
   */
  sectionDefs?: CardSection[];
}

/** Arquivo anexado a uma seção do Briefing (ou a um card). */
export interface Attachment {
  id: string;
  name: string;
  /** MIME type (ex: application/pdf, image/png). */
  mimeType: string;
  /** Tamanho original em bytes. */
  size: number;
  /** data URL (base64) do conteúdo. */
  data: string;
  /** Quando foi anexado. */
  createdAt: number;
}

export interface ContentEntry {
  id: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  day: string;
  headline: string;
  task: string;
  person: string;
  /** ISO date yyyy-mm-dd */
  deliveryDate: string;
  posted: boolean;
}

export interface ClientDetail {
  clientId: string;
  drive?: string;
  logosLink?: string;
  stages: ClientStage[];
  planning: PlanningCard[];
  instagram: ContentEntry[];
  linkedin: ContentEntry[];
  youtube: ContentEntry[];
  /** Métricas mensais — KPIs acompanhar evolução do cliente. */
  metrics?: MetricEntry[];
  /** Documentos gerais do cliente (contratos, briefings, etc). */
  documents?: Attachment[];
  /** Histórico de interações / timeline (reuniões, calls, decisões). */
  timeline?: TimelineEntry[];
  updatedAt: number;
}

/** Métrica mensal — KPIs do cliente (alcance, seguidores, etc). */
export interface MetricEntry {
  id: string;
  /** ISO yyyy-mm-dd — referência do mês (primeiro dia). */
  month: string;
  /** Nome da métrica (ex: "Seguidores", "Alcance", "Engajamento"). */
  name: string;
  /** Valor numérico. */
  value: number;
  /** Unidade (ex: "%", "k", ""). */
  unit?: string;
  /** Plataforma (ex: "Instagram", "LinkedIn", "Geral"). */
  platform?: string;
  createdAt: number;
}

/** Evento do histórico / timeline do cliente. */
export interface TimelineEntry {
  id: string;
  /** ISO yyyy-mm-dd — data do evento. */
  date: string;
  /** Tipo do evento (reuniao, call, decissao, email, outro). */
  type: "reuniao" | "call" | "decisao" | "email" | "entrega" | "outro";
  /** Título curto do evento. */
  title: string;
  /** Descrição detalhada. */
  description?: string;
  createdAt: number;
}

export const TIMELINE_TYPE_LABELS: Record<TimelineEntry["type"], string> = {
  reuniao: "Reunião",
  call: "Call",
  decisao: "Decisão",
  email: "Email",
  entrega: "Entrega",
  outro: "Outro",
};

export const TIMELINE_TYPE_EMOJIS: Record<TimelineEntry["type"], string> = {
  reuniao: "👥",
  call: "📞",
  decisao: "🎯",
  email: "📧",
  entrega: "📦",
  outro: "📝",
};

export const TIMELINE_TYPE_COLORS: Record<TimelineEntry["type"], string> = {
  reuniao: "#2563eb",
  call: "#0891b2",
  decisao: "#7c3aed",
  email: "#f59e0b",
  entrega: "#16a34a",
  outro: "#6b7280",
};

export const TIMELINE_TYPE_OPTIONS: { value: TimelineEntry["type"]; label: string; emoji: string }[] = [
  { value: "reuniao", label: "Reunião", emoji: "👥" },
  { value: "call", label: "Call", emoji: "📞" },
  { value: "decisao", label: "Decisão", emoji: "🎯" },
  { value: "email", label: "Email", emoji: "📧" },
  { value: "entrega", label: "Entrega", emoji: "📦" },
  { value: "outro", label: "Outro", emoji: "📝" },
];

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekdayName(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return WEEKDAYS[d.getDay()];
}

/** 10 default onboarding stages. */
export const DEFAULT_STAGES: Omit<ClientStage, "id">[] = [
  { label: "Contrato", done: false, order: 1, content: "" },
  { label: "Pagamento", done: false, order: 2, content: "" },
  { label: "Organização", done: false, order: 3, content: "" },
  { label: "Onboarding", done: false, order: 4, content: "" },
  { label: "Reunião de Briefing", done: false, order: 5, content: "" },
  { label: "Planejamento", done: false, order: 6, content: "" },
  { label: "Reunião Apresentação", done: false, order: 7, content: "" },
  { label: "Reestruturação", done: false, order: 8, content: "" },
  { label: "Criação de conteúdo", done: false, order: 9, content: "" },
  { label: "Reunião Métricas", done: false, order: 10, content: "" },
];

/** Template completo do Briefing — preenche o card "Briefing" do planejamento. */
export const BRIEFING_TEMPLATE = `**Nome Sobrenome, X anos**

xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

**Proposta única de valor**

xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


## Preferências Pessoais

1. Você tem alguma playlist no Spotify ou em outra plataforma?
2. O que você gosta de assistir no YouTube? Quais canais você mais acompanha?
3. Você tem cachorro? Filhos?
4. Quais adjetivos mais te descrevem?
5. Quem são as pessoas mais importantes na sua vida?
6. Cite 5 fatos aleatórios sobre você.
7. Qual é o seu maior medo na vida?


## Trabalho e Negócio

1. Como você começou nessa área?
2. Você sempre sonhou em trabalhar com isso ou tinha outro sonho de infância?
3. Descreva as características do seu público-alvo (nome, idade, classe social…)
4. No que você não acredita sobre o seu nicho, mas a maioria das pessoas acredita?
5. O que diferencia sua marca ou serviço dos concorrentes?


## Conteúdo e Redes Sociais

1. Quais assuntos você gostaria de falar mais nas redes sociais? Temas de posts por exemplo.
2. Quais assuntos mesmo que do seu nicho, você jamais falaria no seu perfil?
3. Cite 3 ou mais concorrentes seus: djnfjnvjnvjrng
4. Cite 5 perfis do seu nicho, que você gosta dos conteúdos
5. Cite 5 perfis que você gosta dos reels (independente do nicho)
6. Cite 3 perfis cujo conteúdo você não se identifica e explique por quê.
7. Que tipo de conteúdo te faz parar de seguir alguém no Instagram?
8. O que você acha que funciona bem nos seus posts?
9. Quais são os conteúdos favoritos do seu próprio perfil e por que você gosta tanto deles?
10. O que você acha que não dá certo nos seus posts, que sua audiência não gosta muito?
11. Você já fez algum ensaio fotográfico? se sim, quando?
12. Quais outras redes sociais você tem ativa? Insira o link.


## Histórias

> Quais histórias marcaram a sua vida? Na infância, adolescência e nos últimos 3 anos.

- xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


## Objetivo com o perfil

- Qual o seu maior desejo com o perfil hoje? Exemplos: atrair novos clientes, fortalecer a sua marca, aumentar o engajamento, melhorar as vendas, ou construir uma comunidade ativa.
- O que você espera do nosso serviço e da nossa parceria?


## Datas importantes

- Nesse mês ou no próximo tem alguma data importante para você? [ver card Datas importantes]


## Monetização

- Quais produtos/serviços/infoprodutos você vende hoje? [ver card Monetização]


## Provas sociais

- Você tem um lugar aonde armazena fotos/videos de provas sociais que você recebe? [ver card Provas sociais]


## Fotos

- Vou te pedir para me enviar fotos de datas importantes (casamento, filhos, viagens, formatura, escola…) + Fotos suas, tanto profissionais quanto pessoais (do dia a dia) + Sua identidade visual (caso tenha).


## Briefing design

1. Você já tem uma identidade visual definida? Podemos utilizá-la no seu perfil?
2. O que acha das artes que usa atualmente? Há algo que gostaria de manter ou mudar?
3. Existe algum elemento visual que gostaria de incluir?
4. Quais elementos visuais você gosta e quais prefere evitar? (fontes, estilos, cores…)
5. Cite 5 perfis que você gosta das artes, independente do nicho
6. Há alguma cor que você não gosta e prefere evitar no seu perfil?
7. Se sua marca fosse um universo, quais filmes, músicas, séries ou livros fariam parte dele?


## Tom de voz

> Tom de voz é como você se comunica. Ele inclui palavras, estilo e emoção, ajudando a conectar com o público [ver card Tom de voz].


## Vocabulário

1. Cumprimentos
   "E aí, gente boa?" - "Oi, pessoal!" - "Fala galera"

2. Adjetivos positivos
   "Sensacional" - "Pô, muito bom" - "Massa"

3. Adjetivos negativos
   "Tosco" - "Mequetrefe" - "Ruim demais da conta"


## Nível de agressividade

[nada agressivo] 0 - 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10 [muito agressivo]


## Nível de formalidade

[informal] 0 - 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10 [formal]


## Nível de humor

[sério] 0 - 1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 - 9 - 10 [muito engraçado]


## Emojis mais usados

- Exemplo: 😂🔥💥👍💡


## Moodboard

TEMPLATE`;

/** Estrutura de uma seção de card (Briefing, Tom de voz, etc). */
export interface CardSection {
  id: string;
  label: string;
  emoji?: string;
  /** Conteúdo default (template) da seção em HTML. */
  defaultContent: string;
  /** Tipo da seção: 'richtext' (padrão) ou 'table' (tabela estruturada editável). */
  type?: "richtext" | "table";
  /** Colunas da tabela (quando type === 'table'). */
  tableColumns?: string[];
}

/**
 * Seções do Briefing — cada uma vira um menu/aba interno dentro do modal
 * do card Briefing. A ordem aqui é a ordem exibida nas abas.
 */
export const BRIEFING_SECTIONS: CardSection[] = [
  {
    id: "intro",
    label: "Identidade",
    emoji: "👤",
    defaultContent: `<p><strong>Nome Sobrenome, X anos</strong></p><p>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</p><p><strong>Proposta única de valor</strong></p><p>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</p>`,
  },
  {
    id: "preferencias-pessoais",
    label: "Preferências Pessoais",
    emoji: "💗",
    defaultContent: `<ol><li>Você tem alguma playlist no Spotify ou em outra plataforma?</li><li>O que você gosta de assistir no YouTube? Quais canais você mais acompanha?</li><li>Você tem cachorro? Filhos?</li><li>Quais adjetivos mais te descrevem?</li><li>Quem são as pessoas mais importantes na sua vida?</li><li>Cite 5 fatos aleatórios sobre você.</li><li>Qual é o seu maior medo na vida?</li></ol>`,
  },
  {
    id: "trabalho-negocio",
    label: "Trabalho e Negócio",
    emoji: "💼",
    defaultContent: `<ol><li>Como você começou nessa área?</li><li>Você sempre sonhou em trabalhar com isso ou tinha outro sonho de infância?</li><li>Descreva as características do seu público-alvo (nome, idade, classe social…)</li><li>No que você não acredita sobre o seu nicho, mas a maioria das pessoas acredita?</li><li>O que diferencia sua marca ou serviço dos concorrentes?</li></ol>`,
  },
  {
    id: "conteudo-redes",
    label: "Conteúdo e Redes Sociais",
    emoji: "🌐",
    defaultContent: `<ol><li>Quais assuntos você gostaria de falar mais nas redes sociais? Temas de posts por exemplo.</li><li>Quais assuntos mesmo que do seu nicho, você jamais falaria no seu perfil?</li><li>Cite 3 ou mais concorrentes seus: djnfjnvjnvjrng</li><li>Cite 5 perfis do seu nicho, que você gosta dos conteúdos</li><li>Cite 5 perfis que você gosta dos reels (independente do nicho)</li><li>Cite 3 perfis cujo conteúdo você não se identifica e explique por quê.</li><li>Que tipo de conteúdo te faz parar de seguir alguém no Instagram?</li><li>O que você acha que funciona bem nos seus posts?</li><li>Quais são os conteúdos favoritos do seu próprio perfil e por que você gosta tanto deles?</li><li>O que você acha que não dá certo nos seus posts, que sua audiência não gosta muito?</li><li>Você já fez algum ensaio fotográfico? se sim, quando?</li><li>Quais outras redes sociais você tem ativa? Insira o link.</li></ol>`,
  },
  {
    id: "historias",
    label: "Histórias",
    emoji: "📖",
    defaultContent: `<blockquote>Quais histórias marcaram a sua vida? Na infância, adolescência e nos últimos 3 anos.</blockquote><ul><li>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</li><li>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</li><li>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</li><li>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</li></ul>`,
  },
  {
    id: "objetivo",
    label: "Objetivo com o perfil",
    emoji: "🎯",
    defaultContent: `<ul><li>Qual o seu maior desejo com o perfil hoje? Exemplos: atrair novos clientes, fortalecer a sua marca, aumentar o engajamento, melhorar as vendas, ou construir uma comunidade ativa.</li><li>O que você espera do nosso serviço e da nossa parceria?</li></ul>`,
  },
  {
    id: "datas-importantes",
    label: "Datas importantes",
    emoji: "📅",
    defaultContent: `<ul><li>Nesse mês ou no próximo tem alguma data importante para você? [ver card Datas importantes]</li></ul>`,
  },
  {
    id: "monetizacao",
    label: "Monetização",
    emoji: "💰",
    defaultContent: `<ul><li>Quais produtos/serviços/infoprodutos você vende hoje? [ver card Monetização]</li></ul>`,
  },
  {
    id: "provas-sociais",
    label: "Provas sociais",
    emoji: "⭐",
    defaultContent: `<ul><li>Você tem um lugar aonde armazena fotos/videos de provas sociais que você recebe? [ver card Provas sociais]</li></ul>`,
  },
  {
    id: "fotos",
    label: "Fotos",
    emoji: "📸",
    defaultContent: `<ul><li>Vou te pedir para me enviar fotos de datas importantes (casamento, filhos, viagens, formatura, escola…) + Fotos suas, tanto profissionais quanto pessoais (do dia a dia) + Sua identidade visual (caso tenha).</li></ul>`,
  },
  {
    id: "briefing-design",
    label: "Briefing design",
    emoji: "🖌️",
    defaultContent: `<ol><li>Você já tem uma identidade visual definida? Podemos utilizá-la no seu perfil?</li><li>O que acha das artes que usa atualmente? Há algo que gostaria de manter ou mudar?</li><li>Existe algum elemento visual que gostaria de incluir?</li><li>Quais elementos visuais você gosta e quais prefere evitar? (fontes, estilos, cores…)</li><li>Cite 5 perfis que você gosta das artes, independente do nicho</li><li>Há alguma cor que você não gosta e prefere evitar no seu perfil?</li><li>Se sua marca fosse um universo, quais filmes, músicas, séries ou livros fariam parte dele?</li></ol>`,
  },
  {
    id: "tom-de-voz",
    label: "Tom de voz",
    emoji: "🗣️",
    defaultContent: `<blockquote>Tom de voz é como você se comunica. Ele inclui palavras, estilo e emoção, ajudando a conectar com o público [ver card Tom de voz].</blockquote>`,
  },
  {
    id: "vocabulario",
    label: "Vocabulário",
    emoji: "🔤",
    defaultContent: `<ol><li>Cumprimentos<br>"E aí, gente boa?" - "Oi, pessoal!" - "Fala galera"</li><li>Adjetivos positivos<br>"Sensacional" - "Pô, muito bom" - "Massa"</li><li>Adjetivos negativos<br>"Tosco" - "Mequetrefe" - "Ruim demais da conta"</li></ol>`,
  },
  {
    id: "agressividade",
    label: "Nível de agressividade",
    emoji: "⚡",
    defaultContent: `<p>[nada agressivo] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [muito agressivo]</p>`,
  },
  {
    id: "formalidade",
    label: "Nível de formalidade",
    emoji: "🎩",
    defaultContent: `<p>[informal] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [formal]</p>`,
  },
  {
    id: "humor",
    label: "Nível de humor",
    emoji: "😄",
    defaultContent: `<p>[sério] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [muito engraçado]</p>`,
  },
  {
    id: "emojis-usados",
    label: "Emojis mais usados",
    emoji: "✨",
    defaultContent: `<ul><li>Exemplo: 😂🔥💥👍💡</li></ul>`,
  },
  {
    id: "moodboard",
    label: "Moodboard",
    emoji: "🎨",
    defaultContent: `<p>TEMPLATE</p>`,
  },
];

/**
 * Seções do Tom de voz — menus internos do card "Tom de voz".
 * Conforme solicitado pelo usuário.
 */
export const TOM_DE_VOZ_SECTIONS: CardSection[] = [
  {
    id: "vocabulario",
    label: "Vocabulário",
    emoji: "🔤",
    defaultContent: `<h3>Cumprimentos</h3><p>"E aí, gente boa?" - "Oi, pessoal!" - "Fala galera"</p><h3>Recorrência</h3><p>"Parceiro" - "Irmão" - "Mano"</p><h3>Adjetivos positivos</h3><p>"Sensacional" - "Pô, muito bom" - "Massa"</p><h3>Adjetivos negativos</h3><p>"Tosco" - "Mequetrefe" - "Ruim demais da conta"</p><h3>CTA's</h3><p>"Deixa o like!" - "ja mete o dedo no joinha" - "Se inscreve aí!"</p>`,
  },
  {
    id: "agressividade",
    label: "Nível de agressividade",
    emoji: "⚡",
    defaultContent: `<p>[nada agressivo] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [muito agressivo]</p>`,
  },
  {
    id: "sarcasmo",
    label: "Nível de sarcasmo",
    emoji: "😏",
    defaultContent: `<p>[nada sarcástico] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [muito sarcástico]</p>`,
  },
  {
    id: "formalidade",
    label: "Nível de formalidade",
    emoji: "🎩",
    defaultContent: `<p>[informal] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [formal]</p>`,
  },
  {
    id: "humor",
    label: "Nível de humor",
    emoji: "😄",
    defaultContent: `<p>[sério] 0 - 1 - 2 - 3 - 4 - <strong>5</strong> - 6 - 7 - 8 - 9 - 10 [muito engraçado]</p>`,
  },
  {
    id: "emojis-usados",
    label: "Emojis mais usados",
    emoji: "✨",
    defaultContent: `<ul><li>Exemplo: 😂🔥💥👍💡</li></ul>`,
  },
];

/** Constrói um Record de seções com os valores default (template). */
export function buildDefaultSections(sections: CardSection[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const section of sections) {
    result[section.id] = section.defaultContent;
  }
  return result;
}

/** Seções do card Monetização (Serviços, Produtos físicos, Infoprodutos). */
export const MONETIZACAO_SECTIONS: CardSection[] = [
  {
    id: "servicos",
    label: "Serviços",
    emoji: "🛠️",
    defaultContent: `<h3>Serviços</h3><p><strong>Nome do serviço:</strong><br>Descrição:<br>Valor:</p><hr><p><strong>Nome do serviço:</strong><br>Descrição:<br>Valor:</p><hr><p><strong>Nome do serviço:</strong><br>Descrição:<br>Valor:</p><hr><p><strong>Nome do serviço:</strong><br>Descrição:<br>Valor:</p>`,
  },
  {
    id: "produtos-fisicos",
    label: "Produtos físicos",
    emoji: "📦",
    defaultContent: `<h3>Produtos físicos</h3><ul><li>Quais produtos físicos você vende?</li><li>Quais são os preços de cada produto?</li><li>Tem site?</li><li>Existem descontos para compras em maior quantidade?</li><li>Como é o processo de compra?</li><li>Qual o prazo de entrega após a confirmação do pagamento?</li><li>Quais são as opções de envio?</li><li>Há frete grátis ou frete com desconto em determinadas condições?</li><li>O cliente pode trocar ou devolver os produtos? Se sim, como funciona o processo?</li><li>Existe algum tipo de garantia para os produtos que você vende?</li><li>Como você lida com problemas de entrega ou produtos danificados?</li></ul>`,
  },
  {
    id: "infoprodutos",
    label: "Infoprodutos",
    emoji: "💻",
    defaultContent: `<h3>Infoprodutos</h3><p><strong>Nome do infoproduto:</strong><br>Proposta:<br>Valor:<br>Lançamento/Perpétuo:<br>Site:</p><hr><p><strong>Nome do infoproduto:</strong><br>Proposta:<br>Valor:<br>Lançamento/Perpétuo:<br>Site:</p><hr><p><strong>Nome do infoproduto:</strong><br>Proposta:<br>Valor:<br>Lançamento/Perpétuo:<br>Site:</p>`,
  },
];

/** Seções do card Objetivo (Objetivo, Indicador, Meta, Métrica antiga). */
export const OBJETIVO_SECTIONS: CardSection[] = [
  {
    id: "objetivo-cliente",
    label: "Objetivo do cliente",
    emoji: "🎯",
    defaultContent: `<h3>Objetivo do cliente</h3><blockquote>Descreva qual o objetivo central do cliente contratando os seus serviços. Revise o briefing e extraia essa informação de lá.</blockquote>`,
  },
  {
    id: "indicador",
    label: "Indicador",
    emoji: "📊",
    defaultContent: `<h3>Indicador</h3><blockquote>Qual indicador vamos usar para nos orientar se estamos ou não no caminho para chegar no objetivo do cliente? Cliques no link da bio, número de seguidores, engajamento…</blockquote>`,
  },
  {
    id: "meta",
    label: "Meta",
    emoji: "🏁",
    defaultContent: `<h3>Meta</h3><blockquote>Qual então será a nossa meta para o perfil nos próximos 3 meses? Chegar ao marco de um número de seguidores, aumentar o engajamento em X%, aumentar o número de directs.</blockquote>`,
  },
  {
    id: "metrica-antiga",
    label: "Métrica antiga",
    emoji: "📈",
    defaultContent: `<h3>Métrica antiga</h3><blockquote>Para avaliar se essa meta é realmente viável, verifique a mesma métrica dos últimos três meses e registre o resultado aqui.</blockquote>`,
  },
];

/** Seções do card Público alvo. */
export const PUBLICO_ALVO_SECTIONS: CardSection[] = [
  {
    id: "perfil-publico",
    label: "Perfil do público",
    emoji: "👤",
    defaultContent: `<h3>Perfil do público</h3><p><strong>Gênero:</strong></p><p><strong>Idade:</strong></p><p><strong>Classe social:</strong></p>`,
  },
  {
    id: "dores",
    label: "Dores",
    emoji: "😣",
    defaultContent: `<h3>Quais as dores desse público?</h3><blockquote><em>O que essa pessoa sente hoje sem conhecer o seu produto/serviço (frustrações, desafios…)</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
  {
    id: "medos",
    label: "Medos",
    emoji: "😨",
    defaultContent: `<h3>Quais os medos desse público?</h3><blockquote><em>Qual o medo dessa pessoa em adquirir um produto/serviço igual ao seu?</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
  {
    id: "duvidas",
    label: "Dúvidas",
    emoji: "❓",
    defaultContent: `<h3>Quais as dúvidas desse público?</h3><blockquote><em>Por que ela ainda não te contratou ou comprou seus produtos? Quais são as dúvidas dela?</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
  {
    id: "veem-dia-a-dia",
    label: "O que veem no dia a dia",
    emoji: "👀",
    defaultContent: `<h3>O que eles mais veem no dia a dia deles?</h3><blockquote><em>No ambiente que frequentam, entre amigos, familiares ou no mercado.</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
  {
    id: "escutam",
    label: "O que escutam",
    emoji: "👂",
    defaultContent: `<h3>O que eles mais escutam das pessoas?</h3><blockquote><em>Amigos, familiares, profissionais do ramo, noticiário…</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
  {
    id: "comportamento",
    label: "Comportamento",
    emoji: "🚶",
    defaultContent: `<h3>O que esse público faz diante dessas situações?</h3><blockquote><em>Como eles se comportam? Qual é o discurso deles?</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
  {
    id: "desejos",
    label: "Desejos",
    emoji: "✨",
    defaultContent: `<h3>Quais os desejos desse público?</h3><blockquote><em>Quais benefícios essa pessoa terá após te contratar ou comprar seus produtos?</em></blockquote><table><tbody><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr></tbody></table>`,
  },
];

/** Seções do card Provas sociais. */
export const PROVAS_SOCIAIS_SECTIONS: CardSection[] = [
  {
    id: "lista-provas",
    label: "Lista de provas sociais",
    emoji: "📋",
    type: "table",
    tableColumns: ["Status", "Nome da pessoa", "Perfil", "Serviço", "Material"],
    defaultContent: JSON.stringify([
      { "Status": "Ainda não usada", "Nome da pessoa": "", "Perfil": "", "Serviço": "", "Material": "N/A" },
      { "Status": "Ainda não usada", "Nome da pessoa": "", "Perfil": "", "Serviço": "", "Material": "N/A" },
      { "Status": "Usada recentemente", "Nome da pessoa": "", "Perfil": "", "Serviço": "", "Material": "N/A" },
      { "Status": "Usada a muito tempo", "Nome da pessoa": "", "Perfil": "", "Serviço": "", "Material": "N/A" },
      { "Status": "Já usada", "Nome da pessoa": "", "Perfil": "", "Serviço": "", "Material": "N/A" },
    ]),
  },
  {
    id: "textos-provas",
    label: "Textos das provas",
    emoji: "💬",
    defaultContent: `<h3>Textos das provas sociais</h3><p>Cole aqui o texto de cada depoimento/comentário que recebeu.</p><hr><p><strong>1.</strong></p><blockquote></blockquote><hr><p><strong>2.</strong></p><blockquote></blockquote><hr><p><strong>3.</strong></p><blockquote></blockquote><hr><p><strong>4.</strong></p><blockquote></blockquote><hr><p><strong>5.</strong></p><blockquote></blockquote>`,
  },
  {
    id: "onde-armazenar",
    label: "Onde armazenar",
    emoji: "🗂️",
    defaultContent: `<h3>Onde armazenar as provas sociais</h3><ul><li>Você tem um lugar aonde armazena fotos/vídeos de provas sociais que você recebe?</li><li>Pasta no Google Drive com prints de comentários, DMs, reviews</li><li>Pasta no celular com prints de WhatsApp</li><li>Link da pasta: <strong>inserir aqui</strong></li></ul><p><strong>Dica:</strong> Sempre que receber um depoimento, tire print e salve na pasta. Use a tabela acima para controlar quais já foram usadas.</p>`,
  },
];

/** Seções do card Datas importantes (12 meses do ano). */
export const DATAS_IMPORTANTES_SECTIONS: CardSection[] = [
  { id: "jan", label: "Janeiro", emoji: "❄️", defaultContent: `<h3>Janeiro</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "fev", label: "Fevereiro", emoji: "💝", defaultContent: `<h3>Fevereiro</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "mar", label: "Março", emoji: "🌱", defaultContent: `<h3>Março</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "abr", label: "Abril", emoji: "🌸", defaultContent: `<h3>Abril</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "mai", label: "Maio", emoji: "🌼", defaultContent: `<h3>Maio</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "jun", label: "Junho", emoji: "☀️", defaultContent: `<h3>Junho</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "jul", label: "Julho", emoji: "🏖️", defaultContent: `<h3>Julho</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "ago", label: "Agosto", emoji: "🎆", defaultContent: `<h3>Agosto</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "set", label: "Setembro", emoji: "🍂", defaultContent: `<h3>Setembro</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "out", label: "Outubro", emoji: "🎃", defaultContent: `<h3>Outubro</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "nov", label: "Novembro", emoji: "🍁", defaultContent: `<h3>Novembro</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
  { id: "dez", label: "Dezembro", emoji: "🎄", defaultContent: `<h3>Dezembro</h3><p><strong>Datas importantes:</strong></p><ul><li></li><li></li><li></li></ul><p><strong>Anotações:</strong></p><blockquote></blockquote>` },
];

/** IDs de cards especiais que têm seções internas. */
export const SECTIONED_CARDS: Record<string, { sections: CardSection[]; title: string }> = {
  briefing: { sections: BRIEFING_SECTIONS, title: "Briefing" },
  "tom de voz": { sections: TOM_DE_VOZ_SECTIONS, title: "Tom de voz" },
  monetização: { sections: MONETIZACAO_SECTIONS, title: "Monetização" },
  objetivo: { sections: OBJETIVO_SECTIONS, title: "Objetivo" },
  "público alvo": { sections: PUBLICO_ALVO_SECTIONS, title: "Público alvo" },
  "provas sociais": { sections: PROVAS_SOCIAIS_SECTIONS, title: "Provas sociais" },
  "datas importantes": { sections: DATAS_IMPORTANTES_SECTIONS, title: "Datas importantes" },
};

/** Verifica se um card (pelo título) tem seções internas. */
export function getSectionedCardInfo(title: string): { sections: CardSection[]; title: string } | null {
  const key = title.trim().toLowerCase();
  return SECTIONED_CARDS[key] ?? null;
}

/** Planning cards — todos os 27 cards do briefing do cliente. */
export const DEFAULT_PLANNING: Omit<PlanningCard, "id">[] = [
  {
    title: "Briefing",
    content: BRIEFING_TEMPLATE,
    color: "#1e3a8a",
    sections: buildDefaultSections(BRIEFING_SECTIONS),
  },
  {
    title: "Tom de voz",
    content: "",
    color: "#1e293b",
    sections: buildDefaultSections(TOM_DE_VOZ_SECTIONS),
  },
  {
    title: "Monetização",
    content: "",
    color: "#14532d",
    sections: buildDefaultSections(MONETIZACAO_SECTIONS),
  },
  {
    title: "Objetivo",
    content: "",
    color: "#7c2d12",
    sections: buildDefaultSections(OBJETIVO_SECTIONS),
  },
  {
    title: "Público alvo",
    content: "",
    color: "#155e75",
    sections: buildDefaultSections(PUBLICO_ALVO_SECTIONS),
  },
  {
    title: "Provas sociais",
    content: "",
    color: "#854d0e",
    sections: buildDefaultSections(PROVAS_SOCIAIS_SECTIONS),
  },
  {
    title: "Datas importantes",
    content: "",
    color: "#1e1b4b",
    sections: buildDefaultSections(DATAS_IMPORTANTES_SECTIONS),
  },
  { title: "Métricas antigas",         content: "", color: "#1f2937" },
  { title: "Análise de mercado",       content: "", color: "#0f766e" },
  { title: "Organização do perfil",    content: "", color: "#3f3f46" },
  { title: "Stories",                  content: "", color: "#831843" },
  { title: "Brainstorm",               content: "", color: "#a16207" },
  { title: "Serviços",                 content: "", color: "#166534" },
  { title: "Funil",                    content: "", color: "#1e3a8a" },
  { title: "Infoprodutos",             content: "", color: "#713f12" },
  { title: "Vocabulário",              content: "", color: "#1f2937" },
  { title: "Nível de agressividade",   content: "", color: "#7f1d1d" },
  { title: "Nível de formalidade",     content: "", color: "#0f172a" },
  { title: "Nível de humor",           content: "", color: "#a16207" },
  { title: "Emojis mais usados",       content: "", color: "#155e75" },
  { title: "Moodboard",                content: "", color: "#831843" },
  { title: "Fotos",                    content: "", color: "#1c1917" },
  { title: "Preferências Pessoais",    content: "", color: "#9d174d" },
  { title: "Trabalho e Negócio",       content: "", color: "#1f2937" },
  { title: "Conteúdo e Redes Sociais", content: "", color: "#0e7490" },
  { title: "Histórias",                content: "", color: "#312e81" },
  { title: "Briefing design",          content: "", color: "#7c2d12" },
];

export function buildDefaultStages(): ClientStage[] {
  return DEFAULT_STAGES.map((s) => ({ ...s, id: makeId("stage") }));
}

export function buildDefaultPlanning(): PlanningCard[] {
  return DEFAULT_PLANNING.map((p) => ({ ...p, id: makeId("plan") }));
}

export function buildDefaultDetail(clientId: string): ClientDetail {
  return {
    clientId,
    stages: buildDefaultStages(),
    planning: buildDefaultPlanning(),
    instagram: [],
    linkedin: [],
    youtube: [],
    updatedAt: Date.now(),
  };
}
