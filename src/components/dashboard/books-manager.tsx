"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FontScaleControl } from "@/components/font-scale-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBooks } from "@/hooks/use-books";
import {
  STATUS_COLORS,
  STATUS_EMOJIS,
  STATUS_LABELS,
  FORMAT_LABELS,
  FORMAT_EMOJIS,
  calculateStreak,
  getTagStats,
  type Book,
  type BookStatus,
  type BookFormat,
} from "@/lib/books";
import type { PageCard } from "@/lib/pages";
import { todayLocalISO, localDateToISO } from "@/lib/local-date";

interface BooksManagerProps {
  page: PageCard;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#831843", "#1e3a8a", "#7c2d12", "#166534", "#1e1b4b",
  "#0891b2", "#be185d", "#ca8a04", "#3f3f46", "#dc2626",
];

// Helper global: renderiza estrelas de avaliação
function renderStars(rating: number, onRate?: (n: number) => void) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={onRate ? () => onRate(n) : undefined}
          disabled={!onRate}
          className={cn(
            "text-sm leading-none",
            onRate && "cursor-pointer hover:scale-110 transition-transform",
            n <= rating ? "text-amber-400" : "text-muted-foreground/30"
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function BooksManager({ page, onClose }: BooksManagerProps) {
  const { books, addBook, updateBook, removeBook, resetAll } = useBooks();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<BookStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"acervo" | "agenda">("agenda");

  const editingBook = books.find((b) => b.id === editingId) ?? null;

  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        if (statusFilter !== "todos" && b.status !== statusFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          if (!b.title.toLowerCase().includes(s) && !b.author.toLowerCase().includes(s)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const order: BookStatus[] = ["lendo", "lido", "quero_ler", "pausado", "abandonei"];
        return order.indexOf(a.status) - order.indexOf(b.status);
      });
  }, [books, statusFilter, search]);

  const stats = useMemo(() => {
    const yearNow = new Date().getFullYear();
    const lidosAno = books.filter((b) => b.status === "lido" && b.finishDate && new Date(b.finishDate + "T00:00:00").getFullYear() === yearNow).length;
    const lendo = books.filter((b) => b.status === "lendo").length;
    const queroLer = books.filter((b) => b.status === "quero_ler").length;
    const totalPaginas = books.filter((b) => b.status === "lido").reduce((acc, b) => acc + (b.totalPages ?? 0), 0);
    const todasTags = new Set<string>();
    books.forEach((b) => b.tags.forEach((t) => todasTags.add(t)));
    const streak = calculateStreak(books);
    const tagStats = getTagStats(books);
    return { lidosAno, lendo, queroLer, totalPaginas, totalTags: todasTags.size, total: books.length, streak, tagStats };
  }, [books]);

  // Sortear próximo livro (com animação de roleta)
  const [sortedBook, setSortedBook] = useState<Book | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTitle, setSpinTitle] = useState("");

  function sortearLivro() {
    const queroLer = books.filter((b) => b.status === "quero_ler");
    if (queroLer.length === 0) {
      toast({ title: "Nenhum livro para sortear", description: "Adicione livros com status 'Quero Ler'" });
      return;
    }
    setIsSpinning(true);
    setSortedBook(null);
    const interval = setInterval(() => {
      const random = queroLer[Math.floor(Math.random() * queroLer.length)];
      setSpinTitle(random.title);
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      const final = queroLer[Math.floor(Math.random() * queroLer.length)];
      setSortedBook(final);
      setIsSpinning(false);
      toast({ title: "🎲 Livro sorteado!", description: final.title });
    }, 2000);
  }

  function registrarLeitura(bookId: string, paginas: number, dateIso?: string) {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    const day = dateIso || todayLocalISO();
    const log = { ...(book.readingLog ?? {}) };
    log[day] = (log[day] ?? 0) + paginas;
    const newPagesRead = (book.pagesRead ?? 0) + paginas;
    updateBook(bookId, { readingLog: log, pagesRead: newPagesRead });
  }

  function openNew() {
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setEditorOpen(true);
  }

  function handleSubmit(data: Omit<Book, "id" | "createdAt" | "updatedAt">) {
    if (editingId) {
      updateBook(editingId, data);
      toast({ title: "Livro atualizado", description: data.title });
    } else {
      addBook(data);
      toast({ title: "Livro adicionado", description: data.title });
    }
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const book = books.find((b) => b.id === id);
    removeBook(id);
    toast({ title: "Livro excluído", description: book?.title, variant: "destructive" });
    setEditorOpen(false);
    setEditingId(null);
  }

  function cycleStatus(id: string, current: BookStatus) {
    const order: BookStatus[] = ["quero_ler", "lendo", "lido", "pausado", "abandonei"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    const patch: Partial<Book> = { status: next };
    if (next === "lido" && !current.includes("lido")) {
      patch.finishDate = todayLocalISO();
      if (!patch.pagesRead && books.find((b) => b.id === id)?.totalPages) {
        patch.pagesRead = books.find((b) => b.id === id)?.totalPages;
      }
    }
    if (next === "lendo" && !current.includes("lendo")) {
      patch.startDate = todayLocalISO();
    }
    updateBook(id, patch);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 shadow-sm" style={{ background: `linear-gradient(135deg, ${page.color ?? "#3f3f46"} 0%, #0a0a0a 100%)`, color: "#fff" }}>
              {page.emoji || "📖"}
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{page.title}</h1>
              <p className="text-[11px] text-muted-foreground">{stats.total} livros · {stats.lidosAno} lidos em {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={sortearLivro} className="bg-purple-600 hover:bg-purple-500 text-white border-0">🎲 Sortear</Button>
          <Button size="sm" onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white border-0">+ Adicionar</Button>
          <FontScaleControl />
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
        </div>
      </header>

      {/* Estatísticas */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 shrink-0">
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          <StatCard label="Lidos (ano)" value={stats.lidosAno} emoji="✅" color="#0891b2" />
          <StatCard label="Lendo" value={stats.lendo} emoji="📖" color="#16a34a" />
          <StatCard label="Quero Ler" value={stats.queroLer} emoji="📚" color="#2563eb" />
          <StatCard label="Páginas" value={stats.totalPaginas} emoji="📄" color="#ca8a04" />
          <StatCard label="🔥 Streak" value={stats.streak.current} hint={`Recorde: ${stats.streak.best}`} emoji="🔥" color="#ea580c" />
          <StatCard label="Tags" value={stats.totalTags} emoji="🏷️" color="#7c3aed" />
          <StatCard label="Total" value={stats.total} emoji="📚" color="#6b7280" />
        </div>

        {stats.tagStats.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stats.tagStats.slice(0, 10).map((ts) => (
              <span key={ts.tag} className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium bg-muted/40 text-muted-foreground" title={`Avaliação média: ${ts.avgRating.toFixed(1)}⭐`}>
                #{ts.tag} <strong className="text-foreground">{ts.count}</strong>
                {ts.avgRating > 0 && <span className="text-amber-400">{ts.avgRating.toFixed(1)}★</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sorteio animado */}
      {(isSpinning || sortedBook) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !isSpinning && setSortedBook(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {isSpinning ? (
              <>
                <div className="text-5xl mb-3 animate-bounce">🎲</div>
                <p className="text-sm text-muted-foreground mb-4 animate-pulse">Sorteando seu próximo livro...</p>
                <div className="relative h-56 mb-4 overflow-hidden rounded-xl bg-muted/20 border-2 border-dashed border-border flex items-center justify-center">
                  {(() => {
                    const queroLer = books.filter((b) => b.status === "quero_ler");
                    const spinBook = queroLer.find((b) => b.title === spinTitle);
                    if (!spinBook) return <p className="text-lg font-bold text-foreground">{spinTitle || "..."}</p>;
                    return (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-28 h-40 rounded-lg overflow-hidden border-2 border-purple-500/50 shadow-xl" style={{ background: spinBook.coverUrl ? undefined : `linear-gradient(135deg, ${spinBook.color} 0%, #0a0a0a 100%)` }}>
                          {spinBook.coverUrl ? (
                            <img src={spinBook.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-center px-2">
                              <span className="text-xs font-bold text-white/90">{spinBook.title.slice(0, 20)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-foreground text-center px-4 truncate max-w-full">{spinBook.title}</p>
                        <p className="text-[10px] text-muted-foreground">{spinBook.author}</p>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : sortedBook ? (
              <>
                <p className="text-xs text-muted-foreground mb-3">🎲 Livro sorteado para você:</p>
                <div className="mx-auto w-32 h-48 rounded-lg overflow-hidden mb-3 border-2 border-purple-500/50 shadow-lg" style={{ background: sortedBook.coverUrl ? undefined : `linear-gradient(135deg, ${sortedBook.color} 0%, #0a0a0a 100%)` }}>
                  {sortedBook.coverUrl ? (
                    <img src={sortedBook.coverUrl} alt={sortedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center px-2">
                      <span className="text-sm font-bold text-white/90">{sortedBook.title}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground">{sortedBook.title}</h3>
                <p className="text-xs text-muted-foreground mb-1">{sortedBook.author}</p>
                {sortedBook.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {sortedBook.tags.map((t) => (
                      <span key={t} className="text-[9px] bg-muted/50 px-1.5 py-0.5 rounded">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => { updateBook(sortedBook.id, { status: "lendo", startDate: new Date().toISOString().slice(0, 10) }); setSortedBook(null); toast({ title: "Boa leitura! 📖", description: sortedBook.title }); }} className="bg-emerald-600 hover:bg-emerald-500 text-white">📖 Começar a ler</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSortedBook(null); sortearLivro(); }}>🎲 Sortear de novo</Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Submenu de navegação (tabs) - Agenda primeiro */}
      <nav className="border-b border-border bg-card px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("agenda")}
            className={cn(
              "px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5",
              view === "agenda" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            📅 Agenda
          </button>
          <button
            onClick={() => setView("acervo")}
            className={cn(
              "px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5",
              view === "acervo" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            📚 Acervo
          </button>
        </div>
      </nav>

      {view === "agenda" ? (
        <ReadingAgenda books={books} onRegisterReading={registrarLeitura} onUpdateBook={updateBook} />
      ) : (
        <>
          {/* Filtros + Busca */}
          <div className="border-b border-border bg-card px-4 sm:px-6 py-2 shrink-0 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("todos")}
              className={cn("h-7 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors", statusFilter === "todos" ? "bg-foreground text-background" : "bg-muted/40 text-muted-foreground hover:text-foreground")}
            >
              📖 Todos
            </button>
            {(["quero_ler", "lendo", "lido", "pausado", "abandonei"] as BookStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn("h-7 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1", statusFilter === s ? "text-white" : "bg-muted/40 text-muted-foreground hover:text-foreground")}
                style={statusFilter === s ? { background: STATUS_COLORS[s] } : undefined}
              >
                {STATUS_EMOJIS[s]} {STATUS_LABELS[s]}
              </button>
            ))}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar livro ou autor..."
              className="h-7 max-w-xs ml-auto text-xs bg-muted/30 border-border"
            />
          </div>

          {/* Grade de livros */}
          <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-5xl mb-3 opacity-40">📚</div>
                <p className="text-sm">Nenhum livro encontrado.</p>
                <Button variant="ghost" size="sm" onClick={openNew} className="mt-2 text-blue-500">+ Adicionar livro</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredBooks.map((book) => {
                  const progress = book.totalPages && book.totalPages > 0 ? Math.min(100, Math.round(((book.pagesRead ?? 0) / book.totalPages) * 100)) : 0;
                  return (
                    <div
                      key={book.id}
                      className="group relative flex flex-col rounded-lg overflow-hidden bg-card border border-border hover:border-foreground/30 transition-all cursor-pointer"
                      onClick={() => openEdit(book.id)}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${book.color} 0%, #0a0a0a 100%)` }}>
                            <span className="text-3xl font-bold text-white/90 text-center px-2 leading-tight">{book.title.slice(0, 20)}</span>
                          </div>
                        )}
                        <div
                          className="absolute top-1.5 left-1.5 h-6 px-1.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 shrink-0"
                          style={{ background: `${STATUS_COLORS[book.status]}dd`, color: "#fff" }}
                          onClick={(e) => { e.stopPropagation(); cycleStatus(book.id, book.status); }}
                          title="Clique para mudar status"
                        >
                          {STATUS_EMOJIS[book.status]}
                        </div>
                        {book.format && (
                          <div className="absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[10px] shrink-0" title={FORMAT_LABELS[book.format]}>
                            {FORMAT_EMOJIS[book.format]}
                          </div>
                        )}
                        {book.rating > 0 && (
                          <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
                            {renderStars(book.rating)}
                          </div>
                        )}
                        {book.status === "lendo" && progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                            <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight">{book.title}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{book.author}</p>
                        {book.status === "lendo" && book.totalPages && (
                          <p className="text-[9px] text-emerald-500 mt-0.5">{book.pagesRead ?? 0}/{book.totalPages} págs · {progress}%</p>
                        )}
                        {book.tags.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {book.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-[8px] bg-muted/50 text-muted-foreground px-1 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Editor */}
      {editorOpen && (
        <BookEditor
          book={editingBook}
          onClose={() => { setEditorOpen(false); setEditingId(null); }}
          onSubmit={handleSubmit}
          onDelete={editingId ? () => handleDelete(editingId) : undefined}
        />
      )}
    </div>
  );
}

// =================== ReadingAgenda (calendário mensal) ===================

type DayEntry = {
  date: string;
  dayNum: number;
  monthName: string;
  pages: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  books: { book: Book; pages: number }[];
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const FULL_MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ReadingAgenda({
  books,
  onRegisterReading,
  onUpdateBook,
}: {
  books: Book[];
  onRegisterReading: (bookId: string, paginas: number, dateIso?: string) => void;
  onUpdateBook: (id: string, patch: Partial<Omit<Book, "id">>) => void;
}) {
  const todayIso = todayLocalISO();
  const todayDate = new Date();
  const [pagesInput, setPagesInput] = useState("");
  const [customDate, setCustomDate] = useState<string>(todayIso);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const lendoLivros = books.filter((b) => b.status === "lendo");

  const calendarDays = useMemo<DayEntry[]>(() => {
    const arr: DayEntry[] = [];
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDay = firstOfMonth.getDay();
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - startDay);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      // USA LOCAL date (não UTC) — corrige bug de leituras à noite
      // cairem no dia seguinte por causa do fuso UTC
      const iso = localDateToISO(d);
      let totalPages = 0;
      const dayBooks: { book: Book; pages: number }[] = [];
      books.forEach((b) => {
        if (b.readingLog && b.readingLog[iso]) {
          totalPages += b.readingLog[iso];
          dayBooks.push({ book: b, pages: b.readingLog[iso] });
        }
      });
      arr.push({
        date: iso,
        dayNum: d.getDate(),
        monthName: FULL_MONTH_LABELS[d.getMonth()].slice(0, 3),
        pages: totalPages,
        isToday: iso === todayIso,
        isCurrentMonth: d.getMonth() === viewMonth,
        books: dayBooks,
      });
    }
    return arr;
  }, [books, todayIso, viewYear, viewMonth]);

  const monthStats = useMemo(() => {
    const monthDays = calendarDays.filter((d) => d.isCurrentMonth);
    const totalPages = monthDays.reduce((acc, d) => acc + d.pages, 0);
    const daysWithReading = monthDays.filter((d) => d.pages > 0).length;
    const uniqueBookIds = new Set<string>();
    monthDays.forEach((d) => d.books.forEach(({ book }) => uniqueBookIds.add(book.id)));
    return { totalPages, daysWithReading, uniqueBooks: uniqueBookIds.size };
  }, [calendarDays]);

  const pagesToday = useMemo(() => {
    let total = 0;
    books.forEach((b) => {
      if (b.readingLog && b.readingLog[todayIso]) total += b.readingLog[todayIso];
    });
    return total;
  }, [books, todayIso]);

  const selectedDay = calendarDays.find((d) => d.date === selectedDate) ?? null;
  const isViewingCurrentMonth = viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth();

  function goPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else { setViewMonth((m) => m - 1); }
  }
  function goNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else { setViewMonth((m) => m + 1); }
  }
  function goToday() {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    setSelectedDate(todayIso);
  }

  function handleRegister(bookId: string) {
    const paginas = parseInt(pagesInput);
    if (!paginas || paginas <= 0) return;
    // Se o usuário escolheu uma data diferente de hoje, registra nessa data
    const useDate = customDate && customDate !== todayIso ? customDate : undefined;
    onRegisterReading(bookId, paginas, useDate);
    setPagesInput("");
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-5">
        {/* Cabeçalho + navegação de mês */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold flex items-center gap-1.5">📅 Agenda de Leitura</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {monthStats.daysWithReading} dias com leitura · {monthStats.totalPages} págs · {monthStats.uniqueBooks} livros neste mês
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={goPrevMonth} className="h-7 w-7 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors" aria-label="Mês anterior">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={goToday} disabled={isViewingCurrentMonth} className={cn("h-7 px-2.5 rounded-md border text-[10px] font-bold transition-colors", isViewingCurrentMonth ? "border-border bg-muted/30 text-muted-foreground/50 cursor-default" : "border-border bg-card hover:bg-accent text-foreground")}>
              Hoje
            </button>
            <button onClick={goNextMonth} className="h-7 w-7 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors" aria-label="Próximo mês">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* Resumo hoje */}
        <div className="bg-gradient-to-br from-blue-500/10 via-card to-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-500/15 flex items-center justify-center text-2xl">📖</div>
          <div className="flex-1">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">Hoje</p>
            <p className="text-lg font-bold text-foreground leading-tight">
              {pagesToday} <span className="text-sm font-normal text-muted-foreground">páginas lidas</span>
            </p>
          </div>
          {lendoLivros.length > 0 && (
            <div className="text-right">
              <p className="text-[10px] uppercase text-muted-foreground font-bold">Em leitura</p>
              <p className="text-lg font-bold text-emerald-500 leading-tight">{lendoLivros.length}</p>
            </div>
          )}
        </div>

        {/* Cabeçalho do mês */}
        <div className="flex items-center justify-between bg-card border border-border rounded-t-lg px-3 py-2">
          <h3 className="text-sm font-bold text-foreground">
            {FULL_MONTH_LABELS[viewMonth]} <span className="text-muted-foreground font-normal">{viewYear}</span>
          </h3>
          <span className="text-[10px] text-muted-foreground">{monthStats.totalPages} págs no mês</span>
        </div>

        {/* Calendário */}
        <div className="bg-card border border-border rounded-b-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted/20">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold uppercase text-muted-foreground py-1.5">{d}</div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[820px]">
              {calendarDays.map((d, idx) => {
                const hasReading = d.books.length > 0;
                const isSelected = d.date === selectedDate;
                const maxCovers = 2;
                const extraCount = Math.max(0, d.books.length - maxCovers);
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={cn(
                      "relative min-h-[140px] sm:min-h-[170px] border-b border-r border-border p-1.5 flex flex-col gap-1 text-left transition-colors",
                      idx % 7 === 6 && "border-r-0",
                      idx >= 35 && "border-b-0",
                      !d.isCurrentMonth && "bg-muted/10",
                      isSelected && "ring-2 ring-inset ring-blue-500",
                      hasReading && d.isCurrentMonth && "bg-emerald-500/5",
                      hasReading && !d.isCurrentMonth && "bg-emerald-500/3"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold leading-none", d.isToday ? "bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center" : d.isCurrentMonth ? "text-foreground" : "text-muted-foreground/40")}>
                        {d.dayNum}
                      </span>
                      {hasReading && <span className="text-[10px] font-bold text-emerald-600/80">{d.pages}p</span>}
                    </div>
                    {hasReading && (
                      <div className="flex flex-wrap gap-1 mt-0.5 content-start flex-1">
                        {d.books.slice(0, maxCovers).map(({ book }) => (
                          <div
                            key={book.id}
                            className="h-20 w-14 rounded shrink-0 overflow-hidden border border-black/10 shadow-sm"
                            style={{ background: book.coverUrl ? undefined : `linear-gradient(135deg, ${book.color} 0%, #0a0a0a 100%)` }}
                            title={`${book.title} · ${d.pages} págs`}
                          >
                            {book.coverUrl ? (
                              <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full px-0.5">
                                <span className="text-[8px] font-bold text-white/90 leading-tight line-clamp-3 text-center">{book.title.slice(0, 12)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <span className="text-[10px] font-bold text-muted-foreground self-center px-1 bg-background/80 rounded">+{extraCount}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detalhes do dia selecionado */}
        {selectedDay && (
          <div className={cn("rounded-lg border p-3 transition-colors", selectedDay.isToday ? "border-blue-500/50 bg-blue-500/5" : selectedDay.books.length > 0 ? "border-border bg-card" : "border-dashed border-border/60 bg-transparent")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-9 w-9 rounded-md flex flex-col items-center justify-center text-[9px] font-bold leading-none", selectedDay.isToday ? "bg-blue-500 text-white" : selectedDay.books.length > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-muted/40 text-muted-foreground")}>
                  <span className="text-[8px] uppercase opacity-80">{selectedDay.monthName}</span>
                  <span className="text-sm">{selectedDay.dayNum}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1">
                    {selectedDay.isToday ? "Hoje" : WEEKDAY_LABELS[new Date(selectedDay.date + "T00:00:00").getDay()]}
                    {selectedDay.isToday && <span className="text-[8px] bg-blue-500 text-white px-1 rounded">HOJE</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedDay.books.length > 0 ? `${selectedDay.pages} págs · ${selectedDay.books.length} ${selectedDay.books.length === 1 ? "livro" : "livros"}` : "Sem leitura registrada"}
                  </p>
                </div>
              </div>
            </div>
            {selectedDay.books.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDay.books.map(({ book, pages }) => (
                  <div key={book.id} className="flex items-center gap-2.5 bg-background border border-border rounded-md p-2 pr-3 hover:border-foreground/30 transition-colors max-w-full">
                    <div className="h-20 w-14 rounded shrink-0 overflow-hidden shadow-sm" style={{ background: book.coverUrl ? undefined : `linear-gradient(135deg, ${book.color} 0%, #0a0a0a 100%)` }}>
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-center px-0.5">
                          <span className="text-[9px] font-bold text-white/85 leading-tight line-clamp-4">{book.title.slice(0, 28)}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-[240px]">{book.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[160px] sm:max-w-[240px]">{book.author}</p>
                      <p className="text-xs text-emerald-500 font-bold mt-0.5">+{pages} págs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Livros em leitura (com input para registrar) */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1.5">
            📖 Em leitura agora
            {lendoLivros.length > 0 && <span className="bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 rounded">{lendoLivros.length}</span>}
          </p>
          {lendoLivros.length > 0 ? (
            lendoLivros.map((book) => {
              const progress = book.totalPages && book.totalPages > 0 ? Math.min(100, Math.round(((book.pagesRead ?? 0) / book.totalPages) * 100)) : 0;
              const remaining = book.totalPages ? Math.max(0, book.totalPages - (book.pagesRead ?? 0)) : 0;
              return (
                <div key={book.id} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="h-28 w-20 rounded-md shrink-0 overflow-hidden shadow-md" style={{ background: book.coverUrl ? undefined : `linear-gradient(135deg, ${book.color} 0%, #0a0a0a 100%)` }}>
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-center px-1">
                          <span className="text-[11px] font-bold text-white/85 leading-tight line-clamp-4">{book.title.slice(0, 30)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{book.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{book.author}</p>
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-sm">
                          <strong className="text-foreground">{book.pagesRead ?? 0}</strong>
                          <span className="text-muted-foreground"> / {book.totalPages ?? "?"} págs</span>
                          <span className="text-emerald-500 font-bold ml-2">{progress}%</span>
                        </p>
                        <p className="text-sm text-amber-500 font-medium">Faltam: <strong>{remaining}</strong> páginas</p>
                        {book.startDate && (
                          <p className="text-[11px] text-muted-foreground/70">
                            desde {new Date(book.startDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2.5">
                    <div className="h-full bg-emerald-500 transition-all flex items-center justify-end pr-2" style={{ width: `${progress}%` }}>
                      {progress > 10 && <span className="text-[10px] font-bold text-white">{progress}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      type="number"
                      value={pagesInput}
                      onChange={(e) => setPagesInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRegister(book.id); }}
                      placeholder="Páginas lidas"
                      className="flex-1 min-w-[100px] h-8 text-sm bg-muted/30 border border-border rounded px-2 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      max={todayIso}
                      className="h-8 text-xs bg-muted/30 border border-border rounded px-1.5 focus:outline-none text-muted-foreground"
                      title="Data da leitura (padrão: hoje)"
                    />
                    <button onClick={() => handleRegister(book.id)} className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium whitespace-nowrap">+ Registrar</button>
                    {book.totalPages && (book.pagesRead ?? 0) >= book.totalPages && (
                      <button onClick={() => onUpdateBook(book.id, { status: "lido", finishDate: todayIso })} className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium whitespace-nowrap">✓ Terminei!</button>
                    )}
                  </div>
                  {customDate !== todayIso && (
                    <p className="text-[10px] text-amber-500 mt-1.5">⚠ Registrando para {customDate.split("-").reverse().join("/")}</p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-card border border-dashed border-border rounded-lg">
              <div className="text-3xl mb-2 opacity-40">📚</div>
              <p className="text-xs text-muted-foreground">Nenhum livro em leitura. Comece a ler um livro para registrar seu progresso diário!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =================== StatCard ===================
function StatCard({ label, value, emoji, color, hint }: { label: string; value: number; emoji: string; color: string; hint?: string }) {
  return (
    <div className="bg-background border border-border rounded-lg p-2 text-center">
      <div className="text-lg font-bold" style={{ color }}>{emoji} {value}</div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      {hint && <div className="text-[8px] text-muted-foreground/70 mt-0.5">{hint}</div>}
    </div>
  );
}

// =================== BookEditor ===================
function BookEditor({
  book,
  onClose,
  onSubmit,
  onDelete,
}: {
  book?: Book | null;
  onClose: () => void;
  onSubmit: (data: Omit<Book, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [coverUrl, setCoverUrl] = useState(book?.coverUrl ?? "");
  const [color, setColor] = useState(book?.color ?? PRESET_COLORS[0]);
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "quero_ler");
  const [rating, setRating] = useState(book?.rating ?? 0);
  const [totalPages, setTotalPages] = useState(book?.totalPages?.toString() ?? "");
  const [pagesRead, setPagesRead] = useState(book?.pagesRead?.toString() ?? "");
  const [startDate, setStartDate] = useState(book?.startDate ?? "");
  const [finishDate, setFinishDate] = useState(book?.finishDate ?? "");
  const [tagsInput, setTagsInput] = useState(book?.tags.join(", ") ?? "");
  const [notes, setNotes] = useState(book?.notes ?? "");
  const [list, setList] = useState(book?.list ?? null);
  const [format, setFormat] = useState<BookFormat>(book?.format ?? "fisico");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Faz upload + redimensiona a imagem da capa (max 400x600px, JPEG 0.85)
  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido (JPG, PNG, WebP).");
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Imagem muito grande (máx 8MB). Escolha um arquivo menor.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 400;
        const MAX_H = 600;
        let { width, height } = img;
        const ratio = Math.min(MAX_W / width, MAX_H / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setCoverUrl(reader.result as string);
          setUploading(false);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCoverUrl(dataUrl);
        setUploading(false);
      };
      img.onerror = () => {
        alert("Não foi possível carregar a imagem. Tente outro arquivo.");
        setUploading(false);
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      alert("Erro ao ler o arquivo.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSubmit({
      title: title.trim(),
      author: author.trim(),
      coverUrl: coverUrl.trim() || undefined,
      color,
      status,
      rating,
      totalPages: totalPages ? parseInt(totalPages) : undefined,
      pagesRead: pagesRead ? parseInt(pagesRead) : undefined,
      startDate: startDate || undefined,
      finishDate: finishDate || undefined,
      tags,
      notes: notes.trim() || undefined,
      list: list || null,
      format,
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? "Editar livro" : "Adicionar livro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Capa do livro: upload + URL + preview */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Capa do livro</label>
            <div className="flex items-start gap-3">
              <div
                className="h-28 w-20 rounded-md shrink-0 overflow-hidden shadow-md border border-border flex items-center justify-center"
                style={{ background: coverUrl ? undefined : `linear-gradient(135deg, ${color} 0%, #0a0a0a 100%)` }}
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-white/70 text-center px-1 leading-tight">
                    {title ? title.slice(0, 24) : "Sem capa"}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <span className="inline-block h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>📤 Subir imagem</>
                    )}
                  </button>
                  {coverUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverUrl("")}
                      className="h-8 px-2 rounded-md bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1"
                    >
                      🗑️ Remover
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <Input
                  value={coverUrl.startsWith("data:") ? "" : coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="...ou cole a URL da capa"
                  className="h-8 text-xs bg-muted/30 border-border"
                />
                <p className="text-[9px] text-muted-foreground/70 leading-tight">
                  Suba uma imagem do seu dispositivo (JPG/PNG, máx 8MB) ou cole uma URL. A imagem é redimensionada automaticamente.
                </p>
              </div>
            </div>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do livro *" autoFocus required className="h-9 bg-muted/30 border-border" />
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor" className="h-9 bg-muted/30 border-border" />

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Status</label>
            <div className="flex flex-wrap gap-1">
              {(["quero_ler", "lendo", "lido", "pausado", "abandonei"] as BookStatus[]).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={cn("h-7 px-2.5 rounded-md text-[10px] font-medium border transition-all flex items-center gap-1", status === s ? "text-white scale-105" : "bg-background text-muted-foreground border-border hover:bg-accent")}
                  style={status === s ? { background: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] } : undefined}
                >
                  {STATUS_EMOJIS[s]} {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Avaliação */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Avaliação</label>
            <div className="flex items-center gap-2">
              {renderStars(rating, (n) => setRating(n === rating ? 0 : n))}
              <button type="button" onClick={() => setRating(0)} className="text-[10px] text-muted-foreground hover:text-foreground">Limpar</button>
            </div>
          </div>

          {/* Páginas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Total de páginas</label>
              <Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="336" className="h-8 text-sm bg-muted/30 border-border" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Páginas lidas</label>
              <Input type="number" value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} placeholder="120" className="h-8 text-sm bg-muted/30 border-border" />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Começou em</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-sm bg-muted/30 border-border" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-bold">Terminou em</label>
              <Input type="date" value={finishDate} onChange={(e) => setFinishDate(e.target.value)} className="h-8 text-sm bg-muted/30 border-border" />
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Formato</label>
            <div className="flex gap-1">
              {(["fisico", "ebook", "audiobook"] as BookFormat[]).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className={cn("h-7 px-2.5 rounded-md text-[10px] font-medium border transition-all flex items-center gap-1", format === f ? "bg-foreground text-background border-foreground scale-105" : "bg-background text-muted-foreground border-border hover:bg-accent")}
                >
                  {FORMAT_EMOJIS[f]} {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Tags/Gêneros (separadas por vírgula)</label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Suspense, Romance, Ficção..." className="h-8 text-sm bg-muted/30 border-border" />
          </div>

          {/* Lista */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Lista</label>
            <div className="flex gap-1">
              <button type="button" onClick={() => setList(null)} className={cn("h-7 px-2.5 rounded-md text-[10px] font-medium border", list === null ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border")}>Nenhuma</button>
              <button type="button" onClick={() => setList("desejo")} className={cn("h-7 px-2.5 rounded-md text-[10px] font-medium border", list === "desejo" ? "bg-pink-600 text-white border-pink-600" : "bg-background text-muted-foreground border-border")}>❤️ Lista de Desejos</button>
              <button type="button" onClick={() => setList("comprado")} className={cn("h-7 px-2.5 rounded-md text-[10px] font-medium border", list === "comprado" ? "bg-emerald-600 text-white border-emerald-600" : "bg-background text-muted-foreground border-border")}>💵 Comprado</button>
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Cor (se sem capa)</label>
            <div className="flex gap-1">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={cn("h-6 w-6 rounded-md border-2", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">Notas / Resenha</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Suas anotações sobre o livro..." rows={3} className="w-full bg-muted/30 border border-border rounded-md p-2 text-sm resize-y" />
          </div>

          <DialogFooter className="gap-2">
            {onDelete && (
              <Button type="button" variant="ghost" onClick={() => { if (confirm("Excluir este livro?")) onDelete(); }} className="text-destructive hover:text-destructive">Excluir</Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!title.trim()} className="bg-blue-600 hover:bg-blue-500 text-white border-0">{book ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
