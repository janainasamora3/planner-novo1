/**
 * Banco de Headlines — biblioteca de headlines/títulos de impacto
 * para uso em posts de social media.
 *
 * Cada headline tem: texto, categoria (com cor), favorito (estrela),
 * e ordem (para drag-and-drop).
 */

export interface HeadlineCategory {
  id: string;
  label: string;
  color: string;
}

export interface Headline {
  id: string;
  text: string;
  categoryId: string;
  favorite: boolean;
  order: number;
  /** ISO date yyyy-mm-dd — quando foi criada */
  createdAt: number;
  updatedAt: number;
}

export function makeId(prefix = "hd"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Categorias padrão de headlines. */
export const DEFAULT_HEADLINE_CATEGORIES: HeadlineCategory[] = [
  { id: "cat_vendas",      label: "Vendas",        color: "#166534" },
  { id: "cat_educativo",   label: "Educativo",     color: "#1e3a8a" },
  { id: "cat_urgencia",    label: "Urgência",      color: "#7c2d12" },
  { id: "cat_story",       label: "Storytelling",  color: "#155e75" },
  { id: "cat_curiosidade", label: "Curiosidade",   color: "#713f12" },
  { id: "cat_promessa",    label: "Promessa",      color: "#831843" },
  { id: "cat_prova",       label: "Prova social",  color: "#1e1b4b" },
  { id: "cat_cta",         label: "CTA",           color: "#3f3f46" },
];

/** Defaults — algumas headlines de exemplo. */
export const DEFAULT_HEADLINES: Omit<Headline, "id" | "createdAt" | "updatedAt">[] = [
  { text: "5 erros que estão destruindo seu Instagram (e como corrigir)", categoryId: "cat_educativo", favorite: true,  order: 1 },
  { text: "Últimas 24h: curso de reels com 70% OFF", categoryId: "cat_urgencia", favorite: true,  order: 2 },
  { text: "Como fiz 10k seguidores em 30 dias (sem gastar com tráfego)", categoryId: "cat_story", favorite: false, order: 3 },
  { text: "O segredo dos perfis que vendem todo dia", categoryId: "cat_vendas", favorite: false, order: 4 },
  { text: "Você está cometendo esse erro nos seus reels?", categoryId: "cat_curiosidade", favorite: false, order: 5 },
  { text: "3 ferramentas gratuitas que vão transformar seu conteúdo", categoryId: "cat_educativo", favorite: false, order: 6 },
  { text: "Por que seus stories não convertem (e o que fazer)", categoryId: "cat_educativo", favorite: false, order: 7 },
  { text: "O método que usei para faturar 50k com Instagram", categoryId: "cat_prova", favorite: false, order: 8 },
  { text: "Pare de postar sem antes ver isso", categoryId: "cat_urgencia", favorite: false, order: 9 },
  { text: "Ahistória por trás do meu primeiro cliente de R$10k", categoryId: "cat_story", favorite: false, order: 10 },
];
