export type SectionId = "negocios" | "pessoal";

export interface PageCard {
  id: string;
  section: SectionId;
  title: string;
  /** Emoji ou caractere para o ícone no card. Vai sobre gradient. */
  emoji?: string;
  /** Cor base do gradient (hex). Default baseada na seção. */
  color?: string;
  /** URL de imagem opcional — se houver, mostra no card. */
  imageUrl?: string;
  /** Notas/conteúdo livre da página (markdown simples). */
  content?: string;
  /** Marca páginas com funcionalidade especial */
  special?: "social-media" | "enterprise" | "business-plan" | "books" | "tasks" | "caverna" | "planejamento" | "finance" | "quick-tasks" | "ideas" | "fitness" | "exercicios" | "cursos";
  createdAt: number;
  updatedAt: number;
}

export interface Section {
  id: SectionId;
  title: string;
  /** Cor accent usada nos botões "Nova" e no gradiente default dos cards */
  accent: string;
}

export const SECTIONS: Section[] = [
  { id: "negocios", title: "Negócios", accent: "#2563eb" },
  { id: "pessoal", title: "Vida Pessoal", accent: "#2563eb" },
];

export const DEFAULT_PAGES: PageCard[] = [
  // Negócios
  { id: "n1", section: "negocios", title: "Social Media", emoji: "📱", color: "#1e3a8a", special: "social-media", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n2", section: "negocios", title: "E Music DJs", emoji: "🎧", color: "#a16207", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n3", section: "negocios", title: "Império Company", emoji: "👑", color: "#854d0e", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n4", section: "negocios", title: "Janaina Almeida", emoji: "JA", color: "#1f2937", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n5", section: "negocios", title: "E.Vision Records", emoji: "EV", color: "#1f2937", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n6", section: "negocios", title: "EMD Cast", emoji: "🎙️", color: "#1f2937", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n7", section: "negocios", title: "CEO Store", emoji: "🛒", color: "#166534", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n8", section: "negocios", title: "Negócios Reais", emoji: "♟️", color: "#0a0a0a", special: "enterprise", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "n9", section: "negocios", title: "Plano Empresarial 2026", emoji: "🤝", color: "#1c1917", special: "business-plan", createdAt: Date.now(), updatedAt: Date.now() },

  // Vida Pessoal
  { id: "p1", section: "pessoal", title: "Tarefas", emoji: "✅", color: "#7c2d12", special: "quick-tasks", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p2", section: "pessoal", title: "Modo Caverna", emoji: "🧠", color: "#1e293b", special: "caverna", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p3", section: "pessoal", title: "Planejamento", emoji: "🗓️", color: "#1e3a8a", special: "planejamento", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p4", section: "pessoal", title: "Finanças", emoji: "💸", color: "#14532d", special: "finance", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p5", section: "pessoal", title: "Ideias", emoji: "💡", color: "#1e1b4b", special: "ideas", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p6", section: "pessoal", title: "Exercícios", emoji: "🏃", color: "#7c2d12", special: "exercicios", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p7", section: "pessoal", title: "Fitness", emoji: "🥗", color: "#166534", special: "fitness", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p8", section: "pessoal", title: "Senhas", emoji: "🔐", color: "#713f12", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p9", section: "pessoal", title: "Saúde", emoji: "🩺", color: "#7f1d1d", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p10", section: "pessoal", title: "Livros", emoji: "📖", color: "#3f3f46", special: "books", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p11", section: "pessoal", title: "Sonhos", emoji: "🔑", color: "#1e3a8a", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p12", section: "pessoal", title: "Viagens", emoji: "✈️", color: "#155e75", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p13", section: "pessoal", title: "Limpeza", emoji: "🧹", color: "#3f3f46", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p14", section: "pessoal", title: "Deusa Day", emoji: "🌹", color: "#831843", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p15", section: "pessoal", title: "Ensaio", emoji: "📸", color: "#1c1917", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p17", section: "pessoal", title: "Cursos", emoji: "🎓", color: "#0891b2", special: "cursos", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "p16", section: "pessoal", title: "Plano Pessoal 2026", emoji: "🤝", color: "#1c1917", createdAt: Date.now(), updatedAt: Date.now() },
];

export function makeId(): string {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
