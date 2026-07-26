export type PostStatus = "pending" | "approved" | "rejected" | "changes_requested";

export interface SocialClient {
  id: string;
  name: string;
  handle: string; // @username
  emoji: string;
  color: string;
  /** Cliente ativo ou inativo (para filtro Ativos/Inativos) */
  active: boolean;
  /** Período de contrato — formato ISO yyyy-mm-dd */
  startDate?: string;
  endDate?: string;
  /** Campos rich (editáveis no Perfil do ClientDetailTabs) */
  value?: number;
  responsible?: string;
  email?: string;
  whatsapp?: string;
  niche?: string;
  postFrequency?: string;
  notes?: string;
  /** IDs de serviços contratados (referencia service-types.ts) */
  serviceTypeIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SocialPost {
  id: string;
  clientId: string;
  caption: string;
  /** imagem em base64 data URL (já comprimida) */
  imageUrl?: string;
  /** ISO date string (yyyy-mm-dd) */
  scheduledDate?: string;
  /** Notas internas do gestor (não visíveis para o cliente) */
  internalNotes?: string;
  status: PostStatus;
  createdAt: number;
  updatedAt: number;
}

export const STATUS_LABELS: Record<PostStatus, string> = {
  pending: "Aguardando",
  approved: "Aprovado",
  rejected: "Rejeitado",
  changes_requested: "Alterações",
};

export const STATUS_COLORS: Record<PostStatus, string> = {
  pending: "#a16207",       // âmbar
  approved: "#166534",      // verde
  rejected: "#991b1b",      // vermelho
  changes_requested: "#1e3a8a", // azul
};

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_CLIENTS: SocialClient[] = [
  {
    id: "cli_demo1",
    name: "Café Aurora",
    handle: "@cafeaurora",
    emoji: "☕",
    color: "#7c2d12",
    active: true,
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo2",
    name: "Studio Bloom",
    handle: "@studiobloom",
    emoji: "🌸",
    color: "#831843",
    active: true,
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo3",
    name: "E Music DJs",
    handle: "@emusicdjs",
    emoji: "🎧",
    color: "#a16207",
    active: true,
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo4",
    name: "Império Company",
    handle: "@imperio.companyy",
    emoji: "👑",
    color: "#854d0e",
    active: true,
    startDate: "2025-12-20",
    endDate: "2026-12-31",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "cli_demo5",
    name: "CEO Store",
    handle: "@ceostorebr",
    emoji: "🛒",
    color: "#166534",
    active: false,
    startDate: "2025-06-01",
    endDate: "2025-11-30",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const DEFAULT_POSTS: SocialPost[] = [
  {
    id: makeId("post"),
    clientId: "cli_demo1",
    caption: "Bom dia! Comece o dia com nosso novo cappuccino especial. ☕✨ #cafeaurora #bomdia",
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: makeId("post"),
    clientId: "cli_demo2",
    caption: "Arranjos de primavera disponíveis essa semana! Encomende pelo DM. 🌷",
    scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: makeId("post"),
    clientId: "cli_demo3",
    caption: "Set list do evento de sábado! Quem vai estar presente? 🎧🎶 #emusicdjs",
    scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    status: "approved",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
