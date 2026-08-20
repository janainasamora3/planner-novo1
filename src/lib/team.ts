export interface TeamMember {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Cargo — usa um dos ROLE_PRESETS ou livre */
  role: string;
  /** Função / descrição do que faz */
  func: string;
  /** Cor do cargo (derivada do preset ou customizada) */
  roleColor: string;
  email: string;
  whatsapp: string;
  /** ISO yyyy-mm-dd */
  birthday: string;
  /** Tipo de contrato (PJ, CLT, Freela, etc) */
  contract: string;
  address: string;
  /** Valor do pagamento em R$ */
  value: number;
  /** ISO yyyy-mm-dd — próximo pagamento */
  nextPayment: string;
  /** Contrato anexo em data URL (PDF/img) */
  contractFile?: string;
  contractFileName?: string;
  createdAt: number;
  updatedAt: number;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface RolePreset {
  label: string;
  color: string;
}

/** 8 cargos pré-definidos com suas cores */
export const ROLE_PRESETS: RolePreset[] = [
  { label: "Social Media operacional", color: "#7c3aed" },
  { label: "Editor de vídeo",          color: "#7c3aed" },
  { label: "Designer",                 color: "#6b7280" },
  { label: "Social Media estrategista", color: "#2563eb" },
  { label: "HEAD de conteúdo",         color: "#7c2d12" },
  { label: "Gestor de projeto",        color: "#ca8a04" },
  { label: "Social Seller",            color: "#a16207" },
  { label: "Closer",                   color: "#16a34a" },
];

export const CONTRACT_TYPES: string[] = [
  "PJ",
  "CLT",
  "Freelancer",
  "Sócio",
  "Estágio",
  "Outro",
];

export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: "team_demo1",
    name: "Marina Costa",
    emoji: "🎨",
    color: "#7c3aed",
    role: "Social Media operacional",
    func: "Criação de posts, roteiros de reels e calendário editorial",
    roleColor: "#7c3aed",
    email: "marina@agencia.com",
    whatsapp: "11987654321",
    birthday: "1995-03-12",
    contract: "PJ",
    address: "São Paulo, SP",
    value: 2800,
    nextPayment: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo2",
    name: "Bruno Alves",
    emoji: "🎬",
    color: "#7c3aed",
    role: "Editor de vídeo",
    func: "Edição de reels, cortes curtos e finalizacão de vídeos longos",
    roleColor: "#7c3aed",
    email: "bruno@agencia.com",
    whatsapp: "11991234567",
    birthday: "1992-08-23",
    contract: "Freelancer",
    address: "Remote — Belo Horizonte, MG",
    value: 2200,
    nextPayment: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo3",
    name: "Carla Mendes",
    emoji: "🖌️",
    color: "#6b7280",
    role: "Designer",
    func: "Identidade visual, arte de posts e templates",
    roleColor: "#6b7280",
    email: "carla@agencia.com",
    whatsapp: "11984445566",
    birthday: "1997-11-04",
    contract: "PJ",
    address: "São Paulo, SP",
    value: 2500,
    nextPayment: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo4",
    name: "Diego Santos",
    emoji: "📈",
    color: "#2563eb",
    role: "Social Media estrategista",
    func: "Estratégia de conteúdo, métricas e gestão de campanhas",
    roleColor: "#2563eb",
    email: "diego@agencia.com",
    whatsapp: "11997778899",
    birthday: "1989-01-19",
    contract: "CLT",
    address: "São Paulo, SP",
    value: 4500,
    nextPayment: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo5",
    name: "Eduarda Lima",
    emoji: "✍️",
    color: "#7c2d12",
    role: "HEAD de conteúdo",
    func: "Lidera o time de conteúdo, aprova pautas e revisa entregas",
    roleColor: "#7c2d12",
    email: "eduarda@agencia.com",
    whatsapp: "11982223344",
    birthday: "1990-06-30",
    contract: "CLT",
    address: "São Paulo, SP",
    value: 5800,
    nextPayment: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo6",
    name: "Fábio Rocha",
    emoji: "📅",
    color: "#ca8a04",
    role: "Gestor de projeto",
    func: "Acompanha prazos, escopo e comunicação com clientes",
    roleColor: "#ca8a04",
    email: "fabio@agencia.com",
    whatsapp: "11991112233",
    birthday: "1988-04-15",
    contract: "CLT",
    address: "São Paulo, SP",
    value: 5200,
    nextPayment: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo7",
    name: "Gisele Pires",
    emoji: "💬",
    color: "#a16207",
    role: "Social Seller",
    func: "Prospecção no DM, qualificação e agendamento de calls",
    roleColor: "#a16207",
    email: "gisele@agencia.com",
    whatsapp: "11983334455",
    birthday: "1993-09-08",
    contract: "PJ",
    address: "Remote — Curitiba, PR",
    value: 2400,
    nextPayment: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "team_demo8",
    name: "Henrique Dias",
    emoji: "🎯",
    color: "#16a34a",
    role: "Closer",
    func: "Fechamento de contratos, calls e follow-up de propostas",
    roleColor: "#16a34a",
    email: "henrique@agencia.com",
    whatsapp: "11995556677",
    birthday: "1987-12-25",
    contract: "CLT",
    address: "São Paulo, SP",
    value: 6500,
    nextPayment: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
