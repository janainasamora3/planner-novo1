/**
 * CRM Clientes — clients with full CRM fields (status, contract, services, etc).
 * Separate from the simple SocialClient — this is the rich CRM model.
 */

export type ClientStatus = "ativo" | "pausado" | "inativo" | "lead";

export interface Client {
  id: string;
  name: string;
  emoji: string;
  color: string;
  handle: string;
  status: ClientStatus;
  /** ISO date yyyy-mm-dd */
  startDate?: string;
  endDate?: string;
  /** Monthly recurring revenue (BRL) */
  value?: number;
  responsible?: string;
  email?: string;
  whatsapp?: string;
  niche?: string;
  /** IDs from service-types.ts */
  serviceTypeIds: string[];
  postFrequency?: string;
  notes?: string;
  /** base64 data URL of contract file (PDF/image) */
  contractFile?: string;
  contractFileName?: string;
  terminationContractFile?: string;
  terminationContractFileName?: string;
  createdAt: number;
  updatedAt: number;
}

export const STATUS_LABELS: Record<ClientStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  inativo: "Inativo",
  lead: "Lead",
};

/**
 * Defaults absolutos de cor de status (hex). Usados como fallback quando
 * o usuário ainda não customizou nada via hook useStatusColors.
 */
export const STATUS_COLORS_DEFAULT: Record<ClientStatus, string> = {
  ativo: "#16a34a",
  pausado: "#ca8a04",
  inativo: "#dc2626",
  lead: "#2563eb",
};

/**
 * Versão legada — aponta para CSS vars que adaptam automaticamente
 * entre tema claro/escuro. O hook useStatusColors pode sobrescrever
 * em runtime via <html> style.
 */
export const STATUS_COLORS: Record<ClientStatus, string> = {
  ativo: "var(--status-ativo)",
  pausado: "var(--status-pausado)",
  inativo: "var(--status-inativo)",
  lead: "var(--status-lead)",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  "1x_semana": "1x por semana",
  "2x_semana": "2x por semana",
  "3x_semana": "3x por semana",
  "1x_dia": "1x por dia",
  "2x_dia": "2x por dia",
  "3x_dia": "3x por dia",
  "1x_mes": "1x por mês",
  "sob_demanda": "Sob demanda",
};

export const FREQUENCY_OPTIONS = Object.keys(FREQUENCY_LABELS);

export const NICHE_OPTIONS = [
  "Moda / Fashion",
  "Beleza / Estética",
  "Gastronomia",
  "Fitness / Saúde",
  "Tecnologia",
  "Educação",
  "Música / Audiovisual",
  "Negócios / Empreendedorismo",
  "Lifestyle",
  "Pet",
  "Imobiliário",
  "Jurídico",
  "Outro",
];

export function makeClientId(): string {
  return `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: "cli_demo_1",
    name: "Café Aurora",
    emoji: "☕",
    color: "#7c2d12",
    handle: "@cafeaurora",
    status: "ativo",
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    value: 3500,
    responsible: "Marina",
    email: "contato@cafeaurora.com",
    whatsapp: "(11) 98765-4321",
    niche: "Gastronomia",
    serviceTypeIds: ["svc_posts", "svc_stories", "svc_reels"],
    postFrequency: "3x_semana",
    notes: "Cliente focado em conteúdo de bastidores e receitas.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_2",
    name: "Studio Bloom",
    emoji: "🌸",
    color: "#831843",
    handle: "@studiobloom",
    status: "ativo",
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    value: 2800,
    responsible: "Marina",
    email: "ola@studiobloom.com",
    whatsapp: "(11) 91234-5678",
    niche: "Beleza / Estética",
    serviceTypeIds: ["svc_posts", "svc_stories", "svc_design"],
    postFrequency: "2x_semana",
    notes: "Salão de beleza. Prioridade para antes/depois.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_3",
    name: "E Music DJs",
    emoji: "🎧",
    color: "#a16207",
    handle: "@emusicdjs",
    status: "ativo",
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    value: 4200,
    responsible: "Carlos",
    email: "contato@emusicdjs.com",
    whatsapp: "(11) 99876-5432",
    niche: "Música / Audiovisual",
    serviceTypeIds: ["svc_posts", "svc_reels", "svc_edicao"],
    postFrequency: "3x_semana",
    notes: "DJ e produtor musical. Foco em reels de sets.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_4",
    name: "Império Company",
    emoji: "👑",
    color: "#854d0e",
    handle: "@imperio.companyy",
    status: "ativo",
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    value: 5200,
    responsible: "Marina",
    email: "contato@imperio.company",
    whatsapp: "(11) 95555-1234",
    niche: "Moda / Fashion",
    serviceTypeIds: ["svc_posts", "svc_stories", "svc_reels", "svc_trafego"],
    postFrequency: "1x_dia",
    notes: "Marca de streetwear. Alto volume de conteúdo.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_5",
    name: "João Fit",
    emoji: "💪",
    color: "#166534",
    handle: "@joaofit",
    status: "pausado",
    startDate: "2023-09-01",
    endDate: "2024-06-30",
    value: 2200,
    responsible: "Carlos",
    email: "joao@joaofit.com",
    niche: "Fitness / Saúde",
    serviceTypeIds: ["svc_posts", "svc_reels"],
    postFrequency: "1x_dia",
    notes: "Pausado por viagem internacional.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_6",
    name: "Tech Solutions",
    emoji: "💻",
    color: "#1e1b4b",
    handle: "@techsolutions",
    status: "lead",
    value: 0,
    responsible: "Marina",
    email: "dev@techsol.com",
    niche: "Tecnologia",
    serviceTypeIds: [],
    notes: "Lead quente — em negociação. Aguardando proposta.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_7",
    name: "Loja Pet Lar",
    emoji: "🐾",
    color: "#155e75",
    handle: "@lojapetlar",
    status: "lead",
    value: 0,
    responsible: "Carlos",
    email: "pet@lojapetlar.com",
    niche: "Pet",
    serviceTypeIds: [],
    notes: "Primeira reunião agendada.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo_8",
    name: "Advogada Helena",
    emoji: "⚖️",
    color: "#1f2937",
    handle: "@advhelena",
    status: "inativo",
    startDate: "2023-02-01",
    endDate: "2024-01-15",
    value: 0,
    niche: "Jurídico",
    serviceTypeIds: ["svc_posts"],
    notes: "Contrato encerrado. Possível retorno em 2025.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
