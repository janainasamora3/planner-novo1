/**
 * Book Tracker — rastreador de leitura.
 * Persistido em localStorage via use-books.ts.
 */

export type BookStatus = "quero_ler" | "lendo" | "lido" | "pausado" | "abandonei";
export type BookFormat = "fisico" | "ebook" | "audiobook";

export interface Book {
  id: string;
  title: string;
  author: string;
  /** URL da capa (opcional — se vazio, mostra gradient + iniciais) */
  coverUrl?: string;
  /** Cor do gradient quando não tem capa */
  color: string;
  status: BookStatus;
  /** Avaliação 0-5 estrelas (0 = sem avaliação) */
  rating: number;
  /** Total de páginas */
  totalPages?: number;
  /** Páginas lidas (para progresso) */
  pagesRead?: number;
  /** Data que começou a ler (yyyy-mm-dd) */
  startDate?: string;
  /** Data que terminou (yyyy-mm-dd) */
  finishDate?: string;
  /** Tags/gêneros (array de strings) */
  tags: string[];
  /** Notas/resenha pessoal */
  notes?: string;
  /** Lista (desejo, comprado, etc.) */
  list?: "desejo" | "comprado" | null;
  /** Formato do livro */
  format?: BookFormat;
  /** Registros de leitura diária: { 'yyyy-mm-dd': páginas lidas no dia } */
  readingLog?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export const STATUS_LABELS: Record<BookStatus, string> = {
  quero_ler: "Quero Ler",
  lendo: "Lendo",
  lido: "Lido",
  pausado: "Pausado",
  abandonei: "Abandonei",
};

export const STATUS_COLORS: Record<BookStatus, string> = {
  quero_ler: "#2563eb",
  lendo: "#16a34a",
  lido: "#0891b2",
  pausado: "#ca8a04",
  abandonei: "#dc2626",
};

export const STATUS_EMOJIS: Record<BookStatus, string> = {
  quero_ler: "📚",
  lendo: "📖",
  lido: "✅",
  pausado: "⏸️",
  abandonei: "🚫",
};

export const FORMAT_LABELS: Record<BookFormat, string> = {
  fisico: "Físico",
  ebook: "E-book",
  audiobook: "Audiobook",
};

export const FORMAT_EMOJIS: Record<BookFormat, string> = {
  fisico: "📕",
  ebook: "📱",
  audiobook: "🎧",
};

/** Calcula o streak atual de dias de leitura (baseado em readingLog de todos os livros) */
export function calculateStreak(books: Book[]): { current: number; best: number } {
  const allDates = new Set<string>();
  books.forEach((b) => {
    if (b.readingLog) {
      Object.keys(b.readingLog).forEach((d) => allDates.add(d));
    }
  });
  if (allDates.size === 0) return { current: 0, best: 0 };

  const sortedDates = Array.from(allDates).sort();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  let checkDate = today;
  if (!allDates.has(today) && !allDates.has(yesterday)) {
    current = 0;
  } else {
    if (!allDates.has(today)) {
      checkDate = yesterday;
    }
    while (allDates.has(checkDate)) {
      current++;
      const d = new Date(checkDate + "T00:00:00");
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    }
  }

  let best = 0;
  let tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + "T00:00:00");
    const curr = new Date(sortedDates[i] + "T00:00:00");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      tempStreak++;
    } else {
      if (tempStreak > best) best = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > best) best = tempStreak;

  return { current, best: Math.max(best, current) };
}

/** Retorna estatísticas de tags (tag → contagem de livros + avaliação média) */
export function getTagStats(books: Book[]): { tag: string; count: number; avgRating: number }[] {
  const tagMap = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();
  books.forEach((b) => {
    b.tags.forEach((tag) => {
      const existing = tagMap.get(tag) ?? { count: 0, ratingSum: 0, ratingCount: 0 };
      existing.count++;
      if (b.rating > 0) {
        existing.ratingSum += b.rating;
        existing.ratingCount++;
      }
      tagMap.set(tag, existing);
    });
  });
  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      avgRating: data.ratingCount > 0 ? data.ratingSum / data.ratingCount : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function makeBookId(): string {
  return `book_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Livros de exemplo */
export const DEFAULT_BOOKS: Omit<Book, "id" | "createdAt" | "updatedAt">[] = [
  {
    title: "Verity",
    author: "Colleen Hoover",
    color: "#831843",
    status: "lido",
    rating: 5,
    totalPages: 336,
    pagesRead: 336,
    finishDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    tags: ["Suspense", "Romance"],
    notes: "Livro incrível, não consegui parar de ler!",
  },
  {
    title: "A Professora",
    author: "Freida McFadden",
    color: "#1e3a8a",
    status: "lido",
    rating: 4,
    totalPages: 320,
    pagesRead: 320,
    finishDate: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
    tags: ["Suspense", "Thriller"],
  },
  {
    title: "Pedra, Papel, Tesoura",
    author: "Alice Feeney",
    color: "#7c2d12",
    status: "lendo",
    rating: 0,
    totalPages: 288,
    pagesRead: 120,
    startDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    tags: ["Suspense"],
  },
  {
    title: "Atos Humanos",
    author: "Han Kang",
    color: "#166534",
    status: "quero_ler",
    rating: 0,
    tags: ["Ficção", "Drama"],
    list: "desejo",
  },
  {
    title: "Não Conte a Ninguém",
    author: "Harlan Coben",
    color: "#1e1b4b",
    status: "quero_ler",
    rating: 0,
    tags: ["Suspense", "Thriller"],
    list: "comprado",
  },
];
