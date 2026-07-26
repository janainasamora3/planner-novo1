export interface SubCategory {
  id: string;
  /** ID da categoria pai (ex: "cat_prospect") */
  parentId: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

/** Tipo de conteúdo que cada subcategoria renderiza */
export type SubContentType = "funil" | "lista" | "atividades" | "calendario" | "relatorios" | "notas";
export function makeId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Subcategorias padrão para cada menu pai.
 * Por enquanto só "cat_prospect" tem submenus implementados.
 */
export const DEFAULT_SUBCATEGORIES: SubCategory[] = [
  {
    id: "sub_pros_funil",
    parentId: "cat_prospect",
    name: "Funil",
    emoji: "📊",
    color: "#1e3a8a",
    order: 1,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "sub_pros_lista",
    parentId: "cat_prospect",
    name: "Lista de contatos",
    emoji: "📋",
    color: "#155e75",
    order: 2,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "sub_pros_bloco",
    parentId: "cat_prospect",
    name: "Bloco de Anotações",
    emoji: "📝",
    color: "#7c2d12",
    order: 3,
    createdAt: 0,
    updatedAt: 0,
  },
];

/** Mapeia cada subcategoria ao tipo de conteúdo que ela renderiza */
export const SUB_CONTENT_TYPES: Record<string, SubContentType> = {
  sub_pros_funil: "funil",
  sub_pros_lista: "lista",
  sub_pros_bloco: "notas",
};
