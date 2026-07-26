export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 9 menus padrão — mesmos nomes da imagem de referência.
 * Emojis e cores são defaults que o usuário pode editar.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_prospect", name: "Prospectação",     emoji: "🎯", color: "#1e3a8a", order: 1, createdAt: 0, updatedAt: 0 },
  { id: "cat_crm_eq",   name: "CRM equipe",       emoji: "👥", color: "#14532d", order: 2, createdAt: 0, updatedAt: 0 },
  { id: "cat_crm_cli",  name: "CRM clientes",     emoji: "🤝", color: "#7c2d12", order: 3, createdAt: 0, updatedAt: 0 },
  { id: "cat_fin",      name: "Financeiro",       emoji: "💰", color: "#166534", order: 4, createdAt: 0, updatedAt: 0 },
  { id: "cat_off",      name: "Offboarding",      emoji: "👋", color: "#7f1d1d", order: 5, createdAt: 0, updatedAt: 0 },
  { id: "cat_links",    name: "Links",            emoji: "🔗", color: "#155e75", order: 6, createdAt: 0, updatedAt: 0 },
  { id: "cat_futuro",   name: "Futuro",           emoji: "🚀", color: "#1e1b4b", order: 7, createdAt: 0, updatedAt: 0 },
  { id: "cat_head",     name: "Banco de Headline", emoji: "📋", color: "#713f12", order: 8, createdAt: 0, updatedAt: 0 },
  { id: "cat_prec",     name: "Precificação",     emoji: "💲", color: "#0d9488", order: 9, createdAt: 0, updatedAt: 0 },
];
