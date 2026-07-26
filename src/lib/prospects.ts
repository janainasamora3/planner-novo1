export type FunnelStage = "novo" | "contato" | "reuniao" | "proposta" | "fechado";

export interface Prospect {
  id: string;
  name: string;
  handle: string; // @username ou contato
  email?: string;
  phone?: string;
  emoji: string;
  color: string;
  stage: FunnelStage;
  /** Valor potencial em R$ */
  value?: number;
  /** De onde veio o lead */
  source?: string;
  /** Data da última interação ISO yyyy-mm-dd */
  lastContact?: string;
  /** Observações livres */
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export const STAGES: { id: FunnelStage; label: string; color: string }[] = [
  { id: "novo",     label: "Novo",         color: "#1e3a8a" }, // azul
  { id: "contato",  label: "Contato feito", color: "#155e75" }, // ciano
  { id: "reuniao",  label: "Reunião",       color: "#7c2d12" }, // laranja
  { id: "proposta", label: "Proposta",      color: "#713f12" }, // âmbar
  { id: "fechado",  label: "Fechado",       color: "#166534" }, // verde
];

export const STAGE_LABELS: Record<FunnelStage, string> = {
  novo: "Novo",
  contato: "Contato feito",
  reuniao: "Reunião",
  proposta: "Proposta",
  fechado: "Fechado",
};

export const STAGE_COLORS: Record<FunnelStage, string> = {
  novo: "#1e3a8a",
  contato: "#155e75",
  reuniao: "#7c2d12",
  proposta: "#713f12",
  fechado: "#166534",
};

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_PROSPECTS: Prospect[] = [
  {
    id: "pros_demo1",
    name: "Restaurante Sabor",
    handle: "@saborrestaurante",
    email: "contato@saborrestaurante.com.br",
    phone: "(11) 3456-7890",
    emoji: "🍽️",
    color: "#7c2d12",
    stage: "novo",
    value: 2500,
    source: "Instagram",
    lastContact: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    notes: "Dono respondeu DM interessado. Aguardando marcar reunião.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "pros_demo2",
    name: "Boutique Elegância",
    handle: "@boutiqueelegancia",
    email: "vendas@boutiqueelegancia.com",
    phone: "(11) 98765-4321",
    emoji: "👗",
    color: "#831843",
    stage: "contato",
    value: 1800,
    source: "Indicação",
    lastContact: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    notes: "Mandei proposta inicial por email. Aguardando retorno.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "pros_demo3",
    name: "Academia FitPro",
    handle: "@acadfitpro",
    email: "comercial@acadfitpro.com.br",
    phone: "(11) 2345-6789",
    emoji: "💪",
    color: "#14532d",
    stage: "reuniao",
    value: 4200,
    source: "Google",
    lastContact: new Date().toISOString().slice(0, 10),
    notes: "Reunião agendada para sexta-feira 15h. Pediu pacote completo (tráfego + conteúdo).",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "pros_demo4",
    name: "Café Aurora",
    handle: "@cafeaurora",
    email: "oi@cafeaurora.com.br",
    phone: "(11) 91234-5678",
    emoji: "☕",
    color: "#7c2d12",
    stage: "proposta",
    value: 3200,
    source: "Instagram",
    lastContact: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    notes: "Proposta enviada: R$ 3.200/mês, 12 posts + stories. Aguardando aprovação.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "pros_demo5",
    name: "Studio Bloom",
    handle: "@studiobloom",
    email: "hello@studiobloom.com",
    phone: "(11) 99876-5432",
    emoji: "🌸",
    color: "#831843",
    stage: "fechado",
    value: 2400,
    source: "Indicação",
    lastContact: new Date().toISOString().slice(0, 10),
    notes: "Contrato assinado! Início dia 1º do próximo mês.",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
