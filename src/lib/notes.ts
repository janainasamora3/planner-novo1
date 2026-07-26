export interface Note {
  id: string;
  title: string;
  /** Conteúdo livre do passo a passo (multi-linha) */
  content: string;
  /** Checklist de passos — cada item pode ser marcado como feito */
  steps: NoteStep[];
  emoji: string;
  color: string;
  /** Pinned (fixado no topo) */
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NoteStep {
  id: string;
  text: string;
  done: boolean;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_NOTES: Note[] = [
  {
    id: "note_demo1",
    title: "Primeiro contato com cliente novo",
    content:
      "Roteiro para o primeiro contato com um lead que veio do Instagram.\n\nObjetivo: entender a dor do cliente e agendar uma reunião de diagnóstico.",
    emoji: "📞",
    color: "#1e3a8a",
    pinned: true,
    steps: [
      { id: "s1", text: "Pesquisar o perfil do cliente (Instagram, site, concorrentes)", done: true },
      { id: "s2", text: "Enviar DM personalizada mencionando um post recente", done: true },
      { id: "s3", text: "Aguardar resposta (até 48h)", done: false },
      { id: "s4", text: "Se responder, propor call de 15min para diagnóstico", done: false },
      { id: "s5", text: "Enviar link do Calendly com 3 horários", done: false },
      { id: "s6", text: "Confirmar reunião 1h antes por WhatsApp", done: false },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "note_demo2",
    title: "Reunião de fechamento",
    content:
      "Passo a passo para a reunião onde o cliente vai decidir fechar ou não.\n\nDica: sempre envie a proposta por escrito 24h antes da call.",
    emoji: "🤝",
    color: "#166534",
    pinned: false,
    steps: [
      { id: "s1", text: "Enviar proposta em PDF 24h antes", done: false },
      { id: "s2", text: "Confirmar presença no dia anterior", done: false },
      { id: "s3", text: "Abrir a call perguntando o que achou da proposta", done: false },
      { id: "s4", text: "Escutar objeções sem interromper", done: false },
      { id: "s5", text: "Oferecer 10% desconto se fechar na call", done: false },
      { id: "s6", text: "Enviar contrato + link de pagamento", done: false },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "note_demo3",
    title: "Follow-up pós-proposta",
    content:
      "O que fazer quando o cliente sumiu depois que você mandou a proposta.\n\nRegra: nunca mande mais de 3 follow-ups. Depois disso, arquive.",
    emoji: "⏰",
    color: "#7c2d12",
    pinned: false,
    steps: [
      { id: "s1", text: "Aguardar 3 dias úteis em silêncio", done: false },
      { id: "s2", text: "Follow-up 1: pergunta direta (tem alguma dúvida?)", done: false },
      { id: "s3", text: "Follow-up 2 (após +3 dias): adicionar valor (cases, depoimentos)", done: false },
      { id: "s4", text: "Follow-up 3 (após +3 dias): 'closing' (última chance do mês)", done: false },
      { id: "s5", text: "Se não responder: marcar como perdido no CRM", done: false },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
