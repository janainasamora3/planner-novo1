export type FutureCategory = "curto" | "medio" | "longo";
export type FuturePriority = "baixa" | "media" | "alta";

export interface FutureItem {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  order: number;
  /** Horizonte de tempo — agrupa itens no plano de ação */
  category?: FutureCategory;
  /** Prioridade visual do item */
  priority?: FuturePriority;
  /** Prazo alvo (ISO yyyy-mm-dd) — quando querer concluir */
  deadline?: string;
  /** Pessoa responsável pela execução */
  owner?: string;
  /** Etapas internas — sub-checklist para plano de ação */
  steps?: { id: string; text: string; done: boolean }[];
  /** Marca de conclusão (data) */
  completedAt?: number;
  createdAt?: number;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const CATEGORY_LABELS: Record<FutureCategory, string> = {
  curto: "Curto prazo",
  medio: "Médio prazo",
  longo: "Longo prazo",
};

export const CATEGORY_EMOJIS: Record<FutureCategory, string> = {
  curto: "⚡",
  medio: "🎯",
  longo: "🌟",
};

/** Cores por horizonte (curto=verde, médio=azul, longo=violeta) */
export const CATEGORY_COLORS: Record<FutureCategory, string> = {
  curto: "#16a34a",
  medio: "#2563eb",
  longo: "#7c3aed",
};

export const CATEGORY_DESCRIPTIONS: Record<FutureCategory, string> = {
  curto: "Próximos 3 meses",
  medio: "3 a 12 meses",
  longo: "Mais de 1 ano",
};

export const PRIORITY_LABELS: Record<FuturePriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PRIORITY_COLORS: Record<FuturePriority, string> = {
  baixa: "#6b7280",
  media: "#f59e0b",
  alta: "#dc2626",
};

export const CATEGORY_OPTIONS: { value: FutureCategory; label: string; emoji: string }[] = [
  { value: "curto", label: "Curto prazo", emoji: "⚡" },
  { value: "medio", label: "Médio prazo", emoji: "🎯" },
  { value: "longo", label: "Longo prazo", emoji: "🌟" },
];

export const PRIORITY_OPTIONS: { value: FuturePriority; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

export const DEFAULT_FUTURE_ITEMS: FutureItem[] = [
  {
    id: "fut_demo1",
    title: "Fazer curso avançado de tráfego pago",
    description: "Meta Ads Avançado + Google Ads para escalar campanhas de clientes",
    done: false,
    order: 1,
    category: "curto",
    priority: "alta",
    deadline: "",
    owner: "Diego",
    steps: [
      { id: "s1", text: "Pesquisar e escolher curso", done: true },
      { id: "s2", text: "Realizar matrícula", done: false },
      { id: "s3", text: "Concluir módulos práticos", done: false },
      { id: "s4", text: "Aplicar aprendizados em 1 cliente piloto", done: false },
    ],
  },
  {
    id: "fut_demo2",
    title: "Parceria com 3 influenciadores do nicho",
    description: "Estabelecer parcerias estratégicas para ampliar alcance",
    done: false,
    order: 2,
    category: "medio",
    priority: "media",
    deadline: "",
    owner: "Gisele",
    steps: [
      { id: "s1", text: "Listar 10 influenciadores alinhados", done: false },
      { id: "s2", text: "Fazer primeiro contato", done: false },
      { id: "s3", text: "Fechar 3 parcerias", done: false },
    ],
  },
  {
    id: "fut_demo3",
    title: "Lançar serviço de consultoria 1:1",
    description: "Produto premium para clientes que querem mentoria individual",
    done: false,
    order: 3,
    category: "medio",
    priority: "alta",
    deadline: "",
    owner: "Eduarda",
    steps: [
      { id: "s1", text: "Definir formato e pricing", done: false },
      { id: "s2", text: "Criar página de vendas", done: false },
      { id: "s3", text: "Divulgar para base", done: false },
    ],
  },
  {
    id: "fut_demo4",
    title: "Redesign completo do site da agência",
    description: "Modernizar portfólio e melhorar conversão de leads",
    done: false,
    order: 4,
    category: "medio",
    priority: "media",
    deadline: "",
    owner: "Carla",
    steps: [
      { id: "s1", text: "Definir identidade visual", done: false },
      { id: "s2", text: "Wireframe + design", done: false },
      { id: "s3", text: "Desenvolvimento", done: false },
      { id: "s4", text: "Lançamento", done: false },
    ],
  },
  {
    id: "fut_demo5",
    title: "Mentoria com HEAD de mercado reconhecido",
    description: "Acelerar crescimento com orientação de quem já chegou lá",
    done: false,
    order: 5,
    category: "longo",
    priority: "media",
    deadline: "",
    owner: "—",
    steps: [
      { id: "s1", text: "Listar 5 potenciais mentores", done: false },
      { id: "s2", text: "Entrar em contato", done: false },
      { id: "s3", text: "Fechamento e início", done: false },
    ],
  },
  {
    id: "fut_demo6",
    title: "Contratar mais um Social Media sênior",
    description: "Expandir capacidade de atendimento sem perder qualidade",
    done: false,
    order: 6,
    category: "medio",
    priority: "media",
    deadline: "",
    owner: "Fábio",
    steps: [
      { id: "s1", text: "Definir perfil e salário", done: false },
      { id: "s2", text: "Divulgar vaga", done: false },
      { id: "s3", text: "Entrevistas", done: false },
      { id: "s4", text: "Onboarding", done: false },
    ],
  },
  {
    id: "fut_demo7",
    title: "Plano de aposentadoria / investimentos",
    description: "Construir reserva de longo prazo para segurança financeira",
    done: false,
    order: 7,
    category: "longo",
    priority: "media",
    deadline: "",
    owner: "—",
    steps: [
      { id: "s1", text: "Conversar com assessor financeiro", done: false },
      { id: "s2", text: "Definir alocação", done: false },
      { id: "s3", text: "Aporte mensal automático", done: false },
    ],
  },
  {
    id: "fut_demo8",
    title: "Viagem de 30 dias sem trabalhar (testar time autônomo)",
    description: "Validar que a agência funciona sem a presença direta do dono",
    done: false,
    order: 8,
    category: "longo",
    priority: "baixa",
    deadline: "",
    owner: "—",
    steps: [
      { id: "s1", text: "Documentar processos", done: false },
      { id: "s2", text: "Delegar responsabilidades", done: false },
      { id: "s3", text: "Fazer viagem teste de 7 dias", done: false },
      { id: "s4", text: "Viagem de 30 dias", done: false },
    ],
  },
];
