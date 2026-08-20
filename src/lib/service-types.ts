/**
 * Service Types — tipos de serviço oferecidos a clientes CRM
 * (Posts, Stories, Reels, Gestão de tráfego, Design, etc).
 */

export interface ServiceTypeItem {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export function makeId(prefix = "svc"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 12 default service types. */
export const DEFAULT_SERVICE_TYPES: ServiceTypeItem[] = [
  { id: "svc_posts",      label: "Posts feed",        emoji: "📝", color: "#1e3a8a", order: 1,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_stories",    label: "Stories",            emoji: "📷", color: "#831843", order: 2,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_reels",      label: "Reels",              emoji: "🎬", color: "#7c2d12", order: 3,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_trafego",    label: "Gestão de tráfego",  emoji: "🎯", color: "#166534", order: 4,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_design",     label: "Design",             emoji: "🎨", color: "#713f12", order: 5,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_edicao",     label: "Edição de vídeo",    emoji: "✂️", color: "#1e1b4b", order: 6,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_copy",       label: "Copywriting",        emoji: "✍️", color: "#155e75", order: 7,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_estrategia", label: "Estratégia",         emoji: "♟️", color: "#3f3f46", order: 8,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_community",  label: "Community",          emoji: "💬", color: "#0f766e", order: 9,  createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_email",      label: "Email marketing",    emoji: "📧", color: "#854d0e", order: 10, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_youtube",    label: "YouTube",             emoji: "▶️", color: "#7f1d1d", order: 11, createdAt: Date.now(), updatedAt: Date.now() },
  { id: "svc_tiktok",     label: "TikTok",              emoji: "🎵", color: "#312e81", order: 12, createdAt: Date.now(), updatedAt: Date.now() },
];
