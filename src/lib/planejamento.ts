/**
 * Sub-páginas do Planejamento.
 *
 * Cada item aqui vira um card grande clicável dentro da janela própria
 * do Planejamento (estilo "menu de capas"). Cada card tem capa editável
 * (emoji + cor + imagem opcional) e conteúdo livre, exatamente como os
 * cards do dashboard principal.
 */

export interface PlanejamentoItem {
  id: string;
  title: string;
  emoji: string;
  color: string;
  /** Capa opcional (data URL). Se vazio, usa gradient + emoji. */
  imageUrl?: string;
  /** Notas/conteúdo livre (markdown simples). */
  content?: string;
  createdAt: number;
  updatedAt: number;
}

/** ID fixo do card Briefing (usado para injetar template e habilitar botão "Restaurar"). */
export const BRIEFING_ID = "pl-briefing";

/**
 * Template completo do Briefing — estruturado exatamente como enviado
 * pelo usuário. Cada seção tem perguntas/campos prontos para preencher.
 *
 * Exportado para que a página do Briefing possa oferecer "Restaurar template".
 */
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

- Nesse mês ou no próximo tem alguma data importante para você? [ver aba Datas importantes]


## Monetização

- Quais produtos/serviços/infoprodutos você vende hoje? [ver aba Monetização]


## Provas sociais

- Você tem um lugar aonde armazena fotos/videos de provas sociais que você recebe? [ver aba Provas sociais]


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

> Tom de voz é como você se comunica. Ele inclui palavras, estilo e emoção, ajudando a conectar com o público [ver aba Tom de voz].


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

/** Lista padrão — 27 itens pedidos pelo usuário, na ordem informada. */
export const DEFAULT_PLANEJAMENTO_ITEMS: PlanejamentoItem[] = [
  { id: "pl-briefing",            title: "Briefing",                 emoji: "📝", color: "#1e3a8a" },
  { id: "pl-tom-de-voz",          title: "Tom de voz",               emoji: "🗣️", color: "#1e293b" },
  { id: "pl-monetizacao",         title: "Monetização",              emoji: "💰", color: "#14532d" },
  { id: "pl-objetivo",            title: "Objetivo",                 emoji: "🎯", color: "#7c2d12" },
  { id: "pl-publico-alvo",        title: "Público alvo",             emoji: "👥", color: "#155e75" },
  { id: "pl-provas-sociais",      title: "Provas sociais",           emoji: "⭐", color: "#854d0e" },
  { id: "pl-datas-importantes",   title: "Datas importantes",        emoji: "📅", color: "#1e1b4b" },
  { id: "pl-metricas-antigas",    title: "Métricas antigas",         emoji: "📊", color: "#1f2937" },
  { id: "pl-analise-mercado",     title: "Análise de mercado",       emoji: "🔍", color: "#0f766e" },
  { id: "pl-organizacao-perfil",  title: "Organização do perfil",    emoji: "🧩", color: "#3f3f46" },
  { id: "pl-stories",             title: "Stories",                  emoji: "📲", color: "#831843" },
  { id: "pl-brainstorm",          title: "Brainstorm",               emoji: "💡", color: "#a16207" },
  { id: "pl-servicos",            title: "Serviços",                 emoji: "🛠️", color: "#166534" },
  { id: "pl-funil",               title: "Funil",                    emoji: "🔻", color: "#1e3a8a" },
  { id: "pl-infoprodutos",        title: "Infoprodutos",             emoji: "📦", color: "#713f12" },
  { id: "pl-vocabulario",         title: "Vocabulário",              emoji: "🔤", color: "#1f2937" },
  { id: "pl-agressividade",       title: "Nível de agressividade",   emoji: "⚡", color: "#7f1d1d" },
  { id: "pl-formalidade",         title: "Nível de formalidade",     emoji: "🎩", color: "#0f172a" },
  { id: "pl-humor",               title: "Nível de humor",           emoji: "😄", color: "#a16207" },
  { id: "pl-emojis-usados",       title: "Emojis mais usados",       emoji: "✨", color: "#155e75" },
  { id: "pl-moodboard",           title: "Moodboard",                emoji: "🎨", color: "#831843" },
  { id: "pl-fotos",               title: "Fotos",                    emoji: "📸", color: "#1c1917" },
  { id: "pl-preferencias",        title: "Preferências Pessoais",    emoji: "💗", color: "#9d174d" },
  { id: "pl-trabalho-negocio",    title: "Trabalho e Negócio",       emoji: "💼", color: "#1f2937" },
  { id: "pl-conteudo-redes",      title: "Conteúdo e Redes Sociais", emoji: "🌐", color: "#0e7490" },
  { id: "pl-historias",           title: "Histórias",                emoji: "📖", color: "#312e81" },
  { id: "pl-briefing-design",     title: "Briefing design",          emoji: "🖌️", color: "#7c2d12" },
].map((it) => ({
  ...it,
  imageUrl: "",
  // Briefing recebe o template completo; os demais começam vazios.
  content: it.id === "pl-briefing" ? BRIEFING_TEMPLATE : "",
  createdAt: Date.now(),
  updatedAt: Date.now(),
}));

export function makePlanejamentoId(): string {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
