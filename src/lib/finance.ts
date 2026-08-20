export type TransactionType = "entrada" | "saida";
export type TransactionStatus = "pago" | "pendente" | "atrasado";

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  value: number;
  /** ISO yyyy-mm-dd */
  date: string;
  paymentMethod: string;
  status: TransactionStatus;
  client: string;
  service: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const TYPE_LABELS: Record<TransactionType, string> = {
  entrada: "Entrada",
  saida: "Saída",
};

export const TYPE_COLORS: Record<TransactionType, string> = {
  entrada: "#16a34a", // verde
  saida: "#dc2626",   // vermelho
};

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

export const STATUS_COLORS: Record<TransactionStatus, string> = {
  pago: "#16a34a",
  pendente: "#ca8a04",
  atrasado: "#dc2626",
};

export const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  outro: "Outro",
};

export const PAYMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

export const STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
  { value: "atrasado", label: "Atrasado" },
];

const today = new Date();
function dateOffset(days: number, monthOffset = 0): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  d.setMonth(d.getMonth() + monthOffset);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "fin_demo1",
    type: "entrada",
    description: "Mensalidade Café Aurora — gestão Instagram",
    value: 2800,
    date: dateOffset(-2),
    paymentMethod: "pix",
    status: "pago",
    client: "Café Aurora",
    service: "Gestão de social media",
    notes: "Pagamento em dia via Pix",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo2",
    type: "entrada",
    description: "Mensalidade Studio Bloom — gestão + tráfego",
    value: 4500,
    date: dateOffset(-5),
    paymentMethod: "transferencia",
    status: "pago",
    client: "Studio Bloom",
    service: "Gestão + tráfego pago",
    notes: "Recebido via transferência bancária",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo3",
    type: "saida",
    description: "Salário Marina Costa — Social Media",
    value: 2800,
    date: dateOffset(-3),
    paymentMethod: "pix",
    status: "pago",
    client: "—",
    service: "Equipe",
    notes: "Folha de pagamento",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo4",
    type: "saida",
    description: "Bruno Alves — edição de vídeos (freela)",
    value: 2200,
    date: dateOffset(-3),
    paymentMethod: "pix",
    status: "pago",
    client: "—",
    service: "Equipe",
    notes: "Pagamento de freelance mensal",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo5",
    type: "saida",
    description: "Canva Pro + Adobe CC (assinaturas)",
    value: 280,
    date: dateOffset(-1),
    paymentMethod: "cartao",
    status: "pago",
    client: "—",
    service: "Ferramentas",
    notes: "Assinaturas mensais",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo6",
    type: "entrada",
    description: "E Music DJs — pacote de reels",
    value: 1800,
    date: dateOffset(2),
    paymentMethod: "pix",
    status: "pendente",
    client: "E Music DJs",
    service: "Produção de reels",
    notes: "Aguardando pagamento — vence em 2 dias",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo7",
    type: "saida",
    description: "Império Company — boost campanha",
    value: 600,
    date: dateOffset(-7),
    paymentMethod: "cartao",
    status: "pago",
    client: "Império Company",
    service: "Tráfego pago",
    notes: "Reembolso de mídia paga",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "fin_demo8",
    type: "entrada",
    description: "CEO Store — mensalidade (em atraso)",
    value: 2400,
    date: dateOffset(-10),
    paymentMethod: "boleto",
    status: "atrasado",
    client: "CEO Store",
    service: "Gestão de e-commerce",
    notes: "Boleto vencido — follow-up com cliente",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
